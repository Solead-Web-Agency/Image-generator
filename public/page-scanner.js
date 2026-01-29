// Scanner de page web pour identifier les sections nécessitant des images

class PageScanner {
    constructor() {
        this.scannedContent = null;
        this.suggestions = [];
        this.scannedUrl = null;
    }

    /**
     * Scanner une URL et extraire le contenu
     */
    async scanURL(url) {
        try {
            // Store the scanned URL for iframe preview
            this.scannedUrl = url;
            
            // Utiliser l'API backend pour contourner les problèmes CORS
            const response = await fetch('/api/scan-page-content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors du scan');
            }

            const data = await response.json();
            const html = data.html;
            
            console.log(`✅ HTML reçu: ${html.length} caractères`);
            
            // Parser le HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Extraire le contenu structuré
            this.scannedContent = this.extractContent(doc);
            
            console.log(`✅ ${this.scannedContent.length} sections détectées`);
            
            return this.scannedContent;
        } catch (error) {
            console.error('❌ Error scanning URL:', error);
            throw new Error(`Impossible de scanner cette URL: ${error.message}`);
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
     * Approche ULTRA FLEXIBLE qui fonctionne avec n'importe quelle structure
     */
    extractContent(doc) {
        const sections = [];
        const processedElements = new Set(); // Éviter les doublons
        
        // Étape 1: Chercher les éléments sémantiques classiques
        const semanticElements = doc.querySelectorAll('section, article, aside, [role="region"]');
        
        semanticElements.forEach((element) => {
            const extracted = this.extractSectionData(element);
            if (extracted && extracted.content.length > 50) {
                sections.push(extracted);
                processedElements.add(element);
            }
        });
        
        // Étape 2: Si peu de résultats, chercher dans main, divs avec classes significatives
        if (sections.length < 3) {
            const contentSelectors = [
                'main section', 'main article', 'main > div',
                '[class*="content"]', '[class*="section"]', '[class*="block"]',
                '[class*="container"] > div', '[class*="wrapper"] > div',
                '[id*="content"]', '[id*="main"]'
            ];
            
            contentSelectors.forEach(selector => {
                try {
                    const elements = doc.querySelectorAll(selector);
                    elements.forEach(element => {
                        if (!processedElements.has(element)) {
                            const extracted = this.extractSectionData(element);
                            if (extracted && extracted.content.length > 50) {
                                sections.push(extracted);
                                processedElements.add(element);
                            }
                        }
                    });
                } catch (e) {
                    // Selector invalide, on skip
                }
            });
        }
        
        // Étape 3: Si toujours peu de résultats, analyser TOUS les div avec du contenu significatif
        if (sections.length < 3) {
            const allDivs = doc.querySelectorAll('div');
            allDivs.forEach(div => {
                if (!processedElements.has(div) && !this.isExcludedElement(div)) {
                    const extracted = this.extractSectionData(div);
                    if (extracted && extracted.content.length > 100) { // Seuil plus élevé pour les divs génériques
                        sections.push(extracted);
                        processedElements.add(div);
                    }
                }
            });
        }
        
        // Limiter à max 50 sections et trier par pertinence (longueur de contenu)
        return sections
            .sort((a, b) => b.content.length - a.content.length)
            .slice(0, 50)
            .map((section, index) => ({
                ...section,
                index: index
            }));
    }
    
    /**
     * Extraire les données d'une section/élément
     */
    extractSectionData(element) {
        // Skip si l'élément est vide
        if (!element) {
            return null;
        }
        
        const heading = element.querySelector('h1, h2, h3, h4, h5, h6');
        const paragraphs = element.querySelectorAll('p');
        const images = element.querySelectorAll('img');
        
        // Extraire le texte (paragraphes OU texte direct si pas de paragraphes)
        let textContent = '';
        if (paragraphs.length > 0) {
            textContent = Array.from(paragraphs)
                .map(p => p.textContent.trim())
                .filter(text => text.length > 20)
                .join(' ');
        } else {
            // Fallback: prendre tout le texte de l'élément
            textContent = element.textContent.trim();
        }
        
        // Nettoyer et limiter
        textContent = textContent
            .replace(/\s+/g, ' ') // Normaliser les espaces
            .substring(0, 500);
        
        if (!textContent || textContent.length < 50) {
            return null;
        }
        
        return {
            title: heading ? heading.textContent.trim() : this.extractTitleFromContent(textContent),
            content: textContent,
            hasImage: images.length > 0,
            imageCount: images.length,
            element: element.tagName.toLowerCase(),
            classes: element.className || ''
        };
    }
    
    /**
     * Vérifier si un élément doit être exclu (header, footer, nav, etc.)
     */
    isExcludedElement(element) {
        const tagName = element.tagName.toLowerCase();
        const className = element.className.toLowerCase();
        const id = element.id.toLowerCase();
        
        // Tags à exclure
        const excludedTags = ['header', 'footer', 'nav', 'aside', 'script', 'style', 'noscript'];
        if (excludedTags.includes(tagName)) {
            return true;
        }
        
        // Classes/IDs à exclure
        const excludedKeywords = ['header', 'footer', 'nav', 'menu', 'sidebar', 'cookie', 'modal', 'popup'];
        return excludedKeywords.some(keyword => 
            className.includes(keyword) || id.includes(keyword)
        );
    }
    
    /**
     * Extraire un titre depuis le contenu si pas de heading
     */
    extractTitleFromContent(content) {
        // Prendre les 5 premiers mots comme titre
        const words = content.split(' ').slice(0, 5).join(' ');
        return words.length > 50 ? words.substring(0, 50) + '...' : words;
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
     * Analyser UNIQUEMENT les sections spécifiées (nouvelle méthode simplifiée)
     */
    async analyzeSpecificSections(selectedSections, apiKey, selectedStyle) {
        if (!selectedSections || selectedSections.length === 0) {
            throw new Error('Aucune section fournie pour l\'analyse');
        }

        if (!apiKey) {
            throw new Error('Clé API OpenAI requise');
        }

        const styleData = getStyleData(selectedStyle);
        const styleName = this.getStyleName(selectedStyle);

        const systemMessage = `Tu es un expert en Direction Artistique. 
Ton rôle est d'analyser des sections de contenu web et de suggérer des sujets d'images pertinents pour illustrer chaque section.
Style visuel à respecter : ${styleName}`;

        const userMessage = `Analyse ces ${selectedSections.length} sections et suggère un sujet d'image pertinent pour CHAQUE section.

Style visuel : ${styleName}
Description : ${styleData?.style_global?.aesthetic || 'Moderne et professionnel'}

Sections à illustrer :
${selectedSections.map((section, i) => `
Section ${i + 1}: "${section.title}"
Contenu : ${section.content.substring(0, 300)}...
A déjà une image : ${section.hasImage ? 'Oui' : 'Non'}
`).join('\n')}

Pour CHAQUE section, retourne un JSON au format :
{
  "suggestions": [
    {
      "sectionIndex": 0,
      "sectionTitle": "Titre exact de la section",
      "imageSubject": "Description détaillée du sujet d'image à générer",
      "reason": "Courte explication de pourquoi cette image",
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
