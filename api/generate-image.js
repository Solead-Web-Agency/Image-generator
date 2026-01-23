// API Route Vercel - Génération d'images avec DALL-E
const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // CORS headers
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

    try {
        const { prompt, model = 'dall-e-3', size = '1024x1024', quality = 'standard' } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt requis' });
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'Clé API OpenAI non configurée' });
        }

        console.log('🎨 Génération image:', { model, size, quality, promptLength: prompt.length });

        // Appel à l'API OpenAI
        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                prompt: prompt.substring(0, 4000), // Limiter la longueur
                n: 1,
                size,
                ...(model === 'dall-e-3' && { quality })
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Erreur OpenAI:', data);
            return res.status(response.status).json({
                error: data.error?.message || 'Erreur lors de la génération'
            });
        }

        console.log('✅ Image générée avec succès');

        return res.status(200).json({
            success: true,
            imageUrl: data.data[0].url,
            revisedPrompt: data.data[0].revised_prompt
        });

    } catch (error) {
        console.error('💥 Erreur serveur:', error);
        return res.status(500).json({
            error: error.message || 'Erreur interne du serveur'
        });
    }
};
