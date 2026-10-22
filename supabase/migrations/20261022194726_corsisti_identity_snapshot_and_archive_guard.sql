
alter table public.corsisti
  add column if not exists archived_at timestamptz,
  add column if not exists archived_reason text;

create index if not exists idx_corsisti_active
  on public.corsisti(archived_at)
  where archived_at is null;

alter table public.iscrizioni
  add column if not exists nome_cognome_storico text,
  add column if not exists cf_storico text,
  add column if not exists luogo_data_nascita_storico text;

update public.iscrizioni i
set
  nome_cognome_storico = coalesce(i.nome_cognome_storico, c.nome_cognome),
  cf_storico = coalesce(i.cf_storico, c.cf),
  luogo_data_nascita_storico = coalesce(i.luogo_data_nascita_storico, c.luogo_data_nascita)
from public.corsisti c
where c.id = i.corsista_id
  and (
    i.nome_cognome_storico is null
    or i.cf_storico is null
    or i.luogo_data_nascita_storico is null
  );

alter table public.iscrizioni
  drop constraint if exists iscrizioni_corsista_id_fkey;

alter table public.iscrizioni
  add constraint iscrizioni_corsista_id_fkey
  foreign key (corsista_id)
  references public.corsisti(id)
  on delete restrict;

create or replace function public.safety_hard_delete_corsista(
  p_corsista_id uuid,
  p_confirmation text
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_cf text;
  v_iscrizioni integer := 0;
  v_crediti integer := 0;
  v_verifiche integer := 0;
begin
  if (select auth.uid()) is distinct from 'a623577f-0528-4800-a2c7-17da5bae139d'::uuid then
    raise exception 'Operazione riservata all’amministratore SafetyManager';
  end if;

  select cf into v_cf
  from public.corsisti
  where id = p_corsista_id;

  if v_cf is null then
    raise exception 'Corsista non trovato';
  end if;

  if coalesce(p_confirmation, '') <> ('ELIMINA ' || v_cf) then
    raise exception 'Conferma non valida';
  end if;

  select count(*) into v_iscrizioni
  from public.iscrizioni
  where corsista_id = p_corsista_id;

  select count(*) into v_crediti
  from public.training_credits
  where corsista_id = p_corsista_id;

  select count(*) into v_verifiche
  from public.training_effectiveness_checks
  where corsista_id = p_corsista_id;

  delete from public.training_effectiveness_checks
  where corsista_id = p_corsista_id;

  delete from public.training_credits
  where corsista_id = p_corsista_id;

  delete from public.session_attendance
  where iscrizione_id in (
    select id
    from public.iscrizioni
    where corsista_id = p_corsista_id
  );

  delete from public.firme_digitali
  where corsista_id = p_corsista_id;

  delete from public.test_digitali
  where corsista_id = p_corsista_id;

  delete from public.iscrizioni
  where corsista_id = p_corsista_id;

  delete from public.corsisti_rapporti_azienda
  where corsista_id = p_corsista_id;

  delete from public.corsisti
  where id = p_corsista_id;

  return jsonb_build_object(
    'deleted', true,
    'corsista_id', p_corsista_id,
    'iscrizioni', v_iscrizioni,
    'training_credits', v_crediti,
    'effectiveness_checks', v_verifiche
  );
end;
$$;

revoke all on function public.safety_hard_delete_corsista(uuid, text) from public;
revoke all on function public.safety_hard_delete_corsista(uuid, text) from anon;
grant execute on function public.safety_hard_delete_corsista(uuid, text) to authenticated;
