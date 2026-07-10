# Step 54 - Test manuale 30 quesiti e firme in posizioni controllate

## Richiesta
1. Il `TEST COMPILATO DAL CORSISTA` non deve più essere digitale.
2. Per ora va tolto il test digitale perché non c'è supporto per firma digitale.
3. Il test da stampare deve essere il `TEST MANUALE DA EROGARE AI CORSISTI`.
4. Il test manuale deve avere **30 quesiti su un foglio**.
5. Ricontrollare le posizioni delle firme automatiche di:
   - Pesce Berardino;
   - Centrella Alberto;
   perché comparivano in punti casuali dei fogli.

## Correzioni Centro Stampe / PDF unico progetto

### Test digitale disattivato
Nel PDF unico progetto è stata rimossa la generazione delle pagine digitali:
- `TEST COMPILATO DAL CORSISTA`;
- `TEST CORRETTO / SOLUZIONI` da test digitale;
- lettura `localStorage SafetyManager.digitalTests.v1`;
- lettura eventuale tabella `test_digitali`.

Per ora il PDF unico usa solo il test manuale cartaceo.

### Test manuale 30 quesiti
Il test manuale viene generato dalla stampa del `Progetto Formativo`.

Ora il sistema crea:
1. `TEST MANUALE DA EROGARE AI CORSISTI - 30 QUESITI`
2. `TEST MANUALE - CORRETTORE PER VALUTATORI`

Ogni pagina è:
- A4 orizzontale;
- una sola facciata;
- 30 quesiti;
- 3 colonne;
- stesso test per tutti i corsisti del corso richiamato.

Il correttore ha le risposte corrette evidenziate.

## Correzione firme automatiche

### Problema precedente
Le firme automatiche venivano inserite ogni volta che trovavano un nome compatibile, anche in zone non destinate alla firma, ad esempio:
- intestazioni;
- riepiloghi;
- box informativi;
- campi descrittivi.

### Nuova logica
Le firme vengono inserite **solo** dentro slot firma espliciti:

`auto-signature-slot`

Ogni slot dichiara:
- ruolo firma;
- da quale nome leggere il firmatario.

Esempi:

```html
<div class="auto-signature-slot"
     data-signature-role="resp_progetto"
     data-signature-name-selector=".val-resp-progetto"></div>
```

### Ruoli gestiti
- `resp_progetto`
- `resp_corso`
- `docente`
- `legale`

### Posizioni controllate
Sono stati aggiunti slot firma nei documenti principali:
- attestato;
- progetto formativo;
- verbale;
- fascicolo corso;
- registro;
- registro docenti;
- dichiarazione attrezzature;
- validazione percorso formativo;
- autocertificazione;
- esame/test manuale.

## Regole firme mantenute
- Pesce Berardino:
  - Docente
  - Responsabile Progetto
  - Legale Rappresentante

- Centrella Alberto:
  - Responsabile del Corso
  - Docente

## File modificati
- `js/utils.js`
- `js/modules/stampe_bundle.js`
- `index.html`
- `modules/attestato.html`
- `modules/progetto_formativo.html`
- `modules/verbale.html`
- `modules/fascicolo_corso.html`
- `modules/registro.html`
- `modules/regdocenti.html`
- `modules/dichiarazione_attrezzature.html`
- `modules/validazione_percorso_formativo.html`
- `modules/autocert.html`
- `modules/autocertificazione.html`
- `modules/esame.html`
