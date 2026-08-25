-- SafetyManager - Step 5 Validazione CNA / comunicazione OPRA-OPTA
-- Migrazione non distruttiva. Applicare dopo le migration step 2/3/4.

alter table public.progetti
    add column if not exists ente_validatore text,
    add column if not exists ente_validatore_tipo text,
    add column if not exists validazione_ente_esito text,
    add column if not exists validazione_ente_at date,
    add column if not exists comunicazione_op_at date,
    add column if not exists organismo_destinatario text,
    add column if not exists note_validazione_ente text;

comment on column public.progetti.ente_validatore is 'Associazione/ente che valuta il percorso quando il datore di lavoro è soggetto formatore. Es. CNA Artigiani Imprenditori D''Italia Avellino.';
comment on column public.progetti.validazione_ente_esito is 'da_valutare, validato, validato_con_prescrizioni, non_validato';
comment on column public.progetti.comunicazione_op_at is 'Data comunicazione a OPTA/OPRA o organismo paritetico competente.';
comment on column public.progetti.organismo_destinatario is 'Es. OPTA Avellino / OPRA Campania.';

create table if not exists public.validazioni_percorsi_formativi (
    id uuid primary key default gen_random_uuid(),
    progetto_id uuid references public.progetti(id) on delete cascade,
    ente_validatore text not null,
    ente_validatore_tipo text,
    esito text not null,
    data_validazione date,
    organismo_destinatario text,
    data_comunicazione_op date,
    data_riscontro_op date,
    note text,
    created_at timestamptz default now(),
    created_by uuid references auth.users(id) on delete set null
);

create index if not exists validazioni_percorsi_progetto_idx on public.validazioni_percorsi_formativi(progetto_id);

-- Valori consigliati per validazione_ente_esito:
-- da_valutare | validato | validato_con_prescrizioni | non_validato
-- Valori consigliati per esito_richiesta_op:
-- validazione_ente_in_corso | validazione_ente_completata | comunicazione_op_inviata | riscontro_ricevuto | non_applicabile
