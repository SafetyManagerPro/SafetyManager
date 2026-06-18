// js/utils.js

// ==========================================
// VARIABILI GLOBALI E STATE MANAGER
// ==========================================
window.currentTestCourseId = "";
window.currentTestQuestions = [];
window.correctorEnabled = false;
window.currentSessionCorsisti = [];

window.AppState = window.AppState || {};

window.getVal = function(id, defaultVal = "") {
    const el = document.getElementById(id);
    if (el) {
        window.AppState[id] = el.value; 
        return el.value;
    }
    return window.AppState[id] !== undefined ? window.AppState[id] : defaultVal;
}

// ==========================================
// UTILITY DI FORMATTAZIONE E DB
// ==========================================
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

window.updateDBCounter = function() {
    const counter = document.getElementById('db-counter');
    if (counter) {
        counter.innerText = (window.dbCorsisti ? window.dbCorsisti.length : 0) + " Corsisti nel Cloud";
    }
}

// ==========================================
// MOTORE PRINCIPALE: RENDER E UPDATE
// ==========================================
window.renderUDInputs = function() {
    const courseId = window.getVal('cfg-corso', 'lav_basso');
    const c = window.DB_CORSI[courseId];
    if (!c || !c.prog) return;
    
    const defaultDocente = window.getVal('cfg-docente', 'Mario Rossi');
    let html = '<label class="text-[10px] font-bold text-slate-500 uppercase block border-b pb-1 mb-2">Assegnazione Docenti per UD</label>';
    
    c.prog.forEach((ud, index) => {
        const savedDoc = window.getVal('docente_ud_' + index, defaultDocente);
        html += '<div class="flex items-center justify-between gap-2 mt-1">';
        html += '<span class="text-[9px] font-bold text-slate-600 bg-slate-100 px-1 rounded w-8 text-center" title="' + ud.m + '">' + ud.ud + '</span>';
        html += '<input type="text" id="docente_ud_' + index + '" class="input-field text-[10px] py-1 flex-1 h-6" value="' + savedDoc + '" oninput="window.updateAll()">';
        html += '</div>';
    });
    
    const container = document.getElementById('ud-docenti-container');
    if (container) container.innerHTML = html;
}

window.updateAll = function() {
    const courseId = window.getVal('cfg-corso', 'lav_basso');
    const c = window.DB_CORSI[courseId];
    if(!c || !c.prog) return;

    if(document.getElementById('ud-docenti-container') && !document.getElementById('docente_ud_0')) {
        window.renderUDInputs();
    }
    
    const dataInizioRaw = window.getVal('cfg-data-inizio');
    let dInizio = dataInizioRaw ? new Date(dataInizioRaw.split('-')[0], dataInizioRaw.split('-')[1] - 1, dataInizioRaw.split('-')[2]) : new Date();

    const dEsameRaw = window.getVal('cfg-data-esame');
    let dataEsameStrFormatted = dEsameRaw ? window.formatDataToItalian(dEsameRaw) : "___/___/2025";
    
    const yy = dInizio.getFullYear();
    const mm = (dInizio.getMonth() + 1).toString().padStart(2, '0');
    const currentAzienda = window.getVal('cfg-azienda').trim();
    const az = currentAzienda.split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g,'') || "AZ";
    const currentCorso = c.t;
    
    let codice = window.getVal('cfg-codice');
    const existingId = window.getVal('cfg-loaded-cert-id');
    
    if(existingId && window.dbCorsisti) { 
        const found = window.dbCorsisti.find(x => x.id_certificato === existingId); 
        if(found) codice = found.codice; 
    } 
    
    if (!codice && window.dbCorsisti) {
        const existingSession = window.dbCorsisti.find(r => 
            (r.corso || "").trim().toLowerCase() === currentCorso.toLowerCase() && 
            (r.azienda || "").trim().toLowerCase() === currentAzienda.toLowerCase() && 
            (r.data_esame === dEsameRaw)
        );
        if (existingSession && existingSession.codice) {
            codice = existingSession.codice;
        } else {
            const baseCodice = az + "/" + yy + "/" + mm + "/" + c.code + "/" + c.risk;
            let maxProg = 0;
            window.dbCorsisti.forEach(r => { 
                if(r.codice && r.codice.startsWith(baseCodice)) { 
                    const p = parseInt(r.codice.split('/').pop()); 
                    if(!isNaN(p) && p > maxProg) maxProg = p; 
                }
            });
            codice = baseCodice + "/" + (maxProg + 1).toString().padStart(2,'0');
        }
    }
    
    const codEl = document.getElementById('cfg-codice');
    if(codEl) codEl.value = codice || "";
    window.AppState['cfg-codice'] = codice;

    // Calcolo Date, Docenti e Syllabus (saltando Sabato e Domenica)
    let docentiMap = {}; 
    let scheduleHtml = ""; 
    let currentDay = new Date(dInizio.getTime()); 
    let calendarioTesto = "";
    let docentePrincipale = window.getVal('cfg-docente', 'Mario Rossi'); 
    
    const calendarioManuale = window.getVal('cfg-calendario').trim();
    let dailyHours = 0;
    
    if(currentDay.getDay() === 6) currentDay.setDate(currentDay.getDate() + 2); 
    if(currentDay.getDay() === 0) currentDay.setDate(currentDay.getDate() + 1);

    let dateSummaryArr = [];

    c.prog.forEach((ud, index) => {
        const docName = window.getVal('docente_ud_' + index, docentePrincipale);
        if (index === 0) docentePrincipale = docName; 

        if (!docentiMap[docName]) docentiMap[docName] = { ore: 0, uds: [] };
        docentiMap[docName].ore += ud.ore;
        if (!docentiMap[docName].uds.includes(ud.ud)) docentiMap[docName].uds.push(ud.ud);

        let remainingUDHours = ud.ore;
        let udDates = []; 

        while(remainingUDHours > 0) {
            if(dailyHours >= 8) {
                currentDay.setDate(currentDay.getDate() + 1);
                if(currentDay.getDay() === 6) currentDay.setDate(currentDay.getDate() + 2);
                if(currentDay.getDay() === 0) currentDay.setDate(currentDay.getDate() + 1);
                dailyHours = 0;
            }
            
            let availableToday = 8 - dailyHours; 
            let hoursToAllocate = Math.min(remainingUDHours, availableToday);
            let dateStr = currentDay.toLocaleDateString('it-IT');
            
            if (!udDates.includes(dateStr)) udDates.push(dateStr);
            if(!calendarioTesto.includes(dateStr)) calendarioTesto += (calendarioTesto ? "\n" : "") + dateStr;
            
            dailyHours += hoursToAllocate; 
            remainingUDHours -= hoursToAllocate;
        }

        let combinedDates = udDates.join('<br>');
        scheduleHtml += '<tr><td class="text-center font-bold p-1 border border-slate-300 align-top">' + combinedDates + '</td><td class="text-center p-1 border border-slate-300 align-top font-bold text-slate-500">' + ud.ud + '</td><td class="p-1 border border-slate-300"><p class="font-bold text-slate-800 uppercase mb-0.5">' + ud.m + '</p><div class="text-slate-700 text-[8px] leading-tight">' + ud.d + '</div></td><td class="text-center p-1 border border-slate-300 font-bold text-blue-700 align-middle">' + docName + '</td><td class="text-center font-bold p-1 border border-slate-300 align-middle">' + ud.ore + ' h</td></tr>';

        dateSummaryArr.push('<span class="font-bold text-slate-800">' + ud.ud + '</span>: ' + udDates.join(', '));
    });

    let rdHtml = "";
    let idxRd = 1;
    for (const [docName, data] of Object.entries(docentiMap)) {
        rdHtml += '<tr class="bg-white">';
        rdHtml += '<td class="p-2 border border-slate-800 text-center font-bold">' + idxRd + '</td>';
        rdHtml += '<td class="p-2 border border-slate-800 font-black text-slate-800">' + docName + '</td>';
        rdHtml += '<td class="p-2 border border-slate-800 font-mono text-slate-600 text-[9px]">' + data.uds.join(', ') + '</td>';
        rdHtml += '<td class="p-2 border border-slate-800 text-center font-bold text-blue-700">' + data.ore + ' h</td>';
        rdHtml += '<td class="p-2 border border-slate-800 w-48">&nbsp;</td>';
        rdHtml += '</tr>';
        idxRd++;
    }
    
    if(document.getElementById('rd-rows')) document.getElementById('rd-rows').innerHTML = rdHtml;
    if(document.getElementById('p-programma')) document.getElementById('p-programma').innerHTML = scheduleHtml;
    if(document.getElementById('retro-programma')) document.getElementById('retro-programma').innerHTML = scheduleHtml;
    
    if (!calendarioManuale) {
        const calEl = document.getElementById('cfg-calendario');
        if (calEl) calEl.value = calendarioTesto;
        window.AppState['cfg-calendario'] = calendarioTesto;
        
        const offsetDate = new Date(currentDay.getTime() - (currentDay.getTimezoneOffset() * 60000));
        const autoEsame = offsetDate.toISOString().split('T')[0];
        const dataEsameEl = document.getElementById('cfg-data-esame');
        if (dataEsameEl) dataEsameEl.value = autoEsame;
        window.AppState['cfg-data-esame'] = autoEsame;
    }

    // ==========================================
    // POPOLAMENTO DATI GLOBALI NELLA UI CORRENTE
    // ==========================================
    const sedeInput = window.getVal('cfg-sede-corso');
    const sedeToDisplay = sedeInput || window.getVal('cfg-azienda-indirizzo') || "Sede Aziendale";

    document.querySelectorAll('.val-ente').forEach(el => el.innerText = window.getVal('cfg-ente'));
    document.querySelectorAll('.val-azienda').forEach(el => el.innerText = window.getVal('cfg-azienda'));
    document.querySelectorAll('.val-ateco').forEach(el => el.innerText = window.getVal('cfg-ateco'));
    document.querySelectorAll('.val-nome').forEach(el => el.innerText = window.getVal('cfg-nome'));
    document.querySelectorAll('.val-mansione').forEach(el => el.innerText = window.getVal('cfg-mansione'));
    document.querySelectorAll('.val-nascita').forEach(el => el.innerText = window.getVal('cfg-nascita'));
    document.querySelectorAll('.val-cf').forEach(el => el.innerText = window.getVal('cfg-cf'));
    document.querySelectorAll('.val-titolo-corso').forEach(el => el.innerText = c.t);
    document.querySelectorAll('.val-ore-corso').forEach(el => el.innerText = c.ore + " ORE");
    document.querySelectorAll('.val-codice').forEach(el => el.innerText = window.getVal('cfg-codice'));
    document.querySelectorAll('.val-sede-corso').forEach(el => el.innerText = sedeToDisplay); 
    document.querySelectorAll('.val-docente').forEach(el => el.innerText = window.getVal('cfg-docente')); 
    document.querySelectorAll('.val-docente-main').forEach(el => el.innerText = docentePrincipale); 
    document.querySelectorAll('.val-resp-corso').forEach(el => el.innerText = window.getVal('cfg-resp-corso'));
    document.querySelectorAll('.val-resp-progetto').forEach(el => el.innerText = window.getVal('cfg-resp-progetto'));
    document.querySelectorAll('.val-luogo-emissione').forEach(el => el.innerText = window.getVal('cfg-luogo-emissione'));
    document.querySelectorAll('.val-req-docente').forEach(el => el.innerText = window.getVal('cfg-req-docente', 'Formatore Qualificato'));
    
    const tutorVal = window.getVal('cfg-tutor');
    document.querySelectorAll('.val-tutor').forEach(el => el.innerText = tutorVal ? tutorVal : "N/D - Non Applicabile");
    
    document.querySelectorAll('.val-legale-nome').forEach(el => el.innerText = window.getVal('cfg-legale-nome'));
    document.querySelectorAll('.val-legale-nascita').forEach(el => el.innerText = window.getVal('cfg-legale-nascita'));
    
    document.querySelectorAll('.val-date-ud').forEach(el => el.innerHTML = dateSummaryArr.join(' &bull; '));
    document.querySelectorAll('.val-data-esame').forEach(el => el.innerText = window.formatDataToItalian(window.getVal('cfg-data-esame')));

    document.querySelectorAll('.val-data-inizio').forEach(el => {
        const di = window.getVal('cfg-data-inizio');
        if(di) {
            const p = di.split('-');
            el.innerText = p[2] + "/" + p[1] + "/" + p[0];
        } else {
            el.innerText = "___/___/2025";
        }
    });

    document.querySelectorAll('.val-calendario').forEach(el => el.innerText = window.getVal('cfg-calendario'));
    document.querySelectorAll('.val-modalita').forEach(el => el.innerText = window.getVal('cfg-modalita', 'In Presenza Fisica'));
    document.querySelectorAll('.val-ente-indirizzo').forEach(el => el.innerText = window.getVal('cfg-ente-indirizzo'));
    document.querySelectorAll('.val-ente-contatti').forEach(el => el.innerText = window.getVal('cfg-ente-contatti'));

    // Cert ID Generator
    let certIdStr = window.getVal('cfg-loaded-cert-id');
    if(!certIdStr && codice) {
        const safeCf = (window.getVal('cfg-cf') || "XXX").substring(0,6);
        certIdStr = "C25-" + codice.split(/[-/]/).pop() + "-" + safeCf + "-" + new Date().getTime().toString().slice(-4);
    }
    document.querySelectorAll('.val-cert-id').forEach(el => el.innerText = certIdStr || "---");

    // Logo Manager
    const logoUrl = window.getVal('cfg-logo');
    document.querySelectorAll('.logo-img').forEach(img => { 
        if(logoUrl){ img.src=logoUrl; img.classList.remove('hidden'); } 
        else img.classList.add('hidden'); 
    });
    
    document.querySelectorAll('.val-dicitura-legale').forEach(el => el.innerHTML = "Corso erogato in conformità al <strong>" + (c.norma || "D.Lgs. 81/08 e Accordi Stato Regioni vigenti") + "</strong>. Qualifica della Docenza Registrata: " + window.getVal('cfg-req-docente') + ".");

    if (c.scad === 99) { 
        document.querySelectorAll('.val-scadenza').forEach(el => el.innerText = "Credito Permanente"); 
    } else if(window.getVal('cfg-data-esame')) { 
        const parts = window.getVal('cfg-data-esame').split('-'); 
        const d = new Date(parts[0], parts[1]-1, parts[2]); 
        d.setFullYear(d.getFullYear() + c.scad); 
        document.querySelectorAll('.val-scadenza').forEach(el => el.innerText = d.toLocaleDateString('it-IT') + ' (Agg. ' + c.scad + ' Anni)'); 
    } else { 
        document.querySelectorAll('.val-scadenza').forEach(el => el.innerText = '--/--/-- (Agg. ' + c.scad + ' Anni)'); 
    }

    // ==========================================
    // AUTO-GENERAZIONE RIGHE (Controlli INDIPENDENTI)
    // ==========================================
    
    if (!window.currentSessionCorsisti || window.currentSessionCorsisti.length === 0) {
        // Modalità Utente Singolo
        const nomeVal = window.getVal('cfg-nome');
        const mansioneVal = window.getVal('cfg-mansione');
        const cfVal = window.getVal('cfg-cf');

        // Controllo indipendente per il Registro
        const rRowsEl = document.getElementById('r-rows');
        if (rRowsEl && !rRowsEl.dataset.populated) {
            let rr = '<tr><td class="border border-slate-800 py-0.5 px-1 text-center font-bold">1</td><td class="border border-slate-800 py-0.5 px-1 bg-white leading-none"><span class="font-bold">' + nomeVal + '</span><br><span class="text-[6px] text-slate-500 uppercase">' + (mansioneVal || '') + '</span></td><td class="border border-slate-800 py-0.5 px-1 text-center font-mono">' + cfVal + '</td><td class="border border-slate-800 py-0.5 px-1 text-center">&nbsp;</td><td class="border border-slate-800 py-0.5 px-1">&nbsp;</td><td class="border border-slate-800 py-0.5 px-1 text-center">&nbsp;</td><td class="border border-slate-800 py-0.5 px-1">&nbsp;</td></tr>';
            for(let i=0; i<29; i++){ 
                rr += '<tr><td class="border border-slate-800 py-0.5 px-1">&nbsp;</td><td class="border border-slate-800 py-0.5 px-1">&nbsp;</td><td class="border border-slate-800 py-0.5 px-1">&nbsp;</td><td class="border border-slate-800 py-0.5 px-1">&nbsp;</td><td class="border border-slate-800 py-0.5 px-1">&nbsp;</td><td class="border border-slate-800 py-0.5 px-1">&nbsp;</td><td class="border border-slate-800 py-0.5 px-1">&nbsp;</td></tr>'; 
            }
            rRowsEl.innerHTML = rr;
            rRowsEl.dataset.populated = "true";
        }

        // Controllo indipendente per il Verbale
        const vRowsEl = document.getElementById('v-rows');
        if (vRowsEl && !vRowsEl.dataset.populated) {
            let vr = '<tr><td class="border border-slate-900 py-0.5 px-1 leading-tight"><span class="font-bold">' + nomeVal + '</span><br><span class="text-[6.5px] text-slate-500 uppercase">' + (mansioneVal || '') + '</span></td><td class="border border-slate-900 py-0.5 px-1 text-center font-bold text-emerald-700">SI</td><td class="border border-slate-900 py-0.5 px-1 text-center italic">__ / 30</td><td class="border border-slate-900 py-0.5 px-1 text-center">Positivo</td><td class="border border-slate-900 py-0.5 px-1 text-center font-bold uppercase text-blue-700">Idoneo</td></tr>';
            for(let i=0; i<29; i++){ 
                vr += '<tr><td class="border border-slate-900 py-0.5 px-1">&nbsp;</td><td class="border border-slate-900 py-0.5 px-1">&nbsp;</td><td class="border border-slate-900 py-0.5 px-1">&nbsp;</td><td class="border border-slate-900 py-0.5 px-1">&nbsp;</td><td class="border border-slate-900 py-0.5 px-1">&nbsp;</td></tr>'; 
            }
            vRowsEl.innerHTML = vr;
            vRowsEl.dataset.populated = "true";
        }
    } else {
        // Modalità Multi-Utente Sessione
        if(typeof window.aggiornaTabelleSessione === 'function') window.aggiornaTabelleSessione();
    }

    window.updateTests();
}

// ==========================================
// RIGHE TABELLE PER MULTI UTENTE (30 RIGHE)
// ==========================================
window.aggiornaTabelleSessione = function() {
    if (!window.currentSessionCorsisti || window.currentSessionCorsisti.length === 0) return;
    let rRows = ""; let vRows = "";
    
    window.currentSessionCorsisti.forEach((c, idx) => {
        rRows += '<tr><td class="border border-slate-800 py-0.5 px-1 text-center font-bold">' + (idx + 1) + '</td><td class="border border-slate-800 py-0.5 px-1 bg-white leading-none"><span class="font-bold">' + c.nome + '</span><br><span class="text-[6px] text-slate-500 uppercase">' + (c.mansione || '') + '</span></td><td class="border border-slate-800 py-0.5 px-1 text-center font-mono">' + c.cf + '</td><td class="border border-slate-800 py-0.5 px-1 text-center">&nbsp;</td><td class="border border-slate-800 py-0.5 px-1">&nbsp;</td><td class="border border-slate-800 py-0.5 px-1 text-center">&nbsp;</td><td class="border border-slate-800 py-0.5 px-1">&nbsp;</td></tr>';
        
        vRows += '<tr><td class="border border-slate-900 py-0.5 px-1 leading-tight"><span class="font-bold">' + c.nome + '</span><br><span class="text-[6.5px] text-slate-500 uppercase">' + (c.mansione || '') + '</span></td><td class="border border-slate-900 py-0.5 px-1 text-center font-bold text-emerald-700">SI</td><td class="border border-slate-900 py-0.5 px-1 text-center italic">__ / 30</td><td class="border border-slate-900 py-0.5 px-1 text-center">Positivo</td><td class="border border-slate-900 py-0.5 px-1 text-center font-black uppercase text-blue-700">Idoneo</td></tr>';
    });

    const TOTAL_ROWS_REGISTRO = 30;
    const remainingR = Math.max(0, TOTAL_ROWS_REGISTRO - window.currentSessionCorsisti.length);
    for(let i=0; i<remainingR; i++){
        rRows += '<tr><td class="border border-slate-800 py-0.5 px-1">&nbsp;</td><td class="border border-slate-800 py-0.5 px-1">&nbsp;</td><td class="border border-slate-800 py-0.5 px-1">&nbsp;</td><td class="border border-slate-800 py-0.5 px-1">&nbsp;</td><td class="border border-slate-800 py-0.5 px-1">&nbsp;</td><td class="border border-slate-800 py-0.5 px-1">&nbsp;</td><td class="border border-slate-800 py-0.5 px-1">&nbsp;</td></tr>';
    }
    
    const TOTAL_ROWS_VERBALE = 30;
    const remainingV = Math.max(0, TOTAL_ROWS_VERBALE - window.currentSessionCorsisti.length);
    for(let i=0; i<remainingV; i++){
        vRows += '<tr><td class="border border-slate-900 py-0.5 px-1">&nbsp;</td><td class="border border-slate-900 py-0.5 px-1">&nbsp;</td><td class="border border-slate-900 py-0.5 px-1">&nbsp;</td><td class="border border-slate-900 py-0.5 px-1">&nbsp;</td><td class="border border-slate-900 py-0.5 px-1">&nbsp;</td></tr>';
    }

    if(document.getElementById('r-rows')) document.getElementById('r-rows').innerHTML = rRows;
    if(document.getElementById('v-rows')) document.getElementById('v-rows').innerHTML = vRows;
    
    const selectEl = document.getElementById('cfg-select-corsista');
    if(selectEl) {
        const currVal = window.getVal('cfg-select-corsista', 0);
        let opts = "";
        window.currentSessionCorsisti.forEach((c, i) => {
            opts += '<option value="' + i + '">' + c.nome + ' (' + (c.cf||'').slice(0,6) + ')</option>';
        });
        selectEl.innerHTML = opts;
        selectEl.value = currVal; 
    }
}

// ==========================================
// TEST GENERATOR E COLLOQUIO
// ==========================================
window.updateTests = function() {
    const courseId = window.getVal('cfg-corso', 'lav_basso');
    if (window.currentTestCourseId !== courseId || window.currentTestQuestions.length === 0) {
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
    
    const colloquioContainer = document.getElementById('colloquio-container');
    if (colloquioContainer && window.currentTestQuestions.length > 0) {
        let htmlColl = "";
        window.currentTestQuestions.slice(0, 15).forEach((item, idx) => {
            const qNum = (idx + 1) + ".";
            const qText = item.q;
            const correctAns = item.a[item.correct];
            
            const answerHtml = window.correctorEnabled 
                ? '<p class="text-emerald-700 italic text-[7px]">Risposta esatta: ' + correctAns + '</p>' 
                : '<div class="mt-1 border-b border-dotted border-slate-400 h-2.5 w-full"></div><div class="border-b border-dotted border-slate-400 h-2.5 w-full"></div>';

            htmlColl += '<tr class="bg-white">';
            htmlColl += '<td class="border border-slate-300 text-center font-bold align-top p-1">' + qNum + '</td>';
            htmlColl += '<td class="border border-slate-300 align-top p-1"><p class="font-bold text-slate-800 mb-0.5">' + qText + '</p>' + answerHtml + '</td>';
            htmlColl += '<td class="border border-slate-300 text-center text-slate-400 align-middle p-1">[1-10]</td>';
            htmlColl += '<td class="border border-slate-300 p-1">&nbsp;</td>';
            htmlColl += '</tr>';
        });
        colloquioContainer.innerHTML = htmlColl;
    }
}

window.generateTestQuestions = function(courseId) {
    let distribution = [];
    if (courseId === 'lav_basso' || courseId === 'agg_lav') distribution = [{p: window.POOL_GENERALE, c: 15}, {p: window.POOL_BASSO, c: 15}];
    else if (courseId === 'lav_medio') distribution = [{p: window.POOL_GENERALE, c: 10}, {p: window.POOL_BASSO, c: 10}, {p: window.POOL_ALTO, c: 10}];
    else if (courseId === 'lav_alto') distribution = [{p: window.POOL_GENERALE, c: 10}, {p: window.POOL_BASSO, c: 5}, {p: window.POOL_ALTO, c: 15}];
    else if (courseId === 'preposto' || courseId === 'dirigente' || courseId === 'agg_prep' || courseId === 'agg_dir') distribution = [{p: window.POOL_GENERALE, c: 10}, {p: window.POOL_DIRIGENTI, c: 15}, {p: window.POOL_CANTIERI, c: 5}];
    else if (courseId.startsWith('attr_') || courseId === 'agg_pratico_4h') distribution = [{p: window.POOL_GENERALE, c: 10}, {p: window.POOL_BASSO, c: 5}, {p: window.POOL_ATTREZZATURE, c: 15}];
    else if (courseId === 'amb_confinati') distribution = [{p: window.POOL_GENERALE, c: 10}, {p: window.POOL_ALTO, c: 10}, {p: window.POOL_ATTREZZATURE, c: 10}];
    else if (courseId === 'lav_quota') distribution = [{p: window.POOL_GENERALE, c: 10}, {p: window.POOL_ALTO, c: 10}, {p: window.POOL_CANTIERI, c: 10}];
    else if (courseId.includes('primo_soccorso')) distribution = [{p: window.POOL_GENERALE, c: 10}, {p: window.POOL_BASSO, c: 5}, {p: window.POOL_PS, c: 15}];
    else if (courseId.includes('antincendio')) distribution = [{p: window.POOL_GENERALE, c: 10}, {p: window.POOL_BASSO, c: 5}, {p: window.POOL_AI, c: 15}];
    else if (courseId === 'dl_base' || courseId.startsWith('dl_spp') || courseId === 'agg_dl' || courseId === 'agg_dl_spp') distribution = [{p: window.POOL_GENERALE, c: 10}, {p: window.POOL_DIRIGENTI, c: 10}, {p: window.POOL_CANTIERI, c: 10}];
    else distribution = [{p: window.POOL_GENERALE, c: 15}, {p: window.POOL_BASSO, c: 15}];

    let test = [];
    distribution.forEach(d => {
        let shuffled = [...d.p].sort(() => 0.5 - Math.random());
        let available = Math.min(d.c, shuffled.length);
        test = test.concat(shuffled.slice(0, available));
    });
    
    if (test.length < 30) {
        let extra = [...window.POOL_GENERALE, ...window.POOL_BASSO].sort(() => 0.5 - Math.random());
        for (let i=0; i<extra.length && test.length < 30; i++) {
            if (!test.includes(extra[i])) test.push(extra[i]);
        }
    }
    return test.slice(0, 30);
}

// ==========================================
// DB NORMALIZE E SALVATAGGIO CLOUD
// ==========================================
window.normalizeDatabase = function() {
    if(!window.dbCorsisti) window.dbCorsisti = [];
    const sessionCodes = {};
    window.dbCorsisti.forEach(r => {
        const normAzienda = (r.azienda || "").trim().toLowerCase();
        const normCorso = (r.corso || "").trim().toLowerCase();
        const key = normAzienda + "|" + normCorso + "|" + r.data_esame;
        if (!sessionCodes[key] && r.codice && r.codice !== "ND" && r.codice !== "") {
            if (r.codice.match(/\/\d{2}$/)) sessionCodes[key] = r.codice;
            else sessionCodes[key] = r.codice + "/01";
        }
    });
    window.dbCorsisti.forEach(r => {
        const normAzienda = (r.azienda || "").trim().toLowerCase();
        const normCorso = (r.corso || "").trim().toLowerCase();
        const key = normAzienda + "|" + normCorso + "|" + r.data_esame;
        if (sessionCodes[key]) { r.codice = sessionCodes[key]; }
    });
}

window.salvaCorsistaDB = async function() {
    const courseId = window.getVal('cfg-corso', 'lav_basso');
    const nome = window.getVal('cfg-nome').trim();
    if(!nome) return alert("Errore: Inserisci almeno il nome del corsista prima di salvare!");
    
    let certId = window.getVal('cfg-loaded-cert-id');
    if(!certId) {
        const certEl = document.querySelector('.val-cert-id');
        certId = certEl ? certEl.innerText : "ND";
    }

    const c = window.DB_CORSI[courseId];
    
    let arrDocenti = [];
    c.prog.forEach((_, idx) => {
        arrDocenti.push(window.getVal('docente_ud_' + idx, window.getVal('cfg-docente')));
    });

    const record = {
        id_certificato: certId,
        data_esame: window.getVal('cfg-data-esame'), 
        data_inizio: window.getVal('cfg-data-inizio'), 
        codice: window.getVal('cfg-codice'),
        azienda: window.getVal('cfg-azienda'),
        indirizzo_azienda: window.getVal('cfg-azienda-indirizzo'),
        nome: nome,
        cf: window.getVal('cfg-cf'),
        mansione: window.getVal('cfg-mansione'),
        nascita: window.getVal('cfg-nascita'),
        corso: c.t,
        docente: window.getVal('cfg-docente'), 
        docenti_ud: arrDocenti, 
        resp_corso: window.getVal('cfg-resp-corso'),
        resp_progetto: window.getVal('cfg-resp-progetto'),
        modalita: window.getVal('cfg-modalita'),
        ore: c.ore,
        ente: window.getVal('cfg-ente'),
        ente_indirizzo: window.getVal('cfg-ente-indirizzo'),
        ente_contatti: window.getVal('cfg-ente-contatti'),
        calendario: window.getVal('cfg-calendario'),
        ateco: window.getVal('cfg-ateco'),
        sede_corso: window.getVal('cfg-sede-corso'),
        req_docente: window.getVal('cfg-req-docente'),
        luogo_emissione: window.getVal('cfg-luogo-emissione')
    };
    
    const btn = document.getElementById('btn-save-cloud');
    let originalHtml = "Salva su DB";
    if (btn) {
        originalHtml = btn.innerHTML;
        btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Salvataggio...';
    }
    
    if (typeof window.saveCorsistaCloud !== 'function') {
        alert("Errore di configurazione: manca la connessione a Supabase.");
        if (btn) btn.innerHTML = originalHtml;
        return;
    }

    const success = await window.saveCorsistaCloud(record);
    
    if (success) {
        window.dbCorsisti = await window.loadCloudDatabase();
        window.updateDBCounter();
        
        if (btn) {
            btn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i> Salvato nel Cloud!';
            btn.classList.replace('bg-emerald-600', 'bg-teal-500'); 
            if (typeof lucide !== 'undefined') lucide.createIcons();

            setTimeout(() => {
                btn.innerHTML = originalHtml; 
                btn.classList.replace('bg-teal-500', 'bg-emerald-600'); 
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }, 1500);
        } else {
            alert("Salvato nel Cloud!");
        }
    } else {
        alert("Errore durante il salvataggio! Controlla la Console (F12) per i dettagli.");
        if (btn) btn.innerHTML = originalHtml; 
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// ==========================================
// INTERAZIONI FORM E UI
// ==========================================
window.cambioCorso = function() {
    window.pulisciCertIdCaricato();
    window.renderUDInputs();
    const calEl = document.getElementById('cfg-calendario');
    if (calEl) calEl.value = ""; 
    window.AppState['cfg-calendario'] = "";
    window.updateAll();
}

window.cambiaDataInizio = function() {
    const calEl = document.getElementById('cfg-calendario');
    if (calEl) calEl.value = ""; 
    window.AppState['cfg-calendario'] = "";
    window.updateAll();
}

window.forzaAggiornamento = function() {
    window.updateAll();
    const btn = document.getElementById('btn-aggiorna');
    if (btn) {
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i data-lucide="check" class="w-4 h-4 mx-auto"></i><span class="text-[8px] font-bold mt-1 block">Fatto!</span>';
        btn.classList.replace('bg-indigo-600', 'bg-teal-500'); 
        if (typeof lucide !== 'undefined') lucide.createIcons();
        setTimeout(() => {
            btn.innerHTML = originalHtml; 
            btn.classList.replace('bg-teal-500', 'bg-indigo-600'); 
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }, 1500);
    }
}

window.caricaLogoFile = function(event) {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => { 
        if(document.getElementById('cfg-logo')) document.getElementById('cfg-logo').value = e.target.result; 
        window.AppState['cfg-logo'] = e.target.result;
        window.updateAll(); 
    };
    reader.readAsDataURL(file);
}

window.toggleCorrector = function() { 
    window.correctorEnabled = !window.correctorEnabled; 
    window.updateTests(); 
    const btn = document.getElementById('btn-corrector');
    if (btn) {
        if (window.correctorEnabled) {
            btn.innerHTML = '<i data-lucide="check-square" class="w-4 h-4"></i> Disattiva Correttore';
            btn.classList.replace('bg-emerald-500', 'bg-amber-400');
        } else {
            btn.innerHTML = '<i data-lucide="check-square" class="w-4 h-4"></i> Attiva Correttore Integrato';
            btn.classList.replace('bg-amber-400', 'bg-emerald-500');
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// ==========================================
// SESSIONE E CORSISTA MANAGEMENT
// ==========================================
window.pulisciCertIdCaricato = function() {
    ['cfg-loaded-cert-id', 'cfg-nome', 'cfg-cf', 'cfg-mansione', 'cfg-nascita'].forEach(id => {
        if(document.getElementById(id)) document.getElementById(id).value = "";
        window.AppState[id] = "";
    });
    window.currentSessionCorsisti = [];
    window.updateAll();
}

window.cambiaCorsistaSessione = function() {
    const selectEl = document.getElementById('cfg-select-corsista');
    if(!selectEl) return;
    const idx = selectEl.value;
    window.AppState['cfg-select-corsista'] = idx;
    
    if (!window.currentSessionCorsisti || window.currentSessionCorsisti.length === 0) return;
    const c = window.currentSessionCorsisti[idx];
    if(c) {
        const updateField = (id, val) => {
            if(document.getElementById(id)) document.getElementById(id).value = val;
            window.AppState[id] = val;
        };
        
        updateField('cfg-nome', c.nome || "");
        updateField('cfg-mansione', c.mansione || "");
        updateField('cfg-nascita', c.nascita || "");
        updateField('cfg-cf', c.cf || "");
        updateField('cfg-loaded-cert-id', c.id_certificato || "");
        
        document.querySelectorAll('[id^="docente_ud_"]').forEach(el => {
            el.value = "";
            window.AppState[el.id] = "";
        });
        // ==========================================
// LOGICA CRM: MODULO AZIENDE
// ==========================================
window.aziendeList = [];

// 1. Carica e disegna la tabella
window.loadAziendeTable = async function() {
    const tbody = document.getElementById('tabella-aziende');
    if(!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="4" class="p-6 text-center text-slate-400 italic"><i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto mb-2"></i> Caricamento dati...</td></tr>';
    if(typeof lucide !== 'undefined') lucide.createIcons();

    window.aziendeList = await window.getAziende();

    if (window.aziendeList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="p-6 text-center text-slate-500 italic">Nessuna azienda registrata.</td></tr>';
        return;
    }

    let html = '';
    window.aziendeList.forEach(az => {
        html += `
            <tr class="hover:bg-blue-50 transition-colors">
                <td class="p-3 border-b font-bold text-slate-800">${az.ragione_sociale}</td>
                <td class="p-3 border-b font-mono text-[10px] text-slate-600">${az.piva_cf || '-'}</td>
                <td class="p-3 border-b font-mono text-[10px] text-slate-500">${az.ateco || '-'}</td>
                <td class="p-3 border-b text-center whitespace-nowrap">
                    <button onclick="window.modificaAzienda('${az.id}')" class="text-blue-600 hover:bg-blue-200 bg-blue-100 p-1.5 rounded transition shadow-sm" title="Modifica"><i data-lucide="edit" class="w-4 h-4"></i></button>
                    <button onclick="window.eliminaAzienda('${az.id}')" class="text-red-600 hover:bg-red-200 bg-red-100 p-1.5 rounded transition shadow-sm ml-1" title="Elimina"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
    if(typeof lucide !== 'undefined') lucide.createIcons();
};

// 2. Salva dal Form al Database
window.salvaAziendaDB = async function() {
    const id = document.getElementById('az-id').value;
    const record = {
        ragione_sociale: document.getElementById('az-ragione-sociale').value.trim(),
        piva_cf: document.getElementById('az-piva').value.trim(),
        indirizzo: document.getElementById('az-indirizzo').value.trim(),
        ateco: document.getElementById('az-ateco').value.trim(),
        referente: document.getElementById('az-referente').value.trim()
    };
    
    // Se il campo nascosto ID è pieno, stiamo aggiornando un record esistente
    if (id) record.id = id;

    const result = await window.saveAzienda(record);
    if (result) {
        window.resetFormAzienda();
        await window.loadAziendeTable();
    } else {
        alert("Errore nel salvataggio dell'azienda. Verifica la connessione.");
    }
};

// 3. Popola il form per la Modifica
window.modificaAzienda = function(id) {
    const az = window.aziendeList.find(a => a.id === id);
    if(!az) return;
    document.getElementById('az-id').value = az.id;
    document.getElementById('az-ragione-sociale').value = az.ragione_sociale;
    document.getElementById('az-piva').value = az.piva_cf;
    document.getElementById('az-indirizzo').value = az.indirizzo || "";
    document.getElementById('az-ateco').value = az.ateco || "";
    document.getElementById('az-referente').value = az.referente || "";
};

// 4. Elimina
window.eliminaAzienda = async function(id) {
    if(confirm("Sei sicuro di voler eliminare questa azienda? \n\nATTENZIONE: Tutti i progetti e le iscrizioni collegati a questa azienda verranno eliminati (Cancellazione a Cascata).")) {
        const success = await window.deleteAzienda(id);
        if(success) {
            await window.loadAziendeTable();
        } else {
            alert("Errore durante l'eliminazione.");
        }
    }
};

// 5. Reset Form
window.resetFormAzienda = function() {
    document.getElementById('az-id').value = "";
    document.getElementById('form-azienda').reset();
};

// 6. Ricerca in tempo reale
window.filtraAziende = function() {
    const filter = document.getElementById('search-aziende').value.toLowerCase();
    const rows = document.getElementById('tabella-aziende').getElementsByTagName('tr');
    for (let i = 0; i < rows.length; i++) {
        if(rows[i].cells.length === 1) continue; 
        const text = rows[i].innerText.toLowerCase();
        rows[i].style.display = text.includes(filter) ? "" : "none";
    }
};
        
        if (c.docenti_ud && c.docenti_ud.length > 0) {
            c.docenti_ud.forEach((doc, i) => {
                const docId = 'docente_ud_' + i;
                if (document.getElementById(docId)) document.getElementById(docId).value = doc;
                window.AppState[docId] = doc;
            });
        }
        window.updateAll();
    }
}

window.caricaSessioneByCodice = function(codice) {
    const sessionCorsisti = window.dbCorsisti.filter(r => r.codice === codice);
    if (sessionCorsisti.length === 0) return alert("Errore nel caricamento della sessione.");

    const cRef = sessionCorsisti[0];
    
    window.loadModule('config').then(() => {
        let courseKey = "lav_basso"; 
        for (const [key, value] of Object.entries(window.DB_CORSI)) { if (value.t === cRef.corso) { courseKey = key; break; } }
        
        if(document.getElementById('cfg-corso')) document.getElementById('cfg-corso').value = courseKey;
        window.AppState['cfg-corso'] = courseKey;
        
        window.renderUDInputs();
        
        const applyField = (id, val) => {
            if(document.getElementById(id)) document.getElementById(id).value = val;
            window.AppState[id] = val;
        };

        applyField('cfg-azienda', cRef.azienda || "");
        applyField('cfg-azienda-indirizzo', cRef.indirizzo_azienda || "");
        applyField('cfg-ateco', cRef.ateco || "");
        applyField('cfg-sede-corso', cRef.sede_corso || "");
        applyField('cfg-modalita', cRef.modalita || "In Presenza Fisica");
        applyField('cfg-calendario', cRef.calendario || "");
        applyField('cfg-data-esame', window.formatDataToISODate(cRef.data_esame));
        applyField('cfg-data-inizio', window.formatDataToISODate(cRef.data_inizio));
        
        window.currentSessionCorsisti = sessionCorsisti;
        window.chiudiSessioni();
        window.updateAll();
        alert("Sessione [" + codice + "] caricata con successo (" + sessionCorsisti.length + " Corsisti).");
    });
}

window.caricaCorsista = function(idx) {
    const r = window.dbCorsisti[idx];
    
    window.loadModule('config').then(() => {
        let courseKey = "lav_basso"; 
        for (const [key, value] of Object.entries(window.DB_CORSI)) { if (value.t === r.corso) { courseKey = key; break; } }
        
        if(document.getElementById('cfg-corso')) document.getElementById('cfg-corso').value = courseKey;
        window.AppState['cfg-corso'] = courseKey;
        
        window.renderUDInputs();

        const applyField = (id, val) => {
            if(document.getElementById(id)) document.getElementById(id).value = val;
            window.AppState[id] = val;
        };

        applyField('cfg-azienda', r.azienda || "");
        applyField('cfg-azienda-indirizzo', r.indirizzo_azienda || "");
        applyField('cfg-ateco', r.ateco || "");
        applyField('cfg-nome', r.nome || "");
        applyField('cfg-cf', r.cf || "");
        applyField('cfg-mansione', r.mansione || "");
        applyField('cfg-nascita', r.nascita || "");
        applyField('cfg-loaded-cert-id', r.id_certificato || "");
        applyField('cfg-sede-corso', r.sede_corso || "");
        applyField('cfg-data-esame', window.formatDataToISODate(r.data_esame));
        applyField('cfg-data-inizio', window.formatDataToISODate(r.data_inizio));

        if (r.docenti_ud && r.docenti_ud.length > 0) {
            r.docenti_ud.forEach((docName, i) => {
                const docId = 'docente_ud_' + i;
                if (document.getElementById(docId)) document.getElementById(docId).value = docName;
                window.AppState[docId] = docName;
            });
        }
        
        window.chiudiArchivio(); 
        window.updateAll();
    });
}

// ==========================================
// FUNZIONI DI STAMPA E MULTI-STAMPA
// ==========================================
window.stampaSezioneAttuale = function() {
    const isMulti = window.currentSessionCorsisti && window.currentSessionCorsisti.length > 0;
    const activeTabBtn = document.querySelector('.btn-tab.active');
    const activeTabId = activeTabBtn ? activeTabBtn.id.replace('nav-', '') : 'registro';

    const individualTabs = ['esame', 'attestato'];

    if (!isMulti || !individualTabs.includes(activeTabId)) {
        let printArea = document.getElementById('print-area-temp');
        printArea.innerHTML = '';
        
        document.querySelectorAll('#app-content .doc-page').forEach(original => {
            const clone = original.cloneNode(true);
            clone.id = "";
            clone.classList.remove('hidden');
            clone.classList.add('print-show', 'temp-page');
            if(original.classList.contains('landscape')) clone.classList.add('landscape-force');
            else clone.classList.add('portrait');
            printArea.appendChild(clone);
        });

        document.body.classList.add('is-printing-temp');
        setTimeout(() => { 
            window.print(); 
            document.body.classList.remove('is-printing-temp');
            printArea.innerHTML = ''; 
        }, 800);
        return;
    }
    window.preparaEStampaMassiva(activeTabId);
}

window.stampaSoloAttestato = function() {
    const isMulti = window.currentSessionCorsisti && window.currentSessionCorsisti.length > 0;
    if (!isMulti) {
        let printArea = document.getElementById('print-area-temp');
        printArea.innerHTML = '';
        
        document.querySelectorAll('#app-content .doc-page').forEach(original => {
            const clone = original.cloneNode(true);
            clone.id = "";
            clone.classList.remove('hidden');
            clone.classList.add('print-show', 'temp-page', 'portrait');
            printArea.appendChild(clone);
        });

        document.body.classList.add('is-printing-temp');
        setTimeout(() => { 
            window.print(); 
            document.body.classList.remove('is-printing-temp');
            printArea.innerHTML = ''; 
        }, 800);
        return;
    }
    window.preparaEStampaMassiva('attestato');
}

window.preparaEStampaMassiva = function(tabId) {
    const selectEl = document.getElementById('cfg-select-corsista');
    const currentIndex = selectEl ? selectEl.value : 0;
    
    let printArea = document.getElementById('print-area-temp');
    printArea.innerHTML = '';

    window.currentSessionCorsisti.forEach((c, idx) => {
        if(selectEl) selectEl.value = idx;
        window.AppState['cfg-select-corsista'] = idx;
        window.cambiaCorsistaSessione(); 
        
        document.querySelectorAll('#app-content .doc-page').forEach(original => {
            const clone = original.cloneNode(true);
            clone.id = "";
            clone.classList.remove('hidden');
            clone.classList.add('print-show', 'temp-page');
            if(original.classList.contains('landscape')) clone.classList.add('landscape-force');
            else clone.classList.add('portrait');
            printArea.appendChild(clone);
        });
    });

    document.body.classList.add('is-printing-temp');
    setTimeout(() => { 
        window.print(); 
        document.body.classList.remove('is-printing-temp');
        printArea.innerHTML = ''; 
        
        if(selectEl) selectEl.value = currentIndex;
        window.AppState['cfg-select-corsista'] = currentIndex;
        window.cambiaCorsistaSessione();
    }, 1000);
}

// ==========================================
// ESPORTAZIONE E IMPORTAZIONE (JSON/CSV)
// ==========================================
window.esportaJSON = function() {
    if(!window.dbCorsisti || window.dbCorsisti.length === 0) return alert("Il database è vuoto.");
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(window.dbCorsisti, null, 2));
    const a = document.createElement('a'); 
    a.href = dataStr; 
    a.download = "SM_Cloud_Backup_" + new Date().toISOString().slice(0,10) + ".json"; 
    document.body.appendChild(a); 
    a.click(); 
    document.body.removeChild(a); 
}

window.esportaUniversaleCSV = function() {
    if(!window.dbCorsisti || window.dbCorsisti.length === 0) return alert("Il database è vuoto.");
    let csvContent = "\uFEFFID_CERTIFICATO;DATA_ESAME_EMISSIONE;DATA_INIZIO;CODICE_INTERNO;CALENDARIO;AZIENDA_COMMITTENTE;INDIRIZZO_AZIENDA;CODICE_ATECO;COGNOME_E_NOME;LUOGO_DATA_NASCITA;CODICE_FISCALE;MANSIONE;CORSO_EROGATO;MODALITA_EROGAZIONE;MONTE_ORE_DIDATTICA;SOGGETTO_FORMATORE;INDIRIZZO_ENTE;CONTATTI_ENTE;RESP_CORSO;DOCENTE_PRINCIPALE;DOCENTI_UD;RESP_PROGETTO;SEDE_SVOLGIMENTO;QUALIFICA_DOCENTE;LUOGO_EMISSIONE\n";
    
    window.dbCorsisti.forEach(row => {
        let docentiUniti = (row.docenti_ud || []).join(' | ');
        let r = [
            row.id_certificato, window.formatDataToItalian(row.data_esame), window.formatDataToItalian(row.data_inizio), row.codice, row.calendario ? row.calendario.replace(/\n/g, '|') : '', 
            row.azienda, row.indirizzo_azienda, row.ateco, row.nome, row.nascita, row.cf, row.mansione, row.corso, row.modalita, 
            row.ore, row.ente, row.ente_indirizzo, row.ente_contatti, row.resp_corso, row.docente, docentiUniti, row.resp_progetto, 
            row.sede_corso, row.req_docente, row.luogo_emissione
        ].map(testo => String(testo || "").replace(/;/g, ',').replace(/\n/g, ' '));
        csvContent += r.join(";") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); 
    const a = document.createElement('a'); 
    a.href = url; 
    a.download = "SM_Cloud_CSV_" + new Date().getTime() + ".csv"; 
    document.body.appendChild(a); 
    a.click(); 
    document.body.removeChild(a); 
    URL.revokeObjectURL(url);
}

window.importaJSON = async function(event) {
    const file = event.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if(Array.isArray(imported)) {
                alert("L'importazione nel Cloud inizierà in background. Attendere.");
                for (let record of imported) {
                    if (typeof window.saveCorsistaCloud === 'function') await window.saveCorsistaCloud(record);
                }
                if (typeof window.loadCloudDatabase === 'function') window.dbCorsisti = await window.loadCloudDatabase();
                window.updateDBCounter();
                alert("Importazione completata con successo!");
            }
        } catch(err) { alert("Errore lettura JSON."); }
        event.target.value = '';
    };
    reader.readAsText(file);
}

window.gestisciImportazioneCSV = function(event) {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async function(e) {
        const rows = e.target.result.replace(/^\uFEFF/, '').split(/\r?\n/); 
        if (rows.length < 2) return;
        const headerRow = rows[0].split(';');
        const colMap = {};
        headerRow.forEach((col, i) => colMap[col.trim().toUpperCase()] = i);
        
        alert("Importazione CSV nel Cloud iniziata.");
        for (let i = 1; i < rows.length; i++) {
            const rowStr = rows[i].trim(); if (!rowStr) continue;
            let cols = rowStr.split(';');
            const record = { 
                id_certificato: cols[colMap["ID_CERTIFICATO"]], 
                data_esame: window.formatDataToISODate(cols[colMap["DATA_ESAME_EMISSIONE"]]), 
                data_inizio: window.formatDataToISODate(cols[colMap["DATA_INIZIO"]]), 
                codice: cols[colMap["CODICE_INTERNO"]], 
                calendario: cols[colMap["CALENDARIO"]] ? cols[colMap["CALENDARIO"]].replace(/\|/g, '\n') : '', 
                azienda: cols[colMap["AZIENDA_COMMITTENTE"]], 
                indirizzo_azienda: cols[colMap["INDIRIZZO_AZIENDA"]],
                ateco: cols[colMap["CODICE_ATECO"]], 
                nome: cols[colMap["COGNOME_E_NOME"]], 
                nascita: cols[colMap["LUOGO_DATA_NASCITA"]], 
                cf: cols[colMap["CODICE_FISCALE"]], 
                mansione: cols[colMap["MANSIONE"]], 
                corso: cols[colMap["CORSO_EROGATO"]], 
                modalita: cols[colMap["MODALITA_EROGAZIONE"]], 
                ore: parseInt(cols[colMap["MONTE_ORE_DIDATTICA"]]) || 0, 
                ente: cols[colMap["SOGGETTO_FORMATORE"]], 
                ente_indirizzo: cols[colMap["INDIRIZZO_ENTE"]], 
                ente_contatti: cols[colMap["CONTATTI_ENTE"]], 
                resp_corso: cols[colMap["RESP_CORSO"]], 
                docente: cols[colMap["DOCENTE_PRINCIPALE"]] || "Docente Principale", 
                docenti_ud: cols[colMap["DOCENTI_UD"]] ? cols[colMap["DOCENTI_UD"]].split(' | ') : [],
                resp_progetto: cols[colMap["RESP_PROGETTO"]] || cols[colMap["RESP_CORSO"]] || "",
                sede_corso: cols[colMap["SEDE_SVOLGIMENTO"]],
                req_docente: cols[colMap["QUALIFICA_DOCENTE"]] || "Formatore Qualificato",
                luogo_emissione: cols[colMap["LUOGO_EMISSIONE"]] || "Avellino"
            };
            if(record.id_certificato && typeof window.saveCorsistaCloud === 'function') {
                await window.saveCorsistaCloud(record);
            }
        }
        if (typeof window.loadCloudDatabase === 'function') window.dbCorsisti = await window.loadCloudDatabase();
        window.updateDBCounter();
        alert("Importazione completata!");
        event.target.value = '';
    };
    reader.readAsText(file, 'utf-8');
}
window.attivaImportazioneCSV = function() { document.getElementById('csv-file-input').click(); }

// ==========================================
// MODALI E ADMIN DASHBOARD
// ==========================================
window.renderAdminDashboard = function() {
    const container = document.getElementById('admin-content');
    if (!container) return;
    
    if (!window.dbCorsisti || window.dbCorsisti.length === 0) {
        container.innerHTML = '<p class="text-center text-slate-500 py-10">Nessun dato presente nel database Cloud.</p>';
        return;
    }

    let aziendeMap = {};
    window.dbCorsisti.forEach(c => {
        let azName = c.azienda || "Azienda Non Specificata";
        let corsoName = c.corso || "Corso Non Specificato";
        if (!aziendeMap[azName]) aziendeMap[azName] = {};
        if (!aziendeMap[azName][corsoName]) aziendeMap[azName][corsoName] = [];
        aziendeMap[azName][corsoName].push(c);
    });

    let html = '<div class="grid grid-cols-2 gap-4 mb-6"><div class="bg-indigo-50 border border-indigo-200 p-4 rounded-xl shadow-sm"><h4 class="text-xs text-indigo-600 font-bold uppercase mb-1">Aziende Gestite</h4><p class="text-3xl font-black text-indigo-900">' + Object.keys(aziendeMap).length + '</p></div><div class="bg-emerald-50 border border-emerald-200 p-4 rounded-xl shadow-sm"><h4 class="text-xs text-emerald-600 font-bold uppercase mb-1">Corsisti Formati</h4><p class="text-3xl font-black text-emerald-900">' + window.dbCorsisti.length + '</p></div></div><div class="space-y-6 pb-10">';
    
    for (let az in aziendeMap) {
        html += '<div class="border border-slate-300 rounded-lg shadow-sm bg-white overflow-hidden break-inside-avoid"><div class="bg-slate-800 text-white p-3 font-bold text-sm uppercase flex items-center gap-2"><i data-lucide="building" class="w-4 h-4"></i> ' + az + '</div><div class="p-4 bg-slate-50 space-y-4">';
        for (let corso in aziendeMap[az]) {
            let corsisti = aziendeMap[az][corso];
            html += '<div class="border border-slate-200 bg-white rounded shadow-sm overflow-hidden"><div class="bg-blue-100 p-2 border-b border-blue-200 font-bold text-blue-900 text-[11px] flex justify-between items-center uppercase"><span>' + corso + '</span><span class="bg-blue-600 text-white px-2 py-0.5 rounded-full text-[9px]">' + corsisti.length + ' Allievi</span></div><table class="w-full text-[10px] text-left"><thead class="bg-slate-50 text-slate-500 border-b border-slate-200"><tr><th class="p-2">Nominativo</th><th class="p-2">C.F.</th><th class="p-2 text-center">ID Certificato</th></tr></thead><tbody>';
            corsisti.forEach(c => {
                html += '<tr class="border-b border-slate-100 last:border-0 hover:bg-slate-50"><td class="p-2 font-bold text-slate-800">' + c.nome + '</td><td class="p-2 font-mono text-slate-500 uppercase">' + c.cf + '</td><td class="p-2 text-center font-mono text-[9px] bg-slate-50">' + c.id_certificato + '</td></tr>';
            });
            html += '</tbody></table></div>';
        }
        html += '</div></div>';
    }
    html += '</div>';
    container.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.mostraArchivio = function() {
    const tbody = document.getElementById('archivio-rows');
    if (!window.dbCorsisti || window.dbCorsisti.length === 0) { 
        tbody.innerHTML = '<tr><td colspan="7" class="p-6 text-center text-slate-500 italic">Nessun record presente in archivio.</td></tr>'; 
    } else {
        const reverseDB = [...window.dbCorsisti].sort((a,b) => b.data_esame.localeCompare(a.data_esame));
        let ht = "";
        reverseDB.forEach((r, reverseIdx) => {
            const originalIdx = window.dbCorsisti.indexOf(r);
            ht += '<tr class="hover:bg-blue-50 transition-colors border-b border-slate-100">';
            ht += '<td class="p-3 font-mono text-[10px] text-slate-500">' + r.id_certificato + '</td>';
            ht += '<td class="p-3 font-bold text-slate-800">' + r.nome + '</td>';
            ht += '<td class="p-3 font-mono text-[10px] text-slate-600">' + r.cf + '</td>';
            ht += '<td class="p-3 text-[10px] text-slate-600">' + (r.azienda || '-') + '</td>';
            ht += '<td class="p-3 text-xs truncate max-w-[200px]" title="' + r.corso + '">' + r.corso + '</td>';
            ht += '<td class="p-3 text-[10px] text-slate-500">' + window.formatDataToItalian(r.data_esame) + '</td>';
            ht += '<td class="p-3 text-center whitespace-nowrap"><button onclick="window.caricaCorsista(' + originalIdx + ')" class="bg-blue-600 text-white px-3 py-1.5 rounded text-[10px] font-bold hover:bg-blue-500 shadow">Carica</button><button onclick="window.eliminaCorsista(\'' + r.id_certificato + '\')" class="bg-red-100 text-red-600 px-3 py-1.5 rounded text-[10px] font-bold hover:bg-red-200 ml-1">X</button></td>';
            ht += '</tr>';
        });
        tbody.innerHTML = ht;
    }
    document.getElementById('archivio-modal').classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.chiudiArchivio = function() { document.getElementById('archivio-modal').classList.add('hidden'); }

window.toggleMaximizeArchivio = function() {
    const box = document.getElementById('archivio-modal-box'); const icon = document.getElementById('icon-maximize');
    box.classList.toggle('max-w-5xl'); box.classList.toggle('max-h-[90vh]'); box.classList.toggle('w-full'); box.classList.toggle('h-full'); box.classList.toggle('rounded-xl');
    if (box.classList.contains('h-full')) { icon.setAttribute('data-lucide', 'minimize'); } else { icon.setAttribute('data-lucide', 'maximize'); }
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.filtraArchivio = function() {
    const filter = document.getElementById('search-archivio')?.value.toLowerCase() || "";
    const tr = document.getElementById('archivio-rows').getElementsByTagName('tr');
    for (let i = 0; i < tr.length; i++) {
        if(tr[i].cells.length === 1) continue; 
        tr[i].style.display = tr[i].innerText.toLowerCase().includes(filter) ? "" : "none";
    }
}

window.eliminaCorsista = async function(id_certificato) {
    if(confirm("Sei sicuro di voler eliminare questo record in modo permanente dal Cloud? L'operazione è irreversibile.")) {
        if (typeof window.deleteCorsistaCloud === 'function') {
            await window.deleteCorsistaCloud(id_certificato);
            window.dbCorsisti = await window.loadCloudDatabase();
            window.updateDBCounter(); 
            window.mostraArchivio();
        }
    }
}

window.mostraSessioni = function() {
    if (!window.dbCorsisti) return;
    const sessioni = {};
    window.dbCorsisti.forEach(r => {
        const key = r.codice;
        if (!sessioni[key]) {
            sessioni[key] = {
                codice: r.codice, corso: r.corso, data_inizio: window.formatDataToItalian(r.data_inizio) || "---",
                data_esame: window.formatDataToItalian(r.data_esame) || "---", data_sort: r.data_esame || "0000-00-00", 
                azienda: r.azienda || "Nessuna Azienda", count: 0
            };
        }
        sessioni[key].count++;
    });

    const tbody = document.getElementById('sessioni-rows');
    const arrSessioni = Object.values(sessioni).sort((a,b) => b.data_sort.localeCompare(a.data_sort));
    
    if(arrSessioni.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center italic text-slate-500">Nessuna sessione trovata.</td></tr>';
    } else {
        let html = "";
        arrSessioni.forEach(s => {
            html += '<tr class="hover:bg-blue-50 border-b"><td class="p-3 font-mono font-bold text-slate-700">' + s.codice + '</td><td class="p-3 font-semibold text-blue-800">' + s.corso + '<br><span class="text-[9px] text-slate-500 font-normal">' + s.azienda + '</span></td><td class="p-3 text-[10px] text-center">' + s.data_inizio + '</td><td class="p-3 text-[10px] font-bold text-center">' + s.data_esame + '</td><td class="p-3 text-center"><span class="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">' + s.count + '</span></td><td class="p-3 text-center"><button onclick="window.caricaSessioneByCodice(\'' + s.codice + '\')" class="bg-blue-600 text-white px-3 py-1.5 rounded text-[10px] font-bold shadow"><i data-lucide="folder-open" class="w-3 h-3 inline"></i> Carica</button></td></tr>';
        });
        tbody.innerHTML = html;
    }
    document.getElementById('sessioni-modal').classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.chiudiSessioni = function() { document.getElementById('sessioni-modal').classList.add('hidden'); }

window.filtraSessioni = function() {
    const filter = document.getElementById('search-sessioni')?.value.toLowerCase() || "";
    const tr = document.getElementById('sessioni-rows').getElementsByTagName('tr');
    for (let i = 0; i < tr.length; i++) {
        if(tr[i].cells.length === 1) continue; 
        tr[i].style.display = tr[i].innerText.toLowerCase().includes(filter) ? "" : "none";
    }
}
// ==========================================
// LOGICA CRM: DOCENTI E CORSISTI
// ==========================================
window.docentiList = [];
window.corsistiList = [];

// --- GESTIONE DOCENTI ---
window.loadDocentiTable = async function() {
    const tbody = document.getElementById('tabella-docenti');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" class="p-6 text-center text-slate-400 italic"><i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto mb-2"></i> Caricamento...</td></tr>';
    if(typeof lucide !== 'undefined') lucide.createIcons();

    window.docentiList = await window.getDocenti();

    if (window.docentiList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="p-6 text-center text-slate-500 italic">Nessun docente registrato.</td></tr>';
        return;
    }

    let html = '';
    window.docentiList.forEach(doc => {
        html += `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="p-3 border-b font-bold text-slate-800">${doc.nome_cognome}</td>
                <td class="p-3 border-b font-mono text-[10px] text-slate-600">${doc.cf}</td>
                <td class="p-3 border-b text-[10px] text-slate-500 truncate max-w-[150px]" title="${doc.qualifica}">${doc.qualifica}</td>
                <td class="p-3 border-b text-center whitespace-nowrap">
                    <button onclick="window.modificaDocente('${doc.id}')" class="text-blue-600 hover:bg-blue-200 bg-blue-100 p-1.5 rounded transition shadow-sm"><i data-lucide="edit" class="w-4 h-4"></i></button>
                    <button onclick="window.eliminaDocente('${doc.id}')" class="text-red-600 hover:bg-red-200 bg-red-100 p-1.5 rounded transition shadow-sm ml-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
    if(typeof lucide !== 'undefined') lucide.createIcons();
};

window.salvaDocenteDB = async function() {
    const id = document.getElementById('doc-id').value;
    const record = {
        nome_cognome: document.getElementById('doc-nome').value.trim(),
        cf: document.getElementById('doc-cf').value.trim().toUpperCase(),
        qualifica: document.getElementById('doc-qualifica').value,
        email: document.getElementById('doc-email').value.trim(),
        telefono: document.getElementById('doc-telefono').value.trim()
    };
    if (id) record.id = id;

    if (await window.saveDocente(record)) {
        window.resetFormDocente();
        await window.loadDocentiTable();
    } else alert("Errore nel salvataggio del docente.");
};

window.modificaDocente = function(id) {
    const doc = window.docentiList.find(d => d.id === id);
    if(!doc) return;
    document.getElementById('doc-id').value = doc.id;
    document.getElementById('doc-nome').value = doc.nome_cognome;
    document.getElementById('doc-cf').value = doc.cf;
    document.getElementById('doc-qualifica').value = doc.qualifica;
    document.getElementById('doc-email').value = doc.email || "";
    document.getElementById('doc-telefono').value = doc.telefono || "";
};

window.eliminaDocente = async function(id) {
    if(confirm("Sicuro di voler eliminare questo docente?")) {
        if(await window.deleteDocente(id)) await window.loadDocentiTable();
    }
};

window.resetFormDocente = function() {
    document.getElementById('doc-id').value = "";
    document.getElementById('form-docente').reset();
};

window.filtraDocenti = function() {
    const filter = document.getElementById('search-docenti').value.toLowerCase();
    const rows = document.getElementById('tabella-docenti').getElementsByTagName('tr');
    for (let i = 0; i < rows.length; i++) {
        if(rows[i].cells.length === 1) continue; 
        rows[i].style.display = rows[i].innerText.toLowerCase().includes(filter) ? "" : "none";
    }
};

// --- GESTIONE CORSISTI ---
window.loadCorsistiTable = async function() {
    const tbody = document.getElementById('tabella-corsisti');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" class="p-6 text-center text-slate-400 italic"><i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto mb-2"></i> Caricamento...</td></tr>';
    if(typeof lucide !== 'undefined') lucide.createIcons();

    // Carica Corsisti e popola la select delle Aziende
    window.corsistiList = await window.getCorsisti();
    window.aziendeList = await window.getAziende(); // Serve per popolare la dropdown

    const selectAzienda = document.getElementById('cor-azienda');
    if (selectAzienda) {
        let optHtml = '<option value="">-- Nessuna Azienda / Privato --</option>';
        window.aziendeList.forEach(az => {
            optHtml += `<option value="${az.id}">${az.ragione_sociale}</option>`;
        });
        selectAzienda.innerHTML = optHtml;
    }

    if (window.corsistiList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="p-6 text-center text-slate-500 italic">Nessun corsista registrato.</td></tr>';
        return;
    }

    let html = '';
    window.corsistiList.forEach(cor => {
        // Estrai il nome dell'azienda dal JSON associato (grazie al Join di Supabase)
        const nomeAzienda = cor.aziende ? cor.aziende.ragione_sociale : '<span class="text-slate-400">Privato</span>';
        
        html += `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="p-3 border-b font-bold text-slate-800">${cor.nome_cognome}</td>
                <td class="p-3 border-b font-mono text-[10px] text-slate-600">${cor.cf}</td>
                <td class="p-3 border-b text-xs text-blue-800 font-semibold">${nomeAzienda}</td>
                <td class="p-3 border-b text-center whitespace-nowrap">
                    <button onclick="window.modificaCorsista('${cor.id}')" class="text-blue-600 hover:bg-blue-200 bg-blue-100 p-1.5 rounded transition shadow-sm"><i data-lucide="edit" class="w-4 h-4"></i></button>
                    <button onclick="window.eliminaCorsistaData('${cor.id}')" class="text-red-600 hover:bg-red-200 bg-red-100 p-1.5 rounded transition shadow-sm ml-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
    if(typeof lucide !== 'undefined') lucide.createIcons();
};

window.salvaCorsistaDB = async function() {
    const id = document.getElementById('cor-id').value;
    const aziendaId = document.getElementById('cor-azienda').value;
    
    const record = {
        nome_cognome: document.getElementById('cor-nome').value.trim(),
        cf: document.getElementById('cor-cf').value.trim().toUpperCase(),
        luogo_data_nascita: document.getElementById('cor-nascita').value.trim(),
        azienda_id: aziendaId ? aziendaId : null // Se vuoto salva come null (Privato)
    };
    if (id) record.id = id;

    if (await window.saveCorsistaData(record)) {
        window.resetFormCorsista();
        await window.loadCorsistiTable();
    } else alert("Errore nel salvataggio. Assicurati che il C.F. non sia già registrato.");
};

window.modificaCorsista = function(id) {
    const cor = window.corsistiList.find(c => c.id === id);
    if(!cor) return;
    document.getElementById('cor-id').value = cor.id;
    document.getElementById('cor-nome').value = cor.nome_cognome;
    document.getElementById('cor-cf').value = cor.cf;
    document.getElementById('cor-nascita').value = cor.luogo_data_nascita;
    document.getElementById('cor-azienda').value = cor.azienda_id || "";
};

window.eliminaCorsistaData = async function(id) {
    if(confirm("Sicuro di voler eliminare questo corsista? I suoi attestati verranno persi.")) {
        if(await window.deleteCorsistaData(id)) await window.loadCorsistiTable();
    }
};

window.resetFormCorsista = function() {
    document.getElementById('cor-id').value = "";
    document.getElementById('form-corsista').reset();
};

window.filtraCorsisti = function() {
    const filter = document.getElementById('search-corsisti').value.toLowerCase();
    const rows = document.getElementById('tabella-corsisti').getElementsByTagName('tr');
    for (let i = 0; i < rows.length; i++) {
        if(rows[i].cells.length === 1) continue; 
        rows[i].style.display = rows[i].innerText.toLowerCase().includes(filter) ? "" : "none";
    }
};
