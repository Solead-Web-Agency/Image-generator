/**
 * API: Analyser le style d'images provenant de bibliothèques (Unsplash/Pexels)
 * Utilise GPT-4 Vision pour analyser l'esthétique des images sélectionnées
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

    const { imageUrls } = req.body;

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
        return res.status(400).json({ error: 'At least one image URL is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ 
            error: 'OpenAI API key not configured',
            message: 'Veuillez configurer OPENAI_API_KEY dans votre fichier .env'
        });
    }

    try {
        console.log(`🎨 Analyzing ${imageUrls.length} images with GPT-4 Vision...`);

        // Construire le contenu pour GPT-4 Vision avec les images
        const content = [
            {
                type: 'text',
                text: `Analyze the visual style of these ${imageUrls.length} image(s). Extract and describe:
1. Overall aesthetic and design style
2. Color palette (list main colors)
3. Mood and atmosphere
4. Visual composition and layout style
5. Artistic direction

Return ONLY a JSON object with this exact structure:
{
  "aesthetic": "brief description of the overall style",
  "mood": "mood and atmosphere",
  "composition": "composition and layout style",
  "colorPalette": ["color1", "color2", "color3", "color4", "color5", "color6"]
}`
            },
            ...imageUrls.slice(0, 4).map(url => ({
                type: 'image_url',
                image_url: {
                    url: url,
                    detail: 'low'
                }
            }))
        ];

        // Appeler GPT-4 Vision
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'user',
                        content: content
                    }
                ],
                max_tokens: 500
            })
        });

        if (!openaiResponse.ok) {
            const error = await openaiResponse.json();
            throw new Error(`OpenAI API error: ${error.error?.message || openaiResponse.status}`);
        }

        const aiData = await openaiResponse.json();
        
        if (!aiData.choices || !aiData.choices[0]) {
            throw new Error('Invalid OpenAI response');
        }

        let analysis;
        try {
            const content = aiData.choices[0].message.content;
            // Extraire le JSON de la réponse (au cas où il y aurait du texte autour)
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                analysis = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found in response');
            }
        } catch (parseError) {
            console.error('Failed to parse AI response:', aiData.choices[0].message.content);
            // Fallback
            analysis = {
                aesthetic: 'modern, clean design',
                mood: 'professional and elegant',
                composition: 'balanced and structured',
                colorPalette: ['#0066FF', '#FFFFFF', '#000000', '#808080']
            };
        }

        console.log('✅ Analysis complete:', analysis);

        return res.status(200).json({
            success: true,
            imagesAnalyzed: imageUrls.length,
            style: analysis
        });

    } catch (error) {
        console.error('Library style analysis error:', error);
        return res.status(500).json({
            error: error.message || 'Error analyzing image style'
        });
    }
};
