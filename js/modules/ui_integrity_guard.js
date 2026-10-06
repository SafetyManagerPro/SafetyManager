// Guardia strutturale UI: normalizza popup, scroll, livelli e chiusura da tastiera.
(function(){
  if(window.__safetyUiIntegrityGuardLoaded) return;
  window.__safetyUiIntegrityGuardLoaded=true;

  const STYLE_ID='safety-ui-integrity-guard-style';
  const BASE_Z=100000;

  function injectStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      .safety-modal-normalized{overflow-y:auto!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch;padding:clamp(.5rem,1.4vw,1.25rem)!important;isolation:isolate}
      .safety-modal-normalized> :not(.safety-popup-nav){max-width:calc(100vw - 1rem)!important;max-height:calc(100dvh - 1rem)!important}
      .safety-modal-normalized [data-safety-native-close="1"]{position:relative;z-index:2}
      .safety-modal-normalized [data-safety-native-close="1"].safety-native-close-proxied{display:none!important}
      @media print{.safety-modal-normalized{overflow:visible!important;padding:0!important}}
    `;
    document.head.appendChild(s);
  }

  function isVisible(el){
    if(!el||!el.isConnected||el.classList.contains('hidden')) return false;
    const st=getComputedStyle(el);
    return st.display!=='none'&&st.visibility!=='hidden';
  }

  function candidates(){
    const sels=['[id*="modal"]','[id*="popup"]','#panel-iscrizioni','.fixed.inset-0'];
    return [...new Set(sels.flatMap(s=>Array.from(document.querySelectorAll(s))))].filter(el=>{
      if(!(el instanceof HTMLElement)||el.id==='print-area-temp'||el.id==='safety-toast-stack') return false;
      const st=getComputedStyle(el);
      const named=/modal|popup|panel-iscrizioni/i.test(el.id||'');
      return isVisible(el)&&(st.position==='fixed'||el.classList.contains('fixed'))&&(named||el.classList.contains('inset-0'));
    });
  }

  function nativeClose(overlay){
    return Array.from(overlay.querySelectorAll('button')).find(btn=>{
      if(btn.closest('.safety-popup-nav')) return false;
      const aria=String(btn.getAttribute('aria-label')||'').toLowerCase();
      const title=String(btn.getAttribute('title')||'').toLowerCase();
      const text=String(btn.textContent||'').trim().toLowerCase();
      return !!btn.querySelector('[data-lucide="x"]')||/chiudi|close/.test(`${aria} ${title} ${text}`)||text==='×';
    })||null;
  }

  function syncNativeCloseVisibility(overlay,close){
    if(!close) return;
    const hasStandardNav=!!overlay.querySelector(':scope > .safety-popup-nav');
    close.classList.toggle('safety-native-close-proxied',hasStandardNav);
  }

  function normalize(){
    injectStyle();
    const visible=candidates();
    visible.forEach((overlay,index)=>{
      overlay.classList.add('safety-modal-normalized');
      overlay.dataset.safetyUiNormalized='1';
      const z=parseInt(getComputedStyle(overlay).zIndex,10);
      const desired=BASE_Z+(index*20);
      if(!Number.isFinite(z)||z<desired) overlay.style.zIndex=String(desired);
      const close=nativeClose(overlay);
      if(close){
        close.dataset.safetyNativeClose='1';
        if(!close.getAttribute('aria-label')) close.setAttribute('aria-label','Chiudi');
        if(!close.getAttribute('title')) close.setAttribute('title','Chiudi');
      }
      syncNativeCloseVisibility(overlay,close);
    });
    if(typeof window.SafetyNavigation?.decorate==='function') window.SafetyNavigation.decorate();
    visible.forEach(overlay=>syncNativeCloseVisibility(overlay,nativeClose(overlay)));
    return visible;
  }

  function audit(){
    const visible=normalize();
    const app=document.getElementById('app-content');
    const pageNav=!!app?.querySelector('.safety-page-nav');
    const popupRows=visible.map(el=>({
      id:el.id||'(senza id)',
      navigation:!!el.querySelector(':scope > .safety-popup-nav'),
      nativeClose:!!nativeClose(el),
      duplicateVisibleClose:!!el.querySelector('[data-safety-native-close="1"]:not(.safety-native-close-proxied)')&&!!el.querySelector(':scope > .safety-popup-nav'),
      normalized:el.dataset.safetyUiNormalized==='1',
      zIndex:parseInt(getComputedStyle(el).zIndex,10)||0,
      overflowY:getComputedStyle(el).overflowY
    }));
    return {
      pageNavigation:pageNav,
      visiblePopups:popupRows.length,
      popups:popupRows,
      ok:pageNav&&popupRows.every(r=>r.navigation&&r.normalized&&r.zIndex>=BASE_Z&&!r.duplicateVisibleClose)
    };
  }

  let scheduled=false;
  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;normalize();});
  }

  document.addEventListener('keydown',e=>{
    if(e.key!=='Escape') return;
    const open=candidates();
    const top=open.sort((a,b)=>(parseInt(getComputedStyle(a).zIndex,10)||0)-(parseInt(getComputedStyle(b).zIndex,10)||0)).pop();
    if(top&&typeof window.SafetyNavigation?.closeOverlay==='function'){
      e.preventDefault();
      window.SafetyNavigation.closeOverlay(top);
    }
  });

  const obs=new MutationObserver(schedule);
  obs.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','aria-hidden']});
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('orientationchange',schedule,{passive:true});
  injectStyle();
  schedule();

  window.SafetyUIIntegrity={normalize,schedule,audit,getVisiblePopups:candidates};
})();
