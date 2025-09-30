-- Matter Templates System Migration
-- This migration creates the complete matter templates functionality
-- including templates, sharing, categories, and RLS policies

-- Create template categories table
CREATE TABLE template_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color_code VARCHAR(7) DEFAULT '#3B82F6',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create matter templates table
CREATE TABLE matter_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advocate_id UUID NOT NULL REFERENCES advocates(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL DEFAULT 'General',
  template_data JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_shared BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT matter_templates_name_advocate_unique UNIQUE(name, advocate_id)
);

-- Create template sharing table
CREATE TABLE template_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES matter_templates(id) ON DELETE CASCADE,
  shared_by_advocate_id UUID NOT NULL REFERENCES advocates(id) ON DELETE CASCADE,
  shared_with_advocate_id UUID NOT NULL REFERENCES advocates(id) ON DELETE CASCADE,
  permissions VARCHAR(20) DEFAULT 'read' CHECK (permissions IN ('read', 'copy')),
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT template_shares_unique UNIQUE(template_id, shared_with_advocate_id)
);

-- Add template reference to matters table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'matters' AND column_name = 'template_id'
  ) THEN
    ALTER TABLE matters ADD COLUMN template_id UUID REFERENCES matter_templates(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX idx_matter_templates_advocate_id ON matter_templates(advocate_id);
CREATE INDEX idx_matter_templates_category ON matter_templates(category);
CREATE INDEX idx_matter_templates_is_default ON matter_templates(is_default) WHERE is_default = true;
CREATE INDEX idx_matter_templates_is_shared ON matter_templates(is_shared) WHERE is_shared = true;
CREATE INDEX idx_matter_templates_usage_count ON matter_templates(usage_count DESC);
CREATE INDEX idx_template_shares_shared_with ON template_shares(shared_with_advocate_id);
CREATE INDEX idx_template_shares_template_id ON template_shares(template_id);
CREATE INDEX idx_template_categories_sort_order ON template_categories(sort_order);

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for matter_templates updated_at
CREATE TRIGGER update_matter_templates_updated_at 
  BEFORE UPDATE ON matter_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE matter_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for matter_templates

-- Policy: Users can manage their own templates
CREATE POLICY "Users can manage own templates" ON matter_templates
  FOR ALL USING (advocate_id = auth.uid());

-- Policy: Users can view shared templates
CREATE POLICY "Users can view shared templates" ON matter_templates
  FOR SELECT USING (
    is_shared = true OR 
    advocate_id = auth.uid() OR
    id IN (
      SELECT template_id FROM template_shares 
      WHERE shared_with_advocate_id = auth.uid()
    )
  );

-- RLS Policies for template_shares

-- Policy: Users can manage template shares they created
CREATE POLICY "Users can manage own template shares" ON template_shares
  FOR ALL USING (shared_by_advocate_id = auth.uid());

-- Policy: Users can view shares directed to them
CREATE POLICY "Users can view received shares" ON template_shares
  FOR SELECT USING (shared_with_advocate_id = auth.uid());

-- RLS Policies for template_categories

-- Policy: Everyone can read template categories
CREATE POLICY "Everyone can read template categories" ON template_categories
  FOR SELECT USING (true);

-- Policy: Only authenticated users can manage categories (for future admin features)
CREATE POLICY "Authenticated users can manage categories" ON template_categories
  FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions to authenticated and anon roles
GRANT SELECT ON template_categories TO anon, authenticated;
GRANT ALL PRIVILEGES ON matter_templates TO authenticated;
GRANT ALL PRIVILEGES ON template_shares TO authenticated;
GRANT INSERT, UPDATE, DELETE ON template_categories TO authenticated;

-- Insert default template categories
INSERT INTO template_categories (name, description, color_code, sort_order) VALUES
  ('Commercial Litigation', 'Business disputes and commercial matters', '#DC2626', 1),
  ('Contract Law', 'Contract drafting and disputes', '#2563EB', 2),
  ('Employment Law', 'Labour relations and employment matters', '#059669', 3),
  ('Family Law', 'Divorce, custody, and family matters', '#7C3AED', 4),
  ('Criminal Law', 'Criminal defense and prosecution', '#EA580C', 5),
  ('Property Law', 'Real estate and property transactions', '#0891B2', 6),
  ('Intellectual Property', 'Patents, trademarks, and IP matters', '#BE185D', 7),
  ('Tax Law', 'Tax planning and disputes', '#65A30D', 8),
  ('Constitutional Law', 'Constitutional and human rights matters', '#4338CA', 9),
  ('Administrative Law', 'Government and administrative matters', '#92400E', 10),
  ('General', 'General legal matters', '#6B7280', 11);

-- Create function to increment template usage
CREATE OR REPLACE FUNCTION increment_template_usage(template_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE matter_templates 
  SET usage_count = usage_count + 1 
  WHERE id = template_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's templates with sharing info
CREATE OR REPLACE FUNCTION get_user_templates(user_id UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  description TEXT,
  category VARCHAR(100),
  template_data JSONB,
  is_default BOOLEAN,
  is_shared BOOLEAN,
  usage_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  is_owner BOOLEAN,
  shared_by_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mt.id,
    mt.name,
    mt.description,
    mt.category,
    mt.template_data,
    mt.is_default,
    mt.is_shared,
    mt.usage_count,
    mt.created_at,
    mt.updated_at,
    (mt.advocate_id = user_id) as is_owner,
    CASE 
      WHEN mt.advocate_id = user_id THEN NULL
      ELSE a.name
    END as shared_by_name
  FROM matter_templates mt
  LEFT JOIN advocates a ON mt.advocate_id = a.id
  WHERE 
    mt.advocate_id = user_id OR
    mt.is_shared = true OR
    mt.id IN (
      SELECT ts.template_id 
      FROM template_shares ts 
      WHERE ts.shared_with_advocate_id = user_id
    )
  ORDER BY mt.usage_count DESC, mt.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to suggest templates based on matter data
CREATE OR REPLACE FUNCTION suggest_templates_for_matter(
  user_id UUID,
  matter_type_input TEXT DEFAULT NULL,
  client_type_input TEXT DEFAULT NULL,
  description_input TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  category VARCHAR(100),
  confidence_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mt.id,
    mt.name,
    mt.category,
    CASE 
      WHEN mt.template_data->>'matterType' ILIKE '%' || COALESCE(matter_type_input, '') || '%' THEN 0.8
      WHEN mt.template_data->>'clientType' ILIKE '%' || COALESCE(client_type_input, '') || '%' THEN 0.6
      WHEN mt.template_data->>'description' ILIKE '%' || COALESCE(description_input, '') || '%' THEN 0.4
      ELSE 0.2
    END as confidence_score
  FROM matter_templates mt
  WHERE 
    (mt.advocate_id = user_id OR
     mt.is_shared = true OR
     mt.id IN (
       SELECT ts.template_id 
       FROM template_shares ts 
       WHERE ts.shared_with_advocate_id = user_id
     ))
    AND (
      matter_type_input IS NULL OR
      client_type_input IS NULL OR
      description_input IS NULL OR
      mt.template_data->>'matterType' ILIKE '%' || matter_type_input || '%' OR
      mt.template_data->>'clientType' ILIKE '%' || client_type_input || '%' OR
      mt.template_data->>'description' ILIKE '%' || description_input || '%'
    )
  ORDER BY confidence_score DESC, mt.usage_count DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION increment_template_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_templates(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION suggest_templates_for_matter(UUID, TEXT, TEXT, TEXT) TO authenticated;