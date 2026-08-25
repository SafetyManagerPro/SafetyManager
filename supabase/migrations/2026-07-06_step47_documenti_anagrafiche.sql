-- Step 47 aggiornato da Step 49 - Documenti anagrafiche SOLO LINK/PERCORSO
-- Questa migration aggiunge solo colonne testuali URL/percorso.
-- Nessun bucket Storage e nessuna policy upload vengono creati perché i file restano archiviati localmente o su cartelle/link esterni.

alter table if exists public.corsisti
add column if not exists documento_identita_url text,
add column if not exists codice_fiscale_url text;

comment on column public.corsisti.documento_identita_url is 'Link/percorso locale o riferimento al documento di identità del corsista. Nessun file caricato sul server.';
comment on column public.corsisti.codice_fiscale_url is 'Link/percorso locale o riferimento al codice fiscale/tessera sanitaria del corsista. Nessun file caricato sul server.';

alter table if exists public.aziende
add column if not exists legale_documento_url text;

comment on column public.aziende.legale_documento_url is 'Link/percorso locale o riferimento al documento del legale rappresentante/referente. Nessun file caricato sul server.';

alter table if exists public.docenti
add column if not exists documento_identita_url text,
add column if not exists codice_fiscale_url text;

comment on column public.docenti.documento_identita_url is 'Link/percorso locale o riferimento al documento di identità del docente. Nessun file caricato sul server.';
comment on column public.docenti.codice_fiscale_url is 'Link/percorso locale o riferimento al codice fiscale/tessera sanitaria del docente. Nessun file caricato sul server.';
