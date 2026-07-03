
# Step 36 - Hardening suggerimenti Copilot/GitHub

## Fonte
Sono stati recepiti i suggerimenti caricati nel file `Cosa da fare safety manager.txt`.

## Applicato subito

### 1. app.js - catch loadModule
Il blocco `catch` di `window.loadModule()` ora usa sempre la variabile corretta `error` e normalizza il messaggio con fallback.

### 2. Supabase config hardcoded
Rimosse dal sorgente:
- URL Supabase reale;
- anon key reale.

Ora la configurazione viene letta da:
- `window.SAFETY_SUPABASE_URL`
- `window.SAFETY_SUPABASE_ANON_KEY`
- oppure `localStorage`, solo per test locali.

Sono state aggiunte funzioni di utilità:
- `window.setSafetySupabaseConfig(url, anonKey)`
- `window.clearSafetySupabaseConfig()`

È stato aggiunto:
- `js/safety_env.example.js`
- `.gitignore` per non committare file/env locali.

## Nota operativa
Dopo questo step, per usare Supabase in locale occorre impostare la configurazione.

Esempio console browser:
```js
localStorage.setItem('SAFETY_SUPABASE_URL', 'https://xxxxx.supabase.co')
localStorage.setItem('SAFETY_SUPABASE_ANON_KEY', 'ey...')
location.reload()
```

In produzione è preferibile iniettare:
```js
window.SAFETY_SUPABASE_URL = '...'
window.SAFETY_SUPABASE_ANON_KEY = '...'
```

### 3. CSS @apply
Rimosse le direttive `@apply` non processate da `css/style.css` e sostituite con CSS puro:
- `.btn-tab`
- `.btn-tab.active`
- `.input-field`

## Rimandato a step successivo
I punti SRI/CSP, refactor onclick/innerHTML, PWA caching avanzato e bundler sono consigliati ma richiedono una revisione più ampia per evitare regressioni.
