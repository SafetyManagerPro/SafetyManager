'use strict';
// Finestra documenti azienda/persona: Stampa e Condividi PDF direttamente (9 novembre 2026).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const read = f => fs.readFileSync(path.resolve(__dirname, '..', f), 'utf8');
const ui = read('js/modules/documenti_azienda_lavoratore_ui.js');

test('La finestra ha Genera anteprima, Stampa e Condividi PDF', () => {
    assert.match(ui, /onclick="window\.generateSafetyCompanyDoc\(\)"[^>]*>Genera anteprima</);
    assert.match(ui, /data-scd-action="print" onclick="window\.scdGenerateAnd\('print'\)"[^>]*>Stampa</);
    assert.match(ui, /data-scd-action="share" onclick="window\.scdGenerateAnd\('share'\)"[^>]*>Condividi PDF</);
});

test('Stampa/condivide solo se l\'anteprima e stata generata (finestra chiusa e pagine pronte)', () => {
    assert.match(ui, /await window\.generateSafetyCompanyDoc\(\);/);
    assert.match(ui, /const ready=\(!m\|\|m\.classList\.contains\('hidden'\)\)&&D\.types\.has\(window\.currentPrintModule\)&&document\.querySelector\('#print-preview-container \.safety-company-doc-page'\);/);
    assert.match(ui, /if\(!ready\)return;/);
    assert.match(ui, /return window\.condividiDocumentoVisualizzato\(\);/);
    assert.match(ui, /return window\.stampaSezioneAttuale\?\.\(\);/);
});

test('Nessun messaggio rimanda al pulsante inesistente "Esegui Stampa"', () => {
    for (const f of ['js/modules/documenti_azienda_lavoratore_catalogo.js', 'js/modules/documenti_azienda_lavoratore_print.js']) {
        assert.doesNotMatch(read(f), /Esegui Stampa/, f);
    }
});
