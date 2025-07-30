
-- Enable RLS for expenses table and allow full access for demonstration.
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to expenses" ON public.expenses
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Enable RLS for rides table and allow full access for demonstration.
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to rides" ON public.rides
  FOR ALL
  USING (true)
  WITH CHECK (true);
