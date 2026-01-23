# 🚀 Déploiement sur Vercel

## 📋 Prérequis

1. Compte Vercel : https://vercel.com
2. Vercel CLI installé : `npm i -g vercel`
3. Clé API OpenAI valide

## 🔧 Configuration locale

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer les variables d'environnement

Créez un fichier `.env` :

```bash
cp .env.example .env
```

Modifiez `.env` et ajoutez votre clé OpenAI :

```
OPENAI_API_KEY=sk-votre-clé-ici
PORT=3000
```

### 3. Tester en local

```bash
npm run dev
```

Ouvrez : http://localhost:3000

---

## ☁️ Déploiement sur Vercel

### Méthode 1 : Via CLI (Recommandé)

```bash
# 1. Connexion à Vercel
vercel login

# 2. Premier déploiement
vercel

# Suivez les instructions :
# - Set up and deploy? Yes
# - Which scope? Votre compte
# - Link to existing project? No
# - Project name? image-generator (ou autre)
# - Directory? ./
# - Override settings? No

# 3. Configurer les variables d'environnement
vercel env add OPENAI_API_KEY
# Collez votre clé OpenAI

# 4. Déploiement en production
vercel --prod
```

### Méthode 2 : Via GitHub + Vercel Dashboard

1. **Push sur GitHub** :

```bash
git add .
git commit -m "Initial commit with backend"
git push origin main
```

2. **Sur Vercel Dashboard** :
   - Allez sur https://vercel.com/dashboard
   - Cliquez sur "Add New Project"
   - Import depuis votre repo GitHub
   - Configure Project :
     - Framework Preset: **Other**
     - Root Directory: `./`
     - Build Command: (laisser vide)
     - Output Directory: `public`

3. **Configurer les variables d'environnement** :
   - Dans Settings → Environment Variables
   - Ajoutez : `OPENAI_API_KEY` = votre clé
   - Environment: Production, Preview, Development

4. **Deploy** !

---

## 📁 Structure du projet

```
Image-generator/
├── api/                          # API Routes Vercel
│   ├── generate-image.js         # Génération DALL-E
│   ├── save-image.js             # Sauvegarde des images
│   └── analyze-page.js           # Analyse avec GPT-4
├── public/                       # Frontend statique
│   ├── index.html
│   ├── app.js
│   ├── api-client.js             # Client pour appeler le backend
│   ├── styles.css
│   └── generated-images/         # Images sauvegardées
├── .env                          # Variables locales (non versionné)
├── .env.example                  # Template
├── package.json
├── vercel.json                   # Config Vercel
└── README.md
```

---

## 🔒 Sécurité

### Variables d'environnement

❌ **NE JAMAIS** commiter :
- `.env`
- Clés API directement dans le code
- `node_modules/`

✅ **Toujours** :
- Utiliser les variables d'environnement Vercel
- Ajouter `.env` au `.gitignore`
- Utiliser `.env.example` comme template

### Sur Vercel

Les variables d'environnement sont stockées de manière sécurisée et ne sont jamais exposées au frontend.

---

## 🧪 Tester après déploiement

Une fois déployé sur Vercel, testez :

1. **Page principale** : https://votre-app.vercel.app
2. **API generate-image** :
```bash
curl -X POST https://votre-app.vercel.app/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{"prompt": "a blue circle", "model": "dall-e-3", "size": "1024x1024"}'
```

3. **Génération d'image** dans l'interface

---

## 🐛 Troubleshooting

### Erreur "OPENAI_API_KEY not found"

Vérifiez que la variable est bien configurée :
```bash
vercel env ls
```

Si non :
```bash
vercel env add OPENAI_API_KEY
```

### Images ne se sauvegardent pas

Vercel a un système de fichiers éphémère. Les images sont sauvegardées temporairement mais disparaissent après redéploiement.

**Solution** : Utiliser un service de stockage cloud (S3, Cloudinary, etc.) - à implémenter si nécessaire.

### Erreur 504 Timeout

Les fonctions Vercel ont un timeout de 10s (gratuit) ou 60s (pro).
Si la génération prend trop de temps, passez au plan Pro ou optimisez.

---

## 📊 Monitoring

Sur le dashboard Vercel :
- **Functions** : Logs des API calls
- **Deployments** : Historique des déploiements
- **Analytics** : Statistiques d'utilisation

---

## 🔄 Mises à jour

Pour déployer une nouvelle version :

```bash
git add .
git commit -m "Description des changements"
git push origin main
```

Vercel redéploie automatiquement !

Ou en CLI :
```bash
vercel --prod
```

---

## 💰 Coûts

### Vercel (Hosting)
- **Free** : 100GB bandwidth/mois, fonctions serverless limitées
- **Pro** : $20/mois, plus de ressources

### OpenAI (API)
- DALL-E 3 : ~$0.040-0.080 par image
- GPT-4 : ~$0.03 par 1K tokens

**Surveillez votre usage sur** : https://platform.openai.com/usage

---

Bon déploiement ! 🚀
