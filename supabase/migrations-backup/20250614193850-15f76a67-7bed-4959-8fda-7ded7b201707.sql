
-- Remove the profiles table and all related triggers/functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.profiles;

-- Create drivers table for authentication
CREATE TABLE public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password text NOT NULL, -- hashed in production
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  license_number text,
  join_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'active', -- active/inactive
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS and allow only driver to access their data
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can manage their own row"
  ON public.drivers
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Drivers can update their row"
  ON public.drivers
  FOR UPDATE USING (auth.uid() = id);

-- Admissions Table
CREATE TABLE public.admissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  student_name text NOT NULL,
  admission_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'pending', -- pending/approved/rejected
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Drivers can access their admissions"
  ON public.admissions
  FOR SELECT USING (auth.uid() = driver_id);

-- Rides Table
CREATE TABLE public.rides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  date date NOT NULL,
  time text,
  duration text,
  status text DEFAULT 'pending', -- pending/completed/cancelled
  start_location text,
  end_location text,
  lesson_type text,
  car text,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Drivers can access their rides"
  ON public.rides
  FOR SELECT USING (auth.uid() = driver_id);

-- Expenses Table
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  purpose text NOT NULL,
  amount numeric NOT NULL,
  date date DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Drivers can access their expenses"
  ON public.expenses
  FOR SELECT USING (auth.uid() = driver_id);
