# SafetyManager — Handoff permanente

Aggiornato: 2026-10-17

## Regola di continuità
Questo file è il riferimento persistente per lo stato tecnico di SafetyManager. Dopo ogni modifica sostanziale va aggiornato insieme a `docs/SAFETYMANAGER_HANDOFF_LATEST.md`.

## Integrazione SafetyTraining — LIVE
Il ponte manuale SafetyManager → SafetyTraining è operativo in produzione in `js/modules/safetytraining_bridge.js` e usa `safetytraining.transfer` v1.2.

### Avvio / UI / payload
- direct load da `js/app.js`;
- pulsante globale + pulsante contestuale nella scheda Progetto;
- normalizzazione P.IVA/CF azienda e CF corsisti;
- export di azienda, progetto/corso, date/sede, rischi e iscritti;
- nessun documento, firma, dato sanitario, credenziale o dato contatto inventato.

### Regola storica
Se l'azienda corrente del corsista differisce dall'azienda del progetto, SafetyManager mostra warning e NON blocca. L'azienda del progetto rappresenta il contesto storico dell'iscrizione.

QA SafetyManager reale:
- 72 progetti con azienda + corso;
- 138 iscrizioni;
- 0 aziende senza P.IVA/CF;
- 0 corsisti senza CF;
- 0 CF duplicati nello stesso progetto;
- 40 mismatch azienda corrente/progetto gestiti come storico/warning.

## E2E SafetyManager → SafetyTraining
Il doppio import dello stesso payload v1.2 resta VERDE e idempotente: secondo import senza duplicati di company, learner, edition, enrollment o placeholder. Rollback QA pulito.

## Hardening storico lato SafetyTraining — CHIUSO
SafetyTraining ha ora migration `v21_023_preserve_current_company_training_history`.

Regola definitiva:
- `learners.company_id` = azienda corrente;
- l'azienda associata a un corso/iscrizione viene conservata in `learner_company_training_history`;
- importare un progetto SafetyManager storico non sovrascrive più l'azienda corrente di un learner già esistente.

Il nuovo `import_safetymanager_package(jsonb)`:
- preserva la company corrente preesistente;
- esegue l'import compatibile v1.x;
- registra la company del corso nello storico training;
- mantiene mapping esterni, dedupe e idempotenza.

QA reale transazionale:
- learner con current company `COMUNE DI SAN MARTINO VALLE CAUDINA`;
- progetto storico importato da `G. & G. AUTO SERVICE S.A.S. DI NATALE GAETANO & C.`;
- `preserved_current_company=1`;
- current company finale ancora Comune;
- storico training company correttamente G. & G. Auto Service;
- `training_company_history_rows=1`;
- rollback e 0 residui QA.

Quindi il precedente punto aperto “azienda storica che diventa corrente” è risolto.

## Dashboard amministrativa SafetyTraining
Nello stesso blocco è stato diagnosticato e corretto un problema di caricamento della console SafetyTraining.

Le query DB rispondono correttamente. La causa era frontend: `admin-backend-v21.js` usava un `MutationObserver` globale capace di generare refresh/richieste ricorsive mentre il DOM veniva aggiornato.

Fix SafetyTraining live:
- rimosso MutationObserver globale;
- refresh solo su eventi espliciti;
- guardia contro risposte stale;
- dashboard alimentata/fallback con una singola `admin_dashboard_summary()`;
- PWA aggiornata a `safety-training-v21-10`.

Produzione SafetyTraining funzionale:
- deployment `dpl_D4APzr14W8puJLePb4HDgiHKvrtP`
- commit `e74418900ec0cb5e19b12441e3ebe90839cb3ae0`
- READY / production.

## Produzione SafetyManager
Vercel:
- `dpl_2bAGCma5NeQVgv2L49rdhZ2yaZVm`
- commit `3cc579b80dbec9c1cc68e4158ce2c0c3fe592175`
- production / READY
- alias `safety-manager-ultimate-safety-manager.vercel.app`.

Smoke live SafetyManager:
- app.js direct-load bridge;
- bridge v1.2 con warning storico;
- PWA `safetymanager-pwa-v11`.

## PWA / check SafetyManager
- cache `safetymanager-pwa-v11`;
- bridge nella APP_SHELL;
- `npm run check` include syntax check bridge;
- il repo SafetyManager NON ha workflow GitHub Actions configurati, quindi non dichiarare CI automatica verde.

## Prossimo passo
Il bridge manuale è ora funzionalmente stabilizzato anche sul caso storico. Proseguire con l'E2E learner SafetyTraining: invito → delivery → Auth → verifica identità → claim → dashboard. Eventuale API server-to-server solo se servirà davvero; il JSON manuale resta il percorso più controllabile.
