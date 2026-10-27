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
