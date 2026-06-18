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
// --- RENDER DASHBOARD ADMIN ---
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

// --- GESTIONE ARCHIVIO (MODALE) ---
window.mostraArchivio = function() {
    const tbody = document.getElementById('archivio-rows');
    if (!window.dbCorsisti || window.dbCorsisti.length === 0) { 
        tbody.innerHTML = '<tr><td colspan="7" class="p-6 text-center text-slate-500 italic">Nessun record presente in archivio.</td></tr>'; 
    } else {
        let ht = "";
        window.dbCorsisti.forEach((r, originalIdx) => {
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

// Integrazione Eliminazione con Supabase
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

// --- GESTIONE SESSIONI (MODALE) ---
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
// =====================================================================
// FUNZIONI MANCANTI: LOGICHE DI GESTIONE, SESSIONI, STAMPE ED EXPORT
// Da aggiungere alla fine di js/utils.js
// =====================================================================

// --- GENERAZIONE DOMANDE ESAME ---
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

// --- NORMALIZZAZIONE DATABASE ---
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

// --- INTERAZIONI FORM CONFIGURAZIONE ---
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
    const btn = document.querySelector('.btn-tab.bg-indigo-600');
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
        document.getElementById('cfg-logo').value = e.target.result; 
        window.updateAll(); 
    };
    reader.readAsDataURL(file);
}

// --- GESTIONE SESSIONE CORRENTE (MULTI-CORSISTA) ---
window.currentSessionCorsisti = [];

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
    
    // Per ricaricare i dati nel setup, navighiamo prima alla pagina config se non ci siamo
    window.loadModule('config').then(() => {
        let courseKey = "lav_basso"; 
        for (const [key, value] of Object.entries(window.DB_CORSI)) { if (value.t === cRef.corso) { courseKey = key; break; } }
        document.getElementById('cfg-corso').value = courseKey;
        
        window.renderUDInputs();
        
        document.getElementById('cfg-azienda').value = cRef.azienda || "";
        document.getElementById('cfg-azienda-indirizzo').value = cRef.indirizzo_azienda || "";
        document.getElementById('cfg-ateco').value = cRef.ateco || "";
        document.getElementById('cfg-sede-corso').value = cRef.sede_corso || "";
        document.getElementById('cfg-modalita').value = cRef.modalita || "In Presenza Fisica";
        document.getElementById('cfg-calendario').value = cRef.calendario || "";
        document.getElementById('cfg-data-esame').value = window.formatDataToISODate(cRef.data_esame);
        document.getElementById('cfg-data-inizio').value = window.formatDataToISODate(cRef.data_inizio);
        
        window.currentSessionCorsisti = sessionCorsisti;
        
        // Popola la select nel caso serva gestire più corsisti (questo HTML andrebbe aggiunto in config se rimosso)
        // Se non hai più il div box-select-corsista, puoi ometterlo, o rimetterlo in config.html
        
        window.chiudiSessioni();
        alert("Sessione [" + codice + "] caricata con successo (" + sessionCorsisti.length + " Corsisti).");
    });
}

window.caricaCorsista = function(idx) {
    const r = window.dbCorsisti[idx];
    window.loadModule('config').then(() => {
        let courseKey = "lav_basso"; 
        for (const [key, value] of Object.entries(window.DB_CORSI)) { if (value.t === r.corso) { courseKey = key; break; } }
        document.getElementById('cfg-corso').value = courseKey;
        
        window.renderUDInputs();

        document.getElementById('cfg-azienda').value = r.azienda || "";
        document.getElementById('cfg-azienda-indirizzo').value = r.indirizzo_azienda || "";
        document.getElementById('cfg-ateco').value = r.ateco || "";
        document.getElementById('cfg-nome').value = r.nome || "";
        document.getElementById('cfg-cf').value = r.cf || "";
        document.getElementById('cfg-mansione').value = r.mansione || "";
        document.getElementById('cfg-nascita').value = r.nascita || "";
        document.getElementById('cfg-loaded-cert-id').value = r.id_certificato || "";
        document.getElementById('cfg-sede-corso').value = r.sede_corso || "";

        document.getElementById('cfg-data-esame').value = window.formatDataToISODate(r.data_esame);
        document.getElementById('cfg-data-inizio').value = window.formatDataToISODate(r.data_inizio);

        if (r.docenti_ud && r.docenti_ud.length > 0) {
            r.docenti_ud.forEach((docName, i) => {
                const input = document.getElementById('docente_ud_' + i);
                if (input) input.value = docName;
            });
        }
        window.chiudiArchivio(); 
        window.updateAll();
    });
}

// --- LOGICHE DI STAMPA SPECIFICHE ---
window.stampaSezioneAttuale = function() {
    const isMulti = window.currentSessionCorsisti && window.currentSessionCorsisti.length > 0;
    const activeTabBtn = document.querySelector('.btn-tab.active');
    const activeTabId = activeTabBtn ? activeTabBtn.id.replace('nav-', '') : 'registro';

    const individualTabs = ['esame', 'attestato'];

    if (!isMulti || !individualTabs.includes(activeTabId)) {
        let printArea = document.getElementById('print-area-temp');
        printArea.innerHTML = '';
        
        // Cerca i doc-page nel container principale e clonali nell'area temporanea
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

// --- ESPORTAZIONE E IMPORTAZIONE (JSON / CSV) ---
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

// Nota: Per l'importazione (JSON/CSV) nel Cloud, per mantenere la stabilità, ti consiglio di iterare e usare `saveCorsistaCloud(record)` su Supabase.
window.importaJSON = async function(event) {
    const file = event.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if(Array.isArray(imported)) {
                alert("L'importazione nel Cloud inizierà in background. Attendere.");
                for (let record of imported) {
                    await window.saveCorsistaCloud(record); // Salva riga per riga in Supabase
                }
                window.dbCorsisti = await window.loadCloudDatabase();
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
                nome: cols[colMap["COGNOME_E_NOME"]], 
                cf: cols[colMap["CODICE_FISCALE"]],
                corso: cols[colMap["CORSO_EROGATO"]],
                azienda: cols[colMap["AZIENDA_COMMITTENTE"]]
                // (Mappa gli altri campi come facevi prima)
            };
            if(record.id_certificato) await window.saveCorsistaCloud(record);
        }
        window.dbCorsisti = await window.loadCloudDatabase();
        window.updateDBCounter();
        alert("Importazione completata!");
        event.target.value = '';
    };
    reader.readAsText(file, 'utf-8');
}
window.attivaImportazioneCSV = function() { document.getElementById('csv-file-input').click(); }

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
