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

  function projectBadges(p, issues = []) {
    const badges = [];
    const stato = statoCorsoMeta(p, issues);
    badges.push(`<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full border ${stato.cls} text-[8px] font-black uppercase"><i data-lucide="${stato.icon}" class="w-3 h-3"></i>${esc(stato.label)}</span>`);
    badges.push(p?.ente_erogatore === 'azienda'
      ? '<span class="inline-flex px-2 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-800 text-[8px] font-black uppercase">DL soggetto formatore</span>'
      : '<span class="inline-flex px-2 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 text-[8px] font-black uppercase">Associazione / ente</span>');

    const fab = typeof window.getFabbisogniStatus === 'function' ? window.getFabbisogniStatus(p) : null;
    if (fab?.ready) badges.push('<span class="inline-flex px-2 py-1 rounded-full border border-cyan-200 bg-cyan-50 text-cyan-800 text-[8px] font-black uppercase">Fabbisogni OK</span>');

    return badges.join('');
  }

  function renderProjectParticipantsSummary(p, iscritti, showAll, view) {
    const pid = p.id;
    if (!showAll) {
      return `<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3">
        <div class="min-w-0">
          <p class="text-[9px] font-black uppercase tracking-widest text-slate-500">Partecipanti</p>
          <p class="text-xs font-black text-slate-800 mt-0.5">${iscritti.length} corsisti iscritti a ${esc(p.codice || 'questo progetto')}</p>
        </div>
        <button type="button" onclick="window.toggleInlineIscritti('${pid}')" class="shrink-0 inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-2 text-[9px] font-black uppercase text-blue-800">
          <i data-lucide="users" class="w-3.5 h-3.5"></i> Mostra corsisti
        </button>
      </div>`;
    }

    return `<div class="rounded-xl border border-slate-200 bg-white p-3">
      ${window.renderInlineIscrittiControls ? window.renderInlineIscrittiControls(p, view) : ''}
      ${window.renderInlineIscrittiCards ? window.renderInlineIscrittiCards(pid, iscritti, true) : ''}
      <button type="button" onclick="window.toggleInlineIscritti('${pid}')" class="mt-3 inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-3 py-2 text-[9px] font-black uppercase text-slate-700">
        <i data-lucide="chevron-up" class="w-3.5 h-3.5"></i> Chiudi corsisti
      </button>
    </div>`;
  }

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

    window.renderInlineIscrittiCards = function(projectId, iscritti, showAll = false) {
      if (!iscritti?.length) {
        return '<div class="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[10px] font-bold text-slate-500">Nessun corsista iscritto a questo progetto.</div>';
      }
      if (!showAll) return '';
      return `<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
        ${iscritti.map(isc => {
          const c = isc.corsisti || {};
          const missing = !isc.id_certificato || !isc.esito;
          return `<div class="rounded-xl border ${missing ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'} p-3">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="font-black uppercase text-slate-900 text-[10px] leading-tight">${esc(c.nome_cognome || '-')}</p>
                <p class="font-mono text-[9px] text-slate-500 mt-0.5">${esc(c.cf || '-')}</p>
              </div>
              <div class="flex gap-1 shrink-0">
                <button onclick="window.stampaAttestatoCorsista('${projectId}', '${c.id || isc.corsista_id}')" class="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800" title="Stampa attestato"><i data-lucide="award" class="w-3 h-3"></i></button>
                <button onclick="window.modificaCorsistaDaProgetto('${c.id || isc.corsista_id}','${projectId}')" class="p-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800" title="Modifica corsista"><i data-lucide="edit-3" class="w-3 h-3"></i></button>
                <button onclick="window.rimuoviIscrizione('${isc.id}', '${projectId}')" class="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700" title="Rimuovi dal corso"><i data-lucide="user-minus" class="w-3 h-3"></i></button>
              </div>
            </div>
            <div class="mt-2 text-[9px] text-slate-600 space-y-0.5">
              <p><span class="font-black uppercase text-slate-400">Mansione:</span> ${esc(isc.mansione_storica || c.mansione_storica || '-')}</p>
              <p><span class="font-black uppercase text-slate-400">Certificato:</span> <span class="font-mono">${esc(isc.id_certificato || 'da completare')}</span></p>
              <p><span class="font-black uppercase text-slate-400">Esito:</span> ${esc(isc.esito || 'da completare')}</p>
            </div>
          </div>`;
        }).join('')}
      </div>`;
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

      return `<tr class="bg-white hover:bg-slate-50 transition-colors" data-corso="${esc(p.corso_id || '')}" data-azienda="${esc(p.azienda_id || '')}" data-project-id="${p.id}" data-project-separator="${p.id}">
        <td class="p-3 border-b border-slate-200 align-top">
          <button type="button" onclick="window.apriPopupProgettoById('${p.id}', 'progetti')" class="inline-flex rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 px-2 py-1 font-mono font-black text-[10px] text-rose-700">${esc(p.codice || 'Senza codice')}</button>
          <div class="mt-2 flex flex-wrap gap-1">${projectBadges(p, issues)}</div>
        </td>
        <td class="p-3 border-b border-slate-200 align-top">
          <div class="flex items-start gap-3">
            <div class="shrink-0 w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center"><i data-lucide="graduation-cap" class="w-4 h-4"></i></div>
            <div class="min-w-0">
              <p class="font-black text-slate-900 text-xs leading-snug"><span class="font-mono text-blue-700">[${esc(sigla)}]</span> ${esc(nomeCorso)}</p>
              <p class="mt-1 text-[10px] font-bold text-slate-500 flex items-center gap-1"><i data-lucide="building-2" class="w-3 h-3"></i>${esc(nomeAzienda)}</p>
              <p class="mt-1 text-[9px] text-slate-400 uppercase font-bold">${iscritti.length} corsisti iscritti</p>
            </div>
          </div>
        </td>
        <td class="p-3 border-b border-slate-200 align-top text-center">
          <span class="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 font-mono text-[10px] font-bold text-slate-700"><i data-lucide="calendar-days" class="w-3 h-3"></i>${esc(window.formatDataToItalian ? window.formatDataToItalian(p.data_esame) : (p.data_esame || '-'))}</span>
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
      return `<article class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden" data-corso="${esc(p.corso_id || '')}" data-azienda="${esc(p.azienda_id || '')}" data-mobile-project-id="${p.id}" data-project-id="${p.id}">
        <div class="p-4 border-b border-slate-200">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <button onclick="window.apriPopupProgettoById('${p.id}', 'progetti')" class="font-mono text-rose-700 font-black text-xs hover:underline">${esc(p.codice || 'Senza codice')}</button>
              <h3 class="mt-2 font-black text-slate-900 text-sm leading-snug"><span class="text-blue-700 font-mono text-[10px]">[${esc(sigla)}]</span> ${esc(nomeCorso)}</h3>
              <p class="mt-1 text-[10px] font-bold text-slate-500">${esc(azienda)}</p>
            </div>
            <div class="flex gap-1 shrink-0">
              <button onclick="window.apriPopupProgettoById('${p.id}', 'progetti')" class="text-blue-700 bg-blue-100 p-2 rounded-lg"><i data-lucide="edit" class="w-4 h-4"></i></button>
              <button onclick="window.stampaAttestatiProgetto('${p.id}')" class="text-emerald-800 bg-emerald-100 p-2 rounded-lg"><i data-lucide="award" class="w-4 h-4"></i></button>
              <button onclick="window.stampaFascicoloCompletoDaProgetti('${p.id}')" class="text-indigo-800 bg-indigo-100 p-2 rounded-lg"><i data-lucide="file-archive" class="w-4 h-4"></i></button>
            </div>
          </div>
          <div class="mt-3 flex flex-wrap gap-1">${projectBadges(p, issues)}</div>
          <p class="mt-3 text-[9px] font-bold uppercase tracking-widest text-slate-400">Esame · ${esc(window.formatDataToItalian ? window.formatDataToItalian(p.data_esame) : (p.data_esame || '-'))}</p>
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

  async function ensureCompanyDocEngine() {
    const loader = window.loadOptionalSafetyScript;
    if (typeof loader !== 'function') throw new Error('Loader moduli non disponibile.');
    const scripts = [
      'js/modules/documenti_azienda_lavoratore_core.js',
      'js/modules/documenti_azienda_lavoratore_ui.js',
      'js/modules/documenti_azienda_lavoratore_print.js',
      'js/modules/documenti_azienda_lavoratore_directory.js'
    ];
    for (const src of scripts) await loader(src);
    const D = window.SafetyCompanyDocs;
    if (!D?.loadDirectory || !D?.appointmentPage) throw new Error('Motore documenti azienda/lavoratore non disponibile.');
    await D.loadDirectory(false);
    return D;
  }

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
  const printPreparedCompanyDoc = (printArea) => {
    printArea.querySelectorAll('.safety-company-doc-page').forEach(page => {
      page.classList.add('print-show','temp-page');
      page.style.transform='none';page.style.margin='0';
    });
    document.body.classList.add('is-printing-temp');
    setTimeout(async () => {
      try {
        if (typeof window.waitForPrintImages === 'function') await window.waitForPrintImages(printArea);
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
      printPreparedCompanyDoc(printArea);
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
      printPreparedCompanyDoc(area);
    }catch(e){
      document.body.classList.remove('is-printing-temp');area.innerHTML='';
      alert('Modello consegna DPI non disponibile: '+(e.message||e));
    }
  };

  async function decorateCorsistiNomine() {
    const tbody = document.getElementById('tabella-corsisti');
    if (!tbody) return;
    let D;
    try { D = await ensureCompanyDocEngine(); } catch (_) { return; }

    tbody.querySelectorAll('button[onclick*="stampaAttestatoCorsista"]').forEach(btn => {
      const host = btn.parentElement;
      if (!host || host.querySelector('[data-safety-nomina-course]')) return;
      const raw = String(btn.getAttribute('onclick') || '');
      const match = raw.match(/stampaAttestatoCorsista\('([^']+)'\s*,\s*'([^']+)'\)/);
      if (!match) return;
      const projectId = match[1];
      const corsistaId = match[2];
      const history = historyFor(D, projectId, corsistaId);
      if (!history) return;
      const hasNomina=true; // Anche gli incarichi generici hanno un facsimile stampabile.
      const hasDpi=history.role==='quota' || /(?:^|_)dpi(?:_|$)/i.test(history.course?.id||'');
      if (!hasNomina && !hasDpi) return;
      if (hasNomina) {
        const nomina = document.createElement('button');
        nomina.type = 'button';
        nomina.dataset.safetyNominaCourse = '1';
        nomina.className = 'shrink-0 bg-violet-700 hover:bg-violet-600 text-white rounded px-2 py-1 text-[8px] font-black uppercase';
        nomina.title = `Stampa facsimile ${ROLE_LABELS[history.role] || 'nomina/incarico'} (nessun vincolo sul corso): da verificare e firmare`;
        nomina.textContent = history.role === 'attrezzatura' ? 'Autorizzazione' : (['quota','confinati'].includes(history.role) ? 'Incarico' : 'Nomina');
        nomina.addEventListener('click', () => window.stampaNominaCorsistaDaCorso(projectId, corsistaId));
        host.appendChild(nomina);
      }
      if (hasDpi) {
        const dpi = document.createElement('button');
        dpi.type='button';
        dpi.dataset.safetyNominaCourse='dpi';
        dpi.className='shrink-0 bg-slate-700 hover:bg-slate-600 text-white rounded px-2 py-1 text-[8px] font-black uppercase';
        dpi.title='Stampa facsimile verbale consegna DPI: richiede compilazione, consegna reale e firme';
        dpi.textContent='Modello DPI';
        dpi.addEventListener('click',()=>window.stampaModelloConsegnaDpiDaCorso(projectId,corsistaId));
        host.appendChild(dpi);
      }
    });
    if (typeof lucide !== 'undefined') lucide.createIcons();
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
  new MutationObserver(() => {
    clearTimeout(window.__safetyProjectCorsistiRefinementTimer);
    window.__safetyProjectCorsistiRefinementTimer = setTimeout(apply, 80);
  }).observe(root, { childList:true, subtree:true });
})();
