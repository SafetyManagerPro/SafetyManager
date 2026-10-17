# SafetyManager — Ultimo blocco

Aggiornato: 2026-10-17

## Blocco completato: export completo verso SafetyTraining

È stato reso realmente operativo il bridge `js/modules/safetytraining_bridge.js`.

### Modifiche funzionali
- formato trasferimento portato a `safetytraining.transfer` v1.2;
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
- `npm run check` ora include il bridge;
- cache PWA aggiornata a `safetymanager-pwa-v11`;
- bridge già presente nella APP_SHELL.

### Commit funzionali del blocco
- `cff8aea4945d216f26af5988db0635b8d7cf526d` — hardening bridge v1.2;
- `20976a470698e8d2bf2a86d3a35a4e34d3202a3f` — cache PWA v11;
- `bddb8106c61fc4384f4dd564f7c5ba6636395ebb` — syntax check CI;
- `58ccfe9ac2e4a7972cd0a6c611ff97debbf71f12` — preserve historical company context;
- `6e3c7e14f6a103fd56e69728420d3669667c9ca6` — direct startup load.

## Da fare dopo questo blocco
1. Verificare GitHub Actions sul nuovo HEAD.
2. Verificare deploy Vercel e asset live (`app.js`, bridge v1.2, `sw.js` v11).
3. Aggiornare i due handoff SafetyTraining con la nuova sorgente v1.2.
