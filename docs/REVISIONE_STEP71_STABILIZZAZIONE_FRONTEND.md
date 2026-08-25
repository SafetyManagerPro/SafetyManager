# Step 71 — Stabilizzazione frontend e pulizia controllata

Data: 24 agosto 2026

## Obiettivo

Stabilizzare il frontend senza ripetere le modifiche invasive dei precedenti tentativi PWA/CSP e rimuovere soltanto file o frammenti dimostrabilmente inutilizzati.

## Interventi eseguiti

### 1. Service worker rimosso

Il precedente `sw.js` intercettava tutte le richieste ma non precaricava alcuna risorsa. Non offriva quindi un vero funzionamento offline e poteva lasciare al browser una versione non aggiornata dell'applicazione.

- eliminato `sw.js`;
- eliminata la registrazione automatica;
- eliminato il pulsante `Installa App`, che dipendeva dalla registrazione PWA;
- aggiunta in `js/app.js` la disinstallazione una tantum di eventuali service worker legacy già registrati sul dispositivo.

SafetyManager continua a funzionare normalmente come webapp online. Per i dati Supabase è comunque necessaria la connessione di rete.

### 2. Dipendenze CDN bloccate a versioni precise

Sono stati eliminati i riferimenti mobili `@latest`, `@2` e il Tailwind CDN senza versione.

- Tailwind browser CDN: `3.4.17`;
- Supabase JS UMD: `2.112.4`;
- Lucide UMD: `1.10.0`.

Anche l'HTML esportato dalle procedure usa la stessa versione di Tailwind.

Le altre dipendenze già presenti erano già bloccate a una versione precisa: PapaParse `5.4.1`, JSZip `3.10.1` e XLSX `0.18.5`.

### 3. Manifest senza risorse remote

Le icone Wikimedia remote sono state sostituite con `logocna.png` locale. L'orientamento non è più forzato in verticale ed è utilizzabile su smartphone, tablet e desktop.

### 4. Duplicazioni HTML corrette

In `modules/progetti.html` il pannello corsisti del popup era stato copiato quattro volte con gli stessi ID:

- `popup-corsisti-box`;
- `popup-corsisti-summary`;
- `popup-corsisti-list`.

Sono state eliminate le tre copie finite accidentalmente nei popup di aggiunta rapida. Ogni ID ora compare una sola volta.

### 5. File inutilizzati eliminati

- `sw.js`: eliminato perché inefficace e fonte di possibili problemi di aggiornamento;
- `modules/regdocenti.html`: eliminato dopo verifica automatica, perché non era richiamato da nessun flusso runtime.

Non sono stati eliminati gli altri moduli HTML: l'audit ha verificato che sono richiamati direttamente o dinamicamente dalla webapp, spesso come modelli di stampa. La precedente indicazione generica di “24 moduli mai caricati” non è confermata dal codice della versione 70.

## Controlli eseguiti

- sintassi verificata su 20 file JavaScript: nessun errore;
- 36 moduli HTML rimasti dopo la pulizia;
- nessun riferimento runtime a `sw.js`;
- nessun file `sw.js` nel pacchetto;
- nessuna dipendenza CDN con alias mobile tra quelle corrette;
- gli ID del pannello corsisti compaiono una sola volta ciascuno;
- verifica finale dell'archivio ZIP.

## Scelta rinviata

Il protocollo progressivo degli attestati richiede una funzione transazionale lato database e una migration dedicata. Non è stato improvvisato in questo step frontend: va realizzato e provato separatamente sul database di test.

## Nota di aggiornamento browser

Al primo avvio dopo il deploy può essere necessario ricaricare una volta la pagina. Lo script rimuove automaticamente il vecchio service worker registrato; dai caricamenti successivi il browser utilizza normalmente i file pubblicati dal server.
