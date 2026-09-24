// STEP 13 - Import guidato sicuro
// Anteprima, controllo duplicati e blocco importazioni rischiose prima dell'upsert reale.
(function(){
  if (window.__safetyImportGuidatoLoaded) return;
  window.__safetyImportGuidatoLoaded = true;

  const esc = v => window.dashEscape ? window.dashEscape(v) : String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const norm = v => String(v ?? '').trim().toLowerCase();
  const clean = v => String(v ?? '').trim();
  const ok = v => clean(v) !== '' && clean(v) !== '---';
  const cf = v => clean(v).toUpperCase().replace(/\s+/g, '');
  const key = v => norm(v).replace(/\s+/g, ' ');
  const val = (row, col) => col ? clean(row[col]) : '';
  const fmtDate = v => {
    const x = window.formatDataToISODate ? window.formatDataToISODate(clean(v)) : clean(v);
    return x || '';
  };

  window.importGuidatoState = window.importGuidatoState || { analysis: null, mapConfig: null };

  const log = (msg, isError=false) => {
    if (typeof window.logMig === 'function') window.logMig(msg, isError);
    else console[isError ? 'error' : 'log']('[ImportGuidato]', msg);
  };

  const getMapConfig = () => {
    const map = {};
    (window.DB_TARGETS || []).forEach(t => {
      map[t.id] = document.getElementById(`map_${t.id}`)?.value || '';
    });
    return map;
  };

  const guessCourseId = text => {
    const s = norm(text);
    if (!s) return 'lav_basso';
    if (s.includes('alto')) return 'lav_alto';
    if (s.includes('medio')) return 'lav_medio';
    if (s.includes('basso')) return 'lav_basso';
    if (s.includes('rls')) return 'rls';
    if (s.includes('preposto')) return 'preposto';
    if (s.includes('dirigent')) return 'dirigenti';
    if (s.includes('datore') || s.includes('dl ')) return 'dl_base';
    if (s.includes('antincendio')) return 'antincendio_liv2';
    if (s.includes('primo soccorso') || s.includes('primosoccorso')) return 'primo_soccorso_12h';
    if (s.includes('carrell') || s.includes('mulett')) return 'attr_carrelli_ind';
    if (s.includes('ple')) return 'attr_ple';
    if (s.includes('gru')) return 'attr_gru_autocarro';
    if (s.includes('trattor')) return 'attr_trattori';
    return 'lav_basso';
  };

  const rowSummary = (row, map, index, caches, seen) => {
    const rowNumber = index + 2;
    const azName = val(row, map.az_ragione) || 'Privato';
    const azPiva = val(row, map.az_piva);
    const corNome = val(row, map.cor_nome);
    const corCf = cf(val(row, map.cor_cf));
    const docNome = val(row, map.doc_nome);
    const prgCod = val(row, map.prg_codice);
    const prgCourseRaw = val(row, map.prg_corso);
    const prgDataRaw = val(row, map.prg_data);
    const iscCert = val(row, map.isc_cert);
    const iscScadRaw = val(row, map.isc_scad);
    const corsoId = guessCourseId(prgCourseRaw);
    const errors = [];
    const warnings = [];
    const infos = [];

    if (!corCf) errors.push('Codice fiscale corsista mancante: la riga verrebbe saltata.');
    if (corCf && !/^[A-Z0-9]{11,16}$/.test(corCf)) warnings.push('Codice fiscale/P.IVA corsista con formato anomalo.');
    if (!corNome) warnings.push('Nome corsista mancante.');
    if (!prgCod) warnings.push('Codice progetto mancante: non verrà creato/collegato un progetto.');
    if (prgCod && !ok(prgDataRaw)) warnings.push('Data progetto/verifica mancante.');
    if (prgDataRaw && !fmtDate(prgDataRaw)) warnings.push('Data progetto non interpretabile.');
    if (iscScadRaw && !fmtDate(iscScadRaw)) warnings.push('Scadenza attestato non interpretabile.');
    if (prgCourseRaw && corsoId === 'lav_basso' && !norm(prgCourseRaw).includes('basso')) warnings.push('Corso non riconosciuto con certezza: verrebbe classificato come Lavoratori rischio basso.');

    const azKey = key(azName);
    const docKey = key(docNome);
    const prgKey = clean(prgCod);
    const certKey = clean(iscCert);
    const pairKey = prgKey && corCf ? `${prgKey}::${corCf}` : '';

    if (corCf) {
      if (seen.cf.has(corCf)) warnings.push('Corsista ripetuto nel file: verrà riutilizzato lo stesso CF.');
      seen.cf.add(corCf);
    }
    if (certKey) {
      if (seen.cert.has(certKey)) errors.push('ID certificato duplicato nel file: rischio attestato doppio.');
      seen.cert.add(certKey);
    }
    if (pairKey) {
      if (seen.projectCorsista.has(pairKey)) warnings.push('Stesso corsista ripetuto nello stesso progetto nel file.');
      seen.projectCorsista.add(pairKey);
    }

    const existingAz = azName !== 'Privato' && (caches.aziendeByName[azKey] || (azPiva && caches.aziendeByPiva[key(azPiva)]));
    const existingDoc = docNome && caches.docentiByName[docKey];
    const existingCor = corCf && caches.corsistiByCf[corCf];
    const existingPrg = prgCod && caches.progettiByCodice[prgKey];
    const existingCert = iscCert && caches.iscrizioniByCert[certKey];
    const existingPair = existingPrg && existingCor && caches.iscrizioniByPair[`${existingPrg.id}::${existingCor.id}`];

    if (existingAz) infos.push('Azienda già presente: riuso record esistente.');
    if (existingDoc) infos.push('Docente già presente: riuso record esistente.');
    if (existingCor) infos.push('Corsista già presente: riuso record esistente.');
    if (existingPrg) infos.push('Progetto già presente: riuso record esistente.');
    if (existingCert) warnings.push('ID certificato già presente nel database: l’iscrizione non sarà duplicata.');
    if (!existingCert && existingPair) warnings.push('Corsista già iscritto allo stesso progetto: possibile duplicato da controllare.');

    const actions = [];
    if (azName !== 'Privato') actions.push(existingAz ? 'riusa azienda' : 'crea azienda');
    if (docNome) actions.push(existingDoc ? 'riusa docente' : 'crea docente');
    if (corCf) actions.push(existingCor ? 'riusa corsista' : 'crea corsista');
    if (prgCod) actions.push(existingPrg ? 'riusa progetto' : `crea progetto (${corsoId})`);
    if (prgCod && iscCert && corCf && !existingCert) actions.push('crea iscrizione/attestato');
    if (prgCod && iscCert && existingCert) actions.push('salta attestato già presente');

    return {
      rowNumber,
      data: { azName, azPiva, corNome, corCf, docNome, prgCod, prgCourseRaw, corsoId, prgDataRaw, iscCert, iscScadRaw },
      errors,
      warnings,
      infos,
      actions
    };
  };

  const loadCaches = async () => {
    const safeSelect = async (table, cols) => {
      try {
        const { data, error } = await window.supabaseClient.from(table).select(cols);
        if (error) throw error;
        return data || [];
      } catch (e) {
        log(`Controllo ${table} non riuscito: ${e.message || e}`, true);
        return [];
      }
    };

    const [aziende, docenti, corsisti, progetti, iscrizioni] = await Promise.all([
      safeSelect('aziende', 'id, ragione_sociale, piva_cf'),
      safeSelect('docenti', 'id, nome_cognome'),
      safeSelect('corsisti', 'id, cf, nome_cognome'),
      safeSelect('progetti', 'id, codice, corso_id, azienda_id'),
      safeSelect('iscrizioni', 'id, progetto_id, corsista_id, id_certificato')
    ]);

    const caches = {
      aziendeByName: {}, aziendeByPiva: {}, docentiByName: {}, corsistiByCf: {}, progettiByCodice: {}, iscrizioniByCert: {}, iscrizioniByPair: {}
    };
    aziende.forEach(a => { if (a.ragione_sociale) caches.aziendeByName[key(a.ragione_sociale)] = a; if (a.piva_cf) caches.aziendeByPiva[key(a.piva_cf)] = a; });
    docenti.forEach(d => { if (d.nome_cognome) caches.docentiByName[key(d.nome_cognome)] = d; });
    corsisti.forEach(c => { if (c.cf) caches.corsistiByCf[cf(c.cf)] = c; });
    progetti.forEach(p => { if (p.codice) caches.progettiByCodice[clean(p.codice)] = p; });
    iscrizioni.forEach(i => { if (i.id_certificato) caches.iscrizioniByCert[clean(i.id_certificato)] = i; if (i.progetto_id && i.corsista_id) caches.iscrizioniByPair[`${i.progetto_id}::${i.corsista_id}`] = i; });
    return caches;
  };

  const summarize = (rows) => {
    const s = {
      rows: rows.length,
      rowsWithErrors: rows.filter(r => r.errors.length).length,
      rowsWithWarnings: rows.filter(r => r.warnings.length).length,
      errors: rows.reduce((n,r)=>n+r.errors.length,0),
      warnings: rows.reduce((n,r)=>n+r.warnings.length,0),
      createAziende: 0, createDocenti: 0, createCorsisti: 0, createProgetti: 0, createIscrizioni: 0,
      reuseAziende: 0, reuseDocenti: 0, reuseCorsisti: 0, reuseProgetti: 0, skipAttestati: 0
    };
    rows.forEach(r => {
      const a = r.actions.join('|');
      if (a.includes('crea azienda')) s.createAziende++;
      if (a.includes('crea docente')) s.createDocenti++;
      if (a.includes('crea corsista')) s.createCorsisti++;
      if (a.includes('crea progetto')) s.createProgetti++;
      if (a.includes('crea iscrizione/attestato')) s.createIscrizioni++;
      if (a.includes('riusa azienda')) s.reuseAziende++;
      if (a.includes('riusa docente')) s.reuseDocenti++;
      if (a.includes('riusa corsista')) s.reuseCorsisti++;
      if (a.includes('riusa progetto')) s.reuseProgetti++;
      if (a.includes('salta attestato')) s.skipAttestati++;
    });
    return s;
  };

  window.analizzaImportGuidato = async function(){
    if (!Array.isArray(window.migParsedData) || !window.migParsedData.length) return alert('Prima seleziona e analizza un file CSV/JSON.');
    const panel = document.getElementById('mig-guided-panel');
    if (panel) {
      panel.classList.remove('hidden');
      panel.innerHTML = '<div class="p-5 text-center text-slate-400"><i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto mb-2"></i> Simulazione importazione in corso...</div>';
      if (window.lucide) lucide.createIcons();
    }

    const map = getMapConfig();
    window.importGuidatoState.mapConfig = map;
    log('Simulazione import guidato: lettura database e controllo duplicati...');

    const caches = await loadCaches();
    const seen = { cf: new Set(), cert: new Set(), projectCorsista: new Set() };
    const rows = window.migParsedData.map((row, index) => rowSummary(row, map, index, caches, seen));
    const summary = summarize(rows);
    const analysis = { generated_at: new Date().toISOString(), summary, rows, mapConfig: map };
    window.importGuidatoState.analysis = analysis;
    renderImportGuidato(analysis);

    const btn = document.getElementById('btn-start-import');
    if (btn) {
      btn.disabled = summary.errors > 0;
      btn.classList.toggle('opacity-50', summary.errors > 0);
      btn.classList.toggle('cursor-not-allowed', summary.errors > 0);
      btn.title = summary.errors > 0 ? 'Correggi prima i blocchi critici rilevati dalla simulazione.' : 'Simulazione completata: importazione abilitata.';
    }

    log(summary.errors ? `Simulazione completata: ${summary.errors} blocchi critici. Import disabilitato.` : `Simulazione completata: nessun blocco critico. Import abilitato.`, summary.errors > 0);
  };

  const chip = (title, value, tone, icon) => `
    <div class="rounded-2xl border border-${tone}-200 bg-${tone}-50 p-4">
      <p class="text-[9px] font-black uppercase tracking-widest text-${tone}-800 flex items-center gap-1"><i data-lucide="${icon}" class="w-3 h-3"></i>${esc(title)}</p>
      <p class="text-2xl font-black text-slate-900 mt-1">${esc(value)}</p>
    </div>`;

  const rowHtml = r => {
    const tone = r.errors.length ? 'rose' : (r.warnings.length ? 'amber' : 'emerald');
    const icon = r.errors.length ? 'x-circle' : (r.warnings.length ? 'alert-triangle' : 'check-circle');
    return `<details class="rounded-2xl border border-${tone}-200 bg-${tone}-50 overflow-hidden">
      <summary class="cursor-pointer p-3 flex items-center justify-between gap-3 list-none">
        <div class="min-w-0 flex items-center gap-3">
          <span class="w-8 h-8 rounded-xl bg-white border border-${tone}-200 text-${tone}-700 flex items-center justify-center shrink-0"><i data-lucide="${icon}" class="w-4 h-4"></i></span>
          <div class="min-w-0">
            <p class="font-black uppercase text-slate-900 text-xs truncate">Riga ${r.rowNumber} · ${esc(r.data.corNome || 'Corsista senza nome')} · ${esc(r.data.corCf || 'CF mancante')}</p>
            <p class="text-[10px] text-slate-600 truncate">${esc(r.data.prgCod || 'Senza progetto')} · ${esc(r.data.prgCourseRaw || r.data.corsoId)}</p>
          </div>
        </div>
        <span class="text-[9px] font-black uppercase text-${tone}-800">${r.errors.length ? r.errors.length + ' errori' : (r.warnings.length ? r.warnings.length + ' avvisi' : 'ok')}</span>
      </summary>
      <div class="px-4 pb-4 grid md:grid-cols-3 gap-3 text-[11px]">
        <div class="bg-white/80 rounded-xl p-3 border border-white"><strong>Dati:</strong><br>Az: ${esc(r.data.azName)}<br>Doc: ${esc(r.data.docNome || '-')}<br>Cert: ${esc(r.data.iscCert || '-')}<br>Scad: ${esc(r.data.iscScadRaw || '-')}</div>
        <div class="bg-white/80 rounded-xl p-3 border border-white"><strong>Azioni simulate:</strong><ul class="list-disc ml-4 mt-1">${r.actions.length ? r.actions.map(a=>`<li>${esc(a)}</li>`).join('') : '<li>Nessuna azione</li>'}</ul></div>
        <div class="bg-white/80 rounded-xl p-3 border border-white"><strong>Note:</strong><ul class="list-disc ml-4 mt-1">${[...r.errors, ...r.warnings, ...r.infos].length ? [...r.errors, ...r.warnings, ...r.infos].map(a=>`<li>${esc(a)}</li>`).join('') : '<li>Nessuna criticità</li>'}</ul></div>
      </div>
    </details>`;
  };

  window.renderImportGuidato = function(analysis){
    const panel = document.getElementById('mig-guided-panel');
    if (!panel) return;
    const s = analysis.summary;
    const tone = s.errors ? 'rose' : (s.warnings ? 'amber' : 'emerald');
    const rowsToShow = analysis.rows.filter(r => r.errors.length || r.warnings.length).slice(0, 20);
    panel.classList.remove('hidden');
    panel.innerHTML = `
      <div class="rounded-3xl border border-${tone}-200 bg-white shadow-sm overflow-hidden">
        <div class="p-5 bg-${tone}-50 border-b border-${tone}-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h3 class="font-black uppercase text-${tone}-900 text-sm flex items-center gap-2"><i data-lucide="shield-check" class="w-5 h-5"></i> Simulazione import guidato</h3>
            <p class="text-xs text-slate-600 mt-1">Controllo preventivo su duplicati, campi mancanti e azioni che verrebbero eseguite. Nessun dato è stato salvato.</p>
          </div>
          <span class="px-3 py-1 rounded-full bg-white border border-${tone}-200 text-${tone}-800 text-[10px] font-black uppercase">${s.errors ? 'Import bloccato' : 'Import abilitato'}</span>
        </div>
        <div class="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          ${chip('Righe file', s.rows, 'slate', 'table')}
          ${chip('Blocchi critici', s.errors, s.errors ? 'rose' : 'emerald', 'x-circle')}
          ${chip('Avvisi', s.warnings, s.warnings ? 'amber' : 'emerald', 'alert-triangle')}
          ${chip('Nuovi attestati', s.createIscrizioni, 'blue', 'file-check')}
        </div>
        <div class="px-5 pb-5 grid md:grid-cols-2 xl:grid-cols-4 gap-3 text-xs">
          <div class="rounded-2xl bg-slate-50 border border-slate-200 p-3"><strong>Aziende</strong><br>${s.createAziende} nuove · ${s.reuseAziende} esistenti</div>
          <div class="rounded-2xl bg-slate-50 border border-slate-200 p-3"><strong>Docenti</strong><br>${s.createDocenti} nuovi · ${s.reuseDocenti} esistenti</div>
          <div class="rounded-2xl bg-slate-50 border border-slate-200 p-3"><strong>Corsisti</strong><br>${s.createCorsisti} nuovi · ${s.reuseCorsisti} esistenti</div>
          <div class="rounded-2xl bg-slate-50 border border-slate-200 p-3"><strong>Progetti</strong><br>${s.createProgetti} nuovi · ${s.reuseProgetti} esistenti</div>
        </div>
        ${rowsToShow.length ? `<div class="px-5 pb-5"><p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Prime criticità rilevate</p><div class="space-y-2">${rowsToShow.map(rowHtml).join('')}</div>${analysis.rows.filter(r=>r.errors.length||r.warnings.length).length>rowsToShow.length ? `<p class="text-[10px] text-slate-500 mt-2">Mostrate prime ${rowsToShow.length} righe con criticità.</p>` : ''}</div>` : `<div class="px-5 pb-5"><div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center text-sm font-bold text-emerald-900">Nessuna criticità rilevata nelle righe del file.</div></div>`}
      </div>`;
    if (window.lucide) lucide.createIcons();
  };

  window.esportaLogImportGuidato = function(){
    const analysis = window.importGuidatoState?.analysis;
    if (!analysis) return alert('Esegui prima la simulazione import guidato.');
    const blob = new Blob([JSON.stringify(analysis, null, 2)], { type: 'application/json;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `SafetyManager_log_import_guidato_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 200);
  };

  const resetGuidedPanel = () => {
    window.importGuidatoState.analysis = null;
    const panel = document.getElementById('mig-guided-panel');
    if (panel) {
      panel.classList.remove('hidden');
      panel.innerHTML = '<div class="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-xs text-slate-500">Dopo la mappatura premi <strong>Simula importazione</strong>: il sistema controllerà duplicati, campi mancanti e azioni previste prima di abilitare l’import reale.</div>';
    }
    const btn = document.getElementById('btn-start-import');
    if (btn) {
      btn.disabled = true;
      btn.classList.add('opacity-50','cursor-not-allowed');
      btn.title = 'Prima esegui la simulazione import guidato.';
    }
  };

  const wrapBuildMapping = () => {
    if (typeof window.buildMappingUI !== 'function' || window.buildMappingUI.__guidedWrapped) return;
    const old = window.buildMappingUI;
    const wrapped = function(...args){
      const result = old.apply(this, args);
      setTimeout(resetGuidedPanel, 80);
      return result;
    };
    wrapped.__guidedWrapped = true;
    window.buildMappingUI = wrapped;
  };

  const wrapStartImport = () => {
    if (typeof window.startImportProcess !== 'function' || window.startImportProcess.__guidedWrapped) return;
    const old = window.startImportProcess;
    const wrapped = async function(...args){
      const analysis = window.importGuidatoState?.analysis;
      if (!analysis) {
        alert('Prima di importare esegui la simulazione guidata. È una protezione contro duplicati e file mappati male.');
        return;
      }
      if (analysis.summary.errors > 0) {
        alert(`Import bloccato: ci sono ${analysis.summary.errors} blocchi critici. Correggi il file o la mappatura e rilancia la simulazione.`);
        return;
      }
      const okConfirm = confirm(`Simulazione superata. Verranno elaborate ${analysis.summary.rows} righe. Nuovi record previsti: ${analysis.summary.createCorsisti} corsisti, ${analysis.summary.createProgetti} progetti, ${analysis.summary.createIscrizioni} attestati/iscrizioni. Procedere?`);
      if (!okConfirm) return;
      return old.apply(this, args);
    };
    wrapped.__guidedWrapped = true;
    window.startImportProcess = wrapped;
  };

  const wrapInit = () => {
    if (typeof window.initMigrazione !== 'function' || window.initMigrazione.__guidedWrapped) return;
    const old = window.initMigrazione;
    const wrapped = function(...args){
      const result = old.apply(this, args);
      setTimeout(() => { wrapBuildMapping(); wrapStartImport(); resetGuidedPanel(); }, 100);
      return result;
    };
    wrapped.__guidedWrapped = true;
    window.initMigrazione = wrapped;
  };

  wrapBuildMapping();
  wrapStartImport();
  wrapInit();
  setTimeout(() => { wrapBuildMapping(); wrapStartImport(); wrapInit(); resetGuidedPanel(); }, 300);
})();
