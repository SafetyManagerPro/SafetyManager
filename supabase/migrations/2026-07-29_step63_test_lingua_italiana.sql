-- Step 63 - Verifica comprensione della lingua italiana.
-- I controlli restano non bloccanti nell'applicazione durante la fase di test.
-- Non vengono modificate RLS o policy.

alter table public.corsisti
    add column if not exists cittadinanza text,
    add column if not exists studi_scolastici_italia boolean,
    add column if not exists lingua_test_stato text not null default 'non_richiesto',
    add column if not exists lingua_test_data date,
    add column if not exists lingua_test_parte1 integer,
    add column if not exists lingua_test_parte2 integer,
    add column if not exists lingua_test_parte3 integer,
    add column if not exists lingua_test_valutatore text,
    add column if not exists lingua_test_dichiarazione_dl boolean not null default false,
    add column if not exists lingua_test_documento_url text,
    add column if not exists lingua_test_note text;

do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conname = 'corsisti_lingua_test_stato_check'
          and conrelid = 'public.corsisti'::regclass
    ) then
        alter table public.corsisti
            add constraint corsisti_lingua_test_stato_check
            check (
                lingua_test_stato in (
                    'non_richiesto',
                    'da_valutare',
                    'da_somministrare',
                    'somministrato',
                    'superato',
                    'non_superato'
                )
            );
    end if;

    if not exists (
        select 1 from pg_constraint
        where conname = 'corsisti_lingua_test_punteggi_check'
          and conrelid = 'public.corsisti'::regclass
    ) then
        alter table public.corsisti
            add constraint corsisti_lingua_test_punteggi_check
            check (
                (lingua_test_parte1 is null or lingua_test_parte1 between 0 and 10)
                and (lingua_test_parte2 is null or lingua_test_parte2 between 0 and 10)
                and (lingua_test_parte3 is null or lingua_test_parte3 between 0 and 10)
            );
    end if;
end $$;

comment on column public.corsisti.lingua_test_stato is
    'Stato della verifica preliminare di comprensione della lingua italiana.';
comment on column public.corsisti.studi_scolastici_italia is
    'Indica se il corsista ha conseguito studi scolastici in Italia; null significa da verificare.';
comment on column public.corsisti.lingua_test_parte1 is
    'Risposte corrette nella parte 1 del test, valore da 0 a 10.';
comment on column public.corsisti.lingua_test_parte2 is
    'Risposte corrette nella parte 2 del test, valore da 0 a 10.';
comment on column public.corsisti.lingua_test_parte3 is
    'Risposte corrette nella parte 3 del test, valore da 0 a 10.';
comment on column public.corsisti.lingua_test_documento_url is
    'Solo link o percorso al test cartaceo scansionato; nessun file è caricato automaticamente.';

create index if not exists corsisti_lingua_test_stato_idx
    on public.corsisti (lingua_test_stato);

notify pgrst, 'reload schema';
