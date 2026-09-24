# Compliance Advisor — modalità non bloccante

Data: 24/09/2026

## Decisione di progetto
Le regole normative non bloccano salvataggi, stampe, attestati o chiusure.
Il motore distingue:
- informazione;
- avviso;
- avviso critico.

I blocchi rimasti nel form sono soltanto i dati tecnici minimi necessari a creare un record utilizzabile (azienda, corso, data inizio, sede).

## Implementazione
- nuovo modulo js/modules/compliance_advisor.js;
- pannello Compliance Advisor nella Gestione Progetto;
- confronto con le regole ASR_2025 già presenti in Supabase;
- prime mappature catalogo/regole per lavoratori, preposto, dirigente, datore di lavoro e aggiornamenti principali;
- verifica informativa di durata, periodicità, modalità, numero iscritti, frequenza e prerequisiti;
- corsi non ancora mappati continuano a funzionare e mostrano solo una informazione;
- possibilità di registrare una nota/presa visione separata dal progetto;
- normative_rule_sets.advisory_only è vincolato a true a livello database.

## Retrocompatibilità
Nessun progetto storico viene modificato automaticamente.
Nessun dato esistente viene cancellato o riscritto.
