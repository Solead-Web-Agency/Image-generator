// Serveur de développement local
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Routes API
app.get('/api/check-config', require('./api/check-config'));
app.post('/api/generate-image', require('./api/generate-image'));
app.post('/api/save-image', require('./api/save-image'));
app.post('/api/analyze-page', require('./api/analyze-page'));
app.post('/api/analyze-website-style', require('./api/analyze-website-style'));
app.post('/api/scan-page-content', require('./api/scan-page-content'));
app.post('/api/search-library-images', require('./api/search-library-images'));
app.post('/api/analyze-library-style', require('./api/analyze-library-style'));

// Route principale
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`\n🚀 Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📁 Fichiers statiques depuis: ./public`);
    console.log(`🔑 API OpenAI configurée: ${process.env.OPENAI_API_KEY ? 'Oui ✅' : 'Non ❌'}\n`);
});
