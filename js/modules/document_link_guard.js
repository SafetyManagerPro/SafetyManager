// Apertura documenti affidabile in PWA/mobile + normalizzazione link.
(function(){
  if(window.__safetyDocumentLinkGuardLoaded) return;
  window.__safetyDocumentLinkGuardLoaded=true;

  const esc=v=>window.dashEscape?window.dashEscape(v):String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const isLocalRef=v=>String(v||'').trim().startsWith('LOCAL_FILE::');
  const isWindowsPath=v=>/^[A-Za-z]:[\\/]/.test(String(v||'').trim());

  function normalize(value=''){
    const v=String(value||'').trim();
    if(!v||isLocalRef(v)) return '';
    if(isWindowsPath(v)) return 'file:///'+v.replaceAll('\\','/');
    if(v.startsWith('//')) return 'https:'+v;
    if(/^(https?:|file:|blob:|data:)/i.test(v)) return v;
    if(/^www\./i.test(v)||/^[a-z0-9.-]+\.[a-z]{2,}(?:[/:?#]|$)/i.test(v)) return 'https://'+v;
    return v;
  }

  function toast(message,type='warning'){
    if(typeof window.showSafetyToast==='function'){
      window.showSafetyToast(message,{title:'Documento',type,icon:type==='ok'?'check-circle':'file-warning',duration:4200});
    }else{
      alert(message);
    }
  }

  function closeViewer(){
    document.getElementById('safety-document-viewer')?.remove();
    document.body.style.overflow=document.body.dataset.safetyDocPrevOverflow||'';
    delete document.body.dataset.safetyDocPrevOverflow;
  }

  function externalOpen(href){
    if(!href) return;
    const a=document.createElement('a');
    a.href=href;
    a.target='_blank';
    a.rel='noopener noreferrer';
    a.style.display='none';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function viewerBody(href){
    const clean=href.split(/[?#]/)[0].toLowerCase();
    if(/\.(png|jpe?g|webp|gif|svg)$/.test(clean)){
      return `<div style="flex:1;min-height:0;overflow:auto;background:#111827;display:flex;align-items:flex-start;justify-content:center;padding:18px"><img src="${esc(href)}" alt="Documento" style="max-width:100%;height:auto;background:white;border-radius:8px"></div>`;
    }
    return `<iframe src="${esc(href)}" title="Visualizzatore documento" style="display:block;width:100%;flex:1;min-height:0;border:0;background:white" referrerpolicy="no-referrer"></iframe>`;
  }

  function openDocument(raw,label='Documento'){
    const value=String(raw||'').trim();
    if(!value){toast('Nessun collegamento documentale disponibile.');return false;}
    if(isLocalRef(value)){
      const name=value.slice('LOCAL_FILE::'.length)||'file locale';
      toast(`“${name}” è stato registrato solo come nome file locale e non può essere riaperto dal browser. Ricollega il file oppure inserisci un URL accessibile.`);
      return false;
    }

    const href=normalize(value);
    if(!href){toast('Collegamento documento non valido.');return false;}
    if(/^file:/i.test(href)){
      toast('I browser e le PWA non possono aprire in modo affidabile percorsi file locali. Usa un link HTTPS oppure ricollega il documento.');
      return false;
    }
    if(!/^https?:/i.test(href)){
      externalOpen(href);
      return true;
    }

    closeViewer();
    const overlay=document.createElement('div');
    overlay.id='safety-document-viewer';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label',String(label||'Documento'));
    overlay.style.cssText='position:fixed;inset:0;z-index:250000;background:rgba(15,23,42,.82);display:flex;align-items:stretch;justify-content:center;padding:max(10px,env(safe-area-inset-top)) 10px max(10px,env(safe-area-inset-bottom));';
    overlay.innerHTML=`
      <div style="width:min(1120px,100%);height:100%;background:#fff;border-radius:18px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,.35)">
        <div style="min-height:58px;display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid #e2e8f0;background:#fff">
          <div style="min-width:0;flex:1">
            <div style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:#0f172a">${esc(label||'Documento')}</div>
            <div style="font-size:10px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(href)}</div>
          </div>
          <button type="button" data-safety-doc-external style="border:1px solid #cbd5e1;background:#fff;border-radius:10px;padding:8px 10px;font-size:10px;font-weight:800;color:#334155">Apri fuori</button>
          <button type="button" data-safety-doc-close aria-label="Chiudi documento" style="border:0;background:#0f172a;color:#fff;border-radius:10px;width:38px;height:38px;font-size:20px;line-height:1">×</button>
        </div>
        ${viewerBody(href)}
      </div>`;

    overlay.querySelector('[data-safety-doc-close]').onclick=closeViewer;
    overlay.querySelector('[data-safety-doc-external]').onclick=()=>externalOpen(href);
    overlay.addEventListener('click',e=>{if(e.target===overlay) closeViewer();});
    document.body.dataset.safetyDocPrevOverflow=document.body.style.overflow||'';
    document.body.style.overflow='hidden';
    document.body.appendChild(overlay);
    return true;
  }

  // Sostituisce il renderer storico: evita target=_blank come unico meccanismo,
  // problematico in alcune PWA iOS, e mantiene lo stesso aspetto dei badge esistenti.
  window.normalizzaDocumentoHref=normalize;
  window.getDocumentoLinkHtml=function(url,label='Documento'){
    if(!url) return '<span class="text-slate-400 italic text-[9px]">Nessun documento</span>';
    const raw=String(url||'').trim();
    const safeLabel=esc(label);
    if(isLocalRef(raw)){
      const fileName=raw.slice('LOCAL_FILE::'.length);
      return `<button type="button" data-safety-document-url="${esc(raw)}" data-safety-document-label="${safeLabel}" class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-black text-[8px] uppercase" title="${esc(fileName)}"><i data-lucide="hard-drive" class="w-3 h-3"></i>${safeLabel}: locale</button>`;
    }
    return `<button type="button" data-safety-document-url="${esc(raw)}" data-safety-document-label="${safeLabel}" class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-black text-[8px] uppercase" title="${esc(raw)}"><i data-lucide="external-link" class="w-3 h-3"></i>${safeLabel}</button>`;
  };

  document.addEventListener('click',e=>{
    const trigger=e.target?.closest?.('[data-safety-document-url]');
    if(trigger){
      e.preventDefault();
      e.stopPropagation();
      openDocument(trigger.dataset.safetyDocumentUrl,trigger.dataset.safetyDocumentLabel||'Documento');
      return;
    }

    // Recupera anche i link documentali già renderizzati prima del caricamento del modulo.
    const a=e.target?.closest?.('a[href]');
    if(!a) return;
    const href=a.getAttribute('href')||'';
    if(!/\/storage\/v1\/object\//i.test(href)) return;
    e.preventDefault();
    e.stopPropagation();
    openDocument(href,a.textContent?.trim()||'Documento');
  },true);

  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&document.getElementById('safety-document-viewer')){
      e.preventDefault();
      closeViewer();
    }
  });

  window.SafetyDocumentLinks={normalize,open:openDocument,close:closeViewer,externalOpen};
})();
