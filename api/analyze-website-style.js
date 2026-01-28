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
                    content: `Analyse ce site web : ${url}

📊 Données pré-extraites du HTML:
- Couleurs trouvées: ${styleInfo.colors.length > 0 ? JSON.stringify(styleInfo.colors) : 'aucune'}
- Polices trouvées: ${styleInfo.fonts.length > 0 ? JSON.stringify(styleInfo.fonts) : 'aucune'}

📄 Code HTML/CSS (premiers 5000 caractères):
${html.substring(0, 5000)}

INSTRUCTIONS IMPORTANTES:
1. Analyse le contenu, la structure et le type de site
2. TOUJOURS retourner 5 couleurs en format #hex (même si tu dois les deviner intelligemment)
3. TOUJOURS retourner au moins 2 polices (même si tu dois les suggérer basé sur le style)
4. Utilise les couleurs/fonts pré-extraites si disponibles, sinon déduis-les du contexte

Exemples de déduction intelligente:
- Site tech/startup → #0ea5e9, #1e293b, #f8fafc, #64748b, #0f172a + Inter, Roboto
- Site créatif/agence → #ff6b6b, #4ecdc4, #ffe66d, #292f36, #f7f7f7 + Poppins, Montserrat
- Site e-commerce → #2563eb, #ffffff, #1f2937, #f3f4f6, #10b981 + Inter, Arial

Réponds UNIQUEMENT avec ce JSON valide (sans markdown, sans backticks):
{
  "aesthetic": "description du style esthétique (sois précis et descriptif)",
  "mood": "ambiance du site (professionnel/créatif/chaleureux/etc)",
  "composition": "style de mise en page (grille/asymétrique/centré/etc)",
  "colorPalette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
  "typography": ["Police principale", "Police secondaire"]
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
            // Fallback with extracted data or defaults
            analysis = {
                aesthetic: 'Style moderne et épuré',
                mood: 'Professionnel',
                composition: 'Grille structurée',
                colorPalette: styleInfo.colors.length > 0 
                    ? styleInfo.colors.slice(0, 5) 
                    : ['#1a1a1a', '#ffffff', '#3b82f6', '#6b7280', '#f3f4f6'],
                typography: styleInfo.fonts.length > 0 
                    ? styleInfo.fonts.slice(0, 3) 
                    : ['Inter', 'Roboto', 'Arial']
            };
        }

        // S'assurer qu'on a toujours des valeurs valides
        if (!analysis.colorPalette || analysis.colorPalette.length === 0) {
            analysis.colorPalette = ['#1a1a1a', '#ffffff', '#3b82f6', '#6b7280', '#f3f4f6'];
        }
        if (!analysis.typography || analysis.typography.length === 0) {
            analysis.typography = ['Inter', 'Roboto', 'Arial'];
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
    const colors = new Set();
    const fonts = new Set();
    let cssSnippet = '';

    // Extraire les couleurs (hex, rgb, rgba, hsl)
    const hexRegex = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;
    const rgbRegex = /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)/g;
    const hslRegex = /hsla?\(\s*\d+\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*(?:,\s*[\d.]+\s*)?\)/g;
    
    [hexRegex, rgbRegex, hslRegex].forEach(regex => {
        const matches = html.match(regex);
        if (matches) {
            matches.forEach(color => colors.add(color));
        }
    });

    // Extraire les fonts (font-family, Google Fonts, CSS imports)
    // 1. Depuis font-family
    const fontFamilyRegex = /font-family:\s*['"]?([^'";{}]+)['"]?[;{}]/gi;
    let fontMatch;
    while ((fontMatch = fontFamilyRegex.exec(html)) !== null) {
        const fontList = fontMatch[1].split(',');
        fontList.forEach(font => {
            const cleanFont = font.trim().replace(/['"]/g, '');
            if (cleanFont && !cleanFont.includes('sans-serif') && !cleanFont.includes('serif') && !cleanFont.includes('monospace')) {
                fonts.add(cleanFont);
            }
        });
    }

    // 2. Google Fonts dans les links
    const googleFontsRegex = /fonts\.googleapis\.com\/css[^"]*family=([^"&:]+)/gi;
    while ((fontMatch = googleFontsRegex.exec(html)) !== null) {
        const fontNames = fontMatch[1].split('|');
        fontNames.forEach(font => {
            const cleanFont = font.replace(/\+/g, ' ').split(':')[0];
            if (cleanFont) fonts.add(cleanFont);
        });
    }

    // 3. @import de fonts
    const importFontRegex = /@import\s+url\(['"]?[^'"]*family=([^'"&:]+)/gi;
    while ((fontMatch = importFontRegex.exec(html)) !== null) {
        const fontName = fontMatch[1].replace(/\+/g, ' ').split(':')[0];
        if (fontName) fonts.add(fontName);
    }

    // Extraire un extrait de CSS
    const styleTagMatch = html.match(/<style[^>]*>([\s\S]{0,2000})/i);
    if (styleTagMatch) {
        cssSnippet = styleTagMatch[1];
    }

    return { 
        colors: Array.from(colors).slice(0, 15), 
        fonts: Array.from(fonts).slice(0, 8),
        cssSnippet 
    };
}
