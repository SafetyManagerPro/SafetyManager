// Archivio corsi module
// Estratto da js/utils.js nello step 23 per ridurre il file principale.

window.loadArchivioCorsi = async function() {
    const container = document.getElementById('archivio-corsi-container');
    if (!container) return;
    container.innerHTML = '<div class="p-8 text-center text-slate-400 font-bold uppercase"><i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto mb-2"></i> Caricamento archivio...</div>';
    if (typeof lucide !== 'undefined') lucide.createIcons();

    const [progetti, aziende] = await Promise.all([window.getProgetti(), window.getAziende()]);
    window.archivioCorsiState.progetti = progetti || [];
    window.archivioCorsiState.aziende = aziende || [];
    window.archivioCorsiState.collapsedGroups = window.archivioCorsiState.collapsedGroups || {};
    const ids = window.archivioCorsiState.progetti.map(p => p.id).filter(Boolean);
    window.archivioCorsiState.iscrizioniByProject = window.getIscrizioniPerProgetti
        ? await window.getIscrizioniPerProgetti(ids)
        : await window.buildIscrizioniMapFallback(window.archivioCorsiState.progetti);

    if (typeof window.populateArchivioFilters === 'function') window.populateArchivioFilters();
    window.renderArchivioCorsi();
};


window.populateArchivioFilters = function() {
    const azSel = document.getElementById('archivio-filter-azienda');
    const corsoSel = document.getElementById('archivio-filter-corso');
    const progetti = window.archivioCorsiState.progetti || [];
    const aziende = window.archivioCorsiState.aziende || [];

    if (azSel) {
        const prev = azSel.value || '';
        let html = '<option value="">Tutte le aziende / enti</option><option value="__ente__">Ente formatore / erogatore</option>';
        aziende.forEach(a => html += `<option value="${a.id}">${window.dashEscape(a.ragione_sociale || '')}</option>`);
        azSel.innerHTML = html;
        if (prev) azSel.value = prev;
    }

    if (corsoSel) {
        const prev = corsoSel.value || '';
        const used = [...new Set(progetti.map(p => p.corso_id).filter(Boolean))];
        let html = '<option value="">Tutti i corsi</option>';
        used.forEach(id => {
            const c = window.DB_CORSI?.[id] || {};
            html += `<option value="${id}">[${window.dashEscape(c.code || id)}] ${window.dashEscape(c.t || id)}</option>`;
        });
        corsoSel.innerHTML = html;
        if (prev) corsoSel.value = prev;
    }
};

window.toggleArchivioGroup = function(groupKey) {
    window.archivioCorsiState.collapsedGroups = window.archivioCorsiState.collapsedGroups || {};
    window.archivioCorsiState.collapsedGroups[groupKey] = !window.archivioCorsiState.collapsedGroups[groupKey];
    window.renderArchivioCorsi();
};



window.getSchedaClienteCommittenteData = async function(subjectId) {
    if (!subjectId) return null;

    // Step 42: la scheda cliente/ente deve sempre leggere dati freschi, non la cache archivio.
    const [progettiFresh, aziendeFresh] = await Promise.all([window.getProgetti(), window.getAziende()]);
    window.archivioCorsiState = window.archivioCorsiState || {};
    window.archivioCorsiState.progetti = progettiFresh || [];
    window.archivioCorsiState.aziende = aziendeFresh || [];
    window.archivioCorsiState.iscrizioniByProject = {};

    const isEnte = subjectId === '__ente__';
    let subject = null;
    let progetti = [];

    if (isEnte) {
        let enteCfg = null;
        if (typeof window.getEnte === 'function') enteCfg = await window.getEnte();
        subject = {
            type: 'ente',
            ragione_sociale: enteCfg?.ragione_sociale || window.getVal?.('cfg-ente') || window.CNA_AVELLINO_PRESET?.ragione_sociale || 'Ente formatore / erogatore',
            piva_cf: enteCfg?.piva_cf || window.CNA_AVELLINO_PRESET?.piva_cf || '',
            indirizzo: enteCfg?.indirizzo || window.getVal?.('cfg-ente-indirizzo') || window.CNA_AVELLINO_PRESET?.indirizzo || '',
            sede_operativa: enteCfg?.indirizzo || window.getVal?.('cfg-ente-indirizzo') || window.CNA_AVELLINO_PRESET?.indirizzo || '',
            ateco: '',
            referente: enteCfg?.legale_nome || window.getVal?.('cfg-resp-progetto') || window.getVal?.('cfg-legale-nome') || 'Responsabile attività formative ente',
            contatti: enteCfg?.contatti || window.getVal?.('cfg-ente-contatti') || window.CNA_AVELLINO_PRESET?.contatti || ''
        };
        progetti = (window.archivioCorsiState.progetti || []).filter(p => p.ente_erogatore === 'ente');
    } else {
        subject = (window.archivioCorsiState.aziende || []).find(a => a.id === subjectId);
        if (!subject) return null;
        subject.type = 'azienda';
        progetti = (window.archivioCorsiState.progetti || []).filter(p => p.azienda_id === subjectId);
    }

    const ids = progetti.map(p => p.id).filter(Boolean);
    let iscrizioniByProject = window.archivioCorsiState.iscrizioniByProject || {};
    const missing = ids.filter(id => !Array.isArray(iscrizioniByProject[id]));
    if (missing.length) {
        const loaded = window.getIscrizioniPerProgetti
            ? await window.getIscrizioniPerProgetti(ids)
            : await window.buildIscrizioniMapFallback(progetti);
        iscrizioniByProject = { ...iscrizioniByProject, ...loaded };
        window.archivioCorsiState.iscrizioniByProject = iscrizioniByProject;
    }

    const rows = [];
    const corsistiMap = {};
    progetti.forEach(p => {
        const corso = window.DB_CORSI?.[p.corso_id] || {};
        const iscritti = iscrizioniByProject[p.id] || [];
        iscritti.forEach(isc => {
            const c = isc.corsisti || {};
            const cid = c.id || isc.corsista_id || `${c.cf || ''}-${c.nome_cognome || ''}`;
            if (cid) corsistiMap[cid] = c;
            rows.push({
                soggetto: subject.ragione_sociale || '',
                piva_cf: subject.piva_cf || '',
                sede_legale: subject.indirizzo || '',
                sede_operativa: subject.sede_operativa || subject.indirizzo || '',
                ateco: subject.ateco || '',
                referente: subject.referente || '',
                contatti: subject.contatti || '',
                azienda_committente: p.aziende?.ragione_sociale || (isEnte ? 'Committente non indicato' : subject.ragione_sociale || ''),
                corsista: c.nome_cognome || '',
                cf: c.cf || '',
                nascita: c.luogo_data_nascita || '',
                mansione: isc.mansione_storica || c.mansione_storica || '',
                codice_progetto: p.codice || '',
                codice_corso: corso.code || p.corso_id || '',
                corso: corso.t || p.corso_id || '',
                data_inizio: p.data_inizio || '',
                data_attestato: p.data_esame || '',
                scadenza_attestato: isc.data_scadenza || '',
                id_certificato: isc.id_certificato || '',
                esito: isc.esito || '',
                frequenza: (isc.percentuale_frequenza !== null && isc.percentuale_frequenza !== undefined) ? `${isc.percentuale_frequenza}%` : '',
                stato_corso: p.stato_corso || 'aperto',
                sede_corso: p.sede || ''
            });
        });
    });

    const corsisti = Object.values(corsistiMap);
    return {
        subject,
        azienda: subject, // compatibilità con lo Step 34
        isEnte,
        progetti,
        rows,
        corsisti,
        stats: {
            progetti: progetti.length,
            corsisti: corsisti.length,
            attestati: rows.filter(r => r.id_certificato).length,
            scadenze: rows.filter(r => r.scadenza_attestato).length
        }
    };
};

window.buildSchedaClienteCommittenteHtml = function(data, printMode = false) {
    const s = data.subject || data.azienda || {};
    const rows = data.rows || [];
    const generated = new Date().toLocaleDateString('it-IT');
    const pageClass = printMode ? 'export-print-page scheda-landscape print-show' : 'p-5';
    const title = data.isEnte ? 'Scheda ente formatore / erogatore' : 'Scheda cliente / committente';
    const labelSoggetto = data.isEnte ? 'Dati ente formatore / erogatore' : 'Dati cliente';
    const emptyText = data.isEnte ? 'Nessun corsista/attestato collegato ai corsi erogati dall’ente.' : 'Nessun corsista/attestato collegato a questa azienda.';

    const rowsHtml = rows.length ? rows.map((r, idx) => `
        <tr class="${idx % 2 === 0 ? 'bg-white' : 'bg-slate-100'}">
            <td>${idx + 1}</td>
            <td><strong>${window.dashEscape(r.corsista)}</strong><br><span style="font-family:monospace">${window.dashEscape(r.cf)}</span></td>
            <td>${window.dashEscape(r.nascita || '-')}</td>
            <td>${window.dashEscape(r.mansione || '-')}</td>
            <td>${window.dashEscape(r.azienda_committente || '-')}</td>
            <td><strong>[${window.dashEscape(r.codice_corso)}]</strong><br>${window.dashEscape(r.corso)}</td>
            <td><span style="font-family:monospace">${window.dashEscape(r.codice_progetto)}</span><br>${window.formatDataToItalian(r.data_inizio)}</td>
            <td>${window.formatDataToItalian(r.data_attestato)}</td>
            <td>${window.formatDataToItalian(r.scadenza_attestato)}</td>
            <td><span style="font-family:monospace">${window.dashEscape(r.id_certificato || '-')}</span></td>
            <td>${window.dashEscape(r.esito || '-')}<br>${window.dashEscape(r.frequenza || '')}</td>
        </tr>`).join('') : `
        <tr><td colspan="11" style="text-align:center;padding:18px;color:#64748b">${emptyText}</td></tr>`;

    return `<div class="${pageClass}">
        <h1>${title}</h1>
        <p style="font-size:7pt;text-transform:uppercase;color:#64748b;font-weight:900;letter-spacing:.12em;margin-bottom:4mm">Generata il ${generated} · Formato A4 orizzontale</p>

        <div style="display:grid;grid-template-columns:1.25fr .75fr;gap:5mm;margin-bottom:4mm">
            <div style="border:1px solid #cbd5e1;border-radius:10px;padding:8px;background:#f8fafc">
                <h2 style="margin-top:0">${labelSoggetto}</h2>
                <p style="font-size:12pt;font-weight:900;text-transform:uppercase;margin:0 0 2mm">${window.dashEscape(s.ragione_sociale || '-')}</p>
                <p><strong>P.IVA / C.F.:</strong> ${window.dashEscape(s.piva_cf || '-')}</p>
                <p><strong>Sede legale:</strong> ${window.dashEscape(s.indirizzo || '-')}</p>
                <p><strong>Sede operativa:</strong> ${window.dashEscape(s.sede_operativa || s.indirizzo || '-')}</p>
                ${data.isEnte ? `<p><strong>Contatti:</strong> ${window.dashEscape(s.contatti || '-')}</p>` : `<p><strong>ATECO:</strong> ${window.dashEscape(s.ateco || '-')}</p>`}
                <p><strong>${data.isEnte ? 'Responsabile attività formative ente' : 'Referente formazione / Legale rappresentante'}:</strong> ${window.dashEscape(s.referente || '-')}</p>
            </div>
            <div style="border:1px solid #bfdbfe;border-radius:10px;padding:8px;background:#eff6ff">
                <h2 style="margin-top:0;color:#1d4ed8">Riepilogo</h2>
                <p><strong>Progetti formativi:</strong> ${data.stats.progetti}</p>
                <p><strong>Corsisti formati:</strong> ${data.stats.corsisti}</p>
                <p><strong>Attestati presenti:</strong> ${data.stats.attestati}</p>
                <p><strong>Scadenze registrate:</strong> ${data.stats.scadenze}</p>
            </div>
        </div>

        <h2>Elenco corsisti, corsi, attestati e scadenze</h2>
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Corsista / CF</th>
                    <th>Nascita</th>
                    <th>Mansione</th>
                    <th>Committente</th>
                    <th>Corso</th>
                    <th>Progetto / Inizio</th>
                    <th>Data attestato</th>
                    <th>Scadenza</th>
                    <th>ID certificato</th>
                    <th>Esito / Freq.</th>
                </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
        </table>

        <div style="margin-top:6mm;display:grid;grid-template-columns:1fr 1fr;gap:20mm;font-size:7pt;text-align:center">
            <div><p style="text-transform:uppercase;font-weight:900;color:#64748b">${data.isEnte ? 'Responsabile attività formative ente' : 'Per presa visione cliente/committente'}</p><p style="border-bottom:1px solid #94a3b8;margin-top:10mm"></p></div>
            <div><p style="text-transform:uppercase;font-weight:900;color:#64748b">Operatore / incaricato</p><p style="border-bottom:1px solid #94a3b8;margin-top:10mm"></p></div>
        </div>
    </div>`;
};

window.stampaSchedaClienteCommittente = async function(subjectId) {
    const printArea = document.getElementById('print-area-temp');
    if (!printArea) return alert('Area di stampa non disponibile.');

    try {
        const data = await window.getSchedaClienteCommittenteData(subjectId);
        if (!data) return alert('Soggetto non trovato.');
        printArea.innerHTML = window.buildSchedaClienteCommittenteHtml(data, true);
        alert(`Ora si aprirà la stampa della ${data.isEnte ? 'scheda ente' : 'scheda cliente'} in formato A4 orizzontale. Seleziona "Salva come PDF" per archiviarla.`);
        document.body.classList.add('is-printing-temp', 'is-scheda-landscape');
        setTimeout(() => {
            window.print();
            document.body.classList.remove('is-printing-temp', 'is-scheda-landscape');
            printArea.innerHTML = '';
        }, 900);
    } catch (e) {
        console.error(e);
        alert('Errore nella preparazione scheda: ' + (e.message || e));
        document.body.classList.remove('is-printing-temp', 'is-scheda-landscape');
        printArea.innerHTML = '';
    }
};

window.esportaSchedaClienteCommittenteXLS = async function(subjectId) {
    if (typeof XLSX === 'undefined') {
        return alert('Libreria XLSX non disponibile. Verifica la connessione o esporta in PDF.');
    }

    const data = await window.getSchedaClienteCommittenteData(subjectId);
    if (!data) return alert('Soggetto non trovato.');

    const s = data.subject || data.azienda || {};
    const rows = (data.rows || []).map(r => ({
        'Soggetto': r.soggetto,
        'Tipo scheda': data.isEnte ? 'Ente formatore / erogatore' : 'Cliente / committente',
        'P.IVA / C.F.': r.piva_cf,
        'Sede legale': r.sede_legale,
        'Sede operativa': r.sede_operativa,
        'ATECO': r.ateco,
        'Referente / Responsabile': r.referente,
        'Committente': r.azienda_committente,
        'Corsista': r.corsista,
        'Codice fiscale': r.cf,
        'Nascita': r.nascita,
        'Mansione': r.mansione,
        'Codice progetto': r.codice_progetto,
        'Codice corso': r.codice_corso,
        'Corso': r.corso,
        'Data inizio': r.data_inizio,
        'Data attestato': r.data_attestato,
        'Scadenza attestato': r.scadenza_attestato,
        'ID certificato': r.id_certificato,
        'Esito': r.esito,
        'Frequenza': r.frequenza,
        'Stato corso': r.stato_corso,
        'Sede corso': r.sede_corso
    }));

    const summary = [
        [data.isEnte ? 'Scheda ente formatore / erogatore' : 'Scheda cliente / committente', s.ragione_sociale || ''],
        ['P.IVA / C.F.', s.piva_cf || ''],
        ['Sede legale', s.indirizzo || ''],
        ['Sede operativa', s.sede_operativa || s.indirizzo || ''],
        ['ATECO', s.ateco || ''],
        ['Referente / Responsabile', s.referente || ''],
        ['Progetti formativi', data.stats.progetti],
        ['Corsisti formati', data.stats.corsisti],
        ['Attestati presenti', data.stats.attestati],
        ['Scadenze registrate', data.stats.scadenze],
        ['Data export', new Date().toLocaleString('it-IT')]
    ];

    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.aoa_to_sheet(summary);
    const wsRows = XLSX.utils.json_to_sheet(rows.length ? rows : [{ 'Note': data.isEnte ? 'Nessun corsista/attestato collegato ai corsi dell’ente' : 'Nessun corsista/attestato collegato' }]);
    XLSX.utils.book_append_sheet(wb, wsSummary, data.isEnte ? 'Riepilogo Ente' : 'Riepilogo Cliente');
    XLSX.utils.book_append_sheet(wb, wsRows, 'Corsisti Attestati');

    const safeName = String(s.ragione_sociale || (data.isEnte ? 'ente_formatore' : 'cliente')).replace(/[^a-z0-9_\-]+/gi, '_').substring(0, 60);
    XLSX.writeFile(wb, `${data.isEnte ? 'Scheda_ente' : 'Scheda_cliente'}_${safeName}.xlsx`);
};

window.renderArchivioCorsi = function() {
    const container = document.getElementById('archivio-corsi-container');
    if (!container) return;

    const q = (document.getElementById('archivio-search')?.value || '').toLowerCase();
    const statoFilter = document.getElementById('archivio-filter-stato')?.value || '';
    const aziendaFilter = document.getElementById('archivio-filter-azienda')?.value || '';
    const corsoFilter = document.getElementById('archivio-filter-corso')?.value || '';
    const progetti = window.archivioCorsiState.progetti || [];
    const aziende = window.archivioCorsiState.aziende || [];
    const iscrizioniByProject = window.archivioCorsiState.iscrizioniByProject || {};
    const collapsed = window.archivioCorsiState.collapsedGroups || {};

    const projectOk = (p) => {
        const statoOk = !statoFilter || (p.stato_corso || 'aperto') === statoFilter;
        const corsoOk = !corsoFilter || p.corso_id === corsoFilter;
        const aziendaOk = !aziendaFilter ||
            (aziendaFilter === '__ente__' ? p.ente_erogatore === 'ente' : p.azienda_id === aziendaFilter);
        return statoOk && corsoOk && aziendaOk;
    };

    const groups = [];
    aziende.forEach(az => {
        const ps = progetti.filter(p => p.azienda_id === az.id && projectOk(p));
        if (!ps.length) return;
        groups.push({
            key: `azienda-${az.id}`,
            type: 'azienda',
            azienda_id: az.id,
            title: az.ragione_sociale,
            subtitle: `${az.piva_cf || ''} ${az.ateco ? '· ATECO ' + az.ateco : ''}`,
            progetti: ps
        });
    });

    const enteProjects = progetti.filter(p => p.ente_erogatore === 'ente' && projectOk(p));
    if (enteProjects.length) {
        groups.unshift({
            key: 'ente-formatore',
            type: 'ente',
            title: window.getVal('cfg-ente') || 'Ente formatore / erogatore',
            subtitle: 'Corsi erogati come associazione/ente di diretta emanazione',
            progetti: enteProjects
        });
    }

    const filtered = groups.map(g => {
        const ps = g.progetti.filter(p => {
            const course = window.DB_CORSI[p.corso_id]?.t || p.corso_id;
            const ccode = window.DB_CORSI[p.corso_id]?.code || '';
            const iscritti = iscrizioniByProject[p.id] || [];
            const hay = [g.title, g.subtitle, p.codice, course, ccode, p.aziende?.ragione_sociale, ...iscritti.map(i => `${i.corsisti?.nome_cognome || ''} ${i.corsisti?.cf || ''}`)].join(' ').toLowerCase();
            return !q || hay.includes(q);
        });
        return { ...g, progetti: ps };
    }).filter(g => g.progetti.length);

    if (!filtered.length) {
        container.innerHTML = '<div class="p-8 bg-white rounded-xl border border-slate-200 text-center text-slate-500 font-bold uppercase">Nessun corso trovato per i filtri selezionati.</div>';
        return;
    }

    container.innerHTML = filtered.map(g => {
        const isCollapsed = !!collapsed[g.key];
        return `
        <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <button type="button" onclick="window.toggleArchivioGroup('${g.key}')" class="w-full p-4 ${g.type === 'ente' ? 'bg-emerald-50 border-emerald-100' : 'bg-blue-50 border-blue-100'} border-b flex justify-between items-start gap-4 text-left hover:brightness-95 transition">
                <div class="flex items-start gap-3 min-w-0">
                    <span class="shrink-0 w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                        <i data-lucide="${isCollapsed ? 'chevron-down' : 'chevron-up'}" class="w-4 h-4 ${g.type === 'ente' ? 'text-emerald-700' : 'text-blue-700'}"></i>
                    </span>
                    <div class="min-w-0">
                        <p class="font-black uppercase ${g.type === 'ente' ? 'text-emerald-900' : 'text-blue-900'}">${window.dashEscape(g.title)}</p>
                        <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">${window.dashEscape(g.subtitle || '')}</p>
                        <p class="text-[9px] text-slate-400 font-black uppercase mt-1">${isCollapsed ? 'Apri dettaglio corsi e corsisti' : 'Chiudi dettaglio corsi e corsisti'}</p>
                    </div>
                </div>
                <span class="px-3 py-1 rounded-full bg-white border border-slate-200 text-[10px] font-black uppercase text-slate-700">${g.progetti.length} corsi</span>
            </button>
            <div class="px-4 py-3 bg-white border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <p class="text-[9px] font-black uppercase tracking-widest text-slate-500">${g.type === 'ente' ? 'Scheda ente formatore / erogatore: corsi erogati, corsisti, attestati e scadenze' : 'Scheda cliente / committente: dati azienda, corsisti, attestati e scadenze'}</p>
                <div class="flex flex-wrap gap-2">
                    <button type="button" onclick="window.stampaSchedaClienteCommittente('${g.type === 'ente' ? '__ente__' : g.azienda_id}')" class="px-3 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-[9px] font-black uppercase inline-flex items-center gap-1">
                        <i data-lucide="file-text" class="w-3 h-3"></i> ${g.type === 'ente' ? 'Scheda ente PDF' : 'Scheda cliente PDF'}
                    </button>
                    <button type="button" onclick="window.esportaSchedaClienteCommittenteXLS('${g.type === 'ente' ? '__ente__' : g.azienda_id}')" class="px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[9px] font-black uppercase inline-flex items-center gap-1">
                        <i data-lucide="file-spreadsheet" class="w-3 h-3"></i> ${g.type === 'ente' ? 'Scheda ente XLS' : 'Scheda XLS'}
                    </button>
                </div>
            </div>
            <div class="${isCollapsed ? 'hidden' : ''} divide-y divide-slate-100">
                ${g.progetti.map(p => {
                    const course = window.DB_CORSI[p.corso_id]?.t || p.corso_id;
                    const ccode = window.DB_CORSI[p.corso_id]?.code || '';
                    const iscritti = iscrizioniByProject[p.id] || [];
                    const stato = p.stato_corso || 'aperto';
                    const badge = stato === 'chiuso' ? 'bg-slate-900 text-white' : (stato === 'svolto' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800');
                    return `<div class="p-4">
                        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                            <div>
                                <button onclick="window.apriPopupProgettoById('${p.id}', 'progetti')" class="font-mono text-rose-700 hover:underline font-black text-xs">${window.dashEscape(p.codice || '')}</button>
                                <p class="font-black text-slate-900 uppercase text-sm mt-1"><span class="font-mono text-blue-700">[${window.dashEscape(ccode)}]</span> ${window.dashEscape(course)}</p>
                                <p class="text-[10px] text-slate-500 uppercase mt-0.5">Esame: ${window.formatDataToItalian(p.data_esame)} · Corsisti: ${iscritti.length}</p>
                                ${p.documenti_firmati_url ? `<a href="${window.dashEscape(p.documenti_firmati_url)}" target="_blank" class="inline-block mt-2 text-[10px] font-black text-blue-700 hover:underline uppercase">Apri scansioni documenti firmati</a>` : ''}
                            </div>
                            <div class="flex flex-wrap gap-2 self-start justify-start lg:justify-end">
                                <button type="button" onclick="window.stampaFoglioProgetto('${p.id}')" class="px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-[9px] font-black uppercase inline-flex items-center gap-1">
                                    <i data-lucide="printer" class="w-3 h-3"></i> Stampa corso/corsisti
                                </button>
                                <span class="px-3 py-1 rounded-full ${badge} text-[9px] font-black uppercase">${window.dashEscape(stato)}</span>
                            </div>
                        </div>
                        <div class="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                            ${iscritti.length ? iscritti.map((isc, idx) => `<div class="border border-slate-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} rounded-lg p-2">
                                <p class="font-black uppercase text-slate-900 text-[11px]">${window.dashEscape(isc.corsisti?.nome_cognome || '-')}</p>
                                <p class="font-mono text-[9px] text-slate-500">${window.dashEscape(isc.corsisti?.cf || '-')}</p>
                                <p class="text-[9px] text-slate-500 mt-1">${window.dashEscape(isc.mansione_storica || isc.corsisti?.mansione_storica || '-')}</p>
                            </div>`).join('') : '<div class="text-[10px] text-red-600 font-bold uppercase">Nessun corsista abbinato</div>'}
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
};

// ==========================================
// STAMPA PDF COMPLETA PROGETTO + ATTESTATI
// ==========================================
