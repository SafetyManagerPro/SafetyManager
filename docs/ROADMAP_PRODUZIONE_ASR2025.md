# Roadmap produzione SafetyManager ASR 2025

## Stato revisione 25/06/2026
La piattaforma è stata rafforzata in quattro aree:

1. **Soggetto formatore**: distinzione tra associazione/ente e datore di lavoro soggetto formatore.
2. **Compliance progetto**: check su frequenza 90%, massimo 30 discenti, rapporto pratiche 1:6, modalità di erogazione, omogeneità aula e Organismi Paritetici.
3. **Fascicolo corso**: checklist minima ASR, documenti consigliati, nuovo modello richiesta Organismo Paritetico, autocertificazione ente richiamata nel Centro Stampe.
4. **Supabase**: nuove migrazioni per campi compliance, documenti fascicolo, richieste OP, audit log e template ruoli/RLS.

## Passi prima del deploy pubblico

### 1. Database
Applicare in ordine:

- `2026-06-24_asr2025_compliance.sql`
- `2026-06-25_compliance_documentale.sql`
- `2026-06-25_roles_rls_template.sql` solo come preparazione ruoli; non abilitare le policy commentate finché non sono creati utenti/profili.

### 2. Supabase Auth e RLS
Prima di pubblicare il progetto su Vercel con dati reali:

- creare utenti Supabase Auth;
- popolare `public.profiles` con ruolo, ente_id e/o azienda_id;
- assegnare `ente_id` alle tabelle operative;
- testare le policy RLS con utenti di prova;
- solo dopo abilitare RLS sulle tabelle operative.

### 3. Storage documentale
Creare bucket privato Supabase Storage per fascicoli e documenti, preferibilmente:

- `fascicoli-corso`
- `docenti-requisiti`
- `attestati`

Poi collegare i file alla tabella `documenti_fascicolo`.

### 4. Validazione normativa
Prima dell’uso reale, far validare da consulente/legale:

- requisiti dell’associazione sindacale di categoria;
- autocertificazione DPR 445/2000;
- uso di strutture di diretta emanazione;
- gestione Organismi Paritetici;
- ammissibilità e-learning/videoconferenza per ogni corso;
- requisiti docenti generali e specifici per attrezzature/pratiche.

## Nota
L’applicazione è uno strumento gestionale e documentale: non sostituisce la responsabilità del soggetto formatore, del datore di lavoro, del responsabile del progetto formativo e dei docenti qualificati.
