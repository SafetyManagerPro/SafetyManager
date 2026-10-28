# SafetyManager Pro — Disiscrizione corsista dal corso (28 ottobre 2026)

## Segnalazione
Utente: «Ho un problema, non mi fa disiscrivere un corsista che per errore ho messo in un corso. Come devo fare?»

## Diagnosi
- Pulsanti esistenti `window.rimuoviIscrizione(id,projectId)` in Progetti / gestione iscritti (icone `user-minus`). Il popup Progetti «Corsisti abbinati» mostrava solo dati, **senza pulsante Disiscrivi**.
- In `js/supabase_config.js` l'API `deleteIscrizione` eseguiva `.delete().eq('id',id)` e ritornava `true` se non c'era errore: con RLS può restituire **0 righe senza errore**. La UI non mostrava motivi di insuccesso, quindi il pulsante poteva sembrare non funzionante.
- Ispezionato in Supabase *solo lo schema/metadata*, senza leggere, modificare o cancellare dati dei corsisti. Tabella `iscrizioni`: RLS admin; `session_attendance` FK ON DELETE RESTRICT; `firme_digitali`, `test_digitali`, `course_completion_items` FK ON DELETE CASCADE; `corsisti_documenti_archivio`, `training_credits` FK ON DELETE SET NULL. Una cancellazione indiscriminata potrebbe perdere firme/test/verifiche o scollegare documenti e crediti.
- `buildIscrizioneRecord` genera automaticamente `id_certificato` e imposta `esito:'Idoneo'` alla semplice iscrizione: **non** usarli come prova di corso realmente completato o come vincolo alla disiscrizione.

## Correzione applicativa, nessuna migrazione
- `js/supabase_config.js`: `deleteIscrizione` controlla l'esistenza visibile della riga, verifica i conteggi esatti delle sei tabelle dipendenti; se la verifica fallisce, o ci sono evidenze, o frequenza/test/pratica registrati, o il progetto è chiuso, **non cancella** e imposta `window.lastIscrizioneDeleteError`.
- Per un'iscrizione erronea priva di evidenze, DELETE sulla sola riga in `iscrizioni`, con `.select('id')` e conferma che la riga realmente eliminata abbia l'ID richiesto. Zero righe non viene più dichiarato successo.
- `js/utils.js`: messaggio di errore visibile, avviso esplicito che anagrafica e altri corsi restano invariati, blocco dei doppi click, feedback su ricaricamento lista; la tab «Corsisti abbinati» del popup ha pulsante **Disiscrivi** per ogni iscrizione e aggiorna l'elenco dopo la rimozione.
- Nessuna scrittura diretta da parte dell'assistente in produzione. Nessuna modifica Supabase, RLS, trigger, vincoli, storico, PDF, firme, attestati, SafetyTraining o dati corsista.
- Test `tests/iscrizioni_unenroll_safe.test.cjs`: iscrizione erronea senza evidenze, RLS/non esistente/zero righe, sei FK dipendenti, corso chiuso, dati frequenza registrata, disponibilità pulsante e nessuna navigazione.

## Limiti importanti
- Il controllo applicativo degli allegati precede la DELETE (non è transazione atomica). Le FK continuano a proteggere `session_attendance`. Non invocare cancellazioni su record storici o con evidenze senza una procedura dedicata e tracciata.
- Se un'iscrizione bloccata risulta effettivamente errata ma ha prove già collegate, occorre prima un'indagine amministrativa, non eliminare direttamente evidenze. Mai aggirare le policy RLS.

## Collaudo manuale
1. Aprire Progetti e la scheda del corso; tab «Corsisti abbinati».
2. Individuare il corsista erroneamente iscritto e premere «Disiscrivi», confermare.
3. Verificare che scompaia dall'elenco iscritti del corso, restando nell'Anagrafica Corsisti e senza alterare altre iscrizioni.
4. In presenza di evidenze o problemi RLS, confermare che venga mostrato messaggio dettagliato e non siano cancellati dati.
5. Eseguire un test di cancellazione reale soltanto con il record specifico che l'amministratore vuole effettivamente disiscrivere; i test CI non cancellano dati.

## Stato
Da registrare PR, GitHub Actions main, deploy Vercel e collaudo nel browser autenticato.
