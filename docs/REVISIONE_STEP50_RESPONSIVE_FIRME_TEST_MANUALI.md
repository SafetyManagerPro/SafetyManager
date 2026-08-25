# Step 50 - Responsive video, firme attestati/stampe e test manuali progetto formativo

## 1. Visualizzazione più ampia e adattiva
È stata ampliata l'area visibile a video della webapp in base al dispositivo:

- PC desktop;
- schermi grandi;
- tablet;
- smartphone;
- sistemi operativi diversi, tramite regole CSS standard responsive.

Sono stati aggiunti override CSS per:
- `#app-content`;
- contenitori principali con classi `max-w-*`;
- tabelle/aree con scroll orizzontale;
- margini laterali più ridotti su tablet e smartphone.

L'obiettivo è usare meglio lo schermo disponibile senza restringere inutilmente le sezioni operative.

## 2. Firme su attestati e stampe
Negli attestati è stata rimossa la firma del `Docente Formatore`.

Ora il footer dell'attestato contiene:
- firma `Resp. Progetto Formativo`;
- timbro ente/erogatore;
- firma `Resp. Corso`.

Aggiornate anche le stampe principali collegate:
- `progetto_formativo.html`;
- `verbale.html`;
- `fascicolo_corso.html`.

Nei punti aggiornati non viene più usata la firma docente/formatore come firma finale del documento. Restano invece le firme di:
- responsabile progetto formativo;
- responsabile corso.

## 3. Test manuale nel Progetto Formativo
Nella stampa del `Progetto Formativo` sono state aggiunte automaticamente due pagine dopo il progetto:

1. `TEST MANUALE DA EROGARE AI CORSISTI`
   - test uguale per tutti i corsisti del corso richiamato;
   - domande a risposta multipla;
   - spazi per dati corsista e firma.

2. `TEST MANUALE - CORRETTORE PER VALUTATORI`
   - stessa traccia;
   - risposte corrette evidenziate;
   - indicazione di copia interna per valutatori.

Le domande vengono selezionate dal pool domande già presente in `js/data.js` in base al corso richiamato.

## 4. Stampa del progetto formativo
Quando si seleziona `Progetto Formativo` in Centro Stampe:
- l'anteprima mostra anche il test manuale e il correttore;
- `Esegui Stampa` stampa tutte le pagine, non solo la prima;
- il PDF unico progetto include anche queste pagine perché il Progetto Formativo le genera automaticamente.

## File modificati
- `index.html`
- `css/style.css`
- `modules/attestato.html`
- `modules/progetto_formativo.html`
- `modules/verbale.html`
- `modules/fascicolo_corso.html`
- `js/utils.js`
