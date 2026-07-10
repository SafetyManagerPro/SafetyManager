# Step 55 - PDF unico progetto con test manuali integrati e correttore

## Obiettivo
Rafforzare il flusso del Centro Stampe:

`PDF unico progetto + test/correttori`

deve contenere chiaramente:
- il progetto formativo;
- i test cartacei da stampare e far compilare ai corsisti;
- il test corretto allegato al progetto, utile ai valutatori per la correzione.

## Correzione principale

### Test digitale escluso
È confermata l'esclusione del test digitale dal PDF unico progetto.

Il sistema non inserisce più:
- `TEST COMPILATO DAL CORSISTA` digitale;
- risultati da firma digitale;
- test salvati in localStorage;
- test da eventuale tabella `test_digitali`.

Questo perché attualmente non c'è ancora il supporto operativo per far firmare digitalmente i corsisti.

## Nuovo comportamento

### Una copia compilabile per ogni corsista
Nel PDF unico progetto, dopo il `Progetto Formativo`, la webapp genera:

`TEST MANUALE DA EROGARE AI CORSISTI - 30 QUESITI`

Per ogni corsista iscritto al progetto.

Ogni copia:
- è A4 orizzontale;
- contiene 30 quesiti;
- è su un solo foglio;
- è già intestata al corsista, quando disponibile;
- riporta il codice fiscale, quando disponibile;
- ha spazio per firma corsista;
- ha spazio per firma valutatore;
- deve essere stampata, consegnata, compilata manualmente e poi corretta.

### Un solo correttore allegato al progetto
Alla fine dei test compilabili viene allegato:

`TEST MANUALE - CORRETTORE PER VALUTATORI`

Il correttore:
- usa le stesse 30 domande del test;
- evidenzia le risposte corrette;
- resta allegato al progetto formativo;
- serve ai valutatori per la correzione e verifica.

## Verifica di sicurezza nel PDF unico
Nel file `js/modules/stampe_bundle.js` è stato aggiunto un controllo:

- se il PDF unico per qualsiasi motivo non contiene i test manuali;
- il sistema li rigenera e li aggiunge automaticamente prima della stampa.

Il messaggio prima della stampa ora indica quanti:
- test manuali compilabili sono inclusi;
- correttori sono inclusi.

## Firme
È stata preservata la correzione dello Step 54:
le firme automatiche restano inserite solo negli slot firma espliciti, non nei punti casuali dove compare il nome.

## File modificati
- `js/utils.js`
- `js/modules/stampe_bundle.js`

## Nota operativa
Il PDF unico progetto ora contiene già il pacchetto completo:
- documenti progetto;
- test manuali da stampare per i corsisti;
- correttore per valutatori;
- fascicolo/checklist.

Gli attestati restano separati nel pulsante `PDF solo attestati`.
