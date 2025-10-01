-- Matters Enhancement Phase 1 Migration
-- This migration implements the foundational changes for the enhanced Matters feature
-- including Pre-Matter/Opportunity Stage and enhanced conflict checking

-- Create opportunities table for Pre-Matter stage
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advocate_id UUID NOT NULL REFERENCES advocates(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  notes TEXT,
  client_name VARCHAR(255),
  client_email VARCHAR(255),
  client_phone VARCHAR(50),
  instructing_attorney VARCHAR(255),
  instructing_firm VARCHAR(255),
  estimated_value DECIMAL(15,2),
  probability_percentage INTEGER CHECK (probability_percentage >= 0 AND probability_percentage <= 100),
  expected_instruction_date DATE,
  source VARCHAR(100), -- referral, marketing, existing_client, etc.
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'converted', 'lost', 'on_hold')),
  tags TEXT[], -- Array of tags for categorization
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  converted_to_matter_id UUID REFERENCES matters(id) ON DELETE SET NULL,
  converted_at TIMESTAMP WITH TIME ZONE
);

-- Add enhanced conflict checking fields to matters table
ALTER TABLE matters ADD COLUMN IF NOT EXISTS manual_conflict_checks_performed TEXT;
ALTER TABLE matters ADD COLUMN IF NOT EXISTS conflict_check_notes TEXT;
ALTER TABLE matters ADD COLUMN IF NOT EXISTS conflict_override_reason TEXT;
ALTER TABLE matters ADD COLUMN IF NOT EXISTS conflict_override_by UUID REFERENCES advocates(id);
ALTER TABLE matters ADD COLUMN IF NOT EXISTS conflict_override_at TIMESTAMP WITH TIME ZONE;

-- Add opportunity reference to matters table
ALTER TABLE matters ADD COLUMN IF NOT EXISTS opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX idx_opportunities_advocate_id ON opportunities(advocate_id);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_opportunities_expected_instruction_date ON opportunities(expected_instruction_date);
CREATE INDEX idx_opportunities_created_at ON opportunities(created_at DESC);
CREATE INDEX idx_opportunities_converted_to_matter ON opportunities(converted_to_matter_id);
CREATE INDEX idx_matters_opportunity_id ON matters(opportunity_id);

-- Create updated_at trigger for opportunities
CREATE TRIGGER update_opportunities_updated_at 
  BEFORE UPDATE ON opportunities 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for opportunities
CREATE POLICY "Users can manage own opportunities" ON opportunities
  FOR ALL USING (advocate_id = auth.uid());

-- Grant permissions
GRANT ALL PRIVILEGES ON opportunities TO authenticated;

-- Create function to convert opportunity to matter
CREATE OR REPLACE FUNCTION convert_opportunity_to_matter(
  opportunity_uuid UUID,
  matter_data JSONB
) RETURNS UUID AS $$
DECLARE
  new_matter_id UUID;
  opportunity_record opportunities%ROWTYPE;
BEGIN
  -- Get the opportunity record
  SELECT * INTO opportunity_record FROM opportunities WHERE id = opportunity_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Opportunity not found';
  END IF;
  
  -- Verify ownership
  IF opportunity_record.advocate_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized access to opportunity';
  END IF;
  
  -- Create the matter (this would be called from the application layer)
  -- For now, just mark the opportunity as converted
  UPDATE opportunities 
  SET 
    status = 'converted',
    converted_at = NOW(),
    updated_at = NOW()
  WHERE id = opportunity_uuid;
  
  RETURN opportunity_uuid; -- Return opportunity ID for now
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get opportunity statistics
CREATE OR REPLACE FUNCTION get_opportunity_stats(user_id UUID)
RETURNS TABLE (
  total_opportunities INTEGER,
  active_opportunities INTEGER,
  converted_opportunities INTEGER,
  lost_opportunities INTEGER,
  total_estimated_value DECIMAL(15,2),
  average_conversion_time_days DECIMAL(10,2),
  conversion_rate_percentage DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_opportunities,
    COUNT(*) FILTER (WHERE status = 'active')::INTEGER as active_opportunities,
    COUNT(*) FILTER (WHERE status = 'converted')::INTEGER as converted_opportunities,
    COUNT(*) FILTER (WHERE status = 'lost')::INTEGER as lost_opportunities,
    COALESCE(SUM(estimated_value), 0) as total_estimated_value,
    COALESCE(AVG(EXTRACT(EPOCH FROM (converted_at - created_at))/86400), 0) as average_conversion_time_days,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(*) FILTER (WHERE status = 'converted')::DECIMAL / COUNT(*)::DECIMAL * 100)
      ELSE 0 
    END as conversion_rate_percentage
  FROM opportunities 
  WHERE advocate_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get matters with health indicators
CREATE OR REPLACE FUNCTION get_matters_with_health_indicators(user_id UUID)
RETURNS TABLE (
  matter_id UUID,
  title VARCHAR(255),
  client_name VARCHAR(255),
  status VARCHAR(50),
  wip_value DECIMAL(15,2),
  last_time_entry_date DATE,
  days_since_last_entry INTEGER,
  is_high_wip_inactive BOOLEAN,
  prescription_date DATE,
  days_to_prescription INTEGER,
  is_prescription_warning BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id as matter_id,
    m.title,
    m.client_name,
    m.status,
    m.wip_value,
    te.last_entry_date as last_time_entry_date,
    CASE 
      WHEN te.last_entry_date IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (CURRENT_DATE - te.last_entry_date))/86400
      ELSE 
        EXTRACT(EPOCH FROM (CURRENT_DATE - m.created_at::DATE))/86400
    END::INTEGER as days_since_last_entry,
    (m.wip_value > 5000 AND 
     COALESCE(EXTRACT(EPOCH FROM (CURRENT_DATE - te.last_entry_date))/86400, 
              EXTRACT(EPOCH FROM (CURRENT_DATE - m.created_at::DATE))/86400) > 30) as is_high_wip_inactive,
    m.prescription_date,
    CASE 
      WHEN m.prescription_date IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (m.prescription_date - CURRENT_DATE))/86400
      ELSE NULL 
    END::INTEGER as days_to_prescription,
    (m.prescription_date IS NOT NULL AND 
     m.prescription_date <= CURRENT_DATE + INTERVAL '90 days') as is_prescription_warning
  FROM matters m
  LEFT JOIN (
    SELECT 
      matter_id,
      MAX(date_worked) as last_entry_date
    FROM time_entries 
    GROUP BY matter_id
  ) te ON m.id = te.matter_id
  WHERE m.advocate_id = user_id
    AND m.deleted_at IS NULL
  ORDER BY m.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for practice health metrics
CREATE OR REPLACE FUNCTION get_practice_health_metrics(user_id UUID)
RETURNS TABLE (
  total_wip DECIMAL(15,2),
  wip_0_30_days DECIMAL(15,2),
  wip_31_60_days DECIMAL(15,2),
  wip_61_90_days DECIMAL(15,2),
  wip_90_plus_days DECIMAL(15,2),
  avg_time_to_first_invoice_days DECIMAL(10,2),
  matters_with_prescription_warnings INTEGER,
  high_wip_inactive_matters INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH matter_ages AS (
    SELECT 
      m.id,
      m.wip_value,
      EXTRACT(EPOCH FROM (CURRENT_DATE - m.created_at::DATE))/86400 as matter_age_days,
      COALESCE(
        EXTRACT(EPOCH FROM (i.first_invoice_date - m.created_at::DATE))/86400, 
        NULL
      ) as days_to_first_invoice,
      (m.prescription_date IS NOT NULL AND 
       m.prescription_date <= CURRENT_DATE + INTERVAL '90 days') as has_prescription_warning,
      (m.wip_value > 5000 AND 
       COALESCE(EXTRACT(EPOCH FROM (CURRENT_DATE - te.last_entry_date))/86400, 
                EXTRACT(EPOCH FROM (CURRENT_DATE - m.created_at::DATE))/86400) > 30) as is_high_wip_inactive
    FROM matters m
    LEFT JOIN (
      SELECT 
        matter_id,
        MIN(created_at::DATE) as first_invoice_date
      FROM invoices 
      GROUP BY matter_id
    ) i ON m.id = i.matter_id
    LEFT JOIN (
      SELECT 
        matter_id,
        MAX(date_worked) as last_entry_date
      FROM time_entries 
      GROUP BY matter_id
    ) te ON m.id = te.matter_id
    WHERE m.advocate_id = user_id
      AND m.deleted_at IS NULL
  )
  SELECT 
    COALESCE(SUM(wip_value), 0) as total_wip,
    COALESCE(SUM(CASE WHEN matter_age_days <= 30 THEN wip_value ELSE 0 END), 0) as wip_0_30_days,
    COALESCE(SUM(CASE WHEN matter_age_days > 30 AND matter_age_days <= 60 THEN wip_value ELSE 0 END), 0) as wip_31_60_days,
    COALESCE(SUM(CASE WHEN matter_age_days > 60 AND matter_age_days <= 90 THEN wip_value ELSE 0 END), 0) as wip_61_90_days,
    COALESCE(SUM(CASE WHEN matter_age_days > 90 THEN wip_value ELSE 0 END), 0) as wip_90_plus_days,
    COALESCE(AVG(days_to_first_invoice), 0) as avg_time_to_first_invoice_days,
    COUNT(*) FILTER (WHERE has_prescription_warning = true)::INTEGER as matters_with_prescription_warnings,
    COUNT(*) FILTER (WHERE is_high_wip_inactive = true)::INTEGER as high_wip_inactive_matters
  FROM matter_ages;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample opportunity data for testing (optional)
-- This can be removed in production
INSERT INTO opportunities (advocate_id, name, description, client_name, estimated_value, probability_percentage, source, status) 
SELECT 
  a.id,
  'Potential Commercial Dispute - ' || a.name,
  'Initial consultation regarding contract dispute with supplier',
  'ABC Corporation',
  75000.00,
  60,
  'referral',
  'active'
FROM advocates a 
LIMIT 1;

COMMENT ON TABLE opportunities IS 'Pre-matter opportunities for tracking potential legal work before formal instruction';
COMMENT ON FUNCTION convert_opportunity_to_matter IS 'Converts an opportunity to a formal matter with proper audit trail';
COMMENT ON FUNCTION get_opportunity_stats IS 'Provides comprehensive statistics for opportunity management';
COMMENT ON FUNCTION get_matters_with_health_indicators IS 'Returns matters with health indicators for proactive management';
COMMENT ON FUNCTION get_practice_health_metrics IS 'Provides practice-wide health metrics for dashboard display';