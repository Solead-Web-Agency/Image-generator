// API Route Vercel - Analyse de page avec GPT-4
const fetch = require('node-fetch');

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
        const { sections, styleVersion } = req.body;

        if (!sections || !styleVersion) {
            return res.status(400).json({ error: 'Sections et style requis' });
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'Clé API OpenAI non configurée' });
        }

        const styleNames = {
            'v1': '3D Isométrique - Moderne, tech-forward, gradients dynamiques',
            'v2': 'Glassmorphism - Minimal, élégant, effets de verre',
            'v3': 'Fluid Organic - Formes fluides, gradients artistiques'
        };
        const styleName = styleNames[styleVersion] || 'Moderne et professionnel';

        const systemMessage = `Tu es un expert en Direction Artistique et en génération de contenu visuel.
Ta tâche est d'analyser des sections de contenu web et de déterminer :
1. Si une section a VRAIMENT besoin d'une image (pas toutes les sections n'en ont besoin)
2. Si oui, quel type d'image serait le plus pertinent
3. Une suggestion de sujet pour cette image

Sois sélectif : ne suggère des images QUE pour les sections où elles apporteraient une vraie valeur ajoutée.
Style visuel à respecter : ${styleName}`;

        const userMessage = `Analyse ces sections de page web et suggère des images UNIQUEMENT où c'est pertinent.

Style visuel à utiliser : ${styleName}

Sections à analyser :
${sections.map((section, i) => `
Section ${i + 1}: "${section.title}"
Contenu : ${section.content.substring(0, 200)}...
A déjà une image : ${section.hasImage ? 'Oui' : 'Non'}
`).join('\n')}

Pour chaque section qui MÉRITE une image, retourne un JSON au format :
{
  "suggestions": [
    {
      "sectionIndex": 0,
      "sectionTitle": "Titre de la section",
      "needsImage": true,
      "reason": "Pourquoi cette section a besoin d'une image",
      "imageSubject": "Description du sujet à illustrer",
      "priority": "high|medium|low"
    }
  ]
}

Retourne UNIQUEMENT le JSON, sans texte avant ou après.`;

        console.log('🤖 Analyse avec GPT-4...');

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemMessage },
                    { role: 'user', content: userMessage }
                ],
                temperature: 0.7,
                max_tokens: 2000,
                response_format: { type: "json_object" }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Erreur OpenAI:', data);
            return res.status(response.status).json({
                error: data.error?.message || 'Erreur lors de l\'analyse'
            });
        }

        const result = JSON.parse(data.choices[0].message.content);
        console.log('✅ Analyse terminée:', result.suggestions?.length || 0, 'suggestions');

        return res.status(200).json({
            success: true,
            suggestions: result.suggestions || []
        });

    } catch (error) {
        console.error('💥 Erreur serveur:', error);
        return res.status(500).json({
            error: error.message || 'Erreur interne du serveur'
        });
    }
};
