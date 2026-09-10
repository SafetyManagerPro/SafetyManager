# REPORT STEP 11 - Verifica / prepara corso completo

## Obiettivo

Aggiungere alla Dashboard un flusso operativo guidato per verificare rapidamente se un corso è pronto per stampa, chiusura e archiviazione.

Lo step è stato progettato come controllo non distruttivo: non modifica dati, policy, firme o motore di stampa.

## File aggiunti

- `js/modules/prepara_corso.js`

## File modificati

- `modules/admin.html`

## Funzioni principali aggiunte

- `window.apriPreparazioneCorsi()`
- `window.apriPreparazioneCorso(projectId)`
- `window.preparaVaiStampe(projectId)`
- `window.scaricaBackupPreCorso()`
- `window.injectPreparaButtonsInDashboard()`

## Cosa controlla

Il flusso usa la checklist documentale già introdotta nello Step 10 e la riorganizza in un percorso pratico:

1. Backup consigliato.
2. Dati corso.
3. Responsabili, docenti e firme.
4. Corsisti.
5. Pacchetto stampe iniziale.
6. Esiti, verbale e attestati.
7. Archivio documenti firmati.

## Output operativo

Per ogni corso mostra:

- stato generale;
- percentuale checklist;
- disponibilità delle stampe iniziali;
- stato chiusura;
- percorso consigliato;
- blocchi da completare;
- avvisi consigliati;
- azioni rapide.

## Azioni rapide disponibili

Dal flusso si può aprire direttamente:

- Backup;
- Checklist dettagliata;
- Gestione progetto;
- Centro Stampe;
- Archivio.

## Cosa non è stato toccato

- Motore stampe/PDF.
- Sistema firme.
- Supabase/RLS.
- Tabelle database.
- Logica di salvataggio dati.

## Note

Il pulsante `Prepara corso` è stato aggiunto in Dashboard e il modulo viene caricato dinamicamente dopo `dashboard_pro.js` e `checklist_corso.js`.

La funzione è pensata come step intermedio prima di eventuali automatismi futuri di chiusura corso, ma in questa versione non salva nulla in automatico.
