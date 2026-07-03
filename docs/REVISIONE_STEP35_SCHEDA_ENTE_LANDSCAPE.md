
# Step 35 - Scheda ente formatore/erogatore e stampa A4 orizzontale

## Modifica richiesta
La scheda introdotta nello Step 34 per cliente/committente è stata estesa anche alla voce:

`Ente formatore / erogatore`

## Archivio Imprese / Enti
Ora anche il gruppo `Ente formatore / erogatore` contiene:
- `Scheda ente PDF`
- `Scheda ente XLS`

## Contenuti scheda ente
La scheda ente raccoglie i corsi erogati con `ente_erogatore = ente` e riporta:
- dati ente formatore;
- responsabile attività formative ente;
- riepilogo corsi;
- corsisti formati;
- attestati;
- scadenze;
- committente collegato al singolo progetto, quando presente;
- dati corso/progetto;
- data attestato;
- scadenza attestato;
- ID certificato;
- esito/frequenza.

## Formato stampa
La stampa PDF della scheda cliente/committente e della scheda ente ora usa formato:

`A4 orizzontale`

È stato aggiunto CSS dedicato con pagina nominata:
`schedaClienteLandscape`

e classe:
`scheda-landscape`

## XLS
L'esportazione XLS resta disponibile anche per ente formatore/erogatore.
