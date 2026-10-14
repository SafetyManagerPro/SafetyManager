// SafetyManager -> SafetyTraining v1 manual transfer bridge.
// Exports the minimum administrative/training data needed by SafetyTraining.
(function(){
  'use strict';
  if(window.__safetyTrainingBridgeLoaded) return;
  window.__safetyTrainingBridgeLoaded=true;

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const state={projects:[],selected:null};

  function uuid(){
    return globalThis.crypto?.randomUUID?.() || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0,v=c==='x'?r:(r&3|8);return v.toString(16);});
  }
  function courseLabel(project){
    const c=window.DB_CORSI?.[project?.corso_id];
    return c?.t || project?.corso_id || 'Corso non indicato';
  }
  function companyName(project){return project?.aziende?.ragione_sociale || 'Azienda non collegata';}
  function download(name,data){
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  function ensureButton(){
    const nav=document.getElementById('top-nav-buttons');
    if(!nav||document.getElementById('nav-safetytraining-export')) return;
    const b=document.createElement('button');
    b.id='nav-safetytraining-export';b.type='button';b.className='btn-tab flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs transition-all duration-300 hover:text-white hover:bg-slate-800 group text-slate-400';
    b.title='Esporta azienda, corsisti e assegnazione per SafetyTraining';
    b.innerHTML='<div class="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center group-hover:bg-cyan-600 transition-all"><i data-lucide="send" class="w-3.5 h-3.5 group-hover:text-white"></i></div><span class="hidden xl:block">SafetyTraining</span>';
    b.onclick=open;
    const logout=document.getElementById('nav-safety-logout');
    nav.insertBefore(b,logout||null);
    if(typeof lucide!=='undefined') lucide.createIcons();
  }

  function ensureModal(){
    let modal=document.getElementById('safetytraining-export-modal');
    if(modal) return modal;
    modal=document.createElement('div');modal.id='safetytraining-export-modal';modal.className='hidden fixed inset-0 z-[120000] bg-slate-950/75 backdrop-blur-sm p-4 items-center justify-center';
    modal.innerHTML=`<div class="w-full max-w-3xl max-h-[92vh] overflow-auto bg-white rounded-3xl shadow-2xl border border-slate-200">
      <div class="p-5 bg-slate-950 text-white flex items-start justify-between gap-4"><div><div class="text-[10px] font-black uppercase tracking-widest text-cyan-300">Ponte dati v1</div><h2 class="text-xl font-black mt-1">Esporta per SafetyTraining</h2><p class="text-xs text-slate-300 mt-1">Nessun collegamento diretto tra database: viene creato un file JSON da importare in SafetyTraining.</p></div><button id="stx-close" class="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-xl">×</button></div>
      <div class="p-5 space-y-5">
        <div><label class="text-[10px] font-black uppercase tracking-widest text-slate-500">Progetto / corso</label><select id="stx-project" class="input-field mt-1"><option value="">Caricamento…</option></select></div>
        <div id="stx-preview" class="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Seleziona un progetto.</div>
        <div class="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-950 leading-relaxed"><strong>Importati:</strong> azienda, ATECO/P.IVA-CF, corsisti iscritti, codice corso, date e assegnazioni. Documenti, firme, dati sanitari e altre informazioni non necessarie non vengono esportati.</div>
        <div class="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950 leading-relaxed">Se il codice corso SafetyManager non ha ancora una corrispondenza in SafetyTraining, i dati anagrafici vengono comunque acquisiti e SafetyTraining chiederà all'admin di associare quel codice una sola volta.</div>
        <div id="stx-message" class="text-xs min-h-5"></div>
      </div>
      <div class="p-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-3"><button id="stx-cancel" class="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-black uppercase">Annulla</button><button id="stx-export" class="px-5 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-black uppercase">Esporta JSON</button></div>
    </div>`;
    document.body.appendChild(modal);
    modal.querySelector('#stx-close').onclick=close;modal.querySelector('#stx-cancel').onclick=close;modal.addEventListener('click',e=>{if(e.target===modal)close();});
    modal.querySelector('#stx-project').onchange=preview;modal.querySelector('#stx-export').onclick=exportSelected;
    return modal;
  }

  async function open(){
    const modal=ensureModal();modal.classList.remove('hidden');modal.classList.add('flex');
    const sel=modal.querySelector('#stx-project'),msg=modal.querySelector('#stx-message');
    msg.textContent='Caricamento progetti…';
    try{
      state.projects=typeof window.getProgetti==='function'?await window.getProgetti():[];
      sel.innerHTML='<option value="">Seleziona un progetto…</option>'+state.projects.map(p=>`<option value="${esc(p.id)}">${esc(p.codice||'Senza codice')} · ${esc(courseLabel(p))} · ${esc(companyName(p))}</option>`).join('');
      msg.textContent=state.projects.length?`${state.projects.length} progetti disponibili.`:'Nessun progetto disponibile.';
    }catch(e){msg.textContent='Errore caricamento progetti: '+(e?.message||e);}
  }
  function close(){const m=document.getElementById('safetytraining-export-modal');m?.classList.add('hidden');m?.classList.remove('flex');}

  async function preview(){
    const id=document.getElementById('stx-project')?.value,box=document.getElementById('stx-preview');
    const p=state.projects.find(x=>x.id===id);state.selected=p||null;
    if(!p){box.innerHTML='Seleziona un progetto.';return;}
    let count='…';
    try{const i=typeof window.getIscrizioni==='function'?await window.getIscrizioni(p.id):[];count=(i||[]).length;}catch(_e){count='n/d';}
    box.innerHTML=`<div class="grid sm:grid-cols-2 gap-3"><div><span class="text-[10px] uppercase font-black text-slate-400">Azienda</span><strong class="block text-slate-900">${esc(companyName(p))}</strong></div><div><span class="text-[10px] uppercase font-black text-slate-400">Corso</span><strong class="block text-slate-900">${esc(courseLabel(p))}</strong><small>codice: ${esc(p.corso_id||'—')}</small></div><div><span class="text-[10px] uppercase font-black text-slate-400">Periodo</span><strong class="block text-slate-900">${esc(p.data_inizio||'—')} → ${esc(p.data_esame||'—')}</strong></div><div><span class="text-[10px] uppercase font-black text-slate-400">Corsisti iscritti</span><strong class="block text-slate-900">${esc(count)}</strong></div></div>`;
  }

  async function exportSelected(){
    const msg=document.getElementById('stx-message'),p=state.selected||state.projects.find(x=>x.id===document.getElementById('stx-project')?.value);
    if(!p){msg.textContent='Seleziona prima un progetto.';return;}
    try{
      msg.textContent='Preparazione file…';
      const iscrizioni=typeof window.getIscrizioni==='function'?await window.getIscrizioni(p.id):[];
      const company=p.aziende || (typeof window.getAziende==='function'?(await window.getAziende()).find(a=>a.id===p.azienda_id):null) || {};
      const learners=(iscrizioni||[]).map(i=>{
        const c=i.corsisti||{};
        return {
          external_id:String(i.corsista_id||c.id||''),
          enrollment_external_id:String(i.id||''),
          full_name:c.nome_cognome||'',
          fiscal_code:c.cf||'',
          email:'',
          job_title:i.mansione_storica||c.mansione_storica||c.ruolo_aziendale||''
        };
      }).filter(x=>x.external_id);
      const payload={
        schema:'safetytraining.transfer',schema_version:'1.0',source_system:'safetymanager',export_id:uuid(),exported_at:new Date().toISOString(),
        company:{external_id:String(p.azienda_id||company.id||''),name:company.ragione_sociale||'',vat_or_fiscal_code:company.piva_cf||'',ateco_code:company.ateco||''},
        project:{external_id:String(p.id),code:p.codice||'',course_code:p.corso_id||'',course_title:courseLabel(p),title:`${p.codice||'Corso'} · ${courseLabel(p)}`,available_from:p.data_inizio||null,recommended_due_at:p.data_esame||null,source_mode:p.modalita||''},
        learners
      };
      if(!payload.company.external_id) throw new Error('Il progetto non ha un’azienda collegata.');
      const safeCode=String(p.codice||p.id).replace(/[^a-z0-9_-]+/gi,'_');
      download(`SafetyTraining_${safeCode}_${new Date().toISOString().slice(0,10)}.json`,payload);
      msg.textContent=`File creato: ${learners.length} corsisti inclusi. Importalo dalla Console Admin di SafetyTraining.`;
    }catch(e){msg.textContent='Esportazione non riuscita: '+(e?.message||e);}
  }

  window.openSafetyTrainingExport=open;
  window.SafetyTrainingBridge={open,exportSelected};
  const boot=()=>{ensureButton();const obs=new MutationObserver(ensureButton);obs.observe(document.body,{childList:true,subtree:true});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
