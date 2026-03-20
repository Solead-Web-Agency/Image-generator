// API Route Vercel - Sauvegarde des images
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// En environnement serverless (Vercel), le filesystem est en lecture seule.
// On ne peut écrire que dans /tmp, mais ces fichiers ne sont pas accessibles via HTTP.
// On détecte cet environnement et on retourne l'URL directement sans écriture disque.
const IS_SERVERLESS = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.FUNCTION_NAME);

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

        // Construire le nom de fichier (utile dans les deux cas)
        const now = new Date();
        const dateFolder = now.toISOString().split('T')[0];
        const timestamp = now.getTime();
        const styleName = metadata?.style || 'unknown';
        const subject = metadata?.subject || 'image';

        const cleanStyle = styleName
            .substring(0, 30)
            .replace(/[^a-z0-9-_]/gi, '-')
            .replace(/-+/g, '-')
            .toLowerCase();

        const cleanSubject = subject
            .substring(0, 50)
            .replace(/[^a-z0-9-_]/gi, '-')
            .replace(/-+/g, '-')
            .toLowerCase();

        const filename = `${timestamp}-${cleanStyle}-${cleanSubject}.png`;

        // ── Mode serverless (Vercel) ──────────────────────────────────────────
        // Pas d'accès disque persistant : on retourne l'URL directement.
        if (IS_SERVERLESS) {
            console.log('☁️  Mode serverless détecté — pas d\'écriture disque, retour de l\'URL directe');
            return res.status(200).json({
                success: true,
                path: imageUrl,   // L'URL OpenAI ou le base64 sert de "path"
                filename,
                serverless: true
            });
        }

        // ── Mode local (Node.js classique) ───────────────────────────────────
        console.log('📥 Téléchargement de l\'image...');
        let imageBuffer;

        if (imageUrl.startsWith('data:')) {
            const base64Data = imageUrl.split(',')[1];
            if (!base64Data) throw new Error('Data URL invalide');
            imageBuffer = Buffer.from(base64Data, 'base64');
            console.log('✅ Décodé depuis base64:', imageBuffer.length, 'bytes');
        } else {
            const imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) {
                throw new Error(`Impossible de télécharger l'image: ${imageResponse.status}`);
            }
            imageBuffer = await imageResponse.buffer();
        }

        const relativePath = `${dateFolder}/${filename}`;
        const publicDir = path.join(process.cwd(), 'public', 'generated-images', dateFolder);
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        }

        const fullPath = path.join(publicDir, filename);
        fs.writeFileSync(fullPath, imageBuffer);
        console.log('✅ Image sauvegardée:', relativePath);

        const metadataFilePath = path.join(publicDir, `${timestamp}-metadata.json`);
        fs.writeFileSync(metadataFilePath, JSON.stringify({
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
