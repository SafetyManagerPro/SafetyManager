
# Step 37 - Fix connessione Supabase online

## Problema
Dopo lo Step 36 la configurazione Supabase non era più hardcoded dentro `js/supabase_config.js`.

Questo è corretto come architettura, ma nel deploy statico/online non era ancora presente un file runtime che valorizzasse:

- `window.SAFETY_SUPABASE_URL`
- `window.SAFETY_SUPABASE_ANON_KEY`

Risultato: l'app non riusciva a inizializzare Supabase.

## Correzione
Aggiunto:

`js/safety_env.js`

Il file imposta le variabili runtime Supabase prima del caricamento di:

`js/supabase_config.js`

## Modifica index.html
Aggiunto ordine corretto:

```html
<script src="js/safety_env.js"></script>
<script src="js/supabase_config.js"></script>
```

## Nota sicurezza
La anon key Supabase è pubblica per natura client-side.
La vera protezione deve essere gestita con:

- RLS abilitate;
- policy Supabase corrette;
- nessuna service_role key nel frontend.
