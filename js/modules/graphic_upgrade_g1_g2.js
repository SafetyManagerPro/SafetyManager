/* SafetyManager Pro — G1/G2 upgrade grafico progressivo.
 * Il modulo sposta nel popup i form ESISTENTI, senza clonarli o duplicare ID.
 * Nessuna nuova query o scrittura dati; salvataggi e controlli restano quelli originali.
 */
(function(){
'use strict';
if(window.__safetyGraphicG1G2Loaded)return;
window.__safetyGraphicG1G2Loaded=true;
const STYLE_ID='safety-graphic-g1-g2-style';
const FORM_INFO={
  corsisti:{form:'form-corsista',card:'corsista-form-card',title:'Corsista',newLabel:'Nuovo corsista',focus:'cor-nome',id:'cor-id',reset:'resetFormCorsista',edit:'modificaCorsista',save:'salvaCorsistaDB'},
  aziende:{form:'form-azienda',card:null,title:'Azienda',newLabel:'Nuova azienda',focus:'az-ragione-sociale',id:'az-id',reset:'resetFormAzienda',edit:'modificaAzienda',save:'salvaAziendaDB'}
};
let active=null;
const css=[
 ':root{--safety-g1-primary:#1658b8;--safety-g1-border:#d9e2ed;--safety-g1-surface:#ffffff;--safety-g1-ink:#162335;--safety-g1-radius:18px}',
 'body:not(.is-printing-temp) #app-content .safety-module-root > div.bg-white,body:not(.is-printing-temp) #app-content .safety-module-root .shadow-sm.border.border-slate-200{border-radius:var(--safety-g1-radius);border-color:var(--safety-g1-border);box-shadow:0 6px 22px rgba(16,43,75,.045)}',
 'body:not(.is-printing-temp) #app-content h1{letter-spacing:-.03em}',
 'body:not(.is-printing-temp) #app-content input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):focus-visible,body:not(.is-printing-temp) #app-content select:focus-visible,body:not(.is-printing-temp) #app-content textarea:focus-visible{outline:2px solid rgba(22,88,184,.55);outline-offset:1px;border-color:var(--safety-g1-primary)}',
 'body:not(.is-printing-temp) #app-content button{transition:background-color .15s ease,border-color .15s ease,box-shadow .15s ease}',
 'body:not(.is-printing-temp) #app-content button:focus-visible,.safety-g2-overlay button:focus-visible{outline:3px solid #93c5fd;outline-offset:2px}',
 'body:not(.is-printing-temp) #app-content table tbody tr:hover{background-color:rgba(225,236,251,.38)}',
 'body:not(.is-printing-temp) #app-content table tbody tr:focus-within{background-color:rgba(225,236,251,.6)}',
 'body:not(.is-printing-temp) #top-nav .btn-tab.active{box-shadow:inset 0 -2px 0 #60a5fa}',
 '.safety-g2-sidebar{display:none!important}',
 '#view-aziende.safety-g2-wide > .grid > :not(.safety-g2-sidebar){grid-column:1/-1!important}',
 '#view-aziende.safety-g2-wide > .grid{grid-template-columns:minmax(0,1fr)!important}',
 '.safety-g2-new-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:42px;border:1px solid #1d4ed8;border-radius:12px;padding:10px 16px;background:#1d4ed8;color:#fff;font-size:12px;font-weight:800;box-shadow:0 8px 20px rgba(29,78,216,.15);cursor:pointer;white-space:nowrap}',
 '.safety-g2-new-btn:hover{background:#1e40af}',
 '.safety-g2-quickbar{margin:12px 0 15px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}',
 '.safety-g2-quickbar-note{font-size:12px;color:#64748b;line-height:1.5}',
 '.safety-g2-overlay[hidden]{display:none!important}',
 '.safety-g2-overlay{position:fixed!important;inset:0!important;z-index:160000!important;display:flex!important;align-items:center;justify-content:center;padding:clamp(8px,3vw,24px)!important;background:rgba(15,23,42,.74)!important;backdrop-filter:blur(5px);overscroll-behavior:contain}',
 '.safety-g2-dialog{display:flex;flex-direction:column;width:min(680px,100%);max-height:calc(100dvh - 20px);min-height:0;overflow:hidden;border-radius:20px;border:1px solid #dbe4f0;background:#fff;box-shadow:0 28px 85px rgba(3,20,42,.35)}',
 '.safety-g2-dialog-head{flex:none;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:17px 20px;background:linear-gradient(110deg,#142640,#243d61);color:#fff}',
 '.safety-g2-dialog-head h2{font-size:18px;font-weight:800;line-height:1.25;margin:0}',
 '.safety-g2-dialog-head p{font-size:11px;margin-top:5px;color:#d3deee}',
 '.safety-g2-dialog-close{display:inline-flex;align-items:center;justify-content:center;min-width:44px;min-height:44px;border-radius:11px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.12);color:#fff;font-size:24px;cursor:pointer}',
 '.safety-g2-dialog-close:hover{background:rgba(255,255,255,.24)}',
 '.safety-g2-dialog-body{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;padding:18px 20px 25px;scrollbar-gutter:stable}',
 '.safety-g2-dialog-body #corsista-form-card,.safety-g2-dialog-body .safety-g2-company-card{position:static!important;inset:auto!important;top:auto!important;max-width:none!important;width:100%!important;max-height:none!important;overflow:visible!important;padding:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:#fff!important}',
 '.safety-g2-dialog-body #corsista-form-card>h2,.safety-g2-dialog-body .safety-g2-company-card>h3{display:none}',
 '.safety-g2-overlay .safety-g2-dialog-body input:not([type="checkbox"]):not([type="radio"]),.safety-g2-overlay .safety-g2-dialog-body select,.safety-g2-overlay .safety-g2-dialog-body textarea{max-width:100%;box-sizing:border-box}',
 '.safety-g2-overlay .safety-g2-dialog-body button{min-height:36px}',
 '.safety-g2-overlay .safety-g2-dialog-body button[type="submit"]{min-height:44px}',
 '#azienda-relazioni-modal:not(.hidden)>div{border-radius:20px;box-shadow:0 24px 70px rgba(0,0,0,.32)}',
 '@media(max-width:640px){.safety-g2-dialog{max-height:calc(100dvh - 12px);border-radius:16px}.safety-g2-overlay{padding:6px!important}.safety-g2-dialog-head{padding:12px 14px}.safety-g2-dialog-body{padding:15px 14px 25px}.safety-g2-quickbar{align-items:stretch}.safety-g2-new-btn{width:100%}}',
 '@media(prefers-reduced-motion:reduce){.safety-g2-new-btn,body:not(.is-printing-temp) #app-content button{transition:none!important}}',
 '@media print{.safety-g2-overlay,.safety-g2-quickbar{display:none!important}.safety-g2-sidebar{display:none!important}}'
].join('\n');

function injectStyle(){
 if(document.getElementById(STYLE_ID))return;
 const style=document.createElement('style');style.id=STYLE_ID;style.textContent=css;
 document.head.appendChild(style);
}
function getKind(){
 if(document.getElementById('form-corsista'))return 'corsisti';
 if(document.getElementById('form-azienda'))return 'aziende';
 return '';
}
function fieldsSnapshot(form){
 if(!form)return '';
 return Array.from(form.querySelectorAll('input,select,textarea'))
  .filter(el=>el.type!=='hidden'&&el.type!=='button'&&el.type!=='submit')
  .map(el=>el.id+':'+((el.type==='checkbox'||el.type==='radio')?String(!!el.checked):String(el.value||''))).join('|');
}
function restoreScroll(){
 if(!active)return;
 document.body.style.overflow=active.bodyOverflow||'';
}
function teardown(){
 if(!active)return;
 const state=active;restoreScroll();
 if(state.card&&state.marker?.parentNode)state.marker.parentNode.replaceChild(state.card,state.marker);
 if(state.overlay?.parentNode)state.overlay.remove();
 if(state.sidebar?.classList)state.sidebar.classList.remove('safety-g2-sidebar');
 if(state.companyPage?.classList)state.companyPage.classList.remove('safety-g2-wide');
 active=null;
}
function changed(){return !!(active?.opened&&fieldsSnapshot(active.form)!==active.baseline);}
function close(force){
 if(!active||!active.opened)return true;
 if(!force){
   if(active.saving){window.alert('Salvataggio in corso. Completa prima il salvataggio.');return false;}
   if(changed()&&!window.confirm('Ci sono modifiche non salvate. Vuoi chiudere senza salvarle?'))return false;
 }
 const prev=active.previousFocus;
 active.opened=false;
 active.overlay.hidden=true;
 active.bodyOverflow!==undefined&&(document.body.style.overflow=active.bodyOverflow);
 if(prev?.isConnected&&typeof prev.focus==='function')prev.focus();
 return true;
}
function focusFirst(state){
 const focused=state.form.querySelector('input:not([type="hidden"]):not([disabled]),select:not([disabled]),textarea:not([disabled])');
 (document.getElementById(FORM_INFO[state.kind].focus)||focused||state.closeButton).focus?.();
}
function show(kind,mode){
 if(!active||active.kind!==kind)return false;
 if(active.opened&&active.saving)return false;
 const info=FORM_INFO[kind];
 if(mode==='new'&&typeof window[info.reset]==='function'){
    if(active.opened&&changed()&&!window.confirm('Abbandonare le modifiche e creare una nuova scheda?'))return false;
    window[info.reset]();
 }
 active.baseline=fieldsSnapshot(active.form);
 active.previousFocus=document.activeElement;
 active.opened=true;
 active.saved=false;
 active.bodyOverflow=document.body.style.overflow;
 document.body.style.overflow='hidden';
 active.overlay.hidden=false;
 const recordId=document.getElementById(info.id)?.value;
 active.modalTitle.textContent=(recordId?'Modifica ':'Nuovo / nuova ')+(recordId?info.title.toLowerCase():info.title.toLowerCase());
 if(kind==='corsisti'&&!recordId)active.modalTitle.textContent='Nuovo corsista';
 if(kind==='aziende'&&!recordId)active.modalTitle.textContent='Nuova azienda';
 active.modalSubtitle.textContent=recordId?'Modifica i dati già presenti. Il salvataggio usa i controlli esistenti.':'Compila la scheda e salva: tutti i controlli esistenti restano attivi.';
 active.modalBody.scrollTop=0;
 focusFirst(active);
 return true;
}
function focusTrap(event){
 if(!active?.opened)return;
 if(event.key==='Escape'){
   event.preventDefault();event.stopPropagation();
   close(false);return;
 }
 if(event.key!=='Tab')return;
 const focusables=Array.from(active.overlay.querySelectorAll('button:not(:disabled),input:not([type="hidden"]):not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]'))
   .filter(e=>e.getClientRects?.().length>0);
 if(!focusables.length)return;
 const first=focusables[0],last=focusables[focusables.length-1];
 if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
 else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
}
function enhance(kind){
 const app=document.getElementById('app-content'),info=FORM_INFO[kind];
 if(!app||!info)return false;
 if(active&&active.overlay?.isConnected){
   if(active.kind===kind)return true;
   teardown();
 }
 const form=document.getElementById(info.form),card=info.card?document.getElementById(info.card):form?.parentElement;
 if(!form||!card||!card.parentNode)return false;
 // In Corsisti il form ha una colonna propria; in Aziende il card e' figlio
 // DIRETTO della griglia, quindi NON si deve nascondere il parent (la griglia).
 const sidebar=kind==='corsisti'?card.parentElement:null;
 const title=kind==='corsisti'
   ? Array.from(app.querySelectorAll('h1')).find(el=>/anagrafica corsisti/i.test(el.textContent||''))
   : app.querySelector('#view-aziende h1');
 if(!title)return false;
 const quickbar=document.createElement('div');
 quickbar.className='safety-g2-quickbar';
 const btn=document.createElement('button');btn.type='button';btn.className='safety-g2-new-btn';btn.setAttribute('data-safety-g2-open',kind);
 btn.textContent='+ '+info.newLabel;
 btn.addEventListener('click',()=>show(kind,'new'));
 const note=document.createElement('span');note.className='safety-g2-quickbar-note';
 note.textContent='Inserimento e modifica in finestra, senza lasciare la pagina.';
 quickbar.append(btn,note);
 title.parentNode.appendChild(quickbar);
 const marker=document.createComment('Form gestito dal popup G2');
 card.parentNode.insertBefore(marker,card);
 const overlay=document.createElement('div');overlay.className='safety-g2-overlay';overlay.id='safety-g2-overlay';
 overlay.hidden=true;
 overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','safety-g2-title');
 overlay.innerHTML='<div class="safety-g2-dialog">'+
  '<div class="safety-g2-dialog-head"><div><h2 id="safety-g2-title"></h2><p id="safety-g2-subtitle"></p></div>'+
  '<button class="safety-g2-dialog-close" type="button" aria-label="Chiudi popup" data-safety-g2-close="1">×</button></div>'+
  '<div class="safety-g2-dialog-body" id="safety-g2-body"><div id="safety-g2-slot"></div></div></div>';
 app.appendChild(overlay);
 overlay.querySelector('#safety-g2-slot').appendChild(card);
 if(kind==='aziende')card.classList.add('safety-g2-company-card');
 if(sidebar)sidebar.classList.add('safety-g2-sidebar');
 const companyPage=kind==='aziende'?document.getElementById('view-aziende'):null;
 if(companyPage)companyPage.classList.add('safety-g2-wide');
 active={kind,form,card,sidebar,marker,overlay,companyPage,quickbar,opened:false,saving:false,saved:false,
   baseline:'',previousFocus:null,bodyOverflow:'',modalTitle:overlay.querySelector('#safety-g2-title'),
   modalSubtitle:overlay.querySelector('#safety-g2-subtitle'),modalBody:overlay.querySelector('#safety-g2-body'),
   closeButton:overlay.querySelector('[data-safety-g2-close]')};
 overlay.addEventListener('click',e=>{
   if(e.target===overlay||e.target.closest('[data-safety-g2-close]'))close(false);
 });
 overlay.addEventListener('keydown',focusTrap);
 return true;
}
function wrapEdit(kind){
 const name=FORM_INFO[kind].edit,original=window[name];
 if(typeof original!=='function'||original.__safetyG2Wrapped)return;
 const wrapped=function(){
   const result=original.apply(this,arguments);
   if(getKind()===kind&&active?.kind===kind&&document.getElementById(FORM_INFO[kind].id)?.value)show(kind,'edit');
   return result;
 };
 wrapped.__safetyG2Wrapped=true;window[name]=wrapped;
}
function wrapReset(kind){
 const name=FORM_INFO[kind].reset,original=window[name];
 if(typeof original!=='function'||original.__safetyG2Wrapped)return;
 const wrapped=function(){
   const result=original.apply(this,arguments);
   if(active?.kind===kind&&active.saving)active.saved=true;
   return result;
 };
 wrapped.__safetyG2Wrapped=true;window[name]=wrapped;
}
function wrapSave(kind){
 const name=FORM_INFO[kind].save,original=window[name];
 if(typeof original!=='function'||original.__safetyG2Wrapped)return;
 const wrapped=async function(){
   const modal=active?.kind===kind&&active.opened?active:null;
   if(modal?.saving)return;
   if(modal){modal.saving=true;modal.saved=false;modal.closeButton.disabled=true;}
   try{
     const result=await original.apply(this,arguments);
     if(modal?.saved&&active===modal)close(true);
     return result;
   }finally{
     if(modal){modal.saving=false;modal.closeButton.disabled=false;}
   }
 };
 wrapped.__safetyG2Wrapped=true;window[name]=wrapped;
}
function install(){
 injectStyle();
 Object.keys(FORM_INFO).forEach(kind=>{wrapEdit(kind);wrapReset(kind);wrapSave(kind);});
 if(typeof window.loadModule==='function'&&!window.loadModule.__safetyG2Wrapped){
   const original=window.loadModule;
   const wrapped=async function(moduleId){
     if(active?.opened&&active.saving){window.alert('Attendi la fine del salvataggio prima di cambiare sezione.');return;}
     if(active?.opened&&changed()&&!window.confirm('Modifiche non salvate. Vuoi cambiare sezione senza salvare?'))return;
     teardown();
     const result=await original.apply(this,arguments);
     if(moduleId==='corsisti'||moduleId==='aziende')enhance(moduleId);
     return result;
   };
   wrapped.__safetyG2Wrapped=true;window.loadModule=wrapped;
 }
 if(typeof window.showSafetyLogin==='function'&&!window.showSafetyLogin.__safetyG2Wrapped){
   const original=window.showSafetyLogin;
   const wrapped=function(){teardown();return original.apply(this,arguments);};
   wrapped.__safetyG2Wrapped=true;window.showSafetyLogin=wrapped;
 }
}
window.SafetyGraphicG1G2={enhance,openNew:kind=>show(kind,'new'),close:()=>close(false),isOpen:()=>!!active?.opened,hasUnsavedChanges:changed};
install();
})();