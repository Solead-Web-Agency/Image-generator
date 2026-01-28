# 🔒 Configuration de l'authentification

## Identifiants de connexion

L'application est protégée par une authentification simple.

### **Identifiants par défaut** :

```
Identifiant : admin
Mot de passe : Rankwell2026!
```

---

## 🔧 Modifier les identifiants

Pour modifier les identifiants de connexion, édite le fichier :

```
public/auth.js
```

Ligne 8-11 :

```javascript
const VALID_CREDENTIALS = {
    username: 'admin',
    password: 'Rankwell2026!'
};
```

Change `username` et `password` par les valeurs de ton choix.

---

## 🔐 Sécurité

### **Important** :

- ⚠️ Les identifiants sont stockés **en dur côté client**
- ⚠️ Cette protection est **basique** et peut être contournée par un utilisateur technique avancé
- ✅ Convient pour un **usage interne** ou une **démo privée**
- ❌ **NE PAS utiliser** pour des données sensibles

### **Protections en place** :

1. **sessionStorage** : L'authentification est stockée dans `sessionStorage`
   - ✅ Disparaît à la fermeture du navigateur
   - ✅ Pas de cookies
   - ✅ Isolé par onglet

2. **Container caché** : L'application est cachée par défaut (`display: none`)
   - ✅ Supprimer l'overlay ne suffit pas
   - ✅ L'app n'est visible qu'après authentification

3. **Initialisation bloquée** : Les scripts ne s'initialisent pas sans authentification
   - ✅ `app.js` vérifie l'auth avant de démarrer

4. **Surveillance continue** :
   - ✅ Vérification toutes les 5 secondes
   - ✅ Détection des tentatives de manipulation DOM (MutationObserver)
   - ✅ Re-cache l'app si quelqu'un essaie de modifier le DOM

5. **Déconnexion** : Un bouton "🔓 Déconnexion" apparaît dans le header après connexion

---

## 🚀 Pour une meilleure sécurité

Si tu as besoin d'une vraie sécurité, il faudrait :

1. **Backend authentification** :
   - OAuth, Auth0, ou Firebase Auth
   - JWT tokens
   - Sessions serveur

2. **Protection API** :
   - Middleware d'authentification côté serveur
   - Rate limiting
   - IP whitelisting

3. **Hashage des mots de passe** :
   - bcrypt
   - Pas de stockage en clair

---

## 📝 Désactiver l'authentification

Pour désactiver complètement l'authentification :

1. Supprime le fichier `public/auth.js`
2. Retire la ligne `<script src="auth.js"></script>` dans `index.html`
3. Supprime le bloc `<div id="loginOverlay">` dans `index.html`

---

**Bon usage ! 🎨**
