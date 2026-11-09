# Fix fase 3 — menu principale (9 novembre 2026)

## Problema (audit del 9/11/2026)

- A 1366 px e anche a 1920 px il menu andava su due righe (155 px, il 20 % dell'altezza di un portatile) e il logo era tagliato in alto.
- Sotto i 1280 px (tablet, telefono in orizzontale) le voci erano solo icone, senza nome, su due righe.
- Strumenti tecnici (Migrazione, Collaudo) e la voce disattivata "Procedure in pausa" occupavano la barra principale.

## Cosa cambia

| Larghezza | Prima | Dopo |
| --- | --- | --- |
| da 1600 px | due righe, icone + nomi | una riga, icone + nomi |
| 1280–1599 px | due righe | una riga, solo nomi |
| sotto 1280 px | due righe di sole icone (menu a tendina solo sotto 768 px) | menu a tendina "Menu" con icone e nomi |

- Altezza del menu: 69 px a tutte le larghezze (prima 155 px sui portatili).
- Migrazione e Collaudo non stanno più nella riga da 1280 px: restano nel menu a tendina, nelle scorciatoie "Backup" e, per Collaudo, nella barra scorciatoie di Impostazioni.
- "Procedure in pausa" nascosta ovunque; il modulo resta nel codice.

| File | Modifica |
| --- | --- |
| `index.html` | blocco CSS `min-width: 1280px` (una riga, niente a capo), soglia icone a 1600 px, voci tecniche nascoste nella riga |
| `js/modules/graphic_upgrade_g6_mobile.js` | regole del menu a tendina spostate da 768 a 1279 px; le regole di pagina per telefoni restano a 768 px |
| `js/modules/ui_refinements.js` | scorciatoia Collaudo in Impostazioni |

## Verifica

- `npm run check`, `npm test` (170 test, inclusi 3 nuovi in `tests/menu_una_riga_fase3.test.cjs`).
- Banco di prova a 1920, 1600, 1440, 1366, 1280, 1279, 1024, 844 e 375 px: una sola riga senza voci fuori schermo da 1280 px; menu a tendina con 14 voci, tutte con nome, sotto i 1280 px; logo intero.
- Pagine e popup su 375, 1024, 1366 px: nessun errore, nessuna sovrapposizione; titolo pagina a 163 px su portatile (prima 249 px).
