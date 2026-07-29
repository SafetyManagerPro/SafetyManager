# Moduli JavaScript - Step 23

Questa cartella contiene le prime funzioni estratte da `js/utils.js`.
Il caricamento resta tramite script classici nel browser, quindi tutte le funzioni continuano a essere esposte su `window`.

Ordine attuale:
1. `fabbisogni_rischi.js` — analisi fabbisogni, catalogo rischi di settore e allegati stampa Step 60
2. `gradimento_monitoraggio.js` — questionari cartacei, riepilogo e monitoraggio qualità Step 61
3. `scadenze.js`
4. `migrazione.js`
5. `archivio.js`
6. `stampe_bundle.js`
7. `backup.js`
8. `export_sezioni.js`
9. `collaudo.js`

Il prossimo refactoring consigliato è separare:
- `progetti.js`
- `corsisti.js`
- `aziende.js`
- `docenti.js`
- `stampe.js`
- `dashboard.js`
