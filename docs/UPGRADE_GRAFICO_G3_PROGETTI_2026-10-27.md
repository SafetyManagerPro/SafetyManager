# SafetyManager Pro — Upgrade grafico G3 Progetti (27 ottobre 2026)

## Autorizzazione
L'utente ha dichiarato che G1+G2 «funziona» e ha chiesto «prosegui». Questo costituisce collaudo manuale dichiarato di G1/G2. Non equivale a una certificazione test E2E/browser di ogni funzione e non autorizza interventi sui dati. G3 è limitato all'interfaccia Progetti.

## Stato preintervento
`modules/progetti.html` contiene già un form completo `#form-progetto`, una colonna laterale `#progetto-form-col`, popup di modifica `openProjectEditPopup`, tab `dati/corsisti`, validazione e salvataggio `salvaProgettoDB`, oltre a filtri globali testo/corso/azienda e gestioni iscritti. Duplicare questi moduli in un secondo wizard sarebbe pericoloso per i dati.

## Modifiche di questo blocco
- **Nuovo layer progressivo** `js/modules/graphic_upgrade_g3_progetti.js`, caricato dopo G1/G2 da `index.html`. In caso di mancato caricamento, il gestionale continua con i form e i popup attuali.
- **Barra Progetti** nel contenuto: `Nuovo progetto` richiama esclusivamente `resetFormProgetto()` e chiede prima conferma quando il modulo è già compilato/modificato; `Amplia elenco / Mostra modulo` libera la colonna sinistra senza impedire l'apertura del popup di modifica legacy.
- **Filtri stato** `Tutti`, `In lavorazione`, `Da chiudere`, `Chiusi`: aggiunti *a valle* dei filtri testo, corso e azienda già esistenti. Operano solo sulle righe/card con `data-project-id` e sull'array `progettiList` già disponibile: **nessuna query supplementare**. Contatori esplicitamente riferiti ai «progetti caricati».
- **Guida ai cinque blocchi del form**: link di scorrimento per Azienda/Corso, Date/Sede, Docenti, Corsisti e Chiusura. Apre solo i `<details>` necessari; nel popup di modifica esistente il pulsante Corsisti richiama la tab Corsisti originale. Non cambia obbligatorietà, struttura, firme, esiti o procedura di completamento.
- **CSS** mirato al modulo Progetti, con comandi touch, focus visibile, popup precedente intatto, `prefers-reduced-motion` e `@media print` che nasconde i nuovi controlli.
- `tests/graphic_g3_progetti.test.cjs`: esecuzione JS con mock document/window per conteggi, combinazione filtri, annullamento modifica, riapertura modulo, link guide e invarianti form.
- Questo blocco G3 è una prima versione prudente di usabilità guidata, **non** un nuovo motore wizard con salvataggio per step.

## Dati e infrastruttura
Nessuna migrazione DB, INSERT/UPDATE/DELETE nuovi, modifica PDF, firme, attestati, RLS, proprietà Storage, stato progetto o SafetyTraining. Rimane pendente l'eventuale migrazione FK azienda-progetti review-only già documentata.

## Collaudo utente consigliato
1. Aprire Progetti: verificare il nuovo pulsante e gli indicatori numerici.
2. Usare `Amplia elenco`, scegliere progetto esistente, aprire il popup, verificare che compaia sopra l'elenco.
3. Combinare ricerca testuale, tipo corso e azienda con i nuovi filtri stato. Ritornare a `Tutti`.
4. Aprire una modifica, scegliere `Corsisti` dalla guida e verificare che si apra la sezione nativa.
5. Compilare campi senza salvare, premere `Nuovo progetto`, provare prima `Annulla` e poi confermare.
6. Provare su desktop e mobile; non è necessario alterare dati storici per il test visivo.

## Limiti
I conteggi si riferiscono a `window.progettiList` effettivamente caricati, senza analisi aggregata DB. I test automatici non simulano un browser Safari reale o credenziali admin, né attestano completezza formativa.

## Rifinitura G3 «Popup-only» — 27/10/2026

**Richiesta e approvazione:** l'utente ha confermato che il popup funziona, ma che il pannello laterale «Gestione Progetto» è ridondante; ha approvato di rimuoverlo dalla vista ordinaria e usare popup anche per `Nuovo progetto`.

### Modifiche
- `js/modules/graphic_upgrade_g3_progetti.js`: la classe `safety-g3-collapsed` è attivata automaticamente quando apre la pagina Progetti; la colonna form non viene rimossa dal DOM né clonata, ma è nascosta quando non ha la classe `fixed`. L'elenco occupa tutta la larghezza disponibile.
- Rimossa dalla barra l'azione `Amplia elenco / Mostra modulo`: non serve più perché il flusso deve essere **solo popup**.
- `Nuovo progetto` ora usa il `#form-progetto` esistente: invoca `resetFormProgetto()`, applica esattamente le classi del popup legacy al contenitore e alla card, ripristinabili da `chiudiPopupProgetto()`, mostra il titolo e il tasto X e imposta `projectEditOpenedAsPopup=true`, indispensabile perché `salvaProgettoDB()` chiuda il popup dopo un salvataggio riuscito.
- Nessuna seconda implementazione per la persistenza, nessun nuovo HTML con ID duplicati, nessuna API aggiuntiva.
- Un piccolo wrapper conserva la richiesta di conferma se si abbandonano dati immessi nel **nuovo** popup (X o navigazione); segue il reset originale dopo salvataggio per evitare avvisi spuri e duplicazioni.
- Il popup modifica esistente rimane gestito dalle sue funzioni legacy, senza cambi di validazione, tab iscritti, qualità e storici.
- Aggiornato in `index.html` il query-string cache-busting dello script G3.

### Prove automatiche aggiunte
`tests/graphic_g3_progetti.test.cjs` ora copre popup Nuovo, ripristino classi, presenza dell'identico form, conferme scarto, chiusura simulata da salvataggio originale, nessuna interferenza con modifica legacy, passaggio ad altra sezione, sidebar invisibile all'avvio. Restano da eseguire collaudo browser autenticato desktop/mobile, e prova del vero salvataggio tramite UI da amministratore.

### Vincoli
Nessuna modifica schema/dati Supabase, documenti, PDF, permessi, firme o SafetyTraining. Non riaprire il lavoro sull'archivio PDF ora sospeso.
