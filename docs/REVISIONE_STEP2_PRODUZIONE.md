# Revisione Step 2 - Produzione, ruoli e compliance ASR 2025

Data revisione: 25/06/2026

## Obiettivo

Questo step rafforza SafetyManager per un uso più vicino alla produzione, mantenendo il progetto compatibile con GitHub, Vercel e Supabase.

Le modifiche si concentrano su:

1. distinzione tra soggetto formatore associazione/ente e datore di lavoro;
2. gestione della richiesta agli Organismi Paritetici ove presenti;
3. controllo della modalità di erogazione corso per corso;
4. omogeneità dell'aula per mansioni, rischi e settore;
5. fascicolo corso e conservazione documentale;
6. preparazione di ruoli, profili e RLS Supabase.

## Modifiche applicate al front-end

### Progetti formativi

Nel modulo progetti sono stati aggiunti:

- sezione Organismi Paritetici;
- data invio richiesta;
- esito richiesta;
- data eventuale risposta;
- checkbox omogeneità aula;
- note libere di compliance;
- controllo automatico sulla modalità di erogazione.

Per i corsi con componente pratica, attrezzature, lavori in quota, ambienti confinati o emergenze, la piattaforma segnala come criterio prudenziale la presenza fisica. Per e-learning, videoconferenza o modalità mista, la piattaforma richiede tracciabilità, identificazione, interazione e verifiche compatibili con il corso.

### Stampe

Nel Centro Stampe sono stati aggiunti o rafforzati:

- Progetto formativo;
- Autocertificazione requisiti ente/soggetto formatore;
- Richiesta Organismo Paritetico;
- Verbale finale;
- Fascicolo corso/checklist archivio;
- Attestato con dati minimi e riferimento normativo.

### Controlli applicativi

Sono stati aggiunti controlli per evitare:

- corsi aziendali erogati a corsisti di aziende diverse;
- corsi pratici impostati in modalità non compatibile;
- progetto aziendale senza gestione della richiesta agli Organismi Paritetici;
- aule non omogenee senza motivazione nelle note.

## Modifiche Supabase

Sono state aggiunte due nuove migrazioni:

1. `2026-06-25_compliance_documentale.sql`
2. `2026-06-25_roles_rls_template.sql`

La prima aggiunge campi documentali e tabelle per fascicolo, richieste agli Organismi Paritetici e audit log.

La seconda prepara profili utente e ruoli applicativi:

- `super_admin`
- `ente_admin`
- `operatore_ente`
- `azienda_admin`
- `viewer`

Le policy RLS sono lasciate come template commentato, perché attivarle senza login Supabase Auth già configurato potrebbe bloccare l'applicazione attuale.

## Passaggi consigliati prima del deploy reale

1. Applicare le migrazioni Supabase in ambiente di test.
2. Attivare Supabase Auth.
3. Creare almeno un utente `super_admin` in `profiles`.
4. Collegare ogni utente a `ente_id` e/o `azienda_id`.
5. Solo dopo, abilitare RLS sulle tabelle operative.
6. Testare flussi completi: creazione progetto, iscrizione, stampa fascicolo, stampa attestati.
7. Validare con consulente sicurezza/lavoro la corretta posizione giuridica dell'associazione come soggetto formatore.

## Nota legale-operativa

Questa revisione non sostituisce una validazione legale. Il software aiuta a produrre e conservare documentazione coerente, ma l'idoneità del soggetto formatore, dei docenti, delle modalità di erogazione e dei contenuti resta responsabilità dell'ente/datore di lavoro.
