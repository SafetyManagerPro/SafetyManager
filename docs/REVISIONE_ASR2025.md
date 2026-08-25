# Revisione SafetyManager - ASR 17/04/2025 e D.Lgs. 81/08

## Obiettivo
La piattaforma gestisce progetti formativi in materia di salute e sicurezza sul lavoro, con due modalità di erogazione:

1. **Associazione sindacale di categoria / ente o struttura di diretta emanazione** come soggetto formatore.
2. **Azienda associata / datore di lavoro** come soggetto formatore diretto, solo per i propri lavoratori, preposti e dirigenti.

## Modifiche principali
- Distinzione esplicita del soggetto formatore nel form progetto.
- Campi progetto aggiunti/interfacciati: sede corso, responsabile progetto formativo, responsabile corso/tutor.
- Checklist ASR in fase di creazione progetto: 90% presenze, max 30 discenti salvo e-learning, rapporto pratico 1:6 ove previsto.
- Blocco iscrizione corsisti di aziende diverse quando il soggetto formatore è il datore di lavoro.
- Blocco oltre 30 iscritti nei corsi non e-learning.
- ID attestato dinamico sull'anno della verifica finale, non più hardcoded su 2026.
- Fascicolo corso ampliato con contenuti obbligatori e allegati consigliati.
- Attestato integrato con dicitura di validità nazionale.
- Verbale finale integrato con argomenti di colloquio/prova pratica e responsabile progetto.
- Configurazione Supabase resa più adatta a deploy Vercel tramite variabili runtime/localStorage; rimane necessaria RLS.

## Migrazione Supabase
Applicare `supabase/migrations/2026-06-24_asr2025_compliance.sql` da Supabase SQL editor dopo backup del database.

## Punti legali da verificare prima dell'uso reale
- Requisiti dell'associazione sindacale di categoria o della struttura di diretta emanazione.
- Eventuale autocertificazione DPR 445/2000 dei requisiti di rappresentatività.
- Richiesta agli organismi paritetici ove presenti per corsi organizzati dal datore di lavoro.
- Qualifica dei docenti ex DM 6 marzo 2013 o norme speciali per percorsi specifici.
- Ammissibilità della modalità e-learning/mista per il singolo percorso formativo.

## Nota schema Supabase
Il codice applicativo usa la tabella `enti` per l'anagrafica del soggetto formatore. Nel dump iniziale risulta anche una tabella `ente`: non è stata eliminata per evitare modifiche distruttive, ma va valutata come duplicato storico o tabella non usata.
