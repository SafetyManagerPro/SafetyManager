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
        if(await window.deleteAzienda(id)) {
            await window.loadAziendeTable();
        } else {
            alert("Errore durante l'eliminazione.");
        }
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
    } else {
        alert("Errore nel salvataggio del docente.");
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
    if(confirm("Sei sicuro di voler eliminare questo docente?")) {
        if(await window.deleteDocente(id)) {
            await window.loadDocentiTable();
        }
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
// LOGICA CRM: CORSISTI E ISCRIZIONI
// ==========================================
window.corsistiList = [];

window.loadCorsistiTable = async function() {
    const tbody = document.getElementById('tabella-corsisti');
    if(!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-slate-400 italic"><i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto mb-2"></i> Caricamento...</td></tr>';
    if(typeof lucide !== 'undefined') lucide.createIcons();
    
    window.aziendeList = await window.getAziende(); 

    const selectAzienda = document.getElementById('cor-azienda');
    if (selectAzienda) {
        let optHtml = '<option value="">-- Nessuna Azienda / Privato --</option>';
        window.aziendeList.forEach(az => { 
            optHtml += `<option value="${az.id}">${az.ragione_sociale}</option>`; 
        });
        selectAzienda.innerHTML = optHtml;
    }

    const { data, error } = await supabaseClient
        .from('corsisti')
        .select(`
            id,
            cf,
            nome_cognome,
            luogo_data_nascita,
            mansione_storica,
            azienda_id,
            aziende ( ragione_sociale ),
            iscrizioni (
                id_certificato,
                progetti (
                    corso_id,
                    data_esame
                )
            )
        `)
        .order('nome_cognome', { ascending: true });

    if (error) {
        console.error("Errore relazionale corsisti:", error);
        tbody.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-red-500 italic">Impossibile connettersi agli archivi.</td></tr>';
        return;
    }

    window.corsistiList = data || [];

    if (window.corsistiList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-slate-500 italic">Nessun corsista registrato.</td></tr>';
        return;
    }

    let html = '';
    window.corsistiList.forEach(cor => {
        const nomeAzienda = cor.aziende ? cor.aziende.ragione_sociale : '<span class="text-slate-400">Privato</span>';
        
        let corsiHtml = '<span class="text-slate-400 italic text-[10px]">Nessun corso</span>';
        let dateHtml = '<span class="text-slate-400 italic text-center text-[10px]">-</span>';
        
        if (cor.iscrizioni && cor.iscrizioni.length > 0) {
            let cArr = [];
            let dArr = [];
            cor.iscrizioni.forEach(isc => {
                if (isc.progetti) {
                    const cInfo = window.DB_CORSI[isc.progetti.corso_id];
                    const tCorso = cInfo ? cInfo.t : isc.progetti.corso_id;
                    const dFine = window.formatDataToItalian(isc.progetti.data_esame);
                    cArr.push(`<div class="font-medium text-slate-800 text-[11px] truncate max-w-[220px]" title="${tCorso}">&bull; ${tCorso}</div>`);
                    dArr.push(`<div class="font-mono text-slate-600 text-[10px]">${dFine}</div>`);
                }
            });
            if (cArr.length > 0) {
                corsiHtml = `<div class="space-y-1">${cArr.join('')}</div>`;
                dateHtml = `<div class="space-y-1">${dArr.join('')}</div>`;
            }
        }

        html += `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="p-3 border-b font-bold text-slate-800 text-xs">${cor.nome_cognome}</td>
                <td class="p-3 border-b font-mono text-[10px] text-slate-600">${cor.cf}</td>
                <td class="p-3 border-b text-[10px] text-slate-600">
                    <p class="font-bold text-slate-700">${cor.mansione_storica || '-'}</p>
                    <p class="text-[9px] text-blue-700 uppercase font-black mt-0.5 tracking-wider">${nomeAzienda}</p>
                </td>
                <td class="p-3 border-b">${corsiHtml}</td>
                <td class="p-3 border-b text-center">${dateHtml}</td>
                <td class="p-3 border-b text-center whitespace-nowrap">
                    <button onclick="window.modificaCorsista('${cor.id}')" class="text-blue-600 hover:bg-blue-200 bg-blue-100 p-1.5 rounded transition shadow-sm"><i data-lucide="edit" class="w-3.5 h-3.5"></i></button>
                    <button onclick="window.eliminaCorsistaData('${cor.id}')" class="text-red-600 hover:bg-red-200 bg-red-100 p-1.5 rounded transition shadow-sm ml-1"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
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
    } else {
        alert("Errore nel salvataggio. Assicurati che il Codice Fiscale non sia già registrato.");
    }
};

window.modificaCorsista = function(id) {
    const cor = window.corsistiList.find(c => c.id === id);
    if(!cor) return;
    
    document.getElementById('cor-id').value = cor.id;
    document.getElementById('cor-nome').value = cor.nome_cognome;
    document.getElementById('cor-cf').value = cor.cf;
    document.getElementById('cor-nascita').value = cor.luogo_data_nascita;
    if(document.getElementById('cor-mansione')) {
        document.getElementById('cor-mansione').value = cor.mansione_storica || "";
    }
    document.getElementById('cor-azienda').value = cor.azienda_id || "";
};

window.eliminaCorsistaData = async function(id) {
    if(confirm("Sicuro di voler eliminare questo corsista? Tutti i suoi attestati e le iscrizioni verranno perse irreversibilmente.")) {
        if(await window.deleteCorsistaData(id)) {
            await window.loadCorsistiTable();
        }
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
// POPUPS (QUICK ADD) LOGIC
// ==========================================

// QUICK ADD AZIENDA
window.apriQAAzienda = function() {
    document.getElementById('qa-modal-azienda').classList.remove('hidden');
    document.getElementById('qa-az-rag').focus();
};

window.chiudiQAAzienda = function() {
    document.getElementById('qa-modal-azienda').classList.add('hidden');
    document.getElementById('qa-az-rag').value = '';
    document.getElementById('qa-az-piva').value = '';
};

window.salvaQAAzienda = async function() {
    const rag = document.getElementById('qa-az-rag').value.trim();
    const piva = document.getElementById('qa-az-piva').value.trim();
    if (!rag) return alert("Inserisci la Ragione Sociale.");
    
    const { data, error } = await supabaseClient
        .from('aziende')
        .insert([{ ragione_sociale: rag, piva_cf: piva }])
        .select();
        
    if (error) return alert("Errore nel salvataggio azienda: " + error.message);
    
    window.aziendeList = await window.getAziende();
    
    const selAzienda = document.getElementById('prog-azienda');
    if(selAzienda) {
        let optHtml = '<option value="">-- Seleziona Azienda --</option>';
        window.aziendeList.forEach(a => { 
            optHtml += `<option value="${a.id}">${a.ragione_sociale}</option>`; 
        });
        selAzienda.innerHTML = optHtml;
        selAzienda.value = data[0].id; 
        window.calcolaDettagliProgetto();
    }
    window.chiudiQAAzienda();
};

// QUICK ADD CORSO CUSTOM
window.apriQACorso = function() {
    document.getElementById('qa-modal-corso').classList.remove('hidden');
    document.getElementById('qa-co-titolo').focus();
};

window.chiudiQACorso = function() {
    document.getElementById('qa-modal-corso').classList.add('hidden');
    document.getElementById('qa-co-titolo').value = '';
};

window.salvaQACorso = function() {
    const tit = document.getElementById('qa-co-titolo').value.trim();
    const ore = parseInt(document.getElementById('qa-co-ore').value);
    const scad = parseInt(document.getElementById('qa-co-scad').value);
    
    if(!tit || isNaN(ore)) return alert("Compila i campi obbligatori del corso.");
    
    const customId = 'custom_' + Date.now();
    
    // Inietta il corso nella memoria DB_CORSI
    window.DB_CORSI[customId] = {
        t: tit, ore: ore, scad: scad, risk: "CUSTOM", code: "CST", norma: "Progetto Formativo Personalizzato Aziendale",
        prog: [{ ud: "UD1", ore: ore, m: "Modulo Formativo Dedicato", d: "Contenuti definiti dal Docente Formatore in relazione allo specifico fabbisogno formativo ed ai rischi identificati nel DVR." }]
    };
    
    const selCorso = document.getElementById('prog-corso');
    if(selCorso) {
        const opt = document.createElement('option');
        opt.value = customId;
        opt.innerHTML = `*NUOVO* ${tit} (${ore}h)`;
        opt.style.fontWeight = "bold";
        opt.style.color = "#d97706";
        selCorso.appendChild(opt);
        selCorso.value = customId; 
        window.calcolaDettagliProgetto();
    }
    window.chiudiQACorso();
};

// QUICK ADD CORSISTA 
window.apriQACorsista = function() {
    document.getElementById('qa-modal-corsista').classList.remove('hidden');
    const p = window.progettiList.find(x => x.id === window.currentProgettoId);
    if(p && p.azienda_id) {
        document.getElementById('qa-cor-azienda-id').value = p.azienda_id;
    } else {
        document.getElementById('qa-cor-azienda-id').value = "";
    }
    document.getElementById('qa-cor-nome').focus();
};

window.chiudiQACorsista = function() {
    document.getElementById('qa-modal-corsista').classList.add('hidden');
    document.getElementById('qa-cor-nome').value = '';
    document.getElementById('qa-cor-cf').value = '';
    document.getElementById('qa-cor-nascita').value = '';
};

window.salvaQACorsista = async function() {
    const nome = document.getElementById('qa-cor-nome').value.trim();
    const cf = document.getElementById('qa-cor-cf').value.trim().toUpperCase();
    const nascita = document.getElementById('qa-cor-nascita').value.trim();
    const az_id = document.getElementById('qa-cor-azienda-id').value || null;
    
    if(!nome || !cf) return alert("Inserisci Nome e CF.");
    
    const { data, error } = await supabaseClient.from('corsisti').insert([{
        nome_cognome: nome, cf: cf, luogo_data_nascita: nascita, azienda_id: az_id
    }]).select();
    
    if (error) return alert("Errore: " + error.message + " (CF già esistente?)");
    
    window.corsistiList = await window.getCorsisti();
    
    const p = window.progettiList.find(x => x.id === window.currentProgettoId);
    const sel = document.getElementById('sel-iscrivi-corsista');
    if(sel && p) {
        let opts = '<option value="">-- Seleziona Corsista da aggiungere --</option>';
        window.corsistiList.forEach(c => {
            const marker = c.azienda_id === p.azienda_id ? "📌 " : "";
            opts += `<option value="${c.id}">${marker}${c.nome_cognome} (${c.cf})</option>`;
        });
        sel.innerHTML = opts;
        sel.value = data[0].id; 
    }
    window.chiudiQACorsista();
};



// ==========================================
// HELPERS COMPLIANCE E NORMALIZZAZIONE DATI
// ==========================================
window.parseJSONSafe = function(value, fallback = {}) {
    if (!value) return fallback;
    if (typeof value === 'object') return value;
    try { return JSON.parse(value); } catch(e) { return fallback; }
};

window.DEFAULT_ENTE_VALIDATORE = "CNA Artigiani Imprenditori D'Italia Avellino";
window.DEFAULT_OP_DESTINATARIO = "OPTA Avellino / OPRA Campania";

window.getDefaultEnteValidatore = function() {
    return window.DEFAULT_ENTE_VALIDATORE;
};

window.labelEsitoValidazioneCNA = function(value) {
    const labels = {
        da_valutare: 'Da valutare da CNA',
        validato: 'Validato',
        validato_con_prescrizioni: 'Validato con prescrizioni/integrazioni',
        non_validato: 'Non validato - da rivedere'
    };
    return labels[value] || value || '---';
};

window.labelEsitoOP = function(value) {
    const labels = {
        validazione_ente_in_corso: 'Valutazione percorso in carico a CNA',
        validazione_ente_completata: 'Percorso validato da CNA - da comunicare a OPRA/OPTA',
        comunicazione_op_inviata: 'Comunicazione inviata a OPRA/OPTA',
        riscontro_ricevuto: 'Riscontro OPRA/OPTA ricevuto - indicazioni recepite',
        richiesta_inviata: 'Richiesta inviata - decorrenza 15 giorni',
        op_non_presente: 'OP non presente / non individuato',
        non_applicabile: 'Non applicabile'
    };
    return labels[value] || value || '---';
};

window.syncValidazioneCNAUI = function() {
    const erogatore = document.getElementById('prog-erogatore') ? document.getElementById('prog-erogatore').value : 'ente';
    const box = document.getElementById('prog-validazione-cna-box');
    const isAzienda = erogatore === 'azienda';
    if (box) {
        box.classList.toggle('ring-2', isAzienda);
        box.classList.toggle('ring-emerald-400', isAzienda);
        box.classList.toggle('opacity-70', !isAzienda);
    }
    const enteVal = document.getElementById('prog-ente-validatore');
    if (enteVal && !enteVal.value) enteVal.value = window.getDefaultEnteValidatore();
    const opDest = document.getElementById('prog-op-destinatario');
    if (opDest && !opDest.value) opDest.value = window.DEFAULT_OP_DESTINATARIO;
};

window.getDocentiUdFromForm = function() {
    const docenti_ud = {};
    document.querySelectorAll('.prog-docente-ud').forEach(sel => {
        docenti_ud[sel.getAttribute('data-ud')] = sel.value;
    });
    return docenti_ud;
};

window.renderComplianceProgetto = function(corsoId) {
    const box = document.getElementById('prog-compliance-list');
    if (!box) return;
    const erogatore = document.getElementById('prog-erogatore') ? document.getElementById('prog-erogatore').value : 'ente';
    const modalita = document.getElementById('prog-modalita') ? document.getElementById('prog-modalita').value : '';
    const policy = window.ASR2025_POLICY || {};
    const info = window.getCourseCompliance ? window.getCourseCompliance(corsoId, modalita, erogatore) : { note: [] };
    let notes = [...(info.note || [])];
    if (erogatore === 'azienda') {
        notes.unshift("Validazione percorso: CNA Artigiani Imprenditori D'Italia Avellino valuta programma, docenza, durata, destinatari, aula/campo prova e cura comunicazione a OPTA Avellino / OPRA Campania.");
        notes.unshift(policy.notaAzienda || 'Erogazione diretta aziendale: ammessa solo per propri lavoratori, preposti e dirigenti.');
    } else {
        notes.unshift(policy.notaEnte || 'Verificare requisiti del soggetto formatore / diretta emanazione.');
    }
    box.innerHTML = notes.map(n => `<li>${n}</li>`).join('');

    const erogatoreNote = document.getElementById('prog-erogatore-note');
    if (erogatoreNote) {
        erogatoreNote.innerText = erogatore === 'azienda'
            ? 'Erogazione diretta: il datore di lavoro è soggetto formatore e può iscrivere solo persone della propria azienda. Compilare la sezione Organismi Paritetici se pertinente.'
            : 'Erogazione da associazione/ente: conservare requisiti, eventuale autocertificazione DPR 445/2000 e catena di diretta emanazione.';
    }

    const opBox = document.getElementById('prog-op-box');
    if (opBox) opBox.classList.toggle('ring-2', erogatore === 'azienda');
    if (typeof window.syncValidazioneCNAUI === 'function') window.syncValidazioneCNAUI();
};

window.getComplianceNotaDocumento = function(courseId, isAzienda) {
    const c = window.DB_CORSI[courseId] || {};
    const modalita = window.AppState ? (window.AppState['cfg-modalita'] || '') : '';
    const erogatore = isAzienda ? 'azienda' : 'ente';
    const info = window.getCourseCompliance ? window.getCourseCompliance(courseId, modalita, erogatore) : { note: [] };
    const erogazione = isAzienda
        ? "Il corso è organizzato dal datore di lavoro come soggetto formatore esclusivamente per i propri lavoratori/preposti/dirigenti; la valutazione/validazione del percorso è curata da CNA Artigiani Imprenditori D'Italia Avellino, con comunicazione all'organismo paritetico dell'artigianato competente (OPTA/OPRA Campania). Restano obbligatori docenti qualificati, registro presenze, verifica finale e fascicolo."
        : 'Il corso è erogato da associazione sindacale di categoria/struttura di diretta emanazione in qualità di soggetto formatore; conservare evidenza dei requisiti di rappresentatività o relativa autocertificazione DPR 445/2000.';
    const base = [
        erogazione,
        'Per il corso è individuato un unico soggetto formatore responsabile.',
        'Organizzazione: max 30 discenti salvo e-learning, frequenza minima 90% per ammissione alla verifica finale, verbale finale e attestato univoco.',
        'Fascicolo: conservazione presso il soggetto formatore per almeno 10 anni con dati partecipanti, registro firme, docenti, progetto/programma e verbale finale.',
        'Omogeneità aula: verificare coerenza tra mansioni, settore, rischi trattati e contenuti specifici del corso.'
    ];
    if (info.pratico) base.push('Per le parti pratiche: rapporto docente/discente non superiore a 1:6 e verifica di idoneità di area, attrezzature e DPI.');
    if (c && c.scad && c.scad !== 99) base.push('Aggiornamento/scadenza gestita sul profilo corso: ' + c.scad + ' anni dalla verifica finale, salvo modifiche di mansione/rischio o norme speciali.');
    return base.join(' ');
};

// ==========================================
// MOTORE DI CALCOLO AUTOMATICO GIORNI E DOCENTI
// ==========================================
window.calcolaDettagliProgetto = function() {
    const corsoId = document.getElementById('prog-corso').value;
    window.renderComplianceProgetto(corsoId);
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

    const siglaCorso = c.code || 'CRS';

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

    const filterSelect = document.getElementById('filter-corso-tipo');
    if(filterSelect) {
        let optHtml = '<option value="">-- Mostra tutti i corsi --</option>';
        const corsiEntries = window.getActiveCorsiEntries ? window.getActiveCorsiEntries() : Object.entries(window.DB_CORSI || {}).filter(([_, c]) => !c.deprecated);
        for(const [key, c] of corsiEntries) {
            optHtml += `<option value="${key}">[${c.code}] ${c.t}</option>`;
        }
        filterSelect.innerHTML = optHtml;
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
        const siglaCorso = window.DB_CORSI[p.corso_id] ? window.DB_CORSI[p.corso_id].code : '';
        const erogatoreBadge = (p.ente_erogatore === 'azienda')
            ? '<span class="inline-block mt-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-black text-[8px] uppercase">DL soggetto formatore</span>'
            : '<span class="inline-block mt-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-black text-[8px] uppercase">Associazione / ente</span>';
        
        html += `
            <tr class="hover:bg-amber-50 transition-colors" data-corso="${p.corso_id}">
                <td class="p-3 border-b font-mono font-bold text-[10px] text-slate-800">${p.codice}</td>
                <td class="p-3 border-b">
                    <p class="font-bold text-xs text-blue-900"><span class="text-slate-400 font-mono text-[9px]">[${siglaCorso}]</span> ${nomeCorso}</p>
                    <p class="text-[9px] text-slate-500 uppercase mt-0.5">${nomeAzienda}</p>${erogatoreBadge}
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

window.filtraProgetti = function() {
    const textFilter = document.getElementById('search-progetti').value.toLowerCase();
    const typeFilter = document.getElementById('filter-corso-tipo').value;
    const rows = document.getElementById('tabella-progetti').getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        if (rows[i].cells.length === 1) continue; 
        
        const rowText = rows[i].innerText.toLowerCase();
        const rowCorsoId = rows[i].getAttribute('data-corso') || "";

        const matchText = rowText.includes(textFilter);
        const matchType = typeFilter === "" || rowCorsoId === typeFilter;

        if (matchText && matchType) {
            rows[i].style.display = "";
        } else {
            rows[i].style.display = "none";
        }
    }
};

window.salvaProgettoDB = async function() {
    const id = document.getElementById('prog-id').value;
    const aziendaId = document.getElementById('prog-azienda').value;
    const corsoId = document.getElementById('prog-corso').value;
    const erogatore = document.getElementById('prog-erogatore') ? document.getElementById('prog-erogatore').value : 'ente';
    const sede = (document.getElementById('prog-sede')?.value || '').trim();
    const modalita = document.getElementById('prog-modalita').value;
    const opEsito = document.getElementById('prog-op-esito') ? document.getElementById('prog-op-esito').value : '';
    const opInvio = document.getElementById('prog-op-invio') ? document.getElementById('prog-op-invio').value : null;
    const opRisposta = document.getElementById('prog-op-risposta') ? document.getElementById('prog-op-risposta').value : null;
    const omogeneitaAula = document.getElementById('prog-omogeneita-aula') ? document.getElementById('prog-omogeneita-aula').checked : true;
    const complianceNote = (document.getElementById('prog-compliance-note-free')?.value || '').trim();
    const enteValidatore = (document.getElementById('prog-ente-validatore')?.value || window.getDefaultEnteValidatore()).trim();
    const validazioneEsito = document.getElementById('prog-validazione-esito') ? document.getElementById('prog-validazione-esito').value : '';
    const validazioneData = document.getElementById('prog-validazione-data') ? document.getElementById('prog-validazione-data').value : null;
    const comunicazioneOpData = document.getElementById('prog-op-comunicazione') ? document.getElementById('prog-op-comunicazione').value : null;
    const opDestinatario = (document.getElementById('prog-op-destinatario')?.value || window.DEFAULT_OP_DESTINATARIO).trim();
    const validazioneNote = (document.getElementById('prog-validazione-note')?.value || '').trim();

    if (!aziendaId) return alert("Seleziona l\'azienda committente prima di salvare il progetto.");
    if (!corsoId) return alert('Seleziona una tipologia di corso.');
    if (!document.getElementById('prog-inizio').value) return alert('Inserisci la data di inizio.');
    if (!sede) return alert('Inserisci la sede del corso/aula/campo prova: è necessaria per verbale, registro e attestati.');

    const modalitaCheck = window.getModalitaCompliance ? window.getModalitaCompliance(corsoId, modalita) : { ok: true };
    if (!modalitaCheck.ok) return alert('Modalità non coerente con il corso selezionato: ' + modalitaCheck.message);
    if (erogatore === 'azienda' && !enteValidatore) {
        return alert('Per il datore di lavoro soggetto formatore indica l’ente/associazione che valida il percorso formativo.');
    }
    if (erogatore === 'azienda' && !validazioneEsito) {
        return alert('Per il datore di lavoro soggetto formatore indica lo stato della validazione CNA del percorso formativo.');
    }
    if (erogatore === 'azienda' && (validazioneEsito === 'validato' || validazioneEsito === 'validato_con_prescrizioni') && !validazioneData) {
        return alert('Inserisci la data di validazione del percorso da parte di CNA Avellino.');
    }
    if (erogatore === 'azienda' && !opEsito) {
        return alert('Per erogazione diretta aziendale indica lo stato della comunicazione/iter verso OPRA/OPTA.');
    }
    if (erogatore === 'azienda' && (opEsito === 'comunicazione_op_inviata' || opEsito === 'riscontro_ricevuto') && !comunicazioneOpData && !opInvio) {
        return alert('Inserisci la data di comunicazione a OPRA/OPTA.');
    }
    if (erogatore === 'azienda' && opEsito === 'richiesta_inviata' && !opInvio) {
        return alert('Inserisci la data di invio della richiesta/comunicazione agli Organismi Paritetici.');
    }
    if (!omogeneitaAula && !complianceNote) {
        return alert('Se l’aula non è omogenea, inserisci una nota che spieghi come sono stati adattati contenuti e rischi trattati.');
    }

    let cod = document.getElementById('prog-codice').value.trim();
    if(!cod) {
        const d = new Date();
        cod = `PRG-${d.getFullYear()}-${Math.floor(1000 + Math.random()*9000)}`;
    }

    const docenti_ud = window.getDocentiUdFromForm();
    const missingDocenti = Object.keys(docenti_ud).filter(ud => !docenti_ud[ud]);
    if (missingDocenti.length > 0) {
        return alert('Assegna un docente qualificato a tutte le unità didattiche: ' + missingDocenti.join(', '));
    }

    const record = {
        azienda_id: aziendaId,
        corso_id: corsoId,
        codice: cod,
        modalita: modalita,
        data_inizio: document.getElementById('prog-inizio').value,
        data_esame: document.getElementById('prog-esame').value,
        sede: sede,
        resp_progetto: (document.getElementById('prog-resp-progetto')?.value || '').trim(),
        resp_corso: (document.getElementById('prog-resp-corso')?.value || '').trim(),
        ente_erogatore: erogatore,
        docente_principale: JSON.stringify(docenti_ud), // retrocompatibilità con i template esistenti
        docenti_ud: docenti_ud,
        calendario: document.getElementById('prog-calendario-testo').value,
        richiesta_op_inviata_at: opInvio || null,
        risposta_op_at: opRisposta || null,
        esito_richiesta_op: opEsito || null,
        compliance_note: complianceNote || null,
        omogeneita_aula: omogeneitaAula,
        modalita_verificata: modalitaCheck.ok,
        versione_normativa: 'ASR 17/04/2025 Rep. 59/CSR',
        ente_validatore: erogatore === 'azienda' ? enteValidatore : null,
        ente_validatore_tipo: erogatore === 'azienda' ? 'associazione_datoriale_cna_opta_campania' : null,
        validazione_ente_esito: erogatore === 'azienda' ? validazioneEsito : null,
        validazione_ente_at: erogatore === 'azienda' ? (validazioneData || null) : null,
        comunicazione_op_at: erogatore === 'azienda' ? (comunicazioneOpData || opInvio || null) : null,
        organismo_destinatario: erogatore === 'azienda' ? opDestinatario : null,
        note_validazione_ente: erogatore === 'azienda' ? (validazioneNote || null) : null
    };
    if (id && id !== "") record.id = id;

    if (await window.saveProgetto(record)) {
        window.resetFormProgetto();
        await window.loadProgettiTable();
    } else alert("Errore nel salvataggio del progetto formativo. Verifica di aver applicato tutte le migration Supabase, inclusa quella Step 5 per validazione CNA/OPTA.");
};

window.modificaProgetto = function(id) {
    const p = window.progettiList.find(x => x.id === id);
    if(!p) return;
    document.getElementById('prog-id').value = p.id;
    document.getElementById('prog-azienda').value = p.azienda_id || '';
    if(document.getElementById('prog-erogatore')) document.getElementById('prog-erogatore').value = p.ente_erogatore || 'ente';
    document.getElementById('prog-corso').value = p.corso_id || '';
    document.getElementById('prog-codice').value = p.codice || '';
    document.getElementById('prog-modalita').value = p.modalita || 'In Presenza Fisica';
    document.getElementById('prog-inizio').value = p.data_inizio || '';
    document.getElementById('prog-esame').value = p.data_esame || '';
    if(document.getElementById('prog-sede')) document.getElementById('prog-sede').value = p.sede || '';
    if(document.getElementById('prog-resp-progetto')) document.getElementById('prog-resp-progetto').value = p.resp_progetto || '';
    if(document.getElementById('prog-resp-corso')) document.getElementById('prog-resp-corso').value = p.resp_corso || '';
    if(document.getElementById('prog-op-invio')) document.getElementById('prog-op-invio').value = p.richiesta_op_inviata_at || '';
    if(document.getElementById('prog-op-risposta')) document.getElementById('prog-op-risposta').value = p.risposta_op_at || '';
    if(document.getElementById('prog-op-esito')) document.getElementById('prog-op-esito').value = p.esito_richiesta_op || '';
    if(document.getElementById('prog-compliance-note-free')) document.getElementById('prog-compliance-note-free').value = p.compliance_note || '';
    if(document.getElementById('prog-ente-validatore')) document.getElementById('prog-ente-validatore').value = p.ente_validatore || window.getDefaultEnteValidatore();
    if(document.getElementById('prog-validazione-esito')) document.getElementById('prog-validazione-esito').value = p.validazione_ente_esito || '';
    if(document.getElementById('prog-validazione-data')) document.getElementById('prog-validazione-data').value = p.validazione_ente_at || '';
    if(document.getElementById('prog-op-comunicazione')) document.getElementById('prog-op-comunicazione').value = p.comunicazione_op_at || '';
    if(document.getElementById('prog-op-destinatario')) document.getElementById('prog-op-destinatario').value = p.organismo_destinatario || window.DEFAULT_OP_DESTINATARIO;
    if(document.getElementById('prog-validazione-note')) document.getElementById('prog-validazione-note').value = p.note_validazione_ente || '';
    if(document.getElementById('prog-omogeneita-aula')) document.getElementById('prog-omogeneita-aula').checked = p.omogeneita_aula !== false;

    window.calcolaDettagliProgetto(); 
    
    setTimeout(() => {
        const parsedDocs = window.parseJSONSafe(p.docenti_ud || p.docente_principale || '{}', {});
        document.querySelectorAll('.prog-docente-ud').forEach(sel => {
            let ud = sel.getAttribute('data-ud');
            if(parsedDocs[ud]) sel.value = parsedDocs[ud];
        });
    }, 100);
};

window.eliminaProgetto = async function(id) {
    if(confirm("Sei sicuro di voler cancellare questo corso?")) {
        if(await window.deleteProgetto(id)) {
            await window.loadProgettiTable();
        }
    }
};

window.resetFormProgetto = function() {
    document.getElementById('prog-id').value = "";
    document.getElementById('form-progetto').reset();
    const prev = document.getElementById('prog-docenti-container');
    if(prev) prev.innerHTML = '<span class="text-xs text-slate-400 italic">Seleziona un corso per caricare le unità didattiche...</span>';
    const comp = document.getElementById('prog-compliance-list');
    if(comp) comp.innerHTML = '<li>Seleziona corso e data per generare calendario, scadenza e vincoli.</li>';
    const lbl = document.getElementById('lbl-prog-scadenza');
    if(lbl) lbl.innerText = '---';
    if(document.getElementById('prog-ente-validatore')) document.getElementById('prog-ente-validatore').value = window.getDefaultEnteValidatore();
    if(document.getElementById('prog-op-destinatario')) document.getElementById('prog-op-destinatario').value = window.DEFAULT_OP_DESTINATARIO;
    if(typeof window.syncValidazioneCNAUI === 'function') window.syncValidazioneCNAUI();
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
    if (!p || !c) return alert('Dati progetto/corsista non disponibili. Ricarica la pagina.');

    const corsoInfo = window.DB_CORSI[p.corso_id];
    const iscrittiEsistenti = await window.getIscrizioni(window.currentProgettoId);

    if (iscrittiEsistenti.some(isc => isc.corsista_id === corsista_id)) {
        return alert("L'allievo è già iscritto a questo progetto.");
    }

    const isELearning = (p.modalita || '').toLowerCase().includes('learning');
    if (!isELearning && iscrittiEsistenti.length >= (window.ASR2025_POLICY?.maxDiscentiAula || 30)) {
        return alert('Limite massimo di 30 discenti raggiunto per corsi non e-learning. Crea un nuovo progetto/corso.');
    }

    if (p.ente_erogatore === 'azienda' && c.azienda_id !== p.azienda_id) {
        return alert('Erogazione diretta aziendale: puoi iscrivere solo corsisti appartenenti alla stessa azienda del progetto.');
    }

    let dataScadenzaISO = null;
    if (corsoInfo && corsoInfo.scad !== 99) {
        let dScad = new Date(p.data_esame);
        dScad.setFullYear(dScad.getFullYear() + corsoInfo.scad);
        const offsetDate = new Date(dScad.getTime() - (dScad.getTimezoneOffset() * 60000));
        dataScadenzaISO = offsetDate.toISOString().split('T')[0];
    }

    const annoCert = new Date(p.data_esame || Date.now()).getFullYear().toString().slice(-2);
    const cfPart = (c.cf || 'XXXXXX').replace(/[^A-Z0-9]/gi, '').toUpperCase().substring(0,6).padEnd(6, 'X');
    const seriale = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    const id_cert = `C${annoCert}-${p.codice}-${cfPart}-${seriale}`;

    const record = {
        progetto_id: window.currentProgettoId,
        corsista_id: corsista_id,
        id_certificato: id_cert,
        mansione_storica: c.mansione_storica || null,
        esito: "Idoneo",
        data_scadenza: dataScadenzaISO 
    };

    if(await window.saveIscrizione(record)) {
        await window.loadIscrittiTable();
    } else {
        alert("Errore. L'allievo potrebbe essere già iscritto o il numero certificato potrebbe essere duplicato.");
    }
};

window.rimuoviIscrizione = async function(id) {
    if(confirm("Rimuovere l'allievo dal corso?")) {
        if(await window.deleteIscrizione(id)) {
            await window.loadIscrittiTable();
        }
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
    const filterSelect = document.getElementById('filter-stampe-corso');
    if(!filterSelect) return;
    
    window.progettiList = await window.getProgetti();
    
    window.progettiList.sort((a, b) => {
        let da = new Date(a.data_esame || '1970-01-01').getTime();
        let db = new Date(b.data_esame || '1970-01-01').getTime();
        return db - da; 
    });
    
    let optHtml = '<option value="">-- Mostra tutti i corsi --</option>';
    const corsiEntries = window.getActiveCorsiEntries ? window.getActiveCorsiEntries() : Object.entries(window.DB_CORSI || {}).filter(([_, c]) => !c.deprecated);
    for(const [key, c] of corsiEntries) {
        optHtml += `<option value="${key}">[${c.code}] ${c.t}</option>`;
    }
    filterSelect.innerHTML = optHtml;

    window.filtraStampe();
};

window.filtraStampe = function() {
    const selProg = document.getElementById('stampa-progetto');
    const filterVal = document.getElementById('filter-stampe-corso').value;
    
    if(!selProg) return;

    let html = '<option value="">-- Seleziona un progetto --</option>';
    
    window.progettiList.forEach(p => {
        if (filterVal !== "" && p.corso_id !== filterVal) return; 

        const azName = p.aziende ? p.aziende.ragione_sociale : 'Privato';
        const dateStr = window.formatDataToItalian(p.data_esame);
        html += `<option value="${p.id}">${p.codice} - ${azName} (${dateStr})</option>`;
    });
    
    selProg.innerHTML = html;
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
    window.AppState['cfg-docenti-ud'] = JSON.stringify(window.parseJSONSafe(p.docenti_ud || p.docente_principale || '{}', {}));
    window.AppState['cfg-calendario'] = p.calendario || ""; 
    window.AppState['cfg-resp-progetto'] = p.resp_progetto || "";
    window.AppState['cfg-resp-corso'] = p.resp_corso || "";
    window.AppState['cfg-op-invio'] = p.richiesta_op_inviata_at || "";
    window.AppState['cfg-op-risposta'] = p.risposta_op_at || "";
    window.AppState['cfg-op-esito'] = p.esito_richiesta_op || "";
    window.AppState['cfg-compliance-note-free'] = p.compliance_note || "";
    window.AppState['cfg-omogeneita-aula'] = p.omogeneita_aula === false ? "NO" : "SI";
    window.AppState['cfg-ente-validatore'] = p.ente_validatore || window.getDefaultEnteValidatore();
    window.AppState['cfg-validazione-esito'] = p.validazione_ente_esito || "";
    window.AppState['cfg-validazione-data'] = p.validazione_ente_at || "";
    window.AppState['cfg-op-comunicazione'] = p.comunicazione_op_at || "";
    window.AppState['cfg-op-destinatario'] = p.organismo_destinatario || window.DEFAULT_OP_DESTINATARIO;
    window.AppState['cfg-validazione-note'] = p.note_validazione_ente || "";

    window.currentProgettoStampaId = progId;
    window.currentSessionCorsisti = iscritti.map(isc => ({
        iscrizione_id: isc.id,
        corsista_id: isc.corsista_id,
        nome: isc.corsisti.nome_cognome,
        cf: isc.corsisti.cf,
        nascita: isc.corsisti.luogo_data_nascita,
        mansione: isc.mansione_storica || isc.corsisti.mansione_storica || "N/D",
        id_certificato: isc.id_certificato,
        data_scadenza: isc.data_scadenza,
        ore_frequentate: isc.ore_frequentate,
        percentuale_frequenza: isc.percentuale_frequenza,
        voto_test: isc.voto_test,
        esito_pratica: isc.esito_pratica,
        note_verifica: isc.note_verifica,
        esito: isc.esito || "Idoneo"
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

    let docenti_ud = window.parseJSONSafe(window.getVal('cfg-docenti-ud', '{}'), {});

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
        
        let dateStr = udDates.join(', ');
        let dl = dateStr.length;
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

    const isAzienda = window.getVal('cfg-ente-erogatore') === 'azienda';
    const nomeErogatore = isAzienda ? window.getVal('cfg-azienda') : window.getVal('cfg-ente');
    const respProgetto = window.getVal('cfg-resp-progetto') || window.getVal('cfg-legale-nome') || (isAzienda ? window.getVal('cfg-azienda-referente') : 'Responsabile del progetto formativo');
    const respCorso = window.getVal('cfg-resp-corso') || respProgetto;
    const complianceNota = window.getComplianceNotaDocumento(courseId, isAzienda);
    
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

    document.querySelectorAll('.val-erogatore').forEach(el => el.innerText = nomeErogatore || "---");
    document.querySelectorAll('.val-legale-nome').forEach(el => el.innerText = window.getVal('cfg-legale-nome') || respProgetto || "---");
    document.querySelectorAll('.val-legale-nascita').forEach(el => el.innerText = window.getVal('cfg-legale-nascita') || "---");
    document.querySelectorAll('.val-ente-indirizzo').forEach(el => el.innerText = window.getVal('cfg-ente-indirizzo') || "---");
    document.querySelectorAll('.val-ente-contatti').forEach(el => el.innerText = window.getVal('cfg-ente-contatti') || "---");
    document.querySelectorAll('.val-azienda-indirizzo').forEach(el => el.innerText = window.getVal('cfg-azienda-indirizzo') || "---");
    document.querySelectorAll('.val-op-invio').forEach(el => el.innerText = window.formatDataToItalian(window.getVal('cfg-op-invio')) || "---");
    document.querySelectorAll('.val-op-risposta').forEach(el => el.innerText = window.formatDataToItalian(window.getVal('cfg-op-risposta')) || "---");
    document.querySelectorAll('.val-op-esito').forEach(el => el.innerText = window.labelEsitoOP(window.getVal('cfg-op-esito')));
    document.querySelectorAll('.val-ente-validatore').forEach(el => el.innerText = window.getVal('cfg-ente-validatore') || window.getDefaultEnteValidatore());
    document.querySelectorAll('.val-validazione-esito').forEach(el => el.innerText = window.labelEsitoValidazioneCNA(window.getVal('cfg-validazione-esito')));
    document.querySelectorAll('.val-validazione-data').forEach(el => el.innerText = window.formatDataToItalian(window.getVal('cfg-validazione-data')) || "---");
    document.querySelectorAll('.val-op-comunicazione').forEach(el => el.innerText = window.formatDataToItalian(window.getVal('cfg-op-comunicazione')) || "---");
    document.querySelectorAll('.val-op-destinatario').forEach(el => el.innerText = window.getVal('cfg-op-destinatario') || window.DEFAULT_OP_DESTINATARIO);
    document.querySelectorAll('.val-validazione-note').forEach(el => el.innerText = window.getVal('cfg-validazione-note') || "Nessuna prescrizione aggiuntiva registrata.");
    document.querySelectorAll('.only-dl-validazione').forEach(el => el.style.display = isAzienda ? '' : 'none');
    document.querySelectorAll('.val-omogeneita-aula').forEach(el => el.innerText = window.getVal('cfg-omogeneita-aula', 'SI'));
    document.querySelectorAll('.val-compliance-note-free').forEach(el => el.innerText = window.getVal('cfg-compliance-note-free') || "Nessuna nota aggiuntiva.");
    document.querySelectorAll('.val-ente-indirizzo-dinamico').forEach(el => el.innerText = isAzienda ? window.getVal('cfg-azienda-indirizzo') : window.getVal('cfg-ente-indirizzo'));
    document.querySelectorAll('.val-ente-contatti-dinamico').forEach(el => el.innerText = isAzienda ? "Ateco: " + window.getVal('cfg-ateco') : window.getVal('cfg-ente-contatti'));
    
    document.querySelectorAll('.val-ruolo-firma-3').forEach(el => el.innerText = isAzienda ? "Il Datore di Lavoro" : "Il Legale Rappresentante dell'Ente");
    document.querySelectorAll('.val-firma-3-nome').forEach(el => el.innerText = isAzienda ? (window.getVal('cfg-azienda-referente') || respProgetto) : (window.getVal('cfg-legale-nome') || respProgetto));
    document.querySelectorAll('.val-testo-timbro').forEach(el => el.innerHTML = isAzienda ? "TIMBRO<br>AZIENDA" : "TIMBRO<br>EROGATORE");

    const sedeToDisplay = window.getVal('cfg-sede-corso') || window.getVal('cfg-azienda-indirizzo') || "Sede Aziendale";
    document.querySelectorAll('.val-ente').forEach(el => el.innerText = window.getVal('cfg-ente'));
    document.querySelectorAll('.val-azienda').forEach(el => el.innerText = window.getVal('cfg-azienda'));
    document.querySelectorAll('.val-ateco').forEach(el => el.innerText = window.getVal('cfg-ateco'));
    document.querySelectorAll('.val-titolo-corso').forEach(el => el.innerText = c.t);
    document.querySelectorAll('.val-ore-corso').forEach(el => el.innerText = c.ore + " ORE");
    document.querySelectorAll('.val-codice').forEach(el => el.innerText = window.getVal('cfg-codice'));
    document.querySelectorAll('.val-sede-corso').forEach(el => el.innerText = sedeToDisplay); 
    document.querySelectorAll('.val-docente-main').forEach(el => el.innerText = primoDocenteNome); 
    document.querySelectorAll('.val-resp-progetto').forEach(el => el.innerText = respProgetto);
    document.querySelectorAll('.val-resp-corso').forEach(el => el.innerText = respCorso);
    document.querySelectorAll('.val-compliance-note').forEach(el => el.innerText = complianceNota);
    document.querySelectorAll('.val-data-esame').forEach(el => el.innerText = dataEsameStrFormatted);
    document.querySelectorAll('.val-modalita').forEach(el => el.innerText = window.getVal('cfg-modalita', 'In Presenza Fisica'));
    document.querySelectorAll('.val-calendario').forEach(el => el.innerText = window.getVal('cfg-calendario'));
    document.querySelectorAll('.val-date-ud').forEach(el => el.innerHTML = dateSummaryArr.join('<br>'));

    document.querySelectorAll('.val-dicitura-legale').forEach(el => {
        if(isAzienda) {
            el.innerHTML = "Corso erogato in conformità a:<br><strong>" + (c.norma || "D.Lgs. 81/08 e Accordo Stato Regioni del 17 Aprile 2025") + "</strong><br><span class='text-blue-700 italic block mt-1'>Datore di lavoro soggetto formatore: formazione diretta per propri lavoratori/preposti/dirigenti. Percorso valutato/validato da <strong>" + (window.getVal('cfg-ente-validatore') || window.getDefaultEnteValidatore()) + "</strong> con comunicazione a <strong>" + (window.getVal('cfg-op-destinatario') || window.DEFAULT_OP_DESTINATARIO) + "</strong>.</span>";
        } else {
            el.innerHTML = "Corso erogato in conformità a:<br><strong>" + (c.norma || "D.Lgs. 81/08 e Accordo Stato Regioni del 17 Aprile 2025") + "</strong><br><span class='text-emerald-700 italic block mt-1'>Associazione sindacale di categoria / struttura di diretta emanazione quale soggetto formatore.</span>";
        }
    });

    let headerLegaleHtml = "";
    if (isAzienda) {
        headerLegaleHtml = "<p>Datore di lavoro quale soggetto formatore ex Accordo Stato-Regioni 17/04/2025, Rep. atti n. 59/CSR</p><p>Formazione diretta esclusivamente per propri lavoratori, preposti e dirigenti</p><p>Validazione percorso: " + (window.getVal('cfg-ente-validatore') || window.getDefaultEnteValidatore()) + " - comunicazione: " + (window.getVal('cfg-op-destinatario') || window.DEFAULT_OP_DESTINATARIO) + "</p>";
    } else {
        headerLegaleHtml = "<p>Associazione sindacale di categoria / struttura di diretta emanazione quale soggetto formatore</p><p>Accordo Stato-Regioni 17/04/2025, Rep. atti n. 59/CSR - requisiti da conservare/autocertificare ove applicabile</p>";
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
        if(logoUrl){ img.src=logoUrl; img.classList.remove('hidden'); } 
        else img.classList.add('hidden'); 
    });

    if (window.currentPrintModule === 'dichiarazione_docenza') {
        const chkDL = document.getElementById('check-box-dl');
        const chkDoc = document.getElementById('check-box-docente');

        if (isAzienda) {
            if(chkDL) chkDL.innerHTML = "X";
            if(chkDoc) chkDoc.innerHTML = "";
            document.querySelectorAll('.val-nome').forEach(el => el.innerText = window.getVal('cfg-legale-nome') || "---");
            document.querySelectorAll('.val-cf').forEach(el => el.innerText = "________________");
            document.querySelectorAll('.val-nascita').forEach(el => el.innerText = window.getVal('cfg-legale-nascita') || "________________");
        } else {
            if(chkDL) chkDL.innerHTML = "";
            if(chkDoc) chkDoc.innerHTML = "X";
            
            let firstUdKey = Object.keys(docenti_ud)[0];
            let docObj = window.docentiList.find(d => d.id === docenti_ud[firstUdKey]);
            if(docObj) {
                document.querySelectorAll('.val-nome').forEach(el => el.innerText = docObj.nome_cognome || "---");
                document.querySelectorAll('.val-cf').forEach(el => el.innerText = docObj.cf || "---");
                document.querySelectorAll('.val-nascita').forEach(el => el.innerText = "________________");
            }
        }
    } else {
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
    }
};

window.aggiornaTabelleSessione = function() {
    if (!window.currentSessionCorsisti || window.currentSessionCorsisti.length === 0) return;
    let rRows = ""; let vRows = "";
    
    window.currentSessionCorsisti.forEach((c, idx) => {
        const progettoFirmaId = window.currentProgettoStampaId || document.getElementById('stampa-progetto')?.value || window.digitalProcedureState?.progetto?.id || '';
        const firmaCell = (campo) => {
            const img = (typeof window.getSignatureDataUrl === 'function') ? window.getSignatureDataUrl(progettoFirmaId, c.iscrizione_id, 'registro', campo) : '';
            return img ? '<img src="' + img + '" style="max-height:28px;max-width:100%;object-fit:contain;display:block;margin:0 auto;" alt="Firma digitale">' : '&nbsp;';
        };
        rRows += '<tr><td class="border border-slate-800 py-0.5 px-1 text-center font-bold">' + (idx + 1) + '</td><td class="border border-slate-800 py-0.5 px-1 bg-white leading-none"><span class="font-bold">' + c.nome + '</span><br><span class="text-[6px] text-slate-500 uppercase">' + (c.mansione || '') + '</span></td><td class="border border-slate-800 py-0.5 px-1 text-center font-mono">' + c.cf + '</td><td class="border border-slate-800 py-0.5 px-1 text-center">' + firmaCell('entrata_mattina') + '</td><td class="border border-slate-800 py-0.5 px-1">' + firmaCell('uscita_mattina') + '</td><td class="border border-slate-800 py-0.5 px-1 text-center">' + firmaCell('entrata_pomeriggio') + '</td><td class="border border-slate-800 py-0.5 px-1">' + firmaCell('uscita_pomeriggio') + '</td></tr>';
        const freq = c.percentuale_frequenza != null ? Number(c.percentuale_frequenza) : 100;
        const presenzaLabel = freq >= 90 ? 'SI (' + freq + '%)' : 'NO (' + freq + '%)';
        const presenzaClass = freq >= 90 ? 'text-emerald-700' : 'text-red-700';
        const voto = c.voto_test != null ? c.voto_test : '__ / 30';
        const pratica = c.esito_pratica || 'Ove previsto';
        const esitoFinale = c.esito || (freq >= 90 ? 'Idoneo' : 'Non ammesso');
        vRows += '<tr><td class="border border-slate-900 py-0.5 px-1 leading-tight"><span class="font-bold">' + c.nome + '</span><br><span class="text-[6.5px] text-slate-500 uppercase">' + (c.mansione || '') + '</span></td><td class="border border-slate-900 py-0.5 px-1 text-center font-bold ' + presenzaClass + '">' + presenzaLabel + '</td><td class="border border-slate-900 py-0.5 px-1 text-center italic">' + voto + '</td><td class="border border-slate-900 py-0.5 px-1 text-center">' + pratica + '</td><td class="border border-slate-900 py-0.5 px-1 text-center font-black uppercase text-blue-700">' + esitoFinale + '</td></tr>';
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
// DATA MIGRATION WIZARD (CSV / JSON ETL)
// ==========================================
window.migParsedData = [];
window.migHeaders = [];

window.DB_TARGETS = [
    { id: 'az_ragione', label: 'Azienda: Ragione Sociale', aliases: ['azienda', 'ragione sociale', 'impresa', 'cliente'] },
    { id: 'az_piva', label: 'Azienda: P.IVA / C.F.', aliases: ['piva', 'partita iva', 'cf azienda', 'c.f. azienda'] },
    { id: 'az_ind', label: 'Azienda: Indirizzo Sede', aliases: ['indirizzo', 'sede', 'indirizzo azienda'] },
    { id: 'cor_nome', label: 'Allievo: Nome e Cognome', aliases: ['nome', 'cognome', 'allievo', 'corsista', 'dipendente', 'lavoratore'] },
    { id: 'cor_cf', label: 'Allievo: Codice Fiscale', aliases: ['cf', 'codice fiscale', 'c.f.'] },
    { id: 'cor_nascita', label: 'Allievo: Luogo/Data Nascita', aliases: ['nascita', 'nato a', 'data di nascita', 'luogo di nascita'] },
    { id: 'cor_mans', label: 'Allievo: Mansione', aliases: ['mansione', 'qualifica', 'ruolo', 'lavoro'] },
    { id: 'doc_nome', label: 'Docente Formatore', aliases: ['docente', 'formatore', 'insegnante'] },
    { id: 'prg_codice', label: 'Corso: Codice Riferimento', aliases: ['codice', 'codice corso', 'id corso', 'rif'] },
    { id: 'prg_corso', label: 'Corso: Tipologia (es. RLS, Basso, ecc)', aliases: ['corso', 'tipo corso', 'titolo', 'tipologia'] },
    { id: 'prg_data', label: 'Corso: Data Esame / Fine', aliases: ['data', 'data esame', 'data fine', 'data attestato'] },
    { id: 'isc_cert', label: 'Attestato: ID Protocollo', aliases: ['certificato', 'numero attestato', 'id', 'protocollo'] },
    { id: 'isc_scad', label: 'Attestato: Data Scadenza', aliases: ['scadenza', 'data scadenza', 'valido fino'] }
];

window.initMigrazione = function() {
    window.migParsedData = [];
    window.migHeaders = [];
    document.getElementById('mig-step-2').classList.add('hidden');
    document.getElementById('mig-log').innerHTML = '[System] Modulo Migrazione Dati attivato. In attesa di file .csv o .json...';
};

window.logMig = function(msg, isError = false) {
    const logBox = document.getElementById('mig-log');
    if(!logBox) return;
    const color = isError ? 'text-red-400' : 'text-emerald-400';
    logBox.innerHTML += `<br><span class="${color}">> ${msg}</span>`;
    logBox.scrollTop = logBox.scrollHeight;
};

window.handleFileSelect = function() {
    const fileInput = document.getElementById('mig-file');
    if (!fileInput.files.length) return alert("Seleziona un file prima di procedere.");
    
    const file = fileInput.files[0];
    window.logMig(`Lettura del file: ${file.name}...`);

    const reader = new FileReader();

    if (file.name.endsWith('.csv')) {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                window.migParsedData = results.data;
                window.migHeaders = results.meta.fields;
                window.logMig(`Rilevate ${window.migParsedData.length} righe valide nel CSV.`);
                window.buildMappingUI();
            },
            error: function(err) {
                window.logMig(`Errore parsing CSV: ${err}`, true);
            }
        });
    } else if (file.name.endsWith('.json')) {
        reader.onload = function(e) {
            try {
                window.migParsedData = JSON.parse(e.target.result);
                if (!Array.isArray(window.migParsedData)) throw new Error("Il JSON deve essere un Array di oggetti.");
                if (window.migParsedData.length > 0) window.migHeaders = Object.keys(window.migParsedData[0]);
                window.logMig(`Rilevate ${window.migParsedData.length} righe nel JSON.`);
                window.buildMappingUI();
            } catch (err) {
                window.logMig(`Errore JSON: ${err.message}`, true);
            }
        };
        reader.readAsText(file);
    } else {
        window.logMig(`Formato file non supportato. Usare .csv o .json`, true);
    }
};

window.buildMappingUI = function() {
    const container = document.getElementById('mig-mapping-container');
    if(!container) return;
    let html = '';

    let optionsHtml = '<option value="">-- Ignora / Non Importare --</option>';
    window.migHeaders.forEach(h => {
        optionsHtml += `<option value="${h}">${h}</option>`;
    });

    window.DB_TARGETS.forEach(target => {
        let autoSelected = "";
        for (let h of window.migHeaders) {
            let hClean = h.toLowerCase().trim();
            if (target.aliases.some(alias => hClean.includes(alias))) {
                autoSelected = h;
                break;
            }
        }

        let dynamicOptions = optionsHtml.replace(`value="${autoSelected}"`, `value="${autoSelected}" selected`);

        html += `
        <div class="flex items-center justify-between border-b border-slate-100 pb-2">
            <div class="w-1/2">
                <span class="text-[10px] font-bold text-slate-800 uppercase block">${target.label}</span>
            </div>
            <div class="w-1/2 pl-4">
                <select id="map_${target.id}" class="w-full text-xs p-1.5 border border-slate-300 rounded bg-slate-50 focus:border-blue-500 focus:bg-white transition outline-none">
                    ${dynamicOptions}
                </select>
            </div>
        </div>`;
    });

    container.innerHTML = html;
    document.getElementById('mig-step-2').classList.remove('hidden');
    window.logMig("Interfaccia di Mappatura Colonne generata. Controlla e premi Avvia Importazione.");
};

window.startImportProcess = async function() {
    const btn = document.getElementById('btn-start-import');
    if(!btn) return;
    btn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Elaborazione in corso...';
    btn.disabled = true;
    if(typeof lucide !== 'undefined') lucide.createIcons();

    let mapConfig = {};
    window.DB_TARGETS.forEach(t => {
        mapConfig[t.id] = document.getElementById(`map_${t.id}`).value;
    });

    window.logMig("Inizio procedura di elaborazione dati Relazionali (Upsert)...");

    try {
        const mapAziende = {}; 
        const mapDocenti = {}; 
        const mapCorsisti = {}; 
        const mapProgetti = {}; 

        const { data: exAz } = await supabaseClient.from('aziende').select('id, ragione_sociale');
        if(exAz) exAz.forEach(a => mapAziende[a.ragione_sociale.toLowerCase().trim()] = a.id);

        const { data: exDoc } = await supabaseClient.from('docenti').select('id, nome_cognome');
        if(exDoc) exDoc.forEach(d => mapDocenti[d.nome_cognome.toLowerCase().trim()] = d.id);

        const { data: exCor } = await supabaseClient.from('corsisti').select('id, cf');
        if(exCor) exCor.forEach(c => mapCorsisti[c.cf] = c.id);

        const { data: exProg } = await supabaseClient.from('progetti').select('id, codice');
        if(exProg) exProg.forEach(p => mapProgetti[p.codice] = p.id);

        let cAz = 0, cDoc = 0, cCor = 0, cPrg = 0, cIsc = 0;

        for (const row of window.migParsedData) {
            const azName = mapConfig.az_ragione && row[mapConfig.az_ragione] ? row[mapConfig.az_ragione].trim() : "Privato";
            const azPiva = mapConfig.az_piva && row[mapConfig.az_piva] ? row[mapConfig.az_piva].trim() : "";
            const azInd = mapConfig.az_ind && row[mapConfig.az_ind] ? row[mapConfig.az_ind].trim() : "";

            const corNome = mapConfig.cor_nome && row[mapConfig.cor_nome] ? row[mapConfig.cor_nome].trim() : "";
            const corCf = mapConfig.cor_cf && row[mapConfig.cor_cf] ? row[mapConfig.cor_cf].trim().toUpperCase() : "";
            const corNascita = mapConfig.cor_nascita && row[mapConfig.cor_nascita] ? row[mapConfig.cor_nascita].trim() : "";
            const corMans = mapConfig.cor_mans && row[mapConfig.cor_mans] ? row[mapConfig.cor_mans].trim() : "";

            const docNome = mapConfig.doc_nome && row[mapConfig.doc_nome] ? row[mapConfig.doc_nome].trim() : "";

            const prgCod = mapConfig.prg_codice && row[mapConfig.prg_codice] ? row[mapConfig.prg_codice].trim() : "";
            const prgCorsoStr = mapConfig.prg_corso && row[mapConfig.prg_corso] ? row[mapConfig.prg_corso].toLowerCase().trim() : "";
            const prgDataRaw = mapConfig.prg_data && row[mapConfig.prg_data] ? row[mapConfig.prg_data].trim() : "";

            const iscCert = mapConfig.isc_cert && row[mapConfig.isc_cert] ? row[mapConfig.isc_cert].trim() : "";
            const iscScadRaw = mapConfig.isc_scad && row[mapConfig.isc_scad] ? row[mapConfig.isc_scad].trim() : "";

            if (!corCf) continue; 

            let azKey = azName.toLowerCase();
            if (azName !== "Privato" && !mapAziende[azKey]) {
                const { data } = await supabaseClient.from('aziende').insert([{ ragione_sociale: azName, piva_cf: azPiva, indirizzo: azInd }]).select();
                if (data && data.length > 0) { mapAziende[azKey] = data[0].id; cAz++; }
            }

            if (docNome && !mapDocenti[docNome.toLowerCase()]) {
                const { data } = await supabaseClient.from('docenti').insert([{ nome_cognome: docNome, qualifica: "Formatore Qualificato (D.I. 6/3/2013)" }]).select();
                if (data && data.length > 0) { mapDocenti[docNome.toLowerCase()] = data[0].id; cDoc++; }
            }

            if (!mapCorsisti[corCf]) {
                const { data } = await supabaseClient.from('corsisti').insert([{
                    cf: corCf, nome_cognome: corNome, luogo_data_nascita: corNascita, mansione_storica: corMans, azienda_id: mapAziende[azKey] || null
                }]).select();
                if (data && data.length > 0) { mapCorsisti[corCf] = data[0].id; cCor++; }
            }

            let finalProgId = null;
            if (prgCod) {
                if (!mapProgetti[prgCod]) {
                    let corsoId = 'lav_basso';
                    if (prgCorsoStr.includes('alto')) corsoId = 'lav_alto';
                    else if (prgCorsoStr.includes('medio')) corsoId = 'lav_medio';
                    else if (prgCorsoStr.includes('rls')) corsoId = 'rls';
                    else if (prgCorsoStr.includes('preposto')) corsoId = 'preposto';
                    else if (prgCorsoStr.includes('antincendio')) corsoId = 'antincendio_liv2';
                    else if (prgCorsoStr.includes('primo soccorso')) corsoId = 'primo_soccorso_12h';
                    else if (prgCorsoStr.includes('carrell') || prgCorsoStr.includes('mulett')) corsoId = 'attr_carrelli_ind';

                    let docJson = {};
                    if(docNome) docJson["UD1"] = mapDocenti[docNome.toLowerCase()] || "";

                    const { data } = await supabaseClient.from('progetti').insert([{
                        codice: prgCod,
                        azienda_id: mapAziende[azKey] || null,
                        corso_id: corsoId,
                        modalita: "In Presenza Fisica",
                        data_inizio: window.formatDataToISODate(prgDataRaw),
                        data_esame: window.formatDataToISODate(prgDataRaw),
                        ente_erogatore: "ente",
                        docente_principale: JSON.stringify(docJson)
                    }]).select();

                    if (data && data.length > 0) { 
                        mapProgetti[prgCod] = data[0].id; 
                        finalProgId = data[0].id;
                        cPrg++; 
                    }
                } else {
                    finalProgId = mapProgetti[prgCod];
                }

                if (finalProgId && iscCert) {
                    const { data: exIsc } = await supabaseClient.from('iscrizioni').select('id').eq('id_certificato', iscCert);
                    if (!exIsc || exIsc.length === 0) {
                        const { error } = await supabaseClient.from('iscrizioni').insert([{
                            progetto_id: finalProgId,
                            corsista_id: mapCorsisti[corCf],
                            id_certificato: iscCert,
                            esito: "Idoneo",
                            data_scadenza: window.formatDataToISODate(iscScadRaw)
                        }]);
                        if (!error) cIsc++;
                    }
                }
            }
        }

        window.logMig(`MIGRAZIONE COMPLETATA CON SUCCESSO!`);
        window.logMig(`- Aziende generate: ${cAz}`);
        window.logMig(`- Docenti generati: ${cDoc}`);
        window.logMig(`- Corsisti importati: ${cCor}`);
        window.logMig(`- Progetti formativi ricreati: ${cPrg}`);
        window.logMig(`- Attestati e Scadenze registrate: ${cIsc}`);
        
        if(typeof window.loadDashboardStats === 'function') window.loadDashboardStats();

    } catch (err) {
        window.logMig(`ERRORE CRITICO DB: ${err.message}`, true);
    } finally {
        btn.innerHTML = '<i data-lucide="play-circle" class="w-5 h-5"></i> Avvia Importazione';
        btn.disabled = false;
        if(typeof lucide !== 'undefined') lucide.createIcons();
    }
};

// ==========================================
// GENERATORE DEI TEST E CORRETTORE
// ==========================================
window.generaTest = function(courseId) {
    const id = courseId || '';
    let pool = [...(window.POOL_GENERALE || [])];
    if(id.includes('basso')) pool = pool.concat(window.POOL_BASSO || []);
    else if(id.includes('alto') || id.includes('medio')) pool = pool.concat(window.POOL_ALTO || []);
    else if(id.includes('dirigente') || id.includes('preposto') || id.includes('dl_')) pool = pool.concat(window.POOL_DIRIGENTI || []);
    else if(id.includes('cantieri') || id.includes('costruzioni')) pool = pool.concat(window.POOL_CANTIERI || []);
    else if(id.includes('confinati')) pool = pool.concat(window.POOL_CONFINATI || []);
    else if(id.includes('attr_') || id.includes('attrezzature')) pool = pool.concat(window.POOL_ATTREZZATURE || []);
    else if(id.includes('soccorso')) pool = pool.concat(window.POOL_PS || []);
    else if(id.includes('antincendio')) pool = pool.concat(window.POOL_AI || []);

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
