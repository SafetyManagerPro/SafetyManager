const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const window = {
  DB_CORSI: { corso_test: { t: 'Corso test', scad: 5 } },
  dashEscape: value => String(value ?? '')
};
window.window = window;

const context = vm.createContext({ window, console, Date, Set, Map, Promise });
const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'modules', 'step67_chiusura_intelligente.js'), 'utf8');
vm.runInContext(source, context, { filename: 'step67_chiusura_intelligente.js' });

const project = {
  id: 'project-1',
  codice: 'TEST-001',
  corso_id: 'corso_test',
  azienda_id: 'company-1',
  data_inizio: '2020-01-01',
  data_esame: '2020-01-02',
  sede: 'Aula test',
  resp_progetto: 'Responsabile',
  resp_corso: 'Responsabile corso',
  docente_principale: 'Docente',
  stato_corso: 'svolto',
  gradimento_stato: 'elaborato'
};
const enrollment = {
  id: 'enrollment-1',
  percentuale_frequenza: 100,
  esito: 'Idoneo',
  voto_test: null,
  note_verifica: null,
  id_certificato: 'CERT-001',
  data_scadenza: '2025-01-02',
  corsisti: { nome_cognome: 'Mario Rossi', cf: 'RSSMRA00A00A000A', lingua_test_stato: 'non_richiesto' }
};

const paperState = window.SafetyStep67.evaluateCourse(project, [enrollment], {
  completionItems: [{
    progetto_id: project.id,
    iscrizione_id: enrollment.id,
    item_key: 'final_test',
    mode: 'paper',
    activity_status: 'completed',
    recording_status: 'recorded',
    evidence_status: 'paper_original'
  }],
  effectivenessChecks: [{ status: 'not_applicable' }]
});

assert.equal(paperState.statoDidattico, 'concluso');
assert.equal(paperState.statoCorsoLegacy, 'svolto');
assert.ok(paperState.daAcquisire.some(item => item.itemKey === 'final_test'));
assert.ok(!paperState.errori.some(item => item.itemKey === 'final_test'));
assert.ok(!paperState.daCompletare.some(item => item.itemKey === 'final_test'));

const unknownPaperState = window.SafetyStep67.evaluateCourse(project, [enrollment], {
  completionItems: [],
  effectivenessChecks: [{ status: 'scheduled', scheduled_for: '2020-02-01' }]
});
const pendingTest = unknownPaperState.daCompletare.find(item => item.itemKey === 'final_test');
assert.ok(pendingTest, 'Il test senza registrazione deve essere da completare');
assert.match(pendingTest.detail, /confermare|registrare/i);
assert.doesNotMatch(pendingTest.detail, /non svolto/i);
assert.equal(unknownPaperState.postFormazione.key, 'overdue');

const inconsistent = window.SafetyStep67.evaluateCourse(project, [enrollment], {
  completionItems: [{
    progetto_id: project.id,
    iscrizione_id: enrollment.id,
    item_key: 'final_test',
    mode: 'paper',
    activity_status: 'pending',
    recording_status: 'recorded',
    evidence_status: 'none'
  }],
  effectivenessChecks: [{ status: 'not_applicable' }]
});
assert.ok(inconsistent.errori.some(item => item.itemKey === 'final_test'));

console.log('Step 67 completion engine: 10 assertions passed.');
