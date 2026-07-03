
# Step 38 - Hardening PWA, CSP e manifest

## Suggerimenti Copilot recepiti
Questo step prosegue i suggerimenti di hardening relativi a:
- Content Security Policy;
- risorse CDN;
- manifest e icone PWA;
- service worker e caching.

## CSP
Aggiunta in `index.html` una Content-Security-Policy compatibile con l'app attuale.

La policy limita:
- `default-src` a `self`;
- `object-src` a `none`;
- `frame-ancestors` a `self`;
- `connect-src` a dominio Supabase e websocket Supabase;
- script solo da self e CDN attualmente usate.

Nota: restano temporaneamente `unsafe-inline` e `unsafe-eval` perché il progetto usa ancora onclick inline e Tailwind CDN. Andranno rimossi quando si passerà a bundler/build locale.

## CDN
Aggiunto `crossorigin="anonymous"` agli script CDN.
Non sono stati inseriti attributi `integrity` fittizi: per SRI reale bisogna vendorizzare le librerie o calcolare hash sulle versioni esatte.

## Manifest e icone
Rimosse icone remote Wikimedia da `manifest.json`.
Aggiunte icone locali:
- `icon-192.png`
- `icon-512.png`
- `icon.png`

Aggiornato anche `apple-touch-icon`.

## Service worker
Aggiornato `sw.js` a `safetypro-v38`.

Strategia:
- network-first per HTML, JS, CSS e moduli, per evitare deploy bloccati da cache vecchia;
- cache-first per asset statici locali;
- nessuna cache forzata su CDN/Supabase.

## Nota futura
Per hardening massimo, prossimo step consigliato:
- vendorizzare librerie CDN in `/vendor/`;
- eliminare onclick inline;
- rimuovere `unsafe-inline`/`unsafe-eval` dalla CSP;
- introdurre build Vite/Rollup.
