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
// UTILITY DI FORMATTAZIONE
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
// LOGICA CRM: AZIENDE
// ==========================================
window.aziendeList = [];

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
                    <button onclick="window.modificaAzienda('${az.id}')" class="text-blue-600 hover:bg-blue-200 bg-blue-100 p-1.5 rounded transition shadow-sm"><i data-lucide="edit" class="w-4 h-4"></i></button>
                    <button onclick="window.eliminaAzienda('${az.id}')" class="text-red-600 hover:bg-red-200 bg-red-100 p-1.5 rounded transition shadow-sm ml-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
    if(typeof lucide !== 'undefined') lucide.createIcons();
};

window.salvaAziendaDB = async function() {
    const id = document.getElementById('az-id').value;
    const record = {
        ragione_sociale: document.getElementById('az-ragione-sociale').value.trim(),
        piva_cf: document.getElementById('az-piva').value.trim(),
        indirizzo: document.getElementById('az-indirizzo').value.trim(),
        ateco: document.getElementById('az-ateco').value.trim(),
        referente: document.getElementById('az-referente').value.trim()
    };
    
    if (id && id !== "") record.id = id;

    const result = await window.saveAzienda(record);
    if (result) {
        window.resetFormAzienda();
        await window.loadAziendeTable();
    } 
};

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

window.eliminaAzienda = async function(id) {
    if(confirm("Sei sicuro di voler eliminare questa azienda?")) {
        if(await window.deleteAzienda(id)) await window.loadAziendeTable();
    }
};

window.resetFormAzienda = function() {
    document.getElementById('az-id').value = "";
    document.getElementById('form-azienda').reset();
};

window.filtraAziende = function() {
    const filter = document.getElementById('search-azure').value.toLowerCase();
    const rows = document.getElementById('tabella-aziende').getElementsByTagName('tr');
    for (let i = 0; i < rows.length; i++) {
        if(rows[i].cells.length === 1) continue; 
        rows[i].style.display = rows[i].innerText.toLowerCase().includes(filter) ? "" : "none";
    }
};

// ==========================================
// LOGICA CRM: DOCENTI
// ==========================================
window.docentiList = [];

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
                <td class="p-3 border-b text-[10px] text-slate-500 truncate max-w-[150px]">${doc.qualifica}</td>
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
    if (id && id !== "") record.id = id;

    if (await window.saveDocente(record)) {
        window.resetFormDocente();
        await window.loadDocentiTable();
    }
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

// ==========================================
// LOGICA CRM: CORSISTI
// ==========================================
window.corsistiList = [];

window.loadCorsistiTable = async function() {
    const tbody = document.getElementById('tabella-corsisti');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" class="p-6 text-center text-slate-400 italic"><i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto mb-2"></i> Caricamento...</td></tr>';
    
    window.corsistiList = await window.getCorsisti();
    window.aziendeList = await window.getAziende(); 

    const selectAzienda = document.getElementById('cor-azienda');
    if (selectAzienda) {
        let optHtml = '<option value="">-- Nessuna Azienda / Privato --</option>';
        window.aziendeList.forEach(az => { optHtml += `<option value="${az.id}">${az.ragione_sociale}</option>`; });
        selectAzienda.innerHTML = optHtml;
    }

    if (window.corsistiList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="p-6 text-center text-slate-500 italic">Nessun corsista registrato.</td></tr>';
        return;
    }

    let html = '';
    window.corsistiList.forEach(cor => {
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
    const record = {
        nome_cognome: document.getElementById('cor-nome').value.trim(),
        cf: document.getElementById('cor-cf').value.trim().toUpperCase(),
        luogo_data_nascita: document.getElementById('cor-nascita').value.trim(),
        azienda_id: document.getElementById('cor-azienda').value || null 
    };
    if (id && id !== "") record.id = id;

    if (await window.saveCorsistaData(record)) {
        window.resetFormCorsista();
        await window.loadCorsistiTable();
    }
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
    if(confirm("Sicuro di voler eliminare questo corsista?")) {
        if(await window.deleteDocente(id)) await window.loadCorsistiTable();
    }
};

window.resetFormCorsista = function() {
    document.getElementById('cor-id').value = "";
    document.getElementById('form-corsista').reset();
};

// ==========================================
// MOTORE DI CALCOLO AUTOMATICO GIORNI FORMATIVI & SCADENZA
// ==========================================
window.calcolaDettagliProgetto = function() {
    const corsoId = document.getElementById('prog-corso').value;
    const dataInizioRaw = document.getElementById('prog-inizio').value;
    if (!corsoId || !dataInizioRaw) return;

    const c = window.DB_CORSI[corsoId];
    if (!c || !c.prog) return;

    let currentDay = new Date(dataInizioRaw);
    let calendarioTesto = "";
    let dailyHours = 0;
    let syllabusHtml = "";

    // Salta i weekend in partenza
    if(currentDay.getDay() === 6) currentDay.setDate(currentDay.getDate() + 2); 
    if(currentDay.getDay() === 0) currentDay.setDate(currentDay.getDate() + 1);

    c.prog.forEach((ud) => {
        let remainingUDHours = ud.ore;
        let udDates = [];

        while(remainingUDHours > 0) {
            if(dailyHours >= 8) { // Max 8 ore al giorno
                currentDay.setDate(currentDay.getDate() + 1);
                if(currentDay.getDay() === 6) currentDay.setDate(currentDay.getDate() + 2);
                if(currentDay.getDay() === 0) currentDay.setDate(currentDay.getDate() + 1);
                dailyHours = 0;
            }
            let availableToday = 8 - dailyHours;
            let hoursToAllocate = Math.min(remainingUDHours, availableToday);
            let dateStr = currentDay.toLocaleDateString('it-IT');

            if (!udDates.includes(dateStr)) udDates.push(dateStr);
            if (!calendarioTesto.includes(dateStr)) {
                calendarioTesto += (calendarioTesto ? "\n" : "") + dateStr;
            }
            dailyHours += hoursToAllocate;
            remainingUDHours -= hoursToAllocate;
        }
        
        syllabusHtml += `
            <div class="text-[11px] border-b border-slate-200 pb-1 mb-1 text-slate-700">
                <span class="font-bold text-blue-700">${ud.ud}</span> (${ud.ore} Ore)<br>
                <span class="text-[10px] text-slate-800 font-semibold uppercase">${ud.m}</span><br>
                <span class="text-[9px] text-slate-500 font-mono">${udDates.join(' &bull; ')}</span>
            </div>
        `;
    });

    // Imposta la data di emissione/esame (ultimo giorno di corso)
    const offsetDate = new Date(currentDay.getTime() - (currentDay.getTimezoneOffset() * 60000));
    document.getElementById('prog-esame').value = offsetDate.toISOString().split('T')[0];

    // Scrive i giorni rilevati nella textarea
    document.getElementById('prog-calendario-testo').value = calendarioTesto;

    // Calcola e visualizza la validità dell'attestato
    let scadTesto = "";
    if (c.scad === 99) {
        scadTesto = "Permanente (Senza Scadenza)";
    } else {
        let dScad = new Date(currentDay.getTime());
        dScad.setFullYear(dScad.getFullYear() + c.scad);
        scadTesto = dScad.toLocaleDateString('it-IT') + ` (Valido ${c.scad} Anni)`;
    }
    document.getElementById('lbl-prog-scadenza').innerText = scadTesto;

    // Inietta l'anteprima del Progetto Formativo
    document.getElementById('prog-syllabus-preview').innerHTML = syllabusHtml;
};

// ==========================================
// LOGICA CRM: PROGETTI E ISCRIZIONI
// ==========================================
window.progettiList = [];
window.currentProgettoId = null;

window.loadProgettiTable = async function() {
    const tbody = document.getElementById('tabella-progetti');
    if(!tbody) return;
    
    if(window.aziendeList.length === 0) window.aziendeList = await window.getAziende();
    if(window.docentiList.length === 0) window.docentiList = await window.getDocenti();
    
    const selAzienda = document.getElementById('prog-azienda');
    if(selAzienda) {
        selAzienda.innerHTML = '<option value="">-- Seleziona Azienda --</option>' + 
            window.aziendeList.map(a => `<option value="${a.id}">${a.ragione_sociale}</option>`).join('');
    }
    
    const selDocente = document.getElementById('prog-docente');
    if(selDocente) {
        selDocente.innerHTML = '<option value="">-- Seleziona Docente --</option>' + 
            window.docentiList.map(d => `<option value="${d.id}">${d.nome_cognome}</option>`).join('');
    }

    tbody.innerHTML = '<tr><td colspan="4" class="p-6 text-center text-slate-400 italic"><i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto mb-2"></i> Caricamento progetti...</td></tr>';
    if(typeof lucide !== 'undefined') lucide.createIcons();

    window.progettiList = await window.getProgetti();

    if (window.progettiList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="p-6 text-center text-slate-500 italic">Nessun corso registrato.</td></tr>';
        return;
    }

    let html = '';
    window.progettiList.forEach(p => {
        const nomeAzienda = p.aziende ? p.aziende.ragione_sociale : 'Privato';
        const nomeCorso = window.DB_CORSI[p.corso_id] ? window.DB_CORSI[p.corso_id].t : p.corso_id;
        
        html += `
            <tr class="hover:bg-amber-50 transition-colors">
                <td class="p-3 border-b font-mono font-bold text-[10px] text-slate-800">${p.codice}</td>
                <td class="p-3 border-b">
                    <p class="font-bold text-xs text-blue-900">${nomeCorso}</p>
                    <p class="text-[9px] text-slate-500 uppercase">${nomeAzienda}</p>
                </td>
                <td class="p-3 border-b font-bold text-center text-slate-700">${window.formatDataToItalian(p.data_esame)}</td>
                <td class="p-3 border-b text-center whitespace-nowrap">
                    <button onclick="window.apriIscrizioni('${p.id}')" class="text-white bg-slate-800 hover:bg-slate-700 p-1.5 rounded transition shadow-sm font-bold text-[9px] uppercase px-2"><i data-lucide="users" class="w-3 h-3 inline"></i> Iscritti</button>
                    <button onclick="window.modificaProgetto('${p.id}')" class="text-blue-600 hover:bg-blue-200 bg-blue-100 p-1.5 rounded transition shadow-sm ml-1"><i data-lucide="edit" class="w-3 h-3"></i></button>
                    <button onclick="window.eliminaProgetto('${p.id}')" class="text-red-600 hover:bg-red-200 bg-red-100 p-1.5 rounded transition shadow-sm ml-1"><i data-lucide="trash-2" class="w-3 h-3"></i></button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
    if(typeof lucide !== 'undefined') lucide.createIcons();
};

window.salvaProgettoDB = async function() {
    const id = document.getElementById('prog-id').value;
    const record = {
        azienda_id: document.getElementById('prog-azienda').value,
        corso_id: document.getElementById('prog-corso').value,
        codice: document.getElementById('prog-codice').value.trim(),
        modalita: document.getElementById('prog-modalita').value,
        data_inizio: document.getElementById('prog-inizio').value,
        data_esame: document.getElementById('prog-esame').value,
        docente_principale: document.getElementById('prog-docente').value,
        calendario: document.getElementById('prog-calendario-testo').value // Salva i giorni calcolati nel DB!
    };
    if (id && id !== "") record.id = id;

    if (await window.saveProgetto(record)) {
        window.resetFormProgetto();
        await window.loadProgettiTable();
    } else alert("Errore nel salvataggio del progetto formativo.");
};

window.modificaProgetto = function(id) {
    const p = window.progettiList.find(x => x.id === id);
    if(!p) return;
    document.getElementById('prog-id').value = p.id;
    document.getElementById('prog-azienda').value = p.azienda_id;
    document.getElementById('prog-corso').value = p.corso_id;
    document.getElementById('prog-codice').value = p.codice;
    document.getElementById('prog-modalita').value = p.modalita;
    document.getElementById('prog-inizio').value = p.data_inizio || "";
    document.getElementById('prog-esame').value = p.data_esame || "";
    document.getElementById('prog-docente').value = p.docente_principale || "";
    window.calcolaDettagliProgetto(); // Ricalcola al volo l'anteprima
};

window.eliminaProgetto = async function(id) {
    if(confirm("Sei sicuro di voler cancellare questo corso?")) {
        if(await window.deleteProgetto(id)) await window.loadProgettiTable();
    }
};

window.resetFormProgetto = function() {
    document.getElementById('prog-id').value = "";
    document.getElementById('form-progetto').reset();
    document.getElementById('prog-syllabus-preview').innerHTML = '<span class="text-xs text-slate-400 italic">Seleziona corso e data d\'inizio...</span>';
};

// --- GESTIONE DELLE ISCRIZIONI E DELLE SCADENZE REALI ---
window.apriIscrizioni = async function(progetto_id) {
    window.currentProgettoId = proyecto_id;
    const p = window.progettiList.find(x => x.id === progetto_id);
    const aziendaName = p.aziende ? p.aziende.ragione_sociale : 'Privato';
    
    document.getElementById('lbl-progetto-attivo').innerHTML = `Cod: <span class="text-white">${p.codice}</span> | Azienda: <span class="text-white">${aziendaName}</span>`;
    document.getElementById('panel-iscrizioni').classList.remove('hidden');
    
    if(window.corsistiList.length === 0) window.corsistiList = await window.getCorsisti();
    
    const sel = document.getElementById('sel-iscrivi-corsista');
    let opts = '<option value="">-- Seleziona Corsista da aggiungere --</option>';
    window.corsistiList.forEach(c => {
        const marker = c.azienda_id === p.azienda_id ? "📌 " : "";
        opts += `<option value="${c.id}">${marker}${c.nome_cognome} (${c.cf})</option>`;
    });
    sel.innerHTML = opts;

    await window.loadIscrittiTable();
};

window.chiudiPannelloIscrizioni = function() {
    window.currentProgettoId = null;
    document.getElementById('panel-iscrizioni').classList.add('hidden');
};

window.loadIscrittiTable = async function() {
    const tbody = document.getElementById('tabella-iscritti');
    tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-slate-500 italic">Caricamento...</td></tr>';
    
    const iscritti = await window.getIscrizioni(window.currentProgettoId);
    
    if(iscritti.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-slate-500 italic">Nessun allievo iscritto.</td></tr>';
        return;
    }

    let html = '';
    iscritti.forEach(isc => {
        html += `
            <tr class="hover:bg-slate-600 transition-colors">
                <td class="p-2 border-b border-slate-600 text-sm font-bold text-blue-300">${isc.corsisti.nome_cognome}</td>
                <td class="p-2 border-b border-slate-600 font-mono text-[10px] text-slate-300">${isc.corsisti.cf}</td>
                <td class="p-2 border-b border-slate-600 font-mono text-[9px] text-amber-200">${isc.id_certificato}</td>
                <td class="p-2 border-b border-slate-600 text-center">
                    <button onclick="window.rimuoviIscrizione('${isc.id}')" class="text-red-400 hover:text-white hover:bg-red-500 p-1 rounded transition"><i data-lucide="user-minus" class="w-4 h-4"></i></button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
    if(typeof lucide !== 'undefined') lucide.createIcons();
};

window.aggiungiIscrizione = async function() {
    const corsista_id = document.getElementById('sel-iscrivi-corsista').value;
    if(!corsista_id || !window.currentProgettoId) return alert("Seleziona un corsista.");

    const p = window.progettiList.find(x => x.id === window.currentProgettoId);
    const c = window.corsistiList.find(x => x.id === corsista_id);
    const corsoInfo = window.DB_CORSI[p.corso_id];

    // CALCOLO DATA SCADENZA REALE DA REGISTRARE SUL CORSISTA
    let dataScadenzaISO = null;
    if (corsoInfo && corsoInfo.scad !== 99) {
        let dScad = new Date(p.data_esame);
        dScad.setFullYear(dScad.getFullYear() + corsoInfo.scad);
        const offsetDate = new Date(dScad.getTime() - (dScad.getTimezoneOffset() * 60000));
        dataScadenzaISO = offsetDate.toISOString().split('T')[0];
    }

    const id_cert = `C26-${p.codice}-${c.cf.substring(0,6)}-${Math.floor(Math.random()*999)}`;

    const record = {
        progetto_id: window.currentProgettoId,
        corsista_id: corsista_id,
        id_certificato: id_cert,
        esito: "Idoneo",
        data_scadenza: dataScadenzaISO // Registra la scadenza esatta su Supabase!
    };

    if(await window.saveIscrizione(record)) {
        await window.loadIscrittiTable();
    } else {
        alert("Errore. L'allievo potrebbe essere già iscritto.");
    }
};

window.rimuoviIscrizione = async function(id) {
    if(confirm("Rimuovere l'allievo dal corso?")) {
        if(await window.deleteIscrizione(id)) await window.loadIscrittiTable();
    }
};

// ==========================================
// LOGICA CRM: ENTE E STAMPE
// ==========================================
window.loadEnteData = async function() {
    const ente = await window.getEnte();
    if(ente) {
        document.getElementById('ente-id').value = ente.id;
        document.getElementById('ente-ragione').value = ente.ragione_sociale || "";
        document.getElementById('ente-piva').value = ente.piva_cf || "";
        document.getElementById('ente-indirizzo').value = ente.indirizzo || "";
        document.getElementById('ente-contatti').value = ente.contatti || "";
        document.getElementById('ente-legale-nome').value = ente.legale_nome || "";
        document.getElementById('ente-legale-nascita').value = ente.legale_nascita || "";
        document.getElementById('ente-luogo-emissione').value = ente.luogo_emissione || "";
        
        if(ente.logo_url) {
            document.getElementById('cfg-logo').value = ente.logo_url;
            window.AppState['cfg-logo'] = ente.logo_url;
        }
        
        window.AppState['cfg-ente'] = ente.ragione_sociale;
        window.AppState['cfg-ente-indirizzo'] = ente.indirizzo;
        window.AppState['cfg-ente-contatti'] = ente.contatti;
        window.AppState['cfg-luogo-emissione'] = ente.luogo_emissione;
        window.AppState['cfg-legale-nome'] = ente.legale_nome;
        window.AppState['cfg-legale-nascita'] = ente.legale_nascita;
    }
};

window.salvaEnteDB = async function() {
    const id = document.getElementById('ente-id').value;
    const record = {
        ragione_sociale: document.getElementById('ente-ragione').value.trim(),
        piva_cf: document.getElementById('ente-piva').value.trim(),
        indirizzo: document.getElementById('ente-indirizzo').value.trim(),
        contatti: document.getElementById('ente-contatti').value.trim(),
        legale_nome: document.getElementById('ente-legale-nome').value.trim(),
        legale_nascita: document.getElementById('ente-legale-nascita').value.trim(),
        luogo_emissione: document.getElementById('ente-luogo-emissione').value.trim(),
        logo_url: document.getElementById('cfg-logo').value 
    };
    if (id && id !== "") record.id = id;

    const salvato = await window.saveEnteData(record);
    if(salvato) {
        alert("Dati Ente aggiornati con successo!");
        await window.loadEnteData();
    }
};

window.initStampe = async function() {
    const sel = document.getElementById('stampa-progetto');
    if(!sel) return;
    
    window.progettiList = await window.getProgetti();
    
    let html = '<option value="">-- Seleziona un progetto --</option>';
    window.progettiList.forEach(p => {
        const azName = p.aziende ? p.aziende.ragione_sociale : 'Privato';
        html += `<option value="${p.id}">${p.codice} - ${azName}</option>`;
    });
    sel.innerHTML = html;
};

window.currentPrintModule = "";

window.caricaDatiStampa = async function() {
    const progId = document.getElementById('stampa-progetto').value;
    if(!progId) return;

    const p = window.progettiList.find(x => x.id === progId);
    if(!p) return;

    if(window.docentiList.length === 0) window.docentiList = await window.getDocenti();
    const doc = window.docentiList.find(d => d.id === p.docente_principale);
    const iscritti = await window.getIscrizioni(progId);

    window.AppState['cfg-corso'] = p.corso_id;
    window.AppState['cfg-codice'] = p.codice;
    window.AppState['cfg-modalita'] = p.modalita;
    window.AppState['cfg-data-inizio'] = p.data_inizio;
    window.AppState['cfg-data-esame'] = p.data_esame;
    window.AppState['cfg-sede-corso'] = p.sede;
    window.AppState['cfg-azienda'] = p.aziende ? p.aziende.ragione_sociale : "";
    window.AppState['cfg-ateco'] = p.aziende ? p.aziende.ateco : "";
    window.AppState['cfg-azienda-indirizzo'] = p.aziende ? p.aziende.indirizzo : "";
    window.AppState['cfg-docente'] = doc ? doc.nome_cognome : "Docente";
    window.AppState['cfg-req-docente'] = doc ? doc.qualifica : "Formatore Qualificato";
    window.AppState['cfg-calendario'] = p.calendario || ""; // Travasa i giorni reali calcolati!

    window.currentSessionCorsisti = iscritti.map(isc => ({
        nome: isc.corsisti.nome_cognome,
        cf: isc.corsisti.cf,
        nascita: isc.corsisti.luogo_data_nascita,
        mansione: isc.mansione_storica || "",
        id_certificato: isc.id_certificato
    }));

    if(window.currentPrintModule) {
        window.loadPrintPreview(window.currentPrintModule);
    }
};

window.loadPrintPreview = async function(modulo) {
    const progId = document.getElementById('stampa-progetto').value;
    if(!progId) return alert("Seleziona prima un Progetto dal menu a tendina!");

    window.currentPrintModule = modulo;
    const container = document.getElementById('print-preview-container');
    
    try {
        const response = await fetch(`modules/${modulo}.html`);
        if(!response.ok) throw new Error("File del documento non trovato.");
        const html = await response.text();
        
        container.innerHTML = html;
        container.querySelectorAll('.doc-page').forEach(doc => {
            doc.style.margin = "0";
            doc.classList.add('scale-[0.8]', 'origin-top'); 
        });

        if (typeof window.updateAll === 'function') {
            window.updateAll();
        }
    } catch (error) {
        container.innerHTML = `<p class="text-red-500 font-bold">${error.message}</p>`;
    }
};

window.stampaSezioneAttuale = function() {
    if(!window.currentPrintModule) return alert("Seleziona un documento da stampare.");
    const printArea = document.getElementById('print-area-temp');
    printArea.innerHTML = '';
    
    const docOriginale = document.querySelector('#print-preview-container .doc-page');
    if(!docOriginale) return;

    const clone = docOriginale.cloneNode(true);
    clone.classList.remove('scale-[0.8]', 'origin-top');
    clone.classList.add('print-show', 'temp-page');
    if(docOriginale.classList.contains('landscape')) clone.classList.add('landscape-force');
    else clone.classList.add('portrait');
    
    printArea.appendChild(clone);

    document.body.classList.add('is-printing-temp');
    setTimeout(() => { 
        window.print(); 
        document.body.classList.remove('is-printing-temp');
        printArea.innerHTML = ''; 
    }, 800);
};

// ==========================================
// TRASFERIMENTO VALORI NELLE VIEW DI STAMPA
// ==========================================
window.updateAll = function() {
    const courseId = window.getVal('cfg-corso', 'lav_basso');
    const c = window.DB_CORSI[courseId];
    if(!c || !c.prog) return;

    const dataEsameRaw = window.getVal('cfg-data-esame');
    let dataEsameStrFormatted = dataEsameRaw ? window.formatDataToItalian(dataEsameRaw) : "___/___/2025";
    
    const sedeToDisplay = window.getVal('cfg-sede-corso') || window.getVal('cfg-azienda-indirizzo') || "Sede Aziendale";

    document.querySelectorAll('.val-ente').forEach(el => el.innerText = window.getVal('cfg-ente'));
    document.querySelectorAll('.val-azienda').forEach(el => el.innerText = window.getVal('cfg-azienda'));
    document.querySelectorAll('.val-ateco').forEach(el => el.innerText = window.getVal('cfg-ateco'));
    document.querySelectorAll('.val-titolo-corso').forEach(el => el.innerText = c.t);
    document.querySelectorAll('.val-ore-corso').forEach(el => el.innerText = c.ore + " ORE");
    document.querySelectorAll('.val-codice').forEach(el => el.innerText = window.getVal('cfg-codice'));
    document.querySelectorAll('.val-sede-corso').forEach(el => el.innerText = sedeToDisplay); 
    document.querySelectorAll('.val-docente-main').forEach(el => el.innerText = window.getVal('cfg-docente')); 
    document.querySelectorAll('.val-resp-progetto').forEach(el => el.innerText = window.getVal('cfg-resp-progetto'));
    document.querySelectorAll('.val-luogo-emissione').forEach(el => el.innerText = window.getVal('cfg-luogo-emissione'));
    document.querySelectorAll('.val-legale-nome').forEach(el => el.innerText = window.getVal('cfg-legale-nome'));
    document.querySelectorAll('.val-legale-nascita').forEach(el => el.innerText = window.getVal('cfg-legale-nascita'));
    document.querySelectorAll('.val-data-esame').forEach(el => el.innerText = dataEsameStrFormatted);
    document.querySelectorAll('.val-modalita').forEach(el => el.innerText = window.getVal('cfg-modalita', 'In Presenza Fisica'));
    
    // Inietta il calendario dei giorni REALI calcolati dal CRM relazionale
    document.querySelectorAll('.val-calendario').forEach(el => el.innerText = window.getVal('cfg-calendario'));

    document.querySelectorAll('.val-data-inizio').forEach(el => {
        const di = window.getVal('cfg-data-inizio');
        if(di) {
            const p = di.split('-');
            el.innerText = p[2] + "/" + p[1] + "/" + p[0];
        } else el.innerText = "___/___/2025";
    });

    const logoUrl = window.getVal('cfg-logo');
    document.querySelectorAll('.logo-img').forEach(img => { 
        if(logoUrl){ img.src=logoUrl; img.classList.remove('hidden'); } 
        else img.classList.add('hidden'); 
    });

    // Iniezione automatica delle righe nelle tabelle
    if (window.currentSessionCorsisti && window.currentSessionCorsisti.length > 0) {
        window.aggiornaTabelleSessione();
    }
};

window.aggiornaTabelleSessione = function() {
    if (!window.currentSessionCorsisti || window.currentSessionCorsisti.length === 0) return;
    let rRows = ""; let vRows = "";
    
    window.currentSessionCorsisti.forEach((c, idx) => {
        rRows += '<tr><td class="border border-slate-800 py-0.5 px-1 text-center font-bold">' + (idx + 1) + '</td><td class="border border-slate-800 py-0.5 px-1 bg-white leading-none"><span class="font-bold">' + c.nome + '</span><br><span class="text-[6px] text-slate-500 uppercase">' + (c.mansione || '') + '</span></td><td class="border border-slate-800 py-0.5 px-1 text-center font-mono">' + c.cf + '</td><td class="border border-slate-800 py-0.5 px-1 text-center">&nbsp;</td><td class="border border-slate-800 py-0.5 px-1">&nbsp;</td><td class="border border-slate-800 py-0.5 px-1 text-center">&nbsp;</td><td class="border border-slate-800 py-0.5 px-1">&nbsp;</td></tr>';
        
        vRows += '<tr><td class="border border-slate-900 py-0.5 px-1 leading-tight"><span class="font-bold">' + c.nome + '</span><br><span class="text-[6.5px] text-slate-500 uppercase">' + (c.mansione || '') + '</span></td><td class="border border-slate-900 py-0.5 px-1 text-center font-bold text-emerald-700">SI</td><td class="border border-slate-900 py-0.5 px-1 text-center italic">__ / 30</td><td class="border border-slate-900 py-0.5 px-1 text-center">Positivo</td><td class="border border-slate-900 py-0.5 px-1 text-center font-black uppercase text-blue-700">Idoneo</td></tr>';
    });

    const remainingR = Math.max(0, 30 - window.currentSessionCorsisti.length);
    for(let i=0; i<remainingR; i++){
        rRows += '<tr><td class="border border-slate-800 py-0.5 px-1">&nbsp;</td><td class="border border-slate-800 py-0.5 px-1">&nbsp;</td><td class="border border-slate-800 py-0.5 px-1">&nbsp;</td><td class="border border-slate-800 py-0.5 px-1">&nbsp;</td><td class="border border-slate-800 py-0.5 px-1">&nbsp;</td><td class="border border-slate-800 py-0.5 px-1">&nbsp;</td><td class="border border-slate-800 py-0.5 px-1">&nbsp;</td></tr>';
    }
    
    const remainingV = Math.max(0, 30 - window.currentSessionCorsisti.length);
    for(let i=0; i<remainingV; i++){
        vRows += '<tr><td class="border border-slate-900 py-0.5 px-1">&nbsp;</td><td class="border border-slate-900 py-0.5 px-1">&nbsp;</td><td class="border border-slate-900 py-0.5 px-1">&nbsp;</td><td class="border border-slate-900 py-0.5 px-1">&nbsp;</td><td class="border border-slate-900 py-0.5 px-1">&nbsp;</td></tr>';
    }

    if(document.getElementById('r-rows')) document.getElementById('r-rows').innerHTML = rRows;
    if(document.getElementById('v-rows')) document.getElementById('v-rows').innerHTML = vRows;
};
