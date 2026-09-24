-- Step 67 - Registro generico di attività, registrazioni ed evidenze del corso.
-- Migrazione additiva: non sostituisce stato_corso e non modifica i dati esistenti.

create table if not exists public.course_completion_items (
  id uuid primary key default gen_random_uuid(),
  progetto_id uuid not null references public.progetti(id) on delete cascade,
  iscrizione_id uuid references public.iscrizioni(id) on delete cascade,
  item_key text not null check (length(trim(item_key)) between 1 and 100),
  mode text not null default 'paper'
    check (mode in ('paper','digital','hybrid','not_applicable')),
  activity_status text not null default 'pending'
    check (activity_status in ('pending','completed','not_applicable')),
  recording_status text not null default 'pending'
    check (recording_status in ('pending','recorded','not_applicable')),
  evidence_status text not null default 'none'
    check (evidence_status in ('none','paper_original','scan_available','digital','not_applicable')),
  evidence_url text,
  notes text,
  verified_at timestamptz,
  verified_by uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint course_completion_items_not_applicable_consistency check (
    mode <> 'not_applicable'
    or (
      activity_status = 'not_applicable'
      and recording_status = 'not_applicable'
      and evidence_status = 'not_applicable'
    )
  )
);

create unique index if not exists course_completion_items_course_unique
  on public.course_completion_items (progetto_id, item_key)
  where iscrizione_id is null;

create unique index if not exists course_completion_items_enrollment_unique
  on public.course_completion_items (progetto_id, iscrizione_id, item_key)
  where iscrizione_id is not null;

create index if not exists course_completion_items_project_idx
  on public.course_completion_items (progetto_id, updated_at desc);

create index if not exists course_completion_items_iscrizione_idx
  on public.course_completion_items (iscrizione_id)
  where iscrizione_id is not null;

create index if not exists course_completion_items_verified_by_idx
  on public.course_completion_items (verified_by)
  where verified_by is not null;

create index if not exists course_completion_items_created_by_idx
  on public.course_completion_items (created_by)
  where created_by is not null;

create index if not exists course_completion_items_open_idx
  on public.course_completion_items (activity_status, recording_status, evidence_status)
  where activity_status = 'pending'
     or recording_status = 'pending'
     or evidence_status in ('none','paper_original');

comment on table public.course_completion_items is
  'Step 67: stato reale, registrazione gestionale ed evidenza documentale per attività di corso cartacee, digitali o ibride.';
comment on column public.course_completion_items.item_key is
  'Chiave logica estensibile, ad esempio final_test, attendance_register, signed_course_documents.';
comment on column public.course_completion_items.mode is
  'Canale operativo dell elemento: paper, digital, hybrid o not_applicable.';
comment on column public.course_completion_items.activity_status is
  'Stato dell attività reale, indipendente dalla presenza di dati o file digitali.';
comment on column public.course_completion_items.recording_status is
  'Stato della registrazione amministrativa nel gestionale.';
comment on column public.course_completion_items.evidence_status is
  'Stato dell evidenza: assente, originale cartaceo, scansione o evidenza digitale.';

alter table public.course_completion_items enable row level security;

revoke all on table public.course_completion_items from anon;
revoke all on table public.course_completion_items from authenticated;
grant select, insert, update, delete on table public.course_completion_items to authenticated;
grant all on table public.course_completion_items to service_role;

drop policy if exists safety_admin_all on public.course_completion_items;
create policy safety_admin_all on public.course_completion_items
  for all
  to authenticated
  using ((select auth.uid()) = 'a623577f-0528-4800-a2c7-17da5bae139d'::uuid)
  with check ((select auth.uid()) = 'a623577f-0528-4800-a2c7-17da5bae139d'::uuid);

notify pgrst, 'reload schema';
