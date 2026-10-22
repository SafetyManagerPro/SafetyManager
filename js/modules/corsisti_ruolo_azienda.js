// Ruolo aziendale corsista/persona per documenti e filtri SafetyManagerPro
(function(){
  if(window.__safetyCorsistiRuoloLoaded) return;
  window.__safetyCorsistiRuoloLoaded = true;

  // Il ruolo anagrafico distingue solo lavoratore e datore di lavoro.
  // Gli incarichi specifici vengono ricavati dallo storico formativo per le stampe.
  const ROLES = [
    ['lavoratore','Lavoratore'],
    ['datore_lavoro','Datore di lavoro / legale rappresentante']
  ];

  const normalizeRole = value => String(value || '') === 'datore_lavoro' ? 'datore_lavoro' : 'lavoratore';
  window.SAFETY_PERSON_ROLES = ROLES;
  window.normalizeSafetyPersonRole = normalizeRole;
  window.getSafetyPersonRoleLabel = value => normalizeRole(value) === 'datore_lavoro'
    ? 'Datore di lavoro / legale rappresentante'
    : 'Lavoratore';

  const esc = value => String(value ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#039;');

  const formatDate = value => {
    if(!value) return 'data non indicata';
    const parts=String(value).split('-');
    return parts.length===3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : String(value);
  };

  window.__safetyCorsistiRoleMap = window.__safetyCorsistiRoleMap || new Map();

  function injectMainField(){
    const form = document.getElementById('form-corsista');
    if(!form || document.getElementById('cor-ruolo-aziendale')) return;
    const mansione = document.getElementById('cor-mansione');
    if(!mansione) return;
    const host = mansione.closest('div');
    if(!host || !host.parentElement) return;
    const wrap = document.createElement('div');
    wrap.id = 'cor-ruolo-aziendale-wrap';
    wrap.innerHTML = `<label class="text-[10px] font-bold text-slate-500 uppercase block mb-1">Ruolo aziendale</label>
      <select id="cor-ruolo-aziendale" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded outline-none focus:border-blue-500 focus:bg-white transition font-semibold text-slate-700">
        ${ROLES.map(([k,l])=>`<option value="${k}">${l}</option>`).join('')}
      </select>
      <p class="text-[9px] text-slate-400 font-bold uppercase mt-1">Il ruolo viene salvato insieme al record solo premendo “Salva Record”.</p>`;
    host.parentElement.insertBefore(wrap, host.nextSibling);
  }

  function injectCompanyHistoryPanel(){
    const form=document.getElementById('form-corsista');
    const company=document.getElementById('cor-azienda');
    if(!form||!company||document.getElementById('cor-company-history-wrap')) return;
    const host=company.closest('div');
    if(!host||!host.parentElement) return;

    const wrap=document.createElement('div');
    wrap.id='cor-company-history-wrap';
    wrap.className='rounded-xl border border-violet-200 bg-violet-50 p-3 space-y-2';
    wrap.innerHTML=`
      <div>
        <p class="text-[10px] font-black uppercase text-violet-900 flex items-center gap-2">
          <i data-lucide="history" class="w-4 h-4"></i> Azienda attuale e storico
        </p>
        <p class="text-[9px] leading-snug text-violet-800 mt-1">Per un cambio azienda modifica “Azienda di appartenenza” e salva. I corsi e gli attestati già svolti restano collegati all’azienda del relativo progetto storico.</p>
      </div>
      <div id="cor-company-change-warning" class="hidden rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[9px] font-bold text-amber-900">
        Stai cambiando l’azienda corrente. Al salvataggio il rapporto precedente verrà chiuso e ne verrà aperto uno nuovo; lo storico formativo non verrà modificato.
      </div>
      <div class="rounded-lg border border-violet-200 bg-white p-2">
        <label for="cor-azienda-data-inizio" class="text-[9px] font-black uppercase text-violet-800 block mb-1">Decorrenza azienda attuale</label>
        <input type="date" id="cor-azienda-data-inizio" max="2026-10-22" class="w-full px-3 py-2 bg-white border border-violet-200 rounded text-xs font-bold text-slate-700">
        <p class="text-[8px] text-slate-500 mt-1">Nel cambio azienda indica la data effettiva di ingresso. Se non la modifichi, SafetyManager propone oggi.</p>
      </div>
      <details id="cor-company-history-details" class="rounded-lg border border-violet-200 bg-white">
        <summary class="cursor-pointer px-3 py-2 text-[9px] font-black uppercase text-violet-800">Mostra storico aziende</summary>
        <div id="cor-company-history-list" class="border-t border-violet-100 p-2 text-[9px] text-slate-600">
          Seleziona un corsista per visualizzare lo storico.
        </div>
      </details>`;
    host.parentElement.insertBefore(wrap,host.nextSibling);

    company.addEventListener('change',()=>{
      const warning=document.getElementById('cor-company-change-warning');
      const dateInput=document.getElementById('cor-azienda-data-inizio');
      const original=company.dataset.originalCompanyId ?? '';
      const current=company.value || '';
      const isExisting=!!document.getElementById('cor-id')?.value;
      const isChanged=isExisting && original!==current;
      if(warning) warning.classList.toggle('hidden',!isChanged);
      if(dateInput && current){
        if(isChanged || !dateInput.value) dateInput.value=new Date().toISOString().slice(0,10);
      } else if(dateInput && !current) {
        dateInput.value='';
      }
    });
    if(window.lucide) window.lucide.createIcons({attrs:{'aria-hidden':'true'}});
  }

  async function loadCompanyHistory(corsistaId){
    const list=document.getElementById('cor-company-history-list');
    if(!list) return;
    if(!corsistaId){
      list.innerHTML='Seleziona un corsista per visualizzare lo storico.';
      return;
    }
    list.innerHTML='<div class="py-2 text-slate-400 font-bold">Caricamento storico...</div>';
    const rows=typeof window.getCorsistaCompanyHistory==='function'
      ? await window.getCorsistaCompanyHistory(corsistaId)
      : [];
    if(!rows.length){
      list.innerHTML='<div class="py-2 text-slate-400 font-bold">Nessun rapporto storico registrato.</div>';
      return;
    }
    list.innerHTML=rows.map(row=>{
      const current=!row.data_fine;
      const company=row.azienda_nome_storica || (row.azienda_id ? 'Azienda registrata' : 'Nessuna azienda');
      const period=`${row.data_inizio ? 'dal '+formatDate(row.data_inizio) : 'inizio non indicato'}${row.data_fine ? ' al '+formatDate(row.data_fine) : ' · attuale'}`;
      return `<div class="py-2 border-b border-violet-100 last:border-b-0">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="font-black uppercase text-slate-800 break-words">${esc(company)}</p>
            <p class="font-mono text-[8px] text-slate-500">${esc(row.azienda_piva_cf_storica || '')}</p>
            <p class="mt-1 text-slate-600">${esc(period)}</p>
            <p class="mt-1"><strong>Mansione:</strong> ${esc(row.mansione_storica || '-')} · <strong>Ruolo:</strong> ${esc(window.getSafetyPersonRoleLabel(row.ruolo_aziendale))}</p>
          </div>
          ${current?'<span class="shrink-0 rounded-full bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-[8px] font-black uppercase text-emerald-700">Attuale</span>':''}
        </div>
      </div>`;
    }).join('');
  }

  function injectQuickAddField(){
    const modal = document.getElementById('qa-modal-corsista');
    if(!modal || document.getElementById('qa-cor-ruolo-aziendale')) return;
    const mansione = modal.querySelector('#qa-cor-mansione');
    if(!mansione) return;
    const host = mansione.closest('div');
    if(!host || !host.parentElement) return;
    const wrap = document.createElement('div');
    wrap.id = 'qa-cor-ruolo-aziendale-wrap';
    wrap.innerHTML = `<label class="text-[10px] font-bold text-slate-500 uppercase block mb-1">Ruolo aziendale</label>
      <select id="qa-cor-ruolo-aziendale" class="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs font-bold text-slate-700">
        ${ROLES.map(([k,l])=>`<option value="${k}">${l}</option>`).join('')}
      </select>`;
    host.parentElement.insertBefore(wrap, host.nextSibling);
  }

  // La query relazionale di loadCorsistiTable in utils.js usa una SELECT esplicita e
  // storicamente non includeva ruolo_aziendale. Recuperiamo quindi il valore reale dal DB
  // e lo reinseriamo nei record usati dall'Anagrafica senza perdere iscrizioni/relazioni.
  async function refreshRoleCache(){
    const current=Array.isArray(window.corsistiList)?window.corsistiList:[];
    if(!current.length) return;
    const map=new Map(current.map(c=>[String(c.id),normalizeRole(c.ruolo_aziendale)]));
    window.__safetyCorsistiRoleMap=map;
  }

  function roleForId(id){
    const fromList = (window.corsistiList || []).find(c => String(c.id) === String(id));
    if(fromList?.ruolo_aziendale) return normalizeRole(fromList.ruolo_aziendale);
    return normalizeRole(window.__safetyCorsistiRoleMap?.get(String(id)));
  }

  function decorateRows(){
    const tbody = document.getElementById('tabella-corsisti');
    if(!tbody) return;
    [...tbody.querySelectorAll('tr')].forEach(tr => {
      const edit = tr.querySelector('button[onclick*="modificaCorsista("]');
      if(!edit) return;
      const m = String(edit.getAttribute('onclick') || '').match(/modificaCorsista\('([^']+)'\)/);
      if(!m) return;
      const cell = tr.children[2];
      if(!cell) return;
      let badge = cell.querySelector('.safety-role-badge');
      if(!badge){
        badge = document.createElement('span');
        badge.className = 'safety-role-badge inline-flex mt-1 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[8px] font-black uppercase text-slate-600';
        cell.appendChild(badge);
      }
      badge.textContent = window.getSafetyPersonRoleLabel(roleForId(m[1]));
    });
  }

  function wrapLoadCorsistiTable(){
    const fn = window.loadCorsistiTable;
    if(typeof fn !== 'function' || fn.__safetyRoleLoadWrapped) return;
    const wrapped = async function(...args){
      const result = await fn.apply(this, args);
      await refreshRoleCache();
      decorateRows();
      return result;
    };
    wrapped.__safetyRoleLoadWrapped = true;
    window.loadCorsistiTable = wrapped;
  }

  // Salvataggio principale: il ruolo entra direttamente nel record inviato a saveCorsistaData.
  // Non viene più modificata/sostituita saveCorsistaData e non esiste alcun salvataggio onchange.
  function installMainSave(){
    const current = window.salvaCorsistaDB;
    if(typeof current !== 'function' || current.__safetyRoleNativeSave) return;

    const wrapped = async function(){
      const id = document.getElementById('cor-id')?.value || '';
      const record = {
        nome_cognome: document.getElementById('cor-nome')?.value.trim() || '',
        cf: document.getElementById('cor-cf')?.value.trim().toUpperCase() || '',
        luogo_data_nascita: document.getElementById('cor-nascita')?.value.trim() || '',
        mansione_storica: document.getElementById('cor-mansione')?.value.trim() || '',
        azienda_id: document.getElementById('cor-azienda')?.value || null,
        azienda_data_inizio: document.getElementById('cor-azienda-data-inizio')?.value || null,
        ruolo_aziendale: normalizeRole(document.getElementById('cor-ruolo-aziendale')?.value),
        documento_identita_url: document.getElementById('cor-doc-identita-url')?.value.trim() || '',
        codice_fiscale_url: document.getElementById('cor-doc-cf-url')?.value.trim() || '',
        ...(typeof window.collectLinguaTestCorsistaRecord === 'function' ? window.collectLinguaTestCorsistaRecord() : {})
      };
      if(id) record.id = id;

      const previous = id ? (window.corsistiList || []).find(c => String(c.id) === String(id)) : null;
      const oldCompany = String(previous?.azienda_id || '');
      const newCompany = String(record.azienda_id || '');
      if(previous && oldCompany !== newCompany) {
        const oldName = previous?.aziende?.ragione_sociale || (oldCompany ? 'azienda precedente' : 'nessuna azienda');
        const newObj = (window.aziendeList || []).find(a => String(a.id) === newCompany);
        const newName = newObj?.ragione_sociale || (newCompany ? 'nuova azienda' : 'nessuna azienda');
        const effectiveDate = record.azienda_data_inizio || new Date().toISOString().slice(0,10);
        const effectiveLabel = formatDate(effectiveDate);
        const ok = confirm(
          `Cambio azienda: ${oldName} → ${newName}.\nDecorrenza: ${effectiveLabel}.\n\n` +
          'Il rapporto precedente verrà conservato nello storico. I corsi e gli attestati già svolti NON verranno modificati. Procedere?'
        );
        if(!ok) return false;
      }

      const savedCorsista = await window.saveCorsistaData(record);
      if(!savedCorsista){
        alert('Errore nel salvataggio. Assicurati che il Codice Fiscale non sia già registrato.');
        return false;
      }

      const saved = Array.isArray(savedCorsista) ? savedCorsista[0] : savedCorsista;
      const corsistaId = saved?.id || record.id;
      if(corsistaId && typeof window.updateIscrizioniCorsistaSnapshot === 'function') {
        await window.updateIscrizioniCorsistaSnapshot(corsistaId, record);
      }

      if(window.SafetyCompanyDocs) window.SafetyCompanyDocs.directoryCache = null;
      if(typeof window.markSafetyWorkSaved === 'function') window.markSafetyWorkSaved('form-corsista');
      window.resetFormCorsista();
      await window.reloadLinkedViewsAfterMutation('corsista', { corsistaId });
      return savedCorsista;
    };

    wrapped.__safetyRoleNativeSave = true;
    window.salvaCorsistaDB = wrapped;
  }

  // Stessa regola per inserimento/modifica rapida: ruolo scritto nel payload vero.
  function installQuickSave(){
    const current = window.salvaQACorsista;
    if(typeof current !== 'function' || current.__safetyRoleNativeSave) return;

    const wrapped = async function(){
      const id = document.getElementById('qa-cor-id')?.value || '';
      const nome = document.getElementById('qa-cor-nome')?.value.trim() || '';
      const cf = document.getElementById('qa-cor-cf')?.value.trim().toUpperCase() || '';
      const nascita = document.getElementById('qa-cor-nascita')?.value.trim() || '';
      const mansione = document.getElementById('qa-cor-mansione')?.value.trim() || '';
      const az_id = document.getElementById('qa-cor-azienda-id')?.value || null;
      const ruolo = normalizeRole(document.getElementById('qa-cor-ruolo-aziendale')?.value);

      if(!nome || !cf) return alert('Inserisci Nome e CF.');

      const record = {
        nome_cognome: nome,
        cf,
        luogo_data_nascita: nascita,
        mansione_storica: mansione,
        azienda_id: az_id,
        ruolo_aziendale: ruolo
      };
      if(id) record.id = id;

      const saved = await window.saveCorsistaData(record);
      if(!saved) return alert('Errore nel salvataggio. Assicurati che il Codice Fiscale non sia già registrato.');

      const savedId = Array.isArray(saved) && saved[0] ? saved[0].id : (saved.id || id);
      window.corsistiList = await window.getCorsisti();
      window.__safetyCorsistiRoleMap = new Map((window.corsistiList || []).map(c => [String(c.id), normalizeRole(c.ruolo_aziendale)]));
      if(window.SafetyCompanyDocs) window.SafetyCompanyDocs.directoryCache = null;

      window.chiudiQACorsista();

      if(!id && window.currentProgettoId && savedId && typeof window.aggiungiIscrizioneDaId === 'function') {
        await window.aggiungiIscrizioneDaId(window.currentProgettoId, savedId);
        return saved;
      }
      if(!id && savedId && document.getElementById('prog-draft-corsista') && typeof window.aggiungiCorsistaDraftProgetto === 'function') {
        window.aggiungiCorsistaDraftProgetto(savedId);
        return saved;
      }
      if(typeof window.loadProgettiTable === 'function' && document.getElementById('tabella-progetti')) {
        await window.loadProgettiTable();
      }
      return saved;
    };

    wrapped.__safetyRoleNativeSave = true;
    window.salvaQACorsista = wrapped;
  }

  function wrapEdit(){
    const fn = window.modificaCorsista;
    if(typeof fn !== 'function' || fn.__safetyRoleWrapped) return;
    const wrapped = function(id, ...args){
      const result = fn.call(this, id, ...args);
      injectMainField();
      const select = document.getElementById('cor-ruolo-aziendale');
      if(select) select.value = roleForId(id);
      const company=document.getElementById('cor-azienda');
      if(company){
        const current=(window.corsistiList || []).find(c=>String(c.id)===String(id));
        company.dataset.originalCompanyId=String(current?.azienda_id || '');
        const dateInput=document.getElementById('cor-azienda-data-inizio');
        if(dateInput) dateInput.value=current?.azienda_data_inizio || '';
      }
      const warning=document.getElementById('cor-company-change-warning');
      if(warning) warning.classList.add('hidden');
      loadCompanyHistory(id);
      return result;
    };
    wrapped.__safetyRoleWrapped = true;
    window.modificaCorsista = wrapped;
  }

  function wrapReset(){
    const fn = window.resetFormCorsista;
    if(typeof fn !== 'function' || fn.__safetyRoleWrapped) return;
    const wrapped = function(...args){
      const result = fn.apply(this, args);
      const select = document.getElementById('cor-ruolo-aziendale');
      if(select) select.value = 'lavoratore';
      const company=document.getElementById('cor-azienda');
      if(company) delete company.dataset.originalCompanyId;
      const dateInput=document.getElementById('cor-azienda-data-inizio');
      if(dateInput) dateInput.value='';
      const warning=document.getElementById('cor-company-change-warning');
      if(warning) warning.classList.add('hidden');
      loadCompanyHistory('');
      return result;
    };
    wrapped.__safetyRoleWrapped = true;
    window.resetFormCorsista = wrapped;
  }

  function syncQuickAddRole(){
    const select = document.getElementById('qa-cor-ruolo-aziendale');
    const modal = document.getElementById('qa-modal-corsista');
    const id = document.getElementById('qa-cor-id')?.value || '';
    if(!select || !modal || modal.classList.contains('hidden')) return;

    const recordKey = id || '__new__';
    if(select.dataset.safetyRoleRecordKey === recordKey) return;
    select.value = id ? roleForId(id) : 'lavoratore';
    select.dataset.safetyRoleRecordKey = recordKey;
  }

  function apply(){
    injectMainField();
    injectCompanyHistoryPanel();
    injectQuickAddField();
    wrapLoadCorsistiTable();
    installMainSave();
    installQuickSave();
    wrapEdit();
    wrapReset();
    syncQuickAddRole();
    decorateRows();
  }

  apply();
  setTimeout(apply,100);
  setTimeout(apply,500);
  const root = document.getElementById('app-content') || document.body;
  new MutationObserver(() => {
    clearTimeout(window.__safetyRoleApplyTimer);
    window.__safetyRoleApplyTimer = setTimeout(apply,40);
  }).observe(root,{childList:true,subtree:true});
})();

// Modulo sempre caricato da app.js: aggancia anche l'assistente redazionale senza
// introdurre dipendenze nella pagina o esporre credenziali nel browser.
if (typeof window.loadOptionalSafetyScript === 'function') {
  window.loadOptionalSafetyScript('js/modules/ai_assistant.js');
}
