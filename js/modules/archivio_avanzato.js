// STEP 12 - Archivio corsi avanzato
// Migliora ricerca, filtri, riepiloghi e azioni rapide senza modificare database, stampe o firme.
(function(){
  if (window.__safetyArchivioAvanzatoLoaded) return;
  window.__safetyArchivioAvanzatoLoaded = true;

  const esc = v => window.dashEscape ? window.dashEscape(v) : String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const ok = v => v !== null && v !== undefined && String(v).trim() !== '' && String(v).trim() !== '---';
  const norm = v => String(v || '').trim().toLowerCase();
  const fmt = v => !v ? '-' : (window.formatDataToItalian ? window.formatDataToItalian(String(v).slice(0,10)) : String(v).slice(0,10));
  const parseDate = v => { if(!v) return null; const d = new Date(String(v).slice(0,10) + 'T00:00:00'); return Number.isNaN(d.getTime()) ? null : d; };
  const today = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
  const daysTo = v => { const d = parseDate(v); if(!d) return null; return Math.ceil((d.getTime() - today().getTime()) / 86400000); };
  const corso = p => { const c = window.DB_CORSI?.[p?.corso_id] || {}; return { title: c.t || p?.corso_id || 'Corso non indicato', code: c.code || p?.corso_id || '' }; };
  const azienda = p => p?.aziende?.ragione_sociale || p?.azienda_nome || 'Azienda non collegata';

  window.archivioCorsiState = window.archivioCorsiState || { progetti: [], aziende: [], iscrizioniByProject: {}, collapsedGroups: {} };

  const getStatus = p => {
    const stato = norm(p?.stato_corso || 'aperto');
    const exam = parseDate(p?.data_esame);
    if (stato === 'chiuso') return { key:'chiuso', label:'Chiuso', tone:'slate' };
    if (stato === 'svolto' || (exam && exam <= today())) return { key:'svolto', label:'Da chiudere', tone:'amber' };
    return { key:'aperto', label:'Aperto', tone:'emerald' };
  };

  const statusBadge = status => {
    const map = {
      chiuso: 'bg-slate-900 text-white border-slate-900',
      svolto: 'bg-amber-100 text-amber-900 border-amber-200',
      aperto: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    };
    return `<span class="px-3 py-1 rounded-full border ${map[status.key] || map.aperto} text-[9px] font-black uppercase tracking-widest">${esc(status.label)}</span>`;
  };

  const getFilters = () => ({
    q: norm(document.getElementById('archivio-search')?.value || ''),
    azienda: document.getElementById('archivio-filter-azienda')?.value || '',
    corso: document.getElementById('archivio-filter-corso')?.value || '',
    stato: document.getElementById('archivio-filter-stato')?.value || '',
    docs: document.getElementById('archivio-filter-docs')?.value || '',
    from: parseDate(document.getElementById('archivio-date-from')?.value || ''),
    to: parseDate(document.getElementById('archivio-date-to')?.value || '')
  });

  const projectMatches = (p, group, iscritti, filters) => {
    const c = corso(p);
    const status = getStatus(p);
    const exam = parseDate(p.data_esame);

    if (filters.stato && status.key !== filters.stato) return false;
    if (filters.corso && p.corso_id !== filters.corso) return false;
    if (filters.azienda) {
      const azOk = filters.azienda === '__ente__' ? p.ente_erogatore === 'ente' : p.azienda_id === filters.azienda;
      if (!azOk) return false;
    }
    if (filters.from && (!exam || exam < filters.from)) return false;
    if (filters.to && (!exam || exam > filters.to)) return false;

    if (filters.docs === 'missing_docs' && ok(p.documenti_firmati_url)) return false;
    if (filters.docs === 'with_docs' && !ok(p.documenti_firmati_url)) return false;
    if (filters.docs === 'expiring90') {
      const any = iscritti.some(i => { const dd = daysTo(i.data_scadenza); return dd !== null && dd >= 0 && dd <= 90; });
      if (!any) return false;
    }
    if (filters.docs === 'expired') {
      const any = iscritti.some(i => { const dd = daysTo(i.data_scadenza); return dd !== null && dd < 0; });
      if (!any) return false;
    }

    if (filters.q) {
      const hay = [
        group.title, group.subtitle, p.codice, c.title, c.code, p.sede, p.resp_progetto, p.resp_corso,
        p.documenti_firmati_url, azienda(p),
        ...iscritti.map(i => `${i.corsisti?.nome_cognome || ''} ${i.corsisti?.cf || ''} ${i.id_certificato || ''} ${i.esito || ''} ${i.mansione_storica || i.corsisti?.mansione_storica || ''}`)
      ].join(' ').toLowerCase();
      if (!hay.includes(filters.q)) return false;
    }
    return true;
  };

  const buildGroups = () => {
    const filters = getFilters();
    const progetti = window.archivioCorsiState.progetti || [];
    const aziende = window.archivioCorsiState.aziende || [];
    const iscrizioniByProject = window.archivioCorsiState.iscrizioniByProject || {};
    const groups = [];

    const enteProjects = progetti.filter(p => p.ente_erogatore === 'ente');
    if (enteProjects.length) {
      groups.push({
        key: 'ente-formatore',
        type: 'ente',
        azienda_id: '__ente__',
        title: (window.CNA_AVELLINO_PRESET?.ragione_sociale || 'Ente formatore / erogatore'),
        subtitle: 'Corsi erogati direttamente come ente/associazione',
        progetti: enteProjects
      });
    }

    aziende.forEach(az => {
      const ps = progetti.filter(p => p.azienda_id === az.id);
      if (!ps.length) return;
      groups.push({
        key: `azienda-${az.id}`,
        type: 'azienda',
        azienda_id: az.id,
        title: az.ragione_sociale || 'Azienda senza nome',
        subtitle: `${az.piva_cf || ''}${az.ateco ? ' · ATECO ' + az.ateco : ''}${az.referente ? ' · Ref. ' + az.referente : ''}`,
        progetti: ps
      });
    });

    return groups.map(g => ({
      ...g,
      progetti: g.progetti.filter(p => projectMatches(p, g, iscrizioniByProject[p.id] || [], filters))
    })).filter(g => g.progetti.length);
  };

  const computeStats = groups => {
    const iscrizioniByProject = window.archivioCorsiState.iscrizioniByProject || {};
    const projects = groups.flatMap(g => g.progetti || []);
    const iscrizioni = projects.flatMap(p => iscrizioniByProject[p.id] || []);
    const uniqueCorsisti = new Set(iscrizioni.map(i => i.corsisti?.id || i.corsista_id || i.corsisti?.cf || i.corsisti?.nome_cognome).filter(Boolean));
    const stats = {
      groups: groups.length,
      projects: projects.length,
      opened: projects.filter(p => getStatus(p).key === 'aperto').length,
      toClose: projects.filter(p => getStatus(p).key === 'svolto').length,
      closed: projects.filter(p => getStatus(p).key === 'chiuso').length,
      iscrizioni: iscrizioni.length,
      corsisti: uniqueCorsisti.size,
      attestati: iscrizioni.filter(i => ok(i.id_certificato)).length,
      expiring90: iscrizioni.filter(i => { const dd = daysTo(i.data_scadenza); return dd !== null && dd >= 0 && dd <= 90; }).length,
      expired: iscrizioni.filter(i => { const dd = daysTo(i.data_scadenza); return dd !== null && dd < 0; }).length,
      docs: projects.filter(p => ok(p.documenti_firmati_url)).length
    };
    return stats;
  };

  const renderStats = stats => {
    const box = document.getElementById('archivio-advanced-stats');
    if (!box) return;
    const card = (title, value, sub, icon, tone) => `
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-[9px] font-black uppercase tracking-widest text-slate-500">${esc(title)}</p>
            <p class="text-2xl font-black text-slate-900 mt-1">${esc(value)}</p>
          </div>
          <span class="w-10 h-10 rounded-xl bg-${tone}-50 text-${tone}-700 border border-${tone}-100 flex items-center justify-center"><i data-lucide="${icon}" class="w-4 h-4"></i></span>
        </div>
        <p class="text-[10px] text-slate-500 mt-2 leading-relaxed">${esc(sub)}</p>
      </div>`;
    box.innerHTML = [
      card('Corsi filtrati', stats.projects, `${stats.opened} aperti · ${stats.toClose} da chiudere · ${stats.closed} chiusi`, 'folder', 'blue'),
      card('Corsisti unici', stats.corsisti, `${stats.iscrizioni} iscrizioni complessive`, 'users', 'emerald'),
      card('Attestati', stats.attestati, `${stats.expiring90} in scadenza 90gg · ${stats.expired} scaduti`, 'file-text', 'amber'),
      card('Documenti firmati', `${stats.docs}/${stats.projects}`, 'Progetti con link/scansione documentale', 'archive', 'slate')
    ].join('');
  };

  const renderSummary = stats => {
    const box = document.getElementById('archivio-result-summary');
    if (!box) return;
    box.innerHTML = `
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-slate-900 text-white rounded-2xl p-4 mb-4">
        <div>
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Risultati archivio</p>
          <p class="font-black text-sm uppercase">${stats.projects} corsi · ${stats.corsisti} corsisti · ${stats.attestati} attestati</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" onclick="window.exportArchivioAvanzatoXLSX()" class="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1"><i data-lucide="file-spreadsheet" class="w-3 h-3"></i> Export XLSX</button>
          <button type="button" onclick="window.printArchivioAvanzatoSintesi()" class="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1"><i data-lucide="printer" class="w-3 h-3"></i> Sintesi PDF</button>
          <button type="button" onclick="window.resetArchivioAdvancedFilters()" class="px-3 py-2 rounded-xl bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest">Reset filtri</button>
        </div>
      </div>`;
  };

  const projectActions = p => `
    <div class="flex flex-wrap gap-2 self-start justify-start lg:justify-end">
      <button type="button" onclick="window.apriPopupProgettoById && window.apriPopupProgettoById('${esc(p.id)}','archivio_corsi')" class="px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-[9px] font-black uppercase">Apri</button>
      <button type="button" onclick="window.preparaVaiStampe ? window.preparaVaiStampe('${esc(p.id)}') : window.loadModule('stampe')" class="px-3 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-100 text-[9px] font-black uppercase">Stampe</button>
      <button type="button" onclick="window.apriPreparazioneCorso ? window.apriPreparazioneCorso('${esc(p.id)}') : window.loadOptionalSafetyScript('js/modules/prepara_corso.js').then(()=>window.apriPreparazioneCorso && window.apriPreparazioneCorso('${esc(p.id)}'))" class="px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-100 text-[9px] font-black uppercase">Prepara</button>
      <button type="button" onclick="window.apriChecklistCorso ? window.apriChecklistCorso('${esc(p.id)}') : window.loadOptionalSafetyScript('js/modules/checklist_corso.js').then(()=>window.apriChecklistCorso && window.apriChecklistCorso('${esc(p.id)}'))" class="px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-100 text-[9px] font-black uppercase">Checklist</button>
      <button type="button" onclick="window.stampaFoglioProgetto && window.stampaFoglioProgetto('${esc(p.id)}')" class="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-[9px] font-black uppercase">Foglio</button>
    </div>`;

  const corsistiHtml = (iscritti) => {
    if (!iscritti.length) return '<div class="text-[10px] text-rose-700 font-black uppercase rounded-xl bg-rose-50 border border-rose-100 p-3">Nessun corsista abbinato</div>';
    return iscritti.map((isc, idx) => {
      const c = isc.corsisti || {};
      const dd = daysTo(isc.data_scadenza);
      const scadTone = dd === null ? 'slate' : (dd < 0 ? 'rose' : (dd <= 90 ? 'amber' : 'emerald'));
      const scadText = dd === null ? 'Scadenza n/d' : (dd < 0 ? `Scaduto da ${Math.abs(dd)}g` : (dd <= 90 ? `Scade tra ${dd}g` : `Scade ${fmt(isc.data_scadenza)}`));
      return `<div class="border border-slate-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} rounded-xl p-3">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="font-black uppercase text-slate-900 text-[11px] truncate">${esc(c.nome_cognome || '-')}</p>
            <p class="font-mono text-[9px] text-slate-500">${esc(c.cf || '-')}</p>
          </div>
          <span class="shrink-0 px-2 py-0.5 rounded-full bg-${scadTone}-50 text-${scadTone}-800 border border-${scadTone}-100 text-[8px] font-black uppercase">${esc(scadText)}</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-[9px] text-slate-600">
          <p><strong>Mansione:</strong> ${esc(isc.mansione_storica || c.mansione_storica || '-')}</p>
          <p><strong>Esito:</strong> ${esc(isc.esito || '-')}</p>
          <p><strong>ID:</strong> <span class="font-mono">${esc(isc.id_certificato || '-')}</span></p>
          <p><strong>Freq.:</strong> ${esc(isc.percentuale_frequenza ?? '-')}%</p>
        </div>
      </div>`;
    }).join('');
  };

  window.resetArchivioAdvancedFilters = function(){
    ['archivio-search','archivio-filter-azienda','archivio-filter-corso','archivio-filter-stato','archivio-filter-docs','archivio-date-from','archivio-date-to'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
    window.renderArchivioCorsi();
  };

  window.renderArchivioCorsiLegacy = window.renderArchivioCorsiLegacy || window.renderArchivioCorsi;

  window.renderArchivioCorsi = function(){
    const container = document.getElementById('archivio-corsi-container');
    if (!container) return;
    const groups = buildGroups();
    const stats = computeStats(groups);
    renderStats(stats);
    renderSummary(stats);
    const collapsed = window.archivioCorsiState.collapsedGroups || {};

    if (!groups.length) {
      container.innerHTML = '<div class="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 font-bold uppercase">Nessun corso trovato per i filtri selezionati.</div>';
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    container.innerHTML = groups.map(g => {
      const isCollapsed = !!collapsed[g.key];
      const iscrizioniByProject = window.archivioCorsiState.iscrizioniByProject || {};
      const iscrittiGroup = g.progetti.flatMap(p => iscrizioniByProject[p.id] || []);
      const attestatiGroup = iscrittiGroup.filter(i => ok(i.id_certificato)).length;
      const scad90 = iscrittiGroup.filter(i => { const dd = daysTo(i.data_scadenza); return dd !== null && dd >= 0 && dd <= 90; }).length;
      return `
      <div class="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <button type="button" onclick="window.toggleArchivioGroup('${esc(g.key)}')" class="w-full p-5 ${g.type === 'ente' ? 'bg-emerald-50' : 'bg-blue-50'} border-b border-slate-100 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 text-left hover:brightness-95 transition">
          <div class="flex items-start gap-3 min-w-0">
            <span class="shrink-0 w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
              <i data-lucide="${isCollapsed ? 'chevron-down' : 'chevron-up'}" class="w-4 h-4 ${g.type === 'ente' ? 'text-emerald-700' : 'text-blue-700'}"></i>
            </span>
            <div class="min-w-0">
              <p class="font-black uppercase ${g.type === 'ente' ? 'text-emerald-900' : 'text-blue-900'} truncate">${esc(g.title)}</p>
              <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 truncate">${esc(g.subtitle || '')}</p>
              <p class="text-[9px] text-slate-400 font-black uppercase mt-1">${g.progetti.length} corsi · ${iscrittiGroup.length} iscrizioni · ${attestatiGroup} attestati${scad90 ? ` · ${scad90} scadenze entro 90gg` : ''}</p>
            </div>
          </div>
          <div class="flex flex-wrap gap-2 shrink-0" onclick="event.stopPropagation()">
            <button type="button" onclick="window.stampaSchedaClienteCommittente('${g.type === 'ente' ? '__ente__' : esc(g.azienda_id)}')" class="px-3 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-[9px] font-black uppercase inline-flex items-center gap-1"><i data-lucide="file-text" class="w-3 h-3"></i> Scheda PDF</button>
            <button type="button" onclick="window.esportaSchedaClienteCommittenteXLS('${g.type === 'ente' ? '__ente__' : esc(g.azienda_id)}')" class="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-[9px] font-black uppercase inline-flex items-center gap-1"><i data-lucide="file-spreadsheet" class="w-3 h-3"></i> XLS</button>
          </div>
        </button>
        <div class="${isCollapsed ? 'hidden' : ''} divide-y divide-slate-100">
          ${g.progetti.map((p, projectIndex) => {
            const c = corso(p);
            const iscritti = iscrizioniByProject[p.id] || [];
            const status = getStatus(p);
            const docOk = ok(p.documenti_firmati_url);
            return `<div class="archive-project-row p-4 ${projectIndex % 2 === 0 ? 'archive-project-row-even' : 'archive-project-row-odd'}">
              <div class="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-3">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <button type="button" onclick="window.apriPopupProgettoById && window.apriPopupProgettoById('${esc(p.id)}','archivio_corsi')" class="font-mono text-rose-700 hover:underline font-black text-xs">${esc(p.codice || 'Senza codice')}</button>
                    ${statusBadge(status)}
                    <span class="px-2 py-1 rounded-full ${docOk ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-amber-50 text-amber-900 border-amber-100'} border text-[8px] font-black uppercase">${docOk ? 'Documenti firmati' : 'Documenti da archiviare'}</span>
                  </div>
                  <p class="font-black text-slate-900 uppercase text-sm mt-1"><span class="font-mono text-blue-700">[${esc(c.code)}]</span> ${esc(c.title)}</p>
                  <p class="text-[10px] text-slate-500 uppercase mt-0.5">Inizio: ${fmt(p.data_inizio)} · Verifica: ${fmt(p.data_esame)} · Sede: ${esc(p.sede || '-')} · Corsisti: ${iscritti.length}</p>
                  ${docOk ? `<a href="${esc(p.documenti_firmati_url)}" target="_blank" class="inline-flex items-center gap-1 mt-2 text-[10px] font-black text-blue-700 hover:underline uppercase"><i data-lucide="external-link" class="w-3 h-3"></i> Apri scansioni documenti firmati</a>` : ''}
                </div>
                ${projectActions(p)}
              </div>
              <div class="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">${corsistiHtml(iscritti)}</div>
            </div>`;
          }).join('')}
        </div>
      </div>`;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
  };

  window.archivioAdvancedRows = function(){
    const groups = buildGroups();
    const iscrizioniByProject = window.archivioCorsiState.iscrizioniByProject || {};
    const rows = [];
    groups.forEach(g => (g.progetti || []).forEach(p => {
      const c = corso(p);
      const status = getStatus(p);
      const iscritti = iscrizioniByProject[p.id] || [];
      if (!iscritti.length) {
        rows.push({
          'Soggetto': g.title,
          'Azienda committente': azienda(p),
          'Codice progetto': p.codice || '',
          'Corso': c.title,
          'Codice corso': c.code,
          'Data inizio': p.data_inizio || '',
          'Data verifica': p.data_esame || '',
          'Stato': status.label,
          'Corsista': '',
          'Codice fiscale': '',
          'ID attestato': '',
          'Scadenza': '',
          'Esito': '',
          'Documenti firmati': p.documenti_firmati_url || ''
        });
      } else {
        iscritti.forEach(i => rows.push({
          'Soggetto': g.title,
          'Azienda committente': azienda(p),
          'Codice progetto': p.codice || '',
          'Corso': c.title,
          'Codice corso': c.code,
          'Data inizio': p.data_inizio || '',
          'Data verifica': p.data_esame || '',
          'Stato': status.label,
          'Corsista': i.corsisti?.nome_cognome || '',
          'Codice fiscale': i.corsisti?.cf || '',
          'Mansione': i.mansione_storica || i.corsisti?.mansione_storica || '',
          'ID attestato': i.id_certificato || '',
          'Scadenza': i.data_scadenza || '',
          'Esito': i.esito || '',
          'Frequenza %': i.percentuale_frequenza ?? '',
          'Documenti firmati': p.documenti_firmati_url || ''
        }));
      }
    }));
    return rows;
  };

  window.exportArchivioAvanzatoXLSX = function(){
    const rows = window.archivioAdvancedRows();
    if (!rows.length) return alert('Nessun dato da esportare con i filtri attuali.');
    if (typeof XLSX === 'undefined') return alert('Libreria Excel non caricata. Ricarica la pagina e riprova.');
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    const headers = Object.keys(rows[0] || {});
    ws['!cols'] = headers.map(h => ({ wch: Math.min(38, Math.max(String(h).length, ...rows.slice(0, 200).map(r => String(r[h] ?? '').length)) + 2) }));
    XLSX.utils.book_append_sheet(wb, ws, 'Archivio filtrato');
    const stamp = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
    XLSX.writeFile(wb, `Archivio_corsi_filtrato_${stamp}.xlsx`);
  };

  window.printArchivioAvanzatoSintesi = function(){
    const rows = window.archivioAdvancedRows();
    if (!rows.length) return alert('Nessun dato da stampare con i filtri attuali.');
    const printArea = document.getElementById('print-area-temp');
    if (!printArea) return alert('Area stampa non disponibile.');
    const sample = rows.slice(0, 120);
    const headers = ['Soggetto','Codice progetto','Corso','Data verifica','Stato','Corsista','ID attestato','Scadenza'];
    printArea.innerHTML = `<div class="export-print-page"><h1>Archivio corsi - sintesi filtrata</h1><p style="font-size:8pt;color:#64748b;margin-bottom:5mm">Generata il ${new Date().toLocaleString('it-IT')} · ${rows.length} righe totali${rows.length>sample.length ? ' · prime ' + sample.length + ' righe' : ''}</p><table><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${sample.map(r=>`<tr>${headers.map(h=>`<td>${esc(r[h] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    document.body.classList.add('is-printing-temp');
    setTimeout(() => {
      window.print();
      document.body.classList.remove('is-printing-temp');
      printArea.innerHTML = '';
    }, 400);
  };

  if (document.getElementById('archivio-corsi-container') && (window.archivioCorsiState.progetti || []).length) {
    setTimeout(() => window.renderArchivioCorsi(), 80);
  }
})();