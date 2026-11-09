/* SafetyManager — Condividi PDF (9/11/2026).
   Crea il PDF delle stesse pagine che verrebbero stampate e lo condivide (WhatsApp, email, altre app)
   con il menu di condivisione del dispositivo; sul computer, se il menu non c'e', scarica il PDF e apre
   email o WhatsApp Web con un messaggio pronto. Il PDF viene creato nel browser: nessun invio a server,
   nessuna copia salvata. Funziona con qualsiasi stampa: intercetta UNA SOLA chiamata a window.print()
   avviata dal pulsante Condividi e la sostituisce con la creazione del PDF. */
(function(){
'use strict';
if(window.__safetySharePdfLoaded) return;
window.__safetySharePdfLoaded=true;

const LIBRARY='https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
const SRI='sha512-GsLlZN/3F2ErC5ifS5QtgpiJtWd43JWSuIgh7mbzZ8zBps+dvLusV+eNQATqgA/HdeKFVgA5v3S/cIrLF7QnIg==';
const PAGE_SELECTOR='.doc-page,.safety-company-doc-page';
let libraryPromise=null, busy=false;

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function library(){
  if(window.html2pdf) return Promise.resolve(window.html2pdf);
  if(libraryPromise) return libraryPromise;
  libraryPromise=new Promise((resolve,reject)=>{
    const tag=document.createElement('script');
    tag.src=LIBRARY;tag.crossOrigin='anonymous';tag.referrerPolicy='no-referrer';tag.integrity=SRI;
    tag.onload=()=>window.html2pdf?resolve(window.html2pdf):reject(Error('Convertitore PDF non disponibile.'));
    tag.onerror=()=>reject(Error('Impossibile caricare il convertitore PDF: controlla la connessione.'));
    document.head.appendChild(tag);
  }).catch(err=>{libraryPromise=null;throw err;});
  return libraryPromise;
}

function ensureStyle(){
  if(document.getElementById('safety-share-style')) return;
  const s=document.createElement('style');s.id='safety-share-style';
  // Il contenitore NON va posizionato fuori schermo: html2pdf ne crea una copia propria e la renderebbe vuota.
  s.textContent='@media print{#safety-share-dialog{display:none!important}}'+
    '.safety-share-staging{background:#fff}'+
    '.safety-share-staging .doc-page,.safety-share-staging .safety-company-doc-page{box-shadow:none!important;transform:none!important;margin:0!important;display:block!important;background:#fff!important}';
  document.head.appendChild(s);
}

// Copia sincrona delle pagine PRIMA che la funzione di stampa svuoti l'area.
function snapshot(area){
  const pages=[...area.querySelectorAll(PAGE_SELECTOR)].filter(p=>!p.parentElement?.closest(PAGE_SELECTOR));
  if(!pages.length) throw Error('Nessuna pagina pronta da condividere.');
  const landscape=pages.every(p=>p.classList.contains('landscape')||p.classList.contains('landscape-force'));
  // Altezza appena sotto il foglio: con l'arrotondamento mm/px una pagina alta 297 mm ne genererebbe due.
  const w=landscape?'297mm':'210mm', h=landscape?'209mm':'296mm';
  const text=p=>(p.querySelector('h1')?.textContent||'').replace(/\s+/g,' ').trim();
  const titles=new Set(pages.map(text));
  const people=new Set(pages.map(p=>((p.innerText.match(/Lavoratore:\s*([^\n—]+)/)||[])[1]||'').trim()));
  const company=(pages[0].querySelector('[style*="font-weight:800"]')?.textContent||'').replace(/\s+/g,' ').trim();
  // Una pagina = un contenitore: ogni pagina diventa esattamente una pagina del PDF.
  const holders=pages.map(page=>{
    const clone=page.cloneNode(true);
    clone.removeAttribute('id');clone.classList.remove('hidden','scale-[0.8]','origin-top');clone.classList.add('print-show');
    const src=[...page.querySelectorAll('canvas')],dst=[...clone.querySelectorAll('canvas')];
    src.forEach((canvas,i)=>{const t=dst[i];if(!t)return;const img=document.createElement('img');img.src=canvas.toDataURL('image/png');img.style.cssText='width:'+canvas.clientWidth+'px;height:'+canvas.clientHeight+'px;max-width:100%';t.replaceWith(img);});
    Object.assign(clone.style,{width:w,minHeight:h,height:h,maxHeight:h,overflow:'hidden',boxSizing:'border-box',pageBreakAfter:'auto',breakAfter:'auto'});
    const holder=document.createElement('div');holder.className='safety-share-staging';holder.style.width=w;holder.appendChild(clone);
    return holder;
  });
  return {holders,landscape,count:pages.length,
    title:titles.size===1?[...titles][0]:'',
    lavoratore:people.size===1?[...people][0]:'',
    company};
}

async function renderPdf(snap){
  const toPdf=await library();
  ensureStyle();
  if(document.fonts?.ready) await document.fonts.ready;
  const imgs=snap.holders.flatMap(h=>[...h.querySelectorAll('img')]);
  await Promise.all(imgs.map(img=>img.complete?null:new Promise(r=>{img.addEventListener('load',r,{once:true});img.addEventListener('error',r,{once:true});setTimeout(r,1800);})));
  const opt={margin:0,filename:'documento.pdf',image:{type:'jpeg',quality:0.9},
    html2canvas:{scale:1.35,useCORS:true,allowTaint:false,backgroundColor:'#ffffff',logging:false},
    jsPDF:{unit:'mm',format:'a4',orientation:snap.landscape?'landscape':'portrait'},
    pagebreak:{mode:[]}};
  // Prima pagina crea il PDF, le successive vengono aggiunte una per una (nessuna pagina vuota o spezzata).
  let worker=toPdf().set(opt).from(snap.holders[0]).toPdf();
  snap.holders.slice(1).forEach(holder=>{
    worker=worker.get('pdf').then(pdf=>{pdf.addPage('a4',snap.landscape?'landscape':'portrait');}).from(holder).toContainer().toCanvas().toPdf();
  });
  const blob=await worker.outputPdf('blob');
  if(!(blob instanceof Blob)||blob.size<5) throw Error('Conversione PDF non riuscita.');
  return blob;
}

function fileName(snap){
  const cap=s=>s.toLowerCase().replace(/(^|\s)\S/g,m=>m.toUpperCase());
  // Stessa tipologia: titolo (+ lavoratore se unico). Documenti diversi insieme: "Documenti sicurezza - azienda".
  const base=snap.title?[cap(snap.title),snap.lavoratore].filter(Boolean).join(' - '):['Documenti sicurezza',snap.company||snap.lavoratore].filter(Boolean).join(' - ');
  const clean=base.replace(/[\\/:*?"<>|]+/g,' ').replace(/\s+/g,' ').trim().slice(0,90)||'Documento';
  return clean+'.pdf';
}

function closeDialog(){document.getElementById('safety-share-dialog')?.remove();}
function dialog(html){
  closeDialog();
  const d=document.createElement('div');d.id='safety-share-dialog';
  d.className='fixed inset-0 z-[100001] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4';
  d.innerHTML=`<div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"><div class="bg-slate-900 text-white px-5 py-4 flex items-center justify-between gap-3"><div class="min-w-0"><p class="text-[10px] font-black uppercase tracking-widest text-emerald-300">Condividi</p><h2 class="font-black text-base">Documento in PDF</h2></div><button type="button" data-share-close aria-label="Chiudi" title="Chiudi" class="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-xl">×</button></div><div class="p-5 space-y-3" data-share-body>${html}</div></div>`;
  d.addEventListener('click',e=>{if(e.target===d||e.target.closest('[data-share-close]'))closeDialog();});
  document.body.appendChild(d);
  return d;
}
const btn=(attr,label,cls)=>`<button type="button" ${attr} class="w-full px-4 py-3 rounded-xl font-black uppercase text-xs ${cls}">${label}</button>`;

function download(file){
  const url=URL.createObjectURL(file);
  const a=document.createElement('a');a.href=url;a.download=file.name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
}

function showReady(file,snap){
  const canShare=typeof navigator.share==='function'&&typeof navigator.canShare==='function'&&navigator.canShare({files:[file]});
  const subject=file.name.replace(/\.pdf$/,'');
  const text=`In allegato il documento "${subject}" (${snap.count} ${snap.count===1?'pagina':'pagine'}).`;
  const d=dialog(`<p class="text-sm text-slate-700"><b>${esc(file.name)}</b><br><span class="text-xs text-slate-500">${snap.count} ${snap.count===1?'pagina':'pagine'} · ${Math.max(1,Math.round(file.size/1024))} KB · creato su questo dispositivo, non salvato online</span></p>
    ${canShare?btn('data-share-native','Condividi (WhatsApp, email, altre app)','bg-emerald-600 hover:bg-emerald-700 text-white'):''}
    ${btn('data-share-download','Scarica PDF','bg-slate-900 hover:bg-slate-800 text-white')}
    <div class="grid grid-cols-2 gap-2">${btn('data-share-mail','Email','bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200')}${btn('data-share-wa','WhatsApp Web','bg-green-50 hover:bg-green-100 text-green-900 border border-green-200')}</div>
    <p class="text-[11px] text-slate-500 leading-snug">${canShare?'Con "Condividi" il PDF è già allegato. ':''}Con "Email" e "WhatsApp Web" il PDF viene scaricato e si apre un messaggio pronto: allega il file scaricato prima di inviare. Contiene dati personali: invialo solo ai contatti ufficiali.</p>`);
  d.querySelector('[data-share-native]')?.addEventListener('click',async()=>{
    try{await navigator.share({files:[file],title:subject,text});closeDialog();}
    catch(e){if(e?.name!=='AbortError'){console.warn('Condividi:',e);alert('Condivisione non riuscita: usa "Scarica PDF".');}}
  });
  d.querySelector('[data-share-download]')?.addEventListener('click',()=>download(file));
  d.querySelector('[data-share-mail]')?.addEventListener('click',()=>{download(file);window.location.href=`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text+'\n\n(Allegare il PDF scaricato: '+file.name+')')}`;});
  d.querySelector('[data-share-wa]')?.addEventListener('click',()=>{download(file);window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,'_blank','noopener');});
}

// Esegue una funzione di stampa esistente; la sua prossima chiamata a window.print() crea il PDF.
async function run(printFn){
  if(busy) return;
  if(typeof printFn!=='function') return;
  busy=true;
  const originalPrint=window.print;
  let captured=false;
  const restore=()=>{if(window.print!==originalPrint&&!captured){window.print=originalPrint;}busy=false;};
  const timer=setTimeout(restore,20000); // la funzione non ha stampato (es. nessun documento): ripristino
  window.print=function(){
    captured=true;clearTimeout(timer);window.print=originalPrint;
    let snap;
    try{snap=snapshot(document.getElementById('print-area-temp')||document.body);}
    catch(e){busy=false;alert(e.message||String(e));return;}
    dialog('<p class="text-sm font-bold text-slate-700">Sto creando il PDF…</p><p class="text-xs text-slate-500">Qualche secondo per i documenti con molte pagine.</p>');
    renderPdf(snap).then(blob=>{
      showReady(new File([blob],fileName(snap),{type:'application/pdf'}),snap);
    }).catch(e=>{
      console.error('Condividi PDF:',e);
      dialog(`<p class="text-sm font-bold text-rose-800">PDF non creato</p><p class="text-xs text-slate-600">${esc(e.message||e)}</p>`);
    }).finally(()=>{busy=false;});
  };
  try{await printFn();}
  catch(e){clearTimeout(timer);window.print=originalPrint;busy=false;throw e;}
}

window.SafetySharePdf={run,snapshot,fileName};
window.condividiDocumentoVisualizzato=()=>{
  if(!window.currentPrintModule) return alert('Genera prima un documento nell’anteprima.');
  return run(()=>window.stampaSezioneAttuale());
};
window.condividiModelloLibero=()=>run(()=>window.scdFreePrint?.());

// Pulsanti: accanto a "Ristampa documento visualizzato" e nella Stampa libera dei documenti azienda/persona.
const SHARE_ICON='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>';
function inject(){
  const reprint=[...document.querySelectorAll('#app-content button[onclick="window.stampaSezioneAttuale()"]')][0];
  if(reprint&&!document.getElementById('safety-share-current')){
    const b=document.createElement('button');b.type='button';b.id='safety-share-current';
    b.className='w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase py-3 px-4 rounded-lg shadow-md transition flex items-center justify-center gap-2 text-sm';
    b.innerHTML=SHARE_ICON+' Condividi PDF (WhatsApp, email)';
    b.addEventListener('click',()=>window.condividiDocumentoVisualizzato());
    reprint.insertAdjacentElement('afterend',b);
  }
  const free=document.querySelector('#safety-company-doc-buttons button[onclick="window.scdFreePrint()"]');
  if(free&&!document.getElementById('safety-share-free')){
    const b=document.createElement('button');b.type='button';b.id='safety-share-free';
    b.className='w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black px-3 py-2 text-[10px] uppercase flex items-center justify-center gap-2';
    b.innerHTML=SHARE_ICON+' Condividi PDF';
    b.addEventListener('click',()=>window.condividiModelloLibero());
    free.insertAdjacentElement('afterend',b);
  }
}
const root=document.getElementById('app-content')||document.body;
new MutationObserver(()=>{
  if((!document.getElementById('safety-share-current')&&document.querySelector('#app-content button[onclick="window.stampaSezioneAttuale()"]'))||
     (!document.getElementById('safety-share-free')&&document.querySelector('#safety-company-doc-buttons button[onclick="window.scdFreePrint()"]'))) inject();
}).observe(root,{childList:true,subtree:true});
inject();
})();
