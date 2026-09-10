# Report Step 12 — Archivio corsi avanzato

## Obiettivo
Rendere l'archivio più professionale e utilizzabile come punto centrale di consultazione storica: corsi, aziende, corsisti, attestati, scadenze e documenti firmati.

## File modificati

- `modules/archivio_corsi.html`
- `js/modules/archivio_avanzato.js`

## Funzioni aggiunte

### Nuova intestazione archivio
L'archivio ora ha una testata più chiara e professionale, con pulsanti rapidi per aggiornamento ed export.

### Statistiche rapide
Sono stati aggiunti riquadri di riepilogo per:

- corsi filtrati;
- corsisti unici;
- iscrizioni complessive;
- attestati presenti;
- attestati in scadenza entro 90 giorni;
- attestati scaduti;
- documenti firmati archiviati.

### Filtri avanzati
Sono stati aggiunti filtri per:

- ricerca libera su azienda, corso, codice progetto, corsista, codice fiscale, ID attestato;
- azienda/ente;
- corso;
- stato operativo;
- intervallo date verifica;
- documenti firmati presenti/mancanti;
- scadenze entro 90 giorni;
- attestati scaduti.

### Vista per azienda/ente
Ogni gruppo azienda/ente ora mostra riepilogo corsi, iscrizioni, attestati e scadenze.

### Vista progetto migliorata
Ogni corso mostra:

- codice progetto;
- corso e codice corso;
- stato operativo;
- presenza/mancanza dei documenti firmati;
- date principali;
- sede;
- corsisti con CF, mansione, esito, frequenza, ID attestato e scadenza.

### Azioni rapide per corso
Per ogni corso sono disponibili:

- Apri;
- Stampe;
- Prepara;
- Checklist;
- Foglio corso/corsisti.

### Export archivio filtrato
Aggiunto export XLSX dei risultati filtrati.

### Sintesi PDF
Aggiunta stampa PDF della sintesi filtrata dell'archivio.

## Vincoli rispettati

- Nessuna modifica al database.
- Nessuna modifica alle policy Supabase.
- Nessuna modifica al motore firme.
- Nessuna modifica al motore stampe dei documenti principali.
- L'archivio legacy resta recuperabile tramite `window.renderArchivioCorsiLegacy`.

## Verifiche da fare

1. Aprire Archivio.
2. Provare ricerca per azienda.
3. Provare ricerca per corsista/codice fiscale.
4. Filtrare per corso.
5. Filtrare per stato: aperti, da chiudere, chiusi.
6. Filtrare scadenze entro 90 giorni.
7. Esportare XLSX archivio filtrato.
8. Stampare sintesi PDF.
9. Aprire checklist/prepara/stampe da un corso in archivio.
