'use strict';
// Fase 2 audit (9 novembre 2026): una sola percentuale di completamento, dal registro Step 67.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=f=>fs.readFileSync(path.resolve(__dirname,'..',f),'utf8');
const prepara=read('js/modules/prepara_corso.js');
const utils=read('js/utils.js');
const step67=read('js/modules/step67_chiusura_intelligente.js');
const dashboard=read('js/modules/dashboard_pro.js');
const suite=read('js/modules/professional_suite.js');

test('Preparazione corsi passa gli stati Step 67 come la Checklist',()=>{
 assert.match(prepara,/buildSafetyCourseChecklist\(p, iscritti \|\| \[\], step67\)/);
 assert.match(prepara,/buildSafetyCourseChecklist\(p, iscritti, states\[p\.id\] \|\| null\)/);
 assert.match(prepara,/SafetyStep67\.evaluateProjects\(projects, map\)/);
 // Se il registro non risponde si torna al calcolo precedente, senza bloccare la finestra.
 assert.match(prepara,/catch \(e\) \{ console\.warn\('Prepara corso: registro Step 67 non disponibile\.', e\); return null; \}/);
});

test('Cruscotto qualità: percentuale principale dal registro Step 67, letta in un\'unica richiesta',()=>{
 assert.match(utils,/window\.queueQualityStep67Percent = function\(p, iscritti\)/);
 assert.match(utils,/SafetyStep67\.evaluateProjects\(batch\.map\(b => b\.p\)/);
 assert.match(utils,/data-quality-step67="\$\{projectId\}"/);
 assert.match(utils,/data-quality-step67-bar="\$\{projectId\}"/);
 assert.doesNotMatch(utils,/avanzamento \$\{summary\.percent\}%/,'niente piu\' percentuale per aree come numero principale');
 assert.match(step67,/window\.__qualityStep67Cache\?\.clear\?\.\(\)/,'dopo un salvataggio il Cruscotto rilegge');
});

test('Etichette di stato uniche',()=>{
 for(const old of ["'Pronto stampa'","'Pronto per stampe'","'Pronti archivio'","'Pronto archiviazione'","'Pronto per archiviazione'"]) assert.ok(!dashboard.includes(old),old);
 assert.match(dashboard,/Pronto per le stampe/);
 assert.match(dashboard,/Pronto per l\\'archivio/);
});

test('Popup ricostruiti ricevono di nuovo Indietro/Avanti',()=>{
 assert.match(suite,/mutation\.addedNodes\.length&&parent\?\.matches\?\.\(POPUP_SELECTOR\)/);
});
