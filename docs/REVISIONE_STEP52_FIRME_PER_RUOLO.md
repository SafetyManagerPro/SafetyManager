# Step 52 - Firme automatiche per ruolo

## Regole richieste

### Pesce Berardino
Firma automatica abilitata nei ruoli:
- Docente
- Responsabile Progetto
- Legale Rappresentante

### Centrella Alberto
Firma automatica abilitata nei ruoli:
- Responsabile del Corso
- Docente

## Implementazione
È stato aggiornato `js/utils.js` con una mappa ruolo-specifica:

- `window.AUTO_SIGNATURE_ROLE_MAP`
- `window.getAutoSignaturePathByNameAndRole(name, role)`

Sono stati aggiunti anche gli alias:
- `Berardino Pesce`
- `Pesce Berardino`
- `Centrella Alberto`
- `Alberto Centrella`

così il richiamo automatico funziona indipendentemente dall'ordine nome/cognome.

## Applicazione nei documenti
Le firme automatiche vengono ora inserite solo sui selettori coerenti col ruolo:

- `.val-docente-main` → ruolo `docente`
- `.val-resp-progetto` → ruolo `resp_progetto`
- `.val-legale-nome` → ruolo `legale`
- `.val-resp-corso` → ruolo `resp_corso`

In questo modo:
- la firma di Pesce Berardino non viene usata come Responsabile del Corso;
- la firma di Centrella Alberto non viene usata come Legale Rappresentante o Responsabile Progetto;
- entrambi possono comparire come Docente, se presenti come docente assegnato.

## Input firma automatici
Aggiornati anche:
- `Mio Ente Formatore`
- `Anagrafica Docenti`

Se il campo firma è vuoto, la webapp propone la firma giusta in base al ruolo.
