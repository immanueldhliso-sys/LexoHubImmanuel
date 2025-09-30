-- Add explicit INSERT policy for matters so authenticated users can create
-- their own rows. The existing FOR ALL USING policy does not cover INSERT.

-- Ensure RLS is enabled (idempotent; safe if already enabled)
ALTER TABLE matters ENABLE ROW LEVEL SECURITY;

-- Create INSERT policy allowing users to insert matters for themselves
CREATE POLICY "Advocates can insert their own matters" ON matters
  FOR INSERT
  WITH CHECK (auth.uid()::text = advocate_id::text);