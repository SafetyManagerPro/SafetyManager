'use strict';
// Fase 1 audit UX (9 novembre 2026): barre di navigazione, avviso modulo, tasto Esc, intestazione checklist.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=f=>fs.readFileSync(path.resolve(__dirname,'..',f),'utf8');
const nav=read('js/modules/navigation_system.js');
const ui=read('js/modules/ui_refinements.js');
const checklist=read('js/modules/checklist_corso.js');

test('Popup: Indietro/Avanti entrano nell\'intestazione accanto alla X originale',()=>{
 assert.match(nav,/function headerCloseButton\(overlay\)/);
 assert.match(nav,/safety-popup-nav-inline/);
 assert.match(nav,/group\.appendChild\(native\)/,'la X originale resta il pulsante di chiusura');
 // La barra flottante resta solo come ripiego e il popup le lascia spazio sopra.
 assert.match(nav,/\.safety-popup-floating-nav\{padding-top:60px!important;overflow-y:auto!important\}/);
});

test('Pagina: Indietro/Avanti dentro la barra Dashboard/sezione, senza X doppia',()=>{
 assert.match(nav,/function placeInToolbar\(nav,slot\)/);
 assert.match(nav,/\[data-safety-nav="close"\]'\)\?\.remove\(\)/);
 assert.match(nav,/root\.parentElement\.insertBefore\(nav,root\)/,'mai dentro un layout a colonne');
 assert.match(nav,/n\.hidden=!\[\.\.\.n\.querySelectorAll\('button'\)\]\.some\(b=>!b\.disabled\)/,'barra autonoma vuota nascosta');
 assert.match(ui,/window\.SafetyNavigation\.decorate\(\)/);
 assert.match(ui,/!el\.classList\.contains\('safety-page-nav'\)/,'la barra non e\' la radice del modulo');
});

test('Scorciatoie senza Dashboard ripetuta e nessun avviso "Modulo caricato"',()=>{
 const quick=ui.slice(ui.indexOf('const QUICK_ACTIONS'),ui.indexOf('const findModuleRoot'));
 assert.ok(quick.length>100);
 assert.doesNotMatch(quick,/'admin','Dashboard'/);
 assert.doesNotMatch(ui,/title: 'Modulo caricato'/);
});

test('Tasto Esc senza selettore non valido',()=>{
 assert.doesNotMatch(ui,/\.fixed\.inset-0\.z-\\\[99999\\\]/);
});

test('Intestazione Checklist corso troncata dentro il popup',()=>{
 assert.match(checklist,/text-white flex justify-between gap-4"><div class="min-w-0 flex-1">/);
});
