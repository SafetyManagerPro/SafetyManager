# SafetyManager — Ultimo blocco

Aggiornato: 2026-10-17
Stato: bridge SafetyTraining v1.2 completo nel sorgente `main`; produzione Vercel solo parzialmente aggiornata per limite giornaliero Hobby.

## Blocco completato nel sorgente: export completo verso SafetyTraining

È stato reso realmente operativo il bridge `js/modules/safetytraining_bridge.js`.

### Modifiche funzionali
- formato trasferimento `safetytraining.transfer` v1.2;
- caricamento diretto da `js/app.js` all'avvio;
- pulsante globale navbar + pulsante contestuale nella scheda Progetto;
- pre-selezione automatica del progetto quando si parte dalla scheda;
- normalizzazione P.IVA/CF azienda e CF corsisti coerente con SafetyTraining;
- validazione preventiva di azienda, corso, corsisti, identificativi fiscali e CF duplicati;
- inclusione di sede/indirizzo e contesto rischi già disponibili;
- nessun export di documenti, firme, dati sanitari o credenziali;
- nessuna email/telefono inventati: lo schema SafetyManager `corsisti` non li possiede.

### Correzione emersa dal QA
Il primo controllo considerava errore un corsista la cui azienda anagrafica corrente differiva dall'azienda del progetto. Il DB reale ha mostrato 40 iscrizioni di questo tipo: sono casi compatibili con cambio azienda nel tempo. La regola è stata corretta: warning, non blocco; l'azienda del progetto resta il contesto storico dell'iscrizione.

### QA DB in sola lettura
- 72 progetti con azienda e corso;
- 0 aziende senza P.IVA/CF;
- 138 iscrizioni controllate;
- 0 corsisti senza CF;
- 0 CF duplicati nello stesso progetto;
- 40 mismatch azienda corrente/progetto gestiti come storico.

### Build/PWA
- `npm run check` include il bridge;
- cache sorgente PWA `safetymanager-pwa-v11`;
- bridge nella APP_SHELL;
- nessun workflow GitHub Actions configurato sul repo SafetyManager: `actions/runs` restituisce 0. Non parlare quindi di CI automatica completata.

### Commit funzionali del blocco
- `cff8aea4945d216f26af5988db0635b8d7cf526d` — hardening bridge v1.2;
- `20976a470698e8d2bf2a86d3a35a4e34d3202a3f` — cache PWA v11;
- `bddb8106c61fc4384f4dd564f7c5ba6636395ebb` — syntax check bridge nel comando `npm run check`;
- `58ccfe9ac2e4a7972cd0a6c611ff97debbf71f12` — preserve historical company context;
- `6e3c7e14f6a103fd56e69728420d3669667c9ca6` — direct startup load.

## Compatibilità destinazione SafetyTraining
`apps/training/integration-import.js` accetta tutti i payload `1.x` e chiama `import_safetymanager_package()` + `sync_safetymanager_training_context()`. Il backend SafetyTraining ha già mapping idempotenti e dedupe CF/P.IVA. Nessuna modifica DB SafetyTraining necessaria per il formato v1.2.

## Produzione Vercel — stato reale
Progetto: `safety-manager-ultimate`.

Ultimo production verificato:
- deployment `dpl_8kpuPLosszeyf4jpsin7bVEK15ba`;
- `READY`;
- commit `cff8aea4945d216f26af5988db0635b8d7cf526d`.

Quindi è live soltanto il primo commit del blocco. NON risultano live/verificati i commit successivi con:
- warning storico al posto del blocco sui cambi azienda;
- PWA v11;
- caricamento diretto da `app.js`.

Tentato deployment production forzato dell'HEAD completo: Vercel ha risposto `402 payment_required`, codice `api-deployments-free-per-day`, perché il piano Hobby ha superato il limite giornaliero di deployment API (>100). Non modificare billing/piano automaticamente.

## Prossimo passo esatto
1. Appena il limite Vercel si libera o l'auto-deploy riparte, pubblicare l'HEAD corrente di `main`.
2. Smoke live di `js/app.js`, `js/modules/safetytraining_bridge.js` e `sw.js`.
3. Confermare `schema_version:'1.2'`, mismatch azienda come warning e cache `safetymanager-pwa-v11`.
4. Eseguire un export/import di prova SafetyManager → SafetyTraining e ripeterlo una seconda volta per confermare idempotenza/dedupe.
5. Aggiornare SEMPRE questo file e `docs/SAFETYMANAGER_HANDOFF.md` dopo la verifica.
