# Step 39 - CI, controlli automatici e audit statico

## Obiettivo
Continuazione dei suggerimenti Copilot su manutenibilità, test/lint e riduzione regressioni.

## Aggiunto

### package.json
Sono stati aggiunti script senza dipendenze esterne:

```bash
npm run check:syntax
npm run check:static
npm run check:modules
npm run check
```

### tools/check-js-syntax.js
Esegue `node --check` su tutti i file JavaScript locali.

### tools/static-audit.js
Verifica:
- presenza CSP;
- manifest PWA;
- icone locali;
- service worker;
- ordine corretto `safety_env.js` prima di `supabase_config.js`;
- configurazione Supabase runtime;
- assenza di `@apply` non processati;
- assenza di riferimenti a service_role nel frontend;
- conteggio warning per `onclick` inline;
- conteggio warning per assegnazioni `innerHTML`.

Genera:

`docs/REPORT_STATIC_AUDIT_STEP39.json`

### tools/smoke-modules.js
Controlla che ogni `loadModule('...')` richiamato da `index.html` abbia il corrispondente file in `modules/*.html`.

### GitHub Actions
Aggiunto:

`.github/workflows/static-checks.yml`

Il workflow esegue `npm run check` su push e pull request verso `main/master`.

## Nota
Gli `onclick` inline e gli `innerHTML` non vengono bloccati subito perché sono ancora molto diffusi nel progetto. Vengono tracciati come warning per una migrazione graduale.
