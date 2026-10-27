# SafetyManager Pro — Fase 3, primo intervento su stampe e archivio
Data: 27 ottobre 2026
Ambito: SafetyManager Pro. SafetyTraining e database invariati.

## Perimetro e motivo
Il collaudo operativo Fase 2 è stato confermato dall'utente; l'intervento SQL progetti/aziende RESTRICT è solo una proposta review-only, non applicata.

Analizzando `js/modules/stampe_bundle.js`, la stampa `stampaFascicoloCompletoPDF` programmava una callback async per attendere le immagini e avviare `window.print()`. In caso di eccezione dentro la callback, le righe che eliminavano la modalità CSS `is-printing-temp` e svuotavano `#print-area-temp` non sarebbero state eseguite, con rischio di interfaccia bloccata e contenuto temporaneo residuo.

## Modifica effettuata
- `js/modules/stampe_bundle.js`: il codice differito di stampa ora usa `try/catch/finally`, così anche se l'attesa immagini o `window.print()` fallisce vengono sempre eliminate classe CSS e pagine temporanee. L'utente riceve un messaggio d'errore leggibile; in assenza di errori il normale comportamento di stampa non cambia.
- `tests/phase3_pdf_cleanup.test.cjs`: test deterministici su funzione reale isolata con DOM/window simulati: successo, errore caricamento immagini, eccezione nel print. Nessuna scrittura Supabase né PDF generato realmente dai test.
- Non modificati template, ordine del fascicolo, attestati, firme, numeri certificati, RLS, metadati storici o modalità di salvataggio PDF tramite dialogo browser.

## Verifiche ancora necessarie
- Eseguire una stampa PDF unico con immagini e firme reali da un progetto di prova; verificare ritorno alla UI.
- Provare stampe singole, attestati e fascicolo con test manuali (PDF unico non deve duplicarli); test con dispositivo mobile.
- Verificare archiviazione facoltativa e lettura PDF storici senza riscrivere snapshot.
- Analizzare gestione delle versioni in archivio e autorizzazioni prima di eventuali modifiche ai documenti.
- La protezione DB della FK progetti→aziende resta in attesa di autorizzazione e ambiente sicuro di collaudo.

Questo è il primo intervento circoscritto della Fase 3, NON la certificazione dell'intera Fase 3.
