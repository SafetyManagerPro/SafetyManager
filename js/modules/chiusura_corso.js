// STEP 17 + STEP 67 - Chiusura corso guidata e intelligente
// Scrive solo dopo conferma esplicita. Nessuna cancellazione automatica.
// Le verifiche sono assistive: segnalano criticità ma non bloccano la chiusura.
(function(){
  if (window.__safetyChiusuraCorsoLoaded) return;
  window.__safetyChiusuraCorsoLoaded = true;

  const esc = v => window.dashEscape ? window.dashEscape(v) : String(v ?? '').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
  const norm = v => String(v ?? '').trim().toLowerCase();
  const ok = v => v !== null && v !== undefined && String(v).trim() !== '' && String(v).trim() !== '---';
  const todayIso = () => new Date().toISOString().slice(0,10);
  const parseDate = v => { if(!v) return null; const d=new Date(String(v).slice(0,10)+'T00:00:00'); return Number.isNaN(d.getTime())?null:d; };
  const fmt = v => !v ? '-' : (window.formatDataToItalian ? window.formatDataToItalian(String(v).slice(0,10)) : String(v).slice(0,10));
  const past = v => { const d=parseDate(v); if(!d) return false; const t=new Date(); t.setHours(0,0,0,0); return d<=t; };
  const isIdoneo = v => { const s=norm(v); return !!s && !s.includes('non idoneo') && !s.includes('non-idoneo') && (s.includes('idoneo') || s.includes('superato') || s.includes('ammesso')); };
  const addYears = (iso, years) => { const d=parseDate(iso); if(!d || !Number.isFinite(Number(years))) return ''; d.setFullYear(d.getFullYear()+Number(years)); return d.toISOString().slice(0,10); };
  const course = p => window.DB_CORSI?.[p?.corso_id] || {};

  const modal = () => {
    let m=document.getElementById('safety-close-course-modal');
    if(!m){ m=document.createElement('div'); m.id='safety-close-course-modal'; m.className='fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-sm hidden p-3 md:p-6 items-center justify-center'; m.onclick=e=>{if(e.target===m) window.closeChiusuraCorsoModal();}; document.body.appendChild(m); }
    return m;
  };
  window.closeChiusuraCorsoModal = function(){ const m=document.getElementById('safety-close-course-modal'); if(m){m.classList.add('hidden');m.classList.remove('flex');m.innerHTML='';} };

  const projectList = async () => typeof window.getProgetti === 'function' ? await window.getProgetti() : [];
  const iscrittiFor = async id => typeof window.getIscrizioni === 'function' ? await window.getIscrizioni(id) : [];

  const validateLegacy = (p, iscritti) => {
    const blockers=[]; const warnings=[]; const fixes=[];
    const c=course(p); const scad=Number(c.scad);
    if(!past(p.data_esame)) blockers.push('La data verifica/fine corso non è ancora trascorsa.');
    if(!iscritti.length) blockers.push('Nessun corsista associato al corso.');
    iscritti.forEach((i,idx)=>{
      const name=i.corsisti?.nome_cognome || `Corsista ${idx+1}`;
      const perc=i.percentuale_frequenza;
      if(perc===null || perc===undefined || perc==='') blockers.push(`${name}: percentuale frequenza mancante.`);
      if(!ok(i.esito)) blockers.push(`${name}: esito finale mancante.`);
      if(!ok(i.voto_test) && !ok(i.note_verifica)) blockers.push(`${name}: stato/esito della verifica cartacea da registrare.`);
      if(isIdoneo(i.esito) && Number(perc)<90) blockers.push(`${name}: risulta idoneo ma frequenza inferiore al 90%.`);
      if(isIdoneo(i.esito) && !ok(i.id_certificato)) fixes.push({type:'id', iscrizione:i, name});
      if(isIdoneo(i.esito) && Number.isFinite(scad) && scad>0 && scad<99 && !ok(i.data_scadenza)) fixes.push({type:'scadenza', iscrizione:i, name, value:addYears(p.data_esame,scad)});
    });
    if(!ok(p.documenti_firmati_url)) warnings.push('Stato della documentazione cartacea/scansione da registrare; il corso può essere stato svolto anche senza un file digitale.');
    if(!ok(p.note_chiusura)) warnings.push('Nessuna nota di chiusura presente.');
    return {blockers,warnings,fixes};
  };

  const validationFromState=(state,p,iscritti)=>{
    const legacy=validateLegacy(p,iscritti);
    if(!state) return {...legacy,errori:legacy.blockers.map(detail=>({detail})),daCompletare:[],daAcquisire:[],avvisi:legacy.warnings.map(detail=>({detail})),nonApplicabili:[],canClose:legacy.blockers.length===0};
    return {
      state,fixes:legacy.fixes,
      blockers:state.errori.map(x=>x.detail),warnings:state.avvisi.map(x=>x.detail),
      errori:state.errori,daCompletare:state.daCompletare,daAcquisire:state.daAcquisire,
      avvisi:state.avvisi,nonApplicabili:state.nonApplicabili,canClose:state.canClose
    };
  };

  const advisoryMeta=v=>{
    const critical=(v.errori?.length||0)+(v.daCompletare?.length||0);
    const pending=v.daAcquisire?.length||0;
    const warnings=v.avvisi?.length||0;
    if(critical) return {tone:'rose',label:`Chiudibile con ${critical} criticità`,detail:'Le criticità sono segnalate ma non bloccano la chiusura.'};
    if(pending||warnings) return {tone:'amber',label:`Chiudibile con ${pending+warnings} avvisi`,detail:'Ci sono elementi da acquisire o verificare, ma la chiusura resta disponibile.'};
    return {tone:'emerald',label:'Pronto alla chiusura',detail:'Nessuna criticità rilevata.'};
  };

  const renderIssueList=(title,items,tone)=>items?.length?`<div class="rounded-2xl border border-${tone}-200 bg-${tone}-50 p-4"><p class="font-black uppercase text-${tone}-900 text-xs mb-2">${esc(title)} · ${items.length}</p><ul class="space-y-2 text-xs text-${tone}-950">${items.map(x=>`<li class="flex items-start justify-between gap-3"><span>• ${esc(x.label?`${x.label}: ${x.detail}`:x.detail||x)}</span>${x.editable?`<button type="button" onclick="window.apriStep67ItemEditor('${esc(x.projectId)}','${esc(x.itemKey)}','${esc(x.iscrizioneId||'')}')" class="shrink-0 px-2 py-1 rounded-lg bg-white border border-${tone}-200 text-[8px] font-black uppercase">Aggiorna</button>`:''}</li>`).join('')}</ul></div>`:'';

  const buildGeneratedIds = async (p,iscritti) => {
    const { data } = await window.supabaseClient.from('iscrizioni').select('id_certificato').not('id_certificato','is',null);
    const used=new Set((data||[]).map(x=>String(x.id_certificato||'').trim()).filter(Boolean));
    const base=String(p.codice||'CORSO').replace(/[^A-Z0-9]+/gi,'-').replace(/^-|-$/g,'').toUpperCase().slice(0,24) || 'CORSO';
    const year=String(p.data_esame||todayIso()).slice(0,4);
    const map={};
    let seq=1;
    iscritti.forEach(i=>{
      if(!isIdoneo(i.esito) || ok(i.id_certificato)) return;
      let id='';
      do { id=`${base}-${year}-${String(seq++).padStart(3,'0')}`; } while(used.has(id));
      used.add(id); map[i.id]=id;
    });
    return map;
  };

  const projectLabel = p => `${p.codice || 'Senza codice'} · ${course(p).t || p.corso_id || 'Corso'}`;

  window.apriChiusuraCorsiGuidata = async function(){
    const m=modal(); m.classList.remove('hidden');m.classList.add('flex');
    m.innerHTML='<div class="bg-white rounded-3xl p-8 shadow-2xl text-center"><i data-lucide="loader-2" class="w-7 h-7 animate-spin mx-auto mb-2 text-emerald-600"></i><p class="font-black uppercase">Caricamento corsi da chiudere...</p></div>';
    if(window.lucide) lucide.createIcons();
    try{
      const projects=(await projectList()).filter(p=>norm(p.stato_corso)!=='chiuso' && past(p.data_esame));
      const map = projects.length && window.getIscrizioniPerProgetti ? await window.getIscrizioniPerProgetti(projects.map(p=>p.id)) : {};
      const states=window.SafetyStep67?await window.SafetyStep67.evaluateProjects(projects,map):{};
      m.innerHTML=`<div class="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"><div class="p-5 bg-slate-900 text-white flex items-center justify-between"><div><p class="text-[10px] font-black uppercase tracking-widest text-emerald-300">Step 17</p><h2 class="text-2xl font-black uppercase">Chiusura corso guidata</h2><p class="text-xs text-slate-300 mt-1">Guida non vincolante: le segnalazioni aiutano il controllo ma non impediscono la chiusura.</p></div><button onclick="window.closeChiusuraCorsoModal()" class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><i data-lucide="x" class="w-5 h-5"></i></button></div><div class="p-5 overflow-y-auto bg-slate-50 space-y-3">${projects.length ? projects.map(p=>{
        const val=validationFromState(states[p.id]||null,p,map[p.id]||[]); const meta=advisoryMeta(val);
        return `<div class="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"><div class="min-w-0"><div class="flex flex-wrap gap-2 mb-1"><span class="px-2 py-1 rounded-full bg-${meta.tone}-50 text-${meta.tone}-800 border border-${meta.tone}-100 text-[9px] font-black uppercase">${esc(meta.label)}</span><span class="text-[9px] uppercase font-black text-slate-400">${(map[p.id]||[]).length} corsisti</span>${val.state?`<span class="text-[9px] uppercase font-black text-cyan-700">${esc(val.state.postFormazione.label)}</span>`:''}</div><p class="font-black uppercase text-slate-900 truncate">${esc(projectLabel(p))}</p><p class="text-xs text-slate-500">Verifica ${esc(fmt(p.data_esame))} · ${esc(p.aziende?.ragione_sociale || 'Azienda non indicata')}</p><p class="text-[10px] mt-1 text-slate-500">${esc(meta.detail)}</p></div><button onclick="window.apriChiusuraCorso('${esc(p.id)}')" class="px-4 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">Verifica e chiudi</button></div>`;
      }).join(''):'<div class="p-8 text-center text-slate-500 font-bold uppercase">Nessun corso svolto da chiudere.</div>'}</div></div>`;
      if(window.lucide) lucide.createIcons();
    }catch(e){m.innerHTML=`<div class="bg-white rounded-3xl p-7 shadow-2xl text-rose-800"><p class="font-black uppercase">Errore chiusura guidata</p><p class="text-sm mt-2">${esc(e.message||e)}</p></div>`;}
  };

  window.apriChiusuraCorso = async function(projectId){
    const m=modal(); m.classList.remove('hidden');m.classList.add('flex');
    m.innerHTML='<div class="bg-white rounded-3xl p-8 shadow-2xl text-center"><i data-lucide="loader-2" class="w-7 h-7 animate-spin mx-auto mb-2"></i>Verifica dati...</div>';
    if(window.lucide) lucide.createIcons();
    const projects=await projectList(); const p=projects.find(x=>x.id===projectId); if(!p) return;
    const iscritti=await iscrittiFor(projectId);
    const state=window.SafetyStep67?await window.SafetyStep67.evaluateProject(p,iscritti):null;
    const v=validationFromState(state,p,iscritti); const c=course(p); const meta=advisoryMeta(v);
    const rows=iscritti.map(i=>{
      const freq=i.percentuale_frequenza; const good=isIdoneo(i.esito); const needs=[]; if(good&&!ok(i.id_certificato))needs.push('ID'); if(good&&Number(c.scad)>0&&Number(c.scad)<99&&!ok(i.data_scadenza))needs.push('scadenza');
      return `<tr class="border-b"><td class="p-2 font-bold">${esc(i.corsisti?.nome_cognome||'-')}</td><td class="p-2 text-center">${esc(freq??'-')}%</td><td class="p-2">${esc(i.esito||'-')}</td><td class="p-2">${esc(i.id_certificato||'-')}</td><td class="p-2">${esc(fmt(i.data_scadenza))}</td><td class="p-2 text-[9px] font-black uppercase ${needs.length?'text-amber-700':'text-emerald-700'}">${needs.length?'Genera '+needs.join(' + '):'OK'}</td></tr>`;
    }).join('');
    m.innerHTML=`<div class="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col">
      <div class="p-5 bg-slate-900 text-white flex items-center justify-between"><div><p class="text-[10px] font-black uppercase tracking-widest text-emerald-300">Step 67 · Chiusura guidata</p><h2 class="text-xl font-black uppercase">${esc(projectLabel(p))}</h2><p class="text-xs text-slate-300">Verifica ${esc(fmt(p.data_esame))} · ${esc(iscritti.length)} corsisti${state?` · ${esc(state.statoDidattico.replaceAll('_',' '))}`:''}</p></div><button onclick="window.closeChiusuraCorsoModal()" class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><i data-lucide="x" class="w-5 h-5"></i></button></div>
      <div class="p-5 overflow-y-auto bg-slate-50 space-y-4">
        <div class="rounded-2xl border border-${meta.tone}-200 bg-${meta.tone}-50 p-4"><div class="flex flex-wrap items-center justify-between gap-2"><div><p class="text-[10px] font-black uppercase text-${meta.tone}-900">${esc(meta.label)}</p><p class="text-xs text-${meta.tone}-800 mt-1">${esc(meta.detail)}</p></div><span class="px-3 py-1.5 rounded-full bg-white/80 border border-${meta.tone}-200 text-[9px] font-black uppercase text-${meta.tone}-800">Non vincolante</span></div></div>
        <div class="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div class="rounded-2xl border ${v.errori.length?'border-rose-200 bg-rose-50':'border-emerald-200 bg-emerald-50'} p-4"><p class="text-[9px] font-black uppercase">Criticità segnalate</p><p class="text-2xl font-black">${v.errori.length}</p></div>
          <div class="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p class="text-[9px] font-black uppercase">Da completare</p><p class="text-2xl font-black">${v.daCompletare.length}</p></div>
          <div class="rounded-2xl border border-blue-200 bg-blue-50 p-4"><p class="text-[9px] font-black uppercase">Da acquisire</p><p class="text-2xl font-black">${v.daAcquisire.length}</p></div>
          <div class="rounded-2xl border border-cyan-200 bg-cyan-50 p-4"><p class="text-[9px] font-black uppercase">Efficacia</p><p class="text-sm font-black mt-1">${esc(state?.postFormazione?.label||'Da verificare')}</p></div>
          <div class="rounded-2xl border border-slate-200 bg-white p-4"><p class="text-[9px] font-black uppercase">Validità corso</p><p class="text-sm font-black mt-1">${Number(c.scad)>=99?'Nessuna scadenza':Number(c.scad)>0?`${c.scad} anni`:'Da verificare'}</p></div>
        </div>
        ${renderIssueList('Criticità segnalate',v.errori,'rose')}${renderIssueList('Da completare',v.daCompletare,'amber')}${renderIssueList('Da acquisire',v.daAcquisire,'blue')}${renderIssueList('Avvisi',v.avvisi,'amber')}${renderIssueList('Non applicabile',v.nonApplicabili,'slate')}
        <div class="bg-white rounded-2xl border border-slate-200 overflow-x-auto"><table class="w-full text-xs"><thead class="bg-slate-900 text-white"><tr><th class="p-2 text-left">Corsista</th><th class="p-2">Freq.</th><th class="p-2 text-left">Esito</th><th class="p-2 text-left">ID attestato</th><th class="p-2 text-left">Scadenza</th><th class="p-2">Controllo</th></tr></thead><tbody>${rows}</tbody></table></div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4"><div><label class="text-[10px] font-black uppercase text-slate-500">Link/cartella documenti firmati <span class="normal-case font-normal">(opzionale)</span></label><input id="chiusura-docs-url" value="${esc(p.documenti_firmati_url||'')}" class="w-full mt-1 px-3 py-2 border rounded-xl" placeholder="https://... o percorso condiviso"></div><div><label class="text-[10px] font-black uppercase text-slate-500">Note chiusura / motivazione eccezioni <span class="normal-case font-normal">(consigliate, non obbligatorie)</span></label><textarea id="chiusura-note" class="w-full mt-1 px-3 py-2 border rounded-xl" rows="2">${esc(p.note_chiusura||'')}</textarea></div></div>
        <label class="rounded-2xl border border-blue-200 bg-blue-50 p-4 flex items-start gap-3 text-xs text-blue-950"><input id="chiusura-auto" type="checkbox" checked class="mt-0.5"><span><strong>Completa automaticamente i dati mancanti sicuri.</strong> Genera ID attestato per gli idonei senza ID e calcola le scadenze dalla data verifica.</span></label>
        <label class="rounded-2xl border border-slate-200 bg-white p-4 flex items-start gap-3 text-xs"><input id="chiusura-confirm" type="checkbox" class="mt-0.5"><span><strong>Confermo la chiusura.</strong> Ho verificato la situazione reale. So che le segnalazioni sopra sono informative e non impediscono la chiusura; gli elementi ancora aperti resteranno visibili nello Step 67.</span></label>
      </div>
      <div class="p-4 border-t bg-white flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"><div class="flex flex-wrap gap-2"><button onclick="window.preparaVaiStampe ? window.preparaVaiStampe('${esc(p.id)}') : window.loadModule('stampe')" class="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-800 border border-indigo-100 text-[10px] font-black uppercase">Stampe</button><button onclick="window.apriChecklistCorso && window.apriChecklistCorso('${esc(p.id)}')" class="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] font-black uppercase">Checklist</button></div><div class="flex flex-wrap gap-2 justify-end"><button onclick="window.segnaCorsoSvolto('${esc(p.id)}')" class="px-4 py-2 rounded-xl bg-amber-100 text-amber-900 text-[10px] font-black uppercase">Segna svolto</button><button onclick="window.confermaChiusuraCorso('${esc(p.id)}')" class="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase">Chiudi e archivia</button></div></div>
    </div>`;
    if(window.lucide) lucide.createIcons();
  };

  window.segnaCorsoSvolto = async function(projectId){
    if(!confirm('Segnare il corso come SVOLTO? Non verrà archiviato come chiuso.')) return;
    const { error }=await window.supabaseClient.from('progetti').update({stato_corso:'svolto'}).eq('id',projectId); if(error) return alert('Errore: '+error.message);
    if(window.safetyAudit) await window.safetyAudit('course_marked_done',{table_name:'progetti',record_id:projectId,details:{status:'svolto'}});
    if(window.showSafetyToast) window.showSafetyToast('Corso segnato come svolto.',{type:'ok',title:'Chiusura corso'}); else alert('Corso segnato come svolto.');
    window.closeChiusuraCorsoModal(); if(window.reloadLinkedViewsAfterMutation) await window.reloadLinkedViewsAfterMutation('corso svolto',{projectId});
  };

  window.confermaChiusuraCorso = async function(projectId){
    const confirmBox=document.getElementById('chiusura-confirm'); if(!confirmBox?.checked) return alert('Spunta la conferma finale prima di chiudere il corso.');
    const docs=(document.getElementById('chiusura-docs-url')?.value||'').trim();
    const note=(document.getElementById('chiusura-note')?.value||'').trim();
    const projects=await projectList(); const p=projects.find(x=>x.id===projectId); if(!p) return alert('Progetto non trovato.');
    const iscritti=await iscrittiFor(projectId);
    const state=window.SafetyStep67?await window.SafetyStep67.evaluateProject(p,iscritti):null;
    const v=validationFromState(state,p,iscritti);
    const counts={criticita:v.errori.length,da_completare:v.daCompletare.length,da_acquisire:v.daAcquisire.length,avvisi:v.avvisi.length};
    const openCount=counts.criticita+counts.da_completare+counts.da_acquisire+counts.avvisi;
    const confirmMessage=openCount
      ? `Sono presenti ${openCount} segnalazioni (${counts.criticita} criticità, ${counts.da_completare} da completare, ${counts.da_acquisire} da acquisire, ${counts.avvisi} avvisi). La guida non è vincolante e la chiusura è comunque consentita. Confermi la chiusura del corso?`
      : 'Confermi la chiusura del corso? I dati resteranno modificabili dall’archivio.';
    if(!confirm(confirmMessage)) return;
    const auto=document.getElementById('chiusura-auto')?.checked;
    const c=course(p); const scad=Number(c.scad); const generated=auto?await buildGeneratedIds(p,iscritti):{};
    try{
      if(auto){
        for(const i of iscritti){
          if(!isIdoneo(i.esito)) continue;
          const patch={};
          if(!ok(i.id_certificato) && generated[i.id]) patch.id_certificato=generated[i.id];
          if(!ok(i.data_scadenza) && Number.isFinite(scad) && scad>0 && scad<99) patch.data_scadenza=addYears(p.data_esame,scad);
          if(Object.keys(patch).length){ const {error}=await window.supabaseClient.from('iscrizioni').update(patch).eq('id',i.id); if(error) throw error; }
        }
      }
      const patch={stato_corso:'chiuso',documenti_firmati_url:docs||null,chiuso_at:todayIso(),note_chiusura:note||null};
      const {error}=await window.supabaseClient.from('progetti').update(patch).eq('id',projectId); if(error) throw error;
      if(docs&&window.SafetyStep67){
        try{await window.SafetyStep67.saveCompletionItem({projectId,itemKey:'signed_course_documents',mode:'paper',activity_status:'completed',recording_status:'recorded',evidence_status:'scan_available',evidence_url:docs,notes:'Sincronizzato dalla chiusura corso.'});}catch(error){console.warn('Step 67: sincronizzazione documenti non completata.',error);}
      }
      if(window.safetyAudit) await window.safetyAudit('course_closed',{table_name:'progetti',record_id:projectId,new_data:{...patch,generated_ids:Object.keys(generated).length,closure_mode:'advisory_non_blocking',closed_with_open_items:openCount>0,step67:{errori:v.errori.length,da_completare:v.daCompletare.length,da_acquisire:v.daAcquisire.length,avvisi:v.avvisi.length}}});
      if(window.showSafetyToast) window.showSafetyToast(openCount?'Corso chiuso. Le segnalazioni residue restano visibili nello Step 67.':'Corso chiuso e archiviato correttamente.',{type:'ok',title:'Chiusura completata'}); else alert('Corso chiuso e archiviato correttamente.');
      window.closeChiusuraCorsoModal(); if(window.reloadLinkedViewsAfterMutation) await window.reloadLinkedViewsAfterMutation('chiusura corso',{projectId});
    }catch(e){alert('Chiusura non completata: '+(e.message||e));}
  };
})();
