// Documenti azienda/persona: filtro per anagrafica, ruolo e formazione realmente completata
(function(){
  const D=window.SafetyCompanyDocs;
  if(!D || window.__safetyCompanyDocsDirectoryLoaded) return;
  window.__safetyCompanyDocsDirectoryLoaded=true;

  const ROLE_LABELS={
    lavoratore:'Lavoratore',
    datore_lavoro:'Datore di lavoro / legale rappresentante'
  };
  const DOC_TITLES={
    verbale_consegna_dpi:'Verbale consegna DPI',
    registro_consegna_dpi:'Registro consegna DPI',
    lettera_incarico_sicurezza:'Lettera nomina / incarico',
    dichiarazione_dl_diretta:'Dichiarazione Datore di Lavoro'
  };
  const APPOINTMENT_ROLES=new Set(['preposto','primo_soccorso','antincendio','attrezzatura','quota','confinati']);
  const EMPLOYER_ROLES=new Set(['dl_rspp','primo_soccorso','antincendio']);

  const esc=v=>D.esc(v);
  const normalizeRole=value=>String(value||'')==='datore_lavoro'?'datore_lavoro':'lavoratore';
  const roleOf=p=>normalizeRole(p?.ruolo_aziendale);
  const roleLabel=p=>ROLE_LABELS[roleOf(p)]||'Lavoratore';

  function isoToday(){
    return new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
  }
  function positiveOutcome(value){
    const v=String(value||'').trim().toLowerCase();
    return ['idoneo','idonea','superato','superata','positivo','positiva','abilitato','abilitata'].some(x=>v===x || v.includes(x));
  }
  function negativePractice(value){
    const v=String(value||'').trim().toLowerCase();
    if(!v) return false;
    return ['non idone','non super','negativ','insufficient','respinto','respinta'].some(x=>v.includes(x));
  }
  function trainingCompleted(history){
    if(!history?.project || !history?.enrollment) return false;
    const endDate=String(history.project.data_esame||history.project.data_inizio||'').slice(0,10);
    if(!endDate || endDate>isoToday()) return false;
    if(!positiveOutcome(history.enrollment.esito)) return false;
    const attendance=history.enrollment.percentuale_frequenza;
    if(attendance!==null && attendance!==undefined && attendance!=='' && Number(attendance)<90) return false;
    if(negativePractice(history.enrollment.esito_pratica)) return false;
    return true;
  }

  function personView(p,companiesById){
    const company=companiesById.get(String(p.azienda_id||''))||null;
    return {
      id:String(p.id||''),nome:p.nome_cognome||'',cf:p.cf||'',nascita:p.luogo_data_nascita||'',
      mansione:p.mansione_storica||'',azienda_id:String(p.azienda_id||''),ruolo_aziendale:roleOf(p),
      company:company?D.companyFromRow(company):null,raw:p
    };
  }

  async function loadDirectory(force=false){
    if(D.directoryCache && !force) return D.directoryCache;
    if(D.directoryLoadPromise) return D.directoryLoadPromise;

    D.directoryLoadPromise=(async()=>{
      const [companies,people,projects]=await Promise.all([
        (Array.isArray(window.aziendeList)&&window.aziendeList.length&&!force)?Promise.resolve(window.aziendeList):(typeof window.getAziende==='function'?window.getAziende():Promise.resolve([])),
        (Array.isArray(window.corsistiList)&&window.corsistiList.length&&!force)?Promise.resolve(window.corsistiList):(typeof window.getCorsisti==='function'?window.getCorsisti():Promise.resolve([])),
        (Array.isArray(window.progettiList)&&window.progettiList.length&&!force)?Promise.resolve(window.progettiList):(typeof window.getProgetti==='function'?window.getProgetti():Promise.resolve([]))
      ]);
      window.aziendeList=companies||[];
      window.corsistiList=people||[];
      window.progettiList=projects||[];

      const companyMap=new Map((companies||[]).map(a=>[String(a.id),a]));
      const projectMap=new Map((projects||[]).map(p=>[String(p.id),p]));
      const viewPeople=(people||[]).map(p=>personView(p,companyMap));
      const histories=new Map(viewPeople.map(p=>[p.id,[]]));
      const ids=(projects||[]).map(p=>p.id).filter(Boolean);
      let enrollmentMap={};

      if(ids.length && typeof window.getIscrizioniPerProgetti==='function') enrollmentMap=await window.getIscrizioniPerProgetti(ids);
      else if(typeof window.getIscrizioni==='function'){
        for(const id of ids) enrollmentMap[id]=await window.getIscrizioni(id);
      }

      (projects||[]).forEach(project=>{
        (enrollmentMap[project.id]||[]).forEach(enrollment=>{
          const cid=String(enrollment.corsista_id||enrollment.corsisti?.id||'');
          if(!cid || !histories.has(cid)) return;
          const course=D.courseFrom(project);
          const history={project,enrollment,course,role:D.inferRole(course.id)};
          history.completed=trainingCompleted(history);
          histories.get(cid).push(history);
        });
      });
      histories.forEach(list=>list.sort((a,b)=>String(b.project?.data_esame||b.project?.data_inizio||'').localeCompare(String(a.project?.data_esame||a.project?.data_inizio||''))));

      D.directoryCache={companies:companies||[],people:viewPeople,projects:projects||[],projectMap,histories,loadedAt:Date.now()};
      return D.directoryCache;
    })();

    try{return await D.directoryLoadPromise;}
    finally{D.directoryLoadPromise=null;}
  }

  D.loadDirectory=loadDirectory;
  D.isTrainingCompleted=trainingCompleted;
  window.refreshSafetyCompanyDocsDirectory=()=>{D.directoryCache=null;return refreshLauncher(true);};

  function historiesFor(personId){return D.directoryCache?.histories?.get(String(personId||''))||[];}
  function completedHistoriesFor(personId){return historiesFor(personId).filter(h=>h.completed===true);}
  function appointmentHistoriesFor(personId){return historiesFor(personId);}
  function relevantEmployerHistories(personId){return historiesFor(personId);}
  function peopleForCompany(companyId){return (D.directoryCache?.people||[]).filter(p=>String(p.azienda_id)===String(companyId||''));}
  function companyById(id){const a=(D.directoryCache?.companies||[]).find(x=>String(x.id)===String(id));return a?D.companyFromRow(a):null;}
  function latestProjectCompany(){
    const pid=document.getElementById('stampa-progetto')?.value||'';
    const p=(D.directoryCache?.projects||[]).find(x=>String(x.id)===String(pid));
    return p?.azienda_id?String(p.azienda_id):'';
  }

  function hasEmployerTraining(personId){return relevantEmployerHistories(personId).length>0;}
  // Tutti i modelli sono liberamente stampabili. Il completamento formativo
  // rimane un'informazione separata, non una condizione per la stampa.
  function compatibility(type,companyId,personId){
    if(!companyId) return {ok:false,why:'Seleziona un’azienda per precompilare il documento'};
    const persons=peopleForCompany(companyId);
    if(type==='registro_consegna_dpi') return {ok:true,why:persons.length+' anagrafiche; possibile anche il modello vuoto'};
    if(!personId || personId==='__all__') return {ok:false,why:'Seleziona un destinatario per il documento individuale'};
    return persons.some(p=>p.id===personId) ? {ok:true,why:'Modello stampabile senza requisiti sul corso'} : {ok:false,why:'Persona non disponibile'};
  }

  // Libreria di modelli liberamente stampabili, anche senza progetto, anagrafica,
  // attestato, corso o esito. Nessun modello contiene firme o esiti presunti.
  window.stampaModelloVuotoSafetyDoc = async function(type) {
    const area=document.getElementById('print-area-temp');
    if(!area)return alert('Area stampa non disponibile. Apri il Centro Stampe.');
    const company={nome:'________________',piva:'',indirizzo:'________________',sede:'',datore:'',ateco:''};
    const person={nome:'________________',cf:'',mansione:''};
    const ctx={company,course:{id:'',titolo:'________________',codice:'',inizio:'',fine:''},
      date:'',place:'',datore:'',effective:'',courseRef:'________________',duration:'________________',
      specific:'',note:'',commonDpi:'',info:false,training:false};
    try {
      let html='';
      if(type==='attestato') {
        html=`<section class="doc-page safety-company-doc-page">${D.header(company)}
          <h1>SCHEMA ATTESTATO DI FORMAZIONE — BOZZA NON CERTIFICANTE</h1>
          <p><b>Ente / soggetto formatore:</b> __________________________</p>
          <p><b>Partecipante:</b> __________________________</p>
          <p><b>Corso / normativa:</b> ________________________________</p>
          <p><b>Durata, periodo, sede, programma:</b> ________________________________</p>
          <p><b>Frequenza, verifica finale e relativo esito (solo dopo verifica):</b> __________________</p>
          <p><b>Protocollo / numero attestato (solo dopo emissione):</b> __________________</p>
          ${D.signatures('Responsabile dell’emissione','','Soggetto autorizzato','')}
          ${D.footer('Modello organizzativo in bianco: non costituisce prova di frequenza, idoneità o attestazione rilasciata')}
          </section>`;
      } else if(type==='verbale_consegna_dpi')html=D.dpiPage(ctx,person,[]);
      else if(type==='registro_consegna_dpi')html=D.registerPage(ctx,[person]);
      else if(type==='dichiarazione_dl_diretta')html=D.employerPage(ctx,'dl_rspp');
      else html=D.appointmentPage(ctx,person,type||'incarico_generico');
      D.injectStyle?.();
      area.innerHTML=html;
      const notice=document.createElement('div');
      notice.textContent='FACSIMILE IN BIANCO — STAMPA LIBERA. NON ATTESTA FORMAZIONE, INCARICO O CONSEGNA GIÀ EFFETTUATI.';
      notice.style.cssText='border:2px solid #991b1b;color:#991b1b;font:bold 11px Arial,sans-serif;padding:7px;text-align:center;margin-bottom:10px';
      area.querySelectorAll('.safety-company-doc-page').forEach(page=>{
        page.classList.add('print-show','temp-page');
        page.prepend(notice.cloneNode(true));
        page.style.transform='none';
      });
      document.body.classList.add('is-printing-temp');
      setTimeout(async()=>{
        try {
          if(typeof window.waitForPrintImages==='function')await window.waitForPrintImages(area);
          window.print();
        }finally{
          document.body.classList.remove('is-printing-temp');
          area.innerHTML='';
        }
      },400);
    }catch(e){
      document.body.classList.remove('is-printing-temp');area.innerHTML='';
      alert('Impossibile stampare il modello: '+(e.message||e));
    }
  };

  function launcherHtml(){
    return `<p class="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-2">Documenti azienda / persona</p>
      <div class="rounded-xl border border-blue-200 bg-blue-50 p-3 space-y-2 mb-3">
        <label class="text-[9px] font-black uppercase text-blue-800">1. Azienda</label>
        <select id="scd-launch-company" onchange="window.scdLauncherCompanyChanged()" class="w-full px-2 py-2 bg-white border border-blue-200 rounded-lg text-[10px] font-bold"></select>
        <label class="text-[9px] font-black uppercase text-blue-800">2. Persona / lavoratore / datore</label>
        <select id="scd-launch-person" onchange="window.scdLauncherPersonChanged()" class="w-full px-2 py-2 bg-white border border-blue-200 rounded-lg text-[10px] font-bold"></select>
        <div id="scd-launch-summary" class="text-[9px] leading-snug font-bold text-blue-900"></div>
      </div>
      <button id="scd-btn-dpi" type="button" onclick="window.openSafetyCompanyDoc('verbale_consegna_dpi')" class="w-full text-left px-4 py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold text-blue-900 disabled:opacity-40 disabled:cursor-not-allowed">Verbale consegna DPI</button>
      <button id="scd-btn-register" type="button" onclick="window.openSafetyCompanyDoc('registro_consegna_dpi')" class="w-full text-left px-4 py-2.5 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-lg text-xs font-bold text-cyan-900 disabled:opacity-40 disabled:cursor-not-allowed">Registro consegna DPI</button>
      <button id="scd-btn-letter" type="button" onclick="window.openSafetyCompanyDoc('lettera_incarico_sicurezza')" class="w-full text-left px-4 py-2.5 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-lg text-xs font-bold text-violet-900 disabled:opacity-40 disabled:cursor-not-allowed">Lettera nomina / incarico</button>
      <button id="scd-btn-employer" type="button" onclick="window.openSafetyCompanyDoc('dichiarazione_dl_diretta')" class="w-full text-left px-4 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-xs font-bold text-amber-950 disabled:opacity-40 disabled:cursor-not-allowed">Dichiarazione Datore di Lavoro</button>
      <div class="mt-4 p-3 border-2 border-indigo-200 rounded-xl bg-indigo-50 space-y-2">
        <p class="text-[10px] font-black uppercase text-indigo-900">Stampa libera di qualsiasi modello — nessun requisito preventivo</p>
        <select id="scd-free-type" class="w-full p-2 bg-white rounded-lg border border-indigo-200 text-xs text-slate-900">
          <option value="attestato">Bozza attestato (non certificante)</option>
          <option value="preposto">Nomina / individuazione preposto</option>
          <option value="primo_soccorso">Designazione primo soccorso</option>
          <option value="antincendio">Designazione antincendio</option>
          <option value="attrezzatura">Autorizzazione attrezzatura</option>
          <option value="quota">Incarico lavori in quota / DPI III cat.</option>
          <option value="confinati">Incarico ambienti confinati</option>
          <option value="incarico_generico">Lettera incarico generico</option>
          <option value="verbale_consegna_dpi">Verbale consegna DPI</option>
          <option value="registro_consegna_dpi">Registro consegna DPI</option>
          <option value="dichiarazione_dl_diretta">Dichiarazione DL</option>
        </select>
        <button type="button" onclick="window.stampaModelloVuotoSafetyDoc(document.getElementById('scd-free-type')?.value)" class="w-full rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white font-black px-3 py-2 text-[10px] uppercase">Stampa modello in bianco</button>
      </div>`;
  }

  function populatePersons(preferred=''){
    const companyId=document.getElementById('scd-launch-company')?.value||'';
    const select=document.getElementById('scd-launch-person');
    if(!select) return;
    const people=peopleForCompany(companyId).sort((a,b)=>a.nome.localeCompare(b.nome,'it'));
    select.innerHTML=`<option value="__all__">Tutta l'azienda · ${people.length} persone</option>`+people.map(p=>`<option value="${esc(p.id)}">${esc(p.nome)} · ${esc(roleLabel(p))}${p.mansione?' · '+esc(p.mansione):''}</option>`).join('');
    if(preferred && [...select.options].some(o=>o.value===preferred)) select.value=preferred;
  }

  function updateLauncherState(){
    const companyId=document.getElementById('scd-launch-company')?.value||'';
    const personId=document.getElementById('scd-launch-person')?.value||'__all__';
    const map={verbale_consegna_dpi:'scd-btn-dpi',registro_consegna_dpi:'scd-btn-register',lettera_incarico_sicurezza:'scd-btn-letter',dichiarazione_dl_diretta:'scd-btn-employer'};
    Object.entries(map).forEach(([type,id])=>{
      const b=document.getElementById(id),c=compatibility(type,companyId,personId);
      if(b){b.disabled=!c.ok;b.title=c.why;}
    });
    const summary=document.getElementById('scd-launch-summary');
    if(!summary) return;
    const p=(D.directoryCache?.people||[]).find(x=>x.id===personId);
    if(p){
      const all=historiesFor(p.id),completed=completedHistoriesFor(p.id),appointments=appointmentHistoriesFor(p.id);
      summary.innerHTML=`<b>${esc(roleLabel(p))}</b>${p.mansione?' · '+esc(p.mansione):''}<br>${completed.length} corsi completati su ${all.length} collegati · ${appointments.length} incarichi/abilitazioni stampabili.`;
    } else {
      summary.textContent=`Modalità azienda: ${peopleForCompany(companyId).length} persone disponibili. Il Registro DPI verrà generato per l'intera azienda.`;
    }
  }

  async function refreshLauncher(force=false){
    const box=document.getElementById('safety-company-doc-buttons');
    if(!box) return false;
    if(box.dataset.directoryReady==='1'&&!force){updateLauncherState();return true;}
    if(box.dataset.directoryLoading==='1'&&!force) return false;

    box.dataset.directoryLoading='1';
    box.innerHTML='<div class="p-3 text-[10px] font-bold text-slate-500">Caricamento anagrafiche e storico formativo...</div>';
    try{
      await loadDirectory(force);
      if(!box.isConnected) return false;
      box.innerHTML=launcherHtml();
      box.dataset.directoryReady='1';
      const cs=document.getElementById('scd-launch-company');
      if(!cs) return false;
      cs.innerHTML='<option value="">-- Seleziona azienda --</option>'+D.directoryCache.companies.map(a=>`<option value="${esc(a.id)}">${esc(a.ragione_sociale||'Azienda')}</option>`).join('');
      const preferred=latestProjectCompany()||String(D.directoryCache.companies[0]?.id||'');
      if(preferred) cs.value=preferred;
      populatePersons('__all__');
      updateLauncherState();
      return true;
    } finally {
      if(box.isConnected) delete box.dataset.directoryLoading;
    }
  }

  window.scdLauncherCompanyChanged=()=>{populatePersons('__all__');updateLauncherState();};
  window.scdLauncherPersonChanged=updateLauncherState;

  function trainingLabel(h){
    const d=D.fmt(h.project?.data_esame||h.project?.data_inizio||'');
    return `${h.course.titolo}${h.project?.codice?' · '+h.project.codice:''}${d?' · '+d:''}${h.enrollment?.esito?' · '+h.enrollment.esito:''}`;
  }
  function appointmentRoles(histories){
    const set=new Set(histories.map(h=>h.role).filter(r=>APPOINTMENT_ROLES.has(r)));
    const labels={
      preposto:'Preposto alla sicurezza',
      primo_soccorso:'Addetto primo soccorso',
      antincendio:'Addetto antincendio / evacuazione',
      attrezzatura:'Operatore autorizzato attrezzatura',
      quota:'Lavori in quota / DPI III categoria',
      confinati:'Ambienti confinati'
    };
    return [...set].map(r=>[r,labels[r]]).filter(x=>x[1]);
  }
  function employerRoles(histories){
    const set=new Set();
    histories.forEach(h=>{
      if(h.role==='dl_rspp')set.add('dl_rspp');
      if(h.role==='primo_soccorso')set.add('dl_primo_soccorso');
      if(h.role==='antincendio')set.add('dl_antincendio');
    });
    const labels={dl_rspp:'Compiti SPP / RSPP',dl_primo_soccorso:'Primo soccorso',dl_antincendio:'Antincendio / evacuazione'};
    return [...set].map(r=>[r,labels[r]]);
  }
  function inferredEmployerRole(h){
    if(!h) return 'dl_rspp';
    if(h.role==='primo_soccorso') return 'dl_primo_soccorso';
    if(h.role==='antincendio') return 'dl_antincendio';
    return 'dl_rspp';
  }
  function courseFromHistory(h){return h?.course||{id:'',titolo:'Nessuna formazione specifica',codice:'',inizio:'',fine:''};}

  function commonDirectoryFields(company,person,history,type){
    const datore=type==='dichiarazione_dl_diretta'&&person?person.nome:(company.datore||'');
    const course=courseFromHistory(history);
    return `<div class="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
      <div class="md:col-span-2"><label>Azienda di appartenenza</label><input value="${esc(company.nome)}" readonly></div>
      <div><label>P.IVA / C.F.</label><input value="${esc(company.piva)}" readonly></div><div><label>ATECO</label><input value="${esc(company.ateco)}" readonly></div>
      ${person?`<div class="md:col-span-2"><label>Persona</label><input value="${esc(person.nome)} · ${esc(person.cf||'CF non indicato')}" readonly></div><div><label>Ruolo aziendale</label><input value="${esc(roleLabel(person))}" readonly></div><div><label>Mansione</label><input value="${esc(person.mansione||'')}" readonly></div>`:''}
      <div class="md:col-span-2"><label>Sede</label><input value="${esc(company.sede||company.indirizzo)}" readonly></div><div><label>Datore / legale rappresentante</label><input id="scd-datore" value="${esc(datore)}"></div><div><label>Data documento</label><input id="scd-date" type="date" value="${esc(course.fine||D.today())}"></div>
      <div><label>Luogo</label><input id="scd-place" value="${esc(company.sede||company.indirizzo)}"></div>
      <div class="md:col-span-3"><label>Formazione di riferimento (facoltativa)</label><input id="scd-course" value="${esc(history?trainingLabel(history):'Nessuna formazione indicata')}" readonly></div>
    </div>`;
  }

  window.scdDirectoryTrainingChanged=()=>{
    const s=window.__safetyCompanyDocState;
    if(!s) return;
    const key=document.getElementById('scd-training')?.value||'';
    const h=s.histories.find(x=>String(x.project.id)+'::'+String(x.enrollment.id||x.enrollment.corsista_id||'')===key)||null;
    s.selectedHistory=h;
    s.course=courseFromHistory(h);
    s.project=h?.project||null;
    const cr=document.getElementById('scd-course');
    if(cr) cr.value=h?trainingLabel(h):'Nessuna formazione indicata';
    const role=document.getElementById('scd-role');
    if(role&&h){
      const desired=s.type==='dichiarazione_dl_diretta'?inferredEmployerRole(h):h.role;
      if([...role.options].some(o=>o.value===desired)) role.value=desired;
    }
  };

  window.openSafetyCompanyDoc=async type=>{
    if(!D.types.has(type)) return;
    await refreshLauncher(false);
    const companyId=document.getElementById('scd-launch-company')?.value||'';
    const personId=document.getElementById('scd-launch-person')?.value||'__all__';
    const comp=compatibility(type,companyId,personId);
    if(!comp.ok) return alert(comp.why+'.');
    const company=companyById(companyId);
    if(!company) return alert('Azienda non disponibile.');
    const persons=peopleForCompany(companyId);
    const person=persons.find(p=>p.id===personId)||null;

    let histories=[];
    if(person) histories=historiesFor(personId);

    const selectedHistory=histories[0]||null;
    const state={type,company,person,workers:type==='registro_consegna_dpi'?persons:(person?[person]:[]),histories,selectedHistory,project:selectedHistory?.project||null,course:courseFromHistory(selectedHistory),multiCompany:false};
    window.__safetyCompanyDocState=state;
    D.ensureModal();
    const modal=document.getElementById('safety-company-doc-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.getElementById('safety-company-doc-title').textContent=DOC_TITLES[type]||'Documento';

    const trainingOpts='<option value="">Nessuna formazione specifica</option>'+histories.map(h=>`<option value="${esc(String(h.project.id)+'::'+String(h.enrollment.id||h.enrollment.corsista_id||''))}">${esc(trainingLabel(h))}</option>`).join('');
    const trainingBox=type==='registro_consegna_dpi'?'':`<div class="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3"><label>Corso di riferimento (facoltativo)</label><select id="scd-training" onchange="window.scdDirectoryTrainingChanged()">${trainingOpts||'<option value="">Nessuna formazione completata disponibile</option>'}</select><p class="text-[10px] text-slate-500 mt-1">Puoi stampare anche prima del corso o senza attestato. Il documento è un facsimile da verificare, compilare e sottoscrivere prima dell'uso.</p></div>`;

    let extra='';
    if(type==='verbale_consegna_dpi') extra=`<div><label>Note consegna</label><input id="scd-note" placeholder="Prima consegna / sostituzione / integrazione"></div><div class="mt-4"><label>DPI consegnati — una riga per DPI</label><textarea id="scd-dpi" rows="7" placeholder="Elmetto | marca/modello/taglia | 1 | urti/caduta oggetti&#10;Guanti | modello/taglia | 1 paio | rischio meccanico"></textarea><p class="text-[10px] text-slate-500 mt-1">Formato: DPI | marca/modello/taglia | quantità | rischio/utilizzo</p></div><div class="mt-3 flex flex-wrap gap-4 text-xs"><label class="!normal-case flex items-center gap-2"><input id="scd-info" type="checkbox" checked style="width:auto"> Istruzioni/informazione consegnate</label><label class="!normal-case flex items-center gap-2"><input id="scd-training-dpi" type="checkbox" style="width:auto"> Addestramento pratico ove richiesto</label></div>`;
    if(type==='registro_consegna_dpi') extra=`<div><label>DPI / dotazione comune (facoltativa)</label><input id="scd-common-dpi" placeholder="Es. elmetto + guanti + calzature S3"></div><div class="mt-3 rounded-xl bg-blue-50 border border-blue-200 p-4 text-xs text-blue-900">Saranno incluse ${persons.length} persone appartenenti a ${esc(company.nome)}, indipendentemente dal progetto formativo selezionato nel Centro Stampe.</div>`;
    if(type==='lettera_incarico_sicurezza'){
      const roles=[['preposto','Preposto alla sicurezza'],['primo_soccorso','Addetto primo soccorso'],['antincendio','Addetto antincendio / evacuazione'],['attrezzatura','Operatore autorizzato attrezzatura'],['quota','Lavori in quota / DPI III categoria'],['confinati','Ambienti confinati'],['incarico_generico','Lettera di incarico generica']];
      extra=`<div class="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label>Ruolo / incarico</label><select id="scd-role">${roles.map(([k,l])=>`<option value="${k}">${esc(l)}</option>`).join('')}</select></div><div><label>Decorrenza</label><input id="scd-effective" type="date" value="${esc(state.course.fine||D.today())}"></div><div><label>Durata</label><input id="scd-duration" value="Fino a revoca, modifica organizzativa o perdita dei requisiti"></div><div class="md:col-span-2"><label>Ambito / attività / attrezzatura specifica</label><textarea id="scd-specific" rows="3"></textarea></div></div><div class="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900">Facsimile stampabile in qualsiasi fase. La formazione non conferisce automaticamente una nomina o autorizzazione: completare i dati, controllare le condizioni e sottoscrivere.</div>`;
    }
    if(type==='dichiarazione_dl_diretta'){
      const roles=[['dl_rspp','Compiti SPP / RSPP'],['dl_primo_soccorso','Primo soccorso'],['dl_antincendio','Antincendio / evacuazione']];
      extra=`<div class="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label>Attività svolta direttamente</label><select id="scd-role">${roles.map(([k,l])=>`<option value="${k}">${esc(l)}</option>`).join('')}</select></div><div><label>Decorrenza</label><input id="scd-effective" type="date" value="${esc(state.course.fine||D.today())}"></div><div class="md:col-span-2"><label>RLS / RLST informato (facoltativo)</label><input id="scd-rls" placeholder="Nome oppure 'non ancora designato'"></div><div class="md:col-span-2"><label>Note / verifica condizioni</label><textarea id="scd-specific" rows="3"></textarea></div></div><div class="mt-3 rounded-xl bg-red-50 border border-red-200 p-4 text-xs font-bold text-red-900">Facsimile stampabile senza prerequisiti didattici. Verificare il ruolo del firmatario e le condizioni di legge prima di sottoscrivere.</div>`;
    }

    document.getElementById('safety-company-doc-body').innerHTML=commonDirectoryFields(company,person,selectedHistory,type)+trainingBox+extra;
    window.scdDirectoryTrainingChanged();
    if(typeof lucide!=='undefined') lucide.createIcons();
  };

  window.generateSafetyCompanyDoc=async()=>{
    const s=window.__safetyCompanyDocState;
    if(!s) return;
    window.scdDirectoryTrainingChanged();
    const container=document.getElementById('print-preview-container');
    if(!container) return alert('Anteprima non disponibile.');
    const base=D.ctx(s);
    base.company=s.company;
    base.course=s.course;
    let html='';

    if(s.type==='verbale_consegna_dpi'){
      const w=s.person;
      if(!w) return alert('Seleziona una persona.');
      base.training=!!document.getElementById('scd-training-dpi')?.checked;
      html=D.dpiPage(base,w,D.parseDpi());
    } else if(s.type==='registro_consegna_dpi'){
      const workers=s.workers||[];
      if(!workers.length) workers.push({nome:'________________',cf:'',mansione:''});
      const pages=[];
      for(let i=0;i<workers.length;i+=14) pages.push(D.registerPage(base,workers.slice(i,i+14)));
      html=pages.join('<div style="height:12px;background:#cbd5e1"></div>');
    } else if(s.type==='lettera_incarico_sicurezza'){
      const w=s.person;
      if(!w) return alert('Seleziona la persona a cui intestare il modello.');
      const role=document.getElementById('scd-role')?.value||s.selectedHistory?.role||'incarico_generico';
      html=D.appointmentPage(base,w,role);
    } else if(s.type==='dichiarazione_dl_diretta'){
      const w=s.person;
      if(!w) return alert('Seleziona una persona per compilare il modello.');
      base.datore=w.nome;
      const role=document.getElementById('scd-role')?.value||'dl_rspp';
      html=D.employerPage(base,role);
    }

    // I facsimili non devono sembrare incarichi già firmati o attestati rilasciati.
    const modelNotice='<div style="padding:8px 12px;border:2px solid #991b1b;color:#991b1b;font-weight:800;text-align:center;margin-bottom:10px">FACSIMILE STAMPABILE — DA COMPILARE E SOTTOSCRIVERE. NON COSTITUISCE UN DOCUMENTO GIÀ EMESSO.</div>';
    if(html) html=html.replace(/(<section[^>]*class="[^"]*safety-company-doc-page[^"]*"[^>]*>)/g,'$1'+modelNotice);
    window.currentPrintModule=s.type;
    container.innerHTML=html;
    container.style.width='210mm';
    container.style.maxWidth='210mm';
    container.style.display='block';
    window.closeSafetyCompanyDoc();
    if(typeof window.showSafetyToast==='function') window.showSafetyToast('Modello stampabile pronto: verifica e completa i dati prima di firmare.',{title:'Documento generato',type:'ok',icon:'file-check-2'});
  };

  async function upgrade(){
    const box=document.getElementById('safety-company-doc-buttons');
    if(!box) return;
    try{await refreshLauncher(false);}
    catch(e){
      console.error('Documenti azienda/persona:',e);
      box.innerHTML='<div class="p-3 rounded-lg bg-red-50 border border-red-200 text-[10px] font-bold text-red-800">Errore caricamento anagrafiche. Riapri il Centro Stampe o aggiorna la pagina.</div>';
    }
  }

  D.refreshDirectoryLauncher=refreshLauncher;
  const root=document.getElementById('app-content')||document.body;
  let upgradeTimer=null;
  const scheduleUpgrade=()=>{
    const box=document.getElementById('safety-company-doc-buttons');
    if(!box||box.dataset.directoryReady==='1'||box.dataset.directoryLoading==='1') return;
    clearTimeout(upgradeTimer);
    upgradeTimer=setTimeout(upgrade,30);
  };
  new MutationObserver(mutations=>{
    if(!mutations.some(m=>[...m.addedNodes].some(node=>{
      if(!(node instanceof HTMLElement)) return false;
      return node.id==='safety-company-doc-buttons'||!!node.querySelector?.('#safety-company-doc-buttons');
    }))) return;
    scheduleUpgrade();
  }).observe(root,{childList:true,subtree:true});
  setTimeout(scheduleUpgrade,100);
})();