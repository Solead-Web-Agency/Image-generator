/**
 * API: Extraire toutes les images d'une page web avec leurs dimensions réelles
 */

const fetch = require('node-fetch');
const sharp = require('sharp');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        console.log('🖼️ Extracting images from:', url);
        
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            timeout: 10000
        });

        if (!response.ok) throw new Error(`Failed to fetch URL: ${response.status}`);
        const html = await response.text();

        // 1. Parser toutes les balises <img> du HTML
        const rawImages = parseImgTags(html, url);
        console.log(`📄 Found ${rawImages.length} raw img tags`);

        // 2. Récupérer les dimensions réelles (en parallèle, max 8 à la fois)
        const images = await fetchDimensionsInParallel(rawImages, 8);

        // 3. Filtrer les tracking pixels / icônes minuscules, trier par taille décroissante
        const filtered = images
            .filter(img => {
                // Exclure seulement les tout petits (tracking pixels, icônes 16px...)
                if (img.width && img.height) return img.width >= 30 && img.height >= 30;
                return true;
            })
            .sort((a, b) => {
                const aSize = (a.width || 0) * (a.height || 0);
                const bSize = (b.width || 0) * (b.height || 0);
                return bSize - aSize; // Plus grandes en premier
            });

        console.log(`✅ ${filtered.length} images after filter (from ${images.length})`);

        return res.status(200).json({
            success: true,
            url,
            images: filtered,
            count: filtered.length
        });

    } catch (error) {
        console.error('❌ Error extracting images:', error);
        return res.status(500).json({ error: `Failed to extract images: ${error.message}` });
    }
};

/**
 * Parse toutes les balises <img> du HTML
 * Approche robuste : extrait chaque attribut individuellement
 */
function parseImgTags(html, baseUrl) {
    const seenExact   = new Set();
    const seenBase    = new Set();
    const images      = [];

    // Séparer le HTML en tokens par balise <img ... >
    // Utiliser une regex simple qui capture jusqu'au prochain >
    // mais tolère les tags avec des espaces/sauts de ligne
    const imgTagRegex = /<img\s([^]*?)(?:\s*\/?>)/gi;
    let match;

    while ((match = imgTagRegex.exec(html)) !== null) {
        const attrs = match[1];

        // Candidats URL par ordre de priorité
        const candidates = [
            getAttr(attrs, 'src'),
            getAttr(attrs, 'data-src'),
            getAttr(attrs, 'data-lazy-src'),
            getAttr(attrs, 'data-original'),
            getAttr(attrs, 'data-lazy'),
            getAttr(attrs, 'data-url'),
        ].filter(u => u && !u.startsWith('data:') && u.length > 5);

        // Srcset → prendre meilleure résolution
        const srcset = getAttr(attrs, 'srcset') || getAttr(attrs, 'data-srcset');
        if (srcset) {
            const best = getBestSrcset(srcset);
            if (best) candidates.unshift(best);
        }

        const rawUrl = candidates[0];
        if (!rawUrl) continue;

        // Décoder les entités HTML (&amp; → &, &lt; → <, etc.)
        const decodedUrl = rawUrl.trim()
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");

        const url = resolveUrl(decodedUrl, baseUrl);
        if (!isValidImageUrl(url)) continue;

        // Dédoublonnage URL exacte
        if (seenExact.has(url)) continue;
        seenExact.add(url);

        // Dédoublonnage par base URL (images identiques avec params différents)
        const base = getBaseImageUrl(url);
        if (seenBase.has(base)) continue;
        seenBase.add(base);

        const htmlWidth  = parseInt(getAttr(attrs, 'width'))  || null;
        const htmlHeight = parseInt(getAttr(attrs, 'height')) || null;
        const alt        = getAttr(attrs, 'alt') || '';
        const loading    = getAttr(attrs, 'loading') || 'auto';

        images.push({ url, alt, loading, htmlWidth, htmlHeight, width: htmlWidth, height: htmlHeight });
    }

    console.log(`   Parsed ${images.length} unique img tags`);

    // ── 2. Balises <source> (picture element, Next.js, etc.)
    const sourceRegex = /<source\s([^]*?)(?:\s*\/?>)/gi;
    while ((match = sourceRegex.exec(html)) !== null) {
        const attrs = match[1];
        const srcset = getAttr(attrs, 'srcset') || getAttr(attrs, 'data-srcset');
        if (!srcset) continue;

        srcset.split(',').forEach(entry => {
            const rawUrl = entry.trim().split(/\s+/)[0];
            if (!rawUrl) return;
            const decoded = rawUrl.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
            const url = resolveUrl(decoded, baseUrl);
            if (!isValidImageUrl(url)) return;
            const base = getBaseImageUrl(url);
            if (seenExact.has(url) || seenBase.has(base)) return;
            seenExact.add(url);
            seenBase.add(base);
            images.push({ url, alt: '', loading: 'auto', htmlWidth: null, htmlHeight: null, width: null, height: null });
        });
    }

    // ── 3. JSON inline (Next.js __NEXT_DATA__, Nuxt data, etc.)
    const jsonMatches = html.match(/"url"\s*:\s*"([^"]+\.(?:jpg|jpeg|png|webp|avif|gif)[^"]*)"/gi) || [];
    jsonMatches.forEach(m => {
        const raw = m.replace(/^"url"\s*:\s*"/, '').replace(/"$/, '');
        const decoded = raw.replace(/\\u002F/g, '/').replace(/\\\//g, '/').replace(/&amp;/g, '&');
        const url = resolveUrl(decoded, baseUrl);
        if (!isValidImageUrl(url)) return;
        const base = getBaseImageUrl(url);
        if (seenExact.has(url) || seenBase.has(base)) return;
        seenExact.add(url);
        seenBase.add(base);
        images.push({ url, alt: '', loading: 'auto', htmlWidth: null, htmlHeight: null, width: null, height: null });
    });

    // ── 4. CSS background-image
    const bgRegex = /background-image:\s*url\(["']?([^"')]+)["']?\)/gi;
    while ((match = bgRegex.exec(html)) !== null) {
        const decoded = match[1].replace(/&amp;/g, '&').trim();
        const url = resolveUrl(decoded, baseUrl);
        if (!isValidImageUrl(url)) return;
        const base = getBaseImageUrl(url);
        if (seenExact.has(url) || seenBase.has(base)) return;
        seenExact.add(url);
        seenBase.add(base);
        images.push({ url, alt: 'background', loading: 'auto', htmlWidth: null, htmlHeight: null, width: null, height: null });
    }

    console.log(`   Total after all sources: ${images.length} images`);
    return images;
}

/**
 * Lit la valeur d'un attribut depuis un string d'attributs HTML
 * Gère les guillemets simples, doubles, et sans guillemets
 */
function getAttr(attrs, name) {
    // Double quotes
    let re = new RegExp(`(?:^|\\s)${name}\\s*=\\s*"([^"]*)"`, 'i');
    let m  = re.exec(attrs);
    if (m) return m[1].trim() || null;

    // Simple quotes
    re = new RegExp(`(?:^|\\s)${name}\\s*=\\s*'([^']*)'`, 'i');
    m  = re.exec(attrs);
    if (m) return m[1].trim() || null;

    // Sans guillemets
    re = new RegExp(`(?:^|\\s)${name}\\s*=\\s*([^\\s"'>]+)`, 'i');
    m  = re.exec(attrs);
    if (m) return m[1].trim() || null;

    return null;
}

/**
 * Récupère la valeur d'un attribut HTML depuis un string d'attributs
 */
/**
 * Récupère la plus grande URL depuis un srcset
 */
function getBestSrcset(srcset) {
    try {
        const entries = srcset.split(',').map(s => {
            const parts = s.trim().split(/\s+/);
            const url = parts[0];
            const descriptor = parts[1] || '1x';
            const value = parseFloat(descriptor) || 1;
            return { url, value };
        });
        // Trier par valeur décroissante et prendre la première
        entries.sort((a, b) => b.value - a.value);
        return entries[0]?.url || null;
    } catch {
        return null;
    }
}

/**
 * Récupère les dimensions réelles de chaque image (en parallèle par batch)
 */
async function fetchDimensionsInParallel(images, concurrency = 8) {
    const results = [...images];

    // Ne fetch que les images sans dimensions HTML
    const needsDimensions = results
        .map((img, idx) => ({ img, idx }))
        .filter(({ img }) => !img.htmlWidth || !img.htmlHeight);

    console.log(`🔍 Fetching dimensions for ${needsDimensions.length} images...`);

    // Traitement par batch
    for (let i = 0; i < needsDimensions.length; i += concurrency) {
        const batch = needsDimensions.slice(i, i + concurrency);
        await Promise.all(batch.map(async ({ img, idx }) => {
            try {
                const dims = await getImageDimensions(img.url);
                if (dims) {
                    results[idx].width  = dims.width;
                    results[idx].height = dims.height;
                }
            } catch {
                // Garder les dimensions nulles si erreur
            }
        }));
    }

    return results;
}

/**
 * Récupère les dimensions d'une image via sharp (lit seulement les métadonnées)
 */
async function getImageDimensions(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
        const resp = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: controller.signal
        });
        if (!resp.ok) return null;

        const buffer = await resp.buffer();
        const meta = await sharp(buffer).metadata();
        return { width: meta.width || null, height: meta.height || null };
    } catch {
        return null;
    } finally {
        clearTimeout(timeout);
    }
}

function resolveUrl(imgUrl, baseUrl) {
    try {
        if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) return imgUrl;
        const base = new URL(baseUrl);
        if (imgUrl.startsWith('//')) return base.protocol + imgUrl;
        if (imgUrl.startsWith('/')) return base.origin + imgUrl;
        return new URL(imgUrl, baseUrl).href;
    } catch {
        return imgUrl;
    }
}

function isValidImageUrl(url) {
    if (!url || url.startsWith('data:')) return false;
    const lower = url.toLowerCase();
    const exts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.avif'];
    const ignored = ['favicon.', '/favicon', '1x1.', 'pixel.gif', 'spacer.gif', 'blank.gif'];
    if (ignored.some(p => lower.includes(p))) return false;
    // Accepter si extension connue OU si URL type CDN image
    return exts.some(e => lower.includes(e)) || /\/(image|img|photo|media|upload)s?\//i.test(url);
}

function getBaseImageUrl(url) {
    try {
        const u = new URL(url);
        ['w','h','width','height','size','resize','fit','crop','quality','q','format','fm'].forEach(p => u.searchParams.delete(p));
        return u.origin + u.pathname + (u.search || '');
    } catch {
        return url;
    }
}
