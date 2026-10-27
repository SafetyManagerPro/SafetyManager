# SafetyManager Pro — Upgrade grafico G1 + G2 (27 ottobre 2026)

## Autorizzazione e perimetro
L'utente ha approvato con «procedi» il promemoria grafico G1/G2, chiedendo di mettere in pausa la paginazione dell'archivio PDF. Questo intervento riguarda **solo SafetyManager Pro**, non SafetyTraining.

## Architettura scelta
Esistono già moduli anagrafici e controlli di persistenza consolidati in `js/utils.js`. Si introduce un **layer UI progressivo**, `js/modules/graphic_upgrade_g1_g2.js`, caricato in `index.html` dopo `js/app.js`. Se il layer non si carica, i moduli HTML originali e i salvataggi continuano a funzionare.

### G1 — stile uniforme e non invasivo
- Superfici, bordi, ombre e tipografia più coerenti; miglioramento dello stato focus per tastiera; evidenza della navigazione attiva, righe di tabella e controlli.
- CSS limitato alle aree applicative; media query per dispositivi piccoli, per stampa e preferenza `prefers-reduced-motion`.
- Nessun override dei popup nativi `alert` / `confirm`, delle stampe e degli attestati.

### G2 — finestre per Corsisti e Aziende
- In ciascuna sezione viene aggiunto un pulsante **Nuovo corsista / Nuova azienda**. Il form originale (stessi nodi e ID) viene **spostato**, non clonato, in un popup con intestazione, scroll verticale e pulsante di chiusura; il relativo spazio laterale viene liberato per l'elenco.
- Le funzioni originali `modificaCorsista` e `modificaAzienda` popolano gli stessi input e aprono il popup con la scheda esistente. I salvataggi `salvaCorsistaDB` e `salvaAziendaDB` restano originali: il wrapper rileva il reset riuscito e chiude il popup; se il salvataggio non effettua reset, il popup resta aperto.
- Se ci sono modifiche non salvate, chiudere o cambiare sezione richiede conferma; durante un salvataggio sono impedite chiusura e navigazione.
- Focus sul primo campo, ripristino del focus precedente, `Escape` e gestione `Tab` per tastiera.
- Gestione cleanup del DOM prima di una normale navigazione e del login, senza permanenza di vecchi moduli.
- Restano i popup relazioni aziendali, i filtri globali e la paginazione anagrafica esistente.

## Non cambiato
Database Supabase, RLS, permessi, stampa, PDF, firme, dati e funzioni di eliminazione, endpoint REST, logiche server-side e SafetyTraining. Nessuna migrazione.

## Test
`tests/graphic_g1_g2.test.cjs` valuta il codice eseguito con DOM simulato: form riutilizzato, nuova scheda, modifica, chiamata al salvataggio legacy, chiusura dopo reset, protezione modifiche non salvate, annullamento della navigazione e navigazione verso Dashboard. Il controllo statico verifica caricamento dello script dopo l'app base e assenza di chiamate DB dirette.

## Collaudo manuale richiesto
- Desktop: Corsisti → Nuovo, Modifica, Annulla, salvataggio valido/non valido, ricerca e scelta filtro. Ripetere in Aziende.
- iPhone: apertura e chiusura popup, scroll fino ai campi finali, tastiera virtuale, operazioni con un solo campo modificato.
- Dal popup Relazioni aziendali aprire un corsista e verificare apertura scheda corretta anche oltre la prima pagina.
- Controllare che PDF, firme, Stampe e dashboard siano immutati.
- Se possibile testare sessione scaduta / logout con popup aperto.

La CI non sostituisce il collaudo browser autenticato. L'upgrade grafico completo oltre G2 (G3–G5, temi scuri, dashboard e notifiche avanzate) richiederà fasi distinte.