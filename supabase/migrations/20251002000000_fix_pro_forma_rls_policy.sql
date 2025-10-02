DROP POLICY IF EXISTS "Public can submit pending pro_forma_requests" ON pro_forma_requests;

CREATE POLICY "Public can submit pending pro_forma_requests"
ON pro_forma_requests FOR UPDATE
USING (status = 'pending' AND expires_at > NOW())
WITH CHECK (
  (status = 'submitted' AND expires_at > NOW()) OR
  (status = 'pending' AND expires_at > NOW())
);
