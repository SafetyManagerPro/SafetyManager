// Porta le evidenze locali direttamente nel Rientro documenti riusando Step 67.
(function(){
  if(window.__safetyRientroEvidenceBridgeLoaded) return;
  window.__safetyRientroEvidenceBridgeLoaded=true;

  let busy=false;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const key=(item,enroll)=>`${item}::${enroll||'*'}`;

  function currentProjectId(){
    return document.querySelector('#safety-rientro-documenti-modal select[onchange*="SafetyRientroDocumenti.loadProject"]')?.value||'';
  }

  function rows(){
    const root=document.getElementById('safety-rientro-documenti-modal');
    if(!root||root.classList.contains('hidden')) return [];
    const buttons=[...root.querySelectorAll('button')].filter(b=>String(b.getAttribute('onclick')||'').includes("SafetyRientroDocumenti.setStatus")&&String(b.getAttribute('onclick')||'').includes("'awaiting_return'"));
    return [...new Set(buttons.map(b=>b.closest('.rounded-2xl')).filter(Boolean))];
  }

  function identity(row){
    const btn=[...row.querySelectorAll('button')].find(b=>String(b.getAttribute('onclick')||'').includes("'awaiting_return'"));
    const match=String(btn?.getAttribute('onclick')||'').match(/setStatus\('([^']*)','([^']*)','awaiting_return'\)/);
    return match?{itemKey:match[1],enrollmentId:match[2]||''}:null;
  }

  async function completionMap(projectId){
    const data=window.SafetyStep67?.getCompletionItemsForProjects?await window.SafetyStep67.getCompletionItemsForProjects([projectId]):{};
    return new Map((data?.[projectId]||[]).map(r=>[key(r.item_key,r.iscrizione_id),r]));
  }

  function nameFromEvidence(value){
    const local=window.SafetyLocalEvidence?.parseRef?.(value);
    if(local) return local.name;
    const raw=String(value||'').trim();
    if(!raw) return '';
    return raw.split(/[\\/]/).pop()||raw;
  }

  function inject(row,id,record){
    let box=row.querySelector(':scope > .safety-rientro-evidence-actions');
    if(!box){
      box=document.createElement('div');
      box.className='safety-rientro-evidence-actions mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2';
      row.appendChild(box);
    }
    const value=record?.evidence_url||'';
    const label=value?`Evidenza: ${nameFromEvidence(value)}`:(['scanned','archived'].includes(record?.document_status)?'Scansionato · file non collegato':'Nessuna evidenza collegata');
    const tone=value?'emerald':(['scanned','archived'].includes(record?.document_status)?'amber':'slate');
    box.innerHTML=`
      <button type="button" onclick="window.SafetyRientroEvidence.pick('${esc(id.itemKey)}','${esc(id.enrollmentId)}')" class="px-3 py-2 rounded-xl border border-violet-200 bg-violet-50 text-violet-800 text-[8px] font-black uppercase inline-flex items-center gap-1.5"><i data-lucide="folder-search" class="w-4 h-4"></i>Cerca file</button>
      <button type="button" ${value?'':'disabled'} onclick="window.SafetyRientroEvidence.open('${esc(value)}')" class="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-[8px] font-black uppercase disabled:opacity-40 inline-flex items-center gap-1.5"><i data-lucide="folder-open" class="w-4 h-4"></i>Apri</button>
      <button type="button" ${value?'':'disabled'} onclick="window.SafetyRientroEvidence.verify('${esc(value)}')" class="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-[8px] font-black uppercase disabled:opacity-40 inline-flex items-center gap-1.5"><i data-lucide="badge-check" class="w-4 h-4"></i>Verifica</button>
      <span class="px-2.5 py-2 rounded-xl bg-${tone}-50 border border-${tone}-200 text-${tone}-700 text-[8px] font-black uppercase max-w-full truncate">${esc(label)}</span>`;
  }

  async function decorate(){
    if(busy) return;
    const projectId=currentProjectId(), list=rows();
    if(!projectId||!list.length) return;
    busy=true;
    try{
      const map=await completionMap(projectId);
      list.forEach(row=>{const id=identity(row);if(id)inject(row,id,map.get(key(id.itemKey,id.enrollmentId))||null);});
      if(window.lucide) window.lucide.createIcons();
    }catch(error){console.warn('Rientro evidenze: decorazione non riuscita',error);}
    finally{busy=false;}
  }

  async function waitForField(timeout=3000){
    const started=Date.now();
    while(Date.now()-started<timeout){
      const field=document.getElementById('step67-evidence-url');
      if(field) return field;
      await new Promise(r=>setTimeout(r,50));
    }
    return null;
  }

  async function pick(itemKey,enrollmentId){
    const projectId=currentProjectId();
    if(!projectId||!window.apriStep67ItemEditor||!window.SafetyLocalEvidence?.chooseForField) return;
    const temp=document.createElement('input');
    temp.type='text';
    temp.hidden=true;
    document.body.appendChild(temp);
    try{
      // Il file picker parte direttamente dal click: necessario per i permessi browser.
      await window.SafetyLocalEvidence.chooseForField(temp);
      const selected=temp.value;
      if(!selected) return;
      await window.apriStep67ItemEditor(projectId,itemKey,enrollmentId||'');
      const field=await waitForField();
      if(!field) throw new Error('Editor evidenza non disponibile.');
      field.value=selected;
      field.dispatchEvent(new Event('input',{bubbles:true}));
      field.dispatchEvent(new Event('change',{bubbles:true}));
      const mode=document.getElementById('step67-mode');
      const activity=document.getElementById('step67-activity');
      const recording=document.getElementById('step67-recording');
      const evidence=document.getElementById('step67-evidence');
      if(mode?.value==='not_applicable') mode.value='paper';
      if(activity) activity.value='completed';
      if(recording) recording.value='recorded';
      if(evidence) evidence.value='scan_available';
      if(window.salvaStep67ItemEditor) await window.salvaStep67ItemEditor();
      if(window.SafetyRientroDocumenti?.loadProject) await window.SafetyRientroDocumenti.loadProject(projectId);
      if(window.SafetyRientroDocumenti?.setStatus) await window.SafetyRientroDocumenti.setStatus(itemKey,enrollmentId||null,'scanned');
    }catch(error){
      if(error?.name!=='AbortError') console.warn('Rientro evidenze: selezione non riuscita',error);
    }finally{
      temp.remove();
    }
  }

  function pseudoField(value){return {value:String(value||'')};}
  function open(value){window.SafetyLocalEvidence?.openForField?.(pseudoField(value));}
  function verify(value){window.SafetyLocalEvidence?.verifyField?.(pseudoField(value));}

  let scheduled=false;
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;decorate();});}
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  schedule();

  window.SafetyRientroEvidence={decorate:schedule,pick,open,verify};
})();
