-- Compliance Advisor non bloccante
alter table public.normative_rule_sets
  add column if not exists advisory_only boolean not null default true
    check (advisory_only = true);

comment on column public.normative_rule_sets.advisory_only is
  'Sempre true: il motore normativo informa e segnala ma non blocca salvataggi, stampe o chiusure. Un eventuale cambio richiede una nuova migrazione esplicita.';

create table if not exists public.compliance_advisor_notes (
  id uuid primary key default gen_random_uuid(),
  progetto_id uuid not null references public.progetti(id) on delete cascade,
  rule_id uuid references public.normative_training_rules(id) on delete set null,
  advisory_code text not null default 'GENERAL_REVIEW',
  severity text not null default 'warning' check (severity in ('info','warning','critical')),
  status text not null default 'acknowledged' check (status in ('open','acknowledged','resolved','dismissed')),
  message_snapshot text,
  user_note text,
  acknowledged_by uuid references auth.users(id) on delete set null,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(progetto_id, advisory_code)
);

create index if not exists idx_compliance_advisor_notes_project on public.compliance_advisor_notes(progetto_id);
create index if not exists idx_compliance_advisor_notes_status on public.compliance_advisor_notes(status, severity);

alter table public.compliance_advisor_notes enable row level security;
create policy safety_admin_all on public.compliance_advisor_notes
  for all to authenticated
  using ((select auth.uid()) = 'a623577f-0528-4800-a2c7-17da5bae139d'::uuid)
  with check ((select auth.uid()) = 'a623577f-0528-4800-a2c7-17da5bae139d'::uuid);
