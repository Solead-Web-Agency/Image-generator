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
    console.log('🔄 [loadPromptsData] START - loaded:', PROMPTS_DATA.loaded, 'loading:', PROMPTS_DATA.loading);
    
    if (PROMPTS_DATA.loaded) {
        console.log('✅ [loadPromptsData] Already loaded, returning immediately');
        return true;
    }
    
    if (PROMPTS_DATA.loading) {
        console.log('⏳ [loadPromptsData] Already loading, waiting...');
        return new Promise(resolve => {
            const checkInterval = setInterval(() => {
                if (PROMPTS_DATA.loaded) {
                    clearInterval(checkInterval);
                    resolve(true);
                }
            }, 100);
        });
    }

    PROMPTS_DATA.loading = true;
    console.log('🌐 [loadPromptsData] Starting fetch...');

    try {
        console.log('📡 Fetching JSON files...');
        const [v1Response, v2Response, v3Response] = await Promise.all([
            fetch('rankwell-images-prompt.json').then(r => {
                console.log('📄 V1 response status:', r.status, r.ok);
                return r;
            }),
            fetch('rankwell-images-prompt-v2-glassmorphism.json').then(r => {
                console.log('📄 V2 response status:', r.status, r.ok);
                return r;
            }),
            fetch('rankwell-images-prompt-v3-fluid-organic.json').then(r => {
                console.log('📄 V3 response status:', r.status, r.ok);
                return r;
            })
        ]);

        if (!v1Response.ok || !v2Response.ok || !v3Response.ok) {
            throw new Error(`HTTP Error: v1=${v1Response.status}, v2=${v2Response.status}, v3=${v3Response.status}`);
        }

        console.log('📦 Parsing JSON...');
        PROMPTS_DATA.v1 = await v1Response.json();
        console.log('✅ V1 parsed:', !!PROMPTS_DATA.v1);
        PROMPTS_DATA.v2 = await v2Response.json();
        console.log('✅ V2 parsed:', !!PROMPTS_DATA.v2);
        PROMPTS_DATA.v3 = await v3Response.json();
        console.log('✅ V3 parsed:', !!PROMPTS_DATA.v3);
        
        PROMPTS_DATA.loaded = true;
        PROMPTS_DATA.loading = false;

        console.log('✅ [loadPromptsData] SUCCESS - All data loaded!');
        return true;
    } catch (error) {
        console.error('❌ [loadPromptsData] ERROR:', error);
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
console.log('🚀 [INIT] Démarrage du chargement des données JSON...');
let dataLoadingPromise = loadPromptsData()
    .then(result => {
        console.log('🎉 [INIT] Données JSON chargées avec succès !', { 
            v1: !!PROMPTS_DATA.v1, 
            v2: !!PROMPTS_DATA.v2, 
            v3: !!PROMPTS_DATA.v3,
            loaded: PROMPTS_DATA.loaded 
        });
        return result;
    })
    .catch(error => {
        console.error('💥 [INIT] Erreur chargement JSON:', error);
        throw error;
    });

console.log('📋 [INIT] dataLoadingPromise created:', dataLoadingPromise);
