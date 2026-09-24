// Qualifiche docenti e verifica informativa per progetto
(() => {
  if (window.__safetyTeacherQualificationAdvisorLoaded) return;
  window.__safetyTeacherQualificationAdvisorLoaded = true;

  const esc = v => window.dashEscape ? window.dashEscape(v) : String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = v => !v ? '-' : (window.formatDataToItalian ? window.formatDataToItalian(String(v).slice(0,10)) : String(v).slice(0,10));
  const AREA_LABELS = {
    normativa_giuridica_organizzativa:'Normativa / giuridica / organizzativa',
    rischi_tecnici_igienico_sanitari:'Rischi tecnici / igienico-sanitari',
    relazioni_comunicazione:'Relazioni / comunicazione'
  };
  const TYPE_LABELS = {
    di2013_general:'Qualificazione generale D.I. 6/3/2013',
    equipment_theory:'Attrezzature - modulo teorico/tecnico',
    equipment_practical:'Attrezzature - modulo pratico',
    confined_theory:'Ambienti confinati - modulo giuridico/tecnico',
    confined_practical:'Ambienti confinati - modulo pratico',
    other_specific:'Altro requisito specifico'
  };
  const SCOPE_LABELS = {
    att_carrelli:'Carrelli elevatori / telescopici / rotativi',
    att_ple:'PLE',
    att_mmt:'Macchine movimento terra',
    att_gru_autocarro:'Gru per autocarro',
    att_gru_torre:'Gru a torre',
    att_pompe:'Pompe per calcestruzzo',
    att_trattori:'Trattori agricoli/forestali',
    att_crf:'Raccoglifrutta CRF',
    att_cmm:'Caricatori movimentazione materiali CMM',
    att_carroponte:'Carroponte / gru a cavalletto',
    confinati:'Ambienti sospetti di inquinamento o confinati',
    quota:'Lavori in quota'
  };
  const state={currentDocenteId:null, cache:null, cacheAt:0};

  const asArray=v=>Array.isArray(v)?v:(typeof v==='string'?(()=>{try{return JSON.parse(v)||[]}catch(_){return[]}})():[]);
  const parseObj=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:(typeof v==='string'?(()=>{try{return JSON.parse(v)||{}}catch(_){return{}}})():{});
  const addMonths=(value,months)=>{
    if(!value)return null; const p=String(value).slice(0,10).split('-').map(Number); if(p.length!==3||p.some(Number.isNaN))return null;
    const [y,m,d]=p, idx=m-1+months, ty=y+Math.floor(idx/12), tm=((idx%12)+12)%12, last=new Date(Date.UTC(ty,tm+1,0)).getUTCDate();
    return new Date(Date.UTC(ty,tm,Math.min(d,last))).toISOString().slice(0,10);
  };
  const todayIso=()=>new Date().toISOString().slice(0,10);
  const isPast=v=>!!v && String(v).slice(0,10)<todayIso();

  function courseScope(courseId=''){
    if(/carrelli/i.test(courseId))return'att_carrelli';
    if(/\bple\b/i.test(courseId))return'att_ple';
    if(/mmt|escav/i.test(courseId))return'att_mmt';
    if(/gru_autocarro/i.test(courseId))return'att_gru_autocarro';
    if(/gru_torre/i.test(courseId))return'att_gru_torre';
    if(/pompe/i.test(courseId))return'att_pompe';
    if(/trattori/i.test(courseId))return'att_trattori';
    if(/\bcrf\b/i.test(courseId))return'att_crf';
    if(/\bcmm\b/i.test(courseId))return'att_cmm';
    if(/carroponte/i.test(courseId))return'att_carroponte';
    if(/confinati/i.test(courseId))return'confinati';
    if(/quota/i.test(courseId))return'quota';
    return'';
  }
  const isEquipment=id=>/^attr_|^agg_attr_|agg_attrezzature/i.test(id||'');
  const isConfined=id=>/confinati/i.test(id||'');

  function inferArea(module={}) {
    const text=((module.m||'')+' '+(module.d||'')).toLowerCase();
    if(/comunic|relaz|partecip|consult|percezion|interaz|didattic/.test(text)) return 'relazioni_comunicazione';
    if(/normativ|giurid|legisl|organizz|obbligh|responsabil|ruoli|sistema istituz|vigilanza/.test(text)) return 'normativa_giuridica_organizzativa';
    return 'rischi_tecnici_igienico_sanitari';
  }
  const isPracticalModule=module=>/pratic|esercit|manovr|addestr|prova pratica|simulaz/.test(((module?.m||'')+' '+(module?.d||'')).toLowerCase());

  async function loadAll(force=false){
    if(state.cache&&!force&&Date.now()-state.cacheAt<30000)return state.cache;
    const [{data:teachers,error:te},{data:quals,error:qe}]=await Promise.all([
      window.supabaseClient.from('docenti').select('*'),
      window.supabaseClient.from('teacher_qualifications').select('*')
    ]);
    if(te)throw te;if(qe)throw qe;
    state.cache={teachers:teachers||[],quals:quals||[]};state.cacheAt=Date.now();return state.cache;
  }
  function invalidate(){state.cache=null;state.cacheAt=0;if(window.ComplianceAdvisor?.render)window.ComplianceAdvisor.render().catch(()=>{});}

  function generalUpdateState(q){
    const base=q.last_update_date||q.qualification_date||q.valid_from||(q.verified_at?String(q.verified_at).slice(0,10):'');
    const due=base?addMonths(base,36):null;
    return {base,due,overdue:due?isPast(due):false};
  }

  async function evaluateProject(project){
    const courseId=project?.corso_id||'';
    const course=window.DB_CORSI?.[courseId]||{};
    const assignments=parseObj(project?.docenti_ud||project?.docente_principale||{});
    const entries=Object.entries(assignments).filter(([_,id])=>!!id);
    const out=[];
    if(!entries.length){
      out.push({code:'TEACHERS_NOT_ASSIGNED',severity:'warning',message:'Docenti non ancora assegnati alle unità didattiche.',detail:'L’Advisor non blocca il progetto.'});
      return out;
    }

    const {teachers,quals}=await loadAll();
    const modules=new Map((course.prog||[]).map(m=>[m.ud,m]));
    let allStructured=true;

    for(const [ud,teacherId] of entries){
      const teacher=teachers.find(t=>String(t.id)===String(teacherId));
      const name=teacher?.nome_cognome||('Docente '+teacherId);
      const records=quals.filter(q=>String(q.docente_id)===String(teacherId));
      const verified=records.filter(q=>q.status==='verified' && (!q.valid_to || !isPast(q.valid_to)));
      const general=verified.filter(q=>q.qualification_type==='di2013_general');
      const module=modules.get(ud)||{ud,m:ud,d:''};
      const area=inferArea(module);

      if(!general.length){
        allStructured=false;
        const legacy=teacher?.requisito_normativo||teacher?.qualifica||'';
        out.push({code:'TEACHER_GENERAL_'+teacherId,severity:'warning',message:`${name}: qualificazione D.I. 6/3/2013 non ancora verificata nella scheda strutturata.`,detail:legacy?`Dato storico presente: ${legacy}`:'Apri Qualifiche docente per documentare criterio, area ed evidenza.'});
      }else{
        const areaGeneral=general.filter(q=>asArray(q.thematic_areas).includes(area));
        if(!areaGeneral.length){
          out.push({code:'TEACHER_AREA_'+teacherId+'_'+ud,severity:'warning',message:`${name} · ${ud}: area tematica “${AREA_LABELS[area]}” non documentata nelle qualifiche verificate.`,detail:'Verificare che conoscenza/esperienza e capacità didattica siano riferibili all’area della docenza.'});
        }
        const updates=(areaGeneral.length?areaGeneral:general).map(q=>({q,...generalUpdateState(q)}));
        if(updates.some(x=>x.overdue)){
          out.push({code:'TEACHER_UPDATE_'+teacherId,severity:'warning',message:`${name}: aggiornamento professionale triennale da verificare.`,detail:'La scheda strutturata indica una data di aggiornamento/qualificazione oltre il triennio.'});
        }else if(updates.every(x=>!x.due)){
          out.push({code:'TEACHER_UPDATE_DATE_'+teacherId,severity:'info',message:`${name}: data utile per il controllo dell’aggiornamento triennale non ancora documentata.`});
        }
        if(general.some(q=>q.education_prerequisite_met===false)){
          out.push({code:'TEACHER_EDU_'+teacherId,severity:'warning',message:`${name}: prerequisito di istruzione indicato come non soddisfatto.`,detail:'Verificare l’eventuale eccezione applicabile al caso concreto e conservarne evidenza.'});
        }
      }

      const scope=courseScope(courseId);
      if(isEquipment(courseId)){
        const practical=isPracticalModule(module);
        const specific=verified.filter(q=>q.qualification_type===(practical?'equipment_practical':'equipment_theory') && asArray(q.course_scopes).includes(scope));
        const alternative=!practical?verified.filter(q=>q.qualification_type==='equipment_practical' && asArray(q.course_scopes).includes(scope) && q.technical_knowledge_documented):[];
        const candidates=[...specific,...alternative];
        if(!candidates.length){
          out.push({code:'TEACHER_EQUIPMENT_'+teacherId+'_'+ud,severity:'warning',message:`${name} · ${ud}: requisito specifico per ${SCOPE_LABELS[scope]||'attrezzatura'} da documentare.`,detail:practical?'Per la parte pratica registrare esperienza professionale pratica documentata e verificabile.':'Per la parte teorico-tecnica documentare la conoscenza tecnica specifica dell’attrezzatura.'});
        }else if(practical && !candidates.some(q=>Number(q.experience_years||0)>=3 && q.practical_experience_documented===true)){
          out.push({code:'TEACHER_EQUIPMENT_EXP_'+teacherId+'_'+ud,severity:'warning',message:`${name} · ${ud}: esperienza pratica triennale documentata non ancora confermata per ${SCOPE_LABELS[scope]||'attrezzatura'}.`});
        }else if(!practical && !candidates.some(q=>q.technical_knowledge_documented===true)){
          out.push({code:'TEACHER_EQUIPMENT_TECH_'+teacherId+'_'+ud,severity:'warning',message:`${name} · ${ud}: conoscenza tecnica specifica dell’attrezzatura non marcata come documentata.`});
        }
      }

      if(isConfined(courseId)){
        const practical=isPracticalModule(module);
        const type=practical?'confined_practical':'confined_theory';
        const candidates=verified.filter(q=>q.qualification_type===type && asArray(q.course_scopes).includes('confinati'));
        if(!candidates.length){
          out.push({code:'TEACHER_CONFINED_'+teacherId+'_'+ud,severity:'warning',message:`${name} · ${ud}: esperienza specifica per ambienti confinati da documentare.`,detail:practical?'Per il modulo pratico verificare esperienza professionale pratica almeno triennale.':'Per il modulo giuridico-tecnico verificare esperienza professionale almeno triennale nel settore.'});
        }else if(!candidates.some(q=>Number(q.experience_years||0)>=3 && (!practical || q.practical_experience_documented===true))){
          out.push({code:'TEACHER_CONFINED_EXP_'+teacherId+'_'+ud,severity:'warning',message:`${name} · ${ud}: esperienza triennale documentata per ambienti confinati non ancora confermata.`});
        }
      }
    }

    if(allStructured && !out.some(x=>x.severity==='warning'||x.severity==='critical')){
      out.push({code:'TEACHER_QUALIFICATIONS_OK',severity:'info',message:'Qualifiche strutturate dei docenti assegnati: nessuna anomalia rilevata dai controlli disponibili.',detail:'Resta una verifica documentale dell’operatore, non una certificazione automatica.'});
    }
    return out;
  }

  function ensureModal(){
    let m=document.getElementById('teacher-qualification-modal');
    if(m)return m;
    m=document.createElement('div');m.id='teacher-qualification-modal';m.className='hidden fixed inset-0 z-[130] bg-slate-950/70 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto';
    m.onclick=e=>{if(e.target===m)close();};document.body.appendChild(m);return m;
  }
  async function getTeacher(id){
    const {teachers}=await loadAll();return teachers.find(t=>String(t.id)===String(id))||null;
  }
  async function getRecords(id){
    const {quals}=await loadAll();return quals.filter(q=>String(q.docente_id)===String(id)).sort((a,b)=>String(b.updated_at||'').localeCompare(String(a.updated_at||'')));
  }
  const statusMeta=s=>({
    verified:['Verificata','bg-emerald-50 text-emerald-800 border-emerald-200'],
    draft:['Da verificare','bg-amber-50 text-amber-900 border-amber-200'],
    expired:['Scaduta / da aggiornare','bg-rose-50 text-rose-800 border-rose-200'],
    rejected:['Non confermata','bg-slate-100 text-slate-700 border-slate-200']
  }[s]||['Da verificare','bg-amber-50 text-amber-900 border-amber-200']);

  function checkboxes(dict,selected,cls,prefix){
    const set=new Set(asArray(selected));
    return Object.entries(dict).map(([v,l])=>`<label class="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-2 text-[9px]"><input type="checkbox" class="${cls} mt-0.5" value="${esc(v)}" ${set.has(v)?'checked':''}><span><strong>${esc(l)}</strong></span></label>`).join('');
  }
  function renderForm(r={}){
    return `<form id="teacher-qualification-form" onsubmit="event.preventDefault();window.TeacherQualificationAdvisor.save()" class="rounded-2xl border border-violet-200 bg-violet-50/60 p-4 space-y-3">
      <input type="hidden" id="tq-id" value="${esc(r.id||'')}">
      <div><p class="font-black uppercase text-violet-950 text-[10px]">Scheda requisito / qualifica</p><p class="text-[9px] text-violet-800 mt-1">La verifica resta documentale e non blocca l’assegnazione del docente.</p></div>
      <div><label class="text-[8px] font-black uppercase text-slate-500">Tipo requisito</label><select id="tq-type" class="w-full mt-1 px-2 py-2 rounded-lg border border-violet-200 bg-white text-[10px]">${Object.entries(TYPE_LABELS).map(([v,l])=>`<option value="${v}" ${r.qualification_type===v?'selected':''}>${esc(l)}</option>`).join('')}</select></div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div><label class="text-[8px] font-black uppercase text-slate-500">Criterio D.I. 6/3/2013</label><select id="tq-criterion" class="w-full mt-1 px-2 py-2 rounded-lg border border-violet-200 bg-white text-[10px]"><option value="">Non applicabile / da indicare</option>${[1,2,3,4,5,6].map(n=>`<option value="${n}" ${String(r.criterion_code||'')===String(n)?'selected':''}>${n}° criterio</option>`).join('')}</select></div>
        <div><label class="text-[8px] font-black uppercase text-slate-500">Stato documentale</label><select id="tq-status" class="w-full mt-1 px-2 py-2 rounded-lg border border-violet-200 bg-white text-[10px]"><option value="draft" ${(r.status||'draft')==='draft'?'selected':''}>Da verificare</option><option value="verified" ${r.status==='verified'?'selected':''}>Verificata</option><option value="expired" ${r.status==='expired'?'selected':''}>Scaduta / da aggiornare</option><option value="rejected" ${r.status==='rejected'?'selected':''}>Non confermata</option></select></div>
      </div>
      <div><p class="text-[8px] font-black uppercase text-slate-500 mb-1">Aree tematiche documentate</p><div class="grid grid-cols-1 gap-1">${checkboxes(AREA_LABELS,r.thematic_areas,'tq-area')}</div></div>
      <div><p class="text-[8px] font-black uppercase text-slate-500 mb-1">Ambiti specifici documentati</p><div class="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-52 overflow-y-auto">${checkboxes(SCOPE_LABELS,r.course_scopes,'tq-scope')}</div></div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div><label class="text-[8px] font-black uppercase text-slate-500">Data conseguimento</label><input type="date" id="tq-qualification-date" value="${esc(r.qualification_date||r.valid_from||'')}" class="w-full mt-1 px-2 py-2 rounded-lg border border-violet-200 bg-white text-[10px]"></div>
        <div><label class="text-[8px] font-black uppercase text-slate-500">Ultimo aggiornamento</label><input type="date" id="tq-last-update" value="${esc(r.last_update_date||'')}" class="w-full mt-1 px-2 py-2 rounded-lg border border-violet-200 bg-white text-[10px]"></div>
        <div><label class="text-[8px] font-black uppercase text-slate-500">Validità documentale fino al</label><input type="date" id="tq-valid-to" value="${esc(r.valid_to||'')}" class="w-full mt-1 px-2 py-2 rounded-lg border border-violet-200 bg-white text-[10px]"></div>
        <div><label class="text-[8px] font-black uppercase text-slate-500">Esperienza specifica (anni)</label><input type="number" step="0.5" min="0" id="tq-experience" value="${r.experience_years??''}" class="w-full mt-1 px-2 py-2 rounded-lg border border-violet-200 bg-white text-[10px]"></div>
        <div><label class="text-[8px] font-black uppercase text-slate-500">Metodo aggiornamento</label><select id="tq-update-method" class="w-full mt-1 px-2 py-2 rounded-lg border border-violet-200 bg-white text-[10px]"><option value="">Da indicare</option><option value="formazione" ${r.update_method==='formazione'?'selected':''}>Formazione / seminari / convegni</option><option value="docenza" ${r.update_method==='docenza'?'selected':''}>Attività di docenza</option><option value="altro" ${r.update_method==='altro'?'selected':''}>Altro / da verificare</option></select></div>
        <div><label class="text-[8px] font-black uppercase text-slate-500">Ore aggiornamento documentate</label><input type="number" step="0.5" min="0" id="tq-update-hours" value="${r.update_hours??''}" class="w-full mt-1 px-2 py-2 rounded-lg border border-violet-200 bg-white text-[10px]"></div>
      </div>
      <div class="grid grid-cols-1 gap-1">
        <label class="flex items-start gap-2 rounded-lg border border-violet-200 bg-white p-2 text-[9px]"><select id="tq-education" class="rounded border border-slate-300 text-[9px]"><option value="" ${r.education_prerequisite_met==null?'selected':''}>Da verificare</option><option value="true" ${r.education_prerequisite_met===true?'selected':''}>Sì</option><option value="false" ${r.education_prerequisite_met===false?'selected':''}>No</option></select><span><strong>Prerequisito di istruzione</strong> documentato / verificato.</span></label>
        <label class="flex items-start gap-2 rounded-lg border border-violet-200 bg-white p-2 text-[9px]"><input id="tq-technical" type="checkbox" class="mt-0.5" ${r.technical_knowledge_documented?'checked':''}><span><strong>Conoscenza tecnica specifica</strong> documentata per l’ambito selezionato.</span></label>
        <label class="flex items-start gap-2 rounded-lg border border-violet-200 bg-white p-2 text-[9px]"><input id="tq-practical-doc" type="checkbox" class="mt-0.5" ${r.practical_experience_documented?'checked':''}><span><strong>Esperienza pratica</strong> supportata da documentazione verificabile.</span></label>
      </div>
      <div><label class="text-[8px] font-black uppercase text-slate-500">Evidenza / documento</label><input id="tq-evidence" value="${esc(r.evidence_url||'')}" class="w-full mt-1 px-2 py-2 rounded-lg border border-violet-200 bg-white text-[10px]" placeholder="URL o percorso archivio"></div>
      <div><label class="text-[8px] font-black uppercase text-slate-500">Riferimento normativo / fonte</label><input id="tq-source-ref" value="${esc(r.source_reference||'')}" class="w-full mt-1 px-2 py-2 rounded-lg border border-violet-200 bg-white text-[10px]" placeholder="Es. D.I. 6 marzo 2013; ASR 17/04/2025"></div>
      <div><label class="text-[8px] font-black uppercase text-slate-500">Ambito / descrizione libera</label><input id="tq-scope" value="${esc(r.scope||'')}" class="w-full mt-1 px-2 py-2 rounded-lg border border-violet-200 bg-white text-[10px]" placeholder="Specificare settore, attrezzatura, esperienza..."></div>
      <div><label class="text-[8px] font-black uppercase text-slate-500">Note</label><textarea id="tq-notes" rows="2" class="w-full mt-1 px-2 py-2 rounded-lg border border-violet-200 bg-white text-[10px]">${esc(r.notes||'')}</textarea></div>
      <div class="flex flex-col sm:flex-row gap-2"><button type="submit" class="flex-1 px-3 py-2 rounded-xl bg-violet-700 hover:bg-violet-600 text-white text-[9px] font-black uppercase">Salva qualifica</button><button type="button" onclick="window.TeacherQualificationAdvisor.resetForm()" class="px-3 py-2 rounded-xl bg-white border border-violet-200 text-violet-800 text-[9px] font-black uppercase">Nuova scheda</button></div>
    </form>`;
  }

  function renderRecords(records){
    if(!records.length)return'<div class="rounded-xl border border-violet-200 bg-violet-50 p-4 text-xs text-violet-800">Nessuna qualifica strutturata registrata. I dati anagrafici del docente restano invariati.</div>';
    return records.map(r=>{
      const sm=statusMeta(r.status),up=generalUpdateState(r);
      return `<article class="rounded-xl border border-slate-200 bg-white p-3">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2"><div><p class="font-black text-slate-900 text-xs">${esc(TYPE_LABELS[r.qualification_type]||r.qualification_type)}</p><p class="text-[9px] text-slate-500 mt-0.5">${r.criterion_code?`${esc(r.criterion_code)}° criterio · `:''}${esc(r.source_reference||'Fonte non indicata')}</p></div><span class="self-start inline-flex rounded-full border px-2 py-1 text-[8px] font-black uppercase ${sm[1]}">${sm[0]}</span></div>
        <div class="mt-2 flex flex-wrap gap-1">${asArray(r.thematic_areas).map(x=>`<span class="rounded-full bg-blue-50 text-blue-800 border border-blue-100 px-2 py-1 text-[8px] font-bold">${esc(AREA_LABELS[x]||x)}</span>`).join('')}${asArray(r.course_scopes).map(x=>`<span class="rounded-full bg-violet-50 text-violet-800 border border-violet-100 px-2 py-1 text-[8px] font-bold">${esc(SCOPE_LABELS[x]||x)}</span>`).join('')}</div>
        <div class="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[9px] text-slate-600"><div><strong>Conseguita</strong><br>${esc(fmt(r.qualification_date||r.valid_from))}</div><div><strong>Aggiornamento</strong><br>${esc(fmt(r.last_update_date))}</div><div><strong>Prossimo controllo</strong><br>${esc(fmt(up.due))}</div><div><strong>Esperienza</strong><br>${r.experience_years??'-'} anni</div></div>
        ${r.notes?`<p class="mt-2 rounded-lg bg-slate-50 p-2 text-[9px] text-slate-700">${esc(r.notes)}</p>`:''}
        <div class="mt-2 flex flex-wrap gap-2">${r.evidence_url?`<a href="${esc(r.evidence_url)}" target="_blank" rel="noopener" class="px-2 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-100 text-[8px] font-black uppercase">Evidenza</a>`:''}<button type="button" onclick="window.TeacherQualificationAdvisor.edit('${esc(r.id)}')" class="px-2 py-1 rounded-lg bg-violet-50 text-violet-800 border border-violet-100 text-[8px] font-black uppercase">Modifica</button><button type="button" onclick="window.TeacherQualificationAdvisor.remove('${esc(r.id)}')" class="px-2 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-100 text-[8px] font-black uppercase">Elimina</button></div>
      </article>`;
    }).join('');
  }

  async function renderModal(docenteId,editing=null){
    const modal=ensureModal(), teacher=await getTeacher(docenteId), records=await getRecords(docenteId);
    modal.classList.remove('hidden');
    const legacy=[teacher?.requisito_normativo&&`Requisito storico: ${teacher.requisito_normativo}`,teacher?.esperienza_pratica_anni!=null&&`Esperienza pratica storica: ${teacher.esperienza_pratica_anni} anni`,teacher?.note_requisiti&&`Note: ${teacher.note_requisiti}`].filter(Boolean);
    modal.innerHTML=`<div class="max-w-6xl mx-auto bg-slate-50 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
      <div class="bg-slate-900 text-white px-5 py-4 flex items-start justify-between gap-4"><div><p class="text-[9px] font-black uppercase tracking-widest text-violet-300">Qualifiche docente</p><h2 class="text-xl font-black mt-1">${esc(teacher?.nome_cognome||'Docente')}</h2><p class="text-[10px] text-slate-300 mt-1">${esc(teacher?.qualifica||'')}</p></div><button type="button" onclick="window.TeacherQualificationAdvisor.close()" class="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center"><i data-lucide="x" class="w-4 h-4"></i></button></div>
      <div class="p-4 sm:p-5">
        <div class="rounded-xl border border-blue-200 bg-blue-50 p-3 text-[10px] text-blue-950 mb-4"><strong>Verifica documentale, non blocco:</strong> D.I. 6 marzo 2013 e requisiti specifici ASR vengono usati per generare avvisi. L’assegnazione del docente resta sempre possibile.</div>
        ${legacy.length?`<div class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[9px] text-amber-950 mb-4"><strong>Dati storici già presenti:</strong><ul class="list-disc ml-4 mt-1">${legacy.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p class="mt-1">Non vengono convertiti automaticamente in “verificati”.</p></div>`:''}
        <div class="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-5"><div id="teacher-qualification-form-box">${renderForm(editing||{})}</div><div><div class="flex items-center justify-between gap-3 mb-2"><h3 class="font-black uppercase text-slate-900 text-xs">Qualifiche documentate</h3><span class="text-[9px] font-black text-violet-700">${records.length} record</span></div><div class="space-y-2 max-h-[720px] overflow-y-auto pr-1">${renderRecords(records)}</div></div></div>
      </div></div>`;
    if(window.lucide)lucide.createIcons();
  }
  async function open(id){state.currentDocenteId=id;const m=ensureModal();m.classList.remove('hidden');m.innerHTML='<div class="max-w-md mx-auto mt-20 bg-white rounded-2xl p-8 text-center"><i data-lucide="loader-2" class="w-7 h-7 animate-spin mx-auto mb-3 text-violet-700"></i><p class="font-black uppercase text-slate-800">Caricamento qualifiche...</p></div>';if(window.lucide)lucide.createIcons();try{await renderModal(id)}catch(e){m.innerHTML=`<div class="max-w-md mx-auto mt-20 bg-white rounded-2xl p-6 text-center border border-rose-200"><p class="font-black text-rose-800 uppercase">Qualifiche non disponibili</p><p class="text-xs text-slate-600 mt-2">${esc(e.message||e)}</p></div>`;}}
  function close(){document.getElementById('teacher-qualification-modal')?.classList.add('hidden');state.currentDocenteId=null;}

  async function save(){
    if(!state.currentDocenteId)return;
    const id=document.getElementById('tq-id')?.value||'', status=document.getElementById('tq-status')?.value||'draft', user=await window.getSafetyAdminUser?.();
    const education=document.getElementById('tq-education')?.value||'';
    const payload={
      docente_id:state.currentDocenteId,
      qualification_type:document.getElementById('tq-type')?.value||'di2013_general',
      criterion_code:document.getElementById('tq-criterion')?.value||null,
      thematic_areas:Array.from(document.querySelectorAll('.tq-area:checked')).map(x=>x.value),
      course_scopes:Array.from(document.querySelectorAll('.tq-scope:checked')).map(x=>x.value),
      qualification_date:document.getElementById('tq-qualification-date')?.value||null,
      valid_from:document.getElementById('tq-qualification-date')?.value||null,
      valid_to:document.getElementById('tq-valid-to')?.value||null,
      last_update_date:document.getElementById('tq-last-update')?.value||null,
      update_method:document.getElementById('tq-update-method')?.value||null,
      update_hours:document.getElementById('tq-update-hours')?.value?Number(document.getElementById('tq-update-hours').value):null,
      experience_years:document.getElementById('tq-experience')?.value?Number(document.getElementById('tq-experience').value):null,
      education_prerequisite_met:education===''?null:education==='true',
      technical_knowledge_documented:!!document.getElementById('tq-technical')?.checked,
      practical_experience_documented:!!document.getElementById('tq-practical-doc')?.checked,
      evidence_url:(document.getElementById('tq-evidence')?.value||'').trim()||null,
      source_reference:(document.getElementById('tq-source-ref')?.value||'').trim()||null,
      scope:(document.getElementById('tq-scope')?.value||'').trim()||null,
      notes:(document.getElementById('tq-notes')?.value||'').trim()||null,
      status,
      verified_by:status==='verified'?(user?.id||null):null,
      verified_at:status==='verified'?new Date().toISOString():null,
      updated_at:new Date().toISOString()
    };
    let error;if(id)({error}=await window.supabaseClient.from('teacher_qualifications').update(payload).eq('id',id));else({error}=await window.supabaseClient.from('teacher_qualifications').insert(payload));
    if(error)return alert('Qualifica non salvata: '+(error.message||error));
    if(window.safetyAudit)await window.safetyAudit('teacher_qualification_saved',{table_name:'teacher_qualifications',record_id:id||null,details:{docente_id:state.currentDocenteId,type:payload.qualification_type,status}});
    invalidate();await renderModal(state.currentDocenteId);
  }
  async function edit(id){const {data,error}=await window.supabaseClient.from('teacher_qualifications').select('*').eq('id',id).single();if(error)return alert('Qualifica non disponibile: '+(error.message||error));state.currentDocenteId=data.docente_id;await renderModal(data.docente_id,data);setTimeout(()=>document.getElementById('teacher-qualification-form')?.scrollIntoView({behavior:'smooth',block:'start'}),80);}
  async function remove(id){if(!confirm('Eliminare questa scheda qualifica? L’anagrafica docente e i progetti non vengono toccati.'))return;const {error}=await window.supabaseClient.from('teacher_qualifications').delete().eq('id',id);if(error)return alert('Eliminazione non riuscita: '+(error.message||error));if(window.safetyAudit)await window.safetyAudit('teacher_qualification_deleted',{table_name:'teacher_qualifications',record_id:id,details:{docente_id:state.currentDocenteId}});invalidate();await renderModal(state.currentDocenteId);}
  async function resetForm(){if(state.currentDocenteId)await renderModal(state.currentDocenteId);}

  window.TeacherQualificationAdvisor={open,close,save,edit,remove,resetForm,evaluateProject,loadAll,invalidate,courseScope,AREA_LABELS,SCOPE_LABELS,TYPE_LABELS};
  window.apriQualificheDocente=open;
})();
