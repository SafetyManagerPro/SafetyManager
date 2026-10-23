/* SafetyManager Pro — opt-in PDF del documento effettivamente preparato per la stampa.
   Indipendente da SafetyTraining; non modifica window.print e non blocca la stampa. */
(function(){
'use strict';
if(window.__safetyCorsistiAutoArchiveLoaded)return;
window.__safetyCorsistiAutoArchiveLoaded=true;
const PREF='safetymanager-corsisti-archivia-automatica-v1';
const LIBRARY='https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
const SRI='sha512-GsLlZN/3F2ErC5ifS5QtgpiJtWd43JWSuIgh7mbzZ8zBps+dvLusV+eNQATqgA/HdeKFVgA5v3S/cIrLF7QnIg==';
const types={
 attestato:'attestato',
 preposto:'nomina_preposto',
 primo_soccorso:'primo_soccorso',
 antincendio:'antincendio',
 attrezzatura:'attrezzatura',
 quota:'quota_dpi',
 confinati:'incarico',
 incarico_generico:'incarico',
 verbale_consegna_dpi:'consegna_dpi',
 registro_consegna_dpi:'registro_dpi',
 dichiarazione_dl_diretta:'incarico',
 altro:'altro'
};
let libraryPromise=null;
const jobs=new Set();
const enabled=()=>{try{return localStorage.getItem(PREF)==='1';}catch(_){return false;}};
const setEnabled=value=>{
 try{localStorage.setItem(PREF,value?'1':'0');}catch(e){console.warn('[Autoarchivia] Preferenza non salvata:',e);}
 document.querySelectorAll('[data-safety-autoarchive-checkbox]').forEach(box=>{box.checked=!!value;});
 return !!value;
};
function toast(label,isError=false){
 ensurePrintIsolation();
 let node=document.getElementById('safety-autoarchive-notice');
 if(!node){
   node=document.createElement('div');node.id='safety-autoarchive-notice';node.setAttribute('role','status');
   node.setAttribute('aria-live','polite');
   node.style.cssText='position:fixed;z-index:2147483000;right:16px;top:16px;max-width:390px;padding:14px 18px;background:#17283d;border:2px solid #70a5c6;border-radius:12px;box-shadow:0 12px 40px #0005;color:#fff;font:600 13px/1.55 system-ui,Arial;white-space:pre-wrap;';
   const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','Chiudi avviso');
   close.style.cssText='float:right;padding:0 5px;color:#fff;font-size:20px;cursor:pointer';
   close.onclick=()=>node.remove();node.appendChild(close);
   const content=document.createElement('span');content.dataset.safetyArchiveText='1';node.appendChild(content);
 }
 const target=node.querySelector('[data-safety-archive-text]');if(target)target.textContent=label;
 node.style.borderColor=isError?'#ef4444':'#70a5c6';
 document.body.appendChild(node);
}
function library(){
 if(window.html2pdf)return Promise.resolve(window.html2pdf);
 if(libraryPromise)return libraryPromise;
 libraryPromise=new Promise((resolve,reject)=>{
   const tag=document.createElement('script');
   tag.src=LIBRARY;tag.crossOrigin='anonymous';tag.referrerPolicy='no-referrer';tag.integrity=SRI;
   tag.onload=()=>window.html2pdf?resolve(window.html2pdf):reject(Error('Convertitore PDF non disponibile.'));
   tag.onerror=()=>reject(Error('Impossibile caricare il convertitore PDF opzionale: controlla la connessione.'));
   document.head.appendChild(tag);
 }).catch(err=>{libraryPromise=null;throw err;});
 return libraryPromise;
}
function ensurePrintIsolation(){
 if(document.getElementById('safety-autoarchive-isolation'))return;
 const style=document.createElement('style');style.id='safety-autoarchive-isolation';
 style.textContent='@media print{#safety-autoarchive-staging,#safety-autoarchive-notice{display:none!important}}'+
   '#safety-autoarchive-staging{position:fixed;left:0;top:0;z-index:-99999;width:210mm;background:#fff;pointer-events:none;}'+
   '#safety-autoarchive-staging .doc-page,#safety-autoarchive-staging .safety-company-doc-page{box-shadow:none!important;transform:none!important;margin:0!important;display:block!important;background:#fff!important;}';
 document.head.appendChild(style);
}
// Clonazione sincronizzata PRIMA che print() possa liberare l'area originale.
function snapshot(area){
 const pages=[...area.querySelectorAll('.doc-page,.safety-company-doc-page')];
 // Alcuni documenti usano entrambi i nomi sulla stessa pagina: querySelectorAll li restituisce una volta sola.
 if(!pages.length)throw Error('Nessuna pagina generata da archiviare.');
 const holder=document.createElement('div');holder.id='safety-autoarchive-staging';
 const pageCopies=pages.map((page,i)=>{
   const clone=page.cloneNode(true);
   clone.removeAttribute('id');clone.classList.remove('hidden','scale-[0.8]','origin-top');
   clone.classList.add('print-show');
   const canvases=[...page.querySelectorAll('canvas')],copies=[...clone.querySelectorAll('canvas')];
   canvases.forEach((canvas,j)=>{
     const target=copies[j];if(!target)return;
     // Le firme/annotazioni su canvas non vengono copiate da cloneNode.
     const replacement=document.createElement('img');
     replacement.src=canvas.toDataURL('image/png');
     replacement.style.cssText='width:'+canvas.clientWidth+'px;height:'+canvas.clientHeight+'px;max-width:100%;';
     target.replaceWith(replacement);
   });
   clone.style.width='210mm';clone.style.minHeight='297mm';clone.style.height='297mm';
   clone.style.maxHeight='297mm';clone.style.overflow='hidden';clone.style.boxSizing='border-box';
   clone.style.pageBreakAfter='always';clone.style.breakAfter='page';
   return clone;
 });
 holder.append(...pageCopies);
 return holder;
}
async function renderPdf(holder){
 const toPdf=await library();
 ensurePrintIsolation();
 document.body.appendChild(holder);
 try{
   if(document.fonts?.ready)await document.fonts.ready;
   const images=[...holder.querySelectorAll('img')];
   await Promise.all(images.map(img=>img.complete?Promise.resolve():new Promise(resolve=>{
      img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true});
      setTimeout(resolve,1800);
   })));
   // html2pdf usa html2canvas + jsPDF localmente: nessun invio ad altri server.
   const worker=toPdf().set({
     margin:0,
     filename:'documento.pdf',
     image:{type:'jpeg',quality:0.94},
     html2canvas:{scale:1.35,useCORS:true,allowTaint:false,backgroundColor:'#ffffff',logging:false},
     jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},
     pagebreak:{mode:['css','legacy'],before:'.doc-page:not(:first-child)'}
   }).from(holder).toPdf();
   const blob=await worker.outputPdf('blob');
   if(!(blob instanceof Blob)||blob.size<5)throw Error('Conversione PDF non riuscita.');
   return blob;
 }finally{holder.remove();}
}
const cleanTitle=value=>String(value||'Documento').replace(/[<>]/g,'').trim().slice(0,200);
function capture(area,ctx={}){
 if(!enabled()||!ctx?.corsistaId)return null;
 let cloned;
 try{cloned=snapshot(area);}
 catch(error){console.error('[Autoarchivia] Snapshot:',error);toast('Documento stampabile, ma non archiviato: '+error.message,true);return null;}
 const job=(async()=>{
   toast('Stampa avviata. Sto creando il PDF da archiviare nel fascicolo…');
   const pdf=await renderPdf(cloned);
   const archive=window.SafetyCorsistiFascicolo;
   if(!archive?.archiveGenerated)throw Error('Fascicolo non disponibile: ricarica la pagina Corsisti.');
   const record=await archive.archiveGenerated({
     corsistaId:ctx.corsistaId,projectId:ctx.projectId||null,
     tipo_documento:types[ctx.type]||'altro',
     titolo:cleanTitle(ctx.title),
     blob:pdf,
     notes:'Archiviazione automatica facoltativa da stampa SafetyManager Pro. PDF generato nel browser, da verificare prima di considerarlo documento definitivo.'
   });
   toast('PDF archiviato nel fascicolo del corsista (versione '+record.versione+'). Puoi ristamparlo da Archivio.');
   return record;
 })().catch(err=>{
   cloned.remove();
   console.error('[Autoarchivia corsisti] Non completata:',err);
   toast('La stampa resta disponibile. Archiviazione PDF non riuscita: '+(err?.message||err),true);
   return null;
 }).finally(()=>jobs.delete(job));
 jobs.add(job);
 return job;
}
window.SafetyCorsistiAutoArchive={enabled,setEnabled,capture,types};
})();