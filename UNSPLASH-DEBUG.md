# 🔍 Déboguer Unsplash - Erreur 401

## ❌ Erreur actuelle :
```
Library search error: Error: Unsplash API error: 401
```

**401 = "Non autorisé"** → La clé API n'est pas valide ou l'application n'est pas correctement configurée.

---

## ✅ Checklist de vérification

### 1. **Vérifier l'application Unsplash**

Allez sur : https://unsplash.com/oauth/applications

**Vérifiez que** :
- [ ] Votre application est **créée** et **active**
- [ ] L'application a le statut **"Demo"** ou **"Production"**
- [ ] Vous utilisez bien l'**Access Key** (pas le Secret Key !)

### 2. **Copier la bonne clé**

Sur la page de votre application :
- Trouvez la section **"Keys"**
- Copiez **"Access Key"** (commence par quelque chose comme `C_BIutX...`)
- ⚠️ **NE PAS** utiliser le "Secret Key"

**Format correct** :
```
Access Key: C_BIutXEwtgNGIxflsvM_lV6C0aYg7U6mruGPzJiyOI
             ↑ Commence souvent par des lettres majuscules
```

### 3. **Mettre à jour le .env**

Éditez le fichier `.env` :
```bash
UNSPLASH_ACCESS_KEY=VOTRE_NOUVELLE_CLE_ICI
```

### 4. **Redémarrer le serveur**

Dans le terminal :
```bash
Ctrl+C  (arrêter le serveur)
npm run dev  (relancer)
```

---

## 🧪 Test rapide

### Option A : Test dans le navigateur

1. Remplacez `VOTRE_CLE` par votre clé :
```
https://api.unsplash.com/search/photos?query=nature&client_id=VOTRE_CLE
```

2. Si ça fonctionne → vous verrez du JSON avec des images
3. Si erreur 401 → la clé n'est pas valide

### Option B : Test en ligne de commande

```bash
curl "https://api.unsplash.com/search/photos?query=nature&client_id=VOTRE_CLE"
```

---

## ⚠️ Problèmes courants

### Problème 1 : Application pas encore activée
**Solution** : Attendez 5-10 minutes après création de l'application

### Problème 2 : Limites de l'API dépassées
**Mode Demo** : 50 requêtes/heure
**Solution** : Attendez 1 heure ou passez en mode Production

### Problème 3 : Mauvaise clé copiée
**Solution** : Vérifiez que vous avez copié l'**Access Key** en entier, sans espaces

### Problème 4 : Application désactivée
**Solution** : Allez dans les settings de votre application et réactivez-la

---

## 📞 Support Unsplash

Si rien ne fonctionne :
- Documentation : https://unsplash.com/documentation
- Email : api@unsplash.com
- Statut API : https://status.unsplash.com/

---

## 🔄 Alternative temporaire : Mode sans Unsplash

En attendant de régler le problème, vous pouvez :
1. Utiliser uniquement **Pexels** (qui fonctionne)
2. Utiliser le **scanner de site web**
3. Utiliser les **presets** intégrés

---

**Après avoir vérifié la clé, redémarrez le serveur et réessayez !**
