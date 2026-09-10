# Step Stampe / PDF stabilizzate

## Obiettivo

Stabilizzare il motore di stampa di SafetyManager PRO dopo la correzione delle firme, intervenendo senza cambiare le policy Supabase e senza riscrivere i template documentali.

## File modificato

- `js/modules/firme_unificate.js`

Il modulo viene già caricato all'avvio dell'app, quindi è stato usato anche come punto di installazione dello stabilizzatore stampe.

## Cosa è stato aggiunto

### 1. CSS di stampa centralizzato

Viene iniettato un foglio stile dedicato con:

- pagina A4 portrait reale;
- pagina A4 landscape reale;
- gestione separata per `.doc-page`, `.manual-test-page`, `.landscape`, `.landscape-force`;
- rimozione forzata di transform, rotate, scale e zoom in fase di stampa;
- mantenimento di firme e slot firma visibili.

### 2. Preparazione centralizzata delle pagine

Nuova funzione:

```js
window.prepareSafetyPrintContainer(root)
```

La funzione:

- applica le firme risolte nel contenitore;
- normalizza le dimensioni delle pagine;
- rimuove classi di anteprima come `scale-[0.8]` e `origin-top`;
- imposta portrait/landscape in modo coerente;
- evita interruzioni pagina sbagliate sull'ultima pagina.

### 3. Attesa immagini più robusta

La funzione `window.waitForPrintImages` ora prepara prima il contenitore e poi attende il caricamento delle immagini, comprese firme, logo e timbro, con timeout di sicurezza.

### 4. Protezione del comando stampa

Il comando `window.print()` viene avvolto in modo leggero: prima della stampa prova sempre a preparare `#print-area-temp` e ad aggiungere la classe `is-printing-temp`.

### 5. Aggancio alle funzioni di stampa esistenti

Lo stabilizzatore prova ad agganciarsi a:

- `stampaFascicoloCompletoPDF`
- `stampaAttestatiProgetto`
- `stampaAttestatoCorsista`
- `stampaSoloAttestatiPDF`
- `stampaModuloProgettoRapido`
- `stampaProgettoFormativoDaProgetto`

### 6. Diagnostica

Nuova funzione:

```js
window.auditSafetyPrint()
```

Restituisce in console:

- numero pagine;
- pagine portrait;
- pagine landscape;
- test manuali;
- slot firma totali;
- firme risolte;
- slot firma vuoti.

## Regole mantenute

- Le firme restano gestite dal risolutore unificato.
- Se una firma non è disponibile, lo slot firma resta visibile e vuoto.
- Berardino Pesce resta abilitato anche come Responsabile del Corso.
- Non è stata cambiata la struttura del database.
- Non è stata cambiata la sicurezza/RLS Supabase.

## Cosa testare manualmente

1. Centro Stampe → anteprima attestato.
2. Centro Stampe → PDF solo attestati.
3. Progetti → stampa attestato singolo.
4. PDF unico progetto.
5. Test manuali landscape.
6. Verifica che firme, logo e timbro non spariscano nel PDF.

## Nota cache

Dopo il deploy Vercel, fare `Ctrl + Shift + R` prima del test per evitare di usare la vecchia versione JavaScript in cache.
