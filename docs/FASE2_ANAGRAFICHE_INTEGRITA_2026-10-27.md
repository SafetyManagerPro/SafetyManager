# SafetyManager Pro — Fase 2: anagrafiche e integrità storica (primo blocco)
Data: 27 ottobre 2026
Ambito: esclusivamente SafetyManager Pro, repository SafetyManagerPro/SafetyManager, branch main.
Nessuna modifica a SafetyTraining e nessuna operazione SQL di scrittura o migrazione dei dati di produzione.

## Interventi completati
1. **Controllo fiscale aziendale**: `window.normalizzaIdentificativoAzienda` gestisce maiuscole, separatori e equivalenza fra `IT` seguito da 11 cifre e le 11 cifre senza prefisso, in coerenza con il trigger SQL `guard_aziende_fiscal_duplicate` già presente. `checkAziendaIdentificativoDuplicato` interroga il database (paginato a blocchi di 500) e non confonde errori di rete/RLS con un risultato negativo. Esclude il record in modifica e confronta la proprietà `ente_id`. Il trigger resta arbitro finale della collisione, anche per concorrenza.
2. **Messaggi di salvataggio**: `saveAzienda` restituisce `false` e conserva `lastAziendaSaveError` con motivo comprensibile; `salvaAziendaDB` lo visualizza in caso di fallimento, senza azzerare il form.
3. **Eliminazioni azienda protette**: `getAziendaDeleteImpact` verifica in lettura i collegamenti a `progetti`, `corsisti`, `corsisti_rapporti_azienda`, `iscrizioni`, `corsisti_documenti_archivio` (azienda snapshot), `richieste_organismi_paritetici` e `training_effectiveness_checks`. Se esistono riferimenti o una query di controllo fallisce, `deleteAzienda` si ferma prima del comando DELETE; UI spiega i collegamenti anziché avvertire che verranno eliminati automaticamente tutti i progetti. Per aziende senza legami, la cancellazione diretta è ancora possibile previa conferma.
4. **Fascicolo aziendale più leggero**: `apriPopupRelazioniAzienda` legge azienda, progetti e corsisti già filtrati per ID azienda (massimo 1000 per categoria), invece di caricare tutti i progetti e i corsisti. Timeout a 15 secondi, errore recuperabile con «Riprova». Rimane la stessa interfaccia e lo stesso collegamento alle iscrizioni.
5. **Navigazione fascicolo → corsista**: `openCorsistaFromAziendaPopup` recupera l'identità richiesta per ID, apre Corsisti, imposta ricerca su CF/nominativo su **tutto il database** (stato `tutti`, nessun filtro d'azienda o corso) e soltanto dopo apre il form del corsista. Non dipende più dalla prima pagina da 20 e non si affida a un timeout di 350 ms.
6. **Inserimento rapido e paginazione**: in Anagrafica Corsisti, dopo il salvataggio rapido si ricarica la pagina correntemente filtrata, senza sovrascrivere `corsistiList` con tutti i nominativi. Nei Progetti il roster completo rimane disponibile per l'iscrizione immediata e per la scelta del partecipante.

## Stato dati e riservatezza
- Sole query SQL di ricognizione, nessuna scrittura al database: al controllo di questa fase circa 45 aziende e 115 corsisti.
- Verifica aggregata: 0 gruppi di aziende con PIVA duplicata dopo normalizzazione semplice; 1 coppia preesistente di corsisti con CF normalizzato coincidente. **Non unire né eliminare automaticamente** quella coppia perché sono presenti riferimenti storici.
- Regole esistenti su documenti e fascicoli, accesso admin, PWA, stampe libere e PDF invariati.
- Non cambiare `iscrizioni.azienda_storica_id` o i metadati PDF storici quando cambia l'azienda attuale di un corsista.
- Sono stati mantenuti i trigger server-side anticollisione fiscali; il controllo client è ausiliario e non garantisce l'unicità sotto concorrenza.

## Test e verifica
- Nuova suite `tests/phase2_anagrafiche.test.cjs`, eseguita dalla pipeline GitHub Actions già configurata: normalizzazione fiscale, duplicati, esclusione ID in modifica, errore RLS non nascosto, preflight che non scrive se duplica, guard di eliminazione con storici, impossibilità di eliminare in caso di errore di lettura, eliminazione solo in assenza di legami, apertura corsista dopo paginazione e conservazione lista da 20 nel quick-add.
- Sintassi `new Function` verificata per i JS modificati. Risultati della CI su `main` e Vercel production da confermare sull'ultimo commit.
- **Non ancora certificato il collaudo end-to-end autenticato** di tutte le operazioni reali e delle stampe/PDF da iPhone/desktop. Nessuna preview Vercel isolata su un database di prova: non effettuare test con scritture su produzione.

## Limiti e passaggi di approfondimento della fase 2
- La protezione DELETE introdotta agisce nel client SafetyManager; valutare in una successiva modifica uno specifico vincolo server-side `RESTRICT`/trigger con valutazione dei riferimenti esistenti, dopo aver analizzato tutti i flussi di amministrazione. Non è stato aggiunto deliberatamente un nuovo trigger in questa fase.
- Il fascicolo aziendale limita la visualizzazione a 1000 progetti/1000 corsisti: adeguare a paginazione interna se i volumi dovessero aumentare.
- La pre-verifica fiscale aziendale scorre record autorizzati fino a una soglia di sicurezza; per una piattaforma multi-ente molto più grande, considerare un controllo normalizzato a livello database e policy RLS verificate.
- Test di navigazione fascicolo → Corsista anche per nominativi omonimi, CF assente e record archiviati. La ricerca è specifica per CF quando presente e usa il nome come fallback.
- Completa fase 2 solo dopo convalida del flusso di salvataggio azienda, scelta corsista da fascicolo, cancellazione azienda vuota e blocked deletion con riferimenti; poi valutare consolidamento del codice anagrafico in moduli autonomi. Non proseguire automaticamente alla fase 3.


## Secondo blocco — controllo percorsi alternativi e navigazione esatta (27/10/2026)

**Autorizzazione:** proseguire nella Fase 2. Non avviata Fase 3.

### Modifiche implementate
- **Inserimento rapido Azienda:** `window.salvaQAAzienda()` non scrive più direttamente con `supabaseClient.from('aziende').insert()`, ma passa da `window.saveAzienda()`, riutilizzando normalizzazione fiscali, controllo duplicati e messaggi leggibili. Dopo creazione aggiorna il selettore azienda Progetti senza perdere il record creato e ricarica la vista Aziende quando già aperta. Le denominazioni nel selettore sono escaped.
  - Commit codice: `20d974b819bb`.
- **Corsista collegato dal fascicolo Azienda:** una vista mirata usa `corsistiPageState.focusId` e filtra sul database con `eq('id',focusId).range(0,0)` prima di qualsiasi altro filtro. Funziona con omonimi, CF assente e corsisti archiviati; l'interfaccia mostra **Scheda corsista collegata** con pulsante **Mostra tutti**. Ricerca globale e rubrica A–Z disattivano il focus. Nessuna iscrizione o scheda viene riscritta.
  - Commit codice: `fe35bd48a491`.
- **Modifiche azienda multi-ente:** quando `record.id` è presente ma `ente_id` non è incluso nel form, `saveAzienda()` legge lo scope effettivo della scheda prima di verificare i duplicati. Evita false collisioni fiscali con un ente differente; errori di lettura interrompono la scrittura anziché indurre false rassicurazioni. Trigger server-side invariato.
  - Commit codice: `eec5985c8d36`.
- Suite regressione `tests/phase2_anagrafiche.test.cjs` estesa per inserimento rapido unificato, query diretta ID, uscita dal focus, e modifica multi-ente; test con database e DOM simulati, senza scritture sui dati reali. Commit principali `8a570e4906dd`, `7dfe275dae77`.

### Audit SQL di sola lettura
- 45 aziende, 115 corsisti; 117 rapporti storici riferiti a 115 persone.
- 0 riferimenti orfani rilevati: aziende attuali dei corsisti, aziende negli storici, corsisti negli storici e aziende dei progetti.
- Confermata l'esistenza di `corsisti_documenti_archivio.azienda_storica_id`, già inclusa nella protezione dell'eliminazione dal client.
- **Rischio architetturale residuo da gestire con una proposta di migrazione separata:** FK `progetti.azienda_id → aziende.id` definita `ON DELETE CASCADE`. L'interfaccia corrente impedisce cancellazioni quando ci sono progetti/collegamenti; tuttavia una DELETE bypassando il frontend potrebbe ancora attivare la cascata. Le altre FK verso aziende sono `SET NULL` o `RESTRICT`. Non è stata modificata alcuna FK in questo blocco per evitare cambiamenti irreversibili di comportamento senza test completi.
- Nessuna mutazione Supabase, dati anagrafici, corsi, documenti o RLS.

### Qualità e rilascio
- GitHub Actions suite: `7dfe275dae77` **completed/success**, con anche i test esistenti di Fase 1.
- Vercel produzione: `7dfe275dae77` **READY**; runtime errors nei 30 minuti controllati: nessuno segnalato.
- Rimane indispensabile una verifica autenticata reale desktop/mobile dei form, delle aziende con storico, dei fascicoli e della navigazione omonimi/archiviati. I test con mock non equivalgono al collaudo manuale.
- Non iniziare la Fase 3 senza approvazione esplicita; SafetyTraining non toccato.


## Terzo blocco — conteggi non validi e sicurezza delle cancellazioni (27/10/2026)

- `getAziendaDeleteImpact` ora interpreta conteggi `null`, assenti, negativi o non interi come **verifica non riuscita**, non come zero riferimenti: in questi casi `deleteAzienda` non invia alcuna DELETE.
- Aggiunti test di regressione per tutte e sette le relazioni gestite, inclusi i PDF storici, e per conteggi incompleti. I test utilizzano mock e non cancellano dati veri.
- **Limite intenzionale:** un count `0` restituito da una policy RLS che nasconde righe è indistinguibile da una tabella senza riferimenti. Per garantire la protezione anche fuori dal browser occorre intervenire sul vincolo FK nel database e/o introdurre una verifica server-side con autorizzazioni esaminate. Non basta il controllo client.
- **Proposta da validare separatamente, NON applicata:** sostituire in `progetti.azienda_id` la FK `ON DELETE CASCADE` con `ON DELETE RESTRICT` dopo aver inventariato riferimenti, trigger, permessi, flussi di amministrazione, backup e procedura di rollback. Provare in un ambiente di staging isolato; mantenere invariati storici e documenti.
- Nessuna migrazione SQL o modifica alle tabelle in produzione in questo blocco. Per chiudere la Fase 2 restano test autenticati desktop/iPhone e verifiche end-to-end (salvataggio, lookup da fascicolo, eliminazione azienda vuota, blocco azienda collegata, stampe/PDF). Fase 3 non avviata e SafetyTraining invariato.

## Quarto blocco — collaudo confermato dall'utente e review FK (27/10/2026)

**Collaudo operativo:** l'utente ha comunicato «collaudo fatto» e autorizzato a proseguire. Questo conferma il test da parte dell'operatore; non equivale all'esecuzione di una suite end-to-end autenticata indipendente né garantisce copertura di tutti gli scenari.

**Audit database in sola lettura (Supabase SafetyManagerPro):**
- 45 aziende e 81 progetti; zero progetti con `azienda_id` nullo e zero progetti con riferimento azienda orfano alla verifica.
- La FK `progetti_azienda_id_fkey` è `ON DELETE CASCADE`, validata e NOT DEFERRABLE.
- Numerose tabelle (iscrizioni, documenti fascicolo, test digitali, firme, ecc.) dipendono dai progetti e alcune hanno `ON DELETE CASCADE`: un'eliminazione diretta di azienda potrebbe propagarsi ai progetti e ai dati collegati.
- Gli storici che riferiscono direttamente alle aziende usano anche `SET NULL` o `RESTRICT`; non dichiarare protetti tutti i legami solo tramite il cambio della FK progetti.
- Non esiste un progetto Supabase *staging SafetyManager* autonomo fra quelli accessibili. SafetyTraining e DVR non vanno usati per test di SafetyManager.

**Preparazione tecnica (senza applicazione SQL in produzione):**
- Proposta revisionabile in `supabase/manual/FASE2_REVIEW_ONLY_progetti_azienda_delete_restrict_2026-10-27.sql`. È un intervento atomico con guard sulle caratteristiche della FK, verifica degli orfani, `lock_timeout`, `statement_timeout`, `ON DELETE RESTRICT` e validazione immediata.
- Test statici di struttura in `tests/phase2_fk_proposta.test.cjs`; non equivalgono a prova reale PostgreSQL.
- Prima dell'applicazione reale servono approvazione specifica della migrazione, backup verificato e test in ambiente isolato. In questa fase nessun vincolo in produzione è stato cambiato, né sono stati modificati record/documenti.
- Da ricontrollare dopo l'eventuale applicazione: tipo FK r/RESTRICT, conteggio progetti invariato, creazione/modifica progetto, eliminazione azienda *con* progetto bloccata, eliminazione azienda *senza* riferimenti consentita se ammessa dalle altre protezioni.
- Allarme indipendente emerso dagli advisor Supabase: protezione contro password compromesse disabilitata in Auth. Non modificarla nell'intervento anagrafiche; pianificare separatamente con amministratore.
