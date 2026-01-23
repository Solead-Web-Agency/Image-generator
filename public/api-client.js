// Client API pour communiquer avec le backend

const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : '/api';

class APIClient {
    /**
     * Générer une image via le backend
     */
    static async generateImage(prompt, model = 'dall-e-3', size = '1024x1024', quality = 'standard') {
        console.log('🌐 Appel API backend - generate-image');
        
        try {
            const response = await fetch(`${API_BASE_URL}/generate-image`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt,
                    model,
                    size,
                    quality
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la génération');
            }

            return data;
        } catch (error) {
            console.error('❌ Erreur API generateImage:', error);
            throw error;
        }
    }

    /**
     * Sauvegarder une image sur le serveur
     */
    static async saveImage(imageUrl, metadata) {
        console.log('🌐 Appel API backend - save-image');
        
        try {
            const response = await fetch(`${API_BASE_URL}/save-image`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    imageUrl,
                    metadata
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la sauvegarde');
            }

            return data;
        } catch (error) {
            console.error('❌ Erreur API saveImage:', error);
            throw error;
        }
    }

    /**
     * Analyser une page avec GPT-4
     */
    static async analyzePage(sections, styleVersion) {
        console.log('🌐 Appel API backend - analyze-page');
        
        try {
            const response = await fetch(`${API_BASE_URL}/analyze-page`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sections,
                    styleVersion
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de l\'analyse');
            }

            return data;
        } catch (error) {
            console.error('❌ Erreur API analyzePage:', error);
            throw error;
        }
    }
}
