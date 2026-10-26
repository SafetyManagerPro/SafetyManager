-- Fix 2026-10-26: company history must be created AFTER the parent corsista exists.
-- Previously trg_sync_corsista_company_history ran BEFORE INSERT, inserted the
-- history row before the parent and raised FK 23503 for every new corsista.
-- No existing people or historical records are changed.
create or replace function public.corsista_prepare_company_start_on_insert()
returns trigger language plpgsql set search_path = public, pg_temp as $function$
begin
  if new.azienda_id is not null and new.azienda_data_inizio is null then
    new.azienda_data_inizio := current_date;
  end if;
  if coalesce(new.azienda_data_inizio,current_date) > current_date then
    raise exception 'La decorrenza azienda non può essere futura';
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_sync_corsista_company_history on public.corsisti;
drop trigger if exists trg_prepare_corsista_company_insert on public.corsisti;
drop trigger if exists trg_sync_corsista_company_history_insert on public.corsisti;
drop trigger if exists trg_sync_corsista_company_history_update on public.corsisti;

create trigger trg_prepare_corsista_company_insert
before insert on public.corsisti for each row
execute function public.corsista_prepare_company_start_on_insert();

create trigger trg_sync_corsista_company_history_insert
after insert on public.corsisti for each row
execute function public.sync_corsista_company_history();

create trigger trg_sync_corsista_company_history_update
before update of azienda_id, azienda_data_inizio, mansione_storica, ruolo_aziendale
on public.corsisti for each row execute function public.sync_corsista_company_history();

comment on function public.corsista_prepare_company_start_on_insert()
is 'Prepara decorrenza azienda prima della creazione; storico aggiunto solo AFTER INSERT per evitare FK 23503.';
