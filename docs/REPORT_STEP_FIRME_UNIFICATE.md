# Step Firme Unificate

## Obiettivo

Uniformare la gestione delle firme nelle stampe SafetyManager PRO, con priorità agli attestati emessi dall'ente formatore.

## Regola operativa applicata

Se la firma non è presente come file immagine valido, se il percorso è locale/non caricabile, oppure se il file genera errore di caricamento, lo slot firma resta presente e visibile, ma vuoto.

Lo slot continua a mostrare la riga e l'indicazione del ruolo/nominativo di chi deve firmare, senza mostrare immagini rotte e senza nascondere l'area firma.

## File modificati

- `js/app.js`
- `js/modules/firme_unificate.js`

## Nuovo modulo firme

È stato creato `js/modules/firme_unificate.js` con un risolutore centrale:

1. firma caricata nell'anagrafica ente o docente;
2. firma statica presente in `assets/firme`;
3. slot firma vuoto ma mantenuto.

## Priorità delle firme

### Legale rappresentante / ente

Il sistema prova a usare `enti.legale_firma_url` o campi equivalenti presenti nello stato applicativo.

### Docente / formatore

Il sistema prova a usare `docenti.firma_docente_url` o campi equivalenti del docente.

### Firme statiche

Sono mantenute le firme statiche già presenti:

- `assets/firme/firma_berardino_pesce.png`
- `assets/firme/firma_centrella_alberto.png`

## Ruoli mappati

Pesce Berardino / Berardino Pesce:

- docente;
- formatore;
- responsabile progetto formativo;
- legale rappresentante.

Centrella Alberto / Alberto Centrella:

- docente;
- formatore;
- responsabile del corso.

## Dove viene applicata la logica

La logica viene applicata a tutti gli elementi `.auto-signature-slot` presenti nelle stampe e nelle anteprime.

Il sistema aggancia automaticamente:

- anteprima Centro Stampe;
- stampa rapida di singoli documenti;
- PDF unico progetto;
- PDF solo attestati;
- attestati multipli;
- attestato individuale.

## Note sui percorsi file

I percorsi locali del PC, i link `file://`, i percorsi Windows tipo `C:\...` e i PDF non vengono renderizzati come immagine firma nel browser pubblicato su Vercel.

In questi casi il sistema lascia lo slot firma vuoto e stampabile, come richiesto.

## Verifica deploy

Il deploy Vercel successivo alla modifica è stato generato dal commit `057490019b86c8995db15b1ca9c65a85582e498c` ed è risultato `READY`.

I log build non riportano errori e il file `js/modules/firme_unificate.js` risponde correttamente da Vercel con stato HTTP 200.
