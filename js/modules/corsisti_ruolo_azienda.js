// Ruolo aziendale corsista/persona per documenti e filtri SafetyManagerPro
(function(){
  if(window.__safetyCorsistiRuoloLoaded) return;
  window.__safetyCorsistiRuoloLoaded = true;

  // Il ruolo anagrafico serve solo a distinguere il lavoratore dal datore di lavoro.
  // Gli incarichi specifici (preposto, primo soccorso, antincendio, ecc.) vengono invece
  // ricavati dallo storico formativo quando si generano i documenti.
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

  function injectQuickAddField(){
    const modal = document.getElementById('qa-modal-corsista');
    if(!modal || document.getElementById('qa-cor-ruolo-aziendale')) return;
    const mansione = modal.querySelector('#qa-cor-mansione');
    if(!mansione) return;
    const host = mansione.closest('div');
    if(!host || !host.parentElement) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = `<label class="text-[10px] font-bold text-slate-500 uppercase block mb-1">Ruolo aziendale</label>
      <select id="qa-cor-ruolo-aziendale" class="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs font-bold text-slate-700">
        ${ROLES.map(([k,l])=>`<option value="${k}">${l}</option>`).join('')}
      </select>`;
    host.parentElement.insertBefore(wrap, host.nextSibling);
  }

  function currentRoleForSave(record={}){
    const quickModal = document.getElementById('qa-modal-corsista');
    const quickRole = document.getElementById('qa-cor-ruolo-aziendale');
    if(quickModal && quickRole && !quickModal.classList.contains('hidden')) {
      return normalizeRole(quickRole.value);
    }

    const mainForm = document.getElementById('form-corsista');
    const mainRole = document.getElementById('cor-ruolo-aziendale');
    const mainId = document.getElementById('cor-id')?.value || '';
    if(mainForm && mainRole) {
      if(!record.id || !mainId || String(record.id) === String(mainId)) return normalizeRole(mainRole.value);
    }

    if(record.ruolo_aziendale !== undefined) return normalizeRole(record.ruolo_aziendale);
    const existing = (window.corsistiList || []).find(x => String(x.id) === String(record.id || ''));
    return normalizeRole(existing?.ruolo_aziendale);
  }

  // Un solo wrapper stabile sul normale salvataggio corsista.
  // Non esiste alcun listener onchange che scriva nel DB e non viene più sostituita
  // temporaneamente saveCorsistaData durante il submit: questo evita conflitti con
  // workflow_guard.js, che usa la stessa funzione per azzerare “Modifiche non salvate”.
  function installSavePayloadWrapper(){
    if(window.__safetyRoleSaveInstalled) return true;
    const fn = window.saveCorsistaData;
    if(typeof fn !== 'function') return false;

    const wrapped = async function(record, ...args){
      const payload = { ...(record || {}) };
      payload.ruolo_aziendale = currentRoleForSave(payload);
      const result = await fn.call(this, payload, ...args);
      if(result) {
        if(window.SafetyCompanyDocs) window.SafetyCompanyDocs.directoryCache = null;
        if(window.safetyWorkState?.formId === 'form-corsista' && typeof window.markSafetyWorkSaved === 'function') {
          window.markSafetyWorkSaved('form-corsista');
        }
      }
      return result;
    };

    wrapped.__safetyRolePayloadWrapped = true;
    // Se workflow_guard aveva già avvolto la funzione, manteniamo il marcatore:
    // il suo comportamento resta comunque attivo perché viene richiamato dentro fn.
    if(fn.__safetyWorkSavedWrapped) wrapped.__safetyWorkSavedWrapped = true;
    window.saveCorsistaData = wrapped;
    window.__safetyRoleSaveInstalled = true;
    return true;
  }

  function wrapEdit(){
    const fn = window.modificaCorsista;
    if(typeof fn!=='function' || fn.__safetyRoleWrapped) return;
    const wrapped = function(id, ...args){
      const result = fn.call(this,id,...args);
      injectMainField();
      const c = (window.corsistiList||[]).find(x=>String(x.id)===String(id));
      const select = document.getElementById('cor-ruolo-aziendale');
      if(select) select.value = normalizeRole(c?.ruolo_aziendale);
      return result;
    };
    wrapped.__safetyRoleWrapped = true;
    window.modificaCorsista = wrapped;
  }

  function wrapReset(){
    const fn = window.resetFormCorsista;
    if(typeof fn!=='function' || fn.__safetyRoleWrapped) return;
    const wrapped = function(...args){
      const result = fn.apply(this,args);
      const select = document.getElementById('cor-ruolo-aziendale');
      if(select) select.value = 'lavoratore';
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

    if(id){
      const c = (window.corsistiList||[]).find(x=>String(x.id)===String(id));
      select.value = normalizeRole(c?.ruolo_aziendale);
    } else {
      select.value = 'lavoratore';
    }
    select.dataset.safetyRoleRecordKey = recordKey;
  }

  function decorateRows(){
    const tbody = document.getElementById('tabella-corsisti');
    if(!tbody) return;
    [...tbody.querySelectorAll('tr')].forEach(tr=>{
      if(tr.dataset.safetyRoleDecorated==='1') return;
      const edit = tr.querySelector('button[onclick*="modificaCorsista("]');
      if(!edit) return;
      const m = String(edit.getAttribute('onclick')||'').match(/modificaCorsista\('([^']+)'\)/);
      if(!m) return;
      const c = (window.corsistiList||[]).find(x=>String(x.id)===String(m[1]));
      if(!c) return;
      const cell = tr.children[2];
      if(cell){
        const badge = document.createElement('span');
        badge.className='inline-flex mt-1 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[8px] font-black uppercase text-slate-600';
        badge.textContent=window.getSafetyPersonRoleLabel(c.ruolo_aziendale);
        cell.appendChild(badge);
      }
      tr.dataset.safetyRoleDecorated='1';
    });
  }

  function apply(){
    injectMainField();
    injectQuickAddField();
    installSavePayloadWrapper();
    wrapEdit();
    wrapReset();
    syncQuickAddRole();
    decorateRows();
  }

  apply();
  setTimeout(apply,100);
  setTimeout(apply,500);
  const root=document.getElementById('app-content')||document.body;
  new MutationObserver(()=>{ clearTimeout(window.__safetyRoleApplyTimer); window.__safetyRoleApplyTimer=setTimeout(apply,40); }).observe(root,{childList:true,subtree:true});
})();
