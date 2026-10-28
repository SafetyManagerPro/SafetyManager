'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
const util=read('js/utils.js'),refinement=read('js/modules/progetti_corsisti_refinement.js'),
      html=read('modules/progetti.html'),index=read('index.html'),sw=read('sw.js'),app=read('js/app.js');
test('Corsisti nel progetto sono un accordion',()=>{const x=refinement.split('function renderProjectParticipantsSummary(')[1].split('function installProjectRenderers()')[0];assert.match(x,/<details/);assert.doesNotMatch(x,/> Apri corsisti/);});
test('Popup progetto e finestra iscritti espongono la rettifica G7',()=>{
 assert.match(util,/window\.renderPopupCorsisti[\s\S]*?Verifica \/ trasferisci/);
 const legacy=util.split('window.loadIscrittiTable = async function() {')[1].split('window.aggiungiIscrizione = async function()')[0];
 assert.match(legacy,/window\.apriGestioneIscrizione/);
 assert.match(legacy,/Verifica \/ trasferisci/);
 assert.match(legacy,/window\.rimuoviIscrizione/);
 assert.match(html,/id="panel-iscrizioni" role="dialog"/);
 assert.match(html,/data-close-iscritti/);
 assert.match(html,/z-\[120\]/);
 assert.match(html,/id="qa-modal-corsista"[^\n]*z-\[130\]/);
});
test('Apri e chiudi finestra senza mutazioni dati, ripristinando il focus',async()=>{
 const s=util.indexOf('window.apriIscrizioni = async function('),e=util.indexOf('window.loadIscrittiTable = async function()',s);
 assert.ok(s>0&&e>s);
 const classes=new Set(['hidden']);
 const classList={add:v=>classes.add(v),remove:v=>classes.delete(v),contains:v=>classes.has(v)};
 let focusRestored=0,focusClose=0,reads=0,errors=[];
 const opener={isConnected:true,focus:()=>focusRestored++};
 const panel={classList,dataset:{},addEventListener:()=>{},querySelector:()=>({focus:()=>focusClose++})};
 const nodes={'panel-iscrizioni':panel,'lbl-progetto-attivo':{textContent:''},
 'sel-iscrivi-corsista':{innerHTML:''}};
 const document={activeElement:opener,getElementById:id=>nodes[id]||null};
 const window={progettiList:[{id:'p1',codice:'TEST',azienda_id:'a1',aziende:{ragione_sociale:'Prova'}}],
 corsistiList:[{id:'c1',nome_cognome:'Corsista prova',cf:'CFTEST',azienda_id:'a1'}],
 getCorsisti:async()=>{reads++;return[]},loadIscrittiTable:async()=>{reads++}};
 vm.runInNewContext(util.slice(s,e),{window,document,alert:msg=>errors.push(msg)});
 const result=await window.apriIscrizioni('p1');
 assert.equal(result,true);assert.equal(window.currentProgettoId,'p1');assert.ok(classes.has('flex'));
 assert.match(nodes['sel-iscrivi-corsista'].innerHTML,/Corsista prova/);
 assert.equal(reads,1);assert.equal(focusClose,1);assert.equal(errors.length,0);
 window.chiudiPannelloIscrizioni();
 assert.ok(classes.has('hidden'));assert.equal(window.currentProgettoId,null);assert.equal(focusRestored,1);
 const missing=await window.apriIscrizioni('unknown');assert.equal(missing,false);assert.ok(classes.has('hidden'));
 assert.equal(errors.length,1);
});
test('Cache PWA aggiornata e caricamenti script allineati',()=>{
 assert.match(sw,/safetymanager-pwa-v19/);
 assert.ok(index.includes('utils.js?v=20261028-g8-status'));
 assert.ok(index.includes('app.js?v=20261028-g8-status'));
 assert.ok(index.includes('iscrizioni_rettifica.js?v=20261028-g8-status'));
 assert.ok(app.includes('progetti_corsisti_refinement.js?v=20261028-g8-status'));
 assert.match(app,/if \(moduleId === 'progetti'\) \{[\s\S]*?loadOptionalSafetyScript\('js\/modules\/progetti_corsisti_refinement\.js\?v=20261028-g8-status'\)/);
 assert.ok(sw.includes('progetti_corsisti_refinement.js?v=20261028-g8-status'));
});
