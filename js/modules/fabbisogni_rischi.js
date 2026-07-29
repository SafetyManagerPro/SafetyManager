// Step 60 - Analisi fabbisogni formativi e schede rischi per settore.
// I cataloghi riprendono la modulistica "Formazione SSL" fornita come riferimento.

window.FABBISOGNI_FONTI = {
    dvr: 'Documento di Valutazione dei Rischi (DVR)',
    sopralluoghi: 'Sopralluoghi e osservazioni sul lavoro',
    riunioni: 'Riunioni con datore di lavoro, RSPP, RLS/RLST o preposti',
    infortuni_near_miss: 'Infortuni, mancati infortuni e non conformità',
    formazione_pregressa: 'Percorsi formativi e attestati già posseduti',
    segnalazioni: 'Segnalazioni o esigenze espresse da lavoratori/RLS/preposti'
};

window.FABBISOGNI_NECESSITA = {
    nuovi_lavoratori: 'Inserimento di nuovi lavoratori',
    cambio_mansione: 'Cambio mansione, ruolo o responsabilità',
    nuove_attrezzature: 'Introduzione di nuove macchine, attrezzature o tecnologie',
    infortuni_near_miss: 'Infortuni o quasi infortuni recenti',
    segnalazioni: 'Reclami, segnalazioni o richieste dei lavoratori/RLS/preposti',
    nuove_procedure: 'Nuove procedure, processi o sistemi gestionali',
    aggiornamento_competenze: 'Aggiornamento o rafforzamento delle competenze',
    altro: 'Altra esigenza formativa'
};

window.RISK_SECTOR_CATALOG = {
    uffici: {
        label: 'Uffici e attività amministrative',
        level: 'Rischio basso',
        ateco: ['62', '63', '64', '65', '66', '68', '69', '70', '71', '72', '73', '74', '82', '84'],
        keywords: ['ufficio', 'amministr', 'studio professionale', 'servizi'],
        risks: [
            ['vd_t', 'Uso di videoterminali (VDT)', 'Affaticamento visivo e disturbi muscolo-scheletrici dovuti a postura o posizione non corretta di monitor e tastiera.'],
            ['postura', 'Postura seduta prolungata', 'Possibili lombalgie, cervicalgie e disturbi circolatori dovuti alla mancanza di movimento.'],
            ['microclima', 'Microclima e qualità dell’aria', 'Temperatura, umidità, correnti d’aria o manutenzione dei filtri inadeguate.'],
            ['elettrico', 'Rischio elettrico', 'Cavi, multiprese sovraccariche e apparecchiature che possono surriscaldarsi o andare in corto.'],
            ['illuminazione', 'Illuminazione', 'Riflessi sul monitor o luce insufficiente/eccessiva con maggiore affaticamento visivo.'],
            ['cadute', 'Cadute e inciampi', 'Pavimenti scivolosi, cavi nei passaggi o cassetti lasciati aperti.'],
            ['incendio', 'Incendio', 'Accumulo di carta, archivi e presenza di apparecchiature elettriche.'],
            ['stress', 'Stress lavoro-correlato', 'Scadenze, carichi di lavoro, monotonia o conflitti interpersonali.'],
            ['rumore', 'Rumore di fondo', 'Open space, stampanti, telefoni e ventilazione possono ridurre la concentrazione.'],
            ['aggressioni', 'Aggressioni e violenze', 'Possibile violenza verbale o fisica negli uffici aperti al pubblico.'],
            ['biologico', 'Rischio biologico', 'Maggiore esposizione a infezioni respiratorie per il contatto con il pubblico.'],
            ['stress_pubblico', 'Stress da contatto con il pubblico', 'Carico mentale dovuto alla gestione di reclami e conflitti.'],
            ['esodo', 'Emergenza ed esodo', 'Gestione dell’evacuazione di persone che non conoscono le vie di fuga.'],
            ['rapina', 'Rapina o furto', 'Rischio per uffici che gestiscono valori, contanti o documenti sensibili.'],
            ['affollamento', 'Rumore e affollamento', 'Brusio e affluenza possono causare stanchezza mentale e perdita di concentrazione.']
        ]
    },
    estetica: {
        label: 'Estetica e trattamenti alla persona',
        level: 'Rischio basso',
        ateco: ['96.02.02', '96.22'],
        keywords: ['estetica', 'estetista', 'beauty', 'unghie'],
        risks: [
            ['biologico', 'Rischio biologico', 'Contatto con sangue o fluidi durante manicure, pedicure, depilazione e altri trattamenti.'],
            ['chimico', 'Rischio chimico', 'Solventi, colle, acidi e resine possono causare dermatiti, sensibilizzazioni e disturbi respiratori.'],
            ['roa', 'Radiazioni ottiche artificiali', 'Laser e luce pulsata possono causare danni oculari e ustioni cutanee.'],
            ['uv', 'Radiazioni UV', 'Lampade abbronzanti e fornetti per unghie possono causare eritemi e danni cutanei.'],
            ['postura', 'Disturbi muscolo-scheletrici', 'Posture statiche o reclinate prolungate gravano su schiena, collo e zona lombare.'],
            ['ripetitivi', 'Movimenti ripetitivi', 'Movimenti fini e continui di mano e polso possono causare tendiniti e tunnel carpale.'],
            ['elettrico', 'Rischio elettrico', 'Apparecchi alimentati a corrente utilizzati in presenza di acqua, oli o vapori.'],
            ['ustioni', 'Ustioni e calore', 'Cera, manipoli e vapore possono causare scottature a operatore e cliente.'],
            ['stress', 'Stress lavoro-correlato', 'Precisione richiesta, aspettative dei clienti e turni intensi.']
        ]
    },
    acconciatura: {
        label: 'Acconciatura',
        level: 'Rischio basso',
        ateco: ['96.02.01', '96.21'],
        keywords: ['acconciatura', 'parrucch', 'barbiere'],
        risks: [
            ['chimico', 'Rischio chimico', 'Tinture, decoloranti, lacche e prodotti per permanente possono causare dermatiti, irritazioni e asma.'],
            ['postura', 'Disturbi muscolo-scheletrici', 'Postura eretta prolungata e braccia sollevate durante taglio e piega.'],
            ['ripetitivi', 'Sforzi ripetitivi degli arti superiori', 'Uso continuo di forbici, spazzole e phon con rischio di tendiniti e tunnel carpale.'],
            ['tagli', 'Tagli e punture', 'Forbici, rasoi, sfilzini e aghi possono provocare ferite e contaminazione biologica.'],
            ['ustioni', 'Ustioni e calore', 'Piastre, ferri e acqua calda possono causare scottature.'],
            ['microclima', 'Umidità e microclima', 'Mani bagnate e ambiente umido favoriscono macerazione cutanea e micosi.'],
            ['elettrico', 'Rischio elettrico', 'Phon e tosatrici sono utilizzati in prossimità di lavatesta e zone umide.'],
            ['cadute', 'Scivolamento e caduta', 'Acqua, shampoo, oli e capelli possono rendere il pavimento scivoloso.'],
            ['stress', 'Stress lavoro-correlato', 'Appuntamenti serrati, clienti esigenti e lunghi turni in piedi.'],
            ['biologico', 'Rischio biologico', 'Contatto con cute e capelli, strumenti non igienizzati, tagli, microrganismi e trasmissione respiratoria.']
        ]
    },
    orafi: {
        label: 'Orafi e lavorazione metalli preziosi',
        level: 'Scheda di rischio - sintesi',
        ateco: ['32.12'],
        keywords: ['orafo', 'orafa', 'gioiell', 'metalli preziosi'],
        risks: [
            ['meccanici', 'Rischi meccanici', 'Parti in movimento, lame, punte o elementi rotanti e proiezione di materiale.', 'Tagli, schiacciamenti, trascinamenti, urti, ustioni e lesioni oculari.', 'Non rimuovere protezioni, usare correttamente i macchinari e segnalare guasti.', 'Macchine CE, manutenzione, scarpe, guanti e occhiali.'],
            ['chimico', 'Rischio chimico', 'Inalazione o contatto con prodotti chimici e corrosivi.', 'Irritazioni, ustioni e danni a pelle, occhi o vie respiratorie.', 'Usare i DPI e seguire le schede di sicurezza.', 'Schede di sicurezza, ventilazione, guanti, occhiali e protezione respiratoria.'],
            ['carichi', 'Movimentazione manuale dei carichi', 'Caduta o movimentazione impropria di materiali.', 'Urti, schiacciamenti e disturbi muscolo-scheletrici.', 'Movimentare correttamente e usare gli ausili disponibili.', 'Formazione, organizzazione del lavoro e DPI.'],
            ['cadute', 'Cadute e urti', 'Scivolamenti, cadute in piano e urti contro strutture.', 'Urti o lesioni agli arti.', 'Prestare attenzione e segnalare situazioni di pericolo.', 'Ordine, pulizia e calzature adeguate.'],
            ['elettrico', 'Rischio elettrico', 'Uso di macchine elettriche e impianti.', 'Folgorazione e ustioni.', 'Non intervenire sugli impianti e segnalare anomalie.', 'Impianti a norma, marcatura CE e manutenzione.'],
            ['incendio', 'Rischio incendio', 'Materiali o prodotti facilmente infiammabili.', 'Ustioni e intossicazione da fumo.', 'Mantenere libere le vie di fuga e conoscere le procedure.', 'Estintori, impianti, divieto di fumo e formazione emergenze.'],
            ['utensili', 'Uso di utensili', 'Uso improprio o utensili danneggiati.', 'Tagli, urti e schiacciamenti.', 'Usare utensili adeguati e in buono stato.', 'Manutenzione e DPI appropriati.']
        ]
    },
    tessile: {
        label: 'Tessile e confezioni',
        level: 'Scheda di rischio - sintesi',
        ateco: ['13', '14'],
        keywords: ['tessile', 'confezion', 'sartoria', 'filatura'],
        risks: [
            ['meccanici', 'Macchine tessili', 'Organi in movimento su telai, macchine da cucire, taglierine, cardatrici e rulli.', 'Schiacciamenti, tagli, amputazioni e intrappolamenti.', 'Usare le macchine solo se autorizzati e non rimuovere le protezioni.', 'Carter, arresti di emergenza, manutenzione, formazione e DPI.'],
            ['carichi', 'Movimentazione manuale dei carichi', 'Spostamento di rotoli, scatole e prodotti finiti.', 'Lombalgie, affaticamento e disturbi muscolo-scheletrici.', 'Sollevare correttamente e chiedere aiuto per pesi elevati.', 'Carrelli, formazione, organizzazione e DPI.'],
            ['ripetitivi', 'Ergonomia e movimenti ripetitivi', 'Attività ripetitive alla macchina da cucire o al confezionamento.', 'Disturbi a spalle, polsi e schiena.', 'Mantenere postura corretta e segnalare disagi.', 'Postazioni ergonomiche, pause e rotazione mansioni.'],
            ['polveri', 'Polveri tessili', 'Fibre e polveri nei reparti di filatura e lavorazione.', 'Irritazioni respiratorie e allergie.', 'Mantenere pulita la postazione.', 'Aspirazione, pulizia e protezione respiratoria.'],
            ['chimico', 'Rischio chimico', 'Coloranti, solventi e prodotti per trattamento tessuti.', 'Irritazioni cutanee e problemi respiratori.', 'Usare DPI e seguire le schede di sicurezza.', 'Ventilazione, guanti, occhiali e protezione respiratoria.'],
            ['taglio', 'Taglio e perforazione', 'Forbici industriali, cutter e macchine da taglio.', 'Ferite e lacerazioni.', 'Usare e riporre correttamente gli utensili.', 'Guanti antitaglio ove previsti e manutenzione.'],
            ['rumore', 'Rumore', 'Macchine tessili rumorose.', 'Danni all’udito e stress.', 'Usare gli otoprotettori nelle aree indicate.', 'Valutazione rumore, manutenzione e otoprotettori.'],
            ['cadute', 'Cadute e urti', 'Scivolamenti e urti contro strutture.', 'Urti e lesioni agli arti.', 'Prestare attenzione e segnalare pericoli.', 'Ordine e calzature adeguate.'],
            ['elettrico', 'Rischio elettrico', 'Macchine elettriche e impianti industriali.', 'Folgorazione e ustioni.', 'Non intervenire sugli impianti.', 'Impianti a norma, marcatura CE e manutenzione.'],
            ['incendio', 'Incendio', 'Materiali tessili facilmente infiammabili.', 'Ustioni e intossicazione da fumo.', 'Tenere libere le vie di fuga.', 'Presidi antincendio, divieto di fumo e formazione.']
        ]
    },
    pelletteria: {
        label: 'Pelletteria e lavorazione pelle',
        level: 'Scheda di rischio - sintesi',
        ateco: ['15'],
        keywords: ['pelletteria', 'pelle', 'cuoio', 'calzatur'],
        risks: [
            ['meccanici', 'Macchine e attrezzature', 'Organi in movimento e rulli di trascinamento.', 'Schiacciamenti, tagli, amputazioni e intrappolamenti.', 'Usare le macchine solo se autorizzati e non rimuovere protezioni.', 'Carter, arresti di emergenza, manutenzione, formazione e DPI.'],
            ['chimico', 'Sostanze chimiche', 'Solventi, colle e mastici.', 'Irritazioni, allergie e intossicazioni.', 'Indossare DPI e seguire le istruzioni dei prodotti.', 'Ventilazione, guanti, maschere e schede di sicurezza.'],
            ['polveri', 'Inalazione di polveri', 'Fibre e polveri della lavorazione della pelle.', 'Irritazioni respiratorie e allergie.', 'Mantenere pulita la postazione.', 'Aspirazione, pulizia e protezione respiratoria.'],
            ['ustioni', 'Ustioni', 'Contatto con superfici calde.', 'Ustioni superficiali o gravi.', 'Non toccare superfici calde senza protezione.', 'Segnaletica, DPI termici e formazione.'],
            ['rumore', 'Rumore', 'Trapani, presse e attrezzature rumorose.', 'Perdita uditiva e stress.', 'Usare cuffie o tappi auricolari.', 'Manutenzione e protezioni acustiche.'],
            ['carichi', 'Movimentazione manuale dei carichi', 'Spostamento di materiali e prodotti.', 'Disturbi muscolo-scheletrici e affaticamento.', 'Sollevare correttamente e chiedere aiuto.', 'Carrelli, formazione, organizzazione e DPI.'],
            ['tagli', 'Tagli e ferite', 'Manipolazione di lame e coltelli.', 'Ferite superficiali o profonde.', 'Maneggiare gli strumenti con attenzione.', 'Guanti resistenti, strumenti sicuri e formazione.'],
            ['cadute', 'Cadute e urti', 'Scivolamenti e urti contro strutture.', 'Urti e lesioni agli arti.', 'Prestare attenzione e segnalare pericoli.', 'Ordine e calzature adeguate.'],
            ['elettrico', 'Rischio elettrico', 'Macchine elettriche e impianti.', 'Folgorazione e ustioni.', 'Non intervenire sugli impianti.', 'Impianti a norma, marcatura CE e manutenzione.'],
            ['incendio', 'Incendio', 'Materiali e prodotti infiammabili.', 'Ustioni e intossicazione da fumo.', 'Tenere libere le vie di fuga.', 'Presidi antincendio, divieto di fumo e formazione.']
        ]
    },
    alloggio_ristorazione: {
        label: 'Alloggio e ristorazione',
        level: 'Rischio basso',
        ateco: ['55', '56'],
        keywords: ['hotel', 'albergo', 'ristor', 'bar ', 'cucina', 'alloggio'],
        risks: [
            ['tagli', 'Tagli, lesioni e punture', 'Coltelli, affettatrici, frullatori, stoviglie rotte e oggetti taglienti nei rifiuti o nella biancheria.'],
            ['cadute', 'Urti, inciampi e scivolamenti', 'Pavimenti bagnati o unti, passaggi ingombri, scale, cavi e tappeti.'],
            ['ustioni', 'Ustioni e scottature', 'Forni, piastre, fornelli, olio, vapore e liquidi caldi.'],
            ['biologico', 'Rischio biologico', 'Fluidi, rifiuti organici, servizi igienici, biancheria e alimenti crudi.'],
            ['chimico', 'Rischio chimico', 'Detergenti, disinfettanti e sgrassatori possono causare dermatiti e disturbi respiratori.'],
            ['carichi', 'Movimentazione dei carichi', 'Pentole, casse, mobili, valigie, carrelli e biancheria.'],
            ['microclima', 'Microclima e calore', 'Caldo e umidità nelle cucine e sbalzi con celle frigorifere.'],
            ['incendio', 'Incendio', 'Fiamme libere, gas, oli combustibili e sovraccarico elettrico.'],
            ['stress', 'Stress lavoro-correlato', 'Ore di punta, turni serali/notturni, festività, tempi camera e clienti difficili.'],
            ['postura', 'Postura incongrua', 'Permanenza prolungata in piedi per sala, cucina e reception.'],
            ['muscolo', 'Disturbi muscolo-scheletrici', 'Rifacimento letti, spostamento di mobili e posture fisse.'],
            ['ripetitivi', 'Sforzi ripetitivi', 'Movimenti continui per pulire superfici, vetri e specchi.'],
            ['isolato', 'Lavoro isolato', 'Difficoltà nel chiedere soccorso in camere, piani o turni con presenza ridotta.'],
            ['notturno', 'Lavoro notturno', 'Alterazioni del sonno, affaticamento, disturbi metabolici/cardiovascolari e calo dell’attenzione.']
        ]
    },
    altro: {
        label: 'Altro settore / scheda personalizzata',
        level: 'Da definire dal DVR',
        ateco: [],
        keywords: [],
        risks: []
    }
};

window.step60Array = function(value) {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
        return String(value).split(',').map(v => v.trim()).filter(Boolean);
    }
};

window.getRiskSector = function(id) {
    return window.RISK_SECTOR_CATALOG[id] || window.RISK_SECTOR_CATALOG.altro;
};

window.suggestRiskSectorForCompany = function(company = {}) {
    const ateco = String(company.ateco || '').trim().toLowerCase();
    const haystack = `${company.ragione_sociale || ''} ${company.attivita || ''}`.toLowerCase();
    for (const [id, sector] of Object.entries(window.RISK_SECTOR_CATALOG)) {
        if (id === 'altro') continue;
        if ((sector.ateco || []).some(prefix => ateco.startsWith(String(prefix).toLowerCase()))) return id;
        if ((sector.keywords || []).some(keyword => haystack.includes(keyword))) return id;
    }
    return 'altro';
};

window.renderRiskChecklistForProject = function(selectedIds = null) {
    const container = document.getElementById('prog-rischi-list');
    const select = document.getElementById('prog-rischi-settore');
    if (!container || !select) return;
    const sector = window.getRiskSector(select.value);
    const selected = selectedIds === null
        ? new Set((sector.risks || []).map(r => r[0]))
        : new Set(window.step60Array(selectedIds));

    if (!sector.risks.length) {
        container.innerHTML = '<p class="col-span-full text-[10px] text-slate-500 italic">Nessun rischio predefinito: inserisci i rischi ricavati dal DVR nel campo personalizzato.</p>';
    } else {
        container.innerHTML = sector.risks.map(risk => `
            <label class="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-2 text-[10px] leading-snug">
                <input type="checkbox" class="prog-rischio-item mt-0.5 rounded border-slate-300" value="${window.dashEscape(risk[0])}" ${selected.has(risk[0]) ? 'checked' : ''}>
                <span><strong class="text-slate-800">${window.dashEscape(risk[1])}</strong><span class="block text-slate-500 mt-0.5">${window.dashEscape(risk[2])}</span></span>
            </label>`).join('');
    }
    const meta = document.getElementById('prog-rischi-settore-meta');
    if (meta) meta.textContent = `${sector.level} · ${(sector.risks || []).length} rischi disponibili`;
};

window.onRiskSectorChange = function() {
    window.renderRiskChecklistForProject(null);
};

window.selectAllProjectRisks = function(checked = true) {
    document.querySelectorAll('.prog-rischio-item').forEach(el => { el.checked = checked; });
};

window.initFabbisogniProjectForm = function(options = {}) {
    const sectorSelect = document.getElementById('prog-rischi-settore');
    if (!sectorSelect) return;
    if (!sectorSelect.options.length) {
        sectorSelect.innerHTML = Object.entries(window.RISK_SECTOR_CATALOG)
            .map(([id, sector]) => `<option value="${id}">${window.dashEscape(sector.label)} · ${window.dashEscape(sector.level)}</option>`)
            .join('');
    }

    const currentCompany = (window.aziendeList || []).find(a => a.id === document.getElementById('prog-azienda')?.value) || {};
    if (!sectorSelect.value || options.forceSuggestion) {
        sectorSelect.value = window.suggestRiskSectorForCompany(currentCompany);
    }
    if (options.forceSuggestion || !document.querySelector('.prog-rischio-item')) window.renderRiskChecklistForProject(null);

    const dateInput = document.getElementById('prog-fabbisogni-data');
    if (dateInput && !dateInput.value) dateInput.value = new Date().toISOString().slice(0, 10);
    const unitInput = document.getElementById('prog-fabbisogni-unita');
    if (unitInput && !unitInput.value) unitInput.value = currentCompany.sede_operativa || currentCompany.indirizzo || '';
    const activityInput = document.getElementById('prog-fabbisogni-attivita');
    if (activityInput && !activityInput.value && currentCompany.ateco) activityInput.value = `Attività riferita al codice ATECO ${currentCompany.ateco}`;
};

window.refreshFabbisogniForCompany = function() {
    const sectorSelect = document.getElementById('prog-rischi-settore');
    if (!sectorSelect) return;
    const editing = !!document.getElementById('prog-id')?.value;
    const hasManualSelection = !!sectorSelect.dataset.userSelected;
    if (!editing && !hasManualSelection) {
        const company = (window.aziendeList || []).find(a => a.id === document.getElementById('prog-azienda')?.value) || {};
        sectorSelect.value = window.suggestRiskSectorForCompany(company);
        window.renderRiskChecklistForProject(null);
        const unit = document.getElementById('prog-fabbisogni-unita');
        if (unit) unit.value = company.sede_operativa || company.indirizzo || '';
        const activity = document.getElementById('prog-fabbisogni-attivita');
        if (activity) activity.value = company.ateco ? `Attività riferita al codice ATECO ${company.ateco}` : '';
    }
};

window.collectFabbisogniProjectRecord = function() {
    const values = selector => Array.from(document.querySelectorAll(selector))
        .filter(el => el.checked)
        .map(el => el.value);
    return {
        fabbisogni_data: document.getElementById('prog-fabbisogni-data')?.value || null,
        fabbisogni_unita_locale: (document.getElementById('prog-fabbisogni-unita')?.value || '').trim() || null,
        fabbisogni_attivita: (document.getElementById('prog-fabbisogni-attivita')?.value || '').trim() || null,
        fabbisogni_fonti: values('.prog-fabbisogni-fonte'),
        fabbisogni_necessita: values('.prog-fabbisogni-necessita'),
        fabbisogni_esigenza_altro: (document.getElementById('prog-fabbisogni-altro')?.value || '').trim() || null,
        fabbisogni_ruolo: (document.getElementById('prog-fabbisogni-ruolo')?.value || '').trim() || null,
        fabbisogni_competenze_ingresso: (document.getElementById('prog-fabbisogni-ingresso')?.value || '').trim() || null,
        fabbisogni_competenze_richieste: (document.getElementById('prog-fabbisogni-richieste')?.value || '').trim() || null,
        fabbisogni_gap: (document.getElementById('prog-fabbisogni-gap')?.value || '').trim() || null,
        fabbisogni_lingua: document.getElementById('prog-fabbisogni-lingua')?.value || 'da_verificare',
        fabbisogni_note: (document.getElementById('prog-fabbisogni-note')?.value || '').trim() || null,
        fabbisogni_accettato: !!document.getElementById('prog-fabbisogni-accettato')?.checked,
        rischi_settore_id: document.getElementById('prog-rischi-settore')?.value || 'altro',
        rischi_selezionati: values('.prog-rischio-item'),
        rischi_personalizzati: (document.getElementById('prog-rischi-personalizzati')?.value || '').trim() || null
    };
};

window.populateFabbisogniProjectForm = function(project = {}) {
    window.initFabbisogniProjectForm();
    const set = (id, value = '') => {
        const el = document.getElementById(id);
        if (el) el.value = value ?? '';
    };
    set('prog-fabbisogni-data', project.fabbisogni_data || '');
    set('prog-fabbisogni-unita', project.fabbisogni_unita_locale || '');
    set('prog-fabbisogni-attivita', project.fabbisogni_attivita || '');
    set('prog-fabbisogni-altro', project.fabbisogni_esigenza_altro || '');
    set('prog-fabbisogni-ruolo', project.fabbisogni_ruolo || '');
    set('prog-fabbisogni-ingresso', project.fabbisogni_competenze_ingresso || '');
    set('prog-fabbisogni-richieste', project.fabbisogni_competenze_richieste || '');
    set('prog-fabbisogni-gap', project.fabbisogni_gap || '');
    set('prog-fabbisogni-lingua', project.fabbisogni_lingua || 'da_verificare');
    set('prog-fabbisogni-note', project.fabbisogni_note || '');
    set('prog-rischi-personalizzati', project.rischi_personalizzati || '');

    const sources = new Set(window.step60Array(project.fabbisogni_fonti));
    const needs = new Set(window.step60Array(project.fabbisogni_necessita));
    document.querySelectorAll('.prog-fabbisogni-fonte').forEach(el => { el.checked = sources.has(el.value); });
    document.querySelectorAll('.prog-fabbisogni-necessita').forEach(el => { el.checked = needs.has(el.value); });
    const accepted = document.getElementById('prog-fabbisogni-accettato');
    if (accepted) accepted.checked = project.fabbisogni_accettato === true;

    const sectorSelect = document.getElementById('prog-rischi-settore');
    if (sectorSelect) {
        sectorSelect.value = project.rischi_settore_id || 'altro';
        sectorSelect.dataset.userSelected = project.rischi_settore_id ? '1' : '';
    }
    window.renderRiskChecklistForProject(window.step60Array(project.rischi_selezionati));
};

window.resetFabbisogniProjectForm = function() {
    const sectorSelect = document.getElementById('prog-rischi-settore');
    if (sectorSelect) sectorSelect.dataset.userSelected = '';
    document.querySelectorAll('.prog-fabbisogni-fonte,.prog-fabbisogni-necessita,.prog-rischio-item').forEach(el => { el.checked = false; });
    const accepted = document.getElementById('prog-fabbisogni-accettato');
    if (accepted) accepted.checked = false;
    window.initFabbisogniProjectForm({ forceSuggestion: true });
    window.renderRiskChecklistForProject(null);
    const dvr = document.querySelector('.prog-fabbisogni-fonte[value="dvr"]');
    if (dvr) dvr.checked = true;
};

window.getFabbisogniStatus = function(project = {}) {
    const fields = [
        project.fabbisogni_data,
        project.fabbisogni_ruolo,
        project.fabbisogni_competenze_ingresso,
        project.fabbisogni_competenze_richieste,
        project.fabbisogni_gap,
        project.rischi_settore_id
    ];
    const completed = fields.filter(Boolean).length;
    return {
        completed,
        total: fields.length,
        ready: completed === fields.length && window.step60Array(project.rischi_selezionati).length > 0
    };
};

window.setFabbisogniPrintState = function(project = {}) {
    const map = {
        'cfg-fabbisogni-data': project.fabbisogni_data || '',
        'cfg-fabbisogni-unita': project.fabbisogni_unita_locale || '',
        'cfg-fabbisogni-attivita': project.fabbisogni_attivita || '',
        'cfg-fabbisogni-fonti': JSON.stringify(window.step60Array(project.fabbisogni_fonti)),
        'cfg-fabbisogni-necessita': JSON.stringify(window.step60Array(project.fabbisogni_necessita)),
        'cfg-fabbisogni-altro': project.fabbisogni_esigenza_altro || '',
        'cfg-fabbisogni-ruolo': project.fabbisogni_ruolo || '',
        'cfg-fabbisogni-ingresso': project.fabbisogni_competenze_ingresso || '',
        'cfg-fabbisogni-richieste': project.fabbisogni_competenze_richieste || '',
        'cfg-fabbisogni-gap': project.fabbisogni_gap || '',
        'cfg-fabbisogni-lingua': project.fabbisogni_lingua || 'da_verificare',
        'cfg-fabbisogni-note': project.fabbisogni_note || '',
        'cfg-fabbisogni-accettato': project.fabbisogni_accettato === true ? 'SI' : 'DA VALIDARE',
        'cfg-rischi-settore': project.rischi_settore_id || 'altro',
        'cfg-rischi-selezionati': JSON.stringify(window.step60Array(project.rischi_selezionati)),
        'cfg-rischi-personalizzati': project.rischi_personalizzati || ''
    };
    Object.assign(window.AppState, map);
};

window.applyFabbisogniPrintFields = function() {
    const esc = window.dashEscape || (v => String(v ?? ''));
    const setText = (selector, value, fallback = '---') => {
        document.querySelectorAll(selector).forEach(el => { el.textContent = value || fallback; });
    };
    const setHtml = (selector, value, fallback = '<span class="text-slate-400">Non indicato</span>') => {
        document.querySelectorAll(selector).forEach(el => { el.innerHTML = value || fallback; });
    };

    const sources = window.step60Array(window.getVal('cfg-fabbisogni-fonti', '[]'));
    const needs = window.step60Array(window.getVal('cfg-fabbisogni-necessita', '[]'));
    const sectorId = window.getVal('cfg-rischi-settore', 'altro');
    const sector = window.getRiskSector(sectorId);
    const selectedIds = new Set(window.step60Array(window.getVal('cfg-rischi-selezionati', '[]')));
    const selectedRisks = (sector.risks || []).filter(r => selectedIds.has(r[0]));
    const customRisks = String(window.getVal('cfg-rischi-personalizzati', '') || '')
        .split(/\r?\n/)
        .map(v => v.trim())
        .filter(Boolean);

    const sourceHtml = sources.map(id => `<li>☑ ${esc(window.FABBISOGNI_FONTI[id] || id)}</li>`).join('');
    const needsHtml = needs.map(id => `<li>☑ ${esc(window.FABBISOGNI_NECESSITA[id] || id)}</li>`).join('');
    const riskNames = selectedRisks.map(r => r[1]).concat(customRisks);

    setText('.val-fabbisogni-data', window.formatDataToItalian(window.getVal('cfg-fabbisogni-data', '')));
    setText('.val-fabbisogni-unita', window.getVal('cfg-fabbisogni-unita'));
    setText('.val-fabbisogni-attivita', window.getVal('cfg-fabbisogni-attivita'));
    setText('.val-fabbisogni-ruolo', window.getVal('cfg-fabbisogni-ruolo'));
    setText('.val-fabbisogni-ingresso', window.getVal('cfg-fabbisogni-ingresso'));
    setText('.val-fabbisogni-richieste', window.getVal('cfg-fabbisogni-richieste'));
    setText('.val-fabbisogni-gap', window.getVal('cfg-fabbisogni-gap'));
    setText('.val-fabbisogni-note', window.getVal('cfg-fabbisogni-note'));
    setText('.val-fabbisogni-accettato', window.getVal('cfg-fabbisogni-accettato', 'DA VALIDARE'));
    setText('.val-fabbisogni-altro', window.getVal('cfg-fabbisogni-altro'));
    setText('.val-rischi-settore', `${sector.label} · ${sector.level}`);
    setText('.val-rischi-count', String(riskNames.length), '0');
    setText('.val-rischi-summary', riskNames.join(', '), 'Rischi da definire sulla base del DVR');
    setHtml('.val-fabbisogni-fonti-list', sourceHtml);
    setHtml('.val-fabbisogni-necessita-list', needsHtml);
    setText('.val-fabbisogni-fonti-inline', sources.map(id => window.FABBISOGNI_FONTI[id] || id).join(', '));
    setText('.val-fabbisogni-necessita-inline', needs.map(id => window.FABBISOGNI_NECESSITA[id] || id).join(', '));

    const linguaLabels = {
        adeguata: 'Comprensione della lingua italiana adeguata',
        supporto: 'Previsto supporto linguistico, mediatore o traduttore',
        test: 'Necessario test di comprensione della lingua italiana',
        da_verificare: 'Comprensione della lingua italiana da verificare'
    };
    setText('.val-fabbisogni-lingua', linguaLabels[window.getVal('cfg-fabbisogni-lingua')] || linguaLabels.da_verificare);

    const riskRows = selectedRisks.map(r => `
        <tr>
            <td>${esc(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3] || 'Da dettagliare nel DVR')}</td>
            <td>${esc(r[4] || 'Applicare procedure e istruzioni aziendali')}</td><td>${esc(r[5] || 'Misure e DPI definiti dal DVR')}</td>
        </tr>`).concat(customRisks.map(text => `
        <tr><td>${esc(text)}</td><td>Rischio personalizzato rilevato dall’azienda/DVR.</td><td>Da valutare.</td><td>Secondo procedure aziendali.</td><td>Secondo DVR.</td></tr>`)).join('');
    setHtml('.val-rischi-table', riskRows, '<tr><td colspan="5" class="text-center italic">Nessun rischio selezionato.</td></tr>');

    const gap = window.getVal('cfg-fabbisogni-gap') || 'Percorso formativo previsto dal progetto';
    const participantRows = (window.currentSessionCorsisti || []).map((c, index) => `
        <tr><td>${index + 1}</td><td>${esc(c.nome || '')}</td><td>${esc(c.cf || '')}</td><td>${esc(c.mansione || '')}</td><td>${esc(gap)}</td></tr>`).join('');
    setHtml('.val-fabbisogni-destinatari-table', participantRows, '<tr><td colspan="5" class="text-center italic">Corsisti da associare al progetto.</td></tr>');

    const summaryParts = [
        window.getVal('cfg-fabbisogni-ruolo') ? `Ruolo: ${window.getVal('cfg-fabbisogni-ruolo')}` : '',
        window.getVal('cfg-fabbisogni-gap') ? `Gap: ${window.getVal('cfg-fabbisogni-gap')}` : '',
        riskNames.length ? `Rischi selezionati: ${riskNames.length}` : ''
    ].filter(Boolean);
    setText('.val-fabbisogni-summary', summaryParts.join(' · '), 'Analisi da completare');
};

window.renderNeedsRiskAnnexPages = async function(options = {}) {
    if (typeof window.renderPrintModulePages !== 'function') return [];
    const preview = !!options.preview;
    const analysisPages = await window.renderPrintModulePages('analisi_fabbisogni', null, {
        preview,
        includeProjectFormativoTests: false,
        includeFascicoloTests: false,
        includeNeedsRiskAnnexes: false
    });
    const riskPages = await window.renderPrintModulePages('scheda_rischi_settore', null, {
        preview,
        includeProjectFormativoTests: false,
        includeFascicoloTests: false,
        includeNeedsRiskAnnexes: false
    });
    return [...analysisPages, ...riskPages];
};
