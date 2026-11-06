-- ====================================================================
-- MIGRACIÓN COMPLETA: SISTEMA CLÍNICO SAN RAFAEL
-- Ubicación: Panajachel, Sololá, Guatemala (America/Guatemala UTC-06:00)
-- ====================================================================

-- 1. Actualización en medical_records para campos LABS, GMT, TX, edad histórica y auditoría
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS labs TEXT;
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS gmt NUMERIC;
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS tx TEXT;
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS age INT;
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS updated_by TEXT;

-- 1.1 Compatibilidad en pediatric_records si aplica
ALTER TABLE public.pediatric_records ADD COLUMN IF NOT EXISTS labs TEXT;
ALTER TABLE public.pediatric_records ADD COLUMN IF NOT EXISTS gmt NUMERIC;
ALTER TABLE public.pediatric_records ADD COLUMN IF NOT EXISTS tx TEXT;

-- 2. Actualización en appointments para estado atendido y auditoría
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS attended_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 3. Actualización en patients para estado activo/inactivo y datos extendidos
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Activo';
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'Activo';
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS alergias TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'Femenino';

-- 4. Crear tabla system_users si no existe para credenciales seguras
CREATE TABLE IF NOT EXISTS public.system_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'secretaria',
    doctor_id TEXT,
    password_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Activo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS en system_users si no estuviera habilitado
ALTER TABLE public.system_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo en system_users" ON public.system_users FOR ALL USING (true) WITH CHECK (true);

-- 5. Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON public.medical_records (patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_created_at ON public.medical_records (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON public.appointments (scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments (status);
CREATE INDEX IF NOT EXISTS idx_patients_status ON public.patients (status);
