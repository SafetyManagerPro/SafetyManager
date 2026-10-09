// Apertura documenti affidabile in PWA/mobile + riferimenti universali.
(function(){
  if(window.__safetyDocumentLinkGuardLoaded) return;
  window.__safetyDocumentLinkGuardLoaded=true;

  const esc=v=>window.dashEscape?window.dashEscape(v):String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const isLocalEvidence=v=>String(v||'').trim().startsWith('local-evidence://');
  const isLegacyLocal=v=>String(v||'').trim().startsWith('LOCAL_FILE::');
  const isWindowsPath=v=>/^[A-Za-z]:[\\/]/.test(String(v||'').trim());
  const isUncPath=v=>/^\\\\[^\\]+\\[^\\]+/.test(String(v||'').trim());
  const isUnixPath=v=>/^\/(?!\/)/.test(String(v||'').trim());
  const forbiddenScheme=v=>/^(?:javascript|vbscript):/i.test(String(v||'').trim());

  function classify(value=''){
    const raw=String(value||'').trim();
    if(!raw) return {kind:'empty',raw,href:''};
    if(isLocalEvidence(raw)) return {kind:'local',raw,href:raw};
    if(isLegacyLocal(raw)) return {kind:'legacy-local',raw,href:''};
    if(forbiddenScheme(raw)) return {kind:'manual',raw,href:''};
    if(isWindowsPath(raw)) return {kind:'file',raw,href:'file:///'+raw.replaceAll('\\','/')};
    if(isUncPath(raw)){
      const clean=raw.replace(/^\\\\/,'').replaceAll('\\','/');
      return {kind:'network',raw,href:'file://'+clean};
    }
    if(isUnixPath(raw)) return {kind:'file',raw,href:'file://'+raw};
    if(/^https:\/\//i.test(raw)) return {kind:'web-secure',raw,href:raw};
    if(/^http:\/\//i.test(raw)) return {kind:'web-insecure',raw,href:raw};
    if(/^(?:smb|afp|nfs|ftp|ftps|webdav):\/\//i.test(raw)) return {kind:'network',raw,href:raw};
    if(/^file:\/\//i.test(raw)) return {kind:'file',raw,href:raw};
    if(/^blob:/i.test(raw)) return {kind:'blob',raw,href:raw};
    if(/^data:image\//i.test(raw)) return {kind:'data',raw,href:raw};
    if(/^[a-z][a-z0-9+.-]*:/i.test(raw)) return {kind:'custom',raw,href:raw};
    if(raw.startsWith('//')) return {kind:'web-secure',raw,href:'https:'+raw};
    if(/^www\./i.test(raw)||/^[a-z0-9.-]+\.[a-z]{2,}(?:[/:?#]|$)/i.test(raw)) return {kind:'web-secure',raw,href:'https://'+raw};
    return {kind:'manual',raw,href:raw};
  }

  function normalize(value=''){
    return classify(value).href||'';
  }

  function toast(message,type='warning'){
    if(typeof window.showSafetyToast==='function'){
      window.showSafetyToast(message,{title:'Documento',type,icon:type==='ok'?'check-circle':'file-warning',duration:4200});
    }else alert(message);
  }

  function closeViewer(){
    document.getElementById('safety-document-viewer')?.remove();
    if(document.body){
      document.body.style.overflow=document.body.dataset.safetyDocPrevOverflow||'';
      delete document.body.dataset.safetyDocPrevOverflow;
    }
  }

  function externalOpen(href){
    if(!href||forbiddenScheme(href)) return false;
    try{
      const a=document.createElement('a');
      a.href=href;a.target='_blank';a.rel='noopener noreferrer';a.style.display='none';
      document.body.appendChild(a);a.click();a.remove();
      return true;
    }catch(_e){return false;}
  }

  async function copyText(value){
    try{
      if(navigator.clipboard?.writeText) await navigator.clipboard.writeText(String(value||''));
      else {
        const t=document.createElement('textarea');t.value=String(value||'');t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();
      }
      toast('Riferimento copiato.','ok');
      return true;
    }catch(_e){toast('Copia non riuscita. Seleziona il percorso manualmente.','warning');return false;}
  }

  function viewerBody(href){
    const clean=href.split(/[?#]/)[0].toLowerCase();
    if(/^data:image\//i.test(href)||/\.(png|jpe?g|webp|gif|svg|bmp)$/.test(clean)){
      return `<div style="flex:1;min-height:0;overflow:auto;background:#111827;display:flex;align-items:flex-start;justify-content:center;padding:18px"><img src="${esc(href)}" alt="Documento" style="max-width:100%;height:auto;background:white;border-radius:8px"></div>`;
    }
    return `<iframe src="${esc(href)}" title="Visualizzatore documento" style="display:block;width:100%;flex:1;min-height:0;border:0;background:white" referrerpolicy="no-referrer"></iframe>`;
  }

  function createShell(label,reference,bodyHtml,actionsHtml=''){
    closeViewer();
    const overlay=document.createElement('div');
    overlay.id='safety-document-viewer';
    overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label',String(label||'Documento'));
    overlay.style.cssText='position:fixed;inset:0;z-index:250000;background:rgba(15,23,42,.82);display:flex;align-items:stretch;justify-content:center;padding:max(10px,env(safe-area-inset-top)) 10px max(10px,env(safe-area-inset-bottom));';
    overlay.innerHTML=`<div style="width:min(1120px,100%);height:100%;background:#fff;border-radius:18px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,.35)">
      <div style="min-height:58px;display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid #e2e8f0;background:#fff">
        <div style="min-width:0;flex:1"><div style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:#0f172a">${esc(label||'Documento')}</div><div style="font-size:10px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(reference||'')}</div></div>
        ${actionsHtml}
        <button type="button" data-safety-doc-close aria-label="Chiudi documento" style="border:0;background:#0f172a;color:#fff;border-radius:10px;width:38px;height:38px;font-size:20px;line-height:1">×</button>
      </div>${bodyHtml}</div>`;
    overlay.querySelector('[data-safety-doc-close]').onclick=closeViewer;
    overlay.addEventListener('click',e=>{if(e.target===overlay) closeViewer();});
    if(document.body){document.body.dataset.safetyDocPrevOverflow=document.body.style.overflow||'';document.body.style.overflow='hidden';document.body.appendChild(overlay);}
    return overlay;
  }

  function openWebViewer(href,label){
    const actions=`<button type="button" data-safety-doc-copy style="border:1px solid #cbd5e1;background:#fff;border-radius:10px;padding:8px 10px;font-size:10px;font-weight:800;color:#334155">Copia</button><button type="button" data-safety-doc-external style="border:1px solid #cbd5e1;background:#fff;border-radius:10px;padding:8px 10px;font-size:10px;font-weight:800;color:#334155">Apri fuori</button>`;
    const overlay=createShell(label,href,viewerBody(href),actions);
    overlay.querySelector('[data-safety-doc-external]').onclick=()=>externalOpen(href);
    overlay.querySelector('[data-safety-doc-copy]').onclick=()=>copyText(href);
    return true;
  }

  function openReferencePanel(info,label){
    const reference=info.raw||info.href||'';
    const actions=`<button type="button" data-safety-doc-copy style="border:1px solid #cbd5e1;background:#fff;border-radius:10px;padding:8px 10px;font-size:10px;font-weight:800;color:#334155">Copia</button>${info.href?'<button type="button" data-safety-doc-external style="border:1px solid #cbd5e1;background:#fff;border-radius:10px;padding:8px 10px;font-size:10px;font-weight:800;color:#334155">Apri con sistema</button>':''}`;
    const body=`<div style="flex:1;min-height:0;background:#f8fafc;display:flex;align-items:center;justify-content:center;padding:24px"><div style="width:min(760px,100%);background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:22px;box-shadow:0 10px 35px rgba(15,23,42,.08)"><div style="font-size:12px;font-weight:900;color:#0f172a;text-transform:uppercase">Riferimento esterno / di rete</div><p style="font-size:11px;line-height:1.5;color:#475569;margin:8px 0 12px">SafetyManager conserva questo riferimento. L'apertura dipende dal dispositivo, dal browser e dall'accesso alla rete o al server. Se il browser la blocca, usa “Copia” e aprilo dal sistema operativo.</p><div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;word-break:break-all;background:#f1f5f9;border-radius:12px;padding:12px;color:#0f172a">${esc(reference)}</div></div></div>`;
    const overlay=createShell(label,reference,body,actions);
    overlay.querySelector('[data-safety-doc-copy]').onclick=()=>copyText(reference);
    overlay.querySelector('[data-safety-doc-external]')?.addEventListener('click',()=>externalOpen(info.href));
    return true;
  }

  function openLocalEvidence(raw){
    const field={value:raw};
    if(window.SafetyLocalEvidencePreview?.openLocalEvidence){window.SafetyLocalEvidencePreview.openLocalEvidence(field);return true;}
    if(window.SafetyLocalEvidence?.openForField){window.SafetyLocalEvidence.openForField(field);return true;}
    toast('File locale registrato, ma il gestore locale non è disponibile.','warning');
    return false;
  }

  function openDocument(raw,label='Documento'){
    const info=classify(raw);
    if(info.kind==='empty'){toast('Nessun collegamento documentale disponibile.');return false;}
    if(info.kind==='legacy-local'){
      const name=info.raw.slice('LOCAL_FILE::'.length)||'file locale';
      toast(`“${name}” è un vecchio riferimento locale senza accesso persistente. Ricollega il file con “File locale”.`);
      return false;
    }
    if(info.kind==='local') return openLocalEvidence(info.raw);
    if(info.kind==='web-secure'||info.kind==='blob'||info.kind==='data') return openWebViewer(info.href,label);
    if(info.kind==='web-insecure'){
      // Da una PWA HTTPS un iframe HTTP può essere bloccato come mixed content.
      return openReferencePanel(info,label);
    }
    return openReferencePanel(info,label);
  }

  window.normalizzaDocumentoHref=normalize;
  window.getDocumentoLinkHtml=function(url,label='Documento'){
    if(!url) return '<span class="text-slate-400 italic text-[9px]">Nessun documento</span>';
    const raw=String(url||'').trim();
    const safeLabel=esc(label);
    const info=classify(raw);
    const local=info.kind==='local'||info.kind==='legacy-local';
    const network=info.kind==='network'||info.kind==='file'||info.kind==='custom'||info.kind==='manual'||info.kind==='web-insecure';
    const tone=local?'amber':network?'violet':'blue';
    const icon=local?'hard-drive':network?'network':'external-link';
    const suffix=info.kind==='local'?' · locale':info.kind==='network'||info.kind==='file'?' · rete':'';
    return `<button type="button" data-safety-document-url="${esc(raw)}" data-safety-document-label="${safeLabel}" class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-${tone}-50 hover:bg-${tone}-100 text-${tone}-700 border border-${tone}-200 font-black text-[8px] uppercase" title="${esc(raw)}"><i data-lucide="${icon}" class="w-3 h-3"></i>${safeLabel}${esc(suffix)}</button>`;
  };

  document.addEventListener('click',e=>{
    const trigger=e.target?.closest?.('[data-safety-document-url]');
    if(trigger){e.preventDefault();e.stopPropagation();openDocument(trigger.dataset.safetyDocumentUrl,trigger.dataset.safetyDocumentLabel||'Documento');return;}
    const a=e.target?.closest?.('a[href]');
    if(!a) return;
    const href=a.getAttribute('href')||'';
    if(!/\/storage\/v1\/object\//i.test(href)) return;
    e.preventDefault();e.stopPropagation();openDocument(href,a.textContent?.trim()||'Documento');
  },true);

  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&document.getElementById('safety-document-viewer')){e.preventDefault();closeViewer();}
  });

  window.SafetyDocumentLinks={normalize,classify,open:openDocument,close:closeViewer,externalOpen,copy:copyText};
})();
