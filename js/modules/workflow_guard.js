// FIX UX workflow - layout desktop coerente, protezione lavoro non salvato e quick add progetto
(function(){
  if (window.__safetyWorkflowGuardLoaded) return;
  window.__safetyWorkflowGuardLoaded = true;

  const esc = v => window.dashEscape ? window.dashEscape(v) : String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const EDIT_FORMS = new Set(['form-azienda','form-docente','form-corsista','form-progetto','form-ente']);

  window.safetyWorkState = window.safetyWorkState || {
    dirty: false,
    formId: '',
    since: null,
    lastExplicitNavigationAt: 0
  };

  const injectStyle = () => {
    if (document.getElementById('safety-workflow-guard-style')) return;
    const style = document.createElement('style');
    style.id = 'safety-workflow-guard-style';
    style.textContent = `
      /* Le pagine gestionali devono usare in modo coerente tutta la larghezza disponibile. */
      @media (min-width: 1024px) {
        body:not(.is-printing-temp) #app-content[data-safety-module]:not([data-safety-module="login"]) > div:first-child {
          width: 100% !important;
          max-width: none !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
        }
      }

      .safety-unsaved-badge {
        position: fixed;
        right: 18px;
        top: calc(var(--nav-offset, 84px) + 10px);
        z-index: 70;
        display: none;
        align-items: center;
        gap: 7px;
        padding: 8px 11px;
        border-radius: 999px;
        border: 1px solid #fcd34d;
        background: rgba(255,251,235,.96);
        color: #92400e;
        box-shadow: 0 8px 28px rgba(15,23,42,.12);
        font-size: 10px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: .05em;
      }
      .safety-unsaved-badge.is-visible { display: inline-flex; }

      .project-inline-masterdata {
        border: 1px solid #bfdbfe;
        background: linear-gradient(135deg, #eff6ff, #f8fafc);
        border-radius: 14px;
        padding: 11px;
      }
      .project-inline-masterdata-actions {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 7px;
        margin-top: 8px;
      }
      .project-inline-masterdata button {
        min-height: 38px;
        border-radius: 10px;
        border: 1px solid #cbd5e1;
        background: #fff;
        color: #0f172a;
        font-size: 9px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: .04em;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        transition: .18s ease;
      }
      .project-inline-masterdata button:hover { background: #0f172a; color: #fff; border-color: #0f172a; }
      @media (max-width: 640px) {
        .project-inline-masterdata-actions { grid-template-columns: 1fr; }
        .safety-unsaved-badge { right: 10px; left: 10px; justify-content: center; }
      }
      @media print {
        .safety-unsaved-badge, .project-inline-masterdata { display: none !important; }
      }
    `;
    document.head.appendChild(style);
  };

  const ensureUnsavedBadge = () => {
    let badge = document.getElementById('safety-unsaved-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'safety-unsaved-badge';
      badge.className = 'safety-unsaved-badge';
      badge.innerHTML = '<i data-lucide="save" class="w-3.5 h-3.5"></i><span>Modifiche non salvate</span>';
      document.body.appendChild(badge);
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    return badge;
  };

  const syncUnsavedBadge = () => {
    const badge = ensureUnsavedBadge();
    badge.classList.toggle('is-visible', !!window.safetyWorkState.dirty);
  };

  window.markSafetyWorkDirty = function(formOrId) {
    const form = typeof formOrId === 'string' ? document.getElementById(formOrId) : formOrId;
    if (!form || !EDIT_FORMS.has(form.id)) return;
    window.safetyWorkState.dirty = true;
    window.safetyWorkState.formId = form.id;
    window.safetyWorkState.since = window.safetyWorkState.since || new Date().toISOString();
    syncUnsavedBadge();
  };

  window.markSafetyWorkSaved = function(formId = '') {
    if (formId && window.safetyWorkState.formId && window.safetyWorkState.formId !== formId) return;
    window.safetyWorkState.dirty = false;
    window.safetyWorkState.formId = '';
    window.safetyWorkState.since = null;
    syncUnsavedBadge();
  };

  const formFromEvent = target => {
    const form = target?.closest?.('form');
    return form && EDIT_FORMS.has(form.id) ? form : null;
  };

  document.addEventListener('input', e => {
    const form = formFromEvent(e.target);
    if (form) window.markSafetyWorkDirty(form);
  }, true);
  document.addEventListener('change', e => {
    const form = formFromEvent(e.target);
    if (form) window.markSafetyWorkDirty(form);
  }, true);

  // Segna la navigazione realmente richiesta dall'utente, così da distinguere i redirect automatici di Auth.
  document.addEventListener('click', e => {
    const el = e.target?.closest?.('button,a,[onclick]');
    if (!el) return;
    const code = String(el.getAttribute('onclick') || '');
    if (code.includes('loadModule(') || String(el.id || '').startsWith('nav-')) {
      window.safetyWorkState.lastExplicitNavigationAt = Date.now();
    }
  }, true);
  window.addEventListener('keydown', e => {
    if (e.altKey && !e.ctrlKey && !e.metaKey) window.safetyWorkState.lastExplicitNavigationAt = Date.now();
  }, true);

  window.addEventListener('beforeunload', e => {
    if (!window.safetyWorkState.dirty) return;
    e.preventDefault();
    e.returnValue = '';
  });

  const installSaveWrappers = () => {
    const specs = [
      ['saveAzienda','form-azienda'],
      ['saveDocente','form-docente'],
      ['saveCorsistaData','form-corsista'],
      ['saveProgetto','form-progetto'],
      ['saveEnteData','form-ente']
    ];
    specs.forEach(([name, formId]) => {
      const fn = window[name];
      if (typeof fn !== 'function' || fn.__safetyWorkSavedWrapped) return;
      const wrapped = async function(...args) {
        const result = await fn.apply(this, args);
        if (result && window.safetyWorkState.formId === formId) window.markSafetyWorkSaved(formId);
        return result;
      };
      wrapped.__safetyWorkSavedWrapped = true;
      window[name] = wrapped;
    });
  };

  const explicitNavigation = () => (Date.now() - Number(window.safetyWorkState.lastExplicitNavigationAt || 0)) < 1800;

  const installNavigationGuard = () => {
    const fn = window.loadModule;
    if (typeof fn !== 'function' || fn.__safetyWorkflowGuardWrapped) return;
    const wrapped = async function(moduleId, ...args) {
      const current = window.currentSafetyModuleId || document.getElementById('app-content')?.dataset?.safetyModule || '';
      const explicit = explicitNavigation();

      // Supabase emette TOKEN_REFRESHED / INITIAL_SESSION / SIGNED_IN anche durante il lavoro.
      // Il vecchio callback richiamava la Dashboard ad ogni evento: questo blocca quel redirect automatico.
      if (moduleId === 'admin' && current && current !== 'admin' && !explicit) {
        console.info('[SafetyManager] Redirect automatico Dashboard ignorato per preservare la pagina corrente.');
        return false;
      }

      if (window.safetyWorkState.dirty) {
        const leave = window.confirm('Ci sono modifiche non salvate. Vuoi uscire da questa pagina e perderle?');
        if (!leave) return false;
        window.markSafetyWorkSaved();
      }

      const result = await fn.apply(this, [moduleId, ...args]);
      const app = document.getElementById('app-content');
      if (app) app.dataset.safetyModule = moduleId || '';
      window.currentSafetyModuleId = moduleId || window.currentSafetyModuleId || '';
      setTimeout(() => window.applySafetyWorkflowFixes?.(moduleId), 80);
      return result;
    };
    wrapped.__safetyWorkflowGuardWrapped = true;
    window.loadModule = wrapped;
  };

  const appendTeacherOptions = newDoc => {
    if (!newDoc?.id) return;
    document.querySelectorAll('.prog-docente-ud').forEach(sel => {
      if (!sel.querySelector(`option[value="${CSS.escape(String(newDoc.id))}"]`)) {
        sel.add(new Option(newDoc.nome_cognome || 'Nuovo docente', newDoc.id));
      }
    });
    const firstEmpty = Array.from(document.querySelectorAll('.prog-docente-ud')).find(sel => !sel.value);
    if (firstEmpty) {
      firstEmpty.value = newDoc.id;
      firstEmpty.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  const ensureTeacherModal = () => {
    if (document.getElementById('qa-modal-docente-progetto')) return;
    const modal = document.createElement('div');
    modal.id = 'qa-modal-docente-progetto';
    modal.className = 'hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[150] items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        <div class="bg-slate-900 text-white px-5 py-4 flex items-center justify-between gap-3">
          <div>
            <h3 class="font-black uppercase text-sm flex items-center gap-2"><i data-lucide="user-plus" class="w-4 h-4 text-purple-300"></i> Nuovo docente rapido</h3>
            <p class="text-[9px] text-slate-300 mt-1 uppercase font-bold">Resta nel progetto: i dati già inseriti non vengono persi.</p>
          </div>
          <button type="button" onclick="window.chiudiQADocenteProgetto()" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700"><i data-lucide="x" class="w-4 h-4"></i></button>
        </div>
        <div class="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="sm:col-span-2"><label class="text-[10px] font-black uppercase text-slate-500">Nome e cognome *</label><input id="qa-prog-doc-nome" class="input-field mt-1" placeholder="Nome docente"></div>
          <div><label class="text-[10px] font-black uppercase text-slate-500">Codice fiscale</label><input id="qa-prog-doc-cf" class="input-field mt-1 uppercase" placeholder="Codice fiscale"></div>
          <div><label class="text-[10px] font-black uppercase text-slate-500">Qualifica</label><input id="qa-prog-doc-qualifica" class="input-field mt-1" value="Docente / formatore"></div>
          <div><label class="text-[10px] font-black uppercase text-slate-500">Email</label><input id="qa-prog-doc-email" type="email" class="input-field mt-1" placeholder="email@esempio.it"></div>
          <div><label class="text-[10px] font-black uppercase text-slate-500">Telefono</label><input id="qa-prog-doc-tel" class="input-field mt-1" placeholder="Telefono"></div>
        </div>
        <div class="px-5 pb-5 flex gap-2">
          <button type="button" onclick="window.chiudiQADocenteProgetto()" class="flex-1 rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-3 text-xs font-black uppercase text-slate-700">Annulla</button>
          <button id="qa-prog-doc-save" type="button" onclick="window.salvaQADocenteProgetto()" class="flex-[2] rounded-xl bg-purple-700 hover:bg-purple-600 px-4 py-3 text-xs font-black uppercase text-white flex items-center justify-center gap-2"><i data-lucide="save" class="w-4 h-4"></i> Salva docente</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    if (typeof lucide !== 'undefined') lucide.createIcons();
  };

  window.apriQADocenteProgetto = function() {
    ensureTeacherModal();
    const modal = document.getElementById('qa-modal-docente-progetto');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => document.getElementById('qa-prog-doc-nome')?.focus(), 30);
  };

  window.chiudiQADocenteProgetto = function() {
    const modal = document.getElementById('qa-modal-docente-progetto');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  };

  window.salvaQADocenteProgetto = async function() {
    const nome = document.getElementById('qa-prog-doc-nome')?.value?.trim() || '';
    if (!nome) return alert('Inserisci nome e cognome del docente.');
    const button = document.getElementById('qa-prog-doc-save');
    if (button) { button.disabled = true; button.classList.add('opacity-60'); }
    try {
      const record = {
        nome_cognome: nome,
        cf: (document.getElementById('qa-prog-doc-cf')?.value || '').trim().toUpperCase(),
        qualifica: (document.getElementById('qa-prog-doc-qualifica')?.value || '').trim() || 'Docente / formatore',
        email: (document.getElementById('qa-prog-doc-email')?.value || '').trim(),
        telefono: (document.getElementById('qa-prog-doc-tel')?.value || '').trim()
      };
      const saved = typeof window.saveDocente === 'function' ? await window.saveDocente(record) : null;
      if (!saved) throw new Error('Salvataggio docente non riuscito.');
      const newDoc = Array.isArray(saved) ? saved[0] : saved;
      if (typeof window.getDocenti === 'function') window.docentiList = await window.getDocenti();
      appendTeacherOptions(newDoc);
      window.markSafetyWorkDirty(document.getElementById('form-progetto'));
      window.chiudiQADocenteProgetto();
      ['qa-prog-doc-nome','qa-prog-doc-cf','qa-prog-doc-email','qa-prog-doc-tel'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
      if (typeof window.showSafetyToast === 'function') window.showSafetyToast('Docente inserito e disponibile nei menu del progetto.', { title:'Docente aggiunto', type:'ok', icon:'user-check' });
    } catch(e) {
      console.error('Quick add docente progetto:', e);
      alert('Errore inserimento docente: ' + (e.message || e));
    } finally {
      if (button) { button.disabled = false; button.classList.remove('opacity-60'); }
    }
  };

  const injectProjectMasterdataTools = () => {
    const form = document.getElementById('form-progetto');
    if (!form || document.getElementById('project-inline-masterdata')) return;
    const box = document.createElement('div');
    box.id = 'project-inline-masterdata';
    box.className = 'project-inline-masterdata';
    box.innerHTML = `
      <div class="flex items-start gap-2">
        <span class="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0"><i data-lucide="plus-square" class="w-4 h-4"></i></span>
        <div><p class="text-[10px] font-black uppercase text-slate-900">Inserimento rapido anagrafiche</p><p class="text-[9px] text-slate-600 mt-0.5">Se manca un dato, crealo qui senza uscire dal progetto e senza perdere quanto già compilato.</p></div>
      </div>
      <div class="project-inline-masterdata-actions">
        <button type="button" onclick="window.apriQAAzienda && window.apriQAAzienda()"><i data-lucide="building-2" class="w-3.5 h-3.5"></i> Nuova azienda</button>
        <button type="button" onclick="window.apriQACorsistaDraftProgetto && window.apriQACorsistaDraftProgetto()"><i data-lucide="user-plus" class="w-3.5 h-3.5"></i> Nuovo corsista</button>
        <button type="button" onclick="window.apriQADocenteProgetto()"><i data-lucide="graduation-cap" class="w-3.5 h-3.5"></i> Nuovo docente</button>
      </div>`;
    const hidden = form.querySelector('input[type="hidden"]');
    if (hidden?.nextSibling) form.insertBefore(box, hidden.nextSibling); else form.insertBefore(box, form.firstChild);
    ensureTeacherModal();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  };

  window.applySafetyWorkflowFixes = function(moduleId = window.currentSafetyModuleId || '') {
    injectStyle();
    installSaveWrappers();
    const app = document.getElementById('app-content');
    if (app && moduleId) app.dataset.safetyModule = moduleId;
    if (moduleId === 'progetti' || document.getElementById('form-progetto')) injectProjectMasterdataTools();
    syncUnsavedBadge();
  };

  injectStyle();
  ensureUnsavedBadge();
  installSaveWrappers();
  installNavigationGuard();
  setTimeout(installNavigationGuard, 0);
  setTimeout(installSaveWrappers, 400);
  setTimeout(() => window.applySafetyWorkflowFixes(window.currentSafetyModuleId || 'admin'), 500);

  const appRoot = document.getElementById('app-content');
  if (appRoot) {
    const observer = new MutationObserver(() => {
      clearTimeout(window.__safetyWorkflowMutationTimer);
      window.__safetyWorkflowMutationTimer = setTimeout(() => window.applySafetyWorkflowFixes(window.currentSafetyModuleId || ''), 60);
    });
    observer.observe(appRoot, { childList:true, subtree:true });
  }
})();