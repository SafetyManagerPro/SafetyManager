'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const script=fs.readFileSync(path.resolve(__dirname,'../js/modules/iscrizioni_rettifica.js'),'utf8');
const html=fs.readFileSync(path.resolve(__dirname,'../index.html'),'utf8');
const util=fs.readFileSync(path.resolve(__dirname,'../js/utils.js'),'utf8');
const sw=fs.readFileSync(path.resolve(__dirname,'../sw.js'),'utf8');
const IDs={
 one:'12345678-1234-4234-8234-123456789012',
 student:'12345678-1234-4234-8234-123456789013',
 from:'12345678-1234-4234-8234-123456789014',
 to:'12345678-1234-4234-8234-123456789015'
};
function fixture(opt={}){
 const operations=[],counts={...opt.counts},student={id:IDs.student,azienda_id:'company1',nome_cognome:'Demo',cf:'DEMOABC12345',archived_at:null,ruolo_aziendale:'lavoratore'},
   from={id:IDs.from,codice:'CORSO-OLD',corso_id:'lav_basso',azienda_id:'company1',stato_corso:opt.sourceState||'aperto'},
   to={id:IDs.to,codice:'CORSO-NEW',corso_id:'lav_medio',azienda_id:'company1',stato_corso:opt.targetState||'aperto',modalita:'aula'},
   enrollment={id:IDs.one,progetto_id:IDs.from,corsista_id:IDs.student,
      ore_frequentate:null,percentuale_frequenza:null,voto_test:null,esito_pratica:null,
      note_verifica:null,id_certificato:'OLD',esito:'Idoneo',...opt.enrollment};
 let updated=null;
 const db={
   from(table){
    const s={table,cond:[],mode:'read',cols:'',head:false};
    function get(){
      operations.push({table,mode:s.mode,cond:s.cond,patch:s.patch});
      if(opt.errorTable===table)return {data:null,error:{message:'permesso negato'},count:null};
      if(s.mode==='update'){
        if(opt.noUpdate)return {data:[],error:null};
        updated={...enrollment,...s.patch};
        return {data:[{id:IDs.one,progetto_id:IDs.to}],error:null};
      }
      if(s.mode==='count')return {count:counts[table]||0,error:null};
      if(s.cols==='id'&&table==='iscrizioni')return {data:opt.duplicate?[{id:'other'}]:[],error:null};
      const data=table==='iscrizioni'?enrollment:table==='progetti'?
        (s.cond.some(x=>x[1]===IDs.from)?from:to):table==='corsisti'?student:
        table==='aziende'?{id:'company1',ragione_sociale:'Azienda Demo',piva_cf:'TEST'}:null;
      return {data,error:null};
    }
    const chain={
     select(cols,opts){s.cols=cols;if(opts?.head){s.mode='count';s.head=true;}return this},
     eq(key,val){s.cond.push([key,val]);return this},
     maybeSingle:async()=>get(),
     limit(){return this},
     update(patch){s.mode='update';s.patch=patch;return this},
     then(ok,bad){try{return Promise.resolve(ok(get()))}catch(e){return Promise.reject(e)}}
    };return chain;
   }
 };
 const window={
  supabaseClient:db,
  getSafetyAdminUser:async()=>({id:'admin'}),
  getProgetti:async()=>[from,to],
  DB_CORSI:{lav_basso:{t:'Basso'},lav_medio:{t:'Medio'}},
  buildIscrizioneRecord:(p,c)=>({
   progetto_id:p.id,id_certificato:'NEW-CERT',data_scadenza:'2030-01-01',esito:'Idoneo',
   azienda_storica_id:p.azienda_id,azienda_storica_nome:p.aziende?.ragione_sociale,
   azienda_storica_piva_cf:p.aziende?.piva_cf,
   ruolo_aziendale_storico:c.ruolo_aziendale,
   nome_cognome_storico:c.nome_cognome,cf_storico:c.cf,
   luogo_data_nascita_storico:null,mansione_storica:null
  }),
  ASR2025_POLICY:{maxDiscentiAula:30},
  safetyAudit:async()=>true
 };
 const document={getElementById:()=>null};
 vm.runInNewContext(script,{window,document,console,Date});
 return {window,operations,counts,student,from,to,enrollment,get updated(){return updated}};
}
test('Script valido, link/JS versionato, nessuna nuova tabella SQL o migrazione',()=>{
 assert.doesNotThrow(()=>new vm.Script(script));
 assert.ok(html.includes('iscrizioni_rettifica.js?v=20261028-rettifica'));
 assert.ok(util.includes('window.apriGestioneIscrizione'));
 assert.match(sw,/safetymanager-pwa-v16/);
 assert.match(sw,/iscrizioni_rettifica.js\?v=20261028-rettifica/);
});
test('Diagnostica sola lettura: un iscritto per errore risulta trasferibile',async()=>{
 const f=fixture(),r=await f.window.SafetyEnrollmentReview.examine(IDs.one);
 assert.equal(r.blocked,false);
 assert.equal(r.reasons.length,0);
 assert.equal(f.operations.filter(x=>x.mode==='update').length,0);
 assert.equal(r.counts.length,6);
});
for(const table of ['session_attendance','firme_digitali','test_digitali','course_completion_items','corsisti_documenti_archivio','training_credits']){
 test('Il trasferimento non aggira il vincolo '+table,async()=>{
  const f=fixture({counts:{[table]:1}});
  await assert.rejects(()=>f.window.SafetyEnrollmentReview.transfer(IDs.one,IDs.to,'Errore materiale inserimento'),/Trasferimento bloccato/);
  assert.equal(f.operations.filter(x=>x.mode==='update').length,0);
 });
}
test('Note/risultati di frequenza presenti impediscono trasferimento',async()=>{
 const f=fixture({enrollment:{note_verifica:'Verifica svolta'}});
 await assert.rejects(()=>f.window.SafetyEnrollmentReview.transfer(IDs.one,IDs.to,'Errore materiale inserimento'),/bloccato/);
 assert.equal(f.operations.filter(x=>x.mode==='update').length,0);
});
test('Corso chiuso o svolto impedisce lo spostamento di dati storici',async()=>{
 const f=fixture({sourceState:'chiuso'});
 await assert.rejects(()=>f.window.SafetyEnrollmentReview.transfer(IDs.one,IDs.to,'Errore materiale inserimento'),/bloccato/);
 const g=fixture({targetState:'chiuso'});
 await assert.rejects(()=>g.window.SafetyEnrollmentReview.transfer(IDs.one,IDs.to,'Errore materiale inserimento'),/destinazione deve essere aperto/);
});
test('Motivazione obbligatoria e rifiuto duplicati',async()=>{
 const f=fixture();
 await assert.rejects(()=>f.window.SafetyEnrollmentReview.transfer(IDs.one,IDs.to,'no'),/motivazione/);
 assert.equal(f.operations.filter(x=>x.mode==='update').length,0);
 const g=fixture({duplicate:true});
 await assert.rejects(()=>g.window.SafetyEnrollmentReview.transfer(IDs.one,IDs.to,'Errore materiale inserimento'),/già iscritto/);
 assert.equal(g.operations.filter(x=>x.mode==='update').length,0);
});
test('Rettifica ammessa: UPDATE della stessa iscrizione con snapshot corretto e nota di audit',async()=>{
 const f=fixture();
 const res=await f.window.SafetyEnrollmentReview.transfer(IDs.one,IDs.to,'Iscritto al progetto errato');
 assert.equal(res.enrollmentId,IDs.one);
 assert.equal(res.to.id,IDs.to);
 const changes=f.operations.filter(x=>x.mode==='update');
 assert.equal(changes.length,1);
 assert.equal(changes[0].table,'iscrizioni');
 assert.equal(changes[0].patch.progetto_id,IDs.to);
 assert.equal(changes[0].patch.id_certificato,'NEW-CERT');
 assert.match(changes[0].patch.note_verifica,/Iscritto al progetto errato/);
 assert.match(changes[0].patch.note_verifica,/CORSO-OLD/);
 assert.ok(changes[0].cond.some(([key,val])=>key==='id'&&val===IDs.one));
 assert.ok(changes[0].cond.some(([key,val])=>key==='progetto_id'&&val===IDs.from));
 assert.ok(f.operations.filter(x=>x.mode==='update').every(x=>x.table==='iscrizioni'));
});
test('Se 0 righe aggiornate non dichiara trasferimento riuscito',async()=>{
 const f=fixture({noUpdate:true});
 await assert.rejects(()=>f.window.SafetyEnrollmentReview.transfer(IDs.one,IDs.to,'Errore materiale inserimento'),/non ha confermato/);
});
test('Se verifica RLS/evidenze fallisce non tenta modifiche',async()=>{
 const f=fixture({errorTable:'firme_digitali'});
 await assert.rejects(()=>f.window.SafetyEnrollmentReview.transfer(IDs.one,IDs.to,'Errore materiale inserimento'),/Impossibile verificare/);
 assert.equal(f.operations.filter(x=>x.mode==='update').length,0);
});
