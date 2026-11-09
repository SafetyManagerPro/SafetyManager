// STEP 11 - Verifica / prepara corso completo
// Flusso guidato non distruttivo: non modifica database, stampe o firme.
(function(){
  if(window.__safetyPreparaCorsoLoaded) return;
  window.__safetyPreparaCorsoLoaded = true;

  const esc = v => window.dashEscape ? window.dashEscape(v) : String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const ok = v => v !== null && v !== undefined && String(v).trim() !== '' && String(v).trim() !== '---';
  const norm = v => String(v || '').trim().toLowerCase();
  const fmt = v => !v ? '-' : (window.formatDataToItalian ? window.formatDataToItalian(String(v).slice(0,10)) : String(v).slice(0,10));
  const today = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
  const parseDate = v => { if(!v) return null; const d = new Date(String(v).slice(0,10) + 'T00:00:00'); return Number.isNaN(d.getTime()) ? null : d; };
  const corso = p => { const c = window.DB_CORSI?.[p?.corso_id]; return c ? (c.t || c.code || p.corso_id) : (p?.corso_id || 'Corso non indicato'); };
  const azienda = p => p?.aziende?.ragione_sociale || p?.azienda_nome || 'Azienda non collegata';

  const modal = () => {
    let m = document.getElementById('safety-prepara-corso-modal');
    if(!m){
      m = document.createElement('div');
      m.id = 'safety-prepara-corso-modal';
      m.className = 'fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-sm hidden p-3 md:p-6 items-center justify-center';
      m.onclick = e => { if(e.target === m) window.closePreparaCorsoModal(); };
      document.body.appendChild(m);
    }
    return m;
  };

  window.closePreparaCorsoModal = function(){
    const m = document.getElementById('safety-prepara-corso-modal');
    if(m){ m.classList.add('hidden'); m.classList.remove('flex'); m.innerHTML = ''; }
  };

  const ensureChecklist = async () => {
    if(typeof window.buildSafetyCourseChecklist === 'function') return true;
    if(typeof window.loadOptionalSafetyScript === 'function') {
      await window.loadOptionalSafetyScript('js/modules/checklist_corso.js');
    }
    return typeof window.buildSafetyCourseChecklist === 'function';
  };

  const getProject = async id => {
    const list = (window.progettiList && window.progettiList.length) ? window.progettiList : (window.getProgetti ? await window.getProgetti() : []);
    return list.find(p => p.id === id);
  };

  // Registro Step 67 (stati segnati a mano, documenti acquisiti, efficacia): unica fonte della percentuale.
  // Se non disponibile si torna al calcolo sui soli dati del progetto, come prima.
  const step67StateFor = async (p, iscritti) => {
    try { return window.SafetyStep67 ? await window.SafetyStep67.evaluateProject(p, iscritti) : null; }
    catch (e) { console.warn('Prepara corso: registro Step 67 non disponibile.', e); return null; }
  };
  const step67StatesFor = async (projects, map) => {
    try { return window.SafetyStep67 ? await window.SafetyStep67.evaluateProjects(projects, map) : {}; }
    catch (e) { console.warn('Prepara corso: registro Step 67 non disponibile.', e); return {}; }
  };

  const getChecklistData = async projectId => {
    await ensureChecklist();
    const p = await getProject(projectId);
    if(!p) throw new Error('Progetto non trovato.');
    const iscritti = window.getIscrizioni ? await window.getIscrizioni(projectId) : [];
    // Stessa regola della Checklist: la percentuale viene dal registro Step 67.
    const step67 = await step67StateFor(p, iscritti || []);
    const checklist = window.buildSafetyCourseChecklist ? window.buildSafetyCourseChecklist(p, iscritti || [], step67) : null;
    if(!checklist) throw new Error('Checklist non disponibile.');
    return { p, iscritti: iscritti || [], checklist };
  };

  const findItem = (checklist, labelPart) => {
    const needle = norm(labelPart);
    return checklist.groups.flatMap(g => g.items).find(i => norm(i.label).includes(needle));
  };

  const buildPreparationSteps = (p, iscritti, checklist) => {
    const exam = parseDate(p.data_esame);
    const past = exam && exam <= today();
    const closed = norm(p.stato_corso) === 'chiuso';
    const requiredItems = checklist.groups.flatMap(g => g.items).filter(i => i.required !== false);
    const missingRequired = requiredItems.filter(i => !i.done);
    const warnings = checklist.groups.flatMap(g => g.items).filter(i => i.required === false && !i.done);

    const baseOk = ['Codice progetto','Corso da catalogo','Azienda collegata','Sede / aula / campo prova','Modalità svolgimento','Date corso'].every(label => findItem(checklist, label)?.done);
    const peopleOk = ['Responsabile progetto formativo','Responsabile del corso','Docenti assegnati'].every(label => findItem(checklist, label)?.done);
    const corsistiOk = ['Corsisti associati','Nome e codice fiscale'].every(label => findItem(checklist, label)?.done);
    const printOk = ['Progetto formativo stampabile','Registro presenze stampabile','Test e correttori stampabili'].every(label => findItem(checklist, label)?.done);
    const finalOk = !past || ['Frequenze registrate','Test/verifica registrata','Esiti finali','ID certificati idonei','Scadenze attestati','Verbale finale','Attestati generabili'].every(label => {
      const item = findItem(checklist, label);
      return !item || item.done;
    });
    const archiveOk = !closed || findItem(checklist, 'Scansione documenti firmati')?.done;

    return {
      past,
      closed,
      missingRequired,
      warnings,
      canPrint: baseOk && peopleOk && corsistiOk && printOk,
      canClose: past && finalOk && archiveOk && missingRequired.length === 0,
      steps: [
        {
          key: 'backup',
          title: 'Backup consigliato',
          done: typeof window.esportaBackupDatabaseLocale === 'function',
          optional: true,
          detail: 'Prima di lavori importanti conviene scaricare lo ZIP completo da Migrazione.'
        },
        {
          key: 'base',
          title: 'Dati corso',
          done: baseOk,
          detail: baseOk ? 'Codice, corso, azienda, sede, modalità e date risultano presenti.' : 'Completa i dati anagrafici principali del progetto.'
        },
        {
          key: 'people',
          title: 'Responsabili, docenti e firme',
          done: peopleOk,
          detail: peopleOk ? 'Responsabili e docenti minimi risultano assegnati.' : 'Completa responsabile progetto, responsabile corso e docenti.'
        },
        {
          key: 'corsisti',
          title: 'Corsisti',
          done: corsistiOk,
          detail: corsistiOk ? `${iscritti.length} corsisti collegati con anagrafiche minime.` : 'Associa i corsisti e completa nome/codice fiscale.'
        },
        {
          key: 'stampe',
          title: 'Pacchetto stampe iniziale',
          done: printOk,
          detail: printOk ? 'Progetto, registro, test e correttori sono generabili.' : 'Mancano dati necessari per stampare il pacchetto iniziale.'
        },
        {
          key: 'finale',
          title: past ? 'Esiti, verbale e attestati' : 'Chiusura finale non ancora richiesta',
          done: finalOk,
          optional: !past,
          detail: past ? (finalOk ? 'Esiti, frequenze, verifiche, ID e scadenze risultano pronti.' : 'Completa frequenze, test/verifiche, esiti, ID certificati e scadenze.') : 'La data verifica non è ancora trascorsa: questa parte diventerà prioritaria a fine corso.'
        },
        {
          key: 'archivio',
          title: 'Archivio documenti firmati',
          done: archiveOk,
          optional: !closed,
          detail: closed ? (archiveOk ? 'Link/scansione documenti firmati presente.' : 'Corso chiuso senza documenti firmati archiviati.') : 'Richiesto quando il corso viene chiuso e archiviato.'
        }
      ]
    };
  };

  const stepHtml = s => {
    const tone = s.done ? 'emerald' : (s.optional ? 'amber' : 'rose');
    const icon = s.done ? 'check-circle' : (s.optional ? 'alert-triangle' : 'x-circle');
    const label = s.done ? 'OK' : (s.optional ? 'Consigliato' : 'Da completare');
    return `
      <div class="rounded-2xl border border-${tone}-200 bg-${tone}-50 p-4 flex items-start gap-3">
        <span class="w-10 h-10 rounded-xl bg-white border border-${tone}-200 text-${tone}-700 flex items-center justify-center shrink-0">
          <i data-lucide="${icon}" class="w-5 h-5"></i>
        </span>
        <div class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <p class="font-black uppercase text-slate-900 text-sm">${esc(s.title)}</p>
            <span class="px-2 py-0.5 rounded-full bg-white border border-${tone}-200 text-${tone}-800 text-[8px] font-black uppercase tracking-widest">${label}</span>
          </div>
          <p class="text-xs text-slate-600 mt-1 leading-relaxed">${esc(s.detail)}</p>
        </div>
      </div>`;
  };

  const issueListHtml = (prep) => {
    if(!prep.missingRequired.length && !prep.warnings.length) {
      return '<div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center text-sm font-bold text-emerald-900">Nessun blocco rilevato: il corso risulta pronto nei controlli automatici.</div>';
    }
    const hard = prep.missingRequired.slice(0, 12).map(i => `<li><strong>${esc(i.label)}:</strong> ${esc(i.detail || 'da completare')}</li>`).join('');
    const soft = prep.warnings.slice(0, 8).map(i => `<li><strong>${esc(i.label)}:</strong> ${esc(i.detail || 'controllo consigliato')}</li>`).join('');
    return `
      ${hard ? `<div class="rounded-2xl border border-rose-200 bg-rose-50 p-4"><p class="font-black uppercase text-rose-900 text-xs mb-2">Blocchi da correggere</p><ul class="list-disc ml-5 text-xs text-rose-900 space-y-1">${hard}</ul></div>` : ''}
      ${soft ? `<div class="rounded-2xl border border-amber-200 bg-amber-50 p-4 mt-3"><p class="font-black uppercase text-amber-900 text-xs mb-2">Avvisi consigliati</p><ul class="list-disc ml-5 text-xs text-amber-900 space-y-1">${soft}</ul></div>` : ''}`;
  };

  window.preparaVaiStampe = async function(projectId){
    window.currentProgettoStampaId = projectId || window.currentProgettoStampaId || '';
    await window.loadModule('stampe');
    if(projectId){
      setTimeout(() => {
        const select = document.getElementById('stampa-progetto');
        if(select){
          select.value = projectId;
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
        window.currentProgettoStampaId = projectId;
      }, 400);
    }
  };

  window.scaricaBackupPreCorso = async function(){
    if(typeof window.esportaBackupDatabaseLocale === 'function') {
      await window.esportaBackupDatabaseLocale();
      return;
    }
    await window.loadModule('migrazione');
  };

  window.apriPreparazioneCorso = async function(projectId){
    const m = modal();
    m.classList.remove('hidden');
    m.classList.add('flex');
    m.innerHTML = '<div class="bg-white rounded-3xl shadow-2xl p-8 text-center"><i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600"></i><p class="font-black uppercase">Verifica corso in corso...</p></div>';
    if(window.lucide) lucide.createIcons();

    try {
      const { p, iscritti, checklist } = await getChecklistData(projectId);
      const prep = buildPreparationSteps(p, iscritti, checklist);
      const statusTone = prep.missingRequired.length ? 'rose' : (prep.warnings.length ? 'amber' : 'emerald');
      const statusLabel = prep.missingRequired.length ? 'Da completare' : (prep.warnings.length ? 'Quasi pronto' : 'Pronto');
      const headline = prep.canPrint ? 'Pacchetto stampa iniziale pronto' : 'Pacchetto corso da completare';
      const subline = prep.canPrint
        ? 'Puoi procedere con Centro Stampe per progetto, registro, test e correttori.'
        : 'Completa prima i blocchi evidenziati, poi ristampa o genera il fascicolo.';

      m.innerHTML = `
        <div class="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <div class="p-5 md:p-6 bg-slate-900 text-white flex justify-between gap-4">
            <div class="min-w-0">
              <p class="text-[10px] font-black uppercase tracking-widest text-blue-200">Verifica / prepara corso completo</p>
              <h2 class="text-2xl font-black uppercase truncate">${esc(p.codice || 'Senza codice')}</h2>
              <p class="text-sm text-slate-300 truncate">${esc(corso(p))} · ${esc(azienda(p))}</p>
            </div>
            <button onclick="window.closePreparaCorsoModal()" class="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0"><i data-lucide="x" class="w-5 h-5"></i></button>
          </div>

          <div class="p-5 overflow-y-auto bg-slate-50">
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-5">
              <div class="rounded-2xl border border-${statusTone}-200 bg-${statusTone}-50 p-4">
                <p class="text-[10px] font-black uppercase tracking-widest text-${statusTone}-800">Stato generale</p>
                <p class="text-xl font-black text-slate-900 mt-1">${esc(statusLabel)}</p>
              </div>
              <div class="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <p class="text-[10px] font-black uppercase tracking-widest text-blue-800">Checklist</p>
                <p class="text-xl font-black text-slate-900 mt-1">${checklist.percent}%</p>
              </div>
              <div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p class="text-[10px] font-black uppercase tracking-widest text-emerald-800">Stampe iniziali</p>
                <p class="text-xl font-black text-slate-900 mt-1">${prep.canPrint ? 'Pronte' : 'No'}</p>
              </div>
              <div class="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p class="text-[10px] font-black uppercase tracking-widest text-amber-800">Chiusura</p>
                <p class="text-xl font-black text-slate-900 mt-1">${prep.closed ? 'Archiviato' : (prep.canClose ? 'Pronta' : (prep.past ? 'Da completare' : 'Più avanti'))}</p>
              </div>
            </div>

            <div class="rounded-3xl border border-slate-200 bg-white p-5 mb-5">
              <div class="flex items-start gap-3">
                <span class="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0"><i data-lucide="rocket" class="w-6 h-6"></i></span>
                <div>
                  <h3 class="font-black uppercase text-slate-900 text-lg">${esc(headline)}</h3>
                  <p class="text-sm text-slate-600 mt-1 leading-relaxed">${esc(subline)}</p>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-5">
              <section class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div class="p-4 border-b border-slate-100 flex items-center gap-2">
                  <i data-lucide="route" class="w-5 h-5 text-slate-700"></i>
                  <h3 class="font-black uppercase text-slate-900 text-sm">Percorso consigliato</h3>
                </div>
                <div class="p-4 space-y-3">${prep.steps.map(stepHtml).join('')}</div>
              </section>

              <section class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div class="p-4 border-b border-slate-100 flex items-center gap-2">
                  <i data-lucide="clipboard-list" class="w-5 h-5 text-slate-700"></i>
                  <h3 class="font-black uppercase text-slate-900 text-sm">Cosa manca</h3>
                </div>
                <div class="p-4">${issueListHtml(prep)}</div>
              </section>
            </div>
          </div>

          <div class="p-4 bg-white border-t flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
            <p class="text-[11px] text-slate-500 leading-relaxed">Questa verifica non modifica i dati: serve a guidare le operazioni prima di stampare, chiudere o archiviare il corso.</p>
            <div class="flex flex-wrap gap-2 justify-end">
              <button onclick="window.scaricaBackupPreCorso()" class="px-4 py-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-100 text-[10px] font-black uppercase tracking-widest">Backup</button>
              <button onclick="window.apriChecklistCorso('${esc(p.id)}')" class="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] font-black uppercase tracking-widest">Checklist</button>
              <button onclick="window.dashboardOpenProject ? window.dashboardOpenProject('${esc(p.id)}') : window.loadModule('progetti')" class="px-4 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">Apri progetto</button>
              <button onclick="window.preparaVaiStampe('${esc(p.id)}')" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest">Centro stampe</button>
              <button onclick="window.loadModule('archivio_corsi')" class="px-4 py-2 rounded-xl bg-blue-50 text-blue-800 border border-blue-100 text-[10px] font-black uppercase tracking-widest">Archivio</button>
            </div>
          </div>
        </div>`;
      if(window.lucide) lucide.createIcons();
    } catch(e) {
      m.innerHTML = `<div class="bg-white rounded-3xl shadow-2xl border border-rose-200 w-full max-w-md p-8 text-center"><i data-lucide="alert-triangle" class="w-8 h-8 mx-auto mb-3 text-rose-600"></i><p class="font-black uppercase text-rose-900">Verifica non disponibile</p><p class="text-xs text-slate-600 mt-2">${esc(e.message || e)}</p><button onclick="window.closePreparaCorsoModal()" class="mt-5 px-4 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase">Chiudi</button></div>`;
      if(window.lucide) lucide.createIcons();
    }
  };

  window.apriPreparazioneCorsi = async function(){
    const m = modal();
    m.classList.remove('hidden');
    m.classList.add('flex');
    m.innerHTML = '<div class="bg-white rounded-3xl shadow-2xl p-8 text-center"><i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600"></i><p class="font-black uppercase">Caricamento corsi...</p></div>';
    if(window.lucide) lucide.createIcons();

    try {
      await ensureChecklist();
      const projects = window.getProgetti ? await window.getProgetti() : [];
      const ids = projects.map(p => p.id).filter(Boolean);
      const map = ids.length && window.getIscrizioniPerProgetti ? await window.getIscrizioniPerProgetti(ids) : {};
      const states = await step67StatesFor(projects, map);
      const rows = projects.map(p => {
        const iscritti = map[p.id] || [];
        const checklist = window.buildSafetyCourseChecklist(p, iscritti, states[p.id] || null);
        const prep = buildPreparationSteps(p, iscritti, checklist);
        return { p, checklist, prep };
      }).sort((a,b) => {
        const pa = a.prep.canPrint ? 1 : 0;
        const pb = b.prep.canPrint ? 1 : 0;
        return pa - pb || a.checklist.percent - b.checklist.percent;
      }).slice(0, 14);

      m.innerHTML = `
        <div class="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[88vh] overflow-hidden flex flex-col">
          <div class="p-5 bg-slate-900 text-white flex items-center justify-between gap-4">
            <div>
              <p class="text-[10px] font-black uppercase tracking-widest text-blue-200">Verifica / prepara corso completo</p>
              <h2 class="text-2xl font-black uppercase">Scegli corso</h2>
            </div>
            <button onclick="window.closePreparaCorsoModal()" class="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center"><i data-lucide="x" class="w-5 h-5"></i></button>
          </div>
          <div class="p-5 overflow-y-auto bg-slate-50 space-y-3">
            ${rows.length ? rows.map(({p, checklist, prep}) => {
              const tone = prep.missingRequired.length ? 'rose' : (prep.warnings.length ? 'amber' : 'emerald');
              const label = prep.canPrint ? 'Stampe pronte' : 'Da completare';
              return `<div class="rounded-2xl bg-white border border-slate-200 p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div class="min-w-0">
                  <div class="flex gap-2 mb-1 flex-wrap">
                    <span class="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-${tone}-50 text-${tone}-800 border border-${tone}-200">${label}</span>
                    <span class="text-[10px] text-slate-400 font-black uppercase">Checklist ${checklist.percent}%</span>
                  </div>
                  <p class="font-black text-slate-900 uppercase truncate">${esc(p.codice || 'Senza codice')} · ${esc(corso(p))}</p>
                  <p class="text-xs text-slate-500 truncate">${esc(azienda(p))} · verifica ${esc(fmt(p.data_esame))}</p>
                </div>
                <div class="flex gap-2 shrink-0">
                  <button onclick="window.apriPreparazioneCorso('${esc(p.id)}')" class="px-4 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">Prepara</button>
                  <button onclick="window.apriChecklistCorso && window.apriChecklistCorso('${esc(p.id)}')" class="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] font-black uppercase tracking-widest">Checklist</button>
                </div>
              </div>`;
            }).join('') : '<div class="p-8 text-center text-slate-500">Nessun progetto presente.</div>'}
          </div>
        </div>`;
      if(window.lucide) lucide.createIcons();
    } catch(e) {
      m.innerHTML = `<div class="bg-white rounded-3xl shadow-2xl border border-rose-200 w-full max-w-md p-8 text-center"><i data-lucide="alert-triangle" class="w-8 h-8 mx-auto mb-3 text-rose-600"></i><p class="font-black uppercase text-rose-900">Elenco non disponibile</p><p class="text-xs text-slate-600 mt-2">${esc(e.message || e)}</p><button onclick="window.closePreparaCorsoModal()" class="mt-5 px-4 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase">Chiudi</button></div>`;
      if(window.lucide) lucide.createIcons();
    }
  };

  window.injectPreparaButtonsInDashboard = function(){
    document.querySelectorAll('#dash-projects-overview button[onclick^="window.dashboardOpenProject"], #dash-action-plan button[onclick^="window.dashboardOpenProject"]').forEach(btn => {
      if(btn.dataset.preparaSibling === 'yes') return;
      const match = String(btn.getAttribute('onclick') || '').match(/dashboardOpenProject\('([^']+)'\)/);
      if(!match) return;
      const extra = document.createElement('button');
      extra.type = 'button';
      extra.className = 'px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-100 text-[10px] font-black uppercase tracking-widest ml-1';
      extra.textContent = 'Prepara';
      extra.onclick = e => { e.stopPropagation(); window.apriPreparazioneCorso(match[1]); };
      btn.insertAdjacentElement('afterend', extra);
      btn.dataset.preparaSibling = 'yes';
    });
  };

  const wrapDashboard = () => {
    if(typeof window.loadDashboardStats !== 'function' || window.loadDashboardStats.__preparaWrapped) return;
    const old = window.loadDashboardStats;
    const wrapped = async function(...args){
      const result = await old.apply(this, args);
      setTimeout(window.injectPreparaButtonsInDashboard, 120);
      return result;
    };
    wrapped.__preparaWrapped = true;
    window.loadDashboardStats = wrapped;
  };

  wrapDashboard();
  setTimeout(wrapDashboard, 0);
  setTimeout(() => { wrapDashboard(); window.injectPreparaButtonsInDashboard(); }, 700);
})();
