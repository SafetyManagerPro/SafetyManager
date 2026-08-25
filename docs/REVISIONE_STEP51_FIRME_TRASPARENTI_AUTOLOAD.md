# Step 51 - Firme trasparenti ottimizzate e richiamo automatico

## Obiettivo
Sono state elaborate le due firme fornite:

- Berardino Pesce
- Centrella Alberto

per ottenere file:
- più puliti;
- con sfondo trasparente;
- leggeri;
- adatti ad essere sovrapposti nei documenti in modo da lasciare intravedere la parte sottostante.

## File creati
Cartella progetto:

`assets/firme/`

File:
- `assets/firme/firma_berardino_pesce.png`
- `assets/firme/firma_centrella_alberto.png`

## Ottimizzazione effettuata
Per entrambe le firme:
- rimozione dello sfondo carta;
- mantenimento solo del tratto della firma;
- esportazione in PNG con trasparenza;
- riduzione dimensioni e peso;
- ottimizzazione per uso web.

### Metadati finali
- `firma_berardino_pesce.png`: 950x301 px, 9669 byte
- `firma_centrella_alberto.png`: 820x473 px, 137537 byte

## Richiamo automatico
È stato aggiunto un sistema di firma automatica:

```js
window.AUTO_SIGNATURES = {
  'BERARDINO PESCE': 'assets/firme/firma_berardino_pesce.png',
  'CENTRELLA ALBERTO': 'assets/firme/firma_centrella_alberto.png'
};
```

Quando nei documenti compare uno di questi nomi:
- come responsabile progetto;
- come responsabile corso;
- come docente / firmatario collegato;
- come firmatario salvato nei campi interessati,

la firma viene mostrata automaticamente nel blocco firma.

## Autocompilazione input firma
Sono stati aggiornati anche i campi firma:
- `Mio Ente Formatore`
- `Anagrafica Docenti`

Se il nome corrisponde a uno dei due firmatari e il campo firma è vuoto, la webapp propone automaticamente il relativo file PNG del progetto.

## Nota GitHub
Da questa sessione non viene eseguito il push diretto su GitHub.
Tuttavia i file sono già inclusi nel progetto e nel pacchetto ZIP, quindi appena carichi questa versione sul repository:
- le immagini saranno versionate;
- il richiamo automatico funzionerà subito con i path relativi `assets/firme/...`.

## File modificati
- `assets/firme/firma_berardino_pesce.png`
- `assets/firme/firma_centrella_alberto.png`
- `index.html`
- `js/utils.js`
