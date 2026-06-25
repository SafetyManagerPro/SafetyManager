# Step 3 — Firme tablet, test digitali e fascicolo locale

Questa versione aggiunge il modulo **Procedure** per usare tablet/smartphone con dito, Apple Pencil o penna capacitiva.

## Funzioni aggiunte

- Registro presenze digitale: firma entrata/uscita mattina e pomeriggio.
- Test digitale: compilazione guidata, correzione automatica, firma allievo, salvataggio esito.
- Firme extra documento: docente, responsabile progetto, responsabile corso, legale rappresentante, datore di lavoro, valutatore o altro.
- Export fascicolo corso: cartella locale quando supportata dal browser, ZIP completo come fallback.

## Nota legale

La firma implementata è una firma elettronica semplice/grafica con metadati tecnici e hash SHA-256. È utile per registro presenze, presa visione, test e fascicolo interno, ma non sostituisce una firma elettronica avanzata, qualificata o digitale se una procedura specifica la richiede.

## Supabase

Applicare la migrazione:

```sql
supabase/migrations/2026-06-25_firme_test_fascicolo_digitale.sql
```

Tabelle aggiunte:

- `firme_digitali`
- `test_digitali`
- `export_fascicoli`

Le RLS sono volutamente non attivate. Si attivano nello step successivo insieme a Supabase Auth, profiles e policy per ente/azienda.
