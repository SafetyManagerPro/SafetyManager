
# Step 22 - Collaudo generale e stabilizzazione

## Obiettivo
Consolidare lo stato raggiunto fino allo Step 21, senza aggiungere funzioni operative complesse, ma introducendo:
- una sezione di collaudo eseguibile dall'interfaccia;
- verifica delle librerie critiche;
- verifica caricamento moduli;
- verifica funzioni principali;
- verifica accesso tabelle Supabase;
- verifica performance Progetti + iscrizioni batch;
- controllo responsive/navbar;
- report scaricabile in JSON.

## Nuovo modulo
Aggiunto `modules/collaudo.html`.

Accesso:
- menu superiore: `Collaudo`;
- dashboard: pulsante rapido `Collaudo Sistema`.

## Fix applicati
### Dashboard
La dashboard aveva un unico pannello visibile, ma il codice calcolava ancora anche controlli non visualizzati per `corsi svolti` e `comunicazioni enti`.
Ora la dashboard calcola e renderizza solo il pannello realmente presente:
- `Progetti formativi`.

Questo riduce lavoro inutile e rende coerente il comportamento con la scelta fatta negli step precedenti.

### Diagnostica
Aggiunte funzioni:
- `runCollaudoSistema()`;
- `initCollaudoSistema()`;
- `esportaReportCollaudo()`;
- funzioni helper per rendering stato.

## Controlli eseguiti lato codice
Controllo sintassi JavaScript:
- `js/data.js`
- `js/utils.js`
- `js/digital.js`
- `js/app.js`
- `js/supabase_config.js`

Esito: OK.

## Note
Il collaudo Supabase completo richiede che il software sia aperto da browser con Supabase configurato e rete disponibile.
Il collaudo non modifica i dati.
