# Report Step 13 — Import guidato sicuro

## Obiettivo
Rendere l'importazione CSV/JSON più professionale e meno rischiosa, evitando importazioni dirette senza controllo preventivo.

## File aggiunti
- `js/modules/import_guidato.js`

## File modificati
- `modules/migrazione.html`

## Funzioni introdotte
- Simulazione preventiva prima dell'import reale.
- Controllo duplicati nel file sorgente.
- Controllo duplicati già presenti nel database.
- Riepilogo delle azioni previste: record da creare, record da riusare, attestati da saltare.
- Blocco dell'importazione se sono presenti errori critici.
- Conferma finale prima dell'importazione reale.
- Export JSON del log di analisi.

## Controlli principali
- Codice fiscale corsista mancante.
- Codice fiscale con formato anomalo.
- ID certificato duplicato nel file.
- ID certificato già presente nel database.
- Corsista già presente nel database.
- Progetto già presente nel database.
- Corsista ripetuto nello stesso progetto.
- Date non interpretabili.
- Corso non riconosciuto con certezza.

## Sicurezza operativa
Lo Step 13 non modifica le tabelle, le policy Supabase, il motore stampe o le firme.
L'import reale continua a usare la funzione esistente, ma viene protetto da una simulazione obbligatoria.

## Flusso utente consigliato
1. Aprire Migrazione.
2. Scaricare un backup locale.
3. Selezionare CSV/JSON.
4. Analizzare file.
5. Verificare mappatura colonne.
6. Eseguire Simula importazione.
7. Scaricare log se necessario.
8. Avviare import sicuro solo se non ci sono blocchi critici.
