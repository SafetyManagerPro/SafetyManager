
# Step 11 - Popup progetto con campi errati in rosso e corsisti abbinati

## Modifica introdotta
In `Gestione Progetti > Progetti Attivi`, cliccando sul Codice ID del progetto si apre un popup unico per la modifica.

Nel popup:
- i campi mancanti o errati vengono evidenziati con sfondo rosso;
- in alto viene mostrato un riepilogo degli errori da correggere;
- viene mostrato l'elenco dei corsisti abbinati al corso;
- eventuali corsisti con dati incompleti sono evidenziati in rosso nella tabella corsisti.

## Logica
La modifica resta concentrata nel modulo `Progetti`, senza spostare l'utente in altri moduli.
Il pannello iscritti resta disponibile tramite pulsante interno, ma il riepilogo corsisti è già visibile nel popup.
