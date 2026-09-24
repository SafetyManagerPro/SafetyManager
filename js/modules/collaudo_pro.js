// STEP 15 - Collaudo professionale / diagnostica regressioni
// Estende il collaudo esistente senza modificare dati, stampe o configurazioni.
(function(){
  if (window.__safetyCollaudoProLoaded) return;
  window.__safetyCollaudoProLoaded = true;

  const oldRun = window.runCollaudoSistema;
  const esc = v => window.dashEscape ? window.dashEscape(v) : String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const add = (report, area, name, status, details='') => {
    if (typeof window.collAdd === 'function') window.collAdd(report, area, name, status, details);
    else report.items.push({ area, name, status, details });
  };

  const renderExtra = report => {
    const root = document.getElementById('collaudo-results');
    if (!root) return;
    const items = report.items.filter(i => ['Step 15 · Integrità app','Step 15 · Sicurezza','Step 15 · Dati e procedure','Step 67 · Chiusura intelligente'].includes(i.area));
    if (!items.length) return;
    const box = document.createElement('div');
    box.id = 'collaudo-step15-extra';
    box.className = 'bg-white border border-blue-200 rounded-2xl shadow-sm overflow-hidden';
    box.innerHTML = `<div class="bg-blue-950 text-white px-4 py-3"><h2 class="font-black uppercase text-sm">Step 15 · Controlli professionali aggiuntivi</h2><p class="text-[10px] text-blue-200 mt-1">Regressioni, sicurezza, moduli recenti e procedure operative</p></div><div class="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">${items.map(i => {
      const cls = i.status === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : i.status === 'warn' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-rose-200 bg-rose-50 text-rose-900';
      const label = i.status === 'ok' ? 'OK' : i.status === 'warn' ? 'Avviso' : 'Errore';
      return `<div class="rounded-xl border p-3 ${cls}"><div class="flex items-center justify-between gap-2"><p class="font-black uppercase text-[10px]">${esc(i.name)}</p><span class="px-2 py-0.5 rounded-full bg-white/80 border border-current/10 text-[8px] font-black uppercase">${label}</span></div><p class="text-[10px] mt-1 leading-relaxed opacity-90">${esc(i.details || '')}</p></div>`;
    }).join('')}</div>`;
    root.prepend(box);
  };

  const updateSummary = report => {
    const counts = {
      ok: report.items.filter(i => i.status === 'ok').length,
      warn: report.items.filter(i => i.status === 'warn').length,
      error: report.items.filter(i => i.status === 'error').length
    };
    report.summary = counts;
    const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
    set('collaudo-ok', counts.ok);
    set('collaudo-warn', counts.warn);
    set('collaudo-error', counts.error);
    set('collaudo-esito', counts.error ? 'Errori' : counts.warn ? 'Avvisi' : 'OK');
  };

  window.runCollaudoSistema = async function(){
    if (typeof oldRun === 'function') await oldRun();
    const report = window.collaudoReport || { meta:{}, items:[] };
    report.meta.step_professionale = '15';
    report.meta.step_chiusura_intelligente = '67';
    report.meta.professional_checks_at = new Date().toISOString();

    // Autenticazione reale e sessione admin.
    try {
      const user = typeof window.getSafetyAdminUser === 'function' ? await window.getSafetyAdminUser() : null;
      add(report, 'Step 15 · Sicurezza', 'Sessione amministratore', user ? 'ok' : 'error', user ? `Admin autenticato: ${user.email || 'utente autorizzato'}` : 'Sessione admin non verificabile');
    } catch(e) {
      add(report, 'Step 15 · Sicurezza', 'Sessione amministratore', 'error', e.message || String(e));
    }

    const criticalFns = [
      'buildSafetyCourseChecklist','apriPreparazioneCorsi','apriPreparazioneCorso',
      'esportaBackupDatabaseLocale','analizzaBackupDaRipristinare','ripristinaBackupDatabaseLocale',
      'prepareSafetyPrintContainer','waitForPrintImages','resolveSafetySignature',
      'analizzaImportGuidato','loadArchivioCorsi','renderArchivioCorsi','buildSafetyCourseCompletionState'
    ];
    criticalFns.forEach(fn => add(report, 'Step 15 · Integrità app', fn, typeof window[fn] === 'function' ? 'ok' : 'warn', typeof window[fn] === 'function' ? 'Funzione disponibile' : 'Funzione non ancora caricata: apri il relativo modulo o ricarica la Dashboard'));

    const recentFiles = [
      'js/modules/dashboard_pro.js','js/modules/checklist_corso.js','js/modules/prepara_corso.js',
      'js/modules/archivio_avanzato.js','js/modules/import_guidato.js','js/modules/ui_refinements.js',
      'js/modules/collaudo_pro.js','js/modules/audit_attivita.js','js/modules/chiusura_corso.js',
      'js/modules/scadenze_avanzate.js','js/modules/kit_cliente_pro.js','js/modules/step67_chiusura_intelligente.js'
    ];
    for (const file of recentFiles) {
      try {
        const r = await fetch(file, { cache:'no-store' });
        add(report, 'Step 15 · Integrità app', file, r.ok ? 'ok' : 'error', r.ok ? `HTTP ${r.status}` : `File non disponibile · HTTP ${r.status}`);
      } catch(e) {
        add(report, 'Step 15 · Integrità app', file, 'error', e.message || String(e));
      }
    }

    const htmlFiles = ['modules/attivita.html','modules/scadenze.html','modules/kit_cliente.html','modules/collaudo.html'];
    for (const file of htmlFiles) {
      try {
        const r = await fetch(file, { cache:'no-store' });
        add(report, 'Step 15 · Integrità app', file, r.ok ? 'ok' : 'error', r.ok ? 'Caricabile' : `HTTP ${r.status}`);
      } catch(e) {
        add(report, 'Step 15 · Integrità app', file, 'error', e.message || String(e));
      }
    }

    add(report, 'Step 15 · Integrità app', 'Area stampa temporanea', document.getElementById('print-area-temp') ? 'ok' : 'error', document.getElementById('print-area-temp') ? 'Presente nel DOM' : 'Elemento #print-area-temp mancante');
    add(report, 'Step 15 · Integrità app', 'UI professionale', typeof window.applySafetyUiRefinements === 'function' ? 'ok' : 'warn', typeof window.applySafetyUiRefinements === 'function' ? 'Rifiniture UI attive' : 'Modulo UI non ancora caricato');

    // Query sulle tabelle operative introdotte nei vari step.
    if (window.supabaseClient) {
      const tables = ['audit_log','documenti_fascicolo','export_fascicoli','firme_digitali','test_digitali','validazioni_percorsi_formativi','richieste_organismi_paritetici','training_effectiveness_checks','course_completion_items'];
      for (const table of tables) {
        const t0 = performance.now();
        try {
          const { error } = await window.supabaseClient.from(table).select('*', { count:'exact', head:true });
          const ms = Math.round(performance.now()-t0);
          add(report, 'Step 15 · Dati e procedure', table, error ? 'warn' : 'ok', error ? error.message : `Accessibile · ${ms} ms`);
        } catch(e) {
          add(report, 'Step 15 · Dati e procedure', table, 'warn', e.message || String(e));
        }
      }
    }

    add(report, 'Step 15 · Dati e procedure', 'Backup completo', typeof window.esportaBackupDatabaseLocale === 'function' ? 'ok' : 'error', 'Disponibilità funzione di backup locale ZIP');
    add(report, 'Step 15 · Dati e procedure', 'Import con simulazione', typeof window.analizzaImportGuidato === 'function' ? 'ok' : 'warn', typeof window.analizzaImportGuidato === 'function' ? 'Simulazione preventiva disponibile' : 'Apri Migrazione per caricare il modulo guidato');
    add(report, 'Step 15 · Dati e procedure', 'Checklist / Prepara corso', typeof window.buildSafetyCourseChecklist === 'function' && typeof window.apriPreparazioneCorso === 'function' ? 'ok' : 'warn', 'Controllo preventivo prima di stampa e chiusura');
    if(window.SafetyStep67){
      const sample=window.SafetyStep67.evaluateCourse({id:'collaudo',codice:'TEST',corso_id:Object.keys(window.DB_CORSI||{})[0]||'',azienda_id:'test',data_inizio:'2020-01-01',data_esame:'2020-01-02',sede:'Test',resp_progetto:'Test',resp_corso:'Test',docente_principale:'Test',stato_corso:'svolto'},[{id:'isc-test',percentuale_frequenza:100,esito:'Idoneo',voto_test:30,id_certificato:'TEST-001',data_scadenza:'2030-01-01',corsisti:{nome_cognome:'Collaudo',cf:'TEST',lingua_test_stato:'non_richiesto'}}],{completionItems:[{progetto_id:'collaudo',iscrizione_id:'isc-test',item_key:'final_test',mode:'paper',activity_status:'completed',recording_status:'recorded',evidence_status:'paper_original'}],effectivenessChecks:[{status:'not_applicable'}]});
      const separated=sample.daAcquisire.some(i=>i.itemKey==='final_test')&&!sample.errori.some(i=>i.itemKey==='final_test');
      add(report,'Step 67 · Chiusura intelligente','Cartaceo distinto dal digitale',separated?'ok':'error',separated?'Test svolto e registrato: classificato come evidenza da acquisire, non come attività mancante.':'Separazione attività/registrazione/evidenza non verificata.');
      add(report,'Step 67 · Chiusura intelligente','Compatibilità stato_corso',sample.statoCorsoLegacy==='svolto'?'ok':'error',`Stato legacy: ${sample.statoCorsoLegacy}`);
    }else add(report,'Step 67 · Chiusura intelligente','Motore Step 67','warn','Modulo non ancora caricato. Ricarica la Dashboard.');

    window.collaudoReport = report;
    updateSummary(report);
    renderExtra(report);
    if (typeof lucide !== 'undefined') lucide.createIcons();
  };
})();
