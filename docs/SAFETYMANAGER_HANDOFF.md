# SafetyManager — Handoff permanente

Aggiornato: 2026-10-17

## Regola di continuità
Questo file è il riferimento persistente per lo stato tecnico di SafetyManager. Dopo ogni modifica sostanziale va aggiornato insieme a `docs/SAFETYMANAGER_HANDOFF_LATEST.md`.

## Integrazione SafetyTraining — LIVE
Il ponte manuale SafetyManager → SafetyTraining è operativo in produzione in `js/modules/safetytraining_bridge.js` e usa il formato `safetytraining.transfer` v1.2.

### Avvio e UI
- Il bridge viene caricato direttamente dal bootstrap `js/app.js`; non dipende dal loader grafico opzionale.
- Pulsante globale `SafetyTraining` nella navbar.
- Pulsante contestuale `SafetyTraining` nell'intestazione della scheda Progetto; apre il modal già posizionato sul progetto salvato.
- Un progetto non ancora salvato non può essere esportato.

### Dati sorgente
- Azienda: `aziende`.
- Corsisti: `corsisti`.
- Progetto/corso: `progetti`.
- Iscrizioni: `iscrizioni`.
- La tabella `corsisti` non contiene email o telefono: il bridge non inventa questi campi.

### Payload v1.2
Trasferisce:
- azienda: external_id, ragione sociale, P.IVA/CF normalizzato, ATECO, indirizzo/sede;
- progetto: external_id, codice, corso, durata, riferimento normativo, modalità, date, sede, componente pratica/presenza;
- contesto rischi: settore, codici rischio, rischi personalizzati, stato analisi fabbisogni;
- corsisti iscritti: external_id, enrollment_external_id, nome completo, CF normalizzato, mansione.

Non trasferisce documenti, firme, dati sanitari o credenziali.

### Regole anagrafiche
- P.IVA/CF azienda: uppercase, soli caratteri alfanumerici; prefisso `IT` rimosso quando seguito da 11 cifre.
- CF corsista: uppercase e soli caratteri alfanumerici.
- Export bloccato se mancano azienda/identificativo fiscale/corso/corsisti/CF, oppure se lo stesso CF compare due volte nello stesso progetto.
- Se il corsista oggi appartiene a un'azienda diversa da quella del progetto, il bridge mostra un warning ma NON blocca: per l'iscrizione vale il contesto storico dell'azienda del progetto.

### QA dati reali SafetyManager
Controllo in sola lettura 2026-10-17:
- 72 progetti con azienda + corso;
- 138 righe iscrizione;
- 0 aziende senza P.IVA/CF;
- 0 corsisti senza CF;
- 0 gruppi CF duplicati nello stesso progetto;
- 40 iscrizioni con azienda corrente del corsista diversa dall'azienda del progetto: casi storici, quindi warning.

## E2E SafetyManager → SafetyTraining — VERDE
Eseguito test transazionale su SafetyTraining con payload `safetytraining.transfer` v1.2 e rollback finale.

Primo import dello stesso pacchetto QA:
- `created_company=1`
- `created_learners=1`
- `created_edition=1`
- `created_enrollments=1`
- `created_placeholder_course=1`
- `reused_enrollments=0`
- course delivery `needs_configuration`, come previsto per course code sconosciuto.

Secondo import identico:
- stessi `company_id`, `course_id`, `edition_id`;
- `created_company=0`
- `created_learners=0`
- `created_edition=0`
- `created_enrollments=0`
- `created_placeholder_course=0`
- `reused_enrollments=1`
- `updated_or_reused_learners=1`.

Quindi mapping e dedupe sono idempotenti. Dopo `ROLLBACK`, verifica separata: 0 mapping QA, 0 aziende QA, 0 learner QA, 0 righe catalogo QA.

## PWA / check
- cache PWA live: `safetymanager-pwa-v11`;
- `js/modules/safetytraining_bridge.js` è nella APP_SHELL;
- `npm run check` include `node --check js/modules/safetytraining_bridge.js`;
- il repository SafetyManager non ha workflow GitHub Actions configurati (`actions/runs` = 0): non dichiarare CI automatica verde.

## Compatibilità SafetyTraining
SafetyTraining accetta tutte le versioni `1.x` del formato tramite `import_safetymanager_package(jsonb)` con mapping esterni idempotenti, dedupe CF/P.IVA e placeholder draft per course code sconosciuti. Nessuna migration SafetyTraining è stata necessaria per il payload v1.2.

## Produzione Vercel — COMPLETAMENTE ALLINEATA
Progetto: `safety-manager-ultimate` (`prj_kt0816jMHpCirQx2ZAUB1vn99yqS`).

Deployment verificato:
- `dpl_2bAGCma5NeQVgv2L49rdhZ2yaZVm`
- commit `3cc579b80dbec9c1cc68e4158ce2c0c3fe592175`
- target production
- stato `READY`
- alias `safety-manager-ultimate-safety-manager.vercel.app`.

Smoke live HTTP 200:
- `/js/app.js` carica direttamente `js/modules/safetytraining_bridge.js`;
- `/js/modules/safetytraining_bridge.js` è v1.2 e tratta cambio azienda corrente/progetto come warning storico;
- `/sw.js` serve `safetymanager-pwa-v11` e include il bridge nella APP_SHELL.

Il precedente blocco `api-deployments-free-per-day` del piano Hobby non è più attivo per questo deployment.

## Prossimo blocco consigliato
1. Prima di automatizzare ulteriormente il ponte, valutare l'hardening del caso learner già esistente in SafetyTraining con azienda corrente diversa: l'importer SafetyManager oggi riallinea `learners.company_id` all'azienda del progetto; con progetti storici questo può confondere azienda corrente e storica.
2. Proseguire poi con E2E learner SafetyTraining: invito → delivery → Auth → verifica identità → claim → dashboard.
3. Eventuale invio server-to-server firmato/API solo se serve davvero; il JSON manuale resta il percorso più semplice e controllabile.
