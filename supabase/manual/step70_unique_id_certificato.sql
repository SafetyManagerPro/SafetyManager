-- STEP 70 - Applicazione manuale da Supabase SQL Editor.
-- Non eseguire senza un backup recente.
-- Il blocco iniziale interrompe l'operazione se esistono protocolli duplicati.

do $$
declare
    duplicate_list text;
begin
    select string_agg(format('%s (%s occorrenze)', protocollo, totale), ', ')
      into duplicate_list
      from (
          select btrim(id_certificato) as protocollo, count(*) as totale
            from public.iscrizioni
           where nullif(btrim(id_certificato), '') is not null
           group by btrim(id_certificato)
          having count(*) > 1
           order by count(*) desc, btrim(id_certificato)
           limit 20
      ) duplicates;

    if duplicate_list is not null then
        raise exception using
            message = 'Impossibile creare indice univoco: esistono protocolli attestato duplicati.',
            detail = duplicate_list,
            hint = 'Correggere prima i duplicati indicati e rieseguire lo script Step 70.';
    end if;
end
$$;

create unique index if not exists iscrizioni_id_certificato_unique_idx
    on public.iscrizioni ((btrim(id_certificato)))
    where nullif(btrim(id_certificato), '') is not null;

comment on index public.iscrizioni_id_certificato_unique_idx is
    'Step 70: impedisce protocolli attestato duplicati; il progressivo definitivo richiederà una sequenza/transazione lato database.';
