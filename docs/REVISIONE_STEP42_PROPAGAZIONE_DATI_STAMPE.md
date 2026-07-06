# Step 42 - Propagazione modifiche tra anagrafiche, tabelle collegate e stampe

## Verifica
Il problema segnalato è stato verificato.

Quando si modificavano:
- Clienti / Aziende;
- Corsisti;
- Docenti;
- Progetti;

alcune viste e stampe potevano continuare a usare dati vecchi perché l'app manteneva in memoria cache globali già caricate:

- `window.aziendeList`
- `window.corsistiList`
- `window.docentiList`
- `window.progettiList`
- `window.progettiIscrizioniMap`
- `window.archivioCorsiState`

Inoltre `caricaDatiStampa()` non ricaricava sempre i dati se `progettiList` o `docentiList` erano già popolati.

## Correzioni applicate

### 1. Invalidazione cache dati
Aggiunta funzione:

`window.invalidateSafetyDataCaches(reason)`

La funzione svuota le cache globali e forza il successivo ricaricamento da Supabase.

### 2. Ricaricamento automatico viste collegate
Aggiunta funzione:

`window.reloadLinkedViewsAfterMutation(reason, options)`

Dopo ogni salvataggio/eliminazione vengono aggiornate automaticamente le viste presenti nella pagina:
- aziende;
- docenti;
- corsisti;
- progetti;
- archivio corsi;
- centro stampe;
- fogli progetto/corsisti;
- dashboard errori.

### 3. Stampa sempre aggiornata
`window.caricaDatiStampa()` ora ricarica sempre da Supabase:
- progetti;
- ente;
- docenti;
- iscrizioni/corsisti.

Questo evita che attestati, registri, progetti formativi, dichiarazioni e fogli corsisti usino dati vecchi.

### 4. Progetti Attivi sempre aggiornati
`loadProgettiTable()` ora ricarica sempre:
- aziende;
- docenti;
- corsisti;
- progetti;
- iscrizioni.

Prima aziende/docenti venivano ricaricati solo se l'array locale era vuoto.

### 5. Propagazione corsista nelle iscrizioni
Quando si modifica un corsista, la mansione storica viene riallineata anche sulle iscrizioni già presenti tramite:

`window.updateIscrizioniCorsistaSnapshot(corsistaId, record)`

Questo corregge il caso in cui i corsi/stampe continuavano a mostrare la vecchia mansione.

### 6. Scheda cliente/ente sempre fresca
La scheda cliente/committente e la scheda ente formatore/erogatore non usano più la cache archivio se già presente, ma ricaricano dati freschi da Supabase.

### 7. Robustezza stampe corsisti
La generazione di `currentSessionCorsisti` ora gestisce anche eventuali join mancanti senza bloccare la stampa.

## File principali modificati
- `js/utils.js`
- `js/supabase_config.js`
- `js/modules/archivio.js`

## Risultato atteso
Dopo modifica di un'anagrafica o di un progetto:
- la tabella interessata si aggiorna;
- le tabelle collegate vengono riallineate se presenti;
- l'Archivio Imprese / Enti rilegge i dati;
- Centro Stampe usa sempre l'ultima versione;
- le stampe non restano più agganciate a dati precedenti caricati in memoria.
