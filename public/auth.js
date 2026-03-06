/**
 * Système d'authentification simple
 * Identifiants stockés en dur (côté client)
 */

// ⚠️ CONFIGURATION : Modifier les identifiants ici
const VALID_CREDENTIALS = {
    username: 'admin',
    password: 'Rankwell2026!'
};

// Clé pour le sessionStorage
const AUTH_KEY = 'image_generator_auth';

/**
 * Vérifie si l'utilisateur est authentifié
 */
function isAuthenticated() {
    const authData = sessionStorage.getItem(AUTH_KEY);
    if (!authData) return false;
    
    try {
        const data = JSON.parse(authData);
        return data.authenticated === true;
    } catch (e) {
        return false;
    }
}

/**
 * Enregistre l'authentification
 */
function setAuthenticated() {
    sessionStorage.setItem(AUTH_KEY, JSON.stringify({
        authenticated: true,
        timestamp: Date.now()
    }));
}

/**
 * Déconnexion
 */
function logout() {
    sessionStorage.removeItem(AUTH_KEY);
    location.reload();
}

/**
 * Gère la soumission du formulaire de login
 */
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    // Vérification des identifiants
    if (username === VALID_CREDENTIALS.username && password === VALID_CREDENTIALS.password) {
        // Authentification réussie
        setAuthenticated();
        hideLoginOverlay();
        console.log('✅ Authentification réussie');
    } else {
        // Échec de l'authentification
        errorDiv.textContent = '❌ Identifiant ou mot de passe incorrect';
        errorDiv.style.display = 'block';
        
        // Shake animation sur les inputs
        const form = document.getElementById('loginForm');
        form.classList.add('shake');
        setTimeout(() => form.classList.remove('shake'), 500);
        
        // Vider le mot de passe
        document.getElementById('loginPassword').value = '';
        document.getElementById('loginPassword').focus();
        
        console.warn('⚠️ Tentative de connexion échouée');
    }
}

/**
 * Cache l'overlay de login et affiche l'application
 */
function hideLoginOverlay() {
    const overlay = document.getElementById('loginOverlay');
    const appContainer = document.getElementById('appContainer');
    
    overlay.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => {
        overlay.classList.add('hidden');
        // Afficher l'application
        if (appContainer) {
            appContainer.style.display = 'block';
        }
    }, 300);
}

/**
 * Affiche l'overlay de login
 */
function showLoginOverlay() {
    const overlay = document.getElementById('loginOverlay');
    overlay.classList.remove('hidden');
    overlay.style.animation = 'fadeIn 0.3s ease';
    document.getElementById('loginUsername').focus();
}

/**
 * Initialisation au chargement de la page
 */
function initAuth() {
    const loginForm = document.getElementById('loginForm');
    
    if (!loginForm) {
        console.error('❌ Formulaire de login non trouvé');
        return;
    }
    
    // Vérifier si déjà authentifié
    if (isAuthenticated()) {
        console.log('✅ Utilisateur déjà authentifié');
        hideLoginOverlay();
    } else {
        console.log('🔒 Authentification requise');
        showLoginOverlay();
        // S'assurer que l'app est cachée
        const appContainer = document.getElementById('appContainer');
        if (appContainer) {
            appContainer.style.display = 'none';
        }
    }
    
    // Gérer la soumission du formulaire
    loginForm.addEventListener('submit', handleLogin);
    
    // Ajouter un bouton de déconnexion dans le header (optionnel)
    addLogoutButton();
    
    // Vérifier périodiquement l'authentification (protection supplémentaire)
    startAuthMonitoring();
    
    // Protéger contre la manipulation DOM
    protectDOMManipulation();
}

/**
 * Surveille l'authentification et bloque l'accès si elle est perdue
 */
function startAuthMonitoring() {
    setInterval(() => {
        if (!isAuthenticated()) {
            const appContainer = document.getElementById('appContainer');
            const loginOverlay = document.getElementById('loginOverlay');
            
            if (appContainer) {
                appContainer.style.display = 'none';
            }
            if (loginOverlay) {
                loginOverlay.classList.remove('hidden');
            }
            
            console.warn('⚠️ Session expirée ou modifiée - accès révoqué');
        }
    }, 5000); // Vérifier toutes les 5 secondes
}

/**
 * Protège contre les tentatives de manipulation du DOM
 */
function protectDOMManipulation() {
    const appContainer = document.getElementById('appContainer');
    const loginOverlay = document.getElementById('loginOverlay');
    
    if (!appContainer || !loginOverlay) return;
    
    // Observer les changements sur le container de l'app
    const observer = new MutationObserver(() => {
        if (!isAuthenticated()) {
            // Si pas authentifié mais l'app est visible, la cacher
            if (appContainer.style.display !== 'none') {
                appContainer.style.display = 'none';
                console.warn('⚠️ Tentative d\'accès non autorisé détectée');
            }
            // Si l'overlay est caché, le réafficher
            if (loginOverlay.classList.contains('hidden')) {
                loginOverlay.classList.remove('hidden');
            }
        }
    });
    
    // Observer les changements de style
    observer.observe(appContainer, {
        attributes: true,
        attributeFilter: ['style', 'class']
    });
    
    observer.observe(loginOverlay, {
        attributes: true,
        attributeFilter: ['style', 'class']
    });
}

/**
 * Ajoute un bouton de déconnexion dans le header
 */
function addLogoutButton() {
    const checkHeader = setInterval(() => {
        const header = document.querySelector('header');
        if (header && isAuthenticated()) {
            clearInterval(checkHeader);
            if (document.getElementById('logoutBtn')) return;

            // Wrapper centré pour le titre
            const titleWrap = document.createElement('div');
            titleWrap.style.cssText = 'flex:1; text-align:center;';
            // Déplacer les enfants existants (h1, p) dans le wrapper
            while (header.firstChild) titleWrap.appendChild(header.firstChild);
            header.appendChild(titleWrap);

            // Groupe de boutons à droite
            const btnGroup = document.createElement('div');
            btnGroup.style.cssText = 'display:flex; gap:0.5rem; align-items:center; flex-shrink:0;';

            const settingsBtn = document.createElement('button');
            settingsBtn.id = 'settingsBtn';
            settingsBtn.className = 'btn-secondary';
            settingsBtn.innerHTML = '⚙️ Config IA';
            settingsBtn.onclick = () => settingsModal.open();

            const logoutBtn = document.createElement('button');
            logoutBtn.id = 'logoutBtn';
            logoutBtn.className = 'btn-secondary';
            logoutBtn.innerHTML = '🔓 Déconnexion';
            logoutBtn.onclick = logout;

            btnGroup.appendChild(settingsBtn);
            btnGroup.appendChild(logoutBtn);
            header.appendChild(btnGroup);
        }
    }, 100);
    setTimeout(() => clearInterval(checkHeader), 5000);
}

// Initialiser dès que le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}

// Ajouter une animation fadeOut au CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);
