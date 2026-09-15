// Ruolo aziendale corsista/persona per documenti e filtri SafetyManagerPro
(function(){
  if(window.__safetyCorsistiRuoloLoaded) return;
  window.__safetyCorsistiRuoloLoaded = true;

  const ROLES = [
    ['lavoratore','Lavoratore'],
    ['preposto','Preposto'],
    ['dirigente','Dirigente'],
    ['datore_lavoro','Datore di lavoro / legale rappresentante'],
    ['socio_lavoratore','Socio lavoratore'],
    ['lavoratore_autonomo','Lavoratore autonomo'],
    ['altro','Altro']
  ];
  window.SAFETY_PERSON_ROLES = ROLES;
  window.getSafetyPersonRoleLabel = value => (ROLES.find(([k])=>k===String(value||''))||['',String(value||'Lavoratore')])[1];

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
      <p class="text-[9px] text-slate-400 font-bold uppercase mt-1">Serve per proporre solo nomine, incarichi e dichiarazioni coerenti con la persona.</p>`;
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

  function wrapSave(){
    const fn = window.saveCorsistaData;
    if(typeof fn!=='function' || fn.__safetyRoleWrapped) return;
    const wrapped = async function(record, ...args){
      const payload = {...(record||{})};
      if(payload.ruolo_aziendale === undefined){
        const mainRole = document.getElementById('cor-ruolo-aziendale');
        const quickRole = document.getElementById('qa-cor-ruolo-aziendale');
        const mainCf = document.getElementById('cor-cf')?.value?.trim()?.toUpperCase() || '';
        const quickCf = document.getElementById('qa-cor-cf')?.value?.trim()?.toUpperCase() || '';
        const recCf = String(payload.cf||'').trim().toUpperCase();
        if(mainRole && mainCf && recCf===mainCf) payload.ruolo_aziendale = mainRole.value || 'lavoratore';
        else if(quickRole && quickCf && recCf===quickCf) payload.ruolo_aziendale = quickRole.value || 'lavoratore';
        else payload.ruolo_aziendale = 'lavoratore';
      }
      const result = await fn.call(this, payload, ...args);
      if(result && window.SafetyCompanyDocs) window.SafetyCompanyDocs.directoryCache = null;
      return result;
    };
    wrapped.__safetyRoleWrapped = true;
    window.saveCorsistaData = wrapped;
  }

  function wrapEdit(){
    const fn = window.modificaCorsista;
    if(typeof fn!=='function' || fn.__safetyRoleWrapped) return;
    const wrapped = function(id, ...args){
      const result = fn.call(this,id,...args);
      injectMainField();
      const c = (window.corsistiList||[]).find(x=>String(x.id)===String(id));
      const select = document.getElementById('cor-ruolo-aziendale');
      if(select) select.value = c?.ruolo_aziendale || 'lavoratore';
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
        badge.textContent=window.getSafetyPersonRoleLabel(c.ruolo_aziendale||'lavoratore');
        cell.appendChild(badge);
      }
      tr.dataset.safetyRoleDecorated='1';
    });
  }

  function apply(){
    injectMainField();
    injectQuickAddField();
    wrapSave();
    wrapEdit();
    wrapReset();
    decorateRows();
  }

  apply();
  setTimeout(apply,100);
  setTimeout(apply,500);
  const root=document.getElementById('app-content')||document.body;
  new MutationObserver(()=>{ clearTimeout(window.__safetyRoleApplyTimer); window.__safetyRoleApplyTimer=setTimeout(apply,40); }).observe(root,{childList:true,subtree:true});
})();
