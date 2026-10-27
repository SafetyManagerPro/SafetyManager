'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const src = fs.readFileSync(path.resolve(__dirname, '../js/modules/stampe_bundle.js'), 'utf8');
const start = src.indexOf('window.stampaFascicoloCompletoPDF = async function');
const end = src.indexOf('// ==========================================\n// BACKUP LOCALE DATABASE', start);
assert.ok(start >= 0 && end > start, 'Funzione PDF unico isolabile senza caricare la UI');

async function scenario(failure) {
  const scheduled = [];
  const alerts = [];
  const errors = [];
  const tokens = new Set();
  let printAttempts = 0;
  const area = { innerHTML: '', dataset: {}, appendChild() {} };
  const document = {
    getElementById(id) {
      if (id === 'print-area-temp') return area;
      return null;
    },
    body: {
      classList: {
        add(value) { tokens.add(value); },
        remove(value) { tokens.delete(value); }
      }
    }
  };
  const window = {
    currentSessionCorsisti: [],
    AppState: {},
    caricaDatiStampa: async () => {},
    renderPrintModuleToTemp: async () => [],
    renderManualTestsForCurrentPrintProject: () => [],
    waitForPrintImages: async () => {
      if (failure === 'images') throw Error('Immagini non pronte');
      return true;
    },
    print() {
      printAttempts++;
      if (failure === 'print') throw Error('Finestra stampa non disponibile');
    }
  };
  vm.runInNewContext(src.slice(start, end), {
    window,
    document,
    alert: (message) => alerts.push(String(message)),
    console: { info() {}, warn() {}, error: (message) => errors.push(String(message)) },
    setTimeout: (callback) => { scheduled.push(callback); }
  }, { filename: 'stampe_bundle.js:pdf-unico' });
  await window.stampaFascicoloCompletoPDF('test-project-id');
  assert.equal(scheduled.length, 1, 'Una sola stampa programmata');
  assert.equal(tokens.has('is-printing-temp'), true, 'Modalità stampa prima della callback');
  area.innerHTML = '<p>contenuto preparato</p>';
  await scheduled[0]();
  return { area, tokens, alerts, errors, printAttempts };
}

test('PDF unico: preparazione corretta esegue print e ripulisce area e CSS', async () => {
  const state = await scenario(null);
  assert.equal(state.printAttempts, 1);
  assert.equal(state.tokens.has('is-printing-temp'), false);
  assert.equal(state.area.innerHTML, '');
});

test('PDF unico: immagini non pronte non lasciano il layout bloccato', async () => {
  const state = await scenario('images');
  assert.equal(state.printAttempts, 0);
  assert.equal(state.tokens.has('is-printing-temp'), false);
  assert.equal(state.area.innerHTML, '');
  assert.ok(state.alerts.some(x => /Non è stato possibile aprire la stampa/.test(x)));
});

test('PDF unico: errore da window.print pulisce DOM e segnala problema', async () => {
  const state = await scenario('print');
  assert.equal(state.printAttempts, 1);
  assert.equal(state.tokens.has('is-printing-temp'), false);
  assert.equal(state.area.innerHTML, '');
  assert.ok(state.errors.some(x => /Errore durante la stampa/.test(x)));
});
