-- SafetyManager ASR2025 - Step 4
-- Separazione aggiornamenti attrezzature / spazi confinati
--
-- Questa migration NON modifica automaticamente i dati.
-- Serve per individuare eventuali progetti storici creati con la vecchia voce combinata
-- e riclassificarli manualmente nel nuovo corso corretto.

-- 1) Verifica eventuali progetti legacy da riclassificare.
select
  id,
  codice,
  corso_id,
  ente_id,
  azienda_id,
  data_inizio,
  data_esame,
  created_at
from public.progetti
where corso_id = 'agg_pratico_4h'
order by created_at desc;

-- 2) Riclassificazione manuale, da eseguire SOLO dopo verifica del fascicolo/progetto.
--
-- Caso A: il corso storico era aggiornamento attrezzature art. 73
-- update public.progetti
-- set corso_id = 'agg_attrezzature_4h'
-- where id = 'UUID_PROGETTO_DA_RICLASSIFICARE';
--
-- Caso B: il corso storico era aggiornamento ambienti sospetti di inquinamento o confinati
-- update public.progetti
-- set corso_id = 'agg_spazi_confinati_4h'
-- where id = 'UUID_PROGETTO_DA_RICLASSIFICARE';

-- 3) Controllo finale consigliato.
-- select corso_id, count(*) from public.progetti group by corso_id order by corso_id;
