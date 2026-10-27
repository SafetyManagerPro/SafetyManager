-- SAFETYMANAGER PRO / FASE 2 / PROPOSTA DI MIGRAZIONE NON APPLICATA
-- 2026-10-27 - SOLO PER REVIEW E TEST SU AMBIENTE ISOLATO
-- ATTENZIONE: NON eseguire sul database di produzione senza approvazione
-- esplicita, backup verificato e finestra di manutenzione.
--
-- Obiettivo: impedire che la cancellazione di un'azienda cancelli automaticamente
-- i progetti collegati (oggi ON DELETE CASCADE), mantenendo lo stesso nome FK.
-- Non modifica righe, PK, colonne o permessi. Cambia solo la regola DELETE della FK.
--
-- Prerequisiti verificati il 27/10/2026 SOLO IN LETTURA:
-- aziende=45, progetti=81; progetti con azienda inesistente=0.
-- La FK attuale è public.progetti.progetti_azienda_id_fkey, VALIDATED,
-- NOT DEFERRABLE, ON DELETE CASCADE. Confrontare nuovamente prima di applicare.
-- ATTENZIONE: resta necessario esaminare anche le FK storiche SET NULL.

BEGIN;
SET LOCAL lock_timeout = '4s';
SET LOCAL statement_timeout = '25s';

DO $guard$
DECLARE
  current_delete_action "char";
  current_validated boolean;
  current_deferrable boolean;
BEGIN
  SELECT c.confdeltype, c.convalidated, c.condeferrable
    INTO current_delete_action, current_validated, current_deferrable
  FROM pg_constraint c
  WHERE c.conname = 'progetti_azienda_id_fkey'
    AND c.contype = 'f'
    AND c.conrelid = 'public.progetti'::regclass
    AND c.confrelid = 'public.aziende'::regclass;

  IF current_delete_action IS DISTINCT FROM 'c' THEN
    RAISE EXCEPTION
      'FK progetti_azienda_id_fkey non trovata o azione DELETE diversa da CASCADE: fermarsi e rivalutare';
  END IF;

  IF current_validated IS DISTINCT FROM true OR current_deferrable IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'FK originale con attributi non previsti: stop';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.progetti p
    LEFT JOIN public.aziende a ON a.id = p.azienda_id
    WHERE p.azienda_id IS NOT NULL AND a.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Progetti con azienda inesistente: nessuna modifica consentita';
  END IF;
END
$guard$;

-- ALTER atomico: se la nuova FK non può essere creata, la vecchia resta intatta.
-- Validazione immediata, senza NOT VALID.
ALTER TABLE public.progetti
  DROP CONSTRAINT progetti_azienda_id_fkey,
  ADD CONSTRAINT progetti_azienda_id_fkey
    FOREIGN KEY (azienda_id)
    REFERENCES public.aziende(id)
    MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE;

COMMIT;

-- VERIFICA POST-APPLICAZIONE IN SOLA LETTURA (eseguire a parte):
-- SELECT conname, confdeltype, convalidated, pg_get_constraintdef(oid)
-- FROM pg_constraint WHERE conrelid='public.progetti'::regclass
--   AND conname='progetti_azienda_id_fkey';
-- Risultato atteso: confdeltype = 'r', convalidated = true.
--
-- ROLLBACK TECNICO (solo in emergenza, previa nuova autorizzazione):
-- ripristinare tramite un'ulteriore transazione ALTER TABLE la stessa FK
-- con ON DELETE CASCADE dopo verifica completa. Questo RICREA il rischio
-- di eliminazioni a cascata, quindi NON eseguire automaticamente.
