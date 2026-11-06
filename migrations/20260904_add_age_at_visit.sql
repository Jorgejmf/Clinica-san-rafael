-- ====================================================================
-- MIGRACIÓN: Renombrar/agregar age_at_visit en medical_records
-- Reemplaza la columna 'age' por 'age_at_visit' para claridad semántica
-- ====================================================================

-- Agregar la nueva columna age_at_visit
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS age_at_visit INT;

-- Migrar datos existentes de age -> age_at_visit (si la columna age existe con datos)
UPDATE public.medical_records
SET age_at_visit = age
WHERE age_at_visit IS NULL AND age IS NOT NULL;

-- La columna 'age' original puede permanecer para compatibilidad retroactiva
-- pero el código ya NO la escribirá más. Solo age_at_visit recibe datos nuevos.
