'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const code=fs.readFileSync(path.resolve(__dirname,'../js/modules/archive_project_popup_portal.js'),'utf8');
const app=fs.readFileSync(path.resolve(__dirname,'../js/app.js'),'utf8');
const index=fs.readFileSync(path.resolve(__dirname,'../index.html'),'utf8');
const sw=fs.readFileSync(path.resolve(__dirname,'../sw.js'),'utf8');
function setup(){
 const dom={},events={},traces=[],state={archive:true,form:false,dirty:false,confirm:true,saveOk:true,fetchOk:true,nav:5};
 function createNode(name){
   const classes=new Set();
   return {
     nodeName:name, id:'',dataset:{},style:{},parentNode:null,isConnected:true,
     listeners:{},
     classList:{add(k){classes.add(k)},contains(k){return classes.has(k)},remove(k){classes.delete(k)}},
     addEventListener(k,fn){this.listeners[k]=fn},
     querySelector(selector){
       if(selector==='#progetto-form-col'&&this.template)return dom.col;
       if(selector==='#form-progetto'&&this===dom.col)return dom.form;
       return null
     },
     set innerHTML(html){this.template=true;this._html=html},
     get innerHTML(){return this._html||''},
     remove(){if(this===dom.col){state.form=false;this.isConnected=false}},
     focus(){traces.push('focus')},
     setAttribute(k,v){this[k]=v}
   };
 }
 dom.archive=createNode('archive');dom.col=createNode('col');dom.form=createNode('form');
 const body=createNode('body');body.style.overflow='auto';
 body.appendChild=node=>{if(node===dom.col)state.form=true;node.parentNode=body;return node};
 const head=createNode('head');head.appendChild=el=>{dom[el.id]=el};
 const document={
   body,head,activeElement:createNode('trigger'),
   getElementById(id){
     if(id==='archivio-corsi-container')return state.archive?dom.archive:null;
     if(id==='form-progetto')return state.form?dom.form:null;
     if(id==='safety-archive-project-portal-style')return dom[id]||null;
     return null
   },
   createElement:name=>createNode(name)
 };
 const window={
   __safetyNavigationId:5,
   pendingProjectOpenId:null,projectEditOpenedAsPopup:false,
   alert:s=>traces.push('alert '+s),
   confirm:s=>{traces.push('confirm');return state.confirm},
   apriPopupProgettoById:async function(id,target){
     traces.push('legacyOpen '+id+' '+target);
     if(!state.form&&state.archive)traces.push('legacyWouldNavigate');
     window.projectEditOpenedAsPopup=true;
     return 'opened'
   },
   chiudiPopupProgetto:function(){
     traces.push('legacyClose');window.projectEditOpenedAsPopup=false;
   },
   resetFormProgetto:function(){traces.push('reset');},
   salvaProgettoDB:async function(){
     traces.push('legacySave');
     if(state.saveOk){
       window.resetFormProgetto();
       window.chiudiPopupProgetto();
     }
     return state.saveOk;
   },
   loadModule:async function(id){traces.push('navigate '+id);state.archive=id==='archivio_corsi';return id}
 };
 const fetch=async function(url,opts){
   traces.push('fetch '+url+' '+opts?.cache);
   return {ok:state.fetchOk,status:404,text:async()=>'<div id="progetto-form-col"><form id="form-progetto"></form></div>'}
 };
 const context={window,document,fetch,console};
 vm.runInNewContext(code,context);
 return {window,document,state,dom,traces,fetch};
}
test('Archivio richiama un popup senza navigare alla pagina Progetti',async()=>{
 const x=setup();
 const result=await x.window.apriPopupProgettoById('prj-123','archivio_corsi');
 assert.equal(result,'opened');
 assert.equal(x.window.SafetyArchiveProjectPortal.isOpen(),true);
 assert.equal(x.state.archive,true);
 assert.equal(x.state.form,true);
 assert.equal(x.document.body.style.overflow,'hidden');
 assert.equal(x.traces.some(k=>k==='navigate progetti'),false);
 assert.deepEqual(x.traces.filter(k=>k.startsWith('legacyOpen')),['legacyOpen prj-123 archivio_corsi']);
 assert.ok(x.traces.includes('fetch modules/progetti.html no-store'));
});
test('Chiusura X ripristina Archivio e rimuove il form temporaneo',async()=>{
 const x=setup();
 await x.window.apriPopupProgettoById('prj','archivio_corsi');
 assert.equal(x.window.chiudiPopupProgetto(),undefined);
 assert.equal(x.state.form,false);
 assert.equal(x.document.body.style.overflow,'auto');
 assert.equal(x.state.archive,true);
 assert.equal(x.window.projectEditOpenedAsPopup,false);
 assert.deepEqual(x.traces.filter(k=>k.startsWith('navigate')),[]);
});
test('Dati digitati non si perdono senza conferma, sia su X sia nella navigazione',async()=>{
 const x=setup();
 await x.window.apriPopupProgettoById('prj','archivio_corsi');
 x.dom.col.listeners.input();
 x.state.confirm=false;
 assert.equal(x.window.chiudiPopupProgetto(),false);
 assert.equal(x.state.form,true);
 assert.equal(await x.window.loadModule('admin'),undefined);
 assert.equal(x.traces.some(k=>k==='navigate admin'),false);
 x.state.confirm=true;
 assert.equal(await x.window.loadModule('admin'),'admin');
 assert.equal(x.state.form,false);
 assert.equal(x.traces.filter(k=>k==='navigate admin').length,1);
});
test('Salvataggio legacy riuscito fa reset e chiude senza un avviso falso',async()=>{
 const x=setup();
 await x.window.apriPopupProgettoById('prj','archivio_corsi');
 x.dom.col.listeners.change();
 assert.equal(await x.window.salvaProgettoDB(),true);
 assert.equal(x.window.SafetyArchiveProjectPortal.isOpen(),false);
 assert.equal(x.state.form,false);
 assert.equal(x.traces.filter(k=>k==='confirm').length,0);
 assert.equal(x.traces.filter(k=>k==='reset').length,1);
});
test('Salvataggio rifiutato lascia form e popup aperti',async()=>{
 const x=setup();
 await x.window.apriPopupProgettoById('prj','archivio_corsi');
 x.state.saveOk=false;
 assert.equal(await x.window.salvaProgettoDB(),false);
 assert.equal(x.window.SafetyArchiveProjectPortal.isOpen(),true);
 assert.equal(x.state.form,true);
 assert.equal(x.traces.filter(k=>k==='legacyClose').length,0);
});
test('Cambio progetto nello stesso Archivio non perde modifiche non confermate',async()=>{
 const x=setup();
 await x.window.apriPopupProgettoById('prj-1','archivio_corsi');
 x.dom.col.listeners.input();
 x.state.confirm=false;
 await x.window.apriPopupProgettoById('prj-2','archivio_corsi');
 assert.deepEqual(x.traces.filter(k=>k.startsWith('legacyOpen')),['legacyOpen prj-1 archivio_corsi']);
 assert.equal(x.state.archive,true);
 x.state.confirm=true;
 await x.window.apriPopupProgettoById('prj-2','archivio_corsi');
 assert.deepEqual(x.traces.filter(k=>k.startsWith('legacyOpen')),[
  'legacyOpen prj-1 archivio_corsi','legacyOpen prj-2 archivio_corsi'
 ]);
 assert.equal(x.traces.filter(k=>k.startsWith('fetch')).length,1);
 assert.equal(x.state.form,true);
});
test('Errore rete non sposta l’utente dall’Archivio',async()=>{
 const x=setup();
 x.state.fetchOk=false;
 assert.equal(await x.window.apriPopupProgettoById('prj','archivio_corsi'),undefined);
 assert.equal(x.state.archive,true);
 assert.equal(x.state.form,false);
 assert.equal(x.traces.some(k=>k==='navigate progetti'),false);
 assert.equal(x.traces.filter(k=>k.startsWith('alert')).length,1);
});
test('Fuori dall’Archivio resta invariata la funzione originale',async()=>{
 const x=setup();
 x.state.archive=false;
 const v=await x.window.apriPopupProgettoById('prj','progetti');
 assert.equal(v,'opened');
 assert.equal(x.traces.some(k=>k.startsWith('fetch')),false);
 assert.equal(x.traces.filter(k=>k.startsWith('legacyOpen')).length,1);
});
test('Montaggio richiamato due volte in Archivio riusa un singolo form',async()=>{
 const x=setup();
 await Promise.all([
  x.window.apriPopupProgettoById('prj-1','archivio_corsi'),
  x.window.apriPopupProgettoById('prj-2','archivio_corsi')
 ]);
 assert.equal(x.traces.filter(k=>k.startsWith('fetch')).length,1);
 assert.equal(x.state.form,true);
});
test('UI popup-only applicata prima delle letture DB, moduli senza cache HTTP',()=>{
 const hook=app.indexOf('window.SafetyGraphicG1G2.enhance(moduleId)');
 const loadCorsisti=app.indexOf('window.loadCorsistiTable()');
 const hookG3=app.indexOf('window.SafetyGraphicG3.enhance()');
 const hookG5=app.indexOf('window.SafetyGraphicG5.enhance()');
 assert.ok(hook>0&&hook<loadCorsisti);
 assert.ok(hookG3>0&&hookG3<loadCorsisti);
 assert.ok(hookG5>0&&hookG5<loadCorsisti);
 assert.match(app,/fetch\(\`modules\/\$\{moduleId\}\.html\`,\{signal:controller\.signal,cache:'no-store'\}\)/);
 assert.match(index,/archive_project_popup_portal\.js\?v=20261027-archive-popup/);
 assert.ok(index.indexOf('archive_project_popup_portal.js')>index.indexOf('graphic_upgrade_g3_progetti.js'));
 assert.match(sw,/safetymanager-pwa-v22/);
 assert.match(sw,/archive_project_popup_portal\.js\?v=20261027-archive-popup/);
 assert.doesNotMatch(code,/\.insert\(|\.upsert\(|\.delete\(|supabaseClient|\.from\(['"]/);
});
