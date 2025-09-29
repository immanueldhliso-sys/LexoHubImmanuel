-- Add explicit INSERT policy for advocates so authenticated users can create
-- their own profile rows. The existing FOR ALL USING policy does not cover INSERT.

ALTER TABLE advocates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Advocates can insert their own profile" ON advocates
  FOR INSERT
  WITH CHECK (auth.uid()::text = id::text);