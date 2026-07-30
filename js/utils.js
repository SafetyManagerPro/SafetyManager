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


window.invalidateSafetyDataCaches = function(reason = '') {
    const collapsedGroups = window.archivioCorsiState?.collapsedGroups || {};
    window.aziendeList = [];
    window.docentiList = [];
    window.corsistiList = [];
    window.progettiList = [];
    window.progettiIscrizioniMap = {};
    window.archivioCorsiState = { progetti: [], aziende: [], iscrizioniByProject: {}, collapsedGroups };
    window.foglioProgettiState = { selectedProjectId: null, iscritti: [] };
    console.info('[SafetyPRO] Cache dati invalidate', reason || '');
};

window.reloadLinkedViewsAfterMutation = async function(reason = '', options = {}) {
    window.invalidateSafetyDataCaches(reason);

    const jobs = [];
    const safeJob = (fn) => {
        if (typeof fn === 'function') jobs.push(fn().catch(err => console.warn('Reload vista collegata non riuscito:', err)));
    };

    if (document.getElementById('tabella-aziende')) safeJob(window.loadAziendeTable);
    if (document.getElementById('tabella-docenti')) safeJob(window.loadDocentiTable);
    if (document.getElementById('tabella-corsisti')) safeJob(window.loadCorsistiTable);
    if (document.getElementById('tabella-progetti') || document.getElementById('progetti-mobile-cards')) safeJob(window.loadProgettiTable);
    if (document.getElementById('archivio-corsi-container')) safeJob(window.loadArchivioCorsi);
    if (document.getElementById('filter-stampe-corso')) safeJob(window.initStampe);
    if (document.getElementById('foglio-progetto-select')) safeJob(window.initFogliProgetti);

    await Promise.allSettled(jobs);

    const selectedProjectForPrint = options.projectId || document.getElementById('stampa-progetto')?.value || window.currentProgettoStampaId;
    if (selectedProjectForPrint && document.getElementById('print-preview-container') && window.currentPrintModule) {
        await window.caricaDatiStampa(selectedProjectForPrint);
        if (typeof window.loadPrintPreview === 'function') await window.loadPrintPreview(window.currentPrintModule);
    }

    if (document.getElementById('dash-progetti-formativi-checks') && typeof window.loadDashboardCompliance === 'function') {
        await window.loadDashboardCompliance();
    }
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
    const raccoltaEl = document.getElementById('dash-raccolta-errori-checks');
    if (el) {
        el.innerHTML = '<div class="text-center text-slate-400 py-6"><i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto mb-2"></i> Verifica in corso...</div>';
    }
    if (raccoltaEl) {
        raccoltaEl.innerHTML = '<div class="text-center text-slate-400 py-6"><i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto mb-2"></i> Raccolta errori in corso...</div>';
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
        'dash-raccolta-errori-checks',
        'dash-raccolta-errori-badge',
        projectIssues,
        'Nessun errore operativo rilevato nei controlli automatici.'
    );

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
                <td class="p-3 border-b font-bold text-slate-800">
                    <button type="button" onclick="window.apriPopupRelazioniAzienda('${az.id}')" class="text-left text-blue-700 hover:text-blue-900 hover:underline font-black uppercase leading-tight">
                        ${window.dashEscape(az.ragione_sociale || '')}
                    </button>
                    <p class="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Clicca per progetti e corsisti</p>
                    ${az.sede_operativa ? `<p class="text-[9px] text-emerald-700 font-black uppercase mt-0.5">Sede operativa: ${window.dashEscape(az.sede_operativa)}</p>` : ''}
                </td>
                <td class="p-3 border-b font-mono text-[10px] text-slate-600">
                    ${window.dashEscape(az.piva_cf || '-')}
                    <div class="mt-2">${window.getDocumentoLinkHtml(az.legale_documento_url, 'Doc. legale')}</div>
                </td>
                <td class="p-3 border-b font-mono text-[10px] text-slate-500">${window.dashEscape(az.ateco || '-')}</td>
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
        sede_operativa: document.getElementById('az-sede-operativa') ? document.getElementById('az-sede-operativa').value.trim() : null,
        ateco: document.getElementById('az-ateco').value.trim(),
        referente: document.getElementById('az-referente').value.trim(),
        legale_documento_url: document.getElementById('az-legale-doc-url') ? document.getElementById('az-legale-doc-url').value.trim() : ''
    };
    if (id && id !== "") record.id = id;

    const result = await window.saveAzienda(record);
    if (result) {
        window.resetFormAzienda();
        await window.reloadLinkedViewsAfterMutation('azienda', { aziendaId: record.id });
    } 
};

window.modificaAzienda = function(id) {
    const az = window.aziendeList.find(a => a.id === id);
    if(!az) return;
    document.getElementById('az-id').value = az.id;
    document.getElementById('az-ragione-sociale').value = az.ragione_sociale;
    document.getElementById('az-piva').value = az.piva_cf;
    document.getElementById('az-indirizzo').value = az.indirizzo || "";
    if(document.getElementById('az-sede-operativa')) document.getElementById('az-sede-operativa').value = az.sede_operativa || "";
    document.getElementById('az-ateco').value = az.ateco || "";
    document.getElementById('az-referente').value = az.referente || "";
    if(document.getElementById('az-legale-doc-url')) document.getElementById('az-legale-doc-url').value = az.legale_documento_url || "";
};

window.eliminaAzienda = async function(id) {
    if(confirm("Sei sicuro di voler eliminare questa azienda? \n\nTutti i progetti ad essa collegati verranno eliminati.")) {
        if(await window.deleteAzienda(id)) {
            await window.reloadLinkedViewsAfterMutation('azienda-delete', { aziendaId: id });
        } else {
            alert("Errore durante l'eliminazione.");
        }
    }
};

window.resetFormAzienda = function() {
    document.getElementById('az-id').value = "";
    document.getElementById('form-azienda').reset();
    ['az-legale-doc-file'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
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
// POPUP RELAZIONI AZIENDA: PROGETTI E CORSISTI
// ==========================================
window.chiudiPopupRelazioniAzienda = function() {
    const modal = document.getElementById('azienda-relazioni-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};

window.openProjectFromAziendaPopup = async function(projectId) {
    window.chiudiPopupRelazioniAzienda();
    if (typeof window.apriPopupProgettoById === 'function') {
        await window.apriPopupProgettoById(projectId, 'progetti');
    } else {
        await window.loadModule('progetti');
    }
};

window.openCorsistaFromAziendaPopup = async function(corsistaId) {
    window.chiudiPopupRelazioniAzienda();
    await window.loadModule('corsisti');
    setTimeout(() => {
        if (typeof window.modificaCorsista === 'function') {
            window.modificaCorsista(corsistaId);
            const form = document.getElementById('form-corsista');
            if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 350);
};

window.renderAziendaProjectCard = function(p, iscritti = []) {
    const corso = window.DB_CORSI?.[p.corso_id];
    const nomeCorso = corso ? corso.t : (p.corso_id || '-');
    const sigla = corso ? corso.code : '';
    const stato = (p.stato_corso || 'aperto').toUpperCase();
    const statoClass = p.stato_corso === 'chiuso'
        ? 'bg-slate-700 text-white border-slate-600'
        : (p.stato_corso === 'svolto' ? 'bg-amber-300 text-amber-950 border-amber-400' : 'bg-emerald-300 text-emerald-950 border-emerald-400');

    return `<div class="rounded-xl border border-slate-700 bg-slate-900 p-3 shadow">
        <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            <div class="min-w-0">
                <button type="button" onclick="window.openProjectFromAziendaPopup('${p.id}')" class="font-mono text-rose-300 hover:text-rose-200 hover:underline font-black text-xs">
                    ${window.dashEscape(p.codice || 'Senza codice')}
                </button>
                <p class="text-[9px] text-slate-400 font-bold uppercase mt-1">Esame: ${window.formatDataToItalian(p.data_esame)} · Inizio: ${window.formatDataToItalian(p.data_inizio)}</p>
                <div class="mt-2 rounded-lg border border-blue-500/70 bg-blue-700 p-2">
                    <p class="text-[8px] text-blue-100 font-black uppercase tracking-widest">Corso svolto</p>
                    <p class="text-white font-black uppercase text-xs leading-tight"><span class="font-mono text-blue-100">[${window.dashEscape(sigla)}]</span> ${window.dashEscape(nomeCorso)}</p>
                </div>
            </div>
            <div class="shrink-0 flex md:flex-col gap-2 md:items-end">
                <span class="inline-flex items-center justify-center px-2 py-1 rounded-full border ${statoClass} font-black text-[8px] uppercase">${stato}</span>
                <span class="inline-flex items-center justify-center px-2 py-1 rounded-full border border-slate-600 bg-slate-800 text-slate-100 font-black text-[8px] uppercase">
                    ${iscritti.length} iscritti
                </span>
                <button type="button" onclick="window.openProjectFromAziendaPopup('${p.id}')" class="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-[9px] font-black uppercase inline-flex items-center gap-1">
                    <i data-lucide="external-link" class="w-3 h-3"></i> Apri progetto
                </button>
                <button type="button" onclick="window.stampaProgettoFormativoDaProgetto('${p.id}')" class="bg-indigo-700 hover:bg-indigo-600 text-white px-3 py-2 rounded-lg text-[9px] font-black uppercase inline-flex items-center gap-1">
                    <i data-lucide="file-text" class="w-3 h-3"></i> Stampa progetto
                </button>
                <button type="button" onclick="window.stampaAttestatiProgetto('${p.id}')" class="bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg text-[9px] font-black uppercase inline-flex items-center gap-1">
                    <i data-lucide="award" class="w-3 h-3"></i> Stampa attestati
                </button>
            </div>
        </div>
        ${iscritti.length ? `<div class="mt-3 pt-3 border-t border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-2">
            ${iscritti.slice(0, 6).map(isc => {
                const c = isc.corsisti || {};
                return `<div class="rounded-lg bg-slate-950 border border-slate-700 p-2">
                    <p class="font-black uppercase text-slate-100 text-[10px]">${window.dashEscape(c.nome_cognome || '-')}</p>
                    <p class="font-mono text-[9px] text-slate-400">${window.dashEscape(c.cf || '-')}</p>
                    <p class="text-[9px] text-amber-300 font-mono mt-0.5">${window.dashEscape(isc.id_certificato || 'Certificato da generare')}</p>
                </div>`;
            }).join('')}
            ${iscritti.length > 6 ? `<div class="rounded-lg bg-slate-950 border border-slate-700 p-2 text-slate-400 text-[10px] font-bold uppercase flex items-center">+ altri ${iscritti.length - 6} iscritti nel progetto</div>` : ''}
        </div>` : ''}
    </div>`;
};

window.renderAziendaCorsistaCard = function(c, progettiByCorsista = {}) {
    const corsi = progettiByCorsista[c.id] || [];
    return `<div class="rounded-xl border border-slate-700 bg-slate-900 p-3 shadow">
        <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
                <button type="button" onclick="window.openCorsistaFromAziendaPopup('${c.id}')" class="text-left font-black uppercase text-slate-100 hover:text-blue-300 hover:underline text-xs leading-tight">
                    ${window.dashEscape(c.nome_cognome || '-')}
                </button>
                <p class="font-mono text-[9px] text-slate-400 mt-0.5">${window.dashEscape(c.cf || '-')}</p>
                <p class="text-[9px] text-slate-500 font-bold uppercase mt-1">${window.dashEscape(c.mansione_storica || 'Mansione non indicata')}</p>
            </div>
            <button type="button" onclick="window.openCorsistaFromAziendaPopup('${c.id}')" class="shrink-0 bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg" title="Apri anagrafica corsista">
                <i data-lucide="user-round-pen" class="w-3.5 h-3.5"></i>
            </button>
        </div>
        <div class="mt-3 pt-2 border-t border-slate-700">
            <p class="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-1">Corsi svolti / iscrizioni</p>
            ${corsi.length ? `<div class="space-y-1">
                ${corsi.slice(0, 4).map(p => `<button type="button" onclick="window.openProjectFromAziendaPopup('${p.id}')" class="block w-full text-left rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 px-2 py-1.5 text-[9px] text-blue-300 font-bold">
                    ${window.dashEscape(p.codice || '')} · ${window.dashEscape(window.DB_CORSI?.[p.corso_id]?.code || p.corso_id || '')} · ${window.formatDataToItalian(p.data_esame)}
                </button>`).join('')}
                ${corsi.length > 4 ? `<p class="text-[9px] text-slate-500 font-bold uppercase">+ altri ${corsi.length - 4} corsi</p>` : ''}
            </div>` : '<p class="text-[9px] text-slate-500 italic">Nessun corso collegato.</p>'}
        </div>
    </div>`;
};

window.apriPopupRelazioniAzienda = async function(aziendaId) {
    const modal = document.getElementById('azienda-relazioni-modal');
    const title = document.getElementById('azienda-relazioni-title');
    const summary = document.getElementById('azienda-relazioni-summary');
    const content = document.getElementById('azienda-relazioni-content');
    if (!modal || !content) return alert('Popup relazioni azienda non disponibile.');

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    content.innerHTML = '<div class="text-center text-slate-400 p-8"><i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto mb-2"></i> Caricamento relazioni azienda...</div>';
    if (typeof lucide !== 'undefined') lucide.createIcons();

    window.aziendeList = await window.getAziende();
    const azienda = (window.aziendeList || []).find(a => a.id === aziendaId);
    if (!azienda) {
        content.innerHTML = '<div class="text-red-300 font-bold p-6">Azienda non trovata.</div>';
        return;
    }

    if (title) title.innerText = `${azienda.ragione_sociale || ''} · ${azienda.piva_cf || 'P.IVA/C.F. non indicata'}`;

    const [allProjects, allCorsisti] = await Promise.all([
        window.getProgetti(),
        window.getCorsisti()
    ]);

    const progetti = (allProjects || []).filter(p => p.azienda_id === aziendaId);
    const corsisti = (allCorsisti || []).filter(c => c.azienda_id === aziendaId);
    const iscrizioniMap = window.getIscrizioniPerProgetti ? await window.getIscrizioniPerProgetti(progetti.map(p => p.id)) : {};

    const progettiByCorsista = {};
    progetti.forEach(p => {
        (iscrizioniMap[p.id] || []).forEach(isc => {
            const cid = isc.corsista_id || isc.corsisti?.id;
            if (!cid) return;
            if (!progettiByCorsista[cid]) progettiByCorsista[cid] = [];
            if (!progettiByCorsista[cid].some(x => x.id === p.id)) progettiByCorsista[cid].push(p);
        });
    });

    if (summary) summary.innerText = `${progetti.length} progetti · ${corsisti.length} corsisti aziendali`;

    content.innerHTML = `
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-3">
            <div class="rounded-2xl border border-amber-400 bg-amber-400 p-4 text-slate-950">
                <p class="text-[8px] font-black uppercase tracking-widest">Azienda committente</p>
                <h3 class="font-black uppercase text-lg leading-tight mt-1">${window.dashEscape(azienda.ragione_sociale || '-')}</h3>
                <p class="font-mono text-[10px] mt-2">${window.dashEscape(azienda.piva_cf || '-')}</p>
                <p class="text-[10px] font-bold mt-1">Sede legale: ${window.dashEscape(azienda.indirizzo || '-')}</p>
                <p class="text-[10px] font-bold mt-1">Sede operativa: ${window.dashEscape(azienda.sede_operativa || azienda.indirizzo || '-')}</p>
                <p class="text-[10px] font-bold mt-1">ATECO: ${window.dashEscape(azienda.ateco || '-')}</p>
                <p class="text-[10px] font-bold mt-1">Referente: ${window.dashEscape(azienda.referente || '-')}</p>
                <div class="mt-2">${window.getDocumentoLinkHtml(azienda.legale_documento_url, 'Documento legale rappresentante')}</div>
            </div>
            <div class="rounded-2xl border border-blue-500 bg-blue-700 p-4 text-white">
                <p class="text-[8px] font-black uppercase tracking-widest text-blue-100">Progetti collegati</p>
                <p class="text-4xl font-black mt-2">${progetti.length}</p>
                <p class="text-[10px] font-bold uppercase text-blue-100 mt-1">Corsi/progetti formativi riferiti a questa azienda</p>
            </div>
            <div class="rounded-2xl border border-emerald-500 bg-emerald-700 p-4 text-white">
                <p class="text-[8px] font-black uppercase tracking-widest text-emerald-100">Corsisti aziendali</p>
                <p class="text-4xl font-black mt-2">${corsisti.length}</p>
                <p class="text-[10px] font-bold uppercase text-emerald-100 mt-1">Anagrafiche dipendenti associate all'azienda</p>
            </div>
        </div>

        <section class="rounded-2xl border border-slate-700 bg-slate-950 p-4">
            <div class="flex items-center justify-between gap-3 mb-3">
                <h3 class="font-black uppercase text-white text-sm flex items-center gap-2"><i data-lucide="folder-kanban" class="w-4 h-4 text-blue-400"></i> Progetti relativi all'azienda</h3>
                <span class="text-[9px] text-slate-400 font-black uppercase tracking-widest">${progetti.length} risultati</span>
            </div>
            <div class="space-y-3">
                ${progetti.length ? progetti.map(p => window.renderAziendaProjectCard(p, iscrizioniMap[p.id] || [])).join('') : '<div class="rounded-xl border border-slate-700 bg-slate-900 p-4 text-slate-400 text-xs italic">Nessun progetto collegato a questa azienda.</div>'}
            </div>
        </section>

        <section class="rounded-2xl border border-slate-700 bg-slate-950 p-4">
            <div class="flex items-center justify-between gap-3 mb-3">
                <h3 class="font-black uppercase text-white text-sm flex items-center gap-2"><i data-lucide="users" class="w-4 h-4 text-emerald-400"></i> Corsisti di questa azienda</h3>
                <span class="text-[9px] text-slate-400 font-black uppercase tracking-widest">${corsisti.length} risultati</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                ${corsisti.length ? corsisti.map(c => window.renderAziendaCorsistaCard(c, progettiByCorsista)).join('') : '<div class="rounded-xl border border-slate-700 bg-slate-900 p-4 text-slate-400 text-xs italic">Nessun corsista associato a questa azienda.</div>'}
            </div>
        </section>
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons();
};

// ==========================================
// LOGICA CRM: DOCENTI
// ==========================================
window.docentiList = [];


window.popolaSelectAziendaAppartenenzaDocente = async function(selectedValue = '') {
    const select = document.getElementById('doc-azienda-appartenenza');
    if (!select) return;
    if (!window.aziendeList || !window.aziendeList.length) {
        window.aziendeList = await window.getAziende();
    }

    const selected = String(selectedValue || '');
    const ragioni = (window.aziendeList || [])
        .map(a => a.ragione_sociale || '')
        .filter(Boolean);

    let html = '<option value="">-- Seleziona azienda da Anagrafica Aziende Clienti --</option>';
    ragioni.forEach(r => {
        html += `<option value="${window.dashEscape(r)}" ${selected === r ? 'selected' : ''}>${window.dashEscape(r)}</option>`;
    });

    if (selected && !ragioni.includes(selected)) {
        html += `<option value="${window.dashEscape(selected)}" selected>${window.dashEscape(selected)} (non presente in aziende clienti)</option>`;
    }

    select.innerHTML = html;
};


window.loadDocentiTable = async function() {
    const tbody = document.getElementById('tabella-docenti');
    if(!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-slate-400 italic"><i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto mb-2"></i> Caricamento...</td></tr>';
    if(typeof lucide !== 'undefined') lucide.createIcons();

    try {
        window.aziendeList = await window.getAziende();
        await window.popolaSelectAziendaAppartenenzaDocente();

        window.docentiList = await window.getDocenti();

        if (window.docentiList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-slate-500 italic">Nessun docente registrato.</td></tr>';
            return;
        }

        let html = '';
        window.docentiList.forEach(doc => {
            html += `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="p-3 border-b font-bold text-slate-800">${window.dashEscape(doc.nome_cognome || '')}</td>
                    <td class="p-3 border-b font-mono text-[10px] text-slate-600">${window.dashEscape(doc.cf || '')}</td>
                    <td class="p-3 border-b text-[10px] text-slate-500 truncate max-w-[150px]">${window.dashEscape(doc.qualifica || '')}</td>
                    <td class="p-3 border-b text-[10px] text-slate-600 font-bold uppercase">
                        ${window.dashEscape(doc.azienda_appartenenza || '-')}
                        <div class="flex flex-wrap gap-1 mt-2">
                            ${window.getDocumentoLinkHtml(doc.documento_identita_url, 'Doc. identità')}
                            ${window.getDocumentoLinkHtml(doc.codice_fiscale_url, 'Cod. fiscale')}
                            ${window.getDocumentoLinkHtml(doc.firma_docente_url, 'Firma')}
                        </div>
                    </td>
                    <td class="p-3 border-b text-center whitespace-nowrap">
                        <button onclick="window.modificaDocente('${doc.id}')" class="text-blue-600 hover:bg-blue-200 bg-blue-100 p-1.5 rounded transition shadow-sm" title="Modifica docente"><i data-lucide="edit" class="w-4 h-4"></i></button>
                        <button onclick="window.eliminaDocente('${doc.id}')" class="text-red-600 hover:bg-red-200 bg-red-100 p-1.5 rounded transition shadow-sm ml-1" title="Elimina docente"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
        if(typeof lucide !== 'undefined') lucide.createIcons();
    } catch (err) {
        console.error('Errore caricamento docenti:', err);
        tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-red-600 font-bold">
            Errore nel caricamento docenti: ${window.dashEscape(err?.message || String(err))}
        </td></tr>`;
    }
};

window.salvaDocenteDB = async function() {
    const id = document.getElementById('doc-id').value;
    const record = {
        nome_cognome: document.getElementById('doc-nome').value.trim(),
        cf: document.getElementById('doc-cf').value.trim().toUpperCase(),
        qualifica: document.getElementById('doc-qualifica').value,
        azienda_appartenenza: document.getElementById('doc-azienda-appartenenza') ? document.getElementById('doc-azienda-appartenenza').value.trim() : '',
        email: document.getElementById('doc-email').value.trim(),
        telefono: document.getElementById('doc-telefono').value.trim(),
        documento_identita_url: document.getElementById('doc-doc-identita-url') ? document.getElementById('doc-doc-identita-url').value.trim() : '',
        codice_fiscale_url: document.getElementById('doc-doc-cf-url') ? document.getElementById('doc-doc-cf-url').value.trim() : '',
        firma_docente_url: document.getElementById('doc-firma-url') ? document.getElementById('doc-firma-url').value.trim() : ''
    };
    if (id && id !== "") record.id = id;

    if (await window.saveDocente(record)) {
        await window.resetFormDocente();
        await window.reloadLinkedViewsAfterMutation('docente', { docenteId: record.id });
    } else {
        alert("Errore nel salvataggio del docente.");
    }
};

window.modificaDocente = async function(id) {
    const doc = window.docentiList.find(d => d.id === id);
    if(!doc) return;
    document.getElementById('doc-id').value = doc.id;
    document.getElementById('doc-nome').value = doc.nome_cognome;
    document.getElementById('doc-cf').value = doc.cf;
    document.getElementById('doc-qualifica').value = doc.qualifica;
    await window.popolaSelectAziendaAppartenenzaDocente(doc.azienda_appartenenza || "");
    document.getElementById('doc-email').value = doc.email || "";
    document.getElementById('doc-telefono').value = doc.telefono || "";
    if(document.getElementById('doc-doc-identita-url')) document.getElementById('doc-doc-identita-url').value = doc.documento_identita_url || "";
    if(document.getElementById('doc-doc-cf-url')) document.getElementById('doc-doc-cf-url').value = doc.codice_fiscale_url || "";
    if(document.getElementById('doc-firma-url')) {
        document.getElementById('doc-firma-url').value = doc.firma_docente_url || "";
        if (!document.getElementById('doc-firma-url').value) {
            const autoFirma = window.getAutoSignaturePathByNameAndRole(doc.nome || '', 'docente');
            if (autoFirma) document.getElementById('doc-firma-url').value = autoFirma;
        }
        window.showFirmaPreview('doc-firma-url', 'doc-firma-preview');
    }
};

window.eliminaDocente = async function(id) {
    if(confirm("Sei sicuro di voler eliminare questo docente?")) {
        if(await window.deleteDocente(id)) {
            await window.reloadLinkedViewsAfterMutation('docente-delete', { docenteId: id });
        }
    }
};

window.resetFormDocente = async function() {
    document.getElementById('doc-id').value = "";
    document.getElementById('form-docente').reset();
    await window.popolaSelectAziendaAppartenenzaDocente();
    ['doc-doc-identita-file','doc-doc-cf-file','doc-firma-file'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    if(document.getElementById('doc-firma-preview')) window.showFirmaPreview('doc-firma-url', 'doc-firma-preview');
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
    
    tbody.innerHTML = '<tr><td colspan="7" class="p-6 text-center text-slate-400 italic"><i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto mb-2"></i> Caricamento...</td></tr>';
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

    const filtroAzienda = document.getElementById('filter-corsisti-azienda');
    if (filtroAzienda) {
        const prevAz = filtroAzienda.value || '';
        let fHtml = '<option value="">Tutte le aziende</option>';
        window.aziendeList.forEach(az => {
            fHtml += `<option value="${az.id}">${window.dashEscape(az.ragione_sociale || '')}</option>`;
        });
        filtroAzienda.innerHTML = fHtml;
        if (prevAz) filtroAzienda.value = prevAz;
    }

    const filtroCorso = document.getElementById('filter-corsisti-corso');
    if (filtroCorso) {
        const prevCourse = filtroCorso.value || '';
        let cHtml = '<option value="">Tutti i corsi</option>';
        const corsiEntries = window.getActiveCorsiEntries ? window.getActiveCorsiEntries() : Object.entries(window.DB_CORSI || {}).filter(([_, c]) => !c.deprecated);
        corsiEntries.forEach(([key, c]) => {
            cHtml += `<option value="${key}">[${window.dashEscape(c.code || key)}] ${window.dashEscape(c.t || key)}</option>`;
        });
        filtroCorso.innerHTML = cHtml;
        if (prevCourse) filtroCorso.value = prevCourse;
    }

    let { data, error } = await supabaseClient
        .from('corsisti')
        .select(`
            id,
            cf,
            nome_cognome,
            luogo_data_nascita,
            mansione_storica,
            azienda_id,
            documento_identita_url,
            codice_fiscale_url,
            cittadinanza,
            studi_scolastici_italia,
            lingua_test_stato,
            lingua_test_data,
            lingua_test_parte1,
            lingua_test_parte2,
            lingua_test_parte3,
            lingua_test_valutatore,
            lingua_test_dichiarazione_dl,
            lingua_test_documento_url,
            lingua_test_note,
            aziende ( ragione_sociale, sede_operativa ),
            iscrizioni (
                id_certificato,
                progetto_id,
                progetti (
                    id,
                    codice,
                    corso_id,
                    data_esame,
                    azienda_id
                )
            )
        `)
        .order('nome_cognome', { ascending: true });

    if (error && (
        String(error.message || '').includes('lingua_test_') ||
        String(error.message || '').includes('cittadinanza') ||
        String(error.message || '').includes('studi_scolastici_italia')
    )) {
        console.warn('Campi verifica lingua italiana non ancora presenti: applica la migration Step 63. Riprovo senza colonne lingua.');
        const retry = await supabaseClient
            .from('corsisti')
            .select(`
                id,
                cf,
                nome_cognome,
                luogo_data_nascita,
                mansione_storica,
                azienda_id,
                documento_identita_url,
                codice_fiscale_url,
                aziende ( ragione_sociale, sede_operativa ),
                iscrizioni (
                    id_certificato,
                    progetto_id,
                    progetti (
                        id,
                        codice,
                        corso_id,
                        data_esame,
                        azienda_id
                    )
                )
            `)
            .order('nome_cognome', { ascending: true });
        data = retry.data;
        error = retry.error;
    }

    if (error && (String(error.message || '').includes('documento_identita_url') || String(error.message || '').includes('codice_fiscale_url') || String(error.message || '').includes('schema cache'))) {
        console.warn('Campi documentali corsisti non ancora presenti: applica la migration Step 47. Riprovo senza colonne documentali.');
        const retry = await supabaseClient
            .from('corsisti')
            .select(`
                id,
                cf,
                nome_cognome,
                luogo_data_nascita,
                mansione_storica,
                azienda_id,
                aziende ( ragione_sociale, sede_operativa ),
                iscrizioni (
                    id_certificato,
                    progetto_id,
                    progetti (
                        id,
                        codice,
                        corso_id,
                        data_esame,
                        azienda_id
                    )
                )
            `)
            .order('nome_cognome', { ascending: true });
        data = retry.data;
        error = retry.error;
    }

    if (error) {
        console.error("Errore relazionale corsisti:", error);
        tbody.innerHTML = '<tr><td colspan="7" class="p-6 text-center text-red-500 italic">Impossibile connettersi agli archivi.</td></tr>';
        return;
    }

    window.corsistiList = data || [];

    if (window.corsistiList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="p-6 text-center text-slate-500 italic">Nessun corsista registrato.</td></tr>';
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
                    const projectId = isc.progetti.id || isc.progetto_id;
                    const codice = isc.progetti.codice || '';
                    const siglaCorso = cInfo ? cInfo.code : (isc.progetti.corso_id || 'CRS');
                    cArr.push(`<div class="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">
                        <button type="button" onclick="window.apriProgettoDaCorsoSvolto('${projectId}', '${cor.id}')" class="min-w-0 block text-left font-black text-blue-700 hover:text-blue-900 hover:underline text-[11px] truncate" title="Apri progetto esistente ${codice}">• <span class="font-mono text-slate-900">[${window.dashEscape(siglaCorso)}]</span> ${window.dashEscape(tCorso)} <span class="font-mono text-[9px] text-slate-500">${window.dashEscape(codice)}</span></button>
                        <button type="button" onclick="window.stampaAttestatoCorsista('${projectId}', '${cor.id}')" class="shrink-0 bg-emerald-700 hover:bg-emerald-600 text-white rounded px-2 py-1 text-[8px] font-black uppercase" title="Stampa attestato corsista">Attestato</button>
                    </div>`);
                    dArr.push(`<button type="button" onclick="window.apriProgettoDaCorsoSvolto('${projectId}', '${cor.id}')" class="font-mono text-blue-700 hover:underline text-[10px]" title="Apri progetto esistente">${dFine}</button>`);
                }
            });
            if (cArr.length > 0) {
                corsiHtml = `<div class="space-y-1">${cArr.join('')}</div>`;
                dateHtml = `<div class="space-y-1">${dArr.join('')}</div>`;
            }
        }

        const corsiIds = (cor.iscrizioni || []).map(isc => isc.progetti?.corso_id || '').filter(Boolean).join('|');
        const linguaMeta = window.getLinguaTestStatusMeta
            ? window.getLinguaTestStatusMeta(cor.lingua_test_stato || 'non_richiesto')
            : { label: cor.lingua_test_stato || 'Non richiesto', cls: 'bg-slate-100 text-slate-700 border-slate-300' };
        const linguaDoc = cor.lingua_test_documento_url
            ? `<div class="mt-1">${window.getDocumentoLinkHtml(cor.lingua_test_documento_url, 'Test compilato')}</div>`
            : '';

        html += `
            <tr class="hover:bg-slate-50 transition-colors" data-corsista-azienda="${cor.azienda_id || ''}" data-corsista-corsi="${window.dashEscape(corsiIds)}">
                <td class="p-3 border-b font-bold text-slate-800 text-xs">${cor.nome_cognome}</td>
                <td class="p-3 border-b font-mono text-[10px] text-slate-600">${cor.cf}</td>
                <td class="p-3 border-b text-[10px] text-slate-600">
                    <p class="font-bold text-slate-700">${window.dashEscape(cor.mansione_storica || '-')}</p>
                    <p class="text-[9px] text-blue-700 uppercase font-black mt-0.5 tracking-wider">${nomeAzienda}</p>
                    <div class="flex flex-wrap gap-1 mt-2">
                        ${window.getDocumentoLinkHtml(cor.documento_identita_url, 'Doc. identità')}
                        ${window.getDocumentoLinkHtml(cor.codice_fiscale_url, 'Cod. fiscale')}
                    </div>
                </td>
                <td class="p-3 border-b">${corsiHtml}</td>
                <td class="p-3 border-b text-center">${dateHtml}</td>
                <td class="p-3 border-b text-center">
                    <span class="inline-flex rounded-full border px-2 py-1 text-[8px] font-black uppercase ${linguaMeta.cls}">${window.dashEscape(linguaMeta.label)}</span>
                    ${linguaDoc}
                </td>
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
        azienda_id: document.getElementById('cor-azienda').value || null,
        documento_identita_url: document.getElementById('cor-doc-identita-url') ? document.getElementById('cor-doc-identita-url').value.trim() : '',
        codice_fiscale_url: document.getElementById('cor-doc-cf-url') ? document.getElementById('cor-doc-cf-url').value.trim() : '',
        ...(typeof window.collectLinguaTestCorsistaRecord === 'function' ? window.collectLinguaTestCorsistaRecord() : {})
    };
    if (id && id !== "") record.id = id;

    const savedCorsista = await window.saveCorsistaData(record);
    if (savedCorsista) {
        const saved = Array.isArray(savedCorsista) ? savedCorsista[0] : savedCorsista;
        const corsistaId = saved?.id || record.id;
        if (corsistaId && typeof window.updateIscrizioniCorsistaSnapshot === 'function') {
            await window.updateIscrizioniCorsistaSnapshot(corsistaId, record);
        }
        window.resetFormCorsista();
        await window.reloadLinkedViewsAfterMutation('corsista', { corsistaId });
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
    if(document.getElementById('cor-doc-identita-url')) document.getElementById('cor-doc-identita-url').value = cor.documento_identita_url || "";
    if(document.getElementById('cor-doc-cf-url')) document.getElementById('cor-doc-cf-url').value = cor.codice_fiscale_url || "";
    if (typeof window.populateLinguaTestCorsistaForm === 'function') window.populateLinguaTestCorsistaForm(cor);
};

window.eliminaCorsistaData = async function(id) {
    if(confirm("Sicuro di voler eliminare questo corsista? Tutti i suoi attestati e le iscrizioni verranno perse irreversibilmente.")) {
        if(await window.deleteCorsistaData(id)) {
            await window.reloadLinkedViewsAfterMutation('corsista-delete', { corsistaId: id });
        }
    }
};

window.resetFormCorsista = function() {
    document.getElementById('cor-id').value = "";
    document.getElementById('form-corsista').reset();
    ['cor-doc-identita-file','cor-doc-cf-file'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    if (typeof window.resetLinguaTestCorsistaForm === 'function') window.resetLinguaTestCorsistaForm();
};


window.filtraCorsisti = function() {
    const textFilter = (document.getElementById('search-corsisti')?.value || '').toLowerCase();
    const aziendaFilter = document.getElementById('filter-corsisti-azienda')?.value || '';
    const corsoFilter = document.getElementById('filter-corsisti-corso')?.value || '';
    const rows = document.getElementById('tabella-corsisti')?.getElementsByTagName('tr') || [];

    for (let i = 0; i < rows.length; i++) {
        if(rows[i].cells.length === 1) continue;
        const textOk = !textFilter || rows[i].innerText.toLowerCase().includes(textFilter);
        const azOk = !aziendaFilter || rows[i].getAttribute('data-corsista-azienda') === aziendaFilter;
        const corsi = rows[i].getAttribute('data-corsista-corsi') || '';
        const corsoOk = !corsoFilter || corsi.split('|').includes(corsoFilter);
        rows[i].style.display = (textOk && azOk && corsoOk) ? "" : "none";
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
    if (!id && savedId && document.getElementById('prog-draft-corsista') && typeof window.aggiungiCorsistaDraftProgetto === 'function') {
        window.aggiungiCorsistaDraftProgetto(savedId);
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


// ==========================================
// STEP 47 - GESTIONE DOCUMENTI ANAGRAFICHE
// ==========================================
window.SAFETY_DOCUMENT_BUCKETS = {
    corsisti: 'documenti-corsisti',
    aziende: 'documenti-aziende',
    docenti: 'documenti-docenti',
    ente: 'documenti-ente'
};

window.SAFETY_DOCUMENT_FOLDERS = {
    corsisti: 'Documenti Corsisti',
    aziende: 'Documenti Aziende',
    docenti: 'Documenti Docenti',
    ente: 'Documenti Ente'
};

window.slugArchivioDocumento = function(value = 'record') {
    return String(value || 'record')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .substring(0, 90) || 'record';
};

window.getDocumentoLinkHtml = function(url, label = 'Documento') {
    if (!url) return '<span class="text-slate-400 italic text-[9px]">Nessun documento</span>';
    const raw = String(url || '').trim();
    const safeLabel = window.dashEscape ? window.dashEscape(label) : label;
    if (raw.startsWith('LOCAL_FILE::')) {
        const fileName = raw.replace('LOCAL_FILE::', '');
        return `<span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-black text-[8px] uppercase" title="${window.dashEscape(fileName)}">
            <i data-lucide="hard-drive" class="w-3 h-3"></i>${safeLabel}: locale
        </span>`;
    }
    const href = window.normalizzaDocumentoHref ? window.normalizzaDocumentoHref(raw) : raw;
    const safeUrl = window.dashEscape ? window.dashEscape(href) : href;
    return `<a href="${safeUrl}" target="_blank" rel="noopener" class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-black text-[8px] uppercase" title="${window.dashEscape(raw)}">
        <i data-lucide="external-link" class="w-3 h-3"></i>${safeLabel}
    </a>`;
};

window.getDocumentoArchivioOwnerKey = function(entityType) {
    if (entityType === 'corsisti') {
        return document.getElementById('cor-id')?.value ||
            document.getElementById('cor-cf')?.value ||
            document.getElementById('cor-nome')?.value ||
            `corsista_${Date.now()}`;
    }
    if (entityType === 'aziende') {
        return document.getElementById('az-id')?.value ||
            document.getElementById('az-piva')?.value ||
            document.getElementById('az-ragione-sociale')?.value ||
            `azienda_${Date.now()}`;
    }
    if (entityType === 'docenti') {
        return document.getElementById('doc-id')?.value ||
            document.getElementById('doc-cf')?.value ||
            document.getElementById('doc-nome')?.value ||
            `docente_${Date.now()}`;
    }
    if (entityType === 'ente') {
        return document.getElementById('ente-id')?.value ||
            document.getElementById('ente-piva')?.value ||
            document.getElementById('ente-ragione')?.value ||
            `ente_${Date.now()}`;
    }
    return `record_${Date.now()}`;
};


window.isLocalDocumentReference = function(url = '') {
    return String(url || '').startsWith('LOCAL_FILE::') || /^[A-Z]:\\/i.test(String(url || '')) || String(url || '').startsWith('file://');
};

window.normalizzaDocumentoHref = function(url = '') {
    const v = String(url || '').trim();
    if (!v) return '';
    if (v.startsWith('LOCAL_FILE::')) return '';
    if (/^[A-Z]:\\/i.test(v)) return 'file:///' + v.replaceAll('\\', '/');
    return v;
};

window.collegaDocumentoLocaleDaFile = function(fileInputId, targetInputId) {
    const fileInput = document.getElementById(fileInputId);
    const targetInput = document.getElementById(targetInputId);
    if (!fileInput || !targetInput) return alert('Campo file/link non trovato.');
    const file = fileInput.files && fileInput.files[0];
    if (!file) return alert('Seleziona un file. Per sicurezza il browser non consente di salvare il percorso completo: verrà salvato solo il nome file. Se vuoi un link apribile, incolla manualmente il percorso o un link di rete nel campo.');
    targetInput.value = `LOCAL_FILE::${file.name}`;
    targetInput.dispatchEvent(new Event('input', { bubbles: true }));
    alert('File agganciato senza upload server. È stato salvato solo il nome file. Per avere un richiamo apribile, incolla nel campo un percorso tipo file:///C:/... oppure un link a cartella condivisa/NAS/Drive.');
    return targetInput.value;
};

window.uploadDocumentoArchivio = async function(entityType, docType, fileInputId, targetInputId) {
    // Step 49: disattivato upload a Supabase/Server per i documenti anagrafici.
    // La webapp salva solo il link/percorso inserito nel campo o il nome del file scelto.
    return window.collegaDocumentoLocaleDaFile(fileInputId, targetInputId);
};

window.firmaManualeState = window.firmaManualeState || {};

window.showFirmaPreview = function(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (!input || !preview) return;
    const url = input.value || '';
    if (!url) {
        preview.innerHTML = '<span class="text-slate-400 italic text-[9px]">Nessuna firma caricata o disegnata.</span>';
        return;
    }
    preview.innerHTML = `<div class="rounded-lg border border-slate-200 bg-white p-2">
        <img src="${window.dashEscape ? window.dashEscape(url) : url}" alt="Firma" class="max-h-16 object-contain mx-auto">
        <p class="text-[8px] text-slate-400 font-bold uppercase text-center mt-1">Anteprima firma</p>
    </div>`;
};

window.openFirmaManuale = function(canvasId, targetInputId, previewId) {
    const box = document.getElementById(`${canvasId}-box`);
    const canvas = document.getElementById(canvasId);
    if (!box || !canvas) return alert('Area firma manuale non disponibile.');
    box.classList.remove('hidden');
    window.setupFirmaCanvas(canvasId, targetInputId, previewId);
    const st = window.firmaManualeState[canvasId];
    if (st && typeof st.resetCanvas === 'function') setTimeout(() => st.resetCanvas(), 60);
};

window.closeFirmaManuale = function(canvasId) {
    const box = document.getElementById(`${canvasId}-box`);
    if (box) box.classList.add('hidden');
};

window.setupFirmaCanvas = function(canvasId, targetInputId, previewId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const state = window.firmaManualeState[canvasId] || {};
    if (state.bound) return;

    const ctx = canvas.getContext('2d');
    const resetCanvas = () => {
        const rect = canvas.getBoundingClientRect();
        const ratio = window.devicePixelRatio || 1;
        canvas.width = Math.max(1, Math.floor(rect.width * ratio));
        canvas.height = Math.max(1, Math.floor(rect.height * ratio));
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, rect.width, rect.height);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        window.firmaManualeState[canvasId].hasInk = false;
    };
    const pos = (ev) => {
        const e = ev.touches ? ev.touches[0] : ev;
        const r = canvas.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const start = (ev) => {
        ev.preventDefault();
        const p = pos(ev);
        const st = window.firmaManualeState[canvasId];
        st.drawing = true;
        st.last = p;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
    };
    const move = (ev) => {
        const st = window.firmaManualeState[canvasId];
        if (!st.drawing) return;
        ev.preventDefault();
        const p = pos(ev);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        st.last = p;
        st.hasInk = true;
    };
    const end = () => {
        const st = window.firmaManualeState[canvasId];
        st.drawing = false;
        st.last = null;
    };

    window.firmaManualeState[canvasId] = { ...state, bound: true, drawing: false, hasInk: false, targetInputId, previewId, resetCanvas };
    setTimeout(resetCanvas, 50);

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', end);
};

window.clearFirmaManuale = function(canvasId) {
    const st = window.firmaManualeState[canvasId];
    if (st && typeof st.resetCanvas === 'function') st.resetCanvas();
};

window.saveFirmaManuale = function(canvasId) {
    const st = window.firmaManualeState[canvasId];
    const canvas = document.getElementById(canvasId);
    if (!st || !canvas) return alert('Firma manuale non disponibile.');
    if (!st.hasInk) return alert('Disegna prima la firma nello spazio bianco.');
    const dataUrl = canvas.toDataURL('image/png');
    const input = document.getElementById(st.targetInputId);
    if (input) {
        input.value = dataUrl;
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    window.showFirmaPreview(st.targetInputId, st.previewId);
    window.closeFirmaManuale(canvasId);
    alert('Firma manuale salvata nel campo. Ricorda di salvare la scheda.');
};

window.DEFAULT_ENTE_VALIDATORE = "CNA Artigiani Imprenditori D'Italia Avellino";
window.DEFAULT_OP_DESTINATARIO = "OPTA Avellino / OPRA Campania";
window.CNA_AVELLINO_PRESET = window.CNA_AVELLINO_PRESET || {
    ragione_sociale: "CNA Artigiani Imprenditori D'Italia Avellino",
    piva_cf: "P.IVA 02851400644 / C.F. 92002100649",
    indirizzo: "Via Serafino Soldi, 11/13 - 83100 Avellino",
    contatti: "Tel./Fax 0825 783345 | Email avellino@cna.it | PEC cna.avellino@pec.it | Web www.cnaavellino.it",
    luogo_emissione: "Avellino",
    logo_url: "logocna.png"
};

window.isCnaName = function(value) {
    return String(value || '').toUpperCase().includes('CNA ARTIGIANI IMPRENDITORI') || String(value || '').toUpperCase().includes('CNA');
};

window.applyDefaultSignatureInputs = window.applyDefaultSignatureInputs || function(){};

window.ensureCnaPresetState = function() {
    const p = window.CNA_AVELLINO_PRESET;
    const domName = document.getElementById('ente-ragione')?.value || document.getElementById('cfg-ente')?.value || '';
    const currentName = window.AppState['cfg-ente'] || domName;
    if (!window.isCnaName(currentName)) return false;

    window.AppState['cfg-ente'] = currentName || p.ragione_sociale;
    if (!window.AppState['cfg-ente-indirizzo']) window.AppState['cfg-ente-indirizzo'] = p.indirizzo;
    if (!window.AppState['cfg-ente-contatti']) window.AppState['cfg-ente-contatti'] = p.contatti;
    if (!window.AppState['cfg-luogo-emissione']) window.AppState['cfg-luogo-emissione'] = p.luogo_emissione;
    window.AppState['cfg-logo'] = p.logo_url;
    window.AppState['cfg-timbro'] = 'timbrocna.png';
    localStorage.setItem('SafetyManager.cnaLogoDefault', p.logo_url);
    localStorage.setItem('SafetyManager.cnaTimbroDefault', 'timbrocna.png');

    const logoInput = document.getElementById('cfg-logo');
    if (logoInput) logoInput.value = p.logo_url;
    return true;
};

window.isCnaErogatore = function() {
    const erogatore = window.getVal('cfg-ente-erogatore') || 'ente';
    if (erogatore === 'azienda') return false;
    window.ensureCnaPresetState();
    const nomeEnte = (window.getVal('cfg-ente') || window.AppState['cfg-ente'] || '').toUpperCase();
    return nomeEnte.includes('CNA');
};
window.getEffectiveLogoSrc = function() {
    const erogatore = window.getVal('cfg-ente-erogatore') || 'ente';
    if (erogatore === 'azienda') return '';
    const cna = window.isCnaErogatore();
    const configured = window.getVal('cfg-logo') || '';
    if (configured) return configured;
    if (cna) return localStorage.getItem('SafetyManager.cnaLogoDefault') || 'logocna.png';
    return '';
};
window.getEffectiveTimbroSrc = function() {
    const erogatore = window.getVal('cfg-ente-erogatore') || 'ente';
    if (erogatore === 'azienda') return '';
    return window.isCnaErogatore() ? (localStorage.getItem('SafetyManager.cnaTimbroDefault') || 'timbrocna.png') : '';
};

window.getEffectiveLegaleFirmaSrc = function() {
    return window.getVal('cfg-legale-firma-url') || window.AppState?.['cfg-legale-firma-url'] || '';
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

// ==========================================
// PREISCRIZIONE CORSISTI DURANTE INSERIMENTO PROGETTO
// ==========================================
window.progettoDraftCorsistiIds = window.progettoDraftCorsistiIds || [];

window.renderProgettoDraftCorsistiControls = function() {
    const sel = document.getElementById('prog-draft-corsista');
    const list = document.getElementById('prog-draft-iscritti-list');
    if (!sel || !list) return;

    const aziendaId = document.getElementById('prog-azienda')?.value || '';
    const corsisti = window.corsistiList || [];
    const selected = new Set(window.progettoDraftCorsistiIds || []);
    const same = corsisti.filter(c => aziendaId && c.azienda_id === aziendaId && !selected.has(c.id));
    const others = corsisti.filter(c => (!aziendaId || c.azienda_id !== aziendaId) && !selected.has(c.id));

    let html = '<option value="">-- Seleziona corsista --</option>';
    if (same.length) {
        html += '<optgroup label="📌 Dipendenti azienda committente">';
        same.forEach(c => {
            html += `<option value="${c.id}" style="background:#f59e0b;color:#111827;font-weight:900;">📌 ${window.dashEscape(c.nome_cognome || '')} (${window.dashEscape(c.cf || '')})</option>`;
        });
        html += '</optgroup>';
    }
    if (others.length) {
        html += '<optgroup label="Altri corsisti anagrafica">';
        others.forEach(c => {
            html += `<option value="${c.id}">${window.dashEscape(c.nome_cognome || '')} (${window.dashEscape(c.cf || '')})</option>`;
        });
        html += '</optgroup>';
    }
    sel.innerHTML = html;

    const staged = (window.progettoDraftCorsistiIds || [])
        .map(id => corsisti.find(c => c.id === id))
        .filter(Boolean);

    if (!staged.length) {
        list.innerHTML = '<div class="text-amber-800 font-bold uppercase">Nessun corsista preparato.</div>';
        return;
    }

    list.innerHTML = staged.map(c => `
        <div class="bg-white border border-amber-300 rounded-lg p-2 flex items-start justify-between gap-2 shadow-sm">
            <div>
                <p class="font-black uppercase text-slate-900">${window.dashEscape(c.nome_cognome || '')}</p>
                <p class="font-mono text-[9px] text-slate-500">${window.dashEscape(c.cf || '')}</p>
                <p class="text-[9px] text-slate-500">${window.dashEscape(c.mansione_storica || '')}</p>
            </div>
            <button type="button" onclick="window.rimuoviCorsistaDraftProgetto('${c.id}')" class="text-red-700 bg-red-100 hover:bg-red-200 rounded p-1.5" title="Rimuovi dalla preiscrizione">
                <i data-lucide="x" class="w-3 h-3"></i>
            </button>
        </div>
    `).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.aggiungiCorsistaDraftProgetto = function(corsistaId = null) {
    const sel = document.getElementById('prog-draft-corsista');
    const id = corsistaId || sel?.value || '';
    if (!id) return alert('Seleziona un corsista da aggiungere al progetto.');
    window.progettoDraftCorsistiIds = window.progettoDraftCorsistiIds || [];
    if (window.progettoDraftCorsistiIds.includes(id)) return alert('Corsista già presente nella preiscrizione.');
    window.progettoDraftCorsistiIds.push(id);
    window.renderProgettoDraftCorsistiControls();
};

window.rimuoviCorsistaDraftProgetto = function(corsistaId) {
    window.progettoDraftCorsistiIds = (window.progettoDraftCorsistiIds || []).filter(id => id !== corsistaId);
    window.renderProgettoDraftCorsistiControls();
};

window.apriQACorsistaDraftProgetto = function() {
    window.currentProgettoId = null;
    const modal = document.getElementById('qa-modal-corsista');
    if (!modal) return;
    const aziendaId = document.getElementById('prog-azienda')?.value || '';
    const set = (id, value='') => { const el = document.getElementById(id); if (el) el.value = value; };
    set('qa-cor-id');
    set('qa-cor-nome');
    set('qa-cor-cf');
    set('qa-cor-nascita');
    set('qa-cor-mansione');
    set('qa-cor-azienda-id', aziendaId);
    const title = document.getElementById('qa-cor-title');
    if (title) title.innerHTML = '<i data-lucide="user-plus" class="w-4 h-4"></i> Nuovo corsista per progetto';
    modal.classList.remove('hidden');
    document.getElementById('qa-cor-nome')?.focus();
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.buildIscrizioneRecord = function(project, corsista) {
    const corsoInfo = window.DB_CORSI[project.corso_id];
    let dataScadenzaISO = null;
    if (corsoInfo && corsoInfo.scad !== 99) {
        let dScad = new Date(project.data_esame);
        dScad.setFullYear(dScad.getFullYear() + corsoInfo.scad);
        const offsetDate = new Date(dScad.getTime() - (dScad.getTimezoneOffset() * 60000));
        dataScadenzaISO = offsetDate.toISOString().split('T')[0];
    }

    const annoCert = new Date(project.data_esame || Date.now()).getFullYear().toString().slice(-2);
    const cfPart = (corsista.cf || 'XXXXXX').replace(/[^A-Z0-9]/gi, '').toUpperCase().substring(0,6).padEnd(6, 'X');
    const seriale = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    const id_cert = `C${annoCert}-${project.codice}-${cfPart}-${seriale}`;

    return {
        progetto_id: project.id,
        corsista_id: corsista.id,
        id_certificato: id_cert,
        mansione_storica: corsista.mansione_storica || null,
        esito: "Idoneo",
        data_scadenza: dataScadenzaISO
    };
};

window.salvaDraftCorsistiPerProgetto = async function(project) {
    const ids = [...new Set(window.progettoDraftCorsistiIds || [])];
    if (!project?.id || !ids.length) return;

    const corsisti = window.corsistiList?.length ? window.corsistiList : await window.getCorsisti();
    let ok = 0;
    for (const id of ids) {
        const c = corsisti.find(x => x.id === id);
        if (!c) continue;
        if (project.ente_erogatore === 'azienda' && c.azienda_id !== project.azienda_id) {
            console.warn('Corsista non appartenente alla stessa azienda, non iscritto:', c.nome_cognome);
            continue;
        }
        const record = window.buildIscrizioneRecord(project, c);
        if (await window.saveIscrizione(record)) ok++;
    }
    if (ok) console.log(`Preiscritti ${ok} corsisti al progetto ${project.codice}`);
    window.progettoDraftCorsistiIds = [];
    window.renderProgettoDraftCorsistiControls();
};

window.calcolaDettagliProgetto = function() {
    const corsoId = document.getElementById('prog-corso').value;
    window.renderComplianceProgetto(corsoId);
    if (typeof window.renderProgettoDraftCorsistiControls === 'function') window.renderProgettoDraftCorsistiControls();
    if (typeof window.refreshFabbisogniForCompany === 'function') window.refreshFabbisogniForCompany();
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



window.ensureProgettiModuleReadyForProject = async function(projectId) {
    const formWasMissing = !document.getElementById('form-progetto');

    if (formWasMissing) {
        await window.loadModule('progetti');
        await window.waitForElement('#form-progetto', 5000);
    }

    if (!window.aziendeList || !window.aziendeList.length) window.aziendeList = await window.getAziende();
    if (!window.docentiList || !window.docentiList.length) window.docentiList = await window.getDocenti();
    if (!window.corsistiList || !window.corsistiList.length) window.corsistiList = await window.getCorsisti();

    const aziendaSelect = document.getElementById('prog-azienda');
    const aziendaOptionsReady = !aziendaSelect || (aziendaSelect.options && aziendaSelect.options.length > 1);
    const projectLoaded = window.progettiList && window.progettiList.some(p => p.id === projectId);

    if (!projectLoaded || !aziendaOptionsReady) {
        if (typeof window.loadProgettiTable === 'function' && (document.getElementById('tabella-progetti') || document.getElementById('progetti-mobile-cards'))) {
            await window.loadProgettiTable();
        } else {
            window.progettiList = await window.getProgetti();
        }
    }

    if (!window.progettiList || !window.progettiList.some(p => p.id === projectId)) {
        window.progettiList = await window.getProgetti();
    }

    return (window.progettiList || []).find(p => p.id === projectId) || null;
};

window.apriPopupProgettoById = async function(projectId, target = 'progetti') {
    if (!projectId) return;

    window.pendingProjectOpenId = projectId;
    const p = await window.ensureProgettiModuleReadyForProject(projectId);

    if (!p) {
        alert('Progetto non trovato tra i progetti attivi. Verifica che il corso collegato al corsista non sia stato eliminato.');
        return;
    }

    if (typeof window.modificaProgetto === 'function') {
        window.modificaProgetto(projectId);
    }

    await new Promise(resolve => setTimeout(resolve, 160));

    if (document.getElementById('prog-id')?.value !== projectId && typeof window.modificaProgetto === 'function') {
        window.modificaProgetto(projectId);
        await new Promise(resolve => setTimeout(resolve, 120));
    }

    if (typeof window.openProjectEditPopup === 'function') {
        await window.openProjectEditPopup(projectId, target);
    }
};

window.apriProgettoDaCorsoSvolto = async function(projectId, corsistaId = '') {
    if (!projectId) return alert('Progetto non collegato o non trovato.');
    await window.apriPopupProgettoById(projectId, 'progetti');

    // Evidenzia il corsista dentro al popup, se la card è presente.
    if (corsistaId) {
        setTimeout(() => {
            const node = document.querySelector(`[data-popup-corsista-id="${corsistaId}"]`);
            if (node) {
                node.classList.add('ring-2', 'ring-amber-400');
                node.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => node.classList.remove('ring-2', 'ring-amber-400'), 2500);
            }
        }, 350);
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
        el.style.backgroundColor = '#fffbeb';
        el.style.borderColor = '#f59e0b';
        el.style.boxShadow = '0 0 0 2px rgba(245,158,11,.25)';
    });
};

window.collectProjectFormSnapshot = function(projectId) {
    const original = (window.progettiList || []).find(x => x.id === projectId) || {};
    const fabbisogniSnapshot = typeof window.collectFabbisogniProjectRecord === 'function'
        ? window.collectFabbisogniProjectRecord()
        : {};
    const gradimentoSnapshot = typeof window.collectGradimentoMonitoraggioRecord === 'function'
        ? window.collectGradimentoMonitoraggioRecord()
        : {};
    const tutorRiesameSnapshot = typeof window.collectTutorRiesameRecord === 'function'
        ? window.collectTutorRiesameRecord()
        : {};
    return {
        ...original,
        ...fabbisogniSnapshot,
        ...gradimentoSnapshot,
        ...tutorRiesameSnapshot,
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
    if (typeof window.ensureProjectQualityPopupBox === 'function') window.ensureProjectQualityPopupBox();
    const qualityBox = document.getElementById('popup-project-quality');
    if (qualityBox && typeof window.renderProjectQualityDashboard === 'function') {
        qualityBox.innerHTML = window.renderProjectQualityDashboard(p, iscritti, 'popup');
    }
    window.clearProjectPopupFieldErrors();
    const errors = window.getProjectPopupFieldErrors(p, iscritti);

    errors.forEach(e => window.markProjectPopupFieldError(e.selector));

    if (box) {
        if (!errors.length) {
            box.className = 'hidden';
            box.innerHTML = '';
        } else {
            box.className = 'hidden';
            box.innerHTML = `<p class="font-black uppercase flex items-center gap-2"><i data-lucide="circle-alert" class="w-4 h-4"></i> Segnalazioni non bloccanti</p><ul class="list-disc ml-4 mt-1 space-y-0.5">${errors.map(e => `<li>${window.dashEscape ? window.dashEscape(e.message) : e.message}</li>`).join('')}</ul>`;
        }
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
                        return `<tr data-popup-corsista-id="${c.id || ''}" class="${incomplete ? 'bg-red-50' : 'bg-white'} border-b border-slate-200">
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

    if (typeof window.ensureProjectQualityPopupBox === 'function') window.ensureProjectQualityPopupBox();
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

    const first = document.getElementById('prog-azienda');
    if (first && target !== 'corsi_svolti') setTimeout(() => first.focus(), 100);
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
    const qualityBox = document.getElementById('popup-project-quality');

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
    if (qualityBox) qualityBox.remove();

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
                            <button onclick="window.stampaAttestatoCorsista('${projectId}', '${c.id || isc.corsista_id}')" class="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white" title="Stampa attestato individuale"><i data-lucide="award" class="w-3 h-3"></i></button>
                            ${typeof window.isLinguaTestRequired === 'function' && window.isLinguaTestRequired(c) ? `<button onclick="window.stampaTestLinguaCorsista('${projectId}', '${c.id || isc.corsista_id}')" class="p-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950" title="Stampa test lingua italiana"><i data-lucide="languages" class="w-3 h-3"></i></button>` : ''}
                            <button onclick="window.modificaCorsistaDaProgetto('${c.id || isc.corsista_id}','${projectId}')" class="p-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-white" title="Modifica corsista"><i data-lucide="edit-3" class="w-3 h-3"></i></button>
                            <button onclick="window.rimuoviIscrizione('${isc.id}', '${projectId}')" class="p-2 rounded-lg bg-red-600 hover:bg-red-500 text-white" title="Rimuovi dal corso"><i data-lucide="user-minus" class="w-3 h-3"></i></button>
                        </div>
                    </div>
                    <div class="mt-2 text-[9px] text-slate-200 space-y-0.5">
                        <p><span class="font-black uppercase text-slate-400">Mansione:</span> ${window.dashEscape(isc.mansione_storica || c.mansione_storica || '-')}</p>
                        <p><span class="font-black uppercase text-slate-400">Cert:</span> <span class="font-mono ${isc.id_certificato ? 'text-slate-100' : 'text-red-200 font-black'}">${window.dashEscape(isc.id_certificato || 'Mancante')}</span></p>
                        <p><span class="font-black uppercase text-slate-400">Esito:</span> <span class="${isc.esito ? 'text-emerald-300 font-black' : 'text-red-200 font-black'}">${window.dashEscape(isc.esito || 'Mancante')}</span></p>
                        ${typeof window.renderLinguaStatusBadge === 'function' ? `<p class="pt-1">${window.renderLinguaStatusBadge(c)}</p>` : ''}
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
            <p class="font-black uppercase text-white text-xs flex items-center gap-2"><i data-lucide="link-2" class="w-4 h-4 text-amber-400"></i> Corsisti iscritti a questo specifico progetto</p>
            <p class="text-[10px] text-amber-200 font-bold uppercase tracking-widest">${(window.progettiIscrizioniMap[projectId] || []).length} partecipanti collegati a ${window.dashEscape(p.codice || '')}</p>
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

    const iscrittiEsistenti = await window.getIscrizioni(projectId);

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

    const record = window.buildIscrizioneRecord(p, c);

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


// ==========================================
// STEP 43 - CRUSCOTTO QUALITÀ CORSO / PERCORSO GUIDATO NON BLOCCANTE
// ==========================================
window.getProjectQualityStatusMeta = function(status) {
    const map = {
        complete: {
            label: 'Completo',
            cls: 'bg-emerald-500 text-white border-emerald-400',
            soft: 'bg-emerald-50 border-emerald-200 text-emerald-900',
            icon: 'check-circle-2'
        },
        attention: {
            label: 'Da verificare',
            cls: 'bg-amber-400 text-slate-950 border-amber-300',
            soft: 'bg-amber-50 border-amber-200 text-amber-950',
            icon: 'circle-alert'
        },
        info: {
            label: 'In corso',
            cls: 'bg-blue-500 text-white border-blue-400',
            soft: 'bg-blue-50 border-blue-200 text-blue-950',
            icon: 'info'
        },
        idle: {
            label: 'Non iniziato',
            cls: 'bg-slate-300 text-slate-900 border-slate-200',
            soft: 'bg-slate-50 border-slate-200 text-slate-700',
            icon: 'circle'
        },
        na: {
            label: 'N/A',
            cls: 'bg-slate-600 text-white border-slate-500',
            soft: 'bg-slate-100 border-slate-200 text-slate-600',
            icon: 'minus-circle'
        }
    };
    return map[status] || map.info;
};

window.getProjectQualityItems = function(p = {}, iscritti = []) {
    const course = window.DB_CORSI?.[p.corso_id] || null;
    const docentiUd = window.parseJSONSafe ? window.parseJSONSafe(p.docenti_ud || p.docente_principale || '{}', {}) : {};
    const udList = course?.prog || [];
    const assignedUd = Object.values(docentiUd || {}).filter(Boolean).length;
    const missingUd = udList.length ? udList.filter(ud => !docentiUd[ud.ud]).length : 0;
    const azienda = p.aziende || {};
    const isDL = p.ente_erogatore === 'azienda';
    const maxDiscenti = window.ASR2025_POLICY?.maxDiscentiAula || 30;

    const items = [];

    const missingProject = [];
    if (!p.codice) missingProject.push('codice');
    if (!p.corso_id || !course) missingProject.push('corso');
    if (!p.data_inizio) missingProject.push('data inizio');
    if (!p.data_esame) missingProject.push('data verifica/fine');
    if (!p.modalita) missingProject.push('modalità');
    if (!p.sede) missingProject.push('sede');
    items.push({
        key: 'dati',
        title: 'Dati progetto',
        status: missingProject.length ? 'attention' : 'complete',
        detail: missingProject.length ? `Da completare: ${missingProject.join(', ')}.` : 'Codice, corso, date, modalità e sede presenti.',
        action: `window.apriPopupProgettoById('${p.id}', 'progetti')`,
        actionLabel: 'Apri dati'
    });

    const missingAzienda = [];
    if (!p.azienda_id) missingAzienda.push('azienda collegata');
    if (p.azienda_id && !azienda.ragione_sociale) missingAzienda.push('ragione sociale');
    if (p.azienda_id && !azienda.piva_cf) missingAzienda.push('P.IVA/C.F.');
    if (p.azienda_id && !azienda.indirizzo) missingAzienda.push('sede legale');
    if (p.azienda_id && !azienda.sede_operativa) missingAzienda.push('sede operativa');
    if (p.azienda_id && !azienda.ateco) missingAzienda.push('ATECO');
    if (p.azienda_id && !azienda.referente) missingAzienda.push('referente');
    items.push({
        key: 'azienda',
        title: 'Azienda / committente',
        status: missingAzienda.length ? 'attention' : 'complete',
        detail: missingAzienda.length ? `Verificare: ${missingAzienda.join(', ')}.` : 'Anagrafica committente completa per i dati principali.',
        action: `window.handleProjectQualityAction('${p.id}', 'azienda')`,
        actionLabel: p.azienda_id ? 'Apri azienda' : 'Seleziona azienda'
    });

    const fabStatus = typeof window.getFabbisogniStatus === 'function'
        ? window.getFabbisogniStatus(p)
        : { completed: 0, total: 6, ready: false };
    const selectedRisks = window.step60Array ? window.step60Array(p.rischi_selezionati) : [];
    items.push({
        key: 'fabbisogni',
        title: 'Fabbisogni / rischi',
        status: fabStatus.ready ? 'complete' : (fabStatus.completed ? 'info' : 'attention'),
        detail: fabStatus.ready
            ? `Analisi compilata · ${selectedRisks.length} rischi selezionati.`
            : `Compilati ${fabStatus.completed}/${fabStatus.total} campi principali · ${selectedRisks.length} rischi selezionati.`,
        action: `window.handleProjectQualityAction('${p.id}', 'fabbisogni')`,
        actionLabel: 'Apri analisi'
    });

    const qualityStatus = typeof window.getGradimentoMonitoraggioStatus === 'function'
        ? window.getGradimentoMonitoraggioStatus(p)
        : { ready: false, status: 'non_avviato', scoreCount: 0, scoreTotal: 4, monitoringCount: 0, monitoringTotal: 5 };
    items.push({
        key: 'gradimento',
        title: 'Gradimento / monitoraggio',
        status: qualityStatus.ready ? 'complete' : (qualityStatus.status !== 'non_avviato' ? 'info' : 'attention'),
        detail: qualityStatus.ready
            ? 'Questionari elaborati e monitoraggio qualità completato.'
            : `${window.GRADIMENTO_STATUS_LABELS?.[qualityStatus.status] || 'Non avviato'} · medie ${qualityStatus.scoreCount}/${qualityStatus.scoreTotal} · monitoraggio ${qualityStatus.monitoringCount}/${qualityStatus.monitoringTotal}.`,
        action: `window.handleProjectQualityAction('${p.id}', 'gradimento')`,
        actionLabel: 'Apri qualità'
    });

    const tutorStatus = typeof window.getTutorRiesameStatus === 'function'
        ? window.getTutorRiesameStatus(p)
        : { ready: false, tutorReady: false, reviewReady: false, reviewState: 'non_pianificato' };
    items.push({
        key: 'tutor_riesame',
        title: 'Tutor / riesame',
        status: tutorStatus.ready ? 'complete' : (tutorStatus.tutorReady || tutorStatus.reviewState !== 'non_pianificato' ? 'info' : 'attention'),
        detail: `${tutorStatus.tutorReady ? 'Relazione tutor completa' : 'Relazione tutor da completare'} · riesame ${tutorStatus.reviewReady ? 'completo/non applicabile' : 'da pianificare o completare'}.`,
        action: `window.handleProjectQualityAction('${p.id}', 'tutor_riesame')`,
        actionLabel: 'Apri tutor/riesame'
    });

    items.push({
        key: 'docenti',
        title: 'Docenti / unità didattiche',
        status: !udList.length ? 'attention' : (missingUd ? 'attention' : 'complete'),
        detail: !udList.length
            ? 'Il corso non ha unità didattiche riconosciute o il catalogo va verificato.'
            : (missingUd ? `${missingUd} unità didattiche senza docente assegnato. Assegnati ${assignedUd}/${udList.length}.` : `Docenti assegnati a tutte le unità didattiche (${assignedUd}/${udList.length}).`),
        action: `window.apriPopupProgettoById('${p.id}', 'progetti')`,
        actionLabel: 'Apri docenti'
    });

    const iscrittiCount = iscritti.length;
    const missingCf = iscritti.filter(isc => !isc.corsisti?.cf).length;
    const missingMansione = iscritti.filter(isc => !(isc.mansione_storica || isc.corsisti?.mansione_storica)).length;
    const missingCert = iscritti.filter(isc => !isc.id_certificato).length;
    const missingScadenza = iscritti.filter(isc => !isc.data_scadenza).length;
    const fuoriAzienda = isDL ? iscritti.filter(isc => isc.corsisti?.azienda_id && isc.corsisti.azienda_id !== p.azienda_id).length : 0;
    const tooMany = !String(p.modalita || '').toLowerCase().includes('learning') && iscrittiCount > maxDiscenti;

    const corsistiWarnings = [];
    if (!iscrittiCount) corsistiWarnings.push('nessun corsista iscritto');
    if (missingCf) corsistiWarnings.push(`${missingCf} senza CF`);
    if (missingMansione) corsistiWarnings.push(`${missingMansione} senza mansione`);
    if (missingCert) corsistiWarnings.push(`${missingCert} senza ID certificato`);
    if (missingScadenza) corsistiWarnings.push(`${missingScadenza} senza scadenza`);
    if (fuoriAzienda) corsistiWarnings.push(`${fuoriAzienda} fuori azienda`);
    if (tooMany) corsistiWarnings.push(`oltre ${maxDiscenti} partecipanti`);

    items.push({
        key: 'corsisti',
        title: 'Corsisti / attestati',
        status: corsistiWarnings.length ? 'attention' : 'complete',
        detail: corsistiWarnings.length ? `${iscrittiCount} iscritti · ${corsistiWarnings.join(', ')}.` : `${iscrittiCount} iscritti con dati essenziali presenti.`,
        action: `window.apriPopupProgettoById('${p.id}', 'corsi_svolti')`,
        actionLabel: 'Gestisci corsisti'
    });

    const linguaStatus = typeof window.getLinguaProjectStatus === 'function'
        ? window.getLinguaProjectStatus(iscritti)
        : { total: 0, passed: 0, failed: 0, pending: 0, ready: true };
    const linguaExpected = p.fabbisogni_lingua === 'test';
    const linguaComplete = (!linguaExpected && linguaStatus.total === 0) ||
        (linguaStatus.total > 0 && linguaStatus.pending === 0 && linguaStatus.failed === 0);
    items.push({
        key: 'lingua',
        title: 'Comprensione lingua italiana',
        status: linguaComplete ? 'complete' : (linguaStatus.failed ? 'attention' : (linguaStatus.total ? 'info' : 'attention')),
        detail: linguaStatus.total
            ? `${linguaStatus.total} verifiche richieste · ${linguaStatus.passed} superate · ${linguaStatus.pending} da completare · ${linguaStatus.failed} non superate.`
            : (linguaExpected ? 'Il progetto prevede il test: indicare i corsisti interessati nell’anagrafica.' : 'Nessun test linguistico richiesto per i corsisti iscritti.'),
        action: `window.handleProjectQualityAction('${p.id}', 'lingua')`,
        actionLabel: 'Gestisci corsisti'
    });

    const complianceNotes = [];
    const modeCheck = window.getModalitaCompliance ? window.getModalitaCompliance(p.corso_id, p.modalita || '') : { ok: true };
    if (modeCheck && modeCheck.ok === false) complianceNotes.push(modeCheck.message || 'modalità da verificare');
    if (p.omogeneita_aula === false && !p.compliance_note) complianceNotes.push('aula non omogenea senza nota');
    if (isDL) {
        if (!p.ente_validatore) complianceNotes.push('ente validatore mancante');
        if (!p.validazione_ente_esito || p.validazione_ente_esito === 'da_valutare') complianceNotes.push('validazione ente da completare');
        if (!p.esito_richiesta_op) complianceNotes.push('iter OPRA/OPTA da verificare');
    }

    items.push({
        key: 'compliance',
        title: 'Compliance ASR / OP',
        status: complianceNotes.length ? 'attention' : 'complete',
        detail: complianceNotes.length ? complianceNotes.join(' · ') + '.' : 'Controlli principali ASR/OP coerenti con i dati inseriti.',
        action: `window.apriPopupProgettoById('${p.id}', 'progetti')`,
        actionLabel: 'Vedi compliance'
    });

    const documentiPresenti = !!p.documenti_firmati_url;
    const stampabile = p.id && p.corso_id && iscrittiCount;
    items.push({
        key: 'documenti',
        title: 'Stampe / documenti',
        status: documentiPresenti ? 'complete' : (stampabile ? 'info' : 'attention'),
        detail: documentiPresenti
            ? 'Documenti firmati/scansioni collegati al progetto.'
            : (stampabile ? 'Documenti generabili. Caricare poi scansioni o link documenti firmati.' : 'Prima di stampare servono corso e corsisti.'),
        action: `window.stampaFascicoloCompletoDaProgetti('${p.id}')`,
        actionLabel: 'Stampa fascicolo'
    });

    const stato = p.stato_corso || 'aperto';
    let chiusuraStatus = 'info';
    let chiusuraDetail = 'Corso aperto: completare dati, corsisti e documenti prima della chiusura.';
    if (stato === 'svolto') {
        chiusuraStatus = 'attention';
        chiusuraDetail = 'Corso svolto: consigliata verifica documenti e chiusura fascicolo.';
    }
    if (stato === 'chiuso') {
        chiusuraStatus = p.documenti_firmati_url ? 'complete' : 'info';
        chiusuraDetail = p.documenti_firmati_url ? 'Corso chiuso con documenti collegati.' : 'Corso chiuso: documenti firmati non ancora collegati.';
    }
    items.push({
        key: 'chiusura',
        title: 'Chiusura corso',
        status: chiusuraStatus,
        detail: chiusuraDetail,
        action: `window.apriPopupProgettoById('${p.id}', 'progetti')`,
        actionLabel: stato === 'chiuso' ? 'Apri chiusura' : 'Gestisci chiusura'
    });

    return items;
};

window.getProjectQualitySummary = function(items = []) {
    const total = items.length || 1;
    const complete = items.filter(i => i.status === 'complete').length;
    const attention = items.filter(i => i.status === 'attention').length;
    const info = items.filter(i => i.status === 'info').length;
    const percent = Math.round((complete / total) * 100);
    return { total, complete, attention, info, percent };
};


window.projectQualityExpanded = window.projectQualityExpanded || {};

window.toggleProjectQualityDetails = function(projectId) {
    if (!projectId) return;
    window.projectQualityExpanded[projectId] = !window.projectQualityExpanded[projectId];
    const open = !!window.projectQualityExpanded[projectId];
    document.querySelectorAll(`[data-quality-details="${projectId}"]`).forEach(node => node.classList.toggle('hidden', !open));
    document.querySelectorAll(`[data-quality-toggle="${projectId}"]`).forEach(btn => {
        const label = btn.querySelector('[data-quality-toggle-label]');
        if (label) label.innerText = open ? 'Chiudi cruscotto' : 'Apri cruscotto';
    });
    document.querySelectorAll(`[data-quality-chevron="${projectId}"]`).forEach(icon => {
        icon.setAttribute('data-lucide', open ? 'chevron-up' : 'chevron-down');
    });
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.handleProjectQualityAction = async function(projectId, key, mode = 'desktop') {
    const isPopup = mode === 'popup' || !!window.projectEditOpenedAsPopup;

    const focusField = (selector) => {
        const el = document.querySelector(selector);
        if (el) {
            if (typeof window.switchProjectPopupTab === 'function') window.switchProjectPopupTab('dati');
            setTimeout(() => {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                if (typeof el.focus === 'function') el.focus();
                el.classList.add('ring-2', 'ring-amber-400');
                setTimeout(() => el.classList.remove('ring-2', 'ring-amber-400'), 2200);
            }, 120);
        }
    };

    if (key === 'corsisti' || key === 'lingua') {
        if (isPopup && typeof window.switchProjectPopupTab === 'function') {
            window.switchProjectPopupTab('corsisti');
        } else {
            await window.apriPopupProgettoById(projectId, 'corsi_svolti');
        }
        return;
    }

    if (key === 'documenti') {
        if (typeof window.stampaFascicoloCompletoDaProgetti === 'function') {
            await window.stampaFascicoloCompletoDaProgetti(projectId);
        }
        return;
    }

    if (key === 'fabbisogni') {
        if (!isPopup) await window.apriPopupProgettoById(projectId, 'progetti');
        const panel = document.getElementById('prog-fabbisogni-panel');
        if (panel) panel.open = true;
        focusField('#prog-fabbisogni-panel');
        return;
    }

    if (key === 'gradimento') {
        if (!isPopup) await window.apriPopupProgettoById(projectId, 'progetti');
        const panel = document.getElementById('prog-gradimento-panel');
        if (panel) panel.open = true;
        focusField('#prog-gradimento-panel');
        return;
    }

    if (key === 'tutor_riesame') {
        if (!isPopup) await window.apriPopupProgettoById(projectId, 'progetti');
        const panel = document.getElementById('prog-tutor-riesame-panel');
        if (panel) panel.open = true;
        focusField('#prog-tutor-riesame-panel');
        return;
    }

    if (isPopup) {
        const fields = {
            dati: '#prog-codice, #prog-corso, #prog-inizio, #prog-esame, #prog-modalita, #prog-sede',
            azienda: '#prog-azienda',
            fabbisogni: '#prog-fabbisogni-panel',
            gradimento: '#prog-gradimento-panel',
            tutor_riesame: '#prog-tutor-riesame-panel',
            docenti: '#prog-docenti-container, .prog-docente-ud',
            compliance: '#prog-compliance-note-free, #prog-erogatore, #prog-validazione-esito, #prog-op-esito',
            chiusura: '#prog-stato-corso, #prog-documenti-url, #prog-chiuso-at, #prog-note-chiusura'
        };
        focusField(fields[key] || '#form-progetto');
        return;
    }

    if (key === 'azienda') {
        const p = (window.progettiList || []).find(x => x.id === projectId);
        if (p?.azienda_id && document.getElementById('azienda-relazioni-modal') && typeof window.apriPopupRelazioniAzienda === 'function') {
            await window.apriPopupRelazioniAzienda(p.azienda_id);
        } else {
            await window.apriPopupProgettoById(projectId, 'progetti');
        }
        return;
    }

    await window.apriPopupProgettoById(projectId, 'progetti');
};


window.renderProjectQualityDashboard = function(p = {}, iscritti = [], mode = 'desktop') {
    const items = window.getProjectQualityItems(p, iscritti);
    const summary = window.getProjectQualitySummary(items);
    const isPopup = mode === 'popup';
    const compact = mode === 'compact' || mode === 'mobile';
    const bg = isPopup ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white';
    const subText = isPopup ? 'text-slate-500' : 'text-slate-400';
    const grid = compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4';
    const projectId = p.id || '';
    const detailsVisible = !!window.projectQualityExpanded[projectId];

    const statusChips = items.map(item => {
        const meta = window.getProjectQualityStatusMeta(item.status);
        const safeTitle = window.dashEscape ? window.dashEscape(item.title || '') : (item.title || '');
        return `<button type="button" onclick="window.handleProjectQualityAction('${projectId}', '${item.key}', '${mode}')" title="${safeTitle}" class="px-2 py-1 rounded-full border ${meta.cls} text-[8px] font-black uppercase whitespace-nowrap inline-flex items-center gap-1">
            <i data-lucide="${meta.icon}" class="w-3 h-3"></i>${safeTitle.replace(' / ', '/').replace('unità didattiche', 'UD').substring(0, 22)}
        </button>`;
    }).join('');

    if (isPopup) {
        return `<section class="rounded-xl border ${bg} p-3 shadow-sm" data-quality-dashboard-project="${projectId}">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div class="min-w-0">
                    <p class="font-black uppercase text-xs flex items-center gap-2">
                        <i data-lucide="route" class="w-4 h-4 text-amber-500"></i>
                        Cruscotto qualità corso
                        <span class="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[8px] font-black uppercase">non bloccante</span>
                    </p>
                    <p class="${subText} text-[9px] font-bold uppercase tracking-widest mt-1">${summary.complete}/${summary.total} complete · ${summary.attention} da verificare · ${summary.percent}%</p>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                    <div class="w-28 h-2 rounded-full bg-slate-300 overflow-hidden border border-slate-300">
                        <div class="h-full bg-emerald-400" style="width:${summary.percent}%"></div>
                    </div>
                    <button type="button" data-quality-toggle="${projectId}" onclick="window.toggleProjectQualityDetails('${projectId}')" class="px-2 py-1 rounded-lg bg-slate-900 text-white text-[8px] font-black uppercase inline-flex items-center gap-1">
                        <i data-quality-chevron="${projectId}" data-lucide="${detailsVisible ? 'chevron-up' : 'chevron-down'}" class="w-3 h-3"></i>
                        <span data-quality-toggle-label>${detailsVisible ? 'Chiudi cruscotto' : 'Apri cruscotto'}</span>
                    </button>
                </div>
            </div>
            <div data-quality-details="${projectId}" class="${detailsVisible ? '' : 'hidden'} mt-3">
                <div class="flex flex-wrap gap-1.5 mb-2">${statusChips}</div>
                <div class="rounded-lg border border-slate-200 bg-white p-2 text-[9px] text-slate-600 font-semibold leading-snug">
                    ${items.filter(i => i.status !== 'complete').slice(0, 3).map(i => `<p class="mb-1"><span class="font-black uppercase">${window.dashEscape(i.title)}:</span> ${window.dashEscape(i.detail)}</p>`).join('') || '<p>Tutti i controlli principali risultano completi.</p>'}
                </div>
            </div>
        </section>`;
    }

    return `<section class="rounded-2xl border ${bg} p-3 shadow-sm" data-quality-dashboard-project="${projectId}">
        <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
            <div class="min-w-0">
                <p class="font-black uppercase text-sm flex items-center gap-2">
                    <i data-lucide="route" class="w-4 h-4 text-amber-400"></i>
                    Cruscotto qualità corso
                    <span class="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[8px] font-black uppercase">non bloccante</span>
                </p>
                <p class="${subText} text-[10px] font-bold uppercase tracking-widest mt-1">Percorso guidato: ${summary.complete}/${summary.total} aree complete · ${summary.attention} da verificare · avanzamento ${summary.percent}%</p>
            </div>
            <div class="flex items-center gap-3 shrink-0">
                <div class="w-28 md:w-40">
                    <div class="h-2 rounded-full bg-slate-700 overflow-hidden border border-slate-600">
                        <div class="h-full bg-emerald-400" style="width:${summary.percent}%"></div>
                    </div>
                </div>
                <button type="button" data-quality-toggle="${projectId}" onclick="window.toggleProjectQualityDetails('${projectId}')" class="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-[9px] font-black uppercase inline-flex items-center gap-1 shadow">
                    <i data-quality-chevron="${projectId}" data-lucide="${detailsVisible ? 'chevron-up' : 'chevron-down'}" class="w-4 h-4"></i>
                    <span data-quality-toggle-label>${detailsVisible ? 'Chiudi cruscotto' : 'Apri cruscotto'}</span>
                </button>
            </div>
        </div>

        <div data-quality-details="${projectId}" class="${detailsVisible ? '' : 'hidden'} mt-3">
            <div class="flex flex-wrap gap-1.5 mb-3">${statusChips}</div>
            <div class="grid ${grid} gap-2">
                ${items.map(item => {
                    const meta = window.getProjectQualityStatusMeta(item.status);
                    const safeDetail = window.dashEscape ? window.dashEscape(item.detail || '') : (item.detail || '');
                    const safeTitle = window.dashEscape ? window.dashEscape(item.title || '') : (item.title || '');
                    return `<div class="rounded-xl border ${meta.soft} p-3 flex flex-col gap-2 min-h-[112px]">
                        <div class="flex items-start justify-between gap-2">
                            <p class="font-black uppercase text-[10px] leading-tight flex items-center gap-1"><i data-lucide="${meta.icon}" class="w-3.5 h-3.5"></i>${safeTitle}</p>
                            <span class="shrink-0 px-2 py-0.5 rounded-full border ${meta.cls} text-[8px] font-black uppercase">${meta.label}</span>
                        </div>
                        <p class="text-[10px] leading-snug font-semibold opacity-90 flex-1">${safeDetail}</p>
                        <button type="button" onclick="window.handleProjectQualityAction('${projectId}', '${item.key}', '${mode}')" class="self-start px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[8px] font-black uppercase inline-flex items-center gap-1">
                            <i data-lucide="arrow-right" class="w-3 h-3"></i> ${window.dashEscape ? window.dashEscape(item.actionLabel || 'Apri') : (item.actionLabel || 'Apri')}
                        </button>
                    </div>`;
                }).join('')}
            </div>
        </div>
    </section>`;
};

window.ensureProjectQualityPopupBox = function() {
    const errorBox = document.getElementById('popup-project-errors');
    if (!errorBox || document.getElementById('popup-project-quality')) return;
    const box = document.createElement('div');
    box.id = 'popup-project-quality';
    box.className = 'mb-2 shrink-0';
    errorBox.insertAdjacentElement('beforebegin', box);
};

window.updateProjectQualityPopup = async function(projectId) {
    const box = document.getElementById('popup-project-quality');
    if (!box) return;
    const p = window.collectProjectFormSnapshot ? window.collectProjectFormSnapshot(projectId) : ((window.progettiList || []).find(x => x.id === projectId) || {});
    const iscritti = projectId ? await window.getIscrizioni(projectId) : [];
    box.innerHTML = window.renderProjectQualityDashboard(p, iscritti, 'popup');
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
    const fabStatus = typeof window.getFabbisogniStatus === 'function' ? window.getFabbisogniStatus(p) : { ready: false };
    const fabBadge = fabStatus.ready
        ? '<span class="inline-block mt-1 ml-1 px-1.5 py-0.5 rounded bg-cyan-200 text-cyan-950 font-black text-[8px] uppercase">Fabbisogni verificati</span>'
        : '<span class="inline-block mt-1 ml-1 px-1.5 py-0.5 rounded bg-slate-700 text-cyan-100 border border-cyan-700 font-black text-[8px] uppercase">Fabbisogni da completare</span>';
    const gradStatus = typeof window.getGradimentoMonitoraggioStatus === 'function' ? window.getGradimentoMonitoraggioStatus(p) : { ready: false };
    const gradBadge = gradStatus.ready
        ? '<span class="inline-block mt-1 ml-1 px-1.5 py-0.5 rounded bg-violet-200 text-violet-950 font-black text-[8px] uppercase">Qualità verificata</span>'
        : '<span class="inline-block mt-1 ml-1 px-1.5 py-0.5 rounded bg-slate-700 text-violet-100 border border-violet-700 font-black text-[8px] uppercase">Qualità da completare</span>';
    const tutorStatus = typeof window.getTutorRiesameStatus === 'function' ? window.getTutorRiesameStatus(p) : { ready: false };
    const tutorBadge = tutorStatus.ready
        ? '<span class="inline-block mt-1 ml-1 px-1.5 py-0.5 rounded bg-teal-200 text-teal-950 font-black text-[8px] uppercase">Tutor/riesame verificati</span>'
        : '<span class="inline-block mt-1 ml-1 px-1.5 py-0.5 rounded bg-slate-700 text-teal-100 border border-teal-700 font-black text-[8px] uppercase">Tutor/riesame da completare</span>';
    const qualityDashboard = window.renderProjectQualityDashboard ? window.renderProjectQualityDashboard(p, iscritti, 'desktop') : '';
    const projectMarker = `${window.dashEscape(p.codice || 'Progetto')} · ${window.dashEscape(nomeAzienda || '')} · ${window.formatDataToItalian(p.data_esame)}`;

    return `
        <tr class="bg-slate-950" data-corso="${p.corso_id}" data-azienda="${p.azienda_id || ''}" data-project-id="${p.id}" data-project-separator="${p.id}">
            <td colspan="4" class="pt-9 pb-4">
                <div class="rounded-2xl overflow-hidden border-4 border-yellow-300 shadow-xl shadow-yellow-950/40">
                    <div class="h-4 bg-yellow-300"></div>
                    <div class="bg-yellow-400 text-slate-950 px-4 py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                        <p class="text-[10px] md:text-xs font-black uppercase tracking-[0.28em] flex items-center gap-2">
                            <i data-lucide="minus" class="w-4 h-4"></i>
                            Separazione progetto
                        </p>
                        <p class="text-[9px] md:text-[10px] font-black uppercase tracking-widest md:text-right">
                            Inizio progetto · ${projectMarker}
                        </p>
                    </div>
                    <div class="h-2 bg-yellow-300"></div>
                </div>
            </td>
        </tr>
        <tr class="hover:bg-slate-800 transition-colors bg-slate-900 border-l-8 border-l-yellow-300 border-r-8 border-r-yellow-300" data-corso="${p.corso_id}" data-azienda="${p.azienda_id || ''}" data-project-id="${p.id}">
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
                    ${erogatoreBadge}${fabBadge}${gradBadge}${tutorBadge}
                </div>
            </td>
            <td class="p-3 border-b border-slate-700 font-bold text-center text-slate-200 align-top">${window.formatDataToItalian(p.data_esame)}</td>
            <td class="p-3 border-b border-slate-700 text-center whitespace-nowrap align-top">
                <button onclick="window.apriPopupProgettoById('${p.id}', 'progetti')" class="text-white hover:bg-blue-500 bg-blue-600 p-2 rounded-lg transition shadow-sm" title="Modifica progetto"><i data-lucide="edit" class="w-3 h-3"></i></button>
                <button onclick="window.stampaAttestatiProgetto('${p.id}')" class="text-white hover:bg-emerald-500 bg-emerald-700 p-2 rounded-lg transition shadow-sm ml-1" title="Stampa attestati"><i data-lucide="award" class="w-3 h-3"></i></button>
                <button onclick="window.stampaFascicoloCompletoDaProgetti('${p.id}')" class="text-white hover:bg-indigo-500 bg-indigo-700 p-2 rounded-lg transition shadow-sm ml-1" title="Stampa PDF fascicolo completo"><i data-lucide="file-archive" class="w-3 h-3"></i></button>
                <button onclick="window.eliminaProgetto('${p.id}')" class="text-white hover:bg-red-500 bg-red-700 p-2 rounded-lg transition shadow-sm ml-1" title="Elimina progetto"><i data-lucide="trash-2" class="w-3 h-3"></i></button>
            </td>
        </tr>
        <tr class="bg-slate-950 border-l-8 border-l-yellow-300 border-r-8 border-r-yellow-300 border-b-8 border-b-yellow-300" data-corso="${p.corso_id}" data-azienda="${p.azienda_id || ''}" data-project-id="${p.id}" data-inline-iscritti-project="${p.id}">
            <td colspan="4" class="p-4 border-b border-slate-700">
                <div class="mb-4">${qualityDashboard}</div>
                <div class="rounded-2xl border-2 border-amber-400/70 bg-slate-950 p-4 shadow-inner">
                    <div class="mb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div>
                            <p class="text-[9px] font-black uppercase tracking-[0.2em] text-amber-300">Area partecipanti collegata al progetto sopra</p>
                            <p class="text-[10px] text-slate-300 font-bold">Questi corsisti appartengono al corso <span class="text-blue-300 font-black">[${siglaCorso}]</span> per <span class="text-amber-300 font-black">${window.dashEscape(nomeAzienda || '')}</span>.</p>
                        </div>
                        <span class="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] uppercase">${iscritti.length} iscritti</span>
                    </div>
                    ${window.renderInlineIscrittiControls(p, 'desk')}
                    ${window.renderInlineIscrittiCards(p.id, iscritti, showAll)}
                </div>
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
    const fabStatus = typeof window.getFabbisogniStatus === 'function' ? window.getFabbisogniStatus(p) : { ready: false };
    const fabBadge = fabStatus.ready
        ? '<span class="inline-flex px-2 py-1 rounded-full bg-cyan-200 text-cyan-950 font-black text-[8px] uppercase">Fabbisogni verificati</span>'
        : '<span class="inline-flex px-2 py-1 rounded-full bg-slate-700 text-cyan-100 border border-cyan-700 font-black text-[8px] uppercase">Fabbisogni da completare</span>';
    const gradStatus = typeof window.getGradimentoMonitoraggioStatus === 'function' ? window.getGradimentoMonitoraggioStatus(p) : { ready: false };
    const gradBadge = gradStatus.ready
        ? '<span class="inline-flex px-2 py-1 rounded-full bg-violet-200 text-violet-950 font-black text-[8px] uppercase">Qualità verificata</span>'
        : '<span class="inline-flex px-2 py-1 rounded-full bg-slate-700 text-violet-100 border border-violet-700 font-black text-[8px] uppercase">Qualità da completare</span>';
    const tutorStatus = typeof window.getTutorRiesameStatus === 'function' ? window.getTutorRiesameStatus(p) : { ready: false };
    const tutorBadge = tutorStatus.ready
        ? '<span class="inline-flex px-2 py-1 rounded-full bg-teal-200 text-teal-950 font-black text-[8px] uppercase">Tutor/riesame verificati</span>'
        : '<span class="inline-flex px-2 py-1 rounded-full bg-slate-700 text-teal-100 border border-teal-700 font-black text-[8px] uppercase">Tutor/riesame da completare</span>';
    const qualityDashboard = window.renderProjectQualityDashboard ? window.renderProjectQualityDashboard(p, iscritti, 'mobile') : '';

    return `<article class="mt-10 rounded-2xl border-8 border-yellow-300 bg-slate-900 shadow-2xl shadow-yellow-950/30 overflow-hidden" data-corso="${p.corso_id}" data-azienda="${p.azienda_id || ''}" data-mobile-project-id="${p.id}" data-project-id="${p.id}">
        <div class="h-3 bg-yellow-300"></div>
        <div class="bg-yellow-400 text-slate-950 px-4 py-2 text-[9px] font-black uppercase tracking-widest flex items-center justify-between gap-2">
            <span>Inizio progetto</span>
            <span class="font-mono">${window.dashEscape(p.codice || '')}</span>
        </div>
        <div class="p-4 border-b border-slate-700 flex items-start justify-between gap-3">
            <div class="min-w-0">
                <button onclick="window.apriPopupProgettoById('${p.id}', 'progetti')" class="font-mono text-rose-300 font-black text-xs hover:underline">${window.dashEscape(p.codice || '')}</button>
                <p class="text-[10px] text-slate-400 font-bold uppercase mt-1">Esame: ${window.formatDataToItalian(p.data_esame)}</p>
                <div class="flex flex-wrap gap-1 mt-2">${statoBadge}${chiusuraBadge}${fabBadge}${gradBadge}${tutorBadge}</div>
            </div>
            <div class="flex gap-2 shrink-0">
                <button onclick="window.apriPopupProgettoById('${p.id}', 'progetti')" class="text-white bg-blue-600 hover:bg-blue-500 p-2 rounded-lg" title="Modifica progetto"><i data-lucide="edit" class="w-4 h-4"></i></button>
                <button onclick="window.stampaAttestatiProgetto('${p.id}')" class="text-white bg-emerald-700 hover:bg-emerald-600 p-2 rounded-lg" title="Stampa attestati"><i data-lucide="award" class="w-4 h-4"></i></button>
                <button onclick="window.stampaFascicoloCompletoDaProgetti('${p.id}')" class="text-white bg-indigo-700 hover:bg-indigo-600 p-2 rounded-lg" title="Stampa fascicolo"><i data-lucide="file-archive" class="w-4 h-4"></i></button>
                <button onclick="window.eliminaProgetto('${p.id}')" class="text-white bg-red-700 hover:bg-red-600 p-2 rounded-lg" title="Elimina progetto"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
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
            <div>${qualityDashboard}</div>
            <div class="rounded-xl bg-slate-950 border-2 border-amber-400/70 p-3">
                <div class="mb-3 rounded-lg bg-amber-400 text-slate-950 px-3 py-2">
                    <p class="text-[8px] font-black uppercase tracking-widest">Corsisti collegati a questo corso/azienda</p>
                    <p class="text-[10px] font-bold">${iscritti.length} partecipanti iscritti a [${siglaCorso}] · ${window.dashEscape(nomeAzienda || '')}</p>
                </div>
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

    // Step 46: nella lista Progetti Attivi il cruscotto qualità deve partire sempre chiuso.
    // L'utente può aprirlo manualmente con la freccia/pulsante "Apri cruscotto".
    window.projectQualityExpanded = {};
    
    // Step 42: ricarico sempre anagrafiche collegate, così modifiche a clienti/docenti/corsisti
    // si propagano subito nella vista Progetti e nelle successive stampe.
    window.aziendeList = await window.getAziende();
    window.docentiList = await window.getDocenti();
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

    const filterAzienda = document.getElementById('filter-progetti-azienda');
    if (filterAzienda) {
        const previous = filterAzienda.value || '';
        let azHtml = '<option value="">-- Tutte le aziende --</option>';
        (window.aziendeList || []).forEach(a => {
            azHtml += `<option value="${a.id}">${window.dashEscape(a.ragione_sociale || '')}</option>`;
        });
        filterAzienda.innerHTML = azHtml;
        if (previous) filterAzienda.value = previous;
    }
    if (typeof window.renderProgettoDraftCorsistiControls === 'function') window.renderProgettoDraftCorsistiControls();

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
    if (typeof window.initFabbisogniProjectForm === 'function') window.initFabbisogniProjectForm();
    if(typeof lucide !== 'undefined') lucide.createIcons();
};


window.filtraProgetti = function() {
    const textFilter = (document.getElementById('search-progetti')?.value || '').toLowerCase();
    const typeFilter = document.getElementById('filter-corso-tipo')?.value || '';
    const aziendaFilter = document.getElementById('filter-progetti-azienda')?.value || '';

    const rows = Array.from(document.getElementById('tabella-progetti')?.getElementsByTagName('tr') || []);
    const grouped = {};
    rows.forEach(row => {
        const pid = row.getAttribute('data-project-id') || `row-${Math.random()}`;
        if (!grouped[pid]) grouped[pid] = [];
        grouped[pid].push(row);
    });

    Object.values(grouped).forEach(groupRows => {
        const groupText = groupRows.map(r => r.innerText.toLowerCase()).join(' ');
        const rowCorsoId = groupRows[0]?.getAttribute('data-corso') || '';
        const rowAziendaId = groupRows[0]?.getAttribute('data-azienda') || '';
        const matchText = !textFilter || groupText.includes(textFilter);
        const matchType = typeFilter === '' || rowCorsoId === typeFilter;
        const matchAzienda = aziendaFilter === '' || rowAziendaId === aziendaFilter;
        const show = matchText && matchType && matchAzienda;
        groupRows.forEach(r => r.style.display = show ? '' : 'none');
    });

    document.querySelectorAll('#progetti-mobile-cards [data-project-id]').forEach(card => {
        const text = card.innerText.toLowerCase();
        const rowCorsoId = card.getAttribute('data-corso') || '';
        const rowAziendaId = card.getAttribute('data-azienda') || '';
        const show = (!textFilter || text.includes(textFilter)) &&
                     (typeFilter === '' || rowCorsoId === typeFilter) &&
                     (aziendaFilter === '' || rowAziendaId === aziendaFilter);
        card.style.display = show ? '' : 'none';
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
        note_chiusura: noteChiusura || null,
        ...(typeof window.collectFabbisogniProjectRecord === 'function' ? window.collectFabbisogniProjectRecord() : {}),
        ...(typeof window.collectGradimentoMonitoraggioRecord === 'function' ? window.collectGradimentoMonitoraggioRecord() : {}),
        ...(typeof window.collectTutorRiesameRecord === 'function' ? window.collectTutorRiesameRecord() : {})
    };
    if (id && id !== "") record.id = id;

    const savedProjectData = await window.saveProgetto(record);
    if (savedProjectData) {
        const savedProject = Array.isArray(savedProjectData) ? savedProjectData[0] : savedProjectData;
        if (savedProject && savedProject.id && (window.progettoDraftCorsistiIds || []).length) {
            const projectForEnroll = { ...record, ...savedProject };
            await window.salvaDraftCorsistiPerProgetto(projectForEnroll);
        }
        const wasPopup = !!window.projectEditOpenedAsPopup;
        window.resetFormProgetto();
        if (wasPopup && typeof window.chiudiPopupProgetto === 'function') window.chiudiPopupProgetto();
        await window.reloadLinkedViewsAfterMutation('progetto', { projectId: savedProject?.id || record.id });
    } else alert("Errore nel salvataggio del progetto formativo. Verifica di aver applicato tutte le migration Supabase, incluse Step 60, Step 61 e Step 62.");
};


window.modificaProgetto = function(id) {
    const p = (window.progettiList || []).find(x => x.id === id);
    if(!p) return alert('Progetto non trovato o non ancora caricato.');

    window.currentProgettoId = id;
    window.currentEditingProjectId = id;

    const set = (elId, value='') => {
        const el = document.getElementById(elId);
        if (el) el.value = value ?? '';
    };

    const aziendaSelect = document.getElementById('prog-azienda');
    if (aziendaSelect && p.azienda_id && !aziendaSelect.querySelector(`option[value="${p.azienda_id}"]`) && window.aziendeList?.length) {
        aziendaSelect.innerHTML = '<option value="">-- Seleziona Azienda --</option>' +
            window.aziendeList.map(a => `<option value="${a.id}">${window.dashEscape(a.ragione_sociale || '')}</option>`).join('');
    }

    set('prog-id', p.id);
    set('prog-azienda', p.azienda_id || '');
    set('prog-erogatore', p.ente_erogatore || 'ente');
    set('prog-corso', p.corso_id || '');
    set('prog-codice', p.codice || '');
    set('prog-modalita', p.modalita || 'In Presenza Fisica');
    set('prog-inizio', p.data_inizio || '');
    set('prog-esame', p.data_esame || '');
    set('prog-sede', p.sede || '');
    set('prog-resp-progetto', p.resp_progetto || '');
    set('prog-resp-corso', p.resp_corso || '');
    set('prog-op-invio', p.richiesta_op_inviata_at || '');
    set('prog-op-risposta', p.risposta_op_at || '');
    set('prog-op-esito', p.esito_richiesta_op || '');
    set('prog-compliance-note-free', p.compliance_note || '');
    set('prog-ente-validatore', p.ente_validatore || window.getDefaultEnteValidatore());
    set('prog-validazione-esito', p.validazione_ente_esito || '');
    set('prog-validazione-data', p.validazione_ente_at || '');
    set('prog-op-comunicazione', p.comunicazione_op_at || '');
    set('prog-op-destinatario', p.organismo_destinatario || window.DEFAULT_OP_DESTINATARIO);
    set('prog-validazione-note', p.note_validazione_ente || '');
    set('prog-stato-corso', p.stato_corso || 'aperto');
    set('prog-documenti-url', p.documenti_firmati_url || '');
    set('prog-chiuso-at', p.chiuso_at || '');
    set('prog-note-chiusura', p.note_chiusura || '');
    if (typeof window.populateFabbisogniProjectForm === 'function') window.populateFabbisogniProjectForm(p);
    if (typeof window.populateGradimentoMonitoraggioForm === 'function') window.populateGradimentoMonitoraggioForm(p);
    if (typeof window.populateTutorRiesameForm === 'function') window.populateTutorRiesameForm(p);

    if(document.getElementById('prog-omogeneita-aula')) {
        document.getElementById('prog-omogeneita-aula').checked = p.omogeneita_aula !== false;
    }

    // Serve per ricostruire unità didattiche e menu docenti, ma non deve trasformare
    // il progetto esistente in un "nuovo corso" rigenerando codice/date già salvati.
    const saved = {
        codice: p.codice || '',
        data_esame: p.data_esame || '',
        calendario: p.calendario || ''
    };
    if (typeof window.calcolaDettagliProgetto === 'function') window.calcolaDettagliProgetto();

    set('prog-codice', saved.codice);
    set('prog-esame', saved.data_esame);
    if (saved.calendario) set('prog-calendario-testo', saved.calendario);

    setTimeout(() => {
        const parsedDocs = window.parseJSONSafe(p.docenti_ud || p.docente_principale || '{}', {});
        document.querySelectorAll('.prog-docente-ud').forEach(sel => {
            let ud = sel.getAttribute('data-ud');
            if(parsedDocs[ud]) sel.value = parsedDocs[ud];
        });
        set('prog-id', p.id);
        set('prog-codice', saved.codice);
        set('prog-esame', saved.data_esame);
        if (saved.calendario) set('prog-calendario-testo', saved.calendario);
    }, 100);

    if(typeof window.syncValidazioneCNAUI === 'function') window.syncValidazioneCNAUI();
};

window.eliminaProgetto = async function(id) {
    if(confirm("Sei sicuro di voler cancellare questo corso?")) {
        if(await window.deleteProgetto(id)) {
            await window.reloadLinkedViewsAfterMutation('progetto-delete', { projectId: id });
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
    if (typeof window.resetFabbisogniProjectForm === 'function') window.resetFabbisogniProjectForm();
    if (typeof window.resetGradimentoMonitoraggioForm === 'function') window.resetGradimentoMonitoraggioForm();
    if (typeof window.resetTutorRiesameForm === 'function') window.resetTutorRiesameForm();
    window.progettoDraftCorsistiIds = [];
    if (typeof window.renderProgettoDraftCorsistiControls === 'function') window.renderProgettoDraftCorsistiControls();
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
            if (typeof window.loadIscrittiTable === 'function' && document.getElementById('tabella-iscritti')) {
                await window.loadIscrittiTable();
            }
            await window.reloadLinkedViewsAfterMutation('iscrizione-delete', { projectId });
        }
    }
};


window.applicaPresetCNAAvellino = function(showAlert = true) {
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
    window.AppState['cfg-timbro'] = 'timbrocna.png';
    localStorage.setItem('SafetyManager.cnaLogoDefault', p.logo_url);
    localStorage.setItem('SafetyManager.cnaTimbroDefault', 'timbrocna.png');

    const legale = document.getElementById('ente-legale-nome');
    if (legale && !legale.value) legale.placeholder = "Inserire nominativo del legale rappresentante";
    const nascita = document.getElementById('ente-legale-nascita');
    if (nascita && !nascita.value) nascita.placeholder = "Inserire luogo e data di nascita";

    if (showAlert) alert("Dati CNA Avellino caricati. Verifica/integra il legale rappresentante, poi salva l'ente. Logo logocna.png e timbro timbrocna.png sono già impostati.");
};

// ==========================================
// LOGICA CRM: ENTE E STAMPE
// ==========================================
window.loadEnteData = async function() {
    const ente = await window.getEnte();
    if(!ente && typeof window.applicaPresetCNAAvellino === 'function') {
        window.applicaPresetCNAAvellino(false);
        return;
    }
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
        if(document.getElementById('ente-legale-firma-url')) {
            document.getElementById('ente-legale-firma-url').value = ente.legale_firma_url || '';
            if (!document.getElementById('ente-legale-firma-url').value) {
                const autoFirma = window.getAutoSignaturePathByNameAndRole(ente.legale_nome || '', 'legale');
                if (autoFirma) document.getElementById('ente-legale-firma-url').value = autoFirma;
            }
            window.showFirmaPreview('ente-legale-firma-url', 'ente-legale-firma-preview');
        }
        
        window.AppState['cfg-ente'] = ente.ragione_sociale;
        window.AppState['cfg-ente-indirizzo'] = ente.indirizzo;
        window.AppState['cfg-ente-contatti'] = ente.contatti;
        window.AppState['cfg-luogo-emissione'] = ente.luogo_emissione;
        window.AppState['cfg-legale-nome'] = ente.legale_nome;
        window.AppState['cfg-legale-nascita'] = ente.legale_nascita;
        window.AppState['cfg-legale-firma-url'] = ente.legale_firma_url || '';

        if (window.isCnaName(ente.ragione_sociale)) {
            window.AppState['cfg-logo'] = window.CNA_AVELLINO_PRESET.logo_url;
            window.AppState['cfg-timbro'] = 'timbrocna.png';
            localStorage.setItem('SafetyManager.cnaLogoDefault', window.CNA_AVELLINO_PRESET.logo_url);
            localStorage.setItem('SafetyManager.cnaTimbroDefault', 'timbrocna.png');
            const logoInput = document.getElementById('cfg-logo');
            if (logoInput) logoInput.value = window.CNA_AVELLINO_PRESET.logo_url;
        }
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
        logo_url: window.isCnaName(document.getElementById('ente-ragione').value) ? window.CNA_AVELLINO_PRESET.logo_url : document.getElementById('cfg-logo').value,
        legale_firma_url: document.getElementById('ente-legale-firma-url') ? document.getElementById('ente-legale-firma-url').value.trim() : ''
    };
    if (id && id !== "") record.id = id;

    const salvato = await window.saveEnteData(record);
    if(salvato) {
        alert("Dati Ente aggiornati con successo!");
        await window.loadEnteData();
        await window.reloadLinkedViewsAfterMutation('ente', {});
    }
};


window.getProjectSelectLabel = function(p) {
    const corso = window.DB_CORSI?.[p.corso_id] || {};
    const sigla = corso.code || p.corso_id || 'CRS';
    const dateStr = window.formatDataToItalian(p.data_esame || p.data_inizio || '');
    const committente = p.aziende?.ragione_sociale || 'Privato / azienda non indicata';
    const enteFormazione = (p.ente_erogatore === 'azienda')
        ? `DL aziendale${p.ente_validatore ? ' / Valid. ' + p.ente_validatore : ''}`
        : (window.AppState?.['cfg-ente'] || window.CNA_AVELLINO_PRESET?.ragione_sociale || 'Ente formatore');
    return `[${sigla}] ${dateStr || 'data n.d.'} · Ente: ${enteFormazione} · Committente: ${committente} · ${p.codice || ''}`;
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

        html += `<option value="${p.id}">${window.dashEscape(window.getProjectSelectLabel ? window.getProjectSelectLabel(p) : (p.codice || 'Progetto'))}</option>`;
    });
    
    selProg.innerHTML = html;
};


// ==========================================
// FOGLIO PROGETTI / CORSISTI TIPO EXCEL
// ==========================================
window.foglioProgettiState = window.foglioProgettiState || { selectedProjectId: null, iscritti: [] };

window.initFogliProgetti = async function() {
    const select = document.getElementById('foglio-progetto-select');
    if (!select) return;

    if (!window.AppState['cfg-ente'] && typeof window.getEnte === 'function') {
        const enteCfg = await window.getEnte();
        if (enteCfg) {
            window.AppState['cfg-ente'] = enteCfg.ragione_sociale || '';
            window.AppState['cfg-ente-indirizzo'] = enteCfg.indirizzo || '';
            window.AppState['cfg-ente-contatti'] = enteCfg.contatti || '';
            window.AppState['cfg-luogo-emissione'] = enteCfg.luogo_emissione || '';
        }
    }

    window.progettiList = await window.getProgetti();
    window.progettiList.sort((a, b) => new Date(b.data_esame || b.data_inizio || '1970-01-01') - new Date(a.data_esame || a.data_inizio || '1970-01-01'));

    select.innerHTML = '<option value="">-- Seleziona progetto --</option>' + window.progettiList.map(p => {
        const label = window.getProjectSelectLabel ? window.getProjectSelectLabel(p) : (p.codice || 'Progetto');
        return `<option value="${p.id}">${window.dashEscape(label)}</option>`;
    }).join('');

    const preview = document.getElementById('foglio-progetto-preview');
    if (preview) preview.innerHTML = '<div class="p-8 text-center text-slate-400 font-bold uppercase text-xs">Seleziona un progetto per visualizzare il foglio corsisti.</div>';
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.buildFoglioProgettoHtml = function(project, iscritti, printMode = false) {
    const corso = window.DB_CORSI?.[project.corso_id] || {};
    const sigla = corso.code || project.corso_id || '';
    const enteFormazione = (project.ente_erogatore === 'azienda')
        ? `DL aziendale${project.ente_validatore ? ' / Valid. ' + project.ente_validatore : ''}`
        : (window.AppState?.['cfg-ente'] || window.CNA_AVELLINO_PRESET?.ragione_sociale || 'Ente formatore');
    const azienda = project.aziende?.ragione_sociale || 'Privato / non indicata';
    const sede = project.sede || project.aziende?.sede_operativa || project.aziende?.indirizzo || '';
    const rows = (iscritti || []).map((isc, idx) => {
        const c = isc.corsisti || {};
        const even = idx % 2 === 0;
        return `<tr class="${even ? 'bg-white' : 'bg-slate-100'}">
            <td class="border border-slate-300 p-2 text-center font-black">${idx + 1}</td>
            <td class="border border-slate-300 p-2 font-black uppercase">${window.dashEscape(c.nome_cognome || '')}</td>
            <td class="border border-slate-300 p-2 font-mono">${window.dashEscape(c.cf || '')}</td>
            <td class="border border-slate-300 p-2">${window.dashEscape(c.luogo_data_nascita || '')}</td>
            <td class="border border-slate-300 p-2">${window.dashEscape(isc.mansione_storica || c.mansione_storica || '')}</td>
            <td class="border border-slate-300 p-2 font-mono">${window.dashEscape(isc.id_certificato || '')}</td>
            <td class="border border-slate-300 p-2 text-center">${window.dashEscape(isc.esito || '')}</td>
            <td class="border border-slate-300 p-2 text-center">${isc.percentuale_frequenza !== null && isc.percentuale_frequenza !== undefined ? isc.percentuale_frequenza + '%' : ''}</td>
            <td class="border border-slate-300 p-2">${window.dashEscape(isc.note_verifica || '')}</td>
        </tr>`;
    }).join('');

    const pageClass = printMode ? 'export-print-page' : 'p-5';
    return `<div class="${pageClass}">
        <div class="mb-4">
            <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div>
                    <h1 class="text-xl font-black uppercase text-slate-900">Foglio progetto formativo / corsisti</h1>
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">${window.dashEscape(project.codice || '')}</p>
                </div>
                <div class="text-left md:text-right text-[10px] font-bold text-slate-600">
                    <p><strong>Data corso/esame:</strong> ${window.formatDataToItalian(project.data_esame || project.data_inizio || '')}</p>
                    <p><strong>N. partecipanti:</strong> ${(iscritti || []).length}</p>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4 text-[10px]">
                <div class="rounded-lg border border-blue-300 bg-blue-50 p-3"><strong class="uppercase text-blue-900">Corso</strong><br>[${window.dashEscape(sigla)}] ${window.dashEscape(corso.t || project.corso_id || '')}</div>
                <div class="rounded-lg border border-emerald-300 bg-emerald-50 p-3"><strong class="uppercase text-emerald-900">Ente formazione</strong><br>${window.dashEscape(enteFormazione)}</div>
                <div class="rounded-lg border border-amber-300 bg-amber-50 p-3"><strong class="uppercase text-amber-900">Committente</strong><br>${window.dashEscape(azienda)}</div>
                <div class="rounded-lg border border-slate-300 bg-slate-50 p-3"><strong class="uppercase text-slate-900">Sede</strong><br>${window.dashEscape(sede || '-')}</div>
            </div>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full border-collapse text-[10px]">
                <thead>
                    <tr class="bg-slate-900 text-white uppercase">
                        <th class="border border-slate-700 p-2 text-center">#</th>
                        <th class="border border-slate-700 p-2 text-left">Corsista</th>
                        <th class="border border-slate-700 p-2 text-left">Codice fiscale</th>
                        <th class="border border-slate-700 p-2 text-left">Nascita</th>
                        <th class="border border-slate-700 p-2 text-left">Mansione</th>
                        <th class="border border-slate-700 p-2 text-left">ID certificato</th>
                        <th class="border border-slate-700 p-2 text-center">Esito</th>
                        <th class="border border-slate-700 p-2 text-center">Frequenza</th>
                        <th class="border border-slate-700 p-2 text-left">Note</th>
                    </tr>
                </thead>
                <tbody>${rows || `<tr><td colspan="9" class="border border-slate-300 p-6 text-center text-slate-500 italic">Nessun corsista iscritto.</td></tr>`}</tbody>
            </table>
        </div>

        <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-[10px] text-center">
            <div><p class="uppercase font-black text-slate-500">Responsabile progetto</p><p class="border-b border-slate-400 mt-8"></p><p class="font-bold uppercase mt-1">${window.dashEscape(project.resp_progetto || '')}</p></div>
            <div><p class="uppercase font-black text-slate-500">Docente / Formatore</p><p class="border-b border-slate-400 mt-8"></p><p class="font-bold uppercase mt-1">Firma</p></div>
            <div><p class="uppercase font-black text-slate-500">Committente</p><p class="border-b border-slate-400 mt-8"></p><p class="font-bold uppercase mt-1">${window.dashEscape(project.aziende?.referente || '')}</p></div>
        </div>
    </div>`;
};

window.caricaFoglioProgetto = async function(projectId) {
    const preview = document.getElementById('foglio-progetto-preview');
    if (!preview) return;
    window.foglioProgettiState.selectedProjectId = projectId || null;
    if (!projectId) {
        preview.innerHTML = '<div class="p-8 text-center text-slate-400 font-bold uppercase text-xs">Seleziona un progetto per visualizzare il foglio corsisti.</div>';
        return;
    }

    preview.innerHTML = '<div class="p-8 text-center text-slate-400 font-bold uppercase text-xs"><i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto mb-2"></i> Caricamento foglio...</div>';
    if (typeof lucide !== 'undefined') lucide.createIcons();

    if (!window.progettiList || !window.progettiList.length) window.progettiList = await window.getProgetti();
    const p = window.progettiList.find(x => x.id === projectId);
    if (!p) {
        preview.innerHTML = '<div class="p-8 text-center text-red-500 font-bold uppercase text-xs">Progetto non trovato.</div>';
        return;
    }
    const iscritti = await window.getIscrizioni(projectId);
    window.foglioProgettiState.iscritti = iscritti;
    preview.innerHTML = window.buildFoglioProgettoHtml(p, iscritti, false);
};

window.stampaFoglioProgetto = async function(projectId = null) {
    const id = projectId || window.foglioProgettiState.selectedProjectId || document.getElementById('foglio-progetto-select')?.value;
    if (!id) return alert('Seleziona prima un progetto formativo.');
    if (!window.progettiList || !window.progettiList.length) window.progettiList = await window.getProgetti();
    const p = window.progettiList.find(x => x.id === id);
    if (!p) return alert('Progetto non trovato.');

    const iscritti = await window.getIscrizioni(id);
    const printArea = document.getElementById('print-area-temp');
    if (!printArea) return alert('Area di stampa non disponibile.');

    printArea.innerHTML = window.buildFoglioProgettoHtml(p, iscritti, true);
    document.body.classList.add('is-printing-temp');
    setTimeout(() => {
        window.print();
        document.body.classList.remove('is-printing-temp');
        printArea.innerHTML = '';
    }, 800);
};

window.currentPrintModule = "";

window.caricaDatiStampa = async function(projectId = null, options = {}) {
    const suppressPreviewRefresh = !!options.suppressPreviewRefresh;
    const progId = projectId || document.getElementById('stampa-progetto')?.value;
    if(!progId) return;

    // Step 42: per le stampe non uso cache già presenti. Le stampe devono riflettere
    // sempre l'ultima modifica di azienda/corsista/docente/progetto.
    window.progettiList = await window.getProgetti();
    const p = window.progettiList.find(x => x.id === progId);
    if(!p) return;

    if (typeof window.getEnte === 'function') {
        const enteCfg = await window.getEnte();
        if (enteCfg) {
            window.AppState['cfg-ente'] = enteCfg.ragione_sociale || '';
            window.AppState['cfg-ente-indirizzo'] = enteCfg.indirizzo || '';
            window.AppState['cfg-ente-contatti'] = enteCfg.contatti || '';
            window.AppState['cfg-luogo-emissione'] = enteCfg.luogo_emissione || '';
            window.AppState['cfg-legale-nome'] = enteCfg.legale_nome || '';
            window.AppState['cfg-legale-nascita'] = enteCfg.legale_nascita || '';
            window.AppState['cfg-logo'] = enteCfg.logo_url || '';
        } else if (typeof window.ensureCnaPresetState === 'function') {
            window.ensureCnaPresetState();
        }
    }
    window.docentiList = await window.getDocenti();
    const iscritti = await window.getIscrizioni(progId);

    window.AppState['cfg-corso'] = p.corso_id;
    window.AppState['cfg-codice'] = p.codice;
    window.AppState['cfg-modalita'] = p.modalita;
    window.AppState['cfg-data-inizio'] = p.data_inizio;
    window.AppState['cfg-data-esame'] = p.data_esame;
    window.AppState['cfg-sede-corso'] = p.sede;
    
    window.AppState['cfg-azienda'] = p.aziende ? p.aziende.ragione_sociale : "";
    window.AppState['cfg-azienda-piva'] = p.aziende ? p.aziende.piva_cf : "";
    window.AppState['cfg-ateco'] = p.aziende ? p.aziende.ateco : "";
    window.AppState['cfg-azienda-indirizzo'] = p.aziende ? p.aziende.indirizzo : "";
    window.AppState['cfg-azienda-sede-operativa'] = p.aziende ? p.aziende.sede_operativa : "";
    window.AppState['cfg-azienda-referente'] = p.aziende ? p.aziende.referente : "";

    window.AppState['cfg-ente-erogatore'] = p.ente_erogatore || 'ente';
    if (typeof window.ensureCnaPresetState === 'function') window.ensureCnaPresetState();
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
    if (typeof window.setFabbisogniPrintState === 'function') window.setFabbisogniPrintState(p);
    if (typeof window.setGradimentoMonitoraggioPrintState === 'function') window.setGradimentoMonitoraggioPrintState(p);
    if (typeof window.setTutorRiesamePrintState === 'function') window.setTutorRiesamePrintState(p);

    window.currentProgettoStampaId = progId;
    window.currentSessionCorsisti = iscritti.map(isc => {
        const c = isc.corsisti || {};
        return {
            iscrizione_id: isc.id,
            corsista_id: isc.corsista_id,
            nome: c.nome_cognome || "Corsista non disponibile",
            cf: c.cf || "",
            nascita: c.luogo_data_nascita || "",
            mansione: isc.mansione_storica || c.mansione_storica || "N/D",
            id_certificato: isc.id_certificato,
            data_scadenza: isc.data_scadenza,
            ore_frequentate: isc.ore_frequentate,
            percentuale_frequenza: isc.percentuale_frequenza,
            voto_test: isc.voto_test,
            esito_pratica: isc.esito_pratica,
            note_verifica: isc.note_verifica,
            esito: isc.esito || "Idoneo",
            lingua_test_stato: c.lingua_test_stato || 'non_richiesto',
            cittadinanza: c.cittadinanza || '',
            studi_scolastici_italia: c.studi_scolastici_italia,
            lingua_test_data: c.lingua_test_data || null,
            lingua_test_parte1: c.lingua_test_parte1,
            lingua_test_parte2: c.lingua_test_parte2,
            lingua_test_parte3: c.lingua_test_parte3,
            lingua_test_valutatore: c.lingua_test_valutatore || '',
            lingua_test_dichiarazione_dl: !!c.lingua_test_dichiarazione_dl,
            lingua_test_documento_url: c.lingua_test_documento_url || '',
            lingua_test_note: c.lingua_test_note || ''
        };
    });

    if(!suppressPreviewRefresh && window.currentPrintModule && !projectId && document.getElementById('stampa-progetto') && document.getElementById('print-preview-container')) {
        window.loadPrintPreview(window.currentPrintModule);
    }
};


// ==========================================
// STAMPA MULTIPLA ATTESTATI - FIX STEP 26
// ==========================================

// ==========================================
// STEP 50 - TEST MANUALE STANDARD DEL CORSO + CORRETTORE
// ==========================================


window.getManualTestQuestionsForCourse = function(courseId = '') {
    const id = String(courseId || '');
    let pool = [...(window.POOL_GENERALE || [])];

    if (id.includes('basso')) pool = pool.concat(window.POOL_BASSO || []);
    else if (id.includes('alto') || id.includes('medio')) pool = pool.concat(window.POOL_ALTO || []);
    else if (id.includes('dirigente') || id.includes('preposto') || id.includes('dl_')) pool = pool.concat(window.POOL_DIRIGENTI || []);
    else if (id.includes('cantieri') || id.includes('costruzioni')) pool = pool.concat(window.POOL_CANTIERI || []);
    else if (id.includes('confinati')) pool = pool.concat(window.POOL_CONFINATI || []);
    else if (id.includes('attr_') || id.includes('attrezzature')) pool = pool.concat(window.POOL_ATTREZZATURE || []);

    // Se il corso specifico ha meno domande, completo da tutti i pool disponibili.
    const allPools = []
        .concat(window.POOL_GENERALE || [])
        .concat(window.POOL_BASSO || [])
        .concat(window.POOL_ALTO || [])
        .concat(window.POOL_DIRIGENTI || [])
        .concat(window.POOL_CANTIERI || [])
        .concat(window.POOL_CONFINATI || [])
        .concat(window.POOL_ATTREZZATURE || []);
    pool = pool.concat(allPools);

    const seen = new Set();
    const unique = [];
    pool.forEach(q => {
        const key = String(q?.q || '').trim().toLowerCase();
        if (!key || seen.has(key)) return;
        seen.add(key);
        unique.push(q);
    });

    // Test manuale unico per corso, 30 quesiti su un solo foglio.
    return unique.slice(0, 30);
};

window.getManualTestCorsistaLabel = function(corsista = null) {
    if (!corsista) return { nome: '__________________________________', cf: '______________________________', mansione: '' };
    return {
        nome: corsista.nome || corsista.nome_cognome || '__________________________________',
        cf: corsista.cf || '',
        mansione: corsista.mansione || corsista.mansione_storica || ''
    };
};


window.creaPaginaTestManualeCorso = function(courseId, type = 'blank', options = {}) {
    const questions = window.getManualTestQuestionsForCourse(courseId);
    const c = window.DB_CORSI?.[courseId] || {};
    const esc = window.dashEscape || ((v) => String(v ?? ''));
    const isCorrected = type === 'corrected';
    const corsista = window.getManualTestCorsistaLabel(options.corsista || null);
    const title = isCorrected ? 'TEST MANUALE - CORRETTORE PER VALUTATORI' : 'TEST MANUALE DA EROGARE AI CORSISTI - 30 QUESITI';
    const subtitle = isCorrected
        ? 'Allegato al progetto formativo: risposte corrette evidenziate per aiutare i valutatori nella correzione.'
        : 'Allegato al progetto formativo: stampare, consegnare al corsista, far compilare e poi correggere/verificare.';

    const page = document.createElement('div');
    page.className = 'doc-page landscape bg-white manual-test-page';
    page.dataset.manualTestPage = isCorrected ? 'corrected' : 'blank';
    if (!isCorrected && options.corsista) page.dataset.corsistaId = options.corsista.corsista_id || options.corsista.id || '';
    page.style.cssText = [
        'width:297mm',
        'min-height:210mm',
        'height:210mm',
        'padding:0',
        'box-sizing:border-box',
        'margin:0 auto',
        'font-family:Arial,sans-serif',
        'color:#0f172a',
        'overflow:hidden',
        'background:#fff'
    ].join(';') + ';';

    const rows = questions.map((q, idx) => {
        const answers = (q.a || []).map((a, ai) => {
            const ok = q.correct === ai;
            const letter = String.fromCharCode(65 + ai);
            const bg = isCorrected && ok ? '#dcfce7' : '#ffffff';
            const border = isCorrected && ok ? '#16a34a' : '#cbd5e1';
            const mark = isCorrected && ok ? '✓' : '□';
            return `<span style="display:block;border:1px solid ${border};background:${bg};border-radius:3px;padding:1px 2.6px;margin:0.7px 0;font-size:6.55px;line-height:1.08;box-sizing:border-box;">
                <strong>${mark} ${letter})</strong> ${esc(a)}
            </span>`;
        }).join('');

        return `<div class="manual-test-question" style="border:1px solid #cbd5e1;border-radius:5px;padding:2.2px 3px;background:#ffffff;display:flex;flex-direction:column;justify-content:flex-start;box-sizing:border-box;min-height:0;">
            <p style="font-weight:900;font-size:7.15px;margin:0 0 1.5px;text-transform:uppercase;color:#1e3a8a;line-height:1.08;">${idx + 1}. ${esc(q.q)}</p>
            <div style="min-height:0;">${answers}</div>
        </div>`;
    }).join('');

    const corsistaBox = isCorrected
        ? `<div><strong>Uso:</strong> copia corretta per valutatori</div><div><strong>Risposte:</strong> evidenziate in verde</div><div><strong>Esito minimo:</strong> ___ / 30</div>`
        : `<div><strong>Corsista:</strong> ${esc(corsista.nome)}</div><div><strong>Codice fiscale:</strong> ${esc(corsista.cf || '______________________________')}</div><div><strong>Esito:</strong> ___ / 30</div>`;

    page.innerHTML = `
        <div class="manual-test-inner" style="width:297mm;height:210mm;padding:6mm;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;background:#fff;">
            <div style="border-bottom:2px solid #0f172a;padding-bottom:4px;margin-bottom:4px;display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex:0 0 auto;">
                <div style="min-width:0;">
                    <h1 style="font-size:15px;margin:0;font-weight:900;text-transform:uppercase;letter-spacing:.02em;line-height:1.05;">${title}</h1>
                    <p style="font-size:7.4px;margin:2px 0 0;text-transform:uppercase;color:#64748b;font-weight:800;line-height:1.08;">${subtitle}</p>
                </div>
                <div style="text-align:right;font-size:7.2px;font-weight:800;color:#64748b;min-width:66mm;line-height:1.18;">
                    Progetto: ${esc(window.AppState?.['cfg-codice'] || '')}<br>
                    Data: ${esc(window.formatDataToItalian ? window.formatDataToItalian(window.AppState?.['cfg-data-esame']) : (window.AppState?.['cfg-data-esame'] || ''))}
                </div>
            </div>

            <div style="border:1px solid #cbd5e1;background:#f8fafc;border-radius:6px;padding:4px;margin-bottom:4px;font-size:7.2px;display:grid;grid-template-columns:1.25fr 1fr 1fr .55fr;gap:4px;flex:0 0 auto;line-height:1.15;">
                <div><strong>Corso:</strong> ${esc(c.code || courseId)} · ${esc(c.t || courseId)}</div>
                ${corsistaBox}
            </div>

            <div class="manual-test-grid" style="flex:1 1 auto;min-height:0;display:grid;grid-template-rows:repeat(10,1fr);grid-auto-flow:column;grid-auto-columns:1fr;gap:1.15mm 2.3mm;">
                ${rows}
            </div>

            <div style="margin-top:4px;display:flex;justify-content:space-between;font-size:7.2px;flex:0 0 auto;">
                <div style="width:35%;text-align:center;"><div style="border-bottom:1px solid #334155;height:10px;"></div><strong>Firma corsista</strong></div>
                <div style="width:35%;text-align:center;"><div style="border-bottom:1px solid #334155;height:10px;"></div><strong>Firma valutatore</strong></div>
            </div>
        </div>`;

    if (options.preview) {
        // Step 59: niente miniaturizzazione interna della pagina; la preview può scorrere.
        page.style.margin = '0 auto 18px auto';
    } else {
        page.classList.add('print-show', 'temp-page', 'landscape-force');
        page.style.margin = '0 auto';
    }
    return page;
};

window.renderManualTestCoursePages = function(courseId, options = {}) {
    const session = [...(options.session || window.currentSessionCorsisti || [])];
    const pages = [];

    // Una copia compilabile per ogni corsista iscritto: così nel PDF unico ci sono già i fogli da stampare/consegnare.
    if (session.length) {
        session.forEach(corsista => {
            pages.push(window.creaPaginaTestManualeCorso(courseId, 'blank', { ...options, corsista }));
        });
    } else {
        pages.push(window.creaPaginaTestManualeCorso(courseId, 'blank', options));
    }

    // Un solo correttore allegato al progetto formativo, utile ai valutatori.
    pages.push(window.creaPaginaTestManualeCorso(courseId, 'corrected', options));
    return pages;
};


window.renderManualTestsForCurrentPrintProject = function(options = {}) {
    if (typeof window.renderManualTestCoursePages !== 'function') return [];
    const courseId =
        window.AppState?.['cfg-corso'] ||
        window.getVal?.('cfg-corso') ||
        document.getElementById('cfg-corso')?.value ||
        document.getElementById('stampa-corso')?.value ||
        '';

    const sessionSnapshot = [...(options.session || window.currentSessionCorsisti || [])];
    return window.renderManualTestCoursePages(courseId, {
        preview: !!options.preview,
        session: sessionSnapshot
    });
};

window.renderPrintModulePages = async function(moduleId, singleCorsista = null, options = {}) {
    const preview = !!options.preview;
    if (moduleId === 'test_lingua_italiana' && typeof window.renderTestLinguaItalianaPages === 'function') {
        return await window.renderTestLinguaItalianaPages({
            preview,
            session: singleCorsista ? [singleCorsista] : (options.session || window.currentSessionCorsisti || []),
            fallbackAll: options.fallbackAll !== false,
            includeCorrector: options.includeCorrector !== false
        });
    }
    const resp = await fetch(`modules/${moduleId}.html`);
    if (!resp.ok) throw new Error(`Modulo non trovato: ${moduleId}`);
    const html = await resp.text();

    const prevModule = window.currentPrintModule;
    const prevSession = [...(window.currentSessionCorsisti || [])];

    const holder = document.createElement('div');
    holder.className = 'print-render-holder';
    holder.style.position = 'absolute';
    holder.style.left = '-99999px';
    holder.style.top = '0';
    holder.style.width = '210mm';
    holder.style.background = 'white';
    holder.style.pointerEvents = 'none';
    holder.innerHTML = html;
    document.body.appendChild(holder);

    window.currentPrintModule = moduleId;
    if (singleCorsista) window.currentSessionCorsisti = [singleCorsista];

    if (typeof window.updateAll === 'function') window.updateAll();

    const pages = Array.from(holder.querySelectorAll('.doc-page')).map(page => {
        const clone = page.cloneNode(true);
        clone.id = '';
        clone.classList.remove('scale-[0.8]', 'origin-top');
        clone.style.margin = preview ? '0 auto 16px auto' : '0 auto';
        if (preview) {
            clone.classList.add('scale-[0.8]', 'origin-top');
        } else {
            clone.classList.add('print-show', 'temp-page');
            if (page.classList.contains('landscape') || page.classList.contains('manual-test-page')) clone.classList.add('landscape-force');
            else clone.classList.add('portrait');
        }
        return clone;
    });

    if ((moduleId === 'progetto_formativo' || moduleId === 'fascicolo_corso') &&
        options.includeNeedsRiskAnnexes !== false &&
        typeof window.renderNeedsRiskAnnexPages === 'function') {
        pages.push(...await window.renderNeedsRiskAnnexPages({ preview }));
    }

    if (moduleId === 'progetto_formativo' && options.includeProjectFormativoTests !== false && typeof window.renderManualTestCoursePages === 'function') {
        const courseId = window.AppState?.['cfg-corso'] || window.getVal?.('cfg-corso') || '';
        const sessionSnapshot = [...(window.currentSessionCorsisti || [])];
        pages.push(...window.renderManualTestCoursePages(courseId, { preview, session: sessionSnapshot }));
    }

    if (moduleId === 'fascicolo_corso' && options.includeFascicoloTests !== false && typeof window.renderManualTestCoursePages === 'function') {
        const courseId = window.AppState?.['cfg-corso'] || window.getVal?.('cfg-corso') || '';
        const sessionSnapshot = [...(window.currentSessionCorsisti || [])];
        pages.push(...window.renderManualTestCoursePages(courseId, { preview, session: sessionSnapshot }));
    }

    if (moduleId === 'fascicolo_corso' &&
        options.includeQualityAnnexes !== false &&
        typeof window.renderGradimentoMonitoraggioAnnexPages === 'function') {
        pages.push(...await window.renderGradimentoMonitoraggioAnnexPages({ preview }));
    }

    if (moduleId === 'fascicolo_corso' &&
        options.includeTutorRiesameAnnexes !== false &&
        typeof window.renderTutorRiesameAnnexPages === 'function') {
        pages.push(...await window.renderTutorRiesameAnnexPages({ preview }));
    }

    if (moduleId === 'fascicolo_corso' &&
        options.includeLinguaAnnexes !== false &&
        typeof window.renderLinguaItalianaAnnexPages === 'function') {
        pages.push(...await window.renderLinguaItalianaAnnexPages({ preview }));
    }

    holder.remove();
    window.currentPrintModule = prevModule;
    window.currentSessionCorsisti = prevSession;
    return pages;
};


window.renderAttestatiMultipli = async function(targetContainer, options = {}) {
    const session = [...(window.currentSessionCorsisti || [])];
    if (!session.length) {
        targetContainer.innerHTML = '<div class="p-6 text-center text-red-500 font-bold">Nessun corsista iscritto al progetto selezionato.</div>';
        return 0;
    }

    // Importante: non appendere le pagine mentre updateAll gira per il corsista successivo,
    // altrimenti le classi .val-* delle pagine già create verrebbero sovrascritte.
    const fragment = document.createDocumentFragment();

    for (const corsista of session) {
        const pages = await window.renderPrintModulePages('attestato', corsista, options);
        pages.forEach(page => {
            if (options.preview) {
                const wrapper = document.createElement('div');
                wrapper.className = 'mb-8 border-b border-slate-300 pb-6';
                const label = document.createElement('div');
                label.className = 'mb-2 px-3 py-2 rounded-lg bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2';
                label.innerHTML = `<span>Attestato</span><span class="font-mono text-amber-300">${window.dashEscape(corsista.nome || '')}</span>`;
                wrapper.appendChild(label);
                wrapper.appendChild(page);
                fragment.appendChild(wrapper);
            } else {
                fragment.appendChild(page);
            }
        });
    }

    targetContainer.innerHTML = '';
    targetContainer.appendChild(fragment);
    return session.length;
};

window.stampaAttestatiMultipli = async function() {
    const printArea = document.getElementById('print-area-temp');
    if (!printArea) return alert('Area di stampa non disponibile.');
    const session = [...(window.currentSessionCorsisti || [])];
    if (!session.length) return alert('Nessun corsista iscritto al progetto selezionato.');

    try {
        printArea.innerHTML = '';
        await window.renderAttestatiMultipli(printArea, { preview: false });
        alert(`Ora si aprirà la stampa. Verranno stampati ${session.length} attestati, uno per ogni corsista iscritto al corso.`);
        document.body.classList.add('is-printing-temp');
        setTimeout(() => {
            window.print();
            document.body.classList.remove('is-printing-temp');
            printArea.innerHTML = '';
        }, 1000);
    } catch (e) {
        console.error(e);
        alert('Errore nella preparazione degli attestati: ' + (e.message || e));
        document.body.classList.remove('is-printing-temp');
        printArea.innerHTML = '';
    }
};


window.adjustPrintPreviewCanvas = function(container) {
    if (!container) return;
    const hasLandscape = !!container.querySelector('.doc-page.landscape, .doc-page.landscape-force, .manual-test-page');
    container.style.width = hasLandscape ? '297mm' : '210mm';
    container.style.maxWidth = 'none';
    const viewport = container.parentElement;
    if (viewport) {
        viewport.classList.remove('overflow-hidden');
        viewport.classList.add('overflow-auto');
        viewport.style.justifyContent = hasLandscape ? 'flex-start' : 'center';
    }
};

window.loadPrintPreview = async function(modulo) {
    const progId = document.getElementById('stampa-progetto')?.value;
    if(!progId) return alert("Seleziona prima un Progetto dal menu a tendina!");

    window.currentPrintModule = modulo;
    const container = document.getElementById('print-preview-container');

    const btnCorrettore = document.getElementById('btn-correttore');
    if (btnCorrettore) {
        if (modulo === 'esame') btnCorrettore.classList.remove('hidden');
        else btnCorrettore.classList.add('hidden');
    }

    try {
        container.innerHTML = '<div class="p-8 text-center text-slate-500 font-bold uppercase text-xs"><i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto mb-2"></i> Preparazione anteprima...</div>';
        if (typeof lucide !== 'undefined') lucide.createIcons();

        if (modulo === 'attestato') {
            await window.renderAttestatiMultipli(container, { preview: true });
            return;
        }

        if (modulo === 'questionario_gradimento' && typeof window.loadGradimentoQuestionariPreview === 'function') {
            await window.loadGradimentoQuestionariPreview();
            return;
        }

        if (modulo === 'test_lingua_italiana' && typeof window.renderTestLinguaItalianaPages === 'function') {
            const pages = await window.renderTestLinguaItalianaPages({
                preview: true,
                session: window.currentSessionCorsisti || [],
                fallbackAll: true,
                includeCorrector: true
            });
            container.innerHTML = '';
            if (!pages.length) {
                container.innerHTML = '<div class="p-8 text-center text-amber-700 font-bold">Nessun corsista iscritto al progetto selezionato.</div>';
                return;
            }
            pages.forEach(p => container.appendChild(p));
            window.adjustPrintPreviewCanvas(container);
            return;
        }

        if ((modulo === 'progetto_formativo' || modulo === 'fascicolo_corso') && typeof window.renderPrintModulePages === 'function') {
            const pages = await window.renderPrintModulePages(modulo, null, { preview: true });
            container.innerHTML = '';
            pages.forEach(p => container.appendChild(p));
            window.adjustPrintPreviewCanvas(container);
            return;
        }

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
        window.adjustPrintPreviewCanvas(container);
    } catch (error) {
        container.innerHTML = `<p class="text-red-500 font-bold">${error.message}</p>`;
    }
};


window.stampaSezioneAttuale = async function() {
    if(!window.currentPrintModule) return alert("Seleziona un documento da stampare.");

    if(window.currentPrintModule === 'attestato') {
        await window.stampaAttestatiMultipli();
        return;
    }

    if(window.currentPrintModule === 'questionario_gradimento' && typeof window.stampaQuestionariGradimento === 'function') {
        await window.stampaQuestionariGradimento();
        return;
    }

    const printArea = document.getElementById('print-area-temp');
    printArea.innerHTML = '';

    const docOriginali = document.querySelectorAll('#print-preview-container .doc-page');
    if(!docOriginali.length) return;

    if(window.currentPrintModule === 'esame' && window.currentSessionCorsisti.length > 0) {
        window.preparaEStampaMassiva(window.currentPrintModule);
        return;
    }

    docOriginali.forEach(docOriginale => {
        const clone = docOriginale.cloneNode(true);
        clone.classList.remove('scale-[0.8]', 'origin-top');
        clone.classList.add('print-show', 'temp-page');
        if(docOriginale.classList.contains('landscape')) clone.classList.add('landscape-force');
        else clone.classList.add('portrait');
        printArea.appendChild(clone);
    });

    document.body.classList.add('is-printing-temp');
    setTimeout(() => { 
        window.print(); 
        document.body.classList.remove('is-printing-temp');
        printArea.innerHTML = ''; 
    }, 800);
};


window.preparaEStampaMassiva = async function(tabId) {
    if (tabId === 'attestato') {
        await window.stampaAttestatiMultipli();
        return;
    }

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

// ==========================================
// STEP 51 - FIRME PREDEFINITE AUTO-RICHIAMATE
// ==========================================

window.AUTO_SIGNATURES = window.AUTO_SIGNATURES || {
    'BERARDINO PESCE': 'assets/firme/firma_berardino_pesce.png',
    'PESCE BERARDINO': 'assets/firme/firma_berardino_pesce.png',
    'CENTRELLA ALBERTO': 'assets/firme/firma_centrella_alberto.png',
    'ALBERTO CENTRELLA': 'assets/firme/firma_centrella_alberto.png'
};

window.AUTO_SIGNATURE_ROLE_MAP = window.AUTO_SIGNATURE_ROLE_MAP || {
    'BERARDINO PESCE': {
        docente: 'assets/firme/firma_berardino_pesce.png',
        resp_progetto: 'assets/firme/firma_berardino_pesce.png',
        legale: 'assets/firme/firma_berardino_pesce.png'
    },
    'PESCE BERARDINO': {
        docente: 'assets/firme/firma_berardino_pesce.png',
        resp_progetto: 'assets/firme/firma_berardino_pesce.png',
        legale: 'assets/firme/firma_berardino_pesce.png'
    },
    'CENTRELLA ALBERTO': {
        docente: 'assets/firme/firma_centrella_alberto.png',
        resp_corso: 'assets/firme/firma_centrella_alberto.png'
    },
    'ALBERTO CENTRELLA': {
        docente: 'assets/firme/firma_centrella_alberto.png',
        resp_corso: 'assets/firme/firma_centrella_alberto.png'
    }
};

window.normalizeSignatureName = function(name = '') {
    return String(name || '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();
};

window.getAutoSignaturePathByName = function(name = '') {
    const key = window.normalizeSignatureName(name);
    return window.AUTO_SIGNATURES[key] || '';
};

window.getAutoSignaturePathByNameAndRole = function(name = '', role = '') {
    const key = window.normalizeSignatureName(name);
    const roleKey = String(role || '').trim().toLowerCase();
    const roleMap = window.AUTO_SIGNATURE_ROLE_MAP[key] || null;
    if (roleMap && roleMap[roleKey]) return roleMap[roleKey];
    return '';
};

window.applyDefaultSignatureInputs = function() {
    try {
        const enteLegaleName = document.getElementById('ente-legale-nome')?.value || '';
        const enteFirmaInput = document.getElementById('ente-legale-firma-url');
        if (enteFirmaInput && !String(enteFirmaInput.value || '').trim()) {
            const auto = window.getAutoSignaturePathByNameAndRole(enteLegaleName, 'legale');
            if (auto) enteFirmaInput.value = auto;
        }

        const docNome = document.getElementById('doc-nome')?.value || '';
        const docFirmaInput = document.getElementById('doc-firma-url');
        if (docFirmaInput && !String(docFirmaInput.value || '').trim()) {
            const auto = window.getAutoSignaturePathByNameAndRole(docNome, 'docente');
            if (auto) docFirmaInput.value = auto;
        }
    } catch (e) {
        console.warn('applyDefaultSignatureInputs:', e);
    }
};


window.renderAutoSignatureSlot = function(slot, signaturePath, signerName = '') {
    if (!slot) return;
    slot.innerHTML = '';
    if (!signaturePath) {
        slot.classList.add('hidden');
        return;
    }
    slot.classList.remove('hidden');
    const img = document.createElement('img');
    img.className = 'auto-signature-img';
    img.src = signaturePath;
    img.alt = 'Firma ' + signerName;
    slot.appendChild(img);
};

window.getSignatureNameForSlot = function(slot) {
    const selector = slot?.getAttribute('data-signature-name-selector') || '';
    const block = slot?.closest('[data-signature-block]') || slot?.parentElement || document;
    let nameEl = selector ? block.querySelector(selector) : null;
    if (!nameEl && selector) nameEl = document.querySelector(selector);
    return String(nameEl?.textContent || nameEl?.innerText || slot?.getAttribute('data-signature-name') || '').trim();
};

window.applyAutomaticSignatureImages = function() {
    // Step 54: le firme automatiche vengono inserite SOLO negli slot firma espliciti.
    // Non vengono più agganciate a ogni occorrenza del nome nei documenti.
    document.querySelectorAll('.auto-signature-slot').forEach(slot => {
        const role = slot.getAttribute('data-signature-role') || '';
        const name = window.getSignatureNameForSlot(slot);
        const src = window.getAutoSignaturePathByNameAndRole(name, role);
        window.renderAutoSignatureSlot(slot, src, name);
    });
};

window.updateAll = function() {
    if (typeof window.ensureCnaPresetState === 'function') window.ensureCnaPresetState();
    if (typeof window.applyDefaultSignatureInputs === 'function') window.applyDefaultSignatureInputs();
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
    
    const referenteAziendaCommittente = window.getVal('cfg-azienda-referente') || respProgetto || "Referente azienda committente";
    const responsabileAttivitaFormativeEnte = respProgetto || window.getVal('cfg-legale-nome') || "Responsabile attività formative ente";
    document.querySelectorAll('.val-referente-azienda-committente').forEach(el => el.innerText = referenteAziendaCommittente);
    document.querySelectorAll('.val-ruolo-firma-3').forEach(el => el.innerText = isAzienda ? "Referente formazione / Responsabile progetto formativo" : "Responsabile Attività Formative Ente");
    document.querySelectorAll('.val-firma-3-nome').forEach(el => el.innerText = isAzienda ? (respProgetto || window.getVal('cfg-azienda-referente') || "---") : responsabileAttivitaFormativeEnte);
    document.querySelectorAll('.val-testo-timbro').forEach(el => el.innerHTML = isAzienda ? "TIMBRO<br>AZIENDA" : "TIMBRO<br>EROGATORE");

    const sedeToDisplay = window.getVal('cfg-sede-corso') || window.getVal('cfg-azienda-indirizzo') || "Sede Aziendale";
    document.querySelectorAll('.val-ente').forEach(el => el.innerText = isAzienda ? (window.getVal('cfg-azienda') || "---") : (window.getVal('cfg-ente') || "---"));
    document.querySelectorAll('.val-azienda').forEach(el => el.innerText = window.getVal('cfg-azienda'));
    document.querySelectorAll('.val-azienda-piva').forEach(el => el.innerText = window.getVal('cfg-azienda-piva') || '---');
    document.querySelectorAll('.val-azienda-sede-operativa').forEach(el => el.innerText = window.getVal('cfg-azienda-sede-operativa') || '---');
    document.querySelectorAll('.val-azienda-referente').forEach(el => el.innerText = window.getVal('cfg-azienda-referente') || '---');
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
    if (typeof window.applyFabbisogniPrintFields === 'function') window.applyFabbisogniPrintFields();
    if (typeof window.applyGradimentoMonitoraggioPrintFields === 'function') window.applyGradimentoMonitoraggioPrintFields();
    if (typeof window.applyTutorRiesamePrintFields === 'function') window.applyTutorRiesamePrintFields();
    if (typeof window.applyAutomaticSignatureImages === 'function') window.applyAutomaticSignatureImages();
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


// [Step 23] Funzioni spostate in js/modules/scadenze.js


// [Step 23] Funzioni spostate in js/modules/migrazione.js

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


// [Step 23] Funzioni spostate in js/modules/archivio.js


// [Step 23] Funzioni spostate in js/modules/stampe_bundle.js


// [Step 23] Funzioni spostate in js/modules/backup.js


// [Step 23] Funzioni spostate in js/modules/export_sezioni.js


// [Step 23] Funzioni spostate in js/modules/collaudo.js
