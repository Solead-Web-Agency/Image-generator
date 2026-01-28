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
 * Cache l'overlay de login
 */
function hideLoginOverlay() {
    const overlay = document.getElementById('loginOverlay');
    overlay.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => {
        overlay.classList.add('hidden');
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
    }
    
    // Gérer la soumission du formulaire
    loginForm.addEventListener('submit', handleLogin);
    
    // Ajouter un bouton de déconnexion dans le header (optionnel)
    addLogoutButton();
}

/**
 * Ajoute un bouton de déconnexion dans le header
 */
function addLogoutButton() {
    // Attendre que le DOM soit complètement chargé
    const checkHeader = setInterval(() => {
        const header = document.querySelector('header');
        if (header && isAuthenticated()) {
            clearInterval(checkHeader);
            
            // Vérifier si le bouton n'existe pas déjà
            if (document.getElementById('logoutBtn')) return;
            
            const logoutBtn = document.createElement('button');
            logoutBtn.id = 'logoutBtn';
            logoutBtn.className = 'btn-secondary';
            logoutBtn.innerHTML = '🔓 Déconnexion';
            logoutBtn.style.cssText = 'position: absolute; top: 1rem; right: 1rem; padding: 0.5rem 1rem;';
            logoutBtn.onclick = logout;
            
            header.style.position = 'relative';
            header.appendChild(logoutBtn);
        }
    }, 100);
    
    // Arrêter après 5 secondes si le header n'est pas trouvé
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
