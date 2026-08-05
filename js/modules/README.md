# Moduli JavaScript - Step 23

Questa cartella contiene le prime funzioni estratte da `js/utils.js`.
Il caricamento resta tramite script classici nel browser, quindi tutte le funzioni continuano a essere esposte su `window`.

Ordine attuale:
1. `fabbisogni_rischi.js` — analisi fabbisogni, catalogo rischi di settore e allegati stampa Step 60
2. `rischi_settori_step68.js` — estensione documentata ATECO 2025/INAIL con 13 comparti aggiuntivi, fonti e controllo integrità catalogo
2. `gradimento_monitoraggio.js` — questionari cartacei, riepilogo e monitoraggio qualità Step 61
3. `tutor_riesame.js` — relazione finale tutor, riesame periodico e allegati stampa Step 62
4. `lingua_italiana.js` — test cartaceo, esito e correttore lingua italiana Step 63
5. `registri_multigiorno.js` — calendario giornaliero e registri presenze distinti Step 64
6. `documenti_condizionali.js` — dichiarazioni per tutti i docenti, conformità ente condizionale e tutor facoltativo Step 65
7. `scadenze.js`
8. `migrazione.js`
9. `archivio.js`
10. `stampe_bundle.js`
11. `backup.js`
12. `export_sezioni.js`
13. `collaudo.js`

Il prossimo refactoring consigliato è separare:
- `progetti.js`
- `corsisti.js`
- `aziende.js`
- `docenti.js`
- `stampe.js`
- `dashboard.js`
