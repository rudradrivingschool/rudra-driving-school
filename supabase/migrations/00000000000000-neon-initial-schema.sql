-- Neon DB Initial Schema Migration
-- Schema matching Supabase export for data compatibility
-- Created for Supabase to Neon DB migration

-- ============================================================================
-- DRIVERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  license_number TEXT,
  join_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  role TEXT DEFAULT 'driver',
  total_rides INTEGER DEFAULT 0
);

-- ============================================================================
-- ADMISSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.admissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name TEXT NOT NULL,
  admission_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  contact TEXT,
  email TEXT,
  sex TEXT,
  license_type TEXT,
  license_number TEXT,
  fees NUMERIC,
  advance_amount NUMERIC,
  duration TEXT,
  learning_license TEXT,
  driving_license TEXT,
  start_date DATE,
  additional_notes TEXT,
  rides_completed INTEGER DEFAULT 0,
  total_rides INTEGER NOT NULL DEFAULT 0
);

-- ============================================================================
-- EXPENSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  purpose TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- PAYMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admission_id UUID NOT NULL REFERENCES public.admissions(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('advance', 'installment_1', 'installment_2', 'installment_3', 'other')),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================================
-- RIDES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.rides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT,
  status TEXT DEFAULT 'completed' CHECK (status = 'completed'),
  car TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  client_id UUID REFERENCES public.admissions(id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Drivers indexes
CREATE INDEX IF NOT EXISTS idx_drivers_username ON public.drivers(username);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON public.drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_email ON public.drivers(email);

-- Admissions indexes
CREATE INDEX IF NOT EXISTS idx_admissions_status ON public.admissions(status);
CREATE INDEX IF NOT EXISTS idx_admissions_student_name ON public.admissions(student_name);

-- Rides indexes
CREATE INDEX IF NOT EXISTS idx_rides_client_id ON public.rides(client_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON public.rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_date ON public.rides(date);
CREATE INDEX IF NOT EXISTS idx_rides_status ON public.rides(status);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_admission_id ON public.payments(admission_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date);

-- Expenses indexes
CREATE INDEX IF NOT EXISTS idx_expenses_driver_id ON public.expenses(driver_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_drivers_updated_at ON public.drivers;
CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- NOTES
-- ============================================================================
-- This migration creates all core tables matching Supabase schema:
-- - Schema matches CSV export structure for seamless data import
-- - Foreign keys use appropriate ON DELETE actions
-- - All constraints and checks preserved from Supabase
-- - Indexes optimized for common query patterns
