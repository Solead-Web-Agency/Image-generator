# 🎨 Générateur d'Images avec Cohérence de Direction Artistique

Outil intelligent pour générer des images avec **DALL-E** tout en maintenant une **cohérence stylistique** parfaite. Changez le sujet de vos images sans perdre votre identité visuelle !

## 🚀 Démarrage Rapide

### Local

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer la clé API
cp .env.example .env
# Éditer .env et ajouter votre clé OpenAI

# 3. Lancer le serveur
npm run dev
```

Ouvrez : **http://localhost:3000**

### Déploiement Vercel

```bash
# 1. Installer Vercel CLI
npm i -g vercel

# 2. Déployer
vercel

# 3. Ajouter la clé API
vercel env add OPENAI_API_KEY

# 4. Production
vercel --prod
```

📖 Voir [DEPLOY.md](./DEPLOY.md) pour le guide complet

---

## ✨ Fonctionnalités

### 🎨 2 Modes de Travail

#### Mode 1 : Création Manuelle
- **3 Styles Visuels Pré-configurés** :
  - 🎯 **V1 - 3D Isométrique** : Moderne, tech-forward, gradients dynamiques
  - 💎 **V2 - Glassmorphism** : Minimal, élégant, effets de verre sophistiqués
  - 🌊 **V3 - Fluid Organic** : Formes fluides, gradients artistiques, créatif

- **Génération Intelligente de Prompts** :
  - Préservation automatique du style visuel
  - Intégration de votre nouveau sujet
  - Enrichissement optionnel par GPT-4
  
- **Intégration DALL-E** :
  - Support DALL-E 3 (qualité HD)
  - Support DALL-E 2 (plus rapide)
  - Différentes tailles d'images disponibles

#### Mode 2 : Scanner de Page 🔍
- **Analyse Automatique de Pages Web** :
  - Scanner une URL ou coller le HTML d'une page
  - Détection automatique des sections de contenu
  - Identification des zones sans images
  
- **Analyse IA Intelligente** :
  - GPT-4 analyse votre contenu
  - Suggère des images uniquement où c'est pertinent
  - Priorise les suggestions (high/medium/low)
  - Génère des sujets d'images adaptés à chaque section
  
- **Génération en Batch** :
  - Générez plusieurs images d'un coup
  - Cohérence stylistique garantie sur toutes les images
  - Sauvegarde automatique sur le serveur
  - Parfait pour illustrer un site web ou un article de blog complet

- **Stockage Backend** :
  - Images sauvegardées sur le serveur
  - Organisation automatique par date
  - Historique complet avec métadonnées
  - Export possible

---

## 🏗️ Architecture

```
Image-generator/
├── api/                      # Serverless Functions (Vercel)
│   ├── generate-image.js     # Génération DALL-E
│   ├── save-image.js         # Sauvegarde des images
│   └── analyze-page.js       # Analyse avec GPT-4
├── public/                   # Frontend statique
│   ├── index.html           # Interface principale
│   ├── app.js               # Logique frontend
│   ├── api-client.js        # Client pour le backend
│   ├── styles.css
│   └── generated-images/    # Images générées
├── server.js                # Serveur de dev local
├── vercel.json              # Config Vercel
└── package.json
```

---

## 📋 Prérequis

- Node.js 18+
- Compte OpenAI avec crédits
- (Optionnel) Compte Vercel pour le déploiement

---

## 🔧 Configuration

### Variables d'environnement

Créez un fichier `.env` :

```bash
OPENAI_API_KEY=sk-votre-clé-ici
PORT=3000
```

**Sur Vercel**, ajoutez dans Settings → Environment Variables :
- `OPENAI_API_KEY` : Votre clé OpenAI

---

## 📖 Utilisation

### Mode Manuel

1. Choisissez un style visuel (V1, V2 ou V3)
2. Décrivez votre sujet
3. Générez le prompt optimisé
4. Générez l'image avec DALL-E
5. L'image est automatiquement sauvegardée

### Mode Scanner

1. Sélectionnez un style visuel
2. Collez le HTML d'une page
3. L'outil détecte les sections
4. Analysez avec l'IA pour obtenir des suggestions
5. Générez les images sélectionnées

---

## 🎯 Cas d'Usage

### 1. Agence Marketing
Générez des illustrations cohérentes pour tous vos services

### 2. E-commerce
Créez des visuels de catégories avec un style unifié

### 3. Blog/Réseaux Sociaux
Illustrez vos articles avec votre charte graphique

### 4. Présentations
Générez des visuels professionnels et cohérents

---

## 💰 Coûts

### Vercel (Hosting)
- **Free** : 100GB bandwidth/mois
- **Pro** : $20/mois

### OpenAI (API)
- DALL-E 3 : ~$0.040-0.080 par image
- GPT-4 : ~$0.03 par 1K tokens

Surveillez : https://platform.openai.com/usage

---

## 🔒 Sécurité

- ✅ Clés API stockées dans variables d'environnement
- ✅ Jamais exposées au frontend
- ✅ `.env` non versionné
- ✅ CORS configuré
- ✅ Validation des inputs

---

## 🐛 Troubleshooting

### Erreur "OPENAI_API_KEY not found"
Vérifiez que `.env` existe et contient votre clé

### Images ne se génèrent pas
- Vérifiez vos crédits OpenAI
- Vérifiez que la clé API est valide
- Consultez la console (F12) pour les détails

### Serveur ne démarre pas
```bash
# Vérifier que le port 3000 est libre
lsof -ti:3000 | xargs kill -9

# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

---

## 📝 Licence

MIT

---

## 🤝 Contribution

Les contributions sont les bienvenues !

---

**Développé avec ❤️ pour maintenir la cohérence visuelle dans vos générations d'images**
