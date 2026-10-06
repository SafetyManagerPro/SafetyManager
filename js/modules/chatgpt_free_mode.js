// Modalita gratuita ChatGPT per SafetyManager.
// Nessuna chiamata API: prepara un prompt locale, lo copia e apre ChatGPT nel browser.
(function(){
  if (window.__safetyChatGPTFreeModeLoaded) return;
  window.__safetyChatGPTFreeModeLoaded = true;

  const CHATGPT_URL = 'https://chatgpt.com/';
  const FIELD_CONFIG = {
    'prog-validazione-note': 'Note valutazione / prescrizioni CNA',
    'prog-compliance-note-free': 'Note compliance / omogeneita aula',
    'prog-fabbisogni-attivita': 'Attivita svolta / contesto operativo',
    'prog-fabbisogni-ingresso': 'Competenze in ingresso possedute',
    'prog-fabbisogni-richieste': 'Competenze richieste dal ruolo',
    'prog-fabbisogni-gap': 'Gap da colmare con il percorso',
    'prog-fabbisogni-note': 'Note e osservazioni conclusive',
    'prog-gradimento-commenti': 'Sintesi commenti e suggerimenti partecipanti',
    'prog-monitoraggio-esito': 'Sintesi esiti monitoraggio',
    'prog-monitoraggio-criticita': 'Criticita rilevate nel monitoraggio',
    'prog-monitoraggio-miglioramenti': 'Proposte e azioni di miglioramento',
    'prog-tutor-criticita': 'Criticita rilevate dal tutor',
    'prog-tutor-note': 'Note del tutor'
  };

  const ACTIONS = {
    generate: 'Genera una bozza professionale e sintetica adatta al campo indicato.',
    complete: 'Completa il testo esistente mantenendo tono, fatti e significato, senza inventare informazioni.',
    improve: 'Migliora chiarezza, precisione e forma professionale del testo esistente senza cambiarne il significato.',
    summarize: 'Sintetizza il testo esistente mantenendo tutte le informazioni operative importanti.'
  };

  const state = { field: null, action: 'generate' };

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
      .map(input => String(input.closest('label')?.innerText || input.value || '').trim().replace(/\s+/g, ' ').slice(0, 160))
      .filter(Boolean)
      .slice(0, 15);
  }

  function redact(value) {
    let text = String(value || '');
    // Email.
    text = text.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[EMAIL RIMOSSA]');
    // Codice fiscale italiano (forma tipica a 16 caratteri).
    text = text.replace(/\b[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]\b/gi, '[CF RIMOSSO]');
    // Partita IVA italiana, con o senza prefisso IT.
    text = text.replace(/\b(?:IT\s*)?\d{11}\b/gi, '[P.IVA RIMOSSA]');
    // Telefoni con almeno 8 cifre complessive.
    text = text.replace(/(?:\+?\d[\d\s().-]{6,}\d)/g, match => {
      const digits = match.replace(/\D/g, '');
      return digits.length >= 8 ? '[TELEFONO RIMOSSO]' : match;
    });
    return text.trim();
  }

  function buildContext() {
    const risks = getRiskLabels();
    return [
      selectedText('prog-corso') ? `Corso: ${redact(selectedText('prog-corso'))}` : '',
      selectedText('prog-erogatore') ? `Soggetto erogatore: ${redact(selectedText('prog-erogatore'))}` : '',
      selectedText('prog-rischi-settore') ? `Settore/rischio: ${redact(selectedText('prog-rischi-settore'))}` : '',
      selectedText('prog-fabbisogni-ruolo') ? `Ruolo: ${redact(selectedText('prog-fabbisogni-ruolo'))}` : '',
      selectedText('prog-fabbisogni-lingua') ? `Lingua/comprensione: ${redact(selectedText('prog-fabbisogni-lingua'))}` : '',
      risks.length ? `Rischi selezionati: ${risks.map(redact).join('; ')}` : '',
      document.getElementById('prog-omogeneita-aula') ? `Omogeneita aula: ${document.getElementById('prog-omogeneita-aula').checked ? 'si' : 'no'}` : ''
    ].filter(Boolean);
  }

  function buildPrompt(field, action) {
    const fieldLabel = FIELD_CONFIG[field?.id] || field?.getAttribute?.('aria-label') || 'Campo descrittivo';
    const current = redact(field?.value || '');
    const context = buildContext();
    const task = ACTIONS[action] || ACTIONS.generate;

    return [
      'Agisci come assistente redazionale per SafetyManager, gestionale italiano per la formazione in materia di salute e sicurezza sul lavoro.',
      '',
      `COMPITO: ${task}`,
      `CAMPO DA COMPILARE: ${fieldLabel}`,
      '',
      context.length ? 'CONTESTO TECNICO DISPONIBILE:' : '',
      ...context.map(item => `- ${item}`),
      context.length ? '' : '',
      current ? 'TESTO ATTUALE:' : 'TESTO ATTUALE: campo vuoto.',
      current || '',
      '',
      'REGOLE:',
      '- Restituisci soltanto il testo pronto da inserire nel campo, senza introduzioni o spiegazioni.',
      '- Scrivi in italiano professionale, chiaro e conciso.',
      '- Non inventare dati, persone, date, rischi, obblighi normativi o fatti non presenti nel contesto.',
      '- Non dichiarare o certificare la conformita normativa del corso.',
      '- Se le informazioni sono insufficienti, usa una formulazione prudente senza aggiungere dettagli non forniti.',
      '- Mantieni il testo adatto a documentazione amministrativa e formativa aziendale.'
    ].filter((line, index, arr) => !(line === '' && arr[index - 1] === '')).join('\n').trim();
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.focus();
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }

  function ensureModal() {
    let modal = document.getElementById('safety-chatgpt-free-modal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'safety-chatgpt-free-modal';
    modal.className = 'hidden fixed inset-0 z-[10000] bg-slate-950/70 backdrop-blur-sm p-3 sm:p-6 items-center justify-center';
    modal.innerHTML = `
      <div class="w-full max-w-4xl max-h-[94vh] overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-2xl flex flex-col">
        <div class="px-5 py-4 bg-slate-950 text-white flex items-start justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="inline-flex w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 items-center justify-center text-emerald-200 font-black">G</span>
              <div>
                <h3 class="font-black uppercase tracking-wide text-sm">ChatGPT gratuito</h3>
                <p id="safety-free-field-label" class="text-[10px] text-slate-300 mt-0.5">Modalita senza API e senza costi per SafetyManager</p>
              </div>
            </div>
          </div>
          <button type="button" id="safety-free-close" class="shrink-0 rounded-lg bg-white/10 hover:bg-white/20 p-2"><i data-lucide="x" class="w-4 h-4"></i></button>
        </div>

        <div class="p-5 overflow-y-auto space-y-4">
          <div class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-950 leading-relaxed">
            <strong>Nessuna API:</strong> SafetyManager non invia automaticamente il contenuto a servizi esterni. Il prompt viene preparato sul dispositivo, mostrato qui e copiato negli appunti. Sarai tu a incollarlo nel tuo account ChatGPT.
          </div>

          <div>
            <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Operazione</p>
            <div id="safety-free-actions" class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button type="button" data-free-action="generate" class="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-[10px] font-black uppercase text-emerald-900">Genera bozza</button>
              <button type="button" data-free-action="complete" class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase text-slate-700">Completa</button>
              <button type="button" data-free-action="improve" class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase text-slate-700">Migliora</button>
              <button type="button" data-free-action="summarize" class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase text-slate-700">Sintetizza</button>
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between gap-3 mb-1">
              <label class="text-[10px] font-black uppercase tracking-widest text-slate-500">Richiesta pronta per ChatGPT</label>
              <span class="text-[9px] font-bold uppercase text-emerald-700">Identificativi comuni rimossi automaticamente</span>
            </div>
            <textarea id="safety-free-prompt" rows="11" class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-relaxed font-mono"></textarea>
            <p class="text-[10px] text-slate-500 mt-1">Prima di continuare puoi eliminare manualmente eventuali nomi o altri dati personali rimasti nel testo.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button type="button" id="safety-free-open" class="rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-3 text-[10px] font-black uppercase tracking-wide shadow-sm">1. Copia richiesta e apri ChatGPT</button>
            <button type="button" id="safety-free-paste" class="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 px-4 py-3 text-[10px] font-black uppercase tracking-wide">2. Incolla risposta dagli appunti</button>
          </div>

          <div>
            <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Risposta da inserire nel campo</label>
            <textarea id="safety-free-result" rows="8" class="w-full rounded-xl border border-emerald-200 bg-white px-3 py-3 text-sm leading-relaxed outline-none focus:border-emerald-500" placeholder="Dopo aver ottenuto la risposta in ChatGPT, copiala e torna qui. Puoi usare il pulsante “Incolla risposta dagli appunti” oppure incollarla manualmente."></textarea>
          </div>

          <div id="safety-free-status" class="hidden rounded-xl border px-3 py-2 text-xs font-bold"></div>
          <div class="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] leading-relaxed text-amber-900">
            <strong>Controllo umano obbligatorio:</strong> la risposta di ChatGPT e solo una bozza. Verifica sempre contenuto, dati e riferimenti prima di inserirla nella documentazione.
          </div>
        </div>

        <div class="px-5 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
          <button type="button" id="safety-free-cancel" class="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-[10px] font-black uppercase text-slate-700">Chiudi</button>
          <button type="button" id="safety-free-insert" class="rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 text-[10px] font-black uppercase shadow-sm">Inserisci nel campo</button>
        </div>
      </div>`;
    document.body.appendChild(modal);

    modal.querySelector('#safety-free-close').addEventListener('click', closeModal);
    modal.querySelector('#safety-free-cancel').addEventListener('click', closeModal);
    modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
    modal.querySelectorAll('[data-free-action]').forEach(button => button.addEventListener('click', () => setAction(button.dataset.freeAction)));
    modal.querySelector('#safety-free-open').addEventListener('click', openChatGPT);
    modal.querySelector('#safety-free-paste').addEventListener('click', pasteResult);
    modal.querySelector('#safety-free-insert').addEventListener('click', insertResult);
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return modal;
  }

  function showStatus(message, tone = 'emerald') {
    const box = document.getElementById('safety-free-status');
    if (!box) return;
    box.className = `rounded-xl border px-3 py-2 text-xs font-bold ${tone === 'red' ? 'border-red-200 bg-red-50 text-red-800' : tone === 'amber' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`;
    box.textContent = message;
  }

  function refreshPrompt() {
    const prompt = document.getElementById('safety-free-prompt');
    if (prompt && state.field) prompt.value = buildPrompt(state.field, state.action);
  }

  function setAction(action) {
    state.action = ACTIONS[action] ? action : 'generate';
    document.querySelectorAll('#safety-free-actions [data-free-action]').forEach(button => {
      const active = button.dataset.freeAction === state.action;
      button.classList.toggle('ring-2', active);
      button.classList.toggle('ring-emerald-500', active);
      button.classList.toggle('border-emerald-400', active);
    });
    refreshPrompt();
  }

  function openModal(field) {
    if (!field) return;
    const modal = ensureModal();
    state.field = field;
    state.action = String(field.value || '').trim() ? 'improve' : 'generate';
    document.getElementById('safety-free-field-label').textContent = FIELD_CONFIG[field.id] || 'Campo descrittivo';
    document.getElementById('safety-free-result').value = '';
    document.getElementById('safety-free-status').classList.add('hidden');
    setAction(state.action);
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  function closeModal() {
    const modal = document.getElementById('safety-chatgpt-free-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  async function openChatGPT() {
    const prompt = document.getElementById('safety-free-prompt')?.value?.trim() || '';
    if (!prompt) return showStatus('Nessuna richiesta da copiare.', 'red');

    // L'apertura parte direttamente dal click per ridurre il rischio di popup bloccati.
    const chatWindow = window.open(CHATGPT_URL, '_blank', 'noopener,noreferrer');
    try {
      await copyText(prompt);
      showStatus(chatWindow ? 'Richiesta copiata. In ChatGPT incollala nel messaggio, invia e poi copia la risposta.' : 'Richiesta copiata. Il browser ha bloccato la nuova scheda: apri ChatGPT manualmente e incolla il testo.', chatWindow ? 'emerald' : 'amber');
    } catch (error) {
      showStatus('Apertura eseguita, ma la copia automatica non e riuscita. Copia manualmente il testo della richiesta.', 'amber');
    }
  }

  async function pasteResult() {
    const target = document.getElementById('safety-free-result');
    if (!target) return;
    try {
      if (!navigator.clipboard?.readText || !window.isSecureContext) throw new Error('Clipboard non disponibile');
      const text = await navigator.clipboard.readText();
      if (!text.trim()) return showStatus('Gli appunti sono vuoti.', 'amber');
      target.value = text.trim();
      showStatus('Risposta incollata. Controllala prima di inserirla nel campo.');
    } catch (error) {
      target.focus();
      showStatus('Il browser non consente di leggere gli appunti automaticamente. Incolla manualmente la risposta nel riquadro.', 'amber');
    }
  }

  function insertResult() {
    if (!state.field) return;
    const result = document.getElementById('safety-free-result')?.value?.trim() || '';
    if (!result) return showStatus('Incolla prima una risposta da inserire.', 'amber');
    state.field.value = result;
    state.field.dispatchEvent(new Event('input', { bubbles: true }));
    state.field.dispatchEvent(new Event('change', { bubbles: true }));
    state.field.focus();
    closeModal();
  }

  function decorate() {
    document.querySelectorAll('.safety-ai-field-tools').forEach(bar => {
      if (bar.dataset.chatgptFreeReady === '1') return;
      const field = bar.previousElementSibling;
      if (!field || !FIELD_CONFIG[field.id]) return;
      bar.dataset.chatgptFreeReady = '1';
      bar.classList.add('gap-1', 'flex-wrap');

      const integrated = bar.querySelector('button');
      if (integrated) {
        const label = integrated.querySelector('span:last-child');
        if (label) label.textContent = 'IA integrata';
        integrated.title = 'Usa l’assistente integrato via API, se configurato';
      }

      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.chatgptFree = '1';
      button.className = 'inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-emerald-900 transition';
      button.innerHTML = '<span class="text-[11px]">G</span><span>ChatGPT gratis</span>';
      button.title = 'Prepara la richiesta e usa il tuo account ChatGPT senza API SafetyManager';
      button.addEventListener('click', () => openModal(field));
      bar.insertBefore(button, integrated || bar.firstChild);
    });
  }

  window.SafetyChatGPTFree = { apply: decorate, openForField(id) { const field = document.getElementById(id); if (field) openModal(field); }, buildPrompt };

  ensureModal();
  decorate();
  const root = document.getElementById('app-content') || document.body;
  new MutationObserver(() => {
    clearTimeout(window.__safetyChatGPTFreeTimer);
    window.__safetyChatGPTFreeTimer = setTimeout(decorate, 100);
  }).observe(root, { childList: true, subtree: true });
})();