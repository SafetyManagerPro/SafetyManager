
# Step 31 - Azienda docente da menu e stampa corso da Archivio

## Anagrafica Docenti

Il campo `Azienda di appartenenza` non è più un campo libero.

Ora è un menu a tendina alimentato dalle Ragioni Sociali presenti in:

`Anagrafica Aziende Clienti`

### Comportamento
- Alla apertura di `Anagrafica Docenti`, il sistema carica le aziende clienti.
- Nel menu compaiono le Ragioni Sociali registrate.
- In modifica docente viene preselezionata l'azienda già salvata.
- Se in archivio esisteva un valore vecchio non più presente in aziende clienti, viene mostrato come opzione temporanea per non perdere il dato.

## Archivio Corsi

In `Archivio Corsi`, per ogni singolo corso/progetto è stato aggiunto il pulsante:

`Stampa corso/corsisti`

Il comando stampa il foglio del progetto con:
- dati del corso;
- ente formazione;
- committente;
- sede;
- corsisti partecipanti;
- righe alternate evidenziate.

La stampa usa il foglio già introdotto nello Step 30.
