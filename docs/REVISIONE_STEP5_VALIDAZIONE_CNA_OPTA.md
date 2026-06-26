# SafetyManager ASR2025 - Step 5 Validazione CNA / OPRA-OPTA

## Modifica funzionale
Quando in **Gestione Progetto** il soggetto formatore è **Datore di lavoro - solo propri dipendenti**, il progetto mantiene il datore di lavoro come soggetto formatore, ma aggiunge una fase obbligatoria di valutazione/validazione del percorso da parte di **CNA Artigiani Imprenditori D'Italia Avellino**.

La procedura prevista è:

1. Il datore di lavoro organizza il corso solo per propri lavoratori, preposti o dirigenti.
2. CNA Avellino prende in carico la valutazione del percorso formativo.
3. La valutazione riguarda programma, durata, docenza, modalità, destinatari, aula/campo prova, attrezzature/DPI e coerenza con i rischi aziendali.
4. CNA Avellino cura la comunicazione all'organismo paritetico competente, con riferimento a OPTA Avellino / OPRA Campania.
5. Esito, data validazione, comunicazione e riscontro OP vengono riportati in progetto formativo, fascicolo e documento dedicato.

## File modificati

- `modules/progetti.html`
- `js/utils.js`
- `js/digital.js`
- `modules/stampe.html`
- `modules/procedure.html`
- `modules/progetto_formativo.html`
- `modules/fascicolo_corso.html`
- `modules/richiesta_organismo_paritetico.html`
- `modules/validazione_percorso_formativo.html`
- `supabase/migrations/2026-06-26_step5_validazione_cna_opta.sql`

## Nuovi campi Supabase in `progetti`

- `ente_validatore`
- `ente_validatore_tipo`
- `validazione_ente_esito`
- `validazione_ente_at`
- `comunicazione_op_at`
- `organismo_destinatario`
- `note_validazione_ente`

## Nota
Le policy RLS non sono state attivate in questo step, come richiesto. Prima della produzione multiutente resta necessario attivare login, profili e policy.
