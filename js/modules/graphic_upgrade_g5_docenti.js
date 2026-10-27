/* SafetyManager Pro — G5, Docenti: stesso form originale in popup.
 * Nessuna query, scrittura, replica di campi o variazione ai permessi.
 */
(function(){
'use strict';
if(window.__safetyGraphicG5Loaded)return;
window.__safetyGraphicG5Loaded=true;
const STYLE_ID='safety-graphic-g5-style';
let active=null;
const fn={reset:window.resetFormDocente,edit:window.modificaDocente,save:window.salvaDocenteDB};
const node=id=>document.getElementById(id);
function snapshot(form){
 if(!form)return '';
 return Array.from(form.querySelectorAll('input,select,textarea'))
  .filter(e=>e.type!=='file'&&e.type!=='button'&&e.type!=='submit')
  .map(e=>(e.id||e.name||'')+':'+((e.type==='checkbox'||e.type==='radio')?String(!!e.checked):String(e.value||''))).join('|');
}
function hasChanges(){return !!active?.opened&&snapshot(active.form)!==active.baseline;}
function style(){
 if(node(STYLE_ID))return;
 const s=document.createElement('style');s.id=STYLE_ID;
 s.textContent=[
 'body:not(.is-printing-temp) #view-docenti.safety-g5-enhanced #docente-form-col{display:none!important}',
 'body:not(.is-printing-temp) #view-docenti.safety-g5-enhanced .safety-g5-table{width:100%!important;flex:1 1 100%!important;min-width:0}',
 '#view-docenti.safety-g5-enhanced{max-width:none!important}',
 '#view-docenti.safety-g5-enhanced .safety-g5-table{border-radius:18px!important;box-shadow:0 8px 25px rgba(15,23,42,.055)}',
 '#view-docenti.safety-g5-enhanced #tabella-docenti tr:hover{background:rgba(219,234,254,.38)}',
 '#view-docenti.safety-g5-enhanced #tabella-docenti td:last-child button{min-height:42px;min-width:42px;margin:2px;border-radius:10px}',
 '.safety-g5-toolbar{display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin:12px 0 0}',
 '.safety-g5-new{display:inline-flex;align-items:center;justify-content:center;gap:7px;border:1px solid #047857;border-radius:12px;background:#047857;color:white;padding:10px 16px;min-height:44px;font-size:12px;font-weight:800;cursor:pointer;box-shadow:0 8px 20px rgba(4,120,87,.14)}',
 '.safety-g5-new:hover{background:#065f46}',
 '.safety-g5-count{font-size:12px;color:#64748b;line-height:1.4}',
 '.safety-g5-overlay[hidden]{display:none!important}',
 '.safety-g5-overlay{position:fixed!important;inset:0!important;z-index:160001!important;display:flex;align-items:center;justify-content:center;padding:clamp(6px,2.4vw,20px);background:rgba(15,23,42,.74);backdrop-filter:blur(5px);overscroll-behavior:contain}',
 '.safety-g5-dialog{display:flex;flex-direction:column;width:min(790px,100%);height:auto;max-height:calc(100dvh - 18px);min-height:0;overflow:hidden;border-radius:20px;background:#fff;border:1px solid #cbd5e1;box-shadow:0 26px 80px rgba(15,23,42,.3)}',
 '.safety-g5-dialog-head{flex:none;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 20px;background:linear-gradient(110deg,#163c36,#196154);color:#fff}',
 '.safety-g5-dialog-title{font-size:17px;font-weight:900;line-height:1.3}',
 '.safety-g5-dialog-subtitle{font-size:11px;color:#d1fae5;margin-top:4px}',
 '.safety-g5-close{min-width:44px;min-height:44px;border:1px solid rgba(255,255,255,.35);border-radius:12px;background:rgba(255,255,255,.12);color:#fff;font-size:24px;line-height:1;cursor:pointer}',
 '.safety-g5-close:hover{background:rgba(255,255,255,.25)}',
 '.safety-g5-dialog-body{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:16px 20px 24px;scrollbar-gutter:stable}',
 'body:not(.is-printing-temp) .safety-g5-overlay #docente-form-card{position:static!important;top:auto!important;max-height:none!important;overflow:visible!important;width:100%!important;border:0!important;border-radius:0!important;box-shadow:none!important;padding:0!important;margin:0!important}',
 '.safety-g5-overlay #docente-form-card>h3{display:none!important}',
 '.safety-g5-overlay #docente-form-card input,.safety-g5-overlay #docente-form-card select,.safety-g5-overlay #docente-form-card textarea{max-width:100%;box-sizing:border-box}',
 '.safety-g5-overlay #docente-form-card button{min-height:40px}',
 '.safety-g5-overlay #docente-form-card button[type="submit"]{min-height:44px}',
 '.safety-g5-new:focus-visible,.safety-g5-close:focus-visible,.safety-g5-overlay button:focus-visible{outline:3px solid #93c5fd;outline-offset:2px}',
 '@media(max-width:640px){.safety-g5-overlay{padding:5px}.safety-g5-dialog{max-height:calc(100dvh - 10px);border-radius:14px}.safety-g5-dialog-head{padding:11px 13px}.safety-g5-dialog-body{padding:14px 12px 22px}.safety-g5-new{width:100%}.safety-g5-toolbar{align-items:stretch}.safety-g5-overlay #docente-form-card input[type="file"]{max-width:100%;font-size:11px}}',
 '@media(prefers-reduced-motion:reduce){.safety-g5-new,.safety-g5-close{transition:none!important}}',
 '@media print{.safety-g5-overlay,.safety-g5-toolbar{display:none!important}}'
 ].join('\n');
 document.head.appendChild(s);
}
function restore(){
 if(active)document.body.style.overflow=active.previousOverflow;
}
function close(force){
 if(!active||!active.opened)return true;
 if(!force){
   if(active.saving){window.alert('Salvataggio del docente in corso.');return false;}
   if(hasChanges()&&!window.confirm('Ci sono modifiche non salvate. Chiudere senza salvarle?'))return false;
 }
 const prev=active.trigger;
 active.opened=false;
 active.overlay.hidden=true;
 restore();
 if(prev?.isConnected&&typeof prev.focus==='function')prev.focus();
 return true;
}
function teardown(){
 if(!active)return;
 const s=active;
 close(true);
 if(s.card&&s.marker?.parentNode)s.marker.parentNode.replaceChild(s.card,s.marker);
 s.overlay?.remove();
 s.toolbar?.remove();
 s.view?.classList.remove('safety-g5-enhanced');
 s.table?.classList.remove('safety-g5-table');
 active=null;
}
function show(title){
 if(!active)return false;
 if(active.opened&&active.saving)return false;
 if(!active.opened){
   active.trigger=document.activeElement;
   active.previousOverflow=document.body.style.overflow||'';
 }
 active.baseline=snapshot(active.form);
 active.opened=true;
 active.saveSawReset=false;
 active.title.textContent=title;
 active.overlay.hidden=false;
 document.body.style.overflow='hidden';
 active.body.scrollTop=0;
 (node('doc-nome')||active.closeButton)?.focus?.();
 return true;
}
async function openNew(){
 if(!active||typeof fn.reset!=='function')return false;
 if(active.saving)return false;
 if(hasChanges()&&!window.confirm('Scartare le modifiche correnti e creare un nuovo docente?'))return false;
 // Reset ESISTENTE: aggiorna anche il select Azienda e la preview firma.
 await fn.reset();
 if(!active||!node('form-docente'))return false;
 return show('Nuovo docente');
}
function updateCount(){
 if(!active)return;
 const note=active.toolbar?.querySelector('[data-safety-g5-count]');
 if(note)note.textContent=Array.isArray(window.docentiList)?window.docentiList.length+' docenti caricati':'Anagrafica docenti';
}
function enhance(){
 const view=node('view-docenti'),col=node('docente-form-col'),card=node('docente-form-card'),form=node('form-docente');
 if(!view||!col||!card||!form)return false;
 if(active?.view===view){updateCount();return true;}
 if(active)teardown();
 style();
 const table=col.nextElementSibling;
 if(!table)return false;
 const anchor=document.createComment('Docente: origine modulo, nessun clone');
 card.parentNode.insertBefore(anchor,card);
 const overlay=document.createElement('div');
 overlay.id='safety-g5-overlay';
 overlay.className='safety-g5-overlay';
 overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
 overlay.setAttribute('aria-labelledby','safety-g5-title');
 overlay.hidden=true;
 overlay.innerHTML='<div class="safety-g5-dialog">'+
  '<div class="safety-g5-dialog-head"><div>'+
  '<h2 id="safety-g5-title" class="safety-g5-dialog-title">Docente</h2>'+
  '<p class="safety-g5-dialog-subtitle">Dati, requisiti e documenti nel modulo originale</p>'+
  '</div><button type="button" class="safety-g5-close" aria-label="Chiudi scheda docente" data-safety-g5-close>×</button></div>'+
  '<div class="safety-g5-dialog-body"><div id="safety-g5-form-slot"></div></div></div>';
 document.body.appendChild(overlay);
 overlay.querySelector('#safety-g5-form-slot').appendChild(card);
 const toolbar=document.createElement('div');toolbar.className='safety-g5-toolbar';
 toolbar.innerHTML='<button type="button" class="safety-g5-new" data-safety-g5-new>+ Nuovo docente</button>'+
  '<span class="safety-g5-count" data-safety-g5-count></span>';
 const heading=view.querySelector('h1');heading?.parentElement?.appendChild(toolbar);
 view.classList.add('safety-g5-enhanced');
 table.classList.add('safety-g5-table');
 active={view,col,table,card,form,marker:anchor,overlay,toolbar,opened:false,saving:false,
  saveSawReset:false,baseline:'',trigger:null,previousOverflow:'',
  title:overlay.querySelector('#safety-g5-title'),body:overlay.querySelector('.safety-g5-dialog-body'),
  closeButton:overlay.querySelector('[data-safety-g5-close]')};
 toolbar.querySelector('[data-safety-g5-new]')?.addEventListener('click',()=>{void openNew();});
 overlay.addEventListener('click',event=>{
   if(event.target===overlay||event.target.closest?.('[data-safety-g5-close]'))close(false);
 });
 overlay.addEventListener('keydown',event=>{
   if(!active?.opened)return;
   if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close(false);return;}
   if(event.key!=='Tab')return;
   const fields=Array.from(overlay.querySelectorAll('button:not([disabled]),input:not([type="hidden"]):not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]'))
    .filter(f=>f.getClientRects?.().length>0);
   if(!fields.length)return;
   if(event.shiftKey&&document.activeElement===fields[0]){event.preventDefault();fields[fields.length-1].focus();}
   else if(!event.shiftKey&&document.activeElement===fields[fields.length-1]){event.preventDefault();fields[0].focus();}
 });
 updateCount();
 return true;
}
function install(){
 if(typeof fn.edit==='function'&&!fn.edit.__safetyG5){
   const wrapped=async function(id,...args){
     if(active?.opened&&active.saving)return;
     if(hasChanges()&&!window.confirm('Scartare le modifiche non salvate e aprire un altro docente?'))return;
     const result=await fn.edit.apply(this,[id,...args]);
     if(active?.view?.isConnected&&String(node('doc-id')?.value||'')===String(id))show('Modifica docente');
     return result;
   };
   wrapped.__safetyG5=true;window.modificaDocente=wrapped;
 }
 if(typeof fn.reset==='function'&&!fn.reset.__safetyG5){
   const wrapped=async function(...args){
     if(active?.opened&&!active.saving&&hasChanges()&&!window.confirm('Annullare le modifiche non salvate del docente?'))return;
     const result=await fn.reset.apply(this,args);
     if(active?.opened&&active.saving)active.saveSawReset=true;
     else if(active?.opened)close(true);
     return result;
   };
   wrapped.__safetyG5=true;window.resetFormDocente=wrapped;
 }
 if(typeof fn.save==='function'&&!fn.save.__safetyG5){
   const wrapped=async function(...args){
     const s=active?.opened?active:null;
     if(s?.saving)return;
     if(s){s.saving=true;s.saveSawReset=false;s.closeButton.disabled=true;}
     try{
       const result=await fn.save.apply(this,args);
       if(s&&active===s&&s.saveSawReset)close(true);
       return result;
     }finally{
       if(s){s.saving=false;s.closeButton.disabled=false;}
     }
   };
   wrapped.__safetyG5=true;window.salvaDocenteDB=wrapped;
 }
 if(typeof window.loadDocentiTable==='function'&&!window.loadDocentiTable.__safetyG5){
   const original=window.loadDocentiTable;
   const wrapped=async function(...args){
     const result=await original.apply(this,args);
     if(node('view-docenti'))enhance();
     return result;
   };
   wrapped.__safetyG5=true;window.loadDocentiTable=wrapped;
 }
 if(typeof window.loadModule==='function'&&!window.loadModule.__safetyG5){
   const original=window.loadModule;
   const wrapped=async function(moduleId,...args){
     if(active?.opened){
       if(active.saving){window.alert('Salvataggio del docente in corso.');return;}
       if(hasChanges()&&!window.confirm('Ci sono modifiche non salvate del docente. Cambiare sezione?'))return;
     }
     if(active)teardown();
     const result=await original.apply(this,[moduleId,...args]);
     if(moduleId==='docenti'&&node('view-docenti'))enhance();
     return result;
   };
   wrapped.__safetyG5=true;window.loadModule=wrapped;
 }
 if(typeof window.showSafetyLogin==='function'&&!window.showSafetyLogin.__safetyG5){
   const original=window.showSafetyLogin;
   const wrapped=function(...args){teardown();return original.apply(this,args)};
   wrapped.__safetyG5=true;window.showSafetyLogin=wrapped;
 }
}
window.SafetyGraphicG5={enhance,openNew,close,hasChanges,isOpen:()=>!!active?.opened};
install();
})();