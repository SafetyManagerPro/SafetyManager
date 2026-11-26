# Fix: "stampante non pronta" alla seconda stampa (26/11/2026)

## Problema
Da Corsisti e da Progetto, dopo aver stampato un attestato o un documento, aprendo subito un'altra stampa
Chrome mostrava "stampante non pronta" e non permetteva né il salvataggio PDF né la stampa.

## Causa
Con l'opzione "Archivia automaticamente quando stampo" attiva, `corsisti_autoarchivia_stampe.js` avvia
in sottofondo la conversione PDF (html2pdf + html2canvas). La conversione continua dopo la chiusura della
prima stampa e lascia nella pagina contenitori temporanei (`.html2pdf__overlay`, `.html2pdf__container`,
`iframe.html2canvas-container`) con una copia dell'intera app, non nascosti in stampa. La stampa successiva
li includeva e una seconda conversione partiva in parallelo: Chrome non riusciva a generare l'anteprima.

## Correzione (solo `js/modules/corsisti_autoarchivia_stampe.js`)
- In `@media print` vengono nascosti anche i contenitori temporanei di html2pdf/html2canvas.
- Le archiviazioni automatiche vanno in coda, una alla volta.
- La conversione PDF parte circa 1,5 s dopo l'apertura della stampa, non durante.

Nessuna modifica ad attestati, corsi, progetti o al database Supabase.

## Collaudo
1. Attivare "Archivia automaticamente…"; stampare un attestato da Corsisti, chiudere la stampa.
2. Aprire subito un altro documento: l'anteprima deve comparire e Salva/Stampa devono funzionare.
3. Ripetere da Progetto; verificare che entrambi i PDF risultino archiviati nel fascicolo.
