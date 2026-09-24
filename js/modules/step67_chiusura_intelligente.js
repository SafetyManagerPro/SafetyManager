// STEP 67 - Motore unico di completezza e chiusura intelligente del ciclo formativo.
// Estende i flussi esistenti senza sostituire stato_corso, stampe, attestati o fascicolo.
(function(){
  if(window.__safetyStep67Loaded) return;
  window.__safetyStep67Loaded=true;

  const CATEGORIES={
    COMPLETED:'completato',
    ERROR:'errore',
    TODO:'da_completare',
    ACQUIRE:'da_acquisire',
    WARNING:'avviso',
    NA:'non_applicabile'
  };
  const LABELS={
    attendance_register:'Registro presenze',
    participant_signatures:'Firme corsisti',
    teacher_signatures:'Firme docenti',
    final_test:'Test / verifica finale',
    practical_test:'Prova pratica',
    language_check:'Verifica lingua italiana',
    final_minutes:'Verbale finale',
    quality_questionnaires:'Questionari di gradimento',
    certificates:'Attestati',
    training_effectiveness:'Verifica di efficacia',
    signed_course_documents:'Documentazione firmata',
    final_course_file:'Fascicolo finale'
  };
  const MODES=new Set(['paper','digital','hybrid','not_applicable']);
  const ACTIVITY=new Set(['pending','completed','not_applicable']);
  const RECORDING=new Set(['pending','recorded','not_applicable']);
  const EVIDENCE=new Set(['none','paper_original','scan_available','digital','not_applicable']);
  const TABLE_MISSING_CODES=new Set(['42P01','PGRST204','PGRST205']);
  const runtime={completionTableAvailable:null,completionWarningShown:false};

  const norm=v=>String(v??'').trim().toLowerCase();
  const ok=v=>v!==null&&v!==undefined&&String(v).trim()!==''&&String(v).trim()!=='---';
  const esc=v=>window.dashEscape?window.dashEscape(v):String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const parseDate=v=>{if(!v)return null;const d=new Date(String(v).slice(0,10)+'T00:00:00');return Number.isNaN(d.getTime())?null:d;};
  const today=()=>{const d=new Date();d.setHours(0,0,0,0);return d;};
  const fmt=v=>!v?'-':(window.formatDataToItalian?window.formatDataToItalian(String(v).slice(0,10)):String(v).slice(0,10));
  const isIdoneo=v=>{const s=norm(v);return !!s&&!s.includes('non idoneo')&&!s.includes('non-idoneo')&&(s.includes('idoneo')||s.includes('superato')||s.includes('ammesso'));};
  const course=p=>window.DB_CORSI?.[p?.corso_id]||{};
  const personName=(i,index=0)=>i?.corsisti?.nome_cognome||`Corsista ${index+1}`;
  const rowKey=(itemKey,iscrizioneId)=>`${itemKey}::${iscrizioneId||'*'}`;

  function indexRows(rows=[]){
    const map=new Map();
    rows.forEach(row=>map.set(rowKey(row.item_key,row.iscrizione_id),row));
    return map;
  }

  function findRow(map,itemKey,iscrizioneId=null){
    return map.get(rowKey(itemKey,iscrizioneId))||map.get(rowKey(itemKey,null))||null;
  }

  function documentState(row,defaults={}){
    return {
      mode:MODES.has(row?.mode)?row.mode:(defaults.mode||'paper'),
      activityStatus:ACTIVITY.has(row?.activity_status)?row.activity_status:(defaults.activityStatus||'pending'),
      recordingStatus:RECORDING.has(row?.recording_status)?row.recording_status:(defaults.recordingStatus||'pending'),
      evidenceStatus:EVIDENCE.has(row?.evidence_status)?row.evidence_status:(defaults.evidenceStatus||'none'),
      evidenceUrl:row?.evidence_url||defaults.evidenceUrl||'',
      notes:row?.notes||'',
      explicit:!!row,
      row:row||null
    };
  }

  function didacticState(p){
    const start=parseDate(p?.data_inizio), end=parseDate(p?.data_esame), now=today();
    if(norm(p?.stato_corso)==='chiuso'||norm(p?.stato_corso)==='svolto'||(end&&end<=now)) return 'concluso';
    if(start&&start<=now) return 'in_svolgimento';
    return 'in_preparazione';
  }

  function effectivenessState(checks=[]){
    const rows=[...(checks||[])];
    if(!rows.length) return {key:'not_planned',label:'Da pianificare',detail:'Nessuna verifica di efficacia pianificata; pianificarla o dichiararla non applicabile.',category:CATEGORIES.WARNING};
    if(rows.every(r=>norm(r.status)==='not_applicable')) return {key:'not_applicable',label:'Non applicabile',detail:'Verifica di efficacia dichiarata non applicabile.',category:CATEGORIES.NA,record:rows[0]};
    const follow=rows.find(r=>r.follow_up_required||['partially_effective','ineffective'].includes(norm(r.effectiveness_level)));
    if(follow) return {key:'follow_up_required',label:'Follow-up necessario',detail:follow.corrective_actions||'Esito parziale/non efficace: registrare l’azione correttiva e il controllo successivo.',category:CATEGORIES.TODO,record:follow};
    const completed=rows.filter(r=>norm(r.status)==='completed').sort((a,b)=>String(b.completed_at||'').localeCompare(String(a.completed_at||'')))[0];
    if(completed) return {key:'completed',label:'Completata',detail:`Completata ${fmt(completed.completed_at)}${completed.effectiveness_level?` · ${completed.effectiveness_level}`:''}.`,category:CATEGORIES.COMPLETED,record:completed};
    const scheduled=rows.filter(r=>norm(r.status)==='scheduled').sort((a,b)=>String(a.scheduled_for||'9999').localeCompare(String(b.scheduled_for||'9999')))[0];
    if(scheduled){
      const due=parseDate(scheduled.scheduled_for);
      if(due&&due<today()) return {key:'overdue',label:'Scaduta · da svolgere',detail:`Prevista il ${fmt(scheduled.scheduled_for)}. Registrare l’esito o ripianificare.`,category:CATEGORIES.TODO,record:scheduled};
      return {key:'scheduled',label:'Pianificata',detail:`Pianificata per il ${fmt(scheduled.scheduled_for)}.`,category:CATEGORIES.WARNING,record:scheduled};
    }
    return {key:'cancelled',label:'Da verificare',detail:'Le verifiche presenti risultano annullate o senza stato operativo.',category:CATEGORIES.WARNING,record:rows[0]};
  }

  function evaluateCourse(project,enrollments=[],options={}){
    const p=project||{}, iscritti=enrollments||[], rows=options.completionItems||[], checks=options.effectivenessChecks||[];
    const completion=indexRows(rows), statoDidattico=didacticState(p), concluded=statoDidattico==='concluso';
    const items=[];
    const buckets={errori:[],daCompletare:[],daAcquisire:[],avvisi:[],nonApplicabili:[],completati:[]};
    const bucketByCategory={
      [CATEGORIES.ERROR]:'errori',[CATEGORIES.TODO]:'daCompletare',[CATEGORIES.ACQUIRE]:'daAcquisire',
      [CATEGORIES.WARNING]:'avvisi',[CATEGORIES.NA]:'nonApplicabili',[CATEGORIES.COMPLETED]:'completati'
    };
    const add=(category,item)=>{
      const full={category,projectId:p.id||null,countTowardsCompletion:item.countTowardsCompletion!==false,...item};
      items.push(full); buckets[bucketByCategory[category]].push(full); return full;
    };
    const editable=(itemKey,iscrizioneId=null)=>({itemKey,iscrizioneId,editable:true});
    const addAxisItem=(itemKey,label,row,defaults={},meta={})=>{
      const s=documentState(row,defaults), data={key:`${itemKey}:${meta.iscrizioneId||'course'}`,label,itemKey,...editable(itemKey,meta.iscrizioneId||null),...s,...meta};
      if(s.mode==='not_applicable'||s.activityStatus==='not_applicable') return add(CATEGORIES.NA,{...data,detail:s.notes||'Elemento dichiarato non applicabile.'});
      if(s.activityStatus==='pending'&&s.recordingStatus==='recorded') return add(CATEGORIES.ERROR,{...data,detail:'Stato incoerente: registrazione presente ma attività indicata come non completata.'});
      if(s.activityStatus!=='completed') return add(CATEGORIES.TODO,{...data,detail:s.notes||'Stato dell’attività reale da confermare/registrare.'});
      if(s.recordingStatus!=='recorded') return add(CATEGORIES.TODO,{...data,detail:s.notes||'Attività svolta su supporto cartaceo; dati gestionali da registrare.'});
      if(s.explicit&&['paper','hybrid'].includes(s.mode)&&['none','paper_original'].includes(s.evidenceStatus)) return add(CATEGORIES.ACQUIRE,{...data,detail:s.evidenceStatus==='paper_original'?'Originale cartaceo presente; scansione da acquisire.':'Attività registrata; evidenza documentale da classificare/acquisire.'});
      return add(CATEGORIES.COMPLETED,{...data,detail:s.notes||'Attività e registrazione completate.'});
    };

    const coreMissing=[];
    if(!ok(p.codice)) coreMissing.push('codice progetto');
    if(!ok(p.corso_id)||!window.DB_CORSI?.[p.corso_id]) coreMissing.push('corso da catalogo');
    if(!ok(p.azienda_id)) coreMissing.push('azienda');
    if(!ok(p.data_inizio)||!ok(p.data_esame)) coreMissing.push('date corso/verifica');
    if(!ok(p.sede)) coreMissing.push('sede');
    if(coreMissing.length) add(concluded?CATEGORIES.ERROR:CATEGORIES.TODO,{key:'course_identity',label:'Dati essenziali del corso',detail:`Da completare: ${coreMissing.join(', ')}.`});
    else add(CATEGORIES.COMPLETED,{key:'course_identity',label:'Dati essenziali del corso',detail:'Anagrafica minima del corso completa.'});

    if(!iscritti.length) add(CATEGORIES.ERROR,{key:'participants',label:'Corsisti associati',detail:'Nessun corsista associato al corso.'});
    else add(CATEGORIES.COMPLETED,{key:'participants',label:'Corsisti associati',detail:`${iscritti.length} corsisti associati.`});

    const responsibilitiesOk=ok(p.resp_progetto)&&ok(p.resp_corso)&&(ok(p.docenti_ud)||ok(p.docente_principale));
    add(responsibilitiesOk?CATEGORIES.COMPLETED:CATEGORIES.TODO,{key:'responsibilities',label:'Responsabili e docenti',detail:responsibilitiesOk?'Responsabili e docenti registrati.':'Completare responsabile progetto, responsabile corso e docenti.'});

    if(concluded){
      const allFreq=iscritti.length>0&&iscritti.every(i=>i.percentuale_frequenza!==null&&i.percentuale_frequenza!==undefined&&i.percentuale_frequenza!=='');
      addAxisItem('attendance_register',LABELS.attendance_register,findRow(completion,'attendance_register'),{
        activityStatus:allFreq?'completed':'pending',recordingStatus:allFreq?'recorded':'pending',evidenceStatus:'none'
      });

      iscritti.forEach((i,index)=>{
        const name=personName(i,index), enrollmentId=i.id||null, prefix=`${name}: `;
        const perc=i.percentuale_frequenza;
        if(perc===null||perc===undefined||perc==='') add(CATEGORIES.TODO,{key:`attendance:${enrollmentId}`,label:`Frequenza · ${name}`,detail:'Percentuale di frequenza da registrare.',iscrizioneId:enrollmentId});
        else if(isIdoneo(i.esito)&&Number(perc)<90) add(CATEGORIES.ERROR,{key:`attendance:${enrollmentId}`,label:`Frequenza · ${name}`,detail:`Esito idoneo incompatibile con frequenza ${perc}% (minimo operativo 90%).`,iscrizioneId:enrollmentId});
        else add(CATEGORIES.COMPLETED,{key:`attendance:${enrollmentId}`,label:`Frequenza · ${name}`,detail:`Frequenza ${perc}%.`,iscrizioneId:enrollmentId});

        if(!ok(i.esito)) add(CATEGORIES.TODO,{key:`outcome:${enrollmentId}`,label:`Esito finale · ${name}`,detail:'Esito finale da registrare.',iscrizioneId:enrollmentId});
        else add(CATEGORIES.COMPLETED,{key:`outcome:${enrollmentId}`,label:`Esito finale · ${name}`,detail:`Esito: ${i.esito}.`,iscrizioneId:enrollmentId});

        const legacyTest=ok(i.voto_test)||ok(i.note_verifica), testRow=findRow(completion,'final_test',enrollmentId);
        addAxisItem('final_test',`${LABELS.final_test} · ${name}`,testRow,{
          activityStatus:legacyTest?'completed':'pending',recordingStatus:legacyTest?'recorded':'pending',evidenceStatus:'none'
        },{iscrizioneId:enrollmentId,participantName:name,detailPrefix:prefix});

        const practicalRow=findRow(completion,'practical_test',enrollmentId);
        if(practicalRow||ok(i.esito_pratica)) addAxisItem('practical_test',`${LABELS.practical_test} · ${name}`,practicalRow,{
          activityStatus:ok(i.esito_pratica)?'completed':'pending',recordingStatus:ok(i.esito_pratica)?'recorded':'pending',evidenceStatus:'none'
        },{iscrizioneId:enrollmentId,participantName:name});

        const language=norm(i.corsisti?.lingua_test_stato), languageRow=findRow(completion,'language_check',enrollmentId);
        if(languageRow||language){
          const notRequired=language==='non_richiesto';
          const languageDone=['superato','non_superato'].includes(language);
          addAxisItem('language_check',`${LABELS.language_check} · ${name}`,languageRow,{
            mode:notRequired?'not_applicable':'paper',activityStatus:notRequired?'not_applicable':(languageDone?'completed':'pending'),
            recordingStatus:notRequired?'not_applicable':(languageDone?'recorded':'pending'),
            evidenceStatus:i.corsisti?.lingua_test_documento_url?'scan_available':(languageDone?'paper_original':'none'),
            evidenceUrl:i.corsisti?.lingua_test_documento_url||''
          },{iscrizioneId:enrollmentId,participantName:name});
        }

        if(isIdoneo(i.esito)){
          const scad=Number(course(p).scad), needsExpiry=Number.isFinite(scad)&&scad>0&&scad<99;
          const missing=[]; if(!ok(i.id_certificato))missing.push('ID attestato'); if(needsExpiry&&!ok(i.data_scadenza))missing.push('scadenza');
          add(missing.length?CATEGORIES.TODO:CATEGORIES.COMPLETED,{key:`certificate:${enrollmentId}`,label:`${LABELS.certificates} · ${name}`,itemKey:'certificates',iscrizioneId:enrollmentId,detail:missing.length?`Da completare: ${missing.join(' e ')}.`:`ID ${i.id_certificato}${needsExpiry?` · scadenza ${fmt(i.data_scadenza)}`:''}.`});
        }else{
          add(CATEGORIES.NA,{key:`certificate:${enrollmentId}`,label:`${LABELS.certificates} · ${name}`,itemKey:'certificates',iscrizioneId:enrollmentId,detail:'Attestato non applicabile finché l’esito non è idoneo.'});
        }

        if(p.ente_erogatore==='azienda'&&i.corsisti?.azienda_id&&p.azienda_id&&String(i.corsisti.azienda_id)!==String(p.azienda_id)){
          add(CATEGORIES.ERROR,{key:`company:${enrollmentId}`,label:`Coerenza azienda · ${name}`,detail:'Il corsista appartiene a un’azienda diversa da quella del corso.',iscrizioneId:enrollmentId});
        }
      });

      const docsUrl=p.documenti_firmati_url||'';
      ['participant_signatures','teacher_signatures'].forEach(itemKey=>{
        const row=findRow(completion,itemKey);
        addAxisItem(itemKey,LABELS[itemKey],row,{
          activityStatus:docsUrl?'completed':'pending',recordingStatus:docsUrl?'recorded':'pending',
          evidenceStatus:docsUrl?'scan_available':'none',evidenceUrl:docsUrl
        });
      });

      addAxisItem('final_minutes',LABELS.final_minutes,findRow(completion,'final_minutes'),{activityStatus:'pending',recordingStatus:'pending',evidenceStatus:'none'});

      const qualityStatus=norm(p.gradimento_stato), qualityRow=findRow(completion,'quality_questionnaires');
      if(qualityRow||qualityStatus!=='non_avviato'){
        const collected=['raccolto','elaborato'].includes(qualityStatus), recorded=qualityStatus==='elaborato';
        addAxisItem('quality_questionnaires',LABELS.quality_questionnaires,qualityRow,{activityStatus:collected?'completed':'pending',recordingStatus:recorded?'recorded':'pending',evidenceStatus:collected?'paper_original':'none'});
      }else add(CATEGORIES.WARNING,{key:'quality_questionnaires',label:LABELS.quality_questionnaires,itemKey:'quality_questionnaires',...editable('quality_questionnaires'),detail:'Non avviati; verificare se previsti per questo corso.',countTowardsCompletion:false});

      const signedRow=findRow(completion,'signed_course_documents');
      if(docsUrl) add(CATEGORIES.COMPLETED,{key:'signed_course_documents',label:LABELS.signed_course_documents,itemKey:'signed_course_documents',...editable('signed_course_documents'),...documentState(signedRow,{activityStatus:'completed',recordingStatus:'recorded',evidenceStatus:'scan_available',evidenceUrl:docsUrl}),detail:'Scansioni/cartella documentale collegate al progetto.'});
      else if(signedRow) addAxisItem('signed_course_documents',LABELS.signed_course_documents,signedRow,{activityStatus:'pending',recordingStatus:'pending',evidenceStatus:'none'});
      else add(CATEGORIES.ACQUIRE,{key:'signed_course_documents',label:LABELS.signed_course_documents,itemKey:'signed_course_documents',...editable('signed_course_documents'),mode:'paper',activityStatus:'pending',recordingStatus:'pending',evidenceStatus:'none',detail:'Stato della documentazione cartacea da registrare; l’assenza del link non implica che le attività non siano state svolte.'});

      const eff=effectivenessState(checks);
      add(eff.category,{key:'training_effectiveness',label:LABELS.training_effectiveness,itemKey:'training_effectiveness',detail:eff.detail,countTowardsCompletion:![CATEGORIES.WARNING,CATEGORIES.NA].includes(eff.category),postState:eff.key});

      if(norm(p.stato_corso)==='chiuso'&&ok(p.chiuso_at)) add(CATEGORIES.COMPLETED,{key:'final_course_file',label:LABELS.final_course_file,itemKey:'final_course_file',detail:`Archiviato il ${fmt(p.chiuso_at)}.`});
      else add(CATEGORIES.WARNING,{key:'final_course_file',label:LABELS.final_course_file,itemKey:'final_course_file',detail:'Fascicolo non ancora archiviato; stato_corso resta compatibile con il flusso esistente.',countTowardsCompletion:false});
    }

    const counted=items.filter(i=>i.countTowardsCompletion!==false), completed=counted.filter(i=>[CATEGORIES.COMPLETED,CATEGORIES.NA].includes(i.category)).length;
    const percent=counted.length?Math.round(completed/counted.length*100):100;
    let statoAmministrativo='fascicolo_completo';
    if(buckets.errori.length) statoAmministrativo='da_verificare';
    else if(buckets.daCompletare.length) statoAmministrativo='da_completare';
    else if(buckets.daAcquisire.length) statoAmministrativo='da_acquisire';
    else if(norm(p.stato_corso)==='chiuso') statoAmministrativo='archiviato';
    else if(!concluded) statoAmministrativo='in_preparazione';
    const postFormazione=effectivenessState(checks);
    return {
      project:p,statoDidattico,statoAmministrativo,statoCorsoLegacy:p.stato_corso||'aperto',
      completati:completed,totale:counted.length,percentuale:percent,items,
      errori:buckets.errori,daCompletare:buckets.daCompletare,daAcquisire:buckets.daAcquisire,
      avvisi:buckets.avvisi,nonApplicabili:buckets.nonApplicabili,completatiItems:buckets.completati,
      postFormazione,canClose:concluded&&buckets.errori.length===0,
      readyForArchive:concluded&&buckets.errori.length===0&&buckets.daCompletare.length===0&&buckets.daAcquisire.length===0,
      completionTableAvailable:runtime.completionTableAvailable!==false
    };
  }

  function emptyMap(ids){const map={};(ids||[]).forEach(id=>{map[id]=[];});return map;}
  function reportCompletionError(error){
    if(runtime.completionWarningShown) return;
    runtime.completionWarningShown=true;
    const missing=TABLE_MISSING_CODES.has(String(error?.code||''))||/course_completion_items|schema cache|does not exist/i.test(String(error?.message||''));
    console[missing?'info':'warn']('Step 67: registro evidenze non disponibile; uso compatibilità dati esistenti.',error);
  }

  async function getCompletionItemsForProjects(projectIds=[]){
    const ids=[...new Set((projectIds||[]).filter(Boolean))], map=emptyMap(ids);
    if(!ids.length||!window.supabaseClient||runtime.completionTableAvailable===false) return map;
    try{
      const {data,error}=await window.supabaseClient.from('course_completion_items').select('*').in('progetto_id',ids).order('created_at',{ascending:true});
      if(error) throw error;
      runtime.completionTableAvailable=true;
      (data||[]).forEach(row=>{if(!map[row.progetto_id])map[row.progetto_id]=[];map[row.progetto_id].push(row);});
    }catch(error){runtime.completionTableAvailable=false;reportCompletionError(error);}
    return map;
  }

  async function getEffectivenessForProjects(projectIds=[]){
    const ids=[...new Set((projectIds||[]).filter(Boolean))], map=emptyMap(ids);
    if(!ids.length||!window.supabaseClient) return map;
    try{
      const {data,error}=await window.supabaseClient.from('training_effectiveness_checks').select('*').in('progetto_id',ids).order('scheduled_for',{ascending:true,nullsFirst:false});
      if(error) throw error;
      (data||[]).forEach(row=>{if(!map[row.progetto_id])map[row.progetto_id]=[];map[row.progetto_id].push(row);});
    }catch(error){console.warn('Step 67: verifiche di efficacia non disponibili.',error);}
    return map;
  }

  async function evaluateProjects(projects=[],enrollmentMap={}){
    const ids=projects.map(p=>p.id).filter(Boolean);
    const [completionMap,effectivenessMap]=await Promise.all([getCompletionItemsForProjects(ids),getEffectivenessForProjects(ids)]);
    const result={};
    projects.forEach(p=>{result[p.id]=evaluateCourse(p,enrollmentMap[p.id]||[],{completionItems:completionMap[p.id]||[],effectivenessChecks:effectivenessMap[p.id]||[]});});
    return result;
  }

  async function evaluateProject(project,enrollments=[]){
    if(!project?.id) return evaluateCourse(project,enrollments);
    const states=await evaluateProjects([project],{[project.id]:enrollments}); return states[project.id];
  }

  async function saveCompletionItem(input={}){
    if(!window.supabaseClient) throw new Error('Connessione Supabase non disponibile.');
    const projectId=input.progetto_id||input.projectId, itemKey=input.item_key||input.itemKey, enrollmentId=input.iscrizione_id||input.iscrizioneId||null;
    if(!projectId||!itemKey) throw new Error('Progetto e tipo elemento sono obbligatori.');
    const mode=MODES.has(input.mode)?input.mode:'paper';
    const activityStatus=mode==='not_applicable'?'not_applicable':(ACTIVITY.has(input.activity_status)?input.activity_status:'pending');
    const recordingStatus=mode==='not_applicable'?'not_applicable':(RECORDING.has(input.recording_status)?input.recording_status:'pending');
    const evidenceStatus=mode==='not_applicable'?'not_applicable':(EVIDENCE.has(input.evidence_status)?input.evidence_status:'none');
    const user=await window.getSafetyAdminUser?.();
    const payload={
      progetto_id:projectId,iscrizione_id:enrollmentId,item_key:itemKey,mode,
      activity_status:activityStatus,recording_status:recordingStatus,evidence_status:evidenceStatus,
      evidence_url:String(input.evidence_url||'').trim()||null,notes:String(input.notes||'').trim()||null,
      verified_at:activityStatus==='pending'?null:new Date().toISOString(),verified_by:activityStatus==='pending'?null:(user?.id||null),
      updated_at:new Date().toISOString()
    };
    let query=window.supabaseClient.from('course_completion_items').select('id').eq('progetto_id',projectId).eq('item_key',itemKey);
    query=enrollmentId?query.eq('iscrizione_id',enrollmentId):query.is('iscrizione_id',null);
    const {data:existing,error:readError}=await query.maybeSingle();
    if(readError) throw readError;
    let result;
    if(existing?.id) result=await window.supabaseClient.from('course_completion_items').update(payload).eq('id',existing.id).select().single();
    else result=await window.supabaseClient.from('course_completion_items').insert({...payload,created_by:user?.id||null}).select().single();
    if(result.error) throw result.error;
    runtime.completionTableAvailable=true;
    if(window.safetyAudit) await window.safetyAudit('course_completion_item_saved',{table_name:'course_completion_items',record_id:result.data?.id||null,details:{project_id:projectId,item_key:itemKey,iscrizione_id:enrollmentId}});
    return result.data;
  }

  const editorModal=()=>{let m=document.getElementById('step67-item-modal');if(!m){m=document.createElement('div');m.id='step67-item-modal';m.className='fixed inset-0 z-[100000] bg-slate-950/75 backdrop-blur-sm hidden p-3 items-center justify-center';m.onclick=e=>{if(e.target===m)window.closeStep67ItemEditor();};document.body.appendChild(m);}return m;};
  window.closeStep67ItemEditor=()=>{const m=document.getElementById('step67-item-modal');if(m){m.classList.add('hidden');m.classList.remove('flex');m.innerHTML='';}};
  window.apriStep67ItemEditor=async function(projectId,itemKey,enrollmentId=''){
    const m=editorModal();m.classList.remove('hidden');m.classList.add('flex');
    m.innerHTML='<div class="bg-white rounded-3xl p-7 shadow-2xl"><p class="font-black uppercase">Caricamento stato reale…</p></div>';
    const map=await getCompletionItemsForProjects([projectId]);
    const row=findRow(indexRows(map[projectId]||[]),itemKey,enrollmentId||null);
    const s=documentState(row,{mode:'paper',activityStatus:'pending',recordingStatus:'pending',evidenceStatus:'none'});
    const options=(values,current)=>values.map(([value,label])=>`<option value="${value}" ${current===value?'selected':''}>${label}</option>`).join('');
    m.innerHTML=`<form onsubmit="event.preventDefault();window.salvaStep67ItemEditor()" class="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden"><div class="p-5 bg-slate-900 text-white flex justify-between gap-3"><div><p class="text-[9px] font-black uppercase tracking-widest text-cyan-300">Step 67 · attività reale / registrazione / evidenza</p><h2 class="text-xl font-black uppercase">${esc(LABELS[itemKey]||itemKey)}</h2></div><button type="button" onclick="window.closeStep67ItemEditor()" class="w-10 h-10 rounded-xl bg-white/10"><i data-lucide="x" class="w-5 h-5 mx-auto"></i></button></div><div class="p-5 space-y-4 bg-slate-50"><input id="step67-project" type="hidden" value="${esc(projectId)}"><input id="step67-item-key" type="hidden" value="${esc(itemKey)}"><input id="step67-enrollment" type="hidden" value="${esc(enrollmentId||'')}"><div class="grid grid-cols-1 md:grid-cols-2 gap-3"><label class="text-[10px] font-black uppercase text-slate-600">Modalità<select id="step67-mode" class="w-full mt-1 px-3 py-2 rounded-xl border bg-white">${options([['paper','Cartacea'],['digital','Digitale'],['hybrid','Ibrida'],['not_applicable','Non applicabile']],s.mode)}</select></label><label class="text-[10px] font-black uppercase text-slate-600">Attività reale<select id="step67-activity" class="w-full mt-1 px-3 py-2 rounded-xl border bg-white">${options([['pending','Da svolgere / da confermare'],['completed','Svolta'],['not_applicable','Non applicabile']],s.activityStatus)}</select></label><label class="text-[10px] font-black uppercase text-slate-600">Registrazione gestionale<select id="step67-recording" class="w-full mt-1 px-3 py-2 rounded-xl border bg-white">${options([['pending','Da registrare'],['recorded','Registrata'],['not_applicable','Non applicabile']],s.recordingStatus)}</select></label><label class="text-[10px] font-black uppercase text-slate-600">Evidenza documentale<select id="step67-evidence" class="w-full mt-1 px-3 py-2 rounded-xl border bg-white">${options([['none','Nessuna / da classificare'],['paper_original','Originale cartaceo presente'],['scan_available','Scansione disponibile'],['digital','Evidenza digitale'],['not_applicable','Non applicabile']],s.evidenceStatus)}</select></label></div><label class="block text-[10px] font-black uppercase text-slate-600">Link o percorso evidenza<input id="step67-evidence-url" value="${esc(s.evidenceUrl)}" class="w-full mt-1 px-3 py-2 rounded-xl border bg-white" placeholder="Opzionale"></label><label class="block text-[10px] font-black uppercase text-slate-600">Note<textarea id="step67-notes" rows="3" class="w-full mt-1 px-3 py-2 rounded-xl border bg-white">${esc(s.notes)}</textarea></label><p class="text-[11px] text-slate-500">La registrazione descrive ciò che è avvenuto realmente. Una scansione assente non trasforma un’attività cartacea svolta in attività mancante.</p></div><div class="p-4 bg-white border-t flex justify-end gap-2"><button type="button" onclick="window.closeStep67ItemEditor()" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-[10px] font-black uppercase">Annulla</button><button type="submit" class="px-5 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase">Salva stato</button></div></form>`;
    if(window.lucide)lucide.createIcons();
  };
  window.salvaStep67ItemEditor=async function(){
    const projectId=document.getElementById('step67-project')?.value||'', itemKey=document.getElementById('step67-item-key')?.value||'', enrollmentId=document.getElementById('step67-enrollment')?.value||null;
    try{
      await saveCompletionItem({projectId,itemKey,iscrizioneId:enrollmentId,mode:document.getElementById('step67-mode')?.value,activity_status:document.getElementById('step67-activity')?.value,recording_status:document.getElementById('step67-recording')?.value,evidence_status:document.getElementById('step67-evidence')?.value,evidence_url:document.getElementById('step67-evidence-url')?.value,notes:document.getElementById('step67-notes')?.value});
      window.closeStep67ItemEditor();
      if(window.showSafetyToast)window.showSafetyToast('Stato reale aggiornato.',{type:'ok',title:'Step 67'});
      if(document.getElementById('safety-checklist-modal')&&!document.getElementById('safety-checklist-modal').classList.contains('hidden')&&window.apriChecklistCorso)await window.apriChecklistCorso(projectId);
      else if(document.getElementById('safety-close-course-modal')&&!document.getElementById('safety-close-course-modal').classList.contains('hidden')&&window.apriChiusuraCorso)await window.apriChiusuraCorso(projectId);
      else if(window.loadDashboardStats)await window.loadDashboardStats();
    }catch(error){alert('Stato non salvato: '+(error.message||error));}
  };

  window.SafetyStep67={CATEGORIES,LABELS,evaluateCourse,evaluateProject,evaluateProjects,getCompletionItemsForProjects,getEffectivenessForProjects,saveCompletionItem,effectivenessState};
  window.buildSafetyCourseCompletionState=evaluateCourse;
})();
