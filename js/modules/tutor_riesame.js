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

window.toggleTutorProjectFields = function() {
    const select = document.getElementById('prog-tutor-previsto');
    const expected = window.step65Boolean
        ? window.step65Boolean(select?.value, false)
        : String(select?.value || '').toLowerCase() === 'true';
    const fields = document.getElementById('prog-tutor-fields');
    const status = document.getElementById('prog-tutor-status');
    const printButton = document.getElementById('btn-progetto-stampa-tutor');

    if (fields) fields.classList.toggle('hidden', !expected);
    if (status) {
        status.textContent = expected
            ? 'Sì · compila i dati del tutor; la relazione potrà essere stampata e allegata al fascicolo.'
            : 'No · la relazione tutor non sarà generata né allegata alle stampe.';
        status.classList.toggle('text-teal-700', !expected);
        status.classList.toggle('text-emerald-700', expected);
    }
    if (printButton) {
        printButton.disabled = !expected;
        printButton.classList.toggle('opacity-40', !expected);
        printButton.classList.toggle('cursor-not-allowed', !expected);
        printButton.title = expected ? '' : 'Tutor non previsto nel progetto.';
    }
    return expected;
};

window.collectTutorRiesameRecord = function() {
    const tutorExpected = window.step65Boolean
        ? window.step65Boolean(document.getElementById('prog-tutor-previsto')?.value, false)
        : document.getElementById('prog-tutor-previsto')?.value === 'true';
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
        tutor_previsto: tutorExpected,
        tutor_nome: tutorExpected ? ((document.getElementById('prog-tutor-nome')?.value || '').trim() || null) : null,
        tutor_ruolo: tutorExpected ? ((document.getElementById('prog-tutor-ruolo')?.value || '').trim() || null) : null,
        tutor_data_relazione: tutorExpected ? (document.getElementById('prog-tutor-data')?.value || null) : null,
        tutor_valutazione_docenza: tutorExpected ? (document.getElementById('prog-tutor-docenza')?.value || 'da_valutare') : 'da_valutare',
        tutor_frequenza: tutorExpected ? (document.getElementById('prog-tutor-frequenza')?.value || 'da_valutare') : 'da_valutare',
        tutor_programma: tutorExpected ? (document.getElementById('prog-tutor-programma')?.value || 'da_valutare') : 'da_valutare',
        tutor_partecipazione: tutorExpected ? (document.getElementById('prog-tutor-partecipazione')?.value || 'da_valutare') : 'da_valutare',
        tutor_spazi: tutorExpected ? window.step62CheckedValues('.prog-tutor-spazio') : [],
        tutor_strumenti: tutorExpected ? window.step62CheckedValues('.prog-tutor-strumento') : [],
        tutor_punti_forza: tutorExpected ? window.step62CheckedValues('.prog-tutor-forza') : [],
        tutor_criticita: tutorExpected ? ((document.getElementById('prog-tutor-criticita')?.value || '').trim() || null) : null,
        tutor_giudizio_globale: tutorExpected ? (document.getElementById('prog-tutor-giudizio')?.value || 'da_valutare') : 'da_valutare',
        tutor_note: tutorExpected ? ((document.getElementById('prog-tutor-note')?.value || '').trim() || null) : null,
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
    const tutorExpected = Object.prototype.hasOwnProperty.call(project, 'tutor_previsto')
        ? (window.step65Boolean ? window.step65Boolean(project.tutor_previsto, false) : !!project.tutor_previsto)
        : !!String(project.tutor_nome || '').trim();
    set('prog-tutor-previsto', tutorExpected ? 'true' : 'false');
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
    window.toggleTutorProjectFields();
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
    const tutorExpected = document.getElementById('prog-tutor-previsto');
    if (tutorExpected) tutorExpected.value = 'false';
    window.toggleTutorProjectFields();
};

window.getTutorRiesameStatus = function(project = {}) {
    const tutorExpected = typeof window.isTutorExpectedForProject === 'function'
        ? window.isTutorExpectedForProject(project)
        : !!project.tutor_nome;
    const tutorCompleted = !!project.tutor_nome &&
        !!project.tutor_data_relazione &&
        !!project.tutor_giudizio_globale &&
        project.tutor_giudizio_globale !== 'da_valutare';
    const tutorReady = !tutorExpected || tutorCompleted;
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
        tutorExpected,
        tutorCompleted,
        tutorReady,
        reviewReady,
        reviewNotApplicable,
        reviewState: project.riesame_stato || 'non_pianificato'
    };
};

window.setTutorRiesamePrintState = function(project = {}) {
    const tutorExpected = typeof window.isTutorExpectedForProject === 'function'
        ? window.isTutorExpectedForProject(project)
        : !!project.tutor_nome;
    const map = {
        'cfg-tutor-previsto': tutorExpected,
        'cfg-tutor-nome': tutorExpected ? (project.tutor_nome || '') : '',
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
    const tutorExpected = typeof window.isTutorExpectedForProject === 'function'
        ? window.isTutorExpectedForProject()
        : !!get('cfg-tutor-nome');
    const tutorSummary = !tutorExpected
        ? 'Tutor non previsto'
        : (get('cfg-tutor-nome') ? 'Relazione tutor presente' : 'Relazione tutor da completare');
    setText('.val-tutor-riesame-summary', `${tutorSummary} · Riesame: ${label(status)}`);
};

window.renderTutorRiesameAnnexPages = async function(options = {}) {
    if (typeof window.renderPrintModulePages !== 'function') return [];
    const preview = !!options.preview;
    const pages = [];
    const tutorExpected = typeof window.isTutorExpectedForProject === 'function'
        ? window.isTutorExpectedForProject()
        : !!window.AppState?.['cfg-tutor-nome'];
    const moduleIds = tutorExpected ? ['relazione_tutor', 'scheda_riesame'] : ['scheda_riesame'];
    for (const moduleId of moduleIds) {
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
