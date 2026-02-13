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
    
    // Regex pour trouver les balises img avec src
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let match;
    
    while ((match = imgRegex.exec(html)) !== null) {
        let imgUrl = match[1];
        
        // Convertir les URLs relatives en absolues
        imgUrl = resolveUrl(imgUrl, baseUrl);
        
        // Filtrer les images trop petites ou les icônes
        if (isValidImageUrl(imgUrl) && !seenUrls.has(imgUrl)) {
            seenUrls.add(imgUrl);
            
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
    
    // Aussi chercher dans les background-image CSS
    const bgRegex = /background-image:\s*url\(["']?([^"')]+)["']?\)/gi;
    while ((match = bgRegex.exec(html)) !== null) {
        let imgUrl = resolveUrl(match[1], baseUrl);
        
        if (isValidImageUrl(imgUrl) && !seenUrls.has(imgUrl)) {
            seenUrls.add(imgUrl);
            images.push({
                url: imgUrl,
                alt: 'Background image',
                width: null,
                height: null
            });
        }
    }
    
    // Filtrer les images trop petites (probablement des icônes/logos)
    return images.filter(img => {
        if (img.width && img.height) {
            return img.width >= 100 && img.height >= 100;
        }
        return true; // Garder si dimensions inconnues
    });
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
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    const lowerUrl = url.toLowerCase();
    
    // Vérifier l'extension
    const hasImageExtension = imageExtensions.some(ext => lowerUrl.includes(ext));
    
    // Filtrer les images courantes à ignorer
    const ignoredPatterns = [
        'icon', 'favicon', 'logo', 'sprite', 'placeholder',
        'data:image', // Data URLs (souvent trop petites)
        '1x1', // Tracking pixels
        'pixel.gif'
    ];
    
    const shouldIgnore = ignoredPatterns.some(pattern => 
        lowerUrl.includes(pattern)
    );
    
    return hasImageExtension && !shouldIgnore;
}
