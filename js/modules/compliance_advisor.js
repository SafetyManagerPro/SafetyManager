// Compliance Advisor - motore normativo solo informativo/non bloccante
(() => {
  if (window.__safetyComplianceAdvisorLoaded) return;
  window.__safetyComplianceAdvisorLoaded = true;

  const RULE_MAP = {
    lav_basso: 'LAV_BASE_BASSO',
    lav_medio: 'LAV_BASE_MEDIO',
    lav_alto: 'LAV_BASE_ALTO',
    preposto: 'PREPOSTO_BASE',
    dirigente: 'DIRIGENTE_BASE',
    dl_base: 'DL_BASE',
    agg_lav: 'LAV_AGG',
    agg_prep: 'PREPOSTO_AGG',
    agg_dir: 'DIRIGENTE_AGG',
    agg_dl: 'DL_AGG',
    agg_dl_spp: 'DL_RSPP_AGG'
  };

  const state = { ruleSet: null, rules: new Map(), loaded: false, loading: null, boundForm: null };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  const severityRank = { info: 1, warning: 2, critical: 3 };
  const severityMeta = {
    info: { label: 'Informazione', wrap: 'border-blue-200 bg-blue-50', text: 'text-blue-900', icon: 'info' },
    warning: { label: 'Avviso', wrap: 'border-amber-200 bg-amber-50', text: 'text-amber-950', icon: 'triangle-alert' },
    critical: { label: 'Avviso critico', wrap: 'border-rose-200 bg-rose-50', text: 'text-rose-950', icon: 'circle-alert' }
  };

  async function loadRules(force = false) {
    if (state.loaded && !force) return state;
    if (state.loading && !force) return state.loading;
    state.loading = (async () => {
      if (!window.supabaseClient) throw new Error('Database non disponibile.');
      const { data: sets, error: setError } = await window.supabaseClient
        .from('normative_rule_sets')
        .select('*')
        .eq('code','ASR_2025')
        .limit(1);
      if (setError) throw setError;
      state.ruleSet = sets?.[0] || null;
      state.rules = new Map();
      if (state.ruleSet?.id) {
        const { data: rules, error: rulesError } = await window.supabaseClient
          .from('normative_training_rules')
          .select('*')
          .eq('rule_set_id', state.ruleSet.id)
          .eq('active', true);
        if (rulesError) throw rulesError;
        (rules || []).forEach(rule => state.rules.set(rule.course_code, rule));
      }
      state.loaded = true;
      return state;
    })();
    try { return await state.loading; }
    finally { state.loading = null; }
  }

  function currentProject() {
    const id = document.getElementById('prog-id')?.value || '';
    if (typeof window.collectProjectFormSnapshot === 'function') {
      try { return window.collectProjectFormSnapshot(id); } catch (_) {}
    }
    return {
      id,
      corso_id: document.getElementById('prog-corso')?.value || '',
      modalita: document.getElementById('prog-modalita')?.value || '',
      ente_erogatore: document.getElementById('prog-erogatore')?.value || 'ente',
      azienda_id: document.getElementById('prog-azienda')?.value || '',
      data_esame: document.getElementById('prog-esame')?.value || '',
      omogeneita_aula: document.getElementById('prog-omogeneita-aula')?.checked ?? true,
      compliance_note: document.getElementById('prog-compliance-note-free')?.value || '',
      ente_validatore: document.getElementById('prog-ente-validatore')?.value || '',
      validazione_ente_esito: document.getElementById('prog-validazione-esito')?.value || '',
      esito_richiesta_op: document.getElementById('prog-op-esito')?.value || ''
    };
  }

  const isPastOrToday = value => {
    if (!value) return false;
    const d = new Date(value + 'T00:00:00');
    const now = new Date(); now.setHours(0,0,0,0);
    return !Number.isNaN(d.getTime()) && d.getTime() <= now.getTime();
  };

  function add(items, code, severity, message, detail = '') {
    items.push({ code, severity, message, detail });
  }

  async function evaluate(project, enrollments = []) {
    await loadRules();
    const items = [];
    const courseId = project?.corso_id || '';
    const course = window.DB_CORSI?.[courseId] || null;
    const ruleCode = RULE_MAP[courseId] || '';
    const rule = ruleCode ? state.rules.get(ruleCode) : null;

    if (!courseId) {
      add(items, 'COURSE_NOT_SELECTED', 'info', 'Seleziona un corso per avviare il controllo normativo.');
      return { items, rule: null, ruleSet: state.ruleSet };
    }

    if (!rule) {
      add(items, 'RULE_NOT_MAPPED', 'info', 'Il corso è utilizzabile, ma non è ancora collegato a una regola strutturata del nuovo motore normativo.', 'Il catalogo storico continua a funzionare normalmente.');
    } else {
      if (state.ruleSet?.status === 'draft') {
        add(items, 'RULESET_DRAFT', 'info', 'Regola ASR 2025 disponibile in modalità draft.', 'Il controllo è informativo e non produce blocchi.');
      }
      if (state.ruleSet?.advisory_only !== true) {
        add(items, 'ADVISORY_MODE', 'critical', 'Configurazione del motore da verificare: il set normativo deve restare advisory-only.');
      }

      if (course && rule.min_hours != null && Number(course.ore || 0) < Number(rule.min_hours)) {
        add(items, 'DURATION_BELOW_RULE', 'critical', `Durata catalogo ${course.ore || 0}h inferiore alle ${rule.min_hours}h indicate dalla regola associata.`);
      }

      if (course && rule.update_period_months != null && Number(course.scad || 0) > 0 && Number(course.scad) < 99) {
        const catalogMonths = Number(course.scad) * 12;
        if (catalogMonths !== Number(rule.update_period_months)) {
          add(items, 'UPDATE_PERIOD_MISMATCH', 'warning', `Periodicità catalogo ${catalogMonths} mesi diversa dai ${rule.update_period_months} mesi della regola associata.`);
        }
      }

      const isElearning = /learning|fad/i.test(project?.modalita || '');
      if (!isElearning && rule.max_participants != null && enrollments.length > Number(rule.max_participants)) {
        add(items, 'PARTICIPANTS_OVER_LIMIT', 'critical', `Iscritti ${enrollments.length}: superano il riferimento di ${rule.max_participants} previsto dalla regola associata.`);
      }

      if (Array.isArray(rule.prerequisites) && rule.prerequisites.length) {
        add(items, 'PREREQUISITES_REVIEW', 'warning', 'Sono presenti prerequisiti formativi da verificare prima dell’erogazione.', 'Il sistema non presume automaticamente che la formazione pregressa sia valida.');
      }

      const minAttendance = Number(rule.min_attendance_pct || 0);
      if (minAttendance > 0 && enrollments.length) {
        const below = enrollments.filter(e => e.percentuale_frequenza !== null && e.percentuale_frequenza !== undefined && Number(e.percentuale_frequenza) < minAttendance);
        if (below.length) add(items, 'ATTENDANCE_BELOW_RULE', 'critical', `${below.length} corsista/i risultano sotto il ${minAttendance}% di frequenza indicato dalla regola associata.`);
        if (isPastOrToday(project?.data_esame)) {
          const missing = enrollments.filter(e => e.percentuale_frequenza === null || e.percentuale_frequenza === undefined);
          if (missing.length) add(items, 'ATTENDANCE_MISSING', 'warning', `${missing.length} corsista/i senza percentuale di frequenza registrata.`);
        }
      }
    }

    const modeCheck = typeof window.getModalitaCompliance === 'function'
      ? window.getModalitaCompliance(courseId, project?.modalita || '')
      : { ok: true, level: 'info', message: '' };
    if (modeCheck?.ok === false) add(items, 'DELIVERY_MODE', 'critical', modeCheck.message || 'Modalità di erogazione da verificare.');
    else if (modeCheck?.level === 'warning' && modeCheck.message) add(items, 'DELIVERY_MODE', 'warning', modeCheck.message);

    if (course?.deprecated) add(items, 'DEPRECATED_COURSE', 'critical', 'Il corso selezionato è una voce legacy/deprecata: è consigliata la riclassificazione.');

    if (project?.omogeneita_aula === false && !String(project?.compliance_note || '').trim()) {
      add(items, 'HOMOGENEITY_NOTE', 'warning', 'Aula indicata come non omogenea: consigliato documentare l’adattamento di contenuti e rischi.');
    }

    if (project?.ente_erogatore === 'azienda') {
      if (!project?.validazione_ente_esito) add(items, 'DL_VALIDATION_STATUS', 'warning', 'Stato della valutazione/validazione del percorso non indicato.');
      if (!project?.esito_richiesta_op) add(items, 'DL_OP_STATUS', 'warning', 'Stato della comunicazione/iter con l’organismo paritetico non indicato.');
    }

    return { items, rule, ruleSet: state.ruleSet };
  }

  function renderItem(item) {
    const meta = severityMeta[item.severity] || severityMeta.info;
    return `<div class="rounded-xl border ${meta.wrap} p-3">
      <div class="flex items-start gap-2">
        <i data-lucide="${meta.icon}" class="w-4 h-4 mt-0.5 ${meta.text} shrink-0"></i>
        <div class="min-w-0">
          <p class="text-[8px] font-black uppercase tracking-wider ${meta.text}">${meta.label}</p>
          <p class="mt-0.5 text-[10px] font-bold ${meta.text}">${esc(item.message)}</p>
          ${item.detail ? `<p class="mt-1 text-[9px] text-slate-600">${esc(item.detail)}</p>` : ''}
        </div>
      </div>
    </div>`;
  }

  async function loadNote(projectId) {
    if (!projectId || !window.supabaseClient) return null;
    const { data, error } = await window.supabaseClient
      .from('compliance_advisor_notes')
      .select('*')
      .eq('progetto_id', projectId)
      .eq('advisory_code', 'GENERAL_REVIEW')
      .limit(1);
    if (error) { console.warn('Compliance Advisor note:', error); return null; }
    return data?.[0] || null;
  }

  async function render() {
    const box = document.getElementById('compliance-advisor-box');
    if (!box) return;
    const project = currentProject();
    box.innerHTML = '<div class="text-center text-blue-700 py-3"><i data-lucide="loader-2" class="w-4 h-4 animate-spin mx-auto mb-1"></i>Controllo normativo...</div>';
    if (window.lucide) lucide.createIcons();

    try {
      const enrollments = project.id && typeof window.getIscrizioni === 'function' ? await window.getIscrizioni(project.id) : [];
      const result = await evaluate(project, enrollments);
      const maxSeverity = result.items.reduce((best, item) => severityRank[item.severity] > severityRank[best] ? item.severity : best, 'info');
      const headMeta = severityMeta[maxSeverity] || severityMeta.info;
      const ruleLabel = result.rule ? `${result.rule.course_code} · ${result.rule.course_title || ''}` : 'Regola strutturata non ancora associata';
      const note = project.id ? await loadNote(project.id) : null;

      box.className = `rounded-xl border ${headMeta.wrap} p-3 text-[10px] leading-snug`;
      box.innerHTML = `
        <div class="flex flex-wrap items-center gap-2">
          <div class="flex items-center gap-2 font-black uppercase ${headMeta.text}">
            <i data-lucide="shield-check" class="w-4 h-4"></i> Compliance Advisor
          </div>
          <span class="rounded-full border border-current/20 bg-white/70 px-2 py-0.5 text-[8px] font-black uppercase ${headMeta.text}">Solo avvisi</span>
          <span class="ml-auto text-[8px] font-bold text-slate-500">${esc(ruleLabel)}</span>
        </div>
        <p class="mt-1 text-[9px] text-slate-600">Gli avvisi non impediscono salvataggio, stampa, attestati o chiusura del corso. La decisione finale resta dell’operatore responsabile.</p>
        <div class="mt-3 space-y-2">${result.items.map(renderItem).join('')}</div>
        <div class="mt-3 border-t border-slate-200/80 pt-3">
          <label class="block text-[8px] font-black uppercase text-slate-500 mb-1">Nota / presa visione facoltativa</label>
          <textarea id="compliance-advisor-note" rows="2" class="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-[10px] outline-none focus:border-blue-500" placeholder="Es. verificato il caso specifico; si procede per...">${esc(note?.user_note || '')}</textarea>
          <div class="mt-2 flex flex-col sm:flex-row sm:items-center gap-2">
            <button type="button" onclick="window.ComplianceAdvisor.saveNote()" ${project.id ? '' : 'disabled'} class="px-3 py-1.5 rounded-lg bg-slate-900 disabled:bg-slate-300 text-white text-[9px] font-black uppercase">Registra nota</button>
            <span class="text-[8px] text-slate-500">${project.id ? (note?.acknowledged_at ? 'Ultima presa visione già registrata.' : 'La nota viene salvata separatamente dal progetto.') : 'Salva prima il progetto per registrare la nota.'}</span>
          </div>
        </div>`;
      if (window.lucide) lucide.createIcons();
    } catch (error) {
      box.className = 'rounded-xl border border-amber-200 bg-amber-50 p-3 text-[10px] leading-snug';
      box.innerHTML = `<p class="font-black uppercase text-amber-900">Compliance Advisor temporaneamente non disponibile</p><p class="mt-1 text-amber-800">${esc(error?.message || error)}</p><p class="mt-1 text-[9px] text-slate-600">Il progetto resta comunque utilizzabile: l'Advisor non è bloccante.</p>`;
    }
  }

  async function saveNote() {
    const project = currentProject();
    if (!project.id) return alert('Salva prima il progetto.');
    const textarea = document.getElementById('compliance-advisor-note');
    const userNote = (textarea?.value || '').trim();
    const enrollments = typeof window.getIscrizioni === 'function' ? await window.getIscrizioni(project.id) : [];
    const result = await evaluate(project, enrollments);
    const maxSeverity = result.items.reduce((best, item) => severityRank[item.severity] > severityRank[best] ? item.severity : best, 'info');
    const snapshot = result.items.map(x => `[${x.severity}] ${x.message}`).join('\n');
    const { data: authData } = await window.supabaseClient.auth.getUser();
    const payload = {
      progetto_id: project.id,
      rule_id: result.rule?.id || null,
      advisory_code: 'GENERAL_REVIEW',
      severity: maxSeverity,
      status: 'acknowledged',
      message_snapshot: snapshot || null,
      user_note: userNote || null,
      acknowledged_by: authData?.user?.id || null,
      acknowledged_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const { error } = await window.supabaseClient
      .from('compliance_advisor_notes')
      .upsert(payload, { onConflict: 'progetto_id,advisory_code' });
    if (error) return alert('Nota non salvata: ' + (error.message || error));
    if (typeof window.showSafetyToast === 'function') window.showSafetyToast('Presa visione registrata.', { type: 'ok', title: 'Compliance Advisor' });
    await render();
  }

  function bind() {
    const form = document.getElementById('form-progetto');
    if (!form) return;
    if (state.boundForm === form) return;
    state.boundForm = form;
    let timer = null;
    const queue = () => {
      clearTimeout(timer);
      timer = setTimeout(() => render(), 180);
    };
    form.addEventListener('input', queue);
    form.addEventListener('change', queue);
    render();
  }

  const observer = new MutationObserver(() => bind());
  const root = document.getElementById('app-content') || document.body;
  observer.observe(root, { childList: true, subtree: true });
  setTimeout(bind, 0);

  window.ComplianceAdvisor = { render, evaluate, saveNote, loadRules, RULE_MAP };
})();
