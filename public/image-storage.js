// Système de stockage et gestion des images générées

class ImageStorage {
    constructor() {
        this.storageKey = 'generated_images_history';
        this.loadHistory();
    }

    /**
     * Charger l'historique depuis localStorage
     */
    loadHistory() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            this.history = stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading history:', error);
            this.history = [];
        }
    }

    /**
     * Sauvegarder l'historique dans localStorage
     */
    saveHistory() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.history));
        } catch (error) {
            console.error('Error saving history:', error);
        }
    }

    /**
     * Ajouter une image à l'historique
     */
    addToHistory(imageData) {
        const entry = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString('fr-FR'),
            time: new Date().toLocaleTimeString('fr-FR'),
            thumbnailUrl: imageData.imageUrl || imageData.thumbnailUrl, // Stocker l'URL de l'image
            ...imageData
        };

        this.history.unshift(entry); // Ajouter au début
        
        // Limiter l'historique à 100 entrées
        if (this.history.length > 100) {
            this.history = this.history.slice(0, 100);
        }

        this.saveHistory();
        return entry;
    }

    /**
     * Obtenir l'historique complet
     */
    getHistory() {
        return this.history;
    }

    /**
     * Obtenir l'historique groupé par date
     */
    getHistoryByDate() {
        const grouped = {};
        
        this.history.forEach(entry => {
            const date = entry.date;
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(entry);
        });

        return grouped;
    }

    /**
     * Supprimer une entrée de l'historique
     */
    deleteEntry(id) {
        this.history = this.history.filter(entry => entry.id !== id);
        this.saveHistory();
    }

    /**
     * Vider tout l'historique
     */
    clearHistory() {
        this.history = [];
        this.saveHistory();
    }

    /**
     * Télécharger une image avec organisation par date
     */
    async downloadImageOrganized(imageUrl, metadata, serverPath = null) {
        // Créer un nom de fichier organisé
        const now = new Date();
        const dateFolder = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const timestamp = now.getTime();
        const styleName = metadata.style || 'unknown';
        const subject = metadata.subject || 'image';
        
        // Nettoyer le nom du sujet
        const cleanSubject = subject
            .substring(0, 50)
            .replace(/[^a-z0-9-_]/gi, '-')
            .replace(/-+/g, '-')
            .toLowerCase();
        
        const filename = `${timestamp}-${styleName}-${cleanSubject}.png`;
        
        try {
            // Méthode 1 : Essayer avec fetch (peut échouer avec CORS)
            try {
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
                
                console.log('✅ Image téléchargée via fetch');
            } catch (corsError) {
                console.warn('⚠️ CORS bloqué, utilisation du téléchargement direct');
                
                // Méthode 2 : Téléchargement direct (fonctionne malgré CORS)
                const a = document.createElement('a');
                a.href = imageUrl;
                a.download = filename;
                a.target = '_blank'; // Ouvrir dans un nouvel onglet si le téléchargement échoue
                
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                console.log('✅ Image téléchargée via lien direct');
            }

            // Ajouter à l'historique avec le chemin serveur si disponible
            this.addToHistory({
                imageUrl: serverPath || imageUrl, // Chemin serveur permanent ou URL OpenAI
                originalUrl: imageUrl, // URL OpenAI originale
                thumbnailUrl: serverPath || imageUrl,
                filename: filename,
                style: styleName,
                subject: subject,
                prompt: metadata.prompt,
                model: metadata.model,
                size: metadata.size,
                quality: metadata.quality,
                mode: metadata.mode || 'manual'
            });

            return filename;
        } catch (error) {
            console.error('❌ Erreur complète lors du téléchargement:', error);
            
            // Même en cas d'erreur, ajouter à l'historique
            this.addToHistory({
                imageUrl: imageUrl,
                filename: filename,
                style: styleName,
                subject: subject,
                prompt: metadata.prompt,
                model: metadata.model,
                size: metadata.size,
                mode: metadata.mode || 'manual'
            });
            
            // Ne pas bloquer le processus, juste avertir
            console.warn('⚠️ Téléchargement peut avoir échoué, mais image ajoutée à l\'historique');
            return filename;
        }
    }

    /**
     * Télécharger plusieurs images en batch
     */
    async downloadBatch(images) {
        const results = [];
        
        for (let i = 0; i < images.length; i++) {
            try {
                const filename = await this.downloadImageOrganized(
                    images[i].url,
                    images[i].metadata
                );
                results.push({ success: true, filename });
            } catch (error) {
                results.push({ success: false, error: error.message });
            }
            
            // Petite pause entre chaque téléchargement
            if (i < images.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        return results;
    }

    /**
     * Exporter l'historique en JSON
     */
    exportHistory() {
        const dataStr = JSON.stringify(this.history, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = window.URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `image-history-${new Date().toISOString().split('T')[0]}.json`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
}

// Instance globale
const imageStorage = new ImageStorage();
