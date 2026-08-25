# Step 46 - Linea gialla spessa tra progetti e cruscotto chiuso

## Richiesta
In `Progetti Attivi`:
- inserire una linea di separazione gialla spessa tra un progetto e quello seguente;
- lasciare il cruscotto qualità corso chiuso di default;
- permettere l'apertura solo all'occorrenza tramite freccia giù.

## Correzioni applicate

### 1. Cruscotto qualità sempre chiuso all'apertura della lista
In `loadProgettiTable()` viene resettato:

`window.projectQualityExpanded = {}`

Così ogni volta che la schermata progetti viene caricata/ricaricata, i cruscotti partono chiusi.

L'utente può aprirli manualmente con:

`Apri cruscotto`

e richiuderli con:

`Chiudi cruscotto`

### 2. Separazione gialla spessa desktop
Prima di ogni progetto viene inserita una riga separatrice molto evidente:

- barra gialla superiore spessa;
- contenitore con bordo giallo spesso;
- etichetta `Separazione progetto`;
- testo `Inizio progetto`;
- codice progetto;
- azienda;
- data.

### 3. Bordo progetto desktop
L'intero blocco del progetto ha ora:
- bordo sinistro giallo spesso;
- bordo destro giallo spesso;
- bordo inferiore giallo spesso.

Questo rende immediatamente visibile dove finisce un progetto e dove inizia il successivo.

### 4. Vista mobile
Anche la card mobile usa:
- margine superiore più marcato;
- bordo giallo spesso;
- barra gialla superiore.

## File modificato
- `js/utils.js`
