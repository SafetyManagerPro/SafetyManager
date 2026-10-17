# SafetyManager — Handoff permanente

Aggiornato: 2026-10-17

## Regola di continuità
Questo file è il riferimento persistente per lo stato tecnico di SafetyManager. Dopo ogni modifica sostanziale va aggiornato insieme a `docs/SAFETYMANAGER_HANDOFF_LATEST.md`.

## Integrazione SafetyTraining
Il ponte manuale SafetyManager → SafetyTraining è operativo in `js/modules/safetytraining_bridge.js` e usa il formato `safetytraining.transfer` v1.2.

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

## PWA / CI
- cache PWA: `safetymanager-pwa-v11`;
- `js/modules/safetytraining_bridge.js` è nella APP_SHELL;
- `npm run check` include ora `node --check js/modules/safetytraining_bridge.js`.

## Compatibilità SafetyTraining
SafetyTraining accetta tutte le versioni `1.x` del formato e importa il pacchetto tramite `import_safetymanager_package`, con mapping idempotenti e dedupe CF/P.IVA lato DB.

## Prossimo blocco consigliato
Dopo stabilizzazione del trasferimento manuale: valutare un invio server-to-server firmato/API solo se serve davvero. Il JSON manuale resta il percorso più semplice e sicuro per ora.
