/* SafetyManager Pro G6 — navigazione mobile e micro-UX.
 * Pure UI enhancement: non modifica loadModule, Supabase, PDF, form o stampa.
 */
(function(){
'use strict';
if(window.__safetyGraphicG6Loaded)return;
window.__safetyGraphicG6Loaded=true;
const nav=document.getElementById('top-nav');
const inner=document.getElementById('top-nav-inner');
const buttons=document.getElementById('top-nav-buttons');
if(!nav||!inner||!buttons)return;
const STYLE_ID='safety-graphic-g6-style';
const LABELS={
 admin:'Dashboard',aziende:'Aziende',corsisti:'Corsisti',docenti:'Docenti',
 progetti:'Progetti',archivio_corsi:'Archivio corsi',scadenze:'Scadenze',
 stampe:'Centro stampe',kit_cliente:'Kit cliente',procedure:'Procedure in pausa',
 migrazione:'Migrazione',collaudo:'Collaudo',ente:'Impostazioni',
 'safety-logout':'Esci','install-pwa':'Installa'
};
const css=[
 '#safety-g6-toggle{display:none}',
 '@media(max-width:768px){',
 ' #top-nav.safety-g6-nav #top-nav-inner{position:relative!important;min-height:68px!important;flex-direction:row!important;align-items:center!important;justify-content:space-between!important;flex-wrap:nowrap!important;gap:8px!important;padding:8px 12px!important}',
 ' #top-nav.safety-g6-nav #top-nav-brand{min-width:0!important;justify-content:flex-start!important;align-self:center!important;margin:0!important;gap:8px!important}',
 ' #top-nav.safety-g6-nav #top-nav-brand h1{font-size:1.3rem!important}',
 ' #top-nav.safety-g6-nav #top-nav-brand p{letter-spacing:.08em!important;font-size:7px!important}',
 ' #top-nav.safety-g6-nav #top-nav-buttons{display:none!important;position:absolute!important;top:100%!important;left:0!important;right:0!important;width:100%!important;max-width:none!important;max-height:calc(100dvh - 76px)!important;overflow-x:hidden!important;overflow-y:auto!important;overscroll-behavior:contain!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;align-items:stretch!important;gap:8px!important;padding:12px calc(12px + env(safe-area-inset-right,0px)) calc(15px + env(safe-area-inset-bottom,0px)) calc(12px + env(safe-area-inset-left,0px))!important;background:#0f172a!important;border:1px solid #334155!important;border-top:1px solid #475569!important;border-radius:0 0 18px 18px!important;box-shadow:0 20px 44px rgba(2,6,23,.34)!important}',
 ' #top-nav.safety-g6-nav.safety-g6-open #top-nav-buttons{display:grid!important}',
 ' #top-nav.safety-g6-nav #top-nav-buttons>.btn-tab{display:flex!important;align-items:center!important;justify-content:flex-start!important;min-height:48px!important;min-width:0!important;width:100%!important;flex:none!important;opacity:1!important;padding:8px!important;border-radius:12px!important;text-align:left!important;border:1px solid #334155!important}',
 ' #top-nav.safety-g6-nav #top-nav-buttons>.btn-tab .icon-box{flex:none!important}',
 ' #top-nav.safety-g6-nav #top-nav-buttons>.btn-tab span{display:block!important;min-width:0!important;white-space:normal!important;overflow-wrap:anywhere!important;font-size:11px!important;line-height:1.3!important;color:#e2e8f0!important}',
 ' #top-nav.safety-g6-nav #top-nav-buttons>.btn-tab.active{border-color:#60a5fa!important;background:#1e3a5f!important}',
 ' #top-nav.safety-g6-nav #top-nav-buttons>div:not(.btn-tab){display:none!important}',
 ' #safety-g6-toggle{display:inline-flex!important;min-height:44px;min-width:90px;flex:none;align-items:center;justify-content:center;gap:8px;padding:8px 12px;color:#f8fafc;border:1px solid #475569;border-radius:12px;background:#1e293b;font-size:12px;font-weight:800;cursor:pointer}',
 ' #safety-g6-toggle:hover,#safety-g6-toggle[aria-expanded="true"]{background:#1d4ed8;border-color:#60a5fa}',
 ' #safety-g6-toggle:focus-visible,#top-nav.safety-g6-nav #top-nav-buttons>.btn-tab:focus-visible{outline:3px solid #93c5fd!important;outline-offset:2px!important}',
 ' #safety-g6-toggle svg{width:18px;height:18px;flex:none}',
 ' body:not(.is-printing-temp) #view-scadenze>div.grid:first-of-type{grid-template-columns:repeat(2,minmax(0,1fr))!important}',
 ' body:not(.is-printing-temp) #app-content[data-safety-module="archivio_corsi"] #archivio-advanced-stats{grid-template-columns:repeat(2,minmax(0,1fr))!important}',
 ' body:not(.is-printing-temp) #view-scadenze button,body:not(.is-printing-temp) #app-content[data-safety-module="archivio_corsi"] button{min-height:44px}',
 ' body:not(.is-printing-temp) #view-scadenze input,body:not(.is-printing-temp) #view-scadenze select,body:not(.is-printing-temp) #app-content[data-safety-module="archivio_corsi"] input,body:not(.is-printing-temp) #app-content[data-safety-module="archivio_corsi"] select,body:not(.is-printing-temp) #app-content[data-safety-module="stampe"] select{font-size:16px!important;max-width:100%;min-width:0}',
 ' body:not(.is-printing-temp) #view-scadenze h1,body:not(.is-printing-temp) #app-content[data-safety-module="archivio_corsi"] h1{font-size:clamp(1.4rem,6vw,2rem)!important;line-height:1.15!important;overflow-wrap:anywhere}',
 ' body:not(.is-printing-temp) #app-content[data-safety-module="stampe"] .safety-print-viewport{min-height:400px!important;max-height:72dvh!important;overflow:auto!important;overscroll-behavior:contain!important}',
 ' body:not(.is-printing-temp) #app-content[data-safety-module="stampe"] .safety-print-viewport #print-preview-container{flex:0 0 auto!important}',
 '}',
 '@media(max-width:380px){#top-nav.safety-g6-nav #top-nav-buttons{grid-template-columns:1fr!important}#safety-g6-toggle{min-width:78px;padding:7px 9px}}',
 '@media(prefers-reduced-motion:reduce){#safety-g6-toggle{transition:none!important}}',
 '@media print{#safety-g6-toggle{display:none!important}#top-nav.safety-g6-nav #top-nav-buttons{display:none!important}}'
].join('\n');
if(!document.getElementById(STYLE_ID)){
 const style=document.createElement('style');style.id=STYLE_ID;style.textContent=css;document.head.appendChild(style);
}
const toggle=document.createElement('button');
toggle.id='safety-g6-toggle';toggle.type='button';
toggle.setAttribute('aria-label','Apri menu di navigazione');
toggle.setAttribute('aria-controls','top-nav-buttons');
toggle.setAttribute('aria-expanded','false');
toggle.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg><span>Menu</span>';
inner.insertBefore(toggle,buttons);
nav.classList.add('safety-g6-nav');
function isMobile(){return typeof window.matchMedia==='function'?window.matchMedia('(max-width: 768px)').matches:window.innerWidth<=768}
function isOpen(){return nav.classList.contains('safety-g6-open')}
function close(focus=false){
 if(!isOpen())return;
 nav.classList.remove('safety-g6-open');
 toggle.setAttribute('aria-expanded','false');
 toggle.setAttribute('aria-label','Apri menu di navigazione');
 if(focus)toggle.focus();
}
function open(){
 if(!isMobile())return;
 nav.classList.add('safety-g6-open');
 toggle.setAttribute('aria-expanded','true');
 toggle.setAttribute('aria-label','Chiudi menu di navigazione');
}
function displayName(button){
 const key=String(button.id||'').replace(/^nav-/,'');
 return LABELS[key]||button.querySelector('span')?.textContent?.trim()||button.getAttribute('title')||key||'Sezione';
}
function syncLabels(){
 const links=buttons.querySelectorAll('button[id^="nav-"]');
 for(const link of links){
   const title=displayName(link);
   if(!link.getAttribute('aria-label'))link.setAttribute('aria-label',title);
   if(link.classList.contains('active')){
     link.setAttribute('aria-current','page');
   }else{
     link.removeAttribute('aria-current');
   }
   if(link.id==='nav-ente'&&!link.querySelector('span')){
     const span=document.createElement('span');span.className='safety-g6-nav-label';span.textContent=title;
     link.appendChild(span);
   }
 }
}
toggle.addEventListener('click',()=>{isOpen()?close():open()});
buttons.addEventListener('click',event=>{
 const btn=event.target.closest?.('button[id^="nav-"]');
 if(btn&&isMobile())close();
});
document.addEventListener('pointerdown',event=>{
 if(isOpen()&&!nav.contains(event.target))close();
});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&isOpen()){
   event.preventDefault();event.stopPropagation();close(true);
 }
});
window.addEventListener('resize',()=>{if(!isMobile())close()},{passive:true});
syncLabels();
if(typeof MutationObserver!=='undefined'){
 const observer=new MutationObserver(syncLabels);
 observer.observe(buttons,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
}
window.SafetyGraphicG6={open,close,isOpen,syncLabels,isMobile};
})();