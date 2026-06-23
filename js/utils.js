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
    if (!dStr) return "___/___/2026";
    if (dStr.includes('-')) {
        const p = dStr.split('-');
        if (p.length === 3) return p[2] + "/" + p[1] + "/" + p[0];
    }
    return dStr;
}

// ==========================================
// LOGICA DASHBOARD
// ==========================================
window.loadDashboardStats = async function() {
    try {
        const fetchCount = async (table) => {
            const { count, error } = await supabaseClient.from(table).select('*', { count: 'exact', head: true });
            if(error) return 0;
            return count;
        };

        const [az, cor, doc, prog] = await Promise.all([
            fetchCount('aziende'),
            fetchCount('corsisti'),
            fetchCount('docenti'),
            fetchCount('progetti')
        ]);

        const elAz = document.getElementById('dash-aziende');
        if(elAz) elAz.innerText = az;
        const elCor = document.getElementById('dash-corsisti');
        if(elCor) elCor.innerText = cor;
        const elDoc = document.getElementById('dash-docenti');
        if(elDoc) elDoc.innerText = doc;
        const elProg = document.getElementById('dash-progetti');
        if(elProg) elProg.innerText = prog;

    } catch (e) {
        console.error("Errore caricamento statistiche", e);
    }
};

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
                    <button onclick="window.modificaAzienda('${az.id}')" class="text-blue-600 hover:bg-blue-200 bg-blue-100 p-1.5 rounded transition shadow-sm" title="Modifica"><i data-lucide="edit" class="w-4 h-4"></i></button>
                    <button onclick="window.eliminaAzienda('${az.id}')" class="text-red-600 hover:bg-red-200 bg-red-100 p-1.5 rounded transition shadow-sm ml-1" title="Elimina"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
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
    if(confirm("Sei sicuro di voler eliminare questa azienda? \n\nTutti i progetti ad essa collegati verranno eliminati.")) {
        if(await window.deleteAzienda(id)) await window.loadAziendeTable();
        else alert("Errore durante l'eliminazione.");
    }
};

window.resetFormAzienda = function() {
    document.getElementById('az-id').value = "";
    document.getElementById('form-azienda').reset();
};

window.filtraAziende = function() {
    const filter = document.getElementById('search-aziende').value.toLowerCase();
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
                <td class="p-3 border-b text-[10px] text-slate-600">${cor.mansione_storica || '-'}</td>
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
        mansione_storica: document.getElementById('cor-mansione') ? document.getElementById('cor-mansione').value.trim() : "",
        azienda_id: document.getElementById('cor-azienda').value || null 
    };
    if (id && id !== "") record.id = id;

    if (await window.saveCorsistaData(record)) {
        window.resetFormCorsista();
        await window.loadCorsistiTable();
    } else alert("Errore nel salvataggio. C.F. potrebbe essere già registrato.");
};

window.modificaCorsista = function(id) {
    const cor = window.corsistiList.find(c => c.id === id);
    if(!cor) return;
    document.getElementById('cor-id').value = cor.id;
    document.getElementById('cor-nome').value = cor.nome_cognome;
    document.getElementById('cor-cf').value = cor.cf;
    document.getElementById('cor-nascita').value = cor.luogo_data_nascita;
    if(document.getElementById('cor-mansione')) document.getElementById('cor-mansione').value = cor.mansione_storica || "";
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

// ==========================================
// MOTORE DI CALCOLO AUTOMATICO GIORNI E DOCENTI
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
    
    let docentiHtml = "";
    let docentiOptions = '<option value="">-- Scegli Docente --</option>' + (window.docentiList || []).map(d => `<option value="${d.id}">${d.nome_cognome}</option>`).join('');

    if(currentDay.getDay() === 6) currentDay.setDate(currentDay.getDate() + 2); 
    if(currentDay.getDay() === 0) currentDay.setDate(currentDay.getDate() + 1);

    c.prog.forEach((ud) => {
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
            if (!calendarioTesto.includes(dateStr)) {
                calendarioTesto += (calendarioTesto ? "\n" : "") + dateStr;
            }
            dailyHours += hoursToAllocate;
            remainingUDHours -= hoursToAllocate;
        }

        docentiHtml += `
            <div class="flex items-center justify-between text-[10px] gap-2 border-b border-slate-200 pb-1 pt-1">
                <span class="font-bold text-blue-700 w-10">${ud.ud}</span>
                <span class="text-slate-600 truncate flex-1" title="${ud.m}">${ud.m}</span>
                <select class="prog-docente-ud input-field text-[10px] py-1 px-1 w-36 bg-white border border-slate-300" data-ud="${ud.ud}" required>
                    ${docentiOptions}
                </select>
            </div>
        `;
    });

    const offsetDate = new Date(currentDay.getTime() - (currentDay.getTimezoneOffset() * 60000));
    const finalDateStr = offsetDate.toISOString().split('T')[0];
    document.getElementById('prog-esame').value = finalDateStr;
    document.getElementById('prog-calendario-testo').value = calendarioTesto;
    document.getElementById('prog-docenti-container').innerHTML = docentiHtml;

    const mapSigleCorsi = {
        'lav_basso': 'FLRB', 'lav_medio': 'FLRM', 'lav_alto': 'FLRA', 'agg_lav': 'AGGFL',
        'preposto': 'PREP', 'agg_prep': 'AGGPREP', 'dirigente': 'DIR', 'agg_dir': 'AGGDIR',
        'dl_base': 'DL', 'dl_spp_comune': 'RSPPDL', 'dl_spp_agri': 'RSPPDL-A', 'dl_spp_pesca': 'RSPPDL-P',
        'dl_spp_costruzioni': 'RSPPDL-C', 'dl_spp_chimico': 'RSPPDL-I', 'rls': 'RLS',
        'amb_confinati': 'SC', 'attr_ple': 'PLE', 'attr_carrelli_ind': 'CE', 'attr_carrelli_all': 'CEA',
        'attr_mmt_esc': 'MMT', 'attr_mmt_all': 'MMTA', 'attr_gru_autocarro': 'GRU', 'attr_gru_torre': 'GRUT',
        'attr_pompe': 'CLS', 'attr_trattori': 'TRA', 'lav_quota': 'QUO', 'primo_soccorso_12h': 'PS',
        'antincendio_liv2': 'AI2', 'agg_dl': 'AGGDL', 'agg_dl_spp': 'AGGRSPPDL', 'agg_pratico_4h': 'AGGPRAT',
        'agg_primo_soccorso_4h': 'AGGPS', 'agg_antincendio_liv2_5h': 'AGGAI2', 'agg_rls_4h': 'AGGRLS', 'agg_rls_8h': 'AGGRLS',
        'mod_cantieri': 'MC'
    };
    const siglaCorso = mapSigleCorsi[corsoId] || 'CRS';

    let siglaAzienda = "ENT";
    const azId = document.getElementById('prog-azienda').value;
    if (azId && window.aziendeList) {
        const az = window.aziendeList.find(a => a.id === azId);
        if (az && az.ragione_sociale) {
            siglaAzienda = az.ragione_sociale.split(' ').map(w => w.charAt(0)).join('').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0,4);
        }
    }

    const dataEsameFormattata = finalDateStr.split('-').reverse().join(''); 

    let inputCodice = document.getElementById('prog-codice');
    let randCode = Math.floor(1000 + Math.random() * 9000); 
    
    if (inputCodice.value && inputCodice.value.includes('-')) {
        const parts = inputCodice.value.split('-');
        const lastPart = parts[parts.length - 1];
        if (!isNaN(lastPart) && lastPart.length === 4) {
            randCode = lastPart;
        }
    }
    inputCodice.value = `${siglaCorso}-${siglaAzienda}-${dataEsameFormattata}-${randCode}`;

    let scadTesto = "";
    if (c.scad === 99) {
        scadTesto = "Permanente (Senza Scadenza)";
    } else {
        let dScad = new Date(currentDay.getTime());
        dScad.setFullYear(dScad.getFullYear() + c.scad);
        scadTesto = dScad.toLocaleDateString('it-IT') + ` (Valido ${c.scad} Anni)`;
    }
    const lblScadenza = document.getElementById('lbl-prog-scadenza');
    if(lblScadenza) lblScadenza.innerText = scadTesto;
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
        });
    });
    tbody.innerHTML = html;
    if(typeof lucide !== 'undefined') lucide.createIcons();
};

window.salvaProgettoDB = async function() {
    const id = document.getElementById('prog-id').value;
    let cod = document.getElementById('prog-codice').value.trim();
    if(!cod) {
        const d = new Date();
        cod = `PRG-${d.getFullYear()}-${Math.floor(Math.random()*10000)}`;
    }

    let docenti_ud = {};
    document.querySelectorAll('.prog-docente-ud').forEach(sel => {
        docenti_ud[sel.getAttribute('data-ud')] = sel.value;
    });

    const record = {
        azienda_id: document.getElementById('prog-azienda').value,
        corso_id: document.getElementById('prog-corso').value,
        codice: cod,
        modalita: document.getElementById('prog-modalita').value,
        data_inizio: document.getElementById('prog-inizio').value,
        data_esame: document.getElementById('prog-esame').value,
        ente_erogatore: document.getElementById('prog-erogatore') ? document.getElementById('prog-erogatore').value : 'ente',
        docente_principale: JSON.stringify(docenti_ud),
        calendario: document.getElementById('prog-calendario-testo').value
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
    if(document.getElementById('prog-erogatore')) document.getElementById('prog-erogatore').value = p.ente_erogatore || 'ente';
    document.getElementById('prog-corso').value = p.corso_id;
    document.getElementById('prog-codice').value = p.codice;
    document.getElementById('prog-modalita').value = p.modalita;
    document.getElementById('prog-inizio').value = p.data_inizio || "";
    document.getElementById('prog-esame').value = p.data_esame || "";
    
    window.calcolaDettagliProgetto(); 
    
    setTimeout(() => {
        try {
            let parsedDocs = JSON.parse(p.docente_principale || '{}');
            document.querySelectorAll('.prog-docente-ud').forEach(sel => {
                let ud = sel.getAttribute('data-ud');
                if(parsedDocs[ud]) sel.value = parsedDocs[ud];
            });
        } catch(e) {}
    }, 100);
};

window.eliminaProgetto = async function(id) {
    if(confirm("Sei sicuro di voler cancellare questo corso?")) {
        if(await window.deleteProgetto(id)) await window.loadProgettiTable();
    }
};

window.resetFormProgetto = function() {
    document.getElementById('prog-id').value = "";
    document.getElementById('form-progetto').reset();
    const prev = document.getElementById('prog-docenti-container');
    if(prev) prev.innerHTML = '<span class="text-xs text-slate-400 italic">Seleziona un corso per caricare le unità didattiche...</span>';
};

window.apriIscrizioni = async function(progetto_id) {
    window.currentProgettoId = progetto_id;
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
        data_scadenza: dataScadenzaISO 
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
    window.AppState['cfg-azienda-referente'] = p.aziende ? p.aziende.referente : "";

    window.AppState['cfg-ente-erogatore'] = p.ente_erogatore || 'ente';
    window.AppState['cfg-docenti-ud'] = p.docente_principale || '{}';
    window.AppState['cfg-calendario'] = p.calendario || ""; 

    window.currentSessionCorsisti = iscritti.map(isc => ({
        nome: isc.corsisti.nome_cognome,
        cf: isc.corsisti.cf,
        nascita: isc.corsisti.luogo_data_nascita,
        mansione: isc.corsisti.mansione_storica || "N/D",
        id_certificato: isc.id_certificato,
        data_scadenza: isc.data_scadenza
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
    
    const btnCorrettore = document.getElementById('btn-correttore');
    if (btnCorrettore) {
        if (modulo === 'esame') btnCorrettore.classList.remove('hidden');
        else btnCorrettore.classList.add('hidden');
    }

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

    if(window.currentPrintModule === 'attestato' && window.currentSessionCorsisti.length > 0) {
        window.preparaEStampaMassiva(window.currentPrintModule);
        return;
    }

    if(window.currentPrintModule === 'esame' && window.currentSessionCorsisti.length > 0) {
        window.preparaEStampaMassiva(window.currentPrintModule);
        return;
    }

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

window.preparaEStampaMassiva = function(tabId) {
    let printArea = document.getElementById('print-area-temp');
    printArea.innerHTML = '';

    const backupSession = [...window.currentSessionCorsisti];

    backupSession.forEach((c, idx) => {
        window.currentSessionCorsisti = [c];
        window.updateAll(); 
        
        document.querySelectorAll('#print-preview-container .doc-page').forEach(original => {
            const clone = original.cloneNode(true);
            clone.id = "";
            clone.classList.remove('scale-[0.8]', 'origin-top');
            clone.classList.add('print-show', 'temp-page');
            if(original.classList.contains('landscape')) clone.classList.add('landscape-force');
            else clone.classList.add('portrait');
            printArea.appendChild(clone);
        });
    });

    window.currentSessionCorsisti = backupSession;
    window.updateAll();

    document.body.classList.add('is-printing-temp');
    setTimeout(() => { 
        window.print(); 
        document.body.classList.remove('is-printing-temp');
        printArea.innerHTML = ''; 
    }, 1000);
};

// ==========================================
// RENDER DOCUMENTI E SYLLABUS MULTIDOCENTE
// ==========================================
window.updateAll = function() {
    const courseId = window.getVal('cfg-corso', 'lav_basso');
    const c = window.DB_CORSI[courseId];
    if(!c || !c.prog) return;

    if (window.currentPrintModule === 'esame') {
        window.generaTest(courseId);
    }

    const dataInizioRaw = window.getVal('cfg-data-inizio');
    let dInizio = dataInizioRaw ? new Date(dataInizioRaw.split('-')[0], dataInizioRaw.split('-')[1] - 1, dataInizioRaw.split('-')[2]) : new Date();

    const dataEsameRaw = window.getVal('cfg-data-esame');
    let dataEsameStrFormatted = dataEsameRaw ? window.formatDataToItalian(dataEsameRaw) : "___/___/2026";
    
    let currentDay = new Date(dInizio.getTime()); 
    let dailyHours = 0;
    
    if(currentDay.getDay() === 6) currentDay.setDate(currentDay.getDate() + 2); 
    if(currentDay.getDay() === 0) currentDay.setDate(currentDay.getDate() + 1);

    let dateSummaryArr = [];
    let scheduleHtml = "";

    let docenti_ud = {};
    try { docenti_ud = JSON.parse(window.getVal('cfg-docenti-ud', '{}')); } catch(e) {}

    let primoDocenteNome = "Docente Formatore";

    c.prog.forEach((ud, index) => {
        let remainingUDHours = ud.ore;
        let udDates = []; 

        let docObj = window.docentiList.find(d => d.id === docenti_ud[ud.ud]);
        let nomeDocente = docObj ? docObj.nome_cognome : "Docente Non Assegnato";
        if(index === 0) primoDocenteNome = nomeDocente;

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
            dailyHours += hoursToAllocate; 
            remainingUDHours -= hoursToAllocate;
        }
        dateSummaryArr.push('<span class="font-bold text-slate-800">' + ud.ud + '</span>: ' + udDates.join(', '));
        
        // --- LOGICA AUTO-ADATTAMENTO TESTO SU UNA RIGA ---
        let dateStr = udDates.join(', '); // Unisce le date con una virgola
        let dl = dateStr.length;
        // Calcolo decrescente: più è lungo, più il font si restringe
        let dSize = dl > 45 ? '3.5px' : (dl > 35 ? '4.5px' : (dl > 25 ? '5.5px' : (dl > 15 ? '6.5px' : '8px')));

        let docL = nomeDocente.length;
        let docSize = docL > 45 ? '3.5px' : (docL > 35 ? '4.5px' : (docL > 25 ? '5.5px' : (docL > 15 ? '6.5px' : '8px')));

        let udL = ud.ud.length;
        let udSize = udL > 12 ? '5.5px' : '8px';

        scheduleHtml += `
        <tr>
            <td class="text-center font-bold p-1 border-b border-r border-slate-300 align-middle whitespace-nowrap overflow-hidden" style="font-size: ${dSize}; letter-spacing: -0.2px;">${dateStr}</td>
            <td class="text-center p-1 border-b border-r border-slate-300 align-middle font-bold text-slate-500 whitespace-nowrap overflow-hidden" style="font-size: ${udSize}; letter-spacing: -0.2px;">${ud.ud}</td>
            <td class="p-1 border-b border-r border-slate-300 align-top break-words whitespace-normal">
                <p class="font-bold text-slate-800 uppercase mb-0.5" style="font-size: 8px;">${ud.m}</p>
                <div class="text-slate-700 leading-tight text-justify italic opacity-90" style="font-size: 7.5px;">${ud.d}</div>
            </td>
            <td class="text-center p-1 border-b border-r border-slate-300 font-bold text-blue-700 align-middle uppercase whitespace-nowrap overflow-hidden" style="font-size: ${docSize}; letter-spacing: -0.2px;">${nomeDocente}</td>
            <td class="text-center font-bold p-1 border-b border-slate-300 align-middle break-words text-[8px]">${ud.ore} h</td>
        </tr>`;
    });

    document.querySelectorAll('.val-syllabus-table').forEach(el => el.innerHTML = scheduleHtml);

    // ========================================================
    // DEVIATORE LOGICO EROGATORE DIRETTO E LUOGO DI EMISSIONE
    // ========================================================
    const isAzienda = window.getVal('cfg-ente-erogatore') === 'azienda';
    const nomeErogatore = isAzienda ? window.getVal('cfg-azienda') : window.getVal('cfg-ente');
    
    // Algoritmo calcolo Città di Emissione
    let luogoEmissione = window.getVal('cfg-luogo-emissione');
    if (isAzienda) {
        let indAz = window.getVal('cfg-azienda-indirizzo');
        if (indAz) {
            let p = indAz.split(/,| - | -/);
            let rawCity = p[p.length - 1];
            luogoEmissione = rawCity.replace(/[0-9]/g, '').replace(/\([A-Za-z]{2}\)/g, '').trim();
        } else {
            luogoEmissione = "Sede Aziendale";
        }
    }
    if (!luogoEmissione) luogoEmissione = "---";
    document.querySelectorAll('.val-luogo-emissione').forEach(el => el.innerText = luogoEmissione);

    // ========================================================

    document.querySelectorAll('.val-erogatore').forEach(el => el.innerText = nomeErogatore || "---");
    document.querySelectorAll('.val-ente-indirizzo-dinamico').forEach(el => el.innerText = isAzienda ? window.getVal('cfg-azienda-indirizzo') : window.getVal('cfg-ente-indirizzo'));
    document.querySelectorAll('.val-ente-contatti-dinamico').forEach(el => el.innerText = isAzienda ? "Ateco: " + window.getVal('cfg-ateco') : window.getVal('cfg-ente-contatti'));
    
    document.querySelectorAll('.val-ruolo-firma-3').forEach(el => el.innerText = isAzienda ? "Il Datore di Lavoro" : "Il Legale Rappresentante dell'Ente");
    document.querySelectorAll('.val-firma-3-nome').forEach(el => el.innerText = isAzienda ? window.getVal('cfg-azienda-referente') : window.getVal('cfg-legale-nome'));
    
    document.querySelectorAll('.val-testo-timbro').forEach(el => el.innerHTML = isAzienda ? "TIMBRO<br>AZIENDA" : "TIMBRO<br>EROGATORE");


    const sedeToDisplay = window.getVal('cfg-sede-corso') || window.getVal('cfg-azienda-indirizzo') || "Sede Aziendale";

    document.querySelectorAll('.val-ente').forEach(el => el.innerText = window.getVal('cfg-ente'));
    document.querySelectorAll('.val-ente-indirizzo').forEach(el => el.innerText = window.getVal('cfg-ente-indirizzo'));
    document.querySelectorAll('.val-ente-contatti').forEach(el => el.innerText = window.getVal('cfg-ente-contatti'));
    document.querySelectorAll('.val-azienda').forEach(el => el.innerText = window.getVal('cfg-azienda'));
    document.querySelectorAll('.val-ateco').forEach(el => el.innerText = window.getVal('cfg-ateco'));
    document.querySelectorAll('.val-titolo-corso').forEach(el => el.innerText = c.t);
    document.querySelectorAll('.val-ore-corso').forEach(el => el.innerText = c.ore + " ORE");
    document.querySelectorAll('.val-codice').forEach(el => el.innerText = window.getVal('cfg-codice'));
    document.querySelectorAll('.val-sede-corso').forEach(el => el.innerText = sedeToDisplay); 
    document.querySelectorAll('.val-docente-main').forEach(el => el.innerText = primoDocenteNome); 
    document.querySelectorAll('.val-resp-progetto').forEach(el => el.innerText = window.getVal('cfg-legale-nome') || "Legale Rappresentante");
    document.querySelectorAll('.val-legale-nome').forEach(el => el.innerText = window.getVal('cfg-legale-nome'));
    document.querySelectorAll('.val-data-esame').forEach(el => el.innerText = dataEsameStrFormatted);
    document.querySelectorAll('.val-modalita').forEach(el => el.innerText = window.getVal('cfg-modalita', 'In Presenza Fisica'));
    document.querySelectorAll('.val-calendario').forEach(el => el.innerText = window.getVal('cfg-calendario'));
    document.querySelectorAll('.val-date-ud').forEach(el => el.innerHTML = dateSummaryArr.join('<br>'));

    // INIEZIONE DICITURA LEGALE DEDICATA A SECONDA DELL'EROGATORE (ATT.TO E PROGETTO FORMATIVO)
    document.querySelectorAll('.val-dicitura-legale').forEach(el => {
        if(isAzienda) {
            el.innerHTML = "Corso erogato in conformità a:<br><strong>" + (c.norma || "D.Lgs. 81/08 e Accordo Stato Regioni del 17 Aprile 2025") + "</strong><br><span class='text-blue-700 italic block mt-1'>Formazione erogata dal datore di lavoro ai propri lavoratori come da accordo Stato Regioni del 2025 rep. CSR N° 59 del 17 aprile 2025</span>";
        } else {
            el.innerHTML = "Corso erogato in conformità a:<br><strong>" + (c.norma || "D.Lgs. 81/08 e Accordo Stato Regioni del 17 Aprile 2025") + "</strong>";
        }
    });

    // INIEZIONE DICITURA HEADER TOP (SOLO ATTESTATO)
    let headerLegaleHtml = "";
    if (isAzienda) {
        headerLegaleHtml = "<p>Formazione erogata dal datore di lavoro ai propri lavoratori come da accordo Stato Regioni del 2025 rep. CSR N° 59 del 17 aprile 2025</p>";
    } else {
        headerLegaleHtml = "<p>Soggetto formatore ai sensi dell'Accordo Stato Regioni del 17 aprile 2025 (Rep. Atti n. 59/CSR)</p><p>Erogazione Diretta o tramite struttura di diretta emanazione</p>";
    }
    document.querySelectorAll('.val-header-legale').forEach(el => el.innerHTML = headerLegaleHtml);

    document.querySelectorAll('.val-data-inizio').forEach(el => {
        const di = window.getVal('cfg-data-inizio');
        if(di) {
            const p = di.split('-');
            el.innerText = p[2] + "/" + p[1] + "/" + p[0];
        } else el.innerText = "___/___/2026";
    });

    const logoUrl = window.getVal('cfg-logo');
    document.querySelectorAll('.logo-img').forEach(img => { 
        if(logoUrl && !isAzienda){ img.src=logoUrl; img.classList.remove('hidden'); } 
        else img.classList.add('hidden'); 
    });

    // ========================================================
    // LOGICA SCADENZA DINAMICA (DAL DB O CALCOLATA)
    // ========================================================
    if (window.currentSessionCorsisti && window.currentSessionCorsisti.length > 0) {
        const c1 = window.currentSessionCorsisti[0];
        document.querySelectorAll('.val-nome').forEach(el => el.innerText = c1.nome || "---");
        document.querySelectorAll('.val-nascita').forEach(el => el.innerText = c1.nascita || "---");
        document.querySelectorAll('.val-cf').forEach(el => el.innerText = c1.cf || "---");
        document.querySelectorAll('.val-cert-id').forEach(el => el.innerText = c1.id_certificato || "---");
        document.querySelectorAll('.val-mansione').forEach(el => el.innerText = c1.mansione || "N/D");
        
        let stringaScadenza = "Permanente (Senza Scadenza)";
        if (c.scad !== 99) {
            if (c1.data_scadenza) {
                let ds = new Date(c1.data_scadenza);
                stringaScadenza = ds.toLocaleDateString('it-IT') + " (Agg. ogni " + c.scad + " Anni)";
            } else if (dataEsameRaw) {
                let dEsame = new Date(dataEsameRaw);
                dEsame.setFullYear(dEsame.getFullYear() + c.scad);
                stringaScadenza = dEsame.toLocaleDateString('it-IT') + " (Agg. ogni " + c.scad + " Anni)";
            }
        }
        document.querySelectorAll('.val-scadenza').forEach(el => el.innerText = stringaScadenza);

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

// ==========================================
// LOGICA SCADENZIARIO (ALERT SYSTEM)
// ==========================================
window.allScadenzeList = [];

window.fetchScadenzeData = async function() {
    const { data, error } = await supabaseClient
        .from('iscrizioni')
        .select(`
            id,
            data_scadenza,
            id_certificato,
            corsisti (
                nome_cognome,
                aziende (
                    ragione_sociale,
                    referente
                )
            ),
            progetti (
                corso_id,
                data_esame
            )
        `)
        .not('data_scadenza', 'is', null)
        .order('data_scadenza', { ascending: true });

    if (error) {
        console.error("Errore recupero scadenze", error);
        return [];
    }
    return data || [];
};

window.loadScadenzeTable = async function() {
    const tbody = document.getElementById('tabella-scadenze');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-slate-400 italic"><i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto mb-2"></i> Caricamento scadenze in corso...</td></tr>';
    if(typeof lucide !== 'undefined') lucide.createIcons();

    if (window.allScadenzeList.length === 0) {
        window.allScadenzeList = await window.fetchScadenzeData();
    }

    window.renderScadenzeTable();
};

window.renderScadenzeTable = function() {
    const tbody = document.getElementById('tabella-scadenze');
    if(!tbody) return;

    const filterGiorni = parseInt(document.getElementById('filter-giorni').value, 10);
    const searchTxt = document.getElementById('search-scadenze').value.toLowerCase();

    const oggi = new Date();
    oggi.setHours(0,0,0,0);
    
    let targetDate = new Date(oggi);
    targetDate.setDate(targetDate.getDate() + filterGiorni);

    let filtered = window.allScadenzeList.filter(isc => {
        if(!isc.data_scadenza) return false;
        let dScad = new Date(isc.data_scadenza);
        if (filterGiorni !== 9999) {
            if (dScad > targetDate) return false;
        }
        return true;
    });

    if (searchTxt) {
        filtered = filtered.filter(isc => {
            const corsista = isc.corsisti?.nome_cognome?.toLowerCase() || '';
            const azienda = isc.corsisti?.aziende?.ragione_sociale?.toLowerCase() || '';
            const corsoId = isc.progetti?.corso_id || '';
            const nomeCorso = window.DB_CORSI[corsoId] ? window.DB_CORSI[corsoId].t.toLowerCase() : corsoId.toLowerCase();
            return corsista.includes(searchTxt) || azienda.includes(searchTxt) || nomeCorso.includes(searchTxt);
        });
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-slate-500 italic">Nessuna scadenza trovata per il periodo selezionato.</td></tr>';
        return;
    }

    let html = '';
    filtered.forEach(isc => {
        const corsista = isc.corsisti ? isc.corsisti.nome_cognome : 'Sconosciuto';
        const aziendaObj = isc.corsisti && isc.corsisti.aziende ? isc.corsisti.aziende : null;
        const azienda = aziendaObj ? aziendaObj.ragione_sociale : 'Privato';
        const contatti = aziendaObj && aziendaObj.referente ? aziendaObj.referente : 'Nessun recapito';
        
        const corsoId = isc.progetti ? isc.progetti.corso_id : '';
        const nomeCorso = window.DB_CORSI[corsoId] ? window.DB_CORSI[corsoId].t : corsoId;
        const dataEsame = isc.progetti && isc.progetti.data_esame ? window.formatDataToItalian(isc.progetti.data_esame) : '-';
        const dataScad = window.formatDataToItalian(isc.data_scadenza);

        let dScad = new Date(isc.data_scadenza);
        let timeDiff = dScad.getTime() - oggi.getTime();
        let daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        let statusBadge = '';
        if (daysDiff < 0) {
            statusBadge = `<span class="bg-red-100 text-red-700 px-2 py-1 rounded font-bold text-[9px] uppercase border border-red-200">Scaduto da ${Math.abs(daysDiff)} gg</span>`;
        } else if (daysDiff <= 30) {
            statusBadge = `<span class="bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold text-[9px] uppercase border border-orange-200">Scade tra ${daysDiff} gg</span>`;
        } else if (daysDiff <= 60) {
            statusBadge = `<span class="bg-amber-100 text-amber-700 px-2 py-1 rounded font-bold text-[9px] uppercase border border-amber-200">Scade tra ${daysDiff} gg</span>`;
        } else {
            statusBadge = `<span class="bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold text-[9px] uppercase border border-emerald-200">Attivo</span>`;
        }

        html += `
            <tr class="hover:bg-slate-50 border-b border-slate-100 transition-colors text-xs">
                <td class="p-3 font-bold text-slate-800">${corsista}</td>
                <td class="p-3 text-slate-600 font-semibold truncate max-w-[200px]" title="${nomeCorso}">${nomeCorso}</td>
                <td class="p-3 text-center text-slate-500 font-mono text-[10px]">${dataEsame}</td>
                <td class="p-3 text-center font-bold text-red-600 font-mono">${dataScad}<br><div class="mt-1">${statusBadge}</div></td>
                <td class="p-3 font-bold text-blue-900 text-[10px] uppercase">${azienda}</td>
                <td class="p-3 text-slate-500 text-[10px] italic">${contatti}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
    if(typeof lucide !== 'undefined') lucide.createIcons();
};

window.refreshScadenze = async function() {
    window.allScadenzeList = [];
    await window.loadScadenzeTable();
};

// ==========================================
// IMPORTAZIONE DATI STORICI DA BACKUP JSON
// ==========================================
window.importaBackupStorico = async function() {
    const fileInput = document.getElementById('import-file');
    if (!fileInput.files.length) return alert("Seleziona un file JSON di backup.");
    const file = fileInput.files[0];
    const reader = new FileReader();

    const btn = document.getElementById('btn-import');
    btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Importazione in corso...';
    btn.disabled = true;
    if(typeof lucide !== 'undefined') lucide.createIcons();

    reader.onload = async function(e) {
        try {
            const dati = JSON.parse(e.target.result);
            if (!Array.isArray(dati)) throw new Error("Il file deve contenere un array di oggetti validi.");

            const mapAziende = {}; 
            const mapDocenti = {}; 
            const mapCorsisti = {}; 
            const mapProgetti = {}; 

            const { data: exAz } = await supabaseClient.from('aziende').select('id, ragione_sociale');
            if(exAz) exAz.forEach(a => mapAziende[a.ragione_sociale] = a.id);

            const { data: exDoc } = await supabaseClient.from('docenti').select('id, nome_cognome');
            if(exDoc) exDoc.forEach(d => mapDocenti[d.nome_cognome] = d.id);

            const { data: exCor } = await supabaseClient.from('corsisti').select('id, cf');
            if(exCor) exCor.forEach(c => mapCorsisti[c.cf] = c.id);

            const { data: exProg } = await supabaseClient.from('progetti').select('id, codice');
            if(exProg) exProg.forEach(p => mapProgetti[p.codice] = p.id);

            let contatori = { aziende: 0, docenti: 0, corsisti: 0, progetti: 0, iscrizioni: 0 };

            for (const row of dati) {
                let nomeAz = row.azienda && row.azienda.trim() !== "" ? row.azienda.trim() : "Privato";
                if (nomeAz !== "Privato" && !mapAziende[nomeAz]) {
                    const { data } = await supabaseClient.from('aziende').insert([{
                        ragione_sociale: nomeAz,
                        ateco: row.ateco || "",
                        indirizzo: row.indirizzo_azienda || ""
                    }]).select();
                    if (data && data.length > 0) { mapAziende[nomeAz] = data[0].id; contatori.aziende++; }
                }

                let docsToProcess = [row.docente, row.resp_corso, row.resp_progetto];
                if (row.docenti_ud) docsToProcess = docsToProcess.concat(row.docenti_ud);
                
                for (const dName of docsToProcess) {
                    if (dName && dName.trim() !== "" && !mapDocenti[dName.trim()]) {
                        const { data } = await supabaseClient.from('docenti').insert([{
                            nome_cognome: dName.trim(),
                            qualifica: row.req_docente || "Formatore Qualificato (D.I. 6/3/2013)"
                        }]).select();
                        if (data && data.length > 0) { mapDocenti[dName.trim()] = data[0].id; contatori.docenti++; }
                    }
                }

                if (row.cf && !mapCorsisti[row.cf.toUpperCase()]) {
                    const azId = mapAziende[nomeAz] || null;
                    const { data } = await supabaseClient.from('corsisti').insert([{
                        cf: row.cf.toUpperCase(),
                        nome_cognome: row.nome.trim(),
                        luogo_data_nascita: row.nascita || "",
                        mansione_storica: row.mansione || "",
                        azienda_id: azId
                    }]).select();
                    if (data && data.length > 0) { mapCorsisti[row.cf.toUpperCase()] = data[0].id; contatori.corsisti++; }
                }
            }

            for (const row of dati) {
                if (row.codice && !mapProgetti[row.codice]) {
                    let azKey = row.azienda && row.azienda.trim() !== "" ? row.azienda.trim() : "Privato";
                    const azId = mapAziende[azKey] || null;
                    
                    let corsoId = 'lav_basso';
                    const nC = row.corso ? row.corso.toLowerCase() : "";
                    if (nC.includes('alto')) corsoId = 'lav_alto';
                    else if (nC.includes('medio')) corsoId = 'lav_medio';
                    else if (nC.includes('rls')) corsoId = 'rls';
                    else if (nC.includes('cantieri')) corsoId = 'mod_cantieri';
                    else if (nC.includes('preposto') && nC.includes('agg')) corsoId = 'agg_prep';
                    else if (nC.includes('preposto')) corsoId = 'preposto';
                    else if (nC.includes('dl spp') || nC.includes('rspp')) corsoId = 'dl_spp_comune';
                    else if (nC.includes('dirigente')) corsoId = 'dirigente';

                    let docJson = {};
                    if (row.docenti_ud && Array.isArray(row.docenti_ud)) {
                        row.docenti_ud.forEach((dName, idx) => {
                            docJson["UD" + (idx + 1)] = mapDocenti[dName.trim()] || "";
                        });
                    } else if (row.docente) {
                        docJson["UD1"] = mapDocenti[row.docente.trim()] || "";
                    }

                    const { data } = await supabaseClient.from('progetti').insert([{
                        codice: row.codice,
                        azienda_id: azId,
                        corso_id: corsoId,
                        modalita: row.modalita || "In Presenza Fisica",
                        data_inizio: row.data_inizio || null,
                        data_esame: row.data_esame || null,
                        ente_erogatore: row.ente && row.ente.includes("Azienda") ? "azienda" : "ente",
                        docente_principale: JSON.stringify(docJson),
                        calendario: row.calendario || ""
                    }]).select();

                    if (data && data.length > 0) { mapProgetti[row.codice] = data[0].id; contatori.progetti++; }
                }
            }

            for (const row of dati) {
                if (row.id_certificato) {
                    const progId = mapProgetti[row.codice];
                    const corId = mapCorsisti[row.cf ? row.cf.toUpperCase() : ""];
                    
                    if (progId && corId) {
                        const { data: exIsc } = await supabaseClient.from('iscrizioni').select('id').eq('id_certificato', row.id_certificato);
                        if (!exIsc || exIsc.length === 0) {
                            let dScadISO = null;
                            let corsoId = 'lav_basso';
                            const nC = row.corso ? row.corso.toLowerCase() : "";
                            if (nC.includes('alto')) corsoId = 'lav_alto';
                            else if (nC.includes('medio')) corsoId = 'lav_medio';
                            else if (nC.includes('rls')) corsoId = 'rls';
                            else if (nC.includes('cantieri')) corsoId = 'mod_cantieri';
                            else if (nC.includes('preposto') && nC.includes('agg')) corsoId = 'agg_prep';
                            else if (nC.includes('preposto')) corsoId = 'preposto';
                            else if (nC.includes('dl spp') || nC.includes('rspp')) corsoId = 'dl_spp_comune';
                            else if (nC.includes('dirigente')) corsoId = 'dirigente';
                            
                            const dbCorso = window.DB_CORSI ? window.DB_CORSI[corsoId] : null;
                            if (dbCorso && dbCorso.scad !== 99 && row.data_esame) {
                                let dEsame = new Date(row.data_esame);
                                dEsame.setFullYear(dEsame.getFullYear() + dbCorso.scad);
                                dScadISO = dEsame.toISOString().split('T')[0];
                            }

                            const { error } = await supabaseClient.from('iscrizioni').insert([{
                                progetto_id: progId,
                                corsista_id: corId,
                                id_certificato: row.id_certificato,
                                esito: "Idoneo",
                                data_scadenza: dScadISO
                            }]);
                            if (!error) contatori.iscrizioni++;
                        }
                    }
                }
            }

            alert(`Importazione completata con successo!\n\nSono stati importati e riallineati:\n- ${contatori.aziende} Aziende\n- ${contatori.docenti} Docenti\n- ${contatori.corsisti} Corsisti\n- ${contatori.progetti} Progetti Formativi\n- ${contatori.iscrizioni} Iscrizioni ed Attestati`);
            if(typeof window.loadDashboardStats === 'function') window.loadDashboardStats();

        } catch (err) {
            console.error(err);
            alert("Errore critico durante l'importazione: " + err.message);
        } finally {
            btn.innerHTML = '<i data-lucide="upload-cloud" class="w-5 h-5"></i> Avvia Importazione';
            btn.disabled = false;
            if(typeof lucide !== 'undefined') lucide.createIcons();
            fileInput.value = "";
        }
    };
    reader.readAsText(file);
};

// ==========================================
// GENERATORE DEI TEST E CORRETTORE
// ==========================================
window.generaTest = function(courseId) {
    let pool = [...(window.POOL_GENERALE || [])];
    if(courseId.includes('basso')) pool = pool.concat(window.POOL_BASSO || []);
    else if(courseId.includes('alto') || courseId.includes('medio')) pool = pool.concat(window.POOL_ALTO || []);
    else if(courseId.includes('dirigente') || courseId.includes('preposto') || courseId.includes('dl_')) pool = pool.concat(window.POOL_DIRIGENTI || []);
    else if(courseId.includes('cantieri') || courseId.includes('costruzioni')) pool = pool.concat(window.POOL_CANTIERI || []);
    else if(courseId.includes('attr_')) pool = pool.concat(window.POOL_ATTREZZATURE || []);
    else if(courseId.includes('soccorso')) pool = pool.concat(window.POOL_PS || []);
    else if(courseId.includes('antincendio')) pool = pool.concat(window.POOL_AI || []);

    pool = pool.sort(() => 0.5 - Math.random()).slice(0, 30);
    window.currentTestQuestions = pool;
    window.renderTest();
};

window.renderTest = function() {
    const container = document.getElementById('test-questions-container');
    if(!container) return;
    let html = '';
    window.currentTestQuestions.forEach((q, qIndex) => {
        html += `<div class="mb-2 break-inside-avoid">
            <p class="font-bold text-[8px] text-slate-800 mb-0.5 leading-tight">${qIndex + 1}. ${q.q}</p>
            <div class="space-y-0.5 ml-2">`;
        q.a.forEach((ans, aIndex) => {
            const isCorrect = window.correctorEnabled && aIndex === q.correct;
            const boxClass = isCorrect ? "bg-green-200 border-green-500 font-bold" : "border-slate-400";
            html += `<div class="flex items-start gap-1.5 text-[7.5px] leading-tight">
                <div class="w-2.5 h-2.5 border ${boxClass} rounded-sm shrink-0 flex items-center justify-center">${isCorrect ? 'X' : ''}</div>
                <span class="${isCorrect ? 'text-green-800 font-bold' : 'text-slate-700'}">${ans}</span>
            </div>`;
        });
        html += `</div></div>`;
    });
    container.innerHTML = html;
};

window.toggleCorrettore = function() {
    window.correctorEnabled = !window.correctorEnabled;
    window.renderTest();
};
