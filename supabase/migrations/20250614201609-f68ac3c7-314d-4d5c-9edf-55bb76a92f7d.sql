
-- 1. Admissions: Add more client fields to match frontend form
ALTER TABLE public.admissions
  ADD COLUMN contact text,
  ADD COLUMN email text,
  ADD COLUMN sex text,
  ADD COLUMN license_type text,
  ADD COLUMN license_number text,
  ADD COLUMN fees numeric,
  ADD COLUMN advance_amount numeric,
  ADD COLUMN duration text,
  ADD COLUMN learning_license text,
  ADD COLUMN driving_license text,
  ADD COLUMN start_date date,
  ADD COLUMN additional_notes text;

-- 2. Drivers: Add total_rides field (array of rides is managed via rides table)
ALTER TABLE public.drivers
  ADD COLUMN total_rides integer DEFAULT 0;

-- 3. No change needed for expenses (fields already match most likely usage).

-- 4. Rides: No immediate schema change required unless normalization requested.

