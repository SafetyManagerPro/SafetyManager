// Unifica "Prepara corso" e "Pacchetto corso" in un unico percorso guidato.
// Estende il wizard esistente senza duplicare checklist o motore di stampa.
(function () {
  if (window.__safetyPreparaCorsoUnificatoLoaded) return;
  window.__safetyPreparaCorsoUnificatoLoaded = true;

  let packageBusy = false;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const norm = value => String(value || '').trim().toLowerCase();

  const ensureChecklist = async () => {
    if (typeof window.buildSafetyCourseChecklist === 'function') return true;
    if (typeof window.loadOptionalSafetyScript === 'function') {
      await window.loadOptionalSafetyScript('js/modules/checklist_corso.js');
    }
    return typeof window.buildSafetyCourseChecklist === 'function';
  };

  const getProject = async projectId => {
    let list = Array.isArray(window.progettiList) ? window.progettiList : [];
    let project = list.find(p => String(p.id) === String(projectId));
    if (!project && typeof window.getProgetti === 'function') {
      list = await window.getProgetti();
      window.progettiList = list || [];
      project = (list || []).find(p => String(p.id) === String(projectId));
    }
    return project || null;
  };

  const getPreCourseMissing = async projectId => {
    await ensureChecklist();
    const project = await getProject(projectId);
    if (!project || typeof window.buildSafetyCourseChecklist !== 'function') return [];
    const trainees = typeof window.getIscrizioni === 'function' ? await window.getIscrizioni(projectId) : [];
    const checklist = window.buildSafetyCourseChecklist(project, trainees || []);
    const items = (checklist?.groups || []).flatMap(group => group.items || []);
    const find = label => {
      const needle = norm(label);
      return items.find(item => norm(item.label).includes(needle));
    };

    // Solo requisiti utili alla preparazione materiale del corso.
    // Non includiamo qui esiti, attestati, efficacia o archivio post-formazione.
    const labels = [
      'Codice progetto',
      'Corso da catalogo',
      'Azienda collegata',
      'Sede / aula / campo prova',
      'Modalità svolgimento',
      'Date corso',
      'Responsabile progetto formativo',
      'Responsabile del corso',
      'Docenti assegnati',
      'Corsisti associati',
      'Nome e codice fiscale',
      'Progetto formativo stampabile',
      'Registro presenze stampabile',
      'Test e correttori stampabili'
    ];

    return labels
      .map(label => find(label))
      .filter(Boolean)
      .filter(item => !item.done);
  };

  const waitForPrintProjectSelect = async projectId => {
    for (let i = 0; i < 24; i++) {
      const select = document.getElementById('stampa-progetto');
      if (select) {
        const hasOption = Array.from(select.options || []).some(option => String(option.value) === String(projectId));
        if (hasOption) return select;
      }
      await sleep(125);
    }
    return document.getElementById('stampa-progetto');
  };

  window.preparaCorsoGeneraPacchetto = async function (projectId, options = {}) {
    if (!projectId || packageBusy) return;
    packageBusy = true;

    try {
      const missing = await getPreCourseMissing(projectId);
      if (missing.length && !options.skipWarning) {
        const preview = missing.slice(0, 5).map(item => '• ' + (item.label || 'Dato da verificare')).join('\n');
        const more = missing.length > 5 ? `\n• altri ${missing.length - 5} controlli` : '';
        const proceed = confirm(
          `Il corso ha ${missing.length} controlli pre-corso ancora da verificare:\n\n${preview}${more}\n\n` +
          'SafetyManager non blocca la preparazione: vuoi generare comunque il pacchetto con i dati attualmente disponibili?'
        );
        if (!proceed) return;
      }

      if (typeof window.closePreparaCorsoModal === 'function') window.closePreparaCorsoModal();
      window.currentProgettoStampaId = projectId;

      if (typeof window.loadModule !== 'function') throw new Error('Navigazione moduli non disponibile.');
      await window.loadModule('stampe');

      if (typeof window.loadOptionalSafetyScript === 'function') {
        await window.loadOptionalSafetyScript('js/modules/pacchetto_corso.js');
      }

      const select = await waitForPrintProjectSelect(projectId);
      if (select) {
        select.value = projectId;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
      window.currentProgettoStampaId = projectId;

      if (typeof window.caricaDatiStampa === 'function') {
        await window.caricaDatiStampa(projectId, { suppressPreviewRefresh: true });
      }

      if (typeof window.preparaPacchettoCorso !== 'function') {
        throw new Error('Generatore Pacchetto corso non disponibile.');
      }

      await window.preparaPacchettoCorso(projectId);
    } catch (error) {
      console.error('Prepara corso: generazione pacchetto non riuscita', error);
      alert('Preparazione pacchetto corso non riuscita: ' + (error?.message || error));
    } finally {
      packageBusy = false;
    }
  };

  const enhancePreparationModal = projectId => {
    const modal = document.getElementById('safety-prepara-corso-modal');
    if (!modal) return;
    const dialog = modal.firstElementChild;
    if (!dialog || dialog.dataset.unifiedPrepare === '1') return;

    // Evita di modificare lo stato di caricamento o le finestre di errore.
    const footer = dialog.querySelector('.border-t');
    if (!footer) return;
    dialog.dataset.unifiedPrepare = '1';

    const headline = Array.from(dialog.querySelectorAll('h3')).find(el => /pacchetto/i.test(el.textContent || ''));
    if (headline) headline.textContent = 'Prepara e stampa il pacchetto corso';
    const headlineText = headline?.parentElement?.querySelector('p');
    if (headlineText) {
      headlineText.textContent = 'Un solo comando genera i documenti operativi applicabili al progetto. Puoi comunque aprire il Centro Stampe per lavorare sui singoli documenti.';
    }

    const buttons = Array.from(footer.querySelectorAll('button'));
    const centerButton = buttons.find(btn => /centro stampe/i.test(btn.textContent || ''));
    if (centerButton) {
      centerButton.textContent = 'Apri Centro Stampe';
      centerButton.className = 'px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-[10px] font-black uppercase tracking-widest';
    }

    if (!footer.querySelector('[data-genera-pacchetto-corso]')) {
      const primary = document.createElement('button');
      primary.type = 'button';
      primary.dataset.generaPacchettoCorso = '1';
      primary.className = 'px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white shadow-sm text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2';
      primary.innerHTML = '<i data-lucide="package-check" class="w-4 h-4"></i> Genera pacchetto corso';
      primary.onclick = () => window.preparaCorsoGeneraPacchetto(projectId);

      const buttonBox = footer.querySelector('.justify-end') || footer.lastElementChild || footer;
      buttonBox.insertBefore(primary, buttonBox.firstChild);
    }

    const footerNote = footer.querySelector('p');
    if (footerNote) {
      footerNote.textContent = 'Percorso unico: verifica i dati, correggi ciò che serve e genera il pacchetto operativo. Gli avvisi non bloccano la stampa; attestati, fascicolo finale ed efficacia restano nella fase post-corso.';
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
  };

  const originalOpenPreparation = window.apriPreparazioneCorso;
  if (typeof originalOpenPreparation === 'function') {
    window.apriPreparazioneCorso = async function (projectId) {
      const result = await originalOpenPreparation.apply(this, arguments);
      enhancePreparationModal(projectId);
      return result;
    };
  }

  // Rende più esplicita anche la lista dei corsi senza alterarne la logica.
  const originalOpenList = window.apriPreparazioneCorsi;
  if (typeof originalOpenList === 'function') {
    window.apriPreparazioneCorsi = async function () {
      const result = await originalOpenList.apply(this, arguments);
      const modal = document.getElementById('safety-prepara-corso-modal');
      if (modal) {
        modal.querySelectorAll('button').forEach(button => {
          if ((button.textContent || '').trim() === 'Prepara') button.textContent = 'Prepara corso';
        });
        const subtitle = modal.querySelector('p.text-blue-200');
        if (subtitle) subtitle.textContent = 'Percorso guidato · verifica e pacchetto operativo';
      }
      return result;
    };
  }

  window.SafetyPrepareCourseUnified = {
    generatePackage: window.preparaCorsoGeneraPacchetto,
    getPreCourseMissing,
    enhancePreparationModal
  };
})();
