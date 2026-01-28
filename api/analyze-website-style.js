/**
 * API: Analyser le style d'un site web
 * 
 * Cette API utilise Puppeteer pour scraper un site et extraire :
 * - Couleurs dominantes
 * - Typographies
 * - Esthétique générale
 * - Style de composition
 */

// Pour installer les dépendances nécessaires :
// npm install puppeteer-core @sparticuz/chromium node-fetch

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
        // MÉTHODE 1 : Puppeteer avec Chromium pour Vercel
        const puppeteer = require('puppeteer-core');
        const chromium = require('@sparticuz/chromium');
        
        console.log('🚀 Launching Puppeteer for:', url);
        
        const browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });
        
        const page = await browser.newPage();
        console.log('📄 Navigating to URL...');
        
        await page.goto(url, { 
            waitUntil: 'networkidle2', 
            timeout: 30000 
        });
        
        console.log('🎨 Extracting styles...');
        
        // Extraire les styles
        const styleData = await page.evaluate(() => {
            const body = document.body;
            const computedStyle = getComputedStyle(body);
            
            // Couleurs
            const colors = new Set();
            const elements = document.querySelectorAll('*');
            let count = 0;
            
            for (const el of elements) {
                if (count++ > 200) break; // Limiter pour performance
                
                const style = getComputedStyle(el);
                if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                    colors.add(style.backgroundColor);
                }
                if (style.color) {
                    colors.add(style.color);
                }
            }
            
            // Fonts
            const fonts = new Set();
            count = 0;
            
            for (const el of elements) {
                if (count++ > 100) break; // Limiter pour performance
                
                const font = getComputedStyle(el).fontFamily;
                if (font) {
                    const firstFont = font.split(',')[0].replace(/['"]/g, '').trim();
                    if (firstFont) fonts.add(firstFont);
                }
            }
            
            return {
                backgroundColor: computedStyle.backgroundColor,
                textColor: computedStyle.color,
                fontFamily: computedStyle.fontFamily,
                allColors: Array.from(colors).slice(0, 10),
                allFonts: Array.from(fonts).slice(0, 5)
            };
        });
        
        console.log('✅ Styles extracted:', styleData);
        
        await browser.close();

        console.log('🤖 Analyzing with GPT-4...');
        
        // Utiliser GPT-4 pour analyser et générer une description
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
                    content: 'Tu es un expert en design qui analyse les styles de sites web.'
                }, {
                    role: 'user',
                    content: `Analyse ce site (${url}) avec ces données:
Couleurs: ${styleData.allColors.join(', ')}
Fonts: ${styleData.allFonts.join(', ')}

Génère une description du style en format JSON avec:
- aesthetic: string (ex: "modern, minimal, tech-forward")
- mood: string (ex: "professional, trustworthy")
- composition: string (ex: "centered, clean backgrounds")
- colorPalette: array de max 6 couleurs en hex`
                }],
                temperature: 0.7
            })
        });

        const aiData = await openaiResponse.json();
        
        if (!aiData.choices || !aiData.choices[0]) {
            throw new Error('Invalid OpenAI response');
        }
        
        let analysis;
        try {
            analysis = JSON.parse(aiData.choices[0].message.content);
        } catch (parseError) {
            console.error('Failed to parse AI response:', aiData.choices[0].message.content);
            // Fallback avec les données brutes
            analysis = {
                aesthetic: 'modern, clean',
                mood: 'professional',
                composition: 'structured layout',
                colorPalette: styleData.allColors.slice(0, 6)
            };
        }

        console.log('✅ Analysis complete:', analysis);

        // Retourner le résultat
        return res.status(200).json({
            success: true,
            url,
            style: {
                ...styleData,
                ...analysis
            }
        });

    } catch (error) {
        console.error('Error analyzing website:', error);
        return res.status(500).json({ 
            error: 'Failed to analyze website',
            message: error.message 
        });
    }
};
