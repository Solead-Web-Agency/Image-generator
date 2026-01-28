/**
 * API: Analyser le style d'un site web
 * 
 * Version optimisée pour Vercel sans Puppeteer
 * Utilise fetch + GPT-4o pour analyser le HTML/CSS
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
        console.log('🌐 Fetching HTML from:', url);
        
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
        
        console.log('📄 HTML fetched, length:', html.length);

        // Extraire les informations basiques du HTML
        const styleInfo = extractStyleFromHTML(html);
        
        console.log('🎨 Basic styles extracted:', styleInfo);

        // Analyser avec GPT-4o
        console.log('🤖 Analyzing with GPT-4...');
        
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{
                    role: 'system',
                    content: 'Tu es un expert en design web. Analyse le code HTML/CSS fourni et déduis le style visuel du site.'
                }, {
                    role: 'user',
                    content: `Analyse ce site web (${url}) et son code HTML/CSS.

Informations extraites:
- Couleurs détectées: ${JSON.stringify(styleInfo.colors)}
- Fonts détectées: ${JSON.stringify(styleInfo.fonts)}
- CSS inline/style tags: ${styleInfo.cssSnippet}

Extrait du HTML (premiers 3000 caractères):
${html.substring(0, 3000)}

Réponds UNIQUEMENT avec un JSON valide (sans markdown) contenant:
{
  "aesthetic": "description du style esthétique (moderne, minimaliste, etc.)",
  "mood": "ambiance générale (professionnel, créatif, etc.)",
  "composition": "style de composition (grille, asymétrique, etc.)",
  "colorPalette": ["couleur1", "couleur2", "couleur3"],
  "typography": ["font1", "font2"]
}`
                }],
                temperature: 0.3,
                max_tokens: 500
            })
        });

        if (!openaiResponse.ok) {
            const errorData = await openaiResponse.text();
            throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorData}`);
        }

        const aiData = await openaiResponse.json();
        
        if (!aiData.choices || !aiData.choices[0]) {
            throw new Error('Invalid OpenAI response');
        }

        let analysis;
        try {
            const content = aiData.choices[0].message.content.trim();
            // Remove markdown code blocks if present
            const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            analysis = JSON.parse(cleanContent);
        } catch (parseError) {
            console.error('Failed to parse AI response:', aiData.choices[0].message.content);
            // Fallback with extracted data
            analysis = {
                aesthetic: 'Style moderne et épuré',
                mood: 'Professionnel',
                composition: 'Grille structurée',
                colorPalette: styleInfo.colors.slice(0, 5) || ['#000000', '#ffffff'],
                typography: styleInfo.fonts.slice(0, 3) || ['Arial', 'sans-serif']
            };
        }

        console.log('✅ Analysis complete:', analysis);

        return res.status(200).json({
            success: true,
            url: url,
            style: analysis
        });

    } catch (error) {
        console.error('❌ Error analyzing website:', error);
        return res.status(500).json({ 
            error: `Failed to analyze website: ${error.message}` 
        });
    }
};

/**
 * Extrait les informations de style basiques depuis le HTML brut
 */
function extractStyleFromHTML(html) {
    const colors = [];
    const fonts = [];
    let cssSnippet = '';

    // Extraire les couleurs (hex, rgb, rgba)
    const colorRegex = /#[0-9a-fA-F]{3,6}|rgba?\([^)]+\)/g;
    const colorMatches = html.match(colorRegex);
    if (colorMatches) {
        colors.push(...[...new Set(colorMatches)].slice(0, 10));
    }

    // Extraire les fonts
    const fontRegex = /font-family:\s*['"]?([^'";]+)['"]?/gi;
    let fontMatch;
    while ((fontMatch = fontRegex.exec(html)) !== null) {
        const font = fontMatch[1].split(',')[0].trim();
        if (!fonts.includes(font)) {
            fonts.push(font);
        }
        if (fonts.length >= 5) break;
    }

    // Extraire un extrait de CSS
    const styleTagMatch = html.match(/<style[^>]*>([\s\S]{0,1000})/i);
    if (styleTagMatch) {
        cssSnippet = styleTagMatch[1];
    }

    return { colors, fonts, cssSnippet };
}
