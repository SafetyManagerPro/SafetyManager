'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const src=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const utils=src('js/utils.js'),state=src('js/modules/iscrizioni_partecipazione.js'),
      history=src('js/modules/training_history_advisor.js'),archive=src('js/modules/archivio.js');
test('Anagrafica Corsisti: le tre query paginazione/fallback leggono lo stato',()=>{
 assert.ok((utils.match(/partecipazione_stato,/g)||[]).length>=3);
 assert.match(utils,/data-enrollment-status/);
 assert.match(utils,/Attestato inibito/);
 assert.match(utils,/flagged\?'border-rose-500 bg-rose-100'/);
});
test('Un solo criterio per non partecipante e iscrizione erronea',()=>{
 assert.match(state,/SafetyEnrollmentStatus = Object\.freeze/);
 assert.match(state,/non_partecipante/);
 assert.match(state,/iscrizione_erronea/);
 assert.match(state,/assertPrintable:/);
});
test('Stampe: guardia nel motore centrale e nella stampa multipla',async()=>{
 assert.match(utils,/if\(moduleId==='attestato'\) window\.SafetyEnrollmentStatus\?\.assertPrintable/);
 assert.match(utils,/window\.renderAttestatiMultipli = async function/);
 assert.match(utils,/ATTESTATI INIBITI/);
 assert.match(utils,/window\.stampaAttestatiMultipli = async function/);
 const a=utils.indexOf('window.renderAttestatiMultipli = async function('),b=utils.indexOf('window.stampaAttestatiMultipli = async function(',a);
 const ctx={window:{currentSessionCorsisti:[{partecipazione_stato:'iscrizione_erronea'}],SafetyEnrollmentStatus:{flaggedIn:rows=>rows.some(r=>r.partecipazione_stato==='iscrizione_erronea')}}};
 vm.runInNewContext(utils.slice(a,b),ctx);
 await assert.rejects(ctx.window.renderAttestatiMultipli({},{}),/ATTESTATI INIBITI/);
 const view={textContent:''};assert.equal(await ctx.window.renderAttestatiMultipli(view,{preview:true}),0);
 assert.match(view.textContent,/INIBITI/);
});
test('Stampe libere corsista: menu segnala e disabilita corso marcato',()=>{
 const s=src('js/modules/progetti_corsisti_refinement.js');
 assert.match(s,/c\.flagged\?'disabled'/);
 assert.match(s,/chosen\.flagged/);
});
test('Storici, scadenze, archivi e report portano stato amministrativo',()=>{
 const scad=src('js/modules/scadenze.js'),fasc=src('js/modules/corsisti_fascicolo_archivio.js'),
       adv=src('js/modules/archivio_avanzato.js');
 assert.match(history,/partecipazione_stato,partecipazione_motivo/);
 assert.match(history,/non valido ai fini della formazione/);
 assert.match(scad,/Scadenza non valida/);
 assert.match(fasc,/Impossibile archiviare un nuovo attestato/);
 assert.match(fasc,/Nuovo attestato non archiviabile/);
 assert.match(archive,/Stato partecipazione/);
 assert.match(archive,/Motivo segnalazione/);
 assert.match(adv,/Stato partecipazione/);
 assert.match(adv,/attestato inibito/);
});
test('Cache PWA versione nuova',()=>{
 assert.match(src('sw.js'),/safetymanager-pwa-v22/);
 assert.match(src('index.html'),/20261028-g9-global-status/);
});
