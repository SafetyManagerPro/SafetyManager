// Formazione pregressa, crediti e scadenze suggerite - advisory only
(() => {
  if (window.__safetyTrainingHistoryAdvisorLoaded) return;
  window.__safetyTrainingHistoryAdvisorLoaded = true;

  const esc = v => window.dashEscape ? window.dashEscape(v) : String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = v => !v ? '-' : (window.formatDataToItalian ? window.formatDataToItalian(String(v).slice(0,10)) : String(v).slice(0,10));
  const state = { rules: new Map(), loaded: false, loading: null, currentCorsistaId: null };

  const UPDATE_RULE_BY_COURSE = {
    lav_basso: 'LAV_AGG', lav_medio: 'LAV_AGG', lav_alto: 'LAV_AGG', agg_lav: 'LAV_AGG',
    preposto: 'PREPOSTO_AGG', agg_prep: 'PREPOSTO_AGG',
    dirigente: 'DIRIGENTE_AGG', agg_dir: 'DIRIGENTE_AGG',
    dl_base: 'DL_AGG', agg_dl: 'DL_AGG',
    dl_spp_comune: 'DL_RSPP_AGG', dl_spp_agri: 'DL_RSPP_AGG', dl_spp_pesca: 'DL_RSPP_AGG',
    dl_spp_costruzioni: 'DL_RSPP_AGG', dl_spp_chimico: 'DL_RSPP_AGG', agg_dl_spp: 'DL_RSPP_AGG'
  };

  async function loadNormativeRules(force = false) {
    if (state.loaded && !force) return state;
    if (state.loading && !force) return state.loading;
    state.loading = (async () => {
      if (window.ComplianceAdvisor?.loadRules) {
        const shared = await window.ComplianceAdvisor.loadRules(force);
        state.rules = shared?.rules instanceof Map ? shared.rules : new Map();
        state.loaded = true;
        return state;
      }
      if (!window.supabaseClient) return state;
      const { data: sets, error: se } = await window.supabaseClient.from('normative_rule_sets').select('id').eq('code','ASR_2025').limit(1);
      if (se) throw se;
      const id = sets?.[0]?.id;
      state.rules = new Map();
      if (id) {
        const { data: rules, error: re } = await window.supabaseClient.from('normative_training_rules').select('*').eq('rule_set_id',id).eq('active',true);
        if (re) throw re;
        (rules || []).forEach(r => state.rules.set(r.course_code,r));
      }
      state.loaded = true;
      return state;
    })();
    try { return await state.loading; } finally { state.loading = null; }
  }

  function addMonthsClamped(dateValue, months) {
    if (!dateValue || !Number.isFinite(Number(months))) return null;
    const parts = String(dateValue).slice(0,10).split('-').map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
    const [y,m,d] = parts;
    const targetIndex = (m - 1) + Number(months);
    const ty = y + Math.floor(targetIndex / 12);
    const tm = ((targetIndex % 12) + 12) % 12;
    const lastDay = new Date(Date.UTC(ty, tm + 1, 0)).getUTCDate();
    const day = Math.min(d, lastDay);
    return new Date(Date.UTC(ty, tm, day)).toISOString().slice(0,10);
  }

  function diffDays(a,b) {
    if (!a || !b) return null;
    const da = new Date(String(a).slice(0,10) + 'T00:00:00Z');
    const db = new Date(String(b).slice(0,10) + 'T00:00:00Z');
    if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return null;
    return Math.round((da - db) / 86400000);
  }

  async function getExpirySuggestion(row) {
    await loadNormativeRules();
    const courseId = row?.progetti?.corso_id || row?.corso_id || '';
    const examDate = row?.progetti?.data_esame || row?.data_esame || '';
    if (!courseId || !examDate) return null;

    let months = null;
    let source = '';
    let ruleCode = UPDATE_RULE_BY_COURSE[courseId] || '';
    const rule = ruleCode ? state.rules.get(ruleCode) : null;
    if (rule?.update_period_months) {
      months = Number(rule.update_period_months);
      source = 'Regola normativa strutturata';
    }

    if (!months) {
      const years = Number(window.DB_CORSI?.[courseId]?.scad || 0);
      if (years > 0 && years < 99) {
        months = years * 12;
        source = 'Periodicità catalogo';
        ruleCode = '';
      }
    }
    if (!months) return null;

    const date = addMonthsClamped(examDate, months);
    if (!date) return null;
    const actual = row?.data_scadenza || null;
    const delta = actual ? diffDays(actual,date) : null;
    return {
      date, months, source, ruleCode,
      actual,
      deltaDays: delta,
      status: !actual ? 'missing' : delta === 0 ? 'aligned' : 'different'
    };
  }

  function ensureModal() {
    let modal = document.getElementById('training-history-modal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'training-history-modal';
    modal.className = 'hidden fixed inset-0 z-[120] bg-slate-950/70 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto';
    modal.onclick = e => { if (e.target === modal) close(); };
    document.body.appendChild(modal);
    return modal;
  }

  async function fetchCorsista(corsistaId) {
    const cached = (window.corsistiList || []).find(c => String(c.id) === String(corsistaId));
    if (cached) return cached;
    const { data, error } = await window.supabaseClient.from('corsisti').select('id,nome_cognome,cf,azienda_id').eq('id',corsistaId).single();
    if (error) throw error;
    return data;
  }

  async function fetchManualCredits(corsistaId) {
    const { data, error } = await window.supabaseClient
      .from('training_credits')
      .select('*')
      .eq('corsista_id',corsistaId)
      .order('source_date',{ascending:false,nullsFirst:false});
    if (error) throw error;
    return data || [];
  }

  async function fetchInternalHistory(corsistaId) {
    const { data, error } = await window.supabaseClient
      .from('iscrizioni')
      .select('id,id_certificato,esito,data_scadenza,ore_frequentate,percentuale_frequenza,partecipazione_stato,partecipazione_motivo,progetti(id,codice,corso_id,data_esame)')
      .eq('corsista_id',corsistaId);
    if (error) throw error;
    return (data || []).sort((a,b) => String(b.progetti?.data_esame || '').localeCompare(String(a.progetti?.data_esame || '')));
  }

  const creditMeta = value => ({
    full: ['Riconoscimento totale','bg-emerald-50 text-emerald-800 border-emerald-200'],
    partial: ['Riconoscimento parziale','bg-blue-50 text-blue-800 border-blue-200'],
    none: ['Non riconosciuto','bg-slate-100 text-slate-700 border-slate-200'],
    needs_review: ['Da valutare','bg-amber-50 text-amber-900 border-amber-200']
  }[value] || ['Da valutare','bg-amber-50 text-amber-900 border-amber-200']);

  function courseOptions(selected='') {
    const entries = window.getActiveCorsiEntries ? window.getActiveCorsiEntries() : Object.entries(window.DB_CORSI || {}).filter(([_,c])=>!c.deprecated);
    return '<option value="">Attestato esterno / corso libero</option>' + entries.map(([id,c]) =>
      `<option value="${esc(id)}" ${id===selected?'selected':''}>[${esc(c.code || id)}] ${esc(c.t || id)}</option>`
    ).join('');
  }

  function ruleOptions(selected='') {
    const rules = [...state.rules.values()].sort((a,b)=>String(a.course_title||a.course_code).localeCompare(String(b.course_title||b.course_code)));
    return '<option value="">Nessuna regola target selezionata</option>' + rules.map(r =>
      `<option value="${esc(r.course_code)}" ${r.course_code===selected?'selected':''}>${esc(r.course_title || r.course_code)}</option>`
    ).join('');
  }

  function renderInternal(history) {
    if (!history.length) return '<div class="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">Nessun corso interno nello storico.</div>';
    return history.map(i => {
      const cid=i.progetti?.corso_id||'';
      const c=window.DB_CORSI?.[cid]||{};
      const flagged=window.SafetyEnrollmentStatus?.flagged(i)||false;
      return `<div class="rounded-xl border ${flagged?'border-rose-500 bg-rose-100':'border-slate-200 bg-white'} p-3">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div>
            <p class="font-black ${flagged?'text-rose-900':'text-slate-900'} text-xs">${esc(c.t||cid||'Corso')}</p>${flagged?`<p role="status" class="text-rose-900 font-black text-[10px] mt-1">⚠ ${esc(window.SafetyEnrollmentStatus.label(i))} — non valido ai fini della formazione</p>`:''}
            <p class="text-[9px] text-slate-500 mt-0.5">${esc(i.progetti?.codice||'')} · verifica ${esc(fmt(i.progetti?.data_esame))}</p>
          </div>
          <span class="font-mono text-[9px] ${flagged?'text-rose-900':'text-blue-700'}">${esc(i.id_certificato||'ID non registrato')}${flagged?' · NON CERTIFICABILE':''}</span>
        </div>
        <div class="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[9px]">
          <div><span class="text-slate-400 uppercase font-black">Esito</span><p class="font-bold ${flagged?'text-rose-900':'text-slate-700'}">${flagged?'SEGNALATO — '+esc(window.SafetyEnrollmentStatus.label(i)):esc(i.esito||'-')}</p></div>
          <div><span class="text-slate-400 uppercase font-black">Frequenza</span><p class="font-bold text-slate-700">${i.percentuale_frequenza==null?'-':esc(i.percentuale_frequenza+'%')}</p></div>
          <div><span class="text-slate-400 uppercase font-black">Ore</span><p class="font-bold text-slate-700">${i.ore_frequentate==null?'-':esc(i.ore_frequentate)}</p></div>
          <div><span class="text-slate-400 uppercase font-black">Scadenza</span><p class="font-bold text-slate-700">${esc(fmt(i.data_scadenza))}</p></div>
        </div>
      </div>`;
    }).join('');
  }

  function renderCredits(credits) {
    if (!credits.length) return '<div class="rounded-xl border border-violet-200 bg-violet-50 p-4 text-xs text-violet-800">Nessuna formazione pregressa esterna registrata.</div>';
    return credits.map(r => {
      const meta=creditMeta(r.credit_type);
      const title=r.source_title || window.DB_CORSI?.[r.source_course_id]?.t || 'Formazione pregressa';
      return `<article class="rounded-xl border border-violet-200 bg-white p-3">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div class="min-w-0">
            <p class="font-black text-slate-900 text-xs">${esc(title)}</p>
            <p class="text-[9px] text-slate-500 mt-0.5">${esc(fmt(r.source_date))}${r.source_issuer?' · '+esc(r.source_issuer):''}${r.source_certificate_id?' · Att. '+esc(r.source_certificate_id):''}</p>
          </div>
          <span class="inline-flex self-start rounded-full border px-2 py-1 text-[8px] font-black uppercase ${meta[1]}">${meta[0]}</span>
        </div>
        <div class="mt-2 text-[9px] text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-1">
          <p><strong>Ore:</strong> ${r.source_hours??'-'} · <strong>Riconosciute:</strong> ${r.recognized_hours??'-'}</p>
          <p><strong>Valida fino:</strong> ${esc(fmt(r.valid_until))}</p>
          <p><strong>Target:</strong> ${esc(r.target_course_code||'da definire')}</p>
          <p><strong>Decisione:</strong> ${esc(r.decision_status||'draft')}</p>
        </div>
        ${r.decision_notes?`<p class="mt-2 rounded-lg bg-slate-50 p-2 text-[9px] text-slate-700">${esc(r.decision_notes)}</p>`:''}
        <div class="mt-2 flex flex-wrap gap-2">
          ${r.evidence_url?`<a href="${esc(r.evidence_url)}" target="_blank" rel="noopener" class="px-2 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-100 text-[8px] font-black uppercase">Evidenza</a>`:''}
          <button type="button" onclick="window.TrainingHistoryAdvisor.edit('${esc(r.id)}')" class="px-2 py-1 rounded-lg bg-violet-50 text-violet-800 border border-violet-100 text-[8px] font-black uppercase">Modifica</button>
          <button type="button" onclick="window.TrainingHistoryAdvisor.remove('${esc(r.id)}')" class="px-2 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-100 text-[8px] font-black uppercase">Elimina</button>
        </div>
      </article>`;
    }).join('');
  }

  function renderForm(record={}) {
    const sourceCourse=record.source_course_id||'';
    return `<form id="training-credit-form" onsubmit="event.preventDefault(); window.TrainingHistoryAdvisor.save()" class="rounded-2xl border border-violet-200 bg-violet-50/60 p-4 space-y-3">
      <input type="hidden" id="th-credit-id" value="${esc(record.id||'')}">
      <div>
        <p class="font-black uppercase text-violet-950 text-[10px]">Aggiungi / valuta formazione pregressa</p>
        <p class="text-[9px] text-violet-800 mt-1">Il sistema archivia e suggerisce collegamenti, ma non assegna crediti automaticamente.</p>
      </div>
      <div>
        <label class="text-[8px] font-black uppercase text-slate-500">Corso sorgente, se presente nel catalogo</label>
        <select id="th-source-course" onchange="window.TrainingHistoryAdvisor.prefill()" class="w-full mt-1 px-2 py-2 rounded-lg border border-violet-200 bg-white text-[10px]">${courseOptions(sourceCourse)}</select>
      </div>
      <div>
        <label class="text-[8px] font-black uppercase text-slate-500">Titolo attestato / corso</label>
        <input id="th-source-title" value="${esc(record.source_title||'')}" class="w-full mt-1 px-2 py-2 rounded-lg border border-violet-200 bg-white text-[10px]" placeholder="Titolo come riportato sull'attestato">
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div><label class="text-[8px] font-black uppercase text-slate-500">Data</label><input type="date" id="th-source-date" value="${esc(record.source_date||'')}" class="w-full mt-1 px-2 py-2 rounded-lg border border-violet-200 bg-white text-[10px]"></div>
        <div><label class="text-[8px] font-black uppercase text-slate-500">Ore</label><input type="number" step="0.5" min="0" id="th-source-hours" value="${record.source_hours??''}" class="w-full mt-1 px-2 py-2 rounded-lg border border-violet-200 bg-white text-[10px]"></div>
        <div><label class="text-[8px] font-black uppercase text-slate-500">Ente emittente</label><input id="th-source-issuer" value="${esc(record.source_issuer||'')}" class="w-full mt-1 px-2 py-2 rounded-lg border border-violet-200 bg-white text-[10px]"></div>
        <div><label class="text-[8px] font-black uppercase text-slate-500">N. attestato</label><input id="th-source-certificate" value="${esc(record.source_certificate_id||'')}" class="w-full mt-1 px-2 py-2 rounded-lg border border-violet-200 bg-white text-[10px]"></div>
      </div>
      <div>
        <label class="text-[8px] font-black uppercase text-slate-500">Norma / standard dichiarato</label>
        <input id="th-source-standard" value="${esc(record.source_standard||'')}" class="w-full mt-1 px-2 py-2 rounded-lg border border-violet-200 bg-white text-[10px]" placeholder="Es. ASR 2025, ASR precedente, altro">
      </div>
      <div>
        <label class="text-[8px] font-black uppercase text-slate-500">Evidenza / scansione attestato</label>
        <input id="th-evidence-url" value="${esc(record.evidence_url||'')}" class="w-full mt-1 px-2 py-2 rounded-lg border border-violet-200 bg-white text-[10px]" placeholder="URL o percorso archivio">
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div><label class="text-[8px] font-black uppercase text-slate-500">Regola / percorso target</label><select id="th-target-rule" class="w-full mt-1 px-2 py-2 rounded-lg border border-violet-200 bg-white text-[10px]">${ruleOptions(record.target_course_code||'')}</select></div>
        <div><label class="text-[8px] font-black uppercase text-slate-500">Valutazione credito</label><select id="th-credit-type" class="w-full mt-1 px-2 py-2 rounded-lg border border-violet-200 bg-white text-[10px]">
          <option value="needs_review" ${(record.credit_type||'needs_review')==='needs_review'?'selected':''}>Da valutare</option>
          <option value="full" ${record.credit_type==='full'?'selected':''}>Riconoscimento totale</option>
          <option value="partial" ${record.credit_type==='partial'?'selected':''}>Riconoscimento parziale</option>
          <option value="none" ${record.credit_type==='none'?'selected':''}>Non riconosciuto</option>
        </select></div>
        <div><label class="text-[8px] font-black uppercase text-slate-500">Ore riconosciute</label><input type="number" step="0.5" min="0" id="th-recognized-hours" value="${record.recognized_hours??''}" class="w-full mt-1 px-2 py-2 rounded-lg border border-violet-200 bg-white text-[10px]"></div>
        <div><label class="text-[8px] font-black uppercase text-slate-500">Validità fino al</label><input type="date" id="th-valid-until" value="${esc(record.valid_until||'')}" class="w-full mt-1 px-2 py-2 rounded-lg border border-violet-200 bg-white text-[10px]"></div>
        <div><label class="text-[8px] font-black uppercase text-slate-500">Stato decisione</label><select id="th-decision-status" class="w-full mt-1 px-2 py-2 rounded-lg border border-violet-200 bg-white text-[10px]">
          <option value="draft" ${(record.decision_status||'draft')==='draft'?'selected':''}>Bozza / da verificare</option>
          <option value="approved" ${record.decision_status==='approved'?'selected':''}>Valutazione approvata</option>
          <option value="rejected" ${record.decision_status==='rejected'?'selected':''}>Valutazione respinta</option>
        </select></div>
      </div>
      <div><label class="text-[8px] font-black uppercase text-slate-500">Motivazione / note di valutazione</label><textarea id="th-decision-notes" rows="2" class="w-full mt-1 px-2 py-2 rounded-lg border border-violet-200 bg-white text-[10px]">${esc(record.decision_notes||'')}</textarea></div>
      <div class="flex flex-col sm:flex-row gap-2">
        <button type="submit" class="flex-1 px-3 py-2 rounded-xl bg-violet-700 hover:bg-violet-600 text-white text-[9px] font-black uppercase">Salva formazione pregressa</button>
        <button type="button" onclick="window.TrainingHistoryAdvisor.resetForm()" class="px-3 py-2 rounded-xl bg-white border border-violet-200 text-violet-800 text-[9px] font-black uppercase">Nuova scheda</button>
      </div>
    </form>`;
  }

  async function renderModal(corsistaId, editRecord=null) {
    await loadNormativeRules();
    const modal=ensureModal();
    const [corsista,credits,history]=await Promise.all([fetchCorsista(corsistaId),fetchManualCredits(corsistaId),fetchInternalHistory(corsistaId)]);
    modal.classList.remove('hidden');
    modal.innerHTML=`<div class="max-w-6xl mx-auto bg-slate-50 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
      <div class="bg-slate-900 text-white px-5 py-4 flex items-start justify-between gap-4">
        <div><p class="text-[9px] font-black uppercase tracking-widest text-violet-300">Formazione pregressa / crediti</p><h2 class="text-xl font-black mt-1">${esc(corsista.nome_cognome||'Corsista')}</h2><p class="text-[10px] text-slate-300 mt-1 font-mono">${esc(corsista.cf||'')}</p></div>
        <button type="button" onclick="window.TrainingHistoryAdvisor.close()" class="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center"><i data-lucide="x" class="w-4 h-4"></i></button>
      </div>
      <div class="p-4 sm:p-5">
        <div class="rounded-xl border border-blue-200 bg-blue-50 p-3 text-[10px] text-blue-950 mb-4"><strong>Assistente non bloccante:</strong> lo storico interno è certo perché proviene dai corsi registrati. Per attestati esterni e crediti, la classificazione resta una decisione documentata dell’operatore.</div>
        <div class="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-5">
          <div id="training-credit-form-box">${renderForm(editRecord||{})}</div>
          <div class="space-y-5">
            <section><div class="flex items-center justify-between gap-3 mb-2"><h3 class="font-black uppercase text-slate-900 text-xs">Formazione pregressa esterna</h3><span class="text-[9px] font-black text-violet-700">${credits.length} record</span></div><div class="space-y-2">${renderCredits(credits)}</div></section>
            <section><div class="flex items-center justify-between gap-3 mb-2"><h3 class="font-black uppercase text-slate-900 text-xs">Storico corsi SafetyManager</h3><span class="text-[9px] font-black text-blue-700">${history.length} corsi</span></div><div class="space-y-2 max-h-[420px] overflow-y-auto pr-1">${renderInternal(history)}</div></section>
          </div>
        </div>
      </div>
    </div>`;
    if(window.lucide) lucide.createIcons();
  }

  async function open(corsistaId) {
    state.currentCorsistaId=corsistaId;
    const modal=ensureModal();
    modal.classList.remove('hidden');
    modal.innerHTML='<div class="max-w-md mx-auto mt-20 bg-white rounded-2xl p-8 text-center"><i data-lucide="loader-2" class="w-7 h-7 animate-spin mx-auto mb-3 text-violet-700"></i><p class="font-black uppercase text-slate-800">Caricamento storico...</p></div>';
    if(window.lucide) lucide.createIcons();
    try{await renderModal(corsistaId);}catch(e){modal.innerHTML=`<div class="max-w-md mx-auto mt-20 bg-white rounded-2xl p-6 text-center border border-rose-200"><p class="font-black text-rose-800 uppercase">Storico non disponibile</p><p class="text-xs text-slate-600 mt-2">${esc(e.message||e)}</p><button onclick="window.TrainingHistoryAdvisor.close()" class="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black uppercase">Chiudi</button></div>`;}
  }

  function close(){ const m=document.getElementById('training-history-modal'); if(m)m.classList.add('hidden'); state.currentCorsistaId=null; }

  function prefill(){
    const id=document.getElementById('th-source-course')?.value||'';
    const c=window.DB_CORSI?.[id];
    if(!c)return;
    const title=document.getElementById('th-source-title'); if(title&&!title.value)title.value=c.t||'';
    const hours=document.getElementById('th-source-hours'); if(hours&&!hours.value)hours.value=c.ore??'';
    const std=document.getElementById('th-source-standard'); if(std&&!std.value)std.value=c.norma||'';
    const mapped=window.ComplianceAdvisor?.RULE_MAP?.[id] || UPDATE_RULE_BY_COURSE[id] || '';
    const target=document.getElementById('th-target-rule'); if(target&&mapped&&!target.value&&[...target.options].some(o=>o.value===mapped))target.value=mapped;
  }

  async function save(){
    const corsistaId=state.currentCorsistaId; if(!corsistaId)return;
    const id=document.getElementById('th-credit-id')?.value||'';
    const status=document.getElementById('th-decision-status')?.value||'draft';
    const user=await window.getSafetyAdminUser?.();
    const payload={
      corsista_id:corsistaId,
      source_type:'attestato_pregresso',
      source_course_id:document.getElementById('th-source-course')?.value||null,
      source_title:(document.getElementById('th-source-title')?.value||'').trim()||null,
      source_date:document.getElementById('th-source-date')?.value||null,
      source_hours:document.getElementById('th-source-hours')?.value?Number(document.getElementById('th-source-hours').value):null,
      source_issuer:(document.getElementById('th-source-issuer')?.value||'').trim()||null,
      source_certificate_id:(document.getElementById('th-source-certificate')?.value||'').trim()||null,
      source_standard:(document.getElementById('th-source-standard')?.value||'').trim()||null,
      evidence_url:(document.getElementById('th-evidence-url')?.value||'').trim()||null,
      target_course_code:document.getElementById('th-target-rule')?.value||null,
      credit_type:document.getElementById('th-credit-type')?.value||'needs_review',
      recognized_hours:document.getElementById('th-recognized-hours')?.value?Number(document.getElementById('th-recognized-hours').value):null,
      valid_until:document.getElementById('th-valid-until')?.value||null,
      decision_status:status,
      decision_notes:(document.getElementById('th-decision-notes')?.value||'').trim()||null,
      reviewed_at:status==='draft'?null:new Date().toISOString(),
      reviewed_by:status==='draft'?null:(user?.id||null),
      updated_at:new Date().toISOString()
    };
    let error;
    if(id){
      ({error}=await window.supabaseClient.from('training_credits').update(payload).eq('id',id));
    }else{
      payload.created_by=user?.id||null;
      ({error}=await window.supabaseClient.from('training_credits').insert(payload));
    }
    if(error)return alert('Formazione pregressa non salvata: '+(error.message||error));
    if(window.safetyAudit)await window.safetyAudit('training_credit_saved',{table_name:'training_credits',record_id:id||null,details:{corsista_id:corsistaId,credit_type:payload.credit_type,decision_status:payload.decision_status}});
    await renderModal(corsistaId);
  }

  async function edit(id){
    const {data,error}=await window.supabaseClient.from('training_credits').select('*').eq('id',id).single();
    if(error)return alert('Record non disponibile: '+(error.message||error));
    await renderModal(state.currentCorsistaId||data.corsista_id,data);
    setTimeout(()=>document.getElementById('training-credit-form')?.scrollIntoView({behavior:'smooth',block:'start'}),80);
  }

  async function remove(id){
    if(!confirm('Eliminare questo record di formazione pregressa? Lo storico dei corsi SafetyManager non viene toccato.'))return;
    const {error}=await window.supabaseClient.from('training_credits').delete().eq('id',id);
    if(error)return alert('Eliminazione non riuscita: '+(error.message||error));
    if(window.safetyAudit)await window.safetyAudit('training_credit_deleted',{table_name:'training_credits',record_id:id,details:{corsista_id:state.currentCorsistaId}});
    await renderModal(state.currentCorsistaId);
  }

  async function resetForm(){ if(state.currentCorsistaId)await renderModal(state.currentCorsistaId); }

  window.TrainingHistoryAdvisor={open,close,save,edit,remove,resetForm,prefill,loadNormativeRules,getExpirySuggestion,UPDATE_RULE_BY_COURSE};
  window.apriFormazionePregressa=open;
})();
