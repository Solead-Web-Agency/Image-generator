/**
 * API: Rechercher des images sur Unsplash ou Pexels
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

    const { query, library } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    try {
        let results = [];

        if (library === 'unsplash') {
            // Unsplash API
            const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
            
            if (!unsplashKey) {
                return res.status(500).json({ 
                    error: 'Unsplash API key not configured',
                    message: 'Veuillez configurer UNSPLASH_ACCESS_KEY dans votre fichier .env'
                });
            }

            const response = await fetch(
                `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12&orientation=landscape&client_id=${unsplashKey}`
            );

            if (!response.ok) {
                throw new Error(`Unsplash API error: ${response.status}`);
            }

            const data = await response.json();
            
            results = data.results.map(photo => ({
                id: photo.id,
                url: photo.urls.regular,
                thumb: photo.urls.small,
                author: photo.user.name,
                authorUrl: photo.user.links.html,
                downloadUrl: photo.links.download_location,
                description: photo.description || photo.alt_description || 'No description',
                colors: photo.color ? [photo.color] : []
            }));

        } else if (library === 'pexels') {
            // Pexels API
            const pexelsKey = process.env.PEXELS_API_KEY;
            
            if (!pexelsKey) {
                return res.status(500).json({ 
                    error: 'Pexels API key not configured',
                    message: 'Veuillez configurer PEXELS_API_KEY dans votre fichier .env'
                });
            }

            const response = await fetch(
                `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=12&orientation=landscape`,
                {
                    headers: {
                        'Authorization': pexelsKey
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Pexels API error: ${response.status}`);
            }

            const data = await response.json();
            
            results = data.photos.map(photo => ({
                id: photo.id,
                url: photo.src.large,
                thumb: photo.src.medium,
                author: photo.photographer,
                authorUrl: photo.photographer_url,
                downloadUrl: photo.src.original,
                description: photo.alt || 'No description',
                colors: [photo.avg_color]
            }));
        } else {
            return res.status(400).json({ error: 'Invalid library. Use "unsplash" or "pexels"' });
        }

        return res.status(200).json({
            success: true,
            library,
            query,
            results,
            total: results.length
        });

    } catch (error) {
        console.error('Library search error:', error);
        return res.status(500).json({
            error: error.message || 'Error searching images'
        });
    }
};
