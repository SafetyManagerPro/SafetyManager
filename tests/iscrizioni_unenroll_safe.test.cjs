'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const api=fs.readFileSync(path.resolve(__dirname,'../js/supabase_config.js'),'utf8');
const utils=fs.readFileSync(path.resolve(__dirname,'../js/utils.js'),'utf8');
const start=api.indexOf('window.lastIscrizioneDeleteError = null;');
const stop=api.indexOf('// ==========================================',start);
if(start<0||stop<=start)throw Error('Blocco disiscrizione non trovato');
const code=api.slice(start,stop);
function scenario(options={}){
 const state={
  enrollment:options.enrollment===undefined?{
   id:'iscrizione-1',progetto_id:'progetto-1',ore_frequentate:null,
   percentuale_frequenza:null,voto_test:null,esito_pratica:null
  }:options.enrollment,
  project:options.project===undefined?{stato_corso:'aperto'}:options.project,
  dependents:options.dependents||{},errorTable:options.errorTable||'',
  deleted:options.deleted===undefined?[{id:'iscrizione-1'}]:options.deleted,
  deleteCount:0,queries:[]
 };
 const supabaseClient={
  from(table){
   const req={table,filter:null,selectOptions:null,isDelete:false};
   const chain={
    select(fields,opts){req.fields=fields;req.selectOptions=opts||null;return this},
    eq(field,value){req.filter=[field,value];return this},
    maybeSingle:async()=>{
     state.queries.push({table,action:'read'});
     if(state.errorTable===table)return {data:null,error:{message:'read denied '+table}};
     return {data:table==='iscrizioni'?state.enrollment:table==='progetti'?state.project:null,error:null};
    },
    delete(){req.isDelete=true;state.deleteCount++;return this},
    then(resolve,reject){return resolve(makeResult())}
   };
   function makeResult(){
    state.queries.push({table,action:req.isDelete?'delete':'count'});
    if(state.errorTable===table)return {data:null,count:null,error:{message:'read denied '+table}};
    if(req.isDelete)return {data:state.deleted,error:null};
    return {count:state.dependents[table]||0,error:null};
   }
   return chain;
  }
 };
 const window={};
 vm.runInNewContext(code,{window,supabaseClient,console});
 return {window,state};
}
test('Un nuovo corsista iscritto per errore può essere disiscritto senza toccare altri record',async()=>{
 const x=scenario();
 assert.equal(await x.window.deleteIscrizione('iscrizione-1'),true);
 assert.equal(x.state.deleteCount,1);
 assert.equal(x.window.lastIscrizioneDeleteError,null);
 assert.ok(x.state.queries.some(q=>q.action==='delete'&&q.table==='iscrizioni'));
 assert.ok(x.state.queries.every(q=>q.action!=='delete'||q.table==='iscrizioni'));
});
test('Se la DELETE restituisce zero record il programma NON dichiara successo',async()=>{
 const x=scenario({deleted:[]});
 assert.equal(await x.window.deleteIscrizione('iscrizione-1'),false);
 assert.match(x.window.lastIscrizioneDeleteError,/Nessuna iscrizione eliminata/);
});
test('Iscrizione non visibile all amministratore: nessuna cancellazione',async()=>{
 const x=scenario({enrollment:null});
 assert.equal(await x.window.deleteIscrizione('iscrizione-1'),false);
 assert.match(x.window.lastIscrizioneDeleteError,/non trovata o non visibile/);
 assert.equal(x.state.deleteCount,0);
});
for(const table of [
 'session_attendance','firme_digitali','test_digitali',
 'course_completion_items','corsisti_documenti_archivio','training_credits'
]){
 test('Protegge evidenze '+table+' da cancellazione a cascata',async()=>{
   const x=scenario({dependents:{[table]:1}});
   assert.equal(await x.window.deleteIscrizione('iscrizione-1'),false);
   assert.equal(x.state.deleteCount,0);
   assert.match(x.window.lastIscrizioneDeleteError,/evidenze del percorso/);
 });
}
test('Se la verifica delle evidenze non è autorizzata, interrompe senza cancellare',async()=>{
 const x=scenario({errorTable:'test_digitali'});
 assert.equal(await x.window.deleteIscrizione('iscrizione-1'),false);
 assert.equal(x.state.deleteCount,0);
 assert.match(x.window.lastIscrizioneDeleteError,/Impossibile verificare/);
});
test('Frequenza o test già registrati richiedono tutela dello storico',async()=>{
 const x=scenario({enrollment:{
  id:'iscrizione-1',progetto_id:'progetto-1',ore_frequentate:3,
  percentuale_frequenza:null,voto_test:null,esito_pratica:null
 }});
 assert.equal(await x.window.deleteIscrizione('iscrizione-1'),false);
 assert.equal(x.state.deleteCount,0);
});
test('Un corso chiuso/archiviato non consente disiscrizioni distruttive',async()=>{
 const x=scenario({project:{stato_corso:'chiuso'}});
 assert.equal(await x.window.deleteIscrizione('iscrizione-1'),false);
 assert.match(x.window.lastIscrizioneDeleteError,/chiuso\/archiviato/);
 assert.equal(x.state.deleteCount,0);
});
test('Disiscrizione riporta un errore quando manca ID',async()=>{
 const x=scenario();
 assert.equal(await x.window.deleteIscrizione(null),false);
 assert.match(x.window.lastIscrizioneDeleteError,/non identificata/);
 assert.equal(x.state.deleteCount,0);
});
test('Il pulsante Disiscrivi è presente nel popup e usa ID iscrizione, non ID corsista',()=>{
 const a=utils.slice(utils.indexOf('window.renderPopupCorsisti ='),utils.indexOf('window.ensureProjectPopupTabs ='));
 assert.match(a,/<th class="p-2 text-center">Azioni<\/th>/);
 assert.match(a,/window\.rimuoviIscrizione\('\\$\{isc\.id\}', '\\$\{projectId\}'\)/);
 assert.match(a,/>Disiscrivi<\/button>/);
});
test('Rimozione da UI segnala errori e ricarica la tab iscritti senza navigare',()=>{
 const a=utils.slice(utils.indexOf('window.__safetyUnenrollInProgress ='),utils.indexOf('window.applicaPresetCNAAvellino ='));
 assert.match(a,/window\.lastIscrizioneDeleteError/);
 assert.match(a,/await window\.renderPopupCorsisti\(projectId\)/);
 assert.match(a,/await window\.reloadLinkedViewsAfterMutation\('iscrizione-delete', \{ projectId \}\)/);
 assert.doesNotMatch(a,/loadModule\(/);
});
