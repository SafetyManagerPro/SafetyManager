
# Step 34 - Scheda cliente / committente PDF e XLS

## Nuova funzione
In `Archivio Imprese / Enti` è stata aggiunta la stampa della scheda cliente/committente.

Per ogni azienda cliente sono disponibili due pulsanti:
- `Scheda cliente PDF`
- `Scheda XLS`

## Contenuti della scheda
La scheda riporta:

### Dati cliente / committente
- Ragione sociale;
- P.IVA / C.F.;
- sede legale;
- sede operativa;
- codice ATECO;
- referente formazione / legale rappresentante.

### Riepilogo
- numero progetti formativi;
- numero corsisti formati;
- attestati presenti;
- scadenze registrate.

### Dettaglio corsisti e attestati
Per ogni corsista vengono riportati:
- nome e cognome;
- codice fiscale;
- luogo/data nascita;
- mansione;
- codice progetto;
- codice corso;
- descrizione corso;
- data inizio;
- data attestato;
- scadenza attestato;
- ID certificato;
- esito;
- frequenza;
- stato corso;
- sede corso.

## PDF
Il pulsante `Scheda cliente PDF` apre il dialogo di stampa del browser.
Per salvarla scegliere `Salva come PDF`.

## XLS
Il pulsante `Scheda XLS` genera un file Excel con due fogli:
- `Riepilogo Cliente`
- `Corsisti Attestati`

## File modificato
- `js/modules/archivio.js`
