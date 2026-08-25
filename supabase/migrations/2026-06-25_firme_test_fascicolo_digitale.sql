-- Step 3: firme grafiche/tablet, test digitali e tracciabilità export fascicolo.
-- Le RLS restano da attivare nello step successivo insieme a Supabase Auth e profiles.

create table if not exists public.firme_digitali (
    id uuid primary key default gen_random_uuid(),
    progetto_id uuid references public.progetti(id) on delete cascade,
    iscrizione_id uuid references public.iscrizioni(id) on delete cascade,
    corsista_id uuid references public.corsisti(id) on delete set null,
    documento text not null,
    campo_firma text not null,
    firmatario_nome text,
    firmatario_ruolo text,
    data_url text not null,
    hash_sha256 text,
    metadata jsonb default '{}'::jsonb,
    signed_at timestamptz default now(),
    created_at timestamptz default now(),
    constraint firme_digitali_univ unique (progetto_id, iscrizione_id, documento, campo_firma)
);
create index if not exists idx_firme_digitali_progetto on public.firme_digitali(progetto_id);
create index if not exists idx_firme_digitali_iscrizione on public.firme_digitali(iscrizione_id);
create index if not exists idx_firme_digitali_documento on public.firme_digitali(documento);

create table if not exists public.test_digitali (
    id uuid primary key default gen_random_uuid(),
    progetto_id uuid not null references public.progetti(id) on delete cascade,
    iscrizione_id uuid not null references public.iscrizioni(id) on delete cascade,
    corsista_id uuid references public.corsisti(id) on delete set null,
    domande jsonb not null default '[]'::jsonb,
    risposte jsonb not null default '[]'::jsonb,
    punteggio integer,
    percentuale integer,
    esito text,
    firma_hash text,
    metadata jsonb default '{}'::jsonb,
    completed_at timestamptz default now(),
    created_at timestamptz default now(),
    constraint test_digitali_univ unique (progetto_id, iscrizione_id)
);
create index if not exists idx_test_digitali_progetto on public.test_digitali(progetto_id);
create index if not exists idx_test_digitali_iscrizione on public.test_digitali(iscrizione_id);

create table if not exists public.export_fascicoli (
    id uuid primary key default gen_random_uuid(),
    progetto_id uuid references public.progetti(id) on delete cascade,
    nome_cartella text,
    manifest jsonb default '{}'::jsonb,
    hash_manifest_sha256 text,
    esportato_da uuid,
    esportato_at timestamptz default now(),
    note text
);

comment on table public.firme_digitali is 'Firme grafiche/tablet acquisite dalla PWA. Firma elettronica semplice salvo processo FEA/FEQ esterno.';
comment on table public.test_digitali is 'Compilazioni test digitali con punteggio, risposte e hash firma allievo.';
comment on table public.export_fascicoli is 'Log opzionale degli export fascicolo corso generati localmente/ZIP.';

-- RLS da attivare dopo Auth + profiles:
-- alter table public.firme_digitali enable row level security;
-- alter table public.test_digitali enable row level security;
-- alter table public.export_fascicoli enable row level security;
