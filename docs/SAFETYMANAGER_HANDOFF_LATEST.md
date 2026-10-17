# SafetyManager — Ultimo blocco

Aggiornato: 2026-10-17
Stato: bridge SafetyTraining v1.2 LIVE e stabilizzato anche per progetti storici; SafetyTraining v21_023 preserva la company corrente e registra la company storica del training.

## Bridge SafetyManager — invariato e corretto
`js/modules/safetytraining_bridge.js` continua a produrre `safetytraining.transfer` v1.2 con:
- azienda + P.IVA/CF normalizzato;
- corso/progetto, date/sede, modalità e presenza;
- contesto rischi/fabbisogni;
- learner + enrollment external IDs + CF e mansione;
- nessun documento/firma/dato sanitario/credenziale;
- mismatch azienda corrente/progetto = warning storico, non blocco.

QA sorgente reale resta:
- 72 progetti con azienda/corso;
- 138 iscrizioni;
- 0 aziende senza P.IVA/CF;
- 0 learner senza CF;
- 0 CF duplicati nel progetto;
- 40 mismatch storici correttamente trattati come warning.

## SafetyTraining v21_023 — problema storico RISOLTO
Il problema emerso dopo l'E2E precedente era che l'importer SafetyTraining poteva assegnare al learner esistente l'azienda del progetto storico, confondendo datore storico e azienda corrente.

Soluzione live:
- `learners.company_id` resta l'azienda corrente;
- nuova `learner_company_training_history` conserva la company associata a ciascun enrollment/edizione;
- nuovo wrapper `import_safetymanager_package(jsonb)` preserva la company corrente dei learner già esistenti;
- il contesto azienda del corso viene scritto nello storico training;
- mapping e dedupe restano idempotenti;
- RPC admin `admin_learner_company_history()` espone current company + storico con authorization scoped.

QA transazionale reale:
- current company learner = `COMUNE DI SAN MARTINO VALLE CAUDINA`;
- progetto storico importato con `G. & G. AUTO SERVICE S.A.S. DI NATALE GAETANO & C.`;
- `preserved_current_company=1`;
- azienda corrente finale invariata;
- history company correttamente G. & G.;
- `training_company_history_rows=1`;
- rollback pulito, 0 residui.

Questo punto è CHIUSO.

## Dashboard amministrativa SafetyTraining
Nello stesso blocco è stato risolto il problema segnalato di console che sembrava non rispondere durante il caricamento.

Diagnosi:
- query DB dashboard tutte funzionanti sotto Auth/platform admin;
- causa frontend: MutationObserver globale in `admin-backend-v21.js` poteva generare refresh e RPC ricorsive mentre il DOM cambiava.

Fix live:
- nessun MutationObserver globale;
- refresh solo su azioni/eventi espliciti;
- `enhanceSeq` contro response stale;
- dashboard/fallback con una sola `admin_dashboard_summary()`;
- PWA SafetyTraining `safety-training-v21-10` per sostituire la cache del JS precedente.

SafetyTraining production:
- `dpl_D4APzr14W8puJLePb4HDgiHKvrtP`
- commit `e74418900ec0cb5e19b12441e3ebe90839cb3ae0`
- READY / production;
- checks GitHub #283 e #284 SUCCESS;
- `/admin-backend-v21.js` e `/sw.js` smoke HTTP 200.

## SafetyManager produzione
- deployment `dpl_2bAGCma5NeQVgv2L49rdhZ2yaZVm`
- commit `3cc579b80dbec9c1cc68e4158ce2c0c3fe592175`
- READY / production
- PWA `safetymanager-pwa-v11`.

Il repo SafetyManager non ha GitHub Actions configurati: non dichiarare CI automatica.

## Prossimo passo esatto
Bridge/import storico ora stabilizzati. Proseguire con E2E learner SafetyTraining: invito → delivery → Auth → verifica identità → claim → dashboard. Prima, se si opera dal browser/PWA già aperto, assicurarsi che sia entrata la cache SafetyTraining v21-10.
