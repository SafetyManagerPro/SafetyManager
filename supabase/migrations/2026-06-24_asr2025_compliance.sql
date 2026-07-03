-- Migrazione non distruttiva per SafetyManager - compliance ASR 17/04/2025
-- Applicare da Supabase SQL editor dopo backup.

-- 1) Allineamento tabella progetti ai campi già usati dall'app.
alter table public.progetti
    add column if not exists sede text,
    add column if not exists resp_progetto text,
    add column if not exists resp_corso text,
    add column if not exists docenti_ud jsonb,
    add column if not exists compliance_note text,
    add column if not exists richiesta_op_inviata_at date,
    add column if not exists risposta_op_at date,
    add column if not exists esito_richiesta_op text,
    add column if not exists max_discenti integer default 30,
    add column if not exists rapporto_pratico text default '1 docente ogni 6 discenti ove previsto',
    add column if not exists fascicolo_checklist jsonb default '{}'::jsonb;

-- 2) Vincolo leggero sul tipo di erogatore: ente/associazione oppure azienda datore di lavoro.
do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'progetti_ente_erogatore_check'
    ) then
        alter table public.progetti
            add constraint progetti_ente_erogatore_check
            check (ente_erogatore is null or ente_erogatore in ('ente','azienda'));
    end if;
end $$;

-- 3) Dati utili al verbale finale e allo scadenziario.
alter table public.iscrizioni
    add column if not exists ore_frequentate numeric,
    add column if not exists percentuale_frequenza numeric,
    add column if not exists voto_test numeric,
    add column if not exists esito_pratica text,
    add column if not exists note_verifica text;

-- 4) Evita doppie iscrizioni allo stesso progetto.
create unique index if not exists iscrizioni_progetto_corsista_unique
    on public.iscrizioni(progetto_id, corsista_id);

-- 5) Indici utili per dashboard e filtri.
create index if not exists progetti_data_esame_idx on public.progetti(data_esame);
create index if not exists iscrizioni_data_scadenza_idx on public.iscrizioni(data_scadenza);

-- 6) Nota sicurezza: con app pubblicata su Vercel attivare RLS e policy per ente/azienda/ruoli.
-- La anon key Supabase è pubblica: non deve mai sostituire le policy Row Level Security.
