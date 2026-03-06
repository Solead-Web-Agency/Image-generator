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
            style: analysis,
            allColors: Array.from(styleInfo.colors), // Toutes les couleurs détectées
            allFonts: Array.from(styleInfo.fonts) // Toutes les polices détectées
        });

    } catch (error) {
        console.error('❌ Error analyzing website:', error);
        return res.status(500).json({ 
            error: `Failed to analyze website: ${error.message}` 
        });
    }
};

/**
 * Convertit n'importe quelle couleur CSS en hex 6 digits normalisé
 */
function normalizeColor(color) {
    color = color.trim().toLowerCase();

    // Hex 3 digits → 6 digits
    const hex3 = color.match(/^#([0-9a-f]{3})$/);
    if (hex3) {
        const [, h] = hex3;
        return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
    }

    // Hex 6 digits
    if (/^#[0-9a-f]{6}$/.test(color)) return color;

    // rgb(r, g, b)
    const rgb = color.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (rgb) {
        const r = parseInt(rgb[1]).toString(16).padStart(2, '0');
        const g = parseInt(rgb[2]).toString(16).padStart(2, '0');
        const b = parseInt(rgb[3]).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
    }

    return null;
}

/**
 * Calcule la "distance perceptuelle" entre deux couleurs hex
 * Permet de filtrer les doublons quasi-identiques
 */
function colorDistance(hex1, hex2) {
    const r1 = parseInt(hex1.slice(1, 3), 16);
    const g1 = parseInt(hex1.slice(3, 5), 16);
    const b1 = parseInt(hex1.slice(5, 7), 16);
    const r2 = parseInt(hex2.slice(1, 3), 16);
    const g2 = parseInt(hex2.slice(3, 5), 16);
    const b2 = parseInt(hex2.slice(5, 7), 16);
    return Math.sqrt((r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2);
}

/**
 * Filtre les couleurs trop proches, trop claires ou trop sombres
 */
function deduplicateColors(colors, threshold = 25) {
    // Exclure blanc/noir pur et très proches
    const filtered = colors.filter(c => {
        const r = parseInt(c.slice(1, 3), 16);
        const g = parseInt(c.slice(3, 5), 16);
        const b = parseInt(c.slice(5, 7), 16);
        const brightness = (r + g + b) / 3;
        return brightness > 15 && brightness < 240; // Pas trop sombre ni trop clair
    });

    const result = [];
    for (const color of filtered) {
        const tooClose = result.some(c => colorDistance(c, color) < threshold);
        if (!tooClose) result.push(color);
    }
    return result;
}

/**
 * Extrait les informations de style basiques depuis le HTML brut
 */
function extractStyleFromHTML(html) {
    const rawColors = new Map(); // color → poids
    const fonts = new Set();
    let cssSnippet = '';

    // ── 1. Extraire le contenu CSS (style tags + inline styles)
    const cssBlocks = [];

    const styleTags = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
    styleTags.forEach(b => cssBlocks.push(b));

    const inlineStyles = html.match(/style=["'][^"']{1,500}["']/gi) || [];
    inlineStyles.forEach(b => cssBlocks.push(b));

    const cssContent = cssBlocks.join('\n');

    // ── 2. Variables CSS (poids fort : ce sont souvent les couleurs de marque)
    const cssVarRegex = /--[a-zA-Z0-9-]+\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/gi;
    let m;
    while ((m = cssVarRegex.exec(cssContent)) !== null) {
        const n = normalizeColor(m[1]);
        if (n) rawColors.set(n, (rawColors.get(n) || 0) + 5);
    }

    // ── 3. Propriétés CSS importantes dans les blocs CSS
    const propRegex = /(?:background(?:-color)?|color|border(?:-color)?|fill|stroke|outline-color|box-shadow)\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+[^)]*\))/gi;
    while ((m = propRegex.exec(cssContent)) !== null) {
        const n = normalizeColor(m[1]);
        if (n) rawColors.set(n, (rawColors.get(n) || 0) + 2);
    }

    // ── 4. Toutes les couleurs hex dans le CSS (poids faible, pour attraper ce qui reste)
    const hexAllRegex = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;
    while ((m = hexAllRegex.exec(cssContent)) !== null) {
        const n = normalizeColor(m[0]);
        if (n) rawColors.set(n, (rawColors.get(n) || 0) + 1);
    }

    // ── 5. Fallback : couleurs hex dans tout le HTML (poids minimal)
    if (rawColors.size < 5) {
        while ((m = hexAllRegex.exec(html)) !== null) {
            const n = normalizeColor(m[0]);
            if (n) rawColors.set(n, (rawColors.get(n) || 0) + 0.5);
        }
    }

    // ── 6. Trier par poids et dédupliquer
    const sorted = [...rawColors.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([c]) => c);

    const uniqueColors = deduplicateColors(sorted);

    // ── 7. Fonts
    // Google Fonts (priorité)
    const googleFontsRegex = /fonts\.googleapis\.com\/css[^"']*family=([^"'&:)]+)/gi;
    while ((m = googleFontsRegex.exec(html)) !== null) {
        m[1].split('|').forEach(font => {
            const clean = font.replace(/\+/g, ' ').split(':')[0].trim();
            if (clean) fonts.add(clean);
        });
    }

    // font-family dans CSS
    const fontFamilyRegex = /font-family:\s*['"]?([^'";{}]+)['"]?[;{}]/gi;
    while ((m = fontFamilyRegex.exec(html)) !== null) {
        m[1].split(',').forEach(font => {
            const clean = font.trim().replace(/['"]/g, '');
            if (clean && !['sans-serif','serif','monospace','system-ui','inherit','initial','unset'].includes(clean.toLowerCase())) {
                fonts.add(clean);
            }
        });
    }

    // Extraire un extrait de CSS pour le debug
    const styleTagMatch = html.match(/<style[^>]*>([\s\S]{0,2000})/i);
    if (styleTagMatch) cssSnippet = styleTagMatch[1];

    console.log(`🎨 Colors extracted: ${uniqueColors.length} unique colors from ${rawColors.size} raw`);

    return {
        colors: uniqueColors.slice(0, 40),
        fonts: Array.from(fonts).slice(0, 10),
        cssSnippet
    };
}
