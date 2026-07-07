# Step 49 - PDF unico progetto con test/correttori, attestati separati e documenti solo link

## Centro Stampe

### PDF unico progetto
Il pulsante del Centro Stampe è stato aggiornato in:

`PDF unico progetto + test/correttori`

Il PDF unico ora contiene:
- progetto formativo;
- validazione percorso formativo;
- dichiarazione docenza;
- autocertificazione requisiti ente;
- richiesta organismo paritetico;
- dichiarazione attrezzature;
- registro presenze;
- verbale;
- test compilato per ogni corsista;
- test corretto / soluzioni per ogni corsista;
- fascicolo corso / checklist archivio.

### Attestati esclusi dal PDF unico
Gli attestati non vengono più inclusi nel PDF unico progetto.

### Nuovo pulsante solo attestati
Aggiunto pulsante:

`PDF solo attestati`

che stampa esclusivamente gli attestati del progetto selezionato.

## Test e correttori
Per ogni corsista del progetto il sistema genera:
- una pagina `TEST COMPILATO DAL CORSISTA`;
- una pagina `TEST CORRETTO / SOLUZIONI`.

I dati vengono letti da:
- `localStorage` (`SafetyManager.digitalTests.v1`);
- tabella Supabase `test_digitali`, se disponibile.

Se per un corsista non è presente un test digitale salvato, il PDF inserisce una pagina avviso con indicazione di allegare il test cartaceo/scansionato.

## Documenti anagrafici: nessun upload server
La gestione dei documenti caricati negli step 47/48 è stata modificata.

Da questo step:
- nessun file documento viene caricato su Supabase Storage;
- nessun file documento viene caricato sul server;
- la webapp salva solo un link, un percorso o un riferimento testuale.

Il pulsante che prima caricava il file ora aggancia solo il nome del file scelto, usando prefisso:

`LOCAL_FILE::nomefile.pdf`

## Nota tecnica sui file locali
Per sicurezza, i browser non permettono a una pagina web di leggere e salvare automaticamente il percorso completo di un file locale del PC.

Quindi:
- se selezioni un file dal PC, l'app può salvare solo il nome file;
- se vuoi un richiamo apribile, devi incollare manualmente nel campo un link o percorso condiviso, ad esempio:
  - `file:///C:/Documenti Corsisti/Mario Rossi/documento.pdf`
  - `Z:\Documenti Corsisti\Mario Rossi\documento.pdf`
  - link NAS / cartella condivisa / Drive / protocollo aziendale.

## Migration aggiornate
Le migration Step 47 e Step 48 sono state aggiornate per creare solo colonne testuali.
Non creano più bucket Storage né policy upload.

Colonne mantenute:
- `corsisti.documento_identita_url`
- `corsisti.codice_fiscale_url`
- `aziende.legale_documento_url`
- `enti.legale_firma_url`
- `docenti.documento_identita_url`
- `docenti.codice_fiscale_url`
- `docenti.firma_docente_url`

## File principali modificati
- `modules/stampe.html`
- `js/modules/stampe_bundle.js`
- `js/utils.js`
- `supabase/migrations/2026-07-06_step47_documenti_anagrafiche.sql`
- `supabase/migrations/2026-07-06_step48_firme_ente_docenti.sql`
