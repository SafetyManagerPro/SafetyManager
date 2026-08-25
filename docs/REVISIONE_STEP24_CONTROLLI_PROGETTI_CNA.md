
# Step 24 - Controlli CF, filtro azienda, fascicolo da Progetti, preiscrizioni e CNA persistente

## Interventi

### 1. Controllo Codice Fiscale corsisti
- Aggiunto controllo preventivo su `corsisti.cf` prima del salvataggio.
- Il CF viene normalizzato in maiuscolo e senza spazi.
- Se esiste già un corsista con lo stesso CF, il salvataggio viene bloccato e viene mostrato il nominativo già presente.

### 2. Filtro azienda in Progetti
- In `Progetti > Progetti Attivi` è stato aggiunto il filtro per azienda committente.
- Il filtro agisce sia sulla vista desktop sia sulle card mobile.

### 3. Fascicolo completo da Progetti
- In `Progetti Attivi` è stato aggiunto il pulsante con icona archivio/file accanto a modifica/elimina.
- Il comando prepara la stampa del fascicolo completo del progetto, inclusi gli attestati.
- La stampa usa il dialogo browser: scegliere `Salva come PDF`.

### 4. Preiscrizione corsisti durante inserimento progetto
- Nel form `Gestione Progetto` è stata aggiunta la sezione `Preiscrizione corsisti al progetto`.
- I corsisti possono essere selezionati prima del salvataggio del progetto.
- Dopo il salvataggio del progetto vengono create automaticamente le iscrizioni.
- Resta attiva anche la gestione inline in `Progetti Attivi`.

### 5. Corsi svolti da anagrafica corsisti
- In `Corsisti`, i corsi svolti sono cliccabili.
- Il click apre il progetto relativo in popup, permettendo modifica/controllo del progetto.

### 6. Preset/logo CNA persistente
- Il logo CNA viene ricordato in `localStorage` con chiave `SafetyManager.cnaLogoDefault`.
- Quando l'ente è `CNA Artigiani Imprenditori D'Italia Avellino`, il sistema forza il logo `logocna.png` e completa i dati ente mancanti.
- In fase stampa, il logo CNA e i dati CNA vengono applicati anche se non si apre manualmente la scheda Ente prima della stampa.

## Note
Non sono richieste nuove migration obbligatorie.
Per una protezione totale lato database, in produzione sarà opportuno aggiungere un indice univoco normalizzato sul Codice Fiscale dopo aver eliminato eventuali duplicati storici.
