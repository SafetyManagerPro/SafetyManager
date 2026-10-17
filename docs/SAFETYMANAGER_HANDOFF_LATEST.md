# SafetyManager — Ultimo blocco

Aggiornato: 2026-10-17
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
