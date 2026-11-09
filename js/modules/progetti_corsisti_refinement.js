// Raffinamento grafico Progetti + nomine collegate ai corsi completati in Corsisti
(function(){
  if (window.__safetyProjectCorsistiRefinementLoaded) return;
  window.__safetyProjectCorsistiRefinementLoaded = true;

  const APPOINTMENT_ROLES = new Set(['preposto','primo_soccorso','antincendio','attrezzatura','quota','confinati']);
  const ROLE_LABELS = {
    preposto: 'Preposto',
    primo_soccorso: 'Primo soccorso',
    antincendio: 'Antincendio',
    attrezzatura: 'Autorizzazione attrezzatura',
    quota: 'Lavori in quota / DPI III cat.',
    confinati: 'Ambienti confinati'
  };

  const esc = value => typeof window.dashEscape === 'function'
    ? window.dashEscape(value)
    : String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function statoCorsoMeta(p, issues = []) {
    if (p?.stato_corso === 'chiuso') return { label:'Chiuso', cls:'bg-slate-100 text-slate-700 border-slate-300', icon:'archive' };
    if (p?.stato_corso === 'svolto') return { label:'Svolto · da chiudere', cls:'bg-amber-50 text-amber-800 border-amber-200', icon:'clock-3' };
    if (issues?.length) return { label:`${issues.length} verifiche`, cls:'bg-red-50 text-red-700 border-red-200', icon:'circle-alert' };
    return { label:'In lavorazione', cls:'bg-emerald-50 text-emerald-700 border-emerald-200', icon:'circle-check' };
  }

  function projectBadges(p, issues = [], iscritti = []) {
    const badges = [];
    const stato = statoCorsoMeta(p, issues);
    badges.push(`<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full border ${stato.cls} text-[8px] font-black uppercase"><i data-lucide="${stato.icon}" class="w-3 h-3"></i>${esc(stato.label)}</span>`);
    badges.push(p?.ente_erogatore === 'azienda'
      ? '<span class="inline-flex px-2 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-800 text-[8px] font-black uppercase">DL soggetto formatore</span>'
      : '<span class="inline-flex px-2 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 text-[8px] font-black uppercase">Associazione / ente</span>');

    const fab = typeof window.getFabbisogniStatus === 'function' ? window.getFabbisogniStatus(p) : null;
    if (fab?.ready) badges.push('<span class="inline-flex px-2 py-1 rounded-full border border-cyan-200 bg-cyan-50 text-cyan-800 text-[8px] font-black uppercase">Fabbisogni OK</span>');

    const anomalie=(iscritti||[]).filter(i=>i.partecipazione_stato&&i.partecipazione_stato!=='iscritto').length;
    if(anomalie)badges.push(`<span class="rounded-lg bg-rose-700 text-white px-2 py-1 text-[9px] font-black">${anomalie} iscrizioni segnalate</span>`);
    return badges.join('');
  }

  function renderProjectParticipantsSummary(p, iscritti, _showAll, view) {
    const flagged=iscritti.filter(i=>i.partecipazione_stato&&i.partecipazione_stato!=='iscritto').length;
    const opened=window.safetyProjectCorsistiOpen?.[p.id]!==false;
    return `<details data-project-corsisti="${esc(p.id)}" ${opened?'open':''} ontoggle="window.safetyRememberCorsistiOpen('${p.id}',this.open)"
      class="rounded-xl border ${flagged?'border-rose-500 bg-rose-50':'border-slate-200 bg-white'} overflow-hidden">
      <summary class="cursor-pointer p-3 font-black text-xs text-slate-900 min-h-[48px]">
        ▾ Corsisti · ${iscritti.length} ${flagged?' · ⚠ '+flagged+' segnalati':''}
        <span class="float-right font-bold text-blue-800">Apri / chiudi</span>
      </summary>
      <div class="border-t p-3 space-y-3 max-h-[330px] overflow-y-auto">
        ${window.renderInlineIscrittiControls?.(p,view)||''}
        ${window.renderInlineIscrittiCards?.(p.id,iscritti,true)||''}
      </div>
    </details>`;
  }
  window.safetyProjectCorsistiOpen=window.safetyProjectCorsistiOpen||{};
  window.safetyRememberCorsistiOpen=(id,open)=>{window.safetyProjectCorsistiOpen[id]=!!open;};

  function installProjectRenderers() {
    if (typeof window.renderProjectDesktopRows !== 'function' || window.renderProjectDesktopRows.__safetyLightUi) return;

    window.renderInlineIscrittiControls = function(p, view = 'desk') {
      const projectId = p.id;
      return `<div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 mb-3">
        <div>
          <p class="font-black uppercase text-slate-800 text-xs flex items-center gap-2"><i data-lucide="users-round" class="w-4 h-4 text-blue-600"></i> Gestione corsisti del progetto</p>
          <p class="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">${(window.progettiIscrizioniMap?.[projectId] || []).length} partecipanti collegati</p>
        </div>
        <div class="flex flex-col md:flex-row gap-2 md:items-center">
          <select id="inline-sel-iscrivi-${projectId}-${view}" data-inline-select="${projectId}" class="min-w-0 md:min-w-[280px] px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500 font-bold text-slate-700">
            ${typeof window.getCorsistaOptionsForProject === 'function' ? window.getCorsistaOptionsForProject(projectId) : ''}
          </select>
          <div class="flex gap-2">
            <button onclick="window.aggiungiIscrizioneInline('${projectId}', '${view}')" class="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white font-black px-3 py-2 rounded-lg text-[9px] uppercase transition flex items-center justify-center gap-1">
              <i data-lucide="user-plus" class="w-3.5 h-3.5"></i> Aggiungi
            </button>
            <button type="button" onclick="window.apriQACorsistaInline('${projectId}')" class="flex-1 md:flex-none bg-slate-800 hover:bg-slate-700 text-white font-black px-3 py-2 rounded-lg text-[9px] uppercase transition flex items-center justify-center gap-1">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i> Nuovo
            </button>
          </div>
        </div>
      </div>`;
    };

    window.renderInlineIscrittiCards = function(projectId, iscritti, showAll = true) {
      if(!iscritti?.length)return '<p class="text-xs text-slate-500 p-3">Nessun corsista iscritto.</p>';
      if(!showAll)return '';
      return `<div class="space-y-2">${iscritti.map(isc=>{
        const c=isc.corsisti||{},state=isc.partecipazione_stato||'iscritto',flag=state!=='iscritto';
        const label=state==='non_partecipante'?'NON PARTECIPANTE':'ISCRIZIONE ERRONEA';
        return `<div class="rounded-xl border p-3 ${flag?'bg-rose-100 border-rose-500':'bg-slate-50 border-slate-200'}" data-iscrizione-stato="${esc(state)}">
          <div class="flex flex-wrap justify-between gap-2">
            <div><p class="font-black text-xs ${flag?'text-rose-900':'text-slate-900'}">${esc(c.nome_cognome||isc.nome_cognome_storico||'-')}</p>
              <p class="text-[10px] text-slate-500 font-mono">${esc(c.cf||isc.cf_storico||'')}</p>
              ${flag?`<span class="inline-block mt-1 rounded bg-rose-700 text-white text-[9px] font-black px-2 py-1">${label}</span>`:''}
            </div>
            <div class="flex flex-wrap gap-1 items-start">
              <button type="button" onclick="window.apriGestioneIscrizione('${isc.id}')" class="rounded-lg min-h-[40px] bg-indigo-100 text-indigo-900 px-2 py-2 font-black text-[10px]">Verifica / trasferisci</button>
              <button type="button" onclick="window.apriSegnalazioneIscrizione('${isc.id}')" class="rounded-lg min-h-[40px] bg-rose-700 text-white px-2 py-2 font-black text-[10px]">Segnala stato</button>
              ${flag?'':`<button type="button" onclick="window.stampaAttestatoCorsista('${projectId}','${c.id||isc.corsista_id}')" class="rounded-lg min-h-[40px] bg-emerald-100 text-emerald-900 px-2 py-2 text-[10px] font-bold">Attestato</button>`}
            </div>
          </div>
          <p class="text-[10px] mt-1 text-slate-600">Mansione: ${esc(isc.mansione_storica||c.mansione_storica||'-')} · Riferimento: ${esc(isc.id_certificato||'-')}</p>
          ${flag&&isc.partecipazione_motivo?`<p class="text-[10px] font-bold text-rose-800 mt-1">Motivo: ${esc(isc.partecipazione_motivo)}</p>`:''}
        </div>`;
      }).join('')}</div>`;
    };

    const desktop = function(p, iscritti, issues) {
      const showAll = !!window.inlineIscrittiExpanded?.[p.id];
      const nomeAzienda = p.aziende?.ragione_sociale || 'Privato';
      const corso = window.DB_CORSI?.[p.corso_id] || {};
      const nomeCorso = corso.t || p.corso_id || 'Corso non indicato';
      const sigla = corso.code || p.corso_id || 'CRS';
      const quality = typeof window.renderProjectQualityDashboard === 'function'
        ? window.renderProjectQualityDashboard(p, iscritti, 'compact')
        : '';

      return `<tr class="bg-slate-900 hover:bg-slate-800 transition-colors" data-corso="${esc(p.corso_id || '')}" data-azienda="${esc(p.azienda_id || '')}" data-project-id="${p.id}" data-project-separator="${p.id}">
        <td class="p-3 border-b border-slate-200 align-top">
          <button type="button" onclick="window.apriPopupProgettoById('${p.id}', 'progetti')" class="inline-flex rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 px-2 py-1 font-mono font-black text-[10px] text-rose-700">${esc(p.codice || 'Senza codice')}</button>
          <div class="mt-2 flex flex-wrap gap-1">${projectBadges(p, issues, iscritti)}</div>
        </td>
        <td class="p-3 border-b border-slate-200 align-top">
          <div class="flex items-start gap-3">
            <div class="shrink-0 w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center"><i data-lucide="graduation-cap" class="w-4 h-4"></i></div>
            <div class="min-w-0">
              <p class="font-black text-white text-lg leading-snug"><span class="font-mono text-amber-300">[${esc(sigla)}]</span> ${esc(nomeCorso)}</p>
              <p class="mt-2 text-base font-bold text-slate-100 flex items-center gap-1"><i data-lucide="building-2" class="w-3 h-3"></i>${esc(nomeAzienda)}</p>
              <p class="mt-2 text-xs text-slate-200 uppercase font-bold">${iscritti.length} corsisti iscritti</p>
            </div>
          </div>
        </td>
        <td class="p-3 border-b border-slate-200 align-top text-center">
          <span class="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-800 px-3 py-2 font-mono text-base font-bold text-white"><i data-lucide="calendar-days" class="w-3 h-3"></i>${esc(window.formatDataToItalian ? window.formatDataToItalian(p.data_esame) : (p.data_esame || '-'))}</span>
        </td>
        <td class="p-3 border-b border-slate-200 align-top text-center whitespace-nowrap">
          <button onclick="window.apriPopupProgettoById('${p.id}', 'progetti')" class="text-blue-700 hover:bg-blue-200 bg-blue-100 p-2 rounded-lg transition" title="Modifica progetto"><i data-lucide="edit" class="w-3.5 h-3.5"></i></button>
          <button onclick="window.stampaAttestatiProgetto('${p.id}')" class="text-emerald-800 hover:bg-emerald-200 bg-emerald-100 p-2 rounded-lg transition ml-1" title="Stampa attestati"><i data-lucide="award" class="w-3.5 h-3.5"></i></button>
          <button onclick="window.stampaFascicoloCompletoDaProgetti('${p.id}')" class="text-indigo-800 hover:bg-indigo-200 bg-indigo-100 p-2 rounded-lg transition ml-1" title="Stampa fascicolo completo"><i data-lucide="file-archive" class="w-3.5 h-3.5"></i></button>
          <button onclick="window.eliminaProgetto('${p.id}')" class="text-red-700 hover:bg-red-200 bg-red-100 p-2 rounded-lg transition ml-1" title="Elimina progetto"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
        </td>
      </tr>
      <tr class="bg-slate-50" data-corso="${esc(p.corso_id || '')}" data-azienda="${esc(p.azienda_id || '')}" data-project-id="${p.id}" data-inline-iscritti-project="${p.id}">
        <td colspan="4" class="px-3 py-3 border-b border-slate-200">
          <div class="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.72fr)] gap-3 items-start">
            <div>${quality}</div>
            <div>${renderProjectParticipantsSummary(p, iscritti, showAll, 'desk')}</div>
          </div>
        </td>
      </tr>`;
    };
    desktop.__safetyLightUi = true;
    window.renderProjectDesktopRows = desktop;

    window.renderProjectMobileCard = function(p, iscritti, issues) {
      const showAll = !!window.inlineIscrittiExpanded?.[p.id];
      const azienda = p.aziende?.ragione_sociale || 'Privato';
      const corso = window.DB_CORSI?.[p.corso_id] || {};
      const nomeCorso = corso.t || p.corso_id || 'Corso non indicato';
      const sigla = corso.code || p.corso_id || 'CRS';
      const quality = typeof window.renderProjectQualityDashboard === 'function'
        ? window.renderProjectQualityDashboard(p, iscritti, 'compact')
        : '';
      return `<article class="rounded-2xl border border-slate-200 bg-slate-900 shadow-sm overflow-hidden" data-corso="${esc(p.corso_id || '')}" data-azienda="${esc(p.azienda_id || '')}" data-mobile-project-id="${p.id}" data-project-id="${p.id}">
        <div class="p-4 border-b border-slate-200">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <button onclick="window.apriPopupProgettoById('${p.id}', 'progetti')" class="font-mono text-rose-700 font-black text-xs hover:underline">${esc(p.codice || 'Senza codice')}</button>
              <h3 class="mt-2 font-black text-white text-lg leading-snug"><span class="text-amber-300 font-mono text-sm">[${esc(sigla)}]</span> ${esc(nomeCorso)}</h3>
              <p class="mt-2 text-base font-bold text-slate-100">${esc(azienda)}</p>
            </div>
            <div class="flex gap-1 shrink-0">
              <button onclick="window.apriPopupProgettoById('${p.id}', 'progetti')" class="text-blue-700 bg-blue-100 p-2 rounded-lg"><i data-lucide="edit" class="w-4 h-4"></i></button>
              <button onclick="window.stampaAttestatiProgetto('${p.id}')" class="text-emerald-800 bg-emerald-100 p-2 rounded-lg"><i data-lucide="award" class="w-4 h-4"></i></button>
              <button onclick="window.stampaFascicoloCompletoDaProgetti('${p.id}')" class="text-indigo-800 bg-indigo-100 p-2 rounded-lg"><i data-lucide="file-archive" class="w-4 h-4"></i></button>
            </div>
          </div>
          <div class="mt-3 flex flex-wrap gap-1">${projectBadges(p, issues, iscritti)}</div>
          <p class="mt-3 text-base font-black uppercase text-white">Data corso / esame · ${esc(window.formatDataToItalian ? window.formatDataToItalian(p.data_esame) : (p.data_esame || '-'))}</p>
        </div>
        <div class="p-3 space-y-3 bg-slate-50">
          ${quality}
          ${renderProjectParticipantsSummary(p, iscritti, showAll, 'mob')}
        </div>
      </article>`;
    };

    const previousLoad = window.loadProgettiTable;
    if (typeof previousLoad === 'function' && !previousLoad.__safetyLightUiWrapped) {
      const wrapped = async function(...args) {
        const result = await previousLoad.apply(this, args);
        applyProjectShell();
        return result;
      };
      wrapped.__safetyLightUiWrapped = true;
      window.loadProgettiTable = wrapped;
    }
  }

  function applyProjectShell() {
    const tbody = document.getElementById('tabella-progetti');
    if (tbody) {
      const outer = tbody.closest('.bg-slate-900.rounded-xl, .rounded-xl');
      if (outer) {
        outer.classList.remove('bg-slate-900','border-slate-700');
        outer.classList.add('bg-white','border-slate-200');
      }
      const head = tbody.closest('table')?.querySelector('thead');
      if (head) {
        head.classList.remove('bg-slate-950');
        head.classList.add('bg-slate-800');
      }
    }
    const mobile = document.getElementById('progetti-mobile-cards');
    if (mobile) {
      mobile.classList.remove('bg-slate-950','space-y-4');
      mobile.classList.add('bg-transparent','space-y-3');
    }
  }

  async function ensureCompanyDocEngine(needHistory = true) {
    const loader = window.loadOptionalSafetyScript;
    if (typeof loader !== 'function') throw new Error('Loader moduli non disponibile.');
    const scripts = [
      'js/modules/documenti_azienda_lavoratore_core.js',
      'js/modules/documenti_azienda_lavoratore_ui.js',
      'js/modules/documenti_azienda_lavoratore_print.js',
      'js/modules/documenti_azienda_lavoratore_directory.js',
      'js/modules/documenti_azienda_lavoratore_catalogo.js'
    ];
    for (const src of scripts) await loader(src);
    const D = window.SafetyCompanyDocs;
    if (!D?.loadDirectory || !D?.appointmentPage || !window.stampaModelloVuotoSafetyDoc) throw new Error('Motore documenti azienda/lavoratore non disponibile.');
    // La stampa libera non deve dipendere da caricamento corsi, presenze o progetti.
    if (needHistory) await D.loadDirectory(false);
    return D;
  }

  window.apriStampeLibereCorsista = async function(corsistaId) {
    const row=(window.corsistiList||[]).find(c=>String(c.id)===String(corsistaId));
    if(!row) return alert('Corsista non trovato. Aggiorna la tabella e riprova.');
    document.getElementById('safety-corsista-free-print-modal')?.remove();
    const overlay=document.createElement('div');
    overlay.id='safety-corsista-free-print-modal';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label','Stampa libera documenti corsista');
    overlay.className='fixed inset-0 z-[120000] bg-slate-950/70 p-4 flex items-center justify-center';
    const options=[
      ['attestato','Attestato — facsimile non certificante'],
      ['preposto','Nomina / individuazione preposto'],
      ['primo_soccorso','Designazione primo soccorso'],
      ['antincendio','Designazione antincendio / evacuazione'],
      ['attrezzatura','Autorizzazione uso attrezzature'],
      ['quota','Incarico lavori in quota / DPI III categoria'],
      ['confinati','Incarico ambienti confinati'],
      ['incarico_generico','Lettera di incarico generica'],
      ['verbale_consegna_dpi','Verbale consegna DPI'],
      ['registro_consegna_dpi','Registro consegna DPI'],
      ['dichiarazione_dl_diretta','Dichiarazione datore di lavoro']
    ];
    const courses=(row.iscrizioni||[]).filter(isc=>isc.progetti?.id).map(isc=>{
      const id=String(isc.progetti.id);
      const corso=window.DB_CORSI?.[isc.progetti.corso_id];
      const flagged=window.SafetyEnrollmentStatus?.flagged(isc)||false;
      return {id,flagged,label:[corso?.t||isc.progetti.corso_id||'Corso',isc.progetti.codice||''].filter(Boolean).join(' · ')+(flagged?' ⚠ '+window.SafetyEnrollmentStatus.label(isc):'')};
    });
    const courseOptions=[...new Map(courses.map(c=>[c.id,c])).values()];
    overlay.innerHTML=`<div class="w-full max-w-xl rounded-2xl shadow-2xl bg-white border border-slate-200 p-5 space-y-4">
      <div class="flex justify-between items-start gap-3"><div><h2 class="font-black text-lg text-slate-900">Stampa libera corsista</h2>
        <p class="font-bold text-sm text-slate-600 mt-1">${esc(row.nome_cognome||'Corsista')} · ${esc(row.cf||'')}</p></div>
        <button type="button" data-corsista-print-close class="font-black text-xl text-slate-500 px-2" aria-label="Chiudi">×</button></div>
      <p class="text-xs text-slate-600">Stampa disponibile indipendentemente da frequenza, esito, attestato o iscrizione. I documenti non ancora formalizzati sono facsimili da verificare e firmare.</p>
      <label class="block text-xs font-bold text-slate-700">Modello da stampare
        <select data-corsista-print-type class="mt-1 w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-3 py-2">${options.map(([value,label])=>`<option value="${esc(value)}">${esc(label)}</option>`).join('')}</select>
      </label>
      <label class="block rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs font-bold text-slate-900"><span class="flex gap-3 items-center"><input type="checkbox" data-safety-autoarchive-checkbox class="h-4 w-4 shrink-0 accent-indigo-700" ${window.SafetyCorsistiAutoArchive?.enabled()?'checked':''}> Archivia automaticamente una copia PDF quando stampo</span><span class="block mt-1 pl-7 text-[11px] font-normal text-slate-700">Facoltativo e disattivabile. Mantiene le versioni precedenti, senza bloccare la stampa. Il PDF archiviato è inizialmente una bozza.</span></label>
      <button type="button" data-corsista-print-go class="w-full rounded-lg bg-indigo-700 text-white px-4 py-3 font-black text-xs uppercase">Stampa facsimile precompilato</button>
      <button type="button" data-corsista-open-fascicolo class="w-full rounded-lg border border-violet-300 bg-violet-50 text-violet-900 px-4 py-2 font-black text-xs">Apri fascicolo PDF e archivio storico</button>
      ${courseOptions.length?`<div class="border-t border-slate-200 pt-3 space-y-2"><label class="block text-xs font-bold text-slate-700">Attestato del corso associato
        <select data-corsista-print-course class="mt-1 w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-3 py-2">${courseOptions.map(c=>`<option value="${esc(c.id)}" ${c.flagged?'disabled':''}>${esc(c.label)}</option>`).join('')}</select></label>
        <button type="button" data-corsista-print-course-go ${courseOptions.every(c=>c.flagged)?'disabled':''} class="w-full rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-900 px-4 py-2 font-black text-xs disabled:opacity-40">Stampa attestato del corso selezionato</button>
        ${courseOptions.some(c=>c.flagged)?'<p class="text-rose-900 font-black text-xs">⚠ I corsi segnalati sono disabilitati per i nuovi attestati.</p>':''}</div>`:''}
      <p class="text-[11px] text-slate-500">La stampa non emette automaticamente un attestato ufficiale e non conferisce nomine o abilitazioni.</p>
    </div>`;
    const close=()=>{if(overlay.isConnected)overlay.remove();};
    overlay.querySelector('[data-safety-autoarchive-checkbox]').onchange=e=>{
      window.SafetyCorsistiAutoArchive?.setEnabled?.(e.target.checked);
    };
    overlay.querySelector('[data-corsista-open-fascicolo]').onclick=()=>{
      close();
      if(typeof window.apriFascicoloCorsista==='function') window.apriFascicoloCorsista(corsistaId);
      else alert('Fascicolo corsista non ancora caricato: riapri la sezione Corsisti.');
    };
    overlay.querySelector('[data-corsista-print-close]').onclick=close;
    overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
    overlay.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
    overlay.querySelector('[data-corsista-print-go]').onclick=async e=>{
      const btn=e.currentTarget;
      btn.disabled=true;
      try{
        await ensureCompanyDocEngine(false);
        const type=overlay.querySelector('[data-corsista-print-type]')?.value||'incarico_generico';
        close();
        await window.stampaModelloVuotoSafetyDoc(type,corsistaId);
      }catch(err){alert('Stampa documento non disponibile: '+(err?.message||err));btn.disabled=false;}
    };
    const courseButton=overlay.querySelector('[data-corsista-print-course-go]');
    if(courseButton)courseButton.onclick=async e=>{
      const courseId=overlay.querySelector('[data-corsista-print-course]')?.value;
      const chosen=courseOptions.find(c=>c.id===courseId);
      if(!courseId||!chosen||chosen.flagged)return alert('Attestato inibito: iscrizione non partecipante o erronea.');
      close();
      await window.stampaAttestatoCorsista(courseId,corsistaId);
    };
    document.body.appendChild(overlay);
    overlay.querySelector('[data-corsista-print-type]')?.focus();
  };

  function historyFor(D, projectId, corsistaId) {
    const histories = D.directoryCache?.histories?.get(String(corsistaId)) || [];
    return histories.find(h => String(h.project?.id || '') === String(projectId || '')) || null;
  }

  // Per le stampe collegate a un attestato non usare l'azienda o i dati correnti:
  // un corso del 2024 deve riportare l'identità e l'azienda salvate nell'iscrizione storica.
  const historicPrintData = (D, history, person) => {
    const snapshot = history.enrollment || {};
    const company = D.companyFrom(history.project);
    company.nome = snapshot.azienda_storica_nome || company.nome;
    company.piva = snapshot.azienda_storica_piva_cf || company.piva;
    return {
      company,
      person: {
        ...person,
        nome: snapshot.nome_cognome_storico || person.nome,
        cf: snapshot.cf_storico || person.cf,
        mansione: snapshot.mansione_storica || person.mansione,
        company
      }
    };
  };
  const printTemplateNotice = (printArea, label) => {
    const banner = document.createElement('div');
    banner.className = 'safety-company-document-draft-banner';
    banner.style.cssText = 'padding:5px 12px;border:2px solid #991b1b;color:#991b1b;text-align:center;font:bold 11px Arial,sans-serif;margin-bottom:8px;';
    banner.textContent = 'FACSIMILE DA COMPILARE E SOTTOSCRIVERE — NON È UN INCARICO/VERBALE GIÀ EMESSO · ' + label;
    printArea.querySelector('.safety-company-doc-page')?.prepend(banner);
  };
  const printPreparedCompanyDoc = (printArea, context={}) => {
    printArea.querySelectorAll('.safety-company-doc-page').forEach(page => {
      page.classList.add('print-show','temp-page');
      page.style.transform='none';page.style.margin='0';
    });
    document.body.classList.add('is-printing-temp');
    setTimeout(async () => {
      try {
        if (typeof window.waitForPrintImages === 'function') await window.waitForPrintImages(printArea);
        window.SafetyCorsistiAutoArchive?.capture?.(printArea,context);
        window.print();
      } finally {
        document.body.classList.remove('is-printing-temp');
        printArea.innerHTML = '';
      }
    },700);
  };

  window.stampaNominaCorsistaDaCorso = async function(projectId, corsistaId) {
    if (!projectId || !corsistaId) return alert('Progetto o corsista non selezionato.');
    const printArea = document.getElementById('print-area-temp');
    if (!printArea) return alert('Area di stampa non disponibile.');

    try {
      const D = await ensureCompanyDocEngine();
      const history = historyFor(D, projectId, corsistaId);
      const person = (D.directoryCache?.people || []).find(p => String(p.id) === String(corsistaId));
      if (!history || !person) return alert('Formazione o corsista non disponibili nello storico.');
      // Modello liberamente stampabile anche in fase di preparazione del corso.
      // L'eventuale nomina resta una bozza da verificare e sottoscrivere.
      const historical = historicPrintData(D, history, person);
      if (!historical.company?.nome) historical.company.nome='________________ (azienda da inserire)';

      const courseRef = `${history.course?.titolo || history.project?.corso_id || 'Corso'}${history.project?.codice ? ' · ' + history.project.codice : ''}${history.project?.data_esame ? ' · ' + (window.formatDataToItalian ? window.formatDataToItalian(history.project.data_esame) : history.project.data_esame) : ''}`;
      const ctx = {
        company: historical.company,
        course: history.course,
        datore: historical.company.datore || '',
        date: history.project?.data_esame || D.today(),
        place: historical.company.sede || historical.company.indirizzo || '',
        courseRef,
        effective: history.project?.data_esame || D.today(),
        duration: 'Fino a revoca, modifica organizzativa o perdita dei requisiti',
        specific: ''
      };

      D.injectStyle?.();
      printArea.innerHTML = D.appointmentPage(ctx, historical.person, history.role);
      printTemplateNotice(printArea, ROLE_LABELS[history.role] || 'Nomina/incarico');
      printPreparedCompanyDoc(printArea,{
        corsistaId,projectId,
        type:history.role==='preposto'?'preposto':history.role,
        title:(ROLE_LABELS[history.role]||'Incarico')+' · '+(history.course?.titolo||history.project?.corso_id||'Corso')
      });
    } catch (error) {
      console.error('Stampa nomina corsista:', error);
      document.body.classList.remove('is-printing-temp');
      printArea.innerHTML = '';
      alert('Errore nella preparazione della nomina: ' + (error?.message || error));
    }
  };

  window.stampaModelloConsegnaDpiDaCorso = async function(projectId,corsistaId) {
    const area=document.getElementById('print-area-temp');
    if(!area)return alert('Area stampa non disponibile.');
    try {
      const D=await ensureCompanyDocEngine();
      const history=historyFor(D,projectId,corsistaId);
      const person=(D.directoryCache?.people||[]).find(p=>String(p.id)===String(corsistaId));
      if(!history||!person) return alert('Iscrizione o corsista non disponibili.');
      const historical=historicPrintData(D,history,person);
      if(!historical.company.nome)historical.company.nome='________________ (azienda da inserire)';
      const ctx={company:historical.company,datore:historical.company.datore||'',date:history.project?.data_esame||D.today(),
        place:history.project?.sede||historical.company.sede||'',note:'',info:false,training:false};
      D.injectStyle?.();
      area.innerHTML=D.dpiPage(ctx,historical.person,[]);
      printTemplateNotice(area,'Verbale consegna DPI');
      printPreparedCompanyDoc(area,{
        corsistaId,projectId,type:'verbale_consegna_dpi',
        title:'Verbale consegna DPI · '+(history.course?.titolo||history.project?.corso_id||'Corso')
      });
    }catch(e){
      document.body.classList.remove('is-printing-temp');area.innerHTML='';
      alert('Modello consegna DPI non disponibile: '+(e.message||e));
    }
  };

  function decorateCorsistiNomine() {
    const tbody=document.getElementById('tabella-corsisti');
    if(!tbody)return;
    let newButtons = false;
    // Non leggere tutto lo storico aziendale/corsi per montare 20 righe.
    // La funzione di stampa recupera i dati approfonditi SOLO dopo il click.
    tbody.querySelectorAll('button[onclick*="stampaAttestatoCorsista"]').forEach(btn=>{
      const host=btn.parentElement;
      if(!host||host.querySelector('[data-safety-nomina-course]'))return;
      const match=String(btn.getAttribute('onclick')||'')
        .match(/stampaAttestatoCorsista\('([^']+)'\s*,\s*'([^']+)'\)/);
      if(!match)return;
      const [,projectId,corsistaId]=match;
      const person=(window.corsistiList||[]).find(c=>String(c.id)===String(corsistaId));
      const courseId=(person?.iscrizioni||[]).find(isc=>String(isc.progetto_id||isc.progetti?.id)===String(projectId))?.progetti?.corso_id||'';
      const normalized=String(courseId).toLowerCase();
      const nomination=document.createElement('button');
      nomination.type='button';
      nomination.dataset.safetyNominaCourse='1';
      nomination.className='shrink-0 bg-violet-700 hover:bg-violet-600 text-white rounded px-2 py-1 text-[8px] font-black uppercase';
      nomination.title='Facsimile di nomina/incarico stampabile senza vincoli sul corso';
      nomination.textContent=normalized.startsWith('attr_')||normalized.startsWith('agg_attr_')
        ? 'Autorizzazione':normalized.includes('quota')||normalized.includes('confinat')?'Incarico':'Nomina/incarico';
      nomination.onclick=()=>window.stampaNominaCorsistaDaCorso(projectId,corsistaId);
      host.appendChild(nomination);
      newButtons = true;
      if(/(?:^|_)dpi(?:_|$)|quota/.test(normalized)){
        const dpi=document.createElement('button');
        dpi.type='button';
        dpi.dataset.safetyNominaCourse='dpi';
        dpi.className='shrink-0 bg-slate-700 hover:bg-slate-600 text-white rounded px-2 py-1 text-[8px] font-black uppercase';
        dpi.title='Facsimile consegna DPI da compilare e sottoscrivere';
        dpi.textContent='Modello DPI';
        dpi.onclick=()=>window.stampaModelloConsegnaDpiDaCorso(projectId,corsistaId);
        host.appendChild(dpi);
      }
    });
    if(newButtons && typeof lucide!=='undefined')lucide.createIcons();
  }

  function installCorsistiWrapper() {
    const current = window.loadCorsistiTable;
    if (typeof current !== 'function' || current.__safetyNomineWrapped) return;
    const wrapped = async function(...args) {
      const result = await current.apply(this, args);
      await decorateCorsistiNomine();
      return result;
    };
    wrapped.__safetyNomineWrapped = true;
    window.loadCorsistiTable = wrapped;
  }

  function apply() {
    installProjectRenderers();
    installCorsistiWrapper();
    applyProjectShell();
    if (document.getElementById('tabella-corsisti')) decorateCorsistiNomine();
  }

  apply();
  setTimeout(apply, 100);
  setTimeout(apply, 500);
  const root = document.getElementById('app-content') || document.body;
  // I comandi Corsisti sono aggiunti dal wrapper dopo il caricamento della pagina.
  // Riascoltare tutte le mutazioni interne (badge, icone, mobile cards) causava
  // ricostruzioni ripetute e possibile blocco del browser.
  new MutationObserver(() => {
    clearTimeout(window.__safetyProjectCorsistiRefinementTimer);
    window.__safetyProjectCorsistiRefinementTimer = setTimeout(apply, 80);
  }).observe(root, { childList:true });
})();
