// Step 61 - Questionari di gradimento cartacei e monitoraggio qualità.
// La compilazione dei questionari resta manuale; nel progetto si archiviano stato,
// medie riepilogative, giudizio e azioni di miglioramento.

window.GRADIMENTO_STATUS_LABELS = {
    non_avviato: 'Non avviato',
    da_stampare: 'Questionari da stampare',
    distribuito: 'Questionari distribuiti',
    raccolto: 'Questionari raccolti',
    elaborato: 'Questionari elaborati'
};

window.MONITORAGGIO_ESITI = {
    da_valutare: 'Da valutare',
    si: 'Sì',
    parzialmente: 'Parzialmente',
    no: 'No'
};

window.MONITORAGGIO_ITEMS = {
    partecipazione: 'Partecipazione attiva dei corsisti',
    interesse: 'Interesse e motivazione',
    completezza: 'Completezza dei contenuti erogati',
    programma_tempi: 'Rispetto del programma e dei tempi',
    chiarezza: 'Chiarezza espositiva dei formatori'
};

window.MONITORAGGIO_METODI = {
    test_scritto: 'Test scritto',
    prova_pratica: 'Prova pratica',
    colloquio: 'Colloquio finale',
    osservazione: 'Osservazione in itinere'
};

window.step61NumberOrNull = function(value, min, max) {
    if (value === '' || value === null || value === undefined) return null;
    const number = Number(value);
    if (!Number.isFinite(number)) return null;
    return Math.min(max, Math.max(min, number));
};

window.collectGradimentoMonitoraggioRecord = function() {
    const monitoring = {};
    document.querySelectorAll('.prog-monitoraggio-item').forEach(el => {
        monitoring[el.dataset.monitoraggioKey] = el.value || 'da_valutare';
    });
    const methods = Array.from(document.querySelectorAll('.prog-monitoraggio-metodo:checked')).map(el => el.value);
    return {
        gradimento_stato: document.getElementById('prog-gradimento-stato')?.value || 'non_avviato',
        gradimento_questionari_raccolti: Math.max(0, Number(document.getElementById('prog-gradimento-raccolti')?.value || 0)),
        gradimento_media_didattica: window.step61NumberOrNull(document.getElementById('prog-gradimento-media-didattica')?.value, 1, 5),
        gradimento_media_organizzativa: window.step61NumberOrNull(document.getElementById('prog-gradimento-media-organizzativa')?.value, 1, 5),
        gradimento_media_utilita: window.step61NumberOrNull(document.getElementById('prog-gradimento-media-utilita')?.value, 1, 5),
        gradimento_media_complessiva: window.step61NumberOrNull(document.getElementById('prog-gradimento-media-complessiva')?.value, 1, 10),
        gradimento_commenti: (document.getElementById('prog-gradimento-commenti')?.value || '').trim() || null,
        monitoraggio_data: document.getElementById('prog-monitoraggio-data')?.value || null,
        monitoraggio_in_itinere: monitoring,
        monitoraggio_metodi: methods,
        monitoraggio_esito_apprendimento: (document.getElementById('prog-monitoraggio-esito')?.value || '').trim() || null,
        monitoraggio_giudizio_finale: document.getElementById('prog-monitoraggio-giudizio')?.value || 'da_valutare',
        monitoraggio_criticita: (document.getElementById('prog-monitoraggio-criticita')?.value || '').trim() || null,
        monitoraggio_miglioramenti: (document.getElementById('prog-monitoraggio-miglioramenti')?.value || '').trim() || null
    };
};

window.populateGradimentoMonitoraggioForm = function(project = {}) {
    const set = (id, value = '') => {
        const el = document.getElementById(id);
        if (el) el.value = value ?? '';
    };
    set('prog-gradimento-stato', project.gradimento_stato || 'non_avviato');
    set('prog-gradimento-raccolti', project.gradimento_questionari_raccolti ?? 0);
    set('prog-gradimento-media-didattica', project.gradimento_media_didattica ?? '');
    set('prog-gradimento-media-organizzativa', project.gradimento_media_organizzativa ?? '');
    set('prog-gradimento-media-utilita', project.gradimento_media_utilita ?? '');
    set('prog-gradimento-media-complessiva', project.gradimento_media_complessiva ?? '');
    set('prog-gradimento-commenti', project.gradimento_commenti || '');
    set('prog-monitoraggio-data', project.monitoraggio_data || '');
    set('prog-monitoraggio-esito', project.monitoraggio_esito_apprendimento || '');
    set('prog-monitoraggio-giudizio', project.monitoraggio_giudizio_finale || 'da_valutare');
    set('prog-monitoraggio-criticita', project.monitoraggio_criticita || '');
    set('prog-monitoraggio-miglioramenti', project.monitoraggio_miglioramenti || '');

    const monitoring = window.parseJSONSafe
        ? window.parseJSONSafe(project.monitoraggio_in_itinere || {}, {})
        : (project.monitoraggio_in_itinere || {});
    document.querySelectorAll('.prog-monitoraggio-item').forEach(el => {
        el.value = monitoring[el.dataset.monitoraggioKey] || 'da_valutare';
    });

    const methods = new Set(window.step60Array ? window.step60Array(project.monitoraggio_metodi) : (project.monitoraggio_metodi || []));
    document.querySelectorAll('.prog-monitoraggio-metodo').forEach(el => {
        el.checked = methods.has(el.value);
    });
};

window.resetGradimentoMonitoraggioForm = function() {
    const dateInput = document.getElementById('prog-monitoraggio-data');
    if (dateInput) dateInput.value = '';
    const status = document.getElementById('prog-gradimento-stato');
    if (status) status.value = 'non_avviato';
    const judgment = document.getElementById('prog-monitoraggio-giudizio');
    if (judgment) judgment.value = 'da_valutare';
    document.querySelectorAll('.prog-monitoraggio-item').forEach(el => { el.value = 'da_valutare'; });
    document.querySelectorAll('.prog-monitoraggio-metodo').forEach(el => { el.checked = false; });
};

window.getGradimentoMonitoraggioStatus = function(project = {}) {
    const monitoring = window.parseJSONSafe
        ? window.parseJSONSafe(project.monitoraggio_in_itinere || {}, {})
        : (project.monitoraggio_in_itinere || {});
    const completedMonitoring = Object.keys(window.MONITORAGGIO_ITEMS)
        .filter(key => monitoring[key] && monitoring[key] !== 'da_valutare').length;
    const scoreFields = [
        project.gradimento_media_didattica,
        project.gradimento_media_organizzativa,
        project.gradimento_media_utilita,
        project.gradimento_media_complessiva
    ];
    const scoreCount = scoreFields.filter(v => v !== null && v !== undefined && v !== '').length;
    const ready = project.gradimento_stato === 'elaborato' &&
        scoreCount === scoreFields.length &&
        completedMonitoring === Object.keys(window.MONITORAGGIO_ITEMS).length &&
        project.monitoraggio_giudizio_finale &&
        project.monitoraggio_giudizio_finale !== 'da_valutare';
    return {
        ready,
        status: project.gradimento_stato || 'non_avviato',
        scoreCount,
        scoreTotal: scoreFields.length,
        monitoringCount: completedMonitoring,
        monitoringTotal: Object.keys(window.MONITORAGGIO_ITEMS).length
    };
};

window.setGradimentoMonitoraggioPrintState = function(project = {}) {
    const map = {
        'cfg-gradimento-stato': project.gradimento_stato || 'non_avviato',
        'cfg-gradimento-raccolti': String(project.gradimento_questionari_raccolti ?? 0),
        'cfg-gradimento-media-didattica': project.gradimento_media_didattica ?? '',
        'cfg-gradimento-media-organizzativa': project.gradimento_media_organizzativa ?? '',
        'cfg-gradimento-media-utilita': project.gradimento_media_utilita ?? '',
        'cfg-gradimento-media-complessiva': project.gradimento_media_complessiva ?? '',
        'cfg-gradimento-commenti': project.gradimento_commenti || '',
        'cfg-monitoraggio-data': project.monitoraggio_data || '',
        'cfg-monitoraggio-in-itinere': JSON.stringify(window.parseJSONSafe ? window.parseJSONSafe(project.monitoraggio_in_itinere || {}, {}) : (project.monitoraggio_in_itinere || {})),
        'cfg-monitoraggio-metodi': JSON.stringify(window.step60Array ? window.step60Array(project.monitoraggio_metodi) : (project.monitoraggio_metodi || [])),
        'cfg-monitoraggio-esito': project.monitoraggio_esito_apprendimento || '',
        'cfg-monitoraggio-giudizio': project.monitoraggio_giudizio_finale || 'da_valutare',
        'cfg-monitoraggio-criticita': project.monitoraggio_criticita || '',
        'cfg-monitoraggio-miglioramenti': project.monitoraggio_miglioramenti || ''
    };
    Object.assign(window.AppState, map);
};

window.applyGradimentoMonitoraggioPrintFields = function() {
    const esc = window.dashEscape || (v => String(v ?? ''));
    const setText = (selector, value, fallback = '---') => {
        document.querySelectorAll(selector).forEach(el => { el.textContent = value === 0 || value ? value : fallback; });
    };
    const setHtml = (selector, value, fallback) => {
        document.querySelectorAll(selector).forEach(el => { el.innerHTML = value || fallback; });
    };
    const get = (key, fallback = '') => window.getVal ? window.getVal(key, fallback) : (window.AppState?.[key] ?? fallback);
    const formatScore = (value, max) => value === '' || value === null || value === undefined ? `— / ${max}` : `${Number(value).toFixed(2)} / ${max}`;

    const statusKey = get('cfg-gradimento-stato', 'non_avviato');
    const monitoring = window.parseJSONSafe ? window.parseJSONSafe(get('cfg-monitoraggio-in-itinere', '{}'), {}) : {};
    const methods = window.step60Array ? window.step60Array(get('cfg-monitoraggio-metodi', '[]')) : [];
    const expected = (window.currentSessionCorsisti || []).length;
    const collected = Number(get('cfg-gradimento-raccolti', 0) || 0);

    setText('.val-gradimento-stato', window.GRADIMENTO_STATUS_LABELS[statusKey] || statusKey);
    setText('.val-gradimento-previsti', String(expected), '0');
    setText('.val-gradimento-raccolti', String(collected), '0');
    setText('.val-gradimento-media-didattica', formatScore(get('cfg-gradimento-media-didattica', ''), 5));
    setText('.val-gradimento-media-organizzativa', formatScore(get('cfg-gradimento-media-organizzativa', ''), 5));
    setText('.val-gradimento-media-utilita', formatScore(get('cfg-gradimento-media-utilita', ''), 5));
    setText('.val-gradimento-media-complessiva', formatScore(get('cfg-gradimento-media-complessiva', ''), 10));
    setText('.val-gradimento-commenti', get('cfg-gradimento-commenti', ''));
    setText('.val-monitoraggio-data', get('cfg-monitoraggio-data') ? window.formatDataToItalian(get('cfg-monitoraggio-data')) : '');
    setText('.val-monitoraggio-esito', get('cfg-monitoraggio-esito', ''));
    setText('.val-monitoraggio-criticita', get('cfg-monitoraggio-criticita', ''));
    setText('.val-monitoraggio-miglioramenti', get('cfg-monitoraggio-miglioramenti', ''));

    const judgmentLabels = {
        da_valutare: 'Da valutare',
        conforme: 'Corso conforme agli obiettivi dichiarati',
        parzialmente_conforme: 'Corso parzialmente conforme agli obiettivi dichiarati',
        non_conforme: 'Corso non conforme agli obiettivi dichiarati'
    };
    setText('.val-monitoraggio-giudizio', judgmentLabels[get('cfg-monitoraggio-giudizio', 'da_valutare')] || 'Da valutare');
    setText('.val-monitoraggio-metodi', methods.map(id => window.MONITORAGGIO_METODI[id] || id).join(', '));

    const monitoringRows = Object.entries(window.MONITORAGGIO_ITEMS).map(([key, label]) => {
        const value = monitoring[key] || 'da_valutare';
        return `<tr>
            <td>${esc(label)}</td>
            <td class="text-center">${value === 'si' ? 'X' : ''}</td>
            <td class="text-center">${value === 'parzialmente' ? 'X' : ''}</td>
            <td class="text-center">${value === 'no' ? 'X' : ''}</td>
            <td>${value === 'da_valutare' ? 'Da valutare' : ''}</td>
        </tr>`;
    }).join('');
    setHtml('.val-monitoraggio-table', monitoringRows, '<tr><td colspan="5">Monitoraggio da compilare.</td></tr>');

    const scoreRows = [
        ['Qualità didattica', get('cfg-gradimento-media-didattica', ''), 5],
        ['Qualità organizzativa', get('cfg-gradimento-media-organizzativa', ''), 5],
        ['Utilità percepita', get('cfg-gradimento-media-utilita', ''), 5],
        ['Giudizio complessivo', get('cfg-gradimento-media-complessiva', ''), 10]
    ].map(row => `<tr><td>${esc(row[0])}</td><td class="text-center font-black">${esc(formatScore(row[1], row[2]))}</td></tr>`).join('');
    setHtml('.val-gradimento-medie-table', scoreRows, '<tr><td colspan="2">Medie non disponibili.</td></tr>');

    const summary = [
        window.GRADIMENTO_STATUS_LABELS[statusKey] || statusKey,
        `${collected}/${expected} questionari raccolti`,
        get('cfg-monitoraggio-giudizio', 'da_valutare') !== 'da_valutare' ? judgmentLabels[get('cfg-monitoraggio-giudizio')] : 'giudizio da completare'
    ].join(' · ');
    setText('.val-gradimento-monitoraggio-summary', summary);
};

window.renderQuestionariGradimentoPages = async function(options = {}) {
    if (typeof window.renderPrintModulePages !== 'function') return [];
    const preview = !!options.preview;
    const session = Array.isArray(options.session) ? options.session : [...(window.currentSessionCorsisti || [])];
    const recipients = session.length ? session : [{ __blankQuestionnaire: true, nome: '', cf: '', mansione: '' }];
    const pages = [];
    for (const corsista of recipients) {
        const rendered = await window.renderPrintModulePages('questionario_gradimento', corsista, {
            preview,
            includeProjectFormativoTests: false,
            includeFascicoloTests: false,
            includeNeedsRiskAnnexes: false,
            includeQualityAnnexes: false
        });
        rendered.forEach(page => {
            page.dataset.gradimentoQuestionario = corsista?.__blankQuestionnaire ? 'vuoto' : 'corsista';
            page.dataset.corsistaId = corsista?.__blankQuestionnaire ? '' : (corsista?.corsista_id || '');
            pages.push(page);
        });
    }
    return pages;
};

window.renderGradimentoMonitoraggioAnnexPages = async function(options = {}) {
    if (typeof window.renderPrintModulePages !== 'function') return [];
    const preview = !!options.preview;
    const includeQuestionari = options.includeQuestionari !== false;
    const pages = includeQuestionari ? await window.renderQuestionariGradimentoPages({ preview, session: options.session }) : [];
    for (const moduleId of ['riepilogo_gradimento', 'monitoraggio_qualita']) {
        const rendered = await window.renderPrintModulePages(moduleId, null, {
            preview,
            includeProjectFormativoTests: false,
            includeFascicoloTests: false,
            includeNeedsRiskAnnexes: false,
            includeQualityAnnexes: false
        });
        pages.push(...rendered);
    }
    return pages;
};

window.loadGradimentoQuestionariPreview = async function() {
    const progId = document.getElementById('stampa-progetto')?.value;
    if (!progId) return alert('Seleziona prima un progetto formativo.');
    window.currentPrintModule = 'questionario_gradimento';
    const container = document.getElementById('print-preview-container');
    if (!container) return;
    container.innerHTML = '<div class="p-8 text-center text-slate-500 font-bold uppercase text-xs">Preparazione questionari...</div>';
    const pages = await window.renderQuestionariGradimentoPages({ preview: true });
    container.innerHTML = '';
    pages.forEach(page => container.appendChild(page));
    if (typeof window.adjustPrintPreviewCanvas === 'function') window.adjustPrintPreviewCanvas(container);
};

window.stampaQuestionariGradimento = async function() {
    const printArea = document.getElementById('print-area-temp');
    if (!printArea) return alert('Area di stampa non disponibile.');
    const pages = await window.renderQuestionariGradimentoPages({ preview: false });
    printArea.innerHTML = '';
    pages.forEach(page => printArea.appendChild(page));
    alert(`Verranno stampati ${pages.length} questionari di gradimento, uno per ogni corsista. Se il progetto non ha iscritti viene prodotto un modello vuoto.`);
    document.body.classList.add('is-printing-temp');
    setTimeout(async () => {
        if (typeof window.waitForPrintImages === 'function') await window.waitForPrintImages(printArea);
        window.print();
        document.body.classList.remove('is-printing-temp');
        printArea.innerHTML = '';
    }, 900);
};

window.stampaQuestionariGradimentoDaProgetto = async function(projectId) {
    if (!projectId) return alert('Salva prima il progetto, poi potrai stampare i questionari dei corsisti iscritti.');
    await window.caricaDatiStampa(projectId, { suppressPreviewRefresh: true });
    window.currentPrintModule = 'questionario_gradimento';
    await window.stampaQuestionariGradimento();
};
