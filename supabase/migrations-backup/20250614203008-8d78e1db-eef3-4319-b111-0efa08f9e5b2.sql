
-- Enable RLS and add permissive policies for drivers
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public select on drivers" ON drivers FOR SELECT USING (true);
CREATE POLICY "Public insert on drivers" ON drivers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update on drivers" ON drivers FOR UPDATE USING (true);
CREATE POLICY "Public delete on drivers" ON drivers FOR DELETE USING (true);

-- Enable RLS and add permissive policies for admissions
ALTER TABLE admissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public select on admissions" ON admissions FOR SELECT USING (true);
CREATE POLICY "Public insert on admissions" ON admissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update on admissions" ON admissions FOR UPDATE USING (true);
CREATE POLICY "Public delete on admissions" ON admissions FOR DELETE USING (true);
