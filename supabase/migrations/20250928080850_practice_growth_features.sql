/*
# Practice Growth & Referral Engine Schema
This migration adds tables and functionality for:
- Overflow Brief Matching marketplace
- Specialisation Directory 
- Reciprocal Brief Tracking
- Referral management system
*/

-- Custom types for practice growth features
CREATE TYPE referral_status AS ENUM ('pending', 'accepted', 'declined', 'completed');
CREATE TYPE brief_status AS ENUM ('available', 'reviewing', 'accepted', 'withdrawn');
CREATE TYPE specialisation_category AS ENUM (
  'administrative_law',
  'banking_finance',
  'commercial_litigation', 
  'constitutional_law',
  'construction_law',
  'criminal_law',
  'employment_law',
  'environmental_law',
  'family_law',
  'insurance_law',
  'intellectual_property',
  'international_law',
  'medical_law',
  'mining_law',
  'property_law',
  'tax_law',
  'other'
);

-- Advocate specialisations with detailed expertise
CREATE TABLE IF NOT EXISTS advocate_specialisations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advocate_id UUID NOT NULL REFERENCES advocates(id) ON DELETE CASCADE,
  category specialisation_category NOT NULL,
  sub_speciality VARCHAR(255),
  years_experience INTEGER CHECK (years_experience >= 0),
  notable_cases TEXT,
  certifications TEXT[],
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(advocate_id, category, sub_speciality)
);

-- Overflow brief marketplace
CREATE TABLE IF NOT EXISTS overflow_briefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  posting_advocate_id UUID NOT NULL REFERENCES advocates(id),
  
  -- Brief details
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  category specialisation_category NOT NULL,
  matter_type VARCHAR(100) NOT NULL,
  bar bar_association NOT NULL,
  
  -- Requirements
  required_experience_years INTEGER DEFAULT 0,
  required_certifications TEXT[],
  language_requirements TEXT[],
  
  -- Financial details
  estimated_fee_range_min DECIMAL(12,2),
  estimated_fee_range_max DECIMAL(12,2),
  fee_type fee_type DEFAULT 'standard',
  referral_percentage DECIMAL(3,2) CHECK (referral_percentage >= 0 AND referral_percentage <= 0.5),
  
  -- Timeline
  deadline DATE,
  expected_duration_days INTEGER,
  is_urgent BOOLEAN DEFAULT false,
  
  -- Status
  status brief_status DEFAULT 'available',
  accepted_by_advocate_id UUID REFERENCES advocates(id),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Visibility controls
  is_public BOOLEAN DEFAULT true,
  visible_to_advocates UUID[] DEFAULT '{}', -- Specific advocates who can see this
  hidden_from_advocates UUID[] DEFAULT '{}', -- Specific advocates who cannot see this
  
  -- Metadata
  view_count INTEGER DEFAULT 0,
  application_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  deleted_at TIMESTAMPTZ
);

-- Applications for overflow briefs
CREATE TABLE IF NOT EXISTS brief_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brief_id UUID NOT NULL REFERENCES overflow_briefs(id) ON DELETE CASCADE,
  advocate_id UUID NOT NULL REFERENCES advocates(id),
  
  -- Application details
  cover_message TEXT NOT NULL,
  proposed_fee DECIMAL(12,2),
  availability_date DATE,
  relevant_experience TEXT,
  
  -- Status
  status referral_status DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(brief_id, advocate_id)
);

-- Enhanced referral tracking with reciprocity
CREATE TABLE IF NOT EXISTS referral_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advocate_a_id UUID NOT NULL REFERENCES advocates(id),
  advocate_b_id UUID NOT NULL REFERENCES advocates(id),
  
  -- Relationship metrics
  referrals_a_to_b INTEGER DEFAULT 0,
  referrals_b_to_a INTEGER DEFAULT 0,
  total_value_a_to_b DECIMAL(12,2) DEFAULT 0,
  total_value_b_to_a DECIMAL(12,2) DEFAULT 0,
  
  -- Reciprocity tracking (updated via triggers)
  reciprocity_ratio DECIMAL(5,2) DEFAULT 1.0,
  last_referral_date TIMESTAMPTZ,
  relationship_quality VARCHAR(20) DEFAULT 'balanced',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT different_advocates CHECK (advocate_a_id != advocate_b_id),
  CONSTRAINT ordered_advocates CHECK (advocate_a_id < advocate_b_id),
  UNIQUE(advocate_a_id, advocate_b_id)
);

-- Automated conflict check logs
CREATE TABLE IF NOT EXISTS conflict_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advocate_id UUID NOT NULL REFERENCES advocates(id),
  matter_id UUID REFERENCES matters(id),
  
  -- Check details
  client_name VARCHAR(255) NOT NULL,
  opposing_parties TEXT[],
  related_parties TEXT[],
  
  -- Results
  has_conflict BOOLEAN DEFAULT false,
  conflict_type VARCHAR(50),
  conflicting_matter_ids UUID[],
  conflict_details TEXT,
  
  -- Resolution
  waiver_obtained BOOLEAN DEFAULT false,
  waiver_details TEXT,
  check_approved_by UUID REFERENCES advocates(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Advocate directory profile enhancements
CREATE TABLE IF NOT EXISTS advocate_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advocate_id UUID UNIQUE NOT NULL REFERENCES advocates(id) ON DELETE CASCADE,
  
  -- Professional profile
  professional_summary TEXT,
  areas_of_expertise TEXT[],
  languages_spoken TEXT[],
  
  -- Availability
  accepting_referrals BOOLEAN DEFAULT true,
  accepting_overflow BOOLEAN DEFAULT true,
  typical_turnaround_days INTEGER,
  
  -- Preferences
  preferred_matter_types TEXT[],
  minimum_brief_value DECIMAL(12,2),
  maximum_brief_value DECIMAL(12,2),
  
  -- Statistics (updated periodically)
  total_referrals_received INTEGER DEFAULT 0,
  total_referrals_given INTEGER DEFAULT 0,
  average_completion_days DECIMAL(5,2),
  success_rate DECIMAL(3,2),
  
  -- Visibility
  is_public BOOLEAN DEFAULT true,
  profile_views INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_advocate_specialisations_advocate ON advocate_specialisations(advocate_id);
CREATE INDEX idx_advocate_specialisations_category ON advocate_specialisations(category);
CREATE INDEX idx_overflow_briefs_status ON overflow_briefs(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_overflow_briefs_category ON overflow_briefs(category) WHERE status = 'available';
CREATE INDEX idx_overflow_briefs_bar ON overflow_briefs(bar) WHERE status = 'available';
CREATE INDEX idx_brief_applications_brief ON brief_applications(brief_id);
CREATE INDEX idx_brief_applications_advocate ON brief_applications(advocate_id);
CREATE INDEX idx_referral_relationships_advocates ON referral_relationships(advocate_a_id, advocate_b_id);
CREATE INDEX idx_conflict_checks_advocate ON conflict_checks(advocate_id);

-- Views for easier querying
CREATE OR REPLACE VIEW available_overflow_briefs AS
SELECT 
  ob.*,
  a.full_name as posting_advocate_name,
  a.bar as posting_advocate_bar,
  COUNT(ba.id) as current_applications
FROM overflow_briefs ob
JOIN advocates a ON ob.posting_advocate_id = a.id
LEFT JOIN brief_applications ba ON ob.id = ba.brief_id
WHERE ob.status = 'available'
  AND ob.deleted_at IS NULL
  AND ob.expires_at > NOW()
GROUP BY ob.id, a.id;

CREATE OR REPLACE VIEW advocate_referral_stats AS
SELECT 
  a.id as advocate_id,
  a.full_name,
  COALESCE(given.total_given, 0) as referrals_given,
  COALESCE(received.total_received, 0) as referrals_received,
  COALESCE(given.value_given, 0) as value_given,
  COALESCE(received.value_received, 0) as value_received,
  CASE 
    WHEN COALESCE(given.total_given, 0) = 0 THEN NULL
    ELSE CAST(COALESCE(received.total_received, 0) AS DECIMAL) / CAST(given.total_given AS DECIMAL)
  END as reciprocity_ratio
FROM advocates a
LEFT JOIN (
  SELECT advocate_a_id as advocate_id, 
         SUM(referrals_a_to_b) as total_given,
         SUM(total_value_a_to_b) as value_given
  FROM referral_relationships
  GROUP BY advocate_a_id
  UNION ALL
  SELECT advocate_b_id as advocate_id,
         SUM(referrals_b_to_a) as total_given,
         SUM(total_value_b_to_a) as value_given
  FROM referral_relationships
  GROUP BY advocate_b_id
) given ON a.id = given.advocate_id
LEFT JOIN (
  SELECT advocate_b_id as advocate_id,
         SUM(referrals_a_to_b) as total_received,
         SUM(total_value_a_to_b) as value_received
  FROM referral_relationships
  GROUP BY advocate_b_id
  UNION ALL
  SELECT advocate_a_id as advocate_id,
         SUM(referrals_b_to_a) as total_received,
         SUM(total_value_b_to_a) as value_received
  FROM referral_relationships
  GROUP BY advocate_a_id
) received ON a.id = received.advocate_id;

-- Functions for referral management
CREATE OR REPLACE FUNCTION update_referral_relationship(
  p_referring_advocate_id UUID,
  p_referred_to_advocate_id UUID,
  p_referral_value DECIMAL
)
RETURNS void AS $$
DECLARE
  v_advocate_a UUID;
  v_advocate_b UUID;
  v_is_a_to_b BOOLEAN;
BEGIN
  -- Ensure consistent ordering
  IF p_referring_advocate_id < p_referred_to_advocate_id THEN
    v_advocate_a := p_referring_advocate_id;
    v_advocate_b := p_referred_to_advocate_id;
    v_is_a_to_b := true;
  ELSE
    v_advocate_a := p_referred_to_advocate_id;
    v_advocate_b := p_referring_advocate_id;
    v_is_a_to_b := false;
  END IF;
  
  -- Insert or update relationship
  INSERT INTO referral_relationships (
    advocate_a_id, advocate_b_id,
    referrals_a_to_b, referrals_b_to_a,
    total_value_a_to_b, total_value_b_to_a,
    last_referral_date
  ) VALUES (
    v_advocate_a, v_advocate_b,
    CASE WHEN v_is_a_to_b THEN 1 ELSE 0 END,
    CASE WHEN v_is_a_to_b THEN 0 ELSE 1 END,
    CASE WHEN v_is_a_to_b THEN p_referral_value ELSE 0 END,
    CASE WHEN v_is_a_to_b THEN 0 ELSE p_referral_value END,
    NOW()
  )
  ON CONFLICT (advocate_a_id, advocate_b_id) DO UPDATE SET
    referrals_a_to_b = referral_relationships.referrals_a_to_b + 
      CASE WHEN v_is_a_to_b THEN 1 ELSE 0 END,
    referrals_b_to_a = referral_relationships.referrals_b_to_a + 
      CASE WHEN v_is_a_to_b THEN 0 ELSE 1 END,
    total_value_a_to_b = referral_relationships.total_value_a_to_b + 
      CASE WHEN v_is_a_to_b THEN p_referral_value ELSE 0 END,
    total_value_b_to_a = referral_relationships.total_value_b_to_a + 
      CASE WHEN v_is_a_to_b THEN 0 ELSE p_referral_value END,
    last_referral_date = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to check if advocate can view a brief
CREATE OR REPLACE FUNCTION can_view_overflow_brief(
  p_advocate_id UUID,
  p_brief_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_brief overflow_briefs%ROWTYPE;
BEGIN
  SELECT * INTO v_brief FROM overflow_briefs WHERE id = p_brief_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Own briefs always visible
  IF v_brief.posting_advocate_id = p_advocate_id THEN
    RETURN true;
  END IF;
  
  -- Check if hidden
  IF p_advocate_id = ANY(v_brief.hidden_from_advocates) THEN
    RETURN false;
  END IF;
  
  -- Check if public or specifically visible
  IF v_brief.is_public OR p_advocate_id = ANY(v_brief.visible_to_advocates) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Apply RLS policies
ALTER TABLE advocate_specialisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE overflow_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE brief_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE conflict_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE advocate_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Advocates manage own specialisations" ON advocate_specialisations
  FOR ALL USING (auth.uid()::text = advocate_id::text);

CREATE POLICY "Advocates view available briefs" ON overflow_briefs
  FOR SELECT USING (can_view_overflow_brief(auth.uid(), id));

CREATE POLICY "Advocates manage own briefs" ON overflow_briefs
  FOR INSERT WITH CHECK (auth.uid()::text = posting_advocate_id::text);
  
CREATE POLICY "Advocates update own briefs" ON overflow_briefs
  FOR UPDATE USING (auth.uid()::text = posting_advocate_id::text);

CREATE POLICY "Advocates manage own applications" ON brief_applications
  FOR ALL USING (auth.uid()::text = advocate_id::text);

CREATE POLICY "Brief owners view applications" ON brief_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM overflow_briefs 
      WHERE id = brief_applications.brief_id 
      AND posting_advocate_id = auth.uid()
    )
  );

CREATE POLICY "Advocates view own referral relationships" ON referral_relationships
  FOR SELECT USING (
    auth.uid()::text = advocate_a_id::text OR 
    auth.uid()::text = advocate_b_id::text
  );

CREATE POLICY "Advocates view own conflict checks" ON conflict_checks
  FOR ALL USING (auth.uid()::text = advocate_id::text);

CREATE POLICY "Advocates manage own profile" ON advocate_profiles
  FOR ALL USING (auth.uid()::text = advocate_id::text);

CREATE POLICY "Public profiles viewable" ON advocate_profiles
  FOR SELECT USING (is_public = true);

