-- Step 48 - Firme legale rappresentante ente e docenti
-- Aggiunge colonne per link/immagine firma e bucket Storage dedicato all'ente.
-- Le firme manuali possono essere salvate come data URL nel campo text.
-- In produzione valutare salvataggio su Storage e policy RLS ristrette.

alter table if exists public.enti
add column if not exists legale_firma_url text;

comment on column public.enti.legale_firma_url is
'Link o data URL della firma del legale rappresentante dell’ente formatore.';

alter table if exists public.docenti
add column if not exists firma_docente_url text;

comment on column public.docenti.firma_docente_url is
'Link o data URL della firma del docente/formatore.';

insert into storage.buckets (id, name, public)
values ('documenti-ente', 'documenti-ente', true)
on conflict (id) do update set public = true;

do $$
declare
  b text := 'documenti-ente';
begin
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
end $$;
