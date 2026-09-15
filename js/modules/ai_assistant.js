// Assistente IA redazionale SafetyManagerPro
(function(){
  if (window.__safetyAIAssistantLoaded) return;
  window.__safetyAIAssistantLoaded = true;

  const FIELD_CONFIG = {
    'prog-validazione-note': 'Note valutazione / prescrizioni CNA',
    'prog-compliance-note-free': 'Note compliance / omogeneità aula',
    'prog-fabbisogni-attivita': 'Attività svolta / contesto operativo',
    'prog-fabbisogni-ingresso': 'Competenze in ingresso possedute',
    'prog-fabbisogni-richieste': 'Competenze richieste dal ruolo',
    'prog-fabbisogni-gap': 'Gap da colmare con il percorso',
    'prog-fabbisogni-note': 'Note e osservazioni conclusive',
    'prog-gradimento-commenti': 'Sintesi commenti e suggerimenti partecipanti',
    'prog-monitoraggio-esito': 'Sintesi esiti monitoraggio',
    'prog-monitoraggio-criticita': 'Criticità rilevate nel monitoraggio',
    'prog-monitoraggio-miglioramenti': 'Proposte e azioni di miglioramento',
    'prog-tutor-criticita': 'Criticità rilevate dal tutor',
    'prog-tutor-note': 'Note del tutor'
  };

  const state = {
    target: null,
    action: 'generate',
    lastResult: ''
  };

  function selectedText(id) {
    const el = document.getElementById(id);
    if (!el) return '';
    if (el.tagName === 'SELECT') return el.options?.[el.selectedIndex]?.textContent?.trim() || '';
    return String(el.value || '').trim();
  }

  function getRiskLabels() {
    const root = document.getElementById('prog-rischi-list');
    if (!root) return [];
    return [...root.querySelectorAll('input[type="checkbox"]:checked')]
      .map(input => {
        const label = input.closest('label');
        return String(label?.innerText || input.value || '').trim().replace(/\s+/g, ' ').slice(0, 180);
      })
      .filter(Boolean)
      .slice(0, 20);
  }

  function buildContext() {
    return {
      course: selectedText('prog-corso'),
      provider: selectedText('prog-erogatore'),
      riskSector: selectedText('prog-rischi-settore'),
      role: selectedText('prog-fabbisogni-ruolo'),
      language: selectedText('prog-fabbisogni-lingua'),
      selectedRisks: getRiskLabels(),
      classHomogeneity: !!document.getElementById('prog-omogeneita-aula')?.checked
    };
  }

  function ensureModal() {
    if (document.getElementById('safety-ai-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'safety-ai-modal';
    modal.className = 'hidden fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-sm p-3 sm:p-6 items-center justify-center';
    modal.innerHTML = `
      <div class="w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-2xl flex flex-col">
        <div class="px-5 py-4 border-b border-slate-200 bg-slate-950 text-white flex items-start justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="inline-flex w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-400/30 items-center justify-center text-violet-200">✦</span>
              <div>
                <h3 class="font-black uppercase tracking-wide text-sm">Assistente IA SafetyManager</h3>
                <p id="safety-ai-field-label" class="text-[10px] text-slate-300 mt-0.5">Campo descrittivo</p>
              </div>
            </div>
          </div>
          <button type="button" id="safety-ai-close" class="shrink-0 rounded-lg bg-white/10 hover:bg-white/20 p-2" title="Chiudi">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="p-5 overflow-y-auto space-y-4">
          <div>
            <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Cosa vuoi fare</p>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2" id="safety-ai-actions">
              <button type="button" data-ai-action="generate" class="safety-ai-action rounded-xl border border-violet-200 bg-violet-50 hover:bg-violet-100 px-3 py-2 text-[10px] font-black uppercase text-violet-800">Genera bozza</button>
              <button type="button" data-ai-action="complete" class="safety-ai-action rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-2 text-[10px] font-black uppercase text-slate-700">Completa</button>
              <button type="button" data-ai-action="improve" class="safety-ai-action rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-2 text-[10px] font-black uppercase text-slate-700">Migliora</button>
              <button type="button" data-ai-action="summarize" class="safety-ai-action rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-2 text-[10px] font-black uppercase text-slate-700">Sintetizza</button>
            </div>
          </div>

          <div id="safety-ai-current-wrap">
            <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Testo attuale</label>
            <div id="safety-ai-current" class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap max-h-32 overflow-y-auto"></div>
          </div>

          <div>
            <div class="flex items-center justify-between gap-3 mb-1">
              <label class="text-[10px] font-black uppercase tracking-widest text-slate-500">Proposta IA</label>
              <span id="safety-ai-status" class="text-[9px] font-bold uppercase text-slate-400"></span>
            </div>
            <textarea id="safety-ai-result" rows="9" class="w-full px-3 py-3 rounded-xl border border-violet-200 bg-white outline-none focus:border-violet-500 text-sm leading-relaxed" placeholder="La proposta apparirà qui e potrà essere modificata prima dell'inserimento."></textarea>
          </div>

          <div id="safety-ai-error" class="hidden rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-800"></div>

          <div class="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] leading-relaxed text-amber-900">
            <strong>Controllo umano obbligatorio:</strong> l’IA prepara solo una bozza. Non salva automaticamente, non certifica conformità e non deve inventare rischi, obblighi o dati mancanti. Al servizio vengono inviati il testo del campo e solo un contesto tecnico limitato; nomi, CF, email e telefoni non vengono inclusi dal componente.
          </div>
        </div>

        <div class="px-5 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <button type="button" id="safety-ai-regenerate" class="rounded-xl border border-slate-300 bg-white hover:bg-slate-100 px-4 py-2.5 text-[10px] font-black uppercase text-slate-700">Rigenera</button>
          <div class="flex gap-2">
            <button type="button" id="safety-ai-cancel" class="flex-1 sm:flex-none rounded-xl border border-slate-300 bg-white hover:bg-slate-100 px-4 py-2.5 text-[10px] font-black uppercase text-slate-700">Annulla</button>
            <button type="button" id="safety-ai-insert" class="flex-1 sm:flex-none rounded-xl bg-violet-700 hover:bg-violet-600 text-white px-5 py-2.5 text-[10px] font-black uppercase shadow-sm">Inserisci nel campo</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);

    modal.querySelector('#safety-ai-close').addEventListener('click', closeModal);
    modal.querySelector('#safety-ai-cancel').addEventListener('click', closeModal);
    modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
    modal.querySelectorAll('[data-ai-action]').forEach(btn => {
      btn.addEventListener('click', () => runAssistant(btn.dataset.aiAction));
    });
    modal.querySelector('#safety-ai-regenerate').addEventListener('click', () => runAssistant(state.action));
    modal.querySelector('#safety-ai-insert').addEventListener('click', insertResult);

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function setActionUI(action) {
    document.querySelectorAll('#safety-ai-actions [data-ai-action]').forEach(btn => {
      const active = btn.dataset.aiAction === action;
      btn.classList.toggle('ring-2', active);
      btn.classList.toggle('ring-violet-500', active);
      btn.classList.toggle('border-violet-400', active);
    });
  }

  function openModal(field) {
    ensureModal();
    state.target = field;
    state.action = field.value.trim() ? 'improve' : 'generate';
    state.lastResult = '';

    const modal = document.getElementById('safety-ai-modal');
    const label = FIELD_CONFIG[field.id] || field.getAttribute('aria-label') || 'Campo descrittivo';
    document.getElementById('safety-ai-field-label').textContent = label;
    document.getElementById('safety-ai-current').textContent = field.value.trim() || 'Campo vuoto';
    document.getElementById('safety-ai-result').value = '';
    document.getElementById('safety-ai-status').textContent = '';
    document.getElementById('safety-ai-error').classList.add('hidden');

    const hasText = !!field.value.trim();
    ['complete','improve','summarize'].forEach(action => {
      const btn = modal.querySelector(`[data-ai-action="${action}"]`);
      if (btn) {
        btn.disabled = !hasText;
        btn.classList.toggle('opacity-40', !hasText);
        btn.classList.toggle('cursor-not-allowed', !hasText);
      }
    });

    setActionUI(state.action);
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  function closeModal() {
    const modal = document.getElementById('safety-ai-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  async function getSessionToken() {
    if (!window.supabaseClient?.auth) return '';
    const { data, error } = await window.supabaseClient.auth.getSession();
    if (error) throw error;
    return data?.session?.access_token || '';
  }

  function setBusy(busy) {
    const status = document.getElementById('safety-ai-status');
    const result = document.getElementById('safety-ai-result');
    const buttons = document.querySelectorAll('#safety-ai-modal button');
    buttons.forEach(btn => { btn.disabled = busy; });
    if (result) result.disabled = busy;
    if (status) status.textContent = busy ? 'Elaborazione…' : '';
  }

  async function runAssistant(action) {
    if (!state.target) return;
    const currentText = state.target.value.trim();
    if (action !== 'generate' && !currentText) return;

    state.action = action;
    setActionUI(action);
    const errorBox = document.getElementById('safety-ai-error');
    errorBox.classList.add('hidden');
    errorBox.textContent = '';
    setBusy(true);

    try {
      const token = await getSessionToken();
      if (!token) throw new Error('Sessione scaduta: effettua nuovamente l’accesso a SafetyManager.');

      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action,
          fieldId: state.target.id,
          fieldLabel: FIELD_CONFIG[state.target.id] || 'Campo descrittivo',
          currentText,
          context: buildContext()
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = data?.detail ? ` ${data.detail}` : '';
        throw new Error((data?.error || 'Assistente IA non disponibile.') + detail);
      }

      state.lastResult = String(data?.text || '').trim();
      document.getElementById('safety-ai-result').value = state.lastResult;
      document.getElementById('safety-ai-status').textContent = data?.model ? `Modello: ${data.model}` : 'Bozza pronta';
    } catch (error) {
      errorBox.textContent = error?.message || String(error);
      errorBox.classList.remove('hidden');
    } finally {
      setBusy(false);
      // Ripristina l'eventuale disabilitazione dovuta al campo vuoto.
      const hasText = !!state.target?.value.trim();
      ['complete','improve','summarize'].forEach(name => {
        const btn = document.querySelector(`#safety-ai-modal [data-ai-action="${name}"]`);
        if (btn) btn.disabled = !hasText;
      });
    }
  }

  function insertResult() {
    if (!state.target) return;
    const result = document.getElementById('safety-ai-result')?.value?.trim() || '';
    if (!result) return;
    state.target.value = result;
    state.target.dispatchEvent(new Event('input', { bubbles: true }));
    state.target.dispatchEvent(new Event('change', { bubbles: true }));
    state.target.focus();
    closeModal();
  }

  function decorateField(field) {
    if (!field || field.dataset.safetyAiReady === '1') return;
    field.dataset.safetyAiReady = '1';

    const bar = document.createElement('div');
    bar.className = 'safety-ai-field-tools mt-1 flex justify-end';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 hover:bg-violet-100 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-violet-800 transition';
    button.innerHTML = '<span class="text-[11px]">✦</span><span>Assistente IA</span>';
    button.title = 'Genera o migliora questo campo con l’Assistente IA';
    button.addEventListener('click', () => openModal(field));
    bar.appendChild(button);
    field.insertAdjacentElement('afterend', bar);
  }

  function apply() {
    Object.keys(FIELD_CONFIG).forEach(id => decorateField(document.getElementById(id)));
  }

  window.SafetyAI = {
    apply,
    openForField(id) {
      const field = document.getElementById(id);
      if (field) openModal(field);
    },
    fields: { ...FIELD_CONFIG }
  };

  ensureModal();
  apply();
  const root = document.getElementById('app-content') || document.body;
  new MutationObserver(() => {
    clearTimeout(window.__safetyAIApplyTimer);
    window.__safetyAIApplyTimer = setTimeout(apply, 80);
  }).observe(root, { childList: true, subtree: true });
})();
