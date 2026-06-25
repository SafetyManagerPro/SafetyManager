-- SafetyManager - template ruoli e Row Level Security Supabase
-- ATTENZIONE: questo script prepara ruoli e policy, ma NON abilita automaticamente RLS sulle tabelle operative.
-- Prima di abilitare RLS, collegare login Supabase Auth e valorizzare public.profiles per ogni utente.

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    created_at timestamptz default now(),
    nome text,
    ruolo text not null default 'viewer' check (ruolo in ('super_admin','ente_admin','operatore_ente','azienda_admin','viewer')),
    ente_id uuid references public.enti(id) on delete set null,
    azienda_id uuid references public.aziende(id) on delete set null
);

alter table public.profiles enable row level security;

drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles
    for select using (id = auth.uid());

-- Funzioni helper leggibili dalle policy. SECURITY DEFINER evita ricorsioni RLS su profiles.
create or replace function public.current_user_role()
returns text
language sql stable security definer set search_path = public as $$
    select ruolo from public.profiles where id = auth.uid()
$$;

create or replace function public.current_user_ente_id()
returns uuid
language sql stable security definer set search_path = public as $$
    select ente_id from public.profiles where id = auth.uid()
$$;

create or replace function public.current_user_azienda_id()
returns uuid
language sql stable security definer set search_path = public as $$
    select azienda_id from public.profiles where id = auth.uid()
$$;

create or replace function public.is_super_admin()
returns boolean
language sql stable security definer set search_path = public as $$
    select coalesce(public.current_user_role() = 'super_admin', false)
$$;

-- TEMPLATE POLICY: eseguire questa sezione solo quando Auth è attivo e i dati hanno ente_id/azienda_id coerenti.
-- alter table public.enti enable row level security;
-- alter table public.docenti enable row level security;
-- alter table public.aziende enable row level security;
-- alter table public.corsisti enable row level security;
-- alter table public.progetti enable row level security;
-- alter table public.iscrizioni enable row level security;
-- alter table public.documenti_fascicolo enable row level security;
--
-- create policy "enti by role" on public.enti for all
-- using (public.is_super_admin() or id = public.current_user_ente_id())
-- with check (public.is_super_admin() or id = public.current_user_ente_id());
--
-- create policy "aziende by scope" on public.aziende for all
-- using (
--   public.is_super_admin()
--   or ente_id = public.current_user_ente_id()
--   or id = public.current_user_azienda_id()
-- )
-- with check (
--   public.is_super_admin()
--   or ente_id = public.current_user_ente_id()
--   or id = public.current_user_azienda_id()
-- );
--
-- create policy "corsisti by scope" on public.corsisti for all
-- using (
--   public.is_super_admin()
--   or ente_id = public.current_user_ente_id()
--   or azienda_id = public.current_user_azienda_id()
-- )
-- with check (
--   public.is_super_admin()
--   or ente_id = public.current_user_ente_id()
--   or azienda_id = public.current_user_azienda_id()
-- );
--
-- create policy "progetti by scope" on public.progetti for all
-- using (
--   public.is_super_admin()
--   or ente_id = public.current_user_ente_id()
--   or azienda_id = public.current_user_azienda_id()
-- )
-- with check (
--   public.is_super_admin()
--   or ente_id = public.current_user_ente_id()
--   or azienda_id = public.current_user_azienda_id()
-- );
--
-- create policy "iscrizioni by progetto scope" on public.iscrizioni for all
-- using (
--   public.is_super_admin()
--   or exists (
--      select 1 from public.progetti p
--      where p.id = progetto_id
--        and (p.ente_id = public.current_user_ente_id() or p.azienda_id = public.current_user_azienda_id())
--   )
-- )
-- with check (
--   public.is_super_admin()
--   or exists (
--      select 1 from public.progetti p
--      where p.id = progetto_id
--        and (p.ente_id = public.current_user_ente_id() or p.azienda_id = public.current_user_azienda_id())
--   )
-- );
