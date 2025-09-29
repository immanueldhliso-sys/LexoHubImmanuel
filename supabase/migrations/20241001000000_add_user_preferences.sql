-- Migration: Add user preferences table for advanced features toggle
-- Created: 2024-10-01
-- Description: Creates user_preferences table to store advanced feature toggle settings

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  advanced_features JSONB NOT NULL DEFAULT '{
    "financial_growth_tools": false,
    "ai_document_intelligence": false,
    "professional_development": false
  }',
  feature_discovery JSONB NOT NULL DEFAULT '{
    "notification_shown": false,
    "notification_dismissed_at": null,
    "first_login_date": null
  }',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_advanced_features ON user_preferences USING GIN(advanced_features);
CREATE INDEX IF NOT EXISTS idx_user_preferences_feature_discovery ON user_preferences USING GIN(feature_discovery);

-- Add RLS policies
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;

-- Create RLS policies
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to automatically create user preferences on user creation
CREATE OR REPLACE FUNCTION create_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id, feature_discovery)
  VALUES (
    NEW.id,
    jsonb_build_object(
      'notification_shown', false,
      'notification_dismissed_at', null,
      'first_login_date', NOW()
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user preferences
DROP TRIGGER IF EXISTS create_user_preferences_trigger ON auth.users;
CREATE TRIGGER create_user_preferences_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_preferences();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_user_preferences_updated_at_trigger ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at_trigger
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();

-- Insert default preferences for existing users (if any)
INSERT INTO user_preferences (user_id, feature_discovery)
SELECT 
  id,
  jsonb_build_object(
    'notification_shown', false,
    'notification_dismissed_at', null,
    'first_login_date', COALESCE(created_at, NOW())
  )
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE user_preferences IS 'Stores user preferences for advanced features and feature discovery settings';
COMMENT ON COLUMN user_preferences.advanced_features IS 'JSON object containing boolean flags for each advanced feature category';
COMMENT ON COLUMN user_preferences.feature_discovery IS 'JSON object containing feature discovery notification state and timestamps';