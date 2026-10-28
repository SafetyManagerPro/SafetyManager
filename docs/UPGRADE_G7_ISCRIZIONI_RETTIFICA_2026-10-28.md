# G7 — Verifica storico e trasferimento iscrizione (28/10/2026)

## Scopo
Distinguere una registrazione amministrativa per errore da un percorso realmente svolto, senza cancellare prove formative.

## Dove consultare lo storico
- Corsisti: colonna «Corsi Svolti (Storico)». Pulsante con orologio «Formazione pregressa / crediti»: visualizza storico interno e consente di modificare/eliminare solo i record pregressi esterni gestiti separatamente.
- Corsisti: pulsante cartella «Fascicolo documentale»: PDF e versioni, indipendenti dalla correzione iscrizioni.
- Progetti → scheda corso → «Corsisti abbinati»: comandi Disiscrivi e nuovo «Verifica / trasferisci».
- Identificativo certificato ed esito «Idoneo» vengono assegnati automaticamente al momento dell'iscrizione: non sono prove di reale frequenza.

## Implementazione
- Nuovo script js/modules/iscrizioni_rettifica.js, accessibile dal pulsante «Verifica / trasferisci» in tab Corsisti del popup progetto, anche aperto da Archivio.
- Diagnostica read-only: controlla sei tabelle di evidenze (presenze, firme, test, completamenti, documenti archiviati, crediti), cinque campi di frequenza/verifica, stato corso e visibilità amministrativa. Mostra motivi puntuali di blocco. Errore di verifica significa blocco, non assenza di evidenza.
- Se priva di evidenze e con corso sorgente aperto: scelta del progetto di destinazione aperto e motivazione obbligatoria. Verifica duplicati, massimo corsisti, anagrafica e azienda formatrice.
- Un solo UPDATE della stessa iscrizione con condizione ID e progetto originale; rigenera snapshot azienda, dati storici corsista, ID certificato e scadenza mediante funzione esistente; registra origine/destinazione/motivo in note_verifica e audit attività. Nessuna cancellazione o copia di firme, presenze, test, documenti o crediti.
- Test regressione tests/iscrizioni_rettifica_transfer.test.cjs; index.html carica nuovo script, sw.js PWA v16; aggiornati vecchi test PWA.

## Sicurezza e limiti
- Record con prove, corso svolto/chiuso o verifica non disponibile: solo diagnosi, nessuna operazione di cancellazione/trasferimento.
- Per correggere prove reali serve rettifica amministrativa documentata e verificata, non cancellazione automatica.
- Il controllo client-side non è una transazione atomica contro scritture concorrenti: valutare in futuro RPC server-side in transazione, dopo revisione RLS/audit.
- Non toccati Supabase/schema/RLS, PDF, firme, SafetyTraining, attestati, dati reali in test.

## Collaudo
Progetti → corso → Corsisti abbinati → Verifica / trasferisci. Se protetto, controllare motivi e storici. Se davvero iscritto per errore senza evidenze, scegliere progetto aperto, motivare e confermare. Verificare elenchi aggiornati e anagrafica invariata.

## Deploy
PR, suite, merge e Vercel da registrare a rilascio.

### Protezione aggiuntiva (28/10)
Verifica anche firme, test, documenti archiviati e verifiche di efficacia collegate direttamente alla coppia corsista+progetto, anche se la FK iscrizione_id è NULL. In assenza di evidenze o in caso di query non disponibile resta la regola fail-closed. Stessa protezione aggiunta alla funzione di disiscrizione esistente. Non è stata eseguita alcuna cancellazione reale.
