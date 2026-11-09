// STEP 14 - Rifinitura grafica e micro-UX professionale
// Intervento non distruttivo: non modifica database, stampe, firme o logiche di salvataggio.
(function(){
  if (window.__safetyUiRefinementsLoaded) return;
  window.__safetyUiRefinementsLoaded = true;

  const esc = v => window.dashEscape ? window.dashEscape(v) : String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  const injectStyle = () => {
    if (document.getElementById('safety-ui-refinements-style')) return;
    const style = document.createElement('style');
    style.id = 'safety-ui-refinements-style';
    style.textContent = `
      :root {
        --safety-card-radius: 18px;
        --safety-focus: 0 0 0 3px rgba(59, 130, 246, .28);
      }

      html { scroll-behavior: smooth; }
      body { -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }

      body:not(.is-printing-temp) #app-content input,
      body:not(.is-printing-temp) #app-content select,
      body:not(.is-printing-temp) #app-content textarea {
        transition: border-color .18s ease, box-shadow .18s ease, background-color .18s ease;
      }

      body:not(.is-printing-temp) #app-content input:focus,
      body:not(.is-printing-temp) #app-content select:focus,
      body:not(.is-printing-temp) #app-content textarea:focus,
      body:not(.is-printing-temp) #app-content button:focus-visible,
      body:not(.is-printing-temp) #top-nav button:focus-visible {
        outline: none !important;
        box-shadow: var(--safety-focus) !important;
      }

      body:not(.is-printing-temp) #app-content table {
        border-collapse: separate;
        border-spacing: 0;
      }

      body:not(.is-printing-temp) #app-content thead th {
        position: sticky;
        top: var(--nav-offset, 84px);
        z-index: 5;
      }

      .safety-pro-polished-card,
      body:not(.is-printing-temp) #app-content .bg-white.rounded-xl,
      body:not(.is-printing-temp) #app-content .bg-white.rounded-2xl,
      body:not(.is-printing-temp) #app-content .bg-white.rounded-3xl {
        box-shadow: 0 1px 2px rgba(15, 23, 42, .04), 0 10px 28px rgba(15, 23, 42, .035);
      }

      .safety-module-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        justify-content: space-between;
        margin: -6px 0 18px;
        padding: 10px 12px;
        border: 1px solid #e2e8f0;
        background: rgba(255,255,255,.82);
        backdrop-filter: blur(8px);
        border-radius: 16px;
      }

      .safety-module-toolbar-left,
      .safety-module-toolbar-right {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }

      .safety-mini-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        background: #fff;
        color: #334155;
        padding: 8px 10px;
        font-size: 10px;
        line-height: 1;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: .06em;
        transition: background-color .18s ease, color .18s ease, border-color .18s ease, transform .18s ease;
      }

      .safety-mini-btn:hover {
        transform: translateY(-1px);
        background: #0f172a;
        color: #fff;
        border-color: #0f172a;
      }

      .safety-mini-btn.safety-mini-btn-primary {
        background: #0f172a;
        border-color: #0f172a;
        color: #fff;
      }

      .safety-mini-btn.safety-mini-btn-primary:hover { background: #1e293b; }

      .safety-toast-stack {
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 100000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
      }

      .safety-toast {
        pointer-events: auto;
        min-width: 260px;
        max-width: min(420px, calc(100vw - 36px));
        border-radius: 18px;
        border: 1px solid rgba(148, 163, 184, .35);
        background: rgba(15, 23, 42, .96);
        color: #fff;
        box-shadow: 0 18px 50px rgba(15, 23, 42, .28);
        padding: 13px 14px;
        display: flex;
        gap: 10px;
        align-items: flex-start;
        animation: safetyToastIn .18s ease-out;
      }

      .safety-toast p { margin: 0; }
      .safety-toast-title { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; }
      .safety-toast-message { font-size: 12px; line-height: 1.35; color: #cbd5e1; margin-top: 2px !important; }
      .safety-toast-close { margin-left: auto; opacity: .7; font-size: 18px; line-height: 1; }
      .safety-toast-close:hover { opacity: 1; }

      @keyframes safetyToastIn { from { opacity: 0; transform: translateY(8px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }

      .safety-empty-state {
        padding: 28px;
        border: 1px dashed #cbd5e1;
        border-radius: 18px;
        background: #f8fafc;
        color: #64748b;
        text-align: center;
        font-size: 12px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: .04em;
      }

      @media (max-width: 768px) {
        body:not(.is-printing-temp) #app-content {
          padding-left: 10px;
          padding-right: 10px;
        }
        body:not(.is-printing-temp) #app-content h1 {
          font-size: 1.55rem !important;
          line-height: 1.05 !important;
        }
        .safety-module-toolbar {
          position: sticky;
          top: var(--nav-offset, 84px);
          z-index: 35;
        }
        .safety-module-toolbar-left,
        .safety-module-toolbar-right {
          width: 100%;
        }
        .safety-mini-btn {
          flex: 1 1 auto;
          min-height: 38px;
        }
        body:not(.is-printing-temp) #app-content table {
          font-size: 11px;
        }
        body:not(.is-printing-temp) #app-content th,
        body:not(.is-printing-temp) #app-content td {
          padding: 8px !important;
        }
        .safety-toast-stack {
          right: 10px;
          left: 10px;
          bottom: 10px;
        }
        .safety-toast {
          width: 100%;
          max-width: none;
        }
      }

      @media print {
        .safety-module-toolbar,
        .safety-toast-stack { display: none !important; }
        body:not(.is-printing-temp) #app-content thead th { position: static !important; }
      }
    `;
    document.head.appendChild(style);
  };

  const iconHtml = name => `<i data-lucide="${esc(name)}" class="w-3.5 h-3.5"></i>`;

  window.showSafetyToast = function(message, options = {}) {
    injectStyle();
    let stack = document.getElementById('safety-toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.id = 'safety-toast-stack';
      stack.className = 'safety-toast-stack';
      document.body.appendChild(stack);
    }
    const toast = document.createElement('div');
    toast.className = 'safety-toast';
    const title = options.title || 'SafetyManager';
    const icon = options.icon || (options.type === 'ok' ? 'check-circle' : options.type === 'warning' ? 'alert-triangle' : 'info');
    toast.innerHTML = `
      <span class="shrink-0 mt-0.5">${iconHtml(icon)}</span>
      <div class="min-w-0">
        <p class="safety-toast-title">${esc(title)}</p>
        <p class="safety-toast-message">${esc(message)}</p>
      </div>
      <button type="button" class="safety-toast-close" aria-label="Chiudi">×</button>`;
    toast.querySelector('.safety-toast-close').onclick = () => toast.remove();
    stack.appendChild(toast);
    if (typeof lucide !== 'undefined') lucide.createIcons();
    setTimeout(() => toast.remove(), options.duration || 4200);
    return toast;
  };

  const MODULE_LABELS = {
    admin: 'Dashboard',
    aziende: 'Aziende',
    docenti: 'Docenti',
    corsisti: 'Corsisti',
    progetti: 'Progetti',
    scadenze: 'Scadenze',
    ente: 'Ente',
    stampe: 'Centro stampe',
    migrazione: 'Migrazione',
    archivio_corsi: 'Archivio',
    kit_cliente: 'Kit XLSX',
    collaudo: 'Collaudo'
  };

  // Il pulsante Dashboard e' gia' a sinistra nella barra: le scorciatoie non lo ripetono.
  const QUICK_ACTIONS = {
    aziende: [ ['progetti','Progetti','folder-kanban'], ['archivio_corsi','Archivio','archive'] ],
    docenti: [ ['progetti','Progetti','folder-kanban'], ['stampe','Stampe','printer'] ],
    corsisti: [ ['progetti','Progetti','folder-kanban'], ['archivio_corsi','Archivio','archive'] ],
    progetti: [ ['stampe','Stampe','printer'], ['archivio_corsi','Archivio','archive'], ['migrazione','Backup','database'] ],
    scadenze: [ ['archivio_corsi','Archivio','archive'], ['stampe','Stampe','printer'] ],
    ente: [ ['stampe','Stampe','printer'], ['migrazione','Backup','database'], ['collaudo','Collaudo','shield-check'] ],
    stampe: [ ['progetti','Progetti','folder-kanban'], ['archivio_corsi','Archivio','archive'] ],
    migrazione: [ ['archivio_corsi','Archivio','archive'], ['progetti','Progetti','folder-kanban'] ],
    archivio_corsi: [ ['stampe','Stampe','printer'], ['progetti','Progetti','folder-kanban'] ],
    kit_cliente: [ ['aziende','Aziende','building-2'], ['migrazione','Backup','database'] ],
    collaudo: [ ['stampe','Stampe','printer'], ['migrazione','Backup','database'] ]
  };

  const findModuleRoot = () => {
    const app = document.getElementById('app-content');
    // La barra Indietro/Avanti (navigation_system) non e' la radice del modulo.
    return Array.from(app?.children || []).find(el => !el.classList.contains('safety-page-nav')) || app;
  };

  const injectToolbar = moduleId => {
    if (!moduleId || moduleId === 'admin' || moduleId === 'login') return;
    const root = findModuleRoot();
    if (!root || document.getElementById('safety-module-toolbar')) return;
    const toolbar = document.createElement('div');
    toolbar.id = 'safety-module-toolbar';
    toolbar.className = 'safety-module-toolbar';
    const label = MODULE_LABELS[moduleId] || moduleId;
    const actions = QUICK_ACTIONS[moduleId] || [['stampe','Stampe','printer'], ['archivio_corsi','Archivio','archive']];
    toolbar.innerHTML = `
      <div class="safety-module-toolbar-left">
        <button type="button" class="safety-mini-btn safety-mini-btn-primary" onclick="window.loadModule('admin')">${iconHtml('home')} Dashboard</button>
        <span class="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">/ ${esc(label)}</span>
      </div>
      <div class="safety-module-toolbar-right">
        ${actions.map(([target, text, icon]) => `<button type="button" class="safety-mini-btn" onclick="window.loadModule('${esc(target)}')">${iconHtml(icon)} ${esc(text)}</button>`).join('')}
      </div>`;
    root.insertBefore(toolbar, root.firstChild);
  };

  const polishTables = () => {
    document.querySelectorAll('#app-content table').forEach(table => {
      const wrapper = table.parentElement;
      if (wrapper && !wrapper.classList.contains('overflow-x-auto') && !wrapper.dataset.safetyWrappedTable) {
        const div = document.createElement('div');
        div.className = 'overflow-x-auto rounded-xl border border-slate-100';
        div.dataset.safetyWrappedTable = '1';
        wrapper.insertBefore(div, table);
        div.appendChild(table);
      }
      table.classList.add('min-w-full');
    });
  };

  const labelEmptyContainers = () => {
    const pairs = [
      ['tabella-aziende', 'Nessuna azienda presente. Usa “Nuovo” per inserire il primo cliente.'],
      ['tabella-docenti', 'Nessun docente presente. Inserisci docenti e qualifiche prima di creare corsi.'],
      ['tabella-corsisti', 'Nessun corsista presente. Importa o aggiungi corsisti prima di associarli ai progetti.'],
      ['tabella-progetti', 'Nessun progetto presente. Crea un nuovo corso dalla sezione Progetti.']
    ];
    pairs.forEach(([id, text]) => {
      const el = document.getElementById(id);
      if (!el || el.children.length) return;
      el.innerHTML = `<tr><td colspan="12"><div class="safety-empty-state">${esc(text)}</div></td></tr>`;
    });
  };

  const improveInputs = () => {
    document.querySelectorAll('#app-content input:not([type="checkbox"]):not([type="radio"]), #app-content select, #app-content textarea').forEach(el => {
      if (!el.className.includes('rounded')) el.classList.add('rounded-xl');
      if (!el.className.includes('border')) el.classList.add('border', 'border-slate-300');
      if (!el.className.includes('bg-')) el.classList.add('bg-white');
    });
  };

  window.applySafetyUiRefinements = function(moduleId = window.currentSafetyModuleId || '') {
    injectStyle();
    try {
      window.currentSafetyModuleId = moduleId || window.currentSafetyModuleId || '';
      injectToolbar(moduleId);
      // Indietro/Avanti vanno dentro questa barra (navigation_system): riallinea dopo averla creata.
      if (typeof window.SafetyNavigation?.decorate === 'function') window.SafetyNavigation.decorate();
      polishTables();
      labelEmptyContainers();
      improveInputs();
      if (typeof window.updateNavOffset === 'function') setTimeout(window.updateNavOffset, 40);
      if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (e) {
      console.warn('SafetyManager UI polish non applicato:', e);
    }
  };

  const wrapLoadModule = () => {
    if (typeof window.loadModule !== 'function' || window.loadModule.__uiRefinementsWrapped) return;
    const original = window.loadModule;
    const wrapped = async function(moduleId, ...args) {
      const result = await original.apply(this, [moduleId, ...args]);
      setTimeout(() => window.applySafetyUiRefinements(moduleId), 120);
      // Nessun avviso "Modulo caricato": la voce attiva del menu lo indica gia' e l'avviso copriva i pulsanti sui telefoni.
      return result;
    };
    wrapped.__uiRefinementsWrapped = true;
    window.loadModule = wrapped;
  };

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (typeof window.closePreparaCorsoModal === 'function') window.closePreparaCorsoModal();
      if (typeof window.closeSafetyChecklistModal === 'function') window.closeSafetyChecklistModal();
      // Gli altri popup si chiudono con Esc tramite i propri gestori. Il vecchio selettore qui era non valido e generava un errore a ogni Esc.
      return;
    }
    if (!e.altKey || e.ctrlKey || e.metaKey) return;
    const tag = document.activeElement?.tagName?.toLowerCase();
    if (['input','textarea','select'].includes(tag)) return;
    const key = e.key.toLowerCase();
    const map = { d: 'admin', p: 'progetti', s: 'stampe', a: 'archivio_corsi', b: 'migrazione', c: 'corsisti' };
    if (map[key]) {
      e.preventDefault();
      window.loadModule(map[key]);
    }
  });

  injectStyle();
  wrapLoadModule();
  setTimeout(wrapLoadModule, 0);
  setTimeout(() => window.applySafetyUiRefinements(window.currentSafetyModuleId || 'admin'), 500);
})();
