
-- Make status default to 'completed' and allow ONLY 'completed' as value
ALTER TABLE public.rides
  ALTER COLUMN status SET DEFAULT 'completed';

-- Remove any rows that don't match 'completed' status for data consistency (optional, safe if data can be discarded)
DELETE FROM public.rides WHERE status IS DISTINCT FROM 'completed';

-- Apply CHECK constraint to only allow 'completed'
ALTER TABLE public.rides
  DROP CONSTRAINT IF EXISTS rides_status_check;

ALTER TABLE public.rides
  ADD CONSTRAINT rides_status_check CHECK (status = 'completed');
