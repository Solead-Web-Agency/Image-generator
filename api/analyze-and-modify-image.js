/**
 * API: Analyser une image avec GPT-4 Vision et générer une version modifiée avec DALL-E
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

    const { imageUrl, modificationPrompt, style } = req.body;

    if (!imageUrl || !modificationPrompt) {
        return res.status(400).json({ error: 'imageUrl et modificationPrompt requis' });
    }

    try {
        console.log('🔍 Analyzing image:', imageUrl);
        
        // Étape 1: Analyser l'image avec GPT-4 Vision
        const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [{
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `Analyse cette image en détail. Décris :
1. Le sujet principal (objets, personnes, scène)
2. Les couleurs dominantes
3. Le style et l'ambiance
4. La composition et le cadrage
5. Les éléments importants à conserver

Sois précis et descriptif pour permettre de recréer l'image.`
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: imageUrl
                            }
                        }
                    ]
                }],
                max_tokens: 500
            })
        });

        if (!visionResponse.ok) {
            const errorData = await visionResponse.text();
            throw new Error(`Vision API error: ${visionResponse.status} - ${errorData}`);
        }

        const visionData = await visionResponse.json();
        const imageDescription = visionData.choices[0].message.content;
        
        console.log('📝 Image analyzed:', imageDescription.substring(0, 100) + '...');
        
        // Étape 2: Construire le prompt pour DALL-E
        const styleDescription = style?.aesthetic || 'moderne et professionnel';
        const colorPalette = style?.colorPalette || [];
        const colorDesc = colorPalette.length > 0 
            ? `Palette de couleurs : ${colorPalette.join(', ')}`
            : '';
        
        const dallePrompt = `Based on this image description: "${imageDescription}"

Apply these modifications: ${modificationPrompt}

Style to maintain: ${styleDescription}
${colorDesc}

Create a high-quality image that preserves the core elements but applies the requested modifications while matching the specified visual style.`;

        console.log('🎨 Generating modified image with DALL-E...');
        
        // Étape 3: Générer la nouvelle image avec DALL-E
        const dalleResponse = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'dall-e-3',
                prompt: dallePrompt.substring(0, 4000),
                n: 1,
                size: '1024x1024',
                quality: 'standard'
            })
        });

        if (!dalleResponse.ok) {
            const errorData = await dalleResponse.text();
            throw new Error(`DALL-E API error: ${dalleResponse.status} - ${errorData}`);
        }

        const dalleData = await dalleResponse.json();
        const newImageUrl = dalleData.data[0].url;
        const revisedPrompt = dalleData.data[0].revised_prompt;
        
        console.log('✅ Modified image generated successfully');

        return res.status(200).json({
            success: true,
            originalImageUrl: imageUrl,
            newImageUrl: newImageUrl,
            imageDescription: imageDescription,
            dallePrompt: dallePrompt,
            revisedPrompt: revisedPrompt
        });

    } catch (error) {
        console.error('❌ Error analyzing/modifying image:', error);
        return res.status(500).json({ 
            error: `Failed to modify image: ${error.message}` 
        });
    }
};
