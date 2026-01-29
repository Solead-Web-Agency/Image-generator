// API Route - Vérifier si les clés API sont configurées côté serveur
module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Vérifier quelles clés sont configurées
    const config = {
        openai: !!process.env.OPENAI_API_KEY,
        unsplash: !!process.env.UNSPLASH_ACCESS_KEY,
        pexels: !!process.env.PEXELS_API_KEY
    };

    return res.status(200).json({
        success: true,
        configured: config,
        message: config.openai 
            ? 'Clés API configurées sur le serveur' 
            : 'Configuration requise'
    });
};
