# SafetyManager — Ultimo blocco

Aggiornato: 2026-10-21
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
- deployment `dpl_2bAGCma5NeQVgv2L49rdhZ2yaZVm`;
- commit `3cc579b80dbec9c1cc68e4158ce2c0c3fe592175`;
- READY / production;
- PWA `safetymanager-pwa-v11`.

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
