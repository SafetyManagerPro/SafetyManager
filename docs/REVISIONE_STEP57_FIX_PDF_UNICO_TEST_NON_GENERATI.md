# Step 57 - Fix PDF unico progetto: test manuali non generati

## Problema rilevato
Quando si lanciava la stampa:

`PDF unico progetto + test/correttori`

da:
- Centro Stampe;
- Progetti;

la stampa non visualizzava o non generava il PDF contenente anche i test dei corsisti da erogare per la compilazione manuale.

## Causa tecnica probabile
I test manuali erano agganciati indirettamente al rendering del modulo `progetto_formativo`.

In alcuni flussi, soprattutto nella stampa massiva del PDF unico, questo aggancio indiretto poteva non produrre pagine visibili nel `print-area-temp`, oppure poteva essere saltato a causa delle opzioni passate tra:

- `renderPrintModuleToTemp()`;
- `renderPrintModulePages()`;
- `stampaFascicoloCompletoPDF()`.

## Correzione applicata
Nel PDF unico progetto i test non vengono più affidati solo al rendering indiretto del progetto formativo.

Ora vengono inseriti **esplicitamente** subito dopo le pagine del `Progetto Formativo`.

Flusso aggiornato:

1. carica dati progetto;
2. stampa `progetto_formativo` senza auto-test impliciti;
3. genera direttamente:
   - test manuale compilabile per ogni corsista;
   - correttore unico per valutatori;
4. continua con gli altri documenti del PDF unico.

## Funzione aggiunta
Aggiunta in `js/utils.js`:

`window.renderManualTestsForCurrentPrintProject(options)`

Questa funzione:
- recupera il corso corrente;
- recupera i corsisti del progetto;
- genera le pagine test manuali;
- restituisce pagine pronte da appendere alla stampa.

## Doppioni evitati
Nel PDF unico:
- `progetto_formativo` viene stampato con `includeProjectFormativoTests: false`;
- `fascicolo_corso` viene stampato con `includeFascicoloTests: false`;

perché i test vengono aggiunti una sola volta in modo esplicito.

## Stampa da Progetti
Il pulsante da Progetti usa sempre:

`stampaFascicoloCompletoPDF(projectId)`

Quindi riceve la stessa correzione del Centro Stampe.

## Verifica di sicurezza
È stato aggiunto un controllo finale:
- se i test non risultano nel pacchetto di stampa;
- il sistema prova a rigenerarli;
- se ancora non sono completi, mostra un avviso con conteggio test/correttori.

## File modificati
- `js/utils.js`
- `js/modules/stampe_bundle.js`
