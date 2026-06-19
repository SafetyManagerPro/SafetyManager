// js/data.js

// ==========================================
// DATABASE CORSI E SYLLABUS ANALITICO (INTEGRALE CON ASR 2025)
// ==========================================
window.DB_CORSI = {
    lav_basso: { t: "Formazione Lavoratori - Rischio Basso", ore: 8, scad: 5, risk: "RB", code: "FL", norma: "D.Lgs. 81/08 Art. 37 commi 1 e 3 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 4, m: "Modulo Formazione Generale", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Normativa generale SSL (D.Lgs. 81/08).</li><li>I concetti di rischio, danno, prevenzione, protezione.</li><li>Organizzazione della prevenzione aziendale.</li><li>Diritti, doveri e sanzioni per i vari soggetti aziendali (Art. 20).</li><li>Gli organi di vigilanza, controllo e assistenza.</li></ul>" },
        { ud: "UD2", ore: 4, m: "Modulo Formazione Specifica (R. Basso)", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Rischi infortunistici, meccanici ed elettrici generali.</li><li>Microclima, illuminazione e Rischio da Videoterminali (VDT).</li><li>Movimentazione manuale dei carichi e posture incongrue.</li><li>Segnaletica di sicurezza e DPI base.</li><li>Procedure di esodo, antincendio e primo soccorso.</li></ul>" }
    ]},
    lav_medio: { t: "Formazione Lavoratori - Rischio Medio", ore: 12, scad: 5, risk: "RM", code: "FL", norma: "D.Lgs. 81/08 Art. 37 commi 1 e 3 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 4, m: "Modulo Formazione Generale", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>La legislazione base della sicurezza sul lavoro.</li><li>Pericolo, rischio e danno: concetti fondamentali.</li><li>Soggetti della prevenzione: compiti, obblighi e responsabilità.</li><li>Sistema istituzionale, organi di vigilanza e sistema sanzionatorio.</li></ul>" },
        { ud: "UD2", ore: 4, m: "Modulo Specifica (Infortuni e Attrezzature)", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Rischi infortunistici meccanici, elettrici e attrezzature.</li><li>Rischio cadute dall'alto e procedure in quota.</li><li>Ambienti di lavoro e segnaletica di sicurezza.</li><li>Dispositivi di Protezione Individuale (DPI) e Collettiva (DPC).</li></ul>" },
        { ud: "UD3", ore: 4, m: "Modulo Specifica (Salute ed Emergenze)", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Rischio da Agenti Chimici, Biologici e Fisici (rumore, vibrazioni).</li><li>Fattori ergonomici (MMC) e Stress Lavoro Correlato.</li><li>Le emergenze: esodo, antincendio e primo soccorso.</li><li>Gestione incidenti e mancati infortuni (Near Miss).</li></ul>" }
    ]},
    lav_alto: { t: "Formazione Lavoratori - Rischio Alto", ore: 16, scad: 5, risk: "RA", code: "FL", norma: "D.Lgs. 81/08 Art. 37 commi 1 e 3 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 4, m: "Modulo Formazione Generale", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>D.Lgs 81/08: principi della prevenzione e organizzazione.</li><li>Ruoli, diritti, doveri e sanzioni nel sistema aziendale.</li><li>Il Documento di Valutazione dei Rischi (DVR).</li><li>Sistema pubblico di vigilanza, controllo e assistenza.</li></ul>" },
        { ud: "UD2", ore: 4, m: "Modulo Specifica (Rischi Infortunistici)", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Macchine e attrezzature specifiche di settore industriale.</li><li>Rischio elettrico e rischio da atmosfere esplosive (ATEX).</li><li>Cantieri, lavori in quota e procedure per Spazi Confinati.</li><li>DPI di terza categoria: cenni e impieghi salvavita.</li></ul>" },
        { ud: "UD3", ore: 4, m: "Modulo Specifica (Rischi Salute / Igiene)", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Rischi chimici, cancerogeni, mutageni e amianto.</li><li>Agenti biologici e zoonosi professionali.</li><li>Rischi fisici (Rumore, vibrazioni, campi elettromagnetici, ROA).</li><li>Fattori psicosociali e stress lavoro-correlato.</li></ul>" },
        { ud: "UD4", ore: 4, m: "Modulo Specifica (Procedure ed Emergenze)", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Movimentazione manuale carichi complessi e merci pericolose.</li><li>Segnaletica, compartimentazione e vie di fuga.</li><li>Gestione attiva emergenze incendio e malori improvvisi.</li><li>Procedure operative di sicurezza e protocolli d'esodo aziendali.</li></ul>" }
    ]},
    dl_base: { t: "Datore di Lavoro - Corso Base Universale (16h)", ore: 16, scad: 5, risk: "DL", code: "DL", norma: "D.Lgs. 81/08 Art. 34 commi 2 e 3 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 8, m: "Modulo Giuridico Normativo (ASR 2025)", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Il DLGS 81/08. Delega di funzioni, responsabilità civili, penali, D.Lgs 231/01.</li><li>Soggetti del sistema: RSPP, Medico Competente, RLS, Dirigenti, Preposti.</li><li>Vigilanza, prescrizioni INL/ASL e sistema sanzionatorio per le aziende.</li></ul>" },
        { ud: "UD2", ore: 8, m: "Gestione, Appalti e DVR", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Criteri per la redazione del Documento Valutazione Rischi (DVR).</li><li>Obblighi di qualifica tecnico-professionale per appaltatori e gestione DUVRI.</li><li>Modelli di Organizzazione e Gestione (MOG) per la prevenzione reati (Art. 30).</li><li>Informazione, formazione e sorveglianza sanitaria in azienda.</li></ul>" }
    ]},
    dl_spp_comune: { t: "DL SPP - Modulo Comune (Senza Rischio Specifico) (8h)", ore: 8, scad: 5, risk: "DLSPP", code: "DLSPP", norma: "D.Lgs. 81/08 Art. 34 commi 2 e 3 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 8, m: "Modulo Comune Prevenzione e Protezione", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Individuazione dei fattori di rischio e valutazione (Metodologie).</li><li>Misure tecniche, organizzative e procedurali di prevenzione.</li><li>Elaborazione del piano delle misure di sicurezza.</li></ul>" }
    ]},
    dl_spp_agri: { t: "DL SPP - Modulo Comune + Agricoltura/Zootecnica (24h)", ore: 24, scad: 5, risk: "DLSPP", code: "DLSPP", norma: "D.Lgs. 81/08 Art. 34 commi 2 e 3 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 8, m: "Modulo Comune Prevenzione", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Individuazione dei fattori di rischio e valutazione (Metodologie).</li><li>Misure tecniche, organizzative e procedurali.</li></ul>" },
        { ud: "UD2", ore: 16, m: "Modulo Integrativo 1: Agricoltura", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Rischi specifici: macchine agricole, trattori, agenti biologici e chimici (fitofarmaci).</li><li>Zootecnia e movimentazione animali. Lavori in serra.</li></ul>" }
    ]},
    dl_spp_pesca: { t: "DL SPP - Modulo Comune + Pesca (20h)", ore: 20, scad: 5, risk: "DLSPP", code: "DLSPP", norma: "D.Lgs. 81/08 Art. 34 commi 2 e 3 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 8, m: "Modulo Comune Prevenzione", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Individuazione dei fattori di rischio e valutazione (Metodologie).</li><li>Misure tecniche, organizzative e procedurali.</li></ul>" },
        { ud: "UD2", ore: 12, m: "Modulo Integrativo 2: Pesca", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Rischi specifici a bordo: stabilità, cadute in mare, rumore, celle frigorifere.</li><li>Attrezzature di sollevamento e movimentazione a bordo.</li></ul>" }
    ]},
    dl_spp_costruzioni: { t: "DL SPP - Modulo Comune + Costruzioni (24h)", ore: 24, scad: 5, risk: "DLSPP", code: "DLSPP", norma: "D.Lgs. 81/08 Art. 34 commi 2 e 3 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 8, m: "Modulo Comune Prevenzione", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Individuazione dei fattori di rischio e valutazione (Metodologie).</li><li>Misure tecniche, organizzative e procedurali.</li></ul>" },
        { ud: "UD2", ore: 16, m: "Modulo Integrativo 3: Costruzioni", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Rischi specifici di cantiere: lavori in quota, scavi, demolizioni.</li><li>Rischio elettrico di cantiere, interferenze (POS, PSC), uso MMT e gru.</li></ul>" }
    ]},
    dl_spp_chimico: { t: "DL SPP - Modulo Comune + Chimico-Petrolchimico (24h)", ore: 24, scad: 5, risk: "DLSPP", code: "DLSPP", norma: "D.Lgs. 81/08 Art. 34 commi 2 e 3 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 8, m: "Modulo Comune Prevenzione", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Individuazione dei fattori di rischio e valutazione (Metodologie).</li><li>Misure tecniche, organizzative e procedurali.</li></ul>" },
        { ud: "UD2", ore: 16, m: "Modulo Integrativo 4: Chimico", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Sostanze pericolose (REACH/CLP), rischio cancerogeno e mutageno.</li><li>Atmosfere esplosive (ATEX), grandi rischi, impianti in pressione.</li></ul>" }
    ]},
    preposto: { t: "Preposto Vigilanza Attiva (12h)", ore: 12, scad: 2, risk: "PREP", code: "PR", norma: "D.Lgs. 81/08 Art. 37 comma 7 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 4, m: "Modulo Giuridico - Normativo", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Individuazione del preposto: art. 2 D.Lgs 81/08.</li><li>Il principio di effettività e il 'preposto di fatto'.</li><li>Compiti e obblighi (Art. 19): la Vigilanza Attiva.</li><li>Responsabilità civile, penale e sistema sanzionatorio applicabile.</li></ul>" },
        { ud: "UD2", ore: 4, m: "Modulo Gestionale e Rischi", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Modalità di esercizio della funzione di controllo.</li><li>Interruzione dell'attività in caso di pericolo grave e immediato.</li><li>Valutazione dei rischi, DUVRI e appalti: il ruolo del preposto sul campo.</li><li>Incidenti e infortuni mancati (Near Miss): individuazione e segnalazione.</li></ul>" },
        { ud: "UD3", ore: 4, m: "Modulo Comunicazione e Formazione", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Relazione con DL, Dirigenti, RSPP, RLS e Lavoratori.</li><li>Tecniche di comunicazione e sensibilizzazione per i lavoratori.</li><li>La gestione delle resistenze e la leadership per la sicurezza.</li><li>Verifica dell'efficacia dell'addestramento (nuovi assunti e interinali).</li></ul>" }
    ]},
    dirigente: { t: "Dirigente Sicurezza (12h)", ore: 12, scad: 5, risk: "DIR", code: "DI", norma: "D.Lgs. 81/08 Art. 37 comma 7 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 4, m: "Modulo Giuridico Normativo", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>La figura del Dirigente: autonomia decisionale e di spesa.</li><li>Delega di funzioni (Art. 16 D.Lgs 81/08) e requisiti formali.</li><li>Responsabilità amministrativa degli enti (D.Lgs. 231/2001).</li><li>Gestione appalti (Art. 26), somministrazione, contratti d'opera e DUVRI.</li></ul>" },
        { ud: "UD2", ore: 4, m: "Organizzazione e Sistemi di Gestione", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Modelli di organizzazione (Art. 30 D.Lgs 81/2008) e asseverazione.</li><li>Sistemi di gestione SSL (ISO 45001) e ciclo di Deming (PDCA).</li><li>Ruolo del Dirigente nell'organizzazione del servizio prevenzione e protezione.</li><li>Sorveglianza Sanitaria e gestione del Medico Competente.</li></ul>" },
        { ud: "UD3", ore: 4, m: "Rischi, Misure e Comunicazione", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Individuazione delle misure tecniche, organizzative e procedurali.</li><li>Fattori di rischio emergenti (smart working, tecnostress, invecchiamento).</li><li>Gestione delle emergenze, antincendio e primo soccorso.</li><li>Riunione periodica (Art. 35), relazioni sindacali e comunicazione efficace.</li></ul>" }
    ]},
    mod_cantieri: { t: "Modulo Aggiuntivo Cantieri (DL/Dirigente) (6h)", ore: 6, scad: 5, risk: "DIR", code: "MC", norma: "D.Lgs. 81/08 Art. 97 comma 3-ter e Accordo Stato Regioni del 17 Aprile 2025", prog: [
        { ud: "UD1", ore: 3, m: "Soggetti e Piani di Sicurezza", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Obblighi e responsabilità (Committente, RL, CSP, CSE, Imprese affidatarie).</li><li>Redazione dei piani di sicurezza (PSC, POS, PSS): finalità e contenuti.</li><li>Fascicolo dell'opera e gestione dei costi della sicurezza.</li></ul>" },
        { ud: "UD2", ore: 3, m: "Verifica e Gestione del Coordinamento", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Obblighi dell'impresa affidataria ex art. 97 D.Lgs. 81/2008.</li><li>Il cronoprogramma dei lavori e la gestione delle interferenze.</li><li>Verifica della congruenza dei POS delle imprese esecutrici.</li><li>Sospensione dei lavori in caso di pericolo grave e imminente.</li></ul>" }
    ]},
    amb_confinati: { t: "Ambienti Sospetti Inquinamento o Confinati (12h)", ore: 12, scad: 5, risk: "SPEC", code: "SC", norma: "D.P.R. 177/2011 Art. 2 lett. d) e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 4, m: "Modulo Giuridico-Tecnico", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Normativa di riferimento (D.P.R. 177/2011). Identificazione ambienti.</li><li>Analisi fattori di rischio: asfissia, intossicazione, esplosione, seppellimento.</li><li>Procedure d'ingresso, permessi di lavoro (Permit to Work).</li><li>Monitoraggio gas e strumentazioni salvavita (Rilevatori).</li></ul>" },
        { ud: "UD2", ore: 8, m: "Modulo Addestramento Pratico", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Apparecchi Protezione Vie Respiratorie (APVR), autorespiratori e filtri.</li><li>Indossamento imbracature di sicurezza, uso del tripode e verricelli.</li><li>Sistemi di comunicazione uomo a terra / uomo in quota.</li><li>Simulazione di estrazione e recupero infortunato in emergenza.</li></ul>" }
    ]},
    attr_carrelli_ind: { t: "Carrelli Elevatori Industriali Semoventi (12h)", ore: 12, scad: 5, risk: "SPEC", code: "CE", norma: "D.Lgs. 81/08 Art. 73 comma 5 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 8, m: "Modulo Teorico-Tecnico", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Normativa Art. 73 D.Lgs 81/08. Componenti e sicurezze dei muletti.</li><li>Fisica della stabilità statica e dinamica. Centro di gravità, ribaltamento.</li><li>Tabelle di portata, verifica dell'equilibrio e limiti di impiego.</li><li>Circolazione, viabilità aziendale, dispositivi di avvertimento.</li></ul>" },
        { ud: "UD2", ore: 4, m: "Modulo Pratico Carrelli", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Controlli pre-utilizzo visivi e funzionali (freni, idraulica, avvisatori).</li><li>Guida a vuoto e a carico su percorso ostacoli e marcia indietro.</li><li>Prelevamento e deposito carichi da scaffalature/cataste. Sosta sicura.</li></ul>" }
    ]},
    attr_carrelli_all: { t: "Carrelli Elev. Ind + Telescopici + Rotativi (16h)", ore: 16, scad: 5, risk: "SPEC", code: "CE", norma: "D.Lgs. 81/08 Art. 73 comma 5 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 8, m: "Modulo Teorico-Tecnico Integrato", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Classificazione di tutti i carrelli (Frontali, Telescopici, Rotativi).</li><li>Limiti di impiego, stabilità, diagrammi di carico e sbraccio.</li><li>Comandi, organi di presa (forche, falcone, argano) e limitatori.</li></ul>" },
        { ud: "UD2", ore: 8, m: "Modulo Pratico Multimacchina", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Pratica muletto frontale: sollevamento, trasporto e stoccaggio.</li><li>Pratica telescopico/rotativo: posizionamento stabilizzatori, estensione braccio.</li><li>Verifica strumentazione di controllo del momento ribaltante.</li><li>Uso accessori speciali e manovre d'emergenza.</li></ul>" }
    ]},
    attr_ple: { t: "Piattaforme Lavoro Elevabili PLE (10h)", ore: 10, scad: 5, risk: "SPEC", code: "PLE", norma: "D.Lgs. 81/08 Art. 73 comma 5 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 4, m: "Modulo Teorico-Tecnico", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Definizione e categorie PLE (verticali, articolate, telescopiche).</li><li>Responsabilità dell'operatore, limiti di carico e inclinazione.</li><li>Analisi rischi (elettrocuzione, caduta, ribaltamento, effetto catapulta).</li><li>Scelta e corretto utilizzo dei DPI anticaduta e punti di ancoraggio sul cesto.</li></ul>" },
        { ud: "UD2", ore: 6, m: "Modulo Pratico PLE", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Ispezione pre-operativa e test dispositivi interblocco/emergenza.</li><li>Valutazione del sito, delimitazione area, posizionamento stabilizzatori.</li><li>Manovre in quota, avvicinamento all'area di lavoro, guida traslata (ove ammessa).</li><li>Manovre di emergenza e discesa manuale dal cesto per soccorso.</li></ul>" }
    ]},
    attr_mmt_esc: { t: "Macchine Movimento Terra/Escavatori Idraulici (10h)", ore: 10, scad: 5, risk: "SPEC", code: "MMT", norma: "D.Lgs. 81/08 Art. 73 comma 5 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 4, m: "Modulo Teorico-Tecnico", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Normativa macchine e conformità. Struttura escavatori idraulici.</li><li>Fattori di rischio: ribaltamento, contatti accidentali con reti sotterranee, polveri.</li><li>Stabilità in fase di scavo/sollevamento e configurazione attrezzature.</li><li>Agenti fisici connessi all'uso (rumore e vibrazioni corpo intero).</li></ul>" },
        { ud: "UD2", ore: 6, m: "Modulo Pratico Escavatori Idraulici", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Pianificazione del percorso e ispezione cantiere.</li><li>Manovre base: avanzamento, rotazione torretta, sollevamento braccio/benna.</li><li>Operazioni di sbancamento, profilatura scarpate, riempimento trincee.</li><li>Uso come apparecchio di sollevamento carichi (funi, fasce, limitatori).</li></ul>" }
    ]},
    attr_mmt_all: { t: "Macchine Movimento Terra (Esc+Pale+Terne) (16h)", ore: 16, scad: 5, risk: "SPEC", code: "MMT", norma: "D.Lgs. 81/08 Art. 73 comma 5 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 4, m: "Modulo Teorico-Tecnico MMT", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Classificazione macchine movimento terra e autoribaltabili.</li><li>Idraulica, organi di direzione, frenatura e zone cieche (visibilità).</li><li>Valutazione dei rischi in base al ciclo operativo (scavo, carico, spargimento).</li><li>Dispositivi ROPS/FOPS e cinture di sicurezza.</li></ul>" },
        { ud: "UD2", ore: 12, m: "Modulo Pratico Integrato", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Pratica Escavatori: scavo di trincee e sollevamento tubi.</li><li>Pratica Pale Frontali/Terne: caricamento, traslazione su fondo sconnesso, agganci rapidi.</li><li>Pratica Autoribaltabili: spargimento e scarico materiali in pendenza.</li><li>Rimessaggio e carico su rimorchi.</li></ul>" }
    ]},
    attr_gru_autocarro: { t: "Gru per Autocarro (12h)", ore: 12, scad: 5, risk: "SPEC", code: "GRU", norma: "D.Lgs. 81/08 Art. 73 comma 5 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 4, m: "Modulo Teorico-Tecnico", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Caratteristiche e tipologie di gru per autocarro. Nozioni di fisica e stabilità.</li><li>Lettura del diagramma di carico: sbraccio idraulico/manuale, portata.</li><li>Sicurezza attiva/passiva, limitatori di momento e finecorsa.</li><li>Fattori ambientali (vento, linee elettriche ad alta tensione). Segnaletica gestuale.</li></ul>" },
        { ud: "UD2", ore: 8, m: "Modulo Pratico Gru Autocarro", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Controlli quotidiani e apertura sicura stabilizzatori (valutazione terreno).</li><li>Manovre con radiocomando: presa, sollevamento e posizionamento di precisione.</li><li>Imbracatura corretta dei carichi: baricentro, fasce, ganci e grilli.</li><li>Recupero emergenza, ripiegamento bracci in sagoma stradale.</li></ul>" }
    ]},
    attr_gru_torre: { t: "Gru a Torre rotazione basso e alto (14h)", ore: 14, scad: 5, risk: "SPEC", code: "GRU", norma: "D.Lgs. 81/08 Art. 73 comma 5 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 8, m: "Modulo Teorico-Tecnico", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Normativa sugli apparecchi di sollevamento fissi in cantiere.</li><li>Torre, freccia, controfreccia, zavorre e meccanismi di rotazione/distribuzione.</li><li>Freni di stazionamento, finecorsa sollevamento/rotazione, anemometro.</li><li>Divieti: tiro obliquo, strappo di carichi interrati, abbandono carico sospeso.</li></ul>" },
        { ud: "UD2", ore: 6, m: "Modulo Pratico Gru a Torre", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Test limitatori pre-avvio e controllo visivo funi in acciaio.</li><li>Comunicazione con imbracatore. Controllo dell'oscillazione del carico (pendolamento).</li><li>Sollevamento in percorsi ostacolati (simulazione getto calcestruzzo).</li><li>Messa fuori servizio: braccio in libera rotazione (banderuola) per il vento.</li></ul>" }
    ]},
    attr_pompe: { t: "Pompe per Calcestruzzo (14h)", ore: 14, scad: 5, risk: "SPEC", code: "CLS", norma: "D.Lgs. 81/08 Art. 73 comma 5 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 7, m: "Modulo Teorico-Tecnico", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Componenti pompe calcestruzzo (braccio, tramoggia, gruppo pompante).</li><li>Rischi elettrocuzione per contatto braccio/cavi. Rischio scoppio tubazioni.</li><li>Aree di piazzamento: valutazione cigli di scavo e portanza terreno.</li><li>Uso DPI specifici (occhiali, guanti antivibranti) contro schizzi di cls caustico.</li></ul>" },
        { ud: "UD2", ore: 7, m: "Modulo Pratico", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Verifica tenuta flange e guarnizioni. Piazzamento stabilizzatori e piastre ripartitrici.</li><li>Distensione sicura del braccio articolato via radiocomando.</li><li>Simulazione pompaggio in varie configurazioni costruttive (pilastri, solette).</li><li>Procedure di lavaggio in sicurezza e sblocco intasamenti.</li></ul>" }
    ]},
    attr_trattori: { t: "Trattori Agricoli o Forestali (8h)", ore: 8, scad: 5, risk: "SPEC", code: "TRA", norma: "D.Lgs. 81/08 Art. 73 comma 5 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 3, m: "Modulo Teorico-Tecnico", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Macchine agricole a ruote e cingoli: organi di trasmissione e cardano.</li><li>Rischi specifici: ribaltamento in pendenza, protezione albero cardanico.</li><li>Requisiti dei telai di protezione (ROPS) e sistemi di ritenzione (cinture).</li><li>DPI contro rumore, polveri e fitofarmaci.</li></ul>" },
        { ud: "UD2", ore: 5, m: "Modulo Pratico", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Controlli visivi e funzionali. Pianificazione campo (pendenze).</li><li>Guida senza attrezzature e con rimorchio (1-2 assi).</li><li>Aggancio in sicurezza di attrezzature portate (es. fresa, aratro) e trainate (rimorchio).</li><li>Gestione baricentro dinamico durante lavoro con decespugliatore braccio laterale.</li></ul>" }
    ]},
    lav_quota: { t: "Lavori in Quota e DPI 3° Categoria (8h)", ore: 8, scad: 5, risk: "SPEC", code: "QUO", norma: "D.Lgs. 81/08 Titolo IV e Art. 77 comma 5 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 4, m: "Modulo Teorico (Fisica e Normativa)", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Definizione di lavoro in quota. Fisica della caduta (fattore di caduta, tirante d'aria, forza d'arresto).</li><li>Tipologie di DPI di 3° Categoria (imbracature, cordini, assorbitori di energia).</li><li>Sistemi di ancoraggio provvisori e permanenti (linee vita). Sindrome da sospensione.</li></ul>" },
        { ud: "UD2", ore: 4, m: "Modulo Addestramento Pratico", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Infilamento, regolazione e ispezione DPI pre-uso.</li><li>Progressione sicura verticale/orizzontale con uso continuo dei connettori.</li><li>Sistemi di posizionamento sul lavoro per operare a mani libere.</li><li>Simulazione di manovra semplice per il soccorso e recupero a terra.</li></ul>" }
    ]},
    rls: { t: "Rappresentante Lavoratori Sicurezza RLS (32h)", ore: 32, scad: 1, risk: "RLS", code: "RLS", norma: "D.Lgs. 81/08 Art. 37 commi 10 e 11 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 8, m: "Principi Giuridici e Organizzazione", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Legislazione generale. Soggetti della prevenzione.</li><li>Funzioni, attribuzioni e tutele del RLS (Art. 50). Organi di vigilanza.</li></ul>" },
        { ud: "UD2", ore: 8, m: "Valutazione e Rischi Infortunistici", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Processo di valutazione dei rischi (DVR). DUVRI.</li><li>Rischi macchine, impianti, cadute, esplosione, incendio.</li></ul>" },
        { ud: "UD3", ore: 8, m: "Rischi Salute ed Ergonomici", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Agenti chimici, biologici, cancerogeni. Agenti fisici (rumore/vibrazioni).</li><li>MMC, VDT. Stress lavoro-correlato.</li></ul>" },
        { ud: "UD4", ore: 8, m: "Relazioni, Comunicazione e Riunioni", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Tecniche di comunicazione e negoziazione.</li><li>La riunione periodica (Art. 35). Analisi incidenti e near miss. Il ruolo proattivo del RLS.</li></ul>" }
    ]},
    primo_soccorso_12h: { t: "Addetto al Primo Soccorso (Gruppo B/C) - 12h", ore: 12, scad: 3, risk: "PS", code: "PS", norma: "D.Lgs. 81/08 Art. 45 comma 2 e D.M. 388/2003", prog: [
        { ud: "UD1", ore: 4, m: "Modulo A", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Allertare il sistema di soccorso.</li><li>Riconoscere un'emergenza sanitaria (valutazione della scena e del malore).</li><li>Attuare gli interventi di primo soccorso.</li></ul>" },
        { ud: "UD2", ore: 4, m: "Modulo B", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Acquisire conoscenze generali sui traumi in ambiente di lavoro (fratture, lussazioni, ustioni).</li><li>Patologie specifiche in azienda.</li></ul>" },
        { ud: "UD3", ore: 4, m: "Modulo C", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Acquisire capacità di intervento pratico.</li><li>Tecniche di rianimazione cardiopolmonare (BLS).</li><li>Medicazioni, bendaggi e manovre pratiche.</li></ul>" }
    ]},
    antincendio_liv2: { t: "Addetto Emergenze e Antincendio (Livello 2) - 8h", ore: 8, scad: 5, risk: "AI", code: "AI", norma: "D.Lgs. 81/08 Art. 46 comma 3 e D.M. 2/9/2021", prog: [
        { ud: "UD1", ore: 2, m: "Teoria L'Incendio", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Principi della combustione e prodotti della combustione.</li><li>Sostanze estinguenti in relazione al tipo di incendio.</li></ul>" },
        { ud: "UD2", ore: 3, m: "Teoria Protezione", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Principali misure di protezione antincendio e vie di esodo.</li><li>Evacuazione in caso di incendio e chiamata dei soccorsi.</li></ul>" },
        { ud: "UD3", ore: 3, m: "Pratica", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Presa visione del registro antincendio e misure sorveglianza.</li><li>Esercitazione pratica sull'uso degli estintori portatili e idranti.</li></ul>" }
    ]},
    agg_lav: { t: "Aggiornamento Lavoratori (6h)", ore: 6, scad: 5, risk: "AGG", code: "FL", norma: "D.Lgs. 81/08 Art. 37 commi 1 e 3 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 6, m: "Aggiornamento Sicurezza", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Evoluzione normativa e giurisprudenziale.</li><li>Aggiornamenti tecnici sui rischi specifici della mansione.</li><li>Modifiche organizzative aziendali e focus sui near miss.</li></ul>" }
    ]},
    agg_prep: { t: "Aggiornamento Preposto (6h) - Biennale", ore: 6, scad: 2, risk: "AGG", code: "PR", norma: "D.Lgs. 81/08 Art. 37 comma 7 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 6, m: "Aggiornamento Vigilanza", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Recenti modifiche normative (obblighi di interruzione attività).</li><li>Evoluzione dei rischi nel reparto.</li><li>Tecniche avanzate di comunicazione e gestione dei conflitti.</li></ul>" }
    ]},
    agg_dir: { t: "Aggiornamento Dirigente (6h)", ore: 6, scad: 5, risk: "AGG", code: "DI", norma: "D.Lgs. 81/08 Art. 37 comma 7 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 6, m: "Aggiornamento Organizzazione", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Evoluzione giurisprudenziale su delega di funzioni e resp. 231.</li><li>Sistemi di gestione e leadership per la sicurezza.</li><li>Gestione appalti e nuovi rischi organizzativi.</li></ul>" }
    ]},
    agg_dl: { t: "Aggiornamento Datore di Lavoro (6h)", ore: 6, scad: 5, risk: "AGG", code: "DL", norma: "D.Lgs. 81/08 Art. 34 commi 2 e 3 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 6, m: "Aggiornamento Gestionale", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Novità giurisprudenziali sulle responsabilità datoriali.</li><li>Miglioramento continuo dei MOG e valutazione efficacia formativa.</li><li>Analisi indicatori infortunistici.</li></ul>" }
    ]},
    agg_dl_spp: { t: "Aggiornamento DL SPP (Ex RSPP) (8h)", ore: 8, scad: 5, risk: "AGG", code: "DLSPP", norma: "D.Lgs. 81/08 Art. 34 commi 2 e 3 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 8, m: "Aggiornamento Rischi e Gestione", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Approfondimenti tecnici e organizzativi. Applicazioni pratiche e simulazioni sui rischi specifici (ASR 2025).</li></ul>" }
    ]},
    agg_pratico_4h: { t: "Agg. Pratico Attrezzature / Spazi Confinati (4h)", ore: 4, scad: 5, risk: "AGG", code: "SPEC", norma: "D.Lgs. 81/08 Art. 73 comma 5 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 4, m: "Pratica e Addestramento", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Ripasso modifiche normative tecniche.</li><li>Effettuazione manovre pratiche di sicurezza e prove in emergenza.</li><li>Verifica mantenimento idoneità operativa.</li></ul>" }
    ]},
    agg_primo_soccorso_4h: { t: "Aggiornamento Primo Soccorso (Gr. B/C) - 4h (Triennale)", ore: 4, scad: 3, risk: "AGG", code: "PS", norma: "D.Lgs. 81/08 Art. 45 comma 2 e D.M. 388/2003", prog: [
        { ud: "UD1", ore: 4, m: "Modulo Pratico", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Ripasso delle tecniche di base e delle manovre pratiche.</li><li>Tecniche di rianimazione cardiopolmonare (BLS).</li></ul>" }
    ]},
    agg_antincendio_liv2_5h: { t: "Aggiornamento Antincendio (Livello 2) - 5h", ore: 5, scad: 5, risk: "AGG", code: "AI", norma: "D.Lgs. 81/08 Art. 46 comma 3 e D.M. 2/9/2021", prog: [
        { ud: "UD1", ore: 2, m: "Teorico", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>L'incendio e la prevenzione antincendio.</li><li>Protezione antincendio e procedure emergenza.</li></ul>" },
        { ud: "UD2", ore: 3, m: "Pratico", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Presa visione del registro antincendio.</li><li>Esercitazioni pratiche sull'uso degli estintori portatili e idranti.</li></ul>" }
    ]},
    agg_rls_4h: { t: "Aggiornamento RLS (4h - Imprese 15-50 dip.)", ore: 4, scad: 1, risk: "AGG", code: "RLS", norma: "D.Lgs. 81/08 Art. 37 commi 10 e 11 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 4, m: "Aggiornamento Normativo RLS", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Evoluzione normativa e giurisprudenziale SSL.</li><li>Approfondimento sui rischi aziendali specifici.</li><li>Tecniche di comunicazione e consultazione dei lavoratori.</li></ul>" }
    ]},
    agg_rls_8h: { t: "Aggiornamento RLS (8h - Imprese >50 dip.)", ore: 8, scad: 1, risk: "AGG", code: "RLS", norma: "D.Lgs. 81/08 Art. 37 commi 10 e 11 e Accordo Stato Regioni del 17 Aprile 2025 (Rep. Atti n. 59/CSR)", prog: [
        { ud: "UD1", ore: 4, m: "Aggiornamento Tecnico/Normativo", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Novità legislative e giurisprudenziali.</li><li>Analisi infortuni, mancate lesioni e malattie professionali.</li></ul>" },
        { ud: "UD2", ore: 4, m: "Gestione e Comunicazione", d: "<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'><li>Valutazione dei rischi e DUVRI.</li><li>Il ruolo proattivo del RLS e tecniche di negoziazione.</li></ul>" }
    ]}
};

// ==========================================
// POOL DOMANDE
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
    { q: "La Riunione Periodica di Sicurezza è obbligatoria per le aziende:", a: ["Con più di 15 lavoratori", "Di qualsiasi dimensione", "Solo nei cantieri edili"], correct: 0 }
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
