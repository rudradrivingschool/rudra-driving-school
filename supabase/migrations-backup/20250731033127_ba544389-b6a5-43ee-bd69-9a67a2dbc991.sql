-- Update payments table to rename client_id to admission_id for consistency
ALTER TABLE public.payments RENAME COLUMN client_id TO admission_id;