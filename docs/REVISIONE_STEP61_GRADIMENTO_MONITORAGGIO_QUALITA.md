# Step 61 — Questionari di Gradimento e Monitoraggio Qualità

## Obiettivo

Lo Step 61 sviluppa la seconda priorità individuata nel pacchetto `Formazione SSL.zip`:

- predisporre un questionario cartaceo per ogni corsista;
- registrare nel progetto lo stato di raccolta e le medie;
- produrre un riepilogo dei risultati;
- formalizzare il monitoraggio in itinere e il giudizio finale;
- allegare automaticamente la documentazione al fascicolo e al PDF unico.

La funzione resta **non bloccante** durante la fase di test.

## Modelli di riferimento analizzati

Sono stati esaminati:

- `4_ QUESTIONARIO DI GRADIMENTO .docx`;
- `6-SCHEDA VALUTAZIONE GRADIMENTO.docx`;
- `6_questionario di gradimento generale .docx`;
- `6_questionario di gradimento specifica.docx`;
- `4-SCHEDA MONITORAGGIO QUALITA' 2.docx`.

Le domande duplicate presenti nei modelli sono state consolidate senza perdere le tre aree principali:

1. qualità didattica;
2. qualità organizzativa;
3. utilità percepita.

## Gestione Progetto

È stata aggiunta una sezione richiudibile:

`Gradimento e monitoraggio qualità`

Contiene:

- stato dei questionari;
- numero questionari raccolti;
- media qualità didattica, da 1 a 5;
- media qualità organizzativa, da 1 a 5;
- media utilità percepita, da 1 a 5;
- giudizio complessivo, da 1 a 10;
- sintesi di commenti e suggerimenti;
- data del monitoraggio;
- valutazione in itinere di partecipazione, interesse, completezza, tempi e chiarezza;
- metodi di verifica dell'apprendimento;
- sintesi degli esiti;
- giudizio finale;
- criticità;
- proposte di miglioramento.

La sezione è chiusa per impostazione iniziale, così non occupa spazio nel popup del progetto.

## Questionario cartaceo individuale

Nuovo documento:

`modules/questionario_gradimento.html`

Viene generata una copia per ogni corsista iscritto al progetto. Se non risultano iscritti viene prodotto un modello vuoto.

Il questionario contiene:

- dati corso e progetto;
- partecipante e azienda;
- 11 aspetti da valutare;
- scala da 1 a 5;
- spazio osservazioni;
- tre aree per commenti e suggerimenti;
- giudizio complessivo da 1 a 10.

La compilazione resta manuale e non richiede procedure digitali.

## Riepilogo Gradimento

Nuovo documento:

`modules/riepilogo_gradimento.html`

Riporta:

- questionari previsti;
- questionari raccolti;
- medie delle tre aree;
- giudizio complessivo;
- sintesi dei commenti;
- firme del responsabile progetto e del responsabile corso.

## Monitoraggio Qualità

Nuovo documento:

`modules/monitoraggio_qualita.html`

Riprende la struttura del modello fornito e comprende:

- dati generali del corso;
- monitoraggio in itinere da tutor/docente;
- valutazione dell'apprendimento;
- risultati del gradimento;
- giudizio finale;
- criticità;
- proposte di miglioramento;
- firme e timbro.

## Integrazioni

### Progetti Attivi

- badge `Qualità verificata` oppure `Qualità da completare`;
- nuova voce nel Cruscotto Qualità;
- azione diretta per aprire la sezione;
- stampa rapida dei questionari e del monitoraggio dal progetto.

### Progetto Formativo

La sezione Valutazione e Verifica riporta lo stato sintetico di questionari e monitoraggio.

### Fascicolo del Corso

La checklist comprende:

- questionari di gradimento;
- riepilogo delle medie;
- scheda monitoraggio qualità.

La stampa singola del fascicolo allega automaticamente:

1. Analisi Fabbisogni;
2. Scheda Rischi;
3. test manuali e correttore;
4. questionari di gradimento dei corsisti;
5. riepilogo gradimento;
6. monitoraggio qualità.

### Centro Stampe

Nuovi comandi:

- `Questionari Gradimento Corsisti`;
- `Riepilogo Gradimento`;
- `Monitoraggio Qualità`.

### PDF unico progetto

Il PDF unico include i nuovi documenti una sola volta, dopo il verbale e prima della checklist del fascicolo.

Gli attestati continuano a essere esclusi dal PDF unico e restano disponibili dal comando dedicato.

## Database Supabase

Migration:

`supabase/migrations/2026-07-29_step61_gradimento_monitoraggio_qualita.sql`

Sono aggiunti alla tabella `progetti`:

- stato e numero questionari;
- quattro medie;
- commenti;
- data monitoraggio;
- valutazioni in itinere JSON;
- metodi di verifica JSON;
- esito apprendimento;
- giudizio finale;
- criticità;
- miglioramenti.

La migration:

- verifica intervalli delle medie;
- verifica valori di stato e giudizio;
- verifica struttura JSON;
- non modifica RLS o policy.

## Backup e Collaudo

- versione backup aggiornata a `ASR2025 step61`;
- nuovi campi inclusi automaticamente nel backup/ripristino dei progetti;
- Collaudo Sistema aggiornato con funzioni, file, moduli e colonne Step 61.

## Controlli eseguiti

- sintassi JavaScript;
- parsing HTML dei moduli;
- coerenza campi form/migration;
- collegamenti Centro Stampe;
- collegamento al PDF unico senza duplicazioni;
- catalogo monitoraggio e intervalli punteggi;
- integrità ZIP.

## Operazione necessaria

Prima dell'uso online applicare:

`2026-07-29_step61_gradimento_monitoraggio_qualita.sql`

Senza la migration i nuovi valori non possono essere salvati su Supabase.
