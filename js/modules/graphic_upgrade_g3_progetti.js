/* G3: upgrade grafico Progetti, solo UI; riusa i form e i filtri legacy. */
(function(){
'use strict';
if(window.__safetyGraphicG3Loaded)return;
window.__safetyGraphicG3Loaded=true;
const STYLES='safety-graphic-g3-style';
const STATUS={tutti:'Tutti',aperto:'In lavorazione',svolto:'Da chiudere',chiuso:'Chiusi'};
const SECTIONS=[
 ['base','1. Azienda e corso','prog-azienda'],
 ['date','2. Date e sede','prog-inizio'],
 ['docenti','3. Docenti','prog-docenti-container'],
 ['iscritti','4. Corsisti','prog-draft-iscritti-box'],
 ['chiusura','5. Chiusura','prog-stato-corso']
];
let selected='tutti',baseline='',newPopupOpen=false,newPopupBaseline='';
const el=id=>document.getElementById(id);
const root=()=>el('progetto-form-col')?.parentElement||null;
const stateOf=p=>p?.stato_corso==='chiuso'?'chiuso':p?.stato_corso==='svolto'?'svolto':'aperto';
function injectStyle(){
 if(el(STYLES))return;
 const sheet=document.createElement('style');sheet.id=STYLES;
 sheet.textContent=[
 'body:not(.is-printing-temp) .safety-g3-project-page{max-width:none!important}',
 '.safety-g3-project-page [data-project-id]{border-radius:12px}',
 '.safety-g3-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding:13px;margin:12px 0;border:1px solid #d9e2ed;border-radius:16px;background:linear-gradient(120deg,#fff,#f4f8ff);box-shadow:0 4px 18px rgba(15,23,42,.045)}',
 '.safety-g3-actions,.safety-g3-filters{display:flex;align-items:center;gap:7px;flex-wrap:wrap}',
 '.safety-g3-button{min-height:42px;padding:9px 14px;border:1px solid #b9cae2;border-radius:11px;background:#fff;color:#183453;font-size:12px;font-weight:800;cursor:pointer}',
 '.safety-g3-primary{color:white;background:#1d4ed8;border-color:#1d4ed8}',
 '.safety-g3-button:hover{filter:brightness(.95)}',
 '.safety-g3-chip{min-height:40px;padding:7px 11px;border-radius:999px;border:1px solid #cbd5e1;background:#fff;color:#334155;font-size:11px;font-weight:800;cursor:pointer}',
 '.safety-g3-chip[aria-pressed="true"]{background:#0f172a;color:#fff;border-color:#0f172a}',
 '.safety-g3-info{font-size:11px;color:#475569;line-height:1.4}',
 '.safety-g3-project-page.safety-g3-collapsed #progetto-form-col:not(.fixed){display:none!important}',
 '.safety-g3-project-page.safety-g3-collapsed #progetto-form-col.fixed{position:fixed!important;display:flex!important}',
 '.safety-g3-project-page.safety-g3-collapsed #progetto-form-col.fixed{display:flex!important}',
 '.safety-g3-project-page.safety-g3-collapsed .safety-g3-list-col{width:100%!important;flex:1 1 100%!important;min-width:0!important}',
 '.safety-g3-steps{display:flex;gap:6px;flex-wrap:wrap;margin:3px 0 11px;padding:8px 0 10px;border-bottom:1px solid #e2e8f0;flex:none}',
 '.safety-g3-step{min-height:37px;padding:7px 10px;border:1px solid #d9e2ed;border-radius:10px;background:#f8fafc;color:#334155;font-size:10px;font-weight:800;cursor:pointer}',
 '.safety-g3-step:hover{background:#eff6ff;border-color:#93c5fd}',
 '.safety-g3-button:focus-visible,.safety-g3-chip:focus-visible,.safety-g3-step:focus-visible{outline:3px solid #60a5fa;outline-offset:2px}',
 '#progetto-form-col.fixed{z-index:110!important}',
 '#progetto-form-col.fixed #progetto-form-card{border-radius:20px;box-shadow:0 26px 80px rgba(2,12,27,.32)!important}',
 '#progetto-form-col.fixed .safety-g3-steps{overflow-x:auto;flex-wrap:nowrap;scrollbar-width:thin}',
 '@media(max-width:640px){.safety-g3-toolbar{align-items:stretch}.safety-g3-actions{display:grid;grid-template-columns:1fr 1fr;width:100%}.safety-g3-chip{min-height:44px}}',
 '@media(prefers-reduced-motion:reduce){.safety-g3-button,.safety-g3-chip,.safety-g3-step{transition:none!important}}',
 '@media print{.safety-g3-toolbar,.safety-g3-steps{display:none!important}}'
 ].join('\n');
 document.head.appendChild(sheet);
}
function counts(){
 return (Array.isArray(window.progettiList)?window.progettiList:[]).reduce((res,p)=>{
   res.tutti++;res[stateOf(p)]++;return res;
 },{tutti:0,aperto:0,svolto:0,chiuso:0});
}
function displayCounts(){
 const c=counts();
 document.querySelectorAll('[data-safety-g3-status]').forEach(btn=>{
   const kind=btn.dataset.safetyG3Status;
   btn.setAttribute('aria-pressed',String(selected===kind));
   btn.textContent=STATUS[kind]+' · '+c[kind];
 });
 const note=el('safety-g3-count');
 if(note)note.textContent=c.tutti+' progetti caricati · '+(selected==='tutti'?'tutti gli stati':'filtro: '+STATUS[selected])+'.';
}
function applyStatus(){
 if(!root())return;
 displayCounts();
 for(const node of root().querySelectorAll('#tabella-progetti [data-project-id],#progetti-mobile-cards [data-project-id]')){
   const pid=node.dataset.projectId;
   const project=(window.progettiList||[]).find(p=>String(p.id)===String(pid));
   if(!project)continue;
   if(selected!=='tutti'&&stateOf(project)!==selected)node.style.display='none';
 }
 if(typeof window.decorateProjectVisualGroups==='function')window.decorateProjectVisualGroups();
}
function refreshFilter(){
 if(typeof window.filtraProgetti==='function')window.filtraProgetti();
 else applyStatus();
}
function setStatus(kind){
 if(!Object.prototype.hasOwnProperty.call(STATUS,kind))return;
 selected=kind;refreshFilter();
}
function setCollapsed(collapsed){
 const page=root();if(!page)return;
 page.classList.toggle('safety-g3-collapsed',collapsed);
 const btn=el('safety-g3-collapse');
 if(btn){btn.textContent=collapsed?'Mostra modulo':'Amplia elenco';btn.setAttribute('aria-expanded',String(!collapsed));}
}
function formSignature(){
 const form=el('form-progetto');if(!form)return '';
 return Array.from(form.querySelectorAll('input,select,textarea'))
  .filter(n=>n.type!=='file')
  .map(n=>[n.id||n.name||'',n.type==='checkbox'||n.type==='radio'?String(!!n.checked):String(n.value||'')].join('=')).join('|');
}
function openNewProjectPopup(){
 const col=el('progetto-form-col'),card=el('progetto-form-card'),form=el('form-progetto');
 const title=el('progetto-form-title'),closeBtn=el('btn-close-project-popup');
 const header=el('popup-project-header'),errors=el('popup-project-errors'),corsisti=el('popup-corsisti-box');
 if(!col||!card||!form||!title||!closeBtn)return false;
 // Identici nodi del popup modifica legacy: gli ID e il submit NON cambiano.
 if(!col.dataset.originalClass)col.dataset.originalClass=col.className;
 if(!card.dataset.originalClass)card.dataset.originalClass=card.className;
 if(!form.dataset.originalClass)form.dataset.originalClass=form.className;
 if(corsisti&&!corsisti.dataset.originalClass)corsisti.dataset.originalClass=corsisti.className;
 col.className='fixed inset-0 z-[90] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4';
 card.className='bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl h-[82vh] max-h-[82vh] overflow-hidden flex flex-col p-5';
 form.className='space-y-4 text-xs popup-project-pane popup-project-pane-dati flex-1 min-h-0 overflow-y-auto pr-2 pb-2';
 title.textContent='Nuovo progetto formativo';
 closeBtn.classList.remove('hidden');
 header?.classList.add('shrink-0');
 errors?.classList.add('hidden');
 corsisti?.classList.add('hidden');
 // Il gestionale usa questo flag per chiudere il popup SOLO dopo un salvataggio riuscito.
 window.projectEditOpenedAsPopup=true;
 newPopupOpen=true;
 newPopupBaseline=formSignature();
 const first=el('prog-azienda');first?.focus?.();
 if(typeof lucide!=='undefined')lucide.createIcons();
 return true;
}
function newProject(){
 if(!el('form-progetto')||typeof window.resetFormProgetto!=='function')return false;
 if(el('prog-id')?.value||formSignature()!==baseline){
   if(!window.confirm('Creare un nuovo progetto? Eventuali modifiche non salvate nel modulo corrente andranno perse.'))return false;
 }
 if(window.projectEditOpenedAsPopup&&typeof window.chiudiPopupProgetto==='function'){
   // La conferma e' gia' stata chiesta sopra, non chiederla due volte.
   newPopupOpen=false;
   if(window.chiudiPopupProgetto()===false)return false;
 }
 window.resetFormProgetto();
 baseline=formSignature();
 // L'elenco resta sempre a tutta larghezza, mentre il form diventa un popup.
 setCollapsed(true);
 return openNewProjectPopup();
}
function wrapPopupClose(){
 const fn=window.chiudiPopupProgetto;
 if(typeof fn!=='function'||fn.__safetyG3PopupOnly)return;
 const wrapped=function(...args){
   if(newPopupOpen&&formSignature()!==newPopupBaseline){
     if(!window.confirm('Hai modifiche non salvate nel nuovo progetto. Vuoi chiudere il popup e scartarle?'))return false;
   }
   const result=fn.apply(this,args);
   if(newPopupOpen){
     newPopupOpen=false;
     if(typeof window.resetFormProgetto==='function')window.resetFormProgetto();
     baseline=formSignature();
   }
   return result;
 };
 wrapped.__safetyG3PopupOnly=true;
 window.chiudiPopupProgetto=wrapped;
}
function wrapReset(){
 const fn=window.resetFormProgetto;
 if(typeof fn!=='function'||fn.__safetyG3PopupOnly)return;
 const wrapped=function(...args){
   const result=fn.apply(this,args);
   // Anche il salvataggio originale resetta il modulo PRIMA di chiudere il popup.
   // Aggiornando qui lo snapshot, la chiusura successiva non chiede conferma.
   if(newPopupOpen)newPopupBaseline=formSignature();
   baseline=formSignature();
   return result;
 };
 wrapped.__safetyG3PopupOnly=true;
 window.resetFormProgetto=wrapped;
}
function goToSection(name){
 const row=SECTIONS.find(x=>x[0]===name);if(!row)return false;
 if(window.projectEditOpenedAsPopup&&typeof window.switchProjectPopupTab==='function'){
   window.switchProjectPopupTab(name==='iscritti'&&el('prog-id')?.value?'corsisti':'dati');
   if(name==='iscritti'&&el('prog-id')?.value)return true;
 }
 const item=el(row[2]);if(!item)return false;
 let ancestor=item.parentElement;
 while(ancestor){if(ancestor.tagName==='DETAILS')ancestor.open=true;ancestor=ancestor.parentElement;}
 item.scrollIntoView?.({behavior:'smooth',block:'center'});
 const focus=item.matches?.('input,select,textarea,button')?item:item.querySelector?.('input,select,button');
 focus?.focus?.({preventScroll:true});
 return true;
}
function enhance(){
 const left=el('progetto-form-col'),table=el('tabella-progetti'),card=el('progetto-form-card');
 if(!left||!table||!card||!root())return false;
 const page=root();page.classList.add('safety-g3-project-page');
 const list=left.nextElementSibling;
 list?.classList.add('safety-g3-list-col');
 if(!el('safety-g3-toolbar')){
   const panel=document.createElement('div');panel.id='safety-g3-toolbar';panel.className='safety-g3-toolbar';
   panel.innerHTML='<div class="safety-g3-actions"><button type="button" id="safety-g3-new" class="safety-g3-button safety-g3-primary">+ Nuovo progetto</button></div>'+

     '<div id="safety-g3-filters" class="safety-g3-filters" role="group" aria-label="Filtri stato progetti">'+
     Object.keys(STATUS).map(key=>'<button type="button" class="safety-g3-chip" aria-pressed="false" data-safety-g3-status="'+key+'"></button>').join('')+'</div>'+
     '<p class="safety-g3-info" id="safety-g3-count" aria-live="polite"></p>';
   const heading=list?.querySelector('h1');
   const header=heading?.parentElement;
   if(header)header.appendChild(panel);else list?.insertBefore(panel,list.firstChild);
   panel.querySelector('#safety-g3-new')?.addEventListener('click',newProject);
   panel.querySelector('#safety-g3-filters')?.addEventListener('click',event=>{
     const button=event.target.closest?.('[data-safety-g3-status]');
     if(button)setStatus(button.dataset.safetyG3Status);
   });
 }
 if(!el('safety-g3-steps')){
   const guide=document.createElement('nav');guide.id='safety-g3-steps';guide.className='safety-g3-steps';
   guide.setAttribute('aria-label','Navigazione guidata progetto');
   guide.innerHTML=SECTIONS.map(s=>'<button type="button" class="safety-g3-step" data-safety-g3-step="'+s[0]+'">'+s[1]+'</button>').join('');
   const header=el('popup-project-header');
   header?.parentElement?.insertBefore(guide,header.nextSibling);
   guide.addEventListener('click',event=>{
     const button=event.target.closest?.('[data-safety-g3-step]');
     if(button)goToSection(button.dataset.safetyG3Step);
   });
 }
 baseline=formSignature();
 // Layout popup-only: nasconde la colonna laterale SENZA rimuovere il form dal DOM.
 setCollapsed(true);
 refreshFilter();
 return true;
}
function install(){
 injectStyle();
 wrapReset();
 wrapPopupClose();
 if(typeof window.filtraProgetti==='function'&&!window.filtraProgetti.__safetyG3){
   const original=window.filtraProgetti;
   const wrapped=function(...args){const result=original.apply(this,args);applyStatus();return result;};
   wrapped.__safetyG3=true;window.filtraProgetti=wrapped;
 }
 if(typeof window.loadProgettiTable==='function'&&!window.loadProgettiTable.__safetyG3){
   const original=window.loadProgettiTable;
   const wrapped=async function(...args){const result=await original.apply(this,args);if(el('tabella-progetti'))enhance();return result;};
   wrapped.__safetyG3=true;window.loadProgettiTable=wrapped;
 }
 if(typeof window.loadModule==='function'&&!window.loadModule.__safetyG3){
   const original=window.loadModule;
   const wrapped=async function(moduleId,...args){
     const result=await original.apply(this,[moduleId,...args]);
     if(moduleId==='progetti'&&el('tabella-progetti'))enhance();
     return result;
   };
   wrapped.__safetyG3=true;window.loadModule=wrapped;
 }
}
window.SafetyGraphicG3={enhance,setStatus,newProject,goToSection,setCollapsed,counts,stateOf};
install();
})();