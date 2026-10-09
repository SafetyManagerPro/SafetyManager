// Guida visiva non invasiva per la compilazione delle stampe.
// Vincolo: non modifica dimensioni, flusso o orientamento delle pagine; attestati esclusi.
(function(){
  if(window.__safetyPrintCompletionCuesLoaded) return;
  window.__safetyPrintCompletionCuesLoaded=true;

  const STYLE_ID='safety-print-completion-cues-style';
  const SIGN_RE=/\bfirma\b/i;
  const DECL_RE=/(dichiarazione|autocertificazione|organismo paritetico|verbale|validazione|attrezzature)/i;
  const TEST_RE=/(test|verifica finale|esame)/i;
  const REGISTER_RE=/registro presenze/i;
  const QUALITY_RE=/(questionario.*gradimento|gradimento|riesame)/i;

  const injectStyle=()=>{
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      .safety-sign-cue-anchor,
      .safety-sign-cue-cell,
      .safety-sign-cue-label{position:relative!important}
      .safety-sign-cue{
        position:absolute!important;
        z-index:6!important;
        width:3mm!important;
        height:3mm!important;
        min-width:3mm!important;
        min-height:3mm!important;
        border-radius:999px!important;
        background:#16a34a!important;
        color:#fff!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        font-family:Arial,sans-serif!important;
        font-size:6px!important;
        line-height:1!important;
        font-weight:900!important;
        box-shadow:none!important;
        pointer-events:none!important;
        margin:0!important;
        padding:0!important;
        box-sizing:border-box!important;
        overflow:hidden!important;
      }
      /* Tutti gli indicatori restano rigorosamente DENTRO il box che li ospita.
         Nessun offset negativo: evita che il browser allarghi il bounding box A4. */
      .safety-sign-cue-anchor>.safety-sign-cue{top:.6mm!important;right:.8mm!important}
      .safety-sign-cue-label>.safety-sign-cue{top:.25mm!important;right:.5mm!important}
      .safety-sign-cue-cell>.safety-sign-cue{top:.65mm!important;right:.65mm!important}
      .safety-fill-hint{
        position:absolute!important;
        z-index:5!important;
        left:50%!important;
        bottom:1.2mm!important;
        transform:translateX(-50%)!important;
        max-width:58%!important;
        white-space:nowrap!important;
        overflow:hidden!important;
        text-overflow:ellipsis!important;
        font-family:Arial,sans-serif!important;
        font-size:5px!important;
        line-height:1!important;
        font-weight:700!important;
        letter-spacing:.01em!important;
        color:#475569!important;
        background:rgba(255,255,255,.94)!important;
        border-radius:2mm!important;
        padding:.4mm 1mm!important;
        pointer-events:none!important;
        box-sizing:border-box!important;
        box-shadow:none!important;
      }
      .safety-fill-hint .safety-hint-check{color:#15803d!important;font-weight:900!important}
      @media print{
        .safety-sign-cue,.safety-fill-hint{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
      }
    `;
    document.head.appendChild(style);
  };

  const isCertificatePage=(page)=>{
    if(!page) return false;
    if(page.classList.contains('attestato-front') || page.classList.contains('attestato-retro')) return true;
    if(page.closest?.('.attestato-front,.attestato-retro')) return true;
    return false;
  };

  const directText=(el)=>Array.from(el.childNodes || [])
    .filter(node=>node.nodeType===Node.TEXT_NODE)
    .map(node=>node.textContent || '')
    .join(' ')
    .replace(/\s+/g,' ')
    .trim();

  const makeCue=()=>{
    const cue=document.createElement('span');
    cue.className='safety-sign-cue';
    cue.textContent='✓';
    cue.setAttribute('aria-hidden','true');
    cue.title='Punto firma';
    return cue;
  };

  const addCue=(anchor,className)=>{
    if(!anchor || anchor.querySelector(':scope > .safety-sign-cue')) return false;
    anchor.classList.add(className);
    anchor.appendChild(makeCue());
    return true;
  };

  const decorateAutomaticSignatures=(page)=>{
    let count=0;
    page.querySelectorAll('[data-signature-block]').forEach(block=>{
      if(addCue(block,'safety-sign-cue-anchor')) count+=1;
    });
    return count;
  };

  const decorateManualLabels=(page)=>{
    let count=0;
    const candidates=page.querySelectorAll('p,span,th,td,div,label');
    candidates.forEach(el=>{
      if(el.classList.contains('safety-fill-hint') || el.closest('.safety-fill-hint')) return;
      if(el.closest('[data-signature-block]')) return;
      if(el.matches('td') && el.closest('#r-rows')) return;
      const text=(directText(el) || (el.children.length===0 ? (el.textContent||'') : '')).replace(/\s+/g,' ').trim();
      if(!text || text.length>105 || !SIGN_RE.test(text)) return;
      if(/\bfirme\b/i.test(text) || /rilevat[io].*firma/i.test(text) || /elenco.*firma/i.test(text)) return;
      if(addCue(el,'safety-sign-cue-label')) count+=1;
    });
    return count;
  };

  const isRegisterPage=(page)=>page.hasAttribute('data-register-template-page') || page.hasAttribute('data-register-day-page') || REGISTER_RE.test(page.textContent||'');

  const decorateRegisterCells=(page)=>{
    if(!isRegisterPage(page)) return 0;
    let count=0;
    const rows=page.querySelectorAll('#r-rows tr, tbody tr');
    rows.forEach(row=>{
      const cells=Array.from(row.children).filter(el=>el.tagName==='TD');
      if(cells.length<7) return;
      [3,4,5,6].forEach(index=>{
        const cell=cells[index];
        if(cell && addCue(cell,'safety-sign-cue-cell')) count+=1;
      });
    });
    return count;
  };

  const hintForPage=(page,signatureCount)=>{
    const text=(page.textContent||'').replace(/\s+/g,' ');
    if(isRegisterPage(page)) return '✓ = firma richiesta · Compilare ogni entrata/uscita effettivamente prevista e usare firme leggibili.';
    if(QUALITY_RE.test(text) && signatureCount===0) return 'Compilare tutte le voci applicabili; usare note chiare e lasciare vuoto solo ciò che non è pertinente.';
    if(TEST_RE.test(text)) return signatureCount
      ? '✓ = firma richiesta · Compilare nome/data, una sola risposta dove previsto e firmare nei punti indicati.'
      : 'Compilare nome/data e una sola risposta dove previsto; eventuali correzioni devono restare leggibili.';
    if(DECL_RE.test(text)) return signatureCount
      ? '✓ = firma richiesta · Verificare nominativo, ruolo e dati prima della sottoscrizione.'
      : 'Verificare nominativi, ruoli e dati prima di completare il documento.';
    if(signatureCount>0) return '✓ = firma richiesta · Verificare i dati e firmare nei punti indicati; eventuali correzioni devono restare leggibili.';
    return 'Verificare i dati e compilare tutti i campi applicabili; lasciare vuoto solo ciò che non è pertinente.';
  };

  const addHint=(page,signatureCount)=>{
    let hint=page.querySelector(':scope > .safety-fill-hint');
    const text=hintForPage(page,signatureCount);
    if(!hint){
      hint=document.createElement('div');
      hint.className='safety-fill-hint';
      hint.setAttribute('aria-hidden','true');
      page.appendChild(hint);
    }
    const escaped=text.replace(/^✓\s*=\s*/, '');
    const desiredHtml=text.startsWith('✓')
      ? `<span class="safety-hint-check">✓</span> = firma richiesta · ${escaped.replace(/^firma richiesta\s*·\s*/i,'')}`
      : text;
    if(hint.innerHTML!==desiredHtml) hint.innerHTML=desiredHtml;
  };

  const decoratePage=(page)=>{
    if(!page || isCertificatePage(page)) return {excluded:true,signatures:0};
    if(page.dataset.safetyCompletionCues==='1'){
      return {excluded:false,signatures:page.querySelectorAll('.safety-sign-cue').length};
    }
    const auto=decorateAutomaticSignatures(page);
    const manual=decorateManualLabels(page);
    const register=decorateRegisterCells(page);
    const signatures=page.querySelectorAll('.safety-sign-cue').length || (auto+manual+register);
    addHint(page,signatures);
    page.dataset.safetyCompletionCues='1';
    return {excluded:false,signatures};
  };

  const decorate=(root=document)=>{
    injectStyle();
    const container=root?.querySelectorAll ? root : document;
    const pages=[];
    if(container.matches?.('.doc-page')) pages.push(container);
    container.querySelectorAll?.('.doc-page').forEach(page=>pages.push(page));
    pages.forEach(decoratePage);
    return pages.length;
  };

  let scheduled=false;
  const schedule=(root=document)=>{
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      decorate(root);
    });
  };

  // La decorazione non osserva più l'intero DOM. Viene eseguita solo quando
  // viene generata un'anteprima o immediatamente prima di una stampa reale.
  const installPreviewHook=()=>{
    if(typeof window.loadPrintPreview!=='function' || window.__safetyPrintCuesPreviewHooked) return false;
    window.__safetyPrintCuesPreviewHooked=true;
    const original=window.loadPrintPreview;
    window.loadPrintPreview=async function(...args){
      const result=await original.apply(this,args);
      const preview=document.getElementById('print-preview-container');
      if(preview) decorate(preview);
      return result;
    };
    return true;
  };

  const decorateForPrint=()=>{
    const printArea=document.getElementById('print-area-temp');
    if(printArea?.querySelector('.doc-page')) decorate(printArea);
  };

  window.SafetyPrintCompletionCues={decorate,schedule,decoratePage,isCertificatePage,decorateForPrint,installPreviewHook};

  injectStyle();
  installPreviewHook();
  // Un solo tentativo differito copre il caso in cui utils.js completi il caricamento dopo questo modulo.
  setTimeout(installPreviewHook,0);
  window.addEventListener('beforeprint',decorateForPrint);
})();