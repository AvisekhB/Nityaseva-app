-- Create Role Enum
CREATE TYPE user_role AS ENUM ('FAMILY', 'SENIOR', 'NURSE', 'DOCTOR', 'ADMIN');

-- Profiles Table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'FAMILY',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessments Table (20-Point Data Collection)
CREATE TABLE public.assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  senior_id TEXT NOT NULL,
  logged_by TEXT NOT NULL,
  vitals_bp TEXT,
  pulse INT,
  spo2 INT,
  resp_rate INT,
  temp NUMERIC(4,1),
  fasting_glucose INT,
  random_glucose INT,
  weight NUMERIC(5,2),
  height NUMERIC(5,2),
  bmi NUMERIC(4,2),
  waist_circ NUMERIC(5,2),
  pain_score INT,
  consciousness TEXT,
  fall_risk TEXT,
  mobility TEXT,
  resp_symptoms TEXT,
  edema TEXT,
  hydration TEXT,
  med_adherence TEXT,
  cognitive_obs TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy for Assessments
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read/write assessments"
ON public.assessments FOR ALL
USING (auth.role() = 'authenticated');


ALTER TABLE public.assessments 
  RENAME COLUMN pulse TO heart_rate;

ALTER TABLE public.assessments 
  RENAME COLUMN random_glucose TO glucose_pp;

ALTER TABLE public.assessments 
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Admins have full access" 
ON public.profiles FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

-- Trigger for auto-populating user profiles on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'FAMILY')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();