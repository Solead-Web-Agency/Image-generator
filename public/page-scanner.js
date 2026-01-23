// Scanner de page web pour identifier les sections nécessitant des images

class PageScanner {
    constructor() {
        this.scannedContent = null;
        this.suggestions = [];
    }

    /**
     * Scanner une URL et extraire le contenu
     */
    async scanURL(url) {
        try {
            // Pour éviter les problèmes CORS, on utilise un proxy ou on demande le HTML directement
            const response = await fetch(url);
            const html = await response.text();
            
            // Parser le HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Extraire le contenu structuré
            this.scannedContent = this.extractContent(doc);
            
            return this.scannedContent;
        } catch (error) {
            console.error('Error scanning URL:', error);
            throw new Error('Impossible de scanner cette URL. Vérifiez qu\'elle est accessible et que CORS est activé.');
        }
    }

    /**
     * Scanner du texte/HTML directement collé
     */
    scanText(htmlText) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            this.scannedContent = this.extractContent(doc);
            return this.scannedContent;
        } catch (error) {
            console.error('Error scanning text:', error);
            throw new Error('Erreur lors de l\'analyse du contenu');
        }
    }

    /**
     * Extraire le contenu structuré d'un document HTML
     */
    extractContent(doc) {
        const sections = [];
        
        // Récupérer toutes les sections, articles, ou div principales
        const elements = doc.querySelectorAll('section, article, .section, main > div, [class*="content"]');
        
        elements.forEach((element, index) => {
            const heading = element.querySelector('h1, h2, h3, h4');
            const paragraphs = element.querySelectorAll('p');
            const images = element.querySelectorAll('img');
            
            const textContent = Array.from(paragraphs)
                .map(p => p.textContent.trim())
                .filter(text => text.length > 20)
                .join(' ')
                .substring(0, 500); // Limiter à 500 caractères
            
            if (textContent) {
                sections.push({
                    index: index,
                    title: heading ? heading.textContent.trim() : `Section ${index + 1}`,
                    content: textContent,
                    hasImage: images.length > 0,
                    imageCount: images.length,
                    element: element.tagName,
                    classes: element.className
                });
            }
        });

        return sections;
    }

    /**
     * Analyser le contenu avec GPT pour suggérer des images
     */
    async analyzeSectionsWithAI(apiKey, selectedStyle) {
        if (!this.scannedContent || this.scannedContent.length === 0) {
            throw new Error('Aucun contenu à analyser. Scannez d\'abord une page.');
        }

        if (!apiKey) {
            throw new Error('Clé API OpenAI requise pour l\'analyse intelligente');
        }

        const styleData = getStyleData(selectedStyle);
        const styleName = this.getStyleName(selectedStyle);

        const systemMessage = `Tu es un expert en Direction Artistique et en génération de contenu visuel.
Ta tâche est d'analyser des sections de contenu web et de déterminer :
1. Si une section a VRAIMENT besoin d'une image (pas toutes les sections n'en ont besoin)
2. Si oui, quel type d'image serait le plus pertinent
3. Une suggestion de sujet pour cette image

Sois sélectif : ne suggère des images QUE pour les sections où elles apporteraient une vraie valeur ajoutée.
Style visuel à respecter : ${styleName}`;

        const userMessage = `Analyse ces sections de page web et suggère des images UNIQUEMENT où c'est pertinent.

Style visuel à utiliser : ${styleName}
Description du style : ${styleData?.style_global?.aesthetic || 'Moderne et professionnel'}

Sections à analyser :
${this.scannedContent.map((section, i) => `
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
                    max_tokens: 2000,
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Erreur lors de l\'analyse IA');
            }

            const data = await response.json();
            const result = JSON.parse(data.choices[0].message.content);
            
            this.suggestions = result.suggestions || [];
            return this.suggestions;
        } catch (error) {
            console.error('Error analyzing with AI:', error);
            throw error;
        }
    }

    /**
     * Obtenir le nom du style
     */
    getStyleName(styleVersion) {
        const styleNames = {
            'v1': '3D Isométrique - Moderne, tech-forward, gradients dynamiques',
            'v2': 'Glassmorphism - Minimal, élégant, effets de verre',
            'v3': 'Fluid Organic - Formes fluides, gradients artistiques'
        };
        return styleNames[styleVersion] || 'Moderne et professionnel';
    }

    /**
     * Générer un prompt pour une suggestion spécifique
     */
    generatePromptForSuggestion(suggestion, styleVersion) {
        promptGenerator.setStyle(styleVersion);
        promptGenerator.setSubject(suggestion.imageSubject);
        return promptGenerator.generatePrompt();
    }

    /**
     * Obtenir les suggestions
     */
    getSuggestions() {
        return this.suggestions;
    }

    /**
     * Obtenir le contenu scanné
     */
    getScannedContent() {
        return this.scannedContent;
    }
}

// Instance globale
const pageScanner = new PageScanner();
