# 🎨 Générateur d'Images avec Cohérence de Direction Artistique

Outil intelligent pour générer des images avec **DALL-E** tout en maintenant une **cohérence stylistique** parfaite. Changez le sujet de vos images sans perdre votre identité visuelle !

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

#### Mode 2 : Scanner de Page 🔍 **NOUVEAU !**
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
  - Téléchargement automatique avec noms descriptifs
  - Parfait pour illustrer un site web ou un article de blog complet

- **Interface Intuitive** :
  - Workflow guidé étape par étape
  - Édition manuelle du prompt possible
  - Téléchargement direct des images

- **Stockage Organisé** : 🆕
  - Organisation automatique par date (YYYY-MM-DD)
  - Noms de fichiers descriptifs avec timestamp
  - Historique complet des images générées
  - Export de l'historique en JSON
  - Métadonnées complètes (style, prompt, model, taille)

## 🚀 Installation

### Prérequis

- Un navigateur web moderne (Chrome, Firefox, Safari, Edge)
- Une clé API OpenAI ([obtenir une clé](https://platform.openai.com/api-keys))
- Un serveur web local (pour éviter les problèmes CORS)

### Démarrage Rapide

1. **Cloner ou télécharger le projet** :
   ```bash
   git clone <votre-repo>
   cd Image-generator
   ```

2. **Lancer un serveur web local** :

   **Option 1 - Python** :
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```

   **Option 2 - Node.js** :
   ```bash
   npx http-server -p 8000
   ```

   **Option 3 - PHP** :
   ```bash
   php -S localhost:8000
   ```

3. **Ouvrir dans votre navigateur** :
   ```
   http://localhost:8000
   ```

## 📖 Guide d'Utilisation

### 🎯 Choisir votre mode de travail

L'outil propose 2 modes :
1. **Création manuelle** : Pour créer une image unique
2. **Scanner une page** : Pour analyser une page web et générer plusieurs images

---

## Mode 1 : Création Manuelle

### Étape 1 : Choisir votre style

Sélectionnez l'un des 3 styles visuels disponibles :
- **3D Isométrique** pour un look tech et moderne
- **Glassmorphism** pour une élégance minimale
- **Fluid Organic** pour un aspect créatif et artistique

### Étape 2 : Template de référence (optionnel)

Vous pouvez sélectionner un template existant (GEO/SEO, SEA, ou Data Analytics) pour en copier la structure, ou laisser vide pour une création libre.

### Étape 3 : Décrire votre sujet

Décrivez ce que vous souhaitez illustrer. Par exemple :
```
Un service de marketing automation avec des workflows intelligents,
des campagnes email personnalisées et des analyses prédictives
```

### Étape 4 : Générer le prompt

Cliquez sur **"Générer le prompt optimisé"**. L'outil va :
- Extraire les caractéristiques stylistiques du style choisi
- Fusionner avec votre nouveau sujet
- Si vous avez configuré une clé API, utiliser GPT-4 pour enrichir le prompt

### Étape 5 : Générer l'image

Une fois le prompt généré :
1. Vérifiez le prompt (vous pouvez le modifier si besoin)
2. Configurez votre clé API OpenAI dans la section "Configuration"
3. Choisissez le modèle DALL-E et la taille
4. Cliquez sur **"Générer l'image avec DALL-E"**

### Étape 6 : Télécharger

Une fois l'image générée, vous pouvez :
- La télécharger directement
- Lancer une nouvelle génération
- Modifier le prompt et régénérer

---

## Mode 2 : Scanner une Page 🔍

### Étape 1 : Choisir votre style

Même si vous utilisez le mode scan, vous devez d'abord sélectionner un style visuel (dans la section "Création manuelle") qui sera appliqué à toutes les images générées.

### Étape 2 : Scanner la page

Deux options :

**Option A - URL** (peut ne pas fonctionner à cause de CORS) :
```
https://exemple.com/ma-page
```

**Option B - Coller le HTML** (recommandé) :
1. Ouvrez la page web que vous voulez illustrer
2. Clic droit → "Afficher le code source de la page"
3. Copiez tout le HTML (Ctrl+A puis Ctrl+C)
4. Collez dans la zone de texte

### Étape 3 : Voir les sections détectées

L'outil affiche toutes les sections trouvées avec :
- Le titre de la section
- Si elle a déjà une image ou non
- Un aperçu du contenu

### Étape 4 : Analyser avec l'IA

Cliquez sur **"Analyser avec l'IA"**. GPT-4 va :
- Analyser chaque section
- Déterminer quelles sections ont VRAIMENT besoin d'une image
- Suggérer un sujet d'image pertinent pour chacune
- Prioriser les suggestions (haute/moyenne/basse priorité)

### Étape 5 : Sélectionner les images à générer

- Toutes les suggestions sont sélectionnées par défaut
- Décochez celles que vous ne voulez pas générer
- Vous pouvez générer une image individuellement ou toutes d'un coup

### Étape 6 : Générer les images

**Option A - Une par une** :
Cliquez sur "Générer cette image" sur une suggestion spécifique

**Option B - En batch** :
Cliquez sur "Générer toutes les images sélectionnées"

Les images sont automatiquement téléchargées avec des noms descriptifs !

---

## 📚 Historique et Organisation des Images

### Structure des fichiers téléchargés

Toutes les images sont organisées automatiquement :

```
2026-01-23/
  ├── 1737654321000-v2-guide-complet-du-marketing-digital-en-2026.png
  ├── 1737654322000-v2-le-seo-referencement-naturel.png
  ├── 1737654323000-v2-le-sea-publicite-google-ads.png
  └── 1737654324000-v2-data-analytics-mesurer-pour-progresser.png
```

**Format du nom de fichier** :
```
[date]/[timestamp]-[style]-[sujet-nettoyé].png
```

### Historique Local

L'outil conserve un historique complet de toutes vos générations dans le navigateur (localStorage) :

- ✅ **Date et heure** de chaque génération
- ✅ **Style utilisé** (v1, v2, v3)
- ✅ **Sujet** de l'image
- ✅ **Prompt complet** utilisé
- ✅ **Modèle et taille** (DALL-E 3, 1792x1024, etc.)
- ✅ **Mode** (manuel ou scan)

### Actions disponibles

- **👁️ Voir le prompt** : Affiche le prompt complet utilisé
- **🗑️ Supprimer** : Retire une entrée de l'historique
- **🔄 Actualiser** : Recharge l'historique
- **📥 Exporter** : Télécharge l'historique complet en JSON
- **🗑️ Vider l'historique** : Supprime tout l'historique (irréversible)

### 💡 Exemple d'utilisation du mode scan

Vous avez un article de blog de 3000 mots sur "Comment optimiser son SEO" :

1. Sélectionnez le style **V1 - 3D Isométrique**
2. Collez le HTML de l'article
3. L'outil détecte 8 sections
4. L'IA suggère 4 images :
   - Introduction : Illustration du concept SEO général (priorité haute)
   - Section "Recherche de mots-clés" : Outil de recherche moderne (priorité haute)
   - Section "Backlinks" : Réseau de liens interconnectés (priorité moyenne)
   - Conclusion : Graphique de croissance de trafic (priorité basse)
5. Vous générez les 4 images en un clic
6. Toutes les images ont le même style 3D isométrique → cohérence visuelle parfaite !

---

## 🔑 Configuration API OpenAI

### Obtenir une clé API

1. Créez un compte sur [OpenAI Platform](https://platform.openai.com)
2. Allez dans [API Keys](https://platform.openai.com/api-keys)
3. Créez une nouvelle clé secrète
4. Copiez-la et collez-la dans la section "Configuration API" de l'outil

### Sécurité

- Votre clé API est **stockée localement** dans votre navigateur (localStorage)
- Elle n'est **jamais envoyée** ailleurs qu'à OpenAI
- Ne partagez **jamais** votre clé API publiquement

### Coûts

Les coûts dépendent du modèle utilisé :
- **DALL-E 3** : ~0.040$ par image (1024x1024), ~0.080$ par image (1792x1024)
- **DALL-E 2** : ~0.020$ par image (1024x1024)

Consultez la [page de tarification OpenAI](https://openai.com/pricing) pour les tarifs actuels.

## 🎯 Cas d'Usage

### 1. Agence Marketing
Générez des illustrations cohérentes pour tous vos services (SEO, SEA, Social Media, etc.) en conservant votre identité visuelle.

### 2. E-commerce
Créez des visuels de catégories de produits avec un style unifié.

### 3. Contenu Blog/Réseaux Sociaux
Illustrez vos articles avec des images qui respectent votre charte graphique.

### 4. Présentations
Générez rapidement des visuels professionnels et cohérents pour vos slides.

## 📁 Structure du Projet

```
Image-generator/
├── index.html                                    # Interface principale
├── styles.css                                    # Styles de l'application
├── app.js                                        # Logique de l'interface
├── prompt-generator.js                           # Générateur de prompts
├── prompts-data.js                              # Chargement des données JSON
├── rankwell-images-prompt.json                  # Style V1 (3D Isométrique)
├── rankwell-images-prompt-v2-glassmorphism.json # Style V2 (Glassmorphism)
├── rankwell-images-prompt-v3-fluid-organic.json # Style V3 (Fluid Organic)
└── README.md                                     # Ce fichier
```

## 🛠️ Technologies Utilisées

- **HTML5** / **CSS3** : Interface utilisateur
- **Vanilla JavaScript** : Logique applicative (pas de framework!)
- **OpenAI DALL-E API** : Génération d'images
- **OpenAI GPT-4** : Enrichissement des prompts (optionnel)

## 🔧 Personnalisation

### Ajouter vos propres styles

1. Créez un nouveau fichier JSON suivant la structure des fichiers existants
2. Ajoutez-le dans `prompts-data.js` :
   ```javascript
   const [v1Response, v2Response, v3Response, v4Response] = await Promise.all([
       // ... autres styles
       fetch('votre-nouveau-style.json')
   ]);
   PROMPTS_DATA.v4 = await v4Response.json();
   ```
3. Ajoutez une carte de style dans `index.html`

### Modifier les templates

Éditez directement les fichiers JSON pour :
- Changer les palettes de couleurs
- Modifier les descriptions de style
- Ajouter de nouveaux templates d'images

## ❓ FAQ

### L'outil ne charge pas les prompts ?
Vérifiez que vous utilisez un serveur web local (pas en ouvrant directement le fichier HTML). Les fichiers JSON nécessitent un serveur pour être chargés correctement.

### Erreur "CORS" ?
Utilisez un serveur web local au lieu d'ouvrir directement le fichier `index.html`.

### L'image générée ne correspond pas au style ?
- Essayez de régénérer avec un prompt légèrement modifié
- Utilisez l'enrichissement GPT-4 pour de meilleurs résultats
- Vérifiez que votre description de sujet est claire et détaillée

### Erreur "Failed to fetch" ?
- **Vérifiez votre clé API** : Assurez-vous qu'elle est valide et non révoquée
- **Vérifiez votre connexion internet** : L'API OpenAI doit être accessible
- **Consultez la console** : Ouvrez les DevTools (F12) pour voir les détails de l'erreur
- **Vérifiez vos crédits OpenAI** : Assurez-vous d'avoir du crédit sur votre compte OpenAI

### Puis-je utiliser d'autres APIs de génération d'images ?
L'outil est conçu pour DALL-E, mais vous pouvez modifier `app.js` pour supporter d'autres APIs (Midjourney, Stable Diffusion, etc.)

## 📝 Licence

Ce projet est fourni "tel quel" pour un usage personnel ou commercial. N'oubliez pas de respecter les [conditions d'utilisation d'OpenAI](https://openai.com/policies/usage-policies).

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer des améliorations
- Ajouter de nouveaux styles visuels

## 📧 Support

Pour toute question ou problème, ouvrez une issue sur le dépôt GitHub.

---

**Bonne création ! 🎨✨**
