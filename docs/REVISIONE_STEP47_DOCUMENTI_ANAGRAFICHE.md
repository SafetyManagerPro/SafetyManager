# Step 47 - Documenti anagrafiche: corsisti, aziende e docenti

## Richiesta
Aggiungere la possibilità di collegare/caricare documenti anagrafici:

### Corsisti
- documento di identità;
- codice fiscale / tessera sanitaria;
- cartella logica `Documenti Corsisti`.

### Aziende
- documento del legale rappresentante / referente.

### Docenti
- documento di identità;
- codice fiscale / tessera sanitaria.

## Implementazione UI

### Gestione Corsista
Aggiunta sezione `Documenti Corsisti` con:
- campo link documento identità;
- upload file documento identità;
- campo link codice fiscale / tessera sanitaria;
- upload file codice fiscale / tessera sanitaria.

### Anagrafica Aziende
Aggiunta sezione:
`Documento legale rappresentante`

con:
- campo link documento;
- upload file documento.

### Anagrafica Docenti
Aggiunta sezione:
`Documenti Docenti`

con:
- campo link documento identità;
- upload file documento identità;
- campo link codice fiscale / tessera sanitaria;
- upload file codice fiscale / tessera sanitaria.

## Storage Supabase
Aggiunta funzione:

`window.uploadDocumentoArchivio(entityType, docType, fileInputId, targetInputId)`

Bucket previsti:
- `documenti-corsisti`
- `documenti-aziende`
- `documenti-docenti`

I file vengono salvati in sottocartelle logiche basate su ID/CF/P.IVA/nome del record.

## Tabelle
Le tabelle mostrano link rapidi ai documenti caricati:

- Corsisti: `Doc. identità`, `Cod. fiscale`;
- Aziende: `Doc. legale`;
- Docenti: `Doc. identità`, `Cod. fiscale`.

## Migration Supabase
Aggiunta migration:

`supabase/migrations/2026-07-06_step47_documenti_anagrafiche.sql`

Colonne aggiunte:

### corsisti
- `documento_identita_url text`
- `codice_fiscale_url text`

### aziende
- `legale_documento_url text`

### docenti
- `documento_identita_url text`
- `codice_fiscale_url text`

La migration crea anche i bucket Storage e policy permissive per fase test.

## Nota importante produzione
Le policy Storage sono volutamente permissive per il test con frontend statico.
Prima della produzione devono essere sostituite con policy RLS per:
- ente;
- ruolo utente;
- azienda;
- visibilità documento.
