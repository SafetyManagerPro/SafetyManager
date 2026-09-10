# Step 10 — Checklist documentale corso

## Obiettivo
Rendere la dashboard più operativa e guidare l'utente nel controllo di ogni corso prima di stampa, chiusura e archiviazione.

## Interventi applicati

### Nuovo modulo
- `js/modules/checklist_corso.js`

Il modulo aggiunge:
- checklist documentale per singolo corso;
- popup modale con stato complessivo, percentuale di completamento, errori e avvisi;
- lista corsi ordinata per completamento;
- pulsante rapido `Checklist` nella dashboard;
- pulsanti `Checklist` accanto ai corsi mostrati in dashboard.

### Dashboard
- Aggiornato `modules/admin.html` per caricare anche il modulo checklist.
- Aggiunta azione rapida `Checklist`.

## Controlli effettuati dalla checklist

### Anagrafica corso
- codice progetto;
- corso da catalogo;
- azienda collegata;
- sede;
- modalità;
- date corso.

### Responsabili e docenti
- responsabile progetto formativo;
- responsabile del corso;
- docenti assegnati;
- tutor/riesame come controllo consigliato.

### Corsisti
- iscritti associati;
- nome e codice fiscale;
- mansioni;
- coerenza azienda/corsisti per corsi gestiti dal datore di lavoro.

### Esiti e chiusura
- chiusura corso;
- frequenze;
- verifiche/test;
- esiti finali;
- ID certificato;
- scadenze attestati.

### Documenti e archivio
- progetto formativo stampabile;
- registro presenze stampabile;
- test e correttori stampabili;
- verbale finale;
- attestati;
- scansione documenti firmati per corsi chiusi.

## Note tecniche
- Nessuna modifica al database.
- Nessuna modifica alle stampe.
- Nessuna modifica alle firme.
- Il modulo è solo di lettura: non salva, non cancella e non aggiorna record.

## Uso consigliato
Dalla Dashboard:
1. aprire `Checklist` dalle azioni rapide;
2. scegliere un corso;
3. controllare errori/avvisi;
4. usare `Apri progetto`, `Centro stampe` o `Archivio` per completare il flusso.
