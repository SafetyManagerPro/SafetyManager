# Moduli JavaScript - Step 23

Questa cartella contiene le prime funzioni estratte da `js/utils.js`.
Il caricamento resta tramite script classici nel browser, quindi tutte le funzioni continuano a essere esposte su `window`.

Ordine attuale:
1. `fabbisogni_rischi.js` — analisi fabbisogni, catalogo rischi di settore e allegati stampa Step 60
2. `gradimento_monitoraggio.js` — questionari cartacei, riepilogo e monitoraggio qualità Step 61
3. `tutor_riesame.js` — relazione finale tutor, riesame periodico e allegati stampa Step 62
4. `lingua_italiana.js` — test cartaceo, esito e correttore lingua italiana Step 63
5. `registri_multigiorno.js` — calendario giornaliero e registri presenze distinti Step 64
6. `scadenze.js`
7. `migrazione.js`
8. `archivio.js`
9. `stampe_bundle.js`
10. `backup.js`
11. `export_sezioni.js`
12. `collaudo.js`

Il prossimo refactoring consigliato è separare:
- `progetti.js`
- `corsisti.js`
- `aziende.js`
- `docenti.js`
- `stampe.js`
- `dashboard.js`
