# Step 58 - Fix reale PDF unico progetto + test/correttori

## Problema
La stampa `PDF unico progetto + test/correttori`, sia da Centro Stampe sia da Progetti, non mostrava/generava correttamente le pagine dei test manuali dei corsisti.

## Analisi
Sono stati trovati due punti critici.

### 1. CSS di stampa A4 orizzontale errato
Nel CSS inline di `index.html` le pagine con classe `landscape-force` erano gestite con:

- rotazione `rotate(-90deg)`;
- `position:absolute`;
- `top:0`;
- `left:0`.

Questo faceva sì che tutte le pagine orizzontali, inclusi i test manuali, potessero sovrapporsi in alto alla stampa o uscire dal flusso normale delle pagine PDF.

Risultato: i test potevano essere generati nel DOM, ma non apparire correttamente nel PDF.

### 2. Refresh anteprima durante la stampa
`caricaDatiStampa()` poteva rilanciare l'anteprima se esisteva `currentPrintModule`.

Durante la stampa del PDF unico questo poteva creare una corsa asincrona:
- il PDF stava preparando le pagine;
- contemporaneamente l'anteprima poteva ricaricare il modulo;
- il flusso di stampa poteva perdere o alterare pagine generate.

## Correzioni applicate

### Fix CSS stampa landscape
Sostituita la vecchia logica `position:absolute + rotate`.

Ora le pagine test orizzontali:
- restano nel normale flusso di stampa;
- usano A4 landscape;
- non vengono sovrapposte;
- non vengono spostate fuori pagina.

Aggiunta classe specifica:

`manual-test-page`

con regole dedicate.

### Fix race condition anteprima/stampa
`caricaDatiStampa()` ora accetta:

`{ suppressPreviewRefresh: true }`

La stampa PDF unico chiama:

`caricaDatiStampa(progId, { suppressPreviewRefresh: true })`

così l'anteprima non parte mentre il PDF unico si sta costruendo.

### Forzatura pagine test nel print area
Prima di appendere le pagine al `print-area-temp`, le pagine test vengono normalizzate:

- `print-show`
- `temp-page`
- `landscape-force`
- `manual-test-page`

e vengono forzati:
- `display:block`;
- `position:relative`;
- `transform:none`;
- dimensioni A4 landscape.

### Diagnostica
Il `print-area-temp` ora riceve:
- `data-blank-tests`
- `data-corrected-tests`

e in console viene scritto il conteggio:
- pagine totali;
- test manuali corsisti;
- correttori;
- numero corsisti.

## Flusso finale corretto
Quando si lancia `PDF unico progetto + test/correttori`:

1. carica dati progetto senza refresh anteprima;
2. crea il progetto formativo;
3. inserisce esplicitamente i test manuali dei corsisti;
4. inserisce il correttore;
5. stampa gli altri documenti;
6. appende tutto al `print-area-temp`;
7. apre la stampa PDF.

## File modificati
- `index.html`
- `js/utils.js`
- `js/modules/stampe_bundle.js`
