// Dashboard: contatori operativi del rientro e ciclo documentale post-corso.
(function(){
  if(window.__safetyDashboardDocumentLifecycleLoaded) return;
  window.__safetyDashboardDocumentLifecycleLoaded=true;

  const BASE_DOCS=['attendance_register','participant_signatures','teacher_signatures','final_minutes','quality_questionnaires','signed_course_documents'];
  const RANK={awaiting_return:1,returned:2,checked:3,scanned:4,archived:5,not_applicable:99};
  const norm=v=>String(v??'').trim().toLowerCase();
  const rowKey=(itemKey,enrollmentId)=>`${itemKey}::${enrollmentId||'*'}`;
  const today=()=>{const d=new Date();d.setHours(0,0,0,0);return d;};
  const parseDate=v=>{if(!v)return null;const d=new Date(String(v).slice(0,10)+'T00:00:00');return Number.isNaN(d.getTime())?null:d;};

  function concluded(project){
    const state=norm(project?.stato_corso);
    if(['chiuso','svolto'].includes(state)) return true;
    const end=parseDate(project?.data_esame);
    return !!(end&&end<=today());
  }

  function indexRows(rows=[]){
    const map=new Map();
    rows.forEach(r=>map.set(rowKey(r.item_key,r.iscrizione_id),r));
    return map;
  }

  function inferStatus(row){
    if(!row) return 'awaiting_return';
    const ds=norm(row.document_status);
    if(RANK[ds]) return ds;
    if(row.mode==='not_applicable'||row.activity_status==='not_applicable'||row.evidence_status==='not_applicable') return 'not_applicable';
    if(['scan_available','digital'].includes(row.evidence_status)) return 'scanned';
    if(row.evidence_status==='paper_original'&&row.recording_status==='recorded') return 'checked';
    if(row.evidence_status==='paper_original') return 'returned';
    return 'awaiting_return';
  }

  function expectedStatuses(project,enrollments=[],rows=[]){
    const map=indexRows(rows), out=[];
    BASE_DOCS.forEach(itemKey=>out.push(inferStatus(map.get(rowKey(itemKey,null))||null)));
    enrollments.forEach(i=>{
      const id=i.id||null;
      out.push(inferStatus(map.get(rowKey('final_test',id))||null));
      const practical=map.get(rowKey('practical_test',id));
      if(practical||String(i.esito_pratica||'').trim()) out.push(inferStatus(practical||null));
      const language=map.get(rowKey('language_check',id));
      const languageState=norm(i?.corsisti?.lingua_test_stato);
      if(language||(languageState&&languageState!=='non_richiesto')) out.push(inferStatus(language||null));
    });
    return out.filter(s=>s!=='not_applicable');
  }

  function card(id,title,value,subtitle,icon,tone){
    return `<button type="button" onclick="window.apriRientroDocumenti&&window.apriRientroDocumenti()" class="group text-left bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all">
      <div class="flex items-start justify-between gap-3"><div><p class="text-[10px] font-black uppercase tracking-widest text-slate-500">${title}</p><p id="${id}" class="text-3xl font-black text-slate-900 mt-1">${value}</p></div><span class="w-12 h-12 rounded-2xl bg-${tone}-50 text-${tone}-600 border border-${tone}-100 flex items-center justify-center group-hover:scale-105 transition-transform"><i data-lucide="${icon}" class="w-5 h-5"></i></span></div>
      <p class="text-[11px] leading-relaxed text-slate-500 mt-3">${subtitle}</p>
    </button>`;
  }

  async function enrollmentMap(projects){
    const ids=projects.map(p=>p.id).filter(Boolean);
    if(!ids.length) return {};
    if(typeof window.getIscrizioniPerProgetti==='function') return await window.getIscrizioniPerProgetti(ids);
    if(typeof window.buildIscrizioniMapFallback==='function') return await window.buildIscrizioniMapFallback(projects);
    const result={};
    for(const id of ids) result[id]=typeof window.getIscrizioni==='function'?(await window.getIscrizioni(id)||[]):[];
    return result;
  }

  async function completionMap(ids){
    if(!ids.length) return {};
    if(window.SafetyStep67?.getCompletionItemsForProjects) return await window.SafetyStep67.getCompletionItemsForProjects(ids);
    const result={};ids.forEach(id=>result[id]=[]);
    if(!window.supabaseClient) return result;
    try{
      const {data,error}=await window.supabaseClient.from('course_completion_items').select('*').in('progetto_id',ids);
      if(error) throw error;
      (data||[]).forEach(row=>{(result[row.progetto_id]||(result[row.progetto_id]=[])).push(row);});
    }catch(error){console.warn('Dashboard ciclo documentale non disponibile',error);}
    return result;
  }

  async function compute(){
    const projects=(typeof window.getProgetti==='function'?await window.getProgetti():(window.progettiList||[]))||[];
    const ended=projects.filter(concluded);
    const ids=ended.map(p=>p.id).filter(Boolean);
    const [enrollments,rows]=await Promise.all([enrollmentMap(ended),completionMap(ids)]);
    const summary={waitingReturn:0,toCheck:0,toScan:0,archived:0,total:ended.length};
    ended.forEach(p=>{
      const statuses=expectedStatuses(p,enrollments[p.id]||[],rows[p.id]||[]);
      if(!statuses.length) return;
      if(statuses.some(s=>(RANK[s]||1)<2)) summary.waitingReturn++;
      if(statuses.some(s=>s==='returned')) summary.toCheck++;
      if(statuses.some(s=>s==='checked')) summary.toScan++;
      if(statuses.every(s=>s==='archived')) summary.archived++;
    });
    return summary;
  }

  async function render(){
    const grid=document.getElementById('dash-operational-grid');
    if(!grid) return;
    try{
      const s=await compute();
      grid.querySelectorAll('[data-dashboard-document-lifecycle="1"]').forEach(el=>el.remove());
      const wrap=document.createElement('div');
      wrap.dataset.dashboardDocumentLifecycle='1';
      wrap.className='contents';
      wrap.innerHTML=[
        card('dash-docs-return','Documenti da rientrare',s.waitingReturn,'Corsi conclusi con almeno un originale cartaceo non ancora rientrato.','undo-2','amber'),
        card('dash-docs-check','Plichi da controllare',s.toCheck,'Corsi con documenti restituiti ma ancora da controllare amministrativamente.','clipboard-check','cyan'),
        card('dash-docs-scan','Corsi da scansionare',s.toScan,'Corsi controllati con almeno un documento ancora da acquisire in digitale.','scan-line','violet')
      ].join('');
      grid.appendChild(wrap);
      if(window.lucide) window.lucide.createIcons();
    }catch(error){console.warn('Contatori rientro documenti non caricati',error);}
  }

  const original=window.loadDashboardStats;
  if(typeof original==='function'){
    window.loadDashboardStats=async function(...args){
      const result=await original.apply(this,args);
      await render();
      return result;
    };
  }

  window.refreshDashboardDocumentLifecycle=render;
  window.getDashboardDocumentLifecycleSummary=compute;
  if(document.getElementById('dash-operational-grid')) setTimeout(render,120);
})();
