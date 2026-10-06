// Gestione rapida del rientro cartaceo e del ciclo documentale post-corso.
(function(){
  if(window.__safetyRientroDocumentiLoaded) return;
  window.__safetyRientroDocumentiLoaded = true;

  const STATUS = {
    awaiting_return:{label:'Da rientrare',short:'Da rientrare',rank:1,tone:'amber',icon:'clock-3'},
    returned:{label:'Restituito',short:'Restituito',rank:2,tone:'blue',icon:'inbox'},
    checked:{label:'Controllato',short:'Controllato',rank:3,tone:'cyan',icon:'clipboard-check'},
    scanned:{label:'Scansionato',short:'Scansionato',rank:4,tone:'violet',icon:'scan-line'},
    archived:{label:'Archiviato',short:'Archiviato',rank:5,tone:'emerald',icon:'archive'},
    not_applicable:{label:'Non applicabile',short:'N/A',rank:99,tone:'slate',icon:'minus-circle'}
  };

  const BASE_DOCS = [
    ['attendance_register','Registro presenze'],
    ['participant_signatures','Firme corsisti'],
    ['teacher_signatures','Firme docenti'],
    ['final_minutes','Verbale finale'],
    ['quality_questionnaires','Questionari di gradimento'],
    ['signed_course_documents','Documentazione firmata']
  ];

  const state = {projects:[],project:null,enrollments:[],rows:[],docs:[],saving:false};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=v=>String(v??'').trim().toLowerCase();
  const fmtDate=v=>!v?'':(window.formatDataToItalian?window.formatDataToItalian(String(v).slice(0,10)):String(v).slice(0,10));
  const rowKey=(itemKey,enrollmentId)=>`${itemKey}::${enrollmentId||'*'}`;

  function modal(){
    let m=document.getElementById('safety-rientro-documenti-modal');
    if(!m){
      m=document.createElement('div');
      m.id='safety-rientro-documenti-modal';
      m.className='fixed inset-0 z-[99998] bg-slate-950/75 backdrop-blur-sm hidden p-3 md:p-6 items-center justify-center';
      m.addEventListener('click',e=>{if(e.target===m) close();});
      document.body.appendChild(m);
    }
    return m;
  }

  function close(){
    const m=document.getElementById('safety-rientro-documenti-modal');
    if(m){m.classList.add('hidden');m.classList.remove('flex');m.innerHTML='';}
  }

  function courseName(p){
    const c=window.DB_CORSI?.[p?.corso_id]||{};
    return c.t||c.title||c.nome||c.code||p?.corso_id||'Corso';
  }

  function companyName(p){ return p?.aziende?.ragione_sociale||p?.azienda_nome||''; }
  function personName(i,index){ return i?.corsisti?.nome_cognome||i?.nome_cognome||`Corsista ${index+1}`; }

  async function getProjects(){
    let list=(window.progettiList&&window.progettiList.length)?window.progettiList:null;
    if(!list&&typeof window.getProgetti==='function') list=await window.getProgetti();
    return [...(list||[])].sort((a,b)=>String(b.data_esame||b.data_inizio||'').localeCompare(String(a.data_esame||a.data_inizio||'')));
  }

  function indexRows(rows){
    const map=new Map();
    (rows||[]).forEach(r=>map.set(rowKey(r.item_key,r.iscrizione_id),r));
    return map;
  }

  function inferStatus(row){
    if(!row) return 'awaiting_return';
    if(STATUS[row.document_status]) return row.document_status;
    if(row.mode==='not_applicable'||row.activity_status==='not_applicable'||row.evidence_status==='not_applicable') return 'not_applicable';
    if(['scan_available','digital'].includes(row.evidence_status)) return 'scanned';
    if(row.evidence_status==='paper_original'&&row.recording_status==='recorded') return 'checked';
    if(row.evidence_status==='paper_original') return 'returned';
    return 'awaiting_return';
  }

  function buildDocs(project,enrollments,rows){
    const map=indexRows(rows), docs=[];
    BASE_DOCS.forEach(([itemKey,label])=>docs.push({itemKey,label,enrollmentId:null,row:map.get(rowKey(itemKey,null))||null}));
    (enrollments||[]).forEach((i,index)=>{
      const enrollmentId=i.id||null, name=personName(i,index);
      docs.push({itemKey:'final_test',label:`Test finale · ${name}`,enrollmentId,row:map.get(rowKey('final_test',enrollmentId))||null});
      const practical=map.get(rowKey('practical_test',enrollmentId));
      if(practical||String(i.esito_pratica||'').trim()) docs.push({itemKey:'practical_test',label:`Prova pratica · ${name}`,enrollmentId,row:practical||null});
      const language=map.get(rowKey('language_check',enrollmentId)), languageState=norm(i?.corsisti?.lingua_test_stato);
      if(language|| (languageState && languageState!=='non_richiesto')) docs.push({itemKey:'language_check',label:`Verifica lingua · ${name}`,enrollmentId,row:language||null});
    });
    return docs.map(d=>({...d,status:inferStatus(d.row)}));
  }

  function projectOptions(){
    return state.projects.map(p=>`<option value="${esc(p.id)}" ${state.project?.id===p.id?'selected':''}>${esc(p.codice||'Senza codice')} · ${esc(courseName(p))}${companyName(p)?` · ${esc(companyName(p))}`:''}${p.data_esame?` · ${esc(fmtDate(p.data_esame))}`:''}</option>`).join('');
  }

  function stats(){
    const active=state.docs.filter(d=>d.status!=='not_applicable');
    return {
      total:active.length,
      awaiting:active.filter(d=>STATUS[d.status]?.rank<2).length,
      returned:active.filter(d=>STATUS[d.status]?.rank>=2).length,
      toCheck:active.filter(d=>d.status==='returned').length,
      toScan:active.filter(d=>d.status==='checked').length,
      archived:active.filter(d=>d.status==='archived').length
    };
  }

  function statusButton(d,key){
    const meta=STATUS[key], active=d.status===key;
    return `<button type="button" onclick="window.SafetyRientroDocumenti.setStatus('${esc(d.itemKey)}','${esc(d.enrollmentId||'')}','${key}')" class="px-2.5 py-1.5 rounded-lg border text-[8px] font-black uppercase transition ${active?`bg-${meta.tone}-700 border-${meta.tone}-700 text-white shadow-sm`:`bg-white border-slate-200 text-slate-600 hover:border-${meta.tone}-300 hover:bg-${meta.tone}-50`}">${meta.short}</button>`;
  }

  function docRow(d){
    const meta=STATUS[d.status]||STATUS.awaiting_return;
    const step67=`window.apriStep67ItemEditor&&window.apriStep67ItemEditor('${esc(state.project?.id||'')}','${esc(d.itemKey)}','${esc(d.enrollmentId||'')}')`;
    return `<div class="rounded-2xl border border-slate-200 bg-white p-3 md:p-4 shadow-sm">
      <div class="flex flex-col xl:flex-row xl:items-center gap-3 justify-between">
        <div class="min-w-0 flex items-start gap-3">
          <span class="w-9 h-9 rounded-xl bg-${meta.tone}-50 border border-${meta.tone}-200 text-${meta.tone}-700 flex items-center justify-center shrink-0"><i data-lucide="${meta.icon}" class="w-4 h-4"></i></span>
          <div class="min-w-0"><p class="font-black text-xs text-slate-900">${esc(d.label)}</p><p class="text-[9px] font-black uppercase tracking-wide text-${meta.tone}-700 mt-0.5">${esc(meta.label)}</p></div>
        </div>
        <div class="flex flex-wrap gap-1.5 xl:justify-end">
          ${statusButton(d,'awaiting_return')}${statusButton(d,'returned')}${statusButton(d,'checked')}${statusButton(d,'scanned')}${statusButton(d,'archived')}
          <button type="button" onclick="${step67}" class="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-[8px] font-black uppercase">Dettagli</button>
          <button type="button" onclick="window.SafetyRientroDocumenti.setStatus('${esc(d.itemKey)}','${esc(d.enrollmentId||'')}','not_applicable')" class="px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 text-[8px] font-black uppercase">N/A</button>
        </div>
      </div>
    </div>`;
  }

  function render(){
    const m=modal(), s=stats(), p=state.project;
    m.innerHTML=`<div class="bg-slate-50 rounded-3xl shadow-2xl border border-slate-200 w-full max-w-7xl max-h-[92vh] overflow-hidden flex flex-col">
      <div class="p-5 md:p-6 bg-slate-950 text-white flex items-start justify-between gap-4">
        <div><p class="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-300">Ciclo documentale post-corso</p><h2 class="text-xl md:text-2xl font-black uppercase">Rientro documenti</h2><p class="text-[11px] text-slate-300 mt-1">L'originale cartaceo, la registrazione gestionale e la scansione restano stati distinti.</p></div>
        <button type="button" onclick="window.SafetyRientroDocumenti.close()" class="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20"><i data-lucide="x" class="w-5 h-5 mx-auto"></i></button>
      </div>
      <div class="p-4 md:p-5 border-b border-slate-200 bg-white">
        <div class="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3 items-end">
          <label class="text-[9px] font-black uppercase tracking-wider text-slate-500">Corso / progetto<select onchange="window.SafetyRientroDocumenti.loadProject(this.value)" class="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-900">${projectOptions()}</select></label>
          <div class="flex flex-wrap gap-2">
            <button type="button" onclick="window.SafetyRientroDocumenti.bulk('returned')" class="px-3 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-800 text-[9px] font-black uppercase">Tutti restituiti</button>
            <button type="button" onclick="window.SafetyRientroDocumenti.bulk('checked')" class="px-3 py-2.5 rounded-xl border border-cyan-200 bg-cyan-50 text-cyan-800 text-[9px] font-black uppercase">Tutti controllati</button>
            <button type="button" onclick="window.SafetyRientroDocumenti.bulk('scanned')" class="px-3 py-2.5 rounded-xl border border-violet-200 bg-violet-50 text-violet-800 text-[9px] font-black uppercase">Tutti scansionati</button>
          </div>
        </div>
        ${p?`<div class="mt-3 text-[10px] text-slate-500"><strong>${esc(p.codice||'')}</strong> · ${esc(courseName(p))}${companyName(p)?` · ${esc(companyName(p))}`:''}</div>`:''}
      </div>
      <div class="p-4 md:p-5 overflow-y-auto">
        <div class="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
          <div class="rounded-xl bg-amber-50 border border-amber-200 p-3"><p class="text-[8px] font-black uppercase text-amber-700">Da rientrare</p><p class="text-xl font-black text-amber-950">${s.awaiting}</p></div>
          <div class="rounded-xl bg-blue-50 border border-blue-200 p-3"><p class="text-[8px] font-black uppercase text-blue-700">Rientrati</p><p class="text-xl font-black text-blue-950">${s.returned}/${s.total}</p></div>
          <div class="rounded-xl bg-cyan-50 border border-cyan-200 p-3"><p class="text-[8px] font-black uppercase text-cyan-700">Da controllare</p><p class="text-xl font-black text-cyan-950">${s.toCheck}</p></div>
          <div class="rounded-xl bg-violet-50 border border-violet-200 p-3"><p class="text-[8px] font-black uppercase text-violet-700">Da scansionare</p><p class="text-xl font-black text-violet-950">${s.toScan}</p></div>
          <div class="rounded-xl bg-emerald-50 border border-emerald-200 p-3 col-span-2 md:col-span-1"><p class="text-[8px] font-black uppercase text-emerald-700">Archiviati</p><p class="text-xl font-black text-emerald-950">${s.archived}/${s.total}</p></div>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3 mb-4 text-[10px] leading-relaxed text-slate-600"><strong>Uso rapido:</strong> “Da rientrare” significa che l'attività cartacea è stata svolta/consegnata ma l'originale deve ancora tornare. “Restituito” registra la presenza dell'originale; “Controllato” registra il controllo amministrativo; “Scansionato” registra l'acquisizione digitale; “Archiviato” chiude il ciclo documentale.</div>
        <div class="space-y-2">${state.docs.length?state.docs.map(docRow).join(''):'<div class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 font-bold">Nessun documento applicabile trovato.</div>'}</div>
      </div>
      <div class="p-4 border-t border-slate-200 bg-white flex flex-wrap justify-between gap-2">
        <button type="button" onclick="window.apriChecklistCorso&&window.apriChecklistCorso('${esc(p?.id||'')}')" class="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-[9px] font-black uppercase">Apri checklist corso</button>
        <button type="button" onclick="window.SafetyRientroDocumenti.close()" class="px-4 py-2 rounded-xl bg-slate-900 text-white text-[9px] font-black uppercase">Chiudi</button>
      </div>
    </div>`;
    if(window.lucide) window.lucide.createIcons();
  }

  async function loadProject(projectId){
    if(!projectId) return;
    state.project=state.projects.find(p=>String(p.id)===String(projectId))||null;
    if(!state.project) return;
    state.enrollments=typeof window.getIscrizioni==='function'?(await window.getIscrizioni(projectId)||[]):[];
    const map=window.SafetyStep67?.getCompletionItemsForProjects?await window.SafetyStep67.getCompletionItemsForProjects([projectId]):{[projectId]:[]};
    state.rows=map?.[projectId]||[];
    state.docs=buildDocs(state.project,state.enrollments,state.rows);
    render();
  }

  function timestampsFor(status,existing,now){
    const result={returned_at:existing?.returned_at||null,checked_at:existing?.checked_at||null,scanned_at:existing?.scanned_at||null,archived_at:existing?.archived_at||null};
    if(status==='awaiting_return') return {returned_at:null,checked_at:null,scanned_at:null,archived_at:null};
    if(status==='returned') return {returned_at:result.returned_at||now,checked_at:null,scanned_at:null,archived_at:null};
    if(status==='checked') return {returned_at:result.returned_at||now,checked_at:result.checked_at||now,scanned_at:null,archived_at:null};
    if(status==='scanned') return {returned_at:result.returned_at||now,checked_at:result.checked_at||now,scanned_at:result.scanned_at||now,archived_at:null};
    if(status==='archived') return {returned_at:result.returned_at||now,checked_at:result.checked_at||now,scanned_at:result.scanned_at||now,archived_at:result.archived_at||now};
    return {returned_at:null,checked_at:null,scanned_at:null,archived_at:null};
  }

  async function setStatus(itemKey,enrollmentId,status,{silent=false}={}){
    if(state.saving||!state.project?.id||!STATUS[status]||!window.supabaseClient) return;
    const normalizedEnrollment=enrollmentId||null;
    const existing=state.rows.find(r=>r.item_key===itemKey&&String(r.iscrizione_id||'')===String(normalizedEnrollment||''))||null;
    const now=new Date().toISOString(), user=await window.getSafetyAdminUser?.();
    let mode=existing?.mode||'paper', activity=existing?.activity_status||'pending', recording=existing?.recording_status||'pending', evidence=existing?.evidence_status||'none';

    if(status==='not_applicable'){
      mode='not_applicable'; activity='not_applicable'; recording='not_applicable'; evidence='not_applicable';
    }else{
      if(mode==='not_applicable') mode='paper';
      if(status==='awaiting_return'){
        activity='completed';
        if(recording==='not_applicable') recording='pending';
        if(evidence==='not_applicable') evidence='none';
      }
      if(status==='returned'){
        activity='completed';
        if(recording==='not_applicable') recording='pending';
        if(!['scan_available','digital'].includes(evidence)) evidence='paper_original';
      }
      if(status==='checked'){
        activity='completed'; recording='recorded';
        if(!['scan_available','digital'].includes(evidence)) evidence='paper_original';
      }
      if(['scanned','archived'].includes(status)){
        activity='completed'; recording='recorded';
        if(evidence!=='digital') evidence='scan_available';
      }
    }

    const payload={
      progetto_id:state.project.id,iscrizione_id:normalizedEnrollment,item_key:itemKey,
      mode,activity_status:activity,recording_status:recording,evidence_status:evidence,
      evidence_url:existing?.evidence_url||null,notes:existing?.notes||null,
      document_status:status,...timestampsFor(status,existing,now),updated_at:now
    };
    if(['checked','scanned','archived','not_applicable'].includes(status)){
      payload.verified_at=now; payload.verified_by=user?.id||existing?.verified_by||null;
    }else{
      payload.verified_at=existing?.verified_at||null; payload.verified_by=existing?.verified_by||null;
    }

    state.saving=true;
    try{
      let result;
      if(existing?.id){
        result=await window.supabaseClient.from('course_completion_items').update(payload).eq('id',existing.id).select('*').single();
      }else{
        payload.created_by=user?.id||null;
        result=await window.supabaseClient.from('course_completion_items').insert(payload).select('*').single();
      }
      if(result.error) throw result.error;
      if(!silent&&window.showSafetyToast) window.showSafetyToast(`${STATUS[status].label}: ${state.docs.find(d=>d.itemKey===itemKey&&String(d.enrollmentId||'')===String(normalizedEnrollment||''))?.label||itemKey}`,{type:'ok',title:'Rientro documenti'});
    }catch(error){
      if(!silent) alert('Stato documento non salvato: '+(error.message||error));
      throw error;
    }finally{ state.saving=false; }
    if(!silent) await loadProject(state.project.id);
  }

  async function bulk(status){
    if(!state.project||!['returned','checked','scanned'].includes(status)) return;
    const targets=state.docs.filter(d=>d.status!=='not_applicable'&&STATUS[d.status]?.rank<STATUS[status].rank);
    if(!targets.length){ if(window.showSafetyToast) window.showSafetyToast('Nessun documento da aggiornare.',{type:'info',title:'Rientro documenti'}); return; }
    if(!confirm(`Aggiornare ${targets.length} documenti allo stato “${STATUS[status].label}”?`)) return;
    for(const d of targets){
      try{ await setStatus(d.itemKey,d.enrollmentId,status,{silent:true}); }
      catch(error){ console.warn('Rientro documenti: aggiornamento massivo interrotto',error); break; }
    }
    await loadProject(state.project.id);
    if(window.showSafetyToast) window.showSafetyToast('Aggiornamento massivo completato.',{type:'ok',title:'Rientro documenti'});
  }

  async function open(projectId=''){
    const m=modal();m.classList.remove('hidden');m.classList.add('flex');
    m.innerHTML='<div class="bg-white rounded-3xl p-8 shadow-2xl text-center"><i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto mb-3 text-cyan-600"></i><p class="font-black uppercase">Caricamento rientro documenti...</p></div>';
    if(window.lucide) window.lucide.createIcons();
    try{
      state.projects=await getProjects();
      if(!state.projects.length) throw new Error('Nessun progetto disponibile.');
      const preferred=state.projects.find(p=>String(p.id)===String(projectId))||state.projects.find(p=>['chiuso','svolto'].includes(norm(p.stato_corso)))||state.projects[0];
      await loadProject(preferred.id);
    }catch(error){
      m.innerHTML=`<div class="bg-white rounded-3xl p-8 shadow-2xl max-w-lg"><p class="font-black text-rose-700">Impossibile aprire il rientro documenti</p><p class="text-sm text-slate-600 mt-2">${esc(error.message||error)}</p><button onclick="window.SafetyRientroDocumenti.close()" class="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black uppercase">Chiudi</button></div>`;
    }
  }

  window.apriRientroDocumenti=open;
  window.SafetyRientroDocumenti={open,close,loadProject,setStatus,bulk};
})();
