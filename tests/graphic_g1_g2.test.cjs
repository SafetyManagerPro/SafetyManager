'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const script=fs.readFileSync(path.resolve(__dirname,'../js/modules/graphic_upgrade_g1_g2.js'),'utf8');
const index=fs.readFileSync(path.resolve(__dirname,'../index.html'),'utf8');

test('Layer grafico G1/G2 è JavaScript valido e viene caricato dopo app.js',()=>{
 assert.doesNotThrow(()=>new vm.Script(script));
 assert.ok(index.indexOf('js/modules/graphic_upgrade_g1_g2.js')>index.indexOf('src="js/app.js"'));
 assert.match(script,/@media print/);
 assert.doesNotMatch(script,/supabaseClient\.from|\.storage\.from\(|fetch\(/);
 assert.match(script,/if\(changed\(\)&&!window\.confirm/);
});

function fixture(kind='corsisti'){
 const registry=new Map();
 let document;
 function node(id=''){
   const names=new Set();
   const n={id,children:[],parentNode:null,style:{},value:'',type:'',hidden:false,isConnected:true,
     textContent:'',disabled:false,checked:false,listeners:{},
     get parentElement(){return this.parentNode},
     classList:{add(c){names.add(c)},remove(c){names.delete(c)},contains(c){return names.has(c)}},
     appendChild(child){if(child.parentNode){const idx=child.parentNode.children.indexOf(child);if(idx>=0)child.parentNode.children.splice(idx,1)}
       child.parentNode=this;this.children.push(child);child.isConnected=true;return child},
     append(...children){children.forEach(child=>this.appendChild(child))},
     insertBefore(child,before){if(child.parentNode){const idx=child.parentNode.children.indexOf(child);if(idx>=0)child.parentNode.children.splice(idx,1)}
       child.parentNode=this;const idx=this.children.indexOf(before);this.children.splice(idx<0?this.children.length:idx,0,child);return child},
     replaceChild(next,old){const idx=this.children.indexOf(old);if(idx<0)throw Error('Cannot replace missing child');
       if(next.parentNode){const prevIdx=next.parentNode.children.indexOf(next);if(prevIdx>=0)next.parentNode.children.splice(prevIdx,1)}
       next.parentNode=this;this.children.splice(idx,1,next);old.parentNode=null;return old},
     remove(){if(this.parentNode){const idx=this.parentNode.children.indexOf(this);if(idx>=0)this.parentNode.children.splice(idx,1)}this.parentNode=null;this.isConnected=false},
     setAttribute(k,v){this[k]=v},
     addEventListener(k,fn){this.listeners[k]=fn},
     focus(){document.activeElement=this},
     querySelectorAll(sel){if(sel==='h1')return document.headings||[];if(sel==='input,select,textarea')return this.fields||[];
       if(sel.includes('button:not'))return [];return []},
     querySelector(sel){if(this.special&&this.special[sel])return this.special[sel];
       if(sel.includes('input:not'))return this.fields?.find(x=>x.type!=='hidden')||null;
       return null},
     getClientRects(){return [1]},
     scrollTop:0
   };
   if(id)registry.set(id,n);
   return n;
 }
 const app=node('app-content'),head=node(),body=node();
 const form=node(kind==='corsisti'?'form-corsista':'form-azienda');
 const id=node(kind==='corsisti'?'cor-id':'az-id'),name=node(kind==='corsisti'?'cor-nome':'az-ragione-sociale');
 id.type='hidden';name.type='text';form.fields=[id,name];
 const card=node(kind==='corsisti'?'corsista-form-card':'');
 card.appendChild(form);
 const sidebar=node();sidebar.appendChild(card);
 const title=node();title.textContent=kind==='corsisti'?'Anagrafica Corsisti':'Anagrafica Aziende Clienti';
 const titleParent=node();titleParent.appendChild(title);
 const view=kind==='aziende'?node('view-aziende'):null;
 app.headings=[title];
 app.querySelector=sel=>sel==='#view-aziende h1'?title:null;
 const modalNames=['#safety-g2-slot','#safety-g2-title','#safety-g2-subtitle','#safety-g2-body','[data-safety-g2-close]'];
 document={head,body,activeElement:node('trigger'),headings:[title],
   getElementById:key=>registry.get(key)||null,
   createComment:()=>node(),
   createElement:()=>{const n=node();n.special=Object.fromEntries(modalNames.map(k=>[k,node()]));return n}
 };
 const originals={load:[],resets:0,edits:0,saves:0,login:0};
 const window={confirm:()=>true,alert:()=>{},
   loadModule:async id=>{originals.load.push(id);return 'loaded-'+id},
   showSafetyLogin:()=>{originals.login++},
   [kind==='corsisti'?'resetFormCorsista':'resetFormAzienda']:()=>{originals.resets++;id.value='';name.value=''},
   [kind==='corsisti'?'modificaCorsista':'modificaAzienda']:record=>{originals.edits++;id.value=record;name.value='Modificato'},
   [kind==='corsisti'?'salvaCorsistaDB':'salvaAziendaDB']:async()=>{originals.saves++;window[kind==='corsisti'?'resetFormCorsista':'resetFormAzienda']()}
 };
 const context={window,document,console};
 vm.runInNewContext(script,context);
 return {window,document,registry,app,sidebar,card,form,id,name,originals};
}

for(const kind of ['corsisti','aziende']){
 test(kind+': riutilizza form originale in popup e salva con handler legacy',async()=>{
   const c=fixture(kind);
   assert.equal(c.window.SafetyGraphicG1G2.enhance(kind),true);
   assert.ok(c.sidebar.classList.contains('safety-g2-sidebar'));
   const overlay=c.app.children.find(el=>el.id==='safety-g2-overlay');
   assert.ok(overlay);
   assert.equal(overlay.hidden,true);
   assert.strictEqual(c.registry.get(kind==='corsisti'?'form-corsista':'form-azienda'),c.form);
   assert.equal(c.window.SafetyGraphicG1G2.openNew(kind),true);
   assert.equal(overlay.hidden,false);
   assert.equal(c.document.body.style.overflow,'hidden');
   c.name.value='Nuovo test';
   assert.equal(c.window.SafetyGraphicG1G2.hasUnsavedChanges(),true);
   await c.window[kind==='corsisti'?'salvaCorsistaDB':'salvaAziendaDB']();
   assert.equal(c.originals.saves,1);
   assert.equal(c.originals.resets,2);
   assert.equal(overlay.hidden,true,'Popup chiuso solo dopo reset eseguito nel salvataggio');
   assert.equal(c.document.body.style.overflow,'');
   c.window[kind==='corsisti'?'modificaCorsista':'modificaAzienda']('record-1');
   assert.equal(c.id.value,'record-1');
   assert.equal(c.window.SafetyGraphicG1G2.isOpen(),true);
   assert.equal(overlay.hidden,false);
 });
 test(kind+': chiusura con cambiamenti chiede conferma e navigazione annullabile',async()=>{
   const c=fixture(kind);c.window.SafetyGraphicG1G2.enhance(kind);
   assert.equal(c.window.SafetyGraphicG1G2.openNew(kind),true);
   c.name.value='Non salvato';
   c.window.confirm=()=>false;
   assert.equal(c.window.SafetyGraphicG1G2.close(),false);
   await c.window.loadModule('admin');
   assert.equal(c.originals.load.length,0,'Cambio modulo bloccato senza conferma');
   assert.equal(c.window.SafetyGraphicG1G2.isOpen(),true);
   c.window.confirm=()=>true;
   await c.window.loadModule('admin');
   assert.equal(c.originals.load.length,1);
   assert.ok(c.sidebar.children.includes(c.card),'Il form originale ritorna nella sua posizione');
   assert.equal(c.document.body.style.overflow,'');
 });
}

test('Nessuna dipendenza da UI nei moduli senza form: dashboard rimane navigabile',async()=>{
 const c=fixture('corsisti');
 const r=await c.window.loadModule('admin');
 assert.equal(r,'loaded-admin');
 assert.equal(c.window.SafetyGraphicG1G2.isOpen(),false);
 assert.equal(c.originals.load[0],'admin');
});