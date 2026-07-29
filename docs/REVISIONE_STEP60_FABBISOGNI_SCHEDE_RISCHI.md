# Step 60 — Analisi Fabbisogni Formativi e Schede Rischi per settore

## Obiettivo

Lo Step 60 avvia la prima priorità emersa dall'analisi del pacchetto `Formazione SSL.zip`:

- rendere operativa l'Analisi dei Fabbisogni Formativi;
- collegare al progetto una Scheda Rischi coerente con settore, ATECO, mansioni e DVR;
- integrare i nuovi documenti con Progetti, Progetto Formativo, Fascicolo del Corso, Centro Stampe e PDF unico.

La gestione è volutamente **non bloccante**: i progetti esistenti continuano a essere utilizzabili e il cruscotto segnala soltanto ciò che va completato.

## Modulo Progetti

In `Gestione Progetto` è stata aggiunta una sezione richiudibile:

`Analisi fabbisogni formativi e scheda rischi`

La sezione comprende:

- data dell'analisi;
- unità locale e attività/reparto interessato;
- fonti usate: DVR, sopralluoghi, riunioni, infortuni/near miss, formazione pregressa e segnalazioni;
- esigenza formativa rilevata;
- ruolo/mansione interessata;
- competenze in ingresso;
- competenze richieste;
- gap da colmare;
- verifica della comprensione della lingua italiana;
- note conclusive e accettazione aziendale;
- settore di rischio;
- rischi selezionati e rischi personalizzati ricavati dal DVR.

Il settore viene suggerito in base al codice ATECO e alla ragione sociale/attività dell'azienda. La scelta manuale dell'operatore rimane prevalente.

## Schede Rischi

È stato creato un catalogo operativo con 8 voci e 75 rischi complessivi:

1. uffici e attività amministrative;
2. estetica;
3. acconciatura;
4. orafi e lavorazione metalli preziosi;
5. tessile e confezioni;
6. pelletteria e lavorazione pelle;
7. alloggio e ristorazione;
8. altro settore / scheda personalizzata.

Le schede riprendono i contenuti dei modelli forniti nel pacchetto di riferimento. Restano una sintesi da verificare e integrare con:

- DVR aziendale;
- mansioni effettive;
- macchine e attrezzature;
- sostanze e processi;
- procedure;
- misure di prevenzione/protezione e DPI realmente adottati.

## Nuove stampe

Sono stati aggiunti:

- `modules/analisi_fabbisogni.html` — due pagine A4 verticali;
- `modules/scheda_rischi_settore.html` — una pagina A4 orizzontale.

L'Analisi Fabbisogni riporta:

- dati azienda e progetto;
- fonti ed esigenze;
- ruolo e comprensione linguistica;
- competenze possedute/richieste e gap;
- corsisti collegati al progetto;
- sintesi dei rischi;
- note e firme per accettazione.

La Scheda Rischi riporta:

- settore e ATECO;
- progetto, corso e azienda;
- rischio;
- esposizione/descrizione;
- possibili danni;
- comportamento sicuro;
- misure di prevenzione e protezione;
- unità locale, attività e referente.

## Integrazione documentale

### Progetto Formativo

La sezione fabbisogni del Progetto Formativo ora usa i dati salvati nel progetto e riporta:

- sintesi dell'analisi;
- fonti;
- esigenze;
- settore e rischi collegati;
- ATECO e modalità del corso.

Alla stampa del Progetto Formativo vengono allegati:

1. Analisi Fabbisogni;
2. Scheda Rischi;
3. test manuali e correttore già previsti.

### Fascicolo del Corso

La checklist del fascicolo include:

- Analisi Fabbisogni e accettazione;
- Scheda Rischi verificata rispetto al DVR.

È stata aggiunta una sintesi dei fabbisogni/rischi e sono stati compattati gli spazi per mantenere il documento entro la pagina A4.

Alla stampa singola del Fascicolo vengono allegati:

1. Analisi Fabbisogni;
2. Scheda Rischi;
3. test manuali dei corsisti;
4. correttore.

### Centro Stampe

Sono disponibili due nuovi comandi:

- `Analisi Fabbisogni Formativi`;
- `Scheda Rischi per Settore`.

Nel `PDF unico progetto + test/correttori` i nuovi allegati vengono inseriti una sola volta, subito dopo il Progetto Formativo, evitando duplicazioni con il Fascicolo.

## Cruscotto qualità

Il cruscotto del progetto include la voce:

`Fabbisogni / rischi`

Stati previsti:

- completo;
- in corso;
- da verificare.

Il controllo è informativo e non impedisce salvataggio, modifica, stampa o chiusura del corso.

## Database Supabase

Migration aggiunta:

`supabase/migrations/2026-07-29_step60_fabbisogni_schede_rischi.sql`

La migration aggiunge alla tabella `progetti` i campi per:

- analisi;
- fonti;
- esigenze;
- ruolo;
- competenze;
- gap;
- lingua;
- accettazione;
- settore;
- rischi selezionati;
- rischi personalizzati.

La migration non attiva RLS e non modifica le policy esistenti.

## Backup, ripristino e collaudo

- Backup identificato come `ASR2025 step60`.
- I nuovi campi vengono inclusi automaticamente nel backup/ripristino della tabella `progetti`.
- Il modulo Collaudo verifica funzioni, moduli HTML, file JavaScript e presenza delle colonne Step 60 su Supabase.
- Se la migration non è stata applicata, il collaudo segnala chiaramente la correzione necessaria.

## Controlli eseguiti

- sintassi di tutti i file JavaScript: OK;
- parsing dei moduli HTML coinvolti: OK;
- presenza dei nuovi file e collegamenti: OK;
- catalogo rischi: 8 settori, 75 rischi;
- suggerimento settore da ATECO/parole chiave: OK;
- integrazione PDF unico senza duplicazione allegati: verificata staticamente;
- originali ZIP e documenti di riferimento: non modificati.

## Operazione necessaria prima dell'uso online

Applicare su Supabase la migration:

`2026-07-29_step60_fabbisogni_schede_rischi.sql`

Senza la migration i nuovi campi non possono essere salvati nel database online.
