# SafetyManager Pro — G9 segnalazioni iscrizioni uniformi
28 ottobre 2026. Intervento limitato a SafetyManagerPro/SafetyManager.

## Contratto dati
Le sole iscrizioni marcate `partecipazione_stato=non_partecipante` o `iscrizione_erronea` sono segnalate. Un progetto con una segnalazione mantiene regolari gli altri iscritti. `partecipazione_motivo`, `partecipazione_audit`, firme, documenti e PDF storici non vengono modificati.

## Ambiti corretti
- **Anagrafica Corsisti:** query paginata e fallback leggono il campo stato e motivazione; ogni corso segnalato diventa rosso, con stato esplicito; data rossa e pulsante Attestato assente.
- **Progetti:** dettaglio Corsisti e card mobile mantengono il segnale rosso; la vecchia renderizzazione fallback non propone nuove stampe ai segnalati.
- **Stampe / motore centrale:** controlli sullo stato prima di renderizzare attestati singoli, multipli, anteprime e comando di stampa; la generazione è bloccata in presenza di iscrizioni segnalate. Gli altri documenti amministrativi e i PDF storici restano disponibili.
- **Stampa libera Corsista:** corsi segnalati evidenziati e disabilitati nel selettore degli attestati.
- **Storico formativo:** record rossi distinti dalle certificazioni e informazioni storiche preservate.
- **Fascicolo PDF:** i corsi di origine sono segnalati, apertura/ristampa versioni storiche permessa; blocco del nuovo caricamento di un attestato relativo a iscrizione segnalata, anche da interfaccia di archiviazione automatica.
- **Scadenze:** righe evidenziate rosse con etichetta «Scadenza non valida».
- **Archivio / schede PDF / export XLS:** segnalazioni visibili nei corsi e righe; colonna di stato e motivazione in esportazione; i riferimenti storici restano consultabili e non vengono conteggiati come attestati ordinari.
- **Archivio avanzato:** card dei corsisti segnalati rosse, esclusi dal conteggio attestati idonei; export con stato esplicito.

Cache service worker prevista: v21. Nessuna migrazione Supabase, nessuna rettifica reale, nessuna modifica a SafetyTraining. Verificare CI, commit/deploy e collaudo visivo autenticato. Questo blocco riguarda la generazione nell'interfaccia: non annulla né revoca legalmente attestati precedentemente emessi e non sostituisce una procedura formale di rettifica.
