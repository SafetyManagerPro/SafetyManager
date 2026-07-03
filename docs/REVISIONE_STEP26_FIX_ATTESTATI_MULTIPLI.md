
# Step 26 - Fix stampa attestati multipli

## Errore corretto
Quando un progetto/corso conteneva più corsisti, la stampa/anteprima degli attestati poteva generare o mantenere correttamente solo un attestato, oppure sovrascrivere i dati dei corsisti già preparati.

## Causa tecnica
La funzione `updateAll()` aggiorna globalmente tutti gli elementi con classi `.val-*` presenti nel DOM.
Durante la stampa massiva, se le pagine già generate venivano appese subito a `#print-area-temp`, il rendering del corsista successivo poteva sovrascrivere i dati delle pagine già preparate.

## Correzione
- Aggiunto rendering isolato con `renderPrintModulePages()`.
- Aggiunto rendering multiplo attestati con `renderAttestatiMultipli()`.
- La stampa degli attestati ora crea tutte le pagine in memoria e le appende al DOM solo alla fine.
- La stampa del fascicolo completo ora prepara tutti i documenti e tutti gli attestati in memoria prima di appenderli alla stampa.
- L'anteprima `Attestato` ora mostra un blocco per ogni corsista iscritto, con etichetta del nominativo.

## Risultato
Per un corso con N corsisti, il sistema genera:
- N attestati completi;
- fronte e retro per ogni attestato;
- dati corsista corretti per ogni pagina;
- fascicolo completo con tutti gli attestati, non solo il primo/ultimo.
