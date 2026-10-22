create or replace function public.sync_corsista_company_history()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_nome text;
  v_piva text;
begin
  if new.azienda_id is not null then
    select ragione_sociale, piva_cf
      into v_nome, v_piva
    from public.aziende
    where id = new.azienda_id;
  end if;

  if tg_op = 'INSERT' then
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
        new.mansione_storica, new.ruolo_aziendale, current_date,
        'Rapporto creato automaticamente alla registrazione del corsista.'
      );
    end if;
    return new;
  end if;

  if old.azienda_id is distinct from new.azienda_id then
    update public.corsisti_rapporti_azienda
    set data_fine = case
      when data_inizio is null then current_date
      when data_inizio < current_date then current_date - 1
      else current_date
    end
    where corsista_id = new.id
      and data_fine is null;

    insert into public.corsisti_rapporti_azienda (
      corsista_id, azienda_id, azienda_nome_storica, azienda_piva_cf_storica,
      mansione_storica, ruolo_aziendale, data_inizio, note
    ) values (
      new.id, new.azienda_id, v_nome, v_piva,
      new.mansione_storica, new.ruolo_aziendale, current_date,
      'Cambio azienda registrato automaticamente dalla scheda corsista.'
    );
  elsif old.mansione_storica is distinct from new.mansione_storica
     or old.ruolo_aziendale is distinct from new.ruolo_aziendale then
    update public.corsisti_rapporti_azienda
    set
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
after insert or update of azienda_id, mansione_storica, ruolo_aziendale
on public.corsisti
for each row
execute function public.sync_corsista_company_history();

create index if not exists idx_corsisti_rapporti_periodo
  on public.corsisti_rapporti_azienda(corsista_id, data_inizio desc, data_fine);
