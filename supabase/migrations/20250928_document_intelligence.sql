/*
# Document & Data Intelligence Schema
This migration adds tables and functionality for:
- Brief Analysis AI
- Automated Fee Narrative Generator
- Community Precedent Bank
- Document intelligence and analytics
*/

-- Custom types for document intelligence
CREATE TYPE document_status AS ENUM ('processing', 'indexed', 'analyzed', 'error');
CREATE TYPE precedent_type AS ENUM (
  'pleadings',
  'notices',
  'affidavits',
  'heads_of_argument',
  'opinions',
  'contracts',
  'correspondence',
  'court_orders',
  'other'
);
CREATE TYPE analysis_type AS ENUM ('brief', 'contract', 'opinion', 'pleading', 'general');

-- Enhanced documents table with AI analysis
CREATE TABLE IF NOT EXISTS document_intelligence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID UNIQUE NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  
  -- Analysis results
  analysis_type analysis_type,
  extracted_entities JSONB, -- parties, dates, amounts, etc.
  key_issues TEXT[],
  risk_factors JSONB,
  suggested_actions TEXT[],
  
  -- Brief-specific analysis
  is_brief BOOLEAN DEFAULT false,
  brief_deadline DATE,
  brief_court VARCHAR(255),
  brief_judge VARCHAR(255),
  opposing_counsel VARCHAR(255),
  matter_value DECIMAL(12,2),
  complexity_score INTEGER CHECK (complexity_score >= 1 AND complexity_score <= 10),
  
  -- Document intelligence
  summary TEXT,
  key_dates DATE[],
  referenced_cases TEXT[],
  applicable_laws TEXT[],
  
  -- Processing status
  status document_status DEFAULT 'processing',
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Metadata
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fee narrative templates with AI learning
CREATE TABLE IF NOT EXISTS fee_narrative_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advocate_id UUID REFERENCES advocates(id),
  
  -- Template details
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  matter_type VARCHAR(100),
  
  -- Template content with variables
  template_text TEXT NOT NULL,
  variables JSONB, -- {variable_name: description}
  
  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  success_rate DECIMAL(3,2), -- based on payment rate
  
  -- Sharing
  is_public BOOLEAN DEFAULT false,
  is_community_approved BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI-generated fee narratives
CREATE TABLE IF NOT EXISTS generated_fee_narratives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  matter_id UUID NOT NULL REFERENCES matters(id),
  advocate_id UUID NOT NULL REFERENCES advocates(id),
  
  -- Generation details
  template_id UUID REFERENCES fee_narrative_templates(id),
  time_entries_analyzed INTEGER,
  
  -- Generated content
  narrative_text TEXT NOT NULL,
  work_categories JSONB, -- categorized time entries
  key_activities TEXT[],
  value_propositions TEXT[],
  
  -- Enhancements
  suggested_improvements TEXT[],
  missing_elements TEXT[],
  
  -- Quality metrics
  clarity_score DECIMAL(3,2),
  completeness_score DECIMAL(3,2),
  professionalism_score DECIMAL(3,2),
  
  -- User feedback
  was_edited BOOLEAN DEFAULT false,
  final_narrative TEXT,
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Community precedent bank
CREATE TABLE IF NOT EXISTS precedent_bank (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contributor_id UUID NOT NULL REFERENCES advocates(id),
  
  -- Document details
  title VARCHAR(500) NOT NULL,
  description TEXT,
  precedent_type precedent_type NOT NULL,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  
  -- Content
  document_id UUID REFERENCES documents(id),
  template_content TEXT,
  
  -- Jurisdiction and applicability
  bar bar_association,
  court_level VARCHAR(50), -- magistrate, high_court, sca, constitutional
  applicable_laws TEXT[],
  year_created INTEGER,
  
  -- Quality and usage
  quality_score DECIMAL(3,2) DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  rating_sum INTEGER DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) GENERATED ALWAYS AS (
    CASE WHEN rating_count > 0 THEN rating_sum::DECIMAL / rating_count ELSE 0 END
  ) STORED,
  
  -- Metadata
  tags TEXT[],
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES advocates(id),
  verification_date TIMESTAMPTZ,
  
  -- Versioning
  version INTEGER DEFAULT 1,
  parent_precedent_id UUID REFERENCES precedent_bank(id),
  change_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Precedent usage tracking
CREATE TABLE IF NOT EXISTS precedent_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  precedent_id UUID NOT NULL REFERENCES precedent_bank(id),
  advocate_id UUID NOT NULL REFERENCES advocates(id),
  matter_id UUID REFERENCES matters(id),
  
  -- Usage details
  download_date TIMESTAMPTZ DEFAULT NOW(),
  usage_date TIMESTAMPTZ,
  modifications_made BOOLEAN DEFAULT false,
  
  -- Outcome tracking
  was_successful BOOLEAN,
  outcome_notes TEXT,
  
  -- Rating
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document analysis queue
CREATE TABLE IF NOT EXISTS document_analysis_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id),
  advocate_id UUID NOT NULL REFERENCES advocates(id),
  
  -- Queue management
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  analysis_type analysis_type NOT NULL,
  requested_features TEXT[], -- specific analysis features requested
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  
  -- Results
  completed_at TIMESTAMPTZ,
  result_id UUID REFERENCES document_intelligence(id),
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_document_intelligence_document ON document_intelligence(document_id);
CREATE INDEX idx_document_intelligence_status ON document_intelligence(status);
CREATE INDEX idx_document_intelligence_brief ON document_intelligence(is_brief) WHERE is_brief = true;
CREATE INDEX idx_fee_narrative_templates_advocate ON fee_narrative_templates(advocate_id);
CREATE INDEX idx_fee_narrative_templates_public ON fee_narrative_templates(is_public) WHERE is_public = true;
CREATE INDEX idx_generated_narratives_invoice ON generated_fee_narratives(invoice_id);
CREATE INDEX idx_generated_narratives_matter ON generated_fee_narratives(matter_id);
CREATE INDEX idx_precedent_bank_type ON precedent_bank(precedent_type);
CREATE INDEX idx_precedent_bank_category ON precedent_bank(category);
CREATE INDEX idx_precedent_bank_verified ON precedent_bank(is_verified) WHERE is_verified = true;
CREATE INDEX idx_precedent_bank_search ON precedent_bank USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX idx_precedent_usage_precedent ON precedent_usage(precedent_id);
CREATE INDEX idx_precedent_usage_advocate ON precedent_usage(advocate_id);
CREATE INDEX idx_analysis_queue_status ON document_analysis_queue(status, priority DESC);

-- Views for easier querying
CREATE OR REPLACE VIEW popular_precedents AS
SELECT 
  p.*,
  COUNT(DISTINCT u.advocate_id) as unique_users,
  COUNT(u.id) as total_uses,
  AVG(u.rating) as usage_rating
FROM precedent_bank p
LEFT JOIN precedent_usage u ON p.id = u.precedent_id
WHERE p.deleted_at IS NULL
GROUP BY p.id
ORDER BY p.download_count DESC, p.average_rating DESC;

CREATE OR REPLACE VIEW fee_narrative_performance AS
SELECT 
  t.id as template_id,
  t.name as template_name,
  t.category,
  COUNT(DISTINCT g.id) as times_used,
  AVG(g.clarity_score) as avg_clarity,
  AVG(g.completeness_score) as avg_completeness,
  AVG(g.professionalism_score) as avg_professionalism,
  SUM(CASE WHEN g.was_edited THEN 1 ELSE 0 END)::DECIMAL / COUNT(g.id) as edit_rate,
  AVG(g.user_rating) as avg_user_rating
FROM fee_narrative_templates t
JOIN generated_fee_narratives g ON t.id = g.template_id
GROUP BY t.id;

-- Functions for document intelligence
CREATE OR REPLACE FUNCTION analyze_brief_document(p_document_id UUID)
RETURNS UUID AS $$
DECLARE
  v_queue_id UUID;
BEGIN
  -- Add to analysis queue with high priority for briefs
  INSERT INTO document_analysis_queue (
    document_id,
    advocate_id,
    priority,
    analysis_type,
    requested_features
  )
  SELECT 
    p_document_id,
    d.advocate_id,
    9, -- High priority for briefs
    'brief',
    ARRAY['extract_parties', 'extract_dates', 'identify_issues', 'assess_complexity']
  FROM documents d
  WHERE d.id = p_document_id
  RETURNING id INTO v_queue_id;
  
  RETURN v_queue_id;
END;
$$ LANGUAGE plpgsql;

-- Function to generate fee narrative
CREATE OR REPLACE FUNCTION generate_fee_narrative(
  p_matter_id UUID,
  p_time_entry_ids UUID[],
  p_template_id UUID DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  v_narrative TEXT;
  v_work_summary JSONB;
  v_total_hours DECIMAL;
  v_key_activities TEXT[];
BEGIN
  -- Aggregate time entries by category
  WITH time_summary AS (
    SELECT 
      CASE 
        WHEN description ILIKE '%draft%' THEN 'Drafting'
        WHEN description ILIKE '%research%' THEN 'Research'
        WHEN description ILIKE '%consult%' OR description ILIKE '%meeting%' THEN 'Consultation'
        WHEN description ILIKE '%court%' OR description ILIKE '%hearing%' THEN 'Court Appearance'
        WHEN description ILIKE '%review%' THEN 'Review'
        ELSE 'General Legal Services'
      END as category,
      SUM(duration_minutes) / 60.0 as hours,
      COUNT(*) as entries,
      AVG(rate) as avg_rate
    FROM time_entries
    WHERE id = ANY(p_time_entry_ids)
    GROUP BY 1
  )
  SELECT 
    jsonb_agg(jsonb_build_object(
      'category', category,
      'hours', hours,
      'entries', entries,
      'avg_rate', avg_rate
    )),
    SUM(hours)
  INTO v_work_summary, v_total_hours
  FROM time_summary;
  
  -- Extract key activities
  SELECT ARRAY_AGG(DISTINCT 
    CASE 
      WHEN description ILIKE '%draft%' THEN regexp_replace(description, '^.*?(draft\w*\s+\w+(?:\s+\w+)?)', '\1', 'i')
      WHEN description ILIKE '%review%' THEN regexp_replace(description, '^.*?(review\w*\s+\w+(?:\s+\w+)?)', '\1', 'i')
      ELSE left(description, 50)
    END
  )
  INTO v_key_activities
  FROM time_entries
  WHERE id = ANY(p_time_entry_ids)
  LIMIT 10;
  
  -- Build narrative (simplified version - in production, this would use AI)
  v_narrative := format(
    E'PROFESSIONAL SERVICES RENDERED\n\n' ||
    E'We have completed %s hours of professional legal services in this matter.\n\n' ||
    E'SUMMARY OF WORK:\n%s\n\n' ||
    E'KEY ACTIVITIES:\n%s\n\n' ||
    E'All services were rendered with professional care and diligence.',
    round(v_total_hours, 1),
    (
      SELECT string_agg(
        format('• %s: %s hours', 
          obj->>'category', 
          round((obj->>'hours')::numeric, 1)
        ), 
        E'\n'
      )
      FROM jsonb_array_elements(v_work_summary) obj
    ),
    (
      SELECT string_agg('• ' || activity, E'\n')
      FROM unnest(v_key_activities) activity
    )
  );
  
  RETURN v_narrative;
END;
$$ LANGUAGE plpgsql;

-- Function to rate precedent
CREATE OR REPLACE FUNCTION rate_precedent(
  p_precedent_id UUID,
  p_advocate_id UUID,
  p_rating INTEGER,
  p_review TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Update or insert usage record
  INSERT INTO precedent_usage (
    precedent_id,
    advocate_id,
    rating,
    review
  ) VALUES (
    p_precedent_id,
    p_advocate_id,
    p_rating,
    p_review
  )
  ON CONFLICT (precedent_id, advocate_id) 
  DO UPDATE SET
    rating = p_rating,
    review = p_review,
    updated_at = NOW();
  
  -- Update precedent statistics
  UPDATE precedent_bank
  SET 
    rating_sum = rating_sum + p_rating,
    rating_count = rating_count + 1,
    updated_at = NOW()
  WHERE id = p_precedent_id;
END;
$$ LANGUAGE plpgsql;

-- Apply RLS policies
ALTER TABLE document_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_narrative_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_fee_narratives ENABLE ROW LEVEL SECURITY;
ALTER TABLE precedent_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE precedent_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_analysis_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Advocates see own document intelligence" ON document_intelligence
  FOR ALL USING (
    document_id IN (
      SELECT id FROM documents WHERE advocate_id = auth.uid()
    )
  );

CREATE POLICY "Advocates manage own fee templates" ON fee_narrative_templates
  FOR ALL USING (advocate_id = auth.uid() OR is_public = true);

CREATE POLICY "Advocates see own generated narratives" ON generated_fee_narratives
  FOR ALL USING (advocate_id = auth.uid());

CREATE POLICY "Public precedents viewable by all" ON precedent_bank
  FOR SELECT USING (true);

CREATE POLICY "Advocates manage own precedents" ON precedent_bank
  FOR INSERT WITH CHECK (contributor_id = auth.uid());
  
CREATE POLICY "Advocates update own precedents" ON precedent_bank
  FOR UPDATE USING (contributor_id = auth.uid());

CREATE POLICY "Advocates track own usage" ON precedent_usage
  FOR ALL USING (advocate_id = auth.uid());

CREATE POLICY "Advocates see own analysis queue" ON document_analysis_queue
  FOR ALL USING (advocate_id = auth.uid());

