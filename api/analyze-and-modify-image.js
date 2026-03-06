/**
 * API: ÉDITER une image existante avec GPT-Image-1 (ou DALL-E 2 en fallback)
 * GPT-Image-1 est bien plus capable pour des modifications complexes (changer une personne, etc.)
 */

const fetch = require('node-fetch');
const FormData = require('form-data');
const sharp = require('sharp');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { imageUrl, modificationPrompt, apiKey } = req.body;

    if (!imageUrl || !modificationPrompt) {
        return res.status(400).json({ error: 'imageUrl et modificationPrompt requis' });
    }

    const openaiKey = apiKey || process.env.OPENAI_API_KEY;
    if (!openaiKey) return res.status(400).json({ error: 'Clé API OpenAI manquante' });

    try {
        let originalBuffer;

        if (imageUrl.startsWith('data:')) {
            // Data URL base64 → buffer directement
            const base64Data = imageUrl.split(',')[1];
            if (!base64Data) throw new Error('Data URL invalide');
            originalBuffer = Buffer.from(base64Data, 'base64');
            console.log('✅ Decoded base64 data URL:', originalBuffer.length, 'bytes');
        } else {
            // URL HTTP → décoder entités HTML et fetcher
            const cleanUrl = imageUrl
                .replace(/&amp;/g, '&').replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>').replace(/&quot;/g, '"');

            console.log('🖼️ Downloading image:', cleanUrl);
            const imageResponse = await fetch(cleanUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            if (!imageResponse.ok) throw new Error(`Failed to download image: ${imageResponse.status}`);
            originalBuffer = await imageResponse.buffer();
            console.log('✅ Downloaded:', originalBuffer.length, 'bytes');
        }

        // Convertir en PNG 1024×1024 (GPT-Image-1 accepte JPEG/PNG, max 25MB)
        let pngBuffer = await sharp(originalBuffer)
            .resize(1024, 1024, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 255 } })
            .png({ compressionLevel: 7 })
            .toBuffer();

        console.log('🔄 Converted to PNG 1024×1024:', pngBuffer.length, 'bytes');

        // Essayer GPT-Image-1 en premier (bien plus capable), fallback DALL-E 2
        let newImageUrl = null;
        let usedModel = 'gpt-image-1';

        const tryEdit = async (model, extraFields = {}) => {
            const formData = new FormData();
            formData.append('image', pngBuffer, { filename: 'image.png', contentType: 'image/png' });
            formData.append('model', model);
            formData.append('prompt', modificationPrompt);
            formData.append('n', '1');
            Object.entries(extraFields).forEach(([k, v]) => formData.append(k, v));

            const r = await fetch('https://api.openai.com/v1/images/edits', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${openaiKey}`, ...formData.getHeaders() },
                body: formData
            });
            const d = await r.json();
            if (!r.ok) throw new Error(d.error?.message || JSON.stringify(d.error) || `API error ${r.status}`);
            return d;
        };

        try {
            console.log('🎨 Trying GPT-Image-1 edit...');
            const d = await tryEdit('gpt-image-1');
            // GPT-Image-1 retourne b64_json ou url selon response_format
            if (d.data[0].b64_json) {
                newImageUrl = `data:image/png;base64,${d.data[0].b64_json}`;
            } else {
                newImageUrl = d.data[0].url;
            }
            usedModel = 'gpt-image-1';
            console.log('✅ GPT-Image-1 edit success');
        } catch (gptErr) {
            console.warn('⚠️ GPT-Image-1 failed, trying DALL-E 2:', gptErr.message);
            // DALL-E 2 requiert RGBA pour le mask
            pngBuffer = await sharp(originalBuffer)
                .resize(1024, 1024, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
                .ensureAlpha()
                .png({ compressionLevel: 9 })
                .toBuffer();
            const d = await tryEdit('dall-e-2', { size: '1024x1024' });
            newImageUrl = d.data[0].url;
            usedModel = 'dall-e-2';
            console.log('✅ DALL-E 2 edit success (fallback)');
        }

        return res.status(200).json({
            success: true,
            originalImageUrl: imageUrl,
            newImageUrl,
            modificationPrompt,
            model: usedModel
        });

    } catch (error) {
        console.error('❌ Error editing image:', error);
        return res.status(500).json({ error: `Failed to edit image: ${error.message}` });
    }
};
