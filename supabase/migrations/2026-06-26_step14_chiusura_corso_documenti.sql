
-- Step 14 - Chiusura corso, link scansioni documenti firmati e stato archivio
alter table public.progetti
    add column if not exists stato_corso text default 'aperto',
    add column if not exists documenti_firmati_url text,
    add column if not exists chiuso_at date,
    add column if not exists note_chiusura text;

comment on column public.progetti.stato_corso is 'Stato operativo del corso: aperto, svolto, chiuso.';
comment on column public.progetti.documenti_firmati_url is 'Link alla cartella/scansione dei documenti firmati ricevuti dall azienda committente.';
comment on column public.progetti.chiuso_at is 'Data di chiusura/archiviazione del corso.';
comment on column public.progetti.note_chiusura is 'Note interne sulla chiusura e conservazione del fascicolo.';
