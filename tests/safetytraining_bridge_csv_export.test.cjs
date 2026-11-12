'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../js/modules/safetytraining_bridge.js'),'utf8');
function makeBridge(){
  const win={DB_CORSI:{base:{t:'Corso test',ore:8,norma:'D.Lgs. 81/08'}},JSZip:null};
  const doc={readyState:'loading',addEventListener(){}};
  const ctx={window:win,document:doc,Blob,URL:{createObjectURL:()=>'',revokeObjectURL(){}},setTimeout(){},MutationObserver:function(){},alert(){}};
  vm.runInNewContext(source,ctx);
  return win.SafetyTrainingBridge;
}
const project={id:'proj1',codice:'CORSO-01',corso_id:'base',azienda_id:'co1',data_inizio:'2026-11-12',data_esame:'2026-11-13',rischi_selezionati:['R1','R2'],rischi_personalizzati:'Caduta; urto'};
const company={id:'co1',ragione_sociale:'Demo, Test',piva_cf:'IT12345678901',ateco:'41.20',indirizzo:'Via A, 10',sede_operativa:'Via A, 10'};
const inc=[
  {id:'en1',corsista_id:'c1',partecipazione_stato:'iscritto',corsisti:{id:'c1',nome_cognome:'Rossi; "Mario"',cf:'RSSMRA80A01H501U',azienda_id:'co1',mansione_storica:'Operaio'}},
  {id:'en2',corsista_id:'c2',partecipazione_stato:'non_partecipante',corsisti:{id:'c2',nome_cognome:'Persona non presente',cf:'RSSXXX80A01H501U'}},
  {id:'en3',corsista_id:'c3',partecipazione_stato:'iscrizione_erronea',corsisti:{id:'c3',nome_cognome:'Persona errata',cf:'RSSEEE80A01H501U'}}
];
test('JSON v1.2 preservato con filtro delle sole iscrizioni segnalate',()=>{
 const b=makeBridge(),payload=b.buildTransfer(project,inc,company);
 assert.equal(payload.schema,'safetytraining.transfer');
 assert.equal(payload.schema_version,'1.2');
 assert.equal(payload.source_system,'safetymanager');
 assert.equal(payload.learners.length,1);
 assert.equal(payload.learners[0].enrollment_external_id,'en1');
 assert.deepEqual(Object.keys(payload).sort(),['schema','schema_version','source_system','export_id','exported_at','company','project','learners'].sort());
 assert.equal(b.validateTransfer(payload).ok,true);
 assert.equal(b.isExcludedEnrollment(inc[1]),true);
 assert.equal(b.isExcludedEnrollment(inc[2]),true);
 assert.equal(b.isExcludedEnrollment(inc[0]),false);
 const empty=b.buildTransfer(project,inc.slice(1),company);
 assert.equal(b.validateTransfer(empty).ok,false);
});
test('CSV BOM, separatore punto e virgola, quote e record unici',()=>{
 const b=makeBridge(),p=b.buildTransfer(project,inc,company),csv=b.transferToCsv(p);
 assert.ok(csv.startsWith('\uFEFF'));
 assert.ok(csv.includes('company_vat_or_fiscal_code'));
 assert.ok(csv.includes('project_course_title'));
 assert.ok(csv.includes('learner_fiscal_code'));
 assert.ok(csv.includes('"Rossi; ""Mario"""'));
 assert.ok(csv.includes('[""R1"",""R2""]'));
 assert.equal(csv.trim().split('\r\n').length,2);
 assert.equal(b.csvRows(p).length,1);
});
test('Non interpretare valori anagrafici come formule Excel',()=>{
 const b=makeBridge(),input={...inc[0],corsisti:{...inc[0].corsisti,nome_cognome:'=1+1'}};
 const csv=b.transferToCsv(b.buildTransfer(project,[input],company));
 assert.ok(csv.includes("';=1+1")||csv.includes("'=1+1"));
 assert.ok(!csv.includes(';"=1+1"'));
});
test('UI tre pulsanti, cache-busting PWA, senza librerie aggiuntive',()=>{
 assert.match(source,/id="stx-export-json"/);
 assert.match(source,/id="stx-export-csv"/);
 assert.match(source,/id="stx-export-both"/);
 assert.match(source,/window\.JSZip/);
 assert.match(source,/excludedCount/);
 const sw=fs.readFileSync(path.resolve(__dirname,'../sw.js'),'utf8');
 const app=fs.readFileSync(path.resolve(__dirname,'../js/app.js'),'utf8');
 assert.match(sw,/safetymanager-pwa-v22/);
 assert.match(sw,/safetytraining_bridge\.js\?v=20261112-json-csv/);
 assert.match(app,/safetytraining_bridge\.js\?v=20261112-json-csv/);
});
test('ZIP non scende silenziosamente a JSON in caso di libreria mancante',async()=>{
 const b=makeBridge(),p=b.buildTransfer(project,inc,company);
 await assert.rejects(b.downloadTransfer('test',p,'zip'),/Libreria ZIP non disponibile/);
});
