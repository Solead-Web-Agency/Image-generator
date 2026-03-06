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
        this.currentMode = null; // 'manual', 'scan', 'csv'
        this.currentStyleSource = 'preset'; // 'preset', 'website', 'upload', 'library'
        this.currentLibrary = 'pexels'; // Default to Pexels (Unsplash temporarily disabled)
        this.selectedLibraryImages = [];
        this.librarySearchResults = [];
        this.scannedStyleData = null;
        this.scannedStyleUrl = null;
        this.customStyleData = null;
        this.selectedSections = new Set(); // Track selected sections for page scanner
        this.useServerKeys = false; // Sera mis à true si les clés sont configurées côté serveur
        
        // Pour le sélecteur de couleurs du scanner de style
        this.allScannedColors = [];
        this.allScannedFonts = [];
        this.selectedColors = [];

        this.initializeElements();
        this.attachEventListeners();
        this.loadSavedApiKey();
        this.checkServerConfig(); // Vérifier si les clés sont configurées côté serveur
        this.waitForDataLoad();
    }

    initializeElements() {
        // Global accordion steps
        this.globalSteps = {
            step1: document.getElementById('globalStep1'),
            step2: document.getElementById('globalStep2'),
            step3: document.getElementById('globalStep3'),
            step4: document.getElementById('globalStep4'),
            step5: document.getElementById('globalStep5')
        };
        
        // Mode buttons
        this.modeButtons = document.querySelectorAll('.mode-btn');
        
        // Mode content containers
        this.manualContent = document.getElementById('manualContent');
        this.scanContent = document.getElementById('scanContent');
        this.csvContent = document.getElementById('csvContent');
        this.fromImagesContent = document.getElementById('fromImagesContent');
        
        // From Images elements
        this.imagesScanUrl = document.getElementById('imagesScanUrl');
        this.scanPageImagesBtn = document.getElementById('scanPageImagesBtn');
        this.scannedImagesResults = document.getElementById('scannedImagesResults');
        this.imagesGrid = document.getElementById('imagesGrid');
        this.imagesFoundCount = document.getElementById('imagesFoundCount');
        this.imagesSelectedCount = document.getElementById('imagesSelectedCount');
        this.imagesModificationPrompt = document.getElementById('imagesModificationPrompt');
        this.modifySelectedImagesBtn = document.getElementById('modifySelectedImagesBtn');
        this.selectedImages = [];
        this.scannedImages = [];
        
        // Scan elements
        this.urlInput = document.getElementById('urlInput');
        this.htmlInput = document.getElementById('htmlInput');
        this.scanUrlBtn = document.getElementById('scanUrlBtn');
        this.scanHtmlBtn = document.getElementById('scanHtmlBtn');
        this.scanResults = document.getElementById('scanResults');
        this.sectionsGrid = document.getElementById('sectionsGrid'); // Updated for new UI
        this.imageSuggestions = document.getElementById('imageSuggestions');
        this.suggestionsContainer = document.getElementById('suggestionsContainer');
        this.generateAllBtn = document.getElementById('generateAllBtn');
        
        // CSV elements
        this.csvFileInput = document.getElementById('csvFileInput');
        this.csvTextInput = document.getElementById('csvTextInput');
        this.parseCSVBtn = document.getElementById('parseCSVBtn');
        this.csvPreview = document.getElementById('csvPreview');
        this.csvTable = document.getElementById('csvTable');
        this.csvRowCount = document.getElementById('csvRowCount');
        this.csvColCount = document.getElementById('csvColCount');
        this.csvImgCount = document.getElementById('csvImgCount');
        this.analyzeCSVBtn = document.getElementById('analyzeCSVBtn');
        this.csvImageTasks = document.getElementById('csvImageTasks');
        this.csvTasksContainer = document.getElementById('csvTasksContainer');
        this.generateCSVImagesBtn = document.getElementById('generateCSVImagesBtn');
        this.exportCSVBtn = document.getElementById('exportCSVBtn');
        
        this.csvTasks = [];
        
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
        // Global accordion headers (géré par accordion-manager.js)
        
        // Mode selection
        this.modeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.handleModeChange(btn));
        });
        
        // Manual mode
        if (this.generatePromptBtn) {
            this.generatePromptBtn.addEventListener('click', () => this.handleGeneratePrompt());
        }
        
        // Scan tabs
        document.querySelectorAll('.scan-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                
                // Update buttons
                document.querySelectorAll('.scan-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update content
                document.querySelectorAll('.scan-tab-content').forEach(c => c.classList.remove('active'));
                document.getElementById(tab + 'Tab').classList.add('active');
            });
        });
        
        // Scan buttons
        this.scanUrlBtn.addEventListener('click', () => this.handleScanUrl());
        this.scanHtmlBtn.addEventListener('click', () => this.handleScanHtml());
        // Note: analyzeSelectedBtn is now attached dynamically in displayScannedSections()
        this.generateAllBtn.addEventListener('click', () => this.handleGenerateAll());
        
        // CSV buttons
        this.csvFileInput.addEventListener('change', (e) => this.handleCSVFileUpload(e));
        this.parseCSVBtn.addEventListener('click', () => this.handleParseCSV());
        this.analyzeCSVBtn.addEventListener('click', () => this.handleAnalyzeCSV());
        this.generateCSVImagesBtn.addEventListener('click', () => this.handleGenerateCSVImages());
        
        // From Images buttons
        if (this.scanPageImagesBtn) {
            this.scanPageImagesBtn.addEventListener('click', () => this.handleScanPageImages());
        }
        if (this.modifySelectedImagesBtn) {
            this.modifySelectedImagesBtn.addEventListener('click', () => this.handleModifySelectedImages());
        }
        this.exportCSVBtn.addEventListener('click', () => this.handleExportCSV());
        
        // Style source selector
        document.querySelectorAll('.style-source-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleStyleSourceChange(btn));
        });
        
        // Style selection (presets)
        this.styleCards.forEach(card => {
            card.addEventListener('click', () => this.handleStyleSelection(card));
        });
        
        // Website style scanner
        const scanWebsiteStyleBtn = document.getElementById('scanWebsiteStyleBtn');
        if (scanWebsiteStyleBtn) {
            scanWebsiteStyleBtn.addEventListener('click', () => this.handleScanWebsiteStyle());
        }
        
        // Upload style files
        const styleUploadZone = document.getElementById('styleUploadZone');
        const styleFilesInput = document.getElementById('styleFilesInput');
        if (styleUploadZone && styleFilesInput) {
            styleUploadZone.addEventListener('click', () => styleFilesInput.click());
            styleFilesInput.addEventListener('change', (e) => this.handleStyleFilesUpload(e));
            
            // Drag & drop
            styleUploadZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                styleUploadZone.style.borderColor = 'var(--primary-blue)';
            });
            styleUploadZone.addEventListener('dragleave', () => {
                styleUploadZone.style.borderColor = 'var(--border-color)';
            });
            styleUploadZone.addEventListener('drop', (e) => {
                e.preventDefault();
                styleUploadZone.style.borderColor = 'var(--border-color)';
                this.handleStyleFilesDrop(e);
            });
        }
        
        // Library search
        const librarySearchBtn = document.getElementById('librarySearchBtn');
        const librarySearchInput = document.getElementById('librarySearchInput');
        if (librarySearchBtn && librarySearchInput) {
            librarySearchBtn.addEventListener('click', () => this.handleLibrarySearch());
            librarySearchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleLibrarySearch();
            });
        }
        
        // Library tabs
        document.querySelectorAll('.library-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Bloquer si désactivé
                if (btn.disabled || btn.classList.contains('disabled')) {
                    this.showMessage('⚠️ Unsplash est temporairement indisponible. Utilisez Pexels !', 'error');
                    return;
                }
                
                document.querySelectorAll('.library-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentLibrary = btn.dataset.library;
            });
        });

        // Subject input
        if (this.subjectInput) {
            this.subjectInput.addEventListener('input', () => this.validateForm());
        }

        // Template selection
        if (this.templateSelect) {
            this.templateSelect.addEventListener('change', () => {
                const templateId = this.templateSelect.value;
                if (templateId) {
                    promptGenerator.setTemplate(templateId);
                }
            });
        }

        // Generate prompt button
        if (this.generatePromptBtn) {
            this.generatePromptBtn.addEventListener('click', () => this.handleGeneratePrompt());
        }

        // Copy prompt button
        if (this.copyPromptBtn) {
            this.copyPromptBtn.addEventListener('click', () => this.handleCopyPrompt());
        }

        // Edit prompt button
        if (this.editPromptBtn) {
            this.editPromptBtn.addEventListener('click', () => this.handleEditPrompt());
        }

        // Generate image button
        if (this.generateImageBtn) {
            this.generateImageBtn.addEventListener('click', () => this.handleGenerateImage());
        }

        // API key input
        this.apiKeyInput.addEventListener('input', () => this.handleApiKeyChange());
        
        // History buttons
        if (this.refreshHistoryBtn) {
            this.refreshHistoryBtn.addEventListener('click', () => this.refreshHistory());
        }
        if (this.exportHistoryBtn) {
            this.exportHistoryBtn.addEventListener('click', () => imageStorage.exportHistory());
        }
        if (this.clearHistoryBtn) {
            this.clearHistoryBtn.addEventListener('click', () => this.handleClearHistory());
        }

        // Download image button
        if (this.downloadImageBtn) {
            this.downloadImageBtn.addEventListener('click', () => this.handleDownloadImage());
        }

        // New generation button
        if (this.newGenerationBtn) {
            this.newGenerationBtn.addEventListener('click', () => this.handleNewGeneration());
        }
    }

    loadSavedApiKey() {
        if (this.apiKey && this.apiKeyInput) {
            this.apiKeyInput.value = this.apiKey;
        }
    }

    async checkServerConfig() {
        try {
            const response = await fetch('/api/check-config');
            const data = await response.json();
            
            if (data.success && data.configured.openai) {
                // Les clés sont configurées côté serveur
                console.log('✅ Clés API configurées sur le serveur');
                
                // Cacher le champ de saisie et afficher un message
                const apiKeyGroup = this.apiKeyInput?.parentElement;
                if (apiKeyGroup) {
                    apiKeyGroup.style.display = 'none';
                    
                    // Ajouter un badge "Configuré sur le serveur"
                    const badge = document.createElement('div');
                    badge.className = 'server-config-badge';
                    badge.innerHTML = '✅ Clés API configurées sur le serveur';
                    badge.style.cssText = `
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 12px 20px;
                        border-radius: 8px;
                        text-align: center;
                        font-weight: 500;
                        margin-bottom: 20px;
                        box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);
                    `;
                    apiKeyGroup.parentElement.insertBefore(badge, apiKeyGroup);
                }
                
                // Forcer l'utilisation des clés serveur (pas besoin de clé locale)
                this.useServerKeys = true;
            }
        } catch (error) {
            console.log('ℹ️ Impossible de vérifier la config serveur, mode local:', error.message);
            // En cas d'erreur (ex: local sans serveur), on continue normalement
        }
    }

    async waitForDataLoad() {
        console.log('⏳ [APP] waitForDataLoad START');
        console.log('⏳ [APP] dataLoadingPromise:', dataLoadingPromise);
        
        try {
            console.log('⏳ [APP] Awaiting dataLoadingPromise...');
            const result = await dataLoadingPromise;
            console.log('✅ [APP] dataLoadingPromise resolved with:', result);
            
            this.dataLoaded = true;
            console.log('✅ [APP] this.dataLoaded set to true');
            
            // Masquer l'indicateur de chargement et afficher les cartes
            const loadingIndicator = document.getElementById('stylesLoadingIndicator');
            const styleGrid = document.getElementById('styleGridContainer');
            const step2Desc = document.getElementById('step2StatusDesc');
            
            console.log('🎨 [APP] Updating UI elements...');
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
                console.log('✅ [APP] Loading indicator hidden');
            }
            if (styleGrid) {
                styleGrid.style.display = 'grid';
                console.log('✅ [APP] Style grid displayed');
            }
            if (step2Desc) {
                step2Desc.textContent = 'Sélectionnez la direction artistique';
            }
            
            // Activer les cartes de style
            this.styleCards.forEach(card => card.classList.remove('disabled'));
            console.log('✅ [APP] Style cards enabled');
            
            // Charger l'historique
            this.refreshHistory();
            
            this.showMessage('Styles chargés avec succès ✅', 'success');
            console.log('🎉 [APP] waitForDataLoad COMPLETE');
        } catch (error) {
            console.error('❌ [APP] waitForDataLoad ERROR:', error);
            this.showMessage('Erreur: Impossible de charger les données de style. Vérifiez la console (F12)', 'error');
            
            const step2Desc = document.getElementById('step2StatusDesc');
            if (step2Desc) {
                step2Desc.textContent = '❌ Erreur de chargement';
                step2Desc.style.color = 'var(--error-red)';
            }
        }
    }

    /**
     * Affiche une étape avec animation progressive
     */
    showStepWithAnimation(stepNumber) {
        const step = this.globalSteps[`step${stepNumber}`];
        if (!step) return;
        
        // Si déjà visible, ne rien faire
        if (step.style.display !== 'none') return;
        
        // Afficher avec animation
        step.style.display = 'block';
        step.classList.add('step-appear');
        
        // Retirer la classe d'animation après l'animation (pour réutilisation future)
        setTimeout(() => {
            step.classList.remove('step-appear');
        }, 500);
    }

    handleStyleSelection(selectedCard) {
        console.log('🎨 handleStyleSelection called - this.dataLoaded =', this.dataLoaded);
        if (!this.dataLoaded) {
            console.warn('⚠️ Data not loaded yet!');
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
        if (this.templateSelect) {
            this.templateSelect.disabled = false;
        }

        // Valider le formulaire
        this.validateForm();
        
        this.showMessage(`Style ${style} sélectionné ✅`, 'success');
        
        // Afficher l'étape 3 avec animation
        this.showStepWithAnimation(3);
        
        // Compléter l'étape 2 et passer à l'étape 3
        console.log('🔄 Calling accordionManager.completeStep(2)...');
        if (typeof accordionManager !== 'undefined') {
            accordionManager.completeStep(2);
            console.log('✅ Step 2 completed, should open step 3');
        } else {
            console.error('❌ accordionManager is undefined!');
        }
    }

    loadTemplates(styleVersion) {
        if (!this.templateSelect) {
            console.log('⚠️ templateSelect not found, skipping loadTemplates');
            return;
        }
        
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
        if (!this.subjectInput || !this.generatePromptBtn) {
            console.log('⚠️ Form elements not found, skipping validateForm');
            return;
        }
        
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
        
        // Afficher l'étape 4 avec animation
        this.showStepWithAnimation(4);
        
        // Scroll vers la section
        this.promptSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Compléter l'étape 3 et ouvrir l'étape 4
        if (typeof accordionManager !== 'undefined') {
            accordionManager.completeStep(3);
        }
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
        // Utiliser la variable stockée plutôt que le textContent du div
        const currentPrompt = this.generatedPrompt || this.generatedPromptDiv.textContent || '';
        
        if (!currentPrompt) {
            this.showMessage('Aucun prompt à modifier', 'error');
            return;
        }
        
        const textarea = document.createElement('textarea');
        textarea.className = 'prompt-editor';
        textarea.value = currentPrompt;
        textarea.style.width = '100%';
        textarea.style.minHeight = '200px';
        textarea.style.fontFamily = 'Monaco, Menlo, Courier New, monospace';
        textarea.style.fontSize = '0.9rem';
        textarea.style.padding = '1rem';
        textarea.style.border = '2px solid var(--primary-blue)';
        textarea.style.borderRadius = '8px';
        textarea.style.backgroundColor = 'var(--white)';
        textarea.style.color = 'var(--text-dark)';
        textarea.style.resize = 'vertical';

        this.generatedPromptDiv.innerHTML = '';
        this.generatedPromptDiv.appendChild(textarea);
        
        // Focus sur le textarea
        textarea.focus();

        // Changer le bouton en "Valider"
        this.editPromptBtn.innerHTML = '<span class="btn-icon">✅</span> Valider les modifications';
        this.editPromptBtn.classList.add('btn-success');
        this.editPromptBtn.onclick = () => {
            const newPrompt = textarea.value.trim();
            
            if (!newPrompt) {
                this.showMessage('Le prompt ne peut pas être vide', 'error');
                return;
            }
            
            // Mettre à jour le prompt
            this.generatedPrompt = newPrompt;
            
            // Vider le textarea et remettre le texte
            this.generatedPromptDiv.innerHTML = '';
            this.generatedPromptDiv.textContent = newPrompt;
            
            // Restaurer le bouton
            this.editPromptBtn.innerHTML = '<span class="btn-icon">✏️</span> Modifier le prompt';
            this.editPromptBtn.classList.remove('btn-success');
            this.editPromptBtn.onclick = () => this.handleEditPrompt();
            
            this.showMessage('✅ Prompt modifié avec succès !', 'success');
        };
    }

    async handleGenerateImage() {
        if (!this.apiKey && !this.useServerKeys) {
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

            // Sauvegarder automatiquement sur le serveur
            const subject = this.subjectInput.value.trim() || 'image';
            const metadata = {
                style: this.selectedStyle,
                subject: subject,
                prompt: this.generatedPrompt,
                model: this.modelSelect.value,
                size: this.sizeSelect.value,
                quality: this.qualitySelect?.value || 'standard',
                mode: 'manual'
            };

            this.loadingMessage.textContent = 'Sauvegarde de l\'image...';
            const saveResult = await APIClient.saveImage(this.generatedImageUrl, metadata);
            
            // Ajouter à l'historique avec le chemin local
            imageStorage.addToHistory({
                imageUrl: saveResult.path, // Chemin local permanent
                originalUrl: this.generatedImageUrl, // URL OpenAI temporaire
                filename: saveResult.filename,
                ...metadata
            });

            // Afficher l'image
            this.displayImage(this.generatedImageUrl);
            this.showMessage('Image générée et sauvegardée !', 'success');
            this.refreshHistory();

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
        
        // Afficher l'étape 5 avec animation
        this.showStepWithAnimation(5);
        
        // Scroll vers la section
        this.resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Compléter l'étape 4 et ouvrir l'étape 5
        if (typeof accordionManager !== 'undefined') {
            accordionManager.completeStep(4);
        }
    }

    async handleDownloadImage() {
        try {
            const subject = this.subjectInput.value.trim() || 'image';
            const metadata = {
                style: this.selectedStyle,
                subject: subject,
                prompt: this.generatedPrompt,
                model: this.modelSelect.value,
                size: this.sizeSelect.value,
                quality: this.qualitySelect?.value || 'standard',
                mode: 'manual'
            };

            // 1. Sauvegarder sur le serveur
            this.showLoading('Sauvegarde de l\'image sur le serveur...');
            const saveResult = await APIClient.saveImage(this.generatedImageUrl, metadata);
            
            // 2. Télécharger localement
            await imageStorage.downloadImageOrganized(this.generatedImageUrl, metadata, saveResult.path);

            this.hideLoading();
            this.showMessage('Image sauvegardée et téléchargée !', 'success');
            this.refreshHistory();
        } catch (error) {
            console.error('Error downloading image:', error);
            this.hideLoading();
            this.showMessage('Erreur lors du téléchargement: ' + error.message, 'error');
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
        this.currentMode = mode;

        // Cacher tous les contenus de mode
        this.manualContent.style.display = 'none';
        this.scanContent.style.display = 'none';
        this.csvContent.style.display = 'none';
        this.fromImagesContent.style.display = 'none';

        // Afficher le contenu approprié
        if (mode === 'manual') {
            this.manualContent.style.display = 'block';
        } else if (mode === 'scan') {
            this.scanContent.style.display = 'block';
        } else if (mode === 'csv') {
            this.csvContent.style.display = 'block';
        } else if (mode === 'from-images') {
            this.fromImagesContent.style.display = 'block';
        }

        // Mettre à jour le titre/description de l'étape 3
        accordionManager.updateStep3Content(mode);

        if (mode === 'from-images') {
            // Pas de style visuel pour ce mode : masquer l'étape 2 et passer directement à l'étape 3
            const step2 = document.getElementById('globalStep2');
            if (step2) {
                step2.style.display = 'none';
                step2.classList.remove('active', 'completed');
            }
            // Marquer l'étape 1 comme complète et ouvrir l'étape 3 directement
            accordionManager.completedSteps.add(1);
            const step1 = document.getElementById('globalStep1');
            if (step1) { step1.classList.add('completed'); step1.classList.remove('active'); }
            setTimeout(() => {
                this.showStepWithAnimation(3);
                accordionManager.openStep(3);
            }, 300);
        } else {
            // Modes normaux : s'assurer que l'étape 2 est visible et passer à elle
            const step2 = document.getElementById('globalStep2');
            if (step2) step2.style.display = 'block';
            this.showStepWithAnimation(2);
            accordionManager.completeStep(1);
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

        const sectionsGrid = document.getElementById('sectionsGrid');
        const sectionsTotal = document.getElementById('sectionsTotal');
        const sectionsSelected = document.getElementById('sectionsSelected');
        const analyzeBtn = document.getElementById('analyzeSelectedBtn');
        const analyzeCount = document.getElementById('analyzeCount');
        
        sectionsGrid.innerHTML = '';
        this.selectedSections = new Set(); // Track selected sections
        
        // Update stats
        sectionsTotal.textContent = `${sections.length} section${sections.length > 1 ? 's' : ''} trouvée${sections.length > 1 ? 's' : ''}`;
        sectionsSelected.textContent = '0 sélectionnée';
        analyzeBtn.disabled = true;
        analyzeCount.textContent = '0';
        
        sections.forEach((section, index) => {
            const card = document.createElement('div');
            card.className = 'section-card';
            card.dataset.index = index;
            
            card.innerHTML = `
                <div class="section-card-header">
                    <input type="checkbox" class="section-checkbox" data-index="${index}">
                    <h4 class="section-card-title">${section.title}</h4>
                </div>
                <div class="section-card-badges">
                    <span class="section-badge ${section.hasImage ? 'has-image' : 'no-image'}">
                        ${section.hasImage ? '✅ A déjà une image' : '🖼️ Sans image'}
                    </span>
                    <span class="section-badge">${section.element || 'section'}</span>
                </div>
                <p class="section-card-content">${section.content}</p>
                <div class="section-card-meta">
                    <span>Section ${index + 1}/${sections.length}</span>
                    <span>${section.content.length} caractères</span>
                </div>
                <div class="section-card-actions">
                    <button class="btn-preview-action" data-index="${index}" title="Voir l'aperçu de la section">
                        👁️ Aperçu
                    </button>
                </div>
            `;
            
            // Handle checkbox change
            const checkbox = card.querySelector('.section-checkbox');
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    card.classList.add('selected');
                    this.selectedSections.add(index);
                } else {
                    card.classList.remove('selected');
                    this.selectedSections.delete(index);
                }
                this.updateSectionSelection();
            });
            
            // Click on card also toggles checkbox (but not on action buttons)
            card.addEventListener('click', (e) => {
                if (e.target.type !== 'checkbox' && !e.target.classList.contains('btn-preview-action')) {
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change'));
                }
            });
            
            // Preview content button
            const previewBtn = card.querySelector('.btn-preview-action');
            previewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showSectionPreview(section, index + 1);
            });
            
            sectionsGrid.appendChild(card);
        });

        // Setup action buttons
        document.getElementById('selectAllSectionsBtn').onclick = () => this.selectAllSections();
        document.getElementById('deselectAllSectionsBtn').onclick = () => this.deselectAllSections();
        analyzeBtn.onclick = () => this.handleAnalyzeSelectedSections();
        
        this.scanResults.style.display = 'block';
    }
    
    updateSectionSelection() {
        const sectionsSelected = document.getElementById('sectionsSelected');
        const analyzeBtn = document.getElementById('analyzeSelectedBtn');
        const analyzeCount = document.getElementById('analyzeCount');
        
        const count = this.selectedSections.size;
        sectionsSelected.textContent = `${count} sélectionnée${count > 1 ? 's' : ''}`;
        analyzeCount.textContent = count;
        analyzeBtn.disabled = count === 0;
    }
    
    selectAllSections() {
        const checkboxes = document.querySelectorAll('.section-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = true;
            cb.dispatchEvent(new Event('change'));
        });
    }
    
    deselectAllSections() {
        const checkboxes = document.querySelectorAll('.section-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = false;
            cb.dispatchEvent(new Event('change'));
        });
    }
    
    showSectionPreview(section, sectionNumber) {
        const scannedUrl = pageScanner.scannedUrl;
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content modal-content-large">
                <div class="modal-header">
                    <h3>👁️ Aperçu: ${section.title}</h3>
                    <button class="modal-close">✕</button>
                </div>
                <div class="modal-body">
                    <div class="section-preview-modal">
                        <div class="section-meta-info">
                            <span class="meta-badge">Section ${sectionNumber}</span>
                            <span class="meta-badge">
                                ${section.hasImage ? '✅ A déjà une image' : '🖼️ Sans image'}
                            </span>
                            <span class="meta-badge">${section.element || 'section'}</span>
                            <span class="meta-badge">${section.content.length} caractères</span>
                        </div>
                        
                        ${scannedUrl ? `
                            <div class="iframe-preview-container">
                                <div class="iframe-toolbar">
                                    <span style="font-size: 0.875rem; color: var(--text-gray);">
                                        📄 Aperçu de la page complète (la section est dans cette page)
                                    </span>
                                    <a href="${scannedUrl}" target="_blank" class="btn-secondary" style="font-size: 0.875rem; padding: 0.5rem 1rem;">
                                        🔗 Ouvrir dans un nouvel onglet
                                    </a>
                                </div>
                                <div class="iframe-wrapper">
                                    <iframe 
                                        src="${scannedUrl}" 
                                        id="previewIframe"
                                        sandbox="allow-same-origin allow-scripts"
                                        loading="lazy"
                                        title="Aperçu de la page">
                                    </iframe>
                                    <div class="iframe-loading" id="iframeLoading">
                                        <div class="spinner"></div>
                                        <p>Chargement de l'aperçu...</p>
                                    </div>
                                    <div class="iframe-error" id="iframeError" style="display: none;">
                                        <p style="margin: 0 0 1rem 0;">⚠️ Impossible d'afficher l'aperçu</p>
                                        <p style="font-size: 0.875rem; color: var(--text-gray); margin: 0;">
                                            Le site bloque l'affichage en iframe (sécurité X-Frame-Options).
                                        </p>
                                        <a href="${scannedUrl}" target="_blank" class="btn-primary" style="margin-top: 1rem;">
                                            🔗 Ouvrir la page dans un nouvel onglet
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                        
                        <div class="section-full-content" style="margin-top: 2rem;">
                            <h4 style="margin-bottom: 1rem; color: var(--primary-blue);">📄 Contenu de cette section :</h4>
                            <div style="background: var(--light-bg); padding: 1.5rem; border-radius: 8px; line-height: 1.8; color: var(--text-dark);">
                                ${section.content}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Setup iframe loading/error handling
        if (scannedUrl) {
            const iframe = modal.querySelector('#previewIframe');
            const loading = modal.querySelector('#iframeLoading');
            const error = modal.querySelector('#iframeError');
            
            // Timeout pour détecter les erreurs
            const timeout = setTimeout(() => {
                loading.style.display = 'none';
                error.style.display = 'flex';
            }, 10000); // 10 secondes
            
            iframe.addEventListener('load', () => {
                clearTimeout(timeout);
                loading.style.display = 'none';
                
                // Vérifier si l'iframe est vraiment chargée ou bloquée
                try {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    if (!iframeDoc || iframeDoc.body.children.length === 0) {
                        throw new Error('Blocked');
                    }
                } catch (e) {
                    // CORS ou X-Frame-Options bloque l'accès
                    error.style.display = 'flex';
                }
            });
            
            iframe.addEventListener('error', () => {
                clearTimeout(timeout);
                loading.style.display = 'none';
                error.style.display = 'flex';
            });
        }
        
        // Close modal
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    async handleAnalyzeSelectedSections() {
        if (!this.apiKey && !this.useServerKeys) {
            this.showMessage('Veuillez configurer votre clé API OpenAI', 'error');
            return;
        }

        if (!this.selectedStyle) {
            this.showMessage('Veuillez d\'abord sélectionner un style visuel (Étape 2)', 'error');
            return;
        }
        
        if (!this.selectedSections || this.selectedSections.size === 0) {
            this.showMessage('Veuillez cocher au moins une section', 'error');
            return;
        }

        try {
            this.showLoading(`🤖 Analyse de ${this.selectedSections.size} section(s) avec l'IA...`);
            
            // Get only selected sections
            const allSections = pageScanner.getScannedContent();
            const selectedSectionsData = Array.from(this.selectedSections).map(index => allSections[index]);
            
            // Analyze with AI
            const suggestions = await pageScanner.analyzeSpecificSections(
                selectedSectionsData, 
                this.apiKey, 
                this.selectedStyle
            );
            
            this.displaySuggestions(suggestions);
            this.showMessage(`✅ ${suggestions.length} sujet${suggestions.length > 1 ? 's' : ''} d'image généré${suggestions.length > 1 ? 's' : ''} !`, 'success');
        } catch (error) {
            console.error('Error analyzing with AI:', error);
            this.showMessage(`❌ Erreur: ${error.message}`, 'error');
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
            
            const metadata = {
                style: this.selectedStyle,
                subject: suggestion.imageSubject,
                prompt: prompt,
                model: this.modelSelect.value,
                size: this.sizeSelect.value,
                quality: this.qualitySelect?.value || 'standard',
                mode: 'scan',
                section: suggestion.sectionTitle
            };

            // Sauvegarder sur le serveur
            this.loadingMessage.textContent = 'Sauvegarde de l\'image...';
            const saveResult = await APIClient.saveImage(imageUrl, metadata);
            
            // Ajouter à l'historique
            imageStorage.addToHistory({
                imageUrl: saveResult.path,
                originalUrl: imageUrl,
                filename: saveResult.filename,
                ...metadata
            });
            
            this.showMessage('Image générée et sauvegardée !', 'success');
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

        if (!this.apiKey && !this.useServerKeys) {
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
                
                const metadata = {
                    style: this.selectedStyle,
                    subject: suggestion.imageSubject,
                    prompt: prompt,
                    model: this.modelSelect.value,
                    size: this.sizeSelect.value,
                    quality: this.qualitySelect?.value || 'standard',
                    mode: 'scan',
                    section: suggestion.sectionTitle,
                    batchIndex: i + 1
                };

                // Sauvegarder sur le serveur
                this.loadingMessage.textContent = `Sauvegarde ${i + 1}/${selectedSuggestions.length}...`;
                const saveResult = await APIClient.saveImage(imageUrl, metadata);
                
                // Ajouter à l'historique
                imageStorage.addToHistory({
                    imageUrl: saveResult.path,
                    originalUrl: imageUrl,
                    filename: saveResult.filename,
                    ...metadata
                });
                
                // Attendre un peu entre chaque génération pour éviter les rate limits
                if (i < selectedSuggestions.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }

            this.showMessage(`${selectedSuggestions.length} image(s) générée(s) et sauvegardées !`, 'success');
            this.refreshHistory();
        } catch (error) {
            console.error('Error generating all images:', error);
            this.showMessage(`Erreur: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async generateImage(prompt) {
        // Récupérer provider + config depuis settingsModal si disponible
        const provider = (typeof settingsModal !== 'undefined')
            ? settingsModal.getActiveProvider()
            : 'openai';
        const clientApiKey = (typeof settingsModal !== 'undefined')
            ? settingsModal.getApiKey(provider)
            : (this.apiKey || '');

        // Si pas de clé locale et pas de clé serveur, bloquer
        if (!clientApiKey && !this.useServerKeys) {
            if (typeof settingsModal !== 'undefined') settingsModal.open(true);
            throw new Error('Clé API manquante. Configurez-la dans ⚙️ Config IA.');
        }

        const model = this.modelSelect?.value || (typeof settingsModal !== 'undefined' ? settingsModal.getModel() : 'dall-e-3');
        const size   = this.sizeSelect?.value  || (typeof settingsModal !== 'undefined' ? settingsModal.getSize()  : '1024x1024');
        const quality = this.qualitySelect?.value || (typeof settingsModal !== 'undefined' ? settingsModal.getQuality() : 'standard');

        console.log('🎨 Génération image:', { provider, model, size, quality, promptLength: prompt.length });

        const finalPrompt = prompt.length > 4000 ? prompt.substring(0, 4000) : prompt;

        // Construction du body multi-provider
        const requestBody = {
            provider,
            model,
            prompt: finalPrompt,
            size,
            quality,
            ...(clientApiKey && !this.useServerKeys ? { apiKey: clientApiKey } : {})
        };

        console.log('📦 Request body:', requestBody);

        try {
            // Utiliser notre API backend au lieu d'appeler directement OpenAI
            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            console.log('📡 Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Erreur API (texte brut):', errorText);
                
                let errorMessage = 'Erreur lors de la génération de l\'image';
                try {
                    const error = JSON.parse(errorText);
                    console.error('❌ Erreur API (JSON):', error);
                    // Support multiple error formats
                    errorMessage = error.error?.message || error.error || error.message || errorMessage;
                } catch (e) {
                    errorMessage = `Erreur ${response.status}: ${errorText}`;
                }
                
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('✅ Image générée avec succès!');
            console.log('📸 Réponse API:', data);
            
            // Le format de réponse de notre API backend est différent
            if (data.imageUrl) {
                return data.imageUrl;
            } else if (data.data && data.data[0] && data.data[0].url) {
                // Fallback pour compatibilité avec ancien format
                return data.data[0].url;
            } else {
                throw new Error('Format de réponse invalide: pas d\'URL d\'image');
            }
        } catch (error) {
            console.error('💥 Erreur complète:', error);
            console.error('💥 Erreur name:', error.name);
            console.error('💥 Erreur message:', error.message);
            console.error('💥 Erreur stack:', error.stack);
            
            if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
                throw new Error('Impossible de contacter le serveur. Causes possibles:\n- Le serveur n\'est pas démarré\n- Pas de connexion internet\n- Firewall/Antivirus bloque la requête\n\nOuvrez la console (F12) pour plus de détails.');
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
        // Trier les dates du plus récent au plus ancien (format DD/MM/YYYY → parse en timestamp)
        const parseDate = d => {
            const [day, month, year] = d.split('/');
            return new Date(`${year}-${month}-${day}`).getTime();
        };
        const dates = Object.keys(history).sort((a, b) => parseDate(b) - parseDate(a));

        // Trier chaque groupe d'images du plus récent au plus ancien
        dates.forEach(d => {
            history[d].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        });
        
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
            imagesGrid.className = 'history-gallery-grid';

            history[date].forEach(entry => {
                const card = document.createElement('div');
                card.className = 'gallery-image-card';
                
                const imageUrl = entry.imageUrl || entry.thumbnailUrl;
                
                card.innerHTML = `
                    <div class="gallery-image-wrapper">
                        ${imageUrl ? `<img src="${imageUrl}" alt="${entry.subject}" class="gallery-image" loading="lazy">` : '<div class="gallery-no-image">❌ Image expirée</div>'}
                        <div class="gallery-overlay">
                            <button class="gallery-btn view-details-btn" data-id="${entry.id}" title="Voir les détails">
                                👁️ Détails
                            </button>
                            <button class="gallery-btn download-btn" data-id="${entry.id}" title="Télécharger">
                                💾 Télécharger
                            </button>
                        </div>
                    </div>
                    <div class="gallery-info">
                        <div class="gallery-subject">${entry.subject}</div>
                        <div class="gallery-meta">
                            <span class="gallery-time">${entry.time}</span>
                            <span class="gallery-style-badge">${entry.style || 'N/A'}</span>
                        </div>
                        <button class="reprompt-btn" data-id="${entry.id}" title="Générer une nouvelle version">
                            ✨ Optimiser
                        </button>
                    </div>
                `;

                // Voir les détails (modal avec le prompt)
                card.querySelector('.view-details-btn').addEventListener('click', () => {
                    this.showImageDetails(entry);
                });

                // Optimiser / re-prompter
                card.querySelector('.reprompt-btn').addEventListener('click', () => {
                    this.openRepromptModal(entry);
                });

                // Télécharger l'image
                const downloadBtn = card.querySelector('.download-btn');
                if (imageUrl) {
                    downloadBtn.addEventListener('click', () => {
                        const a = document.createElement('a');
                        a.href = imageUrl;
                        a.download = entry.filename || `image-${entry.id}.png`;
                        a.target = '_blank';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    });
                } else {
                    downloadBtn.disabled = true;
                    downloadBtn.textContent = '❌ Expiré';
                }

                imagesGrid.appendChild(card);
            });

            dateSection.appendChild(imagesGrid);
            this.historyContainer.appendChild(dateSection);
        });
    }

    showImageDetails(entry) {
        // Créer une modal pour afficher les détails
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Détails de l'image</h3>
                    <button class="modal-close">✕</button>
                </div>
                <div class="modal-body">
                    ${entry.imageUrl ? `<img src="${entry.imageUrl}" alt="${entry.subject}" class="modal-image">` : ''}
                    <div class="modal-info">
                        <p><strong>Sujet :</strong> ${entry.subject}</p>
                        <p><strong>Style :</strong> ${entry.style}</p>
                        <p><strong>Modèle :</strong> ${entry.model} - ${entry.size}</p>
                        <p><strong>Date :</strong> ${entry.date} à ${entry.time}</p>
                        <p><strong>Mode :</strong> ${entry.mode === 'manual' ? 'Création manuelle' : 'Scanner de page'}</p>
                    </div>
                    <div class="modal-prompt">
                        <strong>Prompt :</strong>
                        <pre>${entry.prompt || 'Non disponible'}</pre>
                    </div>
                    <div class="modal-actions">
                        <button class="btn-secondary delete-from-modal" data-id="${entry.id}">
                            <span class="btn-icon">🗑️</span>
                            Supprimer
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Fermer la modal
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        // Supprimer depuis la modal
        modal.querySelector('.delete-from-modal').addEventListener('click', () => {
            if (confirm('Supprimer cette image de l\'historique ?')) {
                imageStorage.deleteEntry(entry.id);
                document.body.removeChild(modal);
                this.refreshHistory();
                this.showMessage('Image supprimée', 'success');
            }
        });
    }

    openRepromptModal(entry) {
        const imageUrl = entry.imageUrl || entry.thumbnailUrl;
        const modal = document.createElement('div');
        modal.className = 'modal-overlay reprompt-modal-overlay';
        modal.innerHTML = `
            <div class="modal-content reprompt-modal">
                <div class="modal-header">
                    <div class="reprompt-header-title">
                        <span class="reprompt-badge">✨</span>
                        <div>
                            <h3>Optimiser cette image</h3>
                            <p class="reprompt-subtitle">Décrivez les modifications souhaitées</p>
                        </div>
                    </div>
                    <button class="modal-close" id="repromptClose">✕</button>
                </div>
                <div class="reprompt-body">
                    <div class="reprompt-preview-col">
                        ${imageUrl
                            ? `<img src="${imageUrl}" alt="${entry.subject}" class="reprompt-preview-img" />`
                            : '<div class="gallery-no-image" style="height:160px;">❌ Image expirée</div>'
                        }
                        <div class="reprompt-original-meta">
                            <span class="reprompt-meta-label">Sujet original</span>
                            <span class="reprompt-meta-value">${entry.subject || '—'}</span>
                            <span class="reprompt-meta-label" style="margin-top:0.4rem;">Style</span>
                            <span class="reprompt-meta-value">${entry.style || '—'}</span>
                            <span class="reprompt-meta-label" style="margin-top:0.4rem;">Modèle</span>
                            <span class="reprompt-meta-value">${entry.model || '—'}</span>
                        </div>
                        <details class="reprompt-prompt-details">
                            <summary>Voir le prompt original</summary>
                            <pre class="reprompt-prompt-pre">${entry.prompt || 'Non disponible'}</pre>
                        </details>
                    </div>
                    <div class="reprompt-form-col">
                        <div class="reprompt-mode-toggle">
                            <button class="reprompt-mode-btn active" data-mode="edit" title="Modifie les pixels de l'image originale (DALL-E Edit)">
                                🖊️ Modifier l'image
                            </button>
                            <button class="reprompt-mode-btn" data-mode="regen" title="Régénère une nouvelle image à partir du prompt">
                                🔄 Régénérer
                            </button>
                        </div>
                        <p class="reprompt-mode-hint" id="repromptModeHint">
                            Modifie directement les pixels de l'image existante via DALL-E Edit.
                        </p>
                        <label class="reprompt-label">Que souhaitez-vous modifier ?</label>
                        <textarea id="repromptTextarea" class="reprompt-textarea"
                            placeholder="Ex: Change le personnage en femme, ajoute de la neige, remplace le fond par un coucher de soleil..."
                            rows="5"></textarea>
                        <div class="reprompt-options" id="repromptRegenOptions" style="display:none;">
                            <label class="reprompt-option-label">
                                <input type="checkbox" id="repromptKeepStyle" checked />
                                Conserver le style visuel original
                            </label>
                            <label class="reprompt-option-label">
                                <input type="checkbox" id="repromptKeepSubject" checked />
                                Conserver le sujet de base
                            </label>
                        </div>
                        <div id="repromptStatus" class="reprompt-status" style="display:none;"></div>
                        <div class="reprompt-actions">
                            <button id="repromptCancel" class="btn-secondary">Annuler</button>
                            <button id="repromptGenerate" class="btn-primary reprompt-generate-btn">
                                <span class="btn-icon">✨</span>
                                Appliquer les modifications
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const close = () => document.body.removeChild(modal);
        modal.querySelector('#repromptClose').addEventListener('click', close);
        modal.querySelector('#repromptCancel').addEventListener('click', close);
        modal.addEventListener('click', e => { if (e.target === modal) close(); });

        // Toggle mode edit / regen
        let repromptMode = 'edit';
        const modeHints = {
            edit:  'Modifie directement les pixels de l\'image existante via DALL-E Edit.',
            regen: 'Régénère une nouvelle image en intégrant vos modifications au prompt original.'
        };
        modal.querySelectorAll('.reprompt-mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                repromptMode = btn.dataset.mode;
                modal.querySelectorAll('.reprompt-mode-btn').forEach(b => b.classList.toggle('active', b === btn));
                modal.querySelector('#repromptModeHint').textContent = modeHints[repromptMode];
                modal.querySelector('#repromptRegenOptions').style.display = repromptMode === 'regen' ? 'flex' : 'none';
                modal.querySelector('#repromptGenerate').textContent = repromptMode === 'edit'
                    ? '✨ Appliquer les modifications'
                    : '🔄 Régénérer l\'image';
            });
        });

        modal.querySelector('#repromptGenerate').addEventListener('click', async () => {
            const modifications = modal.querySelector('#repromptTextarea').value.trim();
            if (!modifications) {
                modal.querySelector('#repromptTextarea').focus();
                return;
            }

            const genBtn   = modal.querySelector('#repromptGenerate');
            const statusEl = modal.querySelector('#repromptStatus');

            genBtn.disabled = true;
            genBtn.innerHTML = '<span class="btn-spinner"></span> En cours...';
            statusEl.style.display = 'block';
            statusEl.className = 'reprompt-status loading';
            statusEl.textContent = 'Génération en cours...';

            try {
                let resultUrl;
                let usedModel;
                let usedPrompt;

                if (repromptMode === 'edit' && imageUrl) {
                    // ── Mode DALL-E Edit : modifier les pixels de l'image ──
                    // URLs relatives → absolues ; data URLs laissées telles quelles
                    const absoluteImageUrl = imageUrl.startsWith('/')
                        ? `${window.location.origin}${imageUrl}`
                        : imageUrl; // data: et http(s): passent directement
                    const apiKey = typeof settingsModal !== 'undefined' ? settingsModal.getApiKey('openai') : '';
                    const r = await fetch('/api/analyze-and-modify-image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            imageUrl: absoluteImageUrl,
                            modificationPrompt: modifications,
                            styleData: null,
                            ...(apiKey ? { apiKey } : {})
                        })
                    });
                    const d = await r.json();
                    if (!r.ok) throw new Error(d.error || `Erreur ${r.status}`);
                    const tempUrl = d.newImageUrl || d.imageUrl;
                    if (!tempUrl) throw new Error('Aucune image retournée par l\'API');
                    usedModel  = d.model || 'gpt-image-1';
                    usedPrompt = modifications;
                    // Sauvegarder sur le serveur (l'URL OpenAI expire, et les base64 sont trop lourds)
                    statusEl.textContent = 'Sauvegarde en cours...';
                    try {
                        const saved = await APIClient.saveImage(tempUrl, { subject: `${entry.subject} (optimisé)`, style: entry.style, model: usedModel });
                        resultUrl = saved.imageUrl || saved.savedPath || tempUrl;
                    } catch {
                        resultUrl = tempUrl; // fallback sur l'URL temporaire
                    }
                } else {
                    // ── Mode Régénération ──
                    const keepStyle   = modal.querySelector('#repromptKeepStyle').checked;
                    const keepSubject = modal.querySelector('#repromptKeepSubject').checked;
                    // Prompt centré sur la modification, pas sur le contenu original
                    let parts = [modifications];
                    if (keepSubject && entry.subject) parts.push(`Sujet de base : ${entry.subject}`);
                    if (keepStyle && entry.style && entry.style !== 'N/A') parts.push(`Style visuel : ${entry.style}`);
                    usedPrompt = parts.join('\n\n');
                    resultUrl  = await this.generateImage(usedPrompt);
                    usedModel  = typeof settingsModal !== 'undefined' ? settingsModal.getModel() : entry.model;
                }

                // Sauvegarder dans l'historique
                const savedEntry = imageStorage.addToHistory({
                    imageUrl:     resultUrl,
                    thumbnailUrl: resultUrl,
                    originalUrl:  resultUrl,
                    subject:      `${entry.subject || 'Image'} (optimisé)`,
                    style:        entry.style,
                    prompt:       usedPrompt,
                    model:        usedModel,
                    size:         typeof settingsModal !== 'undefined' ? settingsModal.getSize() : (entry.size || '1024x1024'),
                    quality:      typeof settingsModal !== 'undefined' ? settingsModal.getQuality() : (entry.quality || 'standard'),
                    mode:         entry.mode || 'manual',
                    parentId:     entry.id,
                    modifications
                });

                // Sauvegarde serveur pour le mode regen (best-effort, edit déjà sauvegardé)
                if (repromptMode !== 'edit') {
                    try { await APIClient.saveImage(resultUrl, { subject: savedEntry.subject, style: savedEntry.style, model: savedEntry.model }); } catch {}
                }

                statusEl.className = 'reprompt-status success';
                statusEl.innerHTML = '✅ Nouvelle version générée ! <a href="#" id="repromptViewHistory">Voir dans l\'historique</a>';
                modal.querySelector('#repromptViewHistory')?.addEventListener('click', e => {
                    e.preventDefault();
                    close();
                    this.refreshHistory();
                    document.querySelector('details')?.setAttribute('open', '');
                });

                genBtn.disabled = false;
                genBtn.innerHTML = repromptMode === 'edit'
                    ? '✨ Appliquer encore'
                    : '🔄 Régénérer encore';
                this.refreshHistory();

            } catch (err) {
                statusEl.className = 'reprompt-status error';
                statusEl.textContent = `Erreur : ${err.message}`;
                genBtn.disabled = false;
                genBtn.innerHTML = '↩ Réessayer';
            }
        });
    }

    handleClearHistory() {
        if (confirm('Voulez-vous vraiment vider tout l\'historique ? Cette action est irréversible.')) {
            imageStorage.clearHistory();
            this.refreshHistory();
            this.showMessage('Historique vidé', 'success');
        }
    }

    // ==================== FONCTIONS STYLE SOURCE ====================

    handleStyleSourceChange(selectedBtn) {
        console.log('🎨 Style source changed');
        
        // Bloquer si le bouton est désactivé
        if (selectedBtn.disabled || selectedBtn.classList.contains('disabled')) {
            this.showMessage('⚠️ Cette fonctionnalité sera bientôt disponible', 'error');
            return;
        }
        
        // Update buttons
        document.querySelectorAll('.style-source-btn').forEach(btn => btn.classList.remove('active'));
        selectedBtn.classList.add('active');
        
        const source = selectedBtn.dataset.source;
        this.currentStyleSource = source;
        
        // Update content visibility
        document.querySelectorAll('.style-source-content').forEach(content => content.classList.remove('active'));
        document.getElementById(source + 'Content').classList.add('active');
        
        console.log('✅ Active style source:', source);
    }

    async handleScanWebsiteStyle() {
        const urlInput = document.getElementById('websiteStyleUrl');
        const url = urlInput.value.trim();
        
        if (!url) {
            this.showMessage('Veuillez entrer une URL', 'error');
            return;
        }
        
        // Validate URL
        try {
            new URL(url);
        } catch (e) {
            this.showMessage('URL invalide. Exemple: https://exemple.com', 'error');
            return;
        }
        
        try {
            this.showLoading('Analyse du site web en cours...');
            
            // Call API to analyze website style
            const response = await fetch('/api/analyze-website-style', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });
            
            if (!response.ok) {
                throw new Error(`Erreur serveur: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Échec de l\'analyse');
            }
            
            this.hideLoading();
            
            // Store the scanned style data
            this.scannedStyleData = data.style;
            this.scannedStyleUrl = url;
            this.allScannedColors = data.allColors || [];
            this.allScannedFonts = data.allFonts || [];
            this.selectedColors = []; // Couleurs sélectionnées par l'utilisateur
            
            // Display results
            this.displayScanResults(url, data.style, data.allColors, data.allFonts);
            
            this.showMessage('✅ Site analysé avec succès !', 'success');
            
        } catch (error) {
            this.hideLoading();
            console.error('Error scanning website:', error);
            this.showMessage('❌ Erreur lors de l\'analyse: ' + error.message, 'error');
        }
    }
    
    displayScanResults(url, style, allColors, allFonts) {
        const resultDiv = document.getElementById('websiteStyleResult');
        const urlDisplay = resultDiv.querySelector('.scanned-url');
        const colorsDiv = document.getElementById('scannedColors');
        const fontsDiv = document.getElementById('scannedFonts');
        const aestheticSpan = document.getElementById('scannedAesthetic');
        const moodSpan = document.getElementById('scannedMood');
        const compositionSpan = document.getElementById('scannedComposition');
        
        // URL
        urlDisplay.textContent = url;
        
        // Couleurs IA suggérées (pré-sélectionnées) + toutes les couleurs extraites
        const aiColors = style.colorPalette || [];
        const extractedColors = allColors && allColors.length > 0 ? allColors : [];
        
        // Fusionner: IA en premier, puis les autres non présents dans l'IA
        const aiSet = new Set(aiColors.map(c => c.toLowerCase()));
        const extraColors = extractedColors.filter(c => !aiSet.has(c.toLowerCase()));
        const allColorsMerged = [...aiColors, ...extraColors];
        
        // Pré-sélectionner les couleurs IA
        this.selectedColors = [...aiColors];
        
        // Colors - Sélecteur interactif
        colorsDiv.innerHTML = '';
        
        if (allColorsMerged.length > 0) {
            colorsDiv.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.75rem;">
                    <span style="color:var(--text-gray); font-size:0.85rem;">
                        ${allColorsMerged.length} couleur${allColorsMerged.length > 1 ? 's' : ''} •
                        <strong><span id="selectedColorsCount">${this.selectedColors.length}</span> sélectionnée${this.selectedColors.length > 1 ? 's' : ''}</strong>
                    </span>
                    <div style="display:flex; gap:0.5rem;">
                        <button class="btn-secondary btn-small" onclick="app.selectAllColors()">Tout</button>
                        <button class="btn-secondary btn-small" onclick="app.deselectAllColors()">Aucune</button>
                    </div>
                </div>
                ${aiColors.length > 0 ? `
                <p style="font-size:0.78rem; color:var(--text-gray); margin:0 0 1rem 0;">
                    <span style="color:#6366f1;">●</span> Suggérées par l'IA (pré-cochées) &nbsp;·&nbsp;
                    <span style="opacity:0.4;">●</span> Extraites du site
                </p>` : ''}
                <div class="colors-picker-grid" id="colorsPickerGrid"></div>
            `;

            const grid = document.getElementById('colorsPickerGrid');
            allColorsMerged.forEach((color, index) => {
                const isAiColor = aiSet.has(color.toLowerCase());
                const isChecked = this.selectedColors.some(c => c.toLowerCase() === color.toLowerCase());
                const card = document.createElement('div');
                card.className = 'color-selector-card' + (isAiColor ? ' ai-suggested' : '');
                card.setAttribute('data-color', color);
                card.innerHTML = `
                    <input type="checkbox" class="color-checkbox" id="color-${index}" data-color="${color}" ${isChecked ? 'checked' : ''} />
                    <label for="color-${index}" class="color-swatch-selectable" style="background-color:${color};" title="${color}">
                        <span class="color-check">✓</span>
                    </label>
                    <span class="color-label">${color}</span>
                `;
                grid.appendChild(card);
            });

            document.querySelectorAll('.color-checkbox').forEach(cb => {
                cb.addEventListener('change', (e) => this.handleColorSelection(e));
            });
        } else {
            colorsDiv.innerHTML = '<p style="color:var(--text-gray);">Aucune couleur détectée</p>';
        }
        
        // Fonts
        fontsDiv.innerHTML = '';
        const fonts = style.typography || style.allFonts || [];
        if (fonts.length > 0) {
            fonts.forEach(font => {
                const fontItem = document.createElement('div');
                fontItem.className = 'font-item';
                fontItem.textContent = font;
                fontsDiv.appendChild(fontItem);
            });
        } else {
            fontsDiv.innerHTML = '<p style="color: var(--text-gray);">Aucune police détectée</p>';
        }
        
        // Aesthetic description
        aestheticSpan.textContent = style.aesthetic || 'Non déterminé';
        moodSpan.textContent = style.mood || 'Non déterminé';
        compositionSpan.textContent = style.composition || 'Non déterminé';
        
        // Show result and setup confirm button
        resultDiv.style.display = 'block';
        
        const confirmBtn = document.getElementById('confirmScanStyleBtn');
        confirmBtn.onclick = () => this.confirmScannedStyle();
    }
    
    handleColorSelection(event) {
        const color = event.target.dataset.color;
        const isChecked = event.target.checked;
        
        if (isChecked) {
            if (!this.selectedColors.includes(color)) {
                this.selectedColors.push(color);
            }
        } else {
            this.selectedColors = this.selectedColors.filter(c => c !== color);
        }
        
        // Mettre à jour le compteur
        const countSpan = document.getElementById('selectedColorsCount');
        if (countSpan) {
            countSpan.textContent = this.selectedColors.length;
        }
        
        console.log('✅ Couleurs sélectionnées:', this.selectedColors);
    }
    
    selectAllColors() {
        document.querySelectorAll('.color-checkbox').forEach(checkbox => {
            checkbox.checked = true;
            const color = checkbox.dataset.color;
            if (!this.selectedColors.includes(color)) {
                this.selectedColors.push(color);
            }
        });
        
        const countSpan = document.getElementById('selectedColorsCount');
        if (countSpan) {
            countSpan.textContent = this.selectedColors.length;
        }
    }
    
    deselectAllColors() {
        document.querySelectorAll('.color-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        this.selectedColors = [];
        
        const countSpan = document.getElementById('selectedColorsCount');
        if (countSpan) {
            countSpan.textContent = 0;
        }
    }
    
    confirmScannedStyle() {
        if (!this.scannedStyleData) {
            this.showMessage('Aucun style scanné disponible', 'error');
            return;
        }
        
        // Utiliser les couleurs sélectionnées si disponibles
        if (this.selectedColors.length > 0) {
            this.scannedStyleData.colorPalette = this.selectedColors;
        }
        
        // Mark style as selected
        this.selectedStyle = 'scanned-' + this.scannedStyleUrl;
        
        // Store the full style data for later use in prompt generation
        this.customStyleData = this.scannedStyleData;
        
        // Configure prompt generator with custom style
        promptGenerator.setStyle(this.selectedStyle);
        promptGenerator.setCustomStyle(this.scannedStyleData);
        
        this.showMessage('✅ Style validé ! Passons à la suite', 'success');
        
        // Rendre l'étape 3 visible avant de la compléter
        this.showStepWithAnimation(3);
        
        // Move to next step
        accordionManager.completeStep(2);
    }

    handleStyleFilesUpload(event) {
        const files = Array.from(event.target.files);
        this.displayUploadedFiles(files);
    }

    handleStyleFilesDrop(event) {
        const files = Array.from(event.dataTransfer.files);
        this.displayUploadedFiles(files);
    }

    displayUploadedFiles(files) {
        const preview = document.getElementById('uploadedFilesPreview');
        const analyzeBtn = document.getElementById('analyzeUploadedStyleBtn');
        
        if (files.length === 0) return;
        
        preview.innerHTML = '<h4>Fichiers uploadés :</h4>';
        files.forEach(file => {
            const fileDiv = document.createElement('div');
            fileDiv.style.cssText = 'padding: 0.75rem; background: var(--light-bg); border-radius: 8px; margin-bottom: 0.5rem;';
            fileDiv.innerHTML = `
                <strong>${file.name}</strong>
                <span style="color: var(--text-gray); font-size: 0.875rem; margin-left: 1rem;">
                    ${(file.size / 1024).toFixed(1)} KB
                </span>
            `;
            preview.appendChild(fileDiv);
        });
        
        preview.style.display = 'block';
        analyzeBtn.style.display = 'block';
        
        analyzeBtn.onclick = () => this.handleAnalyzeUploadedStyle(files);
    }

    async handleAnalyzeUploadedStyle(files) {
        try {
            this.showLoading('Analyse du style des documents...');
            
            // TODO: Send files to API for analysis
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            this.hideLoading();
            this.showMessage(`${files.length} fichier(s) analysé(s) avec succès ! (Fonction en développement)`, 'success');
            
            this.selectedStyle = 'upload-' + Date.now();
            accordionManager.completeStep(2);
            
        } catch (error) {
            this.hideLoading();
            this.showMessage('Erreur lors de l\'analyse: ' + error.message, 'error');
        }
    }

    async handleLibrarySearch() {
        const searchInput = document.getElementById('librarySearchInput');
        const query = searchInput.value.trim();
        
        if (!query) {
            this.showMessage('Veuillez entrer un terme de recherche', 'error');
            return;
        }
        
        try {
            this.showLoading(`🔍 Recherche sur ${this.currentLibrary.toUpperCase()}...`);
            
            // Appeler l'API
            const response = await fetch('/api/search-library-images', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query,
                    library: this.currentLibrary
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || `Erreur ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success || !data.results || data.results.length === 0) {
                throw new Error('Aucune image trouvée');
            }
            
            // Stocker les résultats
            this.librarySearchResults = data.results;
            
            // Afficher les résultats
            const resultsGrid = document.getElementById('libraryResultsGrid');
            const resultsSection = document.getElementById('libraryResults');
            
            resultsGrid.innerHTML = '';
            data.results.forEach((image, index) => {
                const card = document.createElement('div');
                card.className = 'library-image-card';
                card.dataset.imageIndex = index;
                card.innerHTML = `
                    <img src="${image.thumb}" alt="${image.description}" />
                    <div class="image-overlay">
                        <span class="check-icon">✓</span>
                    </div>
                `;
                card.onclick = () => this.toggleLibraryImage(card, index);
                resultsGrid.appendChild(card);
            });
            
            resultsSection.style.display = 'block';
            document.getElementById('analyzeLibraryStyleBtn').style.display = 'block';
            
            this.hideLoading();
            this.showMessage(`✅ ${data.results.length} images trouvées sur ${this.currentLibrary.toUpperCase()}`, 'success');
            
        } catch (error) {
            this.hideLoading();
            console.error('Library search error:', error);
            this.showMessage('❌ Erreur lors de la recherche: ' + error.message, 'error');
        }
    }

    toggleLibraryImage(card, imageId) {
        card.classList.toggle('selected');
        
        if (card.classList.contains('selected')) {
            this.selectedLibraryImages.push(imageId);
        } else {
            this.selectedLibraryImages = this.selectedLibraryImages.filter(id => id !== imageId);
        }
        
        console.log('Selected images:', this.selectedLibraryImages);
        
        // Auto-select style when at least one image is selected
        if (this.selectedLibraryImages.length > 0) {
            const analyzeBtn = document.getElementById('analyzeLibraryStyleBtn');
            analyzeBtn.onclick = () => this.handleAnalyzeLibraryStyle();
            analyzeBtn.textContent = `✨ Utiliser ce style (${this.selectedLibraryImages.length} image(s))`;
        }
    }

    async handleAnalyzeLibraryStyle() {
        if (this.selectedLibraryImages.length === 0) {
            this.showMessage('Veuillez sélectionner au moins une image', 'error');
            return;
        }
        
        try {
            this.showLoading(`🎨 Analyse du style de ${this.selectedLibraryImages.length} image(s) avec GPT-4 Vision...`);
            
            // Récupérer les URLs des images sélectionnées
            const imageUrls = this.selectedLibraryImages.map(index => {
                return this.librarySearchResults[index].url;
            });
            
            // Appeler l'API d'analyse
            const response = await fetch('/api/analyze-library-style', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    imageUrls
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || `Erreur ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success || !data.style) {
                throw new Error('Échec de l\'analyse du style');
            }
            
            this.hideLoading();
            
            // Stocker les données de style
            this.customStyleData = data.style;
            this.selectedStyle = 'library-' + this.currentLibrary + '-' + Date.now();
            
            // Configurer le générateur de prompt
            promptGenerator.setStyle(this.selectedStyle);
            promptGenerator.setCustomStyle(this.customStyleData);
            
            this.showMessage(`✅ Style extrait de ${this.selectedLibraryImages.length} image(s) !`, 'success');
            
            // Passer à l'étape suivante
            accordionManager.completeStep(2);
            
        } catch (error) {
            this.hideLoading();
            console.error('Library style analysis error:', error);
            this.showMessage('❌ Erreur lors de l\'analyse: ' + error.message, 'error');
        }
    }

    // ==================== FONCTIONS MODE CSV ====================

    toggleCSVStep(stepNumber) {
        const step = document.getElementById(`csvStep${stepNumber}`);
        const isActive = step.classList.contains('active');
        
        if (!isActive) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    }

    openCSVStep(stepNumber) {
        console.log(`🔄 Ouverture de l'étape ${stepNumber}`);
        
        // Fermer toutes les étapes
        for (let i = 1; i <= 4; i++) {
            const step = document.getElementById(`csvStep${i}`);
            if (i === stepNumber) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active');
            }
        }
        
        // Marquer les étapes précédentes comme complétées
        for (let i = 1; i < stepNumber; i++) {
            const prevStep = document.getElementById(`csvStep${i}`);
            prevStep.classList.add('completed');
            console.log(`✅ Étape ${i} marquée comme complétée`);
        }
        
        // Scroll smooth vers l'étape avec un délai pour l'animation
        setTimeout(() => {
            const targetStep = document.getElementById(`csvStep${stepNumber}`);
            targetStep.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }, 150);
        
        // Message dans la console pour debug
        this.showMessage(`Étape ${stepNumber}/4 activée`, 'info');
    }

    handleCSVFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.csvTextInput.value = e.target.result;
            this.showMessage('Fichier chargé, cliquez sur "Analyser le CSV"', 'success');
        };
        reader.readAsText(file);
    }

    handleParseCSV() {
        const csvText = this.csvTextInput.value.trim();
        
        if (!csvText) {
            this.showMessage('Veuillez sélectionner un fichier ou coller du CSV', 'error');
            return;
        }

        try {
            const result = csvParser.parseCSV(csvText);
            
            // Afficher les stats
            this.csvRowCount.textContent = result.data.length;
            this.csvColCount.textContent = result.headers.length;
            this.csvImgCount.textContent = result.imageColumns.length * result.data.length;

            // Afficher le tableau
            this.displayCSVTable(result);

            // Ouvrir l'étape 2
            this.openCSVStep(2);
            this.showMessage(`CSV analysé : ${result.data.length} lignes, ${result.imageColumns.length} colonne(s) image`, 'success');
            
        } catch (error) {
            console.error('Error parsing CSV:', error);
            this.showMessage(`Erreur: ${error.message}`, 'error');
        }
    }

    displayCSVTable(result) {
        let html = '<thead><tr>';
        
        // En-têtes avec highlight des colonnes images
        result.headers.forEach((header, index) => {
            const isImageCol = result.imageColumns.some(col => col.index === index);
            html += `<th class="${isImageCol ? 'csv-img-col' : ''}">${header}</th>`;
        });
        
        html += '</tr></thead><tbody>';

        // Afficher les 5 premières lignes
        result.data.slice(0, 5).forEach(row => {
            html += '<tr>';
            result.headers.forEach((header, index) => {
                const isImageCol = result.imageColumns.some(col => col.index === index);
                html += `<td class="${isImageCol ? 'csv-img-col' : ''}">${row[header] || ''}</td>`;
            });
            html += '</tr>';
        });

        if (result.data.length > 5) {
            html += `<tr><td colspan="${result.headers.length}" class="csv-more">... et ${result.data.length - 5} lignes supplémentaires</td></tr>`;
        }

        html += '</tbody>';
        this.csvTable.innerHTML = html;
    }

    async handleAnalyzeCSV() {
        if (!this.dataLoaded) {
            this.showMessage('Veuillez patienter, les données de style sont en cours de chargement...', 'error');
            return;
        }

        if (!this.selectedStyle) {
            this.showMessage('Veuillez d\'abord sélectionner un style visuel', 'error');
            return;
        }

        if (!this.apiKey && !this.useServerKeys) {
            this.showMessage('Clé API OpenAI requise', 'error');
            return;
        }

        try {
            this.showLoading('Analyse du CSV avec l\'IA...');
            
            this.csvTasks = await csvParser.analyzeAllRows(this.apiKey);
            
            this.displayCSVTasks(this.csvTasks);
            
            this.hideLoading();
            // Ouvrir l'étape 3
            this.openCSVStep(3);
            this.showMessage(`${this.csvTasks.length} sujets générés par l'IA`, 'success');
            
        } catch (error) {
            console.error('Error analyzing CSV:', error);
            this.hideLoading();
            this.showMessage(`Erreur: ${error.message}`, 'error');
        }
    }

    displayCSVTasks(tasks) {
        this.csvTasksContainer.innerHTML = '';

        tasks.forEach((task, index) => {
            const card = document.createElement('div');
            card.className = 'csv-task-card';
            card.dataset.index = index;

            const statusIcon = task.status === 'generated' ? '✅' : task.status === 'error' ? '❌' : '⏳';
            
            card.innerHTML = `
                <div class="csv-task-header">
                    <span class="csv-task-status">${statusIcon}</span>
                    <span class="csv-task-title">Ligne ${task.rowIndex + 1} - ${task.imageColumn}</span>
                </div>
                <div class="csv-task-context">
                    <strong>Contexte :</strong>
                    <pre>${task.context || 'N/A'}</pre>
                </div>
                <div class="csv-task-subject">
                    <strong>Sujet généré :</strong>
                    <p>${task.subject}</p>
                </div>
                ${task.imageUrl ? `<img src="${task.imageUrl}" class="csv-task-preview">` : ''}
            `;

            this.csvTasksContainer.appendChild(card);
        });
    }

    async handleGenerateCSVImages() {
        if (!this.apiKey && !this.useServerKeys) {
            this.showMessage('Clé API OpenAI requise', 'error');
            return;
        }

        const tasksToGenerate = this.csvTasks.filter(t => t.status === 'ready');

        if (tasksToGenerate.length === 0) {
            this.showMessage('Aucune image à générer', 'error');
            return;
        }

        try {
            this.showLoading(`Génération de ${tasksToGenerate.length} images...`);

            for (let i = 0; i < tasksToGenerate.length; i++) {
                const task = tasksToGenerate[i];
                this.loadingMessage.textContent = `Génération ${i + 1}/${tasksToGenerate.length}: Ligne ${task.rowIndex + 1}`;

                try {
                    // Générer le prompt
                    promptGenerator.setStyle(this.selectedStyle);
                    promptGenerator.setSubject(task.subject);
                    const prompt = promptGenerator.generatePrompt();
                    task.prompt = prompt;

                    // Générer l'image
                    const imageUrl = await this.generateImage(prompt);
                    task.imageUrl = imageUrl;

                    // Sauvegarder sur le serveur
                    const metadata = {
                        style: this.selectedStyle,
                        subject: task.subject,
                        prompt: prompt,
                        model: this.modelSelect.value,
                        size: this.sizeSelect.value,
                        quality: this.qualitySelect?.value || 'standard',
                        mode: 'csv',
                        csvRow: task.rowIndex + 1,
                        csvColumn: task.imageColumn
                    };

                    const saveResult = await APIClient.saveImage(imageUrl, metadata);
                    task.serverPath = saveResult.path;
                    task.status = 'generated';

                    // Ajouter à l'historique
                    imageStorage.addToHistory({
                        imageUrl: saveResult.path,
                        originalUrl: imageUrl,
                        filename: saveResult.filename,
                        ...metadata
                    });

                    // Rafraîchir l'affichage
                    this.displayCSVTasks(this.csvTasks);

                } catch (error) {
                    console.error(`Error generating image for row ${task.rowIndex}:`, error);
                    task.status = 'error';
                    task.error = error.message;
                }

                // Pause entre chaque génération
                if (i < tasksToGenerate.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }

            this.hideLoading();
            // Ouvrir l'étape 4
            this.openCSVStep(4);
            this.showMessage(`${tasksToGenerate.length} images générées !`, 'success');
            this.refreshHistory();

        } catch (error) {
            console.error('Error generating CSV images:', error);
            this.hideLoading();
            this.showMessage(`Erreur: ${error.message}`, 'error');
        }
    }

    handleExportCSV() {
        if (this.csvTasks.length === 0) {
            this.showMessage('Aucune donnée à exporter', 'error');
            return;
        }

        try {
            const csv = csvParser.exportResultsCSV(this.csvTasks);
            
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `images-generated-${Date.now()}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            this.showMessage('CSV exporté avec les URLs des images', 'success');
        } catch (error) {
            console.error('Error exporting CSV:', error);
            this.showMessage(`Erreur: ${error.message}`, 'error');
        }
    }
    
    // ==================== FONCTIONS MODE FROM-IMAGES ====================
    
    async handleScanPageImages() {
        const url = this.imagesScanUrl.value.trim();
        
        if (!url) {
            this.showMessage('Veuillez entrer une URL', 'error');
            return;
        }
        
        // Validate URL
        try {
            new URL(url);
        } catch (e) {
            this.showMessage('URL invalide. Exemple: https://exemple.com', 'error');
            return;
        }
        
        try {
            this.showLoading('Scan des images de la page en cours...');
            
            const response = await fetch('/api/extract-page-images', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });
            
            if (!response.ok) {
                throw new Error(`Erreur serveur: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Échec de l\'extraction');
            }
            
            this.hideLoading();
            
            console.log('📸 Images reçues:', data.images);
            console.log('📊 Nombre total:', data.count);
            
            // Stocker les images scannées
            this.scannedImages = data.images;
            this.selectedImages = [];
            
            // Afficher les résultats
            this.displayScannedImages(data.images);
            
            this.showMessage(`✅ ${data.count} image(s) trouvée(s) !`, 'success');
            
        } catch (error) {
            this.hideLoading();
            console.error('Error scanning page images:', error);
            this.showMessage('❌ Erreur lors du scan: ' + error.message, 'error');
        }
    }
    
    displayScannedImages(images) {
        if (!images || images.length === 0) {
            this.imagesGrid.innerHTML = '<p style="color: var(--text-gray); text-align: center; padding: 2rem;">Aucune image trouvée sur cette page</p>';
            this.scannedImagesResults.style.display = 'block';
            return;
        }
        
        // Mettre à jour les compteurs
        this.imagesFoundCount.textContent = images.length;
        this.imagesSelectedCount.textContent = 0;
        
        // Créer la grille d'images
        this.imagesGrid.innerHTML = '';
        
        images.forEach((img, index) => {
            const hasDims = img.width && img.height;
            const sizeLabel = hasDims ? `${img.width}×${img.height}` : 'dim. inconnues';
            const sizeKb = img.fileSize ? ` · ${Math.round(img.fileSize / 1024)} Ko` : '';
            const loadingBadge = img.loading === 'lazy' ? '<span class="img-badge">lazy</span>' : '';

            const imageCard = document.createElement('div');
            imageCard.className = 'image-card';
            imageCard.innerHTML = `
                <input type="checkbox" class="image-checkbox" id="img-${index}" data-index="${index}" />
                <label for="img-${index}" class="image-preview-wrapper">
                    <img src="${img.url}" alt="${img.alt || 'Image'}" class="image-preview" loading="lazy"
                         onerror="this.parentElement.parentElement.style.opacity='0.4'" />
                    <div class="image-check-overlay">
                        <span class="image-check-icon">✓</span>
                    </div>
                    <div class="image-dims-badge">${sizeLabel}${sizeKb}</div>
                </label>
                <div class="image-info">
                    <div class="image-alt" title="${img.alt || img.url}">${img.alt || '—'}</div>
                    ${loadingBadge}
                </div>
            `;

            this.imagesGrid.appendChild(imageCard);
        });
        
        // Ajouter event listeners pour les checkboxes
        document.querySelectorAll('.image-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => this.handleImageSelection(e));
        });
        
        // Afficher les résultats
        this.scannedImagesResults.style.display = 'block';
    }
    
    handleImageSelection(event) {
        const index = parseInt(event.target.dataset.index);
        const isChecked = event.target.checked;
        
        if (isChecked) {
            if (!this.selectedImages.includes(index)) {
                this.selectedImages.push(index);
            }
        } else {
            this.selectedImages = this.selectedImages.filter(i => i !== index);
        }
        
        // Mettre à jour le compteur
        this.imagesSelectedCount.textContent = this.selectedImages.length;
        
        console.log('✅ Images sélectionnées:', this.selectedImages);
    }
    
    selectAllImages() {
        document.querySelectorAll('.image-checkbox').forEach(checkbox => {
            checkbox.checked = true;
            const index = parseInt(checkbox.dataset.index);
            if (!this.selectedImages.includes(index)) {
                this.selectedImages.push(index);
            }
        });
        
        this.imagesSelectedCount.textContent = this.selectedImages.length;
    }
    
    deselectAllImages() {
        document.querySelectorAll('.image-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        this.selectedImages = [];
        this.imagesSelectedCount.textContent = 0;
    }
    
    async handleModifySelectedImages() {
        if (this.selectedImages.length === 0) {
            this.showMessage('Veuillez sélectionner au moins une image', 'error');
            return;
        }
        
        const modificationPrompt = this.imagesModificationPrompt.value.trim();
        if (!modificationPrompt) {
            this.showMessage('Veuillez décrire comment modifier les images', 'error');
            return;
        }
        
        if (!this.selectedStyle) {
            this.showMessage('Veuillez d\'abord sélectionner un style visuel (Étape 2)', 'error');
            return;
        }
        
        try {
            const totalImages = this.selectedImages.length;
            this.showLoading(`Modification de ${totalImages} image(s) en cours...`);
            
            const results = [];
            let successCount = 0;
            let failedCount = 0;
            
            // Obtenir les données de style
            const styleData = this.customStyleData || getStyleData(this.selectedStyle);
            
            // Traiter chaque image sélectionnée
            for (let i = 0; i < this.selectedImages.length; i++) {
                const imageIndex = this.selectedImages[i];
                const imageData = this.scannedImages[imageIndex];
                
                this.loadingMessage.textContent = `Modification de l'image ${i + 1}/${totalImages}...`;
                
                try {
                    console.log(`🎨 [${i + 1}/${totalImages}] Analyzing and modifying:`, imageData.url);
                    
                    // Appel API pour analyser et modifier l'image
                    const response = await fetch('/api/analyze-and-modify-image', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            imageUrl: imageData.url,
                            modificationPrompt: modificationPrompt,
                            style: styleData
                        })
                    });
                    
                    if (!response.ok) {
                        throw new Error(`Erreur API: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    
                    if (!data.success) {
                        throw new Error(data.error || 'Échec de la modification');
                    }
                    
                    console.log(`✅ [${i + 1}/${totalImages}] Success:`, data.newImageUrl);
                    
                    // Sauvegarder l'image générée
                    this.loadingMessage.textContent = `Sauvegarde de l'image ${i + 1}/${totalImages}...`;
                    
                    const saveResult = await APIClient.saveImage(data.newImageUrl, {
                        style: 'dalle-edit',
                        subject: `Modified: ${imageData.alt || 'image'}`,
                        prompt: modificationPrompt,
                        originalImageUrl: imageData.url,
                        modificationPrompt: modificationPrompt,
                        model: 'dall-e-2',
                        size: '1024x1024',
                        quality: 'standard',
                        mode: 'from-images'
                    });
                    
                    // Ajouter à l'historique
                    imageStorage.addToHistory({
                        imageUrl: saveResult.path,
                        originalUrl: data.newImageUrl,
                        filename: saveResult.filename,
                        style: 'dalle-edit',
                        subject: `Modified: ${imageData.alt || 'image'}`,
                        prompt: modificationPrompt
                    });
                    
                    results.push({
                        success: true,
                        original: imageData,
                        modified: data
                    });
                    
                    successCount++;
                    
                } catch (error) {
                    console.error(`❌ [${i + 1}/${totalImages}] Failed:`, error);
                    results.push({
                        success: false,
                        original: imageData,
                        error: error.message
                    });
                    failedCount++;
                }
            }
            
            this.hideLoading();
            
            // Afficher les résultats
            this.displayModificationResults(results);
            
            // Message de succès
            if (failedCount === 0) {
                this.showMessage(`✅ ${successCount} image(s) modifiée(s) avec succès !`, 'success');
            } else {
                this.showMessage(`⚠️ ${successCount} succès, ${failedCount} échec(s)`, 'error');
            }
            
            // Rafraîchir l'historique
            this.refreshHistory();
            
        } catch (error) {
            this.hideLoading();
            console.error('Error modifying images:', error);
            this.showMessage('❌ Erreur lors de la modification: ' + error.message, 'error');
        }
    }
    
    displayModificationResults(results) {
        // Supprimer les anciens résultats s'ils existent
        const old = document.getElementById('imagesModificationResults');
        if (old) old.remove();

        const successCount = results.filter(r => r.success).length;
        const failCount    = results.filter(r => !r.success).length;

        const container = document.createElement('div');
        container.id = 'imagesModificationResults';
        container.style.cssText = 'margin-top: 2rem;';
        container.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1.5rem; flex-wrap:wrap; gap:0.5rem;">
                <h3 style="margin:0; color:var(--text-dark);">🎨 Résultats — Avant / Après</h3>
                <div>
                    ${successCount > 0 ? `<span style="background:#d1fae5; color:#065f46; padding:4px 10px; border-radius:20px; font-size:0.85rem; margin-right:6px;">✓ ${successCount} succès</span>` : ''}
                    ${failCount    > 0 ? `<span style="background:#fee2e2; color:#991b1b; padding:4px 10px; border-radius:20px; font-size:0.85rem;">✗ ${failCount} échec${failCount > 1 ? 's' : ''}</span>` : ''}
                </div>
            </div>
            <div class="modification-results-grid">
                ${results.map(result => {
                    if (result.success) {
                        return `
                            <div class="modification-result-card success">
                                <div class="result-images">
                                    <div class="result-image-wrapper">
                                        <img src="${result.original.url}" alt="Original" loading="lazy" />
                                        <span class="result-label">Original</span>
                                    </div>
                                    <div class="result-arrow">→</div>
                                    <div class="result-image-wrapper">
                                        <img src="${result.modified.newImageUrl}" alt="Modifiée" loading="lazy" />
                                        <span class="result-label">Modifiée ✓</span>
                                    </div>
                                </div>
                                ${result.original.alt ? `<p class="result-alt">${result.original.alt}</p>` : ''}
                            </div>`;
                    } else {
                        return `
                            <div class="modification-result-card failed">
                                <div class="result-images">
                                    <div class="result-image-wrapper">
                                        <img src="${result.original.url}" alt="Original" loading="lazy" />
                                        <span class="result-label">Original</span>
                                    </div>
                                </div>
                                <p class="result-alt" style="color:#ef4444;">✗ ${result.error}</p>
                            </div>`;
                    }
                }).join('')}
            </div>
        `;

        // Injecter dans fromImagesContent (étape 2/3 selon le mode)
        const container3 = this.fromImagesContent;
        if (container3) {
            container3.appendChild(container);
            container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}

// Initialiser l'application quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    // Vérifier l'authentification avant d'initialiser l'app
    const checkAuth = () => {
        // Fonction isAuthenticated devrait être disponible via auth.js
        if (typeof isAuthenticated !== 'undefined' && !isAuthenticated()) {
            console.warn('⚠️ Accès refusé : authentification requise');
            return null;
        }
        return new ImageGeneratorApp();
    };
    
    const app = checkAuth();
    if (app) {
        console.log('✅ Image Generator App initialized');
        window.app = app; // Rendre l'app accessible globalement pour les onclick
    }
});
