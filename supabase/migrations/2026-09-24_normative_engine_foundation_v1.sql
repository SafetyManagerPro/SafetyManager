-- SafetyManagerPro - Fondazione motore normativo v1
-- Applicata a Supabase il 24/09/2026.
-- Migrazione solo additiva: nessun DROP, DELETE, UPDATE o backfill dei dati esistenti.

create table if not exists public.normative_rule_sets (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  source_label text,
  source_url text,
  version_label text not null,
  effective_from date,
  effective_to date,
  status text not null default 'draft' check (status in ('draft','active','retired')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.normative_training_rules (
  id uuid primary key default gen_random_uuid(),
  rule_set_id uuid not null references public.normative_rule_sets(id) on delete restrict,
  course_code text not null,
  course_title text,
  audience_role text,
  course_kind text not null default 'formazione',
  min_hours numeric,
  update_period_months integer,
  min_attendance_pct numeric not null default 90 check (min_attendance_pct >= 0 and min_attendance_pct <= 100),
  max_participants integer,
  practical_ratio text,
  allowed_modes jsonb not null default '[]'::jsonb check (jsonb_typeof(allowed_modes) = 'array'),
  verification_rules jsonb not null default '{}'::jsonb check (jsonb_typeof(verification_rules) = 'object'),
  prerequisites jsonb not null default '[]'::jsonb check (jsonb_typeof(prerequisites) = 'array'),
  legal_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(legal_refs) = 'array'),
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_normative_training_rules_rule_set on public.normative_training_rules(rule_set_id);
create index if not exists idx_normative_training_rules_course on public.normative_training_rules(course_code, audience_role, course_kind);

create table if not exists public.training_credits (
  id uuid primary key default gen_random_uuid(),
  corsista_id uuid not null references public.corsisti(id) on delete restrict,
  source_iscrizione_id uuid references public.iscrizioni(id) on delete set null,
  source_type text not null default 'attestato_pregresso',
  source_title text,
  source_date date,
  source_hours numeric,
  source_standard text,
  target_course_code text,
  credit_type text not null default 'needs_review' check (credit_type in ('full','partial','none','needs_review')),
  recognized_hours numeric,
  valid_until date,
  evidence_url text,
  decision_status text not null default 'draft' check (decision_status in ('draft','approved','rejected')),
  decision_notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_training_credits_corsista on public.training_credits(corsista_id);
create index if not exists idx_training_credits_target on public.training_credits(target_course_code);

create table if not exists public.teacher_qualifications (
  id uuid primary key default gen_random_uuid(),
  docente_id uuid not null references public.docenti(id) on delete restrict,
  criterion_code text,
  qualification_type text not null,
  scope text,
  experience_years numeric,
  valid_from date,
  valid_to date,
  evidence_url text,
  status text not null default 'draft' check (status in ('draft','verified','expired','rejected')),
  notes text,
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_teacher_qualifications_docente on public.teacher_qualifications(docente_id);
create index if not exists idx_teacher_qualifications_status on public.teacher_qualifications(status);

create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  progetto_id uuid not null references public.progetti(id) on delete restrict,
  session_date date not null,
  starts_at time,
  ends_at time,
  planned_minutes integer check (planned_minutes is null or planned_minutes >= 0),
  session_type text not null default 'theory' check (session_type in ('theory','practical','mixed','verification','other')),
  delivery_mode text not null default 'presence' check (delivery_mode in ('presence','vcs','elearning','blended','other')),
  docente_id uuid references public.docenti(id) on delete set null,
  location text,
  vcs_platform text,
  vcs_log_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_training_sessions_project on public.training_sessions(progetto_id, session_date);
create index if not exists idx_training_sessions_docente on public.training_sessions(docente_id);

create table if not exists public.session_attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_sessions(id) on delete cascade,
  iscrizione_id uuid not null references public.iscrizioni(id) on delete restrict,
  attendance_status text not null default 'present' check (attendance_status in ('present','partial','absent','justified_absence')),
  minutes_attended integer check (minutes_attended is null or minutes_attended >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(session_id, iscrizione_id)
);

create index if not exists idx_session_attendance_iscrizione on public.session_attendance(iscrizione_id);

create table if not exists public.session_attendance_events (
  id uuid primary key default gen_random_uuid(),
  attendance_id uuid not null references public.session_attendance(id) on delete cascade,
  event_type text not null check (event_type in ('check_in','check_out','manual_adjustment')),
  event_at timestamptz not null,
  firma_digitale_id uuid references public.firme_digitali(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists idx_session_attendance_events_attendance on public.session_attendance_events(attendance_id, event_at);

create table if not exists public.training_effectiveness_checks (
  id uuid primary key default gen_random_uuid(),
  progetto_id uuid not null references public.progetti(id) on delete restrict,
  corsista_id uuid references public.corsisti(id) on delete restrict,
  azienda_id uuid references public.aziende(id) on delete restrict,
  scheduled_for date,
  completed_at timestamptz,
  method text,
  evaluator_name text,
  evaluator_role text,
  outcome text,
  evidence_url text,
  observations text,
  corrective_actions text,
  next_check_at date,
  status text not null default 'scheduled' check (status in ('scheduled','completed','not_applicable','cancelled')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_effectiveness_project on public.training_effectiveness_checks(progetto_id);
create index if not exists idx_effectiveness_corsista on public.training_effectiveness_checks(corsista_id);
create index if not exists idx_effectiveness_due on public.training_effectiveness_checks(status, scheduled_for);

alter table public.progetti
  add column if not exists normative_rule_set_id uuid references public.normative_rule_sets(id) on delete set null,
  add column if not exists normative_rule_id uuid references public.normative_training_rules(id) on delete set null,
  add column if not exists normative_snapshot jsonb,
  add column if not exists normative_mapping_status text check (normative_mapping_status is null or normative_mapping_status in ('legacy','draft','mapped','verified')),
  add column if not exists normative_mapped_at timestamptz;

comment on column public.progetti.normative_snapshot is 'Snapshot della regola normativa applicata al progetto; nullo per i progetti storici non ancora mappati.';
comment on column public.progetti.normative_mapping_status is 'Stato del collegamento al motore normativo. NULL mantiene piena retrocompatibilita con i progetti esistenti.';

insert into public.normative_rule_sets
  (code, title, source_label, version_label, effective_from, status, notes)
values
  ('ASR_2025','Accordo Stato-Regioni formazione salute e sicurezza 2025','Accordo Stato-Regioni 17 aprile 2025','Rep. atti n. 59/CSR - 17/04/2025',date '2025-05-24','draft',
   'Set creato come infrastruttura. Le singole regole corso saranno validate e attivate progressivamente; nessun progetto storico viene rimappato automaticamente.')
on conflict (code) do nothing;

alter table public.normative_rule_sets enable row level security;
alter table public.normative_training_rules enable row level security;
alter table public.training_credits enable row level security;
alter table public.teacher_qualifications enable row level security;
alter table public.training_sessions enable row level security;
alter table public.session_attendance enable row level security;
alter table public.session_attendance_events enable row level security;
alter table public.training_effectiveness_checks enable row level security;

create policy safety_admin_all on public.normative_rule_sets for all to authenticated
  using ((select auth.uid()) = 'a623577f-0528-4800-a2c7-17da5bae139d'::uuid)
  with check ((select auth.uid()) = 'a623577f-0528-4800-a2c7-17da5bae139d'::uuid);
create policy safety_admin_all on public.normative_training_rules for all to authenticated
  using ((select auth.uid()) = 'a623577f-0528-4800-a2c7-17da5bae139d'::uuid)
  with check ((select auth.uid()) = 'a623577f-0528-4800-a2c7-17da5bae139d'::uuid);
create policy safety_admin_all on public.training_credits for all to authenticated
  using ((select auth.uid()) = 'a623577f-0528-4800-a2c7-17da5bae139d'::uuid)
  with check ((select auth.uid()) = 'a623577f-0528-4800-a2c7-17da5bae139d'::uuid);
create policy safety_admin_all on public.teacher_qualifications for all to authenticated
  using ((select auth.uid()) = 'a623577f-0528-4800-a2c7-17da5bae139d'::uuid)
  with check ((select auth.uid()) = 'a623577f-0528-4800-a2c7-17da5bae139d'::uuid);
create policy safety_admin_all on public.training_sessions for all to authenticated
  using ((select auth.uid()) = 'a623577f-0528-4800-a2c7-17da5bae139d'::uuid)
  with check ((select auth.uid()) = 'a623577f-0528-4800-a2c7-17da5bae139d'::uuid);
create policy safety_admin_all on public.session_attendance for all to authenticated
  using ((select auth.uid()) = 'a623577f-0528-4800-a2c7-17da5bae139d'::uuid)
  with check ((select auth.uid()) = 'a623577f-0528-4800-a2c7-17da5bae139d'::uuid);
create policy safety_admin_all on public.session_attendance_events for all to authenticated
  using ((select auth.uid()) = 'a623577f-0528-4800-a2c7-17da5bae139d'::uuid)
  with check ((select auth.uid()) = 'a623577f-0528-4800-a2c7-17da5bae139d'::uuid);
create policy safety_admin_all on public.training_effectiveness_checks for all to authenticated
  using ((select auth.uid()) = 'a623577f-0528-4800-a2c7-17da5bae139d'::uuid)
  with check ((select auth.uid()) = 'a623577f-0528-4800-a2c7-17da5bae139d'::uuid);
