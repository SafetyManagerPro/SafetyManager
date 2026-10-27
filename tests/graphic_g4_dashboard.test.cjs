'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const g4=fs.readFileSync(path.resolve(__dirname,'../js/modules/graphic_upgrade_g4_dashboard.js'),'utf8');
const dashboard=fs.readFileSync(path.resolve(__dirname,'../js/modules/dashboard_pro.js'),'utf8');
const app=fs.readFileSync(path.resolve(__dirname,'../js/app.js'),'utf8');
const html=fs.readFileSync(path.resolve(__dirname,'../modules/admin.html'),'utf8');

function fixture(){
 const map=new Map();
 const ring={style:{}};
 const handlers={};
 const status={
   id:'dash-g4-status',innerHTML:'',querySelector:function(selector){return selector==='.safety-g4-ring'?ring:null}
 };
 const upcoming={id:'dash-g4-upcoming',innerHTML:''};
 const main={id:'dash-g4-overview',addEventListener:function(type,fn){handlers[type]=fn}};
 map.set('dash-g4-status',status);map.set('dash-g4-upcoming',upcoming);map.set('dash-g4-overview',main);
 const document={getElementById:function(id){return map.get(id)||null},
   createElement:function(){return {id:'',textContent:''}},
   head:{appendChild:function(node){map.set(node.id,node)}}
 };
 const openCalls=[],navCalls=[];
 const window={
  DB_CORSI:{primo:{t:'Primo soccorso'}},
  dashboardOpenProject:function(id){openCalls.push(id)},
  loadModule:function(name){navCalls.push(name)}
 };
 vm.runInNewContext(g4,{window,document,console,Intl,Date});
 return {api:window.SafetyGraphicG4,status,upcoming,main,ring,handlers,map,openCalls,navCalls,window};
}
test('G4 valido, caricato dalla Dashboard esistente; non aggiunge letture DB o mutazioni',()=>{
 assert.doesNotThrow(()=>new vm.Script(g4));
 assert.match(app,/js\/modules\/graphic_upgrade_g4_dashboard\.js/);
 assert.ok(app.indexOf('js/modules/graphic_upgrade_g4_dashboard.js')>app.indexOf('js/modules/dashboard_pro.js'));
 assert.match(dashboard,/SafetyGraphicG4\.render\(\{ counts, projects: projects \|\| \[\], statuses \}\)/);
 assert.match(dashboard,/catch \(error\) \{ console\.warn\('G4: panoramica grafica non disponibile'/);
 assert.match(html,/id="dash-g4-overview"/);
 assert.match(html,/id="dash-g4-status"/);
 assert.match(html,/id="dash-g4-upcoming"/);
 assert.doesNotMatch(g4,/supabaseClient|fetch\(|\.insert\(|\.update\(|\.delete\(|localStorage|sessionStorage/);
});
test('Distribuzione per stati mutuamente esclusivi, include classificazione fallback',()=>{
 const x=fixture();
 const result=x.api.distribution([
  {key:'draft'},{key:'post_review'},{key:'toclose'},{key:'post_complete'},
  {key:'post_acquire'},{key:'ready'},{key:'ready_archive'},
  {key:'closed'},{key:'unknown'}
 ]);
 assert.deepEqual(JSON.parse(JSON.stringify(result)),{
  review:2,complete:2,acquire:1,ready:2,closed:1,other:1
 });
 assert.equal(Object.values(result).reduce((a,b)=>a+b,0),9);
});
test('Grafico mostra i contatori caricati e gestisce lista vuota',()=>{
 const x=fixture();
 assert.equal(x.api.render({projects:[],statuses:[]}),true);
 assert.match(x.status.innerHTML,/Nessun progetto disponibile/);
 assert.match(x.upcoming.innerHTML,/Nessuna data di verifica/);
 const projects=[{id:'p',corso_id:'primo',codice:'A01',stato_corso:'aperto',data_esame:'2026-11-03',aziende:{ragione_sociale:'Alfa'}}];
 x.api.render({projects,statuses:[{key:'ready'}],now:new Date('2026-10-27T14:00:00')});
 assert.match(x.status.innerHTML,/progetti letti/);
 assert.match(x.status.innerHTML,/Pronti/);
 assert.match(x.ring.style.background,/conic-gradient/);
 assert.match(x.upcoming.innerHTML,/A01/);
 assert.match(x.upcoming.innerHTML,/Primo soccorso/);
 assert.match(x.upcoming.innerHTML,/Alfa/);
});
test('Le prossime date sono sempre date progetto, escludono chiusi, passati e oltre 30 giorni',()=>{
 const x=fixture();
 const data=[
  {id:'future',data_esame:'2026-11-26',stato_corso:'aperto'},
  {id:'today',data_esame:'2026-10-27',stato_corso:'svolto'},
  {id:'closed',data_esame:'2026-10-28',stato_corso:'chiuso'},
  {id:'past',data_esame:'2026-10-26',stato_corso:'aperto'},
  {id:'too-far',data_esame:'2026-11-27',stato_corso:'aperto'},
  {id:'bad',data_esame:'2026-02-30',stato_corso:'aperto'},
  {id:'missing',data_esame:null,stato_corso:'aperto'}
 ];
 const result=x.api.upcoming(data,new Date('2026-10-27T21:17:00'));
 assert.deepEqual(Array.from(result,x=>x.project.id),['today','future']);
});
test('Escaping testo di aziende, corsi e progetti nel calendario',()=>{
 const x=fixture();
 const project={id:'a"&<',codice:'<img src=x onerror=1>',corso_id:'primo',stato_corso:'aperto',data_esame:'2026-11-03',aziende:{ragione_sociale:'<script>alert(1)</script>'}};
 x.api.render({projects:[project],statuses:[{key:'draft'}],now:new Date('2026-10-27T12:00:00')});
 assert.doesNotMatch(x.upcoming.innerHTML,/<img |<script>/);
 assert.match(x.upcoming.innerHTML,/&lt;img/);
 assert.match(x.upcoming.innerHTML,/&lt;script&gt;/);
 assert.match(x.upcoming.innerHTML,/data-safety-g4-project="a&amp;quot;&amp;&lt;|data-safety-g4-project="a&quot;&amp;&lt;/);
});
test('Apre solo progetti presenti tra quelli visualizzati, non comandi arbitrari',()=>{
 const x=fixture();
 x.api.render({projects:[{id:'real',codice:'C1',data_esame:'2026-10-28'}],statuses:[{key:'ready'}],now:new Date('2026-10-27T12:00:00')});
 const click=id=>x.handlers.click({target:{closest:()=>({getAttribute:()=>id})}});
 click('injected');
 assert.equal(x.openCalls.length,0);
 click('real');
 assert.deepEqual(x.openCalls,['real']);
 assert.deepEqual(x.navCalls,[]);
});
test('Grafico senza host non esegue effetti su schermate diverse da Dashboard',()=>{
 const x=fixture();
 x.map.delete('dash-g4-overview');
 assert.equal(x.api.render({projects:[],statuses:[]}),false);
});
