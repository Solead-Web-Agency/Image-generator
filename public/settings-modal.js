/**
 * Gestion de la modale de configuration IA
 * Providers + modèles de génération d'images les plus puissants
 */

const settingsModal = (() => {

    const STORAGE_KEY = 'ai_settings_v3';

    // ── Catalogue des providers et leurs modèles ────────────────
    const PROVIDERS = [
        {
            id: 'openai',
            name: 'OpenAI',
            logo: '🤖',
            placeholder: 'sk-...',
            apiUrl: 'https://platform.openai.com/api-keys',
            models: [
                { id: 'gpt-image-1', label: 'GPT-Image-1',  badge: '⭐ Nouveau', sizes: ['1024x1024','1536x1024','1024x1536','auto'], qualities: ['low','medium','high','auto'] },
                { id: 'dall-e-3',    label: 'DALL-E 3',      badge: 'HD',        sizes: ['1024x1024','1792x1024','1024x1792'],          qualities: ['standard','hd'] },
                { id: 'dall-e-2',    label: 'DALL-E 2',      badge: 'Rapide',    sizes: ['256x256','512x512','1024x1024'],              qualities: [] },
            ]
        },
        {
            id: 'google',
            name: 'Google (Imagen)',
            logo: '🔍',
            placeholder: 'AIza...',
            apiUrl: 'https://aistudio.google.com/apikey',
            models: [
                { id: 'imagen-3.0-generate-002', label: 'Imagen 3',         badge: '⭐ Top',    sizes: ['1:1','3:4','4:3','9:16','16:9'], qualities: [] },
                { id: 'imagen-3.0-fast-generate-001', label: 'Imagen 3 Fast', badge: 'Rapide', sizes: ['1:1','3:4','4:3','9:16','16:9'], qualities: [] },
                { id: 'imagegeneration@006',     label: 'Imagen 2',         badge: 'Stable',   sizes: ['1:1','3:4','4:3','9:16','16:9'], qualities: [] },
            ]
        },
        {
            id: 'xai',
            name: 'xAI / Grok',
            logo: '𝕏',
            placeholder: 'xai-...',
            apiUrl: 'https://console.x.ai/',
            models: [
                { id: 'grok-2-image-1212', label: 'Grok 2 Image', badge: '⭐ Nouveau', sizes: ['1:1','16:9','9:16','4:3','3:4'], qualities: [] },
            ]
        },
        {
            id: 'stability',
            name: 'Stability AI',
            logo: '🎨',
            placeholder: 'sk-...',
            apiUrl: 'https://platform.stability.ai/account/keys',
            models: [
                { id: 'sd3-ultra',  label: 'Stable Image Ultra', badge: '⭐ Top',    sizes: ['1:1','16:9','21:9','2:3','3:2','4:5','5:4','9:16','9:21'], qualities: [] },
                { id: 'sd3-large',  label: 'SD3.5 Large',        badge: 'Puissant', sizes: ['1:1','16:9','21:9','2:3','3:2','4:5','5:4','9:16','9:21'], qualities: [] },
                { id: 'sd3-medium', label: 'SD3.5 Medium',       badge: 'Équilibré',sizes: ['1:1','16:9','2:3','3:2','4:5','5:4','9:16'],              qualities: [] },
                { id: 'sd-core',    label: 'Stable Image Core',  badge: 'Rapide',   sizes: ['1:1','16:9','21:9','2:3','3:2','4:5','5:4','9:16','9:21'], qualities: [] },
            ]
        },
        {
            id: 'bfl',
            name: 'FLUX (Black Forest Labs)',
            logo: '⚡',
            placeholder: 'key-...',
            apiUrl: 'https://api.bfl.ml',
            models: [
                { id: 'flux-pro-1.1-ultra', label: 'FLUX 1.1 Pro Ultra', badge: '⭐ Ultra', sizes: ['21:9','16:9','3:2','4:3','1:1','3:4','2:3','9:16','9:21'], qualities: [] },
                { id: 'flux-pro-1.1',       label: 'FLUX 1.1 Pro',       badge: 'Top',     sizes: ['1:1','16:9','9:16','4:3','3:4','3:2','2:3'],              qualities: [] },
                { id: 'flux-pro',           label: 'FLUX.1 Pro',          badge: 'Pro',     sizes: ['1:1','16:9','9:16','4:3','3:4','3:2','2:3'],              qualities: [] },
                { id: 'flux-dev',           label: 'FLUX.1 Dev',          badge: 'Open',    sizes: ['1:1','16:9','9:16','4:3','3:4','3:2','2:3'],              qualities: [] },
            ]
        },
    ];

    let state = {
        activeProvider: 'openai',
        providers: { openai: { key: '', serverDetected: false } },
        model:   'dall-e-3',
        size:    '1024x1024',
        quality: 'standard',
        serverHasKey: false
    };

    // ── Init ────────────────────────────────────────────────────
    async function init() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try { Object.assign(state, JSON.parse(saved)); } catch {}
        }

        // Vérifier clés serveur pour chaque provider
        try {
            const r = await fetch('/api/check-config');
            const d = await r.json();
            const cfg = d.configured || {};
            // Propager les clés serveur dans le state de chaque provider
            for (const prov of PROVIDERS) {
                if (!state.providers[prov.id]) state.providers[prov.id] = {};
                state.providers[prov.id].serverDetected = !!(cfg[prov.id]);
            }
            state.serverHasKey = PROVIDERS.some(p => state.providers[p.id] && state.providers[p.id].serverDetected);
        } catch {}

        _syncToApp();

        if (!state.serverHasKey && !_hasAnyKey()) {
            open(true);
        }
    }

    // ── Ouvrir / Fermer ─────────────────────────────────────────
    function open(mandatory = false) {
        const overlay = document.getElementById('settingsModal');
        if (!overlay) return;
        overlay.style.display = 'flex';
        _renderAll(mandatory);
    }

    function close() {
        document.getElementById('settingsModal').style.display = 'none';
    }

    // ── Rendu complet ───────────────────────────────────────────
    function _renderAll(mandatory = false) {
        _renderBanners(mandatory);
        _renderProviderSelector();
        _renderApiKey();
        _renderModelSelector();
        _renderGenerationParams();
        _bindButtons(mandatory);
    }

    function _renderBanners(mandatory) {
        const serverBanner = document.getElementById('serverKeyBanner');
        const noKeyWarning = document.getElementById('noKeyWarning');
        const closeBtn     = document.getElementById('settingsCloseBtn');
        if (serverBanner) serverBanner.style.display = state.serverHasKey ? 'block' : 'none';
        if (noKeyWarning) noKeyWarning.style.display = (!state.serverHasKey && !_hasAnyKey()) ? 'block' : 'none';
        if (closeBtn)     closeBtn.style.display = mandatory ? 'none' : 'block';
    }

    function _renderProviderSelector() {
        const container = document.getElementById('providersContainer');
        if (!container) return;

        const activeProv = PROVIDERS.find(p => p.id === state.activeProvider) || PROVIDERS[0];

        container.innerHTML = `
            <div style="display:flex; gap:0.75rem; align-items:flex-start; flex-wrap:wrap;">
                <div class="form-group" style="flex:1; min-width:180px;">
                    <label style="font-size:0.8rem; font-weight:600; color:var(--text-gray); text-transform:uppercase; letter-spacing:.05em;">Provider</label>
                    <select id="providerSelect" style="width:100%; margin-top:0.4rem;">
                        ${PROVIDERS.map(p => `
                            <option value="${p.id}" ${p.id === state.activeProvider ? 'selected' : ''}>
                                ${p.logo} ${p.name}
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group" style="flex:2; min-width:200px;" id="apiKeyGroup"></div>
            </div>
        `;

        document.getElementById('providerSelect').addEventListener('change', (e) => {
            state.activeProvider = e.target.value;
            // Réinitialiser le modèle au premier du nouveau provider
            const newProv = PROVIDERS.find(p => p.id === state.activeProvider);
            if (newProv?.models?.length) {
                state.model = newProv.models[0].id;
            }
            _renderApiKey();
            _renderModelSelector();
            _renderGenerationParams();
        });

        _renderApiKey();
    }

    function _renderApiKey() {
        const group = document.getElementById('apiKeyGroup');
        if (!group) return;

        const prov = PROVIDERS.find(p => p.id === state.activeProvider) || PROVIDERS[0];
        const provState = state.providers[state.activeProvider] || {};
        const isServer  = !!provState.serverDetected;
        const hasKey    = !!provState.key;

        let statusHtml = '';
        if (isServer) statusHtml = `<span class="provider-status server" style="margin-left:8px;">Serveur ✓</span>`;
        else if (hasKey) statusHtml = `<span class="provider-status ok" style="margin-left:8px;">Clé active ✓</span>`;
        else statusHtml = `<span class="provider-status missing" style="margin-left:8px;">Manquante</span>`;

        group.innerHTML = `
            <label style="font-size:0.8rem; font-weight:600; color:var(--text-gray); text-transform:uppercase; letter-spacing:.05em;">
                Clé API ${statusHtml}
                <a href="${prov.apiUrl}" target="_blank" style="font-size:0.75rem; color:var(--primary); margin-left:6px; font-weight:normal;">Obtenir →</a>
            </label>
            <input type="password" id="providerKeyInput"
                   placeholder="${isServer ? '(configurée sur le serveur)' : prov.placeholder}"
                   value="${provState.key || ''}"
                   autocomplete="off"
                   style="width:100%; margin-top:0.4rem; font-family:monospace;"
                   ${isServer && !provState.key ? 'disabled' : ''} />
        `;

        document.getElementById('providerKeyInput')?.addEventListener('input', (e) => {
            if (!state.providers[state.activeProvider]) state.providers[state.activeProvider] = {};
            state.providers[state.activeProvider].key = e.target.value.trim();
            _renderApiKey();
        });
    }

    function _renderModelSelector() {
        let container = document.getElementById('modelSelectorSection');
        if (!container) return;

        const prov = PROVIDERS.find(p => p.id === state.activeProvider) || PROVIDERS[0];
        const activeModel = prov.models.find(m => m.id === state.model) || prov.models[0];
        if (!prov.models.find(m => m.id === state.model)) {
            state.model = prov.models[0]?.id || state.model;
        }

        container.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:0.4rem;">
                ${prov.models.map(m => `
                    <label class="model-radio-card ${m.id === state.model ? 'selected' : ''}">
                        <input type="radio" name="modelChoice" value="${m.id}" ${m.id === state.model ? 'checked' : ''} style="display:none;" />
                        <span class="model-name">${m.label}</span>
                        <span class="model-badge">${m.badge}</span>
                    </label>
                `).join('')}
            </div>
        `;

        container.querySelectorAll('input[name="modelChoice"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                state.model = e.target.value;
                _renderModelSelector();
                _renderGenerationParams();
            });
        });
    }

    function _renderGenerationParams() {
        const container = document.getElementById('generationParamsSection');
        if (!container) return;

        const prov  = PROVIDERS.find(p => p.id === state.activeProvider) || PROVIDERS[0];
        const model = prov.models.find(m => m.id === state.model) || prov.models[0];

        const sizes     = model?.sizes     || ['1024x1024'];
        const qualities = model?.qualities || [];

        // Normaliser la taille stockée
        if (!sizes.includes(state.size)) state.size = sizes[0];
        if (qualities.length && !qualities.includes(state.quality)) state.quality = qualities[0];

        const isCustomSize = state.size === 'custom';
        const customVal    = state.customSize || '';

        container.innerHTML = `
            <div class="settings-grid">
                <div class="form-group">
                    <label>Format / Taille</label>
                    <select id="settingsSizeSelect">
                        ${sizes.map(s => `<option value="${s}" ${s === state.size ? 'selected' : ''}>${_formatSize(s)}</option>`).join('')}
                        <option value="custom" ${isCustomSize ? 'selected' : ''}>✏️ Personnalisé</option>
                    </select>
                </div>
                ${qualities.length > 0 ? `
                <div class="form-group">
                    <label>Qualité</label>
                    <select id="settingsQualitySelect">
                        ${qualities.map(q => `<option value="${q}" ${q === state.quality ? 'selected' : ''}>${_formatQuality(q)}</option>`).join('')}
                    </select>
                </div>` : ''}
            </div>
            <div id="customSizeRow" class="custom-size-row ${isCustomSize ? 'visible' : ''}">
                <div class="size-field">
                    <label>Largeur (px)</label>
                    <input type="number" id="customWidth" min="64" max="4096" step="64"
                           placeholder="1024" value="${customVal.split('x')[0] || ''}" />
                </div>
                <span class="size-sep">×</span>
                <div class="size-field">
                    <label>Hauteur (px)</label>
                    <input type="number" id="customHeight" min="64" max="4096" step="64"
                           placeholder="1024" value="${customVal.split('x')[1] || ''}" />
                </div>
            </div>
        `;

        const sizeSelect = document.getElementById('settingsSizeSelect');
        const customRow  = document.getElementById('customSizeRow');
        sizeSelect?.addEventListener('change', e => {
            state.size = e.target.value;
            customRow.classList.toggle('visible', state.size === 'custom');
        });
        document.getElementById('settingsQualitySelect')?.addEventListener('change', e => state.quality = e.target.value);

        const updateCustomSize = () => {
            const w = document.getElementById('customWidth')?.value;
            const h = document.getElementById('customHeight')?.value;
            if (w && h) state.customSize = `${w}x${h}`;
        };
        document.getElementById('customWidth')?.addEventListener('input', updateCustomSize);
        document.getElementById('customHeight')?.addEventListener('input', updateCustomSize);
    }

    function _bindButtons(mandatory) {
        const closeBtn = document.getElementById('settingsCloseBtn');
        const saveBtn  = document.getElementById('settingsSaveBtn');

        // Retirer les anciens listeners (remplacer les éléments)
        closeBtn?.replaceWith(closeBtn.cloneNode(true));
        saveBtn?.replaceWith(saveBtn.cloneNode(true));

        document.getElementById('settingsCloseBtn')?.addEventListener('click', () => {
            if (!mandatory) close();
        });
        document.getElementById('settingsSaveBtn')?.addEventListener('click', save);

        const overlay = document.getElementById('settingsModal');
        overlay.onclick = (e) => { if (!mandatory && e.target === overlay) close(); };
    }

    // ── Sauvegarder ─────────────────────────────────────────────
    function save() {
        // Lire les valeurs actuelles des selects
        const sizeSel    = document.getElementById('settingsSizeSelect');
        const qualSel    = document.getElementById('settingsQualitySelect');
        if (sizeSel)  state.size    = sizeSel.value;
        if (qualSel)  state.quality = qualSel.value;

        // Persister la clé OpenAI pour compat avec app.js
        const openaiKey = state.providers?.openai?.key;
        if (openaiKey) localStorage.setItem('openai_api_key', openaiKey);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        _syncToApp();
        close();

        if (typeof app !== 'undefined' && app.showMessage) {
            app.showMessage('✅ Configuration sauvegardée !', 'success');
        }
    }

    // ── Sync vers app.js ────────────────────────────────────────
    function _syncToApp() {
        const sync = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        sync('modelSelect',   state.model);
        sync('sizeSelect',    state.size);
        sync('qualitySelect', state.quality);

        const key = state.providers?.openai?.key || localStorage.getItem('openai_api_key') || '';
        sync('apiKeyInput', key);

        if (typeof app !== 'undefined') {
            if (key) app.apiKey = key;
            if (state.serverHasKey) app.useServerKeys = true;
            app.activeProvider = state.activeProvider;
        }
    }

    function _hasAnyKey() {
        return Object.values(state.providers || {}).some(p => p.key) || !!localStorage.getItem('openai_api_key');
    }

    function _formatSize(s) {
        const map = {
            '1024x1024':'1024×1024 — Carré','1792x1024':'1792×1024 — Paysage','1024x1792':'1024×1792 — Portrait',
            '256x256':'256×256','512x512':'512×512',
            '1536x1024':'1536×1024 — Paysage','1024x1536':'1024×1536 — Portrait','auto':'Auto',
            '1:1':'1:1 — Carré','16:9':'16:9 — Paysage','9:16':'9:16 — Portrait','4:3':'4:3','3:4':'3:4',
            '3:2':'3:2','2:3':'2:3','21:9':'21:9 — Ultra large','9:21':'9:21 — Ultra haut',
            '4:5':'4:5','5:4':'5:4','1:3':'1:3','3:1':'3:1'
        };
        return map[s] || s;
    }

    function _formatQuality(q) {
        const map = { standard:'Standard', hd:'HD', low:'Basse', medium:'Moyenne', high:'Haute', auto:'Auto', quality:'Qualité', balanced:'Équilibré', turbo:'Turbo' };
        return map[q] || q;
    }

    // ── Getters publics ─────────────────────────────────────────
    function getActiveProvider() { return state.activeProvider; }
    function getModel()          { return state.model; }
    function getSize()           { return state.size === 'custom' ? (state.customSize || '1024x1024') : state.size; }
    function getQuality()        { return state.quality; }
    function getApiKey(provider) {
        const p = provider || state.activeProvider;
        return state.providers?.[p]?.key || (p === 'openai' ? localStorage.getItem('openai_api_key') || '' : '');
    }
    function getProviderConfig() {
        return PROVIDERS.find(p => p.id === state.activeProvider);
    }

    return { init, open, close, save, getActiveProvider, getModel, getSize, getQuality, getApiKey, getProviderConfig };
})();

// Init après authentification
document.addEventListener('DOMContentLoaded', () => {
    const wait = setInterval(() => {
        const c = document.getElementById('appContainer');
        if (c && c.style.display !== 'none') {
            clearInterval(wait);
            settingsModal.init();
        }
    }, 200);
    setTimeout(() => clearInterval(wait), 10000);
});
