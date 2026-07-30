// Collaudo sistema module
// Estratto da js/utils.js nello step 23 per ridurre il file principale.

window.collStatusClass = function(status) {
    if (status === 'ok') return 'border-emerald-200 bg-emerald-50 text-emerald-900';
    if (status === 'warn') return 'border-amber-200 bg-amber-50 text-amber-900';
    return 'border-red-200 bg-red-50 text-red-900';
};

window.collStatusLabel = function(status) {
    if (status === 'ok') return 'OK';
    if (status === 'warn') return 'Avviso';
    return 'Errore';
};

window.collAdd = function(report, area, name, status, details = '') {
    report.items.push({ area, name, status, details });
};

window.renderCollaudoDevice = function() {
    const box = document.getElementById('collaudo-device');
    if (!box) return;
    const nav = document.getElementById('top-nav');
    const navH = nav ? Math.round(nav.getBoundingClientRect().height) : 0;
    const mode = window.innerWidth < 768 ? 'Smartphone' : (window.innerWidth < 1180 ? 'Tablet / finestra media' : 'Desktop');
    box.innerHTML = `
        <div class="rounded-xl bg-slate-900 border border-slate-800 p-3"><span class="text-slate-500 uppercase text-[9px] font-black">Viewport</span><br><strong>${window.innerWidth} × ${window.innerHeight}</strong></div>
        <div class="rounded-xl bg-slate-900 border border-slate-800 p-3"><span class="text-slate-500 uppercase text-[9px] font-black">Modalità UI</span><br><strong>${mode}</strong></div>
        <div class="rounded-xl bg-slate-900 border border-slate-800 p-3"><span class="text-slate-500 uppercase text-[9px] font-black">Navbar</span><br><strong>${navH}px</strong></div>`;
};

window.runCollaudoSistema = async function() {
    const results = document.getElementById('collaudo-results');
    if (results) results.innerHTML = '<div class="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 font-bold uppercase tracking-widest text-xs"><i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto mb-3"></i> Collaudo in corso...</div>';
    if (typeof lucide !== 'undefined') lucide.createIcons();

    const report = {
        meta: {
            app: 'SafetyManager PRO',
            step: '65',
            executed_at: new Date().toISOString(),
            user_agent: navigator.userAgent,
            viewport: { width: window.innerWidth, height: window.innerHeight }
        },
        items: []
    };

    // Librerie frontend.
    [
        ['Supabase client', typeof window.supabaseClient !== 'undefined'],
        ['Lucide icons', typeof lucide !== 'undefined'],
        ['JSZip backup/export', typeof JSZip !== 'undefined'],
        ['XLSX export', typeof XLSX !== 'undefined'],
        ['PapaParse import CSV', typeof Papa !== 'undefined']
    ].forEach(([name, ok]) => window.collAdd(report, 'Librerie', name, ok ? 'ok' : 'error', ok ? 'Caricata' : 'Non disponibile'));

    // Funzioni critiche.
    [
        'loadProgettiTable',
        'getIscrizioniPerProgetti',
        'esportaSezioneExcel',
        'stampaSezionePdf',
        'esportaBackupDatabaseLocale',
        'ripristinaBackupDatabaseLocale',
        'loadArchivioCorsi',
        'stampaFascicoloCompletoPDF',
        'collectFabbisogniProjectRecord',
        'renderNeedsRiskAnnexPages',
        'collectGradimentoMonitoraggioRecord',
        'renderGradimentoMonitoraggioAnnexPages',
        'renderQuestionariGradimentoPages',
        'collectTutorRiesameRecord',
        'renderTutorRiesameAnnexPages',
        'getTutorRiesameStatus',
        'getAssignedProjectTeachers',
        'expandTeacherDeclarationPages',
        'isAssociationTrainingProvider',
        'isTutorExpectedForProject',
        'collectLinguaTestCorsistaRecord',
        'calculateLinguaTestOutcome',
        'renderTestLinguaItalianaPages',
        'renderLinguaItalianaAnnexPages',
        'parseTrainingCalendarDates',
        'getTrainingDaySchedule',
        'expandRegisterPagesByTrainingDay',
        'getMultiDayRegisterSummary'
    ].forEach(fn => window.collAdd(report, 'Funzioni critiche', fn, typeof window[fn] === 'function' ? 'ok' : 'error', typeof window[fn] === 'function' ? 'Disponibile' : 'Mancante'));


    // Moduli JavaScript separati nello step 23.
    const jsModules = [
        'js/modules/scadenze.js',
        'js/modules/migrazione.js',
        'js/modules/archivio.js',
        'js/modules/stampe_bundle.js',
        'js/modules/fabbisogni_rischi.js',
        'js/modules/gradimento_monitoraggio.js',
        'js/modules/tutor_riesame.js',
        'js/modules/documenti_condizionali.js',
        'js/modules/lingua_italiana.js',
        'js/modules/registri_multigiorno.js',
        'js/modules/backup.js',
        'js/modules/export_sezioni.js',
        'js/modules/collaudo.js'
    ];
    for (const file of jsModules) {
        try {
            const resp = await fetch(file, { cache: 'no-store' });
            window.collAdd(report, 'Moduli JS', file, resp.ok ? 'ok' : 'error', resp.ok ? 'Caricato nello split step 23' : `HTTP ${resp.status}`);
        } catch (e) {
            window.collAdd(report, 'Moduli JS', file, 'error', e.message || String(e));
        }
    }

    // Moduli HTML.
    const modules = ['admin','aziende','corsisti','docenti','progetti','archivio_corsi','scadenze','stampe','migrazione','ente','collaudo','attestato','registro','fascicolo_corso','analisi_fabbisogni','scheda_rischi_settore','questionario_gradimento','riepilogo_gradimento','monitoraggio_qualita','relazione_tutor','scheda_riesame','test_lingua_italiana'];
    for (const m of modules) {
        try {
            const resp = await fetch(`modules/${m}.html`, { cache: 'no-store' });
            window.collAdd(report, 'Moduli HTML', `modules/${m}.html`, resp.ok ? 'ok' : 'error', resp.ok ? 'Caricabile' : `HTTP ${resp.status}`);
        } catch (e) {
            window.collAdd(report, 'Moduli HTML', `modules/${m}.html`, 'error', e.message || String(e));
        }
    }

    // Database e query principali.
    if (typeof window.supabaseClient === 'undefined') {
        window.collAdd(report, 'Database', 'Connessione Supabase', 'error', 'Client non configurato');
    } else {
        const tables = ['enti','aziende','docenti','corsisti','progetti','iscrizioni'];
        for (const table of tables) {
            try {
                const { error } = await window.supabaseClient.from(table).select('id').limit(1);
                window.collAdd(report, 'Database', table, error ? 'warn' : 'ok', error ? error.message : 'Query lettura OK');
            } catch (e) {
                window.collAdd(report, 'Database', table, 'warn', e.message || String(e));
            }
        }
        try {
            const { error } = await window.supabaseClient
                .from('progetti')
                .select('id,fabbisogni_data,fabbisogni_fonti,rischi_settore_id,rischi_selezionati')
                .limit(1);
            window.collAdd(
                report,
                'Database',
                'Campi Step 60 fabbisogni/rischi',
                error ? 'warn' : 'ok',
                error ? 'Applicare la migration Step 60: ' + error.message : 'Colonne disponibili'
            );
        } catch (e) {
            window.collAdd(report, 'Database', 'Campi Step 60 fabbisogni/rischi', 'warn', e.message || String(e));
        }
        try {
            const { error } = await window.supabaseClient
                .from('progetti')
                .select('id,gradimento_stato,gradimento_media_didattica,monitoraggio_in_itinere,monitoraggio_giudizio_finale')
                .limit(1);
            window.collAdd(
                report,
                'Database',
                'Campi Step 61 gradimento/monitoraggio',
                error ? 'warn' : 'ok',
                error ? 'Applicare la migration Step 61: ' + error.message : 'Colonne disponibili'
            );
        } catch (e) {
            window.collAdd(report, 'Database', 'Campi Step 61 gradimento/monitoraggio', 'warn', e.message || String(e));
        }
        try {
            const { error } = await window.supabaseClient
                .from('progetti')
                .select('id,tutor_nome,tutor_data_relazione,tutor_giudizio_globale,riesame_stato,riesame_azioni')
                .limit(1);
            window.collAdd(
                report,
                'Database',
                'Campi Step 62 tutor/riesame',
                error ? 'warn' : 'ok',
                error ? 'Applicare la migration Step 62: ' + error.message : 'Colonne disponibili'
            );
        } catch (e) {
            window.collAdd(report, 'Database', 'Campi Step 62 tutor/riesame', 'warn', e.message || String(e));
        }
        try {
            const { error } = await window.supabaseClient
                .from('corsisti')
                .select('id,cittadinanza,studi_scolastici_italia,lingua_test_stato,lingua_test_data,lingua_test_parte1,lingua_test_parte2,lingua_test_parte3')
                .limit(1);
            window.collAdd(
                report,
                'Database',
                'Campi Step 63 test lingua italiana',
                error ? 'warn' : 'ok',
                error ? 'Applicare la migration Step 63: ' + error.message : 'Colonne disponibili'
            );
        } catch (e) {
            window.collAdd(report, 'Database', 'Campi Step 63 test lingua italiana', 'warn', e.message || String(e));
        }
        try {
            const projectCheck = await window.supabaseClient
                .from('progetti')
                .select('id,tutor_previsto')
                .limit(1);
            const teacherCheck = await window.supabaseClient
                .from('docenti')
                .select('id,luogo_data_nascita')
                .limit(1);
            const error = projectCheck.error || teacherCheck.error;
            window.collAdd(
                report,
                'Database',
                'Campi Step 65 docenti/tutor facoltativo',
                error ? 'warn' : 'ok',
                error ? 'Applicare la migration Step 65: ' + error.message : 'Colonne disponibili'
            );
        } catch (e) {
            window.collAdd(report, 'Database', 'Campi Step 65 docenti/tutor facoltativo', 'warn', e.message || String(e));
        }
    }

    // Performance Progetti + iscrizioni batch.
    try {
        const t0 = performance.now();
        const projects = await window.getProgetti();
        const ids = projects.map(p => p.id).filter(Boolean);
        const map = window.getIscrizioniPerProgetti ? await window.getIscrizioniPerProgetti(ids) : {};
        const t1 = performance.now();
        const countIscr = Object.values(map || {}).reduce((sum, arr) => sum + (arr ? arr.length : 0), 0);
        const ms = Math.round(t1 - t0);
        const status = ms < 1500 ? 'ok' : (ms < 4000 ? 'warn' : 'error');
        window.collAdd(report, 'Performance', 'Caricamento Progetti + iscrizioni batch', status, `${projects.length} progetti, ${countIscr} iscrizioni, ${ms} ms`);
    } catch (e) {
        window.collAdd(report, 'Performance', 'Caricamento Progetti + iscrizioni batch', 'warn', e.message || String(e));
    }

    // Responsive e layout.
    const nav = document.getElementById('top-nav');
    if (nav) {
        const rect = nav.getBoundingClientRect();
        const tooTall = rect.height > Math.max(170, window.innerHeight * 0.28);
        window.collAdd(report, 'Responsive', 'Navbar adattiva', tooTall ? 'warn' : 'ok', `Altezza navbar: ${Math.round(rect.height)}px`);
    } else {
        window.collAdd(report, 'Responsive', 'Navbar adattiva', 'warn', 'Navbar non trovata nel DOM corrente');
    }
    const appOffset = getComputedStyle(document.documentElement).getPropertyValue('--nav-offset') || '';
    window.collAdd(report, 'Responsive', 'Offset contenuto dinamico', appOffset ? 'ok' : 'warn', appOffset || 'Non impostato');

    // Export configurato.
    for (const mod of Object.keys(window.SECTION_EXPORT_LABELS || {})) {
        window.collAdd(report, 'Export sezioni', mod, 'ok', 'Toolbar export/stampa configurata');
    }

    // Risultati.
    const counts = {
        ok: report.items.filter(i => i.status === 'ok').length,
        warn: report.items.filter(i => i.status === 'warn').length,
        error: report.items.filter(i => i.status === 'error').length
    };
    report.summary = counts;
    window.collaudoReport = report;

    const setText = (id, value) => { const el = document.getElementById(id); if (el) el.innerText = value; };
    setText('collaudo-ok', counts.ok);
    setText('collaudo-warn', counts.warn);
    setText('collaudo-error', counts.error);
    setText('collaudo-esito', counts.error ? 'Errori' : (counts.warn ? 'Avvisi' : 'OK'));
    window.renderCollaudoDevice();

    if (results) {
        const byArea = {};
        report.items.forEach(item => {
            if (!byArea[item.area]) byArea[item.area] = [];
            byArea[item.area].push(item);
        });
        results.innerHTML = Object.entries(byArea).map(([area, items]) => `
            <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div class="bg-slate-900 text-white px-4 py-3">
                    <h2 class="font-black uppercase text-sm">${window.dashEscape(area)}</h2>
                </div>
                <div class="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    ${items.map(item => `
                        <div class="rounded-xl border p-3 ${window.collStatusClass(item.status)}">
                            <div class="flex items-start justify-between gap-2">
                                <p class="font-black uppercase text-[11px] leading-tight">${window.dashEscape(item.name)}</p>
                                <span class="text-[8px] font-black uppercase px-2 py-1 rounded bg-white/70">${window.collStatusLabel(item.status)}</span>
                            </div>
                            <p class="text-[10px] mt-2 leading-snug opacity-90">${window.dashEscape(item.details || '')}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.initCollaudoSistema = function() {
    window.renderCollaudoDevice();
    window.addEventListener('resize', () => {
        if (document.getElementById('collaudo-device')) window.renderCollaudoDevice();
    }, { passive: true });
};

window.esportaReportCollaudo = function() {
    if (!window.collaudoReport) {
        return alert('Esegui prima il collaudo.');
    }
    const blob = new Blob([JSON.stringify(window.collaudoReport, null, 2)], { type: 'application/json' });
    const name = `SafetyManager_collaudo_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`;
    if (window.downloadBlobFile) window.downloadBlobFile(blob, name);
    else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = name; document.body.appendChild(a); a.click();
        setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
    }
};
