-- Fix pro_forma_requests RLS policy to allow INSERT operations
-- The existing policy only allows SELECT/UPDATE/DELETE but not INSERT

DROP POLICY IF EXISTS "Advocates can manage their own pro_forma_requests" ON pro_forma_requests;

CREATE POLICY "Advocates can insert pro_forma_requests"
ON pro_forma_requests FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM advocates WHERE id = advocate_id
  )
);

CREATE POLICY "Advocates can view their own pro_forma_requests"
ON pro_forma_requests FOR SELECT
USING (
  advocate_id IN (
    SELECT id FROM advocates WHERE id = auth.uid()
  )
);

CREATE POLICY "Advocates can update their own pro_forma_requests"
ON pro_forma_requests FOR UPDATE
USING (
  advocate_id IN (
    SELECT id FROM advocates WHERE id = auth.uid()
  )
);

CREATE POLICY "Advocates can delete their own pro_forma_requests"
ON pro_forma_requests FOR DELETE
USING (
  advocate_id IN (
    SELECT id FROM advocates WHERE id = auth.uid()
  )
);
