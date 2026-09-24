-- Campi strutturati per verifica efficacia post-formazione
alter table public.training_effectiveness_checks
  add column if not exists indicators jsonb not null default '[]'::jsonb check (jsonb_typeof(indicators) = 'array'),
  add column if not exists checklist_data jsonb not null default '{}'::jsonb check (jsonb_typeof(checklist_data) = 'object'),
  add column if not exists questionnaire_data jsonb not null default '{}'::jsonb check (jsonb_typeof(questionnaire_data) = 'object'),
  add column if not exists incident_analysis_data jsonb not null default '{}'::jsonb check (jsonb_typeof(incident_analysis_data) = 'object'),
  add column if not exists effectiveness_level text check (effectiveness_level is null or effectiveness_level in ('effective','partially_effective','ineffective','to_review')),
  add column if not exists follow_up_required boolean not null default false,
  add column if not exists source_reference text;
create index if not exists idx_effectiveness_level on public.training_effectiveness_checks(effectiveness_level);
