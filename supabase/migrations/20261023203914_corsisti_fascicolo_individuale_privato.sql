-- SafetyManager Pro: fascicolo PDF individuale (23/10/2026)
-- Migrazione già applicata sul progetto Supabase SafetyManager: 20261023203914
CREATE TABLE public.corsisti_documenti_archivio (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 corsista_id uuid NOT NULL REFERENCES public.corsisti(id) ON DELETE RESTRICT,
 iscrizione_id uuid REFERENCES public.iscrizioni(id) ON DELETE SET NULL,
 progetto_id uuid REFERENCES public.progetti(id) ON DELETE SET NULL,
 gruppo_versioni uuid NOT NULL,
 versione integer NOT NULL DEFAULT 1 CHECK (versione >= 1),
 precedente_id uuid REFERENCES public.corsisti_documenti_archivio(id) ON DELETE RESTRICT,
 tipo_documento text NOT NULL CHECK (length(btrim(tipo_documento)) BETWEEN 2 AND 80),
 titolo text NOT NULL CHECK (length(btrim(titolo)) BETWEEN 3 AND 200),
 stato text NOT NULL DEFAULT 'bozza' CHECK (stato IN ('bozza','definitivo','superato')),
 data_documento date,
 azienda_storica_nome text, azienda_storica_id uuid,
 nome_cognome_storico text NOT NULL, cf_storico text, mansione_storica text,
 nome_file text NOT NULL, storage_path text NOT NULL UNIQUE,
 mime_type text NOT NULL DEFAULT 'application/pdf' CHECK (mime_type = 'application/pdf'),
 dimensione_byte bigint NOT NULL CHECK (dimensione_byte BETWEEN 1 AND 15728640),
 note text, creato_da uuid DEFAULT auth.uid(),
 creato_il timestamptz NOT NULL DEFAULT now(), modificato_il timestamptz NOT NULL DEFAULT now(),
 UNIQUE (gruppo_versioni,versione),
 CONSTRAINT archivio_path_isolation CHECK (storage_path LIKE (corsista_id::text || '/' || id::text || '/%') AND right(lower(storage_path),4)='.pdf')
);
CREATE INDEX corsisti_archivio_by_person ON public.corsisti_documenti_archivio (corsista_id,creato_il DESC);
CREATE INDEX corsisti_archivio_by_group ON public.corsisti_documenti_archivio (gruppo_versioni,versione DESC);
CREATE INDEX corsisti_archivio_by_enrollment ON public.corsisti_documenti_archivio (iscrizione_id);

CREATE OR REPLACE FUNCTION public.safety_corsista_documento_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path='public','pg_temp' AS $body$
DECLARE
 prior public.corsisti_documenti_archivio%ROWTYPE;
 original_corsista uuid;
BEGIN
 IF TG_OP='INSERT' THEN
   IF new.iscrizione_id IS NOT NULL THEN
     SELECT i.corsista_id INTO original_corsista FROM public.iscrizioni i WHERE i.id=new.iscrizione_id;
     IF original_corsista IS DISTINCT FROM new.corsista_id THEN
       RAISE EXCEPTION 'L iscrizione non appartiene al corsista del documento';
     END IF;
   END IF;
   IF new.precedente_id IS NOT NULL THEN
     SELECT * INTO prior FROM public.corsisti_documenti_archivio WHERE id=new.precedente_id;
     IF prior.id IS NULL OR prior.corsista_id IS DISTINCT FROM new.corsista_id
       OR prior.gruppo_versioni IS DISTINCT FROM new.gruppo_versioni
       OR new.versione IS DISTINCT FROM prior.versione+1 THEN
       RAISE EXCEPTION 'Versione precedente non coerente con il fascicolo del corsista';
     END IF;
   ELSIF new.versione<>1 OR new.gruppo_versioni<>new.id THEN
     RAISE EXCEPTION 'Il primo documento deve iniziare dalla versione 1';
   END IF;
 ELSIF TG_OP='UPDATE' THEN
   IF (new.id,new.corsista_id,new.iscrizione_id,new.progetto_id,new.gruppo_versioni,
       new.versione,new.precedente_id,new.tipo_documento,new.titolo,new.data_documento,
       new.azienda_storica_nome,new.azienda_storica_id,new.nome_cognome_storico,
       new.cf_storico,new.mansione_storica,new.nome_file,new.storage_path,new.mime_type,
       new.dimensione_byte,new.note,new.creato_da,new.creato_il)
     IS DISTINCT FROM
      (old.id,old.corsista_id,old.iscrizione_id,old.progetto_id,old.gruppo_versioni,
       old.versione,old.precedente_id,old.tipo_documento,old.titolo,old.data_documento,
       old.azienda_storica_nome,old.azienda_storica_id,old.nome_cognome_storico,
       old.cf_storico,old.mansione_storica,old.nome_file,old.storage_path,old.mime_type,
       old.dimensione_byte,old.note,old.creato_da,old.creato_il) THEN
     RAISE EXCEPTION 'Metadati storici immutabili: caricare una nuova versione invece di sovrascrivere';
   END IF;
   new.modificato_il=now();
 END IF;
 RETURN new;
END $body$;
REVOKE ALL ON FUNCTION public.safety_corsista_documento_guard() FROM public,anon,authenticated;
CREATE TRIGGER corsisti_archivio_integrity BEFORE INSERT OR UPDATE ON public.corsisti_documenti_archivio
FOR EACH ROW EXECUTE FUNCTION public.safety_corsista_documento_guard();

ALTER TABLE public.corsisti_documenti_archivio ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.corsisti_documenti_archivio FROM anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.corsisti_documenti_archivio TO authenticated;
CREATE POLICY corsisti_archivio_admin_read ON public.corsisti_documenti_archivio
 FOR SELECT TO authenticated USING ((select auth.uid())='a623577f-0528-4800-a2c7-17da5bae139d'::uuid);
CREATE POLICY corsisti_archivio_admin_insert ON public.corsisti_documenti_archivio
 FOR INSERT TO authenticated WITH CHECK ((select auth.uid())='a623577f-0528-4800-a2c7-17da5bae139d'::uuid);
CREATE POLICY corsisti_archivio_admin_update ON public.corsisti_documenti_archivio
 FOR UPDATE TO authenticated USING ((select auth.uid())='a623577f-0528-4800-a2c7-17da5bae139d'::uuid)
 WITH CHECK ((select auth.uid())='a623577f-0528-4800-a2c7-17da5bae139d'::uuid);

INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
VALUES ('corsisti-fascicolo-privato','corsisti-fascicolo-privato',false,15728640,array['application/pdf'])
ON CONFLICT (id) DO NOTHING;
CREATE POLICY corsisti_fascicolo_storage_admin_read ON storage.objects
 FOR SELECT TO authenticated
 USING (bucket_id='corsisti-fascicolo-privato' AND (select auth.uid())='a623577f-0528-4800-a2c7-17da5bae139d'::uuid);
CREATE POLICY corsisti_fascicolo_storage_admin_add ON storage.objects
 FOR INSERT TO authenticated
 WITH CHECK (bucket_id='corsisti-fascicolo-privato' AND (select auth.uid())='a623577f-0528-4800-a2c7-17da5bae139d'::uuid);
CREATE POLICY corsisti_fascicolo_storage_admin_delete ON storage.objects
 FOR DELETE TO authenticated
 USING (bucket_id='corsisti-fascicolo-privato' AND (select auth.uid())='a623577f-0528-4800-a2c7-17da5bae139d'::uuid);
