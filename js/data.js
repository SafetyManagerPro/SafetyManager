// js/data.js

// ==========================================
// DATABASE CORSI E SYLLABUS ANALITICO (INTEGRATO CON D.LGS 81/08 E NUOVO ASR 2025)
// ==========================================
// ==========================================
// REGOLE DI COMPLIANCE ASR 17/04/2025
// ==========================================
window.ASR2025_POLICY = {
    riferimento: 'Accordo Stato-Regioni 17 aprile 2025, Rep. atti n. 59/CSR',
    riferimentoDlgs: 'D.Lgs. 81/08, artt. 37, 32, 34 e 73 ove applicabili',
    frequenzaMinimaPercentuale: 90,
    maxDiscentiAula: 30,
    rapportoDocentePratico: '1 docente ogni 6 discenti nelle attività pratiche',
    conservazioneFascicoloAnni: 10,
    modalitaAmmesse: ['Presenza fisica', 'Videoconferenza sincrona', 'E-learning', 'Mista'],
    notaEnte: 'Associazione sindacale di categoria / struttura di diretta emanazione: verificare e conservare autocertificazione dei requisiti di rappresentatività ex DPR 445/2000 fino alla piena operatività del repertorio.',
    notaAzienda: 'Il datore di lavoro può organizzare direttamente la formazione solo per propri lavoratori, preposti e dirigenti, con docenti qualificati e richiesta agli Organismi Paritetici ove presenti.'
};

// Mappa operativa delle modalità: evita che in fase di progetto vengano scelti canali non coerenti.
// La piattaforma non sostituisce la verifica legale: per i corsi con prove pratiche o norme speciali
// viene applicato un criterio prudenziale di presenza fisica.
window.CORSI_PRESENZA_OBBLIGATORIA = [
    'amb_confinati', 'lav_quota',
    'attr_carrelli_ind', 'attr_carrelli_all', 'attr_ple', 'attr_mmt_esc', 'attr_mmt_all',
    'attr_gru_autocarro', 'attr_gru_torre', 'attr_pompe', 'attr_trattori',
    'primo_soccorso_12h', 'antincendio_liv2',
    'agg_primo_soccorso_4h', 'agg_antincendio_liv2_5h', 'agg_pratico_4h'
];

window.isCorsoPresenzaObbligatoria = function(corsoId) {
    const id = corsoId || '';
    return window.CORSI_PRESENZA_OBBLIGATORIA.includes(id) || id.startsWith('attr_');
};

window.getModalitaCompliance = function(corsoId, modalita) {
    const mode = (modalita || '').toLowerCase();
    const presenzaFisica = mode.includes('presenza');
    const eLearning = mode.includes('learning') || mode.includes('fad');
    const vcs = mode.includes('videoconferenza');
    const mista = mode.includes('mista') || mode.includes('blended');

    if (!corsoId) return { ok: true, level: 'info', message: 'Seleziona un corso per verificare la modalità di erogazione.' };

    if (window.isCorsoPresenzaObbligatoria(corsoId) && !presenzaFisica) {
        return {
            ok: false,
            level: 'error',
            message: 'Per questo corso è impostata una regola prudenziale di presenza fisica obbligatoria, perché sono previste esercitazioni, addestramento, attrezzature, emergenze o verifiche pratiche.'
        };
    }

    if (eLearning || vcs || mista) {
        return {
            ok: true,
            level: 'warning',
            message: 'Modalità ammessa solo se prevista per il percorso specifico e se sono garantiti tracciabilità, identificazione dei partecipanti, interazione, tutoraggio e verifiche secondo l’Accordo.'
        };
    }

    return { ok: true, level: 'ok', message: 'Modalità in presenza fisica: compatibile con i limiti generali, salvo requisiti specifici del corso.' };
};

window.getErogatoreCompliance = function(corsoId, erogatore) {
    if (erogatore === 'azienda') {
        return {
            level: 'warning',
            message: 'Datore di lavoro soggetto formatore: conservare evidenza che i discenti sono propri lavoratori/preposti/dirigenti e gestire la richiesta agli Organismi Paritetici ove presenti.'
        };
    }
    return {
        level: 'warning',
        message: 'Associazione/ente: conservare requisiti, autocertificazione DPR 445/2000 ove applicabile e prova della diretta emanazione se si opera tramite struttura collegata.'
    };
};


window.getCourseCompliance = function(corsoId, modalita, erogatore) {
    const corso = window.DB_CORSI && window.DB_CORSI[corsoId] ? window.DB_CORSI[corsoId] : null;
    const id = corsoId || '';
    const pratico = window.isCorsoPresenzaObbligatoria ? window.isCorsoPresenzaObbligatoria(id) : (id.startsWith('attr_') || id.includes('quota') || id.includes('confinati'));
    const updateBiennale = id === 'agg_prep';
    const updateQuinquennale = id.startsWith('agg_lav') || id === 'agg_dir' || id === 'agg_dl' || id === 'agg_dl_spp' || id === 'agg_pratico_4h';
    const note = [];
    note.push('Frequenza minima per ammissione alla verifica finale: 90% del monte ore.');
    note.push('Numero massimo discenti: 30 per corso, salvo e-learning.');
    if (pratico) note.push('Modulo con componente pratica o norma speciale: criterio prudenziale di presenza fisica, rapporto docente/discente 1:6 nelle esercitazioni pratiche e conservazione dichiarazione area/attrezzature/DPI.');
    if (updateBiennale) note.push('Aggiornamento preposto: cadenza biennale, durata minima 6 ore.');
    else if (updateQuinquennale) note.push('Aggiornamento: verificare la periodicità specifica prevista dal profilo formativo.');
    if (corso && corso.scad && corso.scad !== 99) note.push('Scadenza attestato calcolata automaticamente su ' + corso.scad + ' anni dalla data di verifica finale.');

    const modalitaCheck = window.getModalitaCompliance ? window.getModalitaCompliance(corsoId, modalita || '') : { ok: true, message: '' };
    if (modalitaCheck.message) note.push('Modalità: ' + modalitaCheck.message);
    const erogatoreCheck = window.getErogatoreCompliance ? window.getErogatoreCompliance(corsoId, erogatore || 'ente') : null;
    if (erogatoreCheck) note.push('Soggetto formatore: ' + erogatoreCheck.message);

    return { pratico, updateBiennale, updateQuinquennale, modalitaCheck, note };
};

window.DB_CORSI = {
    lav_basso: { t: "Formazione Lavoratori - Rischio Basso", ore: 8, scad: 5, risk: "RB", code: "FL", norma: "D.Lgs. 81/08 Art. 37 commi 1 e 3 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 4, m: "Modulo Formazione Generale", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Concetti di pericolo, rischio e danno.</li><li>Prevenzione e protezione.</li><li>Organizzazione della prevenzione aziendale e il sistema di partecipazione dei lavoratori e dei loro rappresentanti previsto dal D. Lgs. 81 del 2008.</li><li>Diritti, doveri e sanzioni per i vari soggetti aziendali.</li><li>Organi di vigilanza, controllo e assistenza.</li></ul>" },
        { ud: "UD2", ore: 4, m: "Modulo Formazione Specifica (R. Basso)", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Rischi infortunistici, meccanici generali ed elettrici generali.</li><li>Macchine, attrezzature e cadute dall'alto.</li><li>Rischi da esplosione, rischi chimici, cancerogeni, biologici e fisici.</li><li>Videoterminali, DPI, ambienti di lavoro e stress lavoro-correlato.</li><li>Emergenze, procedure di sicurezza, esodo, incendi e primo soccorso.</li></ul>" }
    ]},
    lav_medio: { t: "Formazione Lavoratori - Rischio Medio", ore: 12, scad: 5, risk: "RM", code: "FL", norma: "D.Lgs. 81/08 Art. 37 commi 1 e 3 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 4, m: "Modulo Formazione Generale", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Concetti di pericolo, rischio e danno; prevenzione e protezione.</li><li>Organizzazione della prevenzione aziendale e il sistema di partecipazione.</li><li>Diritti, doveri e sanzioni per i vari soggetti aziendali.</li><li>Organi di vigilanza, controllo e assistenza.</li></ul>" },
        { ud: "UD2", ore: 4, m: "Modulo Specifica (Infortuni e Attrezzature)", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Rischi infortunistici, meccanici generali ed elettrici generali.</li><li>Macchine, attrezzature e cadute dall'alto.</li><li>Rischi da esplosione.</li><li>Videoterminali, DPI e ambienti di lavoro.</li></ul>" },
        { ud: "UD3", ore: 4, m: "Modulo Specifica (Salute ed Emergenze)", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Rischi chimici, cancerogeni, mutageni e biologici.</li><li>Rischi fisici (rumore, vibrazione, radiazioni, microclima).</li><li>Fattori psicosociali, stress lavoro-correlato e movimentazione carichi.</li><li>Emergenze, esodo, primo soccorso e incidenti mancati.</li></ul>" }
    ]},
    lav_alto: { t: "Formazione Lavoratori - Rischio Alto", ore: 16, scad: 5, risk: "RA", code: "FL", norma: "D.Lgs. 81/08 Art. 37 commi 1 e 3 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 4, m: "Modulo Formazione Generale", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Concetti di pericolo, rischio, danno, prevenzione e protezione.</li><li>Organizzazione della prevenzione aziendale e il sistema di partecipazione previsto dal D. Lgs. 81/2008.</li><li>Diritti, doveri e sanzioni per i vari soggetti aziendali.</li><li>Organi di vigilanza, controllo e assistenza.</li></ul>" },
        { ud: "UD2", ore: 4, m: "Modulo Specifica (Rischi Infortunistici)", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Rischi infortunistici, meccanici generali ed elettrici generali.</li><li>Macchine, attrezzature e cadute dall'alto.</li><li>Rischi da esplosione e rischio incendio.</li><li>Dispositivi di Protezione Individuale (DPI).</li></ul>" },
        { ud: "UD3", ore: 4, m: "Modulo Specifica (Rischi Salute / Igiene)", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Rischi connessi all'impiego di agenti chimici, cancerogeni e mutageni.</li><li>Rischi biologici e fisici (rumore, vibrazioni, campi elettromagnetici).</li><li>Movimentazione manuale carichi e movimentazione merci.</li><li>Rischi da fattori psicosociali e stress lavoro-correlato.</li></ul>" },
        { ud: "UD4", ore: 4, m: "Modulo Specifica (Procedure ed Emergenze)", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Le procedure di sicurezza con riferimento al profilo di rischio specifico.</li><li>Ambienti di lavoro e videoterminali.</li><li>Procedure organizzative per l'esodo, gli incendi e il primo soccorso.</li><li>Gestione di incidenti e infortuni mancati.</li></ul>" }
    ]},
    dl_base: { t: "Datore di Lavoro - Corso Base (16h)", ore: 16, scad: 5, risk: "DL", code: "DL", norma: "D.Lgs. 81/08 Art. 34 commi 2 e 3 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 8, m: "Modulo Giuridico normativo", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Il sistema legislativo in materia di salute e sicurezza dei lavoratori.</li><li>L'identificazione e il ruolo del datore di lavoro nel contesto organizzativo.</li><li>I soggetti del sistema di prevenzione aziendale secondo il d.lgs. n. 81/2008: compiti, obblighi e responsabilità.</li><li>La delega di funzioni: condizioni e limiti.</li><li>La responsabilità civile, penale e amministrativa ai sensi del d.lgs. n. 231/2001.</li><li>Prevenzione della violenza e molestie (Documento ILO C 190) e inserimento disabili.</li></ul>" },
        { ud: "UD2", ore: 8, m: "Organizzazione e gestione della SSL", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>I ruoli delle ASL, INL, VVF e Inail; gli organi di vigilanza e le procedure ispettive.</li><li>Le misure organizzative e gestionali di tutela (standard tecnico-strutturali).</li><li>Valutazione dei rischi e predisposizione delle misure di prevenzione.</li><li>La gestione del rischio interferenziale e il DUVRI.</li><li>Organizzazione emergenze, primo soccorso, appalti, riunioni periodiche e sorveglianza sanitaria.</li><li>Modelli di organizzazione e gestione di tipo volontario; Costi della mancata sicurezza.</li><li>Tecniche e strumenti di comunicazione e informazione.</li></ul>" }
    ]},
    dl_spp_comune: { t: "DL SPP - Modulo Comune (Senza Rischio Specifico) (8h)", ore: 8, scad: 5, risk: "DLSPP", code: "DLSPP", norma: "D.Lgs. 81/08 Art. 34 commi 2 e 3 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 4, m: "Il processo di valutazione e i fattori di rischio", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>I criteri e gli strumenti per l'individuazione e la valutazione dei rischi.</li><li>Struttura e contenuti del documento di valutazione dei rischi.</li><li>L'analisi degli infortuni mancati e delle modalità di accadimento.</li><li>Fattori di rischio: luoghi di lavoro, attrezzature, MMC, VDT, fisici, chimici, biologici, atmosfere esplosive, stress lavoro-correlato.</li><li>Rischi ricollegabili al genere, all'età e alla provenienza da altri paesi.</li></ul>" },
        { ud: "UD2", ore: 4, m: "Misure di prevenzione e gestione documentale", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>La gestione della documentazione tecnico amministrativa.</li><li>Le procedure semplificate per la redazione della valutazione del rischio.</li><li>Misure tecniche, organizzative e procedurali di prevenzione e protezione.</li><li>Dispositivi di protezione individuale e segnaletica di sicurezza.</li><li>Predisposizione di un documento di valutazione dei rischi per un caso concreto.</li></ul>" }
    ]},
    dl_spp_agri: { t: "DL SPP - Modulo Comune + Agricoltura/Zootecnica (24h)", ore: 24, scad: 5, risk: "DLSPP", code: "DLSPP", norma: "D.Lgs. 81/08 Art. 34 commi 2 e 3 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 8, m: "Modulo Comune Prevenzione", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>I criteri e gli strumenti per la valutazione dei rischi e struttura del DVR.</li><li>L'analisi degli infortuni mancati.</li><li>Fattori di rischio generali, dispositivi di protezione e segnaletica.</li></ul>" },
        { ud: "UD2", ore: 16, m: "Modulo Integrativo 1: Agricoltura", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Analisi degli infortuni e malattie professionali del comparto agricolo/zootecnico.</li><li>Organizzazione del lavoro: ambienti di lavoro (es. serre, campi, boschi, ecc.).</li><li>Normativa tecnica per strutture e impianti.</li><li>Rischi legati all'utilizzo di macchine e attrezzature di lavoro (es. ribaltamento, schiacciamento).</li><li>Sostanze pericolose, agenti biologici, agenti fisici e rischio di caduta dall'alto.</li><li>Ambienti confinati e/o sospetti di inquinamento; Movimentazione dei carichi.</li></ul>" }
    ]},
    dl_spp_pesca: { t: "DL SPP - Modulo Comune + Pesca (20h)", ore: 20, scad: 5, risk: "DLSPP", code: "DLSPP", norma: "D.Lgs. 81/08 Art. 34 commi 2 e 3 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 8, m: "Modulo Comune Prevenzione", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>I criteri e gli strumenti per la valutazione dei rischi e struttura del DVR.</li><li>L'analisi degli infortuni mancati.</li><li>Fattori di rischio generali, dispositivi di protezione e segnaletica.</li></ul>" },
        { ud: "UD2", ore: 12, m: "Modulo Integrativo 2: Pesca", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Analisi degli infortuni e malattie professionali del comparto.</li><li>Legislazione specifica di riferimento e organizzazione negli ambienti di lavoro.</li><li>Normativa tecnica e per strutture e impianti.</li><li>Rischi legati all'utilizzo di macchine e attrezzature di lavoro a bordo.</li><li>Rischio cadute dall'alto, a bordo e fuori bordo; Movimentazione dei carichi.</li><li>Atmosfere iperbariche e attività subacquee.</li></ul>" }
    ]},
    dl_spp_costruzioni: { t: "DL SPP - Modulo Comune + Costruzioni (24h)", ore: 24, scad: 5, risk: "DLSPP", code: "DLSPP", norma: "D.Lgs. 81/08 Art. 34 commi 2 e 3 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 8, m: "Modulo Comune Prevenzione", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>I criteri e gli strumenti per la valutazione dei rischi e struttura del DVR.</li><li>L'analisi degli infortuni mancati.</li><li>Fattori di rischio generali, dispositivi di protezione e segnaletica.</li></ul>" },
        { ud: "UD2", ore: 16, m: "Modulo Integrativo 3: Costruzioni", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Soggetti definiti dal Titolo IV capo I, e relativi obblighi e responsabilità.</li><li>Analisi infortuni; Organizzazione, tecniche, fasi lavorative e aree di lavoro dei cantieri.</li><li>Le misure generali di tutela secondo l'art. 95 del d.lgs. n. 81/2008.</li><li>Il piano operativo di sicurezza (POS) e cenni sul PSC.</li><li>Cadute dall'alto, opere provvisionali, lavori di demolizione e scavo.</li><li>Impianti elettrici, macchine, movimentazione carichi, sostanze pericolose e attività stradali.</li></ul>" }
    ]},
    dl_spp_chimico: { t: "DL SPP - Modulo Comune + Chimico-Petrolchimico (24h)", ore: 24, scad: 5, risk: "DLSPP", code: "DLSPP", norma: "D.Lgs. 81/08 Art. 34 commi 2 e 3 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 8, m: "Modulo Comune Prevenzione", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>I criteri e gli strumenti per la valutazione dei rischi e struttura del DVR.</li><li>L'analisi degli infortuni mancati.</li><li>Fattori di rischio generali, dispositivi di protezione e segnaletica.</li></ul>" },
        { ud: "UD2", ore: 16, m: "Modulo Integrativo 4: Chimico", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Analisi degli infortuni e malattie professionali del comparto.</li><li>Processo produttivo, organizzazione del lavoro e ambienti di lavoro.</li><li>Normativa tecnica per strutture e impianti; Cenni sulle attività a rischio di incidente rilevante.</li><li>Cenni sulle industrie insalubri; Rischi legati agli impianti e manutenzione fornitori.</li><li>Sostanze pericolose, agenti fisici, incendi, esplosioni e ambienti confinati.</li><li>Gestione dei rifiuti.</li></ul>" }
    ]},
    preposto: { t: "Preposto Vigilanza Attiva (12h)", ore: 12, scad: 2, risk: "PREP", code: "PR", norma: "D.Lgs. 81/08 Art. 37 comma 7 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 4, m: "Modulo Giuridico normativo", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Individuazione del preposto; preposto di fatto ed effettività del ruolo.</li><li>Compiti e obblighi del preposto.</li><li>Relazioni tra i vari soggetti interni ed esterni del sistema di prevenzione.</li></ul>" },
        { ud: "UD2", ore: 4, m: "Gestione e organizzazione della sicurezza", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Modalità di esercizio della funzione di controllo dell'osservanza da parte dei lavoratori di cui all'art. 19 del d.lgs. n. 81/2008.</li><li>Misure tecniche, organizzative e procedurali adottate a seguito della valutazione dei rischi dell'azienda.</li><li>Obblighi connessi ai contratti di appalto, d'opera e somministrazione; gestione del rischio interferenziale e il DUVRI.</li><li>Modalità per sovraintendere e vigilare sulle attività lavorative per garantire l'attuazione delle direttive.</li></ul>" },
        { ud: "UD3", ore: 4, m: "Comunicazione e informazione", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Modalità di comunicazione e relazione con i soggetti della prevenzione aziendale.</li><li>L'importanza di individuare e segnalare incidenti e infortuni mancati.</li><li>Tecniche e strumenti di comunicazione e sensibilizzazione dei lavoratori, in particolare neoassunti, somministrati, stranieri.</li></ul>" }
    ]},
    dirigente: { t: "Dirigente Sicurezza (12h)", ore: 12, scad: 5, risk: "DIR", code: "DI", norma: "D.Lgs. 81/08 Art. 37 comma 7 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 4, m: "Modulo Giuridico normativo", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Il sistema legislativo in materia di salute e sicurezza dei lavoratori.</li><li>I soggetti del sistema di prevenzione aziendale secondo il d.lgs. n. 81/2008: compiti, obblighi, responsabilità e tutela assicurativa.</li><li>La delega di funzioni.</li><li>La responsabilità civile e penale del dirigente; la responsabilità amministrativa d.lgs. n. 231/2001 nel settore privato.</li><li>Prevenzione della violenza delle molestie sul luogo di lavoro (Documento ILO C 190).</li><li>Inserimento di lavoratori disabili.</li></ul>" },
        { ud: "UD2", ore: 4, m: "Gestione e organizzazione della sicurezza", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>I ruoli delle ASL, INL, VVF e INAIL; gli organi di vigilanza e le procedure ispettive.</li><li>Modalità di gestione ed organizzazione dei processi relative alla salute e sicurezza sui luoghi di lavoro.</li><li>Modelli di organizzazione e gestione di cui all'art. 30 del d.lgs. n. 81/2008; i sistemi di gestione in relazione alla normativa volontaria.</li><li>Misure tecniche, organizzative e procedurali adottate a seguito della valutazione dei rischi.</li><li>Obblighi connessi ai contratti d'appalto e somministrazione; il DUVRI.</li><li>Organizzazione della prevenzione incendi, primo soccorso e gestione delle emergenze.</li></ul>" },
        { ud: "UD3", ore: 4, m: "Comunicazione, informazione e consultazione", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Tecniche e strumenti di comunicazione e informazione.</li><li>Gli obblighi formativi per i diversi soggetti aziendali.</li><li>Gestione dei gruppi di lavoro e dei conflitti.</li><li>Consultazione e partecipazione dei rappresentanti dei lavoratori per la sicurezza.</li></ul>" }
    ]},
    mod_cantieri: { t: "Modulo Aggiuntivo Cantieri (DL/Dirigente) (6h)", ore: 6, scad: 5, risk: "DIR", code: "MC", norma: "D.Lgs. 81/08 Art. 97 comma 3-ter e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 3, m: "Soggetti e Piani di Sicurezza", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>I soggetti definiti dal Titolo IV capo I, e relativi obblighi e responsabilità.</li><li>La redazione dei piani di sicurezza: finalità, tempi e contenuti.</li><li>Le misure generali di tutela secondo quanto previsto dall'art. 95 del d.lgs. n. 81/2008.</li></ul>" },
        { ud: "UD2", ore: 3, m: "Verifica e Gestione del Coordinamento", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Gli obblighi del datore di lavoro, dei dirigenti e dei preposti di cui all'art. 96 del d.lgs. n. 81/2008.</li><li>Il cronoprogramma dei lavori.</li><li>Esempi e analisi di un PSC; Esempi e analisi di un POS.</li></ul>" }
    ]},
    amb_confinati: { t: "Ambienti Sospetti Inquinamento o Confinati (12h)", ore: 12, scad: 5, risk: "SPEC", code: "SC", norma: "D.P.R. 177/2011 Art. 2 lett. d) e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 4, m: "Modulo Giuridico-Tecnico", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>La normativa di riferimento; Definizioni e identificazione di un ambiente confinato o sospetto di inquinamento e criticità.</li><li>Analisi degli eventi infortunistici; Individuazione dei fattori di rischio.</li><li>I rischi specifici: aria respirabile, atmosfere con difetto o eccesso di ossigeno, agenti chimici pericolosi, pericolo di esplosione ed incendio, seppellimento, cadute dall'alto.</li><li>Caratteristiche e pericolosità degli agenti chimici.</li><li>Misure e procedure di prevenzione nelle fasi di lavoro (procedure d'ingresso, monitoraggio atmosfera, ventilazione, sorveglianza sanitaria).</li><li>Le procedure da attuare in caso di emergenza (recupero infortunato).</li></ul>" },
        { ud: "UD2", ore: 8, m: "Modulo Addestramento Pratico", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Simulazione sull'uso dei dispositivi e della strumentazione messa a disposizione.</li><li>Dispositivi di protezione individuali.</li><li>Gli Apparecchi per la Protezione delle Vie Respiratorie (APVR): utilizzo, tipologia, filtri.</li><li>Imbracature di sicurezza, tripode, rilevatori di gas, misuratori di esplosività.</li><li>Sistemi di segnalazione e comunicazione.</li></ul>" }
    ]},
    attr_carrelli_ind: { t: "Carrelli Elevatori Industriali Semoventi (12h)", ore: 12, scad: 5, risk: "SPEC", code: "CE", norma: "D.Lgs. 81/08 Art. 73 comma 5 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 8, m: "Modulo Teorico-Tecnico", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Tipologie e caratteristiche dei vari tipi di veicoli per il trasporto interno.</li><li>Principali rischi connessi all'impiego di carrelli semoventi.</li><li>Nozioni elementari di fisica: valutazione dei carichi, equilibrio, stabilità statica e dinamica, portata del carrello.</li><li>Tecnologia dei carrelli semoventi: componenti principali, posto di guida, freni, ruote e fonti di energia.</li><li>Sistemi di ricarica batterie; Dispositivi di comando e di sicurezza.</li><li>Le condizioni di equilibrio: lettura delle tabelle o diagrammi di portata.</li><li>Controlli e manutenzioni; Modalità di utilizzo in sicurezza, procedure di movimentazione, viabilità aziendale.</li><li>Lavori in condizioni particolari, rischi per la salute e misure di protezione personale.</li><li>Procedure operative di salvataggio e segnaletica gestuale.</li></ul>" },
        { ud: "UD2", ore: 4, m: "Modulo Pratico", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Illustrazione, seguendo le istruzioni di uso del carrello, dei vari componenti e delle sicurezze.</li><li>Manutenzione e verifiche giornaliere e periodiche di legge e secondo istruzioni d'uso.</li><li>Guida del carrello su percorso di prova per evidenziare le corrette manovre a vuoto e a carico.</li></ul>" }
    ]},
    attr_carrelli_all: { t: "Carrelli Elev. Ind + Telescopici + Rotativi (16h)", ore: 16, scad: 5, risk: "SPEC", code: "CE", norma: "D.Lgs. 81/08 Art. 73 comma 5 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 8, m: "Modulo Teorico-Tecnico Integrato", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Tipologie e caratteristiche dei veicoli per il trasporto interno, telescopici e rotativi.</li><li>Principali rischi connessi all'impiego e nozioni elementari di fisica (stabilità statica e dinamica).</li><li>Componenti principali, posto di guida, ruote, fonti di energia.</li><li>Dispositivi di comando e di sicurezza; Le condizioni di equilibrio e diagrammi di portata.</li><li>Controlli e manutenzioni, viabilità e procedure di movimentazione in sicurezza.</li><li>Lavori in condizioni particolari e procedure operative di salvataggio.</li></ul>" },
        { ud: "UD2", ore: 8, m: "Modulo Pratico Multimacchina", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Illustrazione componenti e sicurezze (Carrelli frontali, telescopici e rotativi).</li><li>Manutenzione e verifiche giornaliere e periodiche.</li><li>Guida del carrello su percorso di prova per evidenziare le corrette manovre a vuoto e a carico (presa, trasporto, sosta).</li><li>Utilizzo di attrezzature intercambiabili.</li></ul>" }
    ]},
    attr_ple: { t: "Piattaforme Lavoro Elevabili PLE (10h)", ore: 10, scad: 5, risk: "SPEC", code: "PLE", norma: "D.Lgs. 81/08 Art. 73 comma 5 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 4, m: "Modulo Teorico-Tecnico", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Categorie di PLE: caratteristiche generali e specifiche.</li><li>Componenti strutturali e sistemi di stabilizzazione.</li><li>Dispositivi di comando e di sicurezza.</li><li>Controlli visivi e funzionali da effettuare prima dell'utilizzo.</li><li>DPI specifici da utilizzare con le PLE.</li><li>Modalità di utilizzo in sicurezza, valutazione rischi e spostamento.</li><li>Procedure operative di salvataggio e discesa in emergenza.</li></ul>" },
        { ud: "UD2", ore: 6, m: "Modulo Pratico PLE", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Individuazione componenti strutturali, dispositivi di comando e di sicurezza.</li><li>Controlli pre-utilizzo e pianificazione del percorso.</li><li>Movimentazione e posizionamento della PLE (delimitazione, stabilizzatori, livellamento).</li><li>Esercitazioni di pratiche operative in quota.</li><li>Manovre di emergenza per il recupero a terra della piattaforma.</li><li>Messa a riposo della PLE e modalità ricarica batterie.</li></ul>" }
    ]},
    attr_mmt_esc: { t: "Macchine Movimento Terra/Escavatori Idraulici (10h)", ore: 10, scad: 5, risk: "SPEC", code: "MMT", norma: "D.Lgs. 81/08 Art. 73 comma 5 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 4, m: "Modulo Teorico-Tecnico", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Categorie di attrezzature: caratteristiche degli escavatori idraulici.</li><li>Componenti strutturali: struttura portante, organi trasmissione/direzione, circuito comando.</li><li>Dispositivi di comando e di sicurezza, visibilità e identificazione zone cieche.</li><li>Controlli visivi e funzionali pre-utilizzo.</li><li>Modalità di utilizzo in sicurezza, analisi dei rischi (capovolgimento, stabilità) e precauzioni d'area.</li><li>Uso dell'escavatore come apparecchio di sollevamento e protezione da rumore/vibrazioni.</li></ul>" },
        { ud: "UD2", ore: 6, m: "Modulo Pratico Escavatori Idraulici", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Individuazione componenti strutturali e dispositivi comando/sicurezza.</li><li>Controlli pre-utilizzo.</li><li>Pianificazione operazioni di campo: pendenze, accesso, sbancamento, livellamento.</li><li>Guida dell'escavatore su strada e uso in campo (scavo, riempimento, sollevamento materiali).</li><li>Messa a riposo e procedure per il trasporto sicuro su carrellone.</li></ul>" }
    ]},
    attr_mmt_all: { t: "Macchine Movimento Terra (Esc+Pale+Terne) (16h)", ore: 16, scad: 5, risk: "SPEC", code: "MMT", norma: "D.Lgs. 81/08 Art. 73 comma 5 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 4, m: "Modulo Teorico-Tecnico MMT", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Categorie di attrezzature: escavatori idraulici, pale caricatrici frontali e terne.</li><li>Componenti strutturali, dispositivi di comando, sicurezza e visibilità.</li><li>Controlli da effettuare prima dell'utilizzo.</li><li>Modalità di utilizzo in sicurezza, valutazione stabilità dinamica/statica.</li><li>Uso come apparecchio di sollevamento e DPI fisici per vibrazioni e rumore.</li></ul>" },
        { ud: "UD2", ore: 12, m: "Modulo Pratico Integrato", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Individuazione componenti strutturali, comandi e controlli pre-utilizzo per escavatori, pale e terne.</li><li>Pianificazione delle operazioni di campo, scavo e caricamento.</li><li>Guida su strada e utilizzo operativo in campo (sbancamento, profilatura, caricamento).</li><li>Aggancio attrezzature speciali e operazioni di movimentazione carichi.</li><li>Messa a riposo e procedure per la salita su carrellone da trasporto.</li></ul>" }
    ]},
    attr_gru_autocarro: { t: "Gru per Autocarro (12h)", ore: 12, scad: 5, risk: "SPEC", code: "GRU", norma: "D.Lgs. 81/08 Art. 73 comma 5 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 4, m: "Modulo Teorico-Tecnico", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Terminologia, caratteristiche e tipologie di gru per autocarro.</li><li>Nozioni elementari di fisica per il calcolo delle condizioni di equilibrio.</li><li>Componenti, tipi di allestimento e dispositivi di comando a distanza.</li><li>Condizioni di stabilità e fattori influenzanti.</li><li>Utilizzo delle tabelle di carico fornite dal costruttore e principi dei dispositivi limitatori.</li><li>Principi per il posizionamento, stabilizzazione, valutazione dei rischi ambientali e segnaletica gestuale.</li></ul>" },
        { ud: "UD2", ore: 8, m: "Modulo Pratico Gru Autocarro", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Individuazione dei componenti strutturali, sistemi di stabilizzazione e dispositivi di sicurezza.</li><li>Controlli pre-utilizzo e controlli prima del trasferimento su strada.</li><li>Pianificazione del sollevamento e posizionamento della gru sul luogo di lavoro.</li><li>Esercitazioni pratiche operative: presa, controllo rotazione, posizionamento carico.</li><li>Utilizzo di accessori di sollevamento diversi dal gancio (imbracature, carichi particolari).</li><li>Manovre di emergenza e messa a riposo dell'attrezzatura.</li></ul>" }
    ]},
    attr_gru_torre: { t: "Gru a Torre rotazione basso e alto (14h)", ore: 14, scad: 5, risk: "SPEC", code: "GRU", norma: "D.Lgs. 81/08 Art. 73 comma 5 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 8, m: "Modulo Teorico-Tecnico", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Norme generali di utilizzo della gru a torre e limiti di impiego.</li><li>Tipologie di gru a torre e principali rischi connessi all'impiego (caduta, urti, ambiente, energia).</li><li>Nozioni elementari di fisica e condizioni di equilibrio della gru a torre.</li><li>Tecnologia, meccanismi, componenti strutturali (torre, freccia, controfreccia).</li><li>Dispositivi di comando, sicurezza, indicatori di carico e anemometro.</li><li>Installazione, controlli pre-utilizzo, procedure operative in servizio e fuori servizio, manutenzione.</li></ul>" },
        { ud: "UD2", ore: 6, m: "Modulo Pratico Gru a Torre", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Individuazione dei componenti strutturali e dei dispositivi di comando/sicurezza.</li><li>Controlli pre-utilizzo, diagrammi di carico e prove dei dispositivi di ausilio alla conduzione.</li><li>Utilizzo della gru a torre: messa in servizio, sblocco freno, verifica sicurezze.</li><li>Uso accessori, imbracatura, spostamento carico attraverso ostacoli, bilanciamento e posizionamento di precisione.</li><li>Operazioni di fine-utilizzo e messa fuori servizio in caso di avverse condizioni meteorologiche.</li></ul>" }
    ]},
    attr_pompe: { t: "Pompe per Calcestruzzo (14h)", ore: 14, scad: 5, risk: "SPEC", code: "CLS", norma: "D.Lgs. 81/08 Art. 73 comma 5 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 7, m: "Modulo Teorico-Tecnico", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Categorie di pompe per calcestruzzo e caratteristiche generali/specifiche.</li><li>Componenti strutturali e sistemi di stabilizzazione.</li><li>Dispositivi di comando, segnalazione e sicurezza.</li><li>Controlli pre-utilizzo visivi e funzionali.</li><li>Modalità di utilizzo in sicurezza, analisi dei rischi (elettrocuzione, schiacciamento).</li><li>Spostamento, stabilizzazione, procedure per lo scarico, lavaggio e manutenzione.</li></ul>" },
        { ud: "UD2", ore: 7, m: "Modulo Pratico", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Individuazione dei componenti, comandi e dispositivi di sicurezza.</li><li>Controlli pre-utilizzo e controlli preliminari alla partenza.</li><li>Pianificazione del percorso, viabilità ordinaria e controllo idoneità del sito di scarico.</li><li>Posizionamento e stabilizzazione del mezzo.</li><li>Esercitazioni operative: apertura braccio via radiocomando, pompaggio e sblocco intasamento.</li><li>Chiusura braccio, pulizia ordinaria, manutenzione straordinaria e messa a riposo.</li></ul>" }
    ]},
    attr_trattori: { t: "Trattori Agricoli o Forestali (8h)", ore: 8, scad: 5, risk: "SPEC", code: "TRA", norma: "D.Lgs. 81/08 Art. 73 comma 5 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 3, m: "Modulo Teorico-Tecnico", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Categorie di trattori (ruote/cingoli) e componenti principali (struttura, trasmissione, accoppiamento).</li><li>Dispositivi di comando e di sicurezza.</li><li>Controlli da effettuare prima dell'utilizzo.</li><li>DPI specifici da utilizzare (udito, vie respiratorie, indumenti).</li><li>Modalità di utilizzo in sicurezza, valutazione del rischio di capovolgimento, stabilità statica/dinamica e contatti.</li></ul>" },
        { ud: "UD2", ore: 5, m: "Modulo Pratico", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Individuazione dei componenti principali e dei dispositivi di comando e sicurezza.</li><li>Controlli pre-utilizzo visivi e funzionali.</li><li>Pianificazione delle operazioni di campo in base a pendenze, ostacoli e terreno.</li><li>Guida del trattore in piano e in campo, con e senza attrezzature, rimorchi o carichi laterali/posteriori.</li><li>Messa a riposo del trattore, parcheggio e rimessaggio.</li></ul>" }
    ]},
    lav_quota: { t: "Lavori in Quota e DPI 3° Categoria (8h)", ore: 8, scad: 5, risk: "SPEC", code: "QUO", norma: "D.Lgs. 81/08 Titolo IV e Art. 77 comma 5 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 4, m: "Modulo Teorico (Fisica e Normativa)", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Definizione normativa di lavoro in quota (D.Lgs. 81/08 Titolo IV).</li><li>Gerarchia della prevenzione: precedenza delle misure di protezione collettiva rispetto ai DPI.</li><li>Principi di fisica della caduta (forza di arresto, fattore di caduta, tirante d'aria libero).</li><li>Scelta, uso, manutenzione e criteri di conformità CE dei Dispositivi di Protezione Individuale di Terza Categoria anticaduta.</li></ul>" },
        { ud: "UD2", ore: 4, m: "Modulo Addestramento Pratico", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Indossamento corretto dell'imbracatura di sicurezza e regolazione.</li><li>Sistemi di ancoraggio, posizionamento e uso dei cordini con assorbitore di energia.</li><li>Tecniche di progressione in sicurezza e simulazione pratica in quota.</li><li>Procedure d'emergenza e cenni sul recupero di infortunato in sospensione inerte.</li></ul>" }
    ]},
    rls: { t: "Rappresentante Lavoratori Sicurezza RLS (32h)", ore: 32, scad: 1, risk: "RLS", code: "RLS", norma: "D.Lgs. 81/08 Art. 37 commi 10 e 11 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 8, m: "Principi Giuridici e Organizzazione", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>La legislazione in materia di salute e sicurezza dei lavoratori.</li><li>I soggetti del sistema di prevenzione aziendale: compiti, obblighi e responsabilità.</li><li>Il sistema istituzionale della prevenzione e gli organi di vigilanza.</li><li>Funzioni, attribuzioni e tutele della figura del RLS.</li></ul>" },
        { ud: "UD2", ore: 8, m: "Valutazione e Rischi Infortunistici", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Criteri e metodi per la valutazione dei rischi; il documento di valutazione dei rischi.</li><li>Rischi infortunistici, meccanici, elettrici e da macchine/attrezzature.</li><li>Rischi di esplosione e incendi; organizzazione delle emergenze.</li></ul>" },
        { ud: "UD3", ore: 8, m: "Rischi Salute ed Ergonomici", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Agenti chimici, fisici, biologici, cancerogeni e mutageni.</li><li>Rischi derivanti dall'organizzazione del lavoro (movimentazione manuale carichi, VDT, stress lavoro-correlato).</li><li>Sorveglianza sanitaria e misure di protezione collettiva/individuale.</li></ul>" },
        { ud: "UD4", ore: 8, m: "Relazioni, Comunicazione e Riunioni", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Il sistema delle relazioni aziendali e della comunicazione in materia di salute e sicurezza.</li><li>Tecniche per l'ascolto attivo e la partecipazione consultiva.</li><li>La riunione periodica (Art. 35) e la gestione dei conflitti.</li></ul>" }
    ]},
    primo_soccorso_12h: { t: "Addetto al Primo Soccorso (Gruppo B/C) - 12h", ore: 12, scad: 3, risk: "PS", code: "PS", norma: "D.Lgs. 81/08 Art. 45 comma 2 e D.M. 388/2003", prog: [
        { ud: "UD1", ore: 4, m: "Modulo A - Allertamento e Riconoscimento", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Allertare il sistema di soccorso e cause/circostanze dell'infortunio sul luogo di lavoro.</li><li>Riconoscere un'emergenza sanitaria e accertamento delle condizioni psico-fisiche (funzioni vitali).</li><li>Attuare gli interventi di primo soccorso: posizione laterale di sicurezza e protezione.</li></ul>" },
        { ud: "UD2", ore: 4, m: "Modulo B - Traumatologia e Patologie", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Conoscenze generali sui traumi in ambiente di lavoro (fratture, lussazioni, lesioni craniche).</li><li>Primo intervento per emorragie esterne, ustioni, folgorazioni.</li><li>Riconoscimento delle patologie specifiche (lipotimia, crisi asmatica, dolore acuto, convulsioni).</li></ul>" },
        { ud: "UD3", ore: 4, m: "Modulo C - Addestramento Pratico", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Acquisire capacità di intervento pratico tramite simulazioni ed esercitazioni.</li><li>Tecniche di rianimazione cardiopolmonare di base (BLS).</li><li>Tecniche di sollevamento, spostamento, trasporto dell'infortunato e fasciature.</li></ul>" }
    ]},
    antincendio_liv2: { t: "Addetto Emergenze e Antincendio (Livello 2) - 8h", ore: 8, scad: 5, risk: "AI", code: "AI", norma: "D.Lgs. 81/08 Art. 46 comma 3 e D.M. 2/9/2021", prog: [
        { ud: "UD1", ore: 2, m: "L'Incendio e la prevenzione", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Principi della combustione, prodotti della combustione e sostanze estinguenti in relazione alle classi di fuoco.</li><li>Effetti dell'incendio sull'uomo, determinazione dei rischi e misure comportamentali.</li></ul>" },
        { ud: "UD2", ore: 3, m: "Protezione antincendio e procedure", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Misure di protezione passiva e attiva (vie di esodo, compartimentazioni, estintori, idranti).</li><li>Procedure da adottare in caso di incendio, allarme, evacuazione e chiamata ai soccorsi.</li></ul>" },
        { ud: "UD3", ore: 3, m: "Esercitazioni Pratiche", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Presa visione del registro antincendio e delle misure di sorveglianza su impianti e attrezzature.</li><li>Istruzioni sull'uso corretto degli estintori portatili ed esercitazione pratica.</li><li>Istruzioni e utilizzo degli idranti con erogazione di acqua.</li></ul>" }
    ]},
    agg_lav: { t: "Aggiornamento Lavoratori (6h)", ore: 6, scad: 5, risk: "AGG", code: "FL", norma: "D.Lgs. 81/08 Art. 37 commi 1 e 3 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 6, m: "Aggiornamento Sicurezza e Normativa", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Significative evoluzioni, innovazioni o modifiche normative in ambito salute e sicurezza.</li><li>Aggiornamenti tecnici sui rischi specifici ai quali sono esposti i lavoratori.</li><li>Aggiornamenti su organizzazione e gestione della sicurezza in azienda, fonti di rischio e relative misure prevenzionali.</li></ul>" }
    ]},
    agg_prep: { t: "Aggiornamento Preposto (6h) - Biennale", ore: 6, scad: 2, risk: "AGG", code: "PR", norma: "D.Lgs. 81/08 Art. 37 comma 7 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 6, m: "Aggiornamento Vigilanza Operativa", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Aggiornamento relativo ai cambiamenti del contesto in cui il preposto esercita le funzioni ex art. 19 del d.lgs. n. 81/2008.</li><li>Evoluzione delle misure tecniche, organizzative e procedurali adottate a seguito della valutazione dei rischi dell'azienda.</li><li>Nuovi rischi organizzativi e approfondimenti sui compiti di supervisione.</li></ul>" }
    ]},
    agg_dir: { t: "Aggiornamento Dirigente (6h)", ore: 6, scad: 5, risk: "AGG", code: "DI", norma: "D.Lgs. 81/08 Art. 37 comma 7 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 6, m: "Aggiornamento Organizzazione e Gestione", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Aggiornamento relativo ai cambiamenti del contesto in cui il dirigente opera.</li><li>Evoluzione delle misure tecniche, organizzative e procedurali adottate a seguito della valutazione dei rischi dell'azienda.</li><li>Approfondimento su responsabilità dirigenziali e modelli gestionali complessi.</li></ul>" }
    ]},
    agg_dl: { t: "Aggiornamento Datore di Lavoro (6h)", ore: 6, scad: 5, risk: "AGG", code: "DL", norma: "D.Lgs. 81/08 Art. 34 commi 2 e 3 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 6, m: "Aggiornamento Giuridico-Gestionale", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Aggiornamento in relazione ai propri compiti datoriali in materia di salute e sicurezza del lavoro.</li><li>Evoluzione giurisprudenziale, nuovi standard organizzativi e miglioramento dei processi prevenzionali aziendali.</li><li>Analisi di mutamenti strutturali o normativi che impattano sulle responsabilità primarie.</li></ul>" }
    ]},
    agg_dl_spp: { t: "Aggiornamento DL SPP (Ex RSPP) (8h)", ore: 8, scad: 5, risk: "AGG", code: "DLSPP", norma: "D.Lgs. 81/08 Art. 34 commi 2 e 3 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 8, m: "Aggiornamento Valutazione Rischi", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Aggiornamento in relazione ai propri compiti operativi di prevenzione e protezione in azienda.</li><li>Evoluzioni tecnico-normative e procedurali sui rischi specifici (es. agricoltura, costruzioni, se applicabili).</li><li>Adeguamento delle metodologie di valutazione dei rischi e stesura documentale.</li></ul>" }
    ]},
    agg_pratico_4h: { t: "Agg. Pratico Attrezzature / Spazi Confinati (4h)", ore: 4, scad: 5, risk: "AGG", code: "SPEC", norma: "D.Lgs. 81/08 Art. 73 comma 5 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 4, m: "Ripasso Pratico e Addestramento", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Aggiornamento teorico-normativo sulle evoluzioni tecniche dell'attrezzatura/ambiente operativo.</li><li>Ripetizione delle prove pratiche per l'esercizio delle manovre operative in sicurezza.</li><li>Illustrazione e prova di reazione ad anomalie o procedure di emergenza aggiornate.</li></ul>" }
    ]},
    agg_primo_soccorso_4h: { t: "Aggiornamento Primo Soccorso (Gr. B/C) - 4h", ore: 4, scad: 3, risk: "AGG", code: "PS", norma: "D.Lgs. 81/08 Art. 45 comma 2 e D.M. 388/2003", prog: [
        { ud: "UD1", ore: 4, m: "Modulo Pratico BLS e Traumi", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Ripasso delle tecniche generali di primo intervento e attivazione del sistema di soccorso.</li><li>Aggiornamento ed esecuzione pratica delle tecniche di rianimazione cardiopolmonare.</li><li>Esercitazioni pratiche su medicazioni rapide, tamponamento emorragie e disostruzione vie aeree.</li></ul>" }
    ]},
    agg_antincendio_liv2_5h: { t: "Aggiornamento Antincendio (Livello 2) - 5h", ore: 5, scad: 5, risk: "AGG", code: "AI", norma: "D.Lgs. 81/08 Art. 46 comma 3 e D.M. 2/9/2021", prog: [
        { ud: "UD1", ore: 2, m: "Aggiornamento Teorico Incendio", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Ripasso sui principi della combustione, estinguenti e classi di fuoco (D.M. 2/9/2021).</li><li>Aggiornamento sulle misure di protezione antincendio e procedure di evacuazione.</li></ul>" },
        { ud: "UD2", ore: 3, m: "Aggiornamento Pratico Estintori", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Verifica e aggiornamento sulle procedure di utilizzo degli estintori portatili e idranti.</li><li>Esercitazioni pratiche antincendio su focolare controllato.</li></ul>" }
    ]},
    agg_rls_4h: { t: "Aggiornamento RLS (4h - Imprese 15-50 dip.)", ore: 4, scad: 1, risk: "AGG", code: "RLS", norma: "D.Lgs. 81/08 Art. 37 commi 10 e 11 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 4, m: "Aggiornamento Normativo RLS", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Evoluzioni legislative, innovazioni tecniche e organizzative in materia di salute e sicurezza.</li><li>Aggiornamenti sulle metodiche di analisi dei rischi specifici e lettura avanzata del DVR.</li><li>Ottimizzazione delle tecniche di relazione aziendale e consultazione dei lavoratori.</li></ul>" }
    ]},
    agg_rls_8h: { t: "Aggiornamento RLS (8h - Imprese >50 dip.)", ore: 8, scad: 1, risk: "AGG", code: "RLS", norma: "D.Lgs. 81/08 Art. 37 commi 10 e 11 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 4, m: "Aggiornamento Tecnico/Normativo", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Novità legislative SSL, accordi Stato-Regioni recenti e prassi ispettive.</li><li>Analisi aggiornata dell'andamento infortunistico e delle patologie professionali di comparto.</li></ul>" },
        { ud: "UD2", ore: 4, m: "Gestione Riunioni e DVR", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>La rielaborazione del DVR in caso di variazioni organizzative o implementazione di nuove tecnologie.</li><li>Partecipazione attiva e propositiva del RLS nel contesto del DUVRI e nelle riunioni periodiche.</li></ul>" }
    ]}
};

// ==========================================
// POOL DOMANDE ESTESO (30 DOMANDE GARANTITE)
// ==========================================
window.POOL_GENERALE = [
    { q: "Qual è il principale riferimento normativo per la sicurezza sul lavoro?", a: ["D.Lgs 81/08", "D.Lgs 231/01", "D.Lgs 106/09"], correct: 0 },
    { q: "Chi è responsabile della valutazione dei rischi in modo indelegabile?", a: ["Il Medico Competente", "Il Datore di Lavoro", "Il RSPP"], correct: 1 },
    { q: "Cosa significa l'acronimo RSPP?", a: ["Responsabile Sicurezza Prevenzione e Protezione", "Responsabile del Servizio di Prevenzione e Protezione", "Rappresentante Sindacale Prevenzione"], correct: 1 },
    { q: "Il DUVRI viene redatto in caso di:", a: ["Assunzione di nuovo personale", "Appalti e lavori con rischi interferenziali", "Infortunio grave"], correct: 1 },
    { q: "Chi elegge il Rappresentante dei Lavoratori per la Sicurezza (RLS)?", a: ["I Lavoratori", "Il Datore di Lavoro", "Il Sindacato Esterno"], correct: 0 },
    { q: "La sorveglianza sanitaria in azienda è effettuata da:", a: ["Il Datore di Lavoro", "L'ASL", "Il Medico Competente"], correct: 2 },
    { q: "Qual è l'obbligo principale del lavoratore?", a: ["Redigere il DVR", "Prendersi cura della propria salute e sicurezza e di quella delle altre persone presenti", "Acquistare i DPI"], correct: 1 },
    { q: "Cosa si intende per infortunio 'in itinere'?", a: ["Infortunio durante la pausa pranzo", "Infortunio nel tragitto casa-lavoro", "Infortunio durante una trasferta all'estero"], correct: 1 },
    { q: "Che cos'è un 'Near Miss'?", a: ["Un infortunio mortale", "Una malattia professionale", "Un mancato infortunio o quasi-incidente"], correct: 2 },
    { q: "A chi spetta l'onere di fornire i Dispositivi di Protezione Individuale (DPI)?", a: ["Al Lavoratore", "Al Datore di Lavoro", "Al Preposto"], correct: 1 },
    { q: "Il Documento di Valutazione dei Rischi (DVR) deve avere data certa?", a: ["Sì, sempre", "Solo nelle aziende con più di 15 dipendenti", "No, non è necessario"], correct: 0 },
    { q: "Qual è la durata minima della Formazione Generale per i lavoratori?", a: ["2 ore", "4 ore", "8 ore"], correct: 1 },
    { q: "L'ultimo Accordo Stato Regioni sulla formazione citato nel corso è del:", a: ["2011", "2016", "2025"], correct: 2 },
    { q: "I Dispositivi di Protezione Individuale devono obbligatoriamente avere:", a: ["La marcatura CE", "Il nome del lavoratore inciso", "Un colore ad alta visibilità"], correct: 0 },
    { q: "La Riunione Periodica di Sicurezza è obbligatoria per le aziende:", a: ["Con più di 15 lavoratori", "Di qualsiasi dimensione", "Solo nei cantieri edili"], correct: 0 },
    { q: "Cosa indica la segnaletica di colore ROSSO?", a: ["Divieto e Antincendio", "Obbligo", "Salvataggio"], correct: 0 },
    { q: "Cosa indica la segnaletica di colore GIALLO?", a: ["Avvertimento / Attenzione", "Divieto", "Obbligo"], correct: 0 },
    { q: "Cosa indica la segnaletica di colore AZZURRO?", a: ["Obbligo", "Divieto", "Pericolo"], correct: 0 },
    { q: "Cosa indica la segnaletica di colore VERDE?", a: ["Salvataggio / Vie di esodo", "Attenzione", "Obbligo"], correct: 0 },
    { q: "La formazione sulla sicurezza deve essere svolta:", a: ["Durante l'orario di lavoro", "Fuori dall'orario di lavoro", "Solo se il lavoratore lo richiede"], correct: 0 },
    { q: "Il costo dei Dispositivi di Protezione Individuale (DPI) è a carico di:", a: ["Datore di Lavoro", "Lavoratore", "Diviso a metà"], correct: 0 },
    { q: "Il lavoratore può rifiutarsi di usare i DPI forniti?", a: ["No, mai", "Sì, se gli danno fastidio", "Sì, se lavora all'aperto"], correct: 0 },
    { q: "Cosa si intende per Rischio?", a: ["Probabilità che si verifichi un danno x Gravità", "Un pericolo intrinseco", "Una malattia professionale"], correct: 0 },
    { q: "Il Rappresentante dei Lavoratori per la Sicurezza (RLS) è obbligatorio?", a: ["Sì, in tutte le aziende", "Solo oltre i 15 dipendenti", "No, è facoltativo"], correct: 0 },
    { q: "Le uscite di emergenza devono essere:", a: ["Sempre libere da ostacoli", "Chiuse a chiave", "Nascoste per non allarmare"], correct: 0 },
    { q: "Il preposto ha il compito di:", a: ["Vigilare sull'osservanza delle regole di sicurezza", "Valutare i rischi", "Nominare il medico competente"], correct: 0 },
    { q: "Cosa deve fare il lavoratore se si accorge che una macchina è guasta?", a: ["Spegnere la macchina e avvisare il preposto/datore", "Provare a ripararla", "Continuare a lavorare facendo attenzione"], correct: 0 },
    { q: "La gravidanza prevede limitazioni lavorative?", a: ["Sì, divieto di esposizione a rischi specifici", "No, nessuna", "Solo su richiesta del ginecologo"], correct: 0 },
    { q: "L'utilizzo dell'ascensore in caso di incendio è:", a: ["Severamente vietato", "Consigliato per fare prima", "A discrezione del lavoratore"], correct: 0 },
    { q: "L'addetto al primo soccorso può somministrare farmaci?", a: ["No, mai", "Sì, qualsiasi farmaco", "Sì, ma solo antibiotici"], correct: 0 }
];

window.POOL_BASSO = [
    { q: "Per i lavoratori addetti ai Videoterminali (VDT) è prevista una pausa di:", a: ["15 minuti ogni 120 minuti di applicazione continuativa", "10 minuti ogni ora", "30 minuti ogni 4 ore"], correct: 0 },
    { q: "La distanza ottimale tra gli occhi dell'operatore e schermo del VDT è di:", a: ["20-30 cm", "50-70 cm", "Oltre 1 metro"], correct: 1 },
    { q: "Quali sono i fattori di rischio nella Movimentazione Manuale dei Carichi (MMC)?", a: ["Peso del carico, frequenza, postura", "Solo il peso del carico", "L'età dell'operatore e il sesso"], correct: 0 },
    { q: "Secondo il metodo NIOSH, qual è il peso massimo sollevabile in condizioni ideali per un uomo adulto?", a: ["15 kg", "25 kg", "30 kg"], correct: 1 },
    { q: "La valutazione dello stress lavoro-correlato prende in esame:", a: ["Solo i carichi fisici pesanti", "I fattori di natura organizzativa e relazionale", "Le patologie pregresse del lavoratore"], correct: 1 },
    { q: "La temperatura ideale in uffici durante la stagione invernale dovrebbe essere:", a: ["18-20°C", "20-22°C", "24-26°C"], correct: 1 },
    { q: "Come si previene principalmente il rischio di scivolamento in piano?", a: ["Correndo per ridurre il tempo di esposizione", "Mantenendo i pavimenti puliti e usando calzature idonee", "Saltando le zone bagnate"], correct: 1 },
    { q: "I cartelli di Divieto hanno forma e colore:", a: ["Rotonda con bordi rossi e pittogramma nero", "Triangolare gialla", "Quadrata verde"], correct: 0 },
    { q: "I cartelli di Salvataggio o Soccorso hanno forma e colore:", a: ["Rotonda azzurra", "Quadrata o rettangolare verde con pittogramma bianco", "Triangolare rossa"], correct: 1 },
    { q: "Cosa si intende per 'contatto elettrico diretto'?", a: ["Il contatto con una parte normalmente in tensione", "Il contatto con la carcassa di una lavatrice guasta", "Un cortocircuito tra due fili"], correct: 0 },
    { q: "I lavoratori notturni sono soggetti a sorveglianza sanitaria con periodicità almeno:", a: ["Annuale", "Biennale", "Quinquennale"], correct: 1 },
    { q: "Per le lavoratrici in gravidanza sono vietati:", a: ["Tutti i lavori d'ufficio", "Lavori notturni, MMC ed esposizione a radiazioni", "I lavori a contatto con il pubblico"], correct: 1 },
    { q: "Il divieto di assunzione di alcol e droghe vale per:", a: ["Tutti i lavoratori", "Le mansioni a rischio (es. mulettisti, autisti, lavori in quota)", "Solo i dirigenti"], correct: 1 },
    { q: "La postura corretta al computer prevede:", a: ["Schiena staccata dallo schienale e gambe incrociate", "Schiena ben appoggiata, piedi a terra e angolo gomito/ginocchia a 90°", "Monitor più alto degli occhi"], correct: 1 },
    { q: "L'ergonomia studia:", a: ["La tossicità delle sostanze chimiche", "L'adattamento del lavoro all'uomo e viceversa", "Le normative sui contratti di lavoro"], correct: 1 }
];

window.POOL_ALTO = [
    { q: "Come si riconosce la pericolosità di un agente chimico?", a: ["Dal colore della sostanza", "Dall'Etichetta e dalla Scheda Dati di Sicurezza (SDS)", "Dall'odore pungente"], correct: 1 },
    { q: "La Scheda Dati di Sicurezza (SDS) è composta da quante sezioni?", a: ["10 sezioni", "16 sezioni", "20 sezioni"], correct: 1 },
    { q: "Quali sono le principali vie di trasmissione del rischio biologico?", a: ["Aerea, ematica, contatto cutaneo-mucoso", "Esclusivamente per ingestione", "Tramite i campi elettromagnetici"], correct: 0 },
    { q: "Qual è l'obbligo prioritario in presenza di agenti cancerogeni?", a: ["Sostituirli se tecnicamente possibile", "Fornire maschere ffp2", "Ridurre l'orario di lavoro"], correct: 0 },
    { q: "Chi tiene e aggiorna il Registro degli esposti ad agenti cancerogeni?", a: ["L'Ispettorato del Lavoro", "Il Datore di Lavoro per il tramite del Medico Competente", "L'ASL territoriale"], correct: 1 },
    { q: "La pericolosità dell'amianto è legata principalmente a:", a: ["Ingestione di particelle", "Inalazione delle fibre aerodisperse", "Contatto prolungato con la pelle"], correct: 1 },
    { q: "Qual è il valore superiore di azione per l'esposizione al rumore?", a: ["80 dB(A)", "85 dB(A)", "87 dB(A)"], correct: 1 },
    { q: "Oltre gli 85 dB(A) di esposizione al rumore, il Datore di Lavoro deve:", a: ["Mettere a disposizione i DPI uditivi", "Fornire i DPI uditivi e imporne l'uso obbligatorio", "Sospendere la produzione"], correct: 1 },
    { q: "L'esposizione a vibrazioni del sistema mano-braccio può causare:", a: ["Malattie respiratorie", "La sindrome del dito bianco (fenomeno di Raynaud)", "Problemi visivi"], correct: 1 },
    { q: "Cosa significa la sigla ATEX?", a: ["Atmosfere Tossiche", "Atmosfere Esplosive", "Agenti Tossici Estremi"], correct: 1 },
    { q: "Qual è il rischio principale nei lavori in Spazi Confinati?", a: ["Scivolamento in piano", "Asfissia, intossicazione, esplosione", "Rumore eccessivo"], correct: 1 },
    { q: "Per definizione, i 'Lavori in Quota' partono da un'altezza di:", a: ["1 metro", "2 metri rispetto ad un piano stabile", "3 metri"], correct: 1 },
    { q: "I DPI di 3° Categoria a cosa servono?", a: ["A proteggere da rischi di lesioni lievi", "A proteggere da rischi di morte o lesioni gravi e permanenti", "A migliorare la visibilità del lavoratore"], correct: 1 },
    { q: "L'acronimo ROA indica:", a: ["Radiazioni Ottiche Artificiali", "Rischi Operativi Aziendali", "Reazioni Ossidative Anomale"], correct: 0 },
    { q: "L'utilizzo dei DPI anticaduta richiede:", a: ["Solo la consegna manuale", "La firma di una ricevuta", "Formazione e addestramento pratico obbligatorio"], correct: 2 }
];

window.POOL_DIRIGENTI = [
    { q: "Quale responsabilità principale ha il Dirigente per la sicurezza?", a: ["Organizzare il lavoro e vigilare", "Attuare le direttive del Datore di Lavoro", "Acquistare i DPI"], correct: 1 },
    { q: "Il Preposto può sospendere i lavori?", a: ["Sì, in caso di pericolo grave e imminente", "No, mai", "Solo se autorizzato dal RLS"], correct: 0 },
    { q: "Cosa deve fare il preposto se rileva un'anomalia nei macchinari?", a: ["Ripararla da solo", "Segnalarla tempestivamente al datore di lavoro o dirigente", "Ignorarla se non è grave"], correct: 1 },
    { q: "Il Dirigente può essere delegato alla valutazione dei rischi (DVR)?", a: ["Sì, sempre", "No, è un obbligo indelegabile del Datore di Lavoro", "Sì, se ha le competenze"], correct: 1 },
    { q: "La formazione del Preposto va aggiornata ogni:", a: ["2 anni", "5 anni", "Non scade"], correct: 0 }
];

window.POOL_CANTIERI = [
    { q: "Cos'è il PSC?", a: ["Piano di Sicurezza e Coordinamento", "Piano Sicurezza Cantieri", "Programma Sviluppo Competenze"], correct: 0 },
    { q: "Chi redige il POS (Piano Operativo di Sicurezza)?", a: ["Il CSE", "Il Datore di Lavoro dell'impresa esecutrice", "Il Committente"], correct: 1 },
    { q: "Qual è la distanza minima da linee elettriche aeree non protette?", a: ["1 metro", "3 metri", "5 metri"], correct: 2 },
    { q: "A che altezza è obbligatorio il parapetto per lavori in quota?", a: ["Oltre i 2 metri", "Oltre i 3 metri", "Oltre 1.5 metri"], correct: 0 },
    { q: "Il ponteggio deve essere autorizzato tramite:", a: ["PiMUS", "DVR", "DUVRI"], correct: 0 }
];

window.POOL_ATTREZZATURE = [
    { q: "Qual è la principale causa di infortunio mortale con il carrello elevatore?", a: ["Urto contro scaffalature", "Ribaltamento e schiacciamento del conducente", "Caduta del carico"], correct: 1 },
    { q: "Cosa bisogna fare prima di usare una PLE?", a: ["Controllare il livello del carburante", "Ispezione visiva e controllo stabilizzatori/terreno", "Indossare occhiali scuri"], correct: 1 },
    { q: "A bordo della cesta della PLE è obbligatorio:", a: ["Agganciare l'imbracatura all'apposito punto di ancoraggio", "Stare seduti", "Usare guanti dielettrici"], correct: 0 },
    { q: "Il diagramma di carico di una gru serve a determinare:", a: ["Il consumo di carburante", "La portata massima in base allo sbraccio", "La velocità del vento"], correct: 1 },
    { q: "La cintura di sicurezza sul carrello elevatore o trattore serve a:", a: ["Trattenere l'operatore all'interno del posto di guida in caso di ribaltamento", "Evitare multe", "Aumentare la stabilità del mezzo"], correct: 0 }
];

window.POOL_PS = [
    { q: "Qual è il primo numero da chiamare in caso di emergenza sanitaria grave?", a: ["112 / 118", "Il Medico Competente", "I familiari dell'infortunato"], correct: 0 },
    { q: "Cosa significa l'acronimo BLS?", a: ["Basic Life Support", "Basic Level Security", "Blood Loss System"], correct: 0 },
    { q: "In caso di emorragia abbondante (non arteriosa), la prima cosa da fare è:", a: ["Fare un laccio emostatico", "Compressione diretta sulla ferita", "Lavare con acqua calda"], correct: 1 },
    { q: "Cosa NON fare in caso di sospetta frattura vertebrale?", a: ["Chiamare i soccorsi", "Spostare l'infortunato senza barella rigida", "Coprire l'infortunato"], correct: 1 },
    { q: "La cassetta di primo soccorso in azienda deve essere:", a: ["Chiusa a chiave", "Facilmente accessibile, segnalata e controllata periodicamente", "Custodita dal datore di lavoro a casa"], correct: 1 }
];

window.POOL_AI = [
    { q: "Quali sono gli elementi del 'Triangolo del Fuoco'?", a: ["Combustibile, Comburente, Innesco", "Legno, Aria, Scintilla", "Calore, Fumo, Gas"], correct: 0 },
    { q: "Per spegnere un incendio di natura elettrica, quale estintore è VIETATO?", a: ["A polvere", "A CO2", "Ad acqua"], correct: 2 },
    { q: "Come va direzionato il getto dell'estintore?", a: ["Dall'alto verso il basso", "Alla base delle fiamme con movimento a ventaglio", "Al centro del fumo"], correct: 1 },
    { q: "Le porte delle vie di esodo devono aprirsi:", a: ["Verso l'interno", "Nel verso dell'esodo (a spinta)", "Tramite badge"], correct: 1 },
    { q: "In caso di allarme incendio, cosa NON bisogna assolutamente usare?", a: ["Le scale", "Gli ascensori", "Le porte tagliafuoco"], correct: 1 }
];
