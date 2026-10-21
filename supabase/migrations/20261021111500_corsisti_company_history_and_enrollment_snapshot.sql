alter table public.iscrizioni
  add column if not exists azienda_storica_id uuid references public.aziende(id) on delete set null,
  add column if not exists azienda_storica_nome text,
  add column if not exists azienda_storica_piva_cf text,
  add column if not exists ruolo_aziendale_storico text;

create index if not exists idx_iscrizioni_azienda_storica_id
  on public.iscrizioni(azienda_storica_id);

update public.iscrizioni i
set
  azienda_storica_id = coalesce(i.azienda_storica_id, p.azienda_id),
  azienda_storica_nome = coalesce(i.azienda_storica_nome, a.ragione_sociale),
  azienda_storica_piva_cf = coalesce(i.azienda_storica_piva_cf, a.piva_cf)
from public.progetti p
left join public.aziende a on a.id = p.azienda_id
where p.id = i.progetto_id
  and (
    i.azienda_storica_id is null
    or i.azienda_storica_nome is null
    or i.azienda_storica_piva_cf is null
  );

update public.iscrizioni i
set ruolo_aziendale_storico = c.ruolo_aziendale
from public.corsisti c
where c.id = i.corsista_id
  and i.ruolo_aziendale_storico is null;

update public.iscrizioni i
set
  azienda_storica_id = coalesce(i.azienda_storica_id, c.azienda_id),
  azienda_storica_nome = coalesce(i.azienda_storica_nome, a.ragione_sociale),
  azienda_storica_piva_cf = coalesce(i.azienda_storica_piva_cf, a.piva_cf)
from public.corsisti c
left join public.aziende a on a.id = c.azienda_id
where c.id = i.corsista_id
  and i.azienda_storica_id is null;

create table if not exists public.corsisti_rapporti_azienda (
  id uuid primary key default gen_random_uuid(),
  corsista_id uuid not null references public.corsisti(id) on delete cascade,
  azienda_id uuid references public.aziende(id) on delete set null,
  azienda_nome_storica text,
  azienda_piva_cf_storica text,
  mansione_storica text,
  ruolo_aziendale text,
  data_inizio date,
  data_fine date,
  note text,
  created_at timestamptz not null default now(),
  constraint corsisti_rapporti_date_check
    check (data_fine is null or data_inizio is null or data_fine >= data_inizio)
);

create index if not exists idx_corsisti_rapporti_corsista
  on public.corsisti_rapporti_azienda(corsista_id);
create index if not exists idx_corsisti_rapporti_azienda
  on public.corsisti_rapporti_azienda(azienda_id);
create unique index if not exists uq_corsisti_rapporto_corrente
  on public.corsisti_rapporti_azienda(corsista_id)
  where data_fine is null;

alter table public.corsisti_rapporti_azienda enable row level security;

grant select, insert, update, delete on public.corsisti_rapporti_azienda to authenticated;

drop policy if exists safety_admin_all on public.corsisti_rapporti_azienda;
create policy safety_admin_all
on public.corsisti_rapporti_azienda
for all
to authenticated
using ((select auth.uid()) = 'a623577f-0528-4800-a2c7-17da5bae139d'::uuid)
with check ((select auth.uid()) = 'a623577f-0528-4800-a2c7-17da5bae139d'::uuid);

insert into public.corsisti_rapporti_azienda (
  corsista_id,
  azienda_id,
  azienda_nome_storica,
  azienda_piva_cf_storica,
  mansione_storica,
  ruolo_aziendale,
  data_inizio,
  note
)
select
  c.id,
  c.azienda_id,
  a.ragione_sociale,
  a.piva_cf,
  c.mansione_storica,
  c.ruolo_aziendale,
  null,
  'Rapporto corrente inizializzato automaticamente dallo stato anagrafico esistente.'
from public.corsisti c
left join public.aziende a on a.id = c.azienda_id
where not exists (
  select 1
  from public.corsisti_rapporti_azienda r
  where r.corsista_id = c.id
    and r.data_fine is null
);
