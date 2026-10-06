// Router UI per le modalita IA di SafetyManager.
// ChatGPT gratuito e il percorso principale; l'IA integrata resta opzionale.
(function(){
  if (window.__safetyAiModeRouterLoaded) return;
  window.__safetyAiModeRouterLoaded = true;

  let lastFieldId = '';
  let fallbackLock = false;

  function getFieldFromToolBar(bar) {
    const field = bar?.previousElementSibling;
    if (!field || !field.id) return null;
    return field;
  }

  function isFreeButton(button) {
    return !!button?.dataset?.chatgptFree;
  }

  function styleBar(bar) {
    if (!bar) return;
    const field = getFieldFromToolBar(bar);
    if (!field) return;

    const buttons = [...bar.querySelectorAll('button')];
    const free = buttons.find(isFreeButton);
    const integrated = buttons.find(btn => !isFreeButton(btn));

    if (free) {
      free.className = 'inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-700 hover:bg-emerald-600 px-3 py-1.5 text-[9px] font-black uppercase tracking-wide text-white transition shadow-sm';
      free.innerHTML = '<span class="text-[11px]">G</span><span>ChatGPT gratis</span><span class="ml-0.5 rounded bg-white/15 px-1 py-0.5 text-[7px]">Consigliato</span>';
      free.title = 'Modalita principale: usa il tuo account ChatGPT senza costi API per SafetyManager';
      if (bar.firstElementChild !== free) bar.prepend(free);
    }

    if (integrated) {
      integrated.className = 'inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2 py-1 text-[8px] font-bold uppercase tracking-wide text-slate-500 transition';
      integrated.innerHTML = '<span class="text-[10px]">✦</span><span>IA integrata</span>';
      integrated.title = 'Modalita opzionale via API. Se non disponibile, SafetyManager passa a ChatGPT gratis.';
    }

    bar.classList.add('gap-2','flex-wrap','items-center');
    bar.dataset.aiRouterReady = '1';
  }

  function applyPrimaryUi() {
    document.querySelectorAll('.safety-ai-field-tools').forEach(styleBar);
  }

  function closeIntegratedModal() {
    const modal = document.getElementById('safety-ai-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  function openFreeFallback() {
    if (fallbackLock || !lastFieldId) return;
    const field = document.getElementById(lastFieldId);
    if (!field || typeof window.SafetyChatGPTFree?.openForField !== 'function') return;

    fallbackLock = true;
    closeIntegratedModal();
    setTimeout(() => {
      try {
        window.SafetyChatGPTFree.openForField(lastFieldId);
        const box = document.getElementById('safety-free-status');
        if (box) {
          box.className = 'rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-3 py-2 text-xs font-bold';
          box.textContent = 'L’IA integrata non è disponibile in questo momento. SafetyManager ha aperto automaticamente ChatGPT gratuito.';
        }
      } finally {
        setTimeout(() => { fallbackLock = false; }, 400);
      }
    }, 60);
  }

  function watchIntegratedError() {
    const errorBox = document.getElementById('safety-ai-error');
    if (!errorBox || errorBox.dataset.aiRouterWatched === '1') return;
    errorBox.dataset.aiRouterWatched = '1';

    const observer = new MutationObserver(() => {
      const visible = !errorBox.classList.contains('hidden');
      const text = String(errorBox.textContent || '').trim();
      if (visible && text) openFreeFallback();
    });
    observer.observe(errorBox, { childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:['class'] });
  }

  // Ricorda il campo associato all'uso dell'IA integrata.
  document.addEventListener('click', event => {
    const button = event.target?.closest?.('.safety-ai-field-tools button');
    if (!button || isFreeButton(button)) return;
    const bar = button.closest('.safety-ai-field-tools');
    const field = getFieldFromToolBar(bar);
    if (field?.id) lastFieldId = field.id;
  }, true);

  function apply() {
    applyPrimaryUi();
    watchIntegratedError();
  }

  window.SafetyAIModeRouter = { apply };
  apply();

  const root = document.getElementById('app-content') || document.body;
  new MutationObserver(() => {
    clearTimeout(window.__safetyAiModeRouterTimer);
    window.__safetyAiModeRouterTimer = setTimeout(apply, 80);
  }).observe(root, { childList:true, subtree:true });
})();
