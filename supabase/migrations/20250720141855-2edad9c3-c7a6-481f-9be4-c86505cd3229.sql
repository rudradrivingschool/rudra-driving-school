-- Add payment tracking table for installments
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admission_id UUID NOT NULL REFERENCES public.admissions(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('advance', 'installment_1', 'installment_2', 'installment_3', 'other')),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all access to payments" 
ON public.payments 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance
CREATE INDEX idx_payments_admission_id ON public.payments(admission_id);
CREATE INDEX idx_payments_payment_date ON public.payments(payment_date);

-- Migrate existing advance amounts to payments table
INSERT INTO public.payments (admission_id, amount, payment_type, payment_date, notes)
SELECT 
  id,
  advance_amount,
  'advance',
  start_date,
  'Advance'
FROM public.admissions 
WHERE advance_amount > 0;