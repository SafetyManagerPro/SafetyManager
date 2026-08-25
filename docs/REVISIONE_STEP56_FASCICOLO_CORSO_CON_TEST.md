# Step 56 - Fascicolo del corso con test dei corsisti

## Richiesta
Inserire nella stampa PDF del `Fascicolo del Corso` anche tutti i test dei corsisti.

## Implementazione

### Stampa singola Fascicolo del Corso
Quando si stampa il modulo:

`fascicolo_corso`

il sistema ora allega automaticamente:

- una copia del test manuale da 30 quesiti per ogni corsista iscritto;
- un correttore unico per i valutatori.

Quindi il PDF del fascicolo corso contiene:
- checklist/fascicolo;
- test cartacei da compilare;
- correttore.

### Anteprima Centro Stampe
Anche l'anteprima del Centro Stampe per `Fascicolo Corso` ora usa `renderPrintModulePages()`, quindi mostra le pagine dei test prima della stampa.

### PDF unico progetto
Il PDF unico progetto conteneva già i test agganciati al `Progetto Formativo`.

Per evitare duplicazioni, quando il PDF unico stampa anche `fascicolo_corso`, i test del fascicolo vengono disattivati in quel punto:

`includeFascicoloTests: false`

Così:
- il PDF unico progetto continua ad avere i test;
- il fascicolo corso stampato singolarmente contiene anch'esso i test;
- non vengono duplicati i test nel PDF unico.

## File modificati
- `js/utils.js`
- `js/modules/stampe_bundle.js`
