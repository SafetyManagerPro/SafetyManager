# Moduli JavaScript - Step 23

Questa cartella contiene le prime funzioni estratte da `js/utils.js`.
Il caricamento resta tramite script classici nel browser, quindi tutte le funzioni continuano a essere esposte su `window`.

Ordine attuale:
1. `fabbisogni_rischi.js` — analisi fabbisogni, catalogo rischi di settore e allegati stampa Step 60
2. `gradimento_monitoraggio.js` — questionari cartacei, riepilogo e monitoraggio qualità Step 61
3. `tutor_riesame.js` — relazione finale tutor, riesame periodico e allegati stampa Step 62
4. `lingua_italiana.js` — test cartaceo, esito e correttore lingua italiana Step 63
5. `scadenze.js`
6. `migrazione.js`
7. `archivio.js`
8. `stampe_bundle.js`
9. `backup.js`
10. `export_sezioni.js`
11. `collaudo.js`

Il prossimo refactoring consigliato è separare:
- `progetti.js`
- `corsisti.js`
- `aziende.js`
- `docenti.js`
- `stampe.js`
- `dashboard.js`
