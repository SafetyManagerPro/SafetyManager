-- Prime regole ASR 2025 validate su fonte ministeriale.
-- Il rule set resta DRAFT: nessun enforcement e nessun mapping automatico.

update public.normative_rule_sets
set source_url = 'https://www.lavoro.gov.it/temi-e-priorita/salute-e-sicurezza/focus/pagine/accordo-stato-regioni-del-17042025-materia-di-formazione',
    updated_at = now()
where code = 'ASR_2025';

create unique index if not exists uq_normative_training_rules_identity
on public.normative_training_rules(rule_set_id, course_code, coalesce(audience_role,''), course_kind);

with rs as (
  select id from public.normative_rule_sets where code='ASR_2025'
)
insert into public.normative_training_rules
(rule_set_id,course_code,course_title,audience_role,course_kind,min_hours,update_period_months,min_attendance_pct,max_participants,practical_ratio,allowed_modes,verification_rules,prerequisites,legal_refs,active,notes)
select rs.id, x.course_code, x.course_title, x.audience_role, x.course_kind, x.min_hours, x.update_period_months, x.min_attendance_pct, x.max_participants, x.practical_ratio,
       x.allowed_modes::jsonb, x.verification_rules::jsonb, x.prerequisites::jsonb, x.legal_refs::jsonb, true, x.notes
from rs
cross join (values
 ('LAV_BASE_BASSO','Lavoratori - formazione generale e specifica rischio basso','lavoratore','formazione',8::numeric,null::int,90::numeric,30::int,null::text,'[]','{"status":"to_validate"}','[]','["ASR 17/04/2025 Parte II punto 2.1"]','4h generale + 4h specifica.'),
 ('LAV_BASE_MEDIO','Lavoratori - formazione generale e specifica rischio medio','lavoratore','formazione',12::numeric,null::int,90::numeric,30::int,null::text,'[]','{"status":"to_validate"}','[]','["ASR 17/04/2025 Parte II punto 2.1"]','4h generale + 8h specifica.'),
 ('LAV_BASE_ALTO','Lavoratori - formazione generale e specifica rischio alto','lavoratore','formazione',16::numeric,null::int,90::numeric,30::int,null::text,'[]','{"status":"to_validate"}','[]','["ASR 17/04/2025 Parte II punto 2.1"]','4h generale + 12h specifica.'),
 ('PREPOSTO_BASE','Preposto','preposto','formazione',12::numeric,null::int,90::numeric,30::int,null::text,'[]','{"status":"to_validate"}','[{"type":"training","code":"LAVORATORE_BASE_COMPLETO"}]','["ASR 17/04/2025 Parte II punto 2.2"]','Accesso dopo formazione generale e specifica lavoratori.'),
 ('DIRIGENTE_BASE','Dirigente','dirigente','formazione',12::numeric,null::int,90::numeric,30::int,null::text,'[]','{"status":"to_validate"}','[]','["ASR 17/04/2025 Parte II punto 2.3"]',null),
 ('DL_BASE','Datore di lavoro','datore_lavoro','formazione',16::numeric,null::int,90::numeric,30::int,null::text,'[]','{"status":"to_validate"}','[]','["ASR 17/04/2025 Parte II punto 3"]','Modulo aggiuntivo cantieri da gestire separatamente quando applicabile.'),
 ('LAV_AGG','Lavoratori - aggiornamento','lavoratore','aggiornamento',6::numeric,60::int,90::numeric,30::int,null::text,'[]','{"status":"to_validate"}','[]','["ASR 17/04/2025 Parte III punto 1.1"]','Aggiornamento anche quando necessario per modifiche rilevanti o esiti della verifica di efficacia.'),
 ('PREPOSTO_AGG','Preposto - aggiornamento','preposto','aggiornamento',6::numeric,24::int,90::numeric,30::int,null::text,'[]','{"status":"to_validate"}','[]','["ASR 17/04/2025 Parte III punto 1.2"]','Biennale e anche quando necessario per evoluzione/insorgenza di rischi.'),
 ('DIRIGENTE_AGG','Dirigente - aggiornamento','dirigente','aggiornamento',6::numeric,60::int,90::numeric,30::int,null::text,'[]','{"status":"to_validate"}','[]','["ASR 17/04/2025 Parte III punto 1.3"]',null),
 ('DL_AGG','Datore di lavoro - aggiornamento','datore_lavoro','aggiornamento',6::numeric,60::int,90::numeric,30::int,null::text,'[]','{"status":"to_validate"}','[]','["ASR 17/04/2025 Parte III punto 1.4"]','Se applicabile, aggiornare anche le tematiche del modulo cantieri.'),
 ('DL_RSPP_AGG','Datore di lavoro RSPP - aggiornamento','datore_lavoro_rspp','aggiornamento',8::numeric,60::int,90::numeric,30::int,null::text,'[]','{"status":"to_validate"}','[]','["ASR 17/04/2025 Parte III punto 2"]','Decorrenza dalla conclusione del modulo comune.'),
 ('ASPP_AGG','ASPP - aggiornamento','aspp','aggiornamento',20::numeric,60::int,90::numeric,null::int,null::text,'[]','{"status":"to_validate"}','[]','["ASR 17/04/2025 Parte III punto 3"]','Monte ore distribuibile nel quinquennio.'),
 ('RSPP_AGG','RSPP - aggiornamento','rspp','aggiornamento',40::numeric,60::int,90::numeric,null::int,null::text,'[]','{"status":"to_validate"}','[]','["ASR 17/04/2025 Parte III punto 3"]','Monte ore distribuibile nel quinquennio.')
) as x(course_code,course_title,audience_role,course_kind,min_hours,update_period_months,min_attendance_pct,max_participants,practical_ratio,allowed_modes,verification_rules,prerequisites,legal_refs,notes)
on conflict do nothing;
