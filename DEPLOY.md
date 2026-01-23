# 🚀 Guide de Déploiement Rapide

## ✅ Étape 1 : Prérequis

```bash
# Installer Vercel CLI
npm i -g vercel

# Connexion à Vercel
vercel login
```

## 🔧 Étape 2 : Configuration

1. **Vérifiez `.env`** (local uniquement, non versionné) :
```
OPENAI_API_KEY=sk-votre-clé-ici
```

2. **Push sur GitHub** :
```bash
git add .
git commit -m "feat: backend Node.js + Vercel ready"
git push origin main
```

## ☁️ Étape 3 : Déploiement

### Option A : CLI (Plus rapide)

```bash
# 1. Déployer
vercel

# 2. Ajouter la clé API
vercel env add OPENAI_API_KEY
# Collez votre clé

# 3. Déploiement production
vercel --prod
```

### Option B : Dashboard Vercel

1. https://vercel.com/dashboard
2. "Add New Project"
3. Import votre repo GitHub  
4. Settings → Environment Variables → Add `OPENAI_API_KEY`
5. Deploy!

## ✨ C'est tout !

Votre app sera sur : `https://votre-app.vercel.app`

---

## 🧪 Test local avant déploiement

```bash
npm install
npm run dev
```

Ouvrez : http://localhost:3000

---

## 📝 Notes importantes

- ⚠️ **NE JAMAIS** commiter `.env`
- ✅ Utilisez `.env` en local
- ✅ Utilisez Vercel Environment Variables en prod
- 🔄 Chaque push sur `main` = redéploiement automatique

Voir `README.deployment.md` pour plus de détails.
