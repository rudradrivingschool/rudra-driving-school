-- Create drivers table
CREATE TABLE public.drivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  license_number TEXT,
  join_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  total_rides INTEGER DEFAULT 0,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'driver' ,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create admissions table
CREATE TABLE public.admissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name TEXT NOT NULL,
  contact TEXT,
  email TEXT,
  sex TEXT,
  license_type TEXT,
  license_number TEXT,
  fees DECIMAL(10,2),
  advance_amount DECIMAL(10,2) DEFAULT 0,
  duration TEXT,
  learning_license TEXT,
  driving_license TEXT,
  status TEXT DEFAULT 'Active',
  start_date DATE,
  end_date DATE,
  additional_notes TEXT,
  rides_completed INTEGER DEFAULT 0,
  total_rides INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create rides table
CREATE TABLE public.rides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.admissions(id),
  driver_id UUID REFERENCES public.drivers(id),
  date DATE NOT NULL,
  time TIME,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  car TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.admissions(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  payment_type TEXT DEFAULT 'advance',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policies for drivers table
CREATE POLICY "Drivers can view all data" ON public.drivers FOR SELECT USING (true);
CREATE POLICY "Drivers can insert data" ON public.drivers FOR INSERT WITH CHECK (true);
CREATE POLICY "Drivers can update data" ON public.drivers FOR UPDATE USING (true);
CREATE POLICY "Drivers can delete data" ON public.drivers FOR DELETE USING (true);

-- Create policies for admissions table
CREATE POLICY "Drivers can view all admissions" ON public.admissions FOR SELECT USING (true);
CREATE POLICY "Drivers can insert admissions" ON public.admissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Drivers can update admissions" ON public.admissions FOR UPDATE USING (true);
CREATE POLICY "Drivers can delete admissions" ON public.admissions FOR DELETE USING (true);

-- Create policies for rides table
CREATE POLICY "Drivers can view all rides" ON public.rides FOR SELECT USING (true);
CREATE POLICY "Drivers can insert rides" ON public.rides FOR INSERT WITH CHECK (true);
CREATE POLICY "Drivers can update rides" ON public.rides FOR UPDATE USING (true);
CREATE POLICY "Drivers can delete rides" ON public.rides FOR DELETE USING (true);

-- Create policies for payments table
CREATE POLICY "Drivers can view all payments" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Drivers can insert payments" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Drivers can update payments" ON public.payments FOR UPDATE USING (true);
CREATE POLICY "Drivers can delete payments" ON public.payments FOR DELETE USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admissions_updated_at
  BEFORE UPDATE ON public.admissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rides_updated_at
  BEFORE UPDATE ON public.rides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();