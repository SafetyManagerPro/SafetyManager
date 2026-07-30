# SafetyManager ASR 2025 — Step 63

## Test di comprensione della lingua italiana

Data revisione: 29 luglio 2026.

## Obiettivo

Lo step 63 prosegue l’adeguamento ai modelli contenuti nel pacchetto `Formazione SSL.zip` e integra la verifica preliminare della comprensione della lingua italiana per i corsisti interessati.

Il flusso resta informativo e non bloccante, in coerenza con l’attuale fase di test del gestionale.

## Modello esaminato

È stato analizzato il modello:

`9-TEST DI COMPRENSIONE DELLA LINGUA ITALIANA.docx`

L’integrazione riprende la struttura operativa del documento fornito:

- Parte 1: associazione di immagini e verbi, 10 quesiti;
- Parte 2: comprensione di un testo, 10 quesiti vero/falso;
- Parte 3: comprensione di segnali e frasi di sicurezza, 10 quesiti;
- correttore interno per il valutatore;
- esito distinto per ciascuna parte;
- dichiarazione del datore di lavoro;
- firma del corsista e del valutatore.

Secondo il modello fornito, il superamento richiede almeno 6 risposte corrette su 10 in ciascuna delle tre parti. Un totale complessivo sufficiente non compensa una parte inferiore a 6/10.

## Modifiche funzionali

### Anagrafica Corsisti

È stata aggiunta una sezione chiusa e apribile:

`Comprensione lingua italiana`

La sezione permette di registrare:

- cittadinanza;
- eventuali studi scolastici svolti in Italia;
- stato della verifica;
- data del test;
- punteggio delle tre parti;
- valutatore;
- dichiarazione del datore di lavoro;
- link o percorso locale/NAS della scansione cartacea;
- note.

Gli stati disponibili sono:

- Non richiesto;
- Da valutare;
- Da somministrare;
- Somministrato / da correggere;
- Superato / ammesso;
- Non superato / non ammesso.

Il gestionale calcola l’esito applicando la soglia di 6/10 a ciascuna parte. Il controllo non blocca il salvataggio.

Nel Database Corsisti è stata aggiunta la colonna `Lingua`, con stato e collegamento rapido alla stampa del test.

### Progetti e cruscotto qualità

Nei corsisti mostrati sotto ciascun Progetto Attivo compare lo stato della verifica linguistica quando applicabile.

Il Cruscotto qualità corso include l’area:

`Comprensione lingua italiana`

Il controllo segnala in modo non bloccante:

- corsisti interessati;
- test da completare;
- test superati;
- test non superati.

L’azione porta alla gestione dei corsisti del progetto.

### Progetto Formativo

Nella sezione Analisi dei Fabbisogni viene riportata anche la modalità prevista per la gestione della comprensione linguistica.

### Fascicolo del Corso

La checklist comprende:

- test di comprensione della lingua italiana per i corsisti interessati;
- risultato e dichiarazioni collegate;
- link alla scansione cartacea, se registrato.

La stampa singola del Fascicolo allega automaticamente i test dei corsisti interessati e un correttore interno.

### Centro Stampe

È stato aggiunto il documento:

`Test Comprensione Lingua Italiana`

La stampa produce:

- quattro pagine per ciascun corsista selezionato: tre parti del test e pagina esito/dichiarazioni;
- un correttore unico per il valutatore;
- immagini e segnali già inclusi nel progetto, senza dipendenze da risorse online.

Quando il test viene aperto direttamente dal Centro Stampe e nessun corsista è ancora marcato come interessato, l’anteprima può essere generata per gli iscritti al progetto selezionato, così da consentire la preparazione cartacea.

### PDF unico progetto

Il PDF unico progetto integra, dopo il Progetto Formativo:

- i test di comprensione linguistica dei soli corsisti contrassegnati come interessati;
- un correttore unico.

Gli allegati non vengono duplicati nella successiva sezione Fascicolo.

## Nuovi file

- `js/modules/lingua_italiana.js`
- `modules/test_lingua_italiana.html`
- `assets/test_lingua/parte1_verbi.png`
- `assets/test_lingua/segnale_accesso.jpeg`
- `assets/test_lingua/segnale_alta_tensione.png`
- `assets/test_lingua/segnale_sinistra.png`
- `assets/test_lingua/segnale_guanti.png`
- `assets/test_lingua/segnale_carichi.jpeg`
- `supabase/migrations/2026-07-29_step63_test_lingua_italiana.sql`
- `docs/REVISIONE_STEP63_TEST_LINGUA_ITALIANA.md`
- `docs/REPORT_STEP63_TEST_LINGUA_ITALIANA.json`

## Database Supabase

La migration aggiunge 11 colonne alla tabella `public.corsisti`, con:

- vincolo sui valori ammessi per lo stato;
- vincolo dei punteggi tra 0 e 10;
- indice sullo stato della verifica.

Non vengono attivate o modificate RLS e policy.

Il campo del documento conserva esclusivamente un link o percorso testuale. La funzione non carica automaticamente file sul server.

La gestione del salvataggio è compatibile anche con database sui quali le migration Step 47 e Step 63 non sono ancora applicate: il corsista viene salvato senza i campi mancanti e viene mostrato l’avviso operativo.

## Collaudo e backup

Il modulo Collaudo Sistema è aggiornato allo step 63 e controlla:

- funzioni del test lingua;
- modulo JavaScript;
- modello HTML;
- colonne Supabase dello step 63.

Il manifest del backup locale riporta la versione `ASR2025 step63`.

## Controlli eseguiti

- sintassi di tutti i 17 file JavaScript: OK;
- corrispondenza tra 11 campi gestiti e 11 colonne SQL: OK;
- presenza dei 13 elementi del form: OK;
- logica esito 6/10 per ciascuna parte: OK;
- modello di stampa: 4 pagine corsista + 1 correttore: OK;
- sei risorse grafiche locali presenti e leggibili: OK;
- caricamento reale del Centro Stampe nel browser: OK;
- anteprima reale: 4 pagine corsista, 1 correttore, 6 immagini senza errori: OK;
- integrazione Progetti, Progetto Formativo, Fascicolo e PDF unico: OK;
- archivio ZIP e controllo CRC: OK.

## Nota operativa

Prima di registrare online cittadinanza, esito e punteggi, applicare:

`supabase/migrations/2026-07-29_step63_test_lingua_italiana.sql`

La valutazione automatica costituisce un supporto operativo basato sul modello fornito e non sostituisce la valutazione del soggetto formatore o del valutatore.
