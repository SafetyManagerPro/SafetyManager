'use strict';
// Condividi PDF (9 novembre 2026): PDF creato nel browser dalle stesse pagine della stampa.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=f=>fs.readFileSync(path.resolve(__dirname,'..',f),'utf8');
const source=read('js/modules/condividi_pdf.js');
const app=read('js/app.js');

test('Intercetta una sola stampa e ripristina sempre window.print',()=>{
 assert.match(source,/const originalPrint=window\.print;/);
 assert.match(source,/captured=true;clearTimeout\(timer\);window\.print=originalPrint;/);
 assert.match(source,/const timer=setTimeout\(restore,20000\)/);
 assert.match(source,/catch\(e\)\{clearTimeout\(timer\);window\.print=originalPrint;busy=false;throw e;\}/);
});

test('Una pagina del documento = una pagina del PDF, senza contenitore fuori schermo',()=>{
 assert.match(source,/worker=worker\.get\('pdf'\)\.then\(pdf=>\{pdf\.addPage\('a4'/);
 assert.doesNotMatch(source,/z-index:-99999/);
 assert.match(source,/h=landscape\?'209mm':'296mm'/);
});

test('Condivisione: menu del dispositivo dopo un nuovo clic; email e WhatsApp Web come alternativa',()=>{
 assert.match(source,/navigator\.canShare\(\{files:\[file\]\}\)/);
 assert.match(source,/await navigator\.share\(\{files:\[file\],title:subject,text\}\)/);
 assert.match(source,/mailto:\?subject=/);
 assert.match(source,/https:\/\/wa\.me\/\?text=/);
});

test('Nessun invio a server e nessun salvataggio',()=>{
 assert.doesNotMatch(source,/supabaseClient|fetch\(|XMLHttpRequest|localStorage|\.insert\(|\.upload\(/);
 assert.match(source,/integrity=SRI/);
});

test('Pulsanti nel Centro Stampe e caricamento solo nella sezione Stampe',()=>{
 assert.match(source,/id='safety-share-current'/);
 assert.match(source,/id='safety-share-free'/);
 assert.match(app,/if \(moduleId === 'stampe'\) \{\s*\/\/[^\n]*\n\s*void window\.loadOptionalSafetyScript\('js\/modules\/condividi_pdf\.js'\);/);
});
