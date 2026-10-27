# SafetyManager Pro — Fase 1: protocollo di stabilizzazione e collaudo
Data: 27 ottobre 2026
Ambito: solo SafetyManager Pro; SafetyTraining resta autonomo e invariato.

## Finalità
Stabilizzare il caricamento di Corsisti, Aziende e moduli; ridurre i cicli di osservazione DOM; prevenire il popup browser «Attendi» e gli spinner senza fine. Nessuna modifica a dati, attestati, policy database, RLS, backup e stampe.

## Interventi effettuati
1. Osservatori responsive: limitati gli eventi globali ai cambi di schermata e i render delle card ai dispositivi mobili. Coda per aggiornare le card senza ricalcolare l'intero DOM a ogni mutazione.
2. Letture corsisti: scadenza di 15 secondi per dipendenze e query (errori mostrati in pagina con «Riprova»), gestione risposte obsolete tramite requestId.
3. Letture aziende: stessa scadenza di 15 secondi, messaggio recuperabile e diagnostica dei tempi.
4. Caricamento moduli: timeout di 12 secondi sul fetch HTML con AbortController; protezione dai cambi di sezione concorrenti e pulsante «Riprova».
5. Script opzionali: limite di 12 secondi, recupero da errori, richiesta condivisa per lo stesso file.
6. Cache PWA: incremento identificativo cache v12 per invalidare le vecchie risorse dell'app sui dispositivi installati.
7. Test di regressione: `tests/phase1_stability.test.cjs`, comando `npm test`, controllo sintassi dei file fondamentali, GitHub Actions `.github/workflows/safetymanager-quality.yml`.

## Diagnostica locale
Il registro `window.safetyLoadStats` espone **solo** contatori, esiti e durata dell'ultimo caricamento per `corsisti` e `aziende`. Non registra nomi, codici fiscali, documenti o password; non invia telemetria a terzi. In caso di anomalie tecniche, consultare la console browser, senza incollare dati personali nei ticket.

## Validazioni automatiche
- GitHub Actions (workflow «SafetyManager quality checks»): su ogni push su main e PR, `npm run check` e `npm test`.
- Test unitari: sintassi di otto file critici, timeout di letture bloccate, fallback script opzionale, osservatori DOM, caricamento globale paginato Corsisti e Aziende, protezione navigazione, stampa libera/archivio invariati.
- Il workflow non scrive sul database e non necessita di credenziali Supabase.
- La pubblicazione Vercel automatica **non è attualmente subordinata al semaforo della CI**: una build READY non equivale a collaudo dei flussi autenticati.
- Non esiste ancora un ambiente di test browser e database completamente separato dalla produzione: non usare un'eventuale preview Vercel per scritture di prova fino a quando non avrà credenziali di database di test isolate.

## Checklist manuale di accettazione (da completare dall'amministratore)
- [ ] Desktop Safari/Chrome: aprire Corsisti, filtrare A e Z, cercare CF di un corsista in altra lettera, navigare pagine, modificare senza duplicare record.
- [ ] iPhone/iPad: apertura Corsisti e cambio pagina senza popup «Attendi», card leggibili e pulsanti funzionanti.
- [ ] Aziende: ricerca per denominazione e P.IVA di aziende fuori dalla pagina corrente, cambio lettere/pagine, modifica azienda.
- [ ] Progetti: dettaglio, riga evidenziata, apertura partecipanti e nomina senza ritardi anomali.
- [ ] Stampe: attestato, facsimile nomina, DPI; stampa libera funzionante indipendentemente dal completamento.
- [ ] Fascicolo Corsista: caricamento di un piccolo PDF di prova autorizzato, apertura del PDF archiviato e versione storica; archiviazione facoltativa OFF per default.
- [ ] Interruzione rete/connessione lenta: dopo massimo ~15 secondi di attesa DB visualizzazione di un messaggio d'errore e di «Riprova»; su moduli HTML circa 12 secondi.
- [ ] Riapertura dall'icona PWA: aggiornamento della versione e corretto ripristino della navigazione.
- [ ] Esportazione e backup: verificare backup/download senza alterare i dati.
- [ ] Verifica dei permessi amministratore e del caricamento dei PDF privati.

## Criteri di chiusura
La fase tecnica può essere considerata pubblicata dopo CI verde e Vercel READY. La **chiusura operativa** della stabilizzazione del popup «Attendi» richiede il collaudo reale su almeno un desktop e su un dispositivo mobile e la conferma dell'utente. Non procedere automaticamente alla fase 2 fino a nuova approvazione.

## Recupero
Se la nuova versione presenta regressioni, usare il ripristino a un precedente deployment READY Vercel o un revert del commit interessato. Non ripristinare un vecchio database: qui non sono state effettuate migrazioni o cancellazioni.
