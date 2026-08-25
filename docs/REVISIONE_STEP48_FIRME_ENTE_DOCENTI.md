# Step 48 - Firme ente formatore e docenti

## Richiesta
Aggiungere:

1. In `Mio Ente Formatore`
   - link/caricamento firma del legale rappresentante;
   - se non c'è file disponibile, possibilità di firma manuale.

2. In `Anagrafica Docenti`
   - link/caricamento firma docente;
   - se non c'è file disponibile, possibilità di firma manuale.

## Implementazione

### Mio Ente Formatore
Aggiunta sezione:

`Firma legale rappresentante`

con:
- campo link immagine firma;
- upload file immagine firma;
- anteprima firma;
- pulsante `Firma manualmente`;
- canvas per firma manuale;
- pulsanti `Salva firma`, `Pulisci`, `Chiudi`.

Il valore viene salvato in:

`enti.legale_firma_url`

Può contenere:
- URL pubblico Supabase Storage;
- link manuale inserito dall'utente;
- data URL generato dal canvas firma manuale.

### Anagrafica Docenti
Aggiunta sezione:

`Firma docente`

con:
- campo link immagine firma;
- upload file firma;
- anteprima firma;
- firma manuale su canvas;
- salvataggio nel campo docente.

Il valore viene salvato in:

`docenti.firma_docente_url`

### Tabella Docenti
Nella tabella docenti viene aggiunto un link rapido:

`Firma`

insieme a:
- documento identità;
- codice fiscale.

## Funzioni aggiunte
In `js/utils.js`:

- `window.showFirmaPreview(inputId, previewId)`
- `window.openFirmaManuale(canvasId, targetInputId, previewId)`
- `window.closeFirmaManuale(canvasId)`
- `window.setupFirmaCanvas(canvasId, targetInputId, previewId)`
- `window.clearFirmaManuale(canvasId)`
- `window.saveFirmaManuale(canvasId)`

È stato esteso anche:

`window.uploadDocumentoArchivio(...)`

con supporto a:

`entityType = 'ente'`

e bucket:

`documenti-ente`

## Migration Supabase
Aggiunta migration:

`supabase/migrations/2026-07-06_step48_firme_ente_docenti.sql`

Colonne:
- `enti.legale_firma_url text`
- `docenti.firma_docente_url text`

Bucket:
- `documenti-ente`

## Nota
Per il caricamento file online va applicata la migration Step 48.
La firma manuale funziona creando un'immagine base64/data URL nel campo link e poi salvando la scheda.
