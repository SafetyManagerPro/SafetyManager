alter table public.course_completion_items
  add column if not exists document_status text not null default 'not_prepared',
  add column if not exists returned_at timestamptz,
  add column if not exists checked_at timestamptz,
  add column if not exists scanned_at timestamptz,
  add column if not exists archived_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'course_completion_items_document_status_check'
      and conrelid = 'public.course_completion_items'::regclass
  ) then
    alter table public.course_completion_items
      add constraint course_completion_items_document_status_check
      check (document_status in ('not_prepared','ready_to_print','printed','delivered','awaiting_return','returned','checked','scanned','archived','not_applicable'));
  end if;
end $$;

create index if not exists course_completion_items_document_status_idx
  on public.course_completion_items (progetto_id, document_status);
