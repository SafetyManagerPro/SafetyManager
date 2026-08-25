# SafetyManager ASR 2025 — Step 64

## Registri presenze distinti per ogni giornata formativa

Data revisione: 30 luglio 2026.

## Obiettivo

Lo step 64 modifica la generazione del Registro Presenze affinché un corso articolato su più giornate produca automaticamente un registro separato per ogni giorno effettivo di formazione.

La funzione è integrata nelle stampe:

- Registro Presenze dal Centro Stampe;
- Progetto Formativo con relativi allegati;
- Fascicolo del Corso;
- PDF unico progetto;
- comandi di stampa rapida richiamati da Progetti.

## Logica del calendario

Il sistema usa:

- corso selezionato;
- data di inizio;
- calendario già memorizzato nel progetto;
- durata e articolazione delle unità didattiche;
- docenti associati alle singole unità didattiche.

Quando il calendario contiene date esplicite, queste vengono rispettate. Se non sono presenti date sufficienti, il sistema completa il calendario applicando la distribuzione già utilizzata dal progetto, con un massimo ordinario di otto ore per giornata e salto automatico dei fine settimana.

Non sono richiesti nuovi campi nel database: i registri sono generati dai dati già presenti nel progetto.

## Registro giornaliero

Ogni pagina del registro riporta:

- numero della giornata sul totale;
- data specifica della giornata;
- ore previste;
- unità didattiche e argomenti del giorno;
- docente o docenti assegnati;
- corso;
- azienda committente;
- ente formatore/erogatore;
- codice progetto;
- elenco completo dei corsisti;
- quattro spazi firma: entrata e uscita mattina, entrata e uscita pomeriggio;
- firma del docente o dei docenti della giornata;
- timbro dell’ente, quando previsto.

Il registro resta in formato A4 orizzontale.

## Integrazione con il Progetto Formativo

La stampa del Progetto Formativo allega automaticamente tanti registri quante sono le giornate del corso.

Esempio verificato:

- corso RLS da 32 ore;
- quattro giornate;
- quattro registri;
- otto ore per ciascun registro;
- date, argomenti e docenti distinti.

## Integrazione con Fascicolo e PDF unico

La stampa singola del Fascicolo del Corso allega i registri giornalieri.

Nel PDF unico:

- il Progetto Formativo non duplica i registri;
- la sezione Registro genera tutte le giornate;
- il Fascicolo non li ripete una seconda volta.

Il messaggio riepilogativo del PDF unico indica il numero di registri inseriti.

## Correzione aggiuntiva

È stata corretta la compilazione delle righe corsisti quando più copie del registro sono presenti contemporaneamente nell’anteprima o nell’area di stampa.

In precedenza il codice aggiornava solo il primo elemento con identificativo `r-rows`. Ora tutte le tabelle registro presenti vengono compilate, evitando registri successivi vuoti.

Le copie giornaliere non mantengono identificativi HTML duplicati.

## Nuovo modulo

- `js/modules/registri_multigiorno.js`

Funzioni principali:

- `parseTrainingCalendarDates`;
- `getTrainingDaySchedule`;
- `applyRegisterDayFields`;
- `expandRegisterPagesByTrainingDay`;
- `getMultiDayRegisterSummary`.

## File modificati

- `index.html`;
- `modules/registro.html`;
- `modules/stampe.html`;
- `modules/fascicolo_corso.html`;
- `js/utils.js`;
- `js/modules/stampe_bundle.js`;
- `js/modules/backup.js`;
- `js/modules/collaudo.js`;
- `js/modules/README.md`.

## Database Supabase

Nessuna migration necessaria.

La funzione usa i campi già disponibili:

- `progetti.corso_id`;
- `progetti.data_inizio`;
- `progetti.data_esame`;
- `progetti.calendario`;
- `progetti.docenti_ud`;
- iscrizioni e corsisti del progetto.

## Controlli eseguiti

- sintassi di tutti i 18 file JavaScript: OK;
- logica corso da 12 ore: due registri, 8 + 4 ore: OK;
- logica corso da 32 ore: quattro registri: OK;
- calendario esplicito di tre giorni per 12 ore: distribuzione 4 + 4 + 4: OK;
- parsing date italiane e ISO senza duplicati: OK;
- Centro Stampe con corso RLS reale: quattro registri distinti: OK;
- ogni registro contiene 30 righe disponibili e il corsista iscritto: OK;
- date, ore, argomenti e docenti giornalieri: OK;
- Progetto Formativo con quattro registri allegati: OK;
- assenza di errori JavaScript nel collaudo browser: OK;
- parsing HTML e controllo collegamenti: OK;
- archivio ZIP e controllo CRC: OK.
