// js/utils.js

// ==========================================
// VARIABILI GLOBALI
// ==========================================
window.currentTestCourseId = "";
window.currentTestQuestions = [];
window.correctorEnabled = false;
window.currentSessionCorsisti = [];

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
    const corsoEl = document.getElementById('cfg-corso');
    if (!corsoEl) return;
    
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

window.updateAll = function() {
    const corsoEl = document.getElementById('cfg-corso');
    if (!corsoEl) return; 
    
    const courseId = corsoEl.value;
    const c = window.DB_CORSI[courseId];
    
    if(!c || !c.prog) return;

    if(document.getElementById('ud-docenti-container') && !document.getElementById('docente_ud_0')) {
        window.renderUDInputs();
    }
    
    // Gestione Date Inizio ed Esame
    const dataInizioRaw = document.getElementById('cfg-data-inizio').value;
    let dInizio;
    if (dataInizioRaw) {
        const parts = dataInizioRaw.split('-');
        dInizio = new Date(parts[0], parts[1] - 1, parts[2]);
    } else {
        dInizio = new Date();
    }

    const dEsameRaw = document.getElementById('cfg-data-esame').value;
    let dataEsameStrFormatted = "___/___/2025";
    if(dEsameRaw) {
        const p = dEsameRaw.split('-');
        dataEsameStrFormatted = p[2] + "/" + p[1] + "/" + p[0];
    }
    
    // Generazione Codice Progetto
    const yy = dInizio.getFullYear();
    const mm = (dInizio.getMonth() + 1).toString().padStart(2, '0');
    const currentAzienda = document.getElementById('cfg-azienda').value.trim();
    const az = currentAzienda.split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g,'') || "AZ";
    const currentCorso = c.t;
    
    let codice = document.getElementById('cfg-codice') ? document.getElementById('cfg-codice').value : "";
    const existingId = document.getElementById('cfg-loaded-cert-id').value;
    
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
    
    if(document.getElementById('cfg-codice')) document.getElementById('cfg-codice').value = codice || "";

    // Calcolo Date, Docenti e Syllabus (saltando Sabato e Domenica)
    let docentiMap = {}; 
    let scheduleHtml = ""; 
    let currentDay = new Date(dInizio.getTime()); 
    let calendarioTesto = "";
    let docentePrincipale = document.getElementById('cfg-docente').value; 
    
    const calendarioManuale = document.getElementById('cfg-calendario').value.trim();
    let dailyHours = 0;
    
    if(currentDay.getDay() === 6) currentDay.setDate(currentDay.getDate() + 2); 
    if(currentDay.getDay() === 0) currentDay.setDate(currentDay.getDate() + 1);

    let dateSummaryArr = [];

    c.prog.forEach((ud, index) => {
        const docInput = document.getElementById('docente_ud_' + index);
        const docName = docInput ? docInput.value : docentePrincipale;
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
        rdHtml += '<td class="p-2 text-center font-bold">' + idxRd + '</td>';
        rdHtml += '<td class="p-2 font-black text-slate-800">' + docName + '</td>';
        rdHtml += '<td class="p-2 font-mono text-slate-600 text-[9px]">' + data.uds.join(', ') + '</td>';
        rdHtml += '<td class="p-2 text-center font-bold text-blue-700">' + data.ore + ' h</td>';
        rdHtml += '<td class="p-2 w-48">&nbsp;</td>';
        rdHtml += '</tr>';
        idxRd++;
    }
    
    if(document.getElementById('rd-rows')) document.getElementById('rd-rows').innerHTML = rdHtml;
    if(document.getElementById('p-programma')) document.getElementById('p-programma').innerHTML = scheduleHtml;
    if(document.getElementById('retro-programma')) document.getElementById('retro-programma').innerHTML = scheduleHtml;
    
    if (!calendarioManuale) {
        document.getElementById('cfg-calendario').value = calendarioTesto;
        const offsetDate = new Date(currentDay.getTime() - (currentDay.getTimezoneOffset() * 60000));
        document.getElementById('cfg-data-esame').value = offsetDate.toISOString().split('T')[0];
    }

    // Trasferimento valori ai campi HTML visualizzati
    const sedeInput = document.getElementById('cfg-sede-corso').value.trim();
    const sedeToDisplay = sedeInput || document.getElementById('cfg-azienda-indirizzo').value || "Sede Aziendale";

    document.querySelectorAll('.val-ente').forEach(el => el.innerText = document.getElementById('cfg-ente').value);
    document.querySelectorAll('.val-azienda').forEach(el => el.innerText = document.getElementById('cfg-azienda').value);
    document.querySelectorAll('.val-ateco').forEach(el => el.innerText = document.getElementById('cfg-ateco').value);
    document.querySelectorAll('.val-nome').forEach(el => el.innerText = document.getElementById('cfg-nome').value);
    document.querySelectorAll('.val-mansione').forEach(el => el.innerText = document.getElementById('cfg-mansione').value);
    document.querySelectorAll('.val-nascita').forEach(el => el.innerText = document.getElementById('cfg-nascita').value);
    document.querySelectorAll('.val-cf').forEach(el => el.innerText = document.getElementById('cfg-cf').value);
    document.querySelectorAll('.val-titolo-corso').forEach(el => el.innerText = c.t);
    document.querySelectorAll('.val-ore-corso').forEach(el => el.innerText = c.ore + " ORE");
    document.querySelectorAll('.val-codice').forEach(el => el.innerText = codice);
    document.querySelectorAll('.val-sede-corso').forEach(el => el.innerText = sedeToDisplay); 
    document.querySelectorAll('.val-docente').forEach(el => el.innerText = document.getElementById('cfg-docente').value); 
    document.querySelectorAll('.val-docente-main').forEach(el => el.innerText = docentePrincipale); 
    document.querySelectorAll('.val-resp-corso').forEach(el => el.innerText = document.getElementById('cfg-resp-corso').value);
    document.querySelectorAll('.val-resp-progetto').forEach(el => el.innerText = document.getElementById('cfg-resp-progetto').value);
    document.querySelectorAll('.val-luogo-emissione').forEach(el => el.innerText = document.getElementById('cfg-luogo-emissione').value);
    document.querySelectorAll('.val-req-docente').forEach(el => el.innerText = document.getElementById('cfg-req-docente').value || "Formatore Qualificato");
    
    const tutorVal = document.getElementById('cfg-tutor')?.value;
    document.querySelectorAll('.val-tutor').forEach(el => el.innerText = tutorVal ? tutorVal : "N/D - Non Applicabile");
    
    document.querySelectorAll('.val-legale-nome').forEach(el => el.innerText = document.getElementById('cfg-legale-nome').value);
    document.querySelectorAll('.val-legale-nascita').forEach(el => el.innerText = document.getElementById('cfg-legale-nascita').value);
    
    document.querySelectorAll('.val-date-ud').forEach(el => el.innerHTML = dateSummaryArr.join(' &bull; '));
    document.querySelectorAll('.val-data-esame').forEach(el => el.innerText = dataEsameStrFormatted);

    document.querySelectorAll('.val-data-inizio').forEach(el => {
        if(dataInizioRaw) {
            const p = dataInizioRaw.split('-');
            el.innerText = p[2] + "/" + p[1] + "/" + p[0];
        } else {
            el.innerText = "___/___/2025";
        }
    });

    document.querySelectorAll('.val-calendario').forEach(el => el.innerText = document.getElementById('cfg-calendario').value);
    document.querySelectorAll('.val-modalita').forEach(el => el.innerText = document.getElementById('cfg-modalita').value);
    document.querySelectorAll('.val-ente-indirizzo').forEach(el => el.innerText = document.getElementById('cfg-ente-indirizzo').value);
    document.querySelectorAll('.val-ente-contatti').forEach(el => el.innerText = document.getElementById('cfg-ente-contatti').value);

    // Cert ID Generator
    let certIdStr = document.getElementById('cfg-loaded-cert-id').value;
    if(!certIdStr && codice) {
        const safeCf = (document.getElementById('cfg-cf').value || "XXX").substring(0,6);
        certIdStr = "C25-" + codice.split(/[-/]/).pop() + "-" + safeCf + "-" + new Date().getTime().toString().slice(-4);
    }
    document.querySelectorAll('.val-cert-id').forEach(el => el.innerText = certIdStr || "---");

    // Logo Manager
    const logoUrl = document.getElementById('cfg-logo').value;
    document.querySelectorAll('.logo-img').forEach(img => { 
        if(logoUrl){ img.src=logoUrl; img.classList.remove('hidden'); } 
        else img.classList.add('hidden'); 
    });
    
    document.querySelectorAll('.val-dicitura-legale').forEach(el => el.innerHTML = "Corso erogato in conformità al <strong>" + (c.norma || "D.Lgs. 81/08 e Accordi Stato Regioni vigenti") + "</strong>. Qualifica della Docenza Registrata: " + document.getElementById('cfg-req-docente').value + ".");

    // Scadenza
    if (c.scad === 99) { 
        document.querySelectorAll('.val-scadenza').forEach(el => el.innerText = "Credito Permanente"); 
    } else if(dEsameRaw) { 
        const parts = dEsameRaw.split('-'); 
        const d = new Date(parts[0], parts[1]-1, parts[2]); 
        d.setFullYear(d.getFullYear() + c.scad); 
        document.querySelectorAll('.val-scadenza').forEach(el => el.innerText = d.toLocaleDateString('it-IT') + ' (Agg. ' + c.scad + ' Anni)'); 
    } else { 
        document.querySelectorAll('.val-scadenza').forEach(el => el.innerText = '--/--/-- (Agg. ' + c.scad + ' Anni)'); 
    }

    // Auto-generazione Righe vuote per utente singolo
    const vRows = document.getElementById('v-rows');
    if (vRows && !vRows.dataset.populated) {
        const nomeVal = document.getElementById('cfg-nome').value;
        const mansioneVal = document.getElementById('cfg-mansione').value;
        const cfVal = document.getElementById('cfg-cf').value;

        // Registro (Landscape)
        let rr = '<tr><td class="py-0.5 px-1 text-center font-bold">1</td><td class="py-0.5 px-1 bg-white leading-none"><span class="font-bold">' + nomeVal + '</span><br><span class="text-[6px] text-slate-500 uppercase">' + (mansioneVal || '') + '</span></td><td class="py-0.5 px-1 text-center font-mono">' + cfVal + '</td><td class="py-0.5 px-1 text-center">&nbsp;</td><td class="py-0.5 px-1">&nbsp;</td><td class="py-0.5 px-1 text-center">&nbsp;</td><td class="py-0.5 px-1">&nbsp;</td></tr>';
        for(let i=0; i<29; i++){ 
            rr += '<tr><td class="py-0.5 px-1">&nbsp;</td><td class="py-0.5 px-1">&nbsp;</td><td class="py-0.5 px-1">&nbsp;</td><td class="py-0.5 px-1">&nbsp;</td><td class="py-0.5 px-1">&nbsp;</td><td class="py-0.5 px-1">&nbsp;</td><td class="py-0.5 px-1">&nbsp;</td></tr>'; 
        }
        if(document.getElementById('r-rows')) document.getElementById('r-rows').innerHTML = rr;

        // Verbale (Portrait)
        let vr = '<tr><td class="py-0.5 px-1 leading-tight"><span class="font-bold">' + nomeVal + '</span><br><span class="text-[6.5px] text-slate-500 uppercase">' + (mansioneVal || '') + '</span></td><td class="py-0.5 px-1 text-center font-bold text-emerald-700">SI</td><td class="py-0.5 px-1 text-center italic">__ / 30</td><td class="py-0.5 px-1 text-center">Positivo</td><td class="py-0.5 px-1 text-center font-bold uppercase text-blue-700">Idoneo</td></tr>';
        for(let i=0; i<29; i++){ 
            vr += '<tr><td class="py-0.5 px-1">&nbsp;</td><td class="py-0.5 px-1">&nbsp;</td><td class="py-0.5 px-1">&nbsp;</td><td class="py-0.5 px-1">&nbsp;</td><td class="py-0.5 px-1">&nbsp;</td></tr>'; 
        }
        vRows.innerHTML = vr;
        vRows.dataset.populated = "true";
    }

    if (window.currentSessionCorsisti && window.currentSessionCorsisti.length > 0) {
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
        rRows += '<tr><td class="py-0.5 px-1 text-center font-bold">' + (idx + 1) + '</td><td class="py-0.5 px-1 bg-white leading-none"><span class="font-bold">' + c.nome + '</span><br><span class="text-[6px] text-slate-500 uppercase">' + (c.mansione || '') + '</span></td><td class="py-0.5 px-1 text-center font-mono">' + c.cf + '</td><td class="py-0.5 px-1 text-center">&nbsp;</td><td class="py-0.5 px-1">&nbsp;</td><td class="py-0.5 px-1 text-center">&nbsp;</td><td class="py-0.5 px-1">&nbsp;</td></tr>';
        
        vRows += '<tr><td class="py-0.5 px-1 leading-tight"><span class="font-bold">' + c.nome + '</span><br><span class="text-[6.5px] text-slate-500 uppercase">' + (c.mansione || '') + '</span></td><td class="py-0.5 px-1 text-center font-bold text-emerald-700">SI</td><td class="py-0.5 px-1 text-center italic">__ / 30</td><td class="py-0.5 px-1 text-center">Positivo</td><td class="py-0.5 px-1 text-center font-black uppercase text-blue-700">Idoneo</td></tr>';
    });

    const TOTAL_ROWS_REGISTRO = 30;
    const remainingR = Math.max(0, TOTAL_ROWS_REGISTRO - window.currentSessionCorsisti.length);
    for(let i=0; i<remainingR; i++){
        rRows += '<tr><td class="py-0.5 px-1">&nbsp;</td><td class="py-0.5 px-1">&nbsp;</td><td class="py-0.5 px-1">&nbsp;</td><td class="py-0.5 px-1">&nbsp;</td><td class="py-0.5 px-1">&nbsp;</td><td class="py-0.5 px-1">&nbsp;</td><td class="py-0.5 px-1">&nbsp;</td></tr>';
    }
    
    const TOTAL_ROWS_VERBALE = 30;
    const remainingV = Math.max(0, TOTAL_ROWS_VERBALE - window.currentSessionCorsisti.length);
    for(let i=0; i<remainingV; i++){
        vRows += '<tr><td class="py-0.5 px-1">&nbsp;</td><td class="py-0.5 px-1">&nbsp;</td><td class="py-0.5 px-1">&nbsp;</td><td class="py-0.5 px-1">&nbsp;</td><td class="py-0.5 px-1">&nbsp;</td></tr>';
    }

    if(document.getElementById('r-rows')) document.getElementById('r-rows').innerHTML = rRows;
    if(document.getElementById('v-rows')) document.getElementById('v-rows').innerHTML = vRows;
    
    const selectEl = document.getElementById('cfg-select-corsista');
    if(selectEl) {
        const currVal = selectEl.value;
        let opts = "";
        window.currentSessionCorsisti.forEach((c, i) => {
            opts += '<option value="' + i + '">' + c.nome + ' (' + (c.cf||'').slice(0,6) + ')</option>';
        });
        selectEl.innerHTML = opts;
        selectEl.value = currVal || 0; 
    }
}

// ==========================================
// TEST GENERATOR E COLLOQUIO
// ==========================================
window.updateTests = function() {
    const corsoEl = document.getElementById('cfg-corso');
    if (!corsoEl) return;
    
    const courseId = corsoEl.value;
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
    
    // Colloquio
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
// DB NORMALIZE & UI HANDLERS
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

window.cambioCorso = function() {
    window.pulisciCertIdCaricato();
    window.renderUDInputs();
    const calEl = document.getElementById('cfg-calendario');
    if (calEl) calEl.value = ""; 
    window.updateAll();
}

window.cambiaDataInizio = function() {
    const calEl = document.getElementById('cfg-calendario');
    if (calEl) calEl.value = ""; 
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
    reader.onload = (e) => { document.getElementById('cfg-logo').value = e.target.result; window.updateAll(); };
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
    if(document.getElementById('cfg-loaded-cert-id')) document.getElementById('cfg-loaded-cert-id').value = "";
    if(document.getElementById('cfg-nome')) document.getElementById('cfg-nome').value = "";
    if(document.getElementById('cfg-cf')) document.getElementById('cfg-cf').value = "";
    if(document.getElementById('cfg-mansione')) document.getElementById('cfg-mansione').value = "";
    if(document.getElementById('cfg-nascita')) document.getElementById('cfg-nascita').value = "";
    window.currentSessionCorsisti = [];
    window.updateAll();
}

window.cambiaCorsistaSessione = function() {
    const selectEl = document.getElementById('cfg-select-corsista');
    if(!selectEl) return;
    const idx = selectEl.value;
    if (!window.currentSessionCorsisti || window.currentSessionCorsisti.length === 0) return;
    const c = window.currentSessionCorsisti[idx];
    if(c) {
        if(document.getElementById('cfg-nome')) document.getElementById('cfg-nome').value = c.nome || "";
        if(document.getElementById('cfg-mansione')) document.getElementById('cfg-mansione').value = c.mansione || "";
        if(document.getElementById('cfg-nascita')) document.getElementById('cfg-nascita').value = c.nascita || "";
        if(document.getElementById('cfg-cf')) document.getElementById('cfg-cf').value = c.cf || "";
        if(document.getElementById('cfg-loaded-cert-id')) document.getElementById('cfg-loaded-cert-id').value = c.id_certificato || "";
        
        document.querySelectorAll('[id^="docente_ud_"]').forEach(el => el.value = "");
        if (c.docenti_ud && c.docenti_ud.length > 0) {
            c.docenti_ud.forEach((doc, i) => {
                const input = document.getElementById('docente_ud_' + i);
                if (input) input.value = doc;
            });
        }
        window.updateAll();
    }
}

window.caricaSessioneByCodice = function(codice) {
    const sessionCorsisti = window.dbCorsisti.filter(r => r.codice === codice);
    if (sessionCorsisti.length === 0) return alert("Errore nel caricamento della sessione.");

    const cRef = sessionCorsisti[0];
    let courseKey = "lav_basso"; 
    for (const [key, value] of Object.entries(window.DB_CORSI)) { if (value.t === cRef.corso) { courseKey = key; break; } }
    
    if(document.getElementById('cfg-corso')) document.getElementById('cfg-corso').value = courseKey;
    window.renderUDInputs();
    
    if(document.getElementById('cfg-azienda')) document.getElementById('cfg-azienda').value = cRef.azienda || "";
    if(document.getElementById('cfg-azienda-indirizzo')) document.getElementById('cfg-azienda-indirizzo').value = cRef.indirizzo_azienda || "";
    if(document.getElementById('cfg-ateco')) document.getElementById('cfg-ateco').value = cRef.ateco || "";
    if(document.getElementById('cfg-sede-corso')) document.getElementById('cfg-sede-corso').value = cRef.sede_corso || "";
    if(document.getElementById('cfg-modalita')) document.getElementById('cfg-modalita').value = cRef.modalita || "In Presenza Fisica";
    if(document.getElementById('cfg-calendario')) document.getElementById('cfg-calendario').value = cRef.calendario || "";
    if(document.getElementById('cfg-data-esame')) document.getElementById('cfg-data-esame').value = window.formatDataToISODate(cRef.data_esame);
    if(document.getElementById('cfg-data-inizio')) document.getElementById('cfg-data-inizio').value = window.formatDataToISODate(cRef.data_inizio);
    
    window.currentSessionCorsisti = sessionCorsisti;
    window.chiudiSessioni();
    window.updateAll();
    alert("Sessione [" + codice + "] caricata con successo (" + sessionCorsisti.length + " Corsisti).");
}

window.caricaCorsista = function(idx) {
    const r = window.dbCorsisti[idx];
    let courseKey = "lav_basso"; 
    for (const [key, value] of Object.entries(window.DB_CORSI)) { if (value.t === r.corso) { courseKey = key; break; } }
    
    if(document.getElementById('cfg-corso')) document.getElementById('cfg-corso').value = courseKey;
    window.renderUDInputs();

    if(document.getElementById('cfg-azienda')) document.getElementById('cfg-azienda').value = r.azienda || "";
    if(document.getElementById('cfg-azienda-indirizzo')) document.getElementById('cfg-azienda-indirizzo').value = r.indirizzo_azienda || "";
    if(document.getElementById('cfg-ateco')) document.getElementById('cfg-ateco').value = r.ateco || "";
    if(document.getElementById('cfg-nome')) document.getElementById('cfg-nome').value = r.nome || "";
    if(document.getElementById('cfg-cf')) document.getElementById('cfg-cf').value = r.cf || "";
    if(document.getElementById('cfg-mansione')) document.getElementById('cfg-mansione').value = r.mansione || "";
    if(document.getElementById('cfg-nascita')) document.getElementById('cfg-nascita').value = r.nascita || "";
    if(document.getElementById('cfg-loaded-cert-id')) document.getElementById('cfg-loaded-cert-id').value = r.id_certificato || "";
    if(document.getElementById('cfg-sede-corso')) document.getElementById('cfg-sede-corso').value = r.sede_corso || "";
    if(document.getElementById('cfg-data-esame')) document.getElementById('cfg-data-esame').value = window.formatDataToISODate(r.data_esame);
    if(document.getElementById('cfg-data-inizio')) document.getElementById('cfg-data-inizio').value = window.formatDataToISODate(r.data_inizio);

    if (r.docenti_ud && r.docenti_ud.length > 0) {
        r.docenti_ud.forEach((docName, i) => {
            const input = document.getElementById('docente_ud_' + i);
            if (input) input.value = docName;
        });
    }
    window.chiudiArchivio(); 
    window.updateAll();
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

    window.currentSessionCorsisti.
