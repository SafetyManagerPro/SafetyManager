'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.resolve(__dirname,'../js/modules/graphic_upgrade_g3_progetti.js'),'utf8');
const index=fs.readFileSync(path.resolve(__dirname,'../index.html'),'utf8');

function fixture(){
  const nodes=new Map(),flags=new Set();
  const element=(id,extra={})=>{const e={id,value:'',type:'text',style:{display:''},dataset:{},classList:{
    add(c){flags.add(id+':'+c)},remove(c){flags.delete(id+':'+c)},toggle(c,value){
      const key=id+':'+c;const active=value===undefined?!flags.has(key):!!value;
      if(active)flags.add(key);else flags.delete(key);return active
    },contains(c){return flags.has(id+':'+c)}
  },setAttribute(k,v){this[k]=v},scrollIntoView(){this.scrolled=true},focus(){this.focused=true},
  parentElement:null,...extra};nodes.set(id,e);return e;};
  const root=element('root');
  root.querySelectorAll=()=>rows;
  const left=element('progetto-form-col',{parentElement:root});
  const input=element('prog-azienda',{value:'',type:'select'});
  const id=element('prog-id',{value:'',type:'hidden'});
  const begin=element('prog-inizio');
  const form=element('form-progetto');
  form.querySelectorAll=()=>[id,input,begin];
  const note=element('safety-g3-count');
  const statusBtns=Object.keys({tutti:0,aperto:0,svolto:0,chiuso:0}).map(v=>({dataset:{safetyG3Status:v},setAttribute(k,val){this[k]=val},textContent:''}));
  const projects=[
    {id:'A',stato_corso:'aperto'},
    {id:'B',stato_corso:'svolto'},
    {id:'C',stato_corso:'chiuso'},
    {id:'D',stato_corso:null}
  ];
  const rows=projects.map(p=>({dataset:{projectId:p.id},style:{display:''}}));
  let filtered=0,resets=0,popupClosed=0,navigations=0,prompts=0,approved=true;
  const document={
    getElementById:id=>nodes.get(id)||null,
    querySelectorAll:()=>statusBtns,
    createElement:tag=>({tagName:tag.toUpperCase(),id:'',textContent:'',style:{}}),
    head:{appendChild(s){nodes.set(s.id,s)}}
  };
  const window={
    progettiList:projects,projectEditOpenedAsPopup:false,
    filtraProgetti(){filtered++;rows.forEach(row=>{row.style.display=''})},
    resetFormProgetto(){resets++;id.value='';input.value='';begin.value=''},
    chiudiPopupProgetto(){popupClosed++;this.projectEditOpenedAsPopup=false},
    confirm(){prompts++;return approved},
    decorateProjectVisualGroups(){},
    loadModule:async()=>{navigations++},
    loadProgettiTable:async()=>{},
    switchProjectPopupTab:tab=>window.lastTab=tab
  };
  vm.runInNewContext(source,{window,document,console});
  return {api:window.SafetyGraphicG3,window,document,nodes,root,left,input,id,begin,form,rows,statusBtns,note,
    get filtered(){return filtered},get resets(){return resets},get popupClosed(){return popupClosed},
    get prompts(){return prompts},get navigations(){return navigations},
    approve(v){approved=v},element};
}
test('G3 è JS valido, si carica dopo G1/G2 e non interroga né modifica Supabase',()=>{
  assert.doesNotThrow(()=>new vm.Script(source));
  assert.ok(index.indexOf('js/modules/graphic_upgrade_g3_progetti.js')>index.indexOf('js/modules/graphic_upgrade_g1_g2.js'));
  assert.match(source,/prefers-reduced-motion/);
  assert.match(source,/@media print/);
  assert.doesNotMatch(source,/supabaseClient\.from|\.insert\(|\.update\(|\.delete\(|\.storage\.from\(|fetch\(/);
});
test('Conteggi stato basati solo sui progetti caricati, senza modificare i dati',()=>{
  const x=fixture(),s=x.api.counts();
  assert.equal(s.tutti,4);
  assert.equal(s.aperto,2);
  assert.equal(s.svolto,1);
  assert.equal(s.chiuso,1);
  assert.equal(x.api.stateOf({stato_corso:'svolto'}),'svolto');
  assert.equal(x.api.stateOf({stato_corso:'chiuso'}),'chiuso');
  assert.equal(x.api.stateOf({}),'aperto');
});
test('Filtro stato si combina al filtro originale senza alterare i record',()=>{
  const x=fixture();
  x.api.setStatus('svolto');
  assert.equal(x.filtered,1);
  assert.deepEqual(x.rows.map(r=>r.style.display),['none','','none','none']);
  x.api.setStatus('chiuso');
  assert.deepEqual(x.rows.map(r=>r.style.display),['none','none','','none']);
  x.api.setStatus('tutti');
  assert.deepEqual(x.rows.map(r=>r.style.display),['','','','']);
  assert.equal(x.statusBtns[0]['aria-pressed'],'true');
  assert.match(x.note.textContent,/4 progetti caricati/);
});
test('Nuovo progetto richiede consenso prima di scartare una scheda esistente',()=>{
  const x=fixture();
  x.id.value='existing';x.input.value='modificata';
  x.approve(false);
  assert.equal(x.api.newProject(),false);
  assert.equal(x.resets,0);
  assert.equal(x.id.value,'existing');
  x.approve(true);
  assert.equal(x.api.newProject(),true);
  assert.equal(x.resets,1);
  assert.equal(x.id.value,'');
  assert.equal(x.input.focused,true);
  assert.equal(x.prompts,2);
});
test('Nuovo progetto chiude il popup originale e riapre il modulo senza nuove finestre',()=>{
  const x=fixture();
  x.window.projectEditOpenedAsPopup=true;
  x.id.value='existing';
  assert.equal(x.api.newProject(),true);
  assert.equal(x.popupClosed,1);
  assert.equal(x.window.projectEditOpenedAsPopup,false);
  assert.equal(x.id.value,'');
});
test('Navigazione guidata apre sezioni details e usa tab Corsisti del popup già presente',()=>{
  const x=fixture();
  const details={tagName:'DETAILS',open:false,parentElement:null};
  x.begin.parentElement=details;
  assert.equal(x.api.goToSection('date'),true);
  assert.equal(details.open,true);
  assert.equal(x.begin.focused,true);
  x.window.projectEditOpenedAsPopup=true;x.id.value='existing';
  assert.equal(x.api.goToSection('iscritti'),true);
  assert.equal(x.window.lastTab,'corsisti');
  assert.equal(x.api.goToSection('inesistente'),false);
});
test('Layout espandibile ripristinabile, form originale sempre nel DOM',()=>{
  const x=fixture();
  x.api.setCollapsed(true);
  assert.equal(x.root.classList.contains('safety-g3-collapsed'),true);
  assert.equal(x.document.getElementById('form-progetto'),x.form);
  x.api.setCollapsed(false);
  assert.equal(x.root.classList.contains('safety-g3-collapsed'),false);
});
