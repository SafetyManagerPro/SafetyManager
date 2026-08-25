-- SafetyManager Step 60
-- Analisi dei fabbisogni formativi e schede rischi per settore collegate ai progetti.

alter table public.progetti
    add column if not exists fabbisogni_data date,
    add column if not exists fabbisogni_unita_locale text,
    add column if not exists fabbisogni_attivita text,
    add column if not exists fabbisogni_fonti jsonb not null default '[]'::jsonb,
    add column if not exists fabbisogni_necessita jsonb not null default '[]'::jsonb,
    add column if not exists fabbisogni_esigenza_altro text,
    add column if not exists fabbisogni_ruolo text,
    add column if not exists fabbisogni_competenze_ingresso text,
    add column if not exists fabbisogni_competenze_richieste text,
    add column if not exists fabbisogni_gap text,
    add column if not exists fabbisogni_lingua text not null default 'da_verificare',
    add column if not exists fabbisogni_note text,
    add column if not exists fabbisogni_accettato boolean not null default false,
    add column if not exists rischi_settore_id text,
    add column if not exists rischi_selezionati jsonb not null default '[]'::jsonb,
    add column if not exists rischi_personalizzati text;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'progetti_fabbisogni_fonti_array_chk'
          and conrelid = 'public.progetti'::regclass
    ) then
        alter table public.progetti
            add constraint progetti_fabbisogni_fonti_array_chk
            check (jsonb_typeof(fabbisogni_fonti) = 'array');
    end if;

    if not exists (
        select 1
        from pg_constraint
        where conname = 'progetti_fabbisogni_necessita_array_chk'
          and conrelid = 'public.progetti'::regclass
    ) then
        alter table public.progetti
            add constraint progetti_fabbisogni_necessita_array_chk
            check (jsonb_typeof(fabbisogni_necessita) = 'array');
    end if;

    if not exists (
        select 1
        from pg_constraint
        where conname = 'progetti_rischi_selezionati_array_chk'
          and conrelid = 'public.progetti'::regclass
    ) then
        alter table public.progetti
            add constraint progetti_rischi_selezionati_array_chk
            check (jsonb_typeof(rischi_selezionati) = 'array');
    end if;

    if not exists (
        select 1
        from pg_constraint
        where conname = 'progetti_fabbisogni_lingua_chk'
          and conrelid = 'public.progetti'::regclass
    ) then
        alter table public.progetti
            add constraint progetti_fabbisogni_lingua_chk
            check (fabbisogni_lingua in ('da_verificare', 'adeguata', 'supporto', 'test'));
    end if;
end $$;

comment on column public.progetti.fabbisogni_fonti is
    'Elenco JSON delle fonti usate: DVR, sopralluoghi, riunioni, near miss, formazione pregressa, segnalazioni.';
comment on column public.progetti.fabbisogni_necessita is
    'Elenco JSON delle esigenze formative rilevate.';
comment on column public.progetti.rischi_settore_id is
    'Identificativo del catalogo rischi di settore selezionato nella webapp.';
comment on column public.progetti.rischi_selezionati is
    'Elenco JSON degli identificativi dei rischi selezionati e verificati per il progetto.';
comment on column public.progetti.rischi_personalizzati is
    'Rischi aggiuntivi derivati dal DVR, uno per riga.';

create index if not exists progetti_rischi_settore_idx
    on public.progetti (rischi_settore_id);

notify pgrst, 'reload schema';
