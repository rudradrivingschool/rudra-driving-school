
-- Add 'role' column to drivers table (ignore if already exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='drivers' AND column_name='role') THEN
    ALTER TABLE public.drivers
    ADD COLUMN role text DEFAULT 'driver';
  END IF;
END $$;

-- Insert or update the test driver
INSERT INTO public.drivers (username, password, name, email, phone, license_number, join_date, status, role)
VALUES ('abc', '1234', 'Test Driver', 'abc@example.com', '+10000000000', 'DL-ABC123', CURRENT_DATE, 'active', 'driver')
ON CONFLICT (username) DO UPDATE 
  SET password = EXCLUDED.password,
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      license_number = EXCLUDED.license_number,
      join_date = EXCLUDED.join_date,
      status = EXCLUDED.status,
      role = EXCLUDED.role;
