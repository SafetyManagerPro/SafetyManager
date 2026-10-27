/* SafetyManager Pro — Archivio -> popup Progetto senza cambiare modulo.
 * Recupera soltanto il form HTML ufficiale, senza una seconda scheda/DB path.
 */
(function(){
'use strict';
if(window.__safetyArchiveProjectPortalLoaded)return;
window.__safetyArchiveProjectPortalLoaded=true;
const originalOpen=window.apriPopupProgettoById;
const originalClose=window.chiudiPopupProgetto;
const originalSave=window.salvaProgettoDB;
const originalReset=window.resetFormProgetto;
const originalLoad=window.loadModule;
if(typeof originalOpen!=='function'||typeof originalClose!=='function')return;
let active=null,mounting=null;
const archiveActive=()=>!!document.getElementById('archivio-corsi-container');
const formExists=()=>!!document.getElementById('form-progetto');
function setupStyle(){
 if(document.getElementById('safety-archive-project-portal-style'))return;
 const style=document.createElement('style');
 style.id='safety-archive-project-portal-style';
 style.textContent=[
  '#progetto-form-col.safety-archive-project-staging:not(.fixed){display:none!important}',
  'body > #progetto-form-col.fixed{z-index:160002!important}',
  'body > #progetto-form-col.fixed #progetto-form-card{max-height:calc(100dvh - 24px)!important}',
  '@media(max-width:640px){body > #progetto-form-col.fixed{padding:6px!important}}',
  '@media print{body > #progetto-form-col[data-safety-archive-portal]{display:none!important}}'
 ].join('\n');
 document.head.appendChild(style);
}
function dispose(){
 const state=active;if(!state)return;
 active=null;
 state.col?.remove();
 document.body.style.overflow=state.previousOverflow;
 if(state.trigger?.isConnected)state.trigger.focus?.();
 window.pendingProjectOpenId=null;
 window.projectEditOpenedAsPopup=false;
}
async function mount(){
 if(active)return active;
 if(mounting)return mounting;
 const navigation=window.__safetyNavigationId;
 mounting=(async()=>{
   const response=await fetch('modules/progetti.html',{cache:'no-store'});
   if(!response.ok)throw Error('Modulo progetto non disponibile (HTTP '+response.status+').');
   const html=await response.text();
   if(!archiveActive()||window.__safetyNavigationId!==navigation)throw Error('ARCHIVE_VIEW_CHANGED');
   const template=document.createElement('div');template.innerHTML=html;
   const col=template.querySelector('#progetto-form-col');
   if(!col||!col.querySelector('#form-progetto'))throw Error('Modulo progetto incompleto.');
   setupStyle();
   col.classList.add('safety-archive-project-staging');
   col.dataset.safetyArchivePortal='true';
   document.body.appendChild(col);
   const state={col,trigger:document.activeElement,previousOverflow:document.body.style.overflow||'',dirty:false,saving:false,resetSeen:false,opening:true};
   col.addEventListener('input',()=>{if(active===state)state.dirty=true});
   col.addEventListener('change',()=>{if(active===state)state.dirty=true});
   active=state;
   return state;
 })();
 try{return await mounting}finally{mounting=null}
}
window.apriPopupProgettoById=async function(projectId,target='progetti'){
 // La funzione originale resta invariata se ci troviamo in Progetti o altrove.
 if(!archiveActive()||formExists())return originalOpen.apply(this,arguments);
 let state;
 try{
   state=await mount();
   if(!archiveActive()||active!==state){dispose();return;}
   const result=await originalOpen.call(this,projectId,target);
   if(active!==state)return result;
   state.opening=false;
   if(!window.projectEditOpenedAsPopup){
     dispose();
     return result;
   }
   document.body.style.overflow='hidden';
   return result;
 }catch(error){
   if(active===state)dispose();
   if(error?.message==='ARCHIVE_VIEW_CHANGED')return;
   console.error('SafetyManager: impossibile aprire progetto in Archivio',error);
   window.alert('Impossibile aprire il progetto senza lasciare l’Archivio. Riprova o verifica la connessione.');
 }
};
window.chiudiPopupProgetto=function(...args){
 const state=active;
 if(state){
   if(state.saving&&!state.resetSeen){window.alert('Attendi la conclusione del salvataggio.');return false;}
   if(!state.saving&&state.dirty&&!window.confirm('Modifiche non salvate al progetto. Vuoi chiudere la scheda?'))return false;
 }
 const result=originalClose.apply(this,args);
 if(state&&result!==false)dispose();
 return result;
};
if(typeof originalReset==='function'){
 window.resetFormProgetto=function(...args){
   const result=originalReset.apply(this,args);
   if(active?.saving)active.resetSeen=true;
   else if(active)active.dirty=false;
   return result;
 };
}
if(typeof originalSave==='function'){
 window.salvaProgettoDB=async function(...args){
   const state=active;
   if(!state)return originalSave.apply(this,args);
   if(state.saving)return;
   state.saving=true;state.resetSeen=false;
   try{return await originalSave.apply(this,args)}
   finally{state.saving=false;}
 };
}
if(typeof originalLoad==='function'){
 window.loadModule=async function(moduleId,...args){
   const state=active;
   if(state){
     if(state.saving){window.alert('Attendi la conclusione del salvataggio.');return;}
     if(state.dirty&&!window.confirm('Modifiche non salvate al progetto. Vuoi cambiare sezione?'))return;
     // Non richiamare il wrapper di chiusura: la conferma e' già stata data.
     originalClose();
     dispose();
   }
   return originalLoad.apply(this,[moduleId,...args]);
 };
}
window.SafetyArchiveProjectPortal={
 isOpen:()=>!!active&&!!window.projectEditOpenedAsPopup,
 close:()=>window.chiudiPopupProgetto(),
 archiveActive
};
})();