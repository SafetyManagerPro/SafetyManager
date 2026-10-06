// Pacchetto corso: prepara in un'unica stampa la documentazione operativa pre/durante corso.
// Non include attestati, fascicolo finale o verifica di efficacia post-formazione.
(() => {
  if (window.__safetyPacchettoCorsoLoaded) return;
  window.__safetyPacchettoCorsoLoaded = true;

  let busy = false;

  const labelFor = {
    progetto_formativo: 'Progetto formativo',
    validazione_percorso_formativo: 'Validazione / comunicazione OPRA-OPTA',
    dichiarazione_docenza: 'Dichiarazioni requisiti docenti',
    autocert: 'Autocertificazione requisiti ente',
    richiesta_organismo_paritetico: 'Richiesta Organismo Paritetico',
    dichiarazione_attrezzature: 'Idoneità attrezzature / area pratica',
    registro: 'Registri presenze',
    monitoraggio_qualita: 'Monitoraggio qualità',
    relazione_tutor: 'Relazione tutor',
    verbale: 'Verbale finale'
  };

  async function getProject(projectId) {
    let project = (window.progettiList || []).find(p => String(p.id) === String(projectId));
    if (project) return project;
    if (typeof window.getProgetti === 'function') {
      window.progettiList = await window.getProgetti();
      project = (window.progettiList || []).find(p => String(p.id) === String(projectId));
    }
    return project || null;
  }

  function normalizePage(page) {
    if (!page) return page;
    page.classList?.remove('hidden', 'scale-[0.8]', 'origin-top');
    page.classList?.add('print-show', 'temp-page');
    if (page.classList?.contains('landscape') || page.classList?.contains('manual-test-page')) {
      page.classList.add('landscape-force');
    } else if (!page.classList?.contains('landscape-force')) {
      page.classList?.add('portrait');
    }
    return page;
  }

  window.buildPacchettoCorso = async function(projectId) {
    if (!projectId) throw new Error('Seleziona prima un progetto formativo.');
    if (typeof window.caricaDatiStampa !== 'function' || typeof window.renderPrintModuleToTemp !== 'function') {
      throw new Error('Motore di stampa non disponibile.');
    }

    await window.caricaDatiStampa(projectId, { suppressPreviewRefresh: true });
    const project = await getProject(projectId);
    if (!project) throw new Error('Progetto non trovato.');

    const session = [...(window.currentSessionCorsisti || [])];
    const courseCheck = typeof window.getCourseCompliance === 'function'
      ? window.getCourseCompliance(project.corso_id, project.modalita, project.ente_erogatore)
      : {};
    const practical = !!courseCheck.pratico || !!window.isCorsoPresenzaObbligatoria?.(project.corso_id);
    const employerProvider = project.ente_erogatore === 'azienda';
    const associationProvider = typeof window.isAssociationTrainingProvider === 'function'
      ? !!window.isAssociationTrainingProvider()
      : !employerProvider;
    const tutorExpected = typeof window.isTutorExpectedForProject === 'function'
      ? !!window.isTutorExpectedForProject()
      : false;

    const pages = [];
    const manifest = [];
    const addPages = (label, newPages) => {
      const valid = (newPages || []).filter(Boolean).map(normalizePage);
      if (!valid.length) return;
      pages.push(...valid);
      manifest.push({ label, pages: valid.length });
    };
    const addModule = async (moduleId, condition = true, options = {}) => {
      if (!condition) return;
      const rendered = await window.renderPrintModuleToTemp(moduleId, null, {
        includeProjectFormativoTests: false,
        includeFascicoloTests: false,
        includeNeedsRiskAnnexes: false,
        includeQualityAnnexes: false,
        includeTutorRiesameAnnexes: false,
        includeLinguaAnnexes: false,
        includeEffectivenessAnnexes: false,
        includeFascicoloGuide: false,
        includeMultiDayRegisters: moduleId === 'registro',
        ...options
      });
      addPages(labelFor[moduleId] || moduleId, rendered);
    };

    // Base organizzativa.
    await addModule('progetto_formativo');
    if (typeof window.renderNeedsRiskAnnexPages === 'function') {
      addPages('Analisi fabbisogni e rischi', await window.renderNeedsRiskAnnexPages({ preview: false }));
    } else {
      await addModule('analisi_fabbisogni');
      await addModule('scheda_rischi_settore');
    }

    // Documenti del soggetto formatore: scelti in base al tipo di erogatore.
    await addModule('validazione_percorso_formativo', employerProvider);
    await addModule('dichiarazione_docenza');
    await addModule('autocert', associationProvider);
    await addModule('richiesta_organismo_paritetico', employerProvider);
    await addModule('dichiarazione_attrezzature', practical);

    // Documenti da usare durante il corso.
    await addModule('registro');

    if (typeof window.renderManualTestsForCurrentPrintProject === 'function') {
      addPages('Test finali + correttore', window.renderManualTestsForCurrentPrintProject({ preview: false, session }));
    } else if (typeof window.renderManualTestCoursePages === 'function') {
      addPages('Test finali + correttore', window.renderManualTestCoursePages(project.corso_id, { preview: false, session }));
    }

    if (typeof window.renderLinguaItalianaAnnexPages === 'function') {
      addPages('Verifica comprensione lingua italiana', await window.renderLinguaItalianaAnnexPages({ preview: false, session }));
    }

    if (typeof window.renderQuestionariGradimentoPages === 'function') {
      addPages('Questionari gradimento', await window.renderQuestionariGradimentoPages({ preview: false, session }));
    } else {
      await addModule('questionario_gradimento');
    }

    await addModule('monitoraggio_qualita');
    await addModule('relazione_tutor', tutorExpected);
    await addModule('verbale');

    return {
      project,
      pages,
      manifest,
      participants: session.length,
      practical,
      employerProvider,
      associationProvider,
      tutorExpected
    };
  };

  window.preparaPacchettoCorso = async function(projectId = null) {
    const id = projectId || document.getElementById('stampa-progetto')?.value || window.currentProgettoStampaId;
    if (!id) return alert('Seleziona prima un Progetto Formativo.');
    if (busy) return;
    busy = true;

    const area = document.getElementById('print-area-temp');
    if (!area) {
      busy = false;
      return alert('Area di stampa non disponibile.');
    }

    try {
      area.innerHTML = '';
      const pack = await window.buildPacchettoCorso(id);
      if (!pack.pages.length) throw new Error('Nessun documento stampabile generato per questo progetto.');

      const fragment = document.createDocumentFragment();
      pack.pages.forEach(page => fragment.appendChild(page));
      area.appendChild(fragment);
      area.dataset.pacchettoCorso = String(id);

      const elenco = pack.manifest.map(item => `• ${item.label}: ${item.pages} pag.`).join('\n');
      alert(
        `Pacchetto corso pronto: ${pack.pages.length} pagine per ${pack.participants} corsisti.\n\n${elenco}\n\n` +
        'Non sono inclusi attestati, fascicolo finale e verifica di efficacia post-formazione. Ora si aprirà la stampa: puoi stampare su carta oppure scegliere “Salva come PDF”.'
      );

      document.body.classList.add('is-printing-temp');
      setTimeout(async () => {
        try {
          if (typeof window.waitForPrintImages === 'function') await window.waitForPrintImages(area);
          window.print();
        } finally {
          document.body.classList.remove('is-printing-temp');
          area.innerHTML = '';
          delete area.dataset.pacchettoCorso;
          busy = false;
        }
      }, 1000);
    } catch (error) {
      console.error('Pacchetto corso: preparazione non riuscita', error);
      alert('Preparazione pacchetto corso non riuscita: ' + (error?.message || error));
      document.body.classList.remove('is-printing-temp');
      area.innerHTML = '';
      busy = false;
    }
  };

  function injectButton() {
    const select = document.getElementById('stampa-progetto');
    if (!select || document.getElementById('btn-pacchetto-corso')) return;
    const selectBlock = select.closest('.mb-4');
    if (!selectBlock) return;

    const box = document.createElement('div');
    box.id = 'pacchetto-corso-box';
    box.className = 'mb-5 rounded-xl border-2 border-emerald-300 bg-emerald-50 p-3';
    box.innerHTML = `
      <button id="btn-pacchetto-corso" type="button" onclick="window.preparaPacchettoCorso()" class="w-full rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-3 text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 shadow-sm transition">
        <i data-lucide="package-check" class="w-5 h-5"></i> Prepara pacchetto corso
      </button>
      <p class="mt-2 text-[9px] font-bold text-emerald-900 leading-relaxed">Genera in un'unica stampa i documenti operativi applicabili al corso selezionato. Attestati e documenti post-formazione restano separati.</p>`;
    selectBlock.insertAdjacentElement('afterend', box);
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  injectButton();
  setTimeout(injectButton, 100);
})();
