// Stampa fascicolo completo module
// Estratto da js/utils.js nello step 23 per ridurre il file principale.



// Step 54: test digitale disattivato nel PDF unico progetto. Si usano solo test manuali cartacei generati dal Progetto Formativo.

window.renderPrintModuleToTemp = async function(moduleId, singleCorsista = null, options = {}) {
    if (typeof window.renderPrintModulePages === 'function') {
        return await window.renderPrintModulePages(moduleId, singleCorsista, { preview: false, ...options });
    }

    const resp = await fetch(`modules/${moduleId}.html`);
    if (!resp.ok) throw new Error(`Modulo non trovato: ${moduleId}`);
    const html = await resp.text();
    const prevModule = window.currentPrintModule;
    const prevSession = [...(window.currentSessionCorsisti || [])];

    const holder = document.createElement('div');
    holder.style.position = 'absolute';
    holder.style.left = '-99999px';
    holder.innerHTML = html;
    document.body.appendChild(holder);

    window.currentPrintModule = moduleId;
    if (singleCorsista) window.currentSessionCorsisti = [singleCorsista];
    window.updateAll();

    const pages = Array.from(holder.querySelectorAll('.doc-page')).map(p => {
        const clone = p.cloneNode(true);
        clone.classList.remove('scale-[0.8]', 'origin-top');
        clone.classList.add('print-show', 'temp-page');
        return clone;
    });
    holder.remove();

    window.currentPrintModule = prevModule;
    window.currentSessionCorsisti = prevSession;
    return pages;
};


window.stampaFascicoloCompletoPDF = async function(projectId = null) {
    const progId = projectId || document.getElementById('stampa-progetto')?.value;
    if (!progId) return alert('Seleziona prima un progetto formativo.');

    await window.caricaDatiStampa(progId, { suppressPreviewRefresh: true });
    const printArea = document.getElementById('print-area-temp');
    printArea.innerHTML = '';

    const docs = [
        'progetto_formativo',
        'validazione_percorso_formativo',
        'dichiarazione_docenza',
        'autocert',
        'richiesta_organismo_paritetico',
        'dichiarazione_attrezzature',
        'registro',
        'verbale',
        'fascicolo_corso'
    ];

    try {
        // Creazione in memoria: appendiamo al DOM solo alla fine per evitare che
        // updateAll delle stampe successive sovrascriva le pagine già preparate.
        const allPages = [];

        const backupSession = [...(window.currentSessionCorsisti || [])];

        for (const m of docs) {
            const pages = await window.renderPrintModuleToTemp(m, null, {
                // Step 57: nel PDF unico i test vengono inseriti esplicitamente subito dopo il Progetto Formativo,
                // così funzionano sia da Centro Stampe sia dal pulsante in Progetti.
                includeProjectFormativoTests: false,
                includeFascicoloTests: false,
                includeNeedsRiskAnnexes: false,
                includeQualityAnnexes: false,
                includeTutorRiesameAnnexes: false,
                includeLinguaAnnexes: false,
                includeMultiDayRegisters: false
            });
            allPages.push(...pages);

            if (m === 'progetto_formativo') {
                const needsRiskPages = (typeof window.renderNeedsRiskAnnexPages === 'function')
                    ? await window.renderNeedsRiskAnnexPages({ preview: false })
                    : [];
                allPages.push(...needsRiskPages);

                const testPages = (typeof window.renderManualTestsForCurrentPrintProject === 'function')
                    ? window.renderManualTestsForCurrentPrintProject({ preview: false, session: backupSession })
                    : (typeof window.renderManualTestCoursePages === 'function'
                        ? window.renderManualTestCoursePages(window.AppState?.['cfg-corso'] || '', { preview: false, session: backupSession })
                        : []);
                allPages.push(...testPages);

                if (typeof window.renderLinguaItalianaAnnexPages === 'function') {
                    const linguaPages = await window.renderLinguaItalianaAnnexPages({
                        preview: false,
                        session: backupSession
                    });
                    allPages.push(...linguaPages);
                }
            }

            if (m === 'verbale' && typeof window.renderGradimentoMonitoraggioAnnexPages === 'function') {
                const qualityPages = await window.renderGradimentoMonitoraggioAnnexPages({
                    preview: false,
                    session: backupSession
                });
                allPages.push(...qualityPages);
            }
            if (m === 'verbale' && typeof window.renderTutorRiesameAnnexPages === 'function') {
                const tutorRiesamePages = await window.renderTutorRiesameAnnexPages({
                    preview: false,
                    session: backupSession
                });
                allPages.push(...tutorRiesamePages);
            }
        }

        // Verifica di sicurezza Step 57: il PDF unico deve contenere sempre i test manuali
        // da far compilare ai corsisti e il correttore allegato al progetto formativo.
        const hasManualTests = allPages.some(p => p?.dataset?.manualTestPage);
        if (!hasManualTests) {
            const fallbackTests = (typeof window.renderManualTestsForCurrentPrintProject === 'function')
                ? window.renderManualTestsForCurrentPrintProject({ preview: false, session: backupSession })
                : [];
            allPages.push(...fallbackTests);
        }

        const blankTests = allPages.filter(p => p?.dataset?.manualTestPage === 'blank').length;
        const correctedTests = allPages.filter(p => p?.dataset?.manualTestPage === 'corrected').length;
        const questionnaires = allPages.filter(p => p?.dataset?.gradimentoQuestionario).length;
        const tutorPages = allPages.filter(p => p?.dataset?.tutorRelationPage).length;
        const reviewPages = allPages.filter(p => p?.dataset?.reviewPage).length;
        const linguaCandidatePages = allPages.filter(p => p?.dataset?.linguaCandidatePage).length;
        const linguaCorrectors = allPages.filter(p => p?.dataset?.linguaCorrectorPage).length;
        const registerDayPages = allPages.filter(p => p?.dataset?.registerDayPage).length;

        if (!blankTests || !correctedTests) {
            console.warn('PDF unico progetto senza test manuali completi:', { blankTests, correctedTests, allPages });
            alert('Attenzione: il PDF unico non ha generato correttamente tutti i test manuali. Verifica che il progetto abbia corsisti iscritti e che il corso sia selezionato. Procedo comunque con la stampa dei documenti disponibili.');
        }

        allPages.forEach(p => {
            if (p?.dataset?.manualTestPage) {
                // Step 58: forzo classi e stile stampabile delle pagine test per evitare che vengano nascoste
                // o trattate come pagine portrait dal CSS di stampa storico.
                p.classList.add('print-show', 'temp-page', 'landscape-force', 'manual-test-page');
                p.classList.remove('hidden', 'scale-[0.8]', 'origin-top');
                p.style.display = 'block';
                p.style.position = 'relative';
                p.style.transform = 'none';
                p.style.width = '297mm';
                p.style.height = '210mm';
                p.style.maxHeight = '210mm';
                p.style.padding = '0';
                p.style.pageBreakAfter = 'always';
                p.style.breakAfter = 'page';
            }
            printArea.appendChild(p);
        });

        printArea.dataset.blankTests = String(blankTests);
        printArea.dataset.correctedTests = String(correctedTests);
        console.info('PDF unico progetto: pagine totali/test manuali', {
            pages: allPages.length,
            blankTests,
            correctedTests,
            questionnaires,
            tutorPages,
            reviewPages,
            linguaCandidatePages,
            linguaCorrectors,
            registerDayPages,
            corsisti: backupSession.length
        });

        alert(`Ora si aprirà la stampa. Seleziona "Salva come PDF" per salvare sul PC il PDF unico progetto. Sono inclusi Analisi Fabbisogni, Scheda Rischi, ${registerDayPages} registri presenze (uno per ogni giornata formativa), ${blankTests} test manuali, ${correctedTests} correttore/i, ${questionnaires} questionari di gradimento, riepilogo, monitoraggio qualità, relazione tutor, scheda riesame e ${linguaCandidatePages} pagine test lingua italiana (${linguaCorrectors} correttore/i) per i corsisti interessati. Gli attestati NON sono inclusi: usa il pulsante "PDF solo attestati". Corsisti: ${backupSession.length}.`);
        document.body.classList.add('is-printing-temp');
        setTimeout(() => {
            window.print();
            document.body.classList.remove('is-printing-temp');
            printArea.innerHTML = '';
        }, 1200);
    } catch (e) {
        console.error(e);
        alert('Errore nella preparazione del PDF completo: ' + (e.message || e));
        document.body.classList.remove('is-printing-temp');
        printArea.innerHTML = '';
    }
};

// ==========================================
// BACKUP LOCALE DATABASE SUPABASE
// ==========================================


window.stampaFascicoloCompletoDaProgetti = async function(projectId) {
    if (!projectId) return alert('Progetto non selezionato.');
    if (typeof window.stampaFascicoloCompletoPDF !== 'function') {
        alert('Modulo stampa fascicolo non caricato. Ricarica la pagina e riprova.');
        return;
    }
    await window.stampaFascicoloCompletoPDF(projectId);
};



window.stampaModuloProgettoRapido = async function(projectId, moduleId, label = 'documento') {
    if (!projectId) return alert('Progetto non selezionato.');
    const printArea = document.getElementById('print-area-temp');
    if (!printArea) return alert('Area di stampa non disponibile.');

    try {
        await window.caricaDatiStampa(projectId);
        printArea.innerHTML = '';
        const pages = await window.renderPrintModuleToTemp(moduleId, null);
        pages.forEach(p => printArea.appendChild(p));
        alert(`Ora si aprirà la stampa del ${label}. Seleziona "Salva come PDF" per salvarlo.`);
        document.body.classList.add('is-printing-temp');
        setTimeout(() => {
            window.print();
            document.body.classList.remove('is-printing-temp');
            printArea.innerHTML = '';
        }, 900);
    } catch (e) {
        console.error(e);
        alert('Errore nella preparazione stampa: ' + (e.message || e));
        document.body.classList.remove('is-printing-temp');
        printArea.innerHTML = '';
    }
};

window.stampaProgettoFormativoDaProgetto = async function(projectId) {
    await window.stampaModuloProgettoRapido(projectId, 'progetto_formativo', 'progetto formativo');
};

window.stampaAttestatiProgetto = async function(projectId) {
    if (!projectId) return alert('Progetto non selezionato.');
    const printArea = document.getElementById('print-area-temp');
    if (!printArea) return alert('Area di stampa non disponibile.');

    try {
        await window.caricaDatiStampa(projectId);
        const n = (window.currentSessionCorsisti || []).length;
        if (!n) return alert('Nessun corsista iscritto a questo progetto.');
        printArea.innerHTML = '';
        if (typeof window.renderAttestatiMultipli === 'function') {
            await window.renderAttestatiMultipli(printArea, { preview: false });
        } else {
            for (const c of [...window.currentSessionCorsisti]) {
                const pages = await window.renderPrintModuleToTemp('attestato', c);
                pages.forEach(p => printArea.appendChild(p));
            }
        }
        alert(`Ora si aprirà la stampa degli attestati: ${n} corsisti.`);
        document.body.classList.add('is-printing-temp');
        setTimeout(() => {
            window.print();
            document.body.classList.remove('is-printing-temp');
            printArea.innerHTML = '';
        }, 1000);
    } catch (e) {
        console.error(e);
        alert('Errore nella preparazione attestati: ' + (e.message || e));
        document.body.classList.remove('is-printing-temp');
        printArea.innerHTML = '';
    }
};

window.stampaAttestatoCorsista = async function(projectId, corsistaId) {
    if (!projectId || !corsistaId) return alert('Progetto o corsista non selezionato.');
    const printArea = document.getElementById('print-area-temp');
    if (!printArea) return alert('Area di stampa non disponibile.');

    try {
        await window.caricaDatiStampa(projectId);
        const corsista = (window.currentSessionCorsisti || []).find(c => c.corsista_id === corsistaId || c.corsista_id == corsistaId);
        if (!corsista) return alert('Corsista non trovato tra gli iscritti del progetto selezionato.');
        printArea.innerHTML = '';
        const pages = await window.renderPrintModuleToTemp('attestato', corsista);
        pages.forEach(p => printArea.appendChild(p));
        alert(`Ora si aprirà la stampa dell'attestato di ${corsista.nome || 'corsista'}.`);
        document.body.classList.add('is-printing-temp');
        setTimeout(() => {
            window.print();
            document.body.classList.remove('is-printing-temp');
            printArea.innerHTML = '';
        }, 900);
    } catch (e) {
        console.error(e);
        alert('Errore nella preparazione attestato: ' + (e.message || e));
        document.body.classList.remove('is-printing-temp');
        printArea.innerHTML = '';
    }
};


window.stampaSoloAttestatiPDF = async function(projectId = null) {
    const progId = projectId || document.getElementById('stampa-progetto')?.value;
    return await window.stampaAttestatiProgetto(progId);
};
