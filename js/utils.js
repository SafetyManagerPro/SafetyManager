// js/utils.js

window.formatDataToISODate = function(dStr) {
    if (!dStr || dStr.includes('_')) return "";
    if (dStr.includes('/')) {
        const p = dStr.split('/');
        if (p.length === 3) return p[2] + "-" + p[1].padStart(2, '0') + "-" + p[0].padStart(2, '0');
    }
    return dStr;
}

window.formatDataToItalian = function(dStr) {
    if (!dStr) return "___/___/2025";
    if (dStr.includes('-')) {
        const p = dStr.split('-');
        if (p.length === 3) return p[2] + "/" + p[1] + "/" + p[0];
    }
    return dStr;
}

window.currentTestCourseId = "";
window.currentTestQuestions = [];
window.correctorEnabled = false;

window.renderUDInputs = function() {
    const corsoEl = document.getElementById('cfg-corso');
    if (!corsoEl) return; // Evita errori se il modulo config non è caricato
    
    const courseId = corsoEl.value;
    const c = window.DB_CORSI[courseId];
    if (!c || !c.prog) return;
    
    const defaultDocente = document.getElementById('cfg-docente').value || "Mario Rossi";
    let html = '<label class="text-[10px] font-bold text-slate-500 uppercase block border-b pb-1 mb-2">Assegnazione Docenti per UD</label>';
    
    c.prog.forEach((ud, index) => {
        html += '<div class="flex items-center justify-between gap-2 mt-1">';
        html += '<span class="text-[9px] font-bold text-slate-600 bg-slate-100 px-1 rounded w-8 text-center" title="' + ud.m + '">' + ud.ud + '</span>';
        html += '<input type="text" id="docente_ud_' + index + '" class="input-field text-[10px] py-1 flex-1 h-6" value="' + defaultDocente + '" oninput="window.updateAll()">';
        html += '</div>';
    });
    
    const container = document.getElementById('ud-docenti-container');
    if (container) container.innerHTML = html;
}

window.updateDBCounter = function() {
    const counter = document.getElementById('db-counter');
    if (counter) {
        counter.innerText = (window.dbCorsisti ? window.dbCorsisti.length : 0) + " Corsisti nel Cloud";
    }
}

// Funzione core per aggiornare tutti i campi della UI
window.updateAll = function() {
    const corsoEl = document.getElementById('cfg-corso');
    if (!corsoEl) return; // Esce se non siamo nel modulo corretto
    
    const courseId = corsoEl.value;
    const c = window.DB_CORSI[courseId];
    if(!c || !c.prog) return;

    if(!document.getElementById('docente_ud_0')) window.renderUDInputs();
    
    const dataInizioRaw = document.getElementById('cfg-data-inizio').value;
    let dInizio = dataInizioRaw ? new Date(dataInizioRaw.split('-')[0], dataInizioRaw.split('-')[1] - 1, dataInizioRaw.split('-')[2]) : new Date();

    const dEsameRaw = document.getElementById('cfg-data-esame').value;
    let dataEsameStrFormatted = dEsameRaw ? window.formatDataToItalian(dEsameRaw) : "___/___/2025";
    
    const yy = dInizio.getFullYear();
    const mm = (dInizio.getMonth() + 1).toString().padStart(2, '0');
    const currentAzienda = document.getElementById('cfg-azienda').value.trim();
    const az = currentAzienda.split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g,'') || "AZ";
    const currentCorso = c.t;
    
    let codice = document.getElementById('cfg-codice').value; // Mantenere logica di calcolo se vuoto (come originale)
    
    // Assegnazione valori a tutti gli elementi con classi specifiche (es. .val-ente, .val-azienda)
    document.querySelectorAll('.val-ente').forEach(el => el.innerText = document.getElementById('cfg-ente').value);
    document.querySelectorAll('.val-azienda').forEach(el => el.innerText = document.getElementById('cfg-azienda').value);
    document.querySelectorAll('.val-ateco').forEach(el => el.innerText = document.getElementById('cfg-ateco').value);
    document.querySelectorAll('.val-nome').forEach(el => el.innerText = document.getElementById('cfg-nome').value);
    document.querySelectorAll('.val-cf').forEach(el => el.innerText = document.getElementById('cfg-cf').value);
    document.querySelectorAll('.val-titolo-corso').forEach(el => el.innerText = c.t);
    document.querySelectorAll('.val-ore-corso').forEach(el => el.innerText = c.ore + " ORE");
    
    // Rigenera i test se siamo nella view esame
    window.updateTests();
}

window.updateTests = function() {
    const corsoEl = document.getElementById('cfg-corso');
    if (!corsoEl) return;
    
    const courseId = corsoEl.value;
    if (window.currentTestCourseId !== courseId || window.currentTestQuestions.length === 0) {
        // La funzione generateTestQuestions andrebbe definita qui o in data.js
        if(typeof window.generateTestQuestions === 'function') {
            window.currentTestQuestions = window.generateTestQuestions(courseId);
        }
        window.currentTestCourseId = courseId;
    }

    const testContainer = document.getElementById('test-container');
    if (testContainer && window.currentTestQuestions.length > 0) {
        let htmlTest = "";
        window.currentTestQuestions.forEach((item, idx) => {
            htmlTest += '<div class="mb-1 break-inside-avoid"><p class="font-bold text-slate-800">' + (idx + 1) + '. ' + item.q + '</p><div class="pl-2 space-y-0.5 mt-0.5">';
            item.a.forEach((ans, aIdx) => {
                const isCorrect = (window.correctorEnabled && aIdx === item.correct) ? 'show-correct' : '';
                htmlTest += '<div class="flex items-start gap-1 correct-answer ' + isCorrect + ' text-slate-700"><span>[  ]</span> <span>' + ans + '</span></div>';
            });
            htmlTest += '</div></div>';
        });
        testContainer.innerHTML = htmlTest;
    }
}

// Stampa Massiva
window.preparaEStampaMassiva = function(tabId) {
    if (!window.currentSessionCorsisti || window.currentSessionCorsisti.length === 0) return;
    
    const currentIndex = document.getElementById('cfg-select-corsista').value;
    let printArea = document.getElementById('print-area-temp');
    printArea.innerHTML = '';

    let viewsToPrint = [];
    if (tabId === 'esame') viewsToPrint = ['view-esame-scritto', 'view-esame-orale'];
    else if (tabId === 'attestato') viewsToPrint = ['view-attestato', 'view-attestato-retro'];
    else viewsToPrint = ['view-' + tabId];

    window.currentSessionCorsisti.forEach((c, idx) => {
        document.getElementById('cfg-select-corsista').value = idx;
        window.cambiaCorsistaSessione(); 
        
        viewsToPrint.forEach(vid => {
            const original = document.getElementById(vid);
            if(original) {
                const clone = original.cloneNode(true);
                clone.id = "";
                clone.classList.remove('hidden');
                clone.classList.add('print-show', 'temp-page');
                if(original.classList.contains('landscape')) clone.classList.add('landscape-force');
                else clone.classList.add('portrait');
                printArea.appendChild(clone);
            }
        });
    });

    document.body.classList.add('is-printing-temp');

    setTimeout(() => { 
        window.print(); 
        document.body.classList.remove('is-printing-temp');
        printArea.innerHTML = ''; 
        
        document.getElementById('cfg-select-corsista').value = currentIndex;
        window.cambiaCorsistaSessione();
    }, 1000);
}
