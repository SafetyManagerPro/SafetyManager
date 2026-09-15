# SafetyManagerPro — Normalizzazione layout 2026-09-15

## Obiettivo
Correggere in modo non distruttivo le incoerenze di impaginazione rilevate tra moduli: larghezze differenti, offset sticky non uniformi, pannelli laterali non scrollabili, sovrapposizioni tra toolbar/navbar/intestazioni tabella, modali fuori viewport e anteprima A4 tagliata.

## Punto di rollback
Prima delle modifiche è stato creato il branch:

`backup-pre-layout-normalization-2026-09-15`

Commit protetto:

`b46ee2bbf6932418fde34d079a3c591e81d030ef`

È stato creato anche `backup-pre-layout-normalization-2026-09-15-b` dalla stessa situazione corrente.

## Diagnosi confermata
1. Regole di larghezza concorrenti tra `max-w-7xl`, CSS globale di `index.html` e `workflow_guard.js`.
2. Il selettore `#app-content[data-safety-module] > div:first-child` non copriva i moduli che inseriscono un IMG loader come primo figlio.
3. Offset sticky diversi (`top-0`, `top-24`, `var(--nav-offset)`).
4. Aziende, Corsisti e Centro Stampe avevano card sticky lunghe senza area verticale affidabile di scroll.
5. `ui_refinements.js` rendeva sticky tutte le intestazioni tabella, comprese quelle dentro modali/wrapper di scroll.
6. La toolbar rapida mobile e gli header tabella usavano lo stesso offset sticky.
7. L'anteprima A4 del Centro Stampe era contenuta in un wrapper `overflow-hidden` e poteva essere tagliata.
8. Z-index e comportamento verticale delle modali non erano uniformi.

## Soluzione
Aggiunto `js/modules/layout_system.js` come livello unico e finale di normalizzazione grafica.

### Funzioni principali
- misura reale dell'altezza di `#top-nav` con `ResizeObserver`;
- aggiorna `--nav-offset` automaticamente quando il menu va su più righe;
- usa `div:first-of-type` per normalizzare la larghezza reale del modulo;
- rende statiche le toolbar rapide per eliminare conflitti di sovrapposizione;
- disattiva lo sticky globale indiscriminato delle intestazioni tabella;
- uniforma sticky + `max-height` + `overflow-y:auto` per Aziende, Docenti, Progetti, Corsisti e Centro Stampe su desktop;
- rende i pannelli normali/non sticky sotto 1024px;
- trasforma il viewport dell'anteprima stampe in area scrollabile e la centra solo quando c'è spazio sufficiente;
- uniforma scroll e z-index delle principali modali;
- mantiene inalterato il comportamento di stampa tramite regole separate `@media print`.

## File modificati
- `js/modules/layout_system.js` — nuovo
- `js/modules/professional_suite.js` — carica il sistema layout come ultimo livello

## File volutamente NON modificati
- `index.html`
- `js/utils.js`
- `js/modules/stampe_bundle.js`
- modelli di stampa esistenti
- firme
- database / Supabase / RLS

## Verifica richiesta
Dopo deploy verificare in sequenza:
1. Dashboard e Archivio: stessa larghezza degli altri moduli.
2. Aziende: form sinistro sticky e scrollabile senza finire sotto navbar.
3. Corsisti: form lungo scrollabile su desktop.
4. Docenti e Progetti: sticky coerente con altezza reale navbar.
5. Centro Stampe: menu sinistro scrollabile fino all'ultimo pulsante.
6. Centro Stampe: anteprima A4 accessibile anche su viewport stretta con scroll orizzontale.
7. Modali Quick Add e Gestione Iscritti: nessun taglio verticale e livelli corretti.
8. Tablet/mobile: pannelli laterali non sticky e nessuna sovrapposizione toolbar/tabella.

## Rollback
Se il nuovo sistema crea regressioni, riportare `main` al branch `backup-pre-layout-normalization-2026-09-15` oppure al commit `b46ee2bbf6932418fde34d079a3c591e81d030ef`.