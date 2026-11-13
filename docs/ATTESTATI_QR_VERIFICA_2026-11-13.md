# QR code di verifica online sugli attestati (13 novembre 2026)

Scelte dell'utente (13/11/2026): **verifica online**, QR **sul retro**, mostrati **C.F. per intero, luogo e data di nascita**,
**azienda di appartenenza del lavoratore**, **ente formatore non indicato**.

## Come funziona

- Sul retro dell'attestato, in basso a destra nello spazio libero sotto il programma del corso, compare un QR di 20 mm
  con la scritta "Verifica online dell'attestato". È sovrapposto alla pagina (`position:absolute`): testi, tabelle,
  firme e timbro restano dove sono (controllato: posizioni identiche con e senza QR). Il fronte non cambia.
- Il QR contiene solo il link `https://safety-manager-ultimate.vercel.app/verifica.html?t=<codice>`, dove il codice è
  un uuid casuale dell'iscrizione (`iscrizioni.verifica_token`), non indovinabile.
- La pagina `verifica.html` (pubblica, non indicizzata) chiama la funzione `safety_verifica_attestato` e mostra:
  esito (valido / autentico ma scaduto / non valido / non trovato), lavoratore, luogo e data di nascita, codice fiscale,
  azienda di appartenenza (quella registrata all'iscrizione), corso e ore, date di svolgimento, data di emissione,
  scadenza, ID certificato. Nessun ente formatore.
- Senza QR: la pagina accetta **ID certificato + codice fiscale** insieme (uno solo dei due non basta).
- Un attestato è "valido" con le stesse regole della stampa: ID certificato, esito positivo, corso concluso,
  iscrizione regolare. Per attestati non validi la funzione non restituisce dati personali.
- Le bozze di attestato non hanno il QR. Se il codice di verifica manca (SQL non ancora eseguito) il QR non compare
  e l'attestato si stampa come prima.
- Gli attestati già stampati non hanno il QR; lo avranno se ristampati.

## Database (da eseguire una volta)

`supabase/migrations/20261113110000_attestati_verifica_online.sql`, da incollare in Supabase > SQL Editor:
- colonna `iscrizioni.verifica_token uuid not null default gen_random_uuid()` + indice univoco (i codici vengono
  creati anche per le iscrizioni esistenti);
- funzione `safety_verifica_attestato(p_token, p_id_certificato, p_cf)` `security definer`, sola lettura,
  eseguibile da `anon`: le tabelle restano chiuse agli utenti non autenticati.
Provata su un database PostgreSQL di prova: rieseguibile senza errori; QR valido, corso non concluso, iscrizione
annullata, verifica manuale corretta/errata, codice casuale, accesso diretto alle tabelle negato all'utente anonimo.

## File

- `js/vendor/qrcode-generator-1.4.4.js` (Kazuhiko Arase, licenza MIT), `js/modules/attestato_qr.js`
- `modules/attestato.html` (solo il riquadro QR nel retro), `js/utils.js` (codice nella sessione, QR per corsista,
  niente QR sulle bozze), `js/digital.js` (codice nella sessione)
- `verifica.html`, `sw.js` (la pagina di verifica non passa dalla cache offline)
- `modules/informativa_privacy.html`: punto 5, una frase sulla verifica online con QR.
- Test: `tests/attestato_qr_verifica.test.cjs`.
