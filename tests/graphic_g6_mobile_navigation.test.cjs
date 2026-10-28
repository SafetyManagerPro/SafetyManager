'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.resolve(__dirname,'../js/modules/graphic_upgrade_g6_mobile.js'),'utf8');
const index=fs.readFileSync(path.resolve(__dirname,'../index.html'),'utf8');
const scadenze=fs.readFileSync(path.resolve(__dirname,'../modules/scadenze.html'),'utf8');
const sw=fs.readFileSync(path.resolve(__dirname,'../sw.js'),'utf8');
function fixture(mobile=true){
 const registry=new Map(),handlers={document:{},window:{}},links=[];
 let widthMobile=mobile;
 function element(id='',tag='DIV'){
   const attrs=new Map(),set=new Set(),listeners={};
   const node={
     id,tagName:tag,children:[],listeners,
     classList:{add(x){set.add(x)},remove(x){set.delete(x)},contains(x){return set.has(x)}},
     getAttribute:k=>attrs.has(k)?attrs.get(k):null,
     setAttribute:(k,v)=>attrs.set(k,String(v)),
     removeAttribute:k=>attrs.delete(k),
     addEventListener:(k,fn)=>{listeners[k]=fn},
     querySelectorAll:q=>q==='button[id^="nav-"]'?links:[],
     querySelector:q=>q==='span'?node.children.find(c=>c.tagName==='SPAN')||null:null,
     appendChild(x){this.children.push(x);return x},
     insertBefore(x,y){const i=this.children.indexOf(y);this.children.splice(i<0?this.children.length:i,0,x);return x},
     focus(){node.focused=true},
     contains(x){return x===node||node.children.includes(x)||node===nav&&links.includes(x)}
   };
   if(id)registry.set(id,node);
   let currentId=id;
   Object.defineProperty(node,'id',{get(){return currentId},set(value){if(currentId)registry.delete(currentId);currentId=value;if(value)registry.set(value,node)},configurable:true});
   return node;
 }
 const nav=element('top-nav'),inner=element('top-nav-inner'),buttons=element('top-nav-buttons');
 inner.appendChild(buttons);
 nav.appendChild(inner);
 const link=(key,label=null)=>{
   const n=element('nav-'+key,'BUTTON');
   if(label){const span=element('', 'SPAN');span.textContent=label;n.appendChild(span)}
   links.push(n);buttons.appendChild(n);return n
 };
 const admin=link('admin','Dashboard'),archive=link('archivio_corsi','Archivio'),settings=link('ente',null);
 const head=element('head');
 head.appendChild=n=>{registry.set(n.id,n);return n};
 const document={
   head,
   createElement:tag=>element('',tag.toUpperCase()),
   getElementById:id=>registry.get(id)||null,
   addEventListener:(type,fn)=>handlers.document[type]=fn
 };
 const window={
   matchMedia:()=>({matches:widthMobile}),
   innerWidth:mobile?375:1250,
   addEventListener:(type,fn)=>handlers.window[type]=fn
 };
 vm.runInNewContext(source,{window,document,console});
 const toggle=registry.get('safety-g6-toggle');
 return {window,nav,inner,buttons,admin,archive,settings,toggle,links,handlers,registry,
    setMobile(v){widthMobile=v}};
}
test('G6 è solo UI, senza modifiche DB o salvataggi; CSS responsive confinato',()=>{
 assert.doesNotThrow(()=>new vm.Script(source));
 assert.doesNotMatch(source,/supabaseClient|\.insert\(|\.upsert\(|\.delete\(|\.from\(['"]|window\.loadModule\s*=/);
 assert.match(source,/@media\(max-width:768px\)/);
 assert.match(source,/@media print/);
 assert.match(source,/prefers-reduced-motion/);
 assert.match(source,/overscroll-behavior:contain/);
 assert.match(source,/#view-scadenze #scadenze-stats-grid/);
 assert.match(source,/#archivio-advanced-stats/);
 assert.match(source,/#print-preview-container/);
 assert.match(scadenze,/id="scadenze-stats-grid"/);
 assert.match(index,/graphic_upgrade_g6_mobile\.js\?v=20261027-g6-mobile/);
 assert.match(sw,/safetymanager-pwa-v20/);
 assert.match(sw,/graphic_upgrade_g6_mobile\.js\?v=20261027-g6-mobile/);
});
test('Mobile: attiva menu compatto, aria-expanded e accessibilità per icone sole',()=>{
 const x=fixture();
 assert.ok(x.nav.classList.contains('safety-g6-nav'));
 assert.equal(x.window.SafetyGraphicG6.isOpen(),false);
 assert.equal(x.toggle.getAttribute('aria-expanded'),'false');
 assert.equal(x.settings.getAttribute('aria-label'),'Impostazioni');
 assert.equal(x.settings.querySelector('span').textContent,'Impostazioni');
 x.toggle.listeners.click();
 assert.equal(x.window.SafetyGraphicG6.isOpen(),true);
 assert.equal(x.toggle.getAttribute('aria-expanded'),'true');
 assert.equal(x.toggle.getAttribute('aria-label'),'Chiudi menu di navigazione');
 x.toggle.listeners.click();
 assert.equal(x.window.SafetyGraphicG6.isOpen(),false);
 assert.equal(x.toggle.getAttribute('aria-expanded'),'false');
});
test('Link mobile chiude menu ma NON intercetta o duplica la navigazione legacy',()=>{
 const x=fixture();
 x.window.SafetyGraphicG6.open();
 x.buttons.listeners.click({target:{closest:()=>x.archive}});
 assert.equal(x.window.SafetyGraphicG6.isOpen(),false);
 assert.equal(x.archive.id,'nav-archivio_corsi');
});
test('Escape chiude e restituisce focus, click fuori chiude',()=>{
 const x=fixture();
 x.window.SafetyGraphicG6.open();
 let prevented=0,stopped=0;
 x.handlers.document.keydown({key:'Escape',preventDefault(){prevented++},stopPropagation(){stopped++}});
 assert.equal(x.window.SafetyGraphicG6.isOpen(),false);
 assert.equal(x.toggle.focused,true);
 assert.equal(prevented,1);assert.equal(stopped,1);
 x.window.SafetyGraphicG6.open();
 x.handlers.document.pointerdown({target:{other:true}});
 assert.equal(x.window.SafetyGraphicG6.isOpen(),false);
});
test('Desktop: la navigazione originale resta sempre disponibile e il menu non si apre',()=>{
 const x=fixture(false);
 x.window.SafetyGraphicG6.open();
 assert.equal(x.window.SafetyGraphicG6.isOpen(),false);
 x.setMobile(true);
 x.window.SafetyGraphicG6.open();
 assert.equal(x.window.SafetyGraphicG6.isOpen(),true);
 x.setMobile(false);
 x.handlers.window.resize();
 assert.equal(x.window.SafetyGraphicG6.isOpen(),false);
});
test('Lo stato active rimane quello prodotto dalla vecchia navigazione',()=>{
 const x=fixture();
 x.archive.classList.add('active');
 x.window.SafetyGraphicG6.syncLabels();
 assert.equal(x.archive.getAttribute('aria-current'),'page');
 assert.equal(x.admin.getAttribute('aria-current'),null);
 x.archive.classList.remove('active');x.admin.classList.add('active');
 x.window.SafetyGraphicG6.syncLabels();
 assert.equal(x.archive.getAttribute('aria-current'),null);
 assert.equal(x.admin.getAttribute('aria-current'),'page');
 assert.equal(x.archive.classList.contains('active'),false);
});
test('Comandi dinamici (Esci, Installa) ricevono etichette senza duplicare elementi',()=>{
 const x=fixture();
 const logout={
  id:'nav-safety-logout',tagName:'BUTTON',
  classList:{contains:()=>false},
  attrs:new Map(),
  getAttribute(k){return this.attrs.get(k)||null},
  setAttribute(k,v){this.attrs.set(k,v)},
  removeAttribute(k){this.attrs.delete(k)},
  querySelector(){return null},appendChild(){}
 };
 x.links.push(logout);
 x.window.SafetyGraphicG6.syncLabels();
 assert.equal(logout.getAttribute('aria-label'),'Esci');
 assert.equal(x.links.length,4);
});
test('Il guard contro i doppi script lascia un solo menu e un solo toggle',()=>{
 const x=fixture();
 const a=x.window.SafetyGraphicG6;
 const context={window:x.window,document:{
    getElementById:id=>x.registry.get(id)||null,
    createElement:()=>{throw Error('nessun secondo elemento')},
    head:{appendChild:()=>{throw Error('nessun secondo stile')}}
  },console};
 assert.doesNotThrow(()=>vm.runInNewContext(source,context));
 assert.strictEqual(x.window.SafetyGraphicG6,a);
});
