// Sistema unico di layout SafetyManagerPro
// Normalizza larghezze, offset navbar, pannelli sticky, scroll, modali e anteprima stampe.
(function(){
  if(window.__safetyLayoutSystemLoaded) return;
  window.__safetyLayoutSystemLoaded = true;

  const STYLE_ID = 'safety-layout-system-style';
  const css = `
    :root {
      --safety-sticky-gap: 12px;
      --safety-page-gap: clamp(.5rem, 1.2vw, 1.5rem);
    }

    body:not(.is-printing-temp) #app-content {
      width: 100% !important;
      max-width: 100vw !important;
      min-width: 0 !important;
      box-sizing: border-box !important;
      margin-top: calc(var(--nav-offset, 84px) + 8px) !important;
      padding-left: var(--safety-page-gap) !important;
      padding-right: var(--safety-page-gap) !important;
    }

    body:not(.is-printing-temp) #app-content[data-safety-module] > div:first-of-type {
      width: 100% !important;
      max-width: none !important;
      min-width: 0 !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
    }

    body:not(.is-printing-temp) #app-content[data-safety-module] > div:first-of-type > * {
      min-width: 0;
    }

    body:not(.is-printing-temp) .safety-module-toolbar {
      position: relative !important;
      top: auto !important;
      z-index: 20 !important;
    }

    body:not(.is-printing-temp) #app-content thead th {
      position: static !important;
      top: auto !important;
      z-index: auto !important;
    }

    body:not(.is-printing-temp) #app-content .overflow-x-auto {
      max-width: 100% !important;
      min-width: 0 !important;
      overscroll-behavior-x: contain;
      -webkit-overflow-scrolling: touch;
    }

    @media (min-width: 1024px) {
      body:not(.is-printing-temp) #view-aziende > .grid > .sticky,
      body:not(.is-printing-temp) #docente-form-card,
      body:not(.is-printing-temp) #progetto-form-col:not(.fixed) #progetto-form-card,
      body:not(.is-printing-temp) #app-content[data-safety-module="corsisti"] > div:first-of-type > div:first-child > .sticky,
      body:not(.is-printing-temp) #app-content[data-safety-module="stampe"] > div:first-of-type > div:first-child > .sticky {
        top: calc(var(--nav-offset, 84px) + var(--safety-sticky-gap)) !important;
        max-height: calc(100dvh - var(--nav-offset, 84px) - 24px) !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        overscroll-behavior: contain;
        scrollbar-gutter: stable;
      }
    }

    @media (max-width: 1023px) {
      body:not(.is-printing-temp) #view-aziende > .grid > .sticky,
      body:not(.is-printing-temp) #docente-form-card,
      body:not(.is-printing-temp) #progetto-form-col:not(.fixed) #progetto-form-card,
      body:not(.is-printing-temp) #app-content[data-safety-module="corsisti"] > div:first-of-type > div:first-child > .sticky,
      body:not(.is-printing-temp) #app-content[data-safety-module="stampe"] > div:first-of-type > div:first-child > .sticky {
        position: static !important;
        top: auto !important;
        max-height: none !important;
        overflow: visible !important;
      }
    }

    body:not(.is-printing-temp) .safety-print-viewport {
      overflow: auto !important;
      min-width: 0 !important;
      max-width: 100% !important;
      align-items: flex-start !important;
      justify-content: flex-start !important;
      padding: clamp(.5rem, 2vw, 2rem) !important;
      overscroll-behavior: contain;
      scrollbar-gutter: stable both-edges;
    }
    body:not(.is-printing-temp) .safety-print-viewport.safety-preview-has-room {
      justify-content: center !important;
    }
    body:not(.is-printing-temp) .safety-print-viewport #print-preview-container {
      flex: 0 0 auto !important;
      max-width: none !important;
    }

    body:not(.is-printing-temp) #panel-iscrizioni,
    body:not(.is-printing-temp) #azienda-relazioni-modal,
    body:not(.is-printing-temp) #qa-modal-azienda,
    body:not(.is-printing-temp) #qa-modal-corso,
    body:not(.is-printing-temp) #qa-modal-corsista,
    body:not(.is-printing-temp) #qa-modal-docente-progetto,
    body:not(.is-printing-temp) #safety-company-doc-modal {
      overflow-y: auto !important;
      overscroll-behavior: contain !important;
      padding: clamp(.5rem, 1.4vw, 1.25rem) !important;
    }

    body:not(.is-printing-temp) #panel-iscrizioni,
    body:not(.is-printing-temp) #azienda-relazioni-modal { z-index: 200 !important; }
    body:not(.is-printing-temp) #qa-modal-azienda,
    body:not(.is-printing-temp) #qa-modal-corso,
    body:not(.is-printing-temp) #qa-modal-corsista,
    body:not(.is-printing-temp) #qa-modal-docente-progetto,
    body:not(.is-printing-temp) #safety-company-doc-modal { z-index: 220 !important; }

    body:not(.is-printing-temp) #qa-modal-azienda > div,
    body:not(.is-printing-temp) #qa-modal-corso > div,
    body:not(.is-printing-temp) #qa-modal-corsista > div,
    body:not(.is-printing-temp) #qa-modal-docente-progetto > div {
      max-height: calc(100dvh - 1rem) !important;
      overflow-y: auto !important;
    }

    body:not(.is-printing-temp) .safety-unsaved-badge {
      top: calc(var(--nav-offset, 84px) + 12px) !important;
      z-index: 90 !important;
    }

    @media (max-width: 768px) {
      body:not(.is-printing-temp) #app-content { --safety-page-gap: .5rem; }
    }

    @media print {
      .safety-print-viewport { overflow: visible !important; padding: 0 !important; }
    }
  `;

  function injectStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = css;
    document.head.appendChild(s);
  }

  function inferModule(){
    const app = document.getElementById('app-content');
    if(!app) return '';
    // Prima guardiamo il DOM appena caricato; dataset/currentSafetyModuleId possono essere ancora quelli della pagina precedente.
    if(document.getElementById('view-aziende')) return 'aziende';
    if(document.getElementById('view-docenti')) return 'docenti';
    if(document.getElementById('form-corsista')) return 'corsisti';
    if(document.getElementById('form-progetto')) return 'progetti';
    if(document.getElementById('stampa-progetto')) return 'stampe';
    if(document.getElementById('archivio-corsi-container')) return 'archivio_corsi';
    if(document.getElementById('dash-action-plan') || document.getElementById('dash-progetti')) return 'admin';
    return app.dataset.safetyModule || window.currentSafetyModuleId || '';
  }

  function syncNavOffset(){
    const nav = document.getElementById('top-nav');
    if(!nav) return;
    const h = Math.ceil(nav.getBoundingClientRect().height || nav.offsetHeight || 84);
    if(h > 0) document.documentElement.style.setProperty('--nav-offset', h + 'px');
  }

  function syncPreview(){
    const preview = document.getElementById('print-preview-container');
    if(!preview || !preview.parentElement) return;
    const viewport = preview.parentElement;
    viewport.classList.add('safety-print-viewport');
    const required = Math.ceil(preview.getBoundingClientRect().width || preview.offsetWidth || 794) + 48;
    viewport.classList.toggle('safety-preview-has-room', viewport.clientWidth >= required);
  }

  function normalizeModalCards(){
    const ids = ['panel-iscrizioni','azienda-relazioni-modal','qa-modal-azienda','qa-modal-corso','qa-modal-corsista','qa-modal-docente-progetto','safety-company-doc-modal'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if(el) el.dataset.safetyLayoutNormalized = '1';
    });
  }

  let scheduled = false;
  function scheduleApply(){
    if(scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      window.applySafetyLayout();
    });
  }

  window.applySafetyLayout = function(moduleId = ''){
    injectStyle();
    const app = document.getElementById('app-content');
    const inferred = inferModule();
    const resolved = inferred || moduleId || window.currentSafetyModuleId || '';
    if(app && resolved) app.dataset.safetyModule = resolved;
    if(resolved) window.currentSafetyModuleId = resolved;
    syncNavOffset();
    syncPreview();
    normalizeModalCards();
  };

  injectStyle();
  syncNavOffset();
  scheduleApply();

  const nav = document.getElementById('top-nav');
  if(nav && typeof ResizeObserver !== 'undefined') {
    const navObserver = new ResizeObserver(scheduleApply);
    navObserver.observe(nav);
  }

  window.addEventListener('resize', scheduleApply, { passive:true });
  window.addEventListener('orientationchange', scheduleApply, { passive:true });

  const root = document.getElementById('app-content') || document.body;
  const observer = new MutationObserver(scheduleApply);
  observer.observe(root, { childList:true, subtree:true });
})();