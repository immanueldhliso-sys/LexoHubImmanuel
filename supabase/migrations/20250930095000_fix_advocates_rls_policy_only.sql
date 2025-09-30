-- Fix RLS policy conflict for advocates table (production deployment)
-- The issue: FOR ALL policy blocks INSERT operations during signup
-- Solution: Replace with separate SELECT, INSERT, UPDATE, DELETE policies

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Advocates can manage their own profile" ON advocates;
DROP POLICY IF EXISTS "Advocates can insert their own profile" ON advocates;

-- Create separate policies for each operation
CREATE POLICY "Advocates can select their own profile" ON advocates
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Advocates can insert their own profile" ON advocates
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Advocates can update their own profile" ON advocates
  FOR UPDATE USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Advocates can delete their own profile" ON advocates
  FOR DELETE USING (auth.uid()::text = id::text);