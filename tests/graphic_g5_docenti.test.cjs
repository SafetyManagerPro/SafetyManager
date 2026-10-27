'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const script=fs.readFileSync(path.resolve(__dirname,'../js/modules/graphic_upgrade_g5_docenti.js'),'utf8');
const html=fs.readFileSync(path.resolve(__dirname,'../index.html'),'utf8');
const docHtml=fs.readFileSync(path.resolve(__dirname,'../modules/docenti.html'),'utf8');

function fixture(){
 const registry=new Map(),stats={reset:0,edit:0,save:0,navigate:[],login:0,confirm:0},list=[{id:'123',nome_cognome:'Mario Rossi'}];
 let document,saveOk=true,allowConfirm=true,throwSave=false;
 function N(id='',tag='DIV'){
   const set=new Set();
   const n={
     id,tagName:tag,children:[],parentNode:null,dataset:{},style:{},listeners:{},
     value:'',type:'text',disabled:false,hidden:false,textContent:'',isConnected:true,
     classList:{add(x){set.add(x)},remove(x){set.delete(x)},contains(x){return set.has(x)}},
     setAttribute(k,v){this[k]=v},
     appendChild(child){if(child.parentNode){const ix=child.parentNode.children.indexOf(child);if(ix>=0)child.parentNode.children.splice(ix,1)}
       this.children.push(child);child.parentNode=this;return child},
     insertBefore(child,before){if(child.parentNode){const ix=child.parentNode.children.indexOf(child);if(ix>=0)child.parentNode.children.splice(ix,1)}
       const ix=this.children.indexOf(before);this.children.splice(ix>=0?ix:this.children.length,0,child);
       child.parentNode=this;return child},
     replaceChild(child,old){const ix=this.children.indexOf(old);if(ix<0)throw Error('missing old');
       if(child.parentNode){const oldIx=child.parentNode.children.indexOf(child);if(oldIx>=0)child.parentNode.children.splice(oldIx,1)}
       this.children[ix]=child;child.parentNode=this;old.parentNode=null;return old},
     remove(){if(this.parentNode){const ix=this.parentNode.children.indexOf(this);if(ix>=0)this.parentNode.children.splice(ix,1)}this.parentNode=null;this.isConnected=false},
     addEventListener(k,v){this.listeners[k]=v},
     focus(){document.activeElement=this},
     querySelector(sel){return this.special?.[sel]||null},
     querySelectorAll(sel){if(sel==='input,select,textarea')return this.fields||[];return []},
     getClientRects(){return [1]},
     set innerHTML(s){this._html=s;
       if(this.id==='safety-g5-overlay'){
         const map={};
         for(const id of ['safety-g5-form-slot','safety-g5-title']){
           const el=N(id);map['#'+id]=el;
         }
         map['.safety-g5-dialog-body']=N('modal-body');
         map['[data-safety-g5-close]']=N('close-button','BUTTON');
         this.special=map;
       }
       if(this.className==='safety-g5-toolbar'){
         this.special={
           '[data-safety-g5-new]':N('new-button','BUTTON'),
           '[data-safety-g5-count]':N('docenti-count','SPAN')
         };
       }
     },get innerHTML(){return this._html||''}
   };
   if(id)registry.set(id,n);return n;
 }
 const app=N('app-content'),head=N('head'),body=N('body');
 body.style.overflow='';
 const view=N('view-docenti'),header=N('docenti-header'),heading=N('docenti-heading','H1');
 header.appendChild(heading);
 view.special={'h1':heading};
 view.appendChild(header);
 const container=N('columns');
 view.appendChild(container);
 const col=N('docente-form-col'),table=N('docenti-list');
 container.appendChild(col);container.appendChild(table);
 col.nextElementSibling=table;
 const card=N('docente-form-card');col.appendChild(card);
 const form=N('form-docente','FORM'),id=N('doc-id','INPUT'),name=N('doc-nome','INPUT');
 id.type='hidden';name.value='';
 form.fields=[id,name];card.appendChild(form);
 document={
  body,head,activeElement:N('trigger','BUTTON'),
  getElementById:key=>registry.get(key)||null,
  createElement:tag=>N('',tag.toUpperCase()),
  createComment:()=>N('','COMMENT')
 };
 const window={
  docentiList:list,
  confirm(){stats.confirm++;return allowConfirm},
  alert(){},
  resetFormDocente:async function(){
   stats.reset++;id.value='';name.value='';
   await Promise.resolve();
  },
  modificaDocente:async function(recordId){
   stats.edit++;await Promise.resolve();
   if(recordId==='123'){id.value='123';name.value='Mario Rossi'}
  },
  salvaDocenteDB:async function(){
   stats.save++;await Promise.resolve();
   if(throwSave)throw Error('salvataggio non riuscito');
   if(saveOk){await window.resetFormDocente();await Promise.resolve();}
  },
  loadDocentiTable:async()=>{},
  loadModule:async function(section){stats.navigate.push(section);return section},
  showSafetyLogin:function(){stats.login++}
 };
 vm.runInNewContext(script,{window,document,console});
 const api=window.SafetyGraphicG5;
 return {api,window,document,stats,card,col,table,view,form,id,name,registry,
  get overlay(){return registry.get('safety-g5-overlay')},
  confirm(v){allowConfirm=v},
  saves(v){saveOk=v},throws(v){throwSave=v}};
}

test('G5 script valido, caricato dopo G1-G3, form originale Docenti esiste',()=>{
 assert.doesNotThrow(()=>new vm.Script(script));
 assert.match(docHtml,/id="form-docente"/);
 assert.match(docHtml,/id="docente-form-card"/);
 assert.ok(html.indexOf('graphic_upgrade_g5_docenti.js')>html.indexOf('graphic_upgrade_g3_progetti.js'));
 assert.doesNotMatch(script,/supabaseClient|\.from\(|\.insert\(|\.upsert\(|\.delete\(|fetch\(/);
 assert.match(script,/@media print/);
 assert.match(script,/prefers-reduced-motion/);
});
test('Riuso unico form Docenti; sidebar nascosta, elenco full-width e contatore',()=>{
 const x=fixture();
 assert.equal(x.api.enhance(),true);
 assert.equal(x.view.classList.contains('safety-g5-enhanced'),true);
 assert.equal(x.table.classList.contains('safety-g5-table'),true);
 assert.strictEqual(x.form,x.document.getElementById('form-docente'));
 assert.strictEqual(x.card.parentNode,x.overlay.querySelector('#safety-g5-form-slot'));
 assert.equal(x.overlay.hidden,true);
 assert.match(x.registry.get('docenti-count').textContent,/1 docenti caricati/);
});
test('Nuovo Docente usa reset legacy asincrono e apre popup con focus',async()=>{
 const x=fixture();x.api.enhance();
 x.name.value='vecchio';
 assert.equal(await x.api.openNew(),true);
 assert.equal(x.stats.reset,1);
 assert.equal(x.id.value,'');
 assert.equal(x.name.value,'');
 assert.equal(x.api.isOpen(),true);
 assert.equal(x.overlay.hidden,false);
 assert.equal(x.document.body.style.overflow,'hidden');
 assert.strictEqual(x.document.activeElement,x.name);
});
test('Salvataggio riuscito: chiude dopo il reset legacy asincrono, non prima',async()=>{
 const x=fixture();x.api.enhance();
 await x.api.openNew();x.name.value='Nuovo';
 await x.window.salvaDocenteDB();
 assert.equal(x.stats.save,1);
 assert.equal(x.stats.reset,2);
 assert.equal(x.api.isOpen(),false);
 assert.equal(x.overlay.hidden,true);
 assert.equal(x.document.body.style.overflow,'');
});
test('Salvataggio fallito non chiude e non resetta; nessuna perdita dati',async()=>{
 const x=fixture();x.api.enhance();
 await x.api.openNew();x.name.value='Da preservare';x.saves(false);
 await x.window.salvaDocenteDB();
 assert.equal(x.api.isOpen(),true);
 assert.equal(x.name.value,'Da preservare');
 assert.equal(x.stats.reset,1);
 x.throws(true);
 await assert.rejects(()=>x.window.salvaDocenteDB(),/salvataggio non riuscito/);
 assert.equal(x.api.isOpen(),true);
 assert.equal(x.name.value,'Da preservare');
});
test('Modifica Docente attende il caricamento asincrono e apre lo stesso form',async()=>{
 const x=fixture();x.api.enhance();
 await x.window.modificaDocente('123');
 assert.equal(x.stats.edit,1);
 assert.equal(x.id.value,'123');
 assert.equal(x.name.value,'Mario Rossi');
 assert.equal(x.api.isOpen(),true);
 assert.match(x.registry.get('safety-g5-title').textContent,/Modifica docente/);
});
test('Modifiche non salvate richiedono consenso: X, cambio docente, cambio sezione',async()=>{
 const x=fixture();x.api.enhance();
 await x.api.openNew();x.name.value='Nuova modifica';x.confirm(false);
 assert.equal(x.api.close(),false);
 assert.equal(x.api.isOpen(),true);
 await x.window.modificaDocente('123');
 assert.equal(x.stats.edit,0);
 await x.window.loadModule('admin');
 assert.equal(x.stats.navigate.length,0);
 assert.equal(x.name.value,'Nuova modifica');
 x.confirm(true);
 assert.equal(x.api.close(),true);
 assert.equal(x.document.body.style.overflow,'');
});
test('Annulla originale chiude il popup solo dopo reset ed eventuale conferma',async()=>{
 const x=fixture();x.api.enhance();
 await x.api.openNew();x.name.value='modificato';x.confirm(false);
 await x.window.resetFormDocente();
 assert.equal(x.api.isOpen(),true);
 assert.equal(x.name.value,'modificato');
 x.confirm(true);
 await x.window.resetFormDocente();
 assert.equal(x.stats.reset,2);
 assert.equal(x.api.isOpen(),false);
 assert.equal(x.name.value,'');
});
test('Navigazione ripristina form e rimuove overlay senza duplicati',async()=>{
 const x=fixture();x.api.enhance();
 await x.api.openNew();
 const r=await x.window.loadModule('progetti');
 assert.equal(r,'progetti');
 assert.deepEqual(x.stats.navigate,['progetti']);
 assert.strictEqual(x.card.parentNode,x.col);
 assert.equal(x.api.isOpen(),false);
 assert.equal(x.view.classList.contains('safety-g5-enhanced'),false);
 assert.equal(x.overlay.isConnected,false);
});
test('Logout con popup aperto ripristina la vista senza manipolare i record',async()=>{
 const x=fixture();x.api.enhance();await x.api.openNew();
 x.window.showSafetyLogin();
 assert.equal(x.stats.login,1);
 assert.equal(x.api.isOpen(),false);
 assert.strictEqual(x.card.parentNode,x.col);
});
