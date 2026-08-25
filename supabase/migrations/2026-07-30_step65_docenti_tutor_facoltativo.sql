-- Step 65 - Dati anagrafici docente e tutor facoltativo.
-- Non modifica RLS o policy.

alter table if exists public.docenti
    add column if not exists luogo_data_nascita text;

comment on column public.docenti.luogo_data_nascita is
    'Luogo e data di nascita riportati nella dichiarazione sostitutiva dei requisiti del formatore-docente.';

alter table if exists public.progetti
    add column if not exists tutor_previsto boolean not null default false;

-- Mantiene compatibili i progetti precedenti: se era già stato indicato un tutor,
-- il nuovo selettore viene impostato automaticamente su "presente".
update public.progetti
set tutor_previsto = true
where coalesce(trim(tutor_nome), '') <> ''
  and tutor_previsto is false;

comment on column public.progetti.tutor_previsto is
    'Indica se per la singola edizione è previsto un tutor. Se false, relazione e allegati tutor non vengono generati.';

notify pgrst, 'reload schema';
