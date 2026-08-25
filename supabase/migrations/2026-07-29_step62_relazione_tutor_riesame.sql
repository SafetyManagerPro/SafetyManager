-- Step 62 - Relazione finale del tutor e riesame periodico/miglioramento.
-- Non modifica RLS/policy e mantiene non bloccante il flusso dei progetti esistenti.

alter table public.progetti
    add column if not exists tutor_nome text,
    add column if not exists tutor_ruolo text,
    add column if not exists tutor_data_relazione date,
    add column if not exists tutor_valutazione_docenza text default 'da_valutare',
    add column if not exists tutor_frequenza text default 'da_valutare',
    add column if not exists tutor_programma text default 'da_valutare',
    add column if not exists tutor_partecipazione text default 'da_valutare',
    add column if not exists tutor_spazi jsonb not null default '[]'::jsonb,
    add column if not exists tutor_strumenti jsonb not null default '[]'::jsonb,
    add column if not exists tutor_punti_forza jsonb not null default '[]'::jsonb,
    add column if not exists tutor_criticita text,
    add column if not exists tutor_giudizio_globale text default 'da_valutare',
    add column if not exists tutor_note text,
    add column if not exists riesame_stato text default 'non_pianificato',
    add column if not exists riesame_data date,
    add column if not exists riesame_fonti jsonb not null default '[]'::jsonb,
    add column if not exists riesame_azioni jsonb not null default '[]'::jsonb,
    add column if not exists riesame_obiettivi text default 'da_valutare',
    add column if not exists riesame_azioni_urgenti text default 'da_valutare',
    add column if not exists riesame_proposta text default 'da_valutare',
    add column if not exists riesame_note text,
    add column if not exists riesame_compilato_da text,
    add column if not exists riesame_compilato_ruolo text,
    add column if not exists riesame_approvato_da text;

do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conname = 'progetti_tutor_valutazioni_check'
          and conrelid = 'public.progetti'::regclass
    ) then
        alter table public.progetti
            add constraint progetti_tutor_valutazioni_check
            check (
                tutor_valutazione_docenza in ('da_valutare', 'positivo', 'adeguato', 'parziale', 'critico')
                and tutor_frequenza in ('da_valutare', 'positivo', 'adeguato', 'parziale', 'critico')
                and tutor_programma in ('da_valutare', 'positivo', 'adeguato', 'parziale', 'critico')
                and tutor_partecipazione in ('da_valutare', 'positivo', 'adeguato', 'parziale', 'critico')
                and tutor_giudizio_globale in ('da_valutare', 'positivo', 'adeguato', 'parziale', 'critico')
            );
    end if;

    if not exists (
        select 1 from pg_constraint
        where conname = 'progetti_tutor_riesame_json_check'
          and conrelid = 'public.progetti'::regclass
    ) then
        alter table public.progetti
            add constraint progetti_tutor_riesame_json_check
            check (
                jsonb_typeof(tutor_spazi) = 'array'
                and jsonb_typeof(tutor_strumenti) = 'array'
                and jsonb_typeof(tutor_punti_forza) = 'array'
                and jsonb_typeof(riesame_fonti) = 'array'
                and jsonb_typeof(riesame_azioni) = 'array'
            );
    end if;

    if not exists (
        select 1 from pg_constraint
        where conname = 'progetti_riesame_stato_check'
          and conrelid = 'public.progetti'::regclass
    ) then
        alter table public.progetti
            add constraint progetti_riesame_stato_check
            check (riesame_stato in ('non_pianificato', 'pianificato', 'in_corso', 'completato', 'non_applicabile'));
    end if;

    if not exists (
        select 1 from pg_constraint
        where conname = 'progetti_riesame_esiti_check'
          and conrelid = 'public.progetti'::regclass
    ) then
        alter table public.progetti
            add constraint progetti_riesame_esiti_check
            check (
                riesame_obiettivi in ('da_valutare', 'si', 'parzialmente', 'no')
                and riesame_azioni_urgenti in ('da_valutare', 'si', 'no')
                and riesame_proposta in ('da_valutare', 'ripetere', 'modificare', 'sostituire')
            );
    end if;
end $$;

comment on column public.progetti.tutor_nome is
    'Tutor o referente d aula che redige la relazione finale dell edizione.';
comment on column public.progetti.tutor_giudizio_globale is
    'Giudizio conclusivo del tutor sulla coerenza ed efficacia del percorso.';
comment on column public.progetti.riesame_stato is
    'Stato del riesame periodico; può essere non applicabile alla singola edizione.';
comment on column public.progetti.riesame_azioni is
    'Azioni correttive o di miglioramento con area, fonte, tempistica e responsabile.';

create index if not exists progetti_riesame_stato_idx
    on public.progetti (riesame_stato);

notify pgrst, 'reload schema';
