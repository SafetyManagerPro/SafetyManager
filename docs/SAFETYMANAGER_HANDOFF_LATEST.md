# SafetyManager — Ultimo blocco

Aggiornato: 2026-10-17
Stato: bridge SafetyTraining v1.2 LIVE in produzione; E2E doppio import idempotente VERDE con rollback pulito.

## Blocco chiuso: SafetyManager → SafetyTraining

### Sorgente / UI
`js/modules/safetytraining_bridge.js`:
- formato `safetytraining.transfer` v1.2;
- direct load da `js/app.js`;
- pulsante globale navbar + pulsante contestuale nella scheda Progetto;
- progetto pre-selezionato dal popup;
- progetto non salvato non esportabile;
- normalizzazione P.IVA/CF azienda e CF corsisti;
- blocco su identificativi mancanti e CF duplicati nel progetto;
- cambio azienda corrente rispetto all'azienda storica del progetto = warning, non blocco;
- esporta azienda, corso/progetto, date/sede, rischi e corsisti iscritti;
- non esporta documenti, firme, dati sanitari o credenziali;
- non inventa email/telefono non presenti nello schema SafetyManager.

### QA SafetyManager reale in sola lettura
- 72 progetti con azienda e corso;
- 138 iscrizioni;
- 0 aziende senza P.IVA/CF;
- 0 corsisti senza CF;
- 0 CF duplicati nello stesso progetto;
- 40 mismatch azienda corrente/progetto correttamente gestiti come storico/warning.

## E2E import SafetyTraining
Payload QA v1.2 importato due volte dentro una transazione SafetyTraining.

Primo import:
- azienda 1 creata
- learner 1 creato
- edizione 1 creata
- enrollment 1 creato
- placeholder corso 1 creato
- delivery `needs_configuration`.

Secondo import identico:
- stessa company/course/edition
- 0 nuove aziende
- 0 nuovi learner
- 0 nuove edizioni
- 0 nuovi enrollment
- 0 nuovi placeholder
- 1 enrollment riusato
- 1 learner aggiornato/riusato.

Conclusione: idempotenza e dedupe verificati. Rollback finale; controllo separato post-rollback = 0 mapping QA, 0 aziende QA, 0 learner QA, 0 catalog rows QA.

## Produzione Vercel
Deployment completo:
- `dpl_2bAGCma5NeQVgv2L49rdhZ2yaZVm`
- commit `3cc579b80dbec9c1cc68e4158ce2c0c3fe592175`
- production / `READY`
- alias `safety-manager-ultimate-safety-manager.vercel.app`.

Smoke live:
- `app.js` HTTP 200 e direct-load del bridge;
- bridge HTTP 200, v1.2, warning storico presente;
- `sw.js` HTTP 200, cache `safetymanager-pwa-v11`, bridge in APP_SHELL.

Il precedente limite Vercel Hobby non blocca più questo deployment.

## Check / CI
- `npm run check` include il bridge.
- Il repo SafetyManager NON ha workflow GitHub Actions configurati; non dichiarare CI automatica.

## Compatibilità SafetyTraining
`import_safetymanager_package(jsonb)` accetta `1.x`; mapping company/learner/project/enrollment sono idempotenti. Course code sconosciuto genera correttamente un placeholder draft `needs_configuration`. Nessuna migration SafetyTraining necessaria per v1.2.

## Prossimo punto tecnico da affrontare
L'importer SafetyManager, quando trova un learner esistente, oggi imposta `learners.company_id` all'azienda del progetto importato. Con progetti storici questo può trasformare un datore storico nel datore corrente. Prima di automatizzare ulteriormente il bridge, valutare una correzione che preservi la company corrente o introduca uno storico formale learner↔azienda.

Dopo questo hardening, tornare all'E2E learner SafetyTraining: invito → delivery → Auth → verifica identità → claim → dashboard.
