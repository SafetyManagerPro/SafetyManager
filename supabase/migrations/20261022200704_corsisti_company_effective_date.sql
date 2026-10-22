
alter table public.corsisti
  add column if not exists azienda_data_inizio date;

update public.corsisti c
set azienda_data_inizio = r.data_inizio
from public.corsisti_rapporti_azienda r
where r.corsista_id = c.id
  and r.data_fine is null
  and c.azienda_data_inizio is null
  and r.data_inizio is not null;

create or replace function public.sync_corsista_company_history()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_nome text;
  v_piva text;
  v_start date;
begin
  if new.azienda_id is not null then
    select ragione_sociale, piva_cf
      into v_nome, v_piva
    from public.aziende
    where id = new.azienda_id;
  end if;

  v_start := coalesce(new.azienda_data_inizio, current_date);

  if v_start > current_date then
    raise exception 'La decorrenza azienda non può essere futura';
  end if;

  if tg_op = 'INSERT' then
    if new.azienda_id is not null and new.azienda_data_inizio is null then
      new.azienda_data_inizio := current_date;
      v_start := current_date;
    end if;

    if not exists (
      select 1
      from public.corsisti_rapporti_azienda
      where corsista_id = new.id
        and data_fine is null
    ) then
      insert into public.corsisti_rapporti_azienda (
        corsista_id, azienda_id, azienda_nome_storica, azienda_piva_cf_storica,
        mansione_storica, ruolo_aziendale, data_inizio, note
      ) values (
        new.id, new.azienda_id, v_nome, v_piva,
        new.mansione_storica, new.ruolo_aziendale,
        case when new.azienda_id is null then null else v_start end,
        'Rapporto creato automaticamente alla registrazione del corsista.'
      );
    end if;
    return new;
  end if;

  if old.azienda_id is distinct from new.azienda_id then
    if new.azienda_id is not null and new.azienda_data_inizio is null then
      new.azienda_data_inizio := current_date;
      v_start := current_date;
    end if;

    update public.corsisti_rapporti_azienda
    set data_fine = case
      when data_inizio is null then v_start - 1
      when data_inizio < v_start then v_start - 1
      else v_start
    end
    where corsista_id = new.id
      and data_fine is null;

    insert into public.corsisti_rapporti_azienda (
      corsista_id, azienda_id, azienda_nome_storica, azienda_piva_cf_storica,
      mansione_storica, ruolo_aziendale, data_inizio, note
    ) values (
      new.id, new.azienda_id, v_nome, v_piva,
      new.mansione_storica, new.ruolo_aziendale,
      case when new.azienda_id is null then null else v_start end,
      'Cambio azienda registrato automaticamente dalla scheda corsista.'
    );
  elsif old.azienda_data_inizio is distinct from new.azienda_data_inizio
     or old.mansione_storica is distinct from new.mansione_storica
     or old.ruolo_aziendale is distinct from new.ruolo_aziendale then
    update public.corsisti_rapporti_azienda
    set
      data_inizio = case when new.azienda_id is null then null else new.azienda_data_inizio end,
      mansione_storica = new.mansione_storica,
      ruolo_aziendale = new.ruolo_aziendale,
      azienda_id = new.azienda_id,
      azienda_nome_storica = v_nome,
      azienda_piva_cf_storica = v_piva
    where corsista_id = new.id
      and data_fine is null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_corsista_company_history on public.corsisti;
create trigger trg_sync_corsista_company_history
before insert or update of azienda_id, azienda_data_inizio, mansione_storica, ruolo_aziendale
on public.corsisti
for each row
execute function public.sync_corsista_company_history();
