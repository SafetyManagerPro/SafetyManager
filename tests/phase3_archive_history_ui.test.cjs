'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.resolve(__dirname,'../js/modules/corsisti_fascicolo_archivio.js'),'utf8');
const start=source.indexOf('function documentVersionGroups(){');
const end=source.indexOf('async function refresh(){',start);
assert.ok(start>=0&&end>start,'Render archivio e funzioni raggruppamento isolabili');
const block=source.slice(start,end);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TYPES={attestato:'Attestato',altro:'Altro documento'};
const doc=(id,group,versione,stato,date,title='Attestato')=>({
 id,gruppo_versioni:group,versione,stato,creato_il:date,titolo:title,
 tipo_documento:'attestato',iscrizione_id:null,azienda_storica_nome:'Azienda test',
 nome_cognome_storico:'Mario Rossi',cf_storico:'RSSMRA',note:'',storage_path:'person/'+id+'/documento.pdf'
});
const fixture=[
 doc('a3','a',3,'bozza','2026-10-27T11:00:00Z'),
 doc('a2','a',2,'definitivo','2026-10-26T11:00:00Z'),
 doc('a1','a',1,'superato','2026-10-25T11:00:00Z'),
 doc('b2','b',2,'bozza','2026-10-24T11:00:00Z','Incarico B'),
 doc('b1','b',1,'definitivo','2026-10-20T11:00:00Z','Incarico B'),
 doc('single',null,1,'bozza','2026-10-23T11:00:00Z','Documento singolo')
];
function run(input=fixture,filter='all'){
 const state={docs:input,enrollments:[],filter,expandedGroups:new Set()};
 const nodes={'cfasc-list':{innerHTML:''},'cfasc-summary':{textContent:''}};
 const el=id=>nodes[id]||null;
 const runtime=vm.runInNewContext(block+'\n({render,documentVersionGroups})',{
   state,el,esc,TYPES,fmtDate:()=> '27/10/2026'
 });
 return {state,nodes,...runtime};
}
const occurrences=(s,needle)=>s.split(needle).length-1;

test('Vista Tutti: tre documenti raggruppati, mostra solo la versione più recente',()=>{
 const v=run();const groups=v.documentVersionGroups();
 assert.equal(groups.length,3);
 assert.equal(groups[0].id,'a');
 assert.deepEqual(Array.from(groups[0].items,d=>d.id),['a3','a2','a1']);
 v.render();
 const html=v.nodes['cfasc-list'].innerHTML;
 assert.equal(occurrences(html,'data-cfasc-action="open"'),3);
 assert.equal(occurrences(html,'data-cfasc-action="history"'),2);
 assert.match(v.nodes['cfasc-summary'].textContent,/3 documenti · 6 versioni/);
 assert.match(html,/Mostra storico \(2\)/);
 assert.match(html,/Più recente/);
 assert.doesNotMatch(html,/data-doc-id="a2"/);
 assert.doesNotMatch(html,/data-doc-id="a1"/);
});

test('Espandi/Nascondi: tutte le versioni dello stesso documento restano ristampabili',()=>{
 const v=run();
 v.state.expandedGroups.add('a');
 v.render();
 const html=v.nodes['cfasc-list'].innerHTML;
 assert.equal(occurrences(html,'data-cfasc-action="open"'),5);
 assert.match(html,/data-doc-id="a2"/);
 assert.match(html,/data-doc-id="a1"/);
 assert.match(html,/Apri \/ stampa PDF v2/);
 assert.match(html,/aria-expanded="true"/);
 assert.match(html,/Nascondi versioni precedenti/);
 v.state.expandedGroups.delete('a');
 v.render();
 assert.equal(occurrences(v.nodes['cfasc-list'].innerHTML,'data-cfasc-action="open"'),3);
});

test('Filtro per stato include versioni storiche senza bisogno di espandere lo storico',()=>{
 const v=run(fixture,'definitivo');
 v.render();
 const html=v.nodes['cfasc-list'].innerHTML;
 assert.equal(occurrences(html,'data-cfasc-action="open"'),2);
 assert.match(html,/data-doc-id="a2"/);
 assert.match(html,/data-doc-id="b1"/);
 assert.doesNotMatch(html,/data-doc-id="a3"/);
 assert.doesNotMatch(html,/data-cfasc-action="history"/);
 assert.match(v.nodes['cfasc-summary'].textContent,/2 documenti · 2 versioni con stato definitivo/);
});

test('Metadati esterni escapati, pulsanti su mobile con area di tocco ampia',()=>{
 const injected=doc('evil','<img src=x>','1','bozza','2026-10-27','<script>alert(1)</script>');
 injected.nome_cognome_storico='<svg onload=1>';
 injected.note='A&B "special"';
 const v=run([injected]);v.render();const html=v.nodes['cfasc-list'].innerHTML;
 assert.doesNotMatch(html,/<script>|<svg|<img src=x>/);
 assert.match(html,/&lt;script&gt;/);
 assert.match(html,/&lt;svg onload=1&gt;/);
 assert.match(html,/A&amp;B/);
 assert.match(html,/min-h-11 w-full/);
 assert.match(html,/data-doc-id="evil"/);
});

test('Documento singolo e archivio vuoto non generano espansioni inutili',()=>{
 const alone=run([fixture[5]]);alone.render();
 assert.doesNotMatch(alone.nodes['cfasc-list'].innerHTML,/Mostra storico/);
 assert.equal(occurrences(alone.nodes['cfasc-list'].innerHTML,'data-cfasc-action="open"'),1);
 const empty=run([]);empty.render();
 assert.match(empty.nodes['cfasc-list'].innerHTML,/Non ci sono ancora PDF/);
 assert.match(empty.nodes['cfasc-summary'].textContent,/0 documenti · 0 versioni/);
});

test('La delega azioni valida la famiglia prima di aprire lo storico',()=>{
 assert.match(source,/if\(action==='history'\)\{/);
 assert.match(source,/if\(!state\.docs\.some\(d=>String\(d\.gruppo_versioni\|\|d\.id\)===groupId\)\)return;/);
 assert.match(source,/state\.expandedGroups\.add\(groupId\)/);
 assert.match(source,/state\.expandedGroups\.clear\(\)/);
});
