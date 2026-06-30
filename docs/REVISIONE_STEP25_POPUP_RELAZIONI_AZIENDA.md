
# Step 25 - Popup relazioni azienda da Database Aziende

## Modifica introdotta

In `Anagrafica Aziende Clienti > Database Aziende`, il nome dell'azienda è ora cliccabile.

Al click si apre un popup con:
- dati principali dell'azienda;
- numero progetti collegati;
- numero corsisti aziendali;
- elenco progetti relativi all'azienda;
- corsisti iscritti nei singoli progetti;
- elenco anagrafico corsisti associati all'azienda;
- corsi/progetti svolti per ogni corsista.

## Azioni disponibili dal popup

### Progetti
Ogni progetto mostra:
- codice progetto;
- corso svolto;
- data inizio;
- data esame;
- stato corso;
- numero iscritti.

Il pulsante `Apri progetto` apre il popup di modifica del progetto relativo.

### Corsisti
Ogni corsista mostra:
- nome e cognome;
- codice fiscale;
- mansione;
- corsi/progetti collegati.

Il click sul corsista apre l'anagrafica corsisti e carica il corsista nel form di modifica.

## Note tecniche
- Il popup usa `getProgetti()`, `getCorsisti()` e `getIscrizioniPerProgetti()` per evitare caricamenti progetto-per-progetto.
- Non sono richieste nuove migration.
