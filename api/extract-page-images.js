/**
 * API: Extraire toutes les images d'une page web
 */

const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        console.log('🖼️ Extracting images from:', url);
        
        // Fetch le HTML du site
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.status}`);
        }

        const html = await response.text();
        
        console.log('📄 HTML fetched, extracting images...');

        // Extraire les images depuis le HTML
        const images = extractImagesFromHTML(html, url);
        
        console.log(`✅ Found ${images.length} images`);

        return res.status(200).json({
            success: true,
            url: url,
            images: images,
            count: images.length
        });

    } catch (error) {
        console.error('❌ Error extracting images:', error);
        return res.status(500).json({ 
            error: `Failed to extract images: ${error.message}` 
        });
    }
};

/**
 * Extrait toutes les images depuis le HTML
 */
function extractImagesFromHTML(html, baseUrl) {
    const images = [];
    const seenUrls = new Set();
    const seenBaseUrls = new Set(); // Pour détecter les doublons avec params différents
    
    console.log('🔍 Starting image extraction...');
    
    // 1. Regex pour trouver les balises img avec src
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let match;
    let srcCount = 0;
    
    while ((match = imgRegex.exec(html)) !== null) {
        let imgUrl = match[1];
        
        // Convertir les URLs relatives en absolues
        imgUrl = resolveUrl(imgUrl, baseUrl);
        
        // Nettoyer l'URL pour détecter les doublons
        const baseImgUrl = getBaseImageUrl(imgUrl);
        
        // Vérifier validité et déduplication
        if (isValidImageUrl(imgUrl) && !seenUrls.has(imgUrl) && !seenBaseUrls.has(baseImgUrl)) {
            seenUrls.add(imgUrl);
            seenBaseUrls.add(baseImgUrl);
            srcCount++;
            
            // Extraire alt text si disponible
            const altMatch = match[0].match(/alt=["']([^"']*)["']/i);
            const alt = altMatch ? altMatch[1] : '';
            
            // Extraire dimensions si disponibles
            const widthMatch = match[0].match(/width=["']?(\d+)["']?/i);
            const heightMatch = match[0].match(/height=["']?(\d+)["']?/i);
            
            images.push({
                url: imgUrl,
                alt: alt,
                width: widthMatch ? parseInt(widthMatch[1]) : null,
                height: heightMatch ? parseInt(heightMatch[1]) : null
            });
        }
    }
    
    console.log(`   Found ${srcCount} images from src attributes`);
    
    // 2. Extraire srcset (images responsive)
    const srcsetRegex = /<img[^>]+srcset=["']([^"']+)["'][^>]*>/gi;
    let srcsetCount = 0;
    
    while ((match = srcsetRegex.exec(html)) !== null) {
        const srcsetValue = match[1];
        // srcset format: "url1 1x, url2 2x" ou "url1 400w, url2 800w"
        const urls = srcsetValue.split(',').map(s => s.trim().split(' ')[0]);
        
        urls.forEach(imgUrl => {
            imgUrl = resolveUrl(imgUrl, baseUrl);
            const baseImgUrl = getBaseImageUrl(imgUrl);
            
            if (isValidImageUrl(imgUrl) && !seenUrls.has(imgUrl) && !seenBaseUrls.has(baseImgUrl)) {
                seenUrls.add(imgUrl);
                seenBaseUrls.add(baseImgUrl);
                srcsetCount++;
                
                images.push({
                    url: imgUrl,
                    alt: 'Image from srcset',
                    width: null,
                    height: null
                });
            }
        });
    }
    
    console.log(`   Found ${srcsetCount} images from srcset attributes`);
    
    // 3. Chercher dans les background-image CSS
    const bgRegex = /background-image:\s*url\(["']?([^"')]+)["']?\)/gi;
    let bgCount = 0;
    
    while ((match = bgRegex.exec(html)) !== null) {
        let imgUrl = resolveUrl(match[1], baseUrl);
        const baseImgUrl = getBaseImageUrl(imgUrl);
        
        if (isValidImageUrl(imgUrl) && !seenUrls.has(imgUrl) && !seenBaseUrls.has(baseImgUrl)) {
            seenUrls.add(imgUrl);
            seenBaseUrls.add(baseImgUrl);
            bgCount++;
            images.push({
                url: imgUrl,
                alt: 'Background image',
                width: null,
                height: null
            });
        }
    }
    
    console.log(`   Found ${bgCount} images from CSS backgrounds`);
    
    // 4. Filtrer les images trop petites (seuil réduit à 50x50)
    const filteredImages = images.filter(img => {
        if (img.width && img.height) {
            return img.width >= 50 && img.height >= 50;
        }
        return true; // Garder si dimensions inconnues
    });
    
    console.log(`   Total: ${images.length} images, after filter: ${filteredImages.length}`);
    
    return filteredImages;
}

/**
 * Résout une URL relative en absolue
 */
function resolveUrl(imgUrl, baseUrl) {
    try {
        // Si URL déjà absolue
        if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
            return imgUrl;
        }
        
        // Si URL relative
        const base = new URL(baseUrl);
        
        if (imgUrl.startsWith('//')) {
            return base.protocol + imgUrl;
        }
        
        if (imgUrl.startsWith('/')) {
            return base.origin + imgUrl;
        }
        
        // URL relative au path actuel
        return new URL(imgUrl, baseUrl).href;
    } catch (e) {
        return imgUrl;
    }
}

/**
 * Vérifie si l'URL est une image valide
 */
function isValidImageUrl(url) {
    if (!url) return false;
    
    // Extensions d'images courantes
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.avif'];
    const lowerUrl = url.toLowerCase();
    
    // Vérifier l'extension
    const hasImageExtension = imageExtensions.some(ext => lowerUrl.includes(ext));
    
    // Si pas d'extension connue, refuser
    if (!hasImageExtension) return false;
    
    // Filtrer UNIQUEMENT les patterns très spécifiques (plus restrictif qu'avant)
    const ignoredPatterns = [
        'favicon.', // Favicon spécifique
        '/favicon', // Chemin favicon
        'data:image', // Data URLs
        '1x1.', // Tracking pixels
        'pixel.gif', // Tracking pixels
        'spacer.gif', // Spacers
        'blank.gif' // Images vides
    ];
    
    const shouldIgnore = ignoredPatterns.some(pattern => 
        lowerUrl.includes(pattern)
    );
    
    return !shouldIgnore;
}

/**
 * Nettoie une URL pour détecter les doublons
 * Retire les query params de redimensionnement mais garde l'URL de base
 */
function getBaseImageUrl(url) {
    try {
        const urlObj = new URL(url);
        // Retirer les query params courants de redimensionnement
        const paramsToRemove = ['w', 'h', 'width', 'height', 'size', 'resize', 'fit', 'crop', 'quality', 'q', 'format', 'fm'];
        
        paramsToRemove.forEach(param => {
            urlObj.searchParams.delete(param);
        });
        
        // Retourner URL sans les params de redimensionnement
        return urlObj.origin + urlObj.pathname + (urlObj.search || '');
    } catch (e) {
        return url;
    }
}
