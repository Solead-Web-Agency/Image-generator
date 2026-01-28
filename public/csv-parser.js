// Parser et analyseur CSV pour génération d'images

class CSVParser {
    constructor() {
        this.data = null;
        this.headers = [];
        this.imageColumns = [];
    }

    /**
     * Parser un fichier CSV
     */
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        
        if (lines.length < 2) {
            throw new Error('Le CSV doit contenir au moins une ligne d\'en-tête et une ligne de données');
        }

        // Parser l'en-tête
        this.headers = this.parseCSVLine(lines[0]);
        
        // Détecter les colonnes d'images (contenant "img" dans le nom)
        this.imageColumns = this.headers
            .map((header, index) => ({ header, index }))
            .filter(item => item.header.toLowerCase().includes('img'));

        if (this.imageColumns.length === 0) {
            throw new Error('Aucune colonne "img" détectée dans le CSV. Nommez vos colonnes avec "img" (ex: "img_produit", "image", "img1")');
        }

        // Parser les données
        this.data = [];
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = this.parseCSVLine(lines[i]);
                const row = {};
                this.headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                this.data.push(row);
            }
        }

        console.log('📊 CSV parsé:', {
            lignes: this.data.length,
            colonnes: this.headers.length,
            colonnesImages: this.imageColumns.length
        });

        return {
            headers: this.headers,
            data: this.data,
            imageColumns: this.imageColumns
        };
    }

    /**
     * Parser une ligne CSV (gère les guillemets)
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());

        return result;
    }

    /**
     * Analyser le contexte d'une ligne pour générer le sujet
     */
    async analyzeRowContext(row, imageColumnName, apiKey) {
        // Récupérer toutes les colonnes précédant la colonne image
        const imageColIndex = this.headers.indexOf(imageColumnName);
        const contextColumns = this.headers.slice(0, imageColIndex);

        // Construire le contexte
        const context = contextColumns
            .filter(col => row[col]) // Ignorer les valeurs vides
            .map(col => `${col}: ${row[col]}`)
            .join('\n');

        if (!context) {
            throw new Error(`Aucun contexte trouvé pour générer l'image de la ligne`);
        }

        console.log('🔍 Analyse contexte:', context);

        // Utiliser GPT pour extraire le sujet
        const systemMessage = `Tu es un expert en analyse de données et génération de prompts d'images.
Ta tâche est d'analyser un contexte extrait d'un CSV et d'en extraire un sujet clair pour générer une image.

Le sujet doit être :
- Descriptif et précis
- Basé sur TOUTES les informations contextuelles
- Adapté pour la génération d'image (visuel, concret)
- En français
- Maximum 100 mots`;

        const userMessage = `Contexte extrait du CSV :\n\n${context}\n\nExtrait le sujet principal pour générer une image qui représente visuellement ce contexte.
Retourne UNIQUEMENT le sujet, sans introduction ni explication.`;

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini', // Plus rapide et moins cher pour l'extraction
                    messages: [
                        { role: 'system', content: systemMessage },
                        { role: 'user', content: userMessage }
                    ],
                    temperature: 0.5,
                    max_tokens: 150
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Erreur lors de l\'analyse du contexte');
            }

            const subject = data.choices[0].message.content.trim();
            console.log('✅ Sujet extrait:', subject);

            return {
                subject,
                context,
                row
            };
        } catch (error) {
            console.error('❌ Erreur analyse contexte:', error);
            throw error;
        }
    }

    /**
     * Analyser tout le CSV et générer les sujets
     */
    async analyzeAllRows(apiKey) {
        const tasks = [];

        for (let rowIndex = 0; rowIndex < this.data.length; rowIndex++) {
            const row = this.data[rowIndex];

            for (const imageCol of this.imageColumns) {
                tasks.push({
                    rowIndex,
                    row,
                    imageColumn: imageCol.header,
                    subject: null // Sera rempli par l'analyse
                });
            }
        }

        console.log(`📋 ${tasks.length} image(s) à générer`);

        // Analyser les contextes un par un (pour éviter rate limit)
        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            
            try {
                const analysis = await this.analyzeRowContext(task.row, task.imageColumn, apiKey);
                task.subject = analysis.subject;
                task.context = analysis.context;
                task.status = 'ready';
            } catch (error) {
                console.error(`❌ Erreur analyse ligne ${i + 1}:`, error);
                task.subject = `Erreur: ${error.message}`;
                task.status = 'error';
            }

            // Petite pause entre chaque analyse
            if (i < tasks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        return tasks;
    }

    /**
     * Exporter les résultats en CSV
     */
    exportResultsCSV(tasks) {
        // Créer un nouveau CSV avec les URLs des images
        const newHeaders = [...this.headers];
        
        // Ajouter une colonne pour chaque colonne image
        this.imageColumns.forEach(col => {
            newHeaders.push(`${col.header}_url`);
            newHeaders.push(`${col.header}_prompt`);
        });

        let csv = newHeaders.join(',') + '\n';

        // Grouper les tâches par ligne
        const tasksByRow = {};
        tasks.forEach(task => {
            if (!tasksByRow[task.rowIndex]) {
                tasksByRow[task.rowIndex] = {};
            }
            tasksByRow[task.rowIndex][task.imageColumn] = task;
        });

        // Générer les lignes
        this.data.forEach((row, index) => {
            const values = this.headers.map(h => {
                const value = row[h] || '';
                // Échapper les guillemets
                return value.includes(',') || value.includes('"') 
                    ? `"${value.replace(/"/g, '""')}"` 
                    : value;
            });

            // Ajouter les URLs et prompts des images
            this.imageColumns.forEach(col => {
                const task = tasksByRow[index]?.[col.header];
                values.push(task?.imageUrl || '');
                values.push(task?.prompt || '');
            });

            csv += values.join(',') + '\n';
        });

        return csv;
    }

    /**
     * Obtenir les données
     */
    getData() {
        return this.data;
    }

    /**
     * Obtenir les en-têtes
     */
    getHeaders() {
        return this.headers;
    }

    /**
     * Obtenir les colonnes d'images
     */
    getImageColumns() {
        return this.imageColumns;
    }
}

// Instance globale
const csvParser = new CSVParser();
