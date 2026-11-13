'use strict';
// QR di verifica online sul retro degli attestati (13 novembre 2026).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const read = f => fs.readFileSync(path.resolve(__dirname, '..', f), 'utf8');
const qrSource = read('js/modules/attestato_qr.js');
const template = read('modules/attestato.html');
const sql = read('supabase/migrations/20261113110000_attestati_verifica_online.sql');
const page = read('verifica.html');

function load(origin) {
    const window = { location: { origin } };
    vm.runInNewContext(read('js/vendor/qrcode-generator-1.4.4.js') + '\nwindow.qrcode = qrcode;', { window });
    vm.runInNewContext(qrSource, { window });
    return window;
}

test('Link di verifica: solo con codice uuid valido, dominio pubblico dell\'app', () => {
    const w = load('http://localhost:8765');
    const t = 'e0000000-0000-4000-8000-000000000003';
    assert.equal(w.getAttestatoVerifyUrl(t), `https://safety-manager-ultimate.vercel.app/verifica.html?t=${t}`);
    assert.equal(w.getAttestatoVerifyUrl(t.toUpperCase()), `https://safety-manager-ultimate.vercel.app/verifica.html?t=${t}`);
    assert.equal(w.getAttestatoVerifyUrl(''), '');
    assert.equal(w.getAttestatoVerifyUrl('CERT-4'), '');
    assert.match(load('https://altro-dominio.example').getAttestatoVerifyUrl(t), /^https:\/\/altro-dominio\.example\/verifica\.html\?t=/);
});

test('QR generato in SVG scalabile con margine bianco', () => {
    const w = load('https://safety-manager-ultimate.vercel.app');
    const svg = w.buildAttestatoQrSvg(w.getAttestatoVerifyUrl('e0000000-0000-4000-8000-000000000003'));
    assert.match(svg, /^<svg /);
    assert.doesNotMatch(svg, / width="\d+px"/);
    assert.match(qrSource, /createSvgTag\(\{ cellSize: 4, margin: 8, scalable: true \}\)/);
    assert.equal(w.buildAttestatoQrSvg(''), '');
});

test('Attestato: QR solo sul retro, sovrapposto (position:absolute), nascosto finché non c\'è il codice', () => {
    const front = template.slice(0, template.indexOf('<!-- RETRO'));
    const retro = template.slice(template.indexOf('<!-- RETRO'));
    assert.doesNotMatch(front, /data-attestato-qr/);
    assert.equal((retro.match(/data-attestato-qr/g) || []).length, 1);
    assert.match(retro, /<div data-attestato-qr style="display:none; position:absolute; right:4mm; bottom:17mm;/);
    assert.match(retro, /Verifica online<br>dell'attestato/);
});

test('Compilazione: QR per ogni corsista, mai sulle bozze; codice di verifica nella sessione di stampa', () => {
    const utils = read('js/utils.js');
    assert.match(utils, /if \(typeof window\.renderAttestatoVerificaQr === 'function'\) window\.renderAttestatoVerificaQr\(c1\);/);
    assert.match(utils, /if \(attestatoDraft\) clone\.querySelectorAll\('\[data-attestato-qr\]'\)\.forEach\(el => el\.remove\(\)\);/);
    assert.match(utils, /verifica_token: isc\.verifica_token \|\| null,/);
    assert.match(read('js/digital.js'), /verifica_token:isc\.verifica_token\|\|null/);
    const index = read('index.html');
    assert.ok(index.indexOf('js/vendor/qrcode-generator-1.4.4.js') < index.indexOf('js/modules/attestato_qr.js'));
});

test('Database: codice casuale, funzione di sola lettura per utenti non autenticati, stesse regole della stampa', () => {
    assert.match(sql, /add column if not exists verifica_token uuid not null default gen_random_uuid\(\)/);
    assert.match(sql, /create unique index if not exists iscrizioni_verifica_token_key/);
    assert.match(sql, /security definer\s+set search_path = public, pg_temp/);
    assert.match(sql, /revoke all on function public\.safety_verifica_attestato\(uuid, text, text\) from public;/);
    assert.match(sql, /grant execute on function public\.safety_verifica_attestato\(uuid, text, text\) to anon, authenticated;/);
    // stessa regola di renderPrintModulePages per distinguere attestato e bozza
    assert.match(sql, /\^\(idone\[oa\]\|superat\[oa\]\|positiv\[oa\]\|abilitat\[oa\]\)\$/);
    assert.match(read('js/utils.js'), /\/\^\(idone\[oa\]\|superat\[oa\]\|positiv\[oa\]\|abilitat\[oa\]\)\$\//);
    // nessun dato personale per attestati non validi; nessun ente formatore
    assert.match(sql, /return jsonb_build_object\('trovato', true, 'valido', false\);/);
    assert.doesNotMatch(sql, /'ente|erogatore/);
    for (const k of ['nome', 'cf', 'nascita', 'azienda', 'corso_id', 'data_emissione', 'data_scadenza']) assert.match(sql, new RegExp(`'${k}', r\\.|'${k}', left\\(`), k);
    // verifica manuale: servono ID certificato e codice fiscale insieme
    assert.match(sql, /nullif\(btrim\(p_id_certificato\), ''\) is null or nullif\(btrim\(p_cf\), ''\) is null/);
});

test('Pagina pubblica di verifica: stessa configurazione dell\'app, non indicizzata, fuori dalla cache offline', () => {
    const cfg = read('js/supabase_config.js');
    const key = cfg.match(/localStorage\.getItem\('SAFETY_SUPABASE_ANON_KEY'\) \|\|\s*'([^']+)'/)[1];
    assert.ok(page.includes(`'${key}'`));
    assert.ok(page.includes("'https://gblcedkfnasqlnrxupzx.supabase.co'"));
    assert.match(page, /<meta name="robots" content="noindex, nofollow">/);
    assert.match(page, /\/rest\/v1\/rpc\/safety_verifica_attestato/);
    assert.match(page, /\['Azienda di appartenenza', d\.azienda\]/);
    assert.doesNotMatch(page, /erogatore|Ente formatore/i);
    assert.match(read('sw.js'), /if\(url\.pathname==='\/verifica\.html'\) return;/);
});
