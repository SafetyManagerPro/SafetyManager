# SafetyManager ASR 2025 — Step 65

## Obiettivo

Correggere la produzione delle dichiarazioni del formatore-docente, rendere la dichiarazione di conformità dell’associazione coerente con il soggetto formatore effettivo e rendere facoltativa la presenza del tutor.

## 1. Dichiarazioni requisiti dei docenti assegnati

Il documento **Requisiti del Formatore-Docente in materia di Sicurezza sul Lavoro** non usa più soltanto il primo docente del corso.

Ora il sistema:

- legge le assegnazioni presenti in `docenti_ud`;
- individua tutti i docenti distinti assegnati alle unità didattiche;
- genera una dichiarazione separata per ogni docente;
- riporta nome e cognome, codice fiscale, luogo/data di nascita, qualifica, azienda di appartenenza e unità didattiche assegnate;
- richiama la firma del docente quando disponibile;
- evita duplicati se lo stesso docente è assegnato a più unità didattiche.

Per completare i dati è stato aggiunto in **Anagrafica Docenti** il campo:

`Luogo e data di nascita`

Nel caso di datore di lavoro/RSPP che forma i propri lavoratori, l’opzione dedicata viene selezionata soltanto se la qualifica del docente è coerente con tale ruolo; negli altri casi viene selezionata l’opzione del formatore qualificato.

## 2. Dichiarazione di conformità dell’associazione

La **Dichiarazione sostitutiva dell’atto di notorietà — Conformità Accordo Stato-Regioni n. 59/CSR del 17 aprile 2025** viene generata esclusivamente quando:

`Soggetto formatore = Associazione sindacale / ente di diretta emanazione`

Quando il soggetto formatore è:

`Datore di lavoro - solo propri dipendenti`

il documento:

- non viene mostrato come disponibile nel Centro Stampe;
- non viene generato nell’anteprima;
- non viene inserito nel PDF unico/fascicolo completo;
- mostra un messaggio esplicativo se richiamato da un’azione diretta.

## 3. Tutor facoltativo

In **Gestione Progetto → Relazione tutor e riesame/miglioramento** è stato aggiunto:

`Tutor previsto nel progetto? No / Sì`

Se impostato su **No**:

- i campi della relazione tutor restano nascosti;
- il pulsante di stampa della relazione è disattivato;
- la relazione non viene inserita nel fascicolo o nel PDF unico;
- il progetto e il fascicolo riportano `Tutor non previsto`;
- il cruscotto qualità non considera la relazione tutor come mancante.

Se impostato su **Sì**:

- compaiono i campi del tutor;
- la relazione può essere compilata e stampata;
- le due pagine della relazione vengono allegate al fascicolo e al PDF unico.

La **Scheda di riesame** resta indipendente perché è periodica e può essere applicabile anche senza tutor.

## 4. Centro Stampe e PDF unico

Nel Centro Stampe sono stati resi condizionali:

- `Requisiti Docenti`: attivo solo se sono presenti docenti assegnati;
- `Autocertificazione Requisiti Ente`: attiva solo se l’associazione è soggetto formatore;
- `Relazione Finale Tutor`: attiva solo se il tutor è previsto.

Il PDF unico indica nel riepilogo:

- numero di dichiarazioni docente generate;
- presenza o esclusione della dichiarazione dell’associazione;
- presenza o esclusione della relazione tutor.

## 5. Migration Supabase

Applicare:

`supabase/migrations/2026-07-30_step65_docenti_tutor_facoltativo.sql`

La migration aggiunge:

- `docenti.luogo_data_nascita`
- `progetti.tutor_previsto`

Per compatibilità, i progetti esistenti che hanno già `tutor_nome` vengono impostati automaticamente con `tutor_previsto = true`.

## 6. Controlli eseguiti

- sintassi JavaScript dei file modificati: OK;
- bilanciamento strutturale dei moduli HTML modificati: OK;
- test browser con due docenti distinti: generate 2 dichiarazioni complete;
- test soggetto formatore DL: dichiarazione associazione generata 0 pagine;
- test soggetto formatore ente: dichiarazione associazione generata 1 pagina;
- test tutor non previsto: relazione generata 0 pagine;
- test tutor previsto: relazione generata 2 pagine.

Il test browser locale ha segnalato soltanto l’assenza del client Supabase CDN nell’ambiente isolato di collaudo; la logica documentale locale ha completato correttamente tutti i controlli.
