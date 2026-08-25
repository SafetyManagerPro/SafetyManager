# Step 43 - Cruscotto qualità corso / percorso guidato non bloccante

## Obiettivo
Aggiunta di un cruscotto qualità dentro i progetti formativi.

La checklist è volutamente **non bloccante**:
- non impedisce il salvataggio;
- non impedisce la stampa;
- non impedisce la chiusura;
- mostra solo suggerimenti e stati di avanzamento per la fase test.

## Dove compare
Il cruscotto viene mostrato:

1. in `Progetti Attivi`, sotto ogni progetto, prima dell'area corsisti;
2. nella visualizzazione mobile dei progetti;
3. nel popup di modifica progetto, sopra le segnalazioni.

## Aree controllate
Il cruscotto verifica sette aree:

1. **Dati progetto**
   - codice;
   - corso;
   - data inizio;
   - data verifica/fine;
   - modalità;
   - sede.

2. **Azienda / committente**
   - azienda collegata;
   - ragione sociale;
   - P.IVA / C.F.;
   - sede legale;
   - sede operativa;
   - ATECO;
   - referente.

3. **Docenti / unità didattiche**
   - presenza unità didattiche;
   - docente assegnato per ogni unità.

4. **Corsisti / attestati**
   - numero iscritti;
   - CF;
   - mansione;
   - ID certificato;
   - scadenza;
   - coerenza aziendale per datore di lavoro soggetto formatore;
   - limite partecipanti per corsi non e-learning.

5. **Compliance ASR / OP**
   - modalità coerente con il corso;
   - omogeneità aula;
   - ente validatore per DL soggetto formatore;
   - validazione ente;
   - iter OPRA/OPTA.

6. **Stampe / documenti**
   - fascicolo generabile;
   - presenza documenti firmati/scansioni collegate.

7. **Chiusura corso**
   - aperto;
   - svolto;
   - chiuso;
   - documenti collegati.

## Stati visuali
Sono usati solo stati informativi:
- `Completo`;
- `Da verificare`;
- `In corso`;
- `N/A`.

Non sono stati introdotti errori bloccanti.

## Azioni rapide
Ogni blocco contiene un pulsante rapido, ad esempio:
- apri dati progetto;
- apri azienda;
- apri docenti;
- gestisci corsisti;
- vedi compliance;
- stampa fascicolo;
- gestisci chiusura.

## Modifica popup
Le segnalazioni del popup sono state rese più coerenti con la fase test:
- colore ambra;
- testo `Segnalazioni non bloccanti`;
- nessun nuovo blocco al flusso operativo.

## File modificato
- `js/utils.js`
