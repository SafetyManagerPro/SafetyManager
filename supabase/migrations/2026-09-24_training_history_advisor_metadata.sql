-- Metadati additivi per formazione pregressa / crediti
alter table public.training_credits
  add column if not exists source_course_id text,
  add column if not exists source_issuer text,
  add column if not exists source_certificate_id text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null;

create index if not exists idx_training_credits_source_course
  on public.training_credits(source_course_id);

comment on column public.training_credits.source_course_id is
  'Corso sorgente se riconducibile al catalogo SafetyManager; facoltativo per attestati esterni.';
comment on column public.training_credits.credit_type is
  'Valutazione dell operatore: il sistema non assegna automaticamente crediti normativi.';
