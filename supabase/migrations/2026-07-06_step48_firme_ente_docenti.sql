-- Step 48 aggiornato da Step 49 - Firme ente/docenti SOLO LINK/PERCORSO o firma manuale base64
-- Nessun bucket Storage e nessuna policy upload vengono creati.
-- Le firme possono essere:
-- - link/percorso locale o rete;
-- - data URL/base64 generato dalla firma manuale su canvas.

alter table if exists public.enti
add column if not exists legale_firma_url text;

comment on column public.enti.legale_firma_url is
'Link/percorso locale o data URL/base64 della firma del legale rappresentante dell’ente formatore. Nessun file caricato sul server.';

alter table if exists public.docenti
add column if not exists firma_docente_url text;

comment on column public.docenti.firma_docente_url is
'Link/percorso locale o data URL/base64 della firma del docente/formatore. Nessun file caricato sul server.';
