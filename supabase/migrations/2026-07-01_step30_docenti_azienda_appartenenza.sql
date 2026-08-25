
-- Step 30 - Azienda di appartenenza docenti
alter table if exists public.docenti
add column if not exists azienda_appartenenza text;

comment on column public.docenti.azienda_appartenenza is
'Azienda, ente, associazione, studio o struttura di appartenenza del docente/formatore.';
