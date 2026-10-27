# SafetyManager — Ultimo blocco

Aggiornato: 2026-10-22
Stato: bridge SafetyTraining v1.2 LIVE e invariato; SafetyTraining v21_024/admin UX v21.4 ora espone l'anagrafica corsista con un unico campo `Cognome/Nome`, coerente con `full_name` esportato da SafetyManager.

## Bridge SafetyManager — payload invariato
`js/modules/safetytraining_bridge.js` continua a produrre `safetytraining.transfer` v1.2 con:
- azienda + P.IVA/CF normalizzato;
- corso/progetto, date/sede, modalità e presenza;
- contesto rischi/fabbisogni;
- learner + enrollment external IDs + CF, mansione e `full_name` unico;
- nessun documento/firma/dato sanitario/credenziale;
- mismatch azienda corrente/progetto = warning storico, non blocco.

Non è stata fatta alcuna modifica al codice/payload SafetyManager in questo blocco.

## Compatibilità anagrafica SafetyTraining v21.4
La console SafetyTraining non presenta più Nome e Cognome come due input distinti per il corsista. Usa un unico campo `Cognome/Nome`, così l'amministratore vede/modifica lo stesso concetto che SafetyManager esporta come `full_name`.

Per compatibilità con lo schema SafetyTraining esistente:
- i vecchi record `first_name + last_name` vengono riuniti in visualizzazione;
- `metadata.source_full_name`, se presente, ha precedenza;
- al salvataggio manuale il nome completo viene mantenuto come valore unico senza introdurre una migrazione distruttiva dello schema.

Questa modifica NON cambia dedupe CF, mapping esterni, idempotenza o storico azienda.

## Storico azienda SafetyTraining v21_023 — invariato
Regola definitiva:
- `learners.company_id` = azienda corrente;
- `learner_company_training_history` = azienda associata allo specifico enrollment/edizione storico;
- importare un progetto SafetyManager storico non sovrascrive la company corrente del learner.

Il mismatch azienda corrente/progetto in SafetyManager resta quindi un warning legittimo e NON deve tornare hard error.

## Readiness SafetyTraining v21_024
Corretto un falso blocco lato SafetyTraining: la readiness usava il legacy metadata `bank_required` invece dei test attivi reali e delle domande collegate.

Dopo la correzione:
- 65 corsi pubblicati;
- 22 pronti per revisione;
- 2 da configurare;
- 3 bloccati, tutti frozen/fuori roadmap: Spazi confinati, RSPP/ASPP Modulo A, RSPP/ASPP Modulo B comune.

Non modificare SafetyManager per compensare questi stati: la governance dei corsi resta responsabilità SafetyTraining.

## Produzione SafetyTraining collegata
- PWA `safety-training-v21-11`;
- latest functional commit `87c077aa2d11bd29ade8a79a091c267975606b76`;
- Vercel `dpl_8ardDTVN2hJ46Q2GEx9LNYzmT11V` READY / production;
- checks SafetyTraining #292 e #293 SUCCESS.

## Produzione SafetyManager
- deployment `dpl_6r8qf2LzDasFKDMQhBWK1Ls5RzXt`;
- commit `5052a0d400ab5ab59e09a155d67b312dac995b5c`;
- READY / production;
- PWA `safetymanager-pwa-v11`;
- ultimo collaudo JS produzione: `supabase_config.js`, `utils.js`, `corsisti_ruolo_azienda.js` tutti `node --check OK`;
- runtime errors Vercel rilevati dopo l'intervento: 0.

Il repo SafetyManager non ha GitHub Actions configurati: non dichiarare CI automatica.

## Prossimo passo esatto
Nessuna modifica bridge richiesta. Proseguire lato SafetyTraining con smoke visuale admin desktop/tablet/mobile e poi E2E learner: invito → delivery → Auth → verifica identità → claim → dashboard.


## SafetyManager — ottimizzazioni e layout recenti (20/10/2026)

### Prestazioni caricamento
Intervento completato e verificato con riscontro utente di notevole aumento della velocità:
- eliminato il loop del directory documenti che poteva moltiplicare le letture `corsisti`;
- eliminate letture duplicate dei ruoli corsista;
- caricamento Aziende/Docenti/Corsisti/Progetti parallelizzato;
- Step 67 e audit Dashboard eseguiti in batch;
- deduplicate le letture Supabase identiche contemporanee;
- attivato `responsive_table_performance.js`;
- verifica admin Supabase riutilizzata per una finestra breve di 30 secondi, con invalidazione su logout/cambio sessione.
Non sono state introdotte migrazioni o modifiche allo schema Supabase.

### Sidebar Aziende / Docenti / Corsisti / Progetti
Verifica e correzione layout completate:
- su desktop le quattro sidebar sticky hanno altezza massima legata al viewport e `overflow:auto`, quindi possono scorrere verticalmente e, solo quando serve, orizzontalmente;
- scrollbar stabilizzata e resa più evidente;
- input/select/textarea nelle sidebar non possono più imporre larghezze oltre il pannello;
- su tablet/mobile le sidebar restano nel flusso normale e usa lo scroll della pagina;
- le tabelle mantengono i rispettivi wrapper `overflow-x-auto`.

### Visibilità “Aggiungi corsista”
Corretto il blocco Preiscrizione corsisti in Progetti:
- select con `min-w-0`;
- pulsanti `Aggiungi corsista` e `Nuovo` non comprimibili;
- etichetta `Aggiungi corsista` sempre esplicita;
- stessi vincoli applicati al pannello Gestione Iscritti;
- `popup-corsisti-list` dispone ora di scroll verticale/orizzontale proprio, evitando tagli con liste lunghe.

Commit funzionali di questo intervento:
- `3c71aa0e3fd0e528096bd9b6969f79160a907ad2` — sidebar scrollabili/stabili;
- `c95259865777cbdcbd812f50c4e3b80e728a0e24` — visibilità Aggiungi corsista.

Regola operativa: dopo ogni modifica SafetyManager aggiornare questo handoff/promemoria con modifica, motivo, file coinvolti, commit, verifica produzione ed eventuali problemi aperti.


## SafetyManager — cambio azienda corsista e storico immutabile (21/10/2026)

Problema risolto: un corsista può cambiare azienda senza duplicare l'anagrafica e senza perdere o alterare corsi/attestati precedenti.

### Regola dati definitiva
- `corsisti.azienda_id` = azienda ATTUALE del corsista;
- `corsisti.mansione_storica` continua a rappresentare la mansione corrente dell'anagrafica;
- `corsisti_rapporti_azienda` conserva la cronologia dei rapporti aziendali;
- ogni `iscrizioni` conserva uno snapshot immutabile del rapporto al momento del corso:
  - `azienda_storica_id`;
  - `azienda_storica_nome`;
  - `azienda_storica_piva_cf`;
  - `mansione_storica`;
  - `ruolo_aziendale_storico`.
- la ristampa di un vecchio corso/attestato continua a prendere l'azienda dal progetto storico, non dall'azienda corrente del corsista;
- le modifiche successive all'anagrafica NON propagano più la nuova mansione alle vecchie iscrizioni.

### Cambio azienda
Nella scheda Corsista si usa il normale campo “Azienda di appartenenza” e poi “Salva Record”.
Se l'azienda cambia:
- viene mostrata una conferma esplicita;
- il rapporto precedente viene chiuso;
- viene aperto automaticamente il nuovo rapporto;
- corsi e attestati già svolti restano invariati;
- la scheda espone un pannello “Azienda attuale e storico” con i rapporti registrati.

Un trigger database `trg_sync_corsista_company_history` garantisce questa regola anche se l'aggiornamento non arriva dal form principale.

### Compatibilità iscrizione corsi
Il blocco per i corsi con `ente_erogatore = azienda` resta corretto: il lavoratore può essere iscritto solo se la sua azienda ATTUALE coincide con l'azienda del nuovo progetto. Dopo il cambio anagrafico il nuovo corso può quindi essere registrato con la nuova azienda, mentre i corsi precedenti restano attribuiti alle aziende storiche.

### Backfill e verifica
Al momento dell'introduzione:
- 112 corsisti;
- 112 rapporti aziendali correnti;
- 145 iscrizioni;
- 145/145 iscrizioni con snapshot azienda storico;
- 30 corsisti avevano già almeno un corso riferito a un'azienda diversa da quella attuale.
Il trigger è stato provato con un cambio azienda in transazione e rollback: crea un nuovo rapporto, chiude il precedente e mantiene un solo rapporto corrente.

### Supabase
Migration applicate e versionate nel repository:
- `supabase/migrations/20261021111500_corsisti_company_history_and_enrollment_snapshot.sql`;
- `supabase/migrations/20261021112500_sync_corsisti_company_history_trigger.sql`.

RLS attiva sulla nuova tabella `corsisti_rapporti_azienda`, con la stessa policy admin-only delle anagrafiche principali.

### Commit frontend/repository
- `3231e402e02202a90377c93340e0bdf937ca0536` — storico iscrizioni non più riscritto + API storico aziende;
- `11451dfa1b0bbd5b505edfdae21be04f331bcc89` — snapshot azienda nelle nuove iscrizioni;
- `2addd7046bdf583155084cb0408bfae322648011` — UI cambio azienda e storico nella scheda corsista;
- `3767518e7ad1314e694ae1f51849dd46137395b3` — migration snapshot/storico versionata;
- `65bbfa4a8f26b4a96cc486506e58497aaaead00d` — migration trigger versionata.

Nota advisor Supabase: nessuna nuova vulnerabilità introdotta da questo intervento. Rimane un warning preesistente su Leaked Password Protection disattivata, non collegato allo storico corsisti.


## SafetyManager — snapshot anagrafico e cancellazione protetta corsisti (22/10/2026)

Intervento completato.

### Snapshot anagrafico immutabile per iscrizione
Ogni nuova `iscrizioni` salva anche:
- `nome_cognome_storico`;
- `cf_storico`;
- `luogo_data_nascita_storico`;
- la `mansione_storica` già presente;
- lo snapshot azienda/ruolo introdotto nel blocco precedente.

Le stampe del progetto/attestato privilegiano i dati snapshot dell'iscrizione per nome, CF e nascita, con fallback all'anagrafica corrente solo per compatibilità con record legacy.

Backfill verificato:
- iscrizioni totali al controllo: 147;
- 147/147 con nome snapshot;
- 147/147 con CF snapshot;
- 147/147 con luogo/data nascita snapshot.

### Archiviazione corsista
Nuova regola operativa:
- il pulsante normale non cancella più: **Archivia**;
- un corsista archiviato resta consultabile con tutto lo storico;
- gli archiviati non sono selezionabili per nuovi corsi/progetti;
- filtro Anagrafica Corsisti: `Solo attivi`, `Solo archiviati`, `Attivi + archiviati`;
- azione **Ripristina** riporta il corsista tra gli attivi;
- archiviazione conserva iscrizioni, attestati, crediti e storico aziendale.

Colonne:
- `corsisti.archived_at`;
- `corsisti.archived_reason`.

### Protezione database dalla cancellazione accidentale
La FK `iscrizioni_corsista_id_fkey` è stata cambiata da `ON DELETE CASCADE` a `ON DELETE RESTRICT`.
Risultato: una DELETE diretta del corsista con iscrizioni non può più trascinare via automaticamente corsi/attestati.

La vecchia API frontend `deleteCorsistaData` è bloccata intenzionalmente e non esegue più cancellazioni.

### Eliminazione definitiva admin
Rimane possibile, ma è separata dall'archiviazione:
1. il corsista deve essere prima archiviato;
2. SafetyManager calcola e mostra l'impatto (iscrizioni, crediti, verifiche efficacia, rapporti azienda);
3. seconda conferma;
4. l'admin deve digitare esattamente `ELIMINA <CODICE_FISCALE>`;
5. la procedura database elimina in ordine controllato i dati collegati e infine il corsista.

Funzione DB: `public.safety_hard_delete_corsista(uuid,text)`, eseguibile solo dall'utente amministratore già autorizzato. È `SECURITY INVOKER`, non `SECURITY DEFINER`.

### Verifiche effettuate
- test transazionale con rollback: DELETE diretta di corsista con iscrizioni => bloccata da FK;
- test transazionale con rollback: archiviazione => numero iscrizioni invariato;
- test transazionale con rollback: eliminazione definitiva protetta => completata correttamente, poi rollback;
- Supabase advisors: nessuna nuova vulnerabilità introdotta;
- resta il warning preesistente `Leaked Password Protection Disabled`;
- produzione: marker archiviazione, hard delete, snapshot e filtro stato presenti;
- Vercel runtime errors nel controllo: 0;
- `js/supabase_config.js` e `js/utils.js`: `node --check OK`.

### Commit frontend
- `9bc02c0f7d5d9bf5099f34fed583ce8abb195c7d` — API archiviazione/ripristino/cancellazione protetta;
- `284f37a8db4b72d03bcbd2f494875213efce4f03` — snapshot anagrafico + UI archiviazione;
- `9913624b88c5177df15c62f18fda4fcb1b605cf9` — filtro stato corsisti;
- `e86d2c2f032eca4d43990637fcbf5da90441458d` — esclusione archiviati dalle preiscrizioni.

### Migration Supabase
Migration applicata e registrata in Supabase:
- versione `20261022194726`;
- nome `corsisti_identity_snapshot_and_archive_guard`.

Housekeeping risolto: il file SQL completo della migration è ora versionato nel repository con il timestamp Supabase effettivo.

Le due migration precedenti sullo storico azienda sono state riallineate nel repository ai timestamp Supabase effettivi:
- `20261021092912_corsisti_company_history_and_enrollment_snapshot.sql`;
- `20261021093024_sync_corsisti_company_history_trigger.sql`.


## SafetyManager — collaudo A→B, decorrenza e migration allineate (22/10/2026)

### Decorrenza cambio azienda
Aggiunto `corsisti.azienda_data_inizio` e campo **Decorrenza azienda attuale** nella scheda Corsista.
- cambio azienda: la data proposta è oggi, ma l'admin può indicare la decorrenza effettiva;
- date future bloccate dal database;
- il rapporto precedente viene chiuso coerentemente rispetto alla decorrenza;
- il nuovo rapporto storico usa la data indicata;
- modifica di mansione/ruolo/decorrenza aggiorna solo il rapporto corrente e non le vecchie iscrizioni.

Migration Supabase:
- `20261022200704_corsisti_company_effective_date.sql`.

Commit frontend:
- `b80b7346b4d20fb3184e2fc4ce7d4f1a63f3ef58` — campo e conferma decorrenza;
- `598f9a2eba81307cbfb39694ce59755ed78436d3` — propagazione decorrenza nei dati anagrafici.

### Collaudo end-to-end A → B
Test eseguito in transazione con rollback, quindi senza lasciare dati di prova:
1. corsista con corso storico Azienda A;
2. cambio azienda ad Azienda B con decorrenza;
3. verificato un solo rapporto corrente B con la data scelta;
4. verificato che nome/CF/nascita/azienda snapshot del vecchio corso A restino invariati;
5. simulata nuova iscrizione in progetto B con snapshot anagrafico e aziendale B;
6. archiviazione del corsista senza perdita di iscrizioni;
7. ripristino del corsista;
8. rollback completo.

Esito: **OK**.

### Housekeeping migration completato
Database e repository sono ora riallineati sui timestamp Supabase reali:
- `20261021092912_corsisti_company_history_and_enrollment_snapshot.sql`;
- `20261021093024_sync_corsisti_company_history_trigger.sql`;
- `20261022194726_corsisti_identity_snapshot_and_archive_guard.sql`;
- `20261022200704_corsisti_company_effective_date.sql`.

Commit di materializzazione mancanti:
- `d0817788b114ed984494cb4203376e88c4764adf` — snapshot/archiviazione;
- `72a6dd9e45d431bcfdb0fb52d31c917b9aaed916` — decorrenza azienda.

Le vecchie copie migration con timestamp non corrispondenti sono state rimosse.

## SafetyManager — inizializzazione Dashboard deterministica (23/10/2026)

### Contesto e perimetro
Verificato il repository corretto `SafetyManagerPro/SafetyManager` e il progetto Vercel `safety-manager-ultimate`. Nessun intervento al repository separato `SafetyTraining`.

Le etichette "Panoramica" e "Controllo e Report" non sono moduli autonomi in questo repository. Funzioni operative già esistenti:
- `modules/admin.html` + `js/modules/dashboard_pro.js`: dashboard con KPI, attività, stato corsi, verifica fascicoli e salute sistema;
- `modules/collaudo.html` + `js/modules/collaudo.js`: collaudo tecnico e scarico report.
Non duplicare indiscriminatamente la UI di SafetyTraining.

### Correzione applicata
Problema tecnico individuato dal sorgente: `modules/admin.html` caricava una catena di script via `onload` di una GIF trasparente, mentre `js/app.js` poteva già avviare `loadDashboardStats`, causando inizializzazioni concorrenti e letture duplicate.

- `js/app.js`: la funzione `loadOptionalSafetyScript` ora condivide la stessa Promise tra richieste concorrenti dello stesso script; in caso di errore elimina la Promise fallita e permette un successivo tentativo.
- `js/app.js`: all'apertura di `admin` carica in ordine dashboard, checklist, prepara corso, rifiniture UI, suite professionale e soltanto dopo esegue/attende `loadDashboardStats`.
- `modules/admin.html`: rimosso il trigger tramite GIF nascosta.
- `sw.js`: verificato, lascia i file JS/HTML in strategia network-first; nessun incremento cache necessario per questo rilascio.

### Commits e verifica
- `09fec2636037f6e672f58041bbfe03fb1ed00acb`: loader e deduplicazione;
- `a0630e32cbc17c1275afb05240e2ab4ac07fc0b5`: rimozione immagine invisibile.
- Vercel produzione del commit `a0630e32`: deployment `dpl_ArrTaB6UHniyaKgi98q6pYCkG7FH`, stato READY.
- Monitoraggio Vercel: nessun cluster di errori runtime nell'ultima ora e nessun log error/fatal nella finestra recente di 20 minuti.

### Limitazioni del collaudo e prossimi passi
- Non è stato effettuato il collaudo visivo con una sessione admin reale né la misurazione browser delle chiamate database. "READY" non equivale a test end-to-end.
- In sessione admin verificare: accesso, primo caricamento Dashboard, numeri progetti/aziende/corsisti/docenti, pulsanti Checklist/Prepara corso, ritorno alla Dashboard da altre sezioni, layout mobile/tablet e assenza di errori console.
- Salvaguardie: nessuna modifica a dati Supabase, migrazioni, ruoli, certificati, snapshot o sistema di stampa in questo intervento.


## SafetyManager — documenti e facsimili accanto agli attestati (23/10/2026)

Richiesta: quando il corsista dispone di attestato, rendere visibili i modelli di nomina/incarico e la documentazione necessaria per la gestione aziendale, stampabili.

### Intervento gestionale
- File: `js/modules/progetti_corsisti_refinement.js`.
- I pulsanti di nomina/incarico/autorizzazione sono offerti nello storico corsista solo se esiste un certificato collegato (`iscrizioni.id_certificato`) e la formazione è completata con i controlli di frequenza/esito/pratica già implementati.
- Dove pertinente ai DPI è disponibile `Modello DPI`: stampa un verbale di consegna da completare e sottoscrivere; non attesta automaticamente la consegna dei dispositivi.
- I modelli stampa ora riportano un banner **FACSIMILE DA COMPILARE E SOTTOSCRIVERE**: l'attestato non equivale a nomina, incarico o autorizzazione già perfezionata.
- Correzione fondamentale: dati lavoratore e azienda dai campi snapshot dell'iscrizione storica, evitando che successivi cambi azienda/anagrafica riscrivano contenuti dei facsimili legati ai corsi precedenti.
- Nessuna modifica al database SafetyManager, agli attestati già emessi o ai corsi congelati.

Commit: `a4651f2e228bb279e56296cec101a68c3f557653` e `e57aa2200bad75027a5679c9829b82344603e96b`.

### Disponibilità al corsista (portale LMS)
Implementato separatamente su SafetyTraining v44: nuova area `Attestato e documenti collegati`, con PDF pubblicati, visualizzazione/stampa del corsista e facsimili correlati per ruolo. L'upload del PDF definitivo e l'approvazione spettano al `platform_admin` in SafetyTraining, tramite repository/database distinti. Nessuna sincronizzazione automatica degli attestati da SafetyManager è stata implementata: non promettere disponibilità remota prima del caricamento del PDF effettivo.

### Da collaudare
- Verificare una scheda con attestato reale e relativo storico in SafetyManager: mostra nomina/autorizzazione o modello DPI a seconda del corso; nomine prive di attestato non devono apparire.
- Verificare su iPhone e desktop la stampa dei facsimili e l'uso delle anagrafiche snapshot.
- Verificare portale LMS con iscrizione realmente `passed/completed`: oggi non ne risultano, quindi E2E non eseguito.


## SafetyManager — stampa senza vincoli di corso o attestato (23/10/2026, aggiornamento)

Richiesta: nessun blocco alla stampa di attestati, nomine, incarichi o altri modelli, neppure quando corso/esito/attestato non sono presenti o completi.

**Modifiche realizzate**
- `js/modules/documenti_azienda_lavoratore_directory.js` (`8bb9250099`, `0745d1433c`): rimosse restrizioni su esito, attestato e formazione completata dai modelli documentali. Nel Centro Stampe inserita sezione `Stampa libera di qualsiasi modello`, operativa anche con anagrafiche vuote; facsimili per attestati non certificanti, nomine/designazioni, incarichi, autorizzazioni, DPI, registro, dichiarazione DL.
- `js/modules/progetti_corsisti_refinement.js` (`1b573f718f`): pulsanti e generazione nomine/DPI non dipendono più da corso superato o codice certificato. Disponibile incarico generico.
- `js/utils.js` (`e352e869ed`): `renderPrintModulePages` non omette più `autocert` e `relazione_tutor`; esito mancante da ora `Da verificare`, non `Idoneo`; attestati ancora privi di conferma marcati `BOZZA ATTESTATO` pur rimanendo stampabili.
- Firme, incarichi e attestati **non vengono falsamente dichiarati validi** a causa di una semplice stampa. I modelli riportano una dicitura di facsimile/bozza, completamento e sottoscrizione a cura dei responsabili.

**Portale corsista**
SafetyTraining v44.1 integra stampe PDF e facsimili per ogni iscrizione, di qualsiasi stato. Rimossi anche lato Supabase i vincoli sul completamento e sulla sequenza attestato→allegati tramite migration `v44_003`. Restano protezioni di accesso ai documenti altrui, Storage privato e identità del destinatario.

**Controlli**
Sintassi JavaScript superata, Vercel produzione `safety-manager-ultimate` commit `0745d1433c` READY. L'effettivo collaudo browser di ogni stampa, la verifica del layout A4 e la prova con un corsista reale rimangono pendenti. Documentazione SafetyTraining aggiornata in `SAFETYTRAINING_HANDOFF_LATEST.md` e `SAFETYTRAINING_HANDOFF.md`.


### Ulteriori rifiniture e stato finale della stampa libera (23/10/2026)
- **SafetyManager:** `js/modules/documenti_condizionali.js` (`7760c4bb65`) non disabilita più pulsanti autocertificazione, tutor e dichiarazioni docenti per ente/tutor/docente mancante; senza docenti il renderer restituisce il facsimile vuoto anziché zero pagine.
- `js/utils.js` (`6ca8e2b34e`) etichetta come `FACSIMILE` anche le dichiarazioni docente senza docenti assegnati; rimane disponibile l'apertura della stampa.
- **SafetyTraining:** `apps/training/learner-course-documents-v44.js` (`e4837d4062`) aggiunge la stampa in bianco nella schermata admin **anche senza alcuna iscrizione selezionata**; accesso riservato all'amministratore, nessun controllo di esito/firma per stampare.
- I controlli di destinatario e riservatezza dei file pubblicati restano attivi; nessun modello in bianco vale come atto emesso.

## Verifica stampe sezione Corsisti — 23 ottobre 2026

Richiesta: controllare che le stampe da **Corsisti** siano disponibili a prescindere da corso frequentato, esito positivo, percentuale di frequenza, data fine, certificato emesso e disponibilità di SafetyTraining.

### Risultato controllo iniziale
- Attestato per un corso già collegato al corsista: pulsante presente in `js/utils.js`; `stampaAttestatoCorsista` in `js/modules/stampe_bundle.js` non impone esito o codice attestato; i documenti incompleti sono marcati come BOZZA dal renderer.
- Modelli nomine, incarichi e DPI per i corsi del corsista: funzioni esistevano in `js/modules/progetti_corsisti_refinement.js`, ma il modulo non veniva caricato dalla normale navigazione. I pulsanti non potevano quindi considerarsi sempre attivi.
- Per i corsisti senza corsi registrati mancava un pulsante per accedere ai modelli dalla propria anagrafica (esisteva soltanto la stampa in bianco del Centro Stampe).

### Correzioni effettivamente apportate
- `js/app.js` commit `21ea750007`: all'apertura di `Corsisti` viene caricato esplicitamente `js/modules/progetti_corsisti_refinement.js` **prima** di caricare la tabella; non dipende più dall'apertura della Dashboard o da altri componenti.
- `js/utils.js` commit `7e9a24e6c1`: nuovo pulsante con icona stampante per **ogni corsista**, anche senza iscrizioni, in attivo o archiviato. La vista mobile replica le azioni della tabella.
- `js/modules/progetti_corsisti_refinement.js` commit `7609918310`: `apriStampeLibereCorsista(corsistaId)` apre una selezione di modelli A4 (attestato bozza, preposto, primo soccorso, antincendio, attrezzature, quota, confinati, incarico generico, verbale/registro DPI e dichiarazione DL). Se esistono corsi, un pulsante separato stampa l'attestato dell'iscrizione scelta. Nessun corso richiesto per stampare facsimili.
- `js/modules/documenti_azienda_lavoratore_directory.js` commit `fadc024224`: `stampaModelloVuotoSafetyDoc(type, corsistaId)` accetta facoltativamente un corsista e precompila nome/CF/mansione/azienda senza richiedere che esista alcuna iscrizione; il testo di bozza resta ben visibile.
- `js/modules/progetti_corsisti_refinement.js` commit `4fb8b2a3aa`: le anagrafiche senza corsi non attivano il caricamento di tutto lo storico; i modelli liberi rimangono funzionanti tramite caricamento leggero `ensureCompanyDocEngine(false)`.
- Non è stato modificato SafetyTraining né alcuno schema/database. Accesso amministrativo gestionale già esistente mantenuto.

### Verifica e limiti
- Lettura codice sorgente con controllo specifico dell'intero percorso UI→comando→motore e sintassi JavaScript `new Function` per i quattro file aggiornati: superata.
- Deploy Vercel codice `7609918310` risultato READY; verificare anche la versione definitiva dopo questo promemoria.
- Non è stato eseguito un test funzionale autenticato su un corsista reale (percorso click→dialogo stampa su desktop e mobile); pertanto non presentarlo come collaudato end-to-end.
- Stampa attestati ufficiali continua a richiedere dati attendibili per essere considerata emissione; il comando stampa NON è vincolato da tali dati e in caso incompleto produce una BOZZA.
- Se in futuro si rielabora la scheda Corsisti, conservare il pulsante in ogni riga e l'aggancio in `loadModule('corsisti')` per evitare il ripetersi del bug.


## 23/10/2026 — Fascicolo documentale PDF individuale, v1

Richiesta: archivio consultabile dalla scheda **Corsisti**, caricamento, apertura/stampa di PDF già salvati, stati bozza/definitivo/superato e versioni immutabili; nessun vincolo tra stampa e archivio o esito formativo. Non toccare SafetyTraining.

### Modifiche applicate (solo SafetyManager Pro)
- SQL live migrations Supabase progetto `gblcedkfnasqlnrxupzx`:
  - `20261023203914_corsisti_fascicolo_individuale_privato.sql` crea `corsisti_documenti_archivio` con RLS admin-only e snapshot di nome, CF, mansione, azienda e iscrizione; `gruppo_versioni`, `versione`, `precedente_id` e trigger di controllo impediscono sovrascrittura dei metadati storici. I documenti rimangono in archivio anche cambiando azienda o ruolo. Nessun vincolo di completamento/attestato/esito.
  - Bucket **privato** `corsisti-fascicolo-privato`, PDF max 15 MB, accessibile solo da admin con link temporaneo da `createSignedUrl`. Non usare il preesistente bucket pubblico `documenti-corsisti` per i nuovi file; non alterare i file già collegati.
  - `20261023204222_corsisti_fascicolo_protect_registered_pdfs.sql` limita Storage DELETE alla pulizia dei file non registrati, proteggendo le versioni PDF già associate a record storici.
  - Tabella senza policy DELETE e con UPDATE limitato dal trigger ai soli campi `stato`/`modificato_il`; caricare un nuovo PDF crea sempre una nuova riga/versione e un nuovo oggetto privato.
- `js/modules/corsisti_fascicolo_archivio.js` — nuovo modulo con:
  - `apriFascicoloCorsista(id)` per ogni anagrafica, anche senza iscrizioni;
  - elenco PDF storici con titolo, tipo, versione, stato, data, azienda storica, riferimento corso facoltativo e note;
  - carica PDF con controlli estensione, mime, intestazione %PDF- e max 15 MB, percorso unico per upload, cleanup se inserimento metadati fallisce;
  - apertura/rstampa via URL privato a scadenza, con popup aperto direttamente dal click per compatibilità Safari;
  - `Nuova versione` mantiene le precedenti, propone tipo/titolo/corso, conserva snapshot e può segnare superata la versione precedente;
  - `Segna definitivo` e `Segna superato` gestionali, senza dichiarare il documento legalmente emesso per sola classificazione.
- `js/app.js`: carica il fascicolo autonomamente nella navigazione `Corsisti`, dopo il modulo di stampa libera, prima della tabella.
- `js/utils.js`: aggiunge pulsante cartella/archivio nella colonna Azioni di **tutte** le anagrafiche, anche senza corsi.
- `js/modules/progetti_corsisti_refinement.js`: il pannello di stampa libera apre anche il fascicolo; nessuna interferenza con la stampa esistente.
- Sorgenti migration commit `036b23e3f49d` e `b3a645559d74`; modulo `d86e78217d55`; agganci UI `4f08a3562b97`, `e01e9d9a1c7c`, `d94e4d615e41`.

### Collaudi eseguiti
- `execute_sql`: tabella creata, RLS attiva, bucket privato con limite 15 MB, policy separate e archivio inizialmente vuoto.
- Test SQL **in transazione con rollback**: inserimento documento prima versione + seconda versione, cambio di stato e rifiuto della modifica retroattiva dei metadati. Nessun record di test conservato. Verificato dopo ROLLBACK: count 0, bucket privato, policy delete limitata agli orfani.
- GitHub lettura e controllo della **sintassi JavaScript** dei file modificati: superato.
- Vercel produzione READY per commit `b3a645559d74`; log runtime ultimi 30 minuti: nessun errore rilevato.
- Security Advisor Supabase: nessun nuovo warning riconducibile alla tabella o al bucket, rimane una notifica preesistente relativa alla protezione password.

### Limiti e mantenimento
- Per registrare il PDF **generato dalla funzione Stampa** oggi usare il comando browser `Stampa → Salva come PDF`, poi `Fascicolo → Archivia PDF`. La cattura/salvataggio PDF automatico dal motore HTML di stampa non è ancora implementata. Non presentare questa fase come automatica.
- I file documentali **precedenti**, collegati dai campi URL delle anagrafiche (in alcuni bucket Storage pubblici), non vengono migrati automaticamente e restano nei percorsi storici. Non cambiare i permessi dei bucket legacy senza analisi del relativo impatto.
- L'archiviazione è riservata all'admin SafetyManager già configurato. Le policy impediscono accesso a persone non autorizzate: la stampa dei modelli rimane libera **all'interno del gestionale**, non diventa pubblica online.
- L'attuale vincolo FK su `corsisti_documenti_archivio.corsista_id` preserva i record e può impedire hard-delete di corsisti con fascicoli, coerentemente con l'immutabilità della storia; predisporre una procedura privacy/DSR autorizzata prima di tentare cancellazioni definitive.
- Verifica manuale con admin autenticato e un PDF reale da desktop + iPhone **da fare**. Il deploy READY e la sintassi JS non equivalgono a test end-to-end.


## 23/10/2026 — Archiviazione automatica FACOLTATIVA delle stampe Corsisti

**Intento utente:** procedere con salvataggio dei documenti generati direttamente nel fascicolo, ma senza imporlo e senza nuovi vincoli a stampa, iscrizioni, esito, attestato o altre applicazioni.

### Funzionalità rilasciate (solo SafetyManager Pro)
- `js/modules/corsisti_autoarchivia_stampe.js`: servizio `window.SafetyCorsistiAutoArchive` con `enabled()`, `setEnabled(bool)`, `capture(printArea,context)`.
  - Impostazione **di default OFF**. La scelta volontaria viene memorizzata nel browser (`localStorage`) ed è revocabile in qualsiasi momento. Non cambia gli accessi Supabase o il comportamento del tasto Stampa.
  - Raccoglie una copia DOM dei fogli già generati **prima** che la stampa nativa liberi l'area `#print-area-temp`; crea PDF con `html2pdf.js` **0.10.1** caricato su richiesta da cdnjs, URL fissato e attributo di integrità SRI verificato rispetto al progetto ufficiale; conversione locale nel browser, no invio del contenuto al CDN.
  - Attiva in modo asincrono `SafetyCorsistiFascicolo.archiveGenerated` e mostra avvisi distinti di successo o errore. **Gli errori di conversione/upload non impediscono `window.print()`.** Notifiche e area tecnica non entrano nella stampa grazie a CSS `@media print`.
  - La copia è sempre etichettata `bozza`, non è un attestato verificato o una nomina già sottoscritta. PDF individuali A4, attuali limiti di peso archivio 15 MB. Anche i vecchi PDF possono continuare a essere caricati manualmente.
- `js/modules/corsisti_fascicolo_archivio.js`: API `archiveGenerated({corsistaId,projectId,tipo_documento,titolo,blob})`. Salva direttamente nel bucket privato `corsisti-fascicolo-privato` e nella tabella `corsisti_documenti_archivio`, recupera snapshot storico dell'iscrizione quando presente, altrimenti anagrafica attuale, e collega una **nuova versione** a documenti precedenti dello stesso tipo/titolo/progetto. PDF già archiviati non sono sovrascritti. Una nuova **bozza** automatica **non segna `superato` un documento definitivo precedente**.
- `js/modules/progetti_corsisti_refinement.js`: checkbox `Archivia automaticamente quando stampo` nel pannello `Stampa libera corsista`; archiviazione associata alla stampa nomine, incarichi e DPI, inclusi i documenti legati a corsi storici.
- `js/modules/documenti_azienda_lavoratore_directory.js`: quando `stampaModelloVuotoSafetyDoc(type,corsistaId)` è usato nella schermata corsista, abilita l'autoarchivio dei facsimili; quando il modello è in bianco e senza corsista, stampa normalmente senza inventare un destinatario.
- `js/modules/stampe_bundle.js`: collegata la stampa degli **attestati individuali** al salvataggio facoltativo, senza cambiare l'esecuzione della stampa. Le stampe di gruppo non fanno archiviazioni forzate/ambigue sui singoli corsisti.
- `js/app.js`: carica il nuovo modulo solo nella navigazione Corsisti; nessun collegamento a SafetyTraining.
- Aggiunta opzione anche nella finestra **Fascicolo documentale** per scegliere/annullare la preferenza senza aprire il menu di stampa.
- Non sono state modificate tabelle Supabase, permessi RLS, file Storage esistenti, corsi o documenti già emessi. Non è stato toccato SafetyTraining.

### Verifiche e limiti residui
- Source review del flusso: checkbox → `capture` → snapshot DOM A4 → convertitore PDF browser → `archiveGenerated` → Storage privato → metadata + versioni. Sintassi JS dei file verificata con `new Function` senza errori.
- Libreria `html2pdf.js` versione e hash SRI confrontati con documentazione ufficiale: non scarica immagini o dati del corsista verso il provider CDN; JavaScript libreria recuperato solo alla prima archiviazione richiesta.
- Ultime revisioni principali: `2fe1733bd45d` (API archivio PDF), `1e1dfa2665c4` (servizio conversione), `4da29f95d6b3` (loader), `02c356b78812` (checkbox + nomina/DPI), `3794787576c9` (facsimili), `50a463d2049f` (attestati), `05630ffad942` (checkbox fascicolo + preservazione definitivi), `aed9a0d02180` (esclusione notifiche dal foglio).
- Ultimo controllo Vercel: le modifiche del codice sino a `50a463d2049f` risultavano READY; **verificare stato finale dell'ultimo commit dopo questo aggiornamento**. Log runtime nei 30 minuti precedenti: nessun errore rilevato.
- **Non ancora certificato** il test end-to-end con amministratore reale su desktop/iPhone, stampa nativa e PDF generato. La conversione rasterizzata html2pdf può avere differenze di impaginazione da `window.print()` e dipende dalla disponibilità del CDN del convertitore; se il convertitore fallisce, la stampa continua e compare un messaggio di errore. Eseguire in seguito prova su un attestato multipagina e una nomina/DPI, verificando formato, immagini, firme e numero pagine.
- NOTA: l'opzione è **automatica se abilitata**, non automatica di default; non archivia in modo retroattivo documenti stampati prima dell'attivazione. Le stampe di gruppo rimangono libere e non associate automaticamente a fascicoli individuali.
- Rifinitura successiva `4ced37b7d717`: i ruoli/tipi di stampa non presenti nel dizionario di associazione vengono archiviati come `altro` invece di generare errori che impedivano il solo salvataggio PDF; l'originale resta comunque stampabile.


## 2026-10-26 — BLOCCO SALVATAGGIO CORSISTA: falso errore «Codice fiscale già presente» — RISOLTO

**Segnalazione:** l'admin tenta di creare un corsista, il gestionale mostra «Codice fiscale già presente», sebbene il CF cercato non compaia nelle anagrafiche.

### Diagnosi verificata direttamente sul database SafetyManager
- Prima della correzione **ogni nuovo INSERT su `public.corsisti` falliva con PostgreSQL `23503`**: il trigger `trg_sync_corsista_company_history` era `BEFORE INSERT` e chiamava `sync_corsista_company_history()`, tentando di scrivere `corsisti_rapporti_azienda` mentre il record padre non esisteva ancora. FK `corsisti_rapporti_azienda_corsista_id_fkey` violata.
- Il client `window.saveCorsistaData` catturava qualsiasi errore e restituiva `false`; **quattro form di inserimento** mostravano genericamente il CF duplicato anche per `23503` o altri errori di rete, autorizzazione, schema, etc.
- Controllo base dati: **114 corsisti reali, 0 archiviati**, esattamente **1 coppia storica di righe con stesso nome/CF normalizzato** e due iscrizioni collegate; non fonderle né cancellarle automaticamente, la coppia non era la causa del blocco globale ai nuovi inserimenti. Tutte le righe hanno `ente_id` nullo. Dato aggregato, NON esporre nomi/CF in chiaro nei report tecnici.
- Test iniziale, dentro transazione con `ROLLBACK`: creazione anagrafica sintetica falliva con `23503` (FK history), come previsto dalla diagnosi.

### Fix applicato
- Supabase schema migration live `20261026090326_fix_corsisti_company_history_insert_fk_order` e file di migrazione versionato `supabase/migrations/20261026090326_fix_corsisti_company_history_insert_fk_order.sql`, commit `b30cea84ccb3`:
  - aggiunge `trg_prepare_corsista_company_insert` **BEFORE INSERT** che imposta la decorrenza dell'azienda e blocca quelle future;
  - sposta `sync_corsista_company_history()` per INSERT nel trigger **AFTER INSERT**, quando il padre esiste e la FK è soddisfatta;
  - conserva su **BEFORE UPDATE** la logica di cambio azienda / mansione e storico precedente; nessun dato preesistente modificato.
- `js/supabase_config.js` commit `65266bade6f1`: `checkCorsistaCfDuplicato` non nasconde più problemi di lettura; `saveCorsistaData` resetta `lastCorsistaSaveError` e classifica gli errori reali (CF `23505`, FK `23503`, RLS `42501`, altri) per presentare messaggi pertinenti. Eliminato l'alert duplicato interno e il doppio avviso. L'anticollisione CF **rimane attivo**.
- `js/utils.js` commit `b341886d9f50` e `js/modules/corsisti_ruolo_azienda.js` commit `2f3588ed0fe5`: quattro percorsi di inserimento/modifica (scheda Corsisti, inserimento rapido, ruoli aziendali) ora mostrano `getCorsistaSaveErrorMessage()` al posto del messaggio generico sul CF.

### Test condotti (tutti con ROLLBACK, nessun dato sintetico persistente)
1. Nuovo corsista senza azienda: `OK`, una riga coerente nello storico.
2. Nuovo corsista con azienda: `OK`, azienda e decorrenza odierna salvate, una riga nello storico.
3. CF già usato: errore univoco `23505` come atteso (vincolo duplicati **mantenuto**).
4. Decorrenza aziendale futura: blocco specifico come atteso (controllo **mantenuto**).
5. Simulazione del ruolo PostgreSQL `authenticated` con identità admin configurata e RLS attiva: `OK`, inserimento e storico accessibili.
6. Conteggio finale invariato: **114** corsisti reali.
7. Syntax-check `new Function` di 3 JS aggiornati: `OK`.
8. Produzione Vercel `safety-manager-ultimate` commit `b30cea84ccb3` READY; runtime errors ultimi 30 minuti assenti (non sostituisce il test browser).

**Rimane da collaudare manualmente l'inserimento dal modulo effettivo con login admin**, confermando che la nuova anagrafica appare in elenco e che il relativo storico azienda è corretto. Non ho modificato SafetyTraining. Conservare unicità fiscale reale, mai disabilitare trigger anticollisione per «risolvere» falsi avvisi.


## 2026-10-26 — UI Corsisti: barra scorrimento, Progetti attivi: zebra/hover per progetto

**Richiesta:** in `Corsisti → Gestione Corsista`, aggiungere scorrimento verticale nel modulo lungo; in `Progetti → Progetti Attivi`, evidenziare al passaggio del mouse l'intero progetto e differenziare con colori alternati tenui dove ogni progetto inizia/finisce.

### Modifiche effettive
- `modules/corsisti.html`: identificatore stabile `id="corsista-form-card"` nel modulo laterale Gestione Corsista; il modulo e tutti i suoi campi restano immutati.
- `index.html`: su desktop (`min-width:1024px`) il card Corsista sticky dispone di `max-height:calc(100dvh - var(--nav-offset) - 1.25rem)`, `overflow-y:auto`, scrollbar sottile visibile quando necessaria, `scrollbar-gutter:stable`, overscroll contain. Sotto 1024px disabilita sticky e overflow interno, conservando scorrimento naturale di pagina e leggibilità dei campi.
- `js/utils.js`: `window.decorateProjectVisualGroups()` raggruppa le tre righe dei progetti (`data-project-id`: separatore, corso/azienda, partecipanti) e applica `data-project-band="odd/even"` al **gruppo intero** invece di usare `:nth-child(tr)`. Collega `pointerover/pointerleave` al tbody una sola volta: su hover applica `data-project-hover="true"` a tutte le tre righe dello stesso progetto. I filtri `filtraProgetti` richiamano il decoratore, ricalcolando zebra dei soli progetti rimasti visibili. Le card mobile usano anch'esse lo stesso alternarsi di toni.
- `index.html`: CSS dedicato ai progetti con sfondi blu-ardesia morbidi (#192c3e / #284053), hover #3a5d72 e confini attenuati; i separatori gialli pesanti (bordo 4/8px, banner saturo) sono stati visivamente ridotti con CSS specifico a bordi grigio-azzurri e sottili. I badge colorati di stato, pulsanti e pannelli di contenuto rimangono distinti e leggibili. Supporto `prefers-reduced-motion`.

### Test e limitazioni
- Lettura del DOM sorgente dei due moduli e del renderer di Progetti attivi: ogni progetto genera 3 `<tr>`, più una card mobile; quindi alternanza per tr sarebbe stata scorretta.
- `new Function` sintassi `js/utils.js` e altri moduli associati: PASS.
- Test simulato dell'algoritmo con tre gruppi da tre righe: zebra `odd/even/odd` applicata coerentemente al gruppo, `pointerover` evidenzia esattamente 3 righe, `pointerleave` ripristina; i filtri ricalcolano l'alternanza dei progetti visibili e delle card mobile: PASS.
- CSS isolato a `#corsista-form-card`, `#tabella-progetti` e `#progetti-mobile-cards`; non sono stati modificati Supabase, anagrafiche, progetti o dati documentali. **SafetyTraining non toccato.**
- Non eseguito collaudo autenticato visuale desktop/tablet/mobile nel browser reale: verificare in seguito scrollbar con sezione lingua espansa, focus tastiera, hover intero progetto, colori dopo filtraggio e confronto con la modalità mobile.


## 2026-10-26 — Anagrafica Corsisti: caricamento a pagine reali da 20

**Problema e richiesta:** la sezione Anagrafica Corsisti continua ad essere lenta/instabile al caricamento; richiesta di suddivisione in pagine da 15/20 oppure fetch frazionato.

### Diagnosi
- `js/utils.js → loadCorsistiTable()` interrogava in **un unico request** l'intera tabella `corsisti` con join `aziende`, `iscrizioni`, `progetti`, poi costruiva tutte le righe con documenti/storico e la vista mobile, anche quando l'utente ne visualizzava solo una frazione.
- `js/modules/progetti_corsisti_refinement.js → decorateCorsistiNomine()` innescava anche `ensureCompanyDocEngine() / D.loadDirectory()`, che per decorare i pulsanti di nomina recuperava dataset più ampi di anagrafiche, progetti e iscrizioni. Costava anche senza aprire alcun modello di stampa.
- Test aggregato SQL al momento del fix: **115 corsisti attivi**, 150 iscrizioni totali, 99 corsisti iscritti; pagine SQL da 20 su 115 risultano 20/20 senza ID condivisi. Nessun dato esistente modificato.

### Soluzione implementata (solo repository SafetyManager)
- `modules/corsisti.html`: footer accessibile `#corsisti-pagination` con navigazione.
- `js/utils.js`: `window.corsistiPageState`, `renderCorsistiPagination`, `vaiPaginaCorsisti`. `loadCorsistiTable` ora utilizza **Supabase `range(offset,offset+19)` sul DB** ordinato stabilmente per `nome_cognome,id`, con `count:'exact'`: trasferisce solo i dettagli e tutte le iscrizioni dei 20 corsisti correnti, non il join di tutti gli utenti.
  - Pulsanti precedente/successiva e fino a 5 numeri pagina; contatore 'Corsisti X–Y di N'; con 115 attivi le pagine sono 6 (20+20+20+20+20+15).
  - Ricerca e filtri su DB **prima** della paginazione: stato attivo/archiviato/tutti, azienda, tipologia corso (risoluzione corsisti dalle iscrizioni/progetti), testo su nome/CF/mansione/nascita e ricerca per azienda o progetto/corso. Quando si cambia un filtro si ritorna a pagina 1, debounce 300ms; applicazione coerente a tutto il database e non solo alle 20 righe.
  - Protezione da richieste concorrenti con `requestId`, gestione pagina fuori intervallo, pulsante Riprova ed errore DB effettivo, mantenimento selezione azienda del form mentre si cambia pagina.
  - `window.corsistiList` nella schermata Corsisti contiene la pagina corrente: i pulsanti di modifica, archivio e stampa agiscono sempre sui record visibili.
- `js/modules/progetti_corsisti_refinement.js`: `decorateCorsistiNomine` monta i comandi su ogni riga senza invocare lo storico completo in fase di caricamento; il motore di nomine/DPI recupera dati approfonditi soltanto quando l'utente effettivamente stampa.
- `js/modules/documenti_azienda_lavoratore_directory.js`: in presenza della paginazione, il motore documentale recupera le anagrafiche complete **solo su richiesta di stampa** (non dal subset pagina) e non sovrascrive `window.corsistiList` della pagina visualizzata. Mantiene nomine e incarichi anche navigando su pagine successive.
- `js/utils.js`: regex di pulizia termini ricerca (Unicode) e preservazione della scelta azienda nel modulo Gestione Corsista.
- Migrazioni Supabase: **nessuna**; SafetyTraining **non modificato**. Resta la stampa libera e l'archiviazione PDF precedente.

### Test e limiti
- Controllo JavaScript sintassi `new Function`: PASS (`js/utils.js`, `progetti_corsisti_refinement.js` e directory documenti).
- Test logico su loader originale isolato con database/DOM simulati (42 attivi, 20 archiviati): pagina 1=20, pagina 2=20, pagina 3=2, nessuna sovrapposizione; filtro 'archiviato' applicato prima di range; page counter corretto: PASS.
- Query SQL sul progetto vero: pagina 1 e 2 da 20, 0 ID in comune; 115 corsisti attivi. Non sono stati creati né alterati corsisti.
- Limite: ricerca testata come architettura e sintassi, non ancora in UI amministrativa autenticata; il filtro corso interroga `progetti` e `iscrizioni` separatamente e potrebbe richiedere ulteriore ottimizzazione con database molto più grande (>1000 elementi). Verificare anche navigazione mobile, salvataggio e stampa da pagina 2+, ordinamenti/filtri e latenza reale sul browser.
- Nessun aumento permessi RLS; le chiamate usano il client Supabase già autorizzato.


## 2026-10-26 — Corsisti: blocco browser/popup «Attendi» nonostante paginazione

**Segnalazione:** Anagrafica Corsisti resta bloccata e browser mostra spesso il popup «Attendi», anche dopo paginazione database in gruppi da 20. Obiettivo: intervento conservativo senza ridisegnare il programma o modificare le anagrafiche.

### Causa tecnica individuata nel frontend
- `js/modules/corsisti_ruolo_azienda.js`: `decorateRows()` assegnava **incondizionatamente** `badge.textContent`, anche se già uguale. Ciò produceva mutazioni DOM, osservate da un `MutationObserver({childList:true,subtree:true})` su tutto `#app-content`; il callback lanciava `apply()` e quindi `decorateRows()` nuovamente, generando un possibile ciclo senza fine ogni 40 ms.
- `js/modules/progetti_corsisti_refinement.js`: un secondo `MutationObserver({childList:true,subtree:true})` richiamava `apply()` a ogni mutazione dentro Corsisti, anche per pulsanti/iconografie e card responsive. La routine `decorateCorsistiNomine()` chiamava inoltre `lucide.createIcons()` anche se non era stato aggiunto alcun pulsante.
- Questi carichi ripetuti **non sono risolti dalla paginazione**: la UI continua ad osservare e processare inutilmente variazioni interne, causando rallentamenti fino a segnalazioni del browser «Attendi». Non sono emerse segnalazioni Vercel runtime nel periodo controllato (un loop client-side può non produrre log lato server).

### Correzione mirata applicata
1. `js/modules/corsisti_ruolo_azienda.js`: aggiorna il testo del badge ruolo **solo se diverso**. Il suo MutationObserver osserva solo i figli **diretti** di `#app-content`: riceve i cambi modulo, non ogni modifica di riga/cella.
2. `js/modules/progetti_corsisti_refinement.js`: stessa restrizione osservatore ai figli diretti di `#app-content`. `decorateCorsistiNomine()` crea icone Lucide **solo quando inserisce nuovi pulsanti**. Restano attive le funzioni di stampa, nomina, DPI, paginazione e modifica.
3. La gestione degli aggiornamenti della tabella Corsisti continua tramite i wrapper di `loadCorsistiTable`, già previsti: il cambio pagina non necessita dei due observer profondi.

### Verifiche
- Commit `5bf7e20fdd7c7772bdbef858918bae686f596900` (ruoli), `b773e3a61552998f785d7e099897786a05d080c7` (refinement).
- Lettura di ritorno codice GitHub e syntax-check `new Function`: **PASS** per entrambi i file e `js/utils.js` paginato.
- Test unitario isolato di `decorateRows` con cella/badge simulati: due esecuzioni consecutive causano **un solo** aggiornamento del testo, non due: **PASS**.
- Produzione Vercel codice `b773e3a` **READY**; `get_runtime_errors` ultimi 30 minuti: nessun errore server.
- **Manca collaudo effettivo in browser autenticato** sul dispositivo con popup. Non affermare che l'interruzione browser sia stata osservata e verificata come risolta con test end-to-end; attendere feedback sulla schermata dopo ricarica. Se persiste, indagare i restanti observer globali e registrare performance del browser, senza cambiare DB.

### Vincoli invariati
- Pagine reali da 20 e ricerca/filtri di tutte le anagrafiche, privacy/RLS, upload documenti, stampe libere, nomine e fascicolo PDF conservati.
- **Nessuna modifica Supabase o ai dati corsisti**. **SafetyTraining non è stato toccato**.


## 2026-10-26 — Rubrica alfabetica A–Z + ricerca globale Corsisti e Aziende

**Richiesta:** valutare sostituzione numerazione pagine 1,2,3,4 con indice alfabetico, mantenendo ricerca in **tutto il database**, non soltanto nei 20 record visibili; implementare anche in `Anagrafica Aziende`.

### Architettura scelta
- **Combinazione rubrica A–Z e pagine da 20**: l'utente sceglie una lettera iniziale tramite `Tutti / A–Z`; se quella lettera contiene >20 record compaiono pagine successive. `Tutti` consente anche nomi iniziali con numeri e caratteri diversi da A–Z.
- **Ricerca sempre globale**: digitando nella casella, il filtro alfabetico torna a `Tutti`, la pagina torna a 1, e la query cerca direttamente in Supabase l'intero archivio autorizzato, non le righe HTML presenti nella pagina. Anche i filtri corso/azienda/stato Corsisti continuano ad essere applicati lato server.
- Le lettere filtrano l'inizio del campo `corsisti.nome_cognome` e `aziende.ragione_sociale`, non il cognome estratto arbitrariamente dall'anagrafica. Varianti accentate iniziali A/E/I/O/U, Ç e Ñ vengono incluse nei filtri corrispondenti.
- Nessun nuovo limite di stampa, nessun vincolo tra applicazioni.

### File modificati
- `modules/corsisti.html`: rubrica `#corsisti-rubrica` sopra la tabella e descrizione della ricerca globale; il footer di paginazione esistente resta.
- `modules/aziende.html`: rubrica `#aziende-rubrica`, footer di paginazione `#aziende-pagination`, campo ricerca globale.
- `js/utils.js`: helper condivisi `safetyDirectorySafeSearch`, `safetyDirectoryApplyLetter`, `renderSafetyDirectoryAlphabet` (funzioni globali, non dentro l'invalidazione cache).
  - `selezionaLetteraCorsisti`: reset ricerca e pagina, aggiorna la query `loadCorsistiTable` con `nome_cognome.ilike('A%')` o OR delle varianti; mantiene pagina 20 e tutte le iscrizioni dei soli record visualizzati.
  - `filtraCorsisti`: ricerca su tutto l'archivio come già previsto, con `letter='ALL'` al nuovo testo, sanitizzazione unificata con supporto Unicode, debounce 300 ms.
  - `loadAziendeTable`: **non legge più tutte le aziende e filtra solo sul DOM**. Query REST con `count:'exact'`, `order('ragione_sociale').order('id')` e `range()`; A–Z filtra via `ilike`, ricerca globale via `or(ragione_sociale,piva_cf,ateco,referente,indirizzo,sede_operativa)`; pagine da 20, controlli Precedente/Successiva e numerazione soltanto all'interno dell'insieme corrente; messaggi di errore e ritenta.
  - `window.aziendePageRows` memorizza solo i record visualizzati; `modificaAzienda` consulta prima questo subset per consentire la modifica dalla nuova vista paginata; le API `getAziende()` full-list di altre funzionalità non sono state alterate. Rimosso l'inutile invocazione di `filtraCorsisti()` alla fine del caricamento aziende.
  - `filtraAziende`: ricerca globale DB, riparte da pagina 1, cancella il filtro alfabetico, debounce 300 ms.
- Soltanto repository **SafetyManagerPro/SafetyManager**. Nessuna modifica ai database Supabase, RLS o file, e **nessun intervento su SafetyTraining**.

### Verifiche
- `new Function` sull'intero `js/utils.js` e blocchi isolati helper/Corsisti/Aziende: **PASS**.
- Test client simulato aziende: 46 aziende, all=20, pag.2=20, lettera Z=1, iniziale accentata È sotto E=1, ricerca su partita IVA di azienda fuori dalla lettera corrente=1, bottoni A–Z/Tutti=27: **PASS**.
- Test client simulato corsisti: 35 record, lettera A=26 (20+6), lettera Z e iniziale É in E correttamente selezionate, ricerca per CF di un corsista fuori dalla lettera e fuori dalla pagina precedente trova il record e reimposta il filtro alfabetico: **PASS**.
- Lettura aggregata DB SafetyManager: **45 aziende**, **115 corsisti** (alla verifica), quindi lista aziende 3 pagine e lista corsisti circa 6 pagine non filtrate. Nessun dato modificato.
- Limite: manca ancora test end-to-end browser con sessione admin su iPhone/desktop; le navigazioni reali e i filtri combinati vanno collaudati nella UI. I risultati simulati sono test di logica, non verifica di produzione autenticata. Monitorare eventuali vincoli PostgREST sulle ricerche libere; usare sempre dati autorizzati.


## 2026-10-27 — FASE 1 APPROVATA: stabilizzazione, controlli automatici, qualità caricamenti

### Autorizzazione e confini
L'utente ha approvato **soltanto la prima fase** della roadmap proposta: ridurre caricamenti «Attendi», timeout, cicli DOM, regressioni e predisporre un processo di collaudo. Non procedere automaticamente alle fasi 2+ (architettura generale, nuove dashboard, funzioni ulteriori). Nessun dato reale o schema Supabase modificato; SafetyTraining non toccato.

### Modifiche del codice pubblicate su main
- `js/utils.js` commit `b655d4ca67fd`: la conversione delle tabelle in card mobili evita di calcolare `tbody.innerHTML` su desktop; coda `requestAnimationFrame` delle card; observer globale legato a cambi dei figli diretti di `#app-content`, non a tutto il subtree; observer tabelle filtra eventi rilevanti. L'ottimizzazione `responsive_table_performance.js` resta compatibile.
- `js/utils.js` commit `5c2d26c1db91`: `window.safetyReadWithDeadline()` con limite e cleanup timer; `loadCorsistiTable` racchiusa in try/catch, letture in `bounded()` da 15 s, requestId contro risposte obsolete, UI di errore con «Riprova caricamento», diagnostica locale `window.safetyLoadStats.corsisti` (contatori, esito, ms).
- `js/app.js` commit `0aa2e1cd50b5`: timer 12 s per script opzionali, retry su errore, abort fetch moduli HTML dopo 12 s con `AbortController`, protezione di navigazioni concorrenti `__safetyNavigationId` e messaggio `safety-module-retry`. La Dashboard usa deadline 15 s per le statistiche in fase di caricamento, senza modificarne le query.
- `js/utils.js` commit `8ed6abaeec53`: lettura pagine Aziende con limite 15 s, gestione errore «Riprova», contatori/tempi locali `safetyLoadStats.aziende`.
- `sw.js` commit `686132ac81db`: cache PWA v11 → v12, consentendo eliminazione vecchie copie al successivo service-worker activate; strategia HTML/JS network-first mantenuta.
- `tests/phase1_stability.test.cjs` commit `3e2937ff8ffd` e `4643a6dacc2`: 10 test di regressione (VM sintassi, timeout, script bloccato, binding responsive, paginazione/ricerca, navigazione, Aziende, nomine/fascicolo), test senza credenziali né dati reali.
- `package.json` commit `8f79dc6bad4d`: `npm test` include test esistente Step67 e nuova suite; `npm run check` esteso a `js/utils.js`, `js/app.js`, `js/supabase_config.js`.
- `.github/workflows/safetymanager-quality.yml` commit `63280f22ac79`: GitHub Actions su push `main` e PR verso `main`, `npm run check` + `npm test`, senza segreti né accesso al database.
- `docs/COLLAUDO_STABILIZZAZIONE_FASE1_2026-10-27.md` commit `88fcddc17484`: checklist di accettazione desktop, mobile, PWA, stampe, documenti, backup, errori di rete, e limiti del test isolato.

### Controlli verificati fino all'ultima versione
- Verifica sintassi JS `new Function` dopo modifiche importanti: PASS.
- GitHub Actions esecuzioni recenti: `40481036683`, `40481249312`, `40481420782`, `40481585350`, `40481720239` tutte **completed/success**.
- Ultimo commit con protocollo `88fcddc17484` su Vercel produzione `safety-manager-ultimate`: **READY** (deployment `dpl_81tETvXK6JJsiSrUbvmj87LUy58G`).
- Vercel runtime errors ultime 1h: nessuno rilevato. Attenzione: Vercel server runtime errors NON dimostra che la UI browser sia priva di errori.
- Nessuna migrazione Supabase e nessun cambio di policy, bucket, anagrafiche, corsi, archivi o numeri attestati.
- Test automatici sono su runner effimero indipendente dalla produzione. **Non c'è ancora una preview completa con un database di test isolato**; non utilizzare una Vercel Preview per scritture di collaudo finché non avrà un progetto Supabase diverso da produzione.
- GitHub Actions verifica il codice ma **non blocca automaticamente** il deploy Vercel su main. Per un vero deployment gate servono branch-protection/deployment checks configurati e approvati separatamente.

### Da verificare prima di dichiarare chiusa la fase operativa
1. UI admin desktop/iPhone: aprire Corsisti/Aziende, ricerca globale, rubrica A–Z, scorrimento pagine; confermare scomparsa popup browser «Attendi».
2. Simulare connessione interrotta/ritardata: mostrare «Riprova» entro il limite previsto, senza sovrascrivere navigazioni successive.
3. Verificare stampe libere, facsimili, PDF/archiviazione facoltativa, storico e ruoli; non introdurre precondizioni di completamento corsi.
4. Su PWA installata verificare update cache v12 e stato offline/online.
5. Se persistono blocchi: raccogliere log browser `safetyLoadStats` (solo dati tecnici) e profilo performance, evitando di esporre CF o documenti. 
6. Valutare successivamente ambiente browser staging con progetto DB isolato, senza esportare dati personali reali.

**Non passare alla fase 2 senza nuova approvazione dell'utente.**


## 2026-10-27 — Fase 2 approvata: anagrafiche, ricerca dei duplicati, collegamenti storici (primo blocco)

L'utente ha confermato il funzionamento della Fase 1 e ha autorizzato a proseguire. Implementato un primo blocco CONSERVATIVO della **Fase 2**, senza nuove tabelle o migrazioni Supabase né modifiche a dati esistenti.

### Interventi implementati
- `js/supabase_config.js`: normalizzazione PIVA aziendale coerente con trigger SQL esistente (IT+11 cifre equivalenti a 11 cifre); verifica pre-salvataggio su azienda completa con paginazione DB, filtro ente ed esclusione ID per modifica, errori RLS/rete non nascosti; `lastAziendaSaveError`/messaggi chiari per collisioni e altri errori.
- `js/supabase_config.js`: `getAziendaDeleteImpact(id)` conta riferimenti prima di ogni DELETE in progetti, corsisti, rapporti storici, iscrizioni storiche, PDF storici, richieste organismi e verifiche di efficacia. Se presente almeno un riferimento o lettura non affidabile, blocca la cancellazione (senza cambiare i dati), con motivazione `lastAziendaDeleteError`.
- `js/utils.js`: `salvaAziendaDB()` visualizza il reale errore; `eliminaAzienda()` chiede conferma informata e non annuncia più cascata dei progetti. `apriPopupRelazioniAzienda()` legge direttamente azienda/progetti/corsisti filtrati per ID invece di scaricare interi archivi e usa timeout 15s/Riprova.
- `js/utils.js`: `openCorsistaFromAziendaPopup` naviga a Corsisti con ricerca globale per CF/nome, esclude filtri precedenti, attende rendering e apre il record anche se fuori dalle prime 20 righe (inclusi archiviati).
- `js/utils.js` e `js/modules/corsisti_ruolo_azienda.js`: inserimento rapido preserva la pagina da 20 in Anagrafica e mantiene full roster nei Progetti, che lo usano per iscrizioni.
- `tests/phase2_anagrafiche.test.cjs`: suite di regressione; riscontrata una prima asserzione troppo rigida sul formato degli errori Supabase, corretta (CI successiva verde).
- Report indipendente: `docs/FASE2_ANAGRAFICHE_INTEGRITA_2026-10-27.md` (interventi, limiti, collaudi necessari e prosecuzione prudente).

### Diagnosi dati
Verificato in sola lettura su Supabase SafetyManager `gblcedkfnasqlnrxupzx`: 45 aziende, 115 corsisti al momento del controllo; 0 gruppi PIVA duplicati tra aziende secondo la normalizzazione semplice, 1 gruppo CF duplicato tra corsisti. Non sono stati mostrati né modificati CF/nominativi nei report pubblicati. Non fondere automaticamente corsisti con duplicati perché potrebbero essere collegati a storico.

### Limiti espliciti
- Il database dispone già di trigger che previene collisioni fiscali. Non è stato creato un indice UNIQUE nuovo, dato lo storico e la necessità di considerare `ente_id` e formati IVA.
- La guardia eliminazione azienda è a livello applicativo; un'invariante irreversibile server-side richiede una successiva review del modello FK e autorizzazione prima di aggiungere un trigger.
- Mancano ancora test browser autentici desktop/mobile, su ambienti con database di prova realmente isolati. Non dichiarare completata tutta la Fase 2 prima della convalida dei flussi aziendali e dei collegamenti da pagina successiva.
- Fase 3 (stampe/archivio) NON avviata e SafetyTraining NON modificato.
