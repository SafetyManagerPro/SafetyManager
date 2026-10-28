/* SafetyManager Pro G8: registrazione stato amministrativo iscrizione. */
(function(){
'use strict';
if(window.SafetyPartecipazione)return;
const el=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={iscritto:'Iscritto',non_partecipante:'Non partecipante',iscrizione_erronea:'Iscrizione erronea'};
let opened=null,busy=false;
async function admin(){if(typeof window.getSafetyAdminUser!=='function'||!await window.getSafetyAdminUser())throw Error('Accesso amministrativo richiesto.');}
async function get(id){
 const {data,error}=await window.supabaseClient.from('iscrizioni').select('id,progetto_id,partecipazione_stato,partecipazione_motivo,partecipazione_audit').eq('id',id).maybeSingle();
 if(error)throw Error(error.message);
 if(!data)throw Error('Iscrizione non accessibile.');
 return data;
}
async function update(id,state,reason){
 await admin();
 if(!labels[state])throw Error('Stato non valido.');
 const why=String(reason||'').trim();
 if(why.length<12||why.length>500)throw Error('Motivazione obbligatoria da 12 a 500 caratteri.');
 const old=await get(id),before=old.partecipazione_stato||'iscritto';
 if(before===state)throw Error('Seleziona uno stato diverso.');
 // La segnalazione non è un trasferimento: conservare evidenze esistenti e annotare l'errore.
 const {data,error}=await window.supabaseClient.from('iscrizioni')
 .update({partecipazione_stato:state,partecipazione_motivo:why})
 .eq('id',id).eq('progetto_id',old.progetto_id).eq('partecipazione_stato',before)
 .select('id,partecipazione_stato');
 if(error)throw Error(error.message);
 if(!Array.isArray(data)||data.length!==1||data[0].partecipazione_stato!==state)throw Error('Modifica non confermata dal database.');
 return {projectId:old.progetto_id};
}
function close(){if(busy)return;el('safety-partecipazione-modal')?.remove();opened=null;}
async function refresh(id){
 if(el('tabella-progetti')&&typeof window.loadProgettiTable==='function')await window.loadProgettiTable();
 if(el('popup-corsisti-list')&&el('prog-id')?.value===id&&typeof window.renderPopupCorsisti==='function')await window.renderPopupCorsisti(id);
 if(el('panel-iscrizioni')?.classList.contains('flex')&&window.currentProgettoId===id&&typeof window.loadIscrittiTable==='function')await window.loadIscrittiTable();
}
async function open(id){
 if(!id||busy)return;
 close();opened=id;
 const root=document.createElement('div');root.id='safety-partecipazione-modal';
 root.style.cssText='position:fixed;inset:0;z-index:180010;background:rgba(15,23,42,.78);padding:20px;overflow-y:auto';
 root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');
 root.setAttribute('aria-label','Segnala stato partecipazione');
 root.innerHTML='<section class="max-w-xl mx-auto bg-white rounded-xl p-5">Caricamento…</section>';
 root.addEventListener('click',e=>{if(e.target===root)close()});
 document.body.appendChild(root);
 try{
  await admin();const row=await get(id);if(opened!==id)return;
  const state=row.partecipazione_stato||'iscritto';
  const history=Array.isArray(row.partecipazione_audit)?row.partecipazione_audit:[];
  root.innerHTML='<section class="max-w-xl mx-auto bg-white text-slate-900 rounded-2xl overflow-hidden shadow-2xl">'+
  '<header class="bg-slate-900 text-white p-4 flex justify-between gap-3"><div><h2 class="font-black text-xl">Stato partecipazione</h2><p class="text-xs">Rettifica amministrativa tracciata</p></div><button type="button" id="safety-partecipazione-close" class="bg-slate-700 rounded-lg px-3 py-2">Chiudi ×</button></header>'+
  '<div class="p-5 space-y-4 text-sm"><p>Attuale: <strong>'+esc(labels[state])+'</strong></p>'+
  '<label class="block font-bold">Nuovo stato<select id="safety-partecipazione-select" class="block mt-1 w-full border rounded-lg p-3">'+
  Object.keys(labels).map(k=>'<option value="'+k+'"'+(k===state?' selected':'')+'>'+labels[k]+'</option>').join('')+
  '</select></label><label class="block font-bold">Motivazione<textarea id="safety-partecipazione-reason" rows="3" maxlength="500" class="mt-1 block w-full border rounded-lg p-3" placeholder="Motivazione dettagliata (almeno 12 caratteri)"></textarea></label>'+
  '<p class="text-xs text-rose-800">Le evidenze formative già presenti impediscono la segnalazione automatica di mancata partecipazione. Firme, presenze e documenti non vengono cancellati.</p>'+
  (history.length?'<details class="border rounded-lg p-3"><summary class="font-bold cursor-pointer">Storico rettifiche ('+history.length+')</summary><ul class="mt-3 space-y-2 text-xs">'+history.slice(-12).reverse().map(h=>'<li>'+esc(labels[h.da]||h.da)+' → '+esc(labels[h.a]||h.a)+' · '+esc(h.at||'')+'<p>'+esc(h.motivo||'')+'</p></li>').join('')+'</ul></details>':'')+
  '<p id="safety-partecipazione-error" class="hidden text-rose-800 font-bold" role="alert"></p>'+
  '<button type="button" id="safety-partecipazione-save" class="w-full min-h-[44px] bg-rose-700 text-white rounded-lg font-bold p-3">Salva stato</button></div></section>';
  el('safety-partecipazione-close')?.addEventListener('click',close);
  el('safety-partecipazione-save')?.addEventListener('click',async()=>{
   if(busy)return;
   const status=el('safety-partecipazione-select')?.value,reason=el('safety-partecipazione-reason')?.value;
   if(!window.confirm('Confermi la rettifica dello stato? Rimarrà nello storico.'))return;
   busy=true;const button=el('safety-partecipazione-save');button.disabled=true;
   try{const result=await update(id,status,reason);busy=false;close();try{await refresh(result.projectId)}catch(e){console.warn('Ricaricamento iscrizioni:',e)}window.alert('Stato registrato.');}
   catch(err){const box=el('safety-partecipazione-error');if(box){box.textContent=String(err.message||err);box.classList.remove('hidden');}}
   finally{busy=false;if(button.isConnected)button.disabled=false;}
  });
 }catch(err){root.innerHTML='<section class="max-w-xl mx-auto bg-white rounded-xl p-5"><p class="text-rose-800 font-bold">'+esc(err.message||err)+'</p><button id="safety-partecipazione-close" class="mt-4 border p-2 rounded-lg">Chiudi</button></section>';el('safety-partecipazione-close')?.addEventListener('click',close);}
}
window.SafetyPartecipazione={open,close,update,labels};window.apriSegnalazioneIscrizione=open;
})();