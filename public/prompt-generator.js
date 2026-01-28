// Générateur de prompts intelligent avec préservation du style

class PromptGenerator {
    constructor() {
        this.selectedStyle = null;
        this.selectedTemplate = null;
        this.userSubject = null;
        this.customStyleData = null; // Pour les styles scannés/uploadés
    }

    setStyle(styleVersion) {
        this.selectedStyle = styleVersion;
    }
    
    setCustomStyle(styleData) {
        this.customStyleData = styleData;
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

        // Check if this is a custom style (scanned, uploaded, library)
        const isCustomStyle = this.selectedStyle.startsWith('scanned-') || 
                             this.selectedStyle.startsWith('uploaded-') || 
                             this.selectedStyle.startsWith('library-');

        let globalStyle;
        
        if (isCustomStyle && this.customStyleData) {
            // Use custom style data from scanning/upload/library
            globalStyle = this.buildCustomStyleObject(this.customStyleData);
        } else {
            // Vérifier que les données sont chargées
            if (!isDataLoaded()) {
                throw new Error('Les données de style ne sont pas encore chargées. Veuillez patienter...');
            }

            globalStyle = extractGlobalStyle(this.selectedStyle);
            
            if (!globalStyle) {
                throw new Error(`Impossible de charger le style ${this.selectedStyle}. Vérifiez que les fichiers JSON sont présents.`);
            }
        }

        const template = (!isCustomStyle && this.selectedTemplate) 
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
     * Construit un objet style à partir des données scannées
     */
    buildCustomStyleObject(styleData) {
        return {
            aesthetic: styleData.aesthetic || 'modern, clean design',
            mood: styleData.mood || 'professional',
            composition: styleData.composition || 'balanced layout',
            color_palette: styleData.colorPalette || styleData.allColors?.slice(0, 6) || [],
            fonts: styleData.allFonts || [],
            lighting: 'natural, balanced lighting',
            avoid: ['inconsistent style', 'cluttered composition'],
            visualLanguage: `${styleData.aesthetic || 'modern'}, ${styleData.mood || 'professional'}`,
            dimensions: '1024x1024 (default)'
        };
    }

    /**
     * Construit le prompt de base selon le style
     */
    buildBasePrompt(globalStyle, styleVersion) {
        let prompt = '';

        // Check if this is a custom style
        const isCustomStyle = styleVersion.startsWith('scanned-') || 
                             styleVersion.startsWith('uploaded-') || 
                             styleVersion.startsWith('library-');

        if (isCustomStyle) {
            // Build prompt from scanned/custom style data
            prompt = `Illustration in the following style: `;
            prompt += `Aesthetic: ${globalStyle.aesthetic}. `;
            prompt += `Mood: ${globalStyle.mood}. `;
            prompt += `Composition: ${globalStyle.composition}. `;
        } else {
            // Use preset styles
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
        }

        // Ajouter les couleurs de manière naturelle (éviter "palette" qui est interprété littéralement)
        if (globalStyle.color_palette && globalStyle.color_palette.length > 0) {
            const colors = this.convertRGBToColorNames(globalStyle.color_palette.slice(0, 5));
            prompt += `Using predominant colors: ${colors.join(', ')}. `;
        } else if (globalStyle.colorPalette && globalStyle.colorPalette.length > 0) {
            const colors = this.convertRGBToColorNames(globalStyle.colorPalette.slice(0, 5));
            prompt += `Using predominant colors: ${colors.join(', ')}. `;
        }

        // Ne pas mentionner les typographies (inutile pour une image)

        // Ajouter l'éclairage
        if (globalStyle.lighting) {
            prompt += `Lighting: ${globalStyle.lighting}. `;
        }

        return prompt;
    }

    /**
     * Convertit les codes RGB en descriptions de couleurs naturelles
     */
    convertRGBToColorNames(colors) {
        return colors.map(color => {
            // Si c'est déjà un nom de couleur, le retourner
            if (!color.startsWith('rgb') && !color.startsWith('#')) {
                return color;
            }
            
            // Extraire les valeurs RGB
            let r, g, b;
            if (color.startsWith('rgb')) {
                const match = color.match(/\d+/g);
                if (match) {
                    [r, g, b] = match.map(Number);
                }
            } else if (color.startsWith('#')) {
                const hex = color.replace('#', '');
                r = parseInt(hex.substr(0, 2), 16);
                g = parseInt(hex.substr(2, 2), 16);
                b = parseInt(hex.substr(4, 2), 16);
            }
            
            if (r === undefined) return 'neutral';
            
            // Convertir en nom de couleur naturel
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const lightness = (max + min) / 2 / 255;
            
            // Déterminer la teinte dominante
            if (max - min < 30) {
                // Couleur grise/neutre
                if (lightness > 0.8) return 'white';
                if (lightness > 0.6) return 'light gray';
                if (lightness > 0.4) return 'medium gray';
                if (lightness > 0.2) return 'dark gray';
                return 'black';
            }
            
            // Couleur chromatique
            let hue = '';
            if (r > g && r > b) {
                if (g > b) hue = 'orange';
                else hue = 'red';
            } else if (g > r && g > b) {
                if (b > r) hue = 'cyan';
                else hue = 'green';
            } else if (b > r && b > g) {
                if (r > g) hue = 'purple';
                else hue = 'blue';
            }
            
            // Ajouter la luminosité
            if (lightness > 0.7) return `light ${hue}`;
            if (lightness < 0.3) return `dark ${hue}`;
            return hue;
        }).filter((color, index, self) => self.indexOf(color) === index); // Enlever les doublons
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
