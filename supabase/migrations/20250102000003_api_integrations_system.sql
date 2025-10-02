-- API Integrations System Migration
-- This migration creates tables for managing third-party API integrations

-- Create integrations table
CREATE TABLE IF NOT EXISTS public.integrations (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'not_connected' CHECK (status IN ('connected', 'not_connected', 'error', 'pending')),
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('accounting', 'documents', 'productivity', 'communication', 'legal', 'other')),
  config_url TEXT,
  last_sync TIMESTAMPTZ,
  connected_at TIMESTAMPTZ,
  disconnected_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create API configurations table
CREATE TABLE IF NOT EXISTS public.api_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL UNIQUE,
  webhook_url TEXT,
  rate_limit TEXT NOT NULL DEFAULT '100',
  recent_activity JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create integration configs table for storing integration-specific settings
CREATE TABLE IF NOT EXISTS public.integration_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  credentials JSONB,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(integration_id, user_id)
);

-- Create integration metrics table
CREATE TABLE IF NOT EXISTS public.integration_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  average_response_time DECIMAL(10, 2) DEFAULT 0,
  last_request_time TIMESTAMPTZ,
  rate_limit_remaining INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(integration_id, user_id)
);

-- Create webhook events log table
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed')),
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON public.integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON public.integrations(status);
CREATE INDEX IF NOT EXISTS idx_api_configurations_user_id ON public.api_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_api_configurations_api_key ON public.api_configurations(api_key);
CREATE INDEX IF NOT EXISTS idx_integration_configs_user_id ON public.integration_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_integration_configs_integration_id ON public.integration_configs(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_metrics_user_id ON public.integration_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_user_id ON public.webhook_events(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON public.webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.webhook_events(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_configurations_updated_at
  BEFORE UPDATE ON public.api_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integration_configs_updated_at
  BEFORE UPDATE ON public.integration_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integration_metrics_updated_at
  BEFORE UPDATE ON public.integration_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for integrations
CREATE POLICY "Users can view their own integrations"
  ON public.integrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integrations"
  ON public.integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations"
  ON public.integrations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations"
  ON public.integrations FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for api_configurations
CREATE POLICY "Users can view their own API config"
  ON public.api_configurations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API config"
  ON public.api_configurations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API config"
  ON public.api_configurations FOR UPDATE
  USING (auth.uid() = user_id);

-- Create RLS policies for integration_configs
CREATE POLICY "Users can view their own integration configs"
  ON public.integration_configs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integration configs"
  ON public.integration_configs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integration configs"
  ON public.integration_configs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integration configs"
  ON public.integration_configs FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for integration_metrics
CREATE POLICY "Users can view their own integration metrics"
  ON public.integration_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integration metrics"
  ON public.integration_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integration metrics"
  ON public.integration_metrics FOR UPDATE
  USING (auth.uid() = user_id);

-- Create RLS policies for webhook_events
CREATE POLICY "Users can view their own webhook events"
  ON public.webhook_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own webhook events"
  ON public.webhook_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to clean up old webhook events (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_events()
RETURNS void AS $$
BEGIN
  DELETE FROM public.webhook_events
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.integrations TO authenticated;
GRANT ALL ON public.api_configurations TO authenticated;
GRANT ALL ON public.integration_configs TO authenticated;
GRANT ALL ON public.integration_metrics TO authenticated;
GRANT ALL ON public.webhook_events TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.integrations IS 'Stores third-party integration connections for users';
COMMENT ON TABLE public.api_configurations IS 'Stores API keys and configuration for user integrations';
COMMENT ON TABLE public.integration_configs IS 'Stores integration-specific settings and credentials';
COMMENT ON TABLE public.integration_metrics IS 'Tracks usage metrics for integrations';
COMMENT ON TABLE public.webhook_events IS 'Logs webhook events for audit and retry purposes';
