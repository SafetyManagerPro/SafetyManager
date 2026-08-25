
# Step 29 - Stampe rapide, sede operativa azienda e preset CNA automatico

## Dettaglio azienda
Nel popup `Dettaglio azienda`, nella sezione `Progetti relativi all'azienda`, ogni progetto ora espone:
- `Apri progetto`;
- `Stampa progetto`;
- `Stampa attestati`.

La stampa progetto genera il documento `progetto_formativo` del progetto selezionato.  
La stampa attestati genera tutti gli attestati dei corsisti iscritti a quel progetto.

## Progetti Attivi
In `Progetti Attivi` è stato aggiunto il pulsante rapido `Stampa attestati`, separato dal pulsante `Fascicolo completo`.

## Anagrafica corsisti
In `Anagrafica Corsisti`, dentro `Corsi svolti`, ogni corso mostra anche:
- sigla/codice corso del catalogo;
- codice progetto;
- pulsante `Attestato` per stampare l'attestato del singolo corsista per quel progetto.

## Anagrafica aziende clienti
Nel form azienda:
- la dicitura `Referente Formazione` diventa `Referente formazione / Legale rappresentante`;
- aggiunto il campo `Sede Operativa`.

Il salvataggio usa il nuovo campo `sede_operativa`.  
È stata aggiunta la migration opzionale:

`supabase/migrations/2026-07-01_step29_sede_operativa_aziende.sql`

Se la migration non è ancora applicata, il sistema prova un salvataggio fallback senza `sede_operativa`, evitando blocchi immediati.

## Mio Ente Formatore
Nel modulo `Mio Ente Formatore` sono indicati automaticamente:
- logo `logocna.png`;
- timbro `timbrocna.png`.

Se l'ente è CNA Artigiani Imprenditori D'Italia Avellino, il sistema forza in memoria il logo e il timbro CNA per le stampe.

## File modificati
- `js/utils.js`
- `js/modules/stampe_bundle.js`
- `js/supabase_config.js`
- `modules/aziende.html`
- `modules/ente.html`
- `supabase/migrations/2026-07-01_step29_sede_operativa_aziende.sql`
