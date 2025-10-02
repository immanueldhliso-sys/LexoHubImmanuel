CREATE TABLE IF NOT EXISTS auth_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  attempt_type TEXT NOT NULL CHECK (attempt_type IN ('login', 'signup', 'password_reset')),
  success BOOLEAN NOT NULL DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auth_attempts_email_created ON auth_attempts(email, created_at DESC);
CREATE INDEX idx_auth_attempts_type ON auth_attempts(attempt_type);

CREATE TABLE IF NOT EXISTS account_lockouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  locked_until TIMESTAMPTZ NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_account_lockouts_email ON account_lockouts(email);
CREATE INDEX idx_account_lockouts_locked_until ON account_lockouts(locked_until);

CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  device_fingerprint TEXT,
  ip_address TEXT,
  user_agent TEXT,
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_active_sessions_user_id ON active_sessions(user_id);
CREATE INDEX idx_active_sessions_token ON active_sessions(session_token);
CREATE INDEX idx_active_sessions_last_activity ON active_sessions(last_activity);

CREATE TABLE IF NOT EXISTS password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_password_history_user_id ON password_history(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION check_account_lockout(p_email TEXT)
RETURNS TABLE(is_locked BOOLEAN, locked_until TIMESTAMPTZ, attempts INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (l.locked_until > NOW()) as is_locked,
    l.locked_until,
    l.failed_attempts
  FROM account_lockouts l
  WHERE l.email = p_email;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TIMESTAMPTZ, 0;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION record_auth_attempt(
  p_email TEXT,
  p_attempt_type TEXT,
  p_success BOOLEAN,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_failed_count INTEGER;
  v_lockout_until TIMESTAMPTZ;
  v_max_attempts INTEGER := 5;
  v_lockout_duration INTERVAL := '30 minutes';
BEGIN
  INSERT INTO auth_attempts (email, attempt_type, success, ip_address, user_agent)
  VALUES (p_email, p_attempt_type, p_success, p_ip_address, p_user_agent);
  
  IF NOT p_success THEN
    SELECT COUNT(*) INTO v_failed_count
    FROM auth_attempts
    WHERE email = p_email
      AND attempt_type = p_attempt_type
      AND success = false
      AND created_at > NOW() - INTERVAL '15 minutes';
    
    IF v_failed_count >= v_max_attempts THEN
      v_lockout_until := NOW() + v_lockout_duration;
      
      INSERT INTO account_lockouts (email, locked_until, failed_attempts)
      VALUES (p_email, v_lockout_until, v_failed_count)
      ON CONFLICT (email) 
      DO UPDATE SET 
        locked_until = v_lockout_until,
        failed_attempts = v_failed_count,
        updated_at = NOW();
      
      RETURN jsonb_build_object(
        'locked', true,
        'locked_until', v_lockout_until,
        'failed_attempts', v_failed_count
      );
    END IF;
  ELSE
    DELETE FROM account_lockouts WHERE email = p_email;
  END IF;
  
  RETURN jsonb_build_object('locked', false, 'failed_attempts', v_failed_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION validate_password_strength(p_password TEXT)
RETURNS JSONB AS $$
DECLARE
  v_length INTEGER;
  v_has_upper BOOLEAN;
  v_has_lower BOOLEAN;
  v_has_digit BOOLEAN;
  v_has_special BOOLEAN;
  v_strength INTEGER := 0;
  v_errors TEXT[] := ARRAY[]::TEXT[];
BEGIN
  v_length := length(p_password);
  v_has_upper := p_password ~ '[A-Z]';
  v_has_lower := p_password ~ '[a-z]';
  v_has_digit := p_password ~ '[0-9]';
  v_has_special := p_password ~ '[^A-Za-z0-9]';
  
  IF v_length < 12 THEN
    v_errors := array_append(v_errors, 'Password must be at least 12 characters long');
  END IF;
  
  IF NOT v_has_upper THEN
    v_errors := array_append(v_errors, 'Password must contain at least one uppercase letter');
  END IF;
  
  IF NOT v_has_lower THEN
    v_errors := array_append(v_errors, 'Password must contain at least one lowercase letter');
  END IF;
  
  IF NOT v_has_digit THEN
    v_errors := array_append(v_errors, 'Password must contain at least one number');
  END IF;
  
  IF NOT v_has_special THEN
    v_errors := array_append(v_errors, 'Password must contain at least one special character');
  END IF;
  
  IF v_length >= 12 THEN v_strength := v_strength + 1; END IF;
  IF v_has_upper THEN v_strength := v_strength + 1; END IF;
  IF v_has_lower THEN v_strength := v_strength + 1; END IF;
  IF v_has_digit THEN v_strength := v_strength + 1; END IF;
  IF v_has_special THEN v_strength := v_strength + 1; END IF;
  
  RETURN jsonb_build_object(
    'valid', array_length(v_errors, 1) IS NULL,
    'strength', v_strength,
    'errors', v_errors
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_session(
  p_user_id UUID,
  p_session_token TEXT,
  p_device_fingerprint TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_duration_hours INTEGER DEFAULT 24
)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
  v_expires_at TIMESTAMPTZ;
  v_max_sessions INTEGER := 5;
  v_session_count INTEGER;
BEGIN
  v_expires_at := NOW() + (p_duration_hours || ' hours')::INTERVAL;
  
  SELECT COUNT(*) INTO v_session_count
  FROM active_sessions
  WHERE user_id = p_user_id;
  
  IF v_session_count >= v_max_sessions THEN
    DELETE FROM active_sessions
    WHERE id IN (
      SELECT id FROM active_sessions
      WHERE user_id = p_user_id
      ORDER BY last_activity ASC
      LIMIT 1
    );
  END IF;
  
  INSERT INTO active_sessions (
    user_id, session_token, device_fingerprint, 
    ip_address, user_agent, expires_at
  )
  VALUES (
    p_user_id, p_session_token, p_device_fingerprint,
    p_ip_address, p_user_agent, v_expires_at
  )
  RETURNING id INTO v_session_id;
  
  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_session_activity(p_session_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_idle_timeout INTERVAL := '30 minutes';
BEGIN
  UPDATE active_sessions
  SET last_activity = NOW()
  WHERE session_token = p_session_token
    AND expires_at > NOW();
  
  DELETE FROM active_sessions
  WHERE last_activity < NOW() - v_idle_timeout
    OR expires_at < NOW();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION revoke_session(p_session_token TEXT, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM active_sessions
  WHERE session_token = p_session_token
    AND user_id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_sessions(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  device_fingerprint TEXT,
  ip_address TEXT,
  user_agent TEXT,
  last_activity TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id, s.device_fingerprint, s.ip_address, 
    s.user_agent, s.last_activity, s.expires_at, s.created_at
  FROM active_sessions s
  WHERE s.user_id = p_user_id
    AND s.expires_at > NOW()
  ORDER BY s.last_activity DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
  DELETE FROM active_sessions WHERE expires_at < NOW() OR last_activity < NOW() - INTERVAL '30 minutes';
  DELETE FROM account_lockouts WHERE locked_until < NOW();
  DELETE FROM auth_attempts WHERE created_at < NOW() - INTERVAL '30 days';
  DELETE FROM password_history WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE auth_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_lockouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" ON active_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" ON active_sessions
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage auth_attempts" ON auth_attempts
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage account_lockouts" ON account_lockouts
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage password_history" ON password_history
  FOR ALL USING (auth.role() = 'service_role');
