// API Route Vercel - Sauvegarde des images
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

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
        const { imageUrl, metadata } = req.body;

        if (!imageUrl) {
            return res.status(400).json({ error: 'URL de l\'image requise' });
        }

        // Créer le nom de fichier
        const now = new Date();
        const dateFolder = now.toISOString().split('T')[0];
        const timestamp = now.getTime();
        const styleName = metadata?.style || 'unknown';
        const subject = metadata?.subject || 'image';
        
        const cleanSubject = subject
            .substring(0, 50)
            .replace(/[^a-z0-9-_]/gi, '-')
            .replace(/-+/g, '-')
            .toLowerCase();
        
        const filename = `${timestamp}-${styleName}-${cleanSubject}.png`;
        const relativePath = `${dateFolder}/${filename}`;

        // Télécharger l'image depuis OpenAI
        console.log('📥 Téléchargement de l\'image...');
        const imageResponse = await fetch(imageUrl);
        
        if (!imageResponse.ok) {
            throw new Error('Impossible de télécharger l\'image depuis OpenAI');
        }

        const imageBuffer = await imageResponse.buffer();

        // Créer le dossier si nécessaire
        const publicDir = path.join(process.cwd(), 'public', 'generated-images', dateFolder);
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        }

        // Sauvegarder l'image
        const fullPath = path.join(publicDir, filename);
        fs.writeFileSync(fullPath, imageBuffer);

        console.log('✅ Image sauvegardée:', relativePath);

        // Sauvegarder les métadonnées
        const metadataPath = path.join(publicDir, `${timestamp}-metadata.json`);
        fs.writeFileSync(metadataPath, JSON.stringify({
            filename,
            ...metadata,
            savedAt: now.toISOString(),
            originalUrl: imageUrl
        }, null, 2));

        return res.status(200).json({
            success: true,
            path: `/generated-images/${relativePath}`,
            filename
        });

    } catch (error) {
        console.error('💥 Erreur sauvegarde:', error);
        return res.status(500).json({
            error: error.message || 'Erreur lors de la sauvegarde'
        });
    }
};
