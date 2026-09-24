-- Metadati additivi per Advisor qualifiche docenti
alter table public.teacher_qualifications
  add column if not exists thematic_areas jsonb not null default '[]'::jsonb check (jsonb_typeof(thematic_areas) = 'array'),
  add column if not exists course_scopes jsonb not null default '[]'::jsonb check (jsonb_typeof(course_scopes) = 'array'),
  add column if not exists qualification_date date,
  add column if not exists last_update_date date,
  add column if not exists update_method text,
  add column if not exists update_hours numeric check (update_hours is null or update_hours >= 0),
  add column if not exists education_prerequisite_met boolean,
  add column if not exists practical_experience_documented boolean not null default false,
  add column if not exists technical_knowledge_documented boolean not null default false,
  add column if not exists source_reference text;

create index if not exists idx_teacher_qualifications_type_status on public.teacher_qualifications(qualification_type, status);
