-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purpose TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  driver_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all access to expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

-- Add foreign key relationship to drivers (optional)
-- ALTER TABLE public.expenses ADD CONSTRAINT fk_expenses_driver FOREIGN KEY (driver_id) REFERENCES public.drivers(id);