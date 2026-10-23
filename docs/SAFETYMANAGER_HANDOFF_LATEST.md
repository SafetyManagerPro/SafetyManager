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
