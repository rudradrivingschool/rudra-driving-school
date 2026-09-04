
-- Remove unnecessary columns from rides table
ALTER TABLE public.rides
  DROP COLUMN IF EXISTS duration,
  DROP COLUMN IF EXISTS start_location,
  DROP COLUMN IF EXISTS end_location,
  DROP COLUMN IF EXISTS lesson_type;

-- Add client_id referencing admissions.id
ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES admissions(id);

-- (Optional for legacy) Backfill client_id for existing rides using client_name
-- This would need a manual update if you have client_name and admission id mappings.

-- NOTE: Next, you will need to update your application code to:
-- - Use client_id to relate rides/admissions
-- - Update rides_completed in admissions based on completed rides
-- - Show ride history in admissions view
