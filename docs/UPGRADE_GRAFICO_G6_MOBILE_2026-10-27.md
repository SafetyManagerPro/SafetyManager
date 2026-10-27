# SafetyManager Pro — G6 navigazione mobile e rifiniture (27 ottobre 2026)

## Autorizzazione
L'utente ha confermato che il fix Archivio popup, PWA v13 e layout G1–G5 funziona nel proprio browser («ok funziona»), e ha approvato di proseguire con «prosegui».

## Diagnosi
- `index.html` includeva 13 pulsanti nella navbar, con `#top-nav-buttons` a righe multiple e etichette `hidden xl:block`. Su smartphone rimanevano icone difficili da distinguere, rendendo la navbar alta e poco leggibile.
- `js/modules/layout_system.js` misura l'altezza della navbar e offset dell'app; G6 deve lasciare una **barra mobile compatta** e il menu a discesa fuori dal flusso dell'altezza, senza alterare la navigazione.
- Archivio e Scadenze hanno filtri e KPI già corretti, ma alcune dimensioni mobile e pulsanti sono inferiori agli obiettivi touch. La visualizzazione stampa su mobile ha un'anteprima di larghezza A4, da scorrere e NON scalare al punto di alterare i PDF.

## Modifica G6
- Creato `js/modules/graphic_upgrade_g6_mobile.js`, incluso alla fine di `index.html`: un solo pulsante **Menu** mobile (fino a 768px), menu a due colonne con nome delle sezioni, scroll interno del pannello e accessibilità `aria-expanded`, `aria-controls`, `aria-label`, `aria-current`. Nessun nuovo motore di navigazione: ogni pulsante conserva il proprio `onclick=window.loadModule(...)`.
- Menu chiuso dopo scelta, tocco esterno, `Escape` (con focus ripristinato) oppure passaggio a desktop; su desktop la navbar originale non cambia.
- Supporto ai comandi aggiunti in seguito (Installa PWA ed Esci) e al menu Impostazioni precedentemente privo di testo: etichette accessibili, osservazione SOLO del contenitore nav, senza observer dell'intero DOM.
- CSS scoped G6: navbar mobile compatta con dropdown assoluto che non moltiplica l'offset fisso; touch target dei comandi Archivio e Scadenze almeno 44px; select/input mobile 16px per evitare zoom Safari; 2 colonne mobile nei KPI Archivio e Scadenze; Scadenziario titolo adattivo; anteprima stampe con scroll e altezza mobile contenuta, senza alterarne la dimensione A4.
- `modules/scadenze.html`: solo `id="scadenze-stats-grid"` sull'aggregato KPI per una regola CSS selettiva. Nessuna modifica a script o dati scadenze.
- `sw.js`: `safetymanager-pwa-v14` e precache dello script G6 con versione; la strategia network-first per HTML/JS resta invariata.

## Regressione e invarianti
- `tests/graphic_g6_mobile_navigation.test.cjs`: test VM sintetici del menu aperto/chiuso, labels/aria, Esc/focus, click fuori, desktop invariato, link dinamici e single init, CSS per le 3 sezioni e PWA v14.
- Non toccati CRUD, filtri/ricerca/salvataggi, Supabase RLS, permessi, PDF, stampe, firme, attestati, Archivio popup-only, SafetyTraining o archivio PDF in pausa.
- G6 mobile menu non blocca la navigazione; i controlli antiperdita dati restano ai wrapper G2/G3/G5.

## Collaudo in produzione
1. Smartphone: navbar mostra **Menu** senza righe di icone; aprilo e verifica 13 sezioni leggibili, incluso **Impostazioni**.
2. Apri Archivio, applica filtri, apri e richiudi popup progetto: nessuna navigazione né perdita di filtri; il menu non copre il popup.
3. In Scadenze i 4 KPI devono comparire in due colonne e i filtri non devono ingrandire il browser durante focus.
4. In Centro Stampe i documenti continuano a stampare come prima; anteprima su telefono ha scroll orizzontale/verticale interno.
5. Desktop: barra originaria con icone e stesso ordinamento; la funzione Esci e Installa PWA restano operative.
6. Durante G6 non generare/eseguire operazioni reali su documenti, firme o utenti di produzione per verifiche automatiche.

## Stato deploy
Registrare qui esito GitHub Actions, squash merge su main e Vercel READY con SHA allineato appena effettuati. Il collaudo browser autenticato desktop/iOS resta distinto dai test mock.
