-- SafetyManager Pro: non consentire cancellazione di PDF già registrati nel fascicolo.
-- La sola cancellazione ammessa è quella degli upload incompleti e non archiviati.
DROP POLICY IF EXISTS corsisti_fascicolo_storage_admin_delete ON storage.objects;
CREATE POLICY corsisti_fascicolo_storage_cleanup_orphans ON storage.objects
FOR DELETE TO authenticated
USING (
 bucket_id='corsisti-fascicolo-privato'
 AND (SELECT auth.uid())='a623577f-0528-4800-a2c7-17da5bae139d'::uuid
 AND NOT EXISTS(
   SELECT 1 FROM public.corsisti_documenti_archivio d
   WHERE d.storage_path=storage.objects.name
 )
);
