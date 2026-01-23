// Générateur de prompts intelligent avec préservation du style

class PromptGenerator {
    constructor() {
        this.selectedStyle = null;
        this.selectedTemplate = null;
        this.userSubject = null;
    }

    setStyle(styleVersion) {
        this.selectedStyle = styleVersion;
    }

    setTemplate(templateId) {
        this.selectedTemplate = templateId;
    }

    setSubject(subject) {
        this.userSubject = subject;
    }

    /**
     * Génère un prompt optimisé en fusionnant le style choisi avec le nouveau sujet
     */
    generatePrompt() {
        if (!this.selectedStyle || !this.userSubject) {
            throw new Error('Style et sujet requis pour générer un prompt');
        }

        // Vérifier que les données sont chargées
        if (!isDataLoaded()) {
            throw new Error('Les données de style ne sont pas encore chargées. Veuillez patienter...');
        }

        const globalStyle = extractGlobalStyle(this.selectedStyle);
        
        if (!globalStyle) {
            throw new Error(`Impossible de charger le style ${this.selectedStyle}. Vérifiez que les fichiers JSON sont présents.`);
        }

        const template = this.selectedTemplate 
            ? getTemplate(this.selectedStyle, this.selectedTemplate)
            : null;

        // Construire le prompt de base selon le style
        let prompt = this.buildBasePrompt(globalStyle, this.selectedStyle);

        // Ajouter le sujet de l'utilisateur
        prompt += `\n\nSubject: ${this.userSubject}`;

        // Ajouter les éléments de composition si un template est sélectionné
        if (template && template.elements_cles) {
            prompt += '\n\nKey visual elements to incorporate:';
            template.elements_cles.slice(0, 3).forEach(element => {
                prompt += `\n- ${this.adaptElementToNewSubject(element, this.userSubject)}`;
            });
        }

        // Ajouter les instructions d'évitement
        prompt += this.buildAvoidanceInstructions(globalStyle, template);

        // Ajouter les spécifications techniques
        prompt += this.buildTechnicalSpecs(globalStyle);

        return prompt.trim();
    }

    /**
     * Construit le prompt de base selon le style
     */
    buildBasePrompt(globalStyle, styleVersion) {
        let prompt = '';

        switch (styleVersion) {
            case 'v1':
                prompt = `Modern 3D isometric illustration with clean vector art aesthetic. `;
                prompt += `Style: ${globalStyle.aesthetic}. `;
                prompt += `Mood: ${globalStyle.mood}. `;
                prompt += `Composition: ${globalStyle.composition}. `;
                break;

            case 'v2':
                prompt = `Minimalist glassmorphism illustration with frosted glass effects and elegant transparency. `;
                prompt += `Style: ${globalStyle.aesthetic}. `;
                prompt += `Mood: ${globalStyle.mood}. `;
                prompt += `Key effects: ${globalStyle.keyEffects.join(', ')}. `;
                break;

            case 'v3':
                prompt = `Abstract fluid art illustration with organic flowing shapes and gradient mesh. `;
                prompt += `Style: ${globalStyle.aesthetic}. `;
                prompt += `Mood: ${globalStyle.mood}. `;
                prompt += `Visual language: Fluid, organic, artistic with smooth color blending. `;
                break;
        }

        // Ajouter la palette de couleurs
        if (globalStyle.colorPalette && globalStyle.colorPalette.length > 0) {
            const mainColors = globalStyle.colorPalette.slice(0, 5);
            prompt += `Color palette: ${mainColors.join(', ')}. `;
        }

        // Ajouter l'éclairage
        if (globalStyle.lighting) {
            prompt += `Lighting: ${globalStyle.lighting}. `;
        }

        return prompt;
    }

    /**
     * Adapte un élément visuel au nouveau sujet
     */
    adaptElementToNewSubject(originalElement, newSubject) {
        // Extraction des mots-clés du sujet
        const subjectKeywords = this.extractKeywords(newSubject);
        
        // Garder la structure visuelle mais adapter au contexte
        // Par exemple: "Search bar central" devient applicable au nouveau sujet
        return originalElement;
    }

    /**
     * Extrait les mots-clés importants d'un texte
     */
    extractKeywords(text) {
        const commonWords = ['le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'avec', 'pour', 'dans', 'sur'];
        const words = text.toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 3 && !commonWords.includes(word));
        return [...new Set(words)];
    }

    /**
     * Construit les instructions d'évitement
     */
    buildAvoidanceInstructions(globalStyle, template) {
        let instructions = '\n\nAvoid: ';
        const avoidItems = [
            'Stock photos',
            'Clipart',
            'Human faces',
            'Illegible text',
            'Overly complex elements',
            'Generic imagery'
        ];

        if (template && template.avoid) {
            instructions += template.avoid;
        } else {
            instructions += avoidItems.join(', ');
        }

        return instructions;
    }

    /**
     * Construit les spécifications techniques
     */
    buildTechnicalSpecs(globalStyle) {
        let specs = '\n\nTechnical specifications: ';
        
        if (globalStyle.dimensions) {
            specs += `Dimensions: ${globalStyle.dimensions}. `;
        }

        specs += 'High-resolution, professional quality. ';
        specs += `Visual language: ${globalStyle.visualLanguage}. `;

        return specs;
    }

    /**
     * Génère un prompt enrichi avec l'aide de l'IA (pour utilisation future avec GPT)
     */
    async generateEnrichedPromptWithAI(apiKey) {
        const basePrompt = this.generatePrompt();
        
        const systemMessage = `Tu es un expert en génération de prompts pour DALL-E. 
Ta tâche est de prendre un prompt de base qui décrit un style visuel et un sujet, 
et de l'enrichir pour créer un prompt optimal pour DALL-E qui préserve parfaitement 
la Direction Artistique tout en illustrant le nouveau sujet de manière créative.

Garde la cohérence du style, des couleurs, de l'éclairage et de la composition.
Sois créatif dans l'application du sujet au style visuel défini.`;

        const userMessage = `Voici le prompt de base à enrichir:\n\n${basePrompt}\n\n
Génère un prompt DALL-E optimisé qui:
1. Préserve EXACTEMENT le style visuel décrit
2. Illustre le sujet de manière créative et pertinente
3. Maintient la cohérence de Direction Artistique
4. Est clair, précis et détaillé
5. Ne dépasse pas 1000 caractères

Retourne uniquement le prompt final, sans introduction ni explication.`;

        try {
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
                    max_tokens: 500
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Erreur lors de la génération du prompt');
            }

            const data = await response.json();
            return data.choices[0].message.content.trim();
        } catch (error) {
            console.error('Error generating enriched prompt:', error);
            throw error;
        }
    }
}

// Instance globale
const promptGenerator = new PromptGenerator();
