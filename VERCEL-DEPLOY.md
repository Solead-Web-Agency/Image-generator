# 🚀 Déploiement sur Vercel

## ✅ Code poussé sur GitHub !

Le code a été poussé avec succès sur :
```
https://github.com/Solead-Web-Agency/Image-generator
```

---

## 📋 Étapes pour déployer sur Vercel

### **1. Aller sur Vercel**

Ouvre : https://vercel.com/

**Connecte-toi** avec ton compte GitHub

---

### **2. Importer le projet**

1. Clique sur **"Add New..."** → **"Project"**
2. Sélectionne le repository **`Solead-Web-Agency/Image-generator`**
3. Clique sur **"Import"**

---

### **3. Configurer les variables d'environnement**

⚠️ **TRÈS IMPORTANT** : Ajoute ces variables d'environnement dans Vercel :

#### **Dans la section "Environment Variables"** :

| **Nom** | **Valeur** |
|---------|-----------|
| `OPENAI_API_KEY` | ⚠️ **Utilise la clé de ton fichier `.env`** |
| `UNSPLASH_ACCESS_KEY` | ⚠️ **Utilise la clé de ton fichier `.env`** |
| `PEXELS_API_KEY` | ⚠️ **Utilise la clé de ton fichier `.env`** |

**Pour chaque variable** :
1. Clique sur **"Add Variable"**
2. Entre le **Nom**
3. Colle la **Valeur**
4. Coche **"Production", "Preview", "Development"**
5. Clique sur **"Save"**

---

### **4. Déployer**

1. Laisse les **Build Settings** par défaut (Vercel détecte automatiquement avec `vercel.json`)
2. Clique sur **"Deploy"** 🚀

---

### **5. Attendre le déploiement**

⏰ Le déploiement prend **2-5 minutes**

Tu verras :
- ✅ Building...
- ✅ Deploying...
- ✅ Ready!

---

## 🎉 Ton app sera en ligne !

Une fois déployée, tu auras une URL comme :
```
https://image-generator-xxx.vercel.app
```

---

## ⚠️ **Notes importantes**

### **1. Puppeteer sur Vercel**

⚠️ **Puppeteer peut ne pas fonctionner sur Vercel** (limite de taille)

**Solutions** :
- Utiliser `puppeteer-core` + Chrome AWS Lambda
- Ou utiliser **Vercel Edge Functions**
- Ou désactiver le scanner de site en production

Si le scanner de site ne fonctionne pas sur Vercel, tu peux :
1. Utiliser uniquement les **Presets**
2. Utiliser **Pexels** (qui fonctionne)

### **2. Stocker les images générées**

Sur Vercel, le système de fichiers est **read-only** !

**Pour stocker les images** :
- Utilise **Vercel Blob Storage** (payant)
- Ou **AWS S3**
- Ou **Cloudinary**

Actuellement, les images générées ne seront **pas sauvegardées** sur Vercel.

---

## 🔧 **Après le déploiement**

### **Tester les fonctionnalités** :

1. ✅ **Presets** → Devrait fonctionner
2. ⚠️ **Scanner un site** → Peut ne pas fonctionner (Puppeteer)
3. ✅ **Pexels** → Devrait fonctionner
4. ✅ **Génération d'images** → Devrait fonctionner
5. ⚠️ **Sauvegarde d'images** → Ne fonctionnera pas (read-only)

---

## 📞 **Support**

Si tu rencontres des problèmes :
- Vérifie les **logs** dans Vercel Dashboard → Functions
- Vérifie que les **variables d'environnement** sont bien configurées
- Contacte-moi si besoin !

---

**Bon déploiement ! 🚀**
