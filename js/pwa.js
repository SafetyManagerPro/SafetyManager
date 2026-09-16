// PWA installabile SafetyManager PRO; non altera i dati e non espone credenziali.
(function(){
  if(window.__safetyPwaLoaded) return;
  window.__safetyPwaLoaded=true;

  const ICON='/assets/icons/safetymanager-192.svg';
  const APPLE_ICON='/assets/icons/safetymanager-192.png';
  let deferredPrompt=null;

  function ensureBrandIcons(){
    let favicon=document.querySelector('link[rel="icon"]');
    if(!favicon){
      favicon=document.createElement('link');
      favicon.rel='icon';
      document.head.appendChild(favicon);
    }
    favicon.type='image/svg+xml';
    favicon.href=ICON;

    let apple=document.querySelector('link[rel="apple-touch-icon"]');
    if(!apple){
      apple=document.createElement('link');
      apple.rel='apple-touch-icon';
      document.head.appendChild(apple);
    }
    apple.setAttribute('sizes','192x192');
    apple.href=APPLE_ICON;
  }

  async function registerServiceWorker(){
    if(!('serviceWorker' in navigator)) return null;
    try{
      const registration=await navigator.serviceWorker.register('/sw.js',{scope:'/'});
      console.info('SafetyManager PWA: service worker attivo.',registration.scope);
      return registration;
    }catch(error){
      console.warn('SafetyManager PWA: registrazione service worker non riuscita.',error);
      return null;
    }
  }

  function isStandalone(){
    return window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator.standalone===true;
  }
  function isIOS(){
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
  }
  function removeInstallButton(){
    document.getElementById('nav-install-pwa')?.remove();
  }

  function ensureInstallButton(){
    if(isStandalone() || (!deferredPrompt && !isIOS())) return removeInstallButton();
    const nav=document.getElementById('top-nav-buttons');
    if(!nav || document.getElementById('nav-install-pwa')) return;
    const btn=document.createElement('button');
    btn.id='nav-install-pwa';
    btn.type='button';
    btn.className='btn-tab flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs transition-all duration-300 hover:text-white hover:bg-emerald-900/70 group text-emerald-300 border border-emerald-700/50';
    btn.title='Installa SafetyManager PRO come applicazione';
    btn.setAttribute('aria-label','Installa SafetyManager PRO');
    btn.innerHTML='<div class="w-7 h-7 rounded-lg bg-emerald-900/70 flex items-center justify-center group-hover:bg-emerald-600 transition-all"><i data-lucide="download" class="w-3.5 h-3.5 text-emerald-200 group-hover:text-white"></i></div><span class="hidden xl:block">Installa</span>';
    btn.addEventListener('click',async()=>{
      if(!deferredPrompt){
        if(isIOS()) alert('Per installare SafetyManager su iPhone o iPad, apri questa pagina in Safari, tocca Condividi e scegli Aggiungi alla schermata Home.');
        return;
      }
      const prompt=deferredPrompt;
      deferredPrompt=null;
      await prompt.prompt();
      try{await prompt.userChoice;}catch(_){/* browser-dependent */}
      removeInstallButton();
    });
    nav.appendChild(btn);
    if(typeof lucide!=='undefined') lucide.createIcons();
    if(typeof window.updateNavOffset==='function') setTimeout(window.updateNavOffset,30);
  }

  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();
    deferredPrompt=event;
    ensureInstallButton();
  });
  window.addEventListener('appinstalled',()=>{
    deferredPrompt=null;
    removeInstallButton();
    if(typeof window.showSafetyToast==='function'){
      window.showSafetyToast('SafetyManager PRO è stato installato sul dispositivo.',{title:'App installata',type:'ok',icon:'badge-check'});
    }
  });

  function loadRefinementModule(){
    if(typeof window.loadOptionalSafetyScript==='function'){
      window.loadOptionalSafetyScript('js/modules/progetti_corsisti_refinement.js');
      return true;
    }
    return false;
  }

  ensureBrandIcons();
  registerServiceWorker();
  setTimeout(ensureInstallButton,500);
  setTimeout(ensureInstallButton,1500);
  if(!loadRefinementModule()){
    setTimeout(loadRefinementModule,100);
    setTimeout(loadRefinementModule,500);
    setTimeout(loadRefinementModule,1500);
  }
  window.SafetyPWA={registerServiceWorker,ensureInstallButton,isStandalone,ensureBrandIcons,loadRefinementModule};
})();
