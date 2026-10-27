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

## Secondo intervento — stampe singole, attestati, ripristino sessione (27/10/2026)

### Difetti verificati nel sorgente
- Le stampe rapide, gli attestati multipli e gli attestati singoli programmavano una callback `async` senza `try/finally`. Errori durante `waitForPrintImages`, `window.print` o lo snapshot facoltativo potevano lasciare attiva `is-printing-temp` e l'area di stampa.
- Il rendering alternativo `renderPrintModuleToTemp` ripristinava `currentPrintModule`, `currentSessionCorsisti` e rimuoveva l'holder soltanto nel percorso di successo. Un errore di `updateAll` lasciava il contesto alterato.

### Correzioni implementate
- `js/modules/stampe_bundle.js`: cleanup in `finally` delle tre callback differite, con feedback in `catch`.
- La cattura `SafetyCorsistiAutoArchive.capture` nell'attestato singolo resta opzionale: un errore sincrono di avvio dell'archiviazione non impedisce `window.print`. La funzione di archiviazione continua a gestire autonomamente gli errori asincroni e la creazione delle bozze. Non sono state cambiate le policy, lo stato dei PDF o l'abilitazione facoltativa.
- Nel percorso legacy di `renderPrintModuleToTemp`, un `finally` elimina sempre l'holder e ripristina il contesto di stampa precedente.
- `tests/phase3_stampe_attestati.test.cjs`: 9 scenari di stampa (normale, errore immagini e `print` per ciascuna delle 3 modalità), avvio archiviazione fallito e 2 scenari per il fallback rendering. Test basati su mock, senza stampa fisica né scritture.

### Audit Supabase in sola lettura
Risultati aggregati alla verifica del 27/10/2026:
- 4 PDF nel fascicolo corsista: 4 bozze, 0 definitivi, 0 superati e 0 versioni successive; 4 collegati a progetti, 4 con azienda storica, 0 collegamenti progetto orfani. **Queste bozze non sono state promosse a definitive**; la classificazione richiede controllo amministrativo.
- Nessuna cancellazione, aggiornamento o accesso ai contenuti PDF eseguiti durante l'audit.
- Il vincolo `progetti.azienda_id` è ancora `ON DELETE CASCADE`; la proposta `RESTRICT` è documentata ma non applicata.

### Limiti del blocco
Verificare browser reale su desktop/iPhone per finestre stampa, salvataggio PDF, firme, numero pagine e leggibilità. Le prove automatiche controllano lo stato JavaScript in caso di errore e non sono una certificazione grafica/legale del contenuto dei PDF. SafetyTraining e database invariati.

## Terzo intervento — Versioni archiviate e ristampa storica (27/10/2026)

Anche con un archivio iniziale di soli quattro PDF, le regole di conservazione devono evitare stati incoerenti quando si aggiungeranno versioni.

### Problema risolto
La UI `newVersion(item)` proponeva `definitivo` se la versione precedente lo era; il salvataggio manuale `upload()` marcava sempre la versione precedente `superato` dopo l'INSERT della nuova, **anche quando quest'ultima era ancora una bozza**. In tal modo l'unica versione definitiva poteva perdere il suo stato prima della verifica della nuova.

### Comportamento introdotto
- Una nuova versione aperta dalla scheda parte **sempre come `bozza`**, senza ereditare lo stato della precedente.
- Se l'operatore sceglie esplicitamente `definitivo` durante un nuovo upload, viene chiesta una seconda conferma consapevole prima di caricare il PDF.
- L'upload di una nuova versione non aggiorna automaticamente `stato` della precedente, indipendentemente dallo stato del nuovo file. L'azione già presente **Segna superato** resta una scelta amministrativa esplicita.
- I PDF non sono stati riscritti. Percorso `storage_path` e metadati storici restano immutabili; le ristampe già usano un URL firmato a 90 secondi del file salvato.
- UI e feedback esplicitano che le versioni precedenti mantengono il proprio stato.

### Copertura test
Nuovo file `tests/phase3_archive_versions.test.cjs`: selezione versione più recente con stato bozza, upload bozza conservando precedente definitivo, conferma nuovo definitivo, annullamento della conferma senza scritture, ristampa tramite percorso storico esatto, gestione dell'errore di apertura. Sono test su mock, **non** prove con dati reali o browser iOS.

### Nota operativa
Potrebbero coesistere più versioni `definitivo` finché l'amministratore non marca quelle obsolete come `superato`. È intenzionale privilegiare la conservazione rispetto a riclassificazioni automatiche. Una transizione automatica *atomica* e un vincolo server-side per la gestione degli stati richiedono analisi e autorizzazione di una migrazione separata. Restano invariati SafetyTraining, documenti reali e vincoli DB.
