-- Step 67 - Indici per le chiavi esterne segnalate dall'advisor Supabase.
-- Separata perché la tabella era già stata applicata prima del controllo advisor.

create index if not exists course_completion_items_iscrizione_idx
  on public.course_completion_items (iscrizione_id)
  where iscrizione_id is not null;

create index if not exists course_completion_items_verified_by_idx
  on public.course_completion_items (verified_by)
  where verified_by is not null;

create index if not exists course_completion_items_created_by_idx
  on public.course_completion_items (created_by)
  where created_by is not null;
