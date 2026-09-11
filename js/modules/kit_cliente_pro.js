// STEP 19 - Kit cliente professionale / situazione formativa
(function(){
  if(window.__safetyKitClienteProLoaded) return;
  window.__safetyKitClienteProLoaded=true;
  const esc=v=>window.dashEscape?window.dashEscape(v):String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const parse=v=>{if(!v)return null;const d=new Date(String(v).slice(0,10)+'T00:00:00');return Number.isNaN(d.getTime())?null:d;};
  const today=()=>{const d=new Date();d.setHours(0,0,0,0);return d;};
  const days=v=>{const d=parse(v);if(!d)return null;return Math.ceil((d-today())/86400000);};
  const fmt=v=>!v?'-':(window.formatDataToItalian?window.formatDataToItalian(String(v).slice(0,10)):String(v).slice(0,10));

  window.initKitClientePro = async function(){
    const sel=document.getElementById('kit-pro-company');
    if(!sel)return;
    try{
      const aziende=typeof window.getAziende==='function'?await window.getAziende():[];
      sel.innerHTML='<option value="">-- Seleziona azienda --</option>'+aziende.map(a=>`<option value="${esc(a.id)}">${esc(a.ragione_sociale||'Azienda')}</option>`).join('');
      if(window.kitSelectedCompanyId){sel.value=window.kitSelectedCompanyId;await window.renderKitClientePro();}
    }catch(e){console.warn('Kit cliente pro non inizializzato',e);}
  };

  window.renderKitClientePro = async function(){
    const id=document.getElementById('kit-pro-company')?.value||''; const box=document.getElementById('kit-pro-summary'); if(!box)return;
    if(!id){box.innerHTML='<div class="p-6 text-center text-slate-500">Seleziona un’azienda per vedere situazione formativa, attestati, scadenze e documenti.</div>';return;}
    box.innerHTML='<div class="p-6 text-center text-slate-400"><i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto mb-2"></i>Analisi cliente...</div>';if(window.lucide)lucide.createIcons();
    try{
      const data=typeof window.getSchedaClienteCommittenteData==='function'?await window.getSchedaClienteCommittenteData(id):null;
      if(!data)throw new Error('Dati cliente non disponibili.');
      window.kitClienteProData=data;
      const rows=data.rows||[]; const projects=data.progetti||[];
      const expiring=rows.filter(r=>{const d=days(r.scadenza_attestato);return d!==null&&d>=0&&d<=90;});
      const expired=rows.filter(r=>{const d=days(r.scadenza_attestato);return d!==null&&d<0;});
      const missingDocs=projects.filter(p=>!p.documenti_firmati_url).length;
      const uniqueCourses=new Set(rows.map(r=>r.codice_corso||r.corso).filter(Boolean)).size;
      const card=(t,v,s,tone,icon)=>`<div class="rounded-2xl border border-${tone}-200 bg-${tone}-50 p-4"><div class="flex items-start justify-between"><div><p class="text-[9px] font-black uppercase tracking-widest text-${tone}-800">${esc(t)}</p><p class="text-2xl font-black text-slate-900 mt-1">${esc(v)}</p></div><i data-lucide="${icon}" class="w-5 h-5 text-${tone}-700"></i></div><p class="text-[10px] text-slate-600 mt-2">${esc(s)}</p></div>`;
      const renewalRows=[...expired,...expiring].sort((a,b)=>(parse(a.scadenza_attestato)||0)-(parse(b.scadenza_attestato)||0));
      box.innerHTML=`<div class="grid grid-cols-2 xl:grid-cols-5 gap-3 mb-4">${card('Corsi',projects.length,`${uniqueCourses} tipologie`,'blue','graduation-cap')}${card('Corsisti',data.stats?.corsisti||0,'Persone uniche formate','emerald','users')}${card('Attestati',data.stats?.attestati||0,'ID certificati presenti','indigo','badge-check')}${card('Rinnovi 90gg',expiring.length,`${expired.length} già scaduti`,'amber','bell-ring')}${card('Documenti mancanti',missingDocs,'Progetti senza scansioni/link','rose','folder-warning')}</div><div class="grid grid-cols-1 xl:grid-cols-2 gap-4"><div class="bg-white rounded-2xl border border-slate-200 overflow-hidden"><div class="p-4 border-b bg-slate-50"><h3 class="font-black uppercase text-sm">Profilo cliente</h3></div><div class="p-4 text-xs space-y-2"><p><strong>Ragione sociale:</strong> ${esc(data.subject?.ragione_sociale||'-')}</p><p><strong>P.IVA / C.F.:</strong> ${esc(data.subject?.piva_cf||'-')}</p><p><strong>Sede:</strong> ${esc(data.subject?.sede_operativa||data.subject?.indirizzo||'-')}</p><p><strong>ATECO:</strong> ${esc(data.subject?.ateco||'-')}</p><p><strong>Referente:</strong> ${esc(data.subject?.referente||'-')}</p></div></div><div class="bg-white rounded-2xl border border-slate-200 overflow-hidden"><div class="p-4 border-b bg-slate-50 flex items-center justify-between"><h3 class="font-black uppercase text-sm">Rinnovi prioritari</h3><span class="text-[9px] font-black uppercase text-slate-400">${renewalRows.length} elementi</span></div><div class="p-4 space-y-2 max-h-[260px] overflow-y-auto">${renewalRows.length?renewalRows.slice(0,12).map(r=>{const d=days(r.scadenza_attestato);const tone=d<0?'rose':'amber';return `<div class="rounded-xl border border-${tone}-200 bg-${tone}-50 p-3"><div class="flex items-center justify-between gap-2"><div><p class="font-black text-xs uppercase">${esc(r.corsista||'-')}</p><p class="text-[10px] text-slate-600">${esc(r.corso||'-')}</p></div><span class="text-[9px] font-black uppercase text-${tone}-800">${d<0?`Scaduto ${Math.abs(d)}g`:`${d}g`}</span></div><p class="text-[9px] text-slate-500 mt-1">Scadenza ${esc(fmt(r.scadenza_attestato))}</p></div>`;}).join(''):'<div class="p-5 text-center text-emerald-700 font-bold">Nessun rinnovo urgente entro 90 giorni.</div>'}</div></div></div>`;
      const btns=['kit-pro-pdf','kit-pro-xls','kit-pro-renewals'];btns.forEach(x=>{const e=document.getElementById(x);if(e)e.disabled=false;});
      if(window.lucide)lucide.createIcons();
    }catch(e){box.innerHTML=`<div class="p-5 rounded-2xl border border-rose-200 bg-rose-50 text-rose-900">Errore analisi cliente: ${esc(e.message||e)}</div>`;}
  };

  window.stampaKitClientePro = async function(){const id=document.getElementById('kit-pro-company')?.value||'';if(!id)return alert('Seleziona un’azienda.');if(typeof window.stampaSchedaClienteCommittente==='function')return window.stampaSchedaClienteCommittente(id);alert('Funzione PDF cliente non disponibile.');};
  window.exportKitClienteProXls = async function(){const id=document.getElementById('kit-pro-company')?.value||'';if(!id)return alert('Seleziona un’azienda.');if(typeof window.esportaSchedaClienteCommittenteXLS==='function')return window.esportaSchedaClienteCommittenteXLS(id);alert('Funzione XLS cliente non disponibile.');};

  window.exportKitRinnoviXlsx = function(){
    const data=window.kitClienteProData;if(!data)return alert('Analizza prima un cliente.');if(typeof XLSX==='undefined')return alert('Libreria XLSX non disponibile.');
    const rows=(data.rows||[]).filter(r=>{const d=days(r.scadenza_attestato);return d!==null&&d<=90;}).map(r=>({'Corsista':r.corsista||'','Codice fiscale':r.cf||'','Mansione':r.mansione||'','Corso':r.corso||'','Codice corso':r.codice_corso||'','ID attestato':r.id_certificato||'','Data attestato':r.data_attestato||'','Scadenza':r.scadenza_attestato||'','Giorni alla scadenza':days(r.scadenza_attestato),'Esito':r.esito||''}));
    if(!rows.length)return alert('Nessun attestato scaduto o in scadenza entro 90 giorni.');
    const wb=XLSX.utils.book_new();const ws=XLSX.utils.json_to_sheet(rows);ws['!cols']=[{wch:28},{wch:20},{wch:24},{wch:38},{wch:16},{wch:24},{wch:14},{wch:14},{wch:20},{wch:14}];XLSX.utils.book_append_sheet(wb,ws,'Rinnovi');
    const name=String(data.subject?.ragione_sociale||'cliente').replace(/[^a-z0-9_-]+/gi,'_').slice(0,60);XLSX.writeFile(wb,`Rinnovi_${name}_${new Date().toISOString().slice(0,10)}.xlsx`);
  };
})();