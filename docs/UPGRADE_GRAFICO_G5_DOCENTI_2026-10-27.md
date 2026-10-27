# SafetyManager Pro — Upgrade grafico G5 (27 ottobre 2026)

## Autorizzazione e contesto
L'utente ha confermato «perfetto, prosegui» dopo G4 Dashboard (main `9724ac9069e8cc59d06a941424c73a9ea0596dbe`). G1–G4 rimangono inalterate. La G5 interviene in prima battuta su **Docenti**, sezione ancora con form in sidebar.

## Analisi conservativa
- `modules/docenti.html`: form originale `#form-docente` dentro `#docente-form-card` e `#docente-form-col`, con documenti identità, codice fiscale e firma anche manuale. Tabella a fianco e card mobile già implementate.
- `js/utils.js`: `modificaDocente`, `resetFormDocente` e `salvaDocenteDB` sono funzioni **asincrone**; il salvataggio richiama il reset solo dopo `saveDocente(record)` con esito true. La UI non deve anticipare la conferma di successo o duplicare il record.
- `js/modules/graphic_upgrade_g1_g2.js` gestisce le anagrafiche Corsisti/Aziende; G3 Progetti usa popup dedicato; G4 Dashboard usa già dati in memoria.
- `responsive_table_performance.js` gestisce le card mobile derivate dalla tabella: nessuna modifica al renderer per evitare regressioni.

## Intervento G5
- Nuovo layer `js/modules/graphic_upgrade_g5_docenti.js`, caricato dopo G1–G3 dall'`index.html`.
- **Docenti popup-only**: aggiunge «Nuovo docente» sotto il titolo; sposta `#docente-form-card` nel popup mantenendo lo stesso nodo/form, inserisce un commento segnaposto nella posizione originale per ripristino su navigazione/logout. La sidebar vuota viene nascosta e la tabella occupa il 100% dello spazio.
- Wrapper non distruttivi sulle funzioni asincrone esistenti: nuovo docente aspetta il reset; modifica aspetta la popolazione del form, compresa la selezione aziendale; salvataggio aspetta funzione legacy e il reset del form, chiudendo il popup **soltanto se il reset avviene**. Errore/salvataggio rifiutato: popup resta aperto.
- Escape, click fuori e pulsante X con conferma delle modifiche non salvate; cambio pagina avvisa; la navigazione è bloccata durante salvataggio. Tab/Shift+Tab rimane nel dialog, focus iniziale e ripristino focus precedente, scroll mobile con altezza massima viewport.
- Il pulsante «Annulla» preesistente nel modulo chiude il popup dopo reset; se il contenuto era modificato chiede conferma. Upload documenti e firma manuale continuano a usare i metodi originali senza nuovi flussi o dati.
- CSS scoped al modulo, comandi minimo 42–44px, responsive/mobile, supporto reduced motion e stampa.

## Test e verifica
`tests/graphic_g5_docenti.test.cjs`: sintassi/script, identità del form, nuovo docente asincrono, chiusura solo dopo reset riuscito, fallimento salvataggio, modifica asincrona, conferme e annullamento, navigazione, logout, assenza di nuovi accessi DB.

### Collaudo umano necessario
Aprire Docenti, verificare elenco full width; «Nuovo docente», X/Annulla, scroll di tutti i campi; Modifica un docente reale (senza necessariamente salvare); la sezione documenti/firma e l'anteprima devono funzionare. Provare da iPhone. Testare salvataggio soltanto se opportuno con record di prova gestito dall'amministratore, NON con record produttivi fittizi introdotti dall'assistente.

## Vincoli / backlog
- Nessuna modifica Supabase/schema/RLS/storage, stampa, attestati, stato corsi, archivio PDF o SafetyTraining.
- G5 include miglioramento Docenti e usabilità mobile. Non implica redesign completo di TUTTE le schermate.
- Da verificare CI, PR/merge e Vercel a chiusura attività.
- Le ulteriori rifiniture trasversali dopo G5 richiedono revisione e collaudo incrementali.
