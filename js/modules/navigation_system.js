// Navigazione coerente SafetyManager: indietro, avanti e chiudi su pagine e popup.
(function(){
  if(window.__safetyNavigationSystemLoaded) return;
  window.__safetyNavigationSystemLoaded = true;

  const STYLE_ID='safety-navigation-system-style';
  const state={history:[],index:-1,navigating:false,originalLoadModule:window.loadModule||null};

  function injectStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      .safety-page-nav{display:flex;align-items:center;justify-content:flex-end;gap:7px;margin:0 0 12px;padding:7px 8px;border:1px solid #e2e8f0;border-radius:14px;background:rgba(255,255,255,.92);backdrop-filter:blur(8px);box-shadow:0 4px 18px rgba(15,23,42,.05)}
      .safety-nav-btn{width:36px;height:36px;display:inline-flex;align-items:center;justify-content:center;border-radius:10px;border:1px solid #cbd5e1;background:#fff;color:#334155;transition:.16s ease;cursor:pointer}
      .safety-nav-btn:hover:not(:disabled){background:#0f172a;color:#fff;border-color:#0f172a;transform:translateY(-1px)}
      .safety-nav-btn:disabled{opacity:.32;cursor:not-allowed}
      .safety-nav-btn-close{border-color:#fecaca;color:#b91c1c;background:#fff7f7}
      .safety-nav-btn-close:hover:not(:disabled){background:#991b1b;border-color:#991b1b;color:#fff}
      .safety-popup-nav{position:absolute;top:10px;left:10px;z-index:2147483000;display:flex;gap:6px;padding:6px;border-radius:13px;background:rgba(15,23,42,.9);box-shadow:0 10px 30px rgba(15,23,42,.28);backdrop-filter:blur(8px)}
      .safety-popup-nav .safety-nav-btn{width:34px;height:34px;border-color:rgba(255,255,255,.18);background:rgba(255,255,255,.1);color:#fff}
      .safety-popup-nav .safety-nav-btn:hover:not(:disabled){background:#fff;color:#0f172a;border-color:#fff}
      .safety-popup-nav .safety-nav-btn-close{color:#fecaca}
      .safety-page-nav-inline{margin:0;padding:0;border:0;border-radius:0;background:transparent;box-shadow:none;backdrop-filter:none;justify-content:flex-start;gap:6px;flex:0 0 auto}
      .safety-page-nav-inline .safety-nav-btn{width:34px;height:34px}
      .safety-page-nav[hidden]{display:none!important}
      /* Indietro/Avanti dentro l'intestazione del popup, accanto alla X originale: non copre piu' titoli e testi. */
      .safety-popup-nav-inline{display:inline-flex;align-items:center;gap:6px;flex:0 0 auto;margin-left:auto}
      /* Intestazioni strette (telefoni piccoli): il gruppo va a capo a destra invece di uscire dallo schermo. */
      :has(> .safety-popup-nav-inline){flex-wrap:wrap}
      .safety-popup-nav-inline .safety-nav-btn{width:32px;height:32px;border:1px solid rgba(148,163,184,.45);background:rgba(148,163,184,.14);color:inherit}
      .safety-popup-nav-inline .safety-nav-btn:hover:not(:disabled){background:rgba(148,163,184,.32);color:inherit;border-color:rgba(148,163,184,.7)}
      /* Popup senza X in alto: la barra resta flottante ma il popup le lascia spazio sopra. */
      .safety-popup-floating-nav{padding-top:60px!important;overflow-y:auto!important}
      @media(max-width:640px){.safety-page-nav:not(.safety-page-nav-inline){position:sticky;top:calc(var(--nav-offset,84px) + 6px);z-index:45}.safety-popup-nav{top:6px;left:6px}.safety-nav-btn{width:40px;height:40px}.safety-page-nav-inline .safety-nav-btn{width:38px;height:38px}}
      @media print{.safety-page-nav,.safety-popup-nav,.safety-popup-nav-inline{display:none!important}}
    `;
    document.head.appendChild(style);
  }

  function inferModule(){
    const app=document.getElementById('app-content');
    if(!app) return '';
    if(document.getElementById('dash-action-plan')||document.getElementById('dash-progetti')) return 'admin';
    if(document.getElementById('view-aziende')) return 'aziende';
    if(document.getElementById('view-docenti')) return 'docenti';
    if(document.getElementById('form-corsista')) return 'corsisti';
    if(document.getElementById('form-progetto')) return 'progetti';
    if(document.getElementById('stampa-progetto')) return 'stampe';
    if(document.getElementById('archivio-corsi-container')) return 'archivio_corsi';
    return app.dataset.safetyModule||window.currentSafetyModuleId||'';
  }

  function pushHistory(moduleId){
    if(!moduleId||moduleId==='login') return;
    const current=state.history[state.index];
    if(current===moduleId) return;
    if(state.index<state.history.length-1) state.history=state.history.slice(0,state.index+1);
    state.history.push(moduleId);
    if(state.history.length>40) state.history.shift();
    state.index=state.history.length-1;
  }

  async function navigateIndex(nextIndex){
    if(!state.originalLoadModule||nextIndex<0||nextIndex>=state.history.length||nextIndex===state.index) return;
    state.index=nextIndex;
    const target=state.history[state.index];
    state.navigating=true;
    try{
      window.currentSafetyModuleId=target;
      await state.originalLoadModule.call(window,target);
    }finally{
      state.navigating=false;
      scheduleDecorate();
    }
  }

  function canBack(){return state.index>0;}
  function canForward(){return state.index>=0&&state.index<state.history.length-1;}
  function goBack(){return navigateIndex(state.index-1);}
  function goForward(){return navigateIndex(state.index+1);}

  async function closePage(){
    const current=inferModule();
    if(current==='admin') return;
    if(typeof window.loadModule==='function') await window.loadModule('admin');
  }

  function icon(name){return `<i data-lucide="${name}" class="w-4 h-4"></i>`;}

  function pageRoot(){
    const app=document.getElementById('app-content');
    if(!app) return null;
    return app.querySelector(':scope > .safety-module-root')||Array.from(app.children).find(el=>el.id!=='safety-module-toolbar'&&!el.classList.contains('safety-module-toolbar'))||null;
  }

  function toolbarSlot(){
    return document.querySelector('#app-content #safety-module-toolbar .safety-module-toolbar-left');
  }

  // Con la barra "Dashboard / sezione" presente, Indietro e Avanti entrano li' dentro:
  // niente seconda barra vuota sopra la pagina e niente colonna vuota nei layout a colonne.
  // La X "torna alla Dashboard" non serve: il pulsante Dashboard e' gia' accanto.
  function placeInToolbar(nav,slot){
    // Se la barra Dashboard/sezione e' finita dentro la barra autonoma, la riporta fuori prima.
    if(nav.contains(slot)){const tb=slot.closest('#safety-module-toolbar');nav.parentElement.insertBefore(tb,nav);}
    nav.classList.add('safety-page-nav-inline');
    nav.querySelector('[data-safety-nav="close"]')?.remove();
    slot.insertBefore(nav,slot.firstChild);
  }

  function decoratePage(){
    const app=document.getElementById('app-content'), root=pageRoot();
    if(!app||!root) return false;
    if(root.querySelector('#safety-login-email')) return false;
    const slot=toolbarSlot();
    const existing=app.querySelector('.safety-page-nav');
    if(existing){
      if(slot&&existing.parentElement!==slot) placeInToolbar(existing,slot);
      return false;
    }
    const current=inferModule();
    if(current&&!state.history.length){state.history=[current];state.index=0;}
    const nav=document.createElement('div');
    nav.className='safety-page-nav';
    nav.dataset.safetyNavigation='page';
    nav.innerHTML=`
      <button type="button" class="safety-nav-btn" data-safety-nav="back" aria-label="Indietro" title="Indietro">${icon('arrow-left')}</button>
      <button type="button" class="safety-nav-btn" data-safety-nav="forward" aria-label="Avanti" title="Avanti">${icon('arrow-right')}</button>
      <button type="button" class="safety-nav-btn safety-nav-btn-close" data-safety-nav="close" aria-label="Chiudi pagina" title="Chiudi e torna alla Dashboard">${icon('x')}</button>`;
    nav.querySelector('[data-safety-nav="back"]').onclick=goBack;
    nav.querySelector('[data-safety-nav="forward"]').onclick=goForward;
    nav.querySelector('[data-safety-nav="close"]').onclick=closePage;
    if(slot) placeInToolbar(nav,slot);
    // Fuori dal contenitore della pagina: nei layout a colonne non diventa una colonna vuota.
    else root.parentElement.insertBefore(nav,root);
    return true;
  }

  function isVisible(el){
    if(!el||!el.isConnected||el.classList.contains('hidden')) return false;
    const style=getComputedStyle(el);
    return style.display!=='none'&&style.visibility!=='hidden';
  }

  function popupCandidates(){
    const selectors=['[id*="modal"]','[id*="popup"]','#panel-iscrizioni','.fixed.inset-0'];
    return [...new Set(selectors.flatMap(sel=>Array.from(document.querySelectorAll(sel))))].filter(el=>{
      if(!(el instanceof HTMLElement)||el.closest('.safety-popup-nav')) return false;
      if(el.id==='print-area-temp'||el.id==='safety-toast-stack') return false;
      const style=getComputedStyle(el);
      const modalNamed=/modal|popup|panel-iscrizioni/i.test(el.id||'');
      return isVisible(el)&&(style.position==='fixed'||el.classList.contains('fixed'))&&(modalNamed||el.classList.contains('inset-0'));
    });
  }

  function nativeCloseButton(overlay){
    return Array.from(overlay.querySelectorAll('button')).find(btn=>{
      if(btn.closest('.safety-popup-nav')||btn.hasAttribute('data-safety-popup-nav')) return false;
      const aria=String(btn.getAttribute('aria-label')||'').toLowerCase();
      const title=String(btn.getAttribute('title')||'').toLowerCase();
      const text=String(btn.textContent||'').trim().toLowerCase();
      return !!btn.querySelector('[data-lucide="x"]')||/chiudi|close/.test(aria+' '+title+' '+text)||text==='×';
    })||null;
  }

  function closeOverlay(overlay){
    if(!overlay) return;
    const native=nativeCloseButton(overlay);
    if(native){native.click();return;}
    try{overlay.click();}catch(_e){}
    setTimeout(()=>{
      if(isVisible(overlay)){
        overlay.classList.add('hidden');
        overlay.classList.remove('flex','grid','block');
        overlay.setAttribute('aria-hidden','true');
      }
    },0);
  }

  async function popupBack(overlay){closeOverlay(overlay);if(canBack()) await goBack();}
  async function popupForward(overlay){closeOverlay(overlay);if(canForward()) await goForward();}

  // X originale del popup, purche' sia nell'intestazione (in alto nel pannello).
  function headerCloseButton(overlay){
    const native=nativeCloseButton(overlay);
    if(!native||!isVisible(native)) return null;
    let panel=native;
    while(panel.parentElement&&panel.parentElement!==overlay) panel=panel.parentElement;
    const pr=(panel.parentElement===overlay?panel:overlay).getBoundingClientRect();
    const nr=native.getBoundingClientRect();
    if(!nr.width||!nr.height) return null;
    return (nr.top-pr.top)<=140?native:null;
  }

  function buildInlinePopupNav(overlay,native){
    const group=document.createElement('span');
    group.className='safety-popup-nav-inline';
    group.dataset.safetyNavigation='popup-inline';
    group.innerHTML=`
      <button type="button" class="safety-nav-btn" data-safety-popup-nav="back" aria-label="Indietro" title="Indietro">${icon('arrow-left')}</button>
      <button type="button" class="safety-nav-btn" data-safety-popup-nav="forward" aria-label="Avanti" title="Avanti">${icon('arrow-right')}</button>`;
    group.querySelector('[data-safety-popup-nav="back"]').onclick=()=>popupBack(overlay);
    group.querySelector('[data-safety-popup-nav="forward"]').onclick=()=>popupForward(overlay);
    // La X originale entra nel gruppo e ne conserva l'eventuale posizionamento assoluto.
    const cs=getComputedStyle(native);
    if(cs.position==='absolute'){
      group.style.position='absolute';
      ['top','right','bottom','left','zIndex'].forEach(k=>{if(cs[k]&&cs[k]!=='auto')group.style[k]=cs[k];});
      native.style.position='static';
    }
    native.parentNode.insertBefore(group,native);
    group.appendChild(native);
  }

  function decoratePopups(){
    let created=0;
    popupCandidates().forEach(overlay=>{
      if(overlay.querySelector('.safety-popup-nav-inline')) return;
      const native=headerCloseButton(overlay);
      if(native){
        overlay.querySelector(':scope > .safety-popup-nav')?.remove();
        overlay.classList.remove('safety-popup-floating-nav');
        buildInlinePopupNav(overlay,native);
        created+=1;
        return;
      }
      if(overlay.querySelector(':scope > .safety-popup-nav')) return;
      overlay.classList.add('safety-popup-floating-nav');
      const nav=document.createElement('div');
      nav.className='safety-popup-nav';
      nav.dataset.safetyNavigation='popup';
      nav.innerHTML=`
        <button type="button" class="safety-nav-btn" data-safety-popup-nav="back" aria-label="Indietro" title="Indietro">${icon('arrow-left')}</button>
        <button type="button" class="safety-nav-btn" data-safety-popup-nav="forward" aria-label="Avanti" title="Avanti">${icon('arrow-right')}</button>
        <button type="button" class="safety-nav-btn safety-nav-btn-close" data-safety-popup-nav="close" aria-label="Chiudi popup" title="Chiudi">${icon('x')}</button>`;
      nav.querySelector('[data-safety-popup-nav="back"]').onclick=()=>popupBack(overlay);
      nav.querySelector('[data-safety-popup-nav="forward"]').onclick=()=>popupForward(overlay);
      nav.querySelector('[data-safety-popup-nav="close"]').onclick=()=>closeOverlay(overlay);
      overlay.appendChild(nav);
      created+=1;
    });
    return created;
  }

  function updateButtons(){
    document.querySelectorAll('.safety-page-nav [data-safety-nav="back"]').forEach(b=>b.disabled=!canBack());
    document.querySelectorAll('.safety-page-nav [data-safety-nav="forward"],.safety-popup-nav [data-safety-popup-nav="forward"]').forEach(b=>b.disabled=!canForward());
    document.querySelectorAll('.safety-page-nav [data-safety-nav="close"]').forEach(b=>b.disabled=inferModule()==='admin');
    // Barra autonoma (es. Dashboard) con tutti i pulsanti disattivati: e' solo spazio vuoto, la nascondo.
    document.querySelectorAll('.safety-page-nav:not(.safety-page-nav-inline)').forEach(n=>{
      n.hidden=![...n.querySelectorAll('button')].some(b=>!b.disabled);
    });
  }

  let scheduled=false;
  function scheduleDecorate(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      injectStyle();
      const pageCreated=decoratePage();
      const popupCreated=decoratePopups();
      updateButtons();
      if((pageCreated||popupCreated)&&window.lucide) window.lucide.createIcons();
    });
  }

  function installLoadModuleWrapper(){
    if(!state.originalLoadModule||window.__safetyNavigationLoadModuleWrapped) return;
    window.__safetyNavigationLoadModuleWrapped=true;
    const original=state.originalLoadModule;
    window.loadModule=async function(moduleId,...args){
      if(!state.navigating&&moduleId&&moduleId!=='login') pushHistory(moduleId);
      if(moduleId) window.currentSafetyModuleId=moduleId;
      const result=await original.call(window,moduleId,...args);
      scheduleDecorate();
      return result;
    };
  }

  injectStyle();
  const initial=inferModule();
  if(initial){state.history=[initial];state.index=0;}
  installLoadModuleWrapper();
  scheduleDecorate();

  // Le variazioni DOM sono coordinate da professional_suite: niente observer globale duplicato qui.
  window.addEventListener('resize',scheduleDecorate,{passive:true});

  window.SafetyNavigation={goBack,goForward,closePage,closeOverlay,decorate:scheduleDecorate,getState:()=>({history:[...state.history],index:state.index,current:state.history[state.index]||inferModule()})};
})();
