'use strict';
// Fase 3 audit (9 novembre 2026): menu su una riga da 1280 px, menu a tendina sotto.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=f=>fs.readFileSync(path.resolve(__dirname,'..',f),'utf8');
const index=read('index.html');
const g6=read('js/modules/graphic_upgrade_g6_mobile.js');
const ui=read('js/modules/ui_refinements.js');

test('Da 1280 px: una riga, niente a capo, strumenti tecnici fuori dalla barra',()=>{
 const desk=index.slice(index.indexOf('@media (min-width: 1280px) {'));
 assert.ok(desk.length>0);
 assert.match(desk,/#top-nav-inner \{[^}]*flex-wrap: nowrap !important/);
 assert.match(desk,/#top-nav-buttons \{[^}]*flex-wrap: nowrap !important/);
 assert.match(desk,/#top-nav #top-nav-buttons > #nav-migrazione,\s*#top-nav #top-nav-buttons > #nav-collaudo/);
 assert.match(index,/#top-nav #top-nav-buttons > #nav-procedure \{ display: none !important; \}/);
 assert.match(index,/@media \(max-width: 1279px\) \{/);
 assert.doesNotMatch(index,/@media \(max-width: 1280px\)/);
});

test('Sotto i 1280 px menu a tendina con i nomi; regole di pagina ancora a 768 px',()=>{
 assert.match(g6,/'@media\(max-width:1279px\)\{',\n ' #top-nav\.safety-g6-nav #top-nav-inner/);
 assert.match(g6,/matchMedia\('\(max-width: 1279px\)'\)/);
 const phone=g6.slice(g6.indexOf("'@media(max-width:768px){'"));
 assert.match(phone,/#scadenze-stats-grid/);
 assert.doesNotMatch(phone.slice(0,phone.indexOf("'}'")),/#top-nav/,'le regole del menu non stanno piu\' nel blocco telefoni');
});

test('Collaudo raggiungibile dalle scorciatoie di Impostazioni',()=>{
 assert.ok(ui.includes("ente: [ ['stampe','Stampe','printer'], ['migrazione','Backup','database'], ['collaudo','Collaudo','shield-check'] ],"));
});
