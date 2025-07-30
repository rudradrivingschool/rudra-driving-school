
-- 1. Add 'role' column to drivers table
ALTER TABLE public.drivers
ADD COLUMN role text DEFAULT 'driver';

-- 2. Insert a test driver (NOTE: password should be hashed in production)
INSERT INTO public.drivers (username, password, name, email, phone, license_number, join_date, status, role)
VALUES ('abc', '1234', 'Test Driver', 'abc@example.com', '+10000000000', 'DL-ABC123', CURRENT_DATE, 'active', 'driver')
ON CONFLICT (username) DO NOTHING;

-- 3. Update admissions table to match form fields (if needed)
-- Table already has: id, driver_id, student_name, admission_date, status, notes, created_at
-- Assuming fields are correct. Add or adjust columns if needed here.

-- 4. Update rides table to match form fields
-- Table already has: id, driver_id, client_name, date, time, duration, status, start_location, end_location, lesson_type, car, notes, created_at
-- Assuming fields are correct. Add or adjust columns if needed here.

-- 5. Update expenses table to match form fields
-- Table already has: id, driver_id, purpose, amount, date, notes, created_at
-- Assuming fields are correct. Add or adjust columns if needed here.
