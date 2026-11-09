# Documenti azienda / persona — Stampa e Condividi dalla finestra (9 novembre 2026)

Segnalazione: nella finestra "Stampa unica documenti" (e negli altri documenti azienda/persona) c'era solo
"Genera anteprima"; per stampare o inviare bisognava cercare "Ristampa documento visualizzato" nel pannello,
mentre il messaggio rimandava a un pulsante "Esegui Stampa" che non esiste.

Ora in fondo alla finestra ci sono tre pulsanti, per tutti i documenti (4 modelli storici, 9 documenti D.Lgs. 81/08, stampa unica):

- **Genera anteprima**: come prima;
- **Stampa**: genera e apre subito la stampa;
- **Condividi PDF**: genera e crea il PDF da scaricare o inviare (WhatsApp, email), come il pulsante Condividi.

Se mancano dati (es. nessun documento scelto nella stampa unica) compare l'avviso, la finestra resta aperta
e non parte nessuna stampa. I messaggi di anteprima pronta indicano i pulsanti reali.

File: `js/modules/documenti_azienda_lavoratore_ui.js` (`window.scdGenerateAnd`), testi in `..._catalogo.js` e `..._print.js`.
Test: `tests/documenti_azienda_stampa_diretta.test.cjs`. Banco di prova: stampa unica (3 documenti × 3 lavoratori = 9 pagine)
stampata e condivisa (PDF di 9 pagine), verbale consegna DPI e verbale art. 36 stampati dalla finestra, nessun errore.
