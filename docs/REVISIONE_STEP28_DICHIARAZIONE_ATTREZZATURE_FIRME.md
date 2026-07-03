
# Step 28 - Firma dichiarazione attrezzature e dicitura responsabile ente

## Modifica introdotta

Nel documento `Disponibilità e Idoneità Attrezzature e Aree di Addestramento Pratico` è stata corretta la figura del dichiarante.

## Prima
Il documento utilizzava la classe `val-legale-nome`, che poteva riportare il legale rappresentante dell'ente formatore.

## Ora
Il dichiarante è:
- `Referente / Legale Rappresentante dell'azienda committente`;
- il nominativo viene preso da `cfg-azienda-referente`;
- in mancanza, usa il responsabile progetto come fallback.

## Dicitura ente
La dicitura:
`Il Legale Rappresentante dell'Ente`

è stata sostituita con:
`Responsabile Attività Formative Ente`

sia nel template del progetto formativo sia nella valorizzazione dinamica tramite `val-ruolo-firma-3`.

## File modificati
- `modules/dichiarazione_attrezzature.html`
- `modules/progetto_formativo.html`
- `js/utils.js`
