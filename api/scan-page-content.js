/**
 * API endpoint pour scanner le contenu d'une page web
 * Contourne les problèmes CORS en faisant le fetch côté serveur
 */

const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL est requise' });
    }

    try {
        console.log(`📄 [scan-page-content] Fetching: ${url}`);

        // Fetch the HTML content from the URL
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000 // 10 secondes timeout
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const html = await response.text();

        console.log(`✅ [scan-page-content] HTML fetched: ${html.length} characters`);

        return res.status(200).json({
            success: true,
            html: html,
            url: url
        });

    } catch (error) {
        console.error('❌ [scan-page-content] Error:', error);
        return res.status(500).json({
            error: 'Impossible de récupérer le contenu de cette page',
            details: error.message
        });
    }
};
