-- Step 29 - Sede operativa aziende clienti
ALTER TABLE public.aziende
ADD COLUMN IF NOT EXISTS sede_operativa text;

COMMENT ON COLUMN public.aziende.sede_operativa IS 'Sede operativa / luogo operativo azienda cliente, se diversa dalla sede legale.';
