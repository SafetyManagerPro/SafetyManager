# Step 40 - Fix runtime/cache dopo Step 39

## Problema
Dopo gli hardening PWA/CSP/CI l'app poteva continuare a caricare file vecchi dal service worker/cache browser, oppure aggiornarsi in modo non immediato.

## Correzioni
- Service worker aggiornato a `safetypro-v40`.
- Registrazione service worker aggiornata con `sw.js?v=40`.
- Chiamata `reg.update()` all'avvio.
- Supporto `SKIP_WAITING` e reload una sola volta al cambio controller.
- Query string `?v=40` sui JS locali in `index.html`.
- Network-first/no-store per HTML/JS/CSS/moduli.
- Aggiunta funzione manuale:
  `window.clearSafetyProCache()`

## Uso in emergenza
Se online continua a caricare una versione vecchia, aprire console e lanciare:

```js
window.clearSafetyProCache()
```

oppure svuotare manualmente cache/service worker dal pannello Application del browser.
