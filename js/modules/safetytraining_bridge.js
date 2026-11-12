// SafetyManager -> SafetyTraining v1.2 manual transfer bridge.
// Exports the administrative/training context needed by SafetyTraining with identifier checks.
(function(){
  'use strict';
  if(window.__safetyTrainingBridgeLoaded) return;
  window.__safetyTrainingBridgeLoaded=true;

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const state={projects:[],selected:null};

  function uuid(){
    return globalThis.crypto?.randomUUID?.() || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0,v=c==='x'?r:(r&3|8);return v.toString(16);});
  }
  function normalizeIdentifier(value){
    return String(value||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'');
  }
  function normalizeCompanyIdentifier(value){
    const normalized=normalizeIdentifier(value);
    return /^IT[0-9]{11}$/.test(normalized) ? normalized.slice(2) : normalized;
  }
  function normalizeLearnerFiscalCode(value){ return normalizeIdentifier(value); }
  function courseData(project){return window.DB_CORSI?.[project?.corso_id]||{};}
  function courseLabel(project){const c=courseData(project);return c?.t || project?.corso_id || 'Corso non indicato';}
  function companyName(project){return project?.aziende?.ragione_sociale || 'Azienda non collegata';}
  function requiresPresence(project){return window.isCorsoPresenzaObbligatoria?.(project?.corso_id)===true;}
  function list(value){
    if(typeof window.step60Array==='function') return window.step60Array(value).map(v=>String(v||'').trim()).filter(Boolean);
    if(Array.isArray(value)) return value.map(v=>String(v||'').trim()).filter(Boolean);
    if(value==null||value==='') return [];
    if(typeof value==='string'){
      try{const x=JSON.parse(value);if(Array.isArray(x))return x.map(v=>String(v||'').trim()).filter(Boolean);}catch(_e){}
      return value.split(/[;,\n]/).map(v=>v.trim()).filter(Boolean);
    }
    return [];
  }
  function riskContext(project){
    const sectorId=project?.rischi_settore_id||'';
    const sector=typeof window.getRiskSector==='function' ? window.getRiskSector(sectorId) : null;
    return {
      risk_sector_code:sectorId||null,
      risk_sector_label:sector?.label||'',
      risk_codes:list(project?.rischi_selezionati),
      custom_risks:String(project?.rischi_personalizzati||'').split(/\r?\n/).map(v=>v.trim()).filter(Boolean),
      needs_analysis_accepted:project?.fabbisogni_accettato===true
    };
  }
  function downloadBlob(name,blob){
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  // Il CSV e il JSON nascono dal medesimo payload validato.
  // La versione safetytraining.transfer 1.2 rimane invariata.
  const excludedStates=new Set(['non_partecipante','iscrizione_erronea']);
  function isExcludedEnrollment(row){
    return excludedStates.has(String(row?.partecipazione_stato||'iscritto'));
  }
  function csvRows(payload){
    const base={
      schema:payload.schema,
      schema_version:payload.schema_version,
      source_system:payload.source_system,
      export_id:payload.export_id,
      exported_at:payload.exported_at
    };
    Object.entries(payload.company||{}).forEach(([k,v])=>{base['company_'+k]=v});
    Object.entries(payload.project||{}).forEach(([k,v])=>{base['project_'+k]=v});
    return (payload.learners||[]).map(learner=>{
      const row={...base};
      Object.entries(learner||{}).forEach(([k,v])=>{row['learner_'+k]=v});
      return row;
    });
  }
  function csvCell(value){
    if(value==null)return '';
    const raw=typeof value==='object'?JSON.stringify(value):String(value);
    // Evita che Excel interpreti contenuti anagrafici come formule.
    const guarded=typeof value==='string' && /^[\s]*[=+\-@]/.test(raw)?"'"+raw:raw;
    return /[";\r\n]/.test(guarded)?'"'+guarded.replace(/"/g,'""')+'"':guarded;
  }
  function transferToCsv(payload){
    const headers=[
      'schema','schema_version','source_system','export_id','exported_at',
      ...Object.keys(payload.company||{}).map(k=>'company_'+k),
      ...Object.keys(payload.project||{}).map(k=>'project_'+k),
      ...Object.keys((payload.learners||[])[0]||{}).map(k=>'learner_'+k)
    ];
    const lines=[headers.map(csvCell).join(';')];
    csvRows(payload).forEach(row=>{lines.push(headers.map(h=>csvCell(row[h])).join(';'))});
    return '\uFEFF'+lines.join('\r\n')+'\r\n';
  }
  async function downloadTransfer(name,payload,format){
    const json=JSON.stringify(payload,null,2);
    if(format==='json'){
      downloadBlob(name+'.json',new Blob([json],{type:'application/json;charset=utf-8'}));
    }else if(format==='csv'){
      downloadBlob(name+'.csv',new Blob([transferToCsv(payload)],{type:'text/csv;charset=utf-8'}));
    }else if(format==='zip'){
      if(typeof window.JSZip!=='function')throw Error('Libreria ZIP non disponibile. Usa JSON/CSV oppure ricarica la pagina.');
      const zip=new window.JSZip();
      zip.file(name+'.json',json);
      zip.file(name+'.csv',transferToCsv(payload));
      const blob=await zip.generateAsync({type:'blob'});
      downloadBlob(name+'.zip',blob);
    }else{
      throw Error('Formato di esportazione non valido.');
    }
  }

  function buildTransfer(project,iscrizioni,company){
    const course=courseData(project),ctx=riskContext(project);
    const learners=(iscrizioni||[]).filter(i=>!isExcludedEnrollment(i)).map(i=>{
      const c=i.corsisti||{};
      return {
        external_id:String(i.corsista_id||c.id||''),
        enrollment_external_id:String(i.id||''),
        full_name:String(c.nome_cognome||'').trim(),
        fiscal_code:normalizeLearnerFiscalCode(c.cf),
        job_title:String(i.mansione_storica||c.mansione_storica||c.ruolo_aziendale||'').trim(),
        source_company_id:String(c.azienda_id||'')
      };
    }).filter(x=>x.external_id);

    return {
      schema:'safetytraining.transfer',
      schema_version:'1.2',
      source_system:'safetymanager',
      export_id:uuid(),
      exported_at:new Date().toISOString(),
      company:{
        external_id:String(project?.azienda_id||company?.id||''),
        name:String(company?.ragione_sociale||'').trim(),
        vat_or_fiscal_code:normalizeCompanyIdentifier(company?.piva_cf),
        ateco_code:String(company?.ateco||'').trim(),
        address:String(company?.indirizzo||'').trim(),
        operating_site:String(company?.sede_operativa||'').trim()
      },
      project:{
        external_id:String(project?.id||''),
        code:String(project?.codice||'').trim(),
        course_code:String(project?.corso_id||'').trim(),
        course_title:courseLabel(project),
        course_duration_minutes:Number(course.ore||0)>0?Number(course.ore)*60:null,
        course_normative_ref:String(course.norma||'').trim(),
        requires_presence:requiresPresence(project),
        title:`${project?.codice||'Corso'} · ${courseLabel(project)}`,
        available_from:project?.data_inizio||null,
        recommended_due_at:project?.data_esame||null,
        source_mode:String(project?.modalita||'').trim(),
        site:String(project?.sede||'').trim(),
        risk_sector_code:ctx.risk_sector_code,
        risk_sector_label:ctx.risk_sector_label,
        risk_codes:ctx.risk_codes,
        custom_risks:ctx.custom_risks,
        needs_analysis_accepted:ctx.needs_analysis_accepted
      },
      learners
    };
  }

  function validateTransfer(payload){
    const errors=[],warnings=[];
    if(payload?.schema!=='safetytraining.transfer'||payload?.source_system!=='safetymanager') errors.push('Formato trasferimento non valido.');
    if(!payload?.company?.external_id) errors.push('Il progetto non ha un’azienda collegata.');
    if(!payload?.company?.name) errors.push('La ragione sociale dell’azienda è mancante.');
    if(!payload?.company?.vat_or_fiscal_code) errors.push('P. IVA / Codice Fiscale azienda mancante: completare l’anagrafica prima dell’export per evitare doppioni.');
    if(!payload?.project?.external_id) errors.push('ID progetto mancante.');
    if(!payload?.project?.course_code) errors.push('Tipologia corso mancante.');
    if(!Array.isArray(payload?.learners)||!payload.learners.length) errors.push('Il progetto non ha corsisti iscritti da trasferire.');

    const seen=new Map();
    (payload.learners||[]).forEach((learner,index)=>{
      const label=learner.full_name||`corsista ${index+1}`;
      if(!learner.external_id) errors.push(`${label}: ID corsista mancante.`);
      if(!learner.fiscal_code) errors.push(`${label}: Codice Fiscale mancante.`);
      if(learner.fiscal_code){
        if(seen.has(learner.fiscal_code)) errors.push(`Codice Fiscale duplicato nel progetto: ${learner.fiscal_code}.`);
        else seen.set(learner.fiscal_code,learner.external_id);
      }
      if(learner.source_company_id && learner.source_company_id!==payload.company.external_id){
        warnings.push(`${label}: anagrafica corrente su azienda diversa; per il trasferimento vale l’azienda storica del progetto.`);
      }
    });

    if(!(payload.project.risk_codes||[]).length && !(payload.project.custom_risks||[]).length){
      warnings.push('Nessun rischio specifico di progetto: SafetyTraining userà solo il profilo generico del corso finché l’analisi non viene completata.');
    }
    if(payload.project.needs_analysis_accepted!==true){
      warnings.push('Analisi fabbisogni/rischi non validata nel progetto.');
    }
    return {ok:errors.length===0,errors,warnings};
  }

  function ensureButton(){
    const nav=document.getElementById('top-nav-buttons');
    if(!nav||document.getElementById('nav-safetytraining-export')) return;
    const b=document.createElement('button');
    b.id='nav-safetytraining-export';b.type='button';b.className='btn-tab flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs transition-all duration-300 hover:text-white hover:bg-slate-800 group text-slate-400';
    b.title='Esporta azienda, corsisti, corso e contesto rischi per SafetyTraining';
    b.innerHTML='<div class="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center group-hover:bg-cyan-600 transition-all"><i data-lucide="send" class="w-3.5 h-3.5 group-hover:text-white"></i></div><span class="hidden xl:block">SafetyTraining</span>';
    b.onclick=()=>open();
    const logout=document.getElementById('nav-safety-logout');
    nav.insertBefore(b,logout||null);
    if(typeof lucide!=='undefined') lucide.createIcons();
  }

  function ensureProjectButton(){
    const header=document.getElementById('popup-project-header');
    if(!header||document.getElementById('btn-project-safetytraining-export')) return;
    const b=document.createElement('button');
    b.id='btn-project-safetytraining-export';b.type='button';
    b.className='ml-auto bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 px-3 py-2 rounded-lg transition text-[10px] font-black uppercase tracking-wide flex items-center gap-2';
    b.title='Esporta questo progetto e i suoi corsisti in SafetyTraining';
    b.innerHTML='<i data-lucide="send" class="w-4 h-4"></i><span class="hidden sm:inline">SafetyTraining</span>';
    b.onclick=()=>{
      const projectId=document.getElementById('prog-id')?.value||'';
      if(!projectId){ alert('Salva prima il progetto: l’export SafetyTraining richiede un progetto già registrato.'); return; }
      open(projectId);
    };
    const closeBtn=document.getElementById('btn-close-project-popup');
    if(closeBtn) header.insertBefore(b,closeBtn); else header.appendChild(b);
    if(typeof lucide!=='undefined') lucide.createIcons();
  }

  function ensureModal(){
    let modal=document.getElementById('safetytraining-export-modal');
    if(modal) return modal;
    modal=document.createElement('div');modal.id='safetytraining-export-modal';modal.className='hidden fixed inset-0 z-[120000] bg-slate-950/75 backdrop-blur-sm p-4 items-center justify-center';
    modal.innerHTML=`<div class="w-full max-w-3xl max-h-[92vh] overflow-auto bg-white rounded-3xl shadow-2xl border border-slate-200">
      <div class="p-5 bg-slate-950 text-white flex items-start justify-between gap-4"><div><div class="text-[10px] font-black uppercase tracking-widest text-cyan-300">Ponte dati v1.2</div><h2 class="text-xl font-black mt-1">Esporta per SafetyTraining</h2><p class="text-xs text-slate-300 mt-1">Scegli JSON (formato importazione v1.2), CSV per Excel o ZIP con entrambi. Nessun database condiviso.</p></div><button id="stx-close" class="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-xl">×</button></div>
      <div class="p-5 space-y-5">
        <div><label class="text-[10px] font-black uppercase tracking-widest text-slate-500">Progetto / corso</label><select id="stx-project" class="input-field mt-1"><option value="">Caricamento…</option></select></div>
        <div id="stx-preview" class="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Seleziona un progetto.</div>
        <div class="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-950 leading-relaxed"><strong>Trasferiti:</strong> azienda e identificativo fiscale, ATECO, corsisti iscritti e Codici Fiscali, corso, date, sede, assegnazioni e contesto rischi. Documenti, firme e dati sanitari non vengono esportati.</div>
        <div class="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950 leading-relaxed">P. IVA/CF azienda e CF corsisti vengono normalizzati prima dell’export. Identificativi mancanti o CF duplicati bloccano il file; un cambio azienda successivo del corsista viene segnalato senza perdere il contesto storico del progetto.</div>
        <div id="stx-message" class="text-xs min-h-5"></div>
      </div>
      <div class="p-5 border-t border-slate-200 bg-slate-50 flex flex-wrap justify-end gap-2">
        <button id="stx-cancel" class="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-black uppercase">Annulla</button>
        <button id="stx-export-json" class="px-4 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-black uppercase disabled:opacity-40">Esporta JSON</button>
        <button id="stx-export-csv" class="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-xs font-black uppercase disabled:opacity-40">Esporta CSV</button>
        <button id="stx-export-both" class="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black uppercase disabled:opacity-40">JSON + CSV (ZIP)</button>
      </div>
    </div>`;
    document.body.appendChild(modal);
    modal.querySelector('#stx-close').onclick=close;modal.querySelector('#stx-cancel').onclick=close;modal.addEventListener('click',e=>{if(e.target===modal)close();});
    modal.querySelector('#stx-project').onchange=preview;
    modal.querySelector('#stx-export-json').onclick=()=>exportSelected('json');
    modal.querySelector('#stx-export-csv').onclick=()=>exportSelected('csv');
    modal.querySelector('#stx-export-both').onclick=()=>exportSelected('zip');
    return modal;
  }

  async function open(projectId=''){
    const modal=ensureModal();modal.classList.remove('hidden');modal.classList.add('flex');
    const sel=modal.querySelector('#stx-project'),msg=modal.querySelector('#stx-message');
    msg.textContent='Caricamento progetti…';
    try{
      state.projects=typeof window.getProgetti==='function'?await window.getProgetti():[];
      sel.innerHTML='<option value="">Seleziona un progetto…</option>'+state.projects.map(p=>`<option value="${esc(p.id)}">${esc(p.codice||'Senza codice')} · ${esc(courseLabel(p))} · ${esc(companyName(p))}</option>`).join('');
      if(projectId && state.projects.some(p=>String(p.id)===String(projectId))){
        sel.value=String(projectId);
        await preview();
      }else{
        state.selected=null;
        msg.textContent=state.projects.length?`${state.projects.length} progetti disponibili.`:'Nessun progetto disponibile.';
      }
    }catch(e){msg.textContent='Errore caricamento progetti: '+(e?.message||e);}
  }
  function close(){const m=document.getElementById('safetytraining-export-modal');m?.classList.add('hidden');m?.classList.remove('flex');}

  async function getTransferForProject(project){
    const iscrizioni=typeof window.getIscrizioni==='function'?await window.getIscrizioni(project.id):[];
    const company=project.aziende || (typeof window.getAziende==='function'?(await window.getAziende()).find(a=>a.id===project.azienda_id):null) || {};
    const excluded=(iscrizioni||[]).filter(isExcludedEnrollment);
    return {payload:buildTransfer(project,iscrizioni,company),excludedCount:excluded.length};
  }

  async function preview(){
    const id=document.getElementById('stx-project')?.value,box=document.getElementById('stx-preview'),msg=document.getElementById('stx-message');
    const p=state.projects.find(x=>String(x.id)===String(id));state.selected=p||null;
    if(!p){box.innerHTML='Seleziona un progetto.';if(msg)msg.textContent='';return;}
    try{
      const {payload,excludedCount}=await getTransferForProject(p),check=validateTransfer(payload),course=courseData(p),ctx=riskContext(p);
      const issues=check.errors.length?`<div class="mt-3 text-red-700"><strong>Da correggere:</strong><br>${check.errors.map(esc).join('<br>')}</div>`:'';
      const warnings=check.warnings.length?`<div class="mt-3 text-amber-700"><strong>Avvisi:</strong><br>${check.warnings.map(esc).join('<br>')}</div>`:'';
      const skipped=excludedCount?'<div class="mt-3 rounded-lg border border-rose-300 bg-rose-50 p-3 text-rose-900 text-xs font-bold">Escluse dall’export '+excludedCount+' iscrizioni segnalate come non partecipanti o erronee. I dati rimangono in SafetyManager Pro.</div>':'';
      box.innerHTML=`<div class="grid sm:grid-cols-2 gap-3"><div><span class="text-[10px] uppercase font-black text-slate-400">Azienda</span><strong class="block text-slate-900">${esc(payload.company.name||companyName(p))}</strong><small>ID fiscale normalizzato: ${esc(payload.company.vat_or_fiscal_code||'—')}</small></div><div><span class="text-[10px] uppercase font-black text-slate-400">Corso</span><strong class="block text-slate-900">${esc(courseLabel(p))}</strong><small>codice: ${esc(p.corso_id||'—')} · ${esc(course.ore||'—')} h${requiresPresence(p)?' · presenza/pratica':''}</small></div><div><span class="text-[10px] uppercase font-black text-slate-400">Periodo</span><strong class="block text-slate-900">${esc(p.data_inizio||'—')} → ${esc(p.data_esame||'—')}</strong></div><div><span class="text-[10px] uppercase font-black text-slate-400">Corsisti iscritti</span><strong class="block text-slate-900">${payload.learners.length}</strong></div><div class="sm:col-span-2"><span class="text-[10px] uppercase font-black text-slate-400">Contesto rischi</span><strong class="block text-slate-900">${esc(ctx.risk_sector_label||ctx.risk_sector_code||'Settore non indicato')} · ${ctx.risk_codes.length} rischi selezionati${ctx.custom_risks.length?` + ${ctx.custom_risks.length} personalizzati`:''}</strong><small>${ctx.needs_analysis_accepted?'Analisi fabbisogni validata':'Analisi fabbisogni da validare / non presente'}</small></div></div>${issues}${warnings}${skipped}`;
      ['stx-export-json','stx-export-csv','stx-export-both'].forEach(id=>{const run=document.getElementById(id);if(run)run.disabled=!check.ok;});
      if(msg)msg.textContent=(check.ok?'Controlli superati. File pronti per l’export.':'Correggi gli errori indicati prima dell’export.')+(excludedCount?' Iscrizioni escluse: '+excludedCount+'.':'');
    }catch(e){box.innerHTML=`<span class="text-red-700">${esc(e?.message||e)}</span>`;}
  }

  async function exportSelected(format='json'){
    const msg=document.getElementById('stx-message'),p=state.selected||state.projects.find(x=>String(x.id)===String(document.getElementById('stx-project')?.value));
    if(!p){msg.textContent='Seleziona prima un progetto.';return;}
    try{
      msg.textContent='Preparazione file…';
      const {payload,excludedCount}=await getTransferForProject(p),check=validateTransfer(payload);
      if(!check.ok) throw new Error(check.errors.join(' '));
      const safeCode=String(p.codice||p.id).replace(/[^a-z0-9_-]+/gi,'_');
      const base='SafetyTraining_'+safeCode+'_'+new Date().toISOString().slice(0,10);
      await downloadTransfer(base,payload,format);
      msg.textContent='Export '+(format==='zip'?'JSON + CSV (ZIP)':format.toUpperCase())+' creato: '+payload.learners.length+' corsisti inclusi, '+excludedCount+' iscrizioni segnalate escluse.';
    }catch(e){msg.textContent='Esportazione non riuscita: '+(e?.message||e);}
  }

  window.openSafetyTrainingExport=open;
  window.SafetyTrainingBridge={
    open,exportSelected,riskContext,buildTransfer,validateTransfer,
    isExcludedEnrollment,csvRows,transferToCsv,downloadTransfer,
    normalizeCompanyIdentifier,normalizeLearnerFiscalCode
  };
  const boot=()=>{
    const ensure=()=>{ensureButton();ensureProjectButton();};
    ensure();
    const obs=new MutationObserver(ensure);obs.observe(document.body,{childList:true,subtree:true});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
