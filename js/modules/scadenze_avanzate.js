// STEP 18 - Scadenziario avanzato + suggerimenti non bloccanti
(function(){
  if(window.__safetyScadenzeAvanzateLoaded) return;
  window.__safetyScadenzeAvanzateLoaded=true;
  const esc=v=>window.dashEscape?window.dashEscape(v):String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const norm=v=>String(v??'').trim().toLowerCase();
  const parse=v=>{if(!v)return null;const d=new Date(String(v).slice(0,10)+'T00:00:00');return Number.isNaN(d.getTime())?null:d;};
  const today=()=>{const d=new Date();d.setHours(0,0,0,0);return d;};
  const days=v=>{const d=parse(v);if(!d)return null;return Math.ceil((d-today())/86400000);};
  const fmt=v=>!v?'-':(window.formatDataToItalian?window.formatDataToItalian(String(v).slice(0,10)):String(v).slice(0,10));
  const effective=i=>i.data_scadenza||i._expirySuggestion?.date||null;

  window.fetchScadenzeData = async function(){
    const {data,error}=await window.supabaseClient.from('iscrizioni').select(`id,progetto_id,corsista_id,data_scadenza,id_certificato,esito,percentuale_frequenza,corsisti(id,nome_cognome,cf,azienda_id,aziende(id,ragione_sociale,referente)),progetti(id,codice,corso_id,data_esame,azienda_id,aziende(id,ragione_sociale))`);
    if(error){console.error('Errore recupero scadenze',error);return[];}
    const rows=data||[];
    if(window.TrainingHistoryAdvisor?.loadNormativeRules) await window.TrainingHistoryAdvisor.loadNormativeRules();
    for(const row of rows){
      row._expirySuggestion=window.TrainingHistoryAdvisor?.getExpirySuggestion ? await window.TrainingHistoryAdvisor.getExpirySuggestion(row) : null;
    }
    return rows.filter(i=>i.data_scadenza||i._expirySuggestion?.date).sort((a,b)=>String(effective(a)||'9999-12-31').localeCompare(String(effective(b)||'9999-12-31')));
  };

  const fillCompanies=rows=>{
    const sel=document.getElementById('filter-scadenze-azienda'); if(!sel)return;
    const prev=sel.value; const map=new Map();
    rows.forEach(i=>{const a=i.corsisti?.aziende||i.progetti?.aziende;if(a?.id)map.set(a.id,a.ragione_sociale||a.id);});
    sel.innerHTML='<option value="">Tutte le aziende</option>'+[...map.entries()].sort((a,b)=>a[1].localeCompare(b[1])).map(([id,n])=>`<option value="${esc(id)}">${esc(n)}</option>`).join(''); sel.value=prev;
  };

  window.loadScadenzeTable=async function(){
    const tb=document.getElementById('tabella-scadenze'); if(!tb)return;
    tb.innerHTML='<tr><td colspan="9" class="p-6 text-center text-slate-400"><i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto mb-2"></i>Calcolo scadenze registrate e suggerite...</td></tr>';
    window.allScadenzeList=await window.fetchScadenzeData(); fillCompanies(window.allScadenzeList); window.renderScadenzeTable(); if(window.lucide)lucide.createIcons();
  };

  const filteredRows=()=>{
    const rows=window.allScadenzeList||[];
    const horizon=Number(document.getElementById('filter-giorni')?.value||9999);
    const status=document.getElementById('filter-scadenze-stato')?.value||'';
    const azienda=document.getElementById('filter-scadenze-azienda')?.value||'';
    const q=norm(document.getElementById('search-scadenze')?.value||'');
    return rows.filter(i=>{
      const dd=days(effective(i)); if(dd===null)return false;
      if(horizon!==9999 && dd>horizon)return false;
      if(status==='expired' && dd>=0)return false;
      if(status==='active' && dd<0)return false;
      if(status==='30' && !(dd>=0&&dd<=30))return false;
      if(status==='31_90' && !(dd>=31&&dd<=90))return false;
      if(status==='91_180' && !(dd>=91&&dd<=180))return false;
      const a=i.corsisti?.aziende||i.progetti?.aziende; if(azienda && a?.id!==azienda)return false;
      if(q){const c=i.progetti?.corso_id||'';const title=window.DB_CORSI?.[c]?.t||c;const hay=`${i.corsisti?.nome_cognome||''} ${i.corsisti?.cf||''} ${a?.ragione_sociale||''} ${title} ${i.id_certificato||''}`.toLowerCase();if(!hay.includes(q))return false;}
      return true;
    });
  };

  const renderStats=rows=>{
    const all=window.allScadenzeList||[];
    const cnt=fn=>all.filter(fn).length;
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
    set('scad-stat-visible',rows.length);
    set('scad-stat-expired',cnt(i=>days(effective(i))<0));
    set('scad-stat-30',cnt(i=>{const d=days(effective(i));return d>=0&&d<=30;}));
    set('scad-stat-90',cnt(i=>{const d=days(effective(i));return d>=0&&d<=90;}));
  };

  const suggestionCell=i=>{
    const s=i._expirySuggestion;
    if(!s)return '<span class="text-slate-400 text-[9px]">Non calcolabile</span>';
    const meta=s.status==='aligned'
      ? ['Allineata','bg-emerald-50 text-emerald-800 border-emerald-100']
      : s.status==='missing'
        ? ['Solo suggerita','bg-blue-50 text-blue-800 border-blue-100']
        : [`Differenza ${Math.abs(s.deltaDays||0)} gg`, 'bg-amber-50 text-amber-900 border-amber-100'];
    return `<p class="font-black text-blue-950">${esc(fmt(s.date))}</p>
      <span class="inline-block mt-1 px-2 py-1 rounded-full border text-[8px] font-black uppercase ${meta[1]}">${esc(meta[0])}</span>
      <p class="mt-1 text-[8px] text-slate-400">${esc(s.source)}${s.ruleCode?' · '+esc(s.ruleCode):''}</p>`;
  };

  window.renderScadenzeTable=function(){
    const tb=document.getElementById('tabella-scadenze');if(!tb)return; const rows=filteredRows();renderStats(rows);
    if(!rows.length){tb.innerHTML='<tr><td colspan="9" class="p-8 text-center text-slate-500">Nessuna scadenza trovata con i filtri attuali.</td></tr>';return;}
    tb.innerHTML=rows.map(i=>{
      const eff=effective(i), d=days(eff); const tone=d<0?'rose':d<=30?'red':d<=90?'amber':d<=180?'blue':'emerald'; const label=d<0?`Scaduto da ${Math.abs(d)} gg`:d===0?'Scade oggi':`Tra ${d} gg`;
      const a=i.corsisti?.aziende||i.progetti?.aziende||{}; const cid=i.progetti?.corso_id||''; const title=window.DB_CORSI?.[cid]?.t||cid;
      const actual=i.data_scadenza
        ? `<p class="font-black text-slate-900">${esc(fmt(i.data_scadenza))}</p><span class="inline-block mt-1 px-2 py-1 rounded-full bg-${tone}-50 text-${tone}-800 border border-${tone}-100 text-[8px] font-black uppercase">${esc(label)}</span>`
        : '<span class="inline-block px-2 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[8px] font-black uppercase">Non registrata</span>';
      return `<tr class="border-b border-slate-100 hover:bg-slate-50">
        <td class="p-3"><p class="font-black text-slate-900">${esc(i.corsisti?.nome_cognome||'-')}</p><p class="font-mono text-[9px] text-slate-400">${esc(i.corsisti?.cf||'')}</p></td>
        <td class="p-3"><p class="font-bold text-slate-700">${esc(title)}</p><p class="font-mono text-[9px] text-slate-400">${esc(i.progetti?.codice||'')}</p></td>
        <td class="p-3 text-center text-[10px]">${esc(fmt(i.progetti?.data_esame))}</td>
        <td class="p-3 text-center">${actual}</td>
        <td class="p-3 text-center">${suggestionCell(i)}</td>
        <td class="p-3"><p class="font-black uppercase text-blue-900 text-[10px]">${esc(a.ragione_sociale||'Privato')}</p><p class="text-[9px] text-slate-400">${esc(a.referente||'')}</p></td>
        <td class="p-3 font-mono text-[9px] text-slate-600">${esc(i.id_certificato||'-')}</td>
        <td class="p-3 text-[10px]">${esc(i.esito||'-')}</td>
        <td class="p-3 text-right"><button onclick="window.preparaRinnovoScadenza('${esc(i.id)}')" class="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-100 text-[9px] font-black uppercase">Prepara rinnovo</button></td>
      </tr>`;
    }).join(''); if(window.lucide)lucide.createIcons();
    if(window.syncResponsiveTableCards)window.syncResponsiveTableCards(document.querySelector('table[data-responsive-cards="scadenze-mobile-cards"]'));
  };

  window.refreshScadenze=async()=>{window.allScadenzeList=[];await window.loadScadenzeTable();};

  window.exportScadenzeXlsx=function(){
    const rows=filteredRows(); if(!rows.length)return alert('Nessuna scadenza da esportare.'); if(typeof XLSX==='undefined')return alert('Libreria XLSX non disponibile.');
    const data=rows.map(i=>{const a=i.corsisti?.aziende||i.progetti?.aziende||{};const cid=i.progetti?.corso_id||'';const s=i._expirySuggestion;return {
      'Corsista':i.corsisti?.nome_cognome||'','Codice fiscale':i.corsisti?.cf||'','Azienda':a.ragione_sociale||'','Corso':window.DB_CORSI?.[cid]?.t||cid,
      'Codice progetto':i.progetti?.codice||'','Data verifica':i.progetti?.data_esame||'','Scadenza registrata':i.data_scadenza||'',
      'Scadenza suggerita':s?.date||'','Fonte suggerimento':s?.source||'','Differenza giorni':s?.deltaDays??'','Scadenza usata per filtro':effective(i)||'',
      'Giorni alla scadenza':days(effective(i)),'ID attestato':i.id_certificato||'','Esito':i.esito||''
    };});
    const wb=XLSX.utils.book_new();const ws=XLSX.utils.json_to_sheet(data);ws['!cols']=[{wch:28},{wch:20},{wch:28},{wch:38},{wch:18},{wch:14},{wch:18},{wch:18},{wch:26},{wch:16},{wch:18},{wch:18},{wch:24},{wch:14}];XLSX.utils.book_append_sheet(wb,ws,'Scadenze');XLSX.writeFile(wb,`Scadenze_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  window.preparaRinnovoScadenza=async function(iscrizioneId){
    const i=(window.allScadenzeList||[]).find(x=>x.id===iscrizioneId);if(!i)return alert('Scadenza non trovata.');
    const chosen=i.data_scadenza||i._expirySuggestion?.date||'';
    window.safetyRenewalDraft={source_iscrizione_id:i.id,source_progetto_id:i.progetto_id,corsista_id:i.corsista_id,azienda_id:i.corsisti?.azienda_id||i.progetti?.azienda_id||null,corso_precedente:i.progetti?.corso_id||'',scadenza:chosen,scadenza_source:i.data_scadenza?'registrata':'suggerita',corsista:i.corsisti?.nome_cognome||''};
    try{localStorage.setItem('SafetyManager.renewalDraft.v1',JSON.stringify(window.safetyRenewalDraft));}catch(e){}
    if(window.safetyAudit)await window.safetyAudit('renewal_prepared',{table_name:'iscrizioni',record_id:i.id,details:{project_id:i.progetto_id,corsista:i.corsisti?.nome_cognome||'',scadenza:chosen,source:window.safetyRenewalDraft.scadenza_source}});
    await window.loadModule('progetti');
    const sourceLabel=window.safetyRenewalDraft.scadenza_source==='suggerita'?' usando la data suggerita come promemoria':'';
    const msg=`Bozza rinnovo preparata per ${i.corsisti?.nome_cognome||'corsista'} (${window.DB_CORSI?.[i.progetti?.corso_id]?.t||i.progetti?.corso_id||'corso'})${sourceLabel}. La creazione del nuovo progetto resta sotto controllo dell'operatore.`;
    if(window.showSafetyToast)window.showSafetyToast(msg,{type:'ok',title:'Rinnovo'});else alert(msg);
  };
})();