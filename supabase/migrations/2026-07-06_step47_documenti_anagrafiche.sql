-- Step 47 - Documenti anagrafiche: corsisti, aziende, docenti
-- Aggiunge colonne URL ai record e crea bucket Storage logici per upload documenti.
-- Nota: le policy qui sotto sono permissive per la fase test/frontend statico.
-- In produzione vanno sostituite con policy RLS per ente/ruolo/azienda.

alter table if exists public.corsisti
add column if not exists documento_identita_url text,
add column if not exists codice_fiscale_url text;

comment on column public.corsisti.documento_identita_url is 'Link al documento di identità del corsista.';
comment on column public.corsisti.codice_fiscale_url is 'Link al codice fiscale/tessera sanitaria del corsista.';

alter table if exists public.aziende
add column if not exists legale_documento_url text;

comment on column public.aziende.legale_documento_url is 'Link al documento di identità del legale rappresentante/referente aziendale.';

alter table if exists public.docenti
add column if not exists documento_identita_url text,
add column if not exists codice_fiscale_url text;

comment on column public.docenti.documento_identita_url is 'Link al documento di identità del docente/formatore.';
comment on column public.docenti.codice_fiscale_url is 'Link al codice fiscale/tessera sanitaria del docente/formatore.';

insert into storage.buckets (id, name, public)
values
  ('documenti-corsisti', 'documenti-corsisti', true),
  ('documenti-aziende', 'documenti-aziende', true),
  ('documenti-docenti', 'documenti-docenti', true)
on conflict (id) do update set public = true;

do $$
declare
  b text;
begin
  foreach b in array array['documenti-corsisti','documenti-aziende','documenti-docenti']
  loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'SafetyManager test read ' || b
    ) then
      execute format(
        'create policy %I on storage.objects for select to anon, authenticated using (bucket_id = %L)',
        'SafetyManager test read ' || b,
        b
      );
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'SafetyManager test insert ' || b
    ) then
      execute format(
        'create policy %I on storage.objects for insert to anon, authenticated with check (bucket_id = %L)',
        'SafetyManager test insert ' || b,
        b
      );
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'SafetyManager test update ' || b
    ) then
      execute format(
        'create policy %I on storage.objects for update to anon, authenticated using (bucket_id = %L) with check (bucket_id = %L)',
        'SafetyManager test update ' || b,
        b,
        b
      );
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'SafetyManager test delete ' || b
    ) then
      execute format(
        'create policy %I on storage.objects for delete to anon, authenticated using (bucket_id = %L)',
        'SafetyManager test delete ' || b,
        b
      );
    end if;
  end loop;
end $$;
