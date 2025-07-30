
-- Enable Row Level Security on the drivers table
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to select (read) the drivers table (temporary, for login only)
CREATE POLICY "Allow anyone to read drivers for login"
  ON public.drivers
  FOR SELECT
  USING (true);
