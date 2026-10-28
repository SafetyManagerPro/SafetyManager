-- Migration applicata Supabase con versione reale 20261028150902.
-- Stato amministrativo additivo: iscritto/non_partecipante/iscrizione_erronea.
ALTER TABLE public.iscrizioni ADD COLUMN IF NOT EXISTS partecipazione_stato text NOT NULL DEFAULT 'iscritto', ADD COLUMN IF NOT EXISTS partecipazione_motivo text, ADD COLUMN IF NOT EXISTS partecipazione_revision_at timestamptz, ADD COLUMN IF NOT EXISTS partecipazione_revision_by uuid, ADD COLUMN IF NOT EXISTS partecipazione_audit jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.iscrizioni ADD CONSTRAINT iscrizioni_partecipazione_stato_check CHECK (partecipazione_stato IN ('iscritto','non_partecipante','iscrizione_erronea'));
CREATE OR REPLACE FUNCTION public.safety_iscrizione_partecipazione_audit() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $f$
DECLARE v_reason text;
BEGIN
 NEW.partecipazione_audit:=COALESCE(OLD.partecipazione_audit,'[]'::jsonb);
 IF NEW.partecipazione_stato IS NOT DISTINCT FROM OLD.partecipazione_stato THEN
  IF NEW.partecipazione_motivo IS DISTINCT FROM OLD.partecipazione_motivo THEN RAISE EXCEPTION 'La motivazione cambia solo insieme allo stato'; END IF;
  NEW.partecipazione_revision_at:=OLD.partecipazione_revision_at;
  NEW.partecipazione_revision_by:=OLD.partecipazione_revision_by;RETURN NEW;
 END IF;
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Accesso amministrativo necessario'; END IF;
 v_reason:=btrim(COALESCE(NEW.partecipazione_motivo,''));
 IF char_length(v_reason)<12 OR char_length(v_reason)>500 THEN RAISE EXCEPTION 'Motivazione obbligatoria da 12 a 500 caratteri';END IF;
 IF NEW.partecipazione_stato <> 'iscritto' AND (
 OLD.ore_frequentate IS NOT NULL OR OLD.percentuale_frequenza IS NOT NULL OR OLD.voto_test IS NOT NULL
 OR NULLIF(btrim(COALESCE(OLD.esito_pratica,'')),'') IS NOT NULL OR NULLIF(btrim(COALESCE(OLD.note_verifica,'')),'') IS NOT NULL
 OR EXISTS(SELECT 1 FROM public.session_attendance WHERE iscrizione_id=OLD.id)
 OR EXISTS(SELECT 1 FROM public.firme_digitali WHERE iscrizione_id=OLD.id OR (progetto_id=OLD.progetto_id AND corsista_id=OLD.corsista_id))
 OR EXISTS(SELECT 1 FROM public.test_digitali WHERE iscrizione_id=OLD.id OR (progetto_id=OLD.progetto_id AND corsista_id=OLD.corsista_id))
 OR EXISTS(SELECT 1 FROM public.course_completion_items WHERE iscrizione_id=OLD.id)
 OR EXISTS(SELECT 1 FROM public.corsisti_documenti_archivio WHERE iscrizione_id=OLD.id OR (progetto_id=OLD.progetto_id AND corsista_id=OLD.corsista_id))
 OR EXISTS(SELECT 1 FROM public.training_credits WHERE source_iscrizione_id=OLD.id)
 OR EXISTS(SELECT 1 FROM public.training_effectiveness_checks WHERE progetto_id=OLD.progetto_id AND corsista_id=OLD.corsista_id)
 ) THEN RAISE EXCEPTION 'Evidenze formative presenti: rettifica protetta'; END IF;
 NEW.partecipazione_motivo:=v_reason;NEW.partecipazione_revision_at:=clock_timestamp();NEW.partecipazione_revision_by:=auth.uid();
 NEW.partecipazione_audit:=NEW.partecipazione_audit||jsonb_build_array(jsonb_build_object('da',OLD.partecipazione_stato,'a',NEW.partecipazione_stato,'motivo',v_reason,'at',NEW.partecipazione_revision_at,'admin',NEW.partecipazione_revision_by));
 RETURN NEW;
END;$f$;
DROP TRIGGER IF EXISTS trg_safety_iscrizione_partecipazione_audit ON public.iscrizioni;
CREATE TRIGGER trg_safety_iscrizione_partecipazione_audit BEFORE UPDATE OF partecipazione_stato,partecipazione_motivo,partecipazione_audit ON public.iscrizioni FOR EACH ROW EXECUTE FUNCTION public.safety_iscrizione_partecipazione_audit();
