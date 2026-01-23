// Application principale - Gestion de l'interface et des interactions

class ImageGeneratorApp {
    constructor() {
        // Charger la clé depuis le fichier config.js en priorité, sinon depuis localStorage
        this.apiKey = (typeof CONFIG !== 'undefined' && CONFIG.OPENAI_API_KEY) 
            ? CONFIG.OPENAI_API_KEY 
            : localStorage.getItem('openai_api_key') || '';
        
        this.selectedStyle = null;
        this.generatedPrompt = null;
        this.generatedImageUrl = null;
        this.dataLoaded = false;

        this.initializeElements();
        this.attachEventListeners();
        this.loadSavedApiKey();
        this.waitForDataLoad();
    }

    initializeElements() {
        // Mode buttons
        this.modeButtons = document.querySelectorAll('.mode-btn');
        this.manualSection = document.getElementById('manualSection');
        this.scanSection = document.getElementById('scanSection');
        
        // Scan elements
        this.urlInput = document.getElementById('urlInput');
        this.htmlInput = document.getElementById('htmlInput');
        this.scanUrlBtn = document.getElementById('scanUrlBtn');
        this.scanHtmlBtn = document.getElementById('scanHtmlBtn');
        this.scanResults = document.getElementById('scanResults');
        this.sectionsFound = document.getElementById('sectionsFound');
        this.analyzeWithAIBtn = document.getElementById('analyzeWithAIBtn');
        this.imageSuggestions = document.getElementById('imageSuggestions');
        this.suggestionsContainer = document.getElementById('suggestionsContainer');
        this.generateAllBtn = document.getElementById('generateAllBtn');
        
        // Style cards
        this.styleCards = document.querySelectorAll('.style-card');
        
        // Form elements
        this.templateSelect = document.getElementById('templateSelect');
        this.subjectInput = document.getElementById('subjectInput');
        this.generatePromptBtn = document.getElementById('generatePromptBtn');
        
        // API configuration
        this.apiKeyInput = document.getElementById('apiKeyInput');
        this.modelSelect = document.getElementById('modelSelect');
        this.sizeSelect = document.getElementById('sizeSelect');
        this.qualitySelect = document.getElementById('qualitySelect');
        
        // Prompt section
        this.promptSection = document.getElementById('promptSection');
        this.generatedPromptDiv = document.getElementById('generatedPrompt');
        this.copyPromptBtn = document.getElementById('copyPromptBtn');
        this.editPromptBtn = document.getElementById('editPromptBtn');
        this.generateImageBtn = document.getElementById('generateImageBtn');
        
        // Result section
        this.resultSection = document.getElementById('resultSection');
        this.generatedImage = document.getElementById('generatedImage');
        this.downloadImageBtn = document.getElementById('downloadImageBtn');
        this.newGenerationBtn = document.getElementById('newGenerationBtn');
        
        // Overlay and messages
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.loadingMessage = document.getElementById('loadingMessage');
        this.messageBox = document.getElementById('messageBox');
        this.messageText = document.getElementById('messageText');
        
        // History elements
        this.historyContainer = document.getElementById('historyContainer');
        this.historyCount = document.getElementById('historyCount');
        this.refreshHistoryBtn = document.getElementById('refreshHistoryBtn');
        this.exportHistoryBtn = document.getElementById('exportHistoryBtn');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
    }

    attachEventListeners() {
        // Mode selection
        this.modeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.handleModeChange(btn));
        });
        
        // Scan buttons
        this.scanUrlBtn.addEventListener('click', () => this.handleScanUrl());
        this.scanHtmlBtn.addEventListener('click', () => this.handleScanHtml());
        this.analyzeWithAIBtn.addEventListener('click', () => this.handleAnalyzeWithAI());
        this.generateAllBtn.addEventListener('click', () => this.handleGenerateAll());
        
        // Style selection
        this.styleCards.forEach(card => {
            card.addEventListener('click', () => this.handleStyleSelection(card));
        });

        // Subject input
        this.subjectInput.addEventListener('input', () => this.validateForm());

        // Template selection
        this.templateSelect.addEventListener('change', () => {
            const templateId = this.templateSelect.value;
            if (templateId) {
                promptGenerator.setTemplate(templateId);
            }
        });

        // Generate prompt button
        this.generatePromptBtn.addEventListener('click', () => this.handleGeneratePrompt());

        // Copy prompt button
        this.copyPromptBtn.addEventListener('click', () => this.handleCopyPrompt());

        // Edit prompt button
        this.editPromptBtn.addEventListener('click', () => this.handleEditPrompt());

        // Generate image button
        this.generateImageBtn.addEventListener('click', () => this.handleGenerateImage());

        // API key input
        this.apiKeyInput.addEventListener('input', () => this.handleApiKeyChange());
        
        // History buttons
        this.refreshHistoryBtn.addEventListener('click', () => this.refreshHistory());
        this.exportHistoryBtn.addEventListener('click', () => imageStorage.exportHistory());
        this.clearHistoryBtn.addEventListener('click', () => this.handleClearHistory());

        // Download image button
        this.downloadImageBtn.addEventListener('click', () => this.handleDownloadImage());

        // New generation button
        this.newGenerationBtn.addEventListener('click', () => this.handleNewGeneration());
    }

    loadSavedApiKey() {
        if (this.apiKey) {
            this.apiKeyInput.value = this.apiKey;
        }
    }

    async waitForDataLoad() {
        try {
            this.showLoading('Chargement des styles...');
            await dataLoadingPromise;
            this.dataLoaded = true;
            this.hideLoading();
            console.log('Data loaded successfully in app');
            
            // Charger l'historique
            this.refreshHistory();
        } catch (error) {
            this.hideLoading();
            this.showMessage('Erreur: Impossible de charger les données de style. Assurez-vous d\'utiliser un serveur web local (ex: python -m http.server 8000)', 'error');
            console.error('Data loading error:', error);
        }
    }

    handleStyleSelection(selectedCard) {
        if (!this.dataLoaded) {
            this.showMessage('Veuillez patienter, les données de style sont en cours de chargement...', 'error');
            return;
        }

        // Désélectionner toutes les cartes
        this.styleCards.forEach(card => card.classList.remove('selected'));
        
        // Sélectionner la carte cliquée
        selectedCard.classList.add('selected');
        
        const style = selectedCard.dataset.style;
        this.selectedStyle = style;
        promptGenerator.setStyle(style);

        // Charger les templates pour ce style
        this.loadTemplates(style);
        
        // Activer le select de template
        this.templateSelect.disabled = false;

        // Valider le formulaire
        this.validateForm();
    }

    loadTemplates(styleVersion) {
        const templates = getTemplatesForStyle(styleVersion);
        
        // Vider le select
        this.templateSelect.innerHTML = '<option value="">Aucun (création libre)</option>';
        
        // Ajouter les templates
        templates.forEach(template => {
            const option = document.createElement('option');
            option.value = template.id;
            option.textContent = template.section;
            this.templateSelect.appendChild(option);
        });
    }

    validateForm() {
        const hasStyle = this.selectedStyle !== null;
        const hasSubject = this.subjectInput.value.trim().length > 0;
        
        this.generatePromptBtn.disabled = !(hasStyle && hasSubject);
    }

    async handleGeneratePrompt() {
        if (!this.dataLoaded) {
            this.showMessage('Les données de style ne sont pas encore chargées. Veuillez patienter...', 'error');
            return;
        }

        const subject = this.subjectInput.value.trim();
        promptGenerator.setSubject(subject);

        try {
            this.showLoading('Génération du prompt optimisé...');

            // Si l'utilisateur a fourni une clé API, utiliser GPT pour enrichir le prompt
            if (this.apiKey) {
                try {
                    this.generatedPrompt = await promptGenerator.generateEnrichedPromptWithAI(this.apiKey);
                    this.showMessage('Prompt optimisé généré avec l\'IA !', 'success');
                } catch (error) {
                    console.error('Error with AI enrichment:', error);
                    // Fallback au prompt de base si l'enrichissement échoue
                    this.generatedPrompt = promptGenerator.generatePrompt();
                    this.showMessage('Prompt de base généré (erreur lors de l\'enrichissement IA)', 'error');
                }
            } else {
                // Utiliser le générateur de base
                this.generatedPrompt = promptGenerator.generatePrompt();
                this.showMessage('Prompt généré ! Ajoutez une clé API pour l\'enrichir avec l\'IA.', 'success');
            }

            // Afficher le prompt
            this.displayPrompt(this.generatedPrompt);

        } catch (error) {
            console.error('Error generating prompt:', error);
            this.showMessage(`Erreur: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    displayPrompt(prompt) {
        this.generatedPromptDiv.textContent = prompt;
        this.promptSection.style.display = 'block';
        
        // Scroll vers la section
        this.promptSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    handleCopyPrompt() {
        navigator.clipboard.writeText(this.generatedPrompt)
            .then(() => {
                this.showMessage('Prompt copié dans le presse-papiers !', 'success');
            })
            .catch(err => {
                console.error('Error copying prompt:', err);
                this.showMessage('Erreur lors de la copie', 'error');
            });
    }

    handleEditPrompt() {
        // Rendre le prompt éditable
        const currentPrompt = this.generatedPromptDiv.textContent;
        
        const textarea = document.createElement('textarea');
        textarea.value = currentPrompt;
        textarea.style.width = '100%';
        textarea.style.minHeight = '200px';
        textarea.style.fontFamily = 'Monaco, Menlo, Courier New, monospace';
        textarea.style.fontSize = '0.9rem';
        textarea.style.padding = '1rem';
        textarea.style.border = '2px solid var(--primary-blue)';
        textarea.style.borderRadius = '8px';

        this.generatedPromptDiv.innerHTML = '';
        this.generatedPromptDiv.appendChild(textarea);

        // Changer le bouton en "Valider"
        this.editPromptBtn.innerHTML = '<span class="btn-icon">✅</span> Valider';
        this.editPromptBtn.onclick = () => {
            this.generatedPrompt = textarea.value;
            this.displayPrompt(this.generatedPrompt);
            this.editPromptBtn.innerHTML = '<span class="btn-icon">✏️</span> Modifier le prompt';
            this.editPromptBtn.onclick = () => this.handleEditPrompt();
        };
    }

    async handleGenerateImage() {
        if (!this.apiKey) {
            this.showMessage('Veuillez configurer votre clé API OpenAI', 'error');
            return;
        }

        if (!this.generatedPrompt) {
            this.showMessage('Veuillez d\'abord générer un prompt', 'error');
            return;
        }

        try {
            this.showLoading('Génération de l\'image en cours...');

            // Utiliser la fonction generateImage() améliorée
            this.generatedImageUrl = await this.generateImage(this.generatedPrompt);

            // Afficher l'image
            this.displayImage(this.generatedImageUrl);
            this.showMessage('Image générée avec succès !', 'success');

        } catch (error) {
            console.error('Error generating image:', error);
            this.showMessage(`Erreur: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    displayImage(imageUrl) {
        this.generatedImage.src = imageUrl;
        this.resultSection.style.display = 'block';
        
        // Scroll vers la section
        this.resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    async handleDownloadImage() {
        try {
            const subject = this.subjectInput.value.trim() || 'image';
            
            await imageStorage.downloadImageOrganized(this.generatedImageUrl, {
                style: this.selectedStyle,
                subject: subject,
                prompt: this.generatedPrompt,
                model: this.modelSelect.value,
                size: this.sizeSelect.value,
                quality: this.qualitySelect?.value || 'standard',
                mode: 'manual'
            });

            this.showMessage('Image téléchargée et ajoutée à l\'historique !', 'success');
            this.refreshHistory();
        } catch (error) {
            console.error('Error downloading image:', error);
            this.showMessage('Erreur lors du téléchargement', 'error');
        }
    }

    handleNewGeneration() {
        this.resultSection.style.display = 'none';
        this.generatedImageUrl = null;
        this.subjectInput.focus();
    }

    handleApiKeyChange() {
        const newKey = this.apiKeyInput.value.trim();
        this.apiKey = newKey;
        localStorage.setItem('openai_api_key', newKey);
    }

    showLoading(message = 'Chargement...') {
        this.loadingMessage.textContent = message;
        this.loadingOverlay.style.display = 'flex';
    }

    hideLoading() {
        this.loadingOverlay.style.display = 'none';
    }

    showMessage(message, type = 'success') {
        this.messageText.textContent = message;
        this.messageBox.className = `message-box ${type}`;
        this.messageBox.style.display = 'block';

        setTimeout(() => {
            this.messageBox.style.display = 'none';
        }, 5000);
    }

    // ==================== FONCTIONS MODE SCAN ====================

    handleModeChange(selectedBtn) {
        // Mettre à jour les boutons
        this.modeButtons.forEach(btn => btn.classList.remove('active'));
        selectedBtn.classList.add('active');

        const mode = selectedBtn.dataset.mode;

        // Afficher la section appropriée
        if (mode === 'manual') {
            this.manualSection.style.display = 'block';
            this.scanSection.style.display = 'none';
        } else if (mode === 'scan') {
            this.manualSection.style.display = 'none';
            this.scanSection.style.display = 'block';
        }
    }

    async handleScanUrl() {
        const url = this.urlInput.value.trim();
        
        if (!url) {
            this.showMessage('Veuillez entrer une URL', 'error');
            return;
        }

        try {
            this.showLoading('Scan de la page en cours...');
            await pageScanner.scanURL(url);
            this.displayScannedSections();
            this.showMessage('Page scannée avec succès !', 'success');
        } catch (error) {
            console.error('Error scanning URL:', error);
            this.showMessage(`Erreur: ${error.message}. Essayez l'option 2 (coller le HTML).`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async handleScanHtml() {
        const html = this.htmlInput.value.trim();
        
        if (!html) {
            this.showMessage('Veuillez coller du HTML', 'error');
            return;
        }

        try {
            this.showLoading('Analyse du HTML...');
            pageScanner.scanText(html);
            this.displayScannedSections();
            this.showMessage('HTML analysé avec succès !', 'success');
        } catch (error) {
            console.error('Error scanning HTML:', error);
            this.showMessage(`Erreur: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    displayScannedSections() {
        const sections = pageScanner.getScannedContent();
        
        if (!sections || sections.length === 0) {
            this.showMessage('Aucune section trouvée dans cette page', 'error');
            return;
        }

        this.sectionsFound.innerHTML = '';
        
        sections.forEach((section, index) => {
            const card = document.createElement('div');
            card.className = 'section-card';
            card.innerHTML = `
                <h4>${section.title}</h4>
                <div class="section-info">
                    Section ${index + 1} • ${section.hasImage ? '✅ A déjà une image' : '❌ Pas d\'image'}
                </div>
                <div class="section-preview">${section.content.substring(0, 150)}...</div>
            `;
            this.sectionsFound.appendChild(card);
        });

        this.scanResults.style.display = 'block';
    }

    async handleAnalyzeWithAI() {
        if (!this.apiKey) {
            this.showMessage('Veuillez configurer votre clé API OpenAI', 'error');
            return;
        }

        if (!this.selectedStyle) {
            this.showMessage('Veuillez d\'abord sélectionner un style visuel (dans la section "Création manuelle")', 'error');
            return;
        }

        try {
            this.showLoading('Analyse intelligente avec l\'IA...');
            const suggestions = await pageScanner.analyzeSectionsWithAI(this.apiKey, this.selectedStyle);
            this.displaySuggestions(suggestions);
            this.showMessage(`${suggestions.length} suggestion(s) générée(s) !`, 'success');
        } catch (error) {
            console.error('Error analyzing with AI:', error);
            this.showMessage(`Erreur: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    displaySuggestions(suggestions) {
        if (!suggestions || suggestions.length === 0) {
            this.showMessage('L\'IA n\'a trouvé aucune section nécessitant d\'image', 'error');
            return;
        }

        this.suggestionsContainer.innerHTML = '';

        suggestions.forEach((suggestion, index) => {
            const card = document.createElement('div');
            card.className = 'suggestion-card selected';
            card.dataset.index = index;
            
            card.innerHTML = `
                <div class="suggestion-header">
                    <input type="checkbox" class="suggestion-checkbox" checked data-index="${index}">
                    <div class="suggestion-content">
                        <div class="suggestion-title">
                            ${suggestion.sectionTitle}
                            <span class="suggestion-priority ${suggestion.priority}">${suggestion.priority.toUpperCase()}</span>
                        </div>
                        <div class="suggestion-reason">💡 ${suggestion.reason}</div>
                        <div class="suggestion-subject">
                            <strong>Sujet :</strong> ${suggestion.imageSubject}
                        </div>
                        <div class="suggestion-actions">
                            <button class="btn-secondary generate-single-btn" data-index="${index}">
                                <span class="btn-icon">🖼️</span>
                                Générer cette image
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // Gérer la sélection de la checkbox
            const checkbox = card.querySelector('.suggestion-checkbox');
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    card.classList.add('selected');
                } else {
                    card.classList.remove('selected');
                }
            });

            // Générer une seule image
            const generateBtn = card.querySelector('.generate-single-btn');
            generateBtn.addEventListener('click', () => this.handleGenerateSingle(index));

            this.suggestionsContainer.appendChild(card);
        });

        this.imageSuggestions.style.display = 'block';
    }

    async handleGenerateSingle(index) {
        const suggestions = pageScanner.getSuggestions();
        const suggestion = suggestions[index];

        try {
            this.showLoading('Génération de l\'image...');
            
            const prompt = pageScanner.generatePromptForSuggestion(suggestion, this.selectedStyle);
            const imageUrl = await this.generateImage(prompt);
            
            // Télécharger avec organisation (ne bloque pas en cas d'erreur CORS)
            try {
                await imageStorage.downloadImageOrganized(imageUrl, {
                    style: this.selectedStyle,
                    subject: suggestion.imageSubject,
                    prompt: prompt,
                    model: this.modelSelect.value,
                    size: this.sizeSelect.value,
                    quality: this.qualitySelect?.value || 'standard',
                    mode: 'scan',
                    section: suggestion.sectionTitle
                });
                this.showMessage('Image générée et ajoutée à l\'historique !', 'success');
            } catch (downloadError) {
                console.warn('Téléchargement automatique échoué, mais image générée:', downloadError);
                this.showMessage('Image générée ! (Clic droit sur l\'URL dans la console pour télécharger)', 'success');
                console.log('🖼️ URL de l\'image:', imageUrl);
            }
            
            this.refreshHistory();
        } catch (error) {
            console.error('Error generating single image:', error);
            this.showMessage(`Erreur: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async handleGenerateAll() {
        const checkboxes = document.querySelectorAll('.suggestion-checkbox:checked');
        
        if (checkboxes.length === 0) {
            this.showMessage('Veuillez sélectionner au moins une image', 'error');
            return;
        }

        if (!this.apiKey) {
            this.showMessage('Veuillez configurer votre clé API OpenAI', 'error');
            return;
        }

        const suggestions = pageScanner.getSuggestions();
        const selectedSuggestions = Array.from(checkboxes).map(cb => suggestions[parseInt(cb.dataset.index)]);

        try {
            this.showLoading(`Génération de ${selectedSuggestions.length} image(s)...`);

            for (let i = 0; i < selectedSuggestions.length; i++) {
                const suggestion = selectedSuggestions[i];
                this.loadingMessage.textContent = `Génération ${i + 1}/${selectedSuggestions.length}: ${suggestion.sectionTitle}`;

                const prompt = pageScanner.generatePromptForSuggestion(suggestion, this.selectedStyle);
                const imageUrl = await this.generateImage(prompt);
                
                // Télécharger avec organisation
                await imageStorage.downloadImageOrganized(imageUrl, {
                    style: this.selectedStyle,
                    subject: suggestion.imageSubject,
                    prompt: prompt,
                    model: this.modelSelect.value,
                    size: this.sizeSelect.value,
                    quality: this.qualitySelect?.value || 'standard',
                    mode: 'scan',
                    section: suggestion.sectionTitle,
                    batchIndex: i + 1
                });
                
                // Attendre un peu entre chaque génération pour éviter les rate limits
                if (i < selectedSuggestions.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }

            this.showMessage(`${selectedSuggestions.length} image(s) générée(s) et téléchargée(s) !`, 'success');
            this.refreshHistory();
        } catch (error) {
            console.error('Error generating all images:', error);
            this.showMessage(`Erreur: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async generateImage(prompt) {
        if (!this.apiKey) {
            throw new Error('Clé API OpenAI manquante. Configurez-la dans config.js ou dans les paramètres.');
        }

        const model = this.modelSelect.value;
        const size = this.sizeSelect.value;

        console.log('🎨 Génération image avec:', { model, size, promptLength: prompt.length, apiKeyLength: this.apiKey.length });

        // Vérifier la compatibilité taille/modèle
        if (model === 'dall-e-2' && (size === '1792x1024' || size === '1024x1792')) {
            throw new Error('DALL-E 2 ne supporte que 1024x1024, 512x512 ou 256x256. Utilisez DALL-E 3 ou changez la taille.');
        }

        // Limiter la longueur du prompt
        let finalPrompt = prompt;
        if (finalPrompt.length > 4000) {
            console.warn('⚠️ Prompt trop long, truncation à 4000 caractères');
            finalPrompt = prompt.substring(0, 4000);
        }

        // Construction du body selon le modèle
        const requestBody = {
            model: model,
            prompt: finalPrompt,
            n: 1,
            size: size
        };

        // DALL-E 3 supporte quality, DALL-E 2 non
        if (model === 'dall-e-3') {
            const quality = this.qualitySelect?.value || 'standard';
            requestBody.quality = quality;
        }

        console.log('📦 Request body:', requestBody);

        try {
            const response = await fetch('https://api.openai.com/v1/images/generations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            console.log('📡 Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Erreur API OpenAI (texte brut):', errorText);
                
                let errorMessage = 'Erreur lors de la génération de l\'image';
                try {
                    const error = JSON.parse(errorText);
                    console.error('❌ Erreur API OpenAI (JSON):', error);
                    errorMessage = error.error?.message || errorMessage;
                } catch (e) {
                    errorMessage = `Erreur ${response.status}: ${errorText}`;
                }
                
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('✅ Image générée avec succès!');
            return data.data[0].url;
        } catch (error) {
            console.error('💥 Erreur complète:', error);
            console.error('💥 Erreur name:', error.name);
            console.error('💥 Erreur message:', error.message);
            console.error('💥 Erreur stack:', error.stack);
            
            if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
                throw new Error('Impossible de contacter l\'API OpenAI. Causes possibles:\n- Pas de connexion internet\n- Firewall/Antivirus bloque la requête\n- Problème de CORS (utilisez http://localhost:8000)\n\nOuvrez la console (F12) pour plus de détails.');
            }
            throw error;
        }
    }

    async downloadImageWithName(imageUrl, filename) {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    // ==================== FONCTIONS HISTORIQUE ====================

    refreshHistory() {
        const history = imageStorage.getHistoryByDate();
        const dates = Object.keys(history).sort().reverse(); // Plus récent en premier
        
        this.historyCount.textContent = imageStorage.getHistory().length;
        
        if (dates.length === 0) {
            this.historyContainer.innerHTML = '<p class="help-text">Aucune image générée pour le moment</p>';
            return;
        }

        this.historyContainer.innerHTML = '';

        dates.forEach(date => {
            const dateSection = document.createElement('div');
            dateSection.className = 'history-date-section';
            
            const dateHeader = document.createElement('h4');
            dateHeader.className = 'history-date-header';
            dateHeader.textContent = `📅 ${date} (${history[date].length} image${history[date].length > 1 ? 's' : ''})`;
            dateSection.appendChild(dateHeader);

            const imagesGrid = document.createElement('div');
            imagesGrid.className = 'history-images-grid';

            history[date].forEach(entry => {
                const card = document.createElement('div');
                card.className = 'history-image-card';
                
                card.innerHTML = `
                    <div class="history-image-info">
                        <div class="history-time">${entry.time}</div>
                        <div class="history-style-badge">${entry.style || 'N/A'}</div>
                    </div>
                    <div class="history-subject">${entry.subject}</div>
                    <div class="history-meta">
                        <span>${entry.model || 'N/A'}</span> • <span>${entry.size || 'N/A'}</span>
                    </div>
                    <div class="history-actions">
                        <button class="btn-icon-small view-prompt-btn" data-id="${entry.id}" title="Voir le prompt">
                            👁️
                        </button>
                        <button class="btn-icon-small delete-entry-btn" data-id="${entry.id}" title="Supprimer">
                            🗑️
                        </button>
                    </div>
                `;

                // Voir le prompt
                card.querySelector('.view-prompt-btn').addEventListener('click', () => {
                    alert(`Prompt :\n\n${entry.prompt || 'Non disponible'}`);
                });

                // Supprimer l'entrée
                card.querySelector('.delete-entry-btn').addEventListener('click', () => {
                    if (confirm('Supprimer cette entrée de l\'historique ?')) {
                        imageStorage.deleteEntry(entry.id);
                        this.refreshHistory();
                        this.showMessage('Entrée supprimée', 'success');
                    }
                });

                imagesGrid.appendChild(card);
            });

            dateSection.appendChild(imagesGrid);
            this.historyContainer.appendChild(dateSection);
        });
    }

    handleClearHistory() {
        if (confirm('Voulez-vous vraiment vider tout l\'historique ? Cette action est irréversible.')) {
            imageStorage.clearHistory();
            this.refreshHistory();
            this.showMessage('Historique vidé', 'success');
        }
    }
}

// Initialiser l'application quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    const app = new ImageGeneratorApp();
    console.log('Image Generator App initialized');
});
