// API Route - Génération d'images multi-providers
const fetch = require('node-fetch');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

    try {
        const {
            prompt,
            provider = 'openai',
            model    = 'dall-e-3',
            size     = '1024x1024',
            quality  = 'standard',
            apiKey   // Clé client (optionnel, fallback sur env)
        } = req.body;

        if (!prompt) return res.status(400).json({ error: 'Prompt requis' });

        console.log('🎨 Génération image:', { provider, model, size, quality });

        // Dispatcher selon le provider
        let result;
        switch (provider) {
            case 'openai':
                result = await generateOpenAI({ prompt, model, size, quality, apiKey });
                break;
            case 'google':
                result = await generateGoogle({ prompt, model, size, apiKey });
                break;
            case 'xai':
                result = await generateXAI({ prompt, model, size, apiKey });
                break;
            case 'stability':
                result = await generateStability({ prompt, model, size, apiKey });
                break;
            case 'bfl':
                result = await generateBFL({ prompt, model, size, apiKey });
                break;
            default:
                return res.status(400).json({ error: `Provider inconnu: ${provider}` });
        }

        console.log('✅ Image générée:', provider, model);
        return res.status(200).json({ success: true, ...result });

    } catch (error) {
        console.error('💥 Erreur génération:', error.message);
        return res.status(500).json({ error: error.message });
    }
};

// ── OpenAI (DALL-E 2, DALL-E 3, GPT-Image-1) ────────────────
async function generateOpenAI({ prompt, model, size, quality, apiKey }) {
    const key = apiKey || process.env.OPENAI_API_KEY;
    if (!key) throw new Error('Clé API OpenAI manquante');

    const body = {
        model,
        prompt: prompt.substring(0, 4000),
        n: 1,
        size,
    };

    if (model === 'dall-e-3')    body.quality = quality;
    if (model === 'gpt-image-1') body.quality = quality;

    const r = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify(body)
    });

    const d = await r.json();
    if (!r.ok) throw new Error(d.error?.message || `OpenAI error ${r.status}`);
    return { imageUrl: d.data[0].url, revisedPrompt: d.data[0].revised_prompt };
}

// ── Stability AI ─────────────────────────────────────────────
async function generateStability({ prompt, model, size, apiKey }) {
    const key = apiKey || process.env.STABILITY_API_KEY;
    if (!key) throw new Error('Clé API Stability AI manquante');

    const [ar] = [size]; // Stability utilise les ratios directement

    // Mapping modèle → endpoint
    const endpoints = {
        'sd3-ultra':  'https://api.stability.ai/v2beta/stable-image/generate/ultra',
        'sd3-large':  'https://api.stability.ai/v2beta/stable-image/generate/sd3',
        'sd3-medium': 'https://api.stability.ai/v2beta/stable-image/generate/sd3',
        'sd-core':    'https://api.stability.ai/v2beta/stable-image/generate/core',
    };
    const endpoint = endpoints[model] || endpoints['sd3-large'];

    const formData = new (require('form-data'))();
    formData.append('prompt', prompt);
    formData.append('output_format', 'webp');
    if (ar && ar !== '1024x1024') formData.append('aspect_ratio', ar);
    if (model === 'sd3-large' || model === 'sd3-medium') formData.append('model', model === 'sd3-large' ? 'sd3.5-large' : 'sd3.5-medium');

    const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Accept': 'application/json', ...formData.getHeaders() },
        body: formData
    });

    const d = await r.json();
    if (!r.ok) throw new Error(d.errors?.[0] || d.message || `Stability error ${r.status}`);

    // Retourner en base64 data URL
    const imageUrl = `data:image/webp;base64,${d.image}`;
    return { imageUrl };
}

// ── Black Forest Labs (FLUX) ─────────────────────────────────
async function generateBFL({ prompt, model, size, apiKey }) {
    const key = apiKey || process.env.BFL_API_KEY;
    if (!key) throw new Error('Clé API Black Forest Labs manquante');

    const endpointMap = {
        'flux-pro-1.1-ultra': 'https://api.bfl.ml/v1/flux-pro-1.1-ultra',
        'flux-pro-1.1':       'https://api.bfl.ml/v1/flux-pro-1.1',
        'flux-pro':           'https://api.bfl.ml/v1/flux-pro',
        'flux-dev':           'https://api.bfl.ml/v1/flux-dev',
    };
    const endpoint = endpointMap[model] || endpointMap['flux-pro'];

    const body = { prompt, width: 1024, height: 1024 };
    // Convertir ratio en dimensions
    if (size && size.includes(':')) {
        const dims = ratioToDimensions(size);
        body.width  = dims.width;
        body.height = dims.height;
    }

    // BFL API = polling
    const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Key': key },
        body: JSON.stringify(body)
    });
    const task = await r.json();
    if (!r.ok) throw new Error(task.detail || `BFL error ${r.status}`);

    // Polling résultat
    const imageUrl = await pollBFL(task.id, key);
    return { imageUrl };
}

async function pollBFL(taskId, key, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const r = await fetch(`https://api.bfl.ml/v1/get_result?id=${taskId}`, {
            headers: { 'X-Key': key }
        });
        const d = await r.json();
        if (d.status === 'Ready') return d.result.sample;
        if (d.status === 'Error') throw new Error('BFL generation failed');
    }
    throw new Error('BFL timeout');
}

// ── Google Imagen ────────────────────────────────────────────
async function generateGoogle({ prompt, model, size, apiKey }) {
    const key = apiKey || process.env.GOOGLE_API_KEY;
    if (!key) throw new Error('Clé API Google manquante');

    const ratioMap = {
        '1:1': '1:1', '3:4': '3:4', '4:3': '4:3', '9:16': '9:16', '16:9': '16:9'
    };
    const aspectRatio = (size && ratioMap[size]) ? ratioMap[size] : '1:1';

    // Imagen 3 via Gemini API
    const modelId = model || 'imagen-3.0-generate-002';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateImages?key=${key}`;

    const body = {
        prompt: { text: prompt },
        number_of_images: 1,
        aspect_ratio: aspectRatio,
        safety_filter_level: 'BLOCK_ONLY_HIGH',
        person_generation: 'ALLOW_ADULT'
    };

    const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const d = await r.json();
    if (!r.ok) throw new Error((d.error && d.error.message) || `Google Imagen error ${r.status}`);

    const b64 = d.generatedImages && d.generatedImages[0] && d.generatedImages[0].image && d.generatedImages[0].image.imageBytes;
    if (!b64) throw new Error('Google Imagen: aucune image retournée');

    const imageUrl = `data:image/png;base64,${b64}`;
    return { imageUrl };
}

// ── xAI / Grok Aurora ────────────────────────────────────────
async function generateXAI({ prompt, model, size, apiKey }) {
    const key = apiKey || process.env.XAI_API_KEY;
    if (!key) throw new Error('Clé API xAI manquante');

    const sizeMap = {
        '1:1': '1024x1024', '16:9': '1792x1024', '9:16': '1024x1792',
        '4:3': '1024x768',  '3:4': '768x1024'
    };
    const dimensions = (size && sizeMap[size]) ? sizeMap[size] : (size && size.includes('x') ? size : '1024x1024');

    const body = {
        model: model || 'grok-2-image-1212',
        prompt,
        n: 1,
        size: dimensions,
        response_format: 'url'
    };

    const r = await fetch('https://api.x.ai/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify(body)
    });
    const d = await r.json();
    if (!r.ok) throw new Error((d.error && d.error.message) || `xAI error ${r.status}`);
    return { imageUrl: d.data[0].url };
}

// ── Ideogram ─────────────────────────────────────────────────
async function generateIdeogram({ prompt, model, size, quality, apiKey }) {
    const key = apiKey || process.env.IDEOGRAM_API_KEY;
    if (!key) throw new Error('Clé API Ideogram manquante');

    const versionMap = { 'ideogram-v3': 'V_3', 'ideogram-v2': 'V_2', 'ideogram-v2-turbo': 'V_2_TURBO' };
    const qualityMap = { quality: 'QUALITY', balanced: 'BALANCED', turbo: 'TURBO' };

    const body = {
        image_request: {
            prompt,
            model:           versionMap[model] || 'V_2',
            magic_prompt_option: 'AUTO',
            style_type: 'AUTO',
        }
    };
    if (size && size.includes(':')) body.image_request.aspect_ratio = `ASPECT_${size.replace(':','_')}`;
    if (quality && qualityMap[quality]) body.image_request.rendering_quality = qualityMap[quality];

    const r = await fetch('https://api.ideogram.ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Api-Key': key },
        body: JSON.stringify(body)
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.message || `Ideogram error ${r.status}`);
    return { imageUrl: d.data[0].url };
}

// ── Replicate ────────────────────────────────────────────────
async function generateReplicate({ prompt, model, size, apiKey }) {
    const key = apiKey || process.env.REPLICATE_API_KEY;
    if (!key) throw new Error('Clé API Replicate manquante');

    const input = { prompt };
    if (size && size.includes(':')) {
        input.aspect_ratio = size;
    }

    const r = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({ input })
    });
    const prediction = await r.json();
    if (!r.ok) throw new Error(prediction.detail || `Replicate error ${r.status}`);

    // Polling
    const imageUrl = await pollReplicate(prediction.urls.get, key);
    return { imageUrl };
}

async function pollReplicate(url, key, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const r = await fetch(url, { headers: { 'Authorization': `Bearer ${key}` } });
        const d = await r.json();
        if (d.status === 'succeeded') return Array.isArray(d.output) ? d.output[0] : d.output;
        if (d.status === 'failed') throw new Error(d.error || 'Replicate generation failed');
    }
    throw new Error('Replicate timeout');
}

// ── Helpers ──────────────────────────────────────────────────
function ratioToDimensions(ratio) {
    const map = {
        '1:1': {width:1024,height:1024}, '16:9': {width:1344,height:768},
        '9:16': {width:768,height:1344}, '4:3': {width:1152,height:896},
        '3:4': {width:896,height:1152},  '3:2': {width:1216,height:832},
        '2:3': {width:832,height:1216},  '21:9': {width:1536,height:640},
        '9:21': {width:640,height:1536}
    };
    return map[ratio] || {width:1024,height:1024};
}
