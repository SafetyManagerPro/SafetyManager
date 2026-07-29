// Step 62 - Relazione finale del tutor e riesame periodico/miglioramento.

window.TUTOR_SPAZI = {
    aula_dedicata: 'Aula formazione dedicata',
    aula_multimediale: 'Aula multimediale con videoproiettore',
    aula_tradizionale: 'Aula didattica tradizionale',
    sala_riunioni: 'Sala riunioni / conference room',
    laboratorio: 'Laboratorio pratico o tecnico',
    simulazioni: 'Spazio per esercitazioni e simulazioni',
    lavori_gruppo: 'Area per lavori di gruppo'
};

window.TUTOR_STRUMENTI = {
    multimedia: 'Attrezzature multimediali',
    elearning: 'Piattaforme e-learning/videoconferenza',
    materiali: 'Materiali didattici digitali e cartacei',
    pratica: 'Strumenti per esercitazioni e simulazioni',
    dispense: 'Dispense, schede operative e checklist',
    test: 'Test, quiz e sistemi di valutazione',
    lavagne: 'Lavagne interattive o flipchart',
    casi: 'Casi studio e role-play',
    repository: 'Repository documentale',
    gestionale: 'Gestionale presenze e attestazioni'
};

window.TUTOR_PUNTI_FORZA = {
    obiettivi: 'Obiettivi formativi chiari',
    contenuti: 'Contenuti aggiornati e affidabili',
    metodologie: 'Metodologie didattiche attive',
    partecipazione: 'Coinvolgimento e partecipazione',
    personalizzazione: 'Personalizzazione del percorso',
    pratica: 'Applicazione pratica immediata',
    materiali: 'Materiali didattici di qualità',
    organizzazione: 'Organizzazione efficiente',
    monitoraggio: 'Monitoraggio e valutazione',
    conformita: 'Conformità ai requisiti del percorso'
};

window.RIESAME_FONTI = {
    gradimento: 'Schede di valutazione del gradimento',
    verifiche: 'Test e risultati delle verifiche di apprendimento',
    docente: 'Osservazioni dei docenti',
    tutor: 'Relazione e osservazioni del tutor',
    fascicolo: 'Controllo documentale del fascicolo',
    segnalazioni: 'Segnalazioni di azienda, corsisti, RLS/RLST o preposti',
    altro: 'Altra fonte'
};

window.step62CheckedValues = function(selector) {
    return Array.from(document.querySelectorAll(selector))
        .filter(el => el.checked)
        .map(el => el.value);
};

window.collectTutorRiesameRecord = function() {
    const actions = Array.from(document.querySelectorAll('[data-riesame-action-row]')).map(row => {
        const get = field => (row.querySelector(`[data-riesame-field="${field}"]`)?.value || '').trim();
        return {
            area: get('area'),
            criticita: get('criticita'),
            fonte: get('fonte'),
            azione: get('azione'),
            tipo: get('tipo') || 'migliorativo',
            tempistica: get('tempistica'),
            responsabile: get('responsabile')
        };
    }).filter(row => row.area || row.criticita || row.azione || row.responsabile);

    return {
        tutor_nome: (document.getElementById('prog-tutor-nome')?.value || '').trim() || null,
        tutor_ruolo: (document.getElementById('prog-tutor-ruolo')?.value || '').trim() || null,
        tutor_data_relazione: document.getElementById('prog-tutor-data')?.value || null,
        tutor_valutazione_docenza: document.getElementById('prog-tutor-docenza')?.value || 'da_valutare',
        tutor_frequenza: document.getElementById('prog-tutor-frequenza')?.value || 'da_valutare',
        tutor_programma: document.getElementById('prog-tutor-programma')?.value || 'da_valutare',
        tutor_partecipazione: document.getElementById('prog-tutor-partecipazione')?.value || 'da_valutare',
        tutor_spazi: window.step62CheckedValues('.prog-tutor-spazio'),
        tutor_strumenti: window.step62CheckedValues('.prog-tutor-strumento'),
        tutor_punti_forza: window.step62CheckedValues('.prog-tutor-forza'),
        tutor_criticita: (document.getElementById('prog-tutor-criticita')?.value || '').trim() || null,
        tutor_giudizio_globale: document.getElementById('prog-tutor-giudizio')?.value || 'da_valutare',
        tutor_note: (document.getElementById('prog-tutor-note')?.value || '').trim() || null,
        riesame_stato: document.getElementById('prog-riesame-stato')?.value || 'non_pianificato',
        riesame_data: document.getElementById('prog-riesame-data')?.value || null,
        riesame_fonti: window.step62CheckedValues('.prog-riesame-fonte'),
        riesame_azioni: actions,
        riesame_obiettivi: document.getElementById('prog-riesame-obiettivi')?.value || 'da_valutare',
        riesame_azioni_urgenti: document.getElementById('prog-riesame-urgenti')?.value || 'da_valutare',
        riesame_proposta: document.getElementById('prog-riesame-proposta')?.value || 'da_valutare',
        riesame_note: (document.getElementById('prog-riesame-note')?.value || '').trim() || null,
        riesame_compilato_da: (document.getElementById('prog-riesame-compilato')?.value || '').trim() || null,
        riesame_compilato_ruolo: (document.getElementById('prog-riesame-ruolo')?.value || '').trim() || null,
        riesame_approvato_da: (document.getElementById('prog-riesame-approvato')?.value || '').trim() || null
    };
};

window.populateTutorRiesameForm = function(project = {}) {
    const set = (id, value = '') => {
        const el = document.getElementById(id);
        if (el) el.value = value ?? '';
    };
    set('prog-tutor-nome', project.tutor_nome || '');
    set('prog-tutor-ruolo', project.tutor_ruolo || '');
    set('prog-tutor-data', project.tutor_data_relazione || '');
    set('prog-tutor-docenza', project.tutor_valutazione_docenza || 'da_valutare');
    set('prog-tutor-frequenza', project.tutor_frequenza || 'da_valutare');
    set('prog-tutor-programma', project.tutor_programma || 'da_valutare');
    set('prog-tutor-partecipazione', project.tutor_partecipazione || 'da_valutare');
    set('prog-tutor-criticita', project.tutor_criticita || '');
    set('prog-tutor-giudizio', project.tutor_giudizio_globale || 'da_valutare');
    set('prog-tutor-note', project.tutor_note || '');
    set('prog-riesame-stato', project.riesame_stato || 'non_pianificato');
    set('prog-riesame-data', project.riesame_data || '');
    set('prog-riesame-obiettivi', project.riesame_obiettivi || 'da_valutare');
    set('prog-riesame-urgenti', project.riesame_azioni_urgenti || 'da_valutare');
    set('prog-riesame-proposta', project.riesame_proposta || 'da_valutare');
    set('prog-riesame-note', project.riesame_note || '');
    set('prog-riesame-compilato', project.riesame_compilato_da || '');
    set('prog-riesame-ruolo', project.riesame_compilato_ruolo || '');
    set('prog-riesame-approvato', project.riesame_approvato_da || '');

    const setChecked = (selector, values) => {
        const selected = new Set(window.step60Array ? window.step60Array(values) : (values || []));
        document.querySelectorAll(selector).forEach(el => { el.checked = selected.has(el.value); });
    };
    setChecked('.prog-tutor-spazio', project.tutor_spazi);
    setChecked('.prog-tutor-strumento', project.tutor_strumenti);
    setChecked('.prog-tutor-forza', project.tutor_punti_forza);
    setChecked('.prog-riesame-fonte', project.riesame_fonti);

    const actions = window.step60Array ? window.step60Array(project.riesame_azioni) : (project.riesame_azioni || []);
    document.querySelectorAll('[data-riesame-action-row]').forEach((row, index) => {
        const action = actions[index] || {};
        row.querySelectorAll('[data-riesame-field]').forEach(el => {
            el.value = action[el.dataset.riesameField] || (el.dataset.riesameField === 'tipo' ? 'migliorativo' : '');
        });
    });
};

window.resetTutorRiesameForm = function() {
    document.querySelectorAll('.prog-tutor-spazio,.prog-tutor-strumento,.prog-tutor-forza,.prog-riesame-fonte').forEach(el => { el.checked = false; });
    document.querySelectorAll('[data-riesame-action-row] [data-riesame-field]').forEach(el => {
        el.value = el.dataset.riesameField === 'tipo' ? 'migliorativo' : '';
    });
    ['prog-tutor-docenza', 'prog-tutor-frequenza', 'prog-tutor-programma', 'prog-tutor-partecipazione', 'prog-tutor-giudizio', 'prog-riesame-obiettivi', 'prog-riesame-urgenti', 'prog-riesame-proposta']
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = 'da_valutare'; });
    const state = document.getElementById('prog-riesame-stato');
    if (state) state.value = 'non_pianificato';
};

window.getTutorRiesameStatus = function(project = {}) {
    const tutorReady = !!project.tutor_nome &&
        !!project.tutor_data_relazione &&
        !!project.tutor_giudizio_globale &&
        project.tutor_giudizio_globale !== 'da_valutare';
    const reviewNotApplicable = project.riesame_stato === 'non_applicabile';
    const reviewReady = reviewNotApplicable || (
        project.riesame_stato === 'completato' &&
        !!project.riesame_data &&
        !!project.riesame_obiettivi &&
        project.riesame_obiettivi !== 'da_valutare' &&
        !!project.riesame_proposta &&
        project.riesame_proposta !== 'da_valutare'
    );
    return {
        ready: tutorReady && reviewReady,
        tutorReady,
        reviewReady,
        reviewNotApplicable,
        reviewState: project.riesame_stato || 'non_pianificato'
    };
};

window.setTutorRiesamePrintState = function(project = {}) {
    const map = {
        'cfg-tutor-nome': project.tutor_nome || project.resp_corso || '',
        'cfg-tutor-ruolo': project.tutor_ruolo || 'Tutor / referente d’aula',
        'cfg-tutor-data': project.tutor_data_relazione || '',
        'cfg-tutor-docenza': project.tutor_valutazione_docenza || 'da_valutare',
        'cfg-tutor-frequenza': project.tutor_frequenza || 'da_valutare',
        'cfg-tutor-programma': project.tutor_programma || 'da_valutare',
        'cfg-tutor-partecipazione': project.tutor_partecipazione || 'da_valutare',
        'cfg-tutor-spazi': JSON.stringify(window.step60Array ? window.step60Array(project.tutor_spazi) : (project.tutor_spazi || [])),
        'cfg-tutor-strumenti': JSON.stringify(window.step60Array ? window.step60Array(project.tutor_strumenti) : (project.tutor_strumenti || [])),
        'cfg-tutor-forze': JSON.stringify(window.step60Array ? window.step60Array(project.tutor_punti_forza) : (project.tutor_punti_forza || [])),
        'cfg-tutor-criticita': project.tutor_criticita || '',
        'cfg-tutor-giudizio': project.tutor_giudizio_globale || 'da_valutare',
        'cfg-tutor-note': project.tutor_note || '',
        'cfg-riesame-stato': project.riesame_stato || 'non_pianificato',
        'cfg-riesame-data': project.riesame_data || '',
        'cfg-riesame-fonti': JSON.stringify(window.step60Array ? window.step60Array(project.riesame_fonti) : (project.riesame_fonti || [])),
        'cfg-riesame-azioni': JSON.stringify(window.step60Array ? window.step60Array(project.riesame_azioni) : (project.riesame_azioni || [])),
        'cfg-riesame-obiettivi': project.riesame_obiettivi || 'da_valutare',
        'cfg-riesame-urgenti': project.riesame_azioni_urgenti || 'da_valutare',
        'cfg-riesame-proposta': project.riesame_proposta || 'da_valutare',
        'cfg-riesame-note': project.riesame_note || '',
        'cfg-riesame-compilato': project.riesame_compilato_da || '',
        'cfg-riesame-ruolo': project.riesame_compilato_ruolo || '',
        'cfg-riesame-approvato': project.riesame_approvato_da || ''
    };
    Object.assign(window.AppState, map);
};

window.applyTutorRiesamePrintFields = function() {
    const esc = window.dashEscape || (v => String(v ?? ''));
    const get = (key, fallback = '') => window.getVal ? window.getVal(key, fallback) : (window.AppState?.[key] ?? fallback);
    const setText = (selector, value, fallback = '---') => document.querySelectorAll(selector).forEach(el => { el.textContent = value || fallback; });
    const setHtml = (selector, value, fallback) => document.querySelectorAll(selector).forEach(el => { el.innerHTML = value || fallback; });
    const label = value => ({
        da_valutare: 'Da valutare',
        positivo: 'Positivo',
        adeguato: 'Adeguato',
        parziale: 'Parzialmente adeguato',
        parzialmente: 'Parzialmente',
        critico: 'Critico',
        si: 'Sì',
        no: 'No',
        conforme: 'Conforme',
        parzialmente_conforme: 'Parzialmente conforme',
        non_conforme: 'Non conforme',
        non_pianificato: 'Non pianificato',
        pianificato: 'Pianificato',
        in_corso: 'In corso',
        completato: 'Completato',
        non_applicabile: 'Non applicabile alla singola edizione',
        ripetere: 'Ripetere senza modifiche',
        modificare: 'Ripetere con modifiche',
        sostituire: 'Sostituire con altra proposta',
        correttivo: 'Correttivo',
        migliorativo: 'Migliorativo'
    }[value] || value || 'Da valutare');

    setText('.val-tutor-nome', get('cfg-tutor-nome'));
    setText('.val-tutor-ruolo', get('cfg-tutor-ruolo'));
    setText('.val-tutor-data', get('cfg-tutor-data') ? window.formatDataToItalian(get('cfg-tutor-data')) : '');
    setText('.val-tutor-docenza', label(get('cfg-tutor-docenza')));
    setText('.val-tutor-frequenza', label(get('cfg-tutor-frequenza')));
    setText('.val-tutor-programma', label(get('cfg-tutor-programma')));
    setText('.val-tutor-partecipazione', label(get('cfg-tutor-partecipazione')));
    setText('.val-tutor-criticita', get('cfg-tutor-criticita'));
    setText('.val-tutor-giudizio', label(get('cfg-tutor-giudizio')));
    setText('.val-tutor-note', get('cfg-tutor-note'));

    const listHtml = (values, catalog) => values.map(id => `<li>☑ ${esc(catalog[id] || id)}</li>`).join('');
    const spaces = window.step60Array ? window.step60Array(get('cfg-tutor-spazi', '[]')) : [];
    const tools = window.step60Array ? window.step60Array(get('cfg-tutor-strumenti', '[]')) : [];
    const strengths = window.step60Array ? window.step60Array(get('cfg-tutor-forze', '[]')) : [];
    setHtml('.val-tutor-spazi-list', listHtml(spaces, window.TUTOR_SPAZI), '<li>Nessuno spazio indicato.</li>');
    setHtml('.val-tutor-strumenti-list', listHtml(tools, window.TUTOR_STRUMENTI), '<li>Nessuno strumento indicato.</li>');
    setHtml('.val-tutor-forze-list', listHtml(strengths, window.TUTOR_PUNTI_FORZA), '<li>Punti di forza da indicare.</li>');

    setText('.val-riesame-stato', label(get('cfg-riesame-stato')));
    setText('.val-riesame-data', get('cfg-riesame-data') ? window.formatDataToItalian(get('cfg-riesame-data')) : '');
    setText('.val-riesame-obiettivi', label(get('cfg-riesame-obiettivi')));
    setText('.val-riesame-urgenti', label(get('cfg-riesame-urgenti')));
    setText('.val-riesame-proposta', label(get('cfg-riesame-proposta')));
    setText('.val-riesame-note', get('cfg-riesame-note'));
    setText('.val-riesame-compilato', get('cfg-riesame-compilato'));
    setText('.val-riesame-ruolo', get('cfg-riesame-ruolo'));
    setText('.val-riesame-approvato', get('cfg-riesame-approvato'));

    const sources = window.step60Array ? window.step60Array(get('cfg-riesame-fonti', '[]')) : [];
    setHtml('.val-riesame-fonti-list', listHtml(sources, window.RIESAME_FONTI), '<li>Fonti da selezionare.</li>');
    const actions = window.step60Array ? window.step60Array(get('cfg-riesame-azioni', '[]')) : [];
    const actionRows = actions.map((action, index) => `<tr>
        <td class="text-center">${index + 1}</td><td>${esc(action.area || '')}</td><td>${esc(action.criticita || '')}</td>
        <td>${esc(action.fonte || '')}</td><td>${esc(action.azione || '')}</td><td>${esc(label(action.tipo || 'migliorativo'))}</td>
        <td>${esc(action.tempistica || '')}</td><td>${esc(action.responsabile || '')}</td>
    </tr>`).join('');
    setHtml('.val-riesame-azioni-table', actionRows, '<tr><td colspan="8" class="text-center italic">Nessuna azione registrata.</td></tr>');

    const status = get('cfg-riesame-stato', 'non_pianificato');
    setText('.val-tutor-riesame-summary', `${get('cfg-tutor-nome') ? 'Relazione tutor presente' : 'Relazione tutor da completare'} · Riesame: ${label(status)}`);
};

window.renderTutorRiesameAnnexPages = async function(options = {}) {
    if (typeof window.renderPrintModulePages !== 'function') return [];
    const preview = !!options.preview;
    const pages = [];
    for (const moduleId of ['relazione_tutor', 'scheda_riesame']) {
        const rendered = await window.renderPrintModulePages(moduleId, null, {
            preview,
            includeProjectFormativoTests: false,
            includeFascicoloTests: false,
            includeNeedsRiskAnnexes: false,
            includeQualityAnnexes: false,
            includeTutorRiesameAnnexes: false
        });
        pages.push(...rendered);
    }
    return pages;
};
