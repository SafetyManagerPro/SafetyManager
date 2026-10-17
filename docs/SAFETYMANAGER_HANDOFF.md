# SafetyManager — Handoff permanente

Aggiornato: 2026-10-17

## Regola di continuità
Questo file è il riferimento persistente per lo stato tecnico di SafetyManager. Dopo ogni modifica sostanziale va aggiornato insieme a `docs/SAFETYMANAGER_HANDOFF_LATEST.md`.

## Integrazione SafetyTraining
Il ponte manuale SafetyManager → SafetyTraining è completo nel sorgente `main` in `js/modules/safetytraining_bridge.js` e usa il formato `safetytraining.transfer` v1.2.

### Avvio e UI
- Il bridge viene caricato direttamente dal bootstrap `js/app.js`; non dipende più dal caricamento indiretto di `soft_ui_theme.js`.
- Pulsante globale `SafetyTraining` nella navbar.
- Pulsante contestuale `SafetyTraining` nell'intestazione della scheda Progetto; apre il modal già posizionato sul progetto salvato.
- Un progetto non ancora salvato non può essere esportato.

### Dati sorgente
- Azienda: `aziende`.
- Corsisti: `corsisti`.
- Progetto/corso: `progetti`.
- Iscrizioni: `iscrizioni`.
- La tabella `corsisti` attuale non contiene email o telefono: il bridge non inventa questi campi.

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
- Se il corsista oggi appartiene a un'azienda diversa da quella del progetto, il bridge mostra un avviso ma NON blocca: per l'iscrizione vale il contesto storico dell'azienda del progetto.

### QA dati reali 2026-10-17
Controllo in sola lettura sul DB SafetyManager:
- 72 progetti con azienda + corso;
- 0 aziende senza P.IVA/CF tra questi progetti;
- 138 righe iscrizione controllate;
- 0 corsisti senza CF;
- 0 gruppi CF duplicati nello stesso progetto;
- 40 iscrizioni con azienda corrente del corsista diversa dall'azienda del progetto: trattate correttamente come caso storico, quindi solo warning.

## PWA / check
- cache sorgente PWA: `safetymanager-pwa-v11`;
- `js/modules/safetytraining_bridge.js` è nella APP_SHELL;
- `npm run check` include `node --check js/modules/safetytraining_bridge.js`;
- il repository SafetyManager non ha workflow GitHub Actions configurati (`actions/runs` = 0), quindi non dichiarare CI automatica verde.

## Compatibilità SafetyTraining
SafetyTraining accetta tutte le versioni `1.x` del formato e importa il pacchetto tramite `import_safetymanager_package`, con mapping idempotenti e dedupe CF/P.IVA lato DB. Nessuna migration SafetyTraining è necessaria per accettare il payload v1.2.

## Stato produzione Vercel — IMPORTANTE
Progetto Vercel: `safety-manager-ultimate` (`prj_kt0816jMHpCirQx2ZAUB1vn99yqS`).

Ultimo deployment production verificato:
- deployment `dpl_8kpuPLosszeyf4jpsin7bVEK15ba`;
- stato `READY`;
- commit `cff8aea4945d216f26af5988db0635b8d7cf526d` (`Harden SafetyTraining project export bridge`).

Questo deployment contiene il primo hardening v1.2 ma NON ancora tutte le modifiche successive del blocco. In particolare il sorgente `main` successivo contiene anche:
- `58ccfe9ac2e4a7972cd0a6c611ff97debbf71f12` — mismatch azienda corrente/progetto trasformato da errore a warning storico;
- `20976a470698e8d2bf2a86d3a35a4e34d3202a3f` — PWA v11;
- `bddb8106c61fc4384f4dd564f7c5ba6636395ebb` — check sintassi bridge;
- `6e3c7e14f6a103fd56e69728420d3669667c9ca6` — caricamento diretto del bridge all'avvio.

È stato tentato un deployment production forzato del `main` completo, ma Vercel ha risposto `402 payment_required`, codice `api-deployments-free-per-day`: limite giornaliero del piano Hobby superato (>100 deployment). NON dichiarare quindi il blocco completo live finché non viene pubblicato e smoke-verificato.

## Prossimo passo esatto
Quando il limite Vercel consente nuove deployment o l'auto-deploy riparte:
1. pubblicare l'HEAD corrente di `main` su `safety-manager-ultimate`;
2. verificare live che `js/app.js` carichi direttamente `js/modules/safetytraining_bridge.js`;
3. verificare live bridge `schema_version:'1.2'` e warning storico per cambio azienda;
4. verificare live `sw.js` con `safetymanager-pwa-v11`;
5. eseguire un export JSON di prova e importarlo in SafetyTraining, controllando idempotenza/dedupe senza alterare dati reali non necessari.

Dopo stabilizzazione del trasferimento manuale si potrà valutare un invio server-to-server firmato/API solo se serve davvero. Il JSON manuale resta il percorso più semplice e sicuro per ora.
