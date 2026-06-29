# Step 23 - Refactoring controllato JavaScript

## Obiettivo
Ridurre il peso di `js/utils.js` e separare le aree funzionali più autonome in moduli dedicati, senza modificare il comportamento operativo del software.

## Cosa è stato spostato fuori da `utils.js`
Sono stati creati i seguenti moduli:

- `js/modules/scadenze.js`  
  Gestione scadenze e rendering tabella scadenze.

- `js/modules/migrazione.js`  
  Import/migrazione dati CSV/JSON.

- `js/modules/archivio.js`  
  Archivio imprese/enti, corsi e corsisti collegati.

- `js/modules/stampe_bundle.js`  
  Preparazione fascicolo completo in stampa/PDF.

- `js/modules/backup.js`  
  Backup locale e ripristino backup database.

- `js/modules/export_sezioni.js`  
  Export XLSX e stampa PDF delle sezioni operative.

- `js/modules/collaudo.js`  
  Collaudo sistema e report JSON.

## Benefici
- `utils.js` è stato alleggerito.
- Le funzioni sono più facili da trovare.
- Il prossimo refactoring potrà dividere anche Progetti, Corsisti, Aziende e Stampe.
- Il modulo Collaudo ora verifica anche i nuovi file JavaScript modulari.

## Compatibilità
L'ordine di caricamento in `index.html` è stato aggiornato mantenendo:

1. configurazione Supabase;
2. dati/cataloghi;
3. utility base;
4. moduli funzionali estratti;
5. modulo digitale;
6. app principale.

## Nota tecnica
Questo è un refactoring prudente: non riscrive ancora l'intera architettura, ma isola le aree più autonome per ridurre il rischio di regressioni.
