'use strict';
// Catalogo documenti azienda/lavoratore D.Lgs. 81/08 (9 novembre 2026).
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=f=>fs.readFileSync(path.resolve(__dirname,'..',f),'utf8');
const source=read('js/modules/documenti_azienda_lavoratore_catalogo.js');

function load(){
 const types=new Set(['verbale_consegna_dpi','registro_consegna_dpi','lettera_incarico_sicurezza','dichiarazione_dl_diretta']);
 const D={types,esc:v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),fmt:v=>v||'',today:()=>'2026-11-09',
  header:c=>`<header>${c.nome}</header>`,roleMeta:()=>({duties:'sovrintendere e vigilare'}),
  directoryCache:{people:[],companies:[],histories:new Map()}};
 const calls=[];
 const window={SafetyCompanyDocs:D,openSafetyCompanyDoc:t=>calls.push(['open',t]),generateSafetyCompanyDoc:()=>calls.push(['gen'])};
 const document={getElementById:()=>null,querySelectorAll:()=>[],body:{}};
 class MutationObserver{observe(){}}
 vm.runInNewContext(source,{window,document,MutationObserver,console});
 return {window,D,calls};
}
const ctx={company:{nome:'Alfa Srl',piva:'01234567890'},datore:'Mario Rossi',date:'2026-11-09',place:'Avellino'};
const worker={nome:'Luca Bianchi',cf:'BNCLCU80A01A509X',nascita:'Avellino, 01/01/1980',mansione:'Magazziniere'};

test('Catalogo: 9 documenti nuovi, tipi registrati per la stampa, modelli storici intatti',()=>{
 const {D}=load();
 const ids=D.catalog.map(d=>d.id);
 assert.deepEqual(JSON.parse(JSON.stringify(ids)),['info_art36','info_rischi_specifici','presa_visione_emergenza','addestramento_generale','addestramento_attrezzatura','consegna_addestramento_dpi','nomina_preposto','verbale_elezione_rls','registro_addestramento']);
 ids.forEach(id=>assert.ok(D.types.has(id),id));
 assert.ok(D.types.has('stampa_unica_81'));
 ['verbale_consegna_dpi','registro_consegna_dpi','lettera_incarico_sicurezza','dichiarazione_dl_diretta'].forEach(t=>assert.ok(D.types.has(t)));
});

test('I modelli storici continuano a usare le funzioni originali',()=>{
 const {window,calls}=load();
 window.openSafetyCompanyDoc('verbale_consegna_dpi');
 window.generateSafetyCompanyDoc();
 assert.deepEqual(calls,[['open','verbale_consegna_dpi'],['gen']]);
});

test('Ogni documento individuale riporta datore di lavoro, lavoratore e firme di entrambi',()=>{
 const {D}=load();
 D.catalog.filter(d=>d.scope==='person').forEach(d=>{
  const html=d.render(ctx,worker,{},{workers:[],rlsCandidates:[]});
  assert.match(html,/Mario Rossi/,d.id);
  assert.match(html,/Luca Bianchi/,d.id);
  assert.match(html,/BNCLCU80A01A509X/,d.id);
  assert.match(html,/Il datore di lavoro/,d.id);
  assert.ok(/Il lavoratore|Il preposto, per accettazione/.test(html),d.id);
  assert.equal((html.match(/class="doc-page safety-company-doc-page"/g)||[]).length,1,d.id);
 });
});

test('Nessun esito presunto: le prove pratiche restano da spuntare a mano',()=>{
 const {D}=load();
 ['addestramento_generale','addestramento_attrezzatura'].forEach(id=>{
  const html=D.catalog.find(d=>d.id===id).render(ctx,worker,{},{});
  assert.match(html,/&#9744; positivo &nbsp;&nbsp; &#9744; da ripetere/);
 });
});

test('Verbale RLS: candidati solo dalla formazione RLS completata, eletto mai precompilato',()=>{
 const {D}=load();
 const doc=D.catalog.find(d=>d.id==='verbale_elezione_rls');
 const html=doc.render(ctx,null,{},{rlsCandidates:[{nome:'Anna Verdi',cf:'VRDNNA',corso:'RLS (32h) — 01/10/2026'}]});
 assert.match(html,/Anna Verdi/);
 assert.match(html,/Risulta eletto\/a RLS: <b>_+<\/b>/);
 assert.match(source,/const pre=f\.source==='rls'\?'':/);
 assert.match(source,/RLS_COURSES=new Set\(\['rls','agg_rls_4h','agg_rls_8h'\]\)/);
});

test('Registro addestramento: 12 righe per pagina',()=>{
 const {D}=load();
 const doc=D.catalog.find(d=>d.id==='registro_addestramento');
 const workers=Array.from({length:13},(_,i)=>({nome:'Lav '+i,cf:''}));
 const html=doc.render(ctx,null,{con_nomi:true},{workers});
 assert.equal((html.match(/class="doc-page safety-company-doc-page"/g)||[]).length,2);
});

test('Il modulo e caricato dopo quello esistente e non tocca corsi o database',()=>{
 for(const f of ['js/modules/professional_suite.js','js/modules/progetti_corsisti_refinement.js']){
  const t=read(f);
  assert.ok(t.indexOf('documenti_azienda_lavoratore_catalogo.js')>t.indexOf('documenti_azienda_lavoratore_directory.js'),f);
 }
 assert.doesNotMatch(source,/supabaseClient|\.insert\(|\.upsert\(|\.update\(|\.delete\(/);
});

test('Datore di lavoro: persona con ruolo "Datore di lavoro", referente solo come riserva (tutti i documenti)',()=>{
 const core=read('js/modules/documenti_azienda_lavoratore_core.js');
 assert.match(core,/datore:D\.employerNameFor\(a\?\.id\)\|\|a\?\.referente\|\|''/);
 assert.match(core,/datore:D\.employerNameFor\(a\.id\|\|p\?\.azienda_id\)\|\|a\.referente/);
 assert.match(core,/p\.ruolo_aziendale==='datore_lavoro'/);
 assert.match(source,/const employerOf=companyId=>company\(companyId\)\?\.datore\|\|''/);
});

test('Stampa libera: precompilata con azienda e persona scelte, attestato in bianco, nessuna copia in archivio',()=>{
 const dir=read('js/modules/documenti_azienda_lavoratore_directory.js');
 assert.match(dir,/window\.scdFreePrint=\(\)=>/);
 assert.match(dir,/if\(type==='attestato'\) return window\.stampaModelloVuotoSafetyDoc\(type,'','',\{archive:false\}\)/);
 assert.match(dir,/return window\.stampaModelloVuotoSafetyDoc\(type,corsistaId,companyId,\{archive:false\}\)/);
 assert.match(dir,/if\(corsistaId&&options\?\.archive!==false\)/);
 // il richiamo dalla scheda corsista resta invariato (archivia come prima)
 assert.match(read('js/modules/progetti_corsisti_refinement.js'),/await window\.stampaModelloVuotoSafetyDoc\(type,corsistaId\);/);
});
