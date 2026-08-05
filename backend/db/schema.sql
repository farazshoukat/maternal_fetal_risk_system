-- ============================================================================
-- Maternal-Fetal Risk System — Database Schema
-- Generated: 2026-08-05 via Supabase Management API
-- Project:   djejxqlvfnguasnnprbt (ap-southeast-2)
-- ============================================================================
-- To regenerate this file once pg_dump / Docker is available:
--   supabase db dump --linked -f backend/db/schema.sql
-- ============================================================================

-- Enable required extensions (already active in Supabase by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================================
-- TABLE: profiles
-- One row per auth user. Created by a trigger on auth.users signup.
-- ============================================================================

CREATE TABLE public.profiles (
  id          uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name   text,
  role        text,                           -- 'patient' | 'doctor'
  created_at  timestamptz DEFAULT now(),

  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- !! IMPORTANT: Use a SECURITY DEFINER function to check the caller's role.
-- Querying `profiles` directly inside a `profiles` policy causes infinite
-- recursion. The function bypasses RLS (runs as postgres superuser).
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- Patients can read/update their own profile
CREATE POLICY "profiles_self_select" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_self_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_self_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Doctors can read any profile — uses get_my_role() to avoid self-referencing recursion
CREATE POLICY "profiles_doctor_select" ON public.profiles
  FOR SELECT USING (public.get_my_role() = 'doctor');

-- Legacy aliases (kept for compatibility; functionally identical to above)
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);


-- ============================================================================
-- TABLE: patients
-- One clinical record per patient. Created automatically on first LogVitals
-- submission via getOrCreatePatientRecord() in supabase_db.js.
-- ============================================================================

CREATE TABLE public.patients (
  id                uuid        NOT NULL DEFAULT gen_random_uuid(),
  name              text        NOT NULL,
  age               integer,
  gestational_age   text,
  linked_profile_id uuid        REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_by        uuid        REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT patients_pkey PRIMARY KEY (id)
);

-- RLS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Patients can read their own record (matched by linked_profile_id)
CREATE POLICY "patients_self_select" ON public.patients
  FOR SELECT USING (linked_profile_id = auth.uid());

-- Doctors have full access to all patient records
CREATE POLICY "patients_doctor_all" ON public.patients
  FOR ALL USING (public.get_my_role() = 'doctor');


-- ============================================================================
-- TABLE: vital_readings
-- One row per submitted vitals form. Written by LogVitals.jsx via
-- insertVitalReading() in supabase_db.js.
-- ============================================================================

CREATE TABLE public.vital_readings (
  id            uuid        NOT NULL DEFAULT gen_random_uuid(),
  patient_id    uuid        REFERENCES public.patients (id) ON DELETE SET NULL,
  profile_id    uuid        REFERENCES public.profiles (id) ON DELETE SET NULL,
  systolic_bp   numeric     NOT NULL,
  diastolic_bp  numeric     NOT NULL,
  heart_rate    numeric     NOT NULL,
  blood_sugar   numeric     NOT NULL,
  body_temp     numeric,
  age           numeric,
  risk_level    text,                         -- 'Low Risk' | 'Mid Risk' | 'High Risk'
  recorded_by   text        NOT NULL DEFAULT 'patient',  -- 'patient' | 'clinician'
  recorded_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT vital_readings_pkey PRIMARY KEY (id)
);

-- RLS
ALTER TABLE public.vital_readings ENABLE ROW LEVEL SECURITY;

-- Patients can read/insert their own readings
CREATE POLICY "vital_readings_self_all" ON public.vital_readings
  FOR ALL
  USING      (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Doctors can SELECT all readings across all patients
CREATE POLICY "vital_readings_doctor_select" ON public.vital_readings
  FOR SELECT USING (public.get_my_role() = 'doctor');


-- ============================================================================
-- TABLE: ctg_readings
-- One row per submitted CTG assessment. Written by PatientDetail.jsx
-- (clinician manual entry) via insertCtgReading() in supabase_db.js.
-- ============================================================================

CREATE TABLE public.ctg_readings (
  id                    uuid        NOT NULL DEFAULT gen_random_uuid(),
  patient_id            uuid        REFERENCES public.patients (id) ON DELETE SET NULL,
  profile_id            uuid        REFERENCES public.profiles (id) ON DELETE SET NULL,
  abnormal_stv          numeric,              -- % Abnormal Short-Term Variability
  pct_abnormal_ltv      numeric,              -- % Time with Abnormal Long-Term Variability
  accelerations         numeric,              -- Accelerations per second
  decelerations_late    numeric,              -- Late decelerations per second
  uterine_contractions  numeric,              -- Uterine contractions per second
  fetal_status          text,                 -- 'Normal' | 'Suspect' | 'Pathological'
  recorded_at           timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT ctg_readings_pkey PRIMARY KEY (id)
);

-- RLS
ALTER TABLE public.ctg_readings ENABLE ROW LEVEL SECURITY;

-- Patients can read/insert their own CTG readings
CREATE POLICY "ctg_readings_self_all" ON public.ctg_readings
  FOR ALL
  USING      (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Doctors can SELECT all CTG readings
CREATE POLICY "ctg_readings_doctor_select" ON public.ctg_readings
  FOR SELECT USING (public.get_my_role() = 'doctor');


-- ============================================================================
-- TRIGGER: auto-create profiles row on signup
-- (Must exist in your Supabase project — recreate if restoring from scratch)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'role'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
