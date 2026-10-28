/* SafetyManager Pro — rettifica amministrativa iscrizioni (G7).
 * Esame read-only delle evidenze e trasferimento di sole iscrizioni senza attività.
 * Non modifica attestati, firme, documenti, test, presenze o altre iscrizioni.
 */
(function(){
'use strict';
if(window.__safetyEnrollmentReviewLoaded)return;
window.__safetyEnrollmentReviewLoaded=true;
const DB=()=>window.supabaseClient;
const el=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uuid=v=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v||''));
const deps=[
 ['session_attendance','iscrizione_id','Presenze / registro'],
 ['firme_digitali','iscrizione_id','Firme digitali'],
 ['test_digitali','iscrizione_id','Test digitali'],
 ['course_completion_items','iscrizione_id','Controlli di completamento'],
 ['corsisti_documenti_archivio','iscrizione_id','Documenti archiviati'],
 ['training_credits','source_iscrizione_id','Crediti formativi']
];
let active=null;
async function ensureAdmin(){
 if(typeof window.getSafetyAdminUser!=='function')throw Error('Autenticazione amministratore non disponibile.');
 const user=await window.getSafetyAdminUser();
 if(!user)throw Error('Accedi come amministratore prima di rettificare iscrizioni.');
}
async function single(table,fields,column,id){
 const {data,error}=await DB().from(table).select(fields).eq(column,id).maybeSingle();
 if(error)throw new Error('Errore verifica '+table+': '+error.message);
 return data||null;
}
async function count(table,column,id,label){
 const {count:n,error}=await DB().from(table).select('id',{head:true,count:'exact'}).eq(column,id);
 if(error)throw new Error('Impossibile verificare '+label+': '+error.message);
 if(!Number.isSafeInteger(n)||n<0)throw new Error('Conteggio non disponibile: '+label);
 return n;
}
async function examine(id){
 if(!uuid(id))throw Error('ID iscrizione non valido.');
 await ensureAdmin();
 const enrollment=await single('iscrizioni',
  'id,progetto_id,corsista_id,ore_frequentate,percentuale_frequenza,voto_test,esito_pratica,note_verifica,id_certificato,esito',
  'id',id);
 if(!enrollment)throw Error('Iscrizione non trovata o non accessibile.');
 const [project,dependentCounts]=await Promise.all([
  single('progetti','id,codice,corso_id,azienda_id,stato_corso,modalita,ente_erogatore','id',enrollment.progetto_id),
  Promise.all(deps.map(async ([table,column,label])=>({table,label,count:await count(table,column,id,label)})))
 ]);
 if(!project)throw Error('Corso collegato non disponibile: nessuna operazione consentita.');
 const fieldProof=[
  ['ore_frequentate','Ore di frequenza'],
  ['percentuale_frequenza','Percentuale di frequenza'],
  ['voto_test','Voto test'],
  ['esito_pratica','Esito prova pratica'],
  ['note_verifica','Note verifica']
 ].filter(([field])=>enrollment[field]!==null&&enrollment[field]!==undefined&&String(enrollment[field]).trim()!=='')
  .map(([field,label])=>({field,label}));
 // Alcune prove storiche sono legate a (corsista, progetto), senza ID iscrizione.
 // Non trasferire una registrazione se tali prove resterebbero nel corso origine.
 const crossSpecs=[
  ['firme_digitali','Firme riferite a corsista/corso'],
  ['test_digitali','Test riferiti a corsista/corso'],
  ['corsisti_documenti_archivio','Documenti riferiti a corsista/corso'],
  ['training_effectiveness_checks','Verifiche efficacia riferite a corsista/corso']
 ];
 const crossCounts=await Promise.all(crossSpecs.map(async ([table,label])=>{
  const {count:n,error}=await DB().from(table).select('id',{head:true,count:'exact'})
   .eq('progetto_id',enrollment.progetto_id).eq('corsista_id',enrollment.corsista_id);
  if(error)throw new Error('Impossibile verificare '+label+': '+error.message);
  if(!Number.isSafeInteger(n)||n<0)throw new Error('Conteggio non disponibile: '+label);
  return {table,label,count:n};
 }));
 const allCounts=[...dependentCounts,...crossCounts];
 const linked=allCounts.filter(x=>x.count>0);
 const closed=['chiuso','svolto'].includes(String(project.stato_corso||'').toLowerCase());
 const reasons=[
  ...linked.map(x=>x.label+': '+x.count),
  ...fieldProof.map(x=>x.label+' compilato/a'),
  ...(closed?['Corso già svolto o chiuso']:[])
 ];
 return {enrollment,project,counts:allCounts,fieldProof,blocked:reasons.length>0,reasons};
}
async function targets(source,studentId){
 const ps=typeof window.getProgetti==='function'?await window.getProgetti():[];
 if(!Array.isArray(ps))throw Error('Elenco progetti non disponibile.');
 return ps.filter(p=>p&&uuid(p.id)&&p.id!==source&&(!p.stato_corso||p.stato_corso==='aperto'));
}
async function transfer(id,toId,reason){
 if(!uuid(id)||!uuid(toId))throw Error('Iscrizione o corso destinazione non valido.');
 const why=String(reason||'').trim();
 if(why.length<12||why.length>500)throw Error('Inserisci una motivazione da 12 a 500 caratteri.');
 // Ricalcola tutti i vincoli al click; non fidarsi dei dati mostrati in precedenza.
 const report=await examine(id);
 if(report.blocked)throw Error('Trasferimento bloccato: '+report.reasons.join('; '));
 const old=report.enrollment,from=report.project;
 if(old.progetto_id===toId)throw Error('Seleziona un corso diverso da quello attuale.');
 const dest=await single('progetti','id,codice,corso_id,azienda_id,stato_corso,modalita,ente_erogatore,data_esame','id',toId);
 if(!dest||dest.stato_corso&&dest.stato_corso!=='aperto')throw Error('Il corso di destinazione deve essere aperto e disponibile.');
 const c=await single('corsisti','id,azienda_id,nome_cognome,cf,luogo_data_nascita,mansione_storica,ruolo_aziendale,archived_at','id',old.corsista_id);
 if(!c||c.archived_at)throw Error('Corsista non disponibile oppure archiviato.');
 if(dest.ente_erogatore==='azienda'&&c.azienda_id!==dest.azienda_id){
  throw Error('Il corso è erogato direttamente dall’azienda: il corsista deve appartenervi.');
 }
 const existing=await count('iscrizioni','progetto_id',dest.id,'Iscrizioni destinazione');
 const {data:already,error:dupError}=await DB().from('iscrizioni')
   .select('id').eq('progetto_id',dest.id).eq('corsista_id',c.id).limit(1);
 if(dupError)throw new Error('Impossibile controllare i duplicati: '+dupError.message);
 if((already||[]).length)throw Error('Il corsista è già iscritto al corso di destinazione.');
 const max=Number(window.ASR2025_POLICY?.maxDiscentiAula)||30;
 if(!String(dest.modalita||'').toLowerCase().includes('learning')&&existing>=max){
  throw Error('Numero massimo di corsisti raggiunto nel corso di destinazione.');
 }
 if(typeof window.buildIscrizioneRecord!=='function')throw Error('Funzione di preparazione iscrizione non disponibile.');
 const azienda=dest.azienda_id?await single('aziende','id,ragione_sociale,piva_cf','id',dest.azienda_id):null;
 const snapshot=window.buildIscrizioneRecord({...dest,aziende:azienda},c);
 if(!snapshot||snapshot.progetto_id!==dest.id||!snapshot.id_certificato){
  throw Error('Non è stato possibile generare correttamente il riferimento al nuovo corso.');
 }
 // Note nella stessa riga: tracciabilità minima anche qualora l'audit esterno non riuscisse.
 const notes='Rettifica iscrizione '+new Date().toISOString().slice(0,10)+
    ': trasferita dal progetto '+String(from.codice||from.id)+' ('+from.id+') a '+
    String(dest.codice||dest.id)+' ('+dest.id+'). Motivo: '+why;
 const patch={
  progetto_id:dest.id,
  id_certificato:snapshot.id_certificato,
  data_scadenza:snapshot.data_scadenza,
  esito:snapshot.esito,
  azienda_storica_id:snapshot.azienda_storica_id,
  azienda_storica_nome:snapshot.azienda_storica_nome,
  azienda_storica_piva_cf:snapshot.azienda_storica_piva_cf,
  ruolo_aziendale_storico:snapshot.ruolo_aziendale_storico,
  nome_cognome_storico:snapshot.nome_cognome_storico,
  cf_storico:snapshot.cf_storico,
  luogo_data_nascita_storico:snapshot.luogo_data_nascita_storico,
  mansione_storica:snapshot.mansione_storica,
  note_verifica:notes
 };
 const {data:updated,error}=await DB().from('iscrizioni')
  .update(patch).eq('id',old.id).eq('progetto_id',from.id).select('id,progetto_id');
 if(error)throw new Error('Trasferimento non riuscito: '+error.message);
 if(!Array.isArray(updated)||updated.length!==1||updated[0].progetto_id!==dest.id){
  throw Error('Il database non ha confermato lo spostamento. Ricarica e verifica il progetto.');
 }
 try{if(typeof window.safetyAudit==='function'){
   await window.safetyAudit('iscrizione_trasferita',{
    table_name:'iscrizioni',record_id:old.id,
    details:{progetto_origine:from.id,progetto_destinazione:dest.id,motivazione:why}
   });
 }}catch(error){console.warn('Audit secondario non disponibile: traccia in note_verifica',error);}
 return {from,to:dest,enrollmentId:id};
}
function modal(){
 let root=el('safety-enrollment-review-modal');
 if(root)return root;
 root=document.createElement('div');root.id='safety-enrollment-review-modal';
 root.className='fixed inset-0 overflow-y-auto';
 root.style.cssText='position:fixed;inset:0;z-index:180005;background:rgba(15,23,42,.78);overflow-y:auto;padding:clamp(8px,3vw,24px)';
 root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');
 root.setAttribute('aria-label','Verifica e trasferisci iscrizione');
 document.body.appendChild(root);
 root.addEventListener('click',e=>{if(e.target===root)close()});
 return root;
}
function close(){
 const root=el('safety-enrollment-review-modal');if(root)root.remove();
 active=null;
}
function paintError(message){
 const area=el('safety-enrollment-review-status');
 if(area){area.textContent=String(message);area.className='text-sm rounded-xl p-3 bg-rose-50 border border-rose-200 text-rose-900';}
}
function draw(report,other){
 const root=modal(),en=report.enrollment;
 const possible=!report.blocked;
 const descr=report.blocked
   ?'<p class="text-rose-900 font-bold">Operazione protetta: esistono dati o attività collegati. Nessun record è stato modificato.</p>'
   :'<p class="text-emerald-900 font-bold">Iscrizione senza evidenze rilevate: puoi disiscrivere oppure trasferire a un altro corso aperto.</p>';
 const issues=report.blocked?'<ul class="list-disc ml-5 my-3">'+report.reasons.map(r=>'<li>'+esc(r)+'</li>').join('')+'</ul>':
  '<p class="mt-2">Nessuna presenza, firma, test, documento o controllo di completamento collegato.</p>';
 root.innerHTML='<section class="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden text-slate-900">'+
  '<header class="bg-slate-900 text-white p-4 flex items-start justify-between gap-4"><div><h2 class="text-xl font-black">Verifica / trasferisci iscrizione</h2><p class="text-xs text-slate-300 mt-1">Controllo amministrativo senza cancellazione automatica delle evidenze</p></div><button type="button" id="safety-enrollment-review-close" class="px-3 py-2 bg-slate-700 rounded-lg text-white min-h-[44px]">Chiudi ×</button></header>'+
  '<div class="p-5 text-sm space-y-4"><div class="rounded-xl bg-slate-50 p-3 border border-slate-200"><strong>Corso attuale:</strong> '+esc(report.project.codice||report.project.id)+
  ' <span class="text-slate-500">('+esc(report.project.stato_corso||'aperto')+')</span></div>'+
  '<div class="rounded-xl p-4 border '+(possible?'border-emerald-200 bg-emerald-50':'border-rose-200 bg-rose-50')+'">'+descr+issues+'</div>'+
  '<div class="text-xs text-slate-600">Il numero di certificato e l’esito “Idoneo” sono generati automaticamente alla preiscrizione e da soli non provano la frequenza.</div>'+
  (possible
   ?'<div class="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3"><h3 class="font-black">Trasferisci a un altro progetto</h3>'+
    '<label class="block text-xs font-bold">Corso di destinazione<select id="safety-enrollment-target" class="block mt-1 w-full border border-slate-300 rounded-xl p-3 bg-white text-sm">'+
    '<option value="">Seleziona un progetto aperto…</option>'+
    other.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.codice||p.id)+' · '+esc(window.DB_CORSI?.[p.corso_id]?.t||p.corso_id||'Corso')+'</option>').join('')+
    '</select></label>'+
    '<label class="block text-xs font-bold">Motivazione rettifica<textarea id="safety-enrollment-reason" maxlength="500" rows="3" class="block mt-1 w-full border border-slate-300 rounded-xl p-3 bg-white text-sm" placeholder="Es. Inserimento nel corso sbagliato per errore materiale"></textarea></label>'+
    '<button type="button" id="safety-enrollment-transfer" class="w-full min-h-[44px] p-3 rounded-xl bg-blue-700 text-white font-black">Conferma trasferimento</button>'+
    '<p class="text-[11px] text-blue-900">L’iscrizione cambia progetto mantenendo l’ID; dati e riferimento del nuovo corso vengono aggiornati. La motivazione viene registrata.</p></div>'
   :'<div class="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-950"><strong>Rettifica guidata:</strong> controlla le evidenze elencate nel registro presenze, nei test, nel fascicolo o nei controlli del corso. Le operazioni di eliminazione/trasferimento rimangono bloccate fino a verifica amministrativa documentata.</div>')+
  '<div id="safety-enrollment-review-status" aria-live="polite"></div>'+
  '<button type="button" id="safety-enrollment-open-history" class="px-4 py-3 border border-slate-300 rounded-xl text-slate-900 font-bold">Apri storico corsista</button></div></section>';
 el('safety-enrollment-review-close')?.addEventListener('click',close);
 el('safety-enrollment-open-history')?.addEventListener('click',()=>{
  if(typeof window.apriFormazionePregressa==='function'){close();window.apriFormazionePregressa(en.corsista_id);}
  else paintError('Lo storico formativo non è disponibile in questa sessione. Apri la sezione Corsisti.');
 });
 el('safety-enrollment-transfer')?.addEventListener('click',async()=>{
  const target=el('safety-enrollment-target')?.value,reason=el('safety-enrollment-reason')?.value;
  const btn=el('safety-enrollment-transfer');
  if(!btn||active?.busy)return;
  active.busy=true;btn.disabled=true;
  try{
   if(!target)throw Error('Seleziona il corso di destinazione.');
   if(!window.confirm('Confermi il trasferimento dell’iscrizione? Non saranno copiate presenze, firme o verifiche.'))return;
   await transfer(en.id,target,reason);
   close();
   try{
    if(typeof window.reloadLinkedViewsAfterMutation==='function')await window.reloadLinkedViewsAfterMutation('iscrizione-transfer',{projectId:target});
    if(el('popup-corsisti-list')&&typeof window.renderPopupCorsisti==='function')await window.renderPopupCorsisti(report.project.id);
    if(window.currentProgettoId===report.project.id&&el('panel-iscrizioni')?.classList.contains('flex')&&typeof window.loadIscrittiTable==='function')await window.loadIscrittiTable();
   }catch(e){console.warn('Ricaricamento dati dopo trasferimento:',e);}
   window.alert('Iscrizione trasferita. Il corsista risulta ora nel corso di destinazione.');
  }catch(e){paintError(e.message||e)}
  finally{if(active)active.busy=false;if(btn.isConnected)btn.disabled=false}
 });
}
async function open(id){
 const root=modal();
 root.innerHTML='<div class="max-w-lg mx-auto rounded-xl bg-white p-6 text-center">Verifica delle evidenze formative…</div>';
 active={id,busy:false};
 try{
  const report=await examine(id);
  const options=report.blocked?[]:await targets(report.project.id,report.enrollment.corsista_id);
  if(active?.id===id)draw(report,options);
 }catch(e){
  if(active?.id===id)root.innerHTML='<div class="max-w-lg mx-auto bg-white rounded-xl p-6"><p class="text-rose-800 font-bold">'+esc(e.message||e)+'</p><button type="button" id="safety-review-error-close" class="mt-4 p-3 rounded-xl bg-slate-900 text-white">Chiudi</button></div>';
  el('safety-review-error-close')?.addEventListener('click',close);
 }
}
window.SafetyEnrollmentReview={open,close,examine,transfer};
window.apriGestioneIscrizione=open;
})();