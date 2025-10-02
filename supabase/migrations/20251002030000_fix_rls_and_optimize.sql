-- Fix RLS policies and optimize database performance
-- This migration fixes the freezing issues caused by RLS policies

-- Drop existing policies that are causing issues
DROP POLICY IF EXISTS "Advocates can manage their own profile" ON advocates;
DROP POLICY IF EXISTS "Advocates can manage their own matters" ON matters;
DROP POLICY IF EXISTS "Advocates can manage their own invoices" ON invoices;
DROP POLICY IF EXISTS "Advocates can manage their own time entries" ON time_entries;
DROP POLICY IF EXISTS "Advocates can manage their own documents" ON documents;
DROP POLICY IF EXISTS "Advocates can manage their own notes" ON notes;
DROP POLICY IF EXISTS "Advocates can manage their own payments" ON payments;

-- Drop INSERT policies
DROP POLICY IF EXISTS "Advocates can insert their own profile" ON advocates;
DROP POLICY IF EXISTS "Advocates can insert their own matters" ON matters;

-- Create simplified, working RLS policies
-- Advocates table
CREATE POLICY "Enable full access for authenticated users" ON advocates
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users" ON advocates
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Matters table  
CREATE POLICY "Enable full access for own matters" ON matters
  FOR ALL USING (auth.uid() = advocate_id);

CREATE POLICY "Enable insert for own matters" ON matters
  FOR INSERT WITH CHECK (auth.uid() = advocate_id);

-- Invoices table
CREATE POLICY "Enable full access for own invoices" ON invoices
  FOR ALL USING (
    auth.uid() IN (
      SELECT advocate_id FROM matters WHERE id = invoices.matter_id
    ) OR auth.uid() = advocate_id
  );

CREATE POLICY "Enable insert for own invoices" ON invoices
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT advocate_id FROM matters WHERE id = matter_id
    ) OR auth.uid() = advocate_id
  );

-- Time entries table
CREATE POLICY "Enable full access for own time entries" ON time_entries
  FOR ALL USING (
    auth.uid() IN (
      SELECT advocate_id FROM matters WHERE id = time_entries.matter_id
    ) OR auth.uid() = advocate_id
  );

CREATE POLICY "Enable insert for own time entries" ON time_entries
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT advocate_id FROM matters WHERE id = matter_id
    ) OR auth.uid() = advocate_id
  );

-- Documents table
CREATE POLICY "Enable full access for own documents" ON documents
  FOR ALL USING (
    auth.uid() IN (
      SELECT advocate_id FROM matters WHERE id = documents.matter_id
    ) OR auth.uid() = advocate_id
  );

-- Notes table
CREATE POLICY "Enable full access for own notes" ON notes
  FOR ALL USING (
    auth.uid() IN (
      SELECT advocate_id FROM matters WHERE id = notes.matter_id
    ) OR auth.uid() = advocate_id
  );

-- Payments table
CREATE POLICY "Enable full access for own payments" ON payments
  FOR ALL USING (
    auth.uid() IN (
      SELECT m.advocate_id 
      FROM invoices i
      JOIN matters m ON i.matter_id = m.id
      WHERE i.id = payments.invoice_id
    ) OR auth.uid() = advocate_id
  );

-- Add composite indexes for common filters (only if columns exist)
DO $$
BEGIN
  -- Check and create indexes only if columns exist
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'advocate_id') THEN
    CREATE INDEX IF NOT EXISTS idx_invoices_advocate_status ON invoices(advocate_id, status);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matters' AND column_name = 'client_name') THEN
    CREATE INDEX IF NOT EXISTS idx_matters_client_name ON matters(client_name);
  END IF;
END $$;

-- Analyze tables for query planner
ANALYZE advocates;
ANALYZE matters;
ANALYZE invoices;
ANALYZE time_entries;
ANALYZE documents;
ANALYZE notes;
ANALYZE payments;

-- Create helper function to get advocate from auth user
CREATE OR REPLACE FUNCTION get_current_advocate_id()
RETURNS UUID AS $$
BEGIN
  RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
