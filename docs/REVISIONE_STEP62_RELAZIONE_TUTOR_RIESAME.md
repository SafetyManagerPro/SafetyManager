# SafetyManager ASR 2025 — Step 62

## Relazione finale Tutor e Riesame periodico/miglioramento

Data revisione: 29 luglio 2026.

## Obiettivo

Lo step 62 prosegue l’adeguamento ai modelli contenuti nel pacchetto `Formazione SSL.zip` e integra:

- Relazione finale del tutor per la singola edizione formativa;
- Scheda di riesame periodico e miglioramento;
- collegamento ai Progetti;
- inserimento nel Progetto Formativo e nel Fascicolo del Corso;
- stampa singola dal Centro Stampe;
- inserimento controllato nel PDF unico progetto;
- persistenza dei dati nella tabella Supabase `progetti`.

Il flusso resta informativo e non bloccante, in coerenza con la fase di test del gestionale.

## Modelli esaminati

Sono stati confrontati i modelli:

- `3.b-RELAZIONE-FINALE-TUTOR.docx`;
- `6_RELAZIONE-FINALE-TUTOR.docx`;
- `7_Relazione finale del tutor.docx`;
- `7-SCHEDA RIESAME.docx`.

La Relazione Tutor riprende i contenuti comuni dei modelli: dati del corso e del tutor, partecipanti, coerenza con fabbisogni e progetto, valutazione della docenza, frequenza, programma, partecipazione, spazi, strumenti, punti di forza, criticità e giudizio globale.

Il Riesame è gestito correttamente come attività periodica e non necessariamente successiva a ogni singola edizione. Le fonti possono comprendere gradimento, verifiche di apprendimento, osservazioni di docente e tutor, controllo del fascicolo e segnalazioni. Le azioni registrano area, criticità, fonte, intervento, tipologia, tempistica e responsabile.

## Modifiche funzionali

### Progetti

In Gestione Progetto è stato aggiunto un pannello chiuso e apribile:

`Relazione Tutor e Riesame periodico / Miglioramento`

Il pannello comprende:

- nome e ruolo del tutor;
- data relazione;
- valutazione docenza;
- regolarità della frequenza;
- rispetto di programma e tempi;
- partecipazione e interesse;
- spazi utilizzati;
- strumenti e mezzi;
- punti di forza;
- criticità;
- note e giudizio globale;
- stato e data del riesame;
- fonti analizzate;
- fino a tre azioni correttive/migliorative;
- raggiungimento obiettivi;
- necessità di azioni urgenti;
- proposta conclusiva;
- compilatore, ruolo e approvatore.

Sono disponibili i comandi di stampa rapida della Relazione Tutor e della Scheda Riesame.

### Cruscotto qualità corso

Il cruscotto include la nuova area `Tutor / riesame` con stato informativo:

- completo;
- in corso;
- da completare.

Il riesame può essere indicato come `Non applicabile alla singola edizione`. Nessun controllo blocca salvataggio o stampa.

### Progetto Formativo

Nella sezione Valutazione e Verifica è visualizzata la sintesi:

`Relazione tutor presente/da completare · Riesame: stato`

### Fascicolo del Corso

La checklist comprende:

- Relazione finale del tutor, se previsto;
- Scheda di riesame periodico e azioni di miglioramento, se applicabile.

La stampa singola del Fascicolo allega automaticamente:

- Analisi Fabbisogni;
- Scheda Rischi;
- test manuali e correttore;
- questionari/riepilogo/monitoraggio qualità;
- Relazione Tutor;
- Scheda Riesame.

### Centro Stampe

Sono stati aggiunti due documenti selezionabili:

- `Relazione Finale Tutor`;
- `Scheda Riesame e Miglioramento`.

Il PDF unico progetto inserisce una sola volta Relazione Tutor e Scheda Riesame, evitando la duplicazione causata dagli allegati automatici del Fascicolo.

## Nuovi moduli

- `js/modules/tutor_riesame.js`
- `modules/relazione_tutor.html`
- `modules/scheda_riesame.html`

## Database Supabase

Migration:

`supabase/migrations/2026-07-29_step62_relazione_tutor_riesame.sql`

La migration aggiunge 24 colonne alla tabella `progetti`, con controlli sui valori ammessi e sui campi JSON. Non attiva né modifica RLS o policy.

Prima dell’uso online dei nuovi campi, eseguire la migration nello staging Supabase.

## Collaudo e backup

Il modulo Collaudo Sistema è aggiornato allo step 62 e controlla:

- funzioni Tutor/Riesame;
- modulo JavaScript;
- modelli HTML;
- colonne Supabase principali dello step 62.

Il manifest del backup locale riporta la versione `ASR2025 step62`.

## Controlli eseguiti

- sintassi di tutti i 15 file JavaScript: OK;
- parsing HTML di index e moduli coinvolti: OK;
- corrispondenza tra 24 campi raccolti e 24 colonne SQL: OK;
- collegamenti Progetti, Centro Stampe, Fascicolo e PDF unico: OK;
- logica stato Tutor/Riesame, inclusa opzione non applicabile: OK;
- archivio ZIP e controllo CRC: OK.

## Nota operativa

La migration deve essere applicata prima di salvare i nuovi dati nel progetto Supabase online. In assenza delle colonne Step 62, il gestionale mostra un messaggio che invita ad applicare le migration Step 60/61/62.

