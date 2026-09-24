# Motore normativo v1 — fondazione non distruttiva

Data applicazione: 24/09/2026

## Obiettivo
Aggiungere l'infrastruttura per ASR 2025 e D.Lgs. 81/08 senza modificare lo storico esistente e senza attivare controlli bloccanti.

## Stato dati prima/dopo
Conteggi verificati invariati:
- aziende: 31
- corsisti: 86
- docenti: 30
- progetti: 62
- iscrizioni: 122
- audit_log: 435

Progetti automaticamente mappati al nuovo motore: **0**.

## Nuove strutture
- normative_rule_sets
- normative_training_rules
- training_credits
- teacher_qualifications
- training_sessions
- session_attendance
- session_attendance_events
- training_effectiveness_checks

Aggiunti a progetti soltanto campi nullable per collegamento/versionamento normativo.

## Sicurezza
RLS abilitata su tutte le nuove tabelle con la stessa policy admin-only già usata dalle tabelle di produzione.

## Compatibilità
Nessun DROP, DELETE, UPDATE o backfill dei dati storici.
Il set ASR_2025 è creato in stato **draft**. Le regole corso verranno popolate e validate progressivamente prima di qualunque enforcement.
