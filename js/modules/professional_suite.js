// Loader professionale Step 15-19 + modelli azienda/lavoratore + layout unificato
(function(){
  if(window.__safetyProfessionalSuiteLoaded) return;
  window.__safetyProfessionalSuiteLoaded=true;

  const loadAll=async()=>{
    if(typeof window.loadOptionalSafetyScript!=='function') return;
    const files=[
      'js/modules/ui_refinements.js',
      'js/modules/signature_identity_guard.js',
      'js/modules/print_completion_cues.js',
      'js/modules/soft_ui_theme.js',
      'js/modules/navigation_system.js',
      'js/modules/ui_integrity_guard.js',
      'js/modules/local_evidence_picker.js',
      'js/modules/local_evidence_preview.js',
      'js/modules/workflow_guard.js',
      'js/modules/anagrafica_duplicate_guard.js',
      'js/modules/chatgpt_free_mode.js',
      'js/modules/ai_mode_router.js',
      'js/modules/corsisti_ruolo_azienda.js',
      'js/modules/documenti_azienda_lavoratore_core.js',
      'js/modules/documenti_azienda_lavoratore_ui.js',
      'js/modules/documenti_azienda_lavoratore_print.js',
      'js/modules/documenti_azienda_lavoratore_directory.js',
      'js/modules/collaudo_pro.js',
      'js/modules/audit_attivita.js',
      'js/modules/chiusura_corso.js',
      'js/modules/step67_chiusura_intelligente.js',
      'js/modules/rientro_documenti.js',
      'js/modules/rientro_evidence_bridge.js',
      'js/modules/dashboard_document_lifecycle.js',
      'js/modules/prepara_corso_unificato.js',
      'js/modules/scadenze_avanzate.js',
      'js/modules/kit_cliente_pro.js',
      'js/modules/archivio_avanzato.js',
      'js/modules/import_guidato.js',
      'js/modules/layout_system.js'
    ];
    for(const file of files) await window.loadOptionalSafetyScript(file);
    injectDashboardActions();
    if(typeof window.applySafetyUiRefinements==='function') window.applySafetyUiRefinements('admin');
    if(typeof window.applySafetyWorkflowFixes==='function') window.applySafetyWorkflowFixes('admin');
    if(typeof window.applySafetyLayout==='function') window.applySafetyLayout('admin');
    if(typeof window.SafetyNavigation?.decorate==='function') window.SafetyNavigation.decorate();
    if(typeof window.SafetyUIIntegrity?.normalize==='function') window.SafetyUIIntegrity.normalize();
    if(typeof window.SafetyLocalEvidence?.decorate==='function') window.SafetyLocalEvidence.decorate(document);
    if(typeof window.SafetyRientroEvidence?.decorate==='function') window.SafetyRientroEvidence.decorate();
    if(typeof window.refreshDashboardDocumentLifecycle==='function') window.refreshDashboardDocumentLifecycle();
    installCoordinator();
  };

  const hasButtonTarget=(el,target)=>[...el.querySelectorAll('button')].some(btn=>String(btn.getAttribute('onclick')||'').includes(`loadModule('${target}')`));

  const injectDashboardActions=()=>{
    const candidates=[...document.querySelectorAll('#app-content .grid.grid-cols-2.gap-3')];
    const grid=candidates.find(el=>hasButtonTarget(el,'progetti')&&hasButtonTarget(el,'stampe'));
    if(!grid||grid.dataset.professionalActions==='1') return;
    grid.dataset.professionalActions='1';
    const items=[
      ['window.apriRientroDocumenti && window.apriRientroDocumenti()','scan-line','Rientro documenti','violet'],
      ['window.apriChiusuraCorsiGuidata && window.apriChiusuraCorsiGuidata()','lock-keyhole','Chiusura corso','amber'],
      ["window.loadModule('attivita')",'history','Attività','cyan'],
      ["window.loadModule('collaudo')",'shield-check','Collaudo','emerald']
    ];
    items.forEach(([onclick,icon,label,tone])=>{
      const b=document.createElement('button');
      b.setAttribute('onclick',onclick);
      b.className=`p-4 rounded-2xl border border-${tone}-200 bg-${tone}-50 hover:bg-${tone}-100 transition text-center group`;
      b.innerHTML=`<i data-lucide="${icon}" class="w-7 h-7 mx-auto mb-2 text-${tone}-600"></i><span class="text-[10px] font-black text-${tone}-900 uppercase tracking-widest">${label}</span>`;
      grid.appendChild(b);
    });
    if(typeof lucide!=='undefined') lucide.createIcons();
  };

  const POPUP_SELECTOR='[id*="modal"],[id*="popup"],#panel-iscrizioni,.fixed.inset-0';
  const EVIDENCE_SELECTOR='#step67-evidence-url,[data-safety-evidence-path="1"],input[id*="evidence"][type="text"],input[name*="evidence"][type="text"],input[id*="evidenza"][type="text"],input[name*="evidenza"][type="text"]';
  const RIENTRO_BUTTON_SELECTOR='button[onclick*="SafetyRientroDocumenti.setStatus"]';

  const pending={frame:false,layout:false,navigation:false,ui:false,dashboard:false,rientro:false,evidenceRoots:new Set()};

  function queueFlush(){
    if(pending.frame) return;
    pending.frame=true;
    requestAnimationFrame(()=>{
      pending.frame=false;
      const work={
        layout:pending.layout,navigation:pending.navigation,ui:pending.ui,dashboard:pending.dashboard,rientro:pending.rientro,
        evidenceRoots:[...pending.evidenceRoots]
      };
      pending.layout=pending.navigation=pending.ui=pending.dashboard=pending.rientro=false;
      pending.evidenceRoots.clear();

      if(work.dashboard) injectDashboardActions();
      if(work.layout&&typeof window.applySafetyLayout==='function') window.applySafetyLayout();
      if(work.evidenceRoots.length&&typeof window.SafetyLocalEvidence?.decorate==='function') work.evidenceRoots.forEach(root=>window.SafetyLocalEvidence.decorate(root));
      if(work.rientro&&typeof window.SafetyRientroEvidence?.decorate==='function') window.SafetyRientroEvidence.decorate();
      if(work.ui&&typeof window.SafetyUIIntegrity?.schedule==='function') window.SafetyUIIntegrity.schedule();
      if(work.navigation&&typeof window.SafetyNavigation?.decorate==='function') window.SafetyNavigation.decorate();
    });
  }

  function queue(key,root){
    if(key==='evidence') pending.evidenceRoots.add(root||document);
    else pending[key]=true;
    queueFlush();
  }

  function asElement(node){return node instanceof HTMLElement?node:null;}
  function isInsideOwnNavigation(el){return !!el?.closest?.('.safety-popup-nav,.safety-page-nav');}

  function popupSignal(el){
    if(!el||isInsideOwnNavigation(el)) return false;
    if(el.matches?.(POPUP_SELECTOR)) return true;
    return !!el.querySelector?.(POPUP_SELECTOR);
  }

  function evidenceSignal(el){
    if(!el) return false;
    if(el.matches?.(EVIDENCE_SELECTOR)||el.querySelector?.(EVIDENCE_SELECTOR)) return true;
    const labels=[];
    if(el.matches?.('label')) labels.push(el);
    el.querySelectorAll?.('label').forEach(label=>labels.push(label));
    return labels.some(label=>/link o percorso evidenza|percorso evidenza|link evidenza/i.test(String(label.textContent||'')));
  }

  function rientroSignal(el){
    if(!el) return false;
    if(el.id==='safety-rientro-documenti-modal') return true;
    if(el.matches?.(RientRO_BUTTON_SELECTOR)) return true;
    return !!el.querySelector?.(RientRO_BUTTON_SELECTOR);
  }

  // alias locale per evitare lookup ripetuti e mantenere il selettore leggibile
  const RientRO_BUTTON_SELECTOR=RientRO_BUTTON_SELECTOR;

  function dashboardSignal(el){
    if(!el) return false;
    return el.id==='dash-action-plan'||!!el.querySelector?.('#dash-action-plan');
  }

  function moduleStructureSignal(mutation,el){
    const app=document.getElementById('app-content');
    if(!app) return false;
    if(mutation.target===app) return true;
    if(el?.id==='safety-module-toolbar'||el?.classList?.contains('safety-module-toolbar')) return true;
    return false;
  }

  function installCoordinator(){
    if(window.__safetyDomCoordinatorInstalled||typeof MutationObserver==='undefined') return;
    window.__safetyDomCoordinatorInstalled=true;
    const root=document.body;
    if(!root) return;

    const observer=new MutationObserver(mutations=>{
      for(const mutation of mutations){
        if(mutation.type==='attributes'){
          const target=asElement(mutation.target);
          if(target?.matches?.(POPUP_SELECTOR)&&!isInsideOwnNavigation(target)){
            queue('ui');
            queue('navigation');
          }
          continue;
        }

        for(const node of mutation.addedNodes){
          const el=asElement(node);
          if(!el) continue;

          if(moduleStructureSignal(mutation,el)){
            queue('layout');
            queue('navigation');
          }
          if(dashboardSignal(el)) queue('dashboard');
          if(popupSignal(el)){
            queue('ui');
            queue('navigation');
          }
          if(evidenceSignal(el)) queue('evidence',el);
          if(rientroSignal(el)) queue('rientro');
        }
      }
    });

    observer.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','aria-hidden']});
    window.SafetyDomCoordinator={
      refreshAll(){queue('layout');queue('navigation');queue('ui');queue('evidence',document);if(document.getElementById('safety-rientro-documenti-modal'))queue('rientro');},
      observer
    };
  }

  window.injectProfessionalDashboardActions=injectDashboardActions;
  loadAll();
})();
