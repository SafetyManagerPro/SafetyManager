
# Step 30 - Centro Stampe, Docenti e Fogli Progetti/Corsisti

## Centro Stampe
Nel menu `Seleziona Progetto Formativo` il testo ora mostra:
- iniziali/sigla corso;
- data corso/esame;
- ente formazione;
- azienda committente;
- codice progetto.

Formato indicativo:
`[SIGLA] DATA · Ente: ... · Committente: ... · CODICE`

## Anagrafica Docenti
Aggiunto campo:
- `Azienda di appartenenza`

Il campo viene salvato nel database docenti tramite la nuova colonna:
- `docenti.azienda_appartenenza`

Nel database docenti il valore è visibile nella tabella.

## Nuova sezione Fogli
Aggiunta nuova sezione:
- `Fogli Progetti / Corsisti`

La sezione mostra una vista grafica tipo foglio Excel:
- progetto formativo selezionabile;
- dati corso;
- ente formazione;
- committente;
- sede;
- elenco corsisti partecipanti;
- righe alternate evidenziate;
- pulsante stampa foglio.

## Stampa foglio progetto
Il pulsante `Stampa foglio` genera una stampa/PDF del foglio del progetto selezionato con tutti i corsisti partecipanti.

## Migration opzionale
Aggiunta migration:
`supabase/migrations/2026-07-01_step30_docenti_azienda_appartenenza.sql`

Da applicare per salvare stabilmente l'azienda di appartenenza dei docenti in Supabase.
