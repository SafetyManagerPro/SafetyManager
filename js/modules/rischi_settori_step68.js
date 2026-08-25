// Step 68 - Estensione documentata del catalogo rischi per settore.
// Le schede sono ausili informative: DVR, mansioni e condizioni reali prevalgono sempre.
(function () {
    'use strict';

    window.RISK_CATALOG_VERSION = 'Catalogo settori Step 68 · aggiornato 05/08/2026';
    window.RISK_CATALOG_COMMON_SOURCES = [
        { label: 'INAIL · Profili di rischio di comparto', url: 'https://www.inail.it/portale/ricerca-e-tecnologia/it/terza-missione/applicativi-per-la-salute-e-la-sicurezza-sul-lavoro/profili-di-rischio.html' },
        { label: 'ISTAT · Classificazione ATECO 2025', url: 'https://www.istat.it/classificazione/ateco-2025/' }
    ];

    const sectors = {
        costruzioni: {
            label: 'Costruzioni, edilizia e cantieri', level: 'Profilo settoriale · verificare POS/PSC e DVR',
            ateco: ['41', '42', '43'], keywords: ['edil', 'cantiere', 'costruzion', 'impiantista'],
            sources: [
                { label: 'INAIL · Rischio elettrico nelle costruzioni', url: 'https://www.inail.it/content/dam/inail-hub-site/documenti/catalogo-generale/2025/12/Il%20rischio%20elettrico%20nel%20settore%20delle%20costruzioni.pdf' },
                { label: 'INAIL · Andamento infortunistico nelle costruzioni', url: 'https://www.inail.it/portale/it/inail-comunica/news/notizia.2021.10.con-la-chiusura-dei-cantieri-gli-infortuni-sul-lavoro-nelle-costruzioni-in-forte-diminuzione-nel-2020.html' }
            ],
            risks: [
                ['cadute_alto', 'Cadute dall’alto', 'Ponteggi, coperture, scale, aperture e lavori in quota.', 'Traumi gravi o mortali.', 'Usare accessi e protezioni previsti; non rimuovere parapetti.', 'Opere provvisionali, parapetti, PLE, sistemi anticaduta e addestramento.'],
                ['scavi', 'Scavi e seppellimento', 'Cedimento pareti, caduta nello scavo e presenza di sottoservizi.', 'Schiacciamento, asfissia, folgorazione.', 'Rispettare delimitazioni e procedure di accesso.', 'Armature, pendenze, verifica sottoservizi, controllo terreno e accessi sicuri.'],
                ['mezzi_cantiere', 'Mezzi e viabilità di cantiere', 'Investimento, retromarcia, collisioni e ribaltamento.', 'Urti, schiacciamenti e lesioni mortali.', 'Restare nei percorsi pedonali e mantenere contatto con il conducente.', 'Piano viabilità, segregazione, segnalatore, allarmi e alta visibilità.'],
                ['macchine_edili', 'Macchine e utensili', 'Organi mobili, proiezioni e uso improprio di sega, betoniera, gru e utensili.', 'Tagli, trascinamenti, amputazioni e urti.', 'Usare solo attrezzature autorizzate e integre.', 'Ripari, verifiche, manutenzione, formazione e DPI.'],
                ['elettrico_cantiere', 'Rischio elettrico', 'Quadri, cavi, utensili e linee aeree o interrate.', 'Folgorazione, ustioni e incendio.', 'Non eseguire interventi non autorizzati; segnalare danni.', 'Impianto di cantiere verificato, differenziali, messa a terra e protezioni IP.'],
                ['rumore_vibrazioni', 'Rumore e vibrazioni', 'Martelli demolitori, perforatori, macchine e mezzi.', 'Ipoacusia, disturbi mano-braccio e rachide.', 'Usare DPI e rispettare tempi/rotazioni.', 'Valutazione esposizione, manutenzione, utensili antivibranti e otoprotettori.'],
                ['polveri_silice', 'Polveri, silice e sostanze', 'Taglio, demolizione, cemento, malte, fibre e prodotti chimici.', 'Irritazioni, patologie respiratorie e sensibilizzazione.', 'Limitare la dispersione e usare i DPI indicati.', 'Aspirazione/umido, SDS, segregazione e protezione respiratoria.'],
                ['interferenze', 'Interferenze e caduta materiali', 'Lavorazioni sovrapposte, imprese diverse e carichi sospesi.', 'Urti, schiacciamenti e incidenti concatenati.', 'Rispettare coordinamento, divieti e sequenze operative.', 'PSC/POS, riunioni coordinamento, delimitazioni e cronoprogramma.']
            ]
        },
        agricoltura: {
            label: 'Agricoltura, silvicoltura e pesca', level: 'Profilo settoriale · verificare attività e attrezzature',
            ateco: ['01', '02', '03'], keywords: ['agricol', 'azienda agricola', 'forest', 'pesca', 'allevamento'],
            sources: [
                { label: 'INAIL · Piano nazionale agricoltura', url: 'https://www.inail.it/portale/ricerca-e-tecnologia/it/ambiti-di-ricerca/area-sicurezza-sul-lavoro/agricoltura/piano-nazionale-agricoltura.html' },
                { label: 'INAIL · Vibrazioni meccaniche', url: 'https://www.inail.it/portale/prevenzione-e-sicurezza/it/come-fare-per/conoscere-il-rischio/agenti-fisici/vibrazioni.html' }
            ],
            risks: [
                ['ribaltamento', 'Ribaltamento trattori e macchine', 'Pendenze, terreno cedevole, carichi e manovre scorrette.', 'Schiacciamento e morte.', 'Usare cintura e rispettare limiti di pendenza/velocità.', 'ROPS, cintura, manutenzione, formazione e percorsi sicuri.'],
                ['organi_mobili', 'Organi mobili e presa di forza', 'Alberi cardanici, coclee, cinghie, lame e organi di raccolta.', 'Trascinamento, amputazione e schiacciamento.', 'Arrestare e isolare prima di pulizia o disinceppamento.', 'Carter integri, blocco energia, procedure e abiti aderenti.'],
                ['fitosanitari', 'Prodotti fitosanitari e chimici', 'Preparazione, distribuzione, deriva e rientro nelle aree trattate.', 'Intossicazioni, irritazioni e danni cronici.', 'Seguire etichetta, patentino e tempi di rientro.', 'SDS, deposito dedicato, attrezzature efficienti e DPI specifici.'],
                ['bio_animali', 'Agenti biologici e animali', 'Contatto con animali, deiezioni, punture, muffe e polveri organiche.', 'Zoonosi, allergie, ferite e infezioni.', 'Applicare igiene, segnalare morsi e usare contenimento sicuro.', 'Vaccinazioni ove previste, DPI, pulizia e procedure veterinarie.'],
                ['rumore_vibrazioni', 'Rumore e vibrazioni', 'Trattori, motoseghe, decespugliatori e macchine agricole.', 'Ipoacusia e disturbi osteoarticolari/vascolari.', 'Usare DPI e alternare le attività.', 'Valutazione, manutenzione, sedili/impugnature idonei e otoprotettori.'],
                ['clima_uv', 'Calore, freddo e radiazione solare', 'Lavoro esterno, serre e condizioni meteo estreme.', 'Stress termico, disidratazione, ustioni e ipotermia.', 'Bere, fare pause e usare abbigliamento adatto.', 'Programmazione orari, zone d’ombra, acqua e protezione UV.'],
                ['cadute_tagli', 'Cadute, tagli e lavori forestali', 'Terreni irregolari, scale, motoseghe e caduta di alberi/rami.', 'Fratture, ferite gravi e schiacciamento.', 'Mantenere distanza e rispettare tecniche/zone di abbattimento.', 'Pianificazione, attrezzature idonee, addestramento e DPI forestali.'],
                ['carichi', 'Movimentazione manuale', 'Cassette, sacchi, animali, attrezzi e posture incongrue.', 'Lombalgie, ernie e sovraccarico arti.', 'Usare ausili e tecniche corrette.', 'Meccanizzazione, limiti di peso, rotazione e formazione.']
            ]
        },
        metalmeccanica: {
            label: 'Metalmeccanica e lavorazioni dei metalli', level: 'Profilo settoriale · verificare macchine e sostanze',
            ateco: ['24', '25', '28', '29', '30', '33'], keywords: ['metalmeccan', 'meccanica', 'carpenteria', 'saldatur', 'tornitura'],
            sources: [
                { label: 'INAIL · Infortuni nella metallurgia', url: 'https://www.inail.it/portale/it/inail-comunica/news/notizia.2024.07.metallurgia%2C-tra-il-2018-e-il-2022-gli-infortuni-denunciati-in-calo-del-12%2C2-.html' },
                { label: 'INAIL · Vibrazioni meccaniche', url: 'https://www.inail.it/portale/prevenzione-e-sicurezza/it/come-fare-per/conoscere-il-rischio/agenti-fisici/vibrazioni.html' }
            ],
            risks: [
                ['macchine', 'Macchine utensili e presse', 'Torni, frese, presse, cesoie e rulli con organi in moto.', 'Trascinamento, schiacciamento e amputazione.', 'Non eludere ripari; arrestare prima di intervenire.', 'Ripari/interblocchi, arresti, procedure LOTO e formazione.'],
                ['proiezioni', 'Proiezione di schegge e materiali', 'Smerigliatura, molatura, taglio e rottura utensili.', 'Lesioni oculari, tagli e ustioni.', 'Usare schermi e protezioni oculari/facciali.', 'Carter, utensili idonei, manutenzione e DPI.'],
                ['saldatura', 'Saldatura, fumi e radiazioni ottiche', 'Fumi metallici, gas, UV/IR e metallo caldo.', 'Danni respiratori/oculari, ustioni e incendio.', 'Usare aspirazione e DPI specifici; schermare l’area.', 'Aspirazione localizzata, maschera saldatura, guanti e controllo incendio.'],
                ['rumore', 'Rumore', 'Presse, martelli, smerigliatrici e lavorazioni meccaniche.', 'Ipoacusia, stress e interferenza comunicativa.', 'Usare otoprotettori nelle zone prescritte.', 'Bonifica acustica, manutenzione, segregazione e DPI.'],
                ['vibrazioni', 'Vibrazioni', 'Utensili portatili e mezzi di movimentazione.', 'Disturbi mano-braccio e rachide.', 'Limitare esposizione e usare correttamente gli utensili.', 'Scelta attrezzature, manutenzione, rotazione e guanti ove utili.'],
                ['chimico', 'Oli, fluidi, solventi e trattamenti', 'Nebbie oleose, sgrassanti, vernici e bagni di trattamento.', 'Dermatiti, irritazioni e intossicazioni.', 'Evitare contatto e seguire SDS/procedure.', 'Aspirazione, sostituzione prodotti, guanti e protezione respiratoria.'],
                ['sollevamento', 'Sollevamento e carichi sospesi', 'Carroponti, gru, imbracature e movimentazione pezzi.', 'Schiacciamento, urti e caduta carico.', 'Non sostare sotto carichi; controllare imbracature.', 'Attrezzature verificate, addetti formati, aree segregate e segnali.'],
                ['incendio_atex', 'Incendio ed esplosione', 'Gas, polveri metalliche, oli e lavorazioni a caldo.', 'Ustioni, intossicazione e danni estesi.', 'Rispettare permessi di lavoro e divieti.', 'Valutazione ATEX/incendio, aspirazione, ordine e presidi.']
            ]
        },
        autoriparazione: {
            label: 'Autoriparazione, carrozzerie e pneumatici', level: 'Profilo settoriale · verificare veicoli e impianti',
            ateco: ['45.20', '45.2', '95.31', '95.32'], keywords: ['autofficina', 'autoripar', 'carrozzer', 'gommista', 'pneumatic'],
            sources: [{ label: 'INAIL · Sicurezza nella riparazione dei mezzi a motore', url: 'https://www.inail.it/portale/it/inail-comunica/news/notizia.2019.11.una-officina-virtuale-per-ridurre-gli-infortuni-nella-riparazione-dei-mezzi-a-motore.html' }],
            risks: [
                ['sollevamento_veicoli', 'Sollevamento veicoli', 'Ponti sollevatori, cric e cavalletti; instabilità del mezzo.', 'Schiacciamento e lesioni mortali.', 'Verificare posizionamento e non lavorare su sostegni improvvisati.', 'Ponti verificati, blocchi meccanici, portata nota e manutenzione.'],
                ['utensili', 'Macchine e utensili', 'Smontagomme, equilibratrici, presse e utensili portatili.', 'Tagli, impigliamento e proiezione parti.', 'Usare ripari e arrestare prima di intervenire.', 'Protezione macchine, manutenzione, formazione e DPI.'],
                ['chimico', 'Oli, carburanti, solventi e vernici', 'Contatto/inalazione durante manutenzione e carrozzeria.', 'Dermatiti, irritazioni, intossicazione e sensibilizzazione.', 'Seguire SDS e usare aspirazione/DPI.', 'Sostituzione, contenimento, ventilazione e gestione sversamenti.'],
                ['scarichi', 'Gas di scarico', 'Motori accesi in officina e prove.', 'Intossicazione e danni respiratori.', 'Collegare l’aspirazione allo scarico.', 'Aspirazione localizzata, ventilazione e controllo CO.'],
                ['elettrico_hv', 'Batterie e veicoli elettrici/ibridi', 'Acido, cortocircuito, arco e alta tensione.', 'Ustioni chimiche/elettriche, folgorazione e incendio.', 'Isolare il sistema e operare solo se qualificati.', 'Procedure HV, attrezzi isolati, DPI e area dedicata.'],
                ['incendio', 'Incendio ed esplosione', 'Carburanti, vapori, saldature e ricarica batterie.', 'Ustioni, esplosione e fumi tossici.', 'Eliminare inneschi e rispettare le procedure.', 'Depositi idonei, ventilazione, permessi a caldo e presidi.'],
                ['rumore_vibrazioni', 'Rumore e vibrazioni', 'Avvitatori, smerigliatrici, martelli e prove motore.', 'Ipoacusia e disturbi mano-braccio.', 'Usare DPI e limitare i tempi.', 'Valutazione, manutenzione, utensili idonei e otoprotettori.'],
                ['carichi_posture', 'Carichi e posture incongrue', 'Ruote, ricambi e lavoro sotto/nel veicolo.', 'Lombalgie e sovraccarico articolare.', 'Usare ausili e regolare l’altezza di lavoro.', 'Sollevatori, carrelli, rotazione e formazione ergonomica.']
            ]
        },
        commercio: {
            label: 'Commercio al dettaglio e all’ingrosso', level: 'Profilo settoriale · verificare merci e pubblico',
            ateco: ['45.1', '45.3', '45.4', '46', '47'], keywords: ['commercio', 'negozio', 'supermercato', 'vendita', 'ingrosso'],
            sources: [
                { label: 'INAIL · Analisi del settore commercio', url: 'https://www.inail.it/portale/it/inail-comunica/news/notizia.2022.07.nel-nuovo-numero-di-dati-inail-uno-sguardo-a-360-gradi-sul-commercio.html' },
                { label: 'INAIL · Violenza nei luoghi di lavoro', url: 'https://www.inail.it/portale/prevenzione-e-sicurezza/it/come-fare-per/conoscere-il-rischio/rischi-psicosociali/violenza-e-molestie.html' }
            ],
            risks: [
                ['carichi', 'Movimentazione manuale merci', 'Scatole, casse, colli e rifornimento scaffali.', 'Lombalgie, distorsioni e affaticamento.', 'Usare ausili e rispettare tecniche/limiti.', 'Carrelli, organizzazione, formazione e rotazione.'],
                ['scaffali', 'Stoccaggio e caduta merci', 'Scaffalature, cataste instabili e prelievo in quota.', 'Urti, schiacciamento e cadute.', 'Non arrampicarsi e rispettare portate.', 'Scaffali ancorati, controlli, scale idonee e corretta disposizione.'],
                ['cadute', 'Scivolamenti e inciampi', 'Pavimenti bagnati, imballaggi e passaggi ingombri.', 'Contusioni, distorsioni e fratture.', 'Segnalare e rimuovere subito gli ostacoli.', 'Pulizia, segnalazione, ordine e calzature adatte.'],
                ['tagli', 'Tagli e punture', 'Cutter, affettatrici, vetri e imballaggi.', 'Ferite e amputazioni.', 'Usare utensili sicuri e riporli correttamente.', 'Ripari, cutter retrattili, guanti e formazione.'],
                ['attrezzature', 'Attrezzature di movimentazione', 'Transpallet, carrelli e piattaforme.', 'Investimento, urti e schiacciamento.', 'Separare pedoni e mezzi e guidare con prudenza.', 'Percorsi, manutenzione, formazione e segnaletica.'],
                ['violenza', 'Rapina, aggressione e conflitto', 'Contatto col pubblico, gestione valori e lavoro isolato.', 'Trauma fisico e psicologico.', 'Non esporsi a rischi e attivare le procedure.', 'Organizzazione, allarmi, formazione e gestione valori.'],
                ['stress_postura', 'Stress, posture e ripetitività', 'Turni, cassa, affollamento e stazione eretta.', 'Affaticamento, disturbi muscolo-scheletrici e stress.', 'Alternare postura e segnalare criticità.', 'Pause, rotazione, ergonomia e adeguato organico.'],
                ['incendio_esodo', 'Incendio ed evacuazione del pubblico', 'Merci combustibili, impianti e presenza clienti.', 'Ustioni, fumo e panico.', 'Conoscere allarmi, vie di fuga e assistenza al pubblico.', 'Presidi, piano emergenza, addetti e uscite libere.']
            ]
        },
        logistica_trasporti: {
            label: 'Trasporti, logistica e magazzinaggio', level: 'Profilo settoriale · verificare flussi e mezzi',
            ateco: ['49', '50', '51', '52', '53'], keywords: ['trasport', 'logistic', 'magazzin', 'corriere', 'spedizion'],
            sources: [
                { label: 'INAIL · Trasporti e magazzinaggio', url: 'https://www.inail.it/portale/it/inail-comunica/news/notizia.2025.11.trasporti-e-magazzinaggio-nel-nuovo-numero-di-dati-inail-l-analisi-su-uno-dei-settori-piu-esposti-a-rischi-lavorativi.html' },
                { label: 'INAIL · Pericoli nascosti in magazzino', url: 'https://www.inail.it/portale/it/inail-comunica/news/notizia.2024.12.i-pericoli-nascosti-in-magazzino.html' }
            ],
            risks: [
                ['stradale', 'Guida e rischio stradale', 'Traffico, tempi, meteo, distrazione e carico.', 'Incidenti gravi o mortali.', 'Rispettare guida sicura, pause e divieti di distrazione.', 'Pianificazione, manutenzione veicoli, gestione tempi e formazione.'],
                ['carrelli', 'Carrelli e interferenza pedoni', 'Investimento, collisione, ribaltamento e caduta carico.', 'Schiacciamento, trauma e morte.', 'Rispettare percorsi e mantenere visibilità.', 'Separazione flussi, limiti velocità, formazione e verifiche.'],
                ['carichi', 'Movimentazione manuale', 'Sollevamento e trasporto ripetuto di colli.', 'Lombalgie e sovraccarico arti.', 'Usare ausili e tecniche corrette.', 'Automazione, carrelli, limiti, rotazione e formazione.'],
                ['scaffali', 'Scaffalature e stoccaggio', 'Caduta merci, urto montanti e sovraccarico.', 'Schiacciamento e lesioni gravi.', 'Segnalare danni e rispettare portate.', 'Ispezioni, protezioni montanti, corretta pallettizzazione e cartelli.'],
                ['baie', 'Baie di carico e cadute', 'Dislivelli, sponda, movimento prematuro del veicolo.', 'Caduta, schiacciamento e investimento.', 'Usare blocchi/semafori e verificare l’accosto.', 'Procedure autista-magazzino, rampe, parapetti e illuminazione.'],
                ['rumore_vibrazioni', 'Rumore e vibrazioni', 'Guida, pavimentazioni, mezzi e impianti.', 'Ipoacusia, affaticamento e disturbi rachide.', 'Regolare sedile e usare DPI ove previsti.', 'Pavimenti mantenuti, mezzi idonei, manutenzione e pause.'],
                ['fatica_turni', 'Fatica, turni e lavoro notturno', 'Orari irregolari, picchi e pressione dei tempi.', 'Calo attenzione, stress e incidenti.', 'Rispettare riposi e segnalare affaticamento.', 'Turnazione sostenibile, pause, carichi realistici e sorveglianza.'],
                ['batterie_incendio', 'Ricarica batterie e incendio', 'Idrogeno, elettrolita, cortocircuiti e merci combustibili.', 'Ustioni, esplosione e fumi.', 'Ricaricare solo nelle aree previste.', 'Ventilazione, protezioni elettriche, divieti innesco e presidi.']
            ]
        },
        sanita_assistenza: {
            label: 'Sanità e assistenza sociale', level: 'Profilo settoriale · verificare setting assistenziale',
            ateco: ['86', '87', '88'], keywords: ['sanit', 'clinica', 'ambulator', 'assistenza', 'rsa', 'sociale'],
            sources: [
                { label: 'INAIL · Rischi nell’assistenza sociosanitaria', url: 'https://www.inail.it/portale/it/inail-comunica/news/notizia.2024.11.elevati-rischi-per-chi-opera-nel-campo-dell-assistenza-sociosanitaria.html' },
                { label: 'INAIL · Rischio biologico occupazionale', url: 'https://www.inail.it/portale/prevenzione-e-sicurezza/it/come-fare-per/conoscere-il-rischio/agenti-biologici/rischio-biologico-nei-luoghi-di-lavoro.html' }
            ],
            risks: [
                ['biologico', 'Agenti biologici', 'Contatto con pazienti, fluidi, aerosol e materiali contaminati.', 'Infezioni e malattie trasmissibili.', 'Applicare precauzioni standard e igiene mani.', 'Vaccinazioni, DPI, ventilazione, isolamento e procedure.'],
                ['taglienti', 'Punture e taglienti', 'Aghi, lame e dispositivi contaminati.', 'Ferite ed esposizione a patogeni ematici.', 'Non reincappucciare e smaltire subito.', 'Dispositivi di sicurezza, contenitori e procedura post-esposizione.'],
                ['pazienti', 'Movimentazione pazienti', 'Sollevamento, trasferimento e posture assistenziali.', 'Lombalgie e sovraccarico muscolo-scheletrico.', 'Usare ausili e collaborazione del team.', 'Sollevatori, teli, spazi idonei, formazione e organico adeguato.'],
                ['chimico_farmaci', 'Sostanze chimiche e farmaci pericolosi', 'Disinfettanti, sterilizzanti, gas e farmaci.', 'Irritazioni, sensibilizzazione e danni sistemici.', 'Seguire SDS e procedure di preparazione/sversamento.', 'Cappe/ventilazione, sistemi chiusi, DPI e gestione rifiuti.'],
                ['radiazioni', 'Radiazioni e campi fisici', 'Radiazioni ionizzanti, laser, UV e apparecchi elettromedicali.', 'Danni a tessuti, occhi e salute riproduttiva.', 'Rispettare zone, tempi e istruzioni.', 'Schermature, dosimetria, segnaletica e personale autorizzato.'],
                ['aggressioni', 'Aggressioni e violenza', 'Utenti, familiari, emergenze e lavoro isolato.', 'Traumi fisici e psicologici.', 'Applicare de-escalation e chiedere supporto.', 'Valutazione, allarmi, presenza adeguata, layout e formazione.'],
                ['stress_turni', 'Stress e turni notturni', 'Carico emotivo, urgenze, responsabilità e turnazione.', 'Burnout, disturbi del sonno e calo attenzione.', 'Usare supporti e segnalare sovraccarico.', 'Organizzazione turni, pause, debriefing e supporto psicologico.'],
                ['cadute_trasporti', 'Cadute e trasporto interno', 'Pavimenti, barelle, carrelli e spazi affollati.', 'Urti, cadute e schiacciamento.', 'Mantenere percorsi liberi e movimentare in sicurezza.', 'Manutenzione, pulizia, ausili efficienti e separazione flussi.']
            ]
        },
        pulizie: {
            label: 'Pulizie e sanificazione', level: 'Profilo settoriale · verificare ambienti serviti',
            ateco: ['81.2', '81.21', '81.22', '81.23'], keywords: ['pulizia', 'pulizie', 'sanificaz', 'disinfestaz'],
            sources: [
                { label: 'INAIL · Sanificazione e prevenzione', url: 'https://www.inail.it/portale/it/inail-comunica/news/notizia.2023.08.post-pandemia-la-sanificazione-come-prassi-standard-di-prevenzione.html' },
                { label: 'INAIL · Indicazioni operative per la sanificazione', url: 'https://www.inail.it/content/dam/inail-hub-site/documenti/2020/05/Documento%20tecnico%20operativo%20per%20la%20pulizia%20e%20la%20sanificazione.pdf' }
            ],
            risks: [
                ['chimico', 'Detergenti e disinfettanti', 'Miscelazione, vapori, schizzi e contatto cutaneo.', 'Dermatiti, ustioni e disturbi respiratori.', 'Non miscelare prodotti; seguire etichetta/SDS.', 'Dosaggio, ventilazione, guanti, occhiali e deposito corretto.'],
                ['biologico', 'Agenti biologici', 'Rifiuti, servizi igienici, superfici e materiali contaminati.', 'Infezioni, allergie e ferite contaminate.', 'Igiene mani e gestione sicura dei rifiuti.', 'DPI, procedure, contenitori e vaccinazioni ove indicate.'],
                ['cadute', 'Scivolamenti e inciampi', 'Superfici bagnate, cavi, attrezzature e ostacoli.', 'Contusioni e fratture.', 'Segnalare area bagnata e mantenere ordine.', 'Segnaletica, calzature antiscivolo, metodi e tempi corretti.'],
                ['ripetitivi', 'Posture e movimenti ripetitivi', 'Lavaggio, spolvero, strizzatura e lavoro sopra spalla.', 'Tendiniti e disturbi di schiena/spalla.', 'Alternare attività e regolare gli attrezzi.', 'Aste telescopiche, carrelli ergonomici, pause e rotazione.'],
                ['carichi', 'Movimentazione carichi', 'Secchi, sacchi rifiuti, macchine e arredi.', 'Lombalgie e schiacciamento.', 'Ridurre peso e usare carrelli.', 'Ausili, ruote efficienti, formazione e organizzazione.'],
                ['quota', 'Lavori in altezza', 'Scale, vetrate e superfici sopraelevate.', 'Cadute gravi.', 'Usare solo attrezzature idonee e stabilizzate.', 'Scale/PLE verificate, delimitazione e addestramento.'],
                ['elettrico', 'Rischio elettrico', 'Macchine, cavi e prese in ambienti umidi.', 'Folgorazione e ustioni.', 'Non usare apparecchi danneggiati o su acqua.', 'Controlli, differenziali, grado IP e manutenzione.'],
                ['interferenze', 'Interferenze e lavoro isolato', 'Pulizia durante altre attività o in orari senza assistenza.', 'Urti, esposizioni impreviste e ritardo soccorsi.', 'Coordinarsi e mantenere comunicazioni.', 'DUVRI/coordinamento, delimitazione e procedura uomo solo.']
            ]
        },
        rifiuti_igiene: {
            label: 'Raccolta rifiuti e igiene urbana', level: 'Profilo settoriale · verificare servizio e territorio',
            ateco: ['38', '39'], keywords: ['rifiuti', 'igiene urbana', 'ecologia', 'raccolta differenziata'],
            sources: [
                { label: 'INAIL · Operatori della raccolta rifiuti', url: 'https://www.inail.it/content/dam/inail-hub-site/documenti/catalogo-generale/2024/10/OpuscoloOperatoriRaccoltaRifiuti.pdf' },
                { label: 'INAIL · Rischio biologico occupazionale', url: 'https://www.inail.it/portale/prevenzione-e-sicurezza/it/come-fare-per/conoscere-il-rischio/agenti-biologici/rischio-biologico-nei-luoghi-di-lavoro.html' }
            ],
            risks: [
                ['investimento', 'Traffico e investimento', 'Raccolta su strada, salita/discesa e scarsa visibilità.', 'Traumi gravi o mortali.', 'Usare alta visibilità e rispettare procedure di posizionamento.', 'Pianificazione percorsi, segnalazioni, illuminazione e coordinamento equipaggio.'],
                ['compattatore', 'Veicoli e organi di compattazione', 'Presa, schiacciamento, caduta e movimento mezzo.', 'Amputazione, schiacciamento e morte.', 'Non entrare nella zona pericolosa e usare comandi previsti.', 'Interblocchi, telecamere, arresti, manutenzione e addestramento.'],
                ['biologico', 'Agenti biologici', 'Rifiuti organici, aerosol, animali e materiali contaminati.', 'Infezioni, allergie e disturbi respiratori.', 'Igiene, DPI e gestione ferite immediata.', 'Vaccinazioni ove indicate, pulizia mezzi, guanti e protezione respiratoria.'],
                ['chimico_polveri', 'Sostanze, polveri e gas', 'Rifiuti ignoti, polveri, liquidi e emissioni.', 'Irritazioni, intossicazione e asfissia.', 'Non manipolare contenitori sospetti; segnalare.', 'Procedure rifiuti anomali, monitoraggi, DPI e ventilazione.'],
                ['taglienti', 'Taglienti e punture', 'Vetri, aghi e oggetti nei sacchi.', 'Ferite e rischio infettivo.', 'Non comprimere i sacchi con mani/corpo.', 'Guanti antiperforazione, contenitori idonei e procedura post-esposizione.'],
                ['carichi', 'Carichi e fatica fisica', 'Sollevamenti ripetuti, traino cassonetti e posture dinamiche.', 'Sovraccarico muscolo-scheletrico e affaticamento.', 'Usare ausili e tecniche corrette.', 'Meccanizzazione, manutenzione ruote, rotazione e organizzazione.'],
                ['rumore_vibrazioni', 'Rumore e vibrazioni', 'Veicoli, compattatori e pavimentazioni.', 'Ipoacusia e disturbi rachide.', 'Usare DPI e regolare il posto guida.', 'Valutazione, manutenzione, sedili idonei e otoprotettori.'],
                ['incendio', 'Incendio, batterie e gas', 'Materiali infiammabili, reazioni e batterie nei rifiuti.', 'Ustioni, esplosione e fumi tossici.', 'Isolare il carico sospetto e attivare emergenza.', 'Controlli, compartimentazione, procedure e presidi sui mezzi/impianti.']
            ]
        },
        legno_arredo: {
            label: 'Legno, falegnameria e arredo', level: 'Profilo settoriale · verificare polveri e macchine',
            ateco: ['16', '31'], keywords: ['legno', 'falegnam', 'mobilificio', 'arredo', 'segheria'],
            sources: [
                { label: 'INAIL · Valutazione del rischio da polveri di legno', url: 'https://www.inail.it/content/dam/prevenzione-e-sicurezza/documenti/conoscere-il-rischio/2024/09/Conoscere%20il%20rischio_Valutazione%20rischio%20legno_2024.pdf' },
                { label: 'INAIL · Buona pratica lavorazione del legno', url: 'https://www.inail.it/content/dam/ricerca-e-tecnologia/documenti/doc-buone-pratiche/lavorazione_legno/index.pdf' }
            ],
            risks: [
                ['macchine_legno', 'Macchine per legno', 'Seghe, pialle, frese, toupie e bordatrici.', 'Tagli, amputazioni, trascinamento e proiezioni.', 'Usare guide/spingipezzo e non rimuovere ripari.', 'Ripari, aspirazione integrata, frenatura, manutenzione e formazione.'],
                ['polveri_legno', 'Polveri di legno', 'Taglio, levigatura e pulizia; legni duri e misti.', 'Irritazioni, asma e rischio cancerogeno per polveri di legni duri.', 'Usare aspirazione e non soffiare polvere con aria compressa.', 'Aspirazione alla fonte, pulizia aspirata, monitoraggio e DPI.'],
                ['incendio_atex', 'Incendio ed esplosione polveri', 'Accumuli, aspirazione, scintille e finiture.', 'Ustioni, esplosione e fumi.', 'Mantenere pulizia e controllare inneschi.', 'Valutazione ATEX/incendio, messa a terra, separazione e presidi.'],
                ['rumore', 'Rumore', 'Seghe, pialle, aspiratori e chiodatrici.', 'Ipoacusia e stress.', 'Usare otoprotettori nelle zone previste.', 'Scelta macchine, manutenzione, isolamento e DPI.'],
                ['vibrazioni', 'Vibrazioni', 'Levigatrici e utensili portatili.', 'Disturbi mano-braccio.', 'Limitare tempi e impugnare correttamente.', 'Attrezzature antivibranti, manutenzione e rotazione.'],
                ['chimico', 'Colle, vernici e solventi', 'Preparazione e applicazione di finiture.', 'Dermatiti, intossicazione e sensibilizzazione.', 'Seguire SDS e usare cabine/aspirazione.', 'Sostituzione prodotti, ventilazione, DPI e deposito idoneo.'],
                ['pannelli_carichi', 'Pannelli e movimentazione', 'Lastre ingombranti, cataste e movimentazione manuale.', 'Schiacciamento, tagli e lombalgie.', 'Usare prese e ausili adeguati.', 'Ventose, sollevatori, rastrelliere, guanti e lavoro in coppia.'],
                ['elettrico_manut', 'Elettrico e manutenzione', 'Impianti, aspirazione e interventi su macchine.', 'Folgorazione e avviamento inatteso.', 'Isolare le energie prima di intervenire.', 'LOTO, personale autorizzato, verifiche e manutenzione programmata.']
            ]
        },
        alimentare: {
            label: 'Industria alimentare e bevande', level: 'Profilo settoriale · verificare processo produttivo',
            ateco: ['10', '11'], keywords: ['alimentar', 'panificio', 'pasticcer', 'caseificio', 'salumificio', 'bevande'],
            sources: [{ label: 'INAIL · Analisi dell’industria alimentare', url: 'https://www.inail.it/portale/it/inail-comunica/news/notizia.2025.09.l-industria-alimentare-al-centro-dell-analisi-di-dati-inail.html' }],
            risks: [
                ['macchine', 'Macchine di processo e confezionamento', 'Impastatrici, tritacarne, affettatrici, nastri e riempitrici.', 'Tagli, trascinamento e schiacciamento.', 'Non eludere ripari e fermare prima di pulire.', 'Interblocchi, arresti, LOTO, manutenzione e formazione.'],
                ['tagli', 'Coltelli e utensili', 'Disosso, taglio, apertura imballi e vetro.', 'Ferite profonde e amputazioni.', 'Usare tecnica e utensili corretti.', 'Guanti/grembiuli antitaglio ove previsti, custodie e affilatura sicura.'],
                ['calore', 'Calore, vapore e superfici fredde', 'Forni, friggitrici, vapore, celle e fluidi refrigeranti.', 'Ustioni, stress termico e lesioni da freddo.', 'Rispettare procedure e usare DPI termici.', 'Coibentazione, ventilazione, protezioni e pause.'],
                ['polveri_allergeni', 'Polveri e allergeni', 'Farine, spezie, enzimi e ingredienti sensibilizzanti.', 'Asma, allergie e irritazioni.', 'Limitare dispersione e seguire igiene/procedure.', 'Aspirazione, versamento controllato, pulizia e DPI.'],
                ['biologico', 'Agenti biologici', 'Materie prime, muffe, animali infestanti e contaminazione.', 'Infezioni, allergie e zoonosi.', 'Applicare igiene personale e processo.', 'HACCP integrato, pulizia, controllo infestanti e DPI.'],
                ['chimico_pulizia', 'Prodotti di pulizia e sanificazione', 'Detergenti, disinfettanti e sanificazione impianti.', 'Ustioni chimiche e intossicazione.', 'Non miscelare e seguire SDS.', 'Dosaggio automatico, ventilazione, procedure e DPI.'],
                ['ripetitivi_carichi', 'Movimenti ripetitivi e carichi', 'Confezionamento, cassette, sacchi e posture vincolate.', 'Disturbi muscolo-scheletrici.', 'Usare ausili e alternare attività.', 'Ergonomia, automazione, rotazione e pause.'],
                ['cadute', 'Scivolamenti e cadute', 'Acqua, grassi, residui e dislivelli.', 'Contusioni e fratture.', 'Pulire e segnalare subito.', 'Pavimenti drenanti, calzature antiscivolo, ordine e segregazione.']
            ]
        },
        lavanderie: {
            label: 'Lavanderie industriali e servizi tessili', level: 'Profilo settoriale · verificare ciclo sporco/pulito',
            ateco: ['96.01', '96.10'], keywords: ['lavanderia', 'lavaggio industriale', 'servizi tessili'],
            sources: [{ label: 'INAIL · Rischi nelle lavanderie industriali', url: 'https://www.inail.it/portale/it/inail-comunica/news/notizia.2022.12.lavanderie-industriali-l-analisi-dei-rischi-lavorativi-in-una-nuova-pubblicazione-inail.html' }],
            risks: [
                ['biologico', 'Biancheria sporca e rischio biologico', 'Materiale sanitario/alberghiero contaminato e oggetti estranei.', 'Infezioni, punture e allergie.', 'Separare sporco/pulito e non comprimere i sacchi.', 'Barriera sanitaria, procedure, DPI, igiene e vaccinazioni ove indicate.'],
                ['chimico', 'Detergenti e prodotti chimici', 'Dosaggio, travaso, solventi e disinfettanti.', 'Irritazioni, ustioni e intossicazione.', 'Seguire SDS e non miscelare.', 'Dosaggio chiuso, ventilazione, contenimento e DPI.'],
                ['macchine', 'Macchine, nastri e organi mobili', 'Lavatrici, essiccatoi, presse, mangani e convogliatori.', 'Schiacciamento, trascinamento e ustione.', 'Non eludere ripari e isolare prima di intervenire.', 'Interblocchi, arresti, LOTO e manutenzione.'],
                ['calore_vapore', 'Calore, vapore e microclima', 'Essiccazione, stiratura e tubazioni calde.', 'Ustioni, disidratazione e stress termico.', 'Usare DPI e rispettare pause.', 'Coibentazione, ventilazione, monitoraggio e acqua.'],
                ['carichi', 'Movimentazione biancheria', 'Sacchi, carrelli e cumuli di materiale.', 'Lombalgie e schiacciamento.', 'Usare carrelli e ridurre i pesi.', 'Ausili, ruote efficienti, layout e formazione.'],
                ['ripetitivi', 'Movimenti ripetitivi e postura', 'Cernita, piegatura, stiratura e confezionamento.', 'Tendiniti e disturbi schiena/spalla.', 'Alternare mansioni e regolare la postazione.', 'Ergonomia, automazione, rotazione e pause.'],
                ['cadute', 'Scivolamenti e inciampi', 'Acqua, condensa, biancheria e passaggi.', 'Contusioni e fratture.', 'Mantenere ordine e segnalare sversamenti.', 'Drenaggi, pulizia, calzature antiscivolo e layout.'],
                ['manutenzione_emf', 'Manutenzione, quota e campi fisici', 'Interventi su impianti, passerelle, caldaie e apparecchiature.', 'Cadute, folgorazione, ustioni ed esposizioni.', 'Operare solo se autorizzati e con energie isolate.', 'LOTO, permessi, accessi sicuri, verifiche e valutazione campi.']
            ]
        },
        istruzione: {
            label: 'Istruzione, scuole e servizi educativi', level: 'Profilo settoriale · verificare utenza e laboratori',
            ateco: ['85'], keywords: ['scuola', 'istruzione', 'asilo', 'educativ', 'formazione'],
            sources: [
                { label: 'INAIL · Sicurezza nelle scuole', url: 'https://www.inail.it/content/dam/prevenzione-e-sicurezza/documenti/2017/03/Scheda%20scuole.pdf' },
                { label: 'INAIL · Rischio biologico nei luoghi di lavoro', url: 'https://www.inail.it/portale/prevenzione-e-sicurezza/it/come-fare-per/conoscere-il-rischio/agenti-biologici/rischio-biologico-nei-luoghi-di-lavoro.html' }
            ],
            risks: [
                ['biologico', 'Agenti biologici', 'Contatto ravvicinato, bambini, comunità e materiali contaminati.', 'Infezioni respiratorie, gastrointestinali e cutanee.', 'Igiene mani, aerazione e gestione corretta dei casi.', 'Pulizia, ventilazione, procedure e vaccinazioni raccomandate.'],
                ['voce_rumore', 'Voce, rumore e affollamento', 'Uso prolungato della voce e ambienti rumorosi.', 'Disfonie, affaticamento e stress.', 'Usare tecniche vocali e pause.', 'Acustica, organizzazione classi, amplificazione ove utile e formazione.'],
                ['bambini_posture', 'Movimentazione bambini e posture', 'Sollevamento, assistenza e arredi bassi nei servizi educativi.', 'Disturbi muscolo-scheletrici.', 'Usare tecniche corrette e favorire autonomia.', 'Arredi ergonomici, ausili, rotazione e formazione.'],
                ['psicosociale', 'Stress, conflitto e aggressioni', 'Carico emotivo, utenti/famiglie e gestione comportamenti.', 'Stress, burnout e trauma.', 'Applicare comunicazione/de-escalation e chiedere supporto.', 'Organizzazione, procedure, équipe e supporto.'],
                ['cadute', 'Cadute, urti e spazi', 'Scale, giochi, pavimenti, arredi e affollamento.', 'Contusioni e fratture.', 'Mantenere percorsi liberi e vigilare.', 'Manutenzione, protezioni, ordine e sorveglianza.'],
                ['laboratori', 'Laboratori, sostanze e attrezzature', 'Chimica, officine, cucina, arte e attività pratiche.', 'Tagli, ustioni, intossicazione e incendio.', 'Seguire istruzioni e usare DPI.', 'Valutazioni specifiche, ripari, aspirazione, deposito e vigilanza.'],
                ['elettrico_incendio', 'Elettrico, incendio ed evacuazione', 'Impianti, apparecchi, materiali e presenza di minori/disabili.', 'Folgorazione, ustioni e difficoltà di esodo.', 'Conoscere procedure e assistere l’utenza.', 'Verifiche, piano emergenza, prove, addetti e vie libere.'],
                ['esterno', 'Attività esterne e vigilanza', 'Uscite, cortili, palestre, traffico e condizioni meteo.', 'Infortuni, investimento e stress termico.', 'Applicare rapporti di vigilanza e procedure.', 'Pianificazione, accompagnatori, comunicazioni e protezione meteo/UV.']
            ]
        }
    };

    const catalog = window.RISK_SECTOR_CATALOG || {};
    const custom = catalog.altro;
    delete catalog.altro;
    Object.assign(catalog, sectors);
    catalog.altro = custom || { label: 'Altro settore / scheda personalizzata', level: 'Da definire dal DVR', ateco: [], keywords: [], risks: [] };

    const existingSectorSources = {
        uffici: [{ label: 'INAIL · Videoterminali e lavoro d’ufficio', url: 'https://www.inail.it/portale/prevenzione-e-sicurezza/it/come-fare-per/conoscere-il-rischio/ergonomia/videoterminali.html' }],
        estetica: [{ label: 'INAIL · Sostanze pericolose per estetisti e acconciatori', url: 'https://www.inail.it/portale/it/inail-comunica/news/notizia.2021.12.estetiste-e-acconciatori-dall-inail-la-guida-per-prevenire-i-rischi-derivanti-da-sostanze-pericolose.html' }],
        acconciatura: [{ label: 'INAIL · Profilo di rischio acconciatori', url: 'https://www.inail.it/portale/ricerca-e-tecnologia/it/terza-missione/applicativi-per-la-salute-e-la-sicurezza-sul-lavoro/profili-di-rischio/profilo-di-rischio.acconciatori.html' }],
        orafi: [{ label: 'INAIL · Schede di rischio in oreficeria', url: 'https://www.inail.it/content/dam/inail-hub-site/documenti/2016/02/ucm_portstg_103488.pdf' }],
        tessile: [{ label: 'INAIL · Profili di rischio delle PMI', url: 'https://www.inail.it/portale/ricerca-e-tecnologia/it/ambiti-di-ricerca/area-salute-sul-lavoro/sistemi-di-sorveglianza--gestione-integrata-del-rischio-e-modell/profili-di-rischio-di-comparto.html' }],
        pelletteria: [{ label: 'INAIL · Profili di rischio delle PMI', url: 'https://www.inail.it/portale/ricerca-e-tecnologia/it/ambiti-di-ricerca/area-salute-sul-lavoro/sistemi-di-sorveglianza--gestione-integrata-del-rischio-e-modell/profili-di-rischio-di-comparto.html' }],
        alloggio_ristorazione: [{ label: 'INAIL · Rischi in alberghi e ristorazione', url: 'https://www.inail.it/portale/it/inail-comunica/news/notizia.2026.01.rischi-e-malattie-professionali-nel-settore-delle-attivit--alberghiere-e-di-ristorazione--una-disamina.html' }]
    };
    Object.entries(existingSectorSources).forEach(([id, sources]) => {
        if (catalog[id]) catalog[id].sources = [...(catalog[id].sources || []), ...sources];
    });

    window.getRiskSectorSources = function (sectorOrId) {
        const sector = typeof sectorOrId === 'string'
            ? (window.getRiskSector ? window.getRiskSector(sectorOrId) : catalog[sectorOrId])
            : (sectorOrId || {});
        const items = [...(window.RISK_CATALOG_COMMON_SOURCES || []), ...(sector.sources || [])];
        return items.filter((item, index) => item && item.url && items.findIndex(other => other.url === item.url) === index);
    };

    window.validateRiskSectorCatalog = function () {
        const errors = [];
        let risks = 0;
        Object.entries(catalog).forEach(([id, sector]) => {
            if (!sector.label) errors.push(`${id}: etichetta mancante`);
            const ids = new Set();
            (sector.risks || []).forEach(risk => {
                risks += 1;
                if (!risk[0] || !risk[1] || !risk[2]) errors.push(`${id}: rischio incompleto`);
                if (ids.has(risk[0])) errors.push(`${id}: ID rischio duplicato ${risk[0]}`);
                ids.add(risk[0]);
            });
            if (id !== 'altro' && !(sector.sources || []).length) errors.push(`${id}: fonte settoriale mancante`);
        });
        return { ok: errors.length === 0, sectors: Object.keys(catalog).length, risks, errors };
    };
})();
