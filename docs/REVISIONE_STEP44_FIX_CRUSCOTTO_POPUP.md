# Step 44 - Fix cruscotto qualità nel popup progetto

## Problema rilevato
Nel popup di modifica progetto il cruscotto qualità introdotto nello Step 43 occupava troppo spazio verticale e rendeva difficile vedere/modificare i dati del progetto.

Inoltre il pulsante `Apri azienda` provava ad aprire il popup relazioni azienda anche quando il relativo modal non era disponibile nel contesto corrente, generando il messaggio:

`Popup relazioni azienda non disponibile.`

## Correzioni applicate

### 1. Cruscotto compatto nel popup
Nel popup progetto il cruscotto ora mostra solo:
- intestazione;
- avanzamento;
- numero aree complete;
- numero aree da verificare;
- pulsante `Mostra dettagli`.

I dettagli sono nascosti di default.

### 2. Dettagli richiudibili
Aggiunta funzione:

`window.toggleProjectQualityDetails(projectId)`

Permette di aprire/chiudere i dettagli del cruscotto senza occupare sempre spazio.

### 3. Azioni sicure
Aggiunta funzione:

`window.handleProjectQualityAction(projectId, key, mode)`

Le azioni del cruscotto ora sono contestuali:
- nel popup non aprono popup secondari mancanti;
- per `Azienda` portano/focalizzano il campo azienda;
- per `Corsisti` aprono la tab corsisti;
- per `Documenti` stampa il fascicolo;
- per dati/docenti/compliance/chiusura focalizzano il campo relativo.

### 4. Rimosso errore popup relazioni azienda
Il cruscotto non chiama più direttamente:

`window.apriPopupRelazioniAzienda(...)`

dentro le azioni qualità.

### 5. Segnalazioni popup nascoste
La vecchia box `Verified / Segnalazioni non bloccanti` viene nascosta per non consumare spazio.
Le informazioni principali sono ora concentrate nel cruscotto compatto.

### 6. Rimosso scroll automatico al primo errore
All'apertura del popup non viene più eseguito lo scroll automatico al primo campo segnalato.
Questo evita che la finestra si apra già spostata in punti scomodi.

## File modificato
- `js/utils.js`
