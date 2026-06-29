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

        if (typeof window.loadDashboardCompliance === 'function') {
            await window.loadDashboardCompliance();
        }

    } catch (e) {
        console.error("Errore caricamento statistiche", e);
    }
};


window.dashEscape = function(value) {
    return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
};

window.dashIsPastOrToday = function(dateString) {
    if (!dateString) return false;
    const today = new Date();
    const d = new Date(dateString + 'T00:00:00');
    today.setHours(0,0,0,0);
    return d.getTime() <= today.getTime();
};

window.dashProjectLabel = function(p) {
    const corso = (window.DB_CORSI && window.DB_CORSI[p.corso_id]) ? window.DB_CORSI[p.corso_id].t : (p.corso_id || 'Corso non indicato');
    return `${p.codice || 'Senza codice'} · ${corso}`;
};


window.dashRenderPanel = function(containerId, badgeId, items, verifiedText) {
    const box = document.getElementById(containerId);
    const badge = document.getElementById(badgeId);
    if (!box) return;
    if (!items.length) {
        box.innerHTML = `
            <div class="border border-emerald-200 bg-emerald-50 rounded-xl p-4 text-center">
                <p class="font-black text-emerald-700 uppercase text-sm flex items-center justify-center gap-2">
                    <i data-lucide="badge-check" class="w-5 h-5"></i> Verified
                </p>
                <p class="text-[10px] text-emerald-800 mt-1">${window.dashEscape(verifiedText || 'Nessuna correzione rilevata.')}</p>
            </div>`;
        if (badge) {
            badge.innerText = 'Verified';
            badge.className = 'px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase';
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }
    const grouped = items.slice(0, 8).map(item => {
        const projectId = item.project_id || '';
        const target = item.target || 'progetti';
        return `
        <div onclick="window.apriCorrezioneDashboard('${window.dashEscape(projectId)}','${window.dashEscape(target)}')" class="border border-red-100 bg-red-50 rounded-xl p-3 mb-2 cursor-pointer hover:bg-red-100 hover:border-red-300 transition group" title="Clicca per aprire e correggere">
            <div class="flex items-start justify-between gap-2">
                <p class="font-black text-red-900 uppercase text-[11px]">${window.dashEscape(item.title)}</p>
                <span class="shrink-0 text-[9px] font-black uppercase text-red-700 bg-white border border-red-200 rounded-full px-2 py-0.5 group-hover:bg-red-700 group-hover:text-white">Modifica</span>
            </div>
            <ul class="list-disc ml-4 mt-1 space-y-0.5 text-[10px] text-red-800">
                ${item.errors.map(e => `<li>${window.dashEscape(e)}</li>`).join('')}
            </ul>
            ${item.fix ? `<p class="mt-2 text-[10px] text-slate-700"><strong>Correzione:</strong> ${window.dashEscape(item.fix)}</p>` : ''}
        </div>`;
    }).join('');
    const more = items.length > 8 ? `<p class="text-[10px] text-slate-500 mt-2">Altri ${items.length - 8} elementi da verificare non mostrati.</p>` : '';
    box.innerHTML = grouped + more;
    if (badge) {
        badge.innerText = `${items.length} alert`;
        badge.className = 'px-2 py-1 rounded-full bg-red-100 text-red-800 text-[9px] font-black uppercase';
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.apriCorrezioneDashboard = async function(projectId, target) {
    if (!projectId) return;
    await window.loadModule('progetti');

    let tries = 0;
    while ((!window.progettiList || !window.progettiList.find(p => p.id === projectId)) && tries < 15) {
        await new Promise(resolve => setTimeout(resolve, 150));
        tries++;
    }

    if (!window.progettiList || !window.progettiList.find(p => p.id === projectId)) {
        window.progettiList = await window.getProgetti();
    }

    const row = document.querySelector(`tr[data-project-id="${projectId}"]`);
    if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        row.classList.add('ring-2','ring-red-400','bg-red-50');
        setTimeout(() => row.classList.remove('ring-2','ring-red-400','bg-red-50'), 3000);
    }

    if (typeof window.apriPopupProgettoById === 'function') {
        await window.apriPopupProgettoById(projectId, target);
        return;
    }
};

window.dashGetProjectIssues = async function(p, iscrittiOverride = null) {
    const errors = [];
    const course = window.DB_CORSI ? window.DB_CORSI[p.corso_id] : null;
    const isDL = p.ente_erogatore === 'azienda';
    const iscritti = Array.isArray(iscrittiOverride) ? iscrittiOverride : await window.getIscrizioni(p.id);

    if (!p.codice) errors.push('Codice progetto mancante.');
    if (!p.corso_id || !course) errors.push('Corso non riconosciuto nel catalogo.');
    if (course && course.deprecated) errors.push('Corso legacy/deprecato: riclassificare con una voce attiva.');
    if (!p.azienda_id) errors.push('Azienda committente non collegata.');
    if (!p.data_inizio) errors.push('Data inizio mancante.');
    if (!p.data_esame) errors.push('Data verifica/fine mancante.');
    if (!p.sede) errors.push('Sede corso / aula / campo prova mancante.');
    if (!p.resp_progetto) errors.push('Responsabile progetto formativo mancante.');
    if (!p.modalita) errors.push('Modalità di svolgimento mancante.');
    if (!p.docenti_ud && !p.docente_principale) errors.push('Docente/i non assegnati alle unità didattiche.');

    const modeCheck = window.getModalitaCompliance ? window.getModalitaCompliance(p.corso_id, p.modalita || '') : { ok:true };
    if (modeCheck && modeCheck.ok === false) errors.push(modeCheck.message);

    if (iscritti.length > (window.ASR2025_POLICY?.maxDiscentiAula || 30)) {
        errors.push(`Numero discenti superiore al limite generale (${iscritti.length}/30), salvo e-learning.`);
    }

    if (p.stato_corso === 'chiuso' && !p.documenti_firmati_url) {
        errors.push('Corso chiuso senza link alla scansione dei documenti firmati.');
    }
    if (p.stato_corso === 'chiuso' && !p.chiuso_at) {
        errors.push('Corso chiuso senza data di chiusura/archiviazione.');
    }

    if (isDL) {
        const invalid = iscritti.filter(isc => isc.corsisti && isc.corsisti.azienda_id && isc.corsisti.azienda_id !== p.azienda_id);
        if (invalid.length) errors.push('Datore di lavoro soggetto formatore: presenti corsisti non appartenenti alla stessa azienda.');
    }

    return errors.length ? {
        project_id: p.id,
        target: 'progetti',
        title: window.dashProjectLabel(p),
        errors,
        fix: 'Apri Gestione Progetto, completa i campi obbligatori, riclassifica eventuali corsi legacy e ristampa progetto/fascicolo.'
    } : null;
};


window.dashParseLocalJSON = function(key, fallback = []) {
    try { return JSON.parse(localStorage.getItem(key) || ''); } catch(e) { return fallback; }
};

window.dashGetDigitalProcedureIssues = function(p, iscritti) {
    const errors = [];
    const signatures = window.dashParseLocalJSON('SafetyManager.digitalSignatures.v1', []);
    const tests = window.dashParseLocalJSON('SafetyManager.digitalTests.v1', []);

    const registro = signatures.filter(s => s.progetto_id === p.id && s.documento === 'registro');
    if (registro.length > 0) {
        const activeFields = [...new Set(registro.map(s => s.campo_firma).filter(Boolean))];
        const signedKeys = new Set(registro.map(s => `${s.iscrizione_id}::${s.campo_firma}`));
        activeFields.forEach(field => {
            const missing = iscritti.filter(isc => !signedKeys.has(`${isc.id}::${field}`));
            if (missing.length) {
                errors.push(`Registro digitale parziale: campo "${field}" firmato solo in parte (${iscritti.length - missing.length}/${iscritti.length}).`);
            }
        });
    }

    const testDigitali = tests.filter(t => t.progetto_id === p.id);
    if (testDigitali.length > 0 && testDigitali.length < iscritti.length) {
        errors.push(`Test digitali parziali: presenti ${testDigitali.length}/${iscritti.length} test digitali. Completare oppure gestire tutti i test su supporto cartaceo/scansionato.`);
    }

    return errors;
};


window.dashGetCourseDoneIssues = async function(p, iscrittiOverride = null) {
    if (!window.dashIsPastOrToday(p.data_esame)) return null;
    const errors = [];
    const iscritti = Array.isArray(iscrittiOverride) ? iscrittiOverride : await window.getIscrizioni(p.id);
    if (!iscritti.length) errors.push('Corso svolto senza iscrizioni/allievi collegati.');

    iscritti.forEach(isc => {
        const nome = isc.corsisti?.nome_cognome || 'Corsista';
        if (!isc.id_certificato) errors.push(`${nome}: ID certificato mancante.`);
        if (!isc.esito) errors.push(`${nome}: esito finale mancante.`);
        if ((isc.esito || '').toLowerCase().includes('idoneo') && !isc.data_scadenza) errors.push(`${nome}: data scadenza attestato mancante.`);
        if (isc.percentuale_frequenza !== undefined && isc.percentuale_frequenza !== null && Number(isc.percentuale_frequenza) < 90) errors.push(`${nome}: frequenza inferiore al 90%.`);
        if (isc.percentuale_frequenza === undefined || isc.percentuale_frequenza === null) errors.push(`${nome}: percentuale frequenza non registrata.`);
        if (!isc.voto_test && !isc.note_verifica) errors.push(`${nome}: test/verifica finale non registrata.`);
    });

    // La firma digitale NON è obbligatoria: non è errore se assente.
    // Diventa errore solo se la procedura digitale è stata iniziata e risulta parziale.
    errors.push(...(window.dashGetDigitalProcedureIssues ? window.dashGetDigitalProcedureIssues(p, iscritti) : []));

    return errors.length ? {
        project_id: p.id,
        target: 'corsi_svolti',
        title: window.dashProjectLabel(p),
        errors: errors.slice(0, 10),
        fix: 'Completa registro, test/verifiche, esiti, ID certificati e scadenze. Le firme digitali sono richieste solo se il corso è stato gestito digitalmente in modo parziale.'
    } : null;
};

window.dashGetCommunicationIssues = function(p) {
    const errors = [];
    const isDL = p.ente_erogatore === 'azienda';

    if (isDL) {
        if (!p.ente_validatore) errors.push('Ente validatore CNA mancante.');
        if (!p.validazione_ente_esito || p.validazione_ente_esito === 'da_valutare') errors.push('Esito valutazione/validazione CNA non concluso.');
        if (!p.validazione_ente_at) errors.push('Data validazione CNA mancante.');
        if (!p.organismo_destinatario) errors.push('Destinatario OPRA/OPTA mancante.');
        if (!p.comunicazione_op_at) errors.push('Data comunicazione a OPRA/OPTA mancante.');
    }

    if (!isDL && (p.richiesta_op_inviata_at || p.esito_richiesta_op || p.risposta_op_at)) {
        if (p.richiesta_op_inviata_at && !p.esito_richiesta_op) errors.push('Comunicazione/richiesta OP registrata senza esito.');
    }

    return errors.length ? {
        project_id: p.id,
        target: 'comunicazioni',
        title: window.dashProjectLabel(p),
        errors,
        fix: isDL ? 'Apri Gestione Progetto e completa validazione CNA + comunicazione OPTA/OPRA.' : 'Completa esito/riscontro della comunicazione agli organismi.'
    } : null;
};


window.dashGetProjectOverallIssues = async function(p, iscrittiOverride = null) {
    const issues = [];
    const iscritti = Array.isArray(iscrittiOverride) ? iscrittiOverride : await window.getIscrizioni(p.id);
    const pi = await window.dashGetProjectIssues(p, iscritti);
    if (pi) issues.push(...pi.errors);
    const ci = await window.dashGetCourseDoneIssues(p, iscritti);
    if (ci) issues.push(...ci.errors);
    const oi = window.dashGetCommunicationIssues(p);
    if (oi) issues.push(...oi.errors);
    return issues;
};

window.dashStatusBadgeHtml = function(hasErrors) {
    if (hasErrors) {
        return '<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-800 border border-red-200 font-black text-[8px] uppercase"><span class="w-2 h-2 rounded-full bg-red-600"></span>Errori</span>';
    }
    return '<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-black text-[8px] uppercase"><span class="w-2 h-2 rounded-full bg-emerald-600"></span>Verified</span>';
};


window.loadDashboardCompliance = async function() {
    const panelId = 'dash-progetti-formativi-checks';
    if (!document.getElementById(panelId)) return;

    const el = document.getElementById(panelId);
    if (el) {
        el.innerHTML = '<div class="text-center text-slate-400 py-6"><i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto mb-2"></i> Verifica in corso...</div>';
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();

    const projects = await window.getProgetti();
    const projectIds = projects.map(p => p.id).filter(Boolean);
    const iscrizioniMap = window.getIscrizioniPerProgetti
        ? await window.getIscrizioniPerProgetti(projectIds)
        : await window.buildIscrizioniMapFallback(projects);

    const projectIssues = [];
    for (const p of projects) {
        const iscritti = iscrizioniMap[p.id] || [];
        const issues = window.dashGetProjectOverallIssues
            ? await window.dashGetProjectOverallIssues(p, iscritti)
            : [];
        if (issues && issues.length) {
            projectIssues.push({
                project_id: p.id,
                target: 'progetti',
                title: window.dashProjectLabel ? window.dashProjectLabel(p) : (p.codice || 'Progetto'),
                errors: issues.slice(0, 12),
                fix: 'Apri il progetto, completa i dati evidenziati, verifica iscritti/documenti e ristampa il fascicolo se necessario.'
            });
        }
    }

    window.dashRenderPanel(
        'dash-progetti-formativi-checks',
        'dash-progetti-formativi-badge',
        projectIssues,
        'Tutti i progetti formativi risultano verificati nei controlli minimi.'
    );
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


// QUICK ADD / EDIT CORSISTA 
window.apriQACorsista = function() {
    const modal = document.getElementById('qa-modal-corsista');
    if (!modal) return;
    modal.classList.remove('hidden');
    const p = window.progettiList.find(x => x.id === window.currentProgettoId);
    if(p && p.azienda_id) {
        document.getElementById('qa-cor-azienda-id').value = p.azienda_id;
    } else {
        document.getElementById('qa-cor-azienda-id').value = "";
    }
    const title = document.getElementById('qa-cor-title');
    if (title) title.innerHTML = '<i data-lucide="user-plus" class="w-4 h-4"></i> Nuovo Allievo Rapido';
    document.getElementById('qa-cor-id').value = '';
    document.getElementById('qa-cor-nome').focus();
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.chiudiQACorsista = function() {
    const modal = document.getElementById('qa-modal-corsista');
    if (modal) modal.classList.add('hidden');
    const set = (id, value='') => { const el = document.getElementById(id); if (el) el.value = value; };
    set('qa-cor-id');
    set('qa-cor-nome');
    set('qa-cor-cf');
    set('qa-cor-nascita');
    set('qa-cor-mansione');
    set('qa-cor-azienda-id');
};

window.salvaQACorsista = async function() {
    const id = document.getElementById('qa-cor-id')?.value || '';
    const nome = document.getElementById('qa-cor-nome').value.trim();
    const cf = document.getElementById('qa-cor-cf').value.trim().toUpperCase();
    const nascita = document.getElementById('qa-cor-nascita').value.trim();
    const mansione = document.getElementById('qa-cor-mansione')?.value.trim() || '';
    const az_id = document.getElementById('qa-cor-azienda-id').value || null;

    if(!nome || !cf) return alert("Inserisci Nome e CF.");

    const record = {
        nome_cognome: nome,
        cf: cf,
        luogo_data_nascita: nascita,
        mansione_storica: mansione,
        azienda_id: az_id
    };
    if (id) record.id = id;

    const saved = await window.saveCorsistaData(record);
    if (!saved) return alert("Errore nel salvataggio. Assicurati che il Codice Fiscale non sia già registrato.");

    const savedId = Array.isArray(saved) && saved[0] ? saved[0].id : (saved.id || id);
    window.corsistiList = await window.getCorsisti();

    window.chiudiQACorsista();

    if (!id && window.currentProgettoId && savedId && typeof window.aggiungiIscrizioneDaId === 'function') {
        await window.aggiungiIscrizioneDaId(window.currentProgettoId, savedId);
        return;
    }

    if (typeof window.loadProgettiTable === 'function' && document.getElementById('tabella-progetti')) {
        await window.loadProgettiTable();
    }
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

window.isCnaErogatore = function() {
    const erogatore = window.getVal('cfg-ente-erogatore') || 'ente';
    if (erogatore === 'azienda') return false;
    const nomeEnte = (window.getVal('cfg-ente') || '').toUpperCase();
    return nomeEnte.includes('CNA');
};
window.getEffectiveLogoSrc = function() {
    const erogatore = window.getVal('cfg-ente-erogatore') || 'ente';
    if (erogatore === 'azienda') return '';
    const configured = window.getVal('cfg-logo');
    if (configured) return configured;
    return window.isCnaErogatore() ? 'logocna.png' : '';
};
window.getEffectiveTimbroSrc = function() {
    const erogatore = window.getVal('cfg-ente-erogatore') || 'ente';
    if (erogatore === 'azienda') return '';
    return window.isCnaErogatore() ? 'timbrocna.png' : '';
};

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


window.waitForElement = async function(selector, timeoutMs = 2500) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        const el = document.querySelector(selector);
        if (el) return el;
        await new Promise(resolve => setTimeout(resolve, 80));
    }
    return null;
};


window.apriPopupProgettoById = async function(projectId, target = 'progetti') {
    if (!projectId) return;

    if (!document.getElementById('form-progetto')) {
        await window.loadModule('progetti');
        await window.waitForElement('#form-progetto');
    }

    if (!window.progettiList || !window.progettiList.find(p => p.id === projectId)) {
        window.progettiList = await window.getProgetti();
    }

    const p = window.progettiList.find(x => x.id === projectId);
    if (!p) {
        alert('Progetto non trovato.');
        return;
    }

    if (typeof window.modificaProgetto === 'function') {
        window.modificaProgetto(projectId);
    }

    if (typeof window.openProjectEditPopup === 'function') {
        await window.openProjectEditPopup(projectId, target);
    }
};


window.clearProjectPopupFieldErrors = function() {
    document.querySelectorAll('[data-project-field-error="1"]').forEach(el => {
        el.style.backgroundColor = el.dataset.prevBg || '';
        el.style.borderColor = el.dataset.prevBorder || '';
        el.style.boxShadow = el.dataset.prevShadow || '';
        el.removeAttribute('data-project-field-error');
        delete el.dataset.prevBg;
        delete el.dataset.prevBorder;
        delete el.dataset.prevShadow;
    });
};

window.markProjectPopupFieldError = function(selector) {
    const nodes = document.querySelectorAll(selector);
    nodes.forEach(el => {
        if (!el.dataset.projectFieldError) {
            el.dataset.prevBg = el.style.backgroundColor || '';
            el.dataset.prevBorder = el.style.borderColor || '';
            el.dataset.prevShadow = el.style.boxShadow || '';
        }
        el.dataset.projectFieldError = '1';
        el.style.backgroundColor = '#fef2f2';
        el.style.borderColor = '#ef4444';
        el.style.boxShadow = '0 0 0 2px rgba(239,68,68,.25)';
    });
};

window.collectProjectFormSnapshot = function(projectId) {
    const original = (window.progettiList || []).find(x => x.id === projectId) || {};
    return {
        ...original,
        id: projectId || document.getElementById('prog-id')?.value || original.id,
        azienda_id: document.getElementById('prog-azienda')?.value || '',
        ente_erogatore: document.getElementById('prog-erogatore')?.value || 'ente',
        corso_id: document.getElementById('prog-corso')?.value || '',
        codice: document.getElementById('prog-codice')?.value || '',
        modalita: document.getElementById('prog-modalita')?.value || '',
        data_inizio: document.getElementById('prog-inizio')?.value || '',
        data_esame: document.getElementById('prog-esame')?.value || '',
        sede: document.getElementById('prog-sede')?.value || '',
        resp_progetto: document.getElementById('prog-resp-progetto')?.value || '',
        resp_corso: document.getElementById('prog-resp-corso')?.value || '',
        richiesta_op_inviata_at: document.getElementById('prog-op-invio')?.value || '',
        risposta_op_at: document.getElementById('prog-op-risposta')?.value || '',
        esito_richiesta_op: document.getElementById('prog-op-esito')?.value || '',
        compliance_note: document.getElementById('prog-compliance-note-free')?.value || '',
        ente_validatore: document.getElementById('prog-ente-validatore')?.value || '',
        validazione_ente_esito: document.getElementById('prog-validazione-esito')?.value || '',
        validazione_ente_at: document.getElementById('prog-validazione-data')?.value || '',
        comunicazione_op_at: document.getElementById('prog-op-comunicazione')?.value || '',
        organismo_destinatario: document.getElementById('prog-op-destinatario')?.value || '',
        note_validazione_ente: document.getElementById('prog-validazione-note')?.value || '',
        omogeneita_aula: document.getElementById('prog-omogeneita-aula') ? document.getElementById('prog-omogeneita-aula').checked : true,
        stato_corso: document.getElementById('prog-stato-corso')?.value || original.stato_corso || 'aperto',
        documenti_firmati_url: document.getElementById('prog-documenti-url')?.value || '',
        chiuso_at: document.getElementById('prog-chiuso-at')?.value || '',
        note_chiusura: document.getElementById('prog-note-chiusura')?.value || ''
    };
};

window.getProjectPopupFieldErrors = function(p, iscritti = []) {
    const errors = [];
    const course = window.DB_CORSI ? window.DB_CORSI[p.corso_id] : null;
    const isDL = p.ente_erogatore === 'azienda';
    const add = (selector, message) => errors.push({ selector, message });

    if (!p.codice) add('#prog-codice', 'Codice ID progetto mancante.');
    if (!p.corso_id || !course) add('#prog-corso', 'Corso non riconosciuto nel catalogo.');
    if (course && course.deprecated) add('#prog-corso', 'Corso legacy/deprecato: riclassificare con una voce attiva.');
    if (!p.azienda_id) add('#prog-azienda', 'Azienda committente non selezionata.');
    if (!p.data_inizio) add('#prog-inizio', 'Data inizio mancante.');
    if (!p.data_esame) add('#prog-esame', 'Data verifica/fine mancante.');
    if (!p.sede) add('#prog-sede', 'Sede corso / aula / campo prova mancante.');
    if (!p.resp_progetto) add('#prog-resp-progetto', 'Responsabile progetto formativo mancante.');
    if (!p.modalita) add('#prog-modalita', 'Modalità di svolgimento mancante.');

    const modeCheck = window.getModalitaCompliance ? window.getModalitaCompliance(p.corso_id, p.modalita || '') : { ok: true };
    if (modeCheck && modeCheck.ok === false) add('#prog-modalita', modeCheck.message || 'Modalità non coerente con il corso selezionato.');

    const docentiSelects = Array.from(document.querySelectorAll('.prog-docente-ud'));
    if (!docentiSelects.length && !p.docenti_ud && !p.docente_principale) {
        add('#prog-docenti-container', 'Docenti non assegnati alle unità didattiche.');
    }
    const docentiMancanti = docentiSelects.filter(sel => !sel.value);
    if (docentiMancanti.length) add('.prog-docente-ud', 'Assegnare un docente qualificato a tutte le unità didattiche.');

    if (!p.omogeneita_aula && !p.compliance_note) {
        add('#prog-compliance-note-free', 'Aula non omogenea: indicare come sono stati adattati contenuti e rischi.');
    }

    if (iscritti.length > (window.ASR2025_POLICY?.maxDiscentiAula || 30)) {
        add('#popup-corsisti-box', `Numero discenti superiore al limite generale (${iscritti.length}/30), salvo e-learning.`);
    }

    if (isDL) {
        const invalid = iscritti.filter(isc => isc.corsisti && isc.corsisti.azienda_id && isc.corsisti.azienda_id !== p.azienda_id);
        if (invalid.length) add('#popup-corsisti-box', 'Datore di lavoro soggetto formatore: presenti corsisti non appartenenti alla stessa azienda.');
        if (!p.ente_validatore) add('#prog-ente-validatore', 'Ente validatore CNA mancante.');
        if (!p.validazione_ente_esito || p.validazione_ente_esito === 'da_valutare') add('#prog-validazione-esito', 'Esito valutazione/validazione CNA non concluso.');
        if ((p.validazione_ente_esito === 'validato' || p.validazione_ente_esito === 'validato_con_prescrizioni') && !p.validazione_ente_at) {
            add('#prog-validazione-data', 'Data validazione CNA mancante.');
        }
        if (!p.esito_richiesta_op) add('#prog-op-esito', 'Stato comunicazione/iter OPRA/OPTA mancante.');
        if (!p.organismo_destinatario) add('#prog-op-destinatario', 'Destinatario OPRA/OPTA mancante.');
        if ((p.esito_richiesta_op === 'comunicazione_op_inviata' || p.esito_richiesta_op === 'riscontro_ricevuto') && !p.comunicazione_op_at && !p.richiesta_op_inviata_at) {
            add('#prog-op-comunicazione,#prog-op-invio', 'Data comunicazione a OPRA/OPTA mancante.');
        }
    }

        if (p.stato_corso === 'chiuso' && !p.documenti_firmati_url) {
        add('#prog-documenti-url', 'Corso chiuso: inserire il link alla scansione dei documenti firmati.');
    }
    if (p.stato_corso === 'chiuso' && !p.chiuso_at) {
        add('#prog-chiuso-at', 'Corso chiuso: indicare la data di chiusura/archiviazione.');
    }

return errors;
};

window.applyProjectPopupValidation = async function(projectId) {
    const p = window.collectProjectFormSnapshot(projectId);
    const iscritti = projectId ? await window.getIscrizioni(projectId) : [];
    const box = document.getElementById('popup-project-errors');
    window.clearProjectPopupFieldErrors();
    const errors = window.getProjectPopupFieldErrors(p, iscritti);

    errors.forEach(e => window.markProjectPopupFieldError(e.selector));

    if (box) {
        if (!errors.length) {
            box.className = 'mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[10px] text-emerald-800 leading-snug';
            box.innerHTML = '<p class="font-black uppercase flex items-center gap-2"><i data-lucide="badge-check" class="w-4 h-4"></i> Verified</p><p class="mt-1">Il progetto non presenta errori nei controlli minimi.</p>';
        } else {
            box.className = 'mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-[10px] text-red-800 leading-snug';
            box.innerHTML = `<p class="font-black uppercase flex items-center gap-2"><i data-lucide="alert-triangle" class="w-4 h-4"></i> Campi da correggere</p><ul class="list-disc ml-4 mt-1 space-y-0.5">${errors.map(e => `<li>${window.dashEscape ? window.dashEscape(e.message) : e.message}</li>`).join('')}</ul>`;
        }
        box.classList.remove('hidden');
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.bindProjectPopupValidationEvents = function(projectId) {
    const form = document.getElementById('form-progetto');
    if (!form || form.dataset.validationBound === projectId) return;
    form.dataset.validationBound = projectId;
    let t = null;
    form.querySelectorAll('input, select, textarea').forEach(el => {
        el.addEventListener('input', () => {
            clearTimeout(t);
            t = setTimeout(() => window.applyProjectPopupValidation(projectId), 250);
        });
        el.addEventListener('change', () => {
            clearTimeout(t);
            t = setTimeout(() => window.applyProjectPopupValidation(projectId), 250);
        });
    });
};

window.renderPopupCorsisti = async function(projectId) {
    const box = document.getElementById('popup-corsisti-box');
    const list = document.getElementById('popup-corsisti-list');
    const summary = document.getElementById('popup-corsisti-summary');
    if (!box || !list) return [];

    box.classList.remove('hidden');
    list.innerHTML = '<div class="text-center text-slate-400 py-6"><i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto mb-2"></i> Caricamento corsisti...</div>';
    if (typeof lucide !== 'undefined') lucide.createIcons();

    const iscritti = await window.getIscrizioni(projectId);
    if (summary) summary.innerText = `${iscritti.length} corsisti abbinati`;
    if (!iscritti.length) {
        list.innerHTML = '<div class="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 text-[11px] font-bold uppercase">Nessun corsista abbinato a questo corso.</div>';
        return iscritti;
    }

    list.innerHTML = `
        <div class="overflow-x-auto">
            <table class="w-full text-[10px] border-collapse">
                <thead class="bg-slate-200 text-slate-700 uppercase">
                    <tr>
                        <th class="p-2 text-left">Corsista</th>
                        <th class="p-2 text-left">CF</th>
                        <th class="p-2 text-left">Mansione</th>
                        <th class="p-2 text-center">Certificato</th>
                        <th class="p-2 text-center">Esito</th>
                        <th class="p-2 text-center">Frequenza</th>
                    </tr>
                </thead>
                <tbody>
                    ${iscritti.map(isc => {
                        const c = isc.corsisti || {};
                        const incomplete = !isc.id_certificato || !isc.esito || isc.percentuale_frequenza === null || isc.percentuale_frequenza === undefined;
                        return `<tr class="${incomplete ? 'bg-red-50' : 'bg-white'} border-b border-slate-200">
                            <td class="p-2 font-black uppercase text-slate-900">${window.dashEscape ? window.dashEscape(c.nome_cognome || '-') : (c.nome_cognome || '-')}</td>
                            <td class="p-2 font-mono text-slate-600">${window.dashEscape ? window.dashEscape(c.cf || '-') : (c.cf || '-')}</td>
                            <td class="p-2 text-slate-600">${window.dashEscape ? window.dashEscape(isc.mansione_storica || c.mansione_storica || '-') : (isc.mansione_storica || c.mansione_storica || '-')}</td>
                            <td class="p-2 text-center font-mono ${isc.id_certificato ? 'text-emerald-700' : 'text-red-700 font-black'}">${window.dashEscape ? window.dashEscape(isc.id_certificato || 'Mancante') : (isc.id_certificato || 'Mancante')}</td>
                            <td class="p-2 text-center ${isc.esito ? 'text-emerald-700 font-bold' : 'text-red-700 font-black'}">${window.dashEscape ? window.dashEscape(isc.esito || 'Mancante') : (isc.esito || 'Mancante')}</td>
                            <td class="p-2 text-center ${isc.percentuale_frequenza !== null && isc.percentuale_frequenza !== undefined ? 'text-slate-700 font-bold' : 'text-red-700 font-black'}">${isc.percentuale_frequenza !== null && isc.percentuale_frequenza !== undefined ? isc.percentuale_frequenza + '%' : 'Mancante'}</td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;
    return iscritti;
};


window.ensureProjectPopupTabs = function() {
    const errorBox = document.getElementById('popup-project-errors');
    const card = document.getElementById('progetto-form-card');
    if (!errorBox || !card || document.getElementById('popup-project-tabs')) return;

    const tabs = document.createElement('div');
    tabs.id = 'popup-project-tabs';
    tabs.className = 'shrink-0 flex items-center gap-2 mb-3 border-b border-slate-100 pb-2';
    tabs.innerHTML = `
        <button type="button" id="popup-tab-btn-dati" onclick="window.switchProjectPopupTab('dati')" class="px-3 py-2 rounded-lg text-[10px] font-black uppercase bg-rose-600 text-white shadow-sm">
            Dati progetto
        </button>
        <button type="button" id="popup-tab-btn-corsisti" onclick="window.switchProjectPopupTab('corsisti')" class="px-3 py-2 rounded-lg text-[10px] font-black uppercase bg-slate-100 text-slate-700 hover:bg-slate-200">
            Corsisti abbinati
        </button>
    `;
    errorBox.insertAdjacentElement('afterend', tabs);
};

window.switchProjectPopupTab = function(tab) {
    const form = document.getElementById('form-progetto');
    const corsisti = document.getElementById('popup-corsisti-box');
    const btnDati = document.getElementById('popup-tab-btn-dati');
    const btnCorsisti = document.getElementById('popup-tab-btn-corsisti');

    const active = 'px-3 py-2 rounded-lg text-[10px] font-black uppercase bg-rose-600 text-white shadow-sm';
    const inactive = 'px-3 py-2 rounded-lg text-[10px] font-black uppercase bg-slate-100 text-slate-700 hover:bg-slate-200';

    if (tab === 'corsisti') {
        if (form) form.classList.add('hidden');
        if (corsisti) corsisti.classList.remove('hidden');
        if (btnDati) btnDati.className = inactive;
        if (btnCorsisti) btnCorsisti.className = active;
    } else {
        if (form) form.classList.remove('hidden');
        if (corsisti) corsisti.classList.add('hidden');
        if (btnDati) btnDati.className = active;
        if (btnCorsisti) btnCorsisti.className = inactive;
    }
};

window.openProjectEditPopup = async function(projectId, target = 'progetti') {
    const col = document.getElementById('progetto-form-col');
    const card = document.getElementById('progetto-form-card');
    const title = document.getElementById('progetto-form-title');
    const closeBtn = document.getElementById('btn-close-project-popup');
    const header = document.getElementById('popup-project-header');
    const form = document.getElementById('form-progetto');
    const errorBox = document.getElementById('popup-project-errors');
    const corsistiBox = document.getElementById('popup-corsisti-box');
    if (!col || !card) return;

    if (!col.dataset.originalClass) col.dataset.originalClass = col.className;
    if (!card.dataset.originalClass) card.dataset.originalClass = card.className;
    if (form && !form.dataset.originalClass) form.dataset.originalClass = form.className;
    if (corsistiBox && !corsistiBox.dataset.originalClass) corsistiBox.dataset.originalClass = corsistiBox.className;

    const p = (window.progettiList || []).find(x => x.id === projectId);
    window.projectEditOpenedAsPopup = true;

    // Finestra vera, non a schermo intero: overlay pieno ma card contenuta.
    col.className = 'fixed inset-0 z-[90] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4';
    card.className = 'bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl h-[82vh] max-h-[82vh] overflow-hidden flex flex-col p-5';
    if (header) header.classList.add('shrink-0');
    if (errorBox) errorBox.classList.add('shrink-0');

    window.ensureProjectPopupTabs();

    if (form) {
        form.className = 'space-y-4 text-xs popup-project-pane popup-project-pane-dati flex-1 min-h-0 overflow-y-auto pr-2 pb-2';
    }
    if (corsistiBox) {
        corsistiBox.className = 'hidden popup-project-pane popup-project-pane-corsisti flex-1 min-h-0 rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden';
    }

    if (title) {
        title.innerHTML = `<i data-lucide="layout-template" class="w-4 h-4 text-rose-500"></i> Modifica progetto · <span class="font-mono text-rose-700">${window.dashEscape ? window.dashEscape(p?.codice || '') : (p?.codice || '')}</span>`;
    }
    if (closeBtn) closeBtn.classList.remove('hidden');

    await window.renderPopupCorsisti(projectId);
    await window.applyProjectPopupValidation(projectId);
    window.bindProjectPopupValidationEvents(projectId);

    window.switchProjectPopupTab(target === 'corsi_svolti' ? 'corsisti' : 'dati');

    const firstError = document.querySelector('[data-project-field-error="1"]');
    if (target !== 'corsi_svolti' && firstError && firstError.scrollIntoView) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        const first = document.getElementById('prog-azienda');
        if (first && target !== 'corsi_svolti') setTimeout(() => first.focus(), 100);
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.chiudiPopupProgetto = function() {
    const col = document.getElementById('progetto-form-col');
    const card = document.getElementById('progetto-form-card');
    const title = document.getElementById('progetto-form-title');
    const closeBtn = document.getElementById('btn-close-project-popup');
    const errorBox = document.getElementById('popup-project-errors');
    const corsistiBox = document.getElementById('popup-corsisti-box');
    const form = document.getElementById('form-progetto');
    const tabs = document.getElementById('popup-project-tabs');

    window.clearProjectPopupFieldErrors();

    if (col && col.dataset.originalClass) col.className = col.dataset.originalClass;
    if (card && card.dataset.originalClass) card.className = card.dataset.originalClass;
    if (form && form.dataset.originalClass) form.className = form.dataset.originalClass;
    if (corsistiBox && corsistiBox.dataset.originalClass) corsistiBox.className = corsistiBox.dataset.originalClass;

    if (title) title.innerHTML = '<i data-lucide="layout-template" class="w-4 h-4 text-rose-500"></i> Gestione Progetto';
    if (closeBtn) closeBtn.classList.add('hidden');
    if (errorBox) errorBox.classList.add('hidden');
    if (corsistiBox) corsistiBox.classList.add('hidden');
    if (tabs) tabs.remove();

    window.projectEditOpenedAsPopup = false;
    if (typeof lucide !== 'undefined') lucide.createIcons();
};


window.buildIscrizioniMapFallback = async function(projects = []) {
    const map = {};
    for (const p of projects) {
        map[p.id] = await window.getIscrizioni(p.id);
    }
    return map;
};

window.inlineIscrittiExpanded = window.inlineIscrittiExpanded || {};
window.progettiIscrizioniMap = window.progettiIscrizioniMap || {};

window.getCorsistaOptionsForProject = function(projectId, selectedId = '') {
    const p = (window.progettiList || []).find(x => x.id === projectId);
    const list = window.corsistiList || [];
    const dipendenti = list.filter(c => p && c.azienda_id && c.azienda_id === p.azienda_id);
    const altri = list.filter(c => !p || !c.azienda_id || c.azienda_id !== p.azienda_id);
    let html = '<option value="">-- Seleziona corsista --</option>';

    if (dipendenti.length) {
        html += '<optgroup label="📌 Dipendenti azienda committente">';
        dipendenti.forEach(c => {
            html += `<option value="${c.id}" ${selectedId === c.id ? 'selected' : ''} style="background:#f59e0b;color:#111827;font-weight:900;">📌 ${window.dashEscape(c.nome_cognome || '')} (${window.dashEscape(c.cf || '')})</option>`;
        });
        html += '</optgroup>';
    }

    if (altri.length) {
        html += '<optgroup label="Altri corsisti anagrafica">';
        altri.forEach(c => {
            html += `<option value="${c.id}" ${selectedId === c.id ? 'selected' : ''}>${window.dashEscape(c.nome_cognome || '')} (${window.dashEscape(c.cf || '')})</option>`;
        });
        html += '</optgroup>';
    }
    return html;
};

window.renderInlineIscrittiCards = function(projectId, iscritti, showAll = false) {
    const visible = showAll ? iscritti : iscritti.slice(0, 4);
    if (!iscritti.length) {
        return `<div class="rounded-xl border border-red-500/50 bg-red-950/80 p-3 text-[10px] font-bold uppercase text-red-100">
            Nessun corsista iscritto a questo progetto.
        </div>`;
    }

    return `
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
            ${visible.map(isc => {
                const c = isc.corsisti || {};
                const missing = !isc.id_certificato || !isc.esito || isc.percentuale_frequenza === null || isc.percentuale_frequenza === undefined;
                return `<div class="rounded-xl border ${missing ? 'border-red-500/70 bg-red-950/80' : 'border-slate-600 bg-slate-800'} p-3 shadow-sm">
                    <div class="flex items-start justify-between gap-2">
                        <div class="min-w-0">
                            <p class="font-black uppercase text-white text-[11px] leading-tight break-words">${window.dashEscape(c.nome_cognome || '-')}</p>
                            <p class="font-mono text-[9px] text-slate-300 mt-0.5">${window.dashEscape(c.cf || '-')}</p>
                        </div>
                        <div class="flex gap-1 shrink-0">
                            <button onclick="window.modificaCorsistaDaProgetto('${c.id || isc.corsista_id}','${projectId}')" class="p-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-white" title="Modifica corsista"><i data-lucide="edit-3" class="w-3 h-3"></i></button>
                            <button onclick="window.rimuoviIscrizione('${isc.id}', '${projectId}')" class="p-2 rounded-lg bg-red-600 hover:bg-red-500 text-white" title="Rimuovi dal corso"><i data-lucide="user-minus" class="w-3 h-3"></i></button>
                        </div>
                    </div>
                    <div class="mt-2 text-[9px] text-slate-200 space-y-0.5">
                        <p><span class="font-black uppercase text-slate-400">Mansione:</span> ${window.dashEscape(isc.mansione_storica || c.mansione_storica || '-')}</p>
                        <p><span class="font-black uppercase text-slate-400">Cert:</span> <span class="font-mono ${isc.id_certificato ? 'text-slate-100' : 'text-red-200 font-black'}">${window.dashEscape(isc.id_certificato || 'Mancante')}</span></p>
                        <p><span class="font-black uppercase text-slate-400">Esito:</span> <span class="${isc.esito ? 'text-emerald-300 font-black' : 'text-red-200 font-black'}">${window.dashEscape(isc.esito || 'Mancante')}</span></p>
                    </div>
                </div>`;
            }).join('')}
        </div>
        ${iscritti.length > 4 ? `<button onclick="window.toggleInlineIscritti('${projectId}')" class="mt-3 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-[9px] font-black uppercase tracking-widest">
            ${showAll ? 'Mostra meno' : 'Di più · altri ' + (iscritti.length - 4)}
        </button>` : ''}
    `;
};

window.renderInlineIscrittiControls = function(p, view = 'desk') {
    const projectId = p.id;
    return `<div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-3">
        <div>
            <p class="font-black uppercase text-white text-xs flex items-center gap-2"><i data-lucide="users" class="w-4 h-4 text-amber-400"></i> Corsisti iscritti</p>
            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">${(window.progettiIscrizioniMap[projectId] || []).length} iscritti abbinati al progetto ${window.dashEscape(p.codice || '')}</p>
        </div>
        <div class="flex flex-col md:flex-row gap-2 md:items-center">
            <select id="inline-sel-iscrivi-${projectId}-${view}" data-inline-select="${projectId}" class="min-w-0 md:min-w-[260px] px-3 py-2 bg-slate-950 border border-slate-600 rounded-lg text-xs outline-none focus:border-amber-400 font-bold text-white">
                ${window.getCorsistaOptionsForProject(projectId)}
            </select>
            <div class="flex gap-2">
                <button onclick="window.aggiungiIscrizioneInline('${projectId}', '${view}')" class="flex-1 md:flex-none bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3 py-2 rounded-lg text-[10px] uppercase transition shadow flex items-center justify-center gap-1">
                    <i data-lucide="user-plus" class="w-3.5 h-3.5"></i> Aggiungi
                </button>
                <button type="button" onclick="window.apriQACorsistaInline('${projectId}')" class="flex-1 md:flex-none bg-slate-700 hover:bg-slate-600 text-white font-black px-3 py-2 rounded-lg text-[10px] uppercase transition shadow flex items-center justify-center gap-1">
                    <i data-lucide="plus" class="w-3.5 h-3.5"></i> Nuovo
                </button>
            </div>
        </div>
    </div>`;
};

window.toggleInlineIscritti = async function(projectId) {
    window.inlineIscrittiExpanded[projectId] = !window.inlineIscrittiExpanded[projectId];
    await window.loadProgettiTable();
    const row = document.querySelector(`[data-inline-iscritti-project="${projectId}"]`) || document.querySelector(`[data-mobile-project-id="${projectId}"]`);
    if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

window.aggiungiIscrizioneDaId = async function(projectId, corsistaId) {
    if(!corsistaId || !projectId) return alert("Seleziona un corsista.");
    window.currentProgettoId = projectId;

    const p = window.progettiList.find(x => x.id === projectId);
    const c = window.corsistiList.find(x => x.id === corsistaId);
    if (!p || !c) return alert('Dati progetto/corsista non disponibili. Ricarica la pagina.');

    const corsoInfo = window.DB_CORSI[p.corso_id];
    const iscrittiEsistenti = window.progettiIscrizioniMap?.[projectId] || await window.getIscrizioni(projectId);

    if (iscrittiEsistenti.some(isc => isc.corsista_id === corsistaId)) {
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
        progetto_id: projectId,
        corsista_id: corsistaId,
        id_certificato: id_cert,
        mansione_storica: c.mansione_storica || null,
        esito: "Idoneo",
        data_scadenza: dataScadenzaISO 
    };

    if(await window.saveIscrizione(record)) {
        window.inlineIscrittiExpanded[projectId] = true;
        await window.loadProgettiTable();
    } else {
        alert("Errore. L'allievo potrebbe essere già iscritto o il numero certificato potrebbe essere duplicato.");
    }
};

window.aggiungiIscrizioneInline = async function(projectId, view = 'desk') {
    const sel = document.getElementById(`inline-sel-iscrivi-${projectId}-${view}`) || document.querySelector(`[data-inline-select="${projectId}"]`);
    await window.aggiungiIscrizioneDaId(projectId, sel?.value || '');
};

window.apriQACorsistaInline = function(projectId) {
    window.currentProgettoId = projectId;
    if (typeof window.apriQACorsista === 'function') window.apriQACorsista();
};

window.modificaCorsistaDaProgetto = function(corsistaId, projectId) {
    window.currentProgettoId = projectId;
    const c = (window.corsistiList || []).find(x => x.id === corsistaId);
    if (!c) return alert('Corsista non trovato.');
    const modal = document.getElementById('qa-modal-corsista');
    if (!modal) return alert('Modulo modifica corsista non disponibile.');
    const set = (id, value) => { const el = document.getElementById(id); if (el) el.value = value || ''; };
    set('qa-cor-id', c.id);
    set('qa-cor-nome', c.nome_cognome);
    set('qa-cor-cf', c.cf);
    set('qa-cor-nascita', c.luogo_data_nascita);
    set('qa-cor-mansione', c.mansione_storica);
    set('qa-cor-azienda-id', c.azienda_id);
    const title = document.getElementById('qa-cor-title');
    if (title) title.innerHTML = '<i data-lucide="edit-3" class="w-4 h-4"></i> Modifica Corsista';
    modal.classList.remove('hidden');
    document.getElementById('qa-cor-nome')?.focus();
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.renderProjectDesktopRows = function(p, iscritti, issues) {
    const showAll = !!window.inlineIscrittiExpanded[p.id];
    const nomeAzienda = p.aziende ? p.aziende.ragione_sociale : 'Privato';
    const nomeCorso = window.DB_CORSI[p.corso_id] ? window.DB_CORSI[p.corso_id].t : p.corso_id;
    const siglaCorso = window.DB_CORSI[p.corso_id] ? window.DB_CORSI[p.corso_id].code : '';
    const erogatoreBadge = (p.ente_erogatore === 'azienda')
        ? '<span class="inline-block mt-1 px-1.5 py-0.5 rounded bg-blue-200 text-blue-950 font-black text-[8px] uppercase">DL soggetto formatore</span>'
        : '<span class="inline-block mt-1 px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-950 font-black text-[8px] uppercase">Associazione / ente</span>';
    const statoBadge = (typeof window.dashStatusBadgeHtml === 'function') ? window.dashStatusBadgeHtml(issues.length > 0) : '';
    const chiusuraBadge = p.stato_corso === 'chiuso'
        ? '<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-950 text-white border border-slate-600 font-black text-[8px] uppercase">Chiuso</span>'
        : (p.stato_corso === 'svolto' ? '<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-300 text-amber-950 border border-amber-400 font-black text-[8px] uppercase">Da chiudere</span>' : '');

    return `
        <tr class="hover:bg-slate-800 transition-colors bg-slate-900" data-corso="${p.corso_id}" data-project-id="${p.id}">
            <td class="p-3 border-b border-slate-700 font-mono font-bold text-[10px] text-slate-100 align-top">
                <div class="flex flex-col gap-1">
                    <button type="button" onclick="window.apriPopupProgettoById('${p.id}', 'progetti')" class="text-left text-rose-300 hover:underline font-black">${window.dashEscape(p.codice || '')}</button>
                    ${statoBadge}
                    ${chiusuraBadge}
                </div>
            </td>
            <td class="p-3 border-b border-slate-700 align-top">
                <div class="rounded-xl border-2 border-blue-400 bg-blue-600 p-3 shadow-md shadow-blue-950/30">
                    <p class="text-[8px] font-black uppercase tracking-widest text-blue-100 mb-1">Corso svolto</p>
                    <p class="font-black text-sm text-white uppercase leading-tight"><span class="text-blue-100 font-mono text-[10px]">[${siglaCorso}]</span> ${window.dashEscape(nomeCorso || '')}</p>
                </div>
                <div class="rounded-xl border-2 border-amber-300 bg-amber-400 p-3 mt-2 shadow-md shadow-amber-950/20">
                    <p class="text-[8px] font-black uppercase tracking-widest text-amber-950 mb-1">Azienda committente</p>
                    <p class="font-black text-xs text-slate-950 uppercase leading-tight">${window.dashEscape(nomeAzienda || '')}</p>
                    ${erogatoreBadge}
                </div>
            </td>
            <td class="p-3 border-b border-slate-700 font-bold text-center text-slate-200 align-top">${window.formatDataToItalian(p.data_esame)}</td>
            <td class="p-3 border-b border-slate-700 text-center whitespace-nowrap align-top">
                <button onclick="window.apriPopupProgettoById('${p.id}', 'progetti')" class="text-white hover:bg-blue-500 bg-blue-600 p-2 rounded-lg transition shadow-sm" title="Modifica progetto"><i data-lucide="edit" class="w-3 h-3"></i></button>
                <button onclick="window.eliminaProgetto('${p.id}')" class="text-white hover:bg-red-500 bg-red-700 p-2 rounded-lg transition shadow-sm ml-1" title="Elimina progetto"><i data-lucide="trash-2" class="w-3 h-3"></i></button>
            </td>
        </tr>
        <tr class="bg-slate-950" data-corso="${p.corso_id}" data-project-id="${p.id}" data-inline-iscritti-project="${p.id}">
            <td colspan="4" class="p-4 border-b border-slate-700">
                ${window.renderInlineIscrittiControls(p, 'desk')}
                ${window.renderInlineIscrittiCards(p.id, iscritti, showAll)}
            </td>
        </tr>`;
};

window.renderProjectMobileCard = function(p, iscritti, issues) {
    const showAll = !!window.inlineIscrittiExpanded[p.id];
    const nomeAzienda = p.aziende ? p.aziende.ragione_sociale : 'Privato';
    const nomeCorso = window.DB_CORSI[p.corso_id] ? window.DB_CORSI[p.corso_id].t : p.corso_id;
    const siglaCorso = window.DB_CORSI[p.corso_id] ? window.DB_CORSI[p.corso_id].code : '';
    const statoBadge = (typeof window.dashStatusBadgeHtml === 'function') ? window.dashStatusBadgeHtml(issues.length > 0) : '';
    const chiusuraBadge = p.stato_corso === 'chiuso'
        ? '<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-950 text-white border border-slate-600 font-black text-[8px] uppercase">Chiuso</span>'
        : (p.stato_corso === 'svolto' ? '<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-300 text-amber-950 border border-amber-400 font-black text-[8px] uppercase">Da chiudere</span>' : '');

    return `<article class="rounded-2xl border border-slate-700 bg-slate-900 shadow-xl overflow-hidden" data-corso="${p.corso_id}" data-mobile-project-id="${p.id}" data-project-id="${p.id}">
        <div class="p-4 border-b border-slate-700 flex items-start justify-between gap-3">
            <div class="min-w-0">
                <button onclick="window.apriPopupProgettoById('${p.id}', 'progetti')" class="font-mono text-rose-300 font-black text-xs hover:underline">${window.dashEscape(p.codice || '')}</button>
                <p class="text-[10px] text-slate-400 font-bold uppercase mt-1">Esame: ${window.formatDataToItalian(p.data_esame)}</p>
                <div class="flex flex-wrap gap-1 mt-2">${statoBadge}${chiusuraBadge}</div>
            </div>
            <div class="flex gap-2 shrink-0">
                <button onclick="window.apriPopupProgettoById('${p.id}', 'progetti')" class="text-white bg-blue-600 hover:bg-blue-500 p-2 rounded-lg"><i data-lucide="edit" class="w-4 h-4"></i></button>
                <button onclick="window.eliminaProgetto('${p.id}')" class="text-white bg-red-700 hover:bg-red-600 p-2 rounded-lg"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </div>
        </div>
        <div class="p-4 space-y-3">
            <div class="rounded-xl border-2 border-blue-400 bg-blue-600 p-3">
                <p class="text-[8px] font-black uppercase tracking-widest text-blue-100 mb-1">Corso svolto</p>
                <p class="font-black text-sm text-white uppercase leading-tight"><span class="text-blue-100 font-mono text-[10px]">[${siglaCorso}]</span> ${window.dashEscape(nomeCorso || '')}</p>
            </div>
            <div class="rounded-xl border-2 border-amber-300 bg-amber-400 p-3">
                <p class="text-[8px] font-black uppercase tracking-widest text-amber-950 mb-1">Azienda committente</p>
                <p class="font-black text-xs text-slate-950 uppercase leading-tight">${window.dashEscape(nomeAzienda || '')}</p>
            </div>
            <div class="rounded-xl bg-slate-950 border border-slate-700 p-3">
                ${window.renderInlineIscrittiControls(p, 'mob')}
                ${window.renderInlineIscrittiCards(p.id, iscritti, showAll)}
            </div>
        </div>
    </article>`;
};

window.loadProgettiTable = async function() {
    const tbody = document.getElementById('tabella-progetti');
    const mobileBox = document.getElementById('progetti-mobile-cards');
    if(!tbody && !mobileBox) return;
    
    if(window.aziendeList.length === 0) window.aziendeList = await window.getAziende();
    if(window.docentiList.length === 0) window.docentiList = await window.getDocenti();
    window.corsistiList = await window.getCorsisti();
    
    const selAzienda = document.getElementById('prog-azienda');
    if(selAzienda) {
        selAzienda.innerHTML = '<option value="">-- Seleziona Azienda --</option>' + 
            window.aziendeList.map(a => `<option value="${a.id}">${window.dashEscape(a.ragione_sociale)}</option>`).join('');
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

    const loading = '<tr><td colspan="4" class="p-6 text-center text-slate-400 italic"><i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto mb-2"></i> Caricamento progetti e corsisti...</td></tr>';
    if (tbody) tbody.innerHTML = loading;
    if (mobileBox) mobileBox.innerHTML = '<div class="p-6 text-center text-slate-400 font-bold uppercase text-xs"><i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto mb-2"></i> Caricamento progetti...</div>';
    if(typeof lucide !== 'undefined') lucide.createIcons();

    window.progettiList = await window.getProgetti();

    if (window.progettiList.length === 0) {
        if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="p-6 text-center text-slate-500 italic">Nessun corso registrato.</td></tr>';
        if (mobileBox) mobileBox.innerHTML = '<div class="p-6 text-center text-slate-500 italic bg-slate-900 rounded-xl border border-slate-700">Nessun corso registrato.</div>';
        return;
    }

    const ids = window.progettiList.map(p => p.id).filter(Boolean);
    window.progettiIscrizioniMap = window.getIscrizioniPerProgetti
        ? await window.getIscrizioniPerProgetti(ids)
        : await window.buildIscrizioniMapFallback(window.progettiList);

    let tableHtml = '';
    let mobileHtml = '';
    for (const p of window.progettiList) {
        const iscritti = window.progettiIscrizioniMap[p.id] || [];
        const issues = (typeof window.dashGetProjectOverallIssues === 'function') ? await window.dashGetProjectOverallIssues(p, iscritti) : [];
        tableHtml += window.renderProjectDesktopRows(p, iscritti, issues);
        mobileHtml += window.renderProjectMobileCard(p, iscritti, issues);
    }
    if (tbody) tbody.innerHTML = tableHtml;
    if (mobileBox) mobileBox.innerHTML = mobileHtml;
    if(typeof lucide !== 'undefined') lucide.createIcons();
};

window.filtraProgetti = function() {
    const textFilter = (document.getElementById('search-progetti')?.value || '').toLowerCase();
    const typeFilter = document.getElementById('filter-corso-tipo')?.value || '';
    const rows = Array.from(document.getElementById('tabella-progetti').getElementsByTagName('tr'));
    const grouped = {};

    rows.forEach(row => {
        const pid = row.getAttribute('data-project-id') || `row-${Math.random()}`;
        if (!grouped[pid]) grouped[pid] = [];
        grouped[pid].push(row);
    });

    Object.values(grouped).forEach(groupRows => {
        const groupText = groupRows.map(r => r.innerText.toLowerCase()).join(' ');
        const rowCorsoId = groupRows[0]?.getAttribute('data-corso') || '';
        const matchText = !textFilter || groupText.includes(textFilter);
        const matchType = typeFilter === '' || rowCorsoId === typeFilter;
        const show = matchText && matchType;
        groupRows.forEach(r => r.style.display = show ? '' : 'none');
    });
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
    const statoCorso = document.getElementById('prog-stato-corso') ? document.getElementById('prog-stato-corso').value : 'aperto';
    const documentiFirmatiUrl = (document.getElementById('prog-documenti-url')?.value || '').trim();
    const chiusoAt = document.getElementById('prog-chiuso-at') ? document.getElementById('prog-chiuso-at').value : '';
    const noteChiusura = (document.getElementById('prog-note-chiusura')?.value || '').trim();

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
        note_validazione_ente: erogatore === 'azienda' ? (validazioneNote || null) : null,
        stato_corso: statoCorso || 'aperto',
        documenti_firmati_url: documentiFirmatiUrl || null,
        chiuso_at: statoCorso === 'chiuso' ? (chiusoAt || new Date().toISOString().slice(0,10)) : (chiusoAt || null),
        note_chiusura: noteChiusura || null
    };
    if (id && id !== "") record.id = id;

    if (await window.saveProgetto(record)) {
        const wasPopup = !!window.projectEditOpenedAsPopup;
        window.resetFormProgetto();
        if (wasPopup && typeof window.chiudiPopupProgetto === 'function') window.chiudiPopupProgetto();
        await window.loadProgettiTable();
        if (typeof window.loadDashboardCompliance === 'function' && document.getElementById('dash-progetti-formativi-checks')) {
            await window.loadDashboardCompliance();
        }
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
    if(document.getElementById('prog-stato-corso')) document.getElementById('prog-stato-corso').value = 'aperto';
    if(document.getElementById('prog-documenti-url')) document.getElementById('prog-documenti-url').value = '';
    if(document.getElementById('prog-chiuso-at')) document.getElementById('prog-chiuso-at').value = '';
    if(document.getElementById('prog-note-chiusura')) document.getElementById('prog-note-chiusura').value = '';
    if(typeof window.syncValidazioneCNAUI === 'function') window.syncValidazioneCNAUI();
};

window.apriIscrizioni = async function(progetto_id) {
    window.currentProgettoId = progetto_id;
    const p = window.progettiList.find(x => x.id === progetto_id);
    const aziendaName = p.aziende ? p.aziende.ragione_sociale : 'Privato';
    
    document.getElementById('lbl-progetto-attivo').innerHTML = `Cod: <span class="text-white">${p.codice}</span> | Azienda: <span class="text-white">${aziendaName}</span>`;
    const panelIscrizioni = document.getElementById('panel-iscrizioni');
    panelIscrizioni.classList.remove('hidden');
    panelIscrizioni.classList.add('flex');
    
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
    const panelIscrizioni = document.getElementById('panel-iscrizioni');
    panelIscrizioni.classList.add('hidden');
    panelIscrizioni.classList.remove('flex');
};


window.loadIscrittiTable = async function() {
    const tbody = document.getElementById('tabella-iscritti');
    const countLabel = document.getElementById('lbl-iscritti-count');
    if(!tbody) return;

    tbody.innerHTML = '<tr><td colspan="4" class="p-6 text-center text-slate-400 italic">Caricamento...</td></tr>';

    const iscritti = await window.getIscrizioni(window.currentProgettoId);
    if(countLabel) countLabel.innerText = `${iscritti.length} iscritti`;

    if(iscritti.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="p-6 text-center text-slate-400 italic">Nessun allievo iscritto.</td></tr>';
        return;
    }

    let html = '';
    iscritti.forEach(isc => {
        const corsista = isc.corsisti || {};
        const nome = corsista.nome_cognome || '-';
        const cf = corsista.cf || '-';
        const cert = isc.id_certificato || 'Da generare';
        html += `
            <tr class="hover:bg-slate-700/80 transition-colors">
                <td data-label="Allievo" class="p-3 border-b border-slate-700 text-sm font-black text-blue-300 uppercase align-middle">${window.dashEscape ? window.dashEscape(nome) : nome}</td>
                <td data-label="Codice Fiscale" class="p-3 border-b border-slate-700 font-mono text-[10px] text-slate-300 align-middle">${window.dashEscape ? window.dashEscape(cf) : cf}</td>
                <td data-label="Num. Attestato" class="p-3 border-b border-slate-700 font-mono text-[9px] text-amber-200 align-middle break-all">${window.dashEscape ? window.dashEscape(cert) : cert}</td>
                <td data-label="Rimuovi" class="p-3 border-b border-slate-700 text-center align-middle">
                    <button onclick="window.rimuoviIscrizione('${isc.id}')" class="text-red-300 hover:text-white hover:bg-red-500 p-2 rounded-lg transition inline-flex items-center justify-center" title="Rimuovi iscrizione"><i data-lucide="user-minus" class="w-4 h-4"></i></button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
    if(typeof lucide !== 'undefined') lucide.createIcons();
};


window.aggiungiIscrizione = async function() {
    const corsista_id = document.getElementById('sel-iscrivi-corsista')?.value;
    await window.aggiungiIscrizioneDaId(window.currentProgettoId, corsista_id);
    if (typeof window.loadIscrittiTable === 'function' && document.getElementById('tabella-iscritti')) {
        await window.loadIscrittiTable();
    }
};


window.rimuoviIscrizione = async function(id, projectId = null) {
    if(confirm("Rimuovere l'allievo dal corso?")) {
        if(await window.deleteIscrizione(id)) {
            if (projectId) {
                await window.loadProgettiTable();
            } else if (typeof window.loadIscrittiTable === 'function' && document.getElementById('tabella-iscritti')) {
                await window.loadIscrittiTable();
            } else if (typeof window.loadProgettiTable === 'function') {
                await window.loadProgettiTable();
            }
        }
    }
};


window.CNA_AVELLINO_PRESET = {
    ragione_sociale: "CNA Artigiani Imprenditori D'Italia Avellino",
    piva_cf: "P.IVA 02851400644 / C.F. 92002100649",
    indirizzo: "Via Serafino Soldi, 11/13 - 83100 Avellino",
    contatti: "Tel./Fax 0825 783345 | Email avellino@cna.it | PEC cna.avellino@pec.it | Web www.cnaavellino.it",
    luogo_emissione: "Avellino",
    logo_url: "logocna.png"
};

window.applicaPresetCNAAvellino = function() {
    const p = window.CNA_AVELLINO_PRESET;
    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value || "";
    };

    set('ente-ragione', p.ragione_sociale);
    set('ente-piva', p.piva_cf);
    set('ente-indirizzo', p.indirizzo);
    set('ente-contatti', p.contatti);
    set('ente-luogo-emissione', p.luogo_emissione);
    set('cfg-logo', p.logo_url);

    window.AppState['cfg-ente'] = p.ragione_sociale;
    window.AppState['cfg-ente-indirizzo'] = p.indirizzo;
    window.AppState['cfg-ente-contatti'] = p.contatti;
    window.AppState['cfg-luogo-emissione'] = p.luogo_emissione;
    window.AppState['cfg-logo'] = p.logo_url;

    const legale = document.getElementById('ente-legale-nome');
    if (legale && !legale.value) legale.placeholder = "Inserire nominativo del legale rappresentante";
    const nascita = document.getElementById('ente-legale-nascita');
    if (nascita && !nascita.value) nascita.placeholder = "Inserire luogo e data di nascita";

    alert("Dati CNA Avellino caricati. Verifica/integra il legale rappresentante, poi salva l'ente.");
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
    document.querySelectorAll('.val-legale-nome').forEach(el => el.innerText = isAzienda ? (respProgetto || window.getVal('cfg-azienda-referente') || "---") : (window.getVal('cfg-legale-nome') || respProgetto || "---"));
    document.querySelectorAll('.val-legale-nascita').forEach(el => el.innerText = window.getVal('cfg-legale-nascita') || "---");
    document.querySelectorAll('.val-ente-indirizzo').forEach(el => el.innerText = isAzienda ? (window.getVal('cfg-azienda-indirizzo') || "---") : (window.getVal('cfg-ente-indirizzo') || "---"));
    document.querySelectorAll('.val-ente-contatti').forEach(el => el.innerText = isAzienda ? ("ATECO: " + (window.getVal('cfg-ateco') || "---")) : (window.getVal('cfg-ente-contatti') || "---"));
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
    document.querySelectorAll('.val-stato-corso').forEach(el => el.innerText = (window.getVal('cfg-stato-corso') || 'aperto').toUpperCase());
    document.querySelectorAll('.val-documenti-firmati-url').forEach(el => { const v = window.getVal('cfg-documenti-firmati-url'); el.innerText = v || '---'; if (v && el.tagName === 'A') el.href = v; });
    document.querySelectorAll('.val-chiuso-at').forEach(el => el.innerText = window.formatDataToItalian(window.getVal('cfg-chiuso-at')) || '---');
    document.querySelectorAll('.val-note-chiusura').forEach(el => el.innerText = window.getVal('cfg-note-chiusura') || '---');
    document.querySelectorAll('.only-dl-validazione').forEach(el => el.style.display = isAzienda ? '' : 'none');
    document.querySelectorAll('.val-omogeneita-aula').forEach(el => el.innerText = window.getVal('cfg-omogeneita-aula', 'SI'));
    document.querySelectorAll('.val-compliance-note-free').forEach(el => el.innerText = window.getVal('cfg-compliance-note-free') || "Nessuna nota aggiuntiva.");
    document.querySelectorAll('.val-ente-indirizzo-dinamico').forEach(el => el.innerText = isAzienda ? window.getVal('cfg-azienda-indirizzo') : window.getVal('cfg-ente-indirizzo'));
    document.querySelectorAll('.val-ente-contatti-dinamico').forEach(el => el.innerText = isAzienda ? "Ateco: " + window.getVal('cfg-ateco') : window.getVal('cfg-ente-contatti'));
    
    document.querySelectorAll('.val-ruolo-firma-3').forEach(el => el.innerText = isAzienda ? "Referente formazione / Responsabile progetto formativo" : "Il Legale Rappresentante dell'Ente");
    document.querySelectorAll('.val-firma-3-nome').forEach(el => el.innerText = isAzienda ? (respProgetto || window.getVal('cfg-azienda-referente') || "---") : (window.getVal('cfg-legale-nome') || respProgetto || "---"));
    document.querySelectorAll('.val-testo-timbro').forEach(el => el.innerHTML = isAzienda ? "TIMBRO<br>AZIENDA" : "TIMBRO<br>EROGATORE");

    const sedeToDisplay = window.getVal('cfg-sede-corso') || window.getVal('cfg-azienda-indirizzo') || "Sede Aziendale";
    document.querySelectorAll('.val-ente').forEach(el => el.innerText = isAzienda ? (window.getVal('cfg-azienda') || "---") : (window.getVal('cfg-ente') || "---"));
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

    const logoUrl = window.getEffectiveLogoSrc ? window.getEffectiveLogoSrc() : (window.getVal('cfg-logo') || '');
    document.querySelectorAll('.logo-img').forEach(img => {
        if(logoUrl){ img.src=logoUrl; img.classList.remove('hidden'); }
        else img.classList.add('hidden');
    });
    const timbroUrl = window.getEffectiveTimbroSrc ? window.getEffectiveTimbroSrc() : '';
    document.querySelectorAll('.stamp-img').forEach(img => {
        if (timbroUrl) { img.src = timbroUrl; img.classList.remove('hidden'); }
        else img.classList.add('hidden');
    });
    document.querySelectorAll('.stamp-placeholder').forEach(el => {
        el.style.display = timbroUrl ? 'none' : '';
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


// ==========================================
// ARCHIVIO IMPRESE / ENTI
// ==========================================
window.archivioCorsiState = { progetti: [], aziende: [], iscrizioniByProject: {} };

window.loadArchivioCorsi = async function() {
    const container = document.getElementById('archivio-corsi-container');
    if (!container) return;
    container.innerHTML = '<div class="p-8 text-center text-slate-400 font-bold uppercase"><i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto mb-2"></i> Caricamento archivio...</div>';
    if (typeof lucide !== 'undefined') lucide.createIcons();

    const [progetti, aziende] = await Promise.all([window.getProgetti(), window.getAziende()]);
    window.archivioCorsiState.progetti = progetti || [];
    window.archivioCorsiState.aziende = aziende || [];
    const ids = window.archivioCorsiState.progetti.map(p => p.id).filter(Boolean);
    window.archivioCorsiState.iscrizioniByProject = window.getIscrizioniPerProgetti
        ? await window.getIscrizioniPerProgetti(ids)
        : await window.buildIscrizioniMapFallback(window.archivioCorsiState.progetti);

    window.renderArchivioCorsi();
};

window.renderArchivioCorsi = function() {
    const container = document.getElementById('archivio-corsi-container');
    if (!container) return;

    const q = (document.getElementById('archivio-search')?.value || '').toLowerCase();
    const stato = document.getElementById('archivio-filter-stato')?.value || '';
    const progetti = window.archivioCorsiState.progetti || [];
    const aziende = window.archivioCorsiState.aziende || [];
    const iscrizioniByProject = window.archivioCorsiState.iscrizioniByProject || {};

    const groups = [];
    aziende.forEach(az => {
        const ps = progetti.filter(p => p.azienda_id === az.id && (!stato || (p.stato_corso || 'aperto') === stato));
        if (!ps.length) return;
        groups.push({ type: 'azienda', title: az.ragione_sociale, subtitle: `${az.piva_cf || ''} ${az.ateco ? '· ATECO ' + az.ateco : ''}`, progetti: ps });
    });

    const enteProjects = progetti.filter(p => p.ente_erogatore === 'ente' && (!stato || (p.stato_corso || 'aperto') === stato));
    if (enteProjects.length) {
        groups.unshift({ type: 'ente', title: window.getVal('cfg-ente') || 'Ente formatore / erogatore', subtitle: 'Corsi erogati come associazione/ente di diretta emanazione', progetti: enteProjects });
    }

    const filtered = groups.map(g => {
        const ps = g.progetti.filter(p => {
            const course = window.DB_CORSI[p.corso_id]?.t || p.corso_id;
            const iscritti = iscrizioniByProject[p.id] || [];
            const hay = [g.title, g.subtitle, p.codice, course, p.aziende?.ragione_sociale, ...iscritti.map(i => `${i.corsisti?.nome_cognome || ''} ${i.corsisti?.cf || ''}`)].join(' ').toLowerCase();
            return !q || hay.includes(q);
        });
        return { ...g, progetti: ps };
    }).filter(g => g.progetti.length);

    if (!filtered.length) {
        container.innerHTML = '<div class="p-8 bg-white rounded-xl border border-slate-200 text-center text-slate-500 font-bold uppercase">Nessun corso trovato per i filtri selezionati.</div>';
        return;
    }

    container.innerHTML = filtered.map(g => `
        <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div class="p-4 ${g.type === 'ente' ? 'bg-emerald-50 border-emerald-100' : 'bg-blue-50 border-blue-100'} border-b flex justify-between items-start gap-4">
                <div>
                    <p class="font-black uppercase ${g.type === 'ente' ? 'text-emerald-900' : 'text-blue-900'}">${window.dashEscape(g.title)}</p>
                    <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">${window.dashEscape(g.subtitle || '')}</p>
                </div>
                <span class="px-3 py-1 rounded-full bg-white border border-slate-200 text-[10px] font-black uppercase text-slate-700">${g.progetti.length} corsi</span>
            </div>
            <div class="divide-y divide-slate-100">
                ${g.progetti.map(p => {
                    const course = window.DB_CORSI[p.corso_id]?.t || p.corso_id;
                    const iscritti = iscrizioniByProject[p.id] || [];
                    const stato = p.stato_corso || 'aperto';
                    const badge = stato === 'chiuso' ? 'bg-slate-900 text-white' : (stato === 'svolto' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800');
                    return `<div class="p-4">
                        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                            <div>
                                <button onclick="window.apriPopupProgettoById('${p.id}', 'progetti')" class="font-mono text-rose-700 hover:underline font-black text-xs">${window.dashEscape(p.codice || '')}</button>
                                <p class="font-black text-slate-900 uppercase text-sm mt-1">${window.dashEscape(course)}</p>
                                <p class="text-[10px] text-slate-500 uppercase mt-0.5">Esame: ${window.formatDataToItalian(p.data_esame)} · Corsisti: ${iscritti.length}</p>
                                ${p.documenti_firmati_url ? `<a href="${window.dashEscape(p.documenti_firmati_url)}" target="_blank" class="inline-block mt-2 text-[10px] font-black text-blue-700 hover:underline uppercase">Apri scansioni documenti firmati</a>` : ''}
                            </div>
                            <span class="px-3 py-1 rounded-full ${badge} text-[9px] font-black uppercase self-start">${window.dashEscape(stato)}</span>
                        </div>
                        <div class="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                            ${iscritti.length ? iscritti.map(isc => `<div class="border border-slate-200 bg-slate-50 rounded-lg p-2">
                                <p class="font-black uppercase text-slate-900 text-[11px]">${window.dashEscape(isc.corsisti?.nome_cognome || '-')}</p>
                                <p class="font-mono text-[9px] text-slate-500">${window.dashEscape(isc.corsisti?.cf || '-')}</p>
                                <p class="text-[9px] text-slate-500 mt-1">${window.dashEscape(isc.mansione_storica || isc.corsisti?.mansione_storica || '-')}</p>
                            </div>`).join('') : '<div class="text-[10px] text-red-600 font-bold uppercase">Nessun corsista abbinato</div>'}
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>
    `).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
};


// ==========================================
// STAMPA PDF COMPLETA PROGETTO + ATTESTATI
// ==========================================
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
window.backupLog = function(message) {
    const box = document.getElementById('backup-db-status');
    if (!box) return;
    box.classList.remove('hidden');
    box.innerHTML += `[${new Date().toLocaleTimeString('it-IT')}] ${window.dashEscape ? window.dashEscape(message) : message}<br>`;
    box.scrollTop = box.scrollHeight;
};

window.downloadBlobFile = function(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        URL.revokeObjectURL(url);
        a.remove();
    }, 1000);
};

window.esportaBackupDatabaseLocale = async function() {
    if (!window.supabaseClient) return alert('Supabase non configurato.');
    const status = document.getElementById('backup-db-status');
    if (status) status.innerHTML = '';

    const tables = [
        'enti',
        'aziende',
        'docenti',
        'corsisti',
        'progetti',
        'iscrizioni',
        'firme_digitali',
        'test_digitali',
        'export_fascicoli',
        'ente'
    ];

    const backup = {
        meta: {
            app: 'SafetyManager PRO',
            version: 'ASR2025 step15',
            exported_at: new Date().toISOString(),
            source: 'Supabase client export',
            note: 'Backup locale JSON creato dal browser. Non contiene chiavi service_role.'
        },
        tables: {},
        errors: {}
    };

    window.backupLog('Avvio esportazione backup locale...');
    for (const table of tables) {
        try {
            window.backupLog(`Lettura tabella ${table}...`);
            const { data, error } = await window.supabaseClient
                .from(table)
                .select('*');
            if (error) throw error;
            backup.tables[table] = data || [];
            window.backupLog(`OK ${table}: ${(data || []).length} record.`);
        } catch (e) {
            backup.tables[table] = [];
            backup.errors[table] = e.message || String(e);
            window.backupLog(`SKIP ${table}: ${backup.errors[table]}`);
        }
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `SafetyManager_backup_${stamp}.zip`;

    try {
        if (typeof JSZip !== 'undefined') {
            const zip = new JSZip();
            zip.file('backup_completo.json', JSON.stringify(backup, null, 2));
            zip.file('manifest.json', JSON.stringify(backup.meta, null, 2));
            const folder = zip.folder('tabelle');
            Object.entries(backup.tables).forEach(([table, rows]) => {
                folder.file(`${table}.json`, JSON.stringify(rows, null, 2));
            });
            if (Object.keys(backup.errors).length) {
                zip.file('ERRORI_EXPORT.json', JSON.stringify(backup.errors, null, 2));
            }
            const blob = await zip.generateAsync({ type: 'blob' });
            window.downloadBlobFile(blob, filename);
        } else {
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            window.downloadBlobFile(blob, filename.replace('.zip', '.json'));
        }
        window.backupLog(`Backup creato: ${filename}`);
        alert('Backup database scaricato sul PC.');
    } catch (e) {
        console.error(e);
        alert('Errore nella creazione del backup: ' + (e.message || e));
        window.backupLog(`ERRORE: ${e.message || e}`);
    }
};


// ==========================================
// RIPRISTINO BACKUP LOCALE DATABASE
// ==========================================
window.restoreBackupParsed = null;

window.restoreLog = function(message) {
    const box = document.getElementById('restore-db-status');
    if (!box) return;
    box.classList.remove('hidden');
    box.innerHTML += `[${new Date().toLocaleTimeString('it-IT')}] ${window.dashEscape ? window.dashEscape(message) : message}<br>`;
    box.scrollTop = box.scrollHeight;
};

window.leggiFileBackupLocale = async function() {
    const input = document.getElementById('restore-backup-file');
    const file = input?.files?.[0];
    if (!file) throw new Error('Seleziona un file backup .zip o .json.');

    const name = file.name.toLowerCase();
    if (name.endsWith('.zip')) {
        if (typeof JSZip === 'undefined') throw new Error('JSZip non disponibile: impossibile leggere backup ZIP.');
        const zip = await JSZip.loadAsync(file);
        let content = null;
        if (zip.file('backup_completo.json')) {
            content = await zip.file('backup_completo.json').async('string');
        } else if (zip.file('manifest.json')) {
            // Backup separato: ricostruisce dalle tabelle JSON.
            const tables = {};
            const entries = Object.keys(zip.files).filter(k => k.startsWith('tabelle/') && k.endsWith('.json'));
            for (const key of entries) {
                const table = key.split('/').pop().replace(/\.json$/,'');
                tables[table] = JSON.parse(await zip.file(key).async('string'));
            }
            return { meta: { source: 'Ricostruito da ZIP tabelle' }, tables, errors: {} };
        } else {
            throw new Error('Backup ZIP non valido: manca backup_completo.json o cartella tabelle/.');
        }
        return JSON.parse(content);
    }

    if (name.endsWith('.json')) {
        return JSON.parse(await file.text());
    }

    throw new Error('Formato non supportato. Usa .zip o .json.');
};

window.normalizzaBackupSafetyManager = function(raw) {
    if (!raw) throw new Error('Backup vuoto.');
    if (raw.tables && typeof raw.tables === 'object') return raw;
    // Supporto backup singola tabella o vecchi export array.
    if (Array.isArray(raw)) return { meta: { source: 'Array JSON generico' }, tables: { import_generico: raw }, errors: {} };
    throw new Error('Struttura backup non riconosciuta.');
};

window.analizzaBackupDaRipristinare = async function() {
    const box = document.getElementById('restore-db-status');
    if (box) box.innerHTML = '';
    try {
        window.restoreLog('Lettura file backup...');
        const raw = await window.leggiFileBackupLocale();
        const backup = window.normalizzaBackupSafetyManager(raw);
        window.restoreBackupParsed = backup;

        const tables = Object.entries(backup.tables || {});
        if (!tables.length) throw new Error('Nessuna tabella trovata nel backup.');

        window.restoreLog(`Backup letto. Tabelle trovate: ${tables.length}.`);
        tables.forEach(([table, rows]) => window.restoreLog(`${table}: ${Array.isArray(rows) ? rows.length : 0} record.`));
        if (backup.meta?.exported_at) window.restoreLog(`Data backup: ${backup.meta.exported_at}`);
        alert('Backup analizzato correttamente. Controlla il log prima di ripristinare.');
    } catch (e) {
        console.error(e);
        window.restoreLog(`ERRORE ANALISI: ${e.message || e}`);
        alert('Errore analisi backup: ' + (e.message || e));
    }
};

window.ripristinaBackupDatabaseLocale = async function() {
    if (!window.supabaseClient) return alert('Supabase non configurato.');
    try {
        if (!window.restoreBackupParsed) {
            await window.analizzaBackupDaRipristinare();
        }
        const backup = window.restoreBackupParsed;
        if (!backup || !backup.tables) throw new Error('Backup non caricato.');

        const tablesOrder = [
            'enti',
            'ente',
            'aziende',
            'docenti',
            'corsisti',
            'progetti',
            'iscrizioni',
            'firme_digitali',
            'test_digitali',
            'export_fascicoli'
        ];

        const present = Object.keys(backup.tables);
        const ordered = [
            ...tablesOrder.filter(t => present.includes(t)),
            ...present.filter(t => !tablesOrder.includes(t) && t !== 'import_generico')
        ];

        if (!ordered.length) throw new Error('Nessuna tabella ripristinabile trovata.');
        const msg = `Ripristino conservativo di ${ordered.length} tabelle. I record con stesso ID verranno aggiornati/inseriti. Continuare?`;
        if (!confirm(msg)) return;

        window.restoreLog('Avvio ripristino conservativo...');
        for (const table of ordered) {
            const rows = backup.tables[table];
            if (!Array.isArray(rows) || !rows.length) {
                window.restoreLog(`SKIP ${table}: nessun record.`);
                continue;
            }

            window.restoreLog(`Ripristino ${table}: ${rows.length} record...`);
            const chunkSize = 200;
            let done = 0;
            for (let i = 0; i < rows.length; i += chunkSize) {
                const chunk = rows.slice(i, i + chunkSize).map(row => {
                    const clean = { ...row };
                    // Evita colonne virtuali/join eventualmente finite nel backup.
                    Object.keys(clean).forEach(k => {
                        if (clean[k] && typeof clean[k] === 'object' && !Array.isArray(clean[k]) && ['aziende','corsisti'].includes(k)) {
                            delete clean[k];
                        }
                    });
                    return clean;
                });

                const { error } = await window.supabaseClient
                    .from(table)
                    .upsert(chunk, { onConflict: 'id' });
                if (error) throw new Error(`${table}: ${error.message}`);
                done += chunk.length;
                window.restoreLog(`${table}: ${done}/${rows.length}`);
            }
            window.restoreLog(`OK ${table}.`);
        }

        window.restoreLog('Ripristino completato.');
        alert('Ripristino backup completato. Ricarica le schermate per vedere i dati aggiornati.');
    } catch (e) {
        console.error(e);
        window.restoreLog(`ERRORE RIPRISTINO: ${e.message || e}`);
        alert('Errore ripristino backup: ' + (e.message || e));
    }
};


// ==========================================
// EXPORT / STAMPA PDF SEZIONI OPERATIVE
// ==========================================
window.SECTION_EXPORT_LABELS = {
    aziende: 'Aziende',
    corsisti: 'Corsisti',
    docenti: 'Docenti',
    progetti: 'Progetti',
    archivio_corsi: 'Archivio',
    scadenze: 'Scadenze'
};

window.injectSectionExportToolbar = function(moduleId) {
    const label = window.SECTION_EXPORT_LABELS[moduleId];
    const container = document.getElementById('app-content');
    if (!label || !container || document.getElementById('section-export-toolbar')) return;

    const toolbar = document.createElement('div');
    toolbar.id = 'section-export-toolbar';
    toolbar.className = 'section-export-toolbar';
    toolbar.innerHTML = `
        <div>
            <p class="section-export-title">Esportazione / stampa sezione</p>
            <p class="text-xs text-slate-400 mt-1">${window.dashEscape ? window.dashEscape(label) : label} · Salvataggio Excel e stampa PDF</p>
        </div>
        <div class="section-export-actions">
            <button type="button" onclick="window.esportaSezioneExcel('${moduleId}')" class="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm">
                <i data-lucide="file-spreadsheet" class="w-4 h-4"></i> Esporta XLSX
            </button>
            <button type="button" onclick="window.stampaSezionePdf('${moduleId}')" class="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm">
                <i data-lucide="printer" class="w-4 h-4"></i> Stampa PDF
            </button>
        </div>`;

    const header = container.querySelector('.border-b-2');
    if (header) header.insertAdjacentElement('afterend', toolbar);
    else container.prepend(toolbar);
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.exportDateStamp = function() {
    return new Date().toISOString().slice(0,19).replace(/[:T]/g, '-');
};

window.exportSafeFilename = function(name) {
    return String(name || 'export').replace(/[^a-z0-9_\-]+/gi, '_').replace(/_+/g, '_');
};

window.getCorsoExportLabel = function(corsoId) {
    const c = window.DB_CORSI && window.DB_CORSI[corsoId];
    return c ? `[${c.code || corsoId}] ${c.t}` : (corsoId || '');
};

window.getIscrizioniExportMap = async function(projects) {
    const ids = (projects || []).map(p => p.id).filter(Boolean);
    if (!ids.length) return {};
    if (window.getIscrizioniPerProgetti) return await window.getIscrizioniPerProgetti(ids);
    return await window.buildIscrizioniMapFallback(projects || []);
};

window.getSectionExportSheets = async function(moduleId) {
    const fmt = (v) => v ? (window.formatDataToItalian ? window.formatDataToItalian(v) : v) : '';

    if (moduleId === 'aziende') {
        const rows = (await window.getAziende()).map(a => ({
            'Ragione sociale': a.ragione_sociale || '',
            'P.IVA / C.F.': a.piva_cf || '',
            'Indirizzo': a.indirizzo || '',
            'ATECO': a.ateco || '',
            'Referente': a.referente || '',
            'Data creazione': fmt(a.created_at ? String(a.created_at).slice(0,10) : '')
        }));
        return [{ name: 'Aziende', rows }];
    }

    if (moduleId === 'corsisti') {
        const rows = (await window.getCorsisti()).map(c => ({
            'Nome e cognome': c.nome_cognome || '',
            'Codice fiscale': c.cf || '',
            'Nascita': c.luogo_data_nascita || '',
            'Mansione': c.mansione_storica || '',
            'Azienda': c.aziende?.ragione_sociale || '',
            'P.IVA azienda': c.aziende?.piva_cf || '',
            'ATECO': c.aziende?.ateco || '',
            'Data creazione': fmt(c.created_at ? String(c.created_at).slice(0,10) : '')
        }));
        return [{ name: 'Corsisti', rows }];
    }

    if (moduleId === 'docenti') {
        const rows = (await window.getDocenti()).map(d => ({
            'Nome e cognome': d.nome_cognome || '',
            'Codice fiscale': d.cf || '',
            'Qualifica': d.qualifica || '',
            'Email': d.email || '',
            'Telefono': d.telefono || '',
            'Data creazione': fmt(d.created_at ? String(d.created_at).slice(0,10) : '')
        }));
        return [{ name: 'Docenti', rows }];
    }

    if (moduleId === 'progetti') {
        const projects = await window.getProgetti();
        const iscrizioniMap = await window.getIscrizioniExportMap(projects);
        const projectRows = projects.map(p => {
            const iscritti = iscrizioniMap[p.id] || [];
            return {
                'Codice progetto': p.codice || '',
                'Corso': window.getCorsoExportLabel(p.corso_id),
                'Azienda committente': p.aziende?.ragione_sociale || '',
                'Soggetto formatore': p.ente_erogatore === 'azienda' ? 'Datore di lavoro' : 'Ente / associazione',
                'Modalità': p.modalita || '',
                'Data inizio': fmt(p.data_inizio),
                'Data esame': fmt(p.data_esame),
                'Sede': p.sede || '',
                'Responsabile progetto': p.resp_progetto || '',
                'Responsabile corso': p.resp_corso || '',
                'Stato corso': p.stato_corso || 'aperto',
                'Chiuso il': fmt(p.chiuso_at),
                'Link documenti firmati': p.documenti_firmati_url || '',
                'Numero corsisti': iscritti.length
            };
        });
        const iscrittiRows = projects.flatMap(p => (iscrizioniMap[p.id] || []).map(i => ({
            'Codice progetto': p.codice || '',
            'Corso': window.getCorsoExportLabel(p.corso_id),
            'Azienda committente': p.aziende?.ragione_sociale || '',
            'Corsista': i.corsisti?.nome_cognome || '',
            'Codice fiscale': i.corsisti?.cf || '',
            'Mansione': i.mansione_storica || i.corsisti?.mansione_storica || '',
            'ID attestato': i.id_certificato || '',
            'Esito': i.esito || '',
            'Scadenza': fmt(i.data_scadenza),
            'Frequenza %': i.percentuale_frequenza ?? '',
            'Voto test': i.voto_test ?? '',
            'Esito pratica': i.esito_pratica || ''
        })));
        return [{ name: 'Progetti', rows: projectRows }, { name: 'Iscrizioni', rows: iscrittiRows }];
    }

    if (moduleId === 'archivio_corsi') {
        const projects = await window.getProgetti();
        const iscrizioniMap = await window.getIscrizioniExportMap(projects);
        const rows = [];
        projects.forEach(p => {
            const iscritti = iscrizioniMap[p.id] || [];
            if (!iscritti.length) {
                rows.push({
                    'Azienda / Ente': p.aziende?.ragione_sociale || '',
                    'Codice progetto': p.codice || '',
                    'Corso': window.getCorsoExportLabel(p.corso_id),
                    'Data esame': fmt(p.data_esame),
                    'Stato corso': p.stato_corso || 'aperto',
                    'Corsista': '',
                    'Codice fiscale': '',
                    'Mansione': '',
                    'ID attestato': '',
                    'Scadenza': '',
                    'Documenti firmati': p.documenti_firmati_url || ''
                });
            } else {
                iscritti.forEach(i => rows.push({
                    'Azienda / Ente': p.aziende?.ragione_sociale || '',
                    'Codice progetto': p.codice || '',
                    'Corso': window.getCorsoExportLabel(p.corso_id),
                    'Data esame': fmt(p.data_esame),
                    'Stato corso': p.stato_corso || 'aperto',
                    'Corsista': i.corsisti?.nome_cognome || '',
                    'Codice fiscale': i.corsisti?.cf || '',
                    'Mansione': i.mansione_storica || i.corsisti?.mansione_storica || '',
                    'ID attestato': i.id_certificato || '',
                    'Scadenza': fmt(i.data_scadenza),
                    'Documenti firmati': p.documenti_firmati_url || ''
                }));
            }
        });
        return [{ name: 'Archivio', rows }];
    }

    if (moduleId === 'scadenze') {
        const list = window.allScadenzeList && window.allScadenzeList.length ? window.allScadenzeList : await window.fetchScadenzeData();
        const today = new Date(); today.setHours(0,0,0,0);
        const rows = list.map(i => {
            const d = i.data_scadenza ? new Date(i.data_scadenza) : null;
            const days = d ? Math.ceil((d.getTime() - today.getTime()) / 86400000) : '';
            return {
                'Corsista': i.corsisti?.nome_cognome || '',
                'Azienda': i.corsisti?.aziende?.ragione_sociale || '',
                'Referente': i.corsisti?.aziende?.referente || '',
                'Corso': window.getCorsoExportLabel(i.progetti?.corso_id),
                'Data esame': fmt(i.progetti?.data_esame),
                'Data scadenza': fmt(i.data_scadenza),
                'Giorni alla scadenza': days,
                'ID attestato': i.id_certificato || ''
            };
        });
        return [{ name: 'Scadenze', rows }];
    }

    return [];
};

window.esportaSezioneExcel = async function(moduleId) {
    try {
        const label = window.SECTION_EXPORT_LABELS[moduleId] || moduleId || 'export';
        const sheets = await window.getSectionExportSheets(moduleId);
        if (!sheets.length || sheets.every(s => !s.rows || !s.rows.length)) return alert('Nessun dato da esportare.');

        if (typeof XLSX === 'undefined') {
            return alert('Libreria Excel non caricata. Verifica la connessione internet o ricarica la pagina.');
        }
        const wb = XLSX.utils.book_new();
        sheets.forEach(s => {
            const rows = s.rows && s.rows.length ? s.rows : [{ 'Nessun dato': '' }];
            const ws = XLSX.utils.json_to_sheet(rows);
            const headers = Object.keys(rows[0] || {});
            ws['!cols'] = headers.map(h => {
                const maxLen = Math.min(42, Math.max(String(h).length, ...rows.slice(0, 200).map(r => String(r[h] ?? '').length)) + 2);
                return { wch: maxLen };
            });
            XLSX.utils.book_append_sheet(wb, ws, (s.name || 'Dati').slice(0,31));
        });
        XLSX.writeFile(wb, `${window.exportSafeFilename(label)}_${window.exportDateStamp()}.xlsx`);
    } catch (e) {
        console.error(e);
        alert('Errore esportazione Excel: ' + (e.message || e));
    }
};

window.exportRowsToHtmlTable = function(rows) {
    if (!rows || !rows.length) return '<p>Nessun dato.</p>';
    const headers = Object.keys(rows[0]);
    return `<table><thead><tr>${headers.map(h => `<th>${window.dashEscape(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${headers.map(h => `<td>${window.dashEscape(r[h] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
};

window.stampaSezionePdf = async function(moduleId) {
    try {
        const label = window.SECTION_EXPORT_LABELS[moduleId] || moduleId || 'sezione';
        const sheets = await window.getSectionExportSheets(moduleId);
        if (!sheets.length) return alert('Nessun dato da stampare.');
        const printArea = document.getElementById('print-area-temp');
        printArea.innerHTML = `
            <div class="export-print-page">
                <h1>${window.dashEscape(label)}</h1>
                <p style="font-size:8pt;color:#64748b;margin-bottom:6mm;">Esportazione generata il ${new Date().toLocaleString('it-IT')}</p>
                ${sheets.map(s => `<h2>${window.dashEscape(s.name || 'Dati')}</h2>${window.exportRowsToHtmlTable(s.rows || [])}`).join('')}
            </div>`;
        document.body.classList.add('is-printing-temp');
        setTimeout(() => {
            window.print();
            document.body.classList.remove('is-printing-temp');
            printArea.innerHTML = '';
        }, 500);
    } catch (e) {
        console.error(e);
        alert('Errore stampa PDF: ' + (e.message || e));
    }
};


// ==========================================
// COLLAUDO GENERALE SISTEMA
// ==========================================
window.collaudoReport = null;

window.collStatusClass = function(status) {
    if (status === 'ok') return 'border-emerald-200 bg-emerald-50 text-emerald-900';
    if (status === 'warn') return 'border-amber-200 bg-amber-50 text-amber-900';
    return 'border-red-200 bg-red-50 text-red-900';
};

window.collStatusLabel = function(status) {
    if (status === 'ok') return 'OK';
    if (status === 'warn') return 'Avviso';
    return 'Errore';
};

window.collAdd = function(report, area, name, status, details = '') {
    report.items.push({ area, name, status, details });
};

window.renderCollaudoDevice = function() {
    const box = document.getElementById('collaudo-device');
    if (!box) return;
    const nav = document.getElementById('top-nav');
    const navH = nav ? Math.round(nav.getBoundingClientRect().height) : 0;
    const mode = window.innerWidth < 768 ? 'Smartphone' : (window.innerWidth < 1180 ? 'Tablet / finestra media' : 'Desktop');
    box.innerHTML = `
        <div class="rounded-xl bg-slate-900 border border-slate-800 p-3"><span class="text-slate-500 uppercase text-[9px] font-black">Viewport</span><br><strong>${window.innerWidth} × ${window.innerHeight}</strong></div>
        <div class="rounded-xl bg-slate-900 border border-slate-800 p-3"><span class="text-slate-500 uppercase text-[9px] font-black">Modalità UI</span><br><strong>${mode}</strong></div>
        <div class="rounded-xl bg-slate-900 border border-slate-800 p-3"><span class="text-slate-500 uppercase text-[9px] font-black">Navbar</span><br><strong>${navH}px</strong></div>`;
};

window.runCollaudoSistema = async function() {
    const results = document.getElementById('collaudo-results');
    if (results) results.innerHTML = '<div class="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 font-bold uppercase tracking-widest text-xs"><i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto mb-3"></i> Collaudo in corso...</div>';
    if (typeof lucide !== 'undefined') lucide.createIcons();

    const report = {
        meta: {
            app: 'SafetyManager PRO',
            step: '22',
            executed_at: new Date().toISOString(),
            user_agent: navigator.userAgent,
            viewport: { width: window.innerWidth, height: window.innerHeight }
        },
        items: []
    };

    // Librerie frontend.
    [
        ['Supabase client', typeof window.supabaseClient !== 'undefined'],
        ['Lucide icons', typeof lucide !== 'undefined'],
        ['JSZip backup/export', typeof JSZip !== 'undefined'],
        ['XLSX export', typeof XLSX !== 'undefined'],
        ['PapaParse import CSV', typeof Papa !== 'undefined']
    ].forEach(([name, ok]) => window.collAdd(report, 'Librerie', name, ok ? 'ok' : 'error', ok ? 'Caricata' : 'Non disponibile'));

    // Funzioni critiche.
    [
        'loadProgettiTable',
        'getIscrizioniPerProgetti',
        'esportaSezioneExcel',
        'stampaSezionePdf',
        'esportaBackupDatabaseLocale',
        'ripristinaBackupDatabaseLocale',
        'loadArchivioCorsi',
        'stampaFascicoloCompletoPDF'
    ].forEach(fn => window.collAdd(report, 'Funzioni critiche', fn, typeof window[fn] === 'function' ? 'ok' : 'error', typeof window[fn] === 'function' ? 'Disponibile' : 'Mancante'));

    // Moduli HTML.
    const modules = ['admin','aziende','corsisti','docenti','progetti','archivio_corsi','scadenze','stampe','migrazione','ente','collaudo','attestato','registro','fascicolo_corso'];
    for (const m of modules) {
        try {
            const resp = await fetch(`modules/${m}.html`, { cache: 'no-store' });
            window.collAdd(report, 'Moduli HTML', `modules/${m}.html`, resp.ok ? 'ok' : 'error', resp.ok ? 'Caricabile' : `HTTP ${resp.status}`);
        } catch (e) {
            window.collAdd(report, 'Moduli HTML', `modules/${m}.html`, 'error', e.message || String(e));
        }
    }

    // Database e query principali.
    if (typeof window.supabaseClient === 'undefined') {
        window.collAdd(report, 'Database', 'Connessione Supabase', 'error', 'Client non configurato');
    } else {
        const tables = ['enti','aziende','docenti','corsisti','progetti','iscrizioni'];
        for (const table of tables) {
            try {
                const { error } = await window.supabaseClient.from(table).select('id').limit(1);
                window.collAdd(report, 'Database', table, error ? 'warn' : 'ok', error ? error.message : 'Query lettura OK');
            } catch (e) {
                window.collAdd(report, 'Database', table, 'warn', e.message || String(e));
            }
        }
    }

    // Performance Progetti + iscrizioni batch.
    try {
        const t0 = performance.now();
        const projects = await window.getProgetti();
        const ids = projects.map(p => p.id).filter(Boolean);
        const map = window.getIscrizioniPerProgetti ? await window.getIscrizioniPerProgetti(ids) : {};
        const t1 = performance.now();
        const countIscr = Object.values(map || {}).reduce((sum, arr) => sum + (arr ? arr.length : 0), 0);
        const ms = Math.round(t1 - t0);
        const status = ms < 1500 ? 'ok' : (ms < 4000 ? 'warn' : 'error');
        window.collAdd(report, 'Performance', 'Caricamento Progetti + iscrizioni batch', status, `${projects.length} progetti, ${countIscr} iscrizioni, ${ms} ms`);
    } catch (e) {
        window.collAdd(report, 'Performance', 'Caricamento Progetti + iscrizioni batch', 'warn', e.message || String(e));
    }

    // Responsive e layout.
    const nav = document.getElementById('top-nav');
    if (nav) {
        const rect = nav.getBoundingClientRect();
        const tooTall = rect.height > Math.max(170, window.innerHeight * 0.28);
        window.collAdd(report, 'Responsive', 'Navbar adattiva', tooTall ? 'warn' : 'ok', `Altezza navbar: ${Math.round(rect.height)}px`);
    } else {
        window.collAdd(report, 'Responsive', 'Navbar adattiva', 'warn', 'Navbar non trovata nel DOM corrente');
    }
    const appOffset = getComputedStyle(document.documentElement).getPropertyValue('--nav-offset') || '';
    window.collAdd(report, 'Responsive', 'Offset contenuto dinamico', appOffset ? 'ok' : 'warn', appOffset || 'Non impostato');

    // Export configurato.
    for (const mod of Object.keys(window.SECTION_EXPORT_LABELS || {})) {
        window.collAdd(report, 'Export sezioni', mod, 'ok', 'Toolbar export/stampa configurata');
    }

    // Risultati.
    const counts = {
        ok: report.items.filter(i => i.status === 'ok').length,
        warn: report.items.filter(i => i.status === 'warn').length,
        error: report.items.filter(i => i.status === 'error').length
    };
    report.summary = counts;
    window.collaudoReport = report;

    const setText = (id, value) => { const el = document.getElementById(id); if (el) el.innerText = value; };
    setText('collaudo-ok', counts.ok);
    setText('collaudo-warn', counts.warn);
    setText('collaudo-error', counts.error);
    setText('collaudo-esito', counts.error ? 'Errori' : (counts.warn ? 'Avvisi' : 'OK'));
    window.renderCollaudoDevice();

    if (results) {
        const byArea = {};
        report.items.forEach(item => {
            if (!byArea[item.area]) byArea[item.area] = [];
            byArea[item.area].push(item);
        });
        results.innerHTML = Object.entries(byArea).map(([area, items]) => `
            <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div class="bg-slate-900 text-white px-4 py-3">
                    <h2 class="font-black uppercase text-sm">${window.dashEscape(area)}</h2>
                </div>
                <div class="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    ${items.map(item => `
                        <div class="rounded-xl border p-3 ${window.collStatusClass(item.status)}">
                            <div class="flex items-start justify-between gap-2">
                                <p class="font-black uppercase text-[11px] leading-tight">${window.dashEscape(item.name)}</p>
                                <span class="text-[8px] font-black uppercase px-2 py-1 rounded bg-white/70">${window.collStatusLabel(item.status)}</span>
                            </div>
                            <p class="text-[10px] mt-2 leading-snug opacity-90">${window.dashEscape(item.details || '')}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.initCollaudoSistema = function() {
    window.renderCollaudoDevice();
    window.addEventListener('resize', () => {
        if (document.getElementById('collaudo-device')) window.renderCollaudoDevice();
    }, { passive: true });
};

window.esportaReportCollaudo = function() {
    if (!window.collaudoReport) {
        return alert('Esegui prima il collaudo.');
    }
    const blob = new Blob([JSON.stringify(window.collaudoReport, null, 2)], { type: 'application/json' });
    const name = `SafetyManager_collaudo_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`;
    if (window.downloadBlobFile) window.downloadBlobFile(blob, name);
    else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = name; document.body.appendChild(a); a.click();
        setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
    }
};
