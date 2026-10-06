-- Anti-duplicato anagrafiche: aziende, docenti, corsisti.
-- Mantiene modificabili i duplicati storici finché la chiave fiscale non viene cambiata,
-- ma impedisce nuovi duplicati nello stesso ente (NULL compreso come stesso ambito).

create index if not exists idx_aziende_ente_piva_norm
on public.aziende (
  coalesce(ente_id, '00000000-0000-0000-0000-000000000000'::uuid),
  (case
    when regexp_replace(upper(coalesce(piva_cf,'')), '[^A-Z0-9]', '', 'g') ~ '^IT[0-9]{11}$'
      then substring(regexp_replace(upper(coalesce(piva_cf,'')), '[^A-Z0-9]', '', 'g') from 3)
    else regexp_replace(upper(coalesce(piva_cf,'')), '[^A-Z0-9]', '', 'g')
  end)
)
where coalesce(trim(piva_cf),'') <> '';

create index if not exists idx_docenti_ente_cf_norm
on public.docenti (
  coalesce(ente_id, '00000000-0000-0000-0000-000000000000'::uuid),
  regexp_replace(upper(coalesce(cf,'')), '[^A-Z0-9]', '', 'g')
)
where coalesce(trim(cf),'') <> '';

create index if not exists idx_corsisti_ente_cf_norm
on public.corsisti (
  coalesce(ente_id, '00000000-0000-0000-0000-000000000000'::uuid),
  regexp_replace(upper(coalesce(cf,'')), '[^A-Z0-9]', '', 'g')
)
where coalesce(trim(cf),'') <> '';

create or replace function public.guard_aziende_fiscal_duplicate()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  new_key text;
  old_key text;
begin
  new_key := regexp_replace(upper(coalesce(new.piva_cf,'')), '[^A-Z0-9]', '', 'g');
  if new_key ~ '^IT[0-9]{11}$' then new_key := substring(new_key from 3); end if;
  if new_key = '' then return new; end if;

  if tg_op = 'UPDATE' then
    old_key := regexp_replace(upper(coalesce(old.piva_cf,'')), '[^A-Z0-9]', '', 'g');
    if old_key ~ '^IT[0-9]{11}$' then old_key := substring(old_key from 3); end if;
    if old_key = new_key and old.ente_id is not distinct from new.ente_id then return new; end if;
  end if;

  if exists (
    select 1 from public.aziende a
    where a.id is distinct from new.id
      and a.ente_id is not distinct from new.ente_id
      and (case
        when regexp_replace(upper(coalesce(a.piva_cf,'')), '[^A-Z0-9]', '', 'g') ~ '^IT[0-9]{11}$'
          then substring(regexp_replace(upper(coalesce(a.piva_cf,'')), '[^A-Z0-9]', '', 'g') from 3)
        else regexp_replace(upper(coalesce(a.piva_cf,'')), '[^A-Z0-9]', '', 'g')
      end) = new_key
  ) then
    raise exception 'Partita IVA / Codice Fiscale azienda già presente nello stesso ente.' using errcode = '23505';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_aziende_fiscal_duplicate on public.aziende;
create trigger trg_guard_aziende_fiscal_duplicate
before insert or update of piva_cf, ente_id on public.aziende
for each row execute function public.guard_aziende_fiscal_duplicate();

create or replace function public.guard_docenti_cf_duplicate()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  new_key text;
  old_key text;
begin
  new_key := regexp_replace(upper(coalesce(new.cf,'')), '[^A-Z0-9]', '', 'g');
  if new_key = '' then return new; end if;

  if tg_op = 'UPDATE' then
    old_key := regexp_replace(upper(coalesce(old.cf,'')), '[^A-Z0-9]', '', 'g');
    if old_key = new_key and old.ente_id is not distinct from new.ente_id then return new; end if;
  end if;

  if exists (
    select 1 from public.docenti d
    where d.id is distinct from new.id
      and d.ente_id is not distinct from new.ente_id
      and regexp_replace(upper(coalesce(d.cf,'')), '[^A-Z0-9]', '', 'g') = new_key
  ) then
    raise exception 'Codice fiscale docente già presente nello stesso ente.' using errcode = '23505';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_docenti_cf_duplicate on public.docenti;
create trigger trg_guard_docenti_cf_duplicate
before insert or update of cf, ente_id on public.docenti
for each row execute function public.guard_docenti_cf_duplicate();

create or replace function public.guard_corsisti_cf_duplicate()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  new_key text;
  old_key text;
begin
  new_key := regexp_replace(upper(coalesce(new.cf,'')), '[^A-Z0-9]', '', 'g');
  if new_key = '' then return new; end if;

  if tg_op = 'UPDATE' then
    old_key := regexp_replace(upper(coalesce(old.cf,'')), '[^A-Z0-9]', '', 'g');
    if old_key = new_key and old.ente_id is not distinct from new.ente_id then return new; end if;
  end if;

  if exists (
    select 1 from public.corsisti c
    where c.id is distinct from new.id
      and c.ente_id is not distinct from new.ente_id
      and regexp_replace(upper(coalesce(c.cf,'')), '[^A-Z0-9]', '', 'g') = new_key
  ) then
    raise exception 'Codice fiscale corsista già presente nello stesso ente.' using errcode = '23505';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_corsisti_cf_duplicate on public.corsisti;
create trigger trg_guard_corsisti_cf_duplicate
before insert or update of cf, ente_id on public.corsisti
for each row execute function public.guard_corsisti_cf_duplicate();
