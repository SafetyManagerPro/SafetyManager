# G8 — Stati iscrizioni e Corsisti integrati (28/10/2026)

- Iscritto, Non partecipante, Iscrizione erronea: stato amministrativo separato dall'esito formativo, motivazione obbligatoria, audit storico append-only con admin/timestamp, ripristino motivato.
- Trigger SECURITY INVOKER e RLS admin preesistente: blocca marcatura anomala se ci sono presenze, firme, test, documenti, crediti o verifiche.
- Progetti: rimosso pulsante Apri corsisti dal riepilogo, elenco direttamente visibile e richiudibile con details su desktop/mobile. Evidenza rossa individuale e motivazione in scheda. Comandi Verifica / trasferisci e Segnala stato.
- Popup Corsisti e Gestione iscritti: azione di segnalazione disponibile. Nuovi attestati individuali di segnalati bloccati; stampa cumulativa bloccata se include segnalati. PDF storici invariati.
- Migration applicata prima della pubblicazione frontend: 20261028150902_iscrizioni_partecipazione_stato_audit_g8.sql.
- Test non scrivono dati reali. Richiesti collaudi autenticati desktop/mobile e valutazione successiva di un'RPC transazionale per G7.
