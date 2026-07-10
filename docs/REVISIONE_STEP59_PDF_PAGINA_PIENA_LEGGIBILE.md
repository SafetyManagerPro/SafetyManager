# Step 59 - PDF a pagina piena e test manuali leggibili

## Problema
La visualizzazione del PDF risultava in scala/ridotta e le pagine dei test non erano leggibili.
In particolare, i test manuali da 30 quesiti erano troppo compressi e non occupavano correttamente l'intera pagina.

## Correzione principale
È stata rivista la formattazione PDF per usare le pagine in dimensione reale:

- A4 verticale: `210mm x 297mm`
- A4 orizzontale: `297mm x 210mm`

Sono stati rimossi gli effetti di riduzione:
- `transform` forzati;
- `zoom` alterati;
- scale interne in stampa;
- rotazioni per le pagine orizzontali.

## Test manuale
Il layout dei test manuali è stato rifatto.

Ora ogni pagina test:
- è A4 orizzontale pieno;
- usa un contenitore interno `manual-test-inner`;
- occupa tutta la pagina;
- usa una griglia da 3 colonne x 10 righe;
- contiene 30 quesiti;
- ha caratteri più leggibili;
- usa tutto lo spazio disponibile invece di apparire miniaturizzata.

## Preview
Per i test manuali è stata eliminata la miniaturizzazione interna della pagina.
La preview può scorrere, ma la pagina non viene rimpicciolita nel suo contenuto.

## CSS di stampa
Aggiunto blocco dedicato in `index.html`:

`STEP 59 - PDF leggibile a pagina piena, senza riduzioni/rotazioni`

che forza:
- pagina piena;
- niente transform;
- niente zoom ridotto;
- layout A4 reale;
- pagine test landscape nel flusso normale.

## File modificati
- `index.html`
- `js/utils.js`
- `js/modules/stampe_bundle.js`
