// Centro Stampe - click documento => prepara anteprima e avvia subito la stampa.
// Riusa le routine esistenti (attestati, questionari, esami, efficacia, ecc.)
// per evitare duplicazioni e conflitti con il motore di stampa storico.
(function () {
    if (window.__centroStampeDirectLoaded) return;
    window.__centroStampeDirectLoaded = true;

    let busy = false;

    window.stampaDocumentoCentroStampe = async function (modulo) {
        const progId = document.getElementById('stampa-progetto')?.value;
        if (!progId) {
            alert('Seleziona prima un Progetto Formativo.');
            return;
        }
        if (!modulo) return;
        if (busy) return;

        const container = document.getElementById('print-preview-container');
        busy = true;

        try {
            // Ricarica sempre i dati del progetto: la stampa deve riflettere le ultime modifiche.
            if (typeof window.caricaDatiStampa === 'function') {
                await window.caricaDatiStampa(progId, { suppressPreviewRefresh: true });
            }

            // Manteniamo anche l'anteprima aggiornata: oltre a essere utile visivamente,
            // alcune routine speciali di stampa riusano le pagine già renderizzate.
            if (typeof window.loadPrintPreview !== 'function') {
                throw new Error('Motore anteprima non disponibile.');
            }
            await window.loadPrintPreview(modulo);

            // Se il documento non è applicabile o il rendering non ha prodotto pagine,
            // non apriamo una finestra di stampa vuota.
            const pages = container ? container.querySelectorAll('.doc-page') : [];
            if (!pages.length) {
                const visibleError = container?.querySelector('.text-red-500')?.textContent?.trim();
                const conditional = typeof window.getConditionalPrintMessage === 'function'
                    ? window.getConditionalPrintMessage(modulo)
                    : '';
                alert(visibleError || conditional || 'Documento non disponibile o dati insufficienti per la stampa.');
                return;
            }

            if (typeof window.stampaSezioneAttuale !== 'function') {
                throw new Error('Motore di stampa non disponibile.');
            }

            await window.stampaSezioneAttuale();
        } catch (error) {
            console.error('Centro Stampe: stampa diretta non riuscita', { modulo, error });
            alert('Stampa non riuscita: ' + (error?.message || error));
        } finally {
            busy = false;
        }
    };

    // Il pacchetto corso usa lo stesso motore di stampa e aggiunge il pulsante dedicato al Centro Stampe.
    if (typeof window.loadOptionalSafetyScript === 'function') {
        window.loadOptionalSafetyScript('js/modules/pacchetto_corso.js');
    }
})();
