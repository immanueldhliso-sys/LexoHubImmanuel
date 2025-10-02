DROP POLICY IF EXISTS "Public can view pending pro_forma_requests" ON pro_forma_requests;

CREATE POLICY "Public can view pro_forma_requests by token"
ON pro_forma_requests FOR SELECT
USING (expires_at > NOW());

CREATE POLICY "Advocates can read own advocates data"
ON advocates FOR SELECT
USING (true);
