-- =========================================================
-- ESQUEMA COMPLETO DE BASE DE DATOS DE CLÍNICA SAN RAFAEL
-- Ejecutar este script en el SQL Editor de Supabase
-- =========================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA DE USUARIOS DEL SISTEMA
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'secretaria', -- 'admin', 'doctor', 'doctora', 'secretaria'
    doctor_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. TABLA DE PACIENTES
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    no_expediente TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    birth_date DATE,
    age INT,
    gender TEXT DEFAULT 'Femenino', -- 'Femenino', 'Masculino', 'Otro'
    sexo TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    status TEXT DEFAULT 'Activo',
    digitalizado BOOLEAN DEFAULT false,
    fecha_digitalizacion TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. TABLA DE CITAS MÉDICAS
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id TEXT NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    time TEXT,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled'
    estado TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. TABLA DE FICHAS CLÍNICAS / HISTORIAL MÉDICO
CREATE TABLE IF NOT EXISTS public.medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id TEXT NOT NULL,
    symptoms TEXT,
    motivo_consulta TEXT,
    diagnosis TEXT,
    treatment TEXT,
    conducta_a_seguir TEXT,
    respiracion TEXT,
    temperatura TEXT,
    pulso TEXT,
    presion_arterial TEXT,
    peso TEXT,
    talla TEXT,
    proxima_cita DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. TABLA DE DOCUMENTOS Y EXÁMENES ADJUNTOS DE PACIENTES
CREATE TABLE IF NOT EXISTS public.patient_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT DEFAULT 'Examen', -- 'Examen', 'Ecografía', 'Laboratorio', 'Otro'
    file_name TEXT,
    file_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. TABLA DE CONTROL DE PAPANICOLAOU (PP)
CREATE TABLE IF NOT EXISTS public.papanicolaou_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    patient_name TEXT NOT NULL,
    date DATE NOT NULL,
    doctor_name TEXT DEFAULT 'Dra. Médica',
    status TEXT DEFAULT 'pendiente', -- 'pendiente', 'realizado', 'en proceso', 'entregado'
    result_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. TABLA DE CONTROL PEDIÁTRICO (NIÑOS)
CREATE TABLE IF NOT EXISTS public.pediatric_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    child_name TEXT NOT NULL,
    controls JSONB DEFAULT '[]'::jsonb,
    vaccines JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. TABLA DE CONTROL EMBARAZOS (OBSTÉTRICO)
CREATE TABLE IF NOT EXISTS public.pregnancy_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    patient_name TEXT NOT NULL,
    controls JSONB DEFAULT '[]'::jsonb,
    fur DATE,
    fpp DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 9. TABLA DE PRODUCTOS E INVENTARIO
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    nombre TEXT,
    code TEXT,
    category TEXT DEFAULT 'Medicamento',
    stock INT DEFAULT 0,
    cantidad INT DEFAULT 0,
    min_stock INT DEFAULT 5,
    minimo INT DEFAULT 5,
    cost NUMERIC(10,2) DEFAULT 0,
    price NUMERIC(10,2) DEFAULT 0,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 10. TABLA DE TRANSACCIONES (VENTAS Y GASTOS)
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    type TEXT NOT NULL DEFAULT 'income', -- 'income', 'expense'
    description TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    category TEXT DEFAULT 'Consulta',
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INT DEFAULT 1,
    payment_method TEXT DEFAULT 'Efectivo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 11. TABLA DE DEUDORES
CREATE TABLE IF NOT EXISTS public.debtors (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    patient_name TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    description TEXT,
    date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    status TEXT DEFAULT 'pendiente', -- 'pendiente', 'pagado'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- =========================================================
-- ÍNDICES DE RENDIMIENTO PARA MÁXIMA VELOCIDAD DE BÚSQUEDA
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_patients_created_at ON public.patients (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patients_gender ON public.patients (gender);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON public.appointments (scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments (patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON public.appointments (doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON public.medical_records (patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_documents_patient_id ON public.patient_documents (patient_id);
CREATE INDEX IF NOT EXISTS idx_papanicolaou_patient_id ON public.papanicolaou_records (patient_id);
CREATE INDEX IF NOT EXISTS idx_papanicolaou_status ON public.papanicolaou_records (status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions (type);
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products (stock);
CREATE INDEX IF NOT EXISTS idx_debtors_status ON public.debtors (status);

-- =========================================================
-- POLITICAS DE SEGURIDAD (RLS - Row Level Security)
-- Permite lectura y escritura anónima para desarrollo
-- =========================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.papanicolaou_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pediatric_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pregnancy_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debtors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo en users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en patients" ON public.patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en appointments" ON public.appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en medical_records" ON public.medical_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en patient_documents" ON public.patient_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en papanicolaou_records" ON public.papanicolaou_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en pediatric_records" ON public.pediatric_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en pregnancy_records" ON public.pregnancy_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en debtors" ON public.debtors FOR ALL USING (true) WITH CHECK (true);
