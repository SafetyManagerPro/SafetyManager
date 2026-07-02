
# Step 33 - Fix caricamento Anagrafica Docenti

## Problema
Nel modulo `Anagrafica Docenti`, il caricamento poteva bloccarsi.

## Causa
Nel precedente Step 32, durante l'introduzione dei filtri per `Anagrafica Corsisti`, una riga destinata alla tabella corsisti è finita per errore dentro `loadDocentiTable()`.

Il codice richiamava la variabile `cor`, che esiste solo nel ciclo dei corsisti e non nel ciclo dei docenti.

## Correzione
- Ripulita `loadDocentiTable()`.
- Rimossi riferimenti errati a:
  - `cor.iscrizioni`
  - `cor.azienda_id`
  - `data-corsista-azienda`
  - `data-corsista-corsi`
- Aggiunto `try/catch` per mostrare un messaggio chiaro in caso di errore di caricamento.
- Il caricamento del modulo `docenti` ora attende `loadDocentiTable()`.

## Risultato
`Anagrafica Docenti` carica correttamente:
- form nuovo docente;
- menu azienda di appartenenza;
- database docenti;
- azioni modifica/elimina.
