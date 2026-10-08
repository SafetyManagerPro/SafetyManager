// Anteprima locale per PDF e immagini: nessun upload, il file resta sul PC.
(function(){
  if(window.__safetyLocalEvidencePreviewLoaded) return;
  window.__safetyLocalEvidencePreviewLoaded=true;

  const OVERLAY_ID='safety-local-evidence-preview-overlay';
  const STYLE_ID='safety-local-evidence-preview-style';
  let activeUrl=null;

  const toast=(message,type='info',title='Evidenza locale')=>{
    if(typeof window.showSafetyToast==='function') window.showSafetyToast(message,{type,title});
    else alert(message);
  };

  const formatBytes=n=>{
    const x=Number(n||0); if(!x) return 'dimensione n/d';
    const units=['B','KB','MB','GB']; let v=x,i=0;
    while(v>=1024&&i<units.length-1){v/=1024;i++;}
    return `${v>=10||i===0?v.toFixed(0):v.toFixed(1)} ${units[i]}`;
  };

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      #${OVERLAY_ID}{position:fixed;inset:0;z-index:2147483200;background:rgba(15,23,42,.58);display:flex;align-items:center;justify-content:center;padding:18px;backdrop-filter:blur(2px)}
      #${OVERLAY_ID} .safety-local-preview-dialog{width:min(1120px,96vw);height:min(900px,92vh);background:#fff;border:1px solid #dfe4e1;border-radius:22px;box-shadow:0 28px 80px rgba(15,23,42,.30);display:flex;flex-direction:column;overflow:hidden}
      #${OVERLAY_ID} .safety-local-preview-header{display:flex;align-items:center;gap:12px;padding:13px 16px;border-bottom:1px solid #e5e7eb;background:#fff}
      #${OVERLAY_ID} .safety-local-preview-title{min-width:0;flex:1}
      #${OVERLAY_ID} .safety-local-preview-name{font-size:13px;font-weight:800;color:#1f2937;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #${OVERLAY_ID} .safety-local-preview-meta{margin-top:2px;font-size:10px;font-weight:600;color:#64748b}
      #${OVERLAY_ID} .safety-local-preview-action{display:inline-flex;align-items:center;gap:6px;padding:8px 10px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;color:#334155;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;cursor:pointer}
      #${OVERLAY_ID} .safety-local-preview-action:hover{background:#f8fafc}
      #${OVERLAY_ID} .safety-local-preview-close{width:36px;height:36px;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:10px;background:#f1f5f9;color:#334155;cursor:pointer}
      #${OVERLAY_ID} .safety-local-preview-close:hover{background:#e2e8f0}
      #${OVERLAY_ID} .safety-local-preview-body{flex:1;min-height:0;background:#f4f5f2;display:flex;align-items:center;justify-content:center;overflow:auto}
      #${OVERLAY_ID} .safety-local-preview-body iframe{width:100%;height:100%;border:0;background:#fff}
      #${OVERLAY_ID} .safety-local-preview-body img{display:block;max-width:100%;max-height:100%;object-fit:contain;margin:auto;padding:14px}
      @media(max-width:640px){#${OVERLAY_ID}{padding:8px}#${OVERLAY_ID} .safety-local-preview-dialog{width:100%;height:96vh;border-radius:16px}#${OVERLAY_ID} .safety-local-preview-action span{display:none}}
      @media print{#${OVERLAY_ID}{display:none!important}}
    `;
    document.head.appendChild(style);
  }

  function revokeActiveUrl(){
    if(!activeUrl) return;
    try{ URL.revokeObjectURL(activeUrl); }catch(_e){}
    activeUrl=null;
  }

  function closePreview(){
    document.getElementById(OVERLAY_ID)?.remove();
    revokeActiveUrl();
  }

  function previewKind(value){
    const type=String(value?.type||'').toLowerCase();
    const name=String(value?.name||'').toLowerCase();
    if(type==='application/pdf'||/\.pdf$/i.test(name)) return 'pdf';
    if(type.startsWith('image/')&&!type.includes('svg')) return 'image';
    if(/\.(png|jpe?g|gif|webp|bmp)$/i.test(name)) return 'image';
    return null;
  }

  function buildPreview(file){
    const kind=previewKind(file);
    if(!kind) return false;
    ensureStyle();
    closePreview();
    activeUrl=URL.createObjectURL(file);

    const overlay=document.createElement('div');
    overlay.id=OVERLAY_ID;
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label',`Anteprima ${file.name||'evidenza locale'}`);
    overlay.innerHTML=`
      <div class="safety-local-preview-dialog">
        <div class="safety-local-preview-header">
          <i data-lucide="eye" class="w-5 h-5 text-slate-500 shrink-0"></i>
          <div class="safety-local-preview-title">
            <div class="safety-local-preview-name"></div>
            <div class="safety-local-preview-meta"></div>
          </div>
          <button type="button" class="safety-local-preview-action" data-preview-external title="Apri in una nuova scheda"><i data-lucide="external-link" class="w-4 h-4"></i><span>Nuova scheda</span></button>
          <button type="button" class="safety-local-preview-close" data-preview-close aria-label="Chiudi anteprima" title="Chiudi"><i data-lucide="x" class="w-5 h-5"></i></button>
        </div>
        <div class="safety-local-preview-body"></div>
      </div>`;

    overlay.querySelector('.safety-local-preview-name').textContent=file.name||'Evidenza locale';
    overlay.querySelector('.safety-local-preview-meta').textContent=`${kind==='pdf'?'PDF':'Immagine'} · ${formatBytes(file.size)}`;
    const body=overlay.querySelector('.safety-local-preview-body');
    if(kind==='pdf'){
      const frame=document.createElement('iframe');
      frame.src=activeUrl;
      frame.title=`Anteprima ${file.name||'PDF'}`;
      body.appendChild(frame);
    }else{
      const img=document.createElement('img');
      img.src=activeUrl;
      img.alt=`Anteprima ${file.name||'immagine'}`;
      body.appendChild(img);
    }

    overlay.querySelector('[data-preview-close]').onclick=closePreview;
    overlay.querySelector('[data-preview-external]').onclick=()=>window.open(activeUrl,'_blank','noopener');
    overlay.addEventListener('click',e=>{ if(e.target===overlay) closePreview(); });
    document.body.appendChild(overlay);
    if(window.lucide) window.lucide.createIcons();
    overlay.querySelector('[data-preview-close]')?.focus();
    return true;
  }

  async function requestRead(handle){
    if(!handle) return false;
    if(typeof handle.queryPermission!=='function') return true;
    let permission=await handle.queryPermission({mode:'read'});
    if(permission==='granted') return true;
    if(typeof handle.requestPermission==='function') permission=await handle.requestPermission({mode:'read'});
    return permission==='granted';
  }

  function fieldForButton(button){
    const box=button?.closest?.('.safety-local-evidence-tools');
    const key=box?.dataset?.for;
    if(!key) return null;
    return [...document.querySelectorAll('[data-safety-evidence-key]')].find(field=>field.dataset.safetyEvidenceKey===key)||null;
  }

  async function openLocalEvidence(field){
    const api=window.SafetyLocalEvidence;
    if(!api?.parseRef||!api?.getRecord){
      toast('Gestione evidenze locali non ancora disponibile.','error');
      return;
    }

    const raw=String(field?.value||'').trim();
    const ref=api.parseRef(raw);
    if(!ref){
      if(/^https?:\/\//i.test(raw)){ window.open(raw,'_blank','noopener'); return; }
      toast(raw?'È un percorso/riferimento manuale: il browser non può aprirlo direttamente.':'Nessuna evidenza indicata.','info');
      return;
    }

    // Per formati non visualizzabili internamente preapriamo la scheda durante il click,
    // così i browser con blocco popup consentono comunque l'apertura dopo il controllo permessi.
    const expectedKind=previewKind(ref);
    const externalWindow=expectedKind?null:window.open('about:blank','_blank');

    try{
      const record=await api.getRecord(ref.token);
      if(!record?.handle){
        externalWindow?.close();
        toast(`L’evidenza “${ref.name}” è registrata, ma il file non è disponibile in questo browser/PC. Aprilo dal PC sul quale è stato collegato.`,'info');
        return;
      }
      if(!await requestRead(record.handle)) throw new Error('Permesso di lettura non concesso.');
      const file=await record.handle.getFile();

      if(buildPreview(file)){
        externalWindow?.close();
        return;
      }

      const url=URL.createObjectURL(file);
      if(externalWindow) externalWindow.location.href=url;
      else window.open(url,'_blank','noopener');
      setTimeout(()=>URL.revokeObjectURL(url),120000);
      toast('Questo formato non ha un’anteprima interna: il file è stato aperto normalmente.','info');
    }catch(e){
      externalWindow?.close();
      toast(`File locale non accessibile: ${e?.message||e}`,'error');
    }
  }

  document.addEventListener('click',e=>{
    const button=e.target?.closest?.('[data-local-evidence-open]');
    if(!button) return;
    const field=fieldForButton(button);
    if(!field) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    openLocalEvidence(field);
  },true);

  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&document.getElementById(OVERLAY_ID)){
      e.preventDefault();
      e.stopPropagation();
      closePreview();
    }
  },true);

  window.SafetyLocalEvidencePreview={openLocalEvidence,buildPreview,closePreview,previewKind};
})();
