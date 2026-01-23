// Chargement et gestion des données de prompts

const PROMPTS_DATA = {
    v1: null,
    v2: null,
    v3: null,
    loaded: false,
    loading: false
};

// Charger les fichiers JSON de prompts
async function loadPromptsData() {
    if (PROMPTS_DATA.loaded || PROMPTS_DATA.loading) {
        return PROMPTS_DATA.loaded;
    }

    PROMPTS_DATA.loading = true;

    try {
        const [v1Response, v2Response, v3Response] = await Promise.all([
            fetch('rankwell-images-prompt.json'),
            fetch('rankwell-images-prompt-v2-glassmorphism.json'),
            fetch('rankwell-images-prompt-v3-fluid-organic.json')
        ]);

        if (!v1Response.ok || !v2Response.ok || !v3Response.ok) {
            throw new Error('Erreur lors du chargement des fichiers de prompts. Assurez-vous d\'utiliser un serveur web local.');
        }

        PROMPTS_DATA.v1 = await v1Response.json();
        PROMPTS_DATA.v2 = await v2Response.json();
        PROMPTS_DATA.v3 = await v3Response.json();
        PROMPTS_DATA.loaded = true;
        PROMPTS_DATA.loading = false;

        console.log('Prompts data loaded successfully');
        return true;
    } catch (error) {
        console.error('Error loading prompts data:', error);
        PROMPTS_DATA.loading = false;
        PROMPTS_DATA.loaded = false;
        throw error;
    }
}

// Vérifier si les données sont chargées
function isDataLoaded() {
    return PROMPTS_DATA.loaded;
}

// Obtenir les données d'un style spécifique
function getStyleData(styleVersion) {
    return PROMPTS_DATA[styleVersion];
}

// Obtenir les templates d'images pour un style donné
function getTemplatesForStyle(styleVersion) {
    const styleData = getStyleData(styleVersion);
    if (!styleData || !styleData.images) return [];
    
    return styleData.images.map(img => ({
        id: img.id,
        section: img.section,
        context: img.context
    }));
}

// Extraire les informations de style global
function extractGlobalStyle(styleVersion) {
    const styleData = getStyleData(styleVersion);
    if (!styleData) {
        console.error(`No data found for style: ${styleVersion}. Data loaded: ${PROMPTS_DATA.loaded}`);
        return null;
    }

    return {
        aesthetic: styleData.style_global?.aesthetic || '',
        colorPalette: styleData.style_global?.color_palette || [],
        mood: styleData.style_global?.mood || '',
        lighting: styleData.style_global?.lighting || '',
        composition: styleData.style_global?.composition || '',
        dimensions: styleData.style_global?.dimensions || '',
        keyEffects: styleData.style_global?.key_effects || [],
        visualLanguage: styleData.brand_identity?.visual_language || ''
    };
}

// Extraire un template spécifique
function getTemplate(styleVersion, templateId) {
    const styleData = getStyleData(styleVersion);
    if (!styleData || !styleData.images) return null;

    return styleData.images.find(img => img.id === templateId);
}

// Initialiser le chargement au démarrage
let dataLoadingPromise = loadPromptsData();
