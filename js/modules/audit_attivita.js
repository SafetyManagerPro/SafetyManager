// STEP 16 - Registro attività / audit leggibile
// Usa la tabella audit_log esistente e registra eventi operativi essenziali senza salvare dati sensibili completi.
(function(){
  if (window.__safetyAuditAttivitaLoaded) return;
  window.__safetyAuditAttivitaLoaded = true;

  const esc = v => window.dashEscape ? window.dashEscape(v) : String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const norm = v => String(v ?? '').trim().toLowerCase();
  const isUuid = v => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v || ''));

  window.safetyAudit = async function(action, options = {}) {
    try {
      if (!window.supabaseClient || !action) return false;
      let user = null;
      try { user = typeof window.getSafetyAdminUser === 'function' ? await window.getSafetyAdminUser() : null; } catch(e) {}
      const payload = {
        table_name: options.table_name || options.area || 'system',
        record_id: isUuid(options.record_id) ? options.record_id : null,
        action: String(action).slice(0, 120),
        changed_by: user?.id || null,
        old_data: options.old_data || null,
        new_data: {
          ...(options.new_data || options.details || {}),
          source: options.source || 'SafetyManager',
          client_at: new Date().toISOString()
        }
      };
      const { error } = await window.supabaseClient.from('audit_log').insert([payload]);
      if (error) {
        console.warn('[Audit] registrazione non riuscita:', error.message || error);
        return false;
      }
      return true;
    } catch(e) {
      console.warn('[Audit] errore:', e);
      return false;
    }
  };

  const wrapAsync = (name, actionBuilder) => {
    const fn = window[name];
    if (typeof fn !== 'function' || fn.__safetyAuditWrapped) return;
    const wrapped = async function(...args){
      const started = Date.now();
      try {
        const result = await fn.apply(this, args);
        try {
          const spec = typeof actionBuilder === 'function' ? actionBuilder(args, result, Date.now()-started) : { action:name };
          if (spec?.action) await window.safetyAudit(spec.action, spec.options || {});
        } catch(e) { console.warn('[Audit] post-azione non registrato', e); }
        return result;
      } catch(e) {
        try { await window.safetyAudit(name + '_error', { table_name:'system', details:{ message:e.message || String(e) } }); } catch(_) {}
        throw e;
      }
    };
    wrapped.__safetyAuditWrapped = true;
    window[name] = wrapped;
  };

  const savedId = (record, result) => record?.id || (Array.isArray(result) ? result[0]?.id : result?.id) || null;

  window.installSafetyAuditWrappers = function(){
    // Anagrafiche e progetti: registra solo identificatore, nome/codice e tipo operazione.
    wrapAsync('saveAzienda', (args,res) => {
      const r=args[0]||{}; if(!res) return null;
      return { action:r.id?'company_updated':'company_created', options:{ table_name:'aziende', record_id:savedId(r,res), details:{ ragione_sociale:r.ragione_sociale||'', mode:r.id?'update':'create' } } };
    });
    wrapAsync('deleteAzienda', (args,res) => res ? ({ action:'company_deleted', options:{ table_name:'aziende', record_id:args[0]||null } }) : null);

    wrapAsync('saveDocente', (args,res) => {
      const r=args[0]||{}; if(!res) return null;
      return { action:r.id?'teacher_updated':'teacher_created', options:{ table_name:'docenti', record_id:savedId(r,res), details:{ nome:r.nome_cognome||'', mode:r.id?'update':'create' } } };
    });
    wrapAsync('deleteDocente', (args,res) => res ? ({ action:'teacher_deleted', options:{ table_name:'docenti', record_id:args[0]||null } }) : null);

    wrapAsync('saveCorsistaData', (args,res) => {
      const r=args[0]||{}; if(!res) return null;
      return { action:r.id?'student_updated':'student_created', options:{ table_name:'corsisti', record_id:savedId(r,res), details:{ nome:r.nome_cognome||'', cf_suffix:r.cf?String(r.cf).slice(-4):'', mode:r.id?'update':'create' } } };
    });
    wrapAsync('deleteCorsistaData', (args,res) => res ? ({ action:'student_deleted', options:{ table_name:'corsisti', record_id:args[0]||null } }) : null);

    wrapAsync('saveProgetto', (args,res) => {
      const r=args[0]||{}; if(!res) return null;
      return { action:r.id?'project_updated':'project_created', options:{ table_name:'progetti', record_id:savedId(r,res), details:{ codice:r.codice||'', corso_id:r.corso_id||'', mode:r.id?'update':'create' } } };
    });
    wrapAsync('deleteProgetto', (args,res) => res ? ({ action:'project_deleted', options:{ table_name:'progetti', record_id:args[0]||null } }) : null);

    // Operazioni di sistema e documentali.
    wrapAsync('esportaBackupDatabaseLocale', (args,res,ms) => ({ action:'backup_download', options:{ table_name:'system', details:{ duration_ms:ms } } }));
    wrapAsync('analizzaImportGuidato', (args,res,ms) => ({ action:'import_simulation', options:{ table_name:'system', details:{ rows:window.importGuidatoState?.analysis?.summary?.rows || 0, errors:window.importGuidatoState?.analysis?.summary?.errors || 0, warnings:window.importGuidatoState?.analysis?.summary?.warnings || 0, duration_ms:ms } } }));
    wrapAsync('startImportProcess', (args,res,ms) => ({ action:'import_execute', options:{ table_name:'system', details:{ rows:Array.isArray(window.migParsedData) ? window.migParsedData.length : 0, duration_ms:ms } } }));
    wrapAsync('stampaFascicoloCompletoPDF', (args,res) => ({ action:'print_fascicolo', options:{ table_name:'progetti', record_id:args[0] || window.currentProgettoStampaId || null, details:{ project_id:args[0] || window.currentProgettoStampaId || null } } }));
    wrapAsync('stampaSoloAttestatiPDF', (args,res) => ({ action:'print_attestati', options:{ table_name:'progetti', record_id:args[0] || window.currentProgettoStampaId || null, details:{ project_id:args[0] || window.currentProgettoStampaId || null } } }));
    wrapAsync('stampaModuloProgettoRapido', (args,res) => ({ action:'print_documento', options:{ table_name:'progetti', record_id:args[0] || null, details:{ project_id:args[0] || null, module_id:args[1] || '' } } }));
  };

  // Reinstalla wrapper anche dopo il caricamento di moduli opzionali.
  if (typeof window.loadOptionalSafetyScript === 'function' && !window.loadOptionalSafetyScript.__auditWrapped) {
    const oldLoader = window.loadOptionalSafetyScript;
    const newLoader = async function(...args){
      const result = await oldLoader.apply(this,args);
      setTimeout(window.installSafetyAuditWrappers, 0);
      return result;
    };
    newLoader.__auditWrapped = true;
    window.loadOptionalSafetyScript = newLoader;
  }

  window.registroAttivitaState = window.registroAttivitaState || { rows:[] };

  const detailText = row => {
    const data = row?.new_data && typeof row.new_data === 'object' ? row.new_data : {};
    const parts = [];
    ['codice','corso_id','ragione_sociale','nome','project_id','module_id','rows','errors','warnings','duration_ms','status','note','mode'].forEach(k => {
      if (data[k] !== undefined && data[k] !== null && data[k] !== '') parts.push(`${k}: ${data[k]}`);
    });
    if (!parts.length && row?.record_id) parts.push(`record: ${row.record_id}`);
    return parts.join(' · ') || 'Nessun dettaglio aggiuntivo';
  };

  const fmtDateTime = value => {
    try { return new Date(value).toLocaleString('it-IT'); } catch(e) { return String(value || '-'); }
  };

  const actionLabel = a => ({
    company_created:'Azienda creata', company_updated:'Azienda modificata', company_deleted:'Azienda eliminata',
    teacher_created:'Docente creato', teacher_updated:'Docente modificato', teacher_deleted:'Docente eliminato',
    student_created:'Corsista creato', student_updated:'Corsista modificato', student_deleted:'Corsista eliminato',
    project_created:'Corso/progetto creato', project_updated:'Corso/progetto modificato', project_deleted:'Corso/progetto eliminato',
    backup_download:'Backup scaricato', import_simulation:'Import simulato', import_execute:'Import eseguito',
    print_fascicolo:'Fascicolo stampato', print_attestati:'Attestati stampati', print_documento:'Documento stampato',
    course_closed:'Corso chiuso', course_marked_done:'Corso segnato svolto', renewal_prepared:'Rinnovo preparato'
  }[a] || String(a || 'Azione'));

  window.refreshRegistroAttivita = async function(){
    const list = document.getElementById('attivita-list');
    if (list) list.innerHTML = '<div class="p-8 text-center text-slate-400 font-bold uppercase"><i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto mb-2"></i>Caricamento attività...</div>';
    try {
      const { data, error } = await window.supabaseClient.from('audit_log').select('id,table_name,record_id,action,changed_at,changed_by,old_data,new_data').order('changed_at',{ascending:false}).limit(300);
      if (error) throw error;
      window.registroAttivitaState.rows = data || [];
      const tableSel = document.getElementById('attivita-filter-table');
      const actionSel = document.getElementById('attivita-filter-action');
      if (tableSel) {
        const cur = tableSel.value;
        const vals = [...new Set((data||[]).map(r=>r.table_name).filter(Boolean))].sort();
        tableSel.innerHTML = '<option value="">Tutte le aree</option>' + vals.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
        tableSel.value = cur;
      }
      if (actionSel) {
        const cur = actionSel.value;
        const vals = [...new Set((data||[]).map(r=>r.action).filter(Boolean))].sort();
        actionSel.innerHTML = '<option value="">Tutte le azioni</option>' + vals.map(v=>`<option value="${esc(v)}">${esc(actionLabel(v))}</option>`).join('');
        actionSel.value = cur;
      }
      window.renderRegistroAttivita();
    } catch(e) {
      if (list) list.innerHTML = `<div class="p-6 rounded-2xl border border-rose-200 bg-rose-50 text-rose-900 font-bold">Errore lettura audit log: ${esc(e.message || e)}</div>`;
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  };

  window.renderRegistroAttivita = function(){
    const rows = window.registroAttivitaState?.rows || [];
    const q = norm(document.getElementById('attivita-search')?.value || '');
    const table = document.getElementById('attivita-filter-table')?.value || '';
    const action = document.getElementById('attivita-filter-action')?.value || '';
    const filtered = rows.filter(r => {
      if (table && r.table_name !== table) return false;
      if (action && r.action !== action) return false;
      if (q) {
        const hay = `${r.table_name||''} ${r.action||''} ${r.record_id||''} ${detailText(r)} ${JSON.stringify(r.new_data||{})}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const today = new Date().toISOString().slice(0,10);
    const set=(id,v)=>{const el=document.getElementById(id); if(el) el.textContent=v;};
    set('attivita-count', filtered.length);
    set('attivita-today', filtered.filter(r=>String(r.changed_at||'').slice(0,10)===today).length);
    set('attivita-data', filtered.filter(r=>!['system','print'].includes(r.table_name)).length);
    set('attivita-system', filtered.filter(r=>['system','print'].includes(r.table_name) || String(r.action||'').startsWith('print_')).length);

    const list = document.getElementById('attivita-list');
    if (!list) return;
    if (!filtered.length) {
      list.innerHTML = '<div class="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 font-bold uppercase">Nessuna attività trovata.</div>';
      return;
    }
    list.innerHTML = filtered.map(r => {
      const op = String(r.action||'');
      const tone = op.includes('error') ? 'rose' : op.startsWith('print_') ? 'indigo' : op.includes('import') ? 'amber' : op.includes('backup') ? 'blue' : op.includes('closed') || op.includes('svolto') ? 'emerald' : 'slate';
      return `<div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"><div class="flex items-start gap-3 min-w-0"><span class="w-10 h-10 rounded-xl bg-${tone}-50 text-${tone}-700 border border-${tone}-100 flex items-center justify-center shrink-0"><i data-lucide="history" class="w-4 h-4"></i></span><div class="min-w-0"><div class="flex flex-wrap items-center gap-2"><p class="font-black uppercase text-slate-900 text-sm">${esc(actionLabel(r.action))}</p><span class="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[8px] font-black uppercase text-slate-600">${esc(r.table_name || 'system')}</span></div><p class="text-[11px] text-slate-600 mt-1 break-words">${esc(detailText(r))}</p>${r.record_id ? `<p class="font-mono text-[9px] text-slate-400 mt-1">${esc(r.record_id)}</p>` : ''}</div></div><div class="text-right shrink-0"><p class="text-[10px] font-black uppercase text-slate-500">${esc(fmtDateTime(r.changed_at))}</p><p class="text-[9px] text-slate-400 mt-1">ID log ${esc(r.id)}</p></div></div>`;
    }).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  };

  window.exportRegistroAttivitaXlsx = function(){
    const rows = window.registroAttivitaState?.rows || [];
    if (!rows.length) return alert('Nessuna attività da esportare.');
    if (typeof XLSX === 'undefined') return alert('Libreria XLSX non disponibile.');
    const data = rows.map(r => ({
      'Data/Ora': fmtDateTime(r.changed_at), 'Area':r.table_name || '', 'Azione':actionLabel(r.action),
      'Record ID':r.record_id || '', 'Dettagli':detailText(r), 'Utente ID':r.changed_by || ''
    }));
    const wb=XLSX.utils.book_new(); const ws=XLSX.utils.json_to_sheet(data); ws['!cols']=[{wch:22},{wch:24},{wch:30},{wch:38},{wch:70},{wch:38}];
    XLSX.utils.book_append_sheet(wb,ws,'Registro attività');
    XLSX.writeFile(wb,`Registro_attivita_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  window.initRegistroAttivita = async function(){
    window.installSafetyAuditWrappers();
    await window.refreshRegistroAttivita();
    if (typeof window.applySafetyUiRefinements === 'function') window.applySafetyUiRefinements('attivita');
  };

  window.installSafetyAuditWrappers();
  setTimeout(window.installSafetyAuditWrappers, 500);
  setTimeout(window.installSafetyAuditWrappers, 1800);
})();