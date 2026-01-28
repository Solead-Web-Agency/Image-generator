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
- ⚠️ Cette protection est **basique** et peut être contournée par un utilisateur technique
- ✅ Convient pour un **usage interne** ou une **démo privée**
- ❌ **NE PAS utiliser** pour des données sensibles

### **Fonctionnement** :

1. **sessionStorage** : L'authentification est stockée dans `sessionStorage`
   - ✅ Disparaît à la fermeture du navigateur
   - ✅ Pas de cookies
   - ✅ Isolé par onglet

2. **Accès direct** : Si l'utilisateur recharge la page, il devra se reconnecter

3. **Déconnexion** : Un bouton "🔓 Déconnexion" apparaît dans le header après connexion

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
