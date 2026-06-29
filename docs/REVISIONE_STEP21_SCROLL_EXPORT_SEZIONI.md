# Step 21 - Scroll Gestione Progetto ed export/stampa sezioni

## Gestione Progetto
Nel modulo `Progetti` la scheda laterale `Gestione Progetto` ora ha una barra di scorrimento verticale autonoma su desktop.

Questo evita che il form resti bloccato o obblighi a scorrere tutta la pagina laterale sinistra prima di raggiungere i campi finali.

Su tablet/smartphone lo scroll torna naturale nella pagina, per evitare finestre interne troppo piccole.

## Esportazione e stampa sezioni
Aggiunta una barra comandi direttamente nelle sezioni:
- Aziende
- Corsisti
- Docenti
- Progetti
- Archivio
- Scadenze

Ogni sezione ora ha:
- `Esporta XLSX`, per scaricare un file Excel sul PC;
- `Stampa PDF`, per aprire la stampa browser e salvare in PDF.

## Note tecniche
- Esportazione Excel tramite SheetJS/XLSX lato browser.
- Stampa PDF generata da tabelle pulite, non dalla UI con pulsanti e form.
- Progetti esporta due fogli: `Progetti` e `Iscrizioni`.
- Archivio esporta una riga per corso/corsista.
- Scadenze esporta la lista attestati con giorni alla scadenza.
