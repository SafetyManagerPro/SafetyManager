// PWA installabile SafetyManager PRO
(function(){
  if(window.__safetyPwaLoaded) return;
  window.__safetyPwaLoaded=true;

  const ICON='/assets/icons/safetymanager-192.svg';
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

    const apple=document.querySelector('link[rel="apple-touch-icon"]');
    if(apple) apple.href='/assets/icons/safetymanager-512.svg';
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

  function removeInstallButton(){
    document.getElementById('nav-install-pwa')?.remove();
  }

  function ensureInstallButton(){
    if(isStandalone() || !deferredPrompt) return removeInstallButton();
    const nav=document.getElementById('top-nav-buttons');
    if(!nav || document.getElementById('nav-install-pwa')) return;
    const btn=document.createElement('button');
    btn.id='nav-install-pwa';
    btn.type='button';
    btn.className='btn-tab flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs transition-all duration-300 hover:text-white hover:bg-emerald-900/70 group text-emerald-300 border border-emerald-700/50';
    btn.title='Installa SafetyManager PRO come applicazione';
    btn.innerHTML='<div class="w-7 h-7 rounded-lg bg-emerald-900/70 flex items-center justify-center group-hover:bg-emerald-600 transition-all"><i data-lucide="download" class="w-3.5 h-3.5 text-emerald-200 group-hover:text-white"></i></div><span class="hidden xl:block">Installa</span>';
    btn.addEventListener('click',async()=>{
      if(!deferredPrompt) return;
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

  ensureBrandIcons();
  registerServiceWorker();
  setTimeout(ensureInstallButton,500);
  setTimeout(ensureInstallButton,1500);

  window.SafetyPWA={registerServiceWorker,ensureInstallButton,isStandalone};

  // Modulo incrementale isolato: alleggerisce la vista Progetti e abilita le nomine
  // legate ai corsi realmente completati senza modificare il motore principale utils.js.
  if(typeof window.loadOptionalSafetyScript==='function'){
    window.loadOptionalSafetyScript('js/modules/progetti_corsisti_refinement.js');
  }
})();
