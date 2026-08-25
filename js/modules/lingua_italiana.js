// Step 63 - Test cartaceo di comprensione della lingua italiana.

window.LINGUA_TEST_STATUS = {
    non_richiesto: { label: 'Non richiesto', cls: 'bg-slate-100 text-slate-700 border-slate-300' },
    da_valutare: { label: 'Da valutare', cls: 'bg-amber-100 text-amber-900 border-amber-300' },
    da_somministrare: { label: 'Da somministrare', cls: 'bg-orange-100 text-orange-900 border-orange-300' },
    somministrato: { label: 'Somministrato / da correggere', cls: 'bg-blue-100 text-blue-900 border-blue-300' },
    superato: { label: 'Superato / ammesso', cls: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
    non_superato: { label: 'Non superato / non ammesso', cls: 'bg-rose-100 text-rose-900 border-rose-300' }
};

window.getLinguaTestStatusMeta = function(status = 'non_richiesto') {
    return window.LINGUA_TEST_STATUS[status] || window.LINGUA_TEST_STATUS.non_richiesto;
};

window.calculateLinguaTestOutcome = function(p1, p2, p3) {
    const raw = [p1, p2, p3];
    if (raw.some(v => v === null || v === undefined || v === '')) {
        return { complete: false, passed: false, total: null, status: 'somministrato' };
    }
    const scores = raw.map(v => Number(v));
    if (scores.some(v => !Number.isFinite(v) || v < 0 || v > 10)) {
        return { complete: false, passed: false, total: null, status: 'somministrato' };
    }
    const passed = scores.every(v => v >= 6);
    return {
        complete: true,
        passed,
        total: scores.reduce((sum, v) => sum + v, 0),
        status: passed ? 'superato' : 'non_superato'
    };
};

window.collectLinguaTestCorsistaRecord = function() {
    const statusEl = document.getElementById('cor-lingua-stato');
    if (!statusEl) return {};
    const rawScore = id => {
        const value = document.getElementById(id)?.value;
        return value === '' || value === undefined ? null : Number(value);
    };
    const p1 = rawScore('cor-lingua-parte1');
    const p2 = rawScore('cor-lingua-parte2');
    const p3 = rawScore('cor-lingua-parte3');
    const outcome = window.calculateLinguaTestOutcome(p1, p2, p3);
    let status = statusEl.value || 'non_richiesto';
    if (outcome.complete && !['non_richiesto', 'da_valutare'].includes(status)) {
        status = outcome.status;
    }
    return {
        cittadinanza: (document.getElementById('cor-cittadinanza')?.value || '').trim() || null,
        studi_scolastici_italia: document.getElementById('cor-studi-italia')?.value === ''
            ? null
            : document.getElementById('cor-studi-italia')?.value === 'true',
        lingua_test_stato: status,
        lingua_test_data: document.getElementById('cor-lingua-data')?.value || null,
        lingua_test_parte1: p1,
        lingua_test_parte2: p2,
        lingua_test_parte3: p3,
        lingua_test_valutatore: (document.getElementById('cor-lingua-valutatore')?.value || '').trim() || null,
        lingua_test_dichiarazione_dl: !!document.getElementById('cor-lingua-dichiarazione-dl')?.checked,
        lingua_test_documento_url: (document.getElementById('cor-lingua-documento-url')?.value || '').trim() || null,
        lingua_test_note: (document.getElementById('cor-lingua-note')?.value || '').trim() || null
    };
};

window.populateLinguaTestCorsistaForm = function(corsista = {}) {
    const set = (id, value = '') => {
        const el = document.getElementById(id);
        if (el) el.value = value ?? '';
    };
    set('cor-cittadinanza', corsista.cittadinanza || '');
    set('cor-studi-italia', corsista.studi_scolastici_italia === null || corsista.studi_scolastici_italia === undefined ? '' : String(!!corsista.studi_scolastici_italia));
    set('cor-lingua-stato', corsista.lingua_test_stato || 'non_richiesto');
    set('cor-lingua-data', corsista.lingua_test_data || '');
    set('cor-lingua-parte1', corsista.lingua_test_parte1 ?? '');
    set('cor-lingua-parte2', corsista.lingua_test_parte2 ?? '');
    set('cor-lingua-parte3', corsista.lingua_test_parte3 ?? '');
    set('cor-lingua-valutatore', corsista.lingua_test_valutatore || '');
    set('cor-lingua-documento-url', corsista.lingua_test_documento_url || '');
    set('cor-lingua-note', corsista.lingua_test_note || '');
    const declaration = document.getElementById('cor-lingua-dichiarazione-dl');
    if (declaration) declaration.checked = !!corsista.lingua_test_dichiarazione_dl;
    window.updateLinguaRequirementSuggestion();
    window.updateLinguaTestFormOutcome();
};

window.resetLinguaTestCorsistaForm = function() {
    const status = document.getElementById('cor-lingua-stato');
    if (status) status.value = 'non_richiesto';
    const declaration = document.getElementById('cor-lingua-dichiarazione-dl');
    if (declaration) declaration.checked = false;
    window.updateLinguaRequirementSuggestion();
    window.updateLinguaTestFormOutcome();
};

window.updateLinguaRequirementSuggestion = function() {
    const box = document.getElementById('cor-lingua-requisito-preview');
    if (!box) return;
    const citizenship = (document.getElementById('cor-cittadinanza')?.value || '').trim().toLowerCase();
    const studies = document.getElementById('cor-studi-italia')?.value || '';
    const italian = ['italia', 'italiana', 'italiano'].includes(citizenship);
    if (citizenship && !italian && studies === 'false') {
        box.className = 'rounded-lg border border-orange-300 bg-orange-100 px-3 py-2 text-[9px] font-black text-orange-950';
        box.textContent = 'Criteri del modello SSL presenti: lavoratore senza cittadinanza italiana e senza studi scolastici conseguiti in Italia. Test da somministrare prima dell’ammissione.';
    } else if (italian || studies === 'true') {
        box.className = 'rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-[9px] font-bold text-emerald-900';
        box.textContent = 'In base ai dati inseriti il test non risulta normalmente richiesto; resta possibile indicarlo manualmente.';
    } else {
        box.className = 'rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-[9px] font-bold text-slate-600';
        box.textContent = 'Completare cittadinanza e studi scolastici svolti in Italia per valutare la necessità del test.';
    }
};

window.updateLinguaTestFormOutcome = function() {
    const box = document.getElementById('cor-lingua-esito-preview');
    if (!box) return;
    const get = id => {
        const value = document.getElementById(id)?.value;
        return value === '' || value === undefined ? null : Number(value);
    };
    const result = window.calculateLinguaTestOutcome(
        get('cor-lingua-parte1'),
        get('cor-lingua-parte2'),
        get('cor-lingua-parte3')
    );
    if (!result.complete) {
        box.className = 'rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-[10px] font-bold text-slate-600';
        box.textContent = 'Inserire i tre punteggi (0-10). Il test è superato con almeno 6 risposte corrette in ciascuna parte.';
        return;
    }
    const meta = window.getLinguaTestStatusMeta(result.status);
    const status = document.getElementById('cor-lingua-stato');
    if (status && !['non_richiesto', 'da_valutare'].includes(status.value)) status.value = result.status;
    box.className = `rounded-lg border px-3 py-2 text-[10px] font-black uppercase ${meta.cls}`;
    box.textContent = `${meta.label} · Totale ${result.total}/30 · soglia minima 6/10 per ciascuna parte`;
};

window.isLinguaTestRequired = function(corsista = {}) {
    return !!corsista.lingua_test_stato && corsista.lingua_test_stato !== 'non_richiesto';
};

window.getLinguaProjectStatus = function(iscritti = []) {
    const relevant = iscritti.filter(row => window.isLinguaTestRequired(row.corsisti || row));
    const passed = relevant.filter(row => (row.corsisti || row).lingua_test_stato === 'superato').length;
    const failed = relevant.filter(row => (row.corsisti || row).lingua_test_stato === 'non_superato').length;
    const pending = relevant.length - passed - failed;
    return {
        total: relevant.length,
        passed,
        failed,
        pending,
        ready: relevant.length === 0 || pending === 0
    };
};

window.renderLinguaStatusBadge = function(corsista = {}) {
    const status = corsista.lingua_test_stato || 'non_richiesto';
    if (status === 'non_richiesto') return '';
    const meta = window.getLinguaTestStatusMeta(status);
    return `<span class="inline-flex items-center rounded-full border px-2 py-0.5 text-[8px] font-black uppercase ${meta.cls}">Lingua: ${window.dashEscape ? window.dashEscape(meta.label) : meta.label}</span>`;
};

window.fillLinguaTestPage = function(page, corsista = {}) {
    const setText = (selector, value, fallback = '---') => {
        page.querySelectorAll(selector).forEach(el => { el.textContent = value || fallback; });
    };
    const name = corsista.nome || corsista.nome_cognome || 'Corsista';
    const cf = corsista.cf || '';
    const company = window.AppState?.['cfg-azienda'] || '';
    const isAziendaErogatore = (window.AppState?.['cfg-ente-erogatore'] || 'ente') === 'azienda';
    const provider = isAziendaErogatore
        ? company
        : (window.AppState?.['cfg-ente'] || window.CNA_AVELLINO_PRESET?.ragione_sociale || '');
    const projectCode = window.AppState?.['cfg-codice'] || '';
    const date = corsista.lingua_test_data
        ? (window.formatDataToItalian ? window.formatDataToItalian(corsista.lingua_test_data) : corsista.lingua_test_data)
        : '';
    const scores = [corsista.lingua_test_parte1, corsista.lingua_test_parte2, corsista.lingua_test_parte3];
    const outcome = window.calculateLinguaTestOutcome(...scores);
    const status = corsista.lingua_test_stato || (outcome.complete ? outcome.status : 'da_somministrare');
    setText('.val-lingua-corsista', name);
    setText('.val-lingua-cf', cf);
    setText('.val-lingua-azienda', company);
    setText('.val-erogatore', provider);
    setText('.val-codice', projectCode);
    setText('.val-lingua-data', date);
    setText('.val-lingua-valutatore', corsista.lingua_test_valutatore || '');
    setText('.val-lingua-parte1', scores[0] === null || scores[0] === undefined ? '' : `${scores[0]}/10`);
    setText('.val-lingua-parte2', scores[1] === null || scores[1] === undefined ? '' : `${scores[1]}/10`);
    setText('.val-lingua-parte3', scores[2] === null || scores[2] === undefined ? '' : `${scores[2]}/10`);
    setText('.val-lingua-totale', outcome.complete ? `${outcome.total}/30` : '');
    setText('.val-lingua-esito', window.getLinguaTestStatusMeta(status).label);
    setText('.val-lingua-note', corsista.lingua_test_note || '');
    page.dataset.linguaCorsistaId = corsista.corsista_id || corsista.id || '';
    page.dataset.linguaTestStatus = status;
};

window.renderTestLinguaItalianaPages = async function(options = {}) {
    const response = await fetch('modules/test_lingua_italiana.html');
    if (!response.ok) throw new Error('Modulo Test Lingua Italiana non disponibile.');
    const html = await response.text();
    const holder = document.createElement('div');
    holder.innerHTML = html;
    const candidateTemplates = Array.from(holder.querySelectorAll('[data-lingua-candidate-page]'));
    const correctorTemplate = holder.querySelector('[data-lingua-corrector-page]');
    const session = [...(options.session || window.currentSessionCorsisti || [])];
    const required = session.filter(window.isLinguaTestRequired);
    const selected = required.length || options.fallbackAll === false ? required : session;
    const pages = [];

    selected.forEach(corsista => {
        candidateTemplates.forEach(template => {
            const page = template.cloneNode(true);
            window.fillLinguaTestPage(page, corsista);
            page.classList.remove('scale-[0.8]', 'origin-top');
            if (options.preview) page.classList.add('scale-[0.8]', 'origin-top');
            else page.classList.add('print-show', 'temp-page', 'portrait');
            page.style.margin = options.preview ? '0 auto 16px auto' : '0 auto';
            pages.push(page);
        });
    });

    if (selected.length && options.includeCorrector !== false && correctorTemplate) {
        const corrector = correctorTemplate.cloneNode(true);
        corrector.classList.remove('scale-[0.8]', 'origin-top');
        if (options.preview) corrector.classList.add('scale-[0.8]', 'origin-top');
        else corrector.classList.add('print-show', 'temp-page', 'landscape-force');
        corrector.style.margin = options.preview ? '0 auto 16px auto' : '0 auto';
        pages.push(corrector);
    }
    return pages;
};

window.renderLinguaItalianaAnnexPages = async function(options = {}) {
    return await window.renderTestLinguaItalianaPages({
        preview: !!options.preview,
        session: options.session || window.currentSessionCorsisti || [],
        fallbackAll: false,
        includeCorrector: true
    });
};

window.stampaTestLinguaCorsista = async function(projectId, corsistaId) {
    if (!projectId || !corsistaId) return alert('Progetto o corsista non selezionato.');
    const printArea = document.getElementById('print-area-temp');
    if (!printArea) return alert('Area di stampa non disponibile.');
    try {
        await window.caricaDatiStampa(projectId, { suppressPreviewRefresh: true });
        const corsista = (window.currentSessionCorsisti || []).find(c => String(c.corsista_id) === String(corsistaId));
        if (!corsista) return alert('Corsista non trovato nel progetto selezionato.');
        const pages = await window.renderTestLinguaItalianaPages({
            preview: false,
            session: [corsista],
            fallbackAll: true,
            includeCorrector: true
        });
        printArea.innerHTML = '';
        pages.forEach(page => printArea.appendChild(page));
        document.body.classList.add('is-printing-temp');
        setTimeout(async () => {
            if (typeof window.waitForPrintImages === 'function') await window.waitForPrintImages(printArea);
            window.print();
            document.body.classList.remove('is-printing-temp');
            printArea.innerHTML = '';
        }, 800);
    } catch (error) {
        console.error(error);
        alert('Errore nella preparazione del test lingua italiana: ' + (error.message || error));
        document.body.classList.remove('is-printing-temp');
        printArea.innerHTML = '';
    }
};
