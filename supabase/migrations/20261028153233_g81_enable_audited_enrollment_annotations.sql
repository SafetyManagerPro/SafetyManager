CREATE OR REPLACE FUNCTION public.safety_iscrizione_partecipazione_audit()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_reason text;
BEGIN
 NEW.partecipazione_audit := COALESCE(OLD.partecipazione_audit,'[]'::jsonb);
 IF NEW.partecipazione_stato IS NOT DISTINCT FROM OLD.partecipazione_stato THEN
   IF NEW.partecipazione_motivo IS DISTINCT FROM OLD.partecipazione_motivo THEN
     RAISE EXCEPTION 'La motivazione cambia solo insieme allo stato';
   END IF;
   NEW.partecipazione_revision_at:=OLD.partecipazione_revision_at;
   NEW.partecipazione_revision_by:=OLD.partecipazione_revision_by;
   RETURN NEW;
 END IF;
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Accesso amministrativo necessario'; END IF;
 v_reason:=btrim(COALESCE(NEW.partecipazione_motivo,''));
 IF char_length(v_reason)<12 OR char_length(v_reason)>500 THEN
   RAISE EXCEPTION 'Motivazione obbligatoria da 12 a 500 caratteri';
 END IF;
 -- Conservare le evidenze mentre si annota la rettifica amministrativa.
 NEW.partecipazione_motivo:=v_reason;
 NEW.partecipazione_revision_at:=clock_timestamp();
 NEW.partecipazione_revision_by:=auth.uid();
 NEW.partecipazione_audit:=NEW.partecipazione_audit || jsonb_build_array(jsonb_build_object(
 'da',OLD.partecipazione_stato,'a',NEW.partecipazione_stato,'motivo',v_reason,
 'at',NEW.partecipazione_revision_at,'admin',NEW.partecipazione_revision_by));
 RETURN NEW;
END;
$function$
