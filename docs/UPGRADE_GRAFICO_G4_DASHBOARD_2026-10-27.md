# SafetyManager Pro — G4: Dashboard grafica (27 ottobre 2026)

## Stato di partenza
L'utente ha confermato la visualizzazione **popup-only** della sezione Progetti e ha approvato il successivo upgrade con «perfetto. procedi con upgrade». G1–G3 rimangono operative.

La Dashboard `modules/admin.html` disponeva già di quattro KPI, quattro indicatori Step 67, azioni rapide, lista da fare, corsi operativi, salute sistema, Compliance Advisor. Il layer `js/modules/dashboard_pro.js` effettua già letture aggregati aziende/corsisti/docenti/progetti, progetti e iscrizioni, Step 67: **non duplicare** le chiamate in G4.

## G4 implementazione
- Aggiunta a `modules/admin.html` sezione compatta a due pannelli: **Panoramica dei progetti** e **Prossime verifiche e fine corso**.
- Creato `js/modules/graphic_upgrade_g4_dashboard.js`: donut CSS `conic-gradient`, legenda con barre e numeri; sei classi mutuamente esclusive derivanti **esclusivamente** dagli stati già calcolati dalla Dashboard: da verificare, da completare, da acquisire, pronti, chiusi, altri. Nessuna libreria esterna, nessun grafico di dati presunti.
- Calendario dei **prossimi 30 giorni inclusivi** a partire dalla data locale, usando `progetti.data_esame` dei progetti non chiusi. Mostra le prime cinque date ordinate, permette di aprire il progetto con la funzione `dashboardOpenProject` esistente; indica esplicitamente che NON sono scadenze normative (le scadenze reali restano nell'apposita sezione).
- `js/app.js` carica G4 tramite `loadOptionalSafetyScript` dopo la suite Dashboard e prima di `loadDashboardStats`. In `js/modules/dashboard_pro.js` **un solo hook facoltativo** inoltra `counts`, `projects` e `statuses` già disponibili. Try/catch nel hook evita di compromettere l'home se la visualizzazione G4 genera errori. Nessuna lettura Supabase aggiuntiva, nessun aggiornamento.
- CSS confinato al contenitore Dashboard G4, responsive e senza interferenze con le pagine di stampa. Accessibilità: testi numerici sotto il grafico, legenda semantica e pulsanti controllabili da tastiera.
- Protezione HTML: codici progetto, nomi azienda e corso escapati prima dell'inserimento nel DOM.
- Test `tests/graphic_g4_dashboard.test.cjs`: struttura di caricamento, stati, intervallo date, esclusione chiusi/passati, escaping, guardia navigazione progetto e fallback se il contenitore non è montato.

## Invarianti e limitazioni
- Conservati moduli Dashboard precedenti, tabelle corsi, KPI esistenti, Compliance Advisor, salute sistema e navigazione.
- Nessun intervento su Supabase, RLS, dati production, stampe, PDF, attestati, firme, SafetyTraining, né sulla paginazione archivio PDF in pausa.
- I conteggi del donut si riferiscono ai **progetti caricati**, potrebbero essere diversi dal conteggio globale di progetto nel database se il caricamento sorgente è incompleto; non presentare il grafico come revisione completa dello stato normativo.
- Date da `data_esame`, non scadenze legali di attestati o sorveglianza. Non sono state introdotte notifiche automatiche (nessun monitoraggio in background).
- Test mock/CI non sostituiscono collaudo admin autenticato desktop e iPhone.

## Collaudo manuale consigliato
1. Aprire Dashboard e verificare che donut, legenda e contatori siano coerenti con i progetti e la checklist.
2. Verificare il pannello «Prossime verifiche» e aprire da lì un progetto esistente.
3. Accertare che i pulsanti Progetti, Aziende, Corsisti, Scadenze, Stampe e Archivio siano ancora funzionanti.
4. Verificare che espandere pannelli Compliance/Controlli non cambi comportamento.
5. Provare da iPhone/tablet lo scroll, l'allineamento delle due sezioni e il pulsante Apri.
6. Nessuna creazione/modifica di record reali necessaria al collaudo della G4.
