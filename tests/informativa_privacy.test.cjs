'use strict';
// Informativa privacy art. 13 GDPR + foglio unico di presa visione (9 novembre 2026).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const read = f => fs.readFileSync(path.resolve(__dirname, '..', f), 'utf8');
const source = read('js/modules/informativa_privacy.js');
const template = read('modules/informativa_privacy.html');

function load(state, ente = {}) {
    const window = {
        AppState: state,
        getVal: id => state[id] || '',
        getEnte: async () => ente,
        isCnaName: v => /CNA/i.test(String(v || '')),
        CNA_AVELLINO_PRESET: { ragione_sociale: 'CNA Preset', indirizzo: 'Via Preset 1', piva_cf: 'P.IVA PRESET', contatti: 'tel. preset' }
    };
    vm.runInNewContext(source, { window, console });
    return window;
}

test('Modello: informativa art. 13 con i 10 punti e foglio unico di presa visione', () => {
    assert.match(template, /data-privacy-info-page="1"/);
    assert.match(template, /data-privacy-ack-page="1"/);
    assert.match(template, /art\. 13 del Regolamento \(UE\) 2016\/679/);
    for (let n = 1; n <= 10; n++) assert.match(template, new RegExp(`<strong>${n}\\. `), `punto ${n}`);
    assert.match(template, /artt\. 15-22 GDPR/);
    assert.match(template, /www\.garanteprivacy\.it/);
    assert.match(template, /almeno 10 anni/);
    assert.match(template, /class="privacy-ack-rows"/);
    // pagine verticali: mai ruotate come i registri
    assert.equal((template.match(/data-safety-portrait="1"/g) || []).length, 2);
    // nessuna classe Tailwind con valore arbitrario: le dimensioni sono inline
    assert.doesNotMatch(template, /\w-\[[^\]]+\]/);
});

test('Titolare = ente erogatore (dati ente, preset CNA come riserva)', async () => {
    const w = load({ 'cfg-ente': 'CNA Avellino', 'cfg-ente-indirizzo': 'Via Soldi 11', 'cfg-ente-contatti': 'pec@cna' }, { piva_cf: 'P.IVA 123' });
    const c = await w.getPrivacyController();
    assert.equal(c.tipo, 'ente');
    assert.equal(c.nome, 'CNA Avellino');
    assert.equal(c.sede, 'Via Soldi 11');
    assert.equal(c.ids, 'P.IVA 123');
    assert.equal(c.contatti, 'pec@cna');
    const w2 = load({ 'cfg-ente': 'CNA Avellino' }, {});
    const c2 = await w2.getPrivacyController();
    assert.equal(c2.sede, 'Via Preset 1');
    assert.equal(c2.ids, 'P.IVA PRESET');
});

test('Titolare = azienda quando il datore di lavoro e soggetto formatore', async () => {
    const w = load({ 'cfg-ente-erogatore': 'azienda', 'cfg-azienda': 'Alfa Srl', 'cfg-azienda-indirizzo': 'Via Roma 1', 'cfg-azienda-piva': '0123' });
    const c = await w.getPrivacyController();
    assert.equal(c.tipo, 'azienda');
    assert.equal(c.nome, 'Alfa Srl');
    assert.equal(c.ids, 'P.IVA/C.F. 0123');
    assert.match(c.contatti, /^_+$/);
});

test('Foglio unico: 20 righe per pagina, nessuna firma o data precompilata', () => {
    assert.match(source, /const ROWS_PER_PAGE = 20;/);
    assert.match(source, /Math\.ceil\(session\.length \/ ROWS_PER_PAGE\)/);
    assert.match(source, /'<td class="border border-slate-800 px-1">&nbsp;<\/td>' \+\n\s+'<td class="border border-slate-800 px-1">&nbsp;<\/td>'/);
});

test('Allegata al fascicolo, nel pacchetto corso e nel Centro Stampe; corsi e database intatti', () => {
    const utils = read('js/utils.js');
    assert.match(utils, /moduleId === 'informativa_privacy' && typeof window\.expandPrivacyPages === 'function'/);
    assert.match(utils, /moduleId === 'fascicolo_corso' &&\s+options\.includePrivacyAnnexes !== false/);
    assert.match(utils, /modulo === 'informativa_privacy'\) &&/);
    assert.match(read('js/modules/pacchetto_corso.js'), /await addModule\('informativa_privacy'\);\n\s+await addModule\('registro'\);/);
    assert.match(read('modules/stampe.html'), /stampaDocumentoCentroStampe\('informativa_privacy'\)/);
    assert.match(read('index.html'), /<script src="js\/modules\/informativa_privacy\.js"><\/script>/);
    assert.match(read('js/modules/firme_unificate.js'), /page\?\.dataset\?\.safetyPortrait === '1'\) return false;/);
    assert.doesNotMatch(source, /supabaseClient|\.insert\(|\.upsert\(|\.update\(|\.delete\(/);
});
