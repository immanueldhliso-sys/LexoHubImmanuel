CREATE TYPE user_role AS ENUM ('junior_advocate', 'senior_counsel', 'chambers_admin');

ALTER TABLE advocates
ADD COLUMN IF NOT EXISTS user_role user_role DEFAULT 'junior_advocate',
ADD COLUMN IF NOT EXISTS role_assigned_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS role_assigned_by uuid REFERENCES advocates(id);

CREATE INDEX IF NOT EXISTS idx_advocates_user_role ON advocates(user_role);

CREATE OR REPLACE FUNCTION auto_assign_user_role()
RETURNS TRIGGER AS $$
DECLARE
  years_of_experience int;
BEGIN
  IF NEW.year_admitted IS NOT NULL THEN
    years_of_experience := EXTRACT(YEAR FROM CURRENT_DATE) - NEW.year_admitted;
    
    IF years_of_experience >= 10 THEN
      NEW.user_role := 'senior_counsel';
    ELSE
      NEW.user_role := 'junior_advocate';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_assign_user_role
  BEFORE INSERT ON advocates
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_user_role();

CREATE TABLE IF NOT EXISTS role_permissions_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advocate_id uuid NOT NULL REFERENCES advocates(id) ON DELETE CASCADE,
  old_role user_role,
  new_role user_role NOT NULL,
  changed_by uuid REFERENCES advocates(id),
  reason text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_log_advocate ON role_permissions_log(advocate_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_log_created_at ON role_permissions_log(created_at DESC);

CREATE OR REPLACE FUNCTION log_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.user_role IS DISTINCT FROM NEW.user_role THEN
    INSERT INTO role_permissions_log (
      advocate_id,
      old_role,
      new_role,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.user_role,
      NEW.user_role,
      current_setting('app.current_user_id', true)::uuid
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_role_change
  AFTER UPDATE ON advocates
  FOR EACH ROW
  WHEN (OLD.user_role IS DISTINCT FROM NEW.user_role)
  EXECUTE FUNCTION log_role_change();

UPDATE advocates
SET user_role = CASE
  WHEN (EXTRACT(YEAR FROM CURRENT_DATE) - year_admitted) >= 10 THEN 'senior_counsel'::user_role
  ELSE 'junior_advocate'::user_role
END
WHERE user_role IS NULL;

COMMENT ON COLUMN advocates.user_role IS 'User role for RBAC: junior_advocate, senior_counsel, or chambers_admin';
COMMENT ON TABLE role_permissions_log IS 'Audit log for role changes';
