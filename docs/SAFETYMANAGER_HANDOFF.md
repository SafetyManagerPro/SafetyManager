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
- corsista esportato con `full_name` unico, CF, mansione e riferimenti esterni;
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

## Hardening storico lato SafetyTraining — v21_023 CHIUSO
Regola definitiva:
- `learners.company_id` = azienda corrente;
- l'azienda associata a un corso/iscrizione viene conservata in `learner_company_training_history`;
- importare un progetto SafetyManager storico non sovrascrive l'azienda corrente di un learner già esistente.

Il wrapper `import_safetymanager_package(jsonb)` preserva la company corrente, registra la company del corso nello storico e mantiene mapping, dedupe e idempotenza.

QA reale transazionale precedente verde con current company `COMUNE DI SAN MARTINO VALLE CAUDINA`, progetto storico `G. & G. AUTO SERVICE S.A.S. DI NATALE GAETANO & C.`, `preserved_current_company=1`, `training_company_history_rows=1` e rollback senza residui.

## Compatibilità anagrafica downstream — SafetyTraining admin UX v21.4
SafetyTraining ora usa nella console un unico campo corsista `Cognome/Nome`, coerente con il `full_name` singolo del bridge SafetyManager.

Regole downstream:
- i vecchi record SafetyTraining con `first_name + last_name` vengono riuniti in visualizzazione;
- `metadata.source_full_name`, se presente, ha precedenza;
- il salvataggio manuale conserva un nome completo unico senza richiedere una migrazione distruttiva dello schema;
- CF tenant-scoped, mapping esterni, dedupe, storico azienda e payload v1.2 NON cambiano.

Non separare artificialmente il `full_name` SafetyManager in nome/cognome nel bridge: la sorgente non garantisce quella separazione.

## Readiness SafetyTraining v21_024
È stato corretto un falso `missing_test_definition`: il gate SafetyTraining usava il legacy metadata `bank_required` invece dei test attivi e delle domande attive collegate.

Stato dopo il fix:
- 92 record readiness totali;
- 65 pubblicati;
- 22 pronti per revisione;
- 2 da configurare;
- 3 bloccati, tutti frozen/fuori roadmap: Spazi confinati, RSPP/ASPP Modulo A e Modulo B comune.

Non cambiare il bridge SafetyManager per compensare la readiness: catalogo/mapping e governance didattica rimangono separati.

## Dashboard / admin SafetyTraining
Resta valido il fix v21.3:
- nessun MutationObserver globale;
- refresh solo su eventi espliciti;
- guardia contro risposte stale;
- dashboard via `admin_dashboard_summary()`.

Admin v21.4 aggiunge inoltre:
- creazione organizzazioni;
- vista completa aziende;
- `Cognome/Nome` unico corsista;
- disattivazione/archiviazione edizioni senza delete fisico;
- guide Catalogo/Blueprint/Readiness;
- responsive hardening per desktop/tablet/mobile.

## Produzione SafetyTraining collegata
- PWA `safety-training-v21-11`;
- commit funzionale più recente `87c077aa2d11bd29ade8a79a091c267975606b76`;
- deployment `dpl_8ardDTVN2hJ46Q2GEx9LNYzmT11V`;
- production / READY;
- checks SafetyTraining #292 e #293 SUCCESS.

## Produzione SafetyManager
Vercel:
- `dpl_2bAGCma5NeQVgv2L49rdhZ2yaZVm`;
- commit `3cc579b80dbec9c1cc68e4158ce2c0c3fe592175`;
- production / READY;
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
Nessuna modifica al bridge richiesta dal blocco v21.4. Proseguire lato SafetyTraining con smoke visuale admin desktop/tablet/mobile e poi E2E learner: invito → delivery → Auth → verifica identità → claim → dashboard. Eventuale API server-to-server solo se servirà davvero; il JSON manuale resta il percorso più controllabile.
