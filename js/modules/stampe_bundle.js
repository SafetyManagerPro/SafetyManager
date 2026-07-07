// Stampa fascicolo completo module
// Estratto da js/utils.js nello step 23 per ridurre il file principale.



window.getTestDigitaliProgetto = async function(projectId) {
    let local = [];
    try {
        local = JSON.parse(localStorage.getItem('SafetyManager.digitalTests.v1') || '[]')
            .filter(t => t && t.progetto_id === projectId);
    } catch (e) {
        console.warn('Impossibile leggere test digitali locali:', e);
    }

    let remote = [];
    try {
        if (window.supabaseClient) {
            const { data, error } = await supabaseClient
                .from('test_digitali')
                .select('*')
                .eq('progetto_id', projectId);
            if (!error) remote = data || [];
        }
    } catch (e) {
        console.warn('Test digitali remoti non disponibili:', e.message || e);
    }

    const map = new Map();
    [...remote, ...local].forEach(t => {
        if (!t) return;
        const key = t.key || `${t.progetto_id || projectId}::${t.iscrizione_id || t.corsista_id || t.corsista_nome || Math.random()}`;
        map.set(key, t);
    });
    return [...map.values()];
};

window.creaPaginaTestCorsista = function(test, corsista, type = 'compilato') {
    const esc = window.dashEscape || ((v) => String(v ?? ''));
    const isCorrected = type === 'corretto';
    const page = document.createElement('div');
    page.className = 'doc-page portrait print-show temp-page bg-white';
    page.style.cssText = 'width:210mm;min-height:296mm;padding:10mm;box-sizing:border-box;margin:0 auto;font-family:Arial,sans-serif;color:#0f172a;';

    const nome = esc(corsista?.nome || test?.corsista_nome || 'Corsista');
    const cf = esc(corsista?.cf || '');
    const corso = esc(window.AppState?.['cfg-titolo-corso'] || window.AppState?.['cfg-corso'] || '');
    const codice = esc(window.AppState?.['cfg-codice'] || '');
    const data = esc(window.formatDataToItalian ? window.formatDataToItalian(window.AppState?.['cfg-data-esame']) : (window.AppState?.['cfg-data-esame'] || ''));
    const title = isCorrected ? 'TEST CORRETTO / SOLUZIONI' : 'TEST COMPILATO DAL CORSISTA';

    if (!test) {
        page.innerHTML = `
            <div style="border-bottom:3px solid #0f172a;padding-bottom:8px;margin-bottom:16px;display:flex;justify-content:space-between;gap:16px;">
                <div>
                    <h1 style="font-size:18px;margin:0;font-weight:900;text-transform:uppercase;">${title}</h1>
                    <p style="font-size:10px;margin:3px 0 0;text-transform:uppercase;color:#64748b;font-weight:700;">${codice} · ${corso}</p>
                </div>
                <div style="text-align:right;font-size:10px;font-weight:700;color:#64748b;">Data: ${data}</div>
            </div>
            <div style="border:1px solid #cbd5e1;background:#f8fafc;border-radius:10px;padding:10px;margin-bottom:16px;font-size:12px;">
                <strong>Allievo:</strong> ${nome}<br>
                <strong>Codice fiscale:</strong> ${cf}
            </div>
            <div style="border:2px dashed #f59e0b;background:#fffbeb;border-radius:12px;padding:18px;font-size:13px;line-height:1.5;">
                <strong>Test digitale non trovato per questo corsista.</strong><br>
                Se il test è stato svolto su carta, allegare la scansione nel fascicolo corso.
                Se il test è stato svolto nelle Procedure digitali, verificare che sia stato salvato per questo progetto/corsista nello stesso browser.
            </div>`;
        return page;
    }

    const questions = test.domande || [];
    const answers = test.risposte || [];
    const rows = questions.map((q, idx) => {
        const selected = answers[idx];
        const correct = q.correct;
        const options = (q.a || []).map((a, ai) => {
            const chosen = selected === ai;
            const ok = correct === ai;
            let bg = '#ffffff', border = '#cbd5e1', prefix = '□';
            if (isCorrected && ok) { bg = '#dcfce7'; border = '#22c55e'; prefix = '✓'; }
            if (chosen && !isCorrected) { bg = '#dbeafe'; border = '#3b82f6'; prefix = '■'; }
            if (isCorrected && chosen && !ok) { bg = '#fee2e2'; border = '#ef4444'; prefix = '✕'; }
            if (isCorrected && chosen && ok) { prefix = '✓■'; }
            return `<div style="border:1px solid ${border};background:${bg};border-radius:8px;padding:6px 8px;margin:4px 0;font-size:10.5px;">
                <strong>${prefix}</strong> ${esc(a)}
            </div>`;
        }).join('');

        return `<div style="page-break-inside:avoid;border:1px solid #e2e8f0;border-radius:10px;padding:9px;margin-bottom:9px;">
            <p style="font-weight:900;font-size:11px;margin:0 0 5px;text-transform:uppercase;color:#1e3a8a;">Domanda ${idx + 1}</p>
            <p style="font-weight:700;font-size:11px;margin:0 0 7px;">${esc(q.q)}</p>
            ${options}
        </div>`;
    }).join('');

    page.innerHTML = `
        <div style="border-bottom:3px solid #0f172a;padding-bottom:8px;margin-bottom:12px;display:flex;justify-content:space-between;gap:16px;">
            <div>
                <h1 style="font-size:18px;margin:0;font-weight:900;text-transform:uppercase;">${title}</h1>
                <p style="font-size:10px;margin:3px 0 0;text-transform:uppercase;color:#64748b;font-weight:700;">${codice} · ${corso}</p>
            </div>
            <div style="text-align:right;font-size:10px;font-weight:700;color:#64748b;">Data: ${data}</div>
        </div>
        <div style="border:1px solid #cbd5e1;background:#f8fafc;border-radius:10px;padding:8px;margin-bottom:12px;font-size:11px;display:grid;grid-template-columns:1.4fr .8fr .8fr;gap:8px;">
            <div><strong>Allievo:</strong><br>${nome}<br><span style="font-family:monospace">${cf}</span></div>
            <div><strong>Punteggio:</strong><br>${esc(test.punteggio)} / ${esc(test.totale)} (${esc(test.percentuale)}%)</div>
            <div><strong>Esito:</strong><br>${esc(test.esito || '')}</div>
        </div>
        ${rows}
        <div style="margin-top:14px;display:flex;justify-content:space-between;font-size:10px;">
            <div style="width:42%;text-align:center;"><div style="border-bottom:1px solid #334155;height:26px;"></div><strong>Firma allievo</strong></div>
            <div style="width:42%;text-align:center;"><div style="border-bottom:1px solid #334155;height:26px;"></div><strong>Firma docente / correttore</strong></div>
        </div>`;
    return page;
};

window.renderTestDigitaliProgettoPages = async function(projectId) {
    const pages = [];
    const tests = await window.getTestDigitaliProgetto(projectId);
    const session = [...(window.currentSessionCorsisti || [])];

    session.forEach(corsista => {
        const test = tests.find(t =>
            t.iscrizione_id === corsista.iscrizione_id ||
            t.corsista_id === corsista.corsista_id ||
            String(t.corsista_nome || '').toLowerCase() === String(corsista.nome || '').toLowerCase()
        );
        pages.push(window.creaPaginaTestCorsista(test, corsista, 'compilato'));
        pages.push(window.creaPaginaTestCorsista(test, corsista, 'corretto'));
    });

    return pages;
};

window.renderPrintModuleToTemp = async function(moduleId, singleCorsista = null) {
    if (typeof window.renderPrintModulePages === 'function') {
        return await window.renderPrintModulePages(moduleId, singleCorsista, { preview: false });
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

    await window.caricaDatiStampa(progId);
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

        for (const m of docs) {
            const pages = await window.renderPrintModuleToTemp(m, null);
            allPages.push(...pages);
            if (m === 'verbale' && typeof window.renderTestDigitaliProgettoPages === 'function') {
                allPages.push(...await window.renderTestDigitaliProgettoPages(progId));
            }
        }

        const backupSession = [...(window.currentSessionCorsisti || [])];
        allPages.forEach(p => printArea.appendChild(p));

        alert(`Ora si aprirà la stampa. Seleziona "Salva come PDF" per salvare sul PC il PDF unico progetto con test e correttori. Gli attestati NON sono inclusi: usa il pulsante "PDF solo attestati". Corsisti: ${backupSession.length}.`);
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
