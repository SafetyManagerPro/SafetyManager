// Loader professionale Step 15-19 + modelli azienda/lavoratore
(function(){
  if(window.__safetyProfessionalSuiteLoaded) return;
  window.__safetyProfessionalSuiteLoaded=true;

  const loadAll = async () => {
    if(typeof window.loadOptionalSafetyScript !== 'function') return;
    const files=[
      'js/modules/ui_refinements.js',
      'js/modules/workflow_guard.js',
      'js/modules/documenti_azienda_lavoratore_core.js',
      'js/modules/documenti_azienda_lavoratore_ui.js',
      'js/modules/documenti_azienda_lavoratore_print.js',
      'js/modules/collaudo_pro.js',
      'js/modules/audit_attivita.js',
      'js/modules/chiusura_corso.js',
      'js/modules/scadenze_avanzate.js',
      'js/modules/kit_cliente_pro.js',
      'js/modules/archivio_avanzato.js',
      'js/modules/import_guidato.js'
    ];
    for(const file of files) await window.loadOptionalSafetyScript(file);
    injectDashboardActions();
    if(typeof window.applySafetyUiRefinements==='function') window.applySafetyUiRefinements('admin');
    if(typeof window.applySafetyWorkflowFixes==='function') window.applySafetyWorkflowFixes('admin');
  };

  const hasButtonTarget = (el, target) => [...el.querySelectorAll('button')].some(btn => String(btn.getAttribute('onclick') || '').includes(`loadModule('${target}')`));

  const injectDashboardActions = () => {
    const candidates=[...document.querySelectorAll('#app-content .grid.grid-cols-2.gap-3')];
    const grid=candidates.find(el=>hasButtonTarget(el,'progetti') && hasButtonTarget(el,'stampe'));
    if(!grid || grid.dataset.professionalActions==='1') return;
    grid.dataset.professionalActions='1';
    const items=[
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

  window.injectProfessionalDashboardActions=injectDashboardActions;
  loadAll();
  const root=document.getElementById('app-content')||document.body;
  const obs=new MutationObserver(()=>{if(document.getElementById('dash-action-plan'))injectDashboardActions();});
  obs.observe(root,{childList:true,subtree:true});
})();