// Stampa fascicolo completo module
// Estratto da js/utils.js nello step 23 per ridurre il file principale.

window.renderPrintModuleToTemp = async function(moduleId, singleCorsista = null) {
    const resp = await fetch(`modules/${moduleId}.html`);
    if (!resp.ok) throw new Error(`Modulo non trovato: ${moduleId}`);
    const html = await resp.text();
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const prevModule = window.currentPrintModule;
    const prevSession = [...(window.currentSessionCorsisti || [])];

    window.currentPrintModule = moduleId;
    if (singleCorsista) window.currentSessionCorsisti = [singleCorsista];
    window.updateAll();

    // Aggiorna sul frammento temporaneo usando una preview invisibile.
    const oldPreview = document.getElementById('print-preview-container');
    let holder = document.createElement('div');
    holder.id = 'print-preview-container';
    holder.style.display = 'none';
    holder.innerHTML = html;
    document.body.appendChild(holder);
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

window.stampaFascicoloCompletoPDF = async function() {
    const progId = document.getElementById('stampa-progetto')?.value;
    if (!progId) return alert('Seleziona prima un progetto formativo.');

    await window.caricaDatiStampa();
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
        for (const m of docs) {
            const pages = await window.renderPrintModuleToTemp(m, null);
            pages.forEach(p => printArea.appendChild(p));
        }

        const backupSession = [...(window.currentSessionCorsisti || [])];
        for (const c of backupSession) {
            const pages = await window.renderPrintModuleToTemp('attestato', c);
            pages.forEach(p => printArea.appendChild(p));
        }

        alert('Ora si aprirà la stampa. Seleziona "Salva come PDF" per salvare sul PC il fascicolo completo con attestati.');
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
