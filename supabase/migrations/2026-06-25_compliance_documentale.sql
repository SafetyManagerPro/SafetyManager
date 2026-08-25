-- SafetyManager - estensione compliance documentale ASR 2025
-- Migrazione non distruttiva. Applicare dopo backup e dopo la migrazione ASR iniziale.

alter table public.progetti
    add column if not exists omogeneita_aula boolean default true,
    add column if not exists modalita_verificata boolean default false,
    add column if not exists versione_normativa text default 'ASR 17/04/2025 Rep. 59/CSR';

alter table public.docenti
    add column if not exists requisito_normativo text,
    add column if not exists esperienza_pratica_anni numeric,
    add column if not exists cv_url text,
    add column if not exists documenti_url text,
    add column if not exists note_requisiti text;

alter table public.aziende
    add column if not exists ccnl text,
    add column if not exists organismo_paritetico text,
    add column if not exists email_organismo_paritetico text;

create table if not exists public.richieste_organismi_paritetici (
    id uuid primary key default gen_random_uuid(),
    progetto_id uuid references public.progetti(id) on delete cascade,
    azienda_id uuid references public.aziende(id) on delete set null,
    organismo text,
    email text,
    data_invio date,
    data_riscontro date,
    esito text,
    note text,
    created_at timestamptz default now()
);

create table if not exists public.documenti_fascicolo (
    id uuid primary key default gen_random_uuid(),
    progetto_id uuid references public.progetti(id) on delete cascade,
    tipo_documento text not null,
    nome_file text,
    storage_path text,
    sha256 text,
    note text,
    created_at timestamptz default now(),
    created_by uuid references auth.users(id) on delete set null
);

create table if not exists public.audit_log (
    id bigserial primary key,
    table_name text not null,
    record_id uuid,
    action text not null,
    changed_at timestamptz default now(),
    changed_by uuid references auth.users(id) on delete set null,
    old_data jsonb,
    new_data jsonb
);

create index if not exists documenti_fascicolo_progetto_idx on public.documenti_fascicolo(progetto_id);
create index if not exists richieste_op_progetto_idx on public.richieste_organismi_paritetici(progetto_id);
create index if not exists audit_log_table_record_idx on public.audit_log(table_name, record_id);
