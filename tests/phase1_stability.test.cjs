'use strict';
// SafetyManager Pro — regressioni della fase 1, solo letture e simulazioni locali.
// Non accede a Supabase, non usa credenziali e non modifica dati di produzione.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const utils = read('js/utils.js');
const app = read('js/app.js');

test('i file essenziali sono JavaScript valido', () => {
  [
    'js/app.js',
    'js/utils.js',
    'js/supabase_config.js',
    'js/modules/corsisti_ruolo_azienda.js',
    'js/modules/progetti_corsisti_refinement.js',
    'js/modules/responsive_table_performance.js',
    'js/modules/corsisti_fascicolo_archivio.js',
    'js/modules/corsisti_autoarchivia_stampe.js'
  ].forEach(file => assert.doesNotThrow(() => new vm.Script(read(file), { filename: file })));
});

test('timeout della lettura: successo rapido e risposta troppo lenta', async () => {
  const from = utils.indexOf('window.safetyReadWithDeadline=function(');
  const to = utils.indexOf('window.safetyLoadStats=', from);
  assert.ok(from >= 0 && to > from, 'helper per il timeout presente');
  const sandbox = {window:{}, Promise, setTimeout, clearTimeout, Math, Error};
  vm.runInNewContext(utils.slice(from,to),sandbox);
  assert.equal(await sandbox.window.safetyReadWithDeadline(Promise.resolve('ok'),25,'Test'),'ok');
  let caught;
  try {
    await sandbox.window.safetyReadWithDeadline(new Promise(()=>{}),12,'Test');
  } catch (error) { caught = error; }
  assert.equal(caught?.code,'SAFETY_READ_TIMEOUT');
  assert.match(caught.message,/non ha risposto/);
});

test('su desktop le card non serializzano le righe DOM', () => {
  const from = utils.indexOf('window.syncResponsiveTableCards = function(table)');
  const to = utils.indexOf('window.__safetyResponsiveScheduledTables =',from);
  assert.ok(from >= 0 && to > from, 'funzione responsive isolabile');
  const table = {
    dataset: {},
    tBodies:[{get innerHTML(){throw Error('Lettura pesante non consentita sul desktop');}}],
  };
  const sandbox = {window:{matchMedia:()=>({matches:false})}, document:{}};
  vm.runInNewContext(utils.slice(from,to),sandbox);
  assert.doesNotThrow(()=>sandbox.window.syncResponsiveTableCards(table));
  assert.equal(table.dataset.responsiveCardsDirty,'1');
});

test('l osservatore globale delle card non segue ogni modifica interna', () => {
  const from = utils.indexOf('window.bindResponsiveTableCards = function(root = document)');
  const to = utils.indexOf('window.dashEscape = function(value)',from);
  assert.ok(from >= 0 && to > from, 'binding responsive presente');
  const snippet = utils.slice(from,to);
  assert.match(snippet,/observe\(responsiveRoot,\{childList:true\}\)/);
  assert.match(snippet,/window\.scheduleSafetyResponsiveCards/);
  assert.doesNotMatch(snippet,/observe\(responsiveRoot,\{childList:true,subtree:true\}\)/);
});

test('corsisti: query DB paginata e gestione timeout/errore recuperabile', () => {
  const from=utils.indexOf('window.loadCorsistiTable = async function()');
  const to=utils.indexOf('window.salvaCorsistaDB = async function()',from);
  const snippet=utils.slice(from,to);
  assert.match(snippet,/range\(\(page-1\)\*pageSize,page\*pageSize-1\)/);
  assert.match(snippet,/count:'exact'/);
  assert.match(snippet,/requestId!==paging\.requestId/);
  assert.match(snippet,/await bounded\(buildPageQuery/);
  assert.match(snippet,/window\.safetyReadWithDeadline/);
  assert.match(snippet,/Riprova caricamento/);
  assert.match(snippet,/window\.renderSafetyDirectoryAlphabet/);
});

test('aziende: ricerca globale paginata e Riprova', () => {
  const from=utils.indexOf('window.loadAziendeTable=async function()');
  const to=utils.indexOf('window.salvaAziendaDB = async function()',from);
  const snippet=utils.slice(from,to);
  assert.match(snippet,/select\('\*',\{count:'exact'\}\)/);
  assert.match(snippet,/range\(\(st\.page-1\)\*st\.pageSize,st\.page\*st\.pageSize-1\)/);
  assert.match(snippet,/st\.requestId/);
  assert.match(snippet,/Riprova/);
});

test('navigazione: evita risposte obsolete e offre il retry dei moduli', () => {
  assert.match(app,/const navigationId=\+\+window\.__safetyNavigationId/);
  assert.match(app,/if\(!isCurrent\(\)\)return/);
  assert.match(app,/new AbortController\(\)/);
  assert.match(app,/safety-module-retry/);
  assert.match(app,/script\.onerror = \(\) => finish\(false\)/);
});

test('nessun blocco alle stampe libere, fascicolo sempre separato', () => {
  assert.match(read('js/modules/progetti_corsisti_refinement.js'),/apriStampeLibereCorsista/);
  assert.match(read('js/modules/corsisti_fascicolo_archivio.js'),/archiveGenerated/);
  assert.match(read('js/modules/corsisti_autoarchivia_stampe.js'),/const enabled=\(\)=>/);
});
