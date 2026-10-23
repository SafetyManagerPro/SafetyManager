/* SafetyManager Pro — fascicolo documentale individuale, indipendente da corsi e stampe. */
(function(){
'use strict';
if(window.__safetyCorsistiFascicoloLoaded)return;
window.__safetyCorsistiFascicoloLoaded=true;
const BUCKET='corsisti-fascicolo-privato',TABLE='corsisti_documenti_archivio',MAX=15728640;
const TYPES={
 attestato:'Attestato',nomina_preposto:'Nomina / individuazione preposto',
 incarico:'Nomina / incarico generico',primo_soccorso:'Designazione primo soccorso',
 antincendio:'Designazione antincendio',attrezzatura:'Autorizzazione attrezzatura',
 quota_dpi:'Incarico quota / DPI III categoria',consegna_dpi:'Consegna DPI',
 registro_dpi:'Registro DPI',altro:'Altro documento'
};
const state={id:null,person:null,docs:[],enrollments:[],previous:null,busy:false,filter:'all'};
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const db=()=>window.supabaseClient;
const el=id=>document.getElementById(id);
const msg=(text,isError=false)=>{const a=el('cfasc-feedback');if(a){a.textContent=String(text||'');a.className='text-xs font-bold '+(isError?'text-red-700':'text-blue-800');}};
const fmtDate=s=>s?new Date(s).toLocaleDateString('it-IT'):'—';
function view(){
 if(el('cfasc-modal'))return el('cfasc-modal');
 const root=document.createElement('div');
 root.id='cfasc-modal';
 root.setAttribute('role','dialog');
 root.setAttribute('aria-modal','true');
 root.setAttribute('aria-label','Fascicolo documentale corsista');
 root.className='fixed inset-0 z-[130001] overflow-y-auto bg-slate-950/75 p-3 sm:p-6';
 root.innerHTML='<section class="bg-white text-slate-900 max-w-5xl mx-auto rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">'+
 '<header class="px-4 sm:px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3"><div>'+
 '<p class="text-[10px] font-black tracking-widest uppercase text-cyan-200">Archivio privato · SafetyManager Pro</p>'+
 '<h2 class="text-xl font-black">Fascicolo documentale corsista</h2><p id="cfasc-person" class="text-xs text-slate-200 mt-1"></p></div>'+
 '<button type="button" id="cfasc-close" class="rounded-lg px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold">Chiudi ×</button></header>'+
 '<div class="p-4 sm:p-6 space-y-5">'+
 '<p class="text-xs text-slate-600">Archivio permanente dei PDF caricati: riapertura, stampa e versioni storiche. Non è richiesto un corso, un attestato o un esito. La stampa dei modelli resta libera anche senza salvataggio.</p>'+
 '<div class="flex flex-wrap justify-between gap-3 items-center"><h3 class="text-sm font-black uppercase">Documenti archiviati</h3>'+
 '<div class="flex flex-wrap gap-2"><select id="cfasc-filter" class="border border-slate-300 bg-white rounded-lg p-2 text-xs"><option value="all">Tutti gli stati</option><option value="bozza">Bozze</option><option value="definitivo">Definitivi</option><option value="superato">Superati</option></select>'+
 '<button type="button" id="cfasc-refresh" class="text-xs font-bold px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100">Aggiorna</button></div></div>'+
 '<div id="cfasc-list" class="space-y-3" aria-live="polite">Caricamento…</div>'+
 '<div class="border-t border-slate-200 pt-5"><h3 id="cfasc-form-title" class="text-sm font-black uppercase">Archivia un nuovo PDF</h3>'+
 '<p id="cfasc-version-info" class="text-xs text-slate-500 mt-1">Puoi caricare anche documenti senza corsi associati. Per ristampare usa Apri PDF.</p>'+
 '<form id="cfasc-form" class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">'+
 '<label class="text-xs font-bold">Tipo documento<select id="cfasc-type" required class="block mt-1 w-full bg-white border border-slate-300 rounded-lg p-2 text-sm"></select></label>'+
 '<label class="text-xs font-bold">Titolo<input id="cfasc-title" type="text" required minlength="3" maxlength="200" placeholder="Es. Nomina addetto primo soccorso" class="block mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm"></label>'+
 '<label class="text-xs font-bold">Corso / iscrizione (facoltativo)<select id="cfasc-enrollment" class="block mt-1 w-full bg-white border border-slate-300 rounded-lg p-2 text-sm"><option value="">Nessun corso associato</option></select></label>'+
 '<label class="text-xs font-bold">Data del documento (facoltativa)<input id="cfasc-doc-date" type="date" class="block mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm"></label>'+
 '<label class="text-xs font-bold">Stato<select id="cfasc-status" class="block mt-1 w-full bg-white border border-slate-300 rounded-lg p-2 text-sm"><option value="bozza">Bozza</option><option value="definitivo">Definitivo (da te verificato)</option></select></label>'+
 '<label class="text-xs font-bold">PDF (max 15 MB)<input id="cfasc-file" type="file" accept=".pdf,application/pdf" required class="block mt-1 w-full border border-slate-300 rounded-lg p-2 text-xs"></label>'+
 '<label class="text-xs font-bold sm:col-span-2">Note storiche (facoltative)<textarea id="cfasc-notes" maxlength="2500" rows="2" class="block mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm"></textarea></label>'+
 '<div class="sm:col-span-2 flex flex-wrap gap-2 items-center"><button type="submit" id="cfasc-upload" class="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-black uppercase rounded-lg">Archivia PDF</button>'+
 '<button type="button" id="cfasc-cancel-version" class="hidden px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-black rounded-lg border">Annulla nuova versione</button>'+
 '<span id="cfasc-feedback" role="status" aria-live="polite" class="text-xs font-bold text-blue-800"></span></div>'+
 '</form><p class="text-[11px] text-slate-500 mt-3">Le versioni precedenti restano archiviate senza sovrascritture. “Definitivo” è una classificazione gestionale: non sostituisce le firme o le verifiche richieste per legge. Usa “Salva come PDF” nella finestra di stampa e carica qui il file ottenuto, se vuoi conservarne una copia immutabile.</p></div></div></section>';
 document.body.appendChild(root);
 root.querySelector('#cfasc-close').onclick=close;
 root.querySelector('#cfasc-refresh').onclick=()=>void refresh();
 root.querySelector('#cfasc-filter').onchange=e=>{state.filter=e.target.value;render();};
 root.querySelector('#cfasc-cancel-version').onclick=resetVersion;
 root.querySelector('#cfasc-form').onsubmit=e=>{e.preventDefault();void upload();};
 root.querySelector('#cfasc-list').onclick=e=>{
   const button=e.target.closest('button[data-cfasc-action]');
   if(!button)return;
   const item=state.docs.find(d=>d.id===button.dataset.docId);
   if(!item)return;
   const action=button.dataset.cfascAction;
   if(action==='open')void open(item);
   if(action==='version')newVersion(item);
   if(action==='state')void updateStatus(item);
 };
 root.addEventListener('click',e=>{if(e.target===root)close();});
 root.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
 el('cfasc-type').innerHTML=Object.entries(TYPES).map(([value,label])=>'<option value="'+esc(value)+'">'+esc(label)+'</option>').join('');
 return root;
}
function close(){el('cfasc-modal')?.remove();state.previous=null;state.id=null;state.docs=[];state.enrollments=[];state.person=null;}
function resetVersion(){
 state.previous=null;
 el('cfasc-form').reset();
 el('cfasc-form-title').textContent='Archivia un nuovo PDF';
 el('cfasc-version-info').textContent='Nuovo documento (versione 1), senza vincoli sul corso.';
 el('cfasc-cancel-version').classList.add('hidden');
 msg('');
}
function newVersion(item){
 const all=state.docs.filter(x=>x.gruppo_versioni===item.gruppo_versioni);
 const last=all.sort((a,b)=>b.versione-a.versione)[0]||item;
 state.previous=last;
 el('cfasc-form-title').textContent='Nuova versione del documento';
 el('cfasc-version-info').textContent='Versione '+(last.versione+1)+' del documento '+last.titolo+'. La versione precedente rimarrà disponibile.';
 el('cfasc-type').value=last.tipo_documento;
 el('cfasc-title').value=last.titolo;
 el('cfasc-enrollment').value=last.iscrizione_id||'';
 el('cfasc-doc-date').value=last.data_documento||'';
 el('cfasc-status').value=last.stato==='definitivo'?'definitivo':'bozza';
 el('cfasc-notes').value=last.note||'';
 el('cfasc-file').value='';
 el('cfasc-cancel-version').classList.remove('hidden');
 msg('');
 el('cfasc-form')?.scrollIntoView({block:'nearest',behavior:'smooth'});
}
function render(){
 const list=el('cfasc-list');if(!list)return;
 const rows=state.docs.filter(d=>state.filter==='all'||state.filter===d.stato);
 if(!rows.length){
   list.innerHTML='<div class="border border-slate-200 bg-slate-50 rounded-xl p-4 text-sm text-slate-500">'+(state.docs.length?'Nessun documento per questo filtro.':'Non ci sono ancora PDF archiviati per questo corsista. Puoi caricarli anche senza corsi.')+'</div>';
   return;
 }
 list.innerHTML=rows.map(d=>{
  const badge=d.stato==='definitivo'?'bg-emerald-100 text-emerald-800':d.stato==='superato'?'bg-slate-200 text-slate-700':'bg-amber-100 text-amber-800';
  const course=state.enrollments.find(e=>e.id===d.iscrizione_id);
  const source=course?.progetti?.codice||'Documento indipendente da corsi';
  return '<article class="border border-slate-200 rounded-xl p-3 bg-white shadow-sm">'+
    '<div class="flex flex-wrap items-start justify-between gap-2"><div class="min-w-0 flex-1">'+
    '<h4 class="font-black text-sm text-slate-900 break-words">'+esc(d.titolo)+'</h4>'+
    '<div class="flex flex-wrap gap-2 mt-2 text-[11px] text-slate-600">'+
    '<span class="px-2 py-1 rounded-full '+badge+' font-black">'+esc(d.stato.toUpperCase())+'</span>'+
    '<span>Versione '+d.versione+'</span><span>'+esc(TYPES[d.tipo_documento]||d.tipo_documento)+'</span>'+
    '<span>Archiviato '+esc(fmtDate(d.creato_il))+'</span>'+
    '</div><p class="text-xs text-slate-700 mt-2">Azienda storica: '+esc(d.azienda_storica_nome||'Non indicata')+' · '+esc(source)+'</p>'+
    '<p class="text-xs text-slate-500">Corsista: '+esc(d.nome_cognome_storico)+' · '+esc(d.cf_storico||'C.F. non indicato')+'</p>'+
    (d.note?'<p class="text-xs text-slate-500 mt-1">'+esc(d.note)+'</p>':'')+
    '</div><div class="flex gap-1 flex-wrap shrink-0">'+
    '<button type="button" data-cfasc-action="open" data-doc-id="'+esc(d.id)+'" class="px-3 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-bold">Apri / stampa PDF</button>'+
    '<button type="button" data-cfasc-action="version" data-doc-id="'+esc(d.id)+'" class="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs font-bold">Nuova versione</button>'+
    (d.stato!=='superato'?'<button type="button" data-cfasc-action="state" data-doc-id="'+esc(d.id)+'" class="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs font-bold">'+(d.stato==='bozza'?'Segna definitivo':'Segna superato')+'</button>':'')+
    '</div></div></article>';
 }).join('');
}
async function refresh(){
 if(!state.id)return;
 const id=state.id;
 const [docRes,enrRes]=await Promise.all([
  db().from(TABLE).select('*').eq('corsista_id',id).order('creato_il',{ascending:false}).limit(500),
  db().from('iscrizioni').select('id,progetto_id,nome_cognome_storico,cf_storico,mansione_storica,azienda_storica_nome,azienda_storica_id,progetti(codice,corso_id,data_esame)').eq('corsista_id',id).limit(500)
 ]);
 if(state.id!==id)return;
 if(docRes.error)throw docRes.error;
 if(enrRes.error)throw enrRes.error;
 state.docs=docRes.data||[];
 state.enrollments=enrRes.data||[];
 const select=el('cfasc-enrollment'),chosen=select?.value||'';
 if(select){
   select.innerHTML='<option value="">Nessun corso associato</option>'+state.enrollments.map(e=>'<option value="'+esc(e.id)+'">'+esc([e.progetti?.codice,e.progetti?.corso_id].filter(Boolean).join(' · ')||'Iscrizione')+'</option>').join('');
   if(chosen)select.value=chosen;
 }
 render();
}
async function open(doc){
 // Aprire prima della chiamata asincrona evita il blocco popup su iOS/Safari.
 const popup=window.open('','_blank');
 if(!popup){alert('Consenti l’apertura di nuove schede per visualizzare il PDF.');return;}
 try{
  popup.opener=null;
  popup.document.title='Fascicolo riservato';
  popup.document.body.textContent='Caricamento PDF privato…';
  const {data,error}=await db().storage.from(BUCKET).createSignedUrl(doc.storage_path,90);
  if(error)throw error;
  if(!data?.signedUrl)throw Error('URL di download non disponibile.');
  popup.location.replace(data.signedUrl);
 }catch(err){popup.close();alert('Apertura PDF non riuscita: '+(err.message||err));}
}
async function updateStatus(doc){
 const next=doc.stato==='bozza'?'definitivo':'superato';
 if(!confirm('Modificare lo stato del documento in '+next.toUpperCase()+'? Il file non verrà modificato.'))return;
 const {error}=await db().from(TABLE).update({stato:next}).eq('id',doc.id).eq('corsista_id',state.id);
 if(error){msg(error.message,true);return;}
 try{await refresh();msg('Stato aggiornato. Il PDF storico è invariato.');}catch(e){msg(e.message,true);}
}
async function upload(){
 if(state.busy||!state.id)return;
 const id=state.id,person=state.person,previous=state.previous;
 const file=el('cfasc-file')?.files?.[0],title=String(el('cfasc-title')?.value||'').trim();
 const type=String(el('cfasc-type')?.value||''),stato=String(el('cfasc-status')?.value||'bozza');
 if(!file||file.size<1||file.size>MAX||!file.name.toLowerCase().endsWith('.pdf')){
  msg('Seleziona un PDF non vuoto di massimo 15 MB.',true);return;
 }
 if(file.type&&file.type!=='application/pdf'){msg('Sono accettati soltanto file PDF.',true);return;}
 if(title.length<3||!TYPES[type]){msg('Indica titolo e tipo documento.',true);return;}
 let header;
 try{header=new TextDecoder().decode(await file.slice(0,5).arrayBuffer());}catch(e){msg('Impossibile verificare il file PDF.',true);return;}
 if(header!=='%PDF-'){msg('Il file selezionato non sembra un PDF valido.',true);return;}
 state.busy=true;
 const submit=el('cfasc-upload');if(submit)submit.disabled=true;
 msg('Caricamento PDF in corso…');
 let storagePath=null;
 try{
  const enrollment=state.enrollments.find(e=>e.id===el('cfasc-enrollment')?.value);
  let companyName=enrollment?.azienda_storica_nome||'';
  let companyId=enrollment?.azienda_storica_id||null;
  if(!companyName){
   const all=window.aziendeList||[];
   const company=all.find(a=>a.id===person.azienda_id);
   companyName=company?.ragione_sociale||person.aziende?.ragione_sociale||'';
   companyId=companyId||company?.id||person.azienda_id||null;
  }
  const rowId=crypto.randomUUID();
  const latest=previous?state.docs.filter(d=>d.gruppo_versioni===previous.gruppo_versioni)
     .sort((a,b)=>b.versione-a.versione)[0]:null;
  if(previous&&(!latest||latest.id!==previous.id))throw Error('È presente una versione più recente. Aggiorna il fascicolo.');
  storagePath=id+'/'+rowId+'/documento.pdf';
  const {error:storageError}=await db().storage.from(BUCKET).upload(storagePath,file,{cacheControl:'0',upsert:false,contentType:'application/pdf'});
  if(storageError)throw storageError;
  const doc={
   id:rowId,corsista_id:id,iscrizione_id:enrollment?.id||null,
   progetto_id:enrollment?.progetto_id||null,
   gruppo_versioni:previous?previous.gruppo_versioni:rowId,
   versione:previous?previous.versione+1:1,
   precedente_id:previous?.id||null,tipo_documento:type,titolo:title,
   stato,data_documento:el('cfasc-doc-date').value||null,
   azienda_storica_nome:companyName||null,azienda_storica_id:companyId,
   nome_cognome_storico:enrollment?.nome_cognome_storico||person.nome_cognome||'Corsista',
   cf_storico:enrollment?.cf_storico||person.cf||null,
   mansione_storica:enrollment?.mansione_storica||person.mansione_storica||null,
   nome_file:file.name,storage_path:storagePath,dimensione_byte:file.size,
   mime_type:'application/pdf',note:String(el('cfasc-notes').value||'').trim()||null
  };
  const {error:rowError}=await db().from(TABLE).insert(doc);
  if(rowError)throw rowError;
  storagePath=null; // Documento registrato: non eliminare il PDF se la fase successiva fallisce.
  if(previous){
   const {error:prevError}=await db().from(TABLE).update({stato:'superato'}).eq('id',previous.id).eq('corsista_id',id);
   if(prevError)console.warn('[Fascicolo corsista] Versione precedente non aggiornata:',prevError.message);
  }
  await refresh();
  resetVersion();
  msg('PDF archiviato. È possibile riaprirlo e stamparlo in qualsiasi momento.');
 }catch(err){
  if(storagePath){
   const cleanup=await db().storage.from(BUCKET).remove([storagePath]);
   if(cleanup.error)console.warn('[Fascicolo corsista] Pulizia allegato incompleto:',cleanup.error.message);
  }
  console.error('[Fascicolo corsista]',err);
  msg('Archiviazione non riuscita: '+(err?.message||err),true);
 }finally{state.busy=false;if(submit)submit.disabled=false;}
}
// Interfaccia unica anche per documenti generati dal motore di stampa.
// Mantiene lo stesso archivio privato e le stesse regole delle versioni manuali.
window.SafetyCorsistiFascicolo={
 async archiveGenerated({corsistaId,projectId=null,tipo_documento='altro',titolo='Documento',blob,notes='PDF generato da SafetyManager Pro'}){
   if(!corsistaId||!blob)throw Error('Corsista o PDF mancante per archiviazione.');
   if(!TYPES[tipo_documento])throw Error('Tipo documento non riconosciuto.');
   if(blob.size<5||blob.size>MAX)throw Error('PDF non archiviabile: dimensioni fuori dal limite di 15 MB.');
   if(new TextDecoder().decode(await blob.slice(0,5).arrayBuffer())!=='%PDF-')
     throw Error('La conversione non ha prodotto un PDF valido.');
   const person=(window.corsistiList||[]).find(p=>String(p.id)===String(corsistaId))
     || (typeof window.getCorsisti==='function'?(await window.getCorsisti()).find(p=>String(p.id)===String(corsistaId)):null);
   if(!person)throw Error('Corsista non presente nella anagrafica.');
   const cid=String(corsistaId),pid=projectId?String(projectId):null;
   let query=db().from('iscrizioni').select(
      'id,progetto_id,nome_cognome_storico,cf_storico,mansione_storica,azienda_storica_nome,azienda_storica_id'
   ).eq('corsista_id',cid).limit(1);
   query=pid?query.eq('progetto_id',pid):query.is('progetto_id',null);
   const {data:matches,error:enrollmentError}=await query;
   if(enrollmentError)throw enrollmentError;
   const enrollment=(matches||[])[0]||null;
   // Senza iscrizione collegata i modelli rimangono indipendenti dal corso.
   const actualPid=enrollment?.progetto_id||null;
   const title=String(titolo||'Documento').trim().slice(0,200);
   if(title.length<3)throw Error('Titolo troppo breve.');
   let base=db().from(TABLE).select('id,gruppo_versioni,versione')
     .eq('corsista_id',cid).eq('tipo_documento',tipo_documento).eq('titolo',title)
     .order('creato_il',{ascending:false}).limit(1);
   base=actualPid?base.eq('progetto_id',actualPid):base.is('progetto_id',null);
   const {data:similar,error:similarError}=await base;
   if(similarError)throw similarError;
   let previous=(similar||[])[0]||null;
   if(previous){
     const {data:latest,error:latestError}=await db().from(TABLE)
       .select('id,versione').eq('gruppo_versioni',previous.gruppo_versioni)
       .order('versione',{ascending:false}).limit(1);
     if(latestError)throw latestError;
     if(latest?.length)previous={...previous,...latest[0]};
   }
   const id=crypto.randomUUID(),storagePath=cid+'/'+id+'/documento.pdf';
   const date=new Date(),today=new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,10);
   let companyName=enrollment?.azienda_storica_nome||person.aziende?.ragione_sociale||'';
   let companyId=enrollment?.azienda_storica_id||person.azienda_id||null;
   if(!companyName&&companyId){
     const co=(window.aziendeList||[]).find(a=>String(a.id)===String(companyId));
     companyName=co?.ragione_sociale||'';
   }
   const payload={
     id,corsista_id:cid,iscrizione_id:enrollment?.id||null,progetto_id:actualPid,
     gruppo_versioni:previous?.gruppo_versioni||id,versione:previous?previous.versione+1:1,
     precedente_id:previous?.id||null,tipo_documento,titolo:title,stato:'bozza',
     data_documento:today,azienda_storica_nome:companyName||null,azienda_storica_id:companyId,
     nome_cognome_storico:enrollment?.nome_cognome_storico||person.nome_cognome||'Corsista',
     cf_storico:enrollment?.cf_storico||person.cf||null,
     mansione_storica:enrollment?.mansione_storica||person.mansione_storica||null,
     nome_file:tipo_documento+'-'+today+'.pdf',storage_path:storagePath,
     mime_type:'application/pdf',dimensione_byte:blob.size,
     note:String(notes||'Generato automaticamente dalla stampa').slice(0,2500)
   };
   const uploaded=await db().storage.from(BUCKET).upload(storagePath,blob,{
     cacheControl:'0',upsert:false,contentType:'application/pdf'
   });
   if(uploaded.error)throw uploaded.error;
   const inserted=await db().from(TABLE).insert(payload);
   if(inserted.error){
     const cleanup=await db().storage.from(BUCKET).remove([storagePath]);
     if(cleanup.error)console.warn('[Fascicolo auto] PDF orfano:',cleanup.error.message);
     throw inserted.error;
   }
   if(previous){
     const result=await db().from(TABLE).update({stato:'superato'}).eq('id',previous.id).eq('corsista_id',cid);
     if(result.error)console.warn('[Fascicolo auto] Stato versione precedente:',result.error.message);
   }
   // Aggiorna la finestra solo se è ancora riferita allo stesso corsista.
   if(state.id===cid&&el('cfasc-modal')){
     try{await refresh();}catch(e){console.warn('[Fascicolo auto] Refresh:',e);}
   }
   return {id,versione:payload.versione,titolo:payload.titolo};
 }
};

window.apriFascicoloCorsista=async function(corsistaId){
 const person=(window.corsistiList||[]).find(c=>String(c.id)===String(corsistaId));
 if(!person){alert('Corsista non disponibile nella tabella. Ricarica la pagina.');return;}
 state.id=String(corsistaId);state.person=person;state.docs=[];state.enrollments=[];state.previous=null;state.filter='all';
 view();
 el('cfasc-person').textContent=[person.nome_cognome,person.cf].filter(Boolean).join(' · ');
 el('cfasc-filter').value='all';
 resetVersion();
 el('cfasc-list').textContent='Caricamento archivio privato…';
 try{await refresh();}catch(err){el('cfasc-list').textContent='Errore nel caricamento dei documenti: '+(err.message||err);msg(err.message,true);}
};
})();