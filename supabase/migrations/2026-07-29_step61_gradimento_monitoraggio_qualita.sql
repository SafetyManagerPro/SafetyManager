-- Step 61 - Questionari di gradimento cartacei e monitoraggio qualità.
-- Non modifica RLS/policy e non rende bloccante il flusso dei progetti esistenti.

alter table public.progetti
    add column if not exists gradimento_stato text default 'non_avviato',
    add column if not exists gradimento_questionari_raccolti integer default 0,
    add column if not exists gradimento_media_didattica numeric(4,2),
    add column if not exists gradimento_media_organizzativa numeric(4,2),
    add column if not exists gradimento_media_utilita numeric(4,2),
    add column if not exists gradimento_media_complessiva numeric(4,2),
    add column if not exists gradimento_commenti text,
    add column if not exists monitoraggio_data date,
    add column if not exists monitoraggio_in_itinere jsonb not null default '{}'::jsonb,
    add column if not exists monitoraggio_metodi jsonb not null default '[]'::jsonb,
    add column if not exists monitoraggio_esito_apprendimento text,
    add column if not exists monitoraggio_giudizio_finale text default 'da_valutare',
    add column if not exists monitoraggio_criticita text,
    add column if not exists monitoraggio_miglioramenti text;

do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conname = 'progetti_gradimento_stato_check'
          and conrelid = 'public.progetti'::regclass
    ) then
        alter table public.progetti
            add constraint progetti_gradimento_stato_check
            check (gradimento_stato in ('non_avviato', 'da_stampare', 'distribuito', 'raccolto', 'elaborato'));
    end if;

    if not exists (
        select 1 from pg_constraint
        where conname = 'progetti_gradimento_questionari_check'
          and conrelid = 'public.progetti'::regclass
    ) then
        alter table public.progetti
            add constraint progetti_gradimento_questionari_check
            check (gradimento_questionari_raccolti >= 0);
    end if;

    if not exists (
        select 1 from pg_constraint
        where conname = 'progetti_gradimento_medie_check'
          and conrelid = 'public.progetti'::regclass
    ) then
        alter table public.progetti
            add constraint progetti_gradimento_medie_check
            check (
                (gradimento_media_didattica is null or gradimento_media_didattica between 1 and 5)
                and (gradimento_media_organizzativa is null or gradimento_media_organizzativa between 1 and 5)
                and (gradimento_media_utilita is null or gradimento_media_utilita between 1 and 5)
                and (gradimento_media_complessiva is null or gradimento_media_complessiva between 1 and 10)
            );
    end if;

    if not exists (
        select 1 from pg_constraint
        where conname = 'progetti_monitoraggio_json_check'
          and conrelid = 'public.progetti'::regclass
    ) then
        alter table public.progetti
            add constraint progetti_monitoraggio_json_check
            check (
                jsonb_typeof(monitoraggio_in_itinere) = 'object'
                and jsonb_typeof(monitoraggio_metodi) = 'array'
            );
    end if;

    if not exists (
        select 1 from pg_constraint
        where conname = 'progetti_monitoraggio_giudizio_check'
          and conrelid = 'public.progetti'::regclass
    ) then
        alter table public.progetti
            add constraint progetti_monitoraggio_giudizio_check
            check (monitoraggio_giudizio_finale in ('da_valutare', 'conforme', 'parzialmente_conforme', 'non_conforme'));
    end if;
end $$;

comment on column public.progetti.gradimento_stato is
    'Stato operativo dei questionari cartacei di gradimento.';
comment on column public.progetti.gradimento_questionari_raccolti is
    'Numero di questionari cartacei restituiti dai partecipanti.';
comment on column public.progetti.monitoraggio_in_itinere is
    'Valutazione tutor/docente di partecipazione, interesse, completezza, tempi e chiarezza.';
comment on column public.progetti.monitoraggio_metodi is
    'Metodi utilizzati per la verifica dell apprendimento.';
comment on column public.progetti.monitoraggio_giudizio_finale is
    'Giudizio conclusivo sulla coerenza del corso rispetto agli obiettivi dichiarati.';

create index if not exists progetti_gradimento_stato_idx
    on public.progetti (gradimento_stato);

notify pgrst, 'reload schema';
