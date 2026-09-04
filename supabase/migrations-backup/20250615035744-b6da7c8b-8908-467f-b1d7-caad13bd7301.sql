
-- Drop the policy that references driver_id if it exists
DROP POLICY IF EXISTS "Drivers can access their admissions" ON public.admissions;

-- Remove driver_id and notes columns
ALTER TABLE public.admissions
  DROP COLUMN IF EXISTS driver_id,
  DROP COLUMN IF EXISTS notes;

-- Add rides_completed and total_rides columns
ALTER TABLE public.admissions
  ADD COLUMN IF NOT EXISTS rides_completed integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_rides integer NOT NULL DEFAULT 0;
