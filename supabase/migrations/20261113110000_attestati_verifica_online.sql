-- Verifica online degli attestati tramite QR code (13 novembre 2026).
-- Da eseguire una volta in Supabase > SQL Editor PRIMA di usare la nuova versione dell'app.
-- Effetti:
--   1) ogni iscrizione riceve un codice di verifica casuale (uuid v4) non indovinabile, stampato nel QR;
--   2) una funzione di sola lettura restituisce i dati dell'attestato a chi ha il QR, oppure
--      ID certificato + codice fiscale (verifica manuale). Le tabelle restano chiuse agli utenti
--      non autenticati: la funzione espone solo i campi elencati sotto e solo per attestati validi.
-- Nessun dato esistente viene modificato, oltre all'aggiunta del codice di verifica.

alter table public.iscrizioni
  add column if not exists verifica_token uuid not null default gen_random_uuid();

create unique index if not exists iscrizioni_verifica_token_key
  on public.iscrizioni(verifica_token);

comment on column public.iscrizioni.verifica_token is
  'Codice casuale stampato nel QR dell''attestato per la verifica online (safety_verifica_attestato). Rigenerarlo invalida i QR già stampati.';

create or replace function public.safety_verifica_attestato(
  p_token uuid default null,
  p_id_certificato text default null,
  p_cf text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  r record;
  v_valido boolean;
begin
  if p_token is null and (nullif(btrim(p_id_certificato), '') is null or nullif(btrim(p_cf), '') is null) then
    return jsonb_build_object('trovato', false);
  end if;

  select
    i.id_certificato,
    i.esito,
    i.partecipazione_stato,
    i.data_scadenza,
    coalesce(nullif(btrim(i.nome_cognome_storico), ''), c.nome_cognome) as nome,
    upper(coalesce(nullif(btrim(i.cf_storico), ''), c.cf)) as cf,
    coalesce(nullif(btrim(i.luogo_data_nascita_storico), ''), c.luogo_data_nascita) as nascita,
    coalesce(nullif(btrim(i.azienda_storica_nome), ''), ac.ragione_sociale, ap.ragione_sociale) as azienda,
    p.corso_id,
    p.codice as codice_progetto,
    p.data_inizio,
    p.data_esame
  into r
  from public.iscrizioni i
  join public.progetti p on p.id = i.progetto_id
  left join public.corsisti c on c.id = i.corsista_id
  left join public.aziende ac on ac.id = c.azienda_id
  left join public.aziende ap on ap.id = p.azienda_id
  where (p_token is not null and i.verifica_token = p_token)
     or (p_token is null
         and upper(btrim(i.id_certificato)) = upper(btrim(p_id_certificato))
         and upper(coalesce(nullif(btrim(i.cf_storico), ''), c.cf)) = upper(btrim(p_cf)))
  limit 1;

  if not found then
    return jsonb_build_object('trovato', false);
  end if;

  -- Stesse regole della stampa: senza ID certificato, esito positivo, corso concluso e
  -- partecipazione regolare l'attestato è solo una bozza e non risulta valido.
  v_valido :=
    nullif(btrim(r.id_certificato), '') is not null
    and lower(btrim(coalesce(r.esito, ''))) ~ '^(idone[oa]|superat[oa]|positiv[oa]|abilitat[oa])$'
    and r.data_esame is not null
    and left(r.data_esame::text, 10) <= to_char(current_date, 'YYYY-MM-DD')
    and coalesce(r.partecipazione_stato, 'iscritto') = 'iscritto';

  if not v_valido then
    -- Nessun dato personale per attestati non emessi o annullati.
    return jsonb_build_object('trovato', true, 'valido', false);
  end if;

  return jsonb_build_object(
    'trovato', true,
    'valido', true,
    'id_certificato', btrim(r.id_certificato),
    'nome', r.nome,
    'cf', r.cf,
    'nascita', r.nascita,
    'azienda', r.azienda,
    'corso_id', r.corso_id,
    'codice_progetto', r.codice_progetto,
    'data_inizio', left(r.data_inizio::text, 10),
    'data_fine', left(r.data_esame::text, 10),
    'data_emissione', left(r.data_esame::text, 10),
    'data_scadenza', left(r.data_scadenza::text, 10)
  );
end;
$$;

revoke all on function public.safety_verifica_attestato(uuid, text, text) from public;
grant execute on function public.safety_verifica_attestato(uuid, text, text) to anon, authenticated;

comment on function public.safety_verifica_attestato(uuid, text, text) is
  'Verifica pubblica di un attestato (QR o ID certificato + C.F.). Sola lettura; solo attestati validi; nessun ente formatore.';
