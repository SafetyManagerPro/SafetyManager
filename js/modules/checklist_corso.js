// STEP 10 - Checklist documentale corso
(function(){
  if(window.__safetyChecklistCorsoLoaded) return;
  window.__safetyChecklistCorsoLoaded = true;
  const esc=v=>window.dashEscape?window.dashEscape(v):String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const ok=v=>v!==null&&v!==undefined&&String(v).trim()!==''&&String(v).trim()!=='---';
  const norm=v=>String(v||'').trim().toLowerCase();
  const d=v=>{ if(!v) return null; const x=new Date(String(v).slice(0,10)+'T00:00:00'); return isNaN(x)?null:x; };
  const today=()=>{ const x=new Date(); x.setHours(0,0,0,0); return x; };
  const fmt=v=>!v?'-':(window.formatDataToItalian?window.formatDataToItalian(String(v).slice(0,10)):String(v).slice(0,10));
  const corso=p=>{ const c=window.DB_CORSI?.[p?.corso_id]; return c?(c.t||c.code||p.corso_id):(p?.corso_id||'Corso non indicato'); };
  const azienda=p=>p?.aziende?.ragione_sociale||p?.azienda_nome||'Azienda non collegata';
  const item=(label,done,detail,required=true)=>({label,done:!!done,detail:detail||'',required});

  window.buildSafetyCourseChecklist=function(p,iscritti=[]){
    p=p||{};
    const exam=d(p.data_esame), past=exam&&exam<=today(), closed=norm(p.stato_corso)==='chiuso', dl=p.ente_erogatore==='azienda';
    const noAnag=iscritti.filter(i=>!ok(i.corsisti?.nome_cognome)||!ok(i.corsisti?.cf));
    const noMans=iscritti.filter(i=>!ok(i.mansione_storica||i.corsisti?.mansione_storica));
    const mismatch=dl?iscritti.filter(i=>i.corsisti?.azienda_id&&p.azienda_id&&i.corsisti.azienda_id!==p.azienda_id):[];
    const noFreq=iscritti.filter(i=>i.percentuale_frequenza===null||i.percentuale_frequenza===undefined||i.percentuale_frequenza==='');
    const noTest=iscritti.filter(i=>!ok(i.voto_test)&&!ok(i.note_verifica));
    const noEsito=iscritti.filter(i=>!ok(i.esito));
    const noId=iscritti.filter(i=>norm(i.esito).includes('idoneo')&&!ok(i.id_certificato));
    const noScad=iscritti.filter(i=>norm(i.esito).includes('idoneo')&&!ok(i.data_scadenza));
    const groups=[
      {title:'Anagrafica corso',icon:'file-text',items:[
        item('Codice progetto',ok(p.codice),p.codice||'Manca codice progetto'),
        item('Corso da catalogo',ok(p.corso_id)&&!!window.DB_CORSI?.[p.corso_id],corso(p)),
        item('Azienda collegata',ok(p.azienda_id),azienda(p)),
        item('Sede / aula / campo prova',ok(p.sede),p.sede||'Sede mancante'),
        item('Modalità svolgimento',ok(p.modalita),p.modalita||'Modalità mancante'),
        item('Date corso',ok(p.data_inizio)&&ok(p.data_esame),`Inizio ${fmt(p.data_inizio)} · verifica ${fmt(p.data_esame)}`)
      ]},
      {title:'Responsabili e docenti',icon:'graduation-cap',items:[
        item('Responsabile progetto formativo',ok(p.resp_progetto),p.resp_progetto||'Campo mancante'),
        item('Responsabile del corso',ok(p.resp_corso),p.resp_corso||'Campo mancante'),
        item('Docenti assegnati',ok(p.docenti_ud)||ok(p.docente_principale),'Docente principale o docenti UD'),
        item('Tutor / riesame quando previsti',ok(p.tutor_previsto)||!corso(p).toLowerCase().includes('apprendist'),p.tutor_previsto||'Controllo consigliato',false)
      ]},
      {title:'Corsisti',icon:'users',items:[
        item('Corsisti associati',iscritti.length>0,iscritti.length?`${iscritti.length} corsisti collegati`:'Associa almeno un corsista'),
        item('Nome e codice fiscale',iscritti.length>0&&noAnag.length===0,noAnag.length?`${noAnag.length} anagrafiche incomplete`:'Anagrafiche complete'),
        item('Mansioni presenti',iscritti.length>0&&noMans.length===0,noMans.length?`${noMans.length} mansioni mancanti`:'Mansioni complete',false),
        item('Coerenza azienda/corsisti',mismatch.length===0,mismatch.length?`${mismatch.length} corsisti non coerenti con azienda corso`:'Controllo superato',dl)
      ]},
      {title:'Esiti e chiusura',icon:'check-circle',items:[
        item('Chiusura corso',!closed||ok(p.chiuso_at),closed?`Chiuso il ${fmt(p.chiuso_at)}`:(past?'Data verifica trascorsa: chiusura da valutare':'Non ancora da chiudere'),closed||past),
        item('Frequenze registrate',!past||noFreq.length===0,noFreq.length?`${noFreq.length} frequenze mancanti`:'Frequenze presenti',past),
        item('Test/verifica registrata',!past||noTest.length===0,noTest.length?`${noTest.length} verifiche mancanti`:'Verifiche presenti',past),
        item('Esiti finali',!past||noEsito.length===0,noEsito.length?`${noEsito.length} esiti mancanti`:'Esiti presenti',past),
        item('ID certificati idonei',!past||noId.length===0,noId.length?`${noId.length} ID mancanti`:'ID presenti',past),
        item('Scadenze attestati',!past||noScad.length===0,noScad.length?`${noScad.length} scadenze mancanti`:'Scadenze presenti',past)
      ]},
      {title:'Documenti e archivio',icon:'folder-check',items:[
        item('Progetto formativo stampabile',ok(p.codice)&&ok(p.corso_id)&&ok(p.azienda_id)&&ok(p.data_inizio)&&ok(p.sede),'Dati minimi per il progetto'),
        item('Registro presenze stampabile',ok(p.codice)&&ok(p.data_inizio)&&iscritti.length>0,'Richiede corso, data e corsisti'),
        item('Test e correttori stampabili',ok(p.corso_id)&&iscritti.length>0,'Test manuali/correttori disponibili in stampa'),
        item('Verbale finale',!past||ok(p.data_esame)&&iscritti.length>0,'Da usare a fine corso',past),
        item('Attestati generabili',!past||(noEsito.length===0&&noId.length===0),'Richiede esiti e ID certificato',past),
        item('Scansione documenti firmati',!closed||ok(p.documenti_firmati_url),p.documenti_firmati_url||'Richiesta solo a corso chiuso',closed)
      ]}
    ];
    const all=groups.flatMap(g=>g.items), req=all.filter(i=>i.required!==false), done=req.filter(i=>i.done).length;
    const errors=req.filter(i=>!i.done).length, warnings=all.filter(i=>i.required===false&&!i.done).length;
    const percent=req.length?Math.round(done/req.length*100):100;
    const status=errors?{label:'Da completare',tone:'rose',icon:'alert-triangle'}:warnings?{label:'Controllo consigliato',tone:'amber',icon:'alert-triangle'}:{label:'Pronto',tone:'emerald',icon:'check-circle'};
    return {project:p,groups,done,total:req.length,errors,warnings,percent,status};
  };

  const row=i=>{ const tone=i.done?'emerald':(i.required===false?'amber':'rose'), icon=i.done?'check-circle':(i.required===false?'alert-triangle':'x-circle'); return `<div class="rounded-xl border border-${tone}-100 bg-${tone}-50/70 p-3 flex gap-3"><span class="w-8 h-8 rounded-lg bg-white border border-${tone}-200 text-${tone}-700 flex items-center justify-center shrink-0"><i data-lucide="${icon}" class="w-4 h-4"></i></span><div><p class="font-black text-xs uppercase text-slate-900">${esc(i.label)}${i.required===false?' <span class="text-[8px] text-slate-400">/ consigliato</span>':''}</p><p class="text-[11px] text-slate-600 mt-0.5">${esc(i.detail||'')}</p></div></div>`; };
  const modal=()=>{ let m=document.getElementById('safety-checklist-modal'); if(!m){ m=document.createElement('div'); m.id='safety-checklist-modal'; m.className='fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-sm hidden p-3 md:p-6 items-center justify-center'; m.onclick=e=>{if(e.target===m)window.closeSafetyChecklistModal();}; document.body.appendChild(m);} return m; };
  window.closeSafetyChecklistModal=function(){ const m=document.getElementById('safety-checklist-modal'); if(m){m.classList.add('hidden');m.classList.remove('flex');m.innerHTML='';} };
  const getProject=async id=>{ const list=(window.progettiList&&window.progettiList.length)?window.progettiList:(window.getProgetti?await window.getProgetti():[]); return list.find(p=>p.id===id); };

  window.apriChecklistCorso=async function(projectId){
    const m=modal(); m.classList.remove('hidden'); m.classList.add('flex');
    m.innerHTML='<div class="bg-white rounded-3xl shadow-2xl p-8 text-center"><i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600"></i><p class="font-black uppercase">Caricamento checklist...</p></div>'; if(window.lucide) lucide.createIcons();
    try{
      const p=await getProject(projectId); if(!p) throw new Error('Progetto non trovato');
      const iscritti=window.getIscrizioni?await window.getIscrizioni(projectId):[];
      const data=window.buildSafetyCourseChecklist(p,iscritti||[]), s=data.status;
      m.innerHTML=`<div class="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[88vh] overflow-hidden flex flex-col"><div class="p-5 md:p-6 bg-slate-900 text-white flex justify-between gap-4"><div><p class="text-[10px] font-black uppercase tracking-widest text-blue-200">Checklist documentale corso</p><h2 class="text-2xl font-black uppercase truncate">${esc(p.codice||'Senza codice')}</h2><p class="text-sm text-slate-300 truncate">${esc(corso(p))} · ${esc(azienda(p))}</p></div><button onclick="window.closeSafetyChecklistModal()" class="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center"><i data-lucide="x" class="w-5 h-5"></i></button></div><div class="p-5 overflow-y-auto bg-slate-50"><div class="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5"><div class="rounded-2xl border border-${s.tone}-200 bg-${s.tone}-50 p-4"><p class="text-[10px] font-black uppercase text-${s.tone}-800">Stato</p><p class="font-black text-slate-900 mt-1">${esc(s.label)}</p></div><div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><p class="text-[10px] font-black uppercase text-emerald-800">Completati</p><p class="font-black text-slate-900 mt-1">${data.done}/${data.total}</p></div><div class="rounded-2xl border border-rose-200 bg-rose-50 p-4"><p class="text-[10px] font-black uppercase text-rose-800">Da completare</p><p class="font-black text-slate-900 mt-1">${data.errors}</p></div><div class="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p class="text-[10px] font-black uppercase text-amber-800">Avvisi</p><p class="font-black text-slate-900 mt-1">${data.warnings}</p></div></div><div class="w-full bg-slate-200 rounded-full h-3 mb-6 overflow-hidden"><div class="h-full bg-${s.tone}-500 rounded-full" style="width:${Math.max(4,data.percent)}%"></div></div><div class="grid grid-cols-1 xl:grid-cols-2 gap-4">${data.groups.map(g=>`<section class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"><div class="p-4 border-b border-slate-100 flex items-center gap-2"><i data-lucide="${g.icon}" class="w-4 h-4 text-slate-700"></i><h3 class="font-black text-sm uppercase text-slate-900">${esc(g.title)}</h3></div><div class="p-4 space-y-2">${g.items.map(row).join('')}</div></section>`).join('')}</div></div><div class="p-4 bg-white border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><p class="text-[11px] text-slate-500">La checklist non modifica i dati: serve a capire cosa manca prima di stampare, chiudere o archiviare.</p><div class="flex flex-wrap gap-2 justify-end"><button onclick="window.dashboardOpenProject?window.dashboardOpenProject('${esc(p.id)}'):window.loadModule('progetti')" class="px-4 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase">Apri progetto</button><button onclick="window.loadModule('stampe')" class="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-800 border border-indigo-100 text-[10px] font-black uppercase">Centro stampe</button><button onclick="window.loadModule('archivio_corsi')" class="px-4 py-2 rounded-xl bg-blue-50 text-blue-800 border border-blue-100 text-[10px] font-black uppercase">Archivio</button></div></div></div>`;
      if(window.lucide) lucide.createIcons();
    }catch(e){ m.innerHTML=`<div class="bg-white rounded-3xl shadow-2xl border border-rose-200 w-full max-w-md p-8 text-center"><i data-lucide="alert-triangle" class="w-8 h-8 mx-auto mb-3 text-rose-600"></i><p class="font-black uppercase text-rose-900">Checklist non disponibile</p><p class="text-xs text-slate-600 mt-2">${esc(e.message||e)}</p><button onclick="window.closeSafetyChecklistModal()" class="mt-5 px-4 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase">Chiudi</button></div>`; if(window.lucide) lucide.createIcons(); }
  };

  window.apriChecklistCorsi=async function(){
    const m=modal(); m.classList.remove('hidden'); m.classList.add('flex'); m.innerHTML='<div class="bg-white rounded-3xl shadow-2xl p-8 text-center"><i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600"></i><p class="font-black uppercase">Caricamento corsi...</p></div>'; if(window.lucide) lucide.createIcons();
    const projects=window.getProgetti?await window.getProgetti():[], ids=projects.map(p=>p.id).filter(Boolean);
    const map=ids.length&&window.getIscrizioniPerProgetti?await window.getIscrizioniPerProgetti(ids):{};
    const rows=projects.map(p=>({p,c:window.buildSafetyCourseChecklist(p,map[p.id]||[])})).sort((a,b)=>a.c.percent-b.c.percent).slice(0,12);
    m.innerHTML=`<div class="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[88vh] overflow-hidden flex flex-col"><div class="p-5 bg-slate-900 text-white flex items-center justify-between"><div><p class="text-[10px] font-black uppercase text-blue-200">Checklist documentale</p><h2 class="text-2xl font-black uppercase">Scegli corso</h2></div><button onclick="window.closeSafetyChecklistModal()" class="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center"><i data-lucide="x" class="w-5 h-5"></i></button></div><div class="p-5 overflow-y-auto bg-slate-50 space-y-3">${rows.length?rows.map(({p,c})=>`<div class="rounded-2xl bg-white border border-slate-200 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"><div><div class="flex gap-2 mb-1"><span class="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-${c.status.tone}-50 text-${c.status.tone}-800 border border-${c.status.tone}-200">${esc(c.status.label)}</span><span class="text-[10px] text-slate-400 font-black uppercase">${c.percent}%</span></div><p class="font-black text-slate-900 uppercase">${esc(p.codice||'Senza codice')} · ${esc(corso(p))}</p><p class="text-xs text-slate-500">${esc(azienda(p))} · verifica ${esc(fmt(p.data_esame))}</p></div><button onclick="window.apriChecklistCorso('${esc(p.id)}')" class="px-4 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase">Apri checklist</button></div>`).join(''):'<div class="p-8 text-center text-slate-500">Nessun progetto presente.</div>'}</div></div>`; if(window.lucide) lucide.createIcons();
  };

  window.injectChecklistButtonsInDashboard=function(){ document.querySelectorAll('#dash-projects-overview button[onclick^="window.dashboardOpenProject"], #dash-action-plan button[onclick^="window.dashboardOpenProject"]').forEach(btn=>{ if(btn.dataset.checklistSibling==='yes') return; const m=String(btn.getAttribute('onclick')||'').match(/dashboardOpenProject\('([^']+)'\)/); if(!m) return; const extra=document.createElement('button'); extra.type='button'; extra.className='px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-100 text-[10px] font-black uppercase tracking-widest ml-1'; extra.textContent='Checklist'; extra.onclick=e=>{e.stopPropagation();window.apriChecklistCorso(m[1]);}; btn.insertAdjacentElement('afterend',extra); btn.dataset.checklistSibling='yes'; }); };
  const wrap=()=>{ if(typeof window.loadDashboardStats!=='function'||window.loadDashboardStats.__checklistWrapped) return; const old=window.loadDashboardStats; const nw=async function(...a){ const r=await old.apply(this,a); setTimeout(window.injectChecklistButtonsInDashboard,80); return r; }; nw.__checklistWrapped=true; window.loadDashboardStats=nw; };
  wrap(); setTimeout(wrap,0); setTimeout(()=>{wrap();window.injectChecklistButtonsInDashboard();},600);
})();