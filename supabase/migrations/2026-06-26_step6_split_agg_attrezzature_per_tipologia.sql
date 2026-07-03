
-- Step 6 - Separazione degli aggiornamenti macchine/attrezzature per tipologia specifica.
-- Nessuna modifica strutturale obbligatoria: progetti.corso_id è testuale.
-- Questo file serve a identificare i progetti da riclassificare manualmente.

-- 1) Progetti creati con la vecchia voce generica da riclassificare
select id, codice, corso_id, data_inizio, data_esame, azienda_id
from progetti
where corso_id in ('agg_attrezzature_4h', 'agg_pratico_4h')
order by data_esame desc nulls last, codice;

-- 2) Esempi di riclassificazione manuale (scegliere il corso corretto)
-- update progetti set corso_id = 'agg_attr_carrelli_ind_4h' where id = 'UUID_PROGETTO';
-- update progetti set corso_id = 'agg_attr_ple_4h' where id = 'UUID_PROGETTO';
-- update progetti set corso_id = 'agg_spazi_confinati_4h' where id = 'UUID_PROGETTO';

-- 3) Nuovi codici corso disponibili
-- agg_attr_carrelli_ind_4h
-- agg_attr_carrelli_all_4h
-- agg_attr_ple_4h
-- agg_attr_mmt_esc_4h
-- agg_attr_mmt_all_4h
-- agg_attr_gru_autocarro_4h
-- agg_attr_gru_torre_4h
-- agg_attr_pompe_4h
-- agg_attr_trattori_4h
-- agg_attr_crf_4h
-- agg_attr_cmm_4h
-- agg_attr_carroponte_10h_4h
-- agg_attr_carroponte_all_11h_4h
-- agg_spazi_confinati_4h
