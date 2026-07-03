
# Step 15 - Popup compatto e backup locale database

## Popup modifica progetto
Il popup di modifica progetto non occupa più tutto lo schermo:
- card centrale con larghezza massima ridotta;
- altezza controllata;
- intestazione superiore fissa;
- nessuna barra di scorrimento sulla barra alta;
- contenuto diviso in due schede:
  - Dati progetto;
  - Corsisti abbinati.

Lo scroll avviene solo nell'area contenuto della scheda attiva.

## Backup locale database
Nel modulo `Migrazione Dati` è stata aggiunta la sezione `Backup locale database`.

Il pulsante `Scarica Backup` esporta sul PC:
- backup completo in JSON;
- file separati per tabella;
- manifest;
- eventuali errori di esportazione per tabelle non presenti.

Il backup viene creato lato browser e scaricato come ZIP.
