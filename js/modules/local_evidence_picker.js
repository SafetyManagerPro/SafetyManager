// Evidenze locali: collega file presenti sul PC senza upload e senza cartella obbligatoria.
(function(){
  if(window.__safetyLocalEvidencePickerLoaded) return;
  window.__safetyLocalEvidencePickerLoaded=true;

  const DB_NAME='safetymanager-local-evidence';
  const STORE='handles';
  const PREFIX='local-evidence://';

  const toast=(message,type='info',title='Evidenza locale')=>{
    if(typeof window.showSafetyToast==='function') window.showSafetyToast(message,{type,title});
    else alert(message);
  };

  const uid=()=>window.crypto?.randomUUID?.()||`loc-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const formatBytes=n=>{
    const x=Number(n||0); if(!x) return 'dimensione n/d';
    const units=['B','KB','MB','GB']; let v=x,i=0;
    while(v>=1024&&i<units.length-1){v/=1024;i++;}
    return `${v>=10||i===0?v.toFixed(0):v.toFixed(1)} ${units[i]}`;
  };

  function openDb(){
    return new Promise((resolve,reject)=>{
      if(!window.indexedDB) return reject(new Error('Archivio locale del browser non disponibile.'));
      const req=indexedDB.open(DB_NAME,1);
      req.onupgradeneeded=()=>{
        const db=req.result;
        if(!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE,{keyPath:'token'});
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||new Error('Impossibile aprire archivio locale.'));
    });
  }

  async function putRecord(record){
    const db=await openDb();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).put(record);
      tx.oncomplete=()=>{db.close();resolve(record);};
      tx.onerror=()=>{const e=tx.error;db.close();reject(e);};
    });
  }

  async function getRecord(token){
    try{
      const db=await openDb();
      return await new Promise((resolve,reject)=>{
        const tx=db.transaction(STORE,'readonly');
        const req=tx.objectStore(STORE).get(token);
        req.onsuccess=()=>resolve(req.result||null);
        req.onerror=()=>reject(req.error);
        tx.oncomplete=()=>db.close();
      });
    }catch(_e){ return null; }
  }

  function makeRef(token,file){
    const name=encodeURIComponent(file?.name||'file');
    const q=new URLSearchParams({size:String(file?.size||0),type:file?.type||'',modified:String(file?.lastModified||0)});
    return `${PREFIX}${token}/${name}?${q.toString()}`;
  }

  function parseRef(value){
    const raw=String(value||'').trim();
    if(!raw.startsWith(PREFIX)) return null;
    try{
      const u=new URL(raw);
      const name=decodeURIComponent(u.pathname.replace(/^\//,''))||'file';
      return {raw,token:u.hostname,name,size:Number(u.searchParams.get('size')||0),type:u.searchParams.get('type')||'',modified:Number(u.searchParams.get('modified')||0)};
    }catch(_e){ return null; }
  }

  function setField(field,value){
    field.value=value;
    field.dispatchEvent(new Event('input',{bubbles:true}));
    field.dispatchEvent(new Event('change',{bubbles:true}));
    if(field.id==='step67-evidence-url'){
      const select=document.getElementById('step67-evidence');
      if(select&&['none','paper_original'].includes(select.value)){
        select.value='scan_available';
        select.dispatchEvent(new Event('change',{bubbles:true}));
      }
    }
    refreshOne(field);
  }

  async function chooseFallback(field){
    const input=document.createElement('input');
    input.type='file';
    input.style.display='none';
    document.body.appendChild(input);
    input.onchange=async()=>{
      const file=input.files?.[0];
      input.remove();
      if(!file) return;
      const token=uid();
      await putRecord({token,name:file.name,size:file.size,type:file.type,lastModified:file.lastModified,createdAt:new Date().toISOString(),handle:null,fallback:true});
      setField(field,makeRef(token,file));
      toast(`Riferimento a “${file.name}” registrato. Questo browser non consente di riaprire automaticamente il file dopo la chiusura della sessione.`,'ok');
    };
    input.click();
  }

  async function chooseForField(field){
    try{
      if(typeof window.showOpenFilePicker==='function'){
        const handles=await window.showOpenFilePicker({multiple:false});
        const handle=handles?.[0]; if(!handle) return;
        const file=await handle.getFile();
        const token=uid();
        await putRecord({token,name:file.name,size:file.size,type:file.type,lastModified:file.lastModified,createdAt:new Date().toISOString(),handle,fallback:false});
        setField(field,makeRef(token,file));
        toast(`“${file.name}” collegato. Il file resta sul PC e non viene caricato su SafetyManager.`,'ok');
        return;
      }
      await chooseFallback(field);
    }catch(e){
      if(e?.name==='AbortError') return;
      toast(e?.message||String(e),'error');
    }
  }

  async function requestRead(handle){
    if(!handle) return false;
    if(typeof handle.queryPermission!=='function') return true;
    let p=await handle.queryPermission({mode:'read'});
    if(p==='granted') return true;
    if(typeof handle.requestPermission==='function') p=await handle.requestPermission({mode:'read'});
    return p==='granted';
  }

  async function openForField(field){
    const ref=parseRef(field?.value);
    if(!ref){
      const raw=String(field?.value||'').trim();
      if(/^https?:\/\//i.test(raw)){ window.open(raw,'_blank','noopener'); return; }
      toast(raw?'È un percorso/riferimento manuale: SafetyManager non può aprirlo direttamente dal browser.':'Nessuna evidenza indicata.','info');
      return;
    }
    const record=await getRecord(ref.token);
    if(!record?.handle){
      toast(`L’evidenza “${ref.name}” è registrata, ma il file non è disponibile in questo browser/PC. Aprilo dal PC sul quale è stato collegato.`,'info');
      return;
    }
    try{
      if(!await requestRead(record.handle)) throw new Error('Permesso di lettura non concesso.');
      const file=await record.handle.getFile();
      const url=URL.createObjectURL(file);
      window.open(url,'_blank','noopener');
      setTimeout(()=>URL.revokeObjectURL(url),120000);
    }catch(e){ toast(`File locale non accessibile: ${e?.message||e}`,'error'); }
  }

  async function verifyField(field){
    const ref=parseRef(field?.value);
    if(!ref){ toast(String(field?.value||'').trim()?'Riferimento manuale presente. La presenza fisica va verificata sul PC.':'Nessuna evidenza indicata.','info'); return; }
    const record=await getRecord(ref.token);
    if(!record?.handle){ toast(`“${ref.name}” risulta registrato, ma non è verificabile da questo PC/browser.`,'info'); return; }
    try{
      if(!await requestRead(record.handle)) throw new Error('Permesso di lettura non concesso.');
      const file=await record.handle.getFile();
      toast(`File presente: ${file.name} · ${formatBytes(file.size)}.`,'ok');
    }catch(e){ toast(`Riferimento registrato, ma il file non è più accessibile da questa posizione.`,'error'); }
  }

  function candidateFields(){
    const set=new Set();
    const direct=['#step67-evidence-url','[data-safety-evidence-path="1"]','input[id*="evidence"][type="text"]','input[name*="evidence"][type="text"]','input[id*="evidenza"][type="text"]','input[name*="evidenza"][type="text"]'];
    direct.forEach(sel=>document.querySelectorAll(sel).forEach(el=>set.add(el)));
    document.querySelectorAll('label').forEach(label=>{
      const text=String(label.textContent||'').toLowerCase();
      if(/link o percorso evidenza|percorso evidenza|link evidenza/.test(text)){
        const field=label.querySelector('input:not([type="hidden"]),textarea'); if(field) set.add(field);
      }
    });
    return [...set].filter(el=>el instanceof HTMLInputElement||el instanceof HTMLTextAreaElement);
  }

  async function refreshOne(field){
    const toolbar=field.parentElement?.querySelector?.(`.safety-local-evidence-tools[data-for="${CSS.escape(field.dataset.safetyEvidenceKey||'')}"]`);
    if(!toolbar) return;
    const status=toolbar.querySelector('[data-local-evidence-status]');
    const open=toolbar.querySelector('[data-local-evidence-open]');
    const verify=toolbar.querySelector('[data-local-evidence-verify]');
    const ref=parseRef(field.value);
    if(!ref){
      if(status) status.textContent=String(field.value||'').trim()?'Percorso/riferimento manuale':'Nessuna evidenza collegata';
      if(open) open.disabled=!String(field.value||'').trim();
      if(verify) verify.disabled=!String(field.value||'').trim();
      return;
    }
    const record=await getRecord(ref.token);
    if(status) status.textContent=`${ref.name} · ${formatBytes(ref.size)} · ${record?.handle?'apribile su questo PC':'registrata su altro PC/browser'}`;
    if(open) open.disabled=false;
    if(verify) verify.disabled=false;
  }

  function decorateField(field){
    if(field.dataset.safetyLocalEvidence==='1') return;
    field.dataset.safetyLocalEvidence='1';
    field.dataset.safetyEvidenceKey=field.id||field.name||uid();
    const box=document.createElement('div');
    box.className='safety-local-evidence-tools mt-2 flex flex-wrap items-center gap-2';
    box.dataset.for=field.dataset.safetyEvidenceKey;
    box.innerHTML=`
      <button type="button" data-local-evidence-pick class="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-[9px] font-black uppercase inline-flex items-center gap-1.5"><i data-lucide="folder-search" class="w-4 h-4"></i>Cerca file</button>
      <button type="button" data-local-evidence-open class="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-[9px] font-black uppercase inline-flex items-center gap-1.5"><i data-lucide="folder-open" class="w-4 h-4"></i>Apri</button>
      <button type="button" data-local-evidence-verify class="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-[9px] font-black uppercase inline-flex items-center gap-1.5"><i data-lucide="badge-check" class="w-4 h-4"></i>Verifica</button>
      <span data-local-evidence-status class="text-[10px] font-semibold text-slate-500 normal-case tracking-normal"></span>`;
    field.insertAdjacentElement('afterend',box);
    box.querySelector('[data-local-evidence-pick]').onclick=()=>chooseForField(field);
    box.querySelector('[data-local-evidence-open]').onclick=()=>openForField(field);
    box.querySelector('[data-local-evidence-verify]').onclick=()=>verifyField(field);
    field.addEventListener('input',()=>refreshOne(field));
    refreshOne(field);
    if(window.lucide) window.lucide.createIcons();
  }

  function decorate(){ candidateFields().forEach(decorateField); }
  let pending=false;
  function schedule(){ if(pending)return; pending=true; requestAnimationFrame(()=>{pending=false;decorate();}); }
  const obs=new MutationObserver(schedule);
  obs.observe(document.body,{childList:true,subtree:true});
  schedule();

  window.SafetyLocalEvidence={decorate:schedule,chooseForField,openForField,verifyField,parseRef,getRecord};
})();
