/**
 * API: Optimisation d'un prompt utilisateur via GPT
 * Prend un sujet brut et retourne un prompt DALL-E enrichi et détaillé.
 */

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { subject, styleContext, apiKey } = req.body;

    if (!subject || !subject.trim()) {
        return res.status(400).json({ error: 'Le sujet est requis' });
    }

    const openaiKey = apiKey || process.env.OPENAI_API_KEY;
    if (!openaiKey) return res.status(400).json({ error: 'Clé API OpenAI manquante' });

    const systemPrompt = styleContext
        ? `Tu es un expert en génération de prompts pour DALL-E.
Ta tâche est de transformer une courte description en un prompt DALL-E détaillé et efficace.
Le prompt doit respecter la direction artistique suivante : ${styleContext}
Enrichis avec des détails visuels concrets : composition, lumière, couleurs, style artistique, ambiance.
Retourne UNIQUEMENT le prompt final, sans introduction ni explication. 800 caractères max.`
        : `Tu es un expert en génération de prompts pour DALL-E.
Ta tâche est de transformer une courte description en un prompt DALL-E détaillé et efficace.
Enrichis la description avec des détails visuels concrets : composition, lumière, couleurs, style artistique, ambiance, qualité.
Retourne UNIQUEMENT le prompt final, sans introduction ni explication. 800 caractères max.`;

    try {
        const fetch = require('node-fetch');
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Sujet : ${subject.trim()}` }
                ],
                temperature: 0.7,
                max_tokens: 400
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || `Erreur OpenAI ${response.status}`);
        }

        const optimizedPrompt = data.choices[0].message.content.trim();

        return res.status(200).json({
            success: true,
            prompt: optimizedPrompt
        });

    } catch (error) {
        console.error('❌ generate-prompt error:', error);
        return res.status(500).json({ error: error.message });
    }
};
