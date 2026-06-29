# Step 20 - Consolidamento Progetti Attivi, performance e mobile

## Obiettivo
Lo step 20 consolida il lavoro fatto fino allo step 19 senza aggiungere nuove funzioni scollegate.
Il focus è rendere `Progetti > Progetti Attivi` più stabile, veloce e usabile su PC, tablet e smartphone.

## Miglioramenti principali

### 1. Caricamento iscritti in batch
Prima la vista progetti caricava gli iscritti progetto per progetto.
Ora è stata aggiunta la funzione:

`window.getIscrizioniPerProgetti(progettoIds)`

che carica tutte le iscrizioni dei progetti in una sola query Supabase e le raggruppa per `progetto_id`.

Vantaggi:
- meno chiamate al database;
- migliore velocità con molti progetti;
- migliore esperienza su smartphone/tablet e connessioni lente.

### 2. Progetti Attivi responsive
La vista desktop mantiene la tabella scura con corsisti inline.
Su smartphone viene renderizzata una vista a card verticali:
- codice progetto;
- data esame;
- stato progetto;
- corso evidenziato;
- azienda evidenziata;
- corsisti sotto al progetto;
- massimo 4 corsisti visibili;
- pulsante `Di più` / `Mostra meno`.

### 3. Dashboard e Archivio ottimizzati
Anche i controlli dashboard e l'archivio corsi usano la mappa batch delle iscrizioni quando disponibile.

### 4. Filtri coerenti
Il filtro in `Progetti Attivi` ora considera il gruppo progetto completo:
- riga progetto;
- area corsisti desktop;
- card mobile.

## File modificati
- `js/supabase_config.js`
- `js/utils.js`
- `modules/progetti.html`

## Nota tecnica
È stato mantenuto un fallback `window.buildIscrizioniMapFallback()` nel caso in cui il batch non fosse disponibile.
