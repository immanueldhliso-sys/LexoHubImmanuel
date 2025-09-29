-- Migration: Workflow & External Integrations
-- Features: Court Integration, Automated Court Diary Sync, Judge Analytics, Voice-Activated Queries, Language Accessibility

-- Court Registry Integration
CREATE TABLE court_registries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  jurisdiction TEXT NOT NULL,
  address TEXT,
  contact_details JSONB,
  integration_status TEXT DEFAULT 'inactive' CHECK (integration_status IN ('active', 'inactive', 'maintenance')),
  api_endpoint TEXT,
  api_credentials_encrypted TEXT,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Court Cases and Diary Management
CREATE TABLE court_cases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  matter_id UUID REFERENCES matters(id) ON DELETE CASCADE,
  court_registry_id UUID REFERENCES court_registries(id),
  case_number TEXT NOT NULL,
  case_type TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'postponed', 'finalized', 'struck_off')),
  filing_date DATE,
  allocated_judge_id UUID,
  court_room TEXT,
  case_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(court_registry_id, case_number)
);

-- Court Diary Entries
CREATE TABLE court_diary_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  court_case_id UUID REFERENCES court_cases(id) ON DELETE CASCADE,
  advocate_id UUID REFERENCES advocates(id),
  hearing_date DATE NOT NULL,
  hearing_time TIME,
  hearing_type TEXT NOT NULL,
  description TEXT,
  outcome TEXT,
  next_hearing_date DATE,
  notes TEXT,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed')),
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Judge Information and Analytics
CREATE TABLE judges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT,
  court_registry_id UUID REFERENCES court_registries(id),
  specializations TEXT[],
  appointment_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'retired', 'transferred')),
  bio TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Judge Analytics and Performance Metrics
CREATE TABLE judge_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  judge_id UUID REFERENCES judges(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_cases_heard INTEGER DEFAULT 0,
  average_hearing_duration INTERVAL,
  postponement_rate DECIMAL(5,2),
  judgment_delivery_time_avg INTERVAL,
  case_types_distribution JSONB,
  ruling_patterns JSONB,
  advocate_interactions JSONB,
  performance_score DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(judge_id, period_start, period_end)
);

-- Voice Query Processing
CREATE TABLE voice_queries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  advocate_id UUID REFERENCES advocates(id),
  query_text TEXT NOT NULL,
  query_language TEXT DEFAULT 'en',
  intent TEXT,
  confidence_score DECIMAL(3,2),
  extracted_entities JSONB,
  response_text TEXT,
  response_actions JSONB,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Language Support and Translations
CREATE TABLE language_translations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL,
  language_code TEXT NOT NULL CHECK (language_code IN ('en', 'af', 'zu', 'xh', 'st', 'tn', 'ss', 've', 'ts', 'nr', 'nd')),
  translation TEXT NOT NULL,
  context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(key, language_code)
);

-- Court Integration Logs
CREATE TABLE court_integration_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  court_registry_id UUID REFERENCES court_registries(id),
  sync_type TEXT NOT NULL CHECK (sync_type IN ('diary_sync', 'case_update', 'judge_info', 'full_sync')),
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed', 'partial')),
  records_processed INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_details JSONB,
  sync_duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_court_cases_matter_id ON court_cases(matter_id);
CREATE INDEX idx_court_cases_case_number ON court_cases(case_number);
CREATE INDEX idx_court_diary_hearing_date ON court_diary_entries(hearing_date);
CREATE INDEX idx_court_diary_advocate_id ON court_diary_entries(advocate_id);
CREATE INDEX idx_judges_court_registry ON judges(court_registry_id);
CREATE INDEX idx_judge_analytics_judge_period ON judge_analytics(judge_id, period_start, period_end);
CREATE INDEX idx_voice_queries_advocate_created ON voice_queries(advocate_id, created_at);
CREATE INDEX idx_language_translations_key_lang ON language_translations(key, language_code);

-- RLS Policies
ALTER TABLE court_registries ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE language_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_integration_logs ENABLE ROW LEVEL SECURITY;

-- Court registries are visible to all authenticated users
CREATE POLICY "Court registries are visible to authenticated users" ON court_registries
  FOR SELECT USING (auth.role() = 'authenticated');

-- Court cases are visible to advocates involved in the matter
CREATE POLICY "Court cases visible to matter advocates" ON court_cases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM matters m 
      WHERE m.id = court_cases.matter_id 
      AND m.advocate_id = auth.uid()
    )
  );

-- Court diary entries are visible to the assigned advocate
CREATE POLICY "Court diary visible to assigned advocate" ON court_diary_entries
  FOR ALL USING (advocate_id = auth.uid());

-- Judges are visible to all authenticated users
CREATE POLICY "Judges are visible to authenticated users" ON judges
  FOR SELECT USING (auth.role() = 'authenticated');

-- Judge analytics are visible to all authenticated users
CREATE POLICY "Judge analytics visible to authenticated users" ON judge_analytics
  FOR SELECT USING (auth.role() = 'authenticated');

-- Voice queries belong to the creating advocate
CREATE POLICY "Voice queries belong to advocate" ON voice_queries
  FOR ALL USING (advocate_id = auth.uid());

-- Language translations are visible to all authenticated users
CREATE POLICY "Language translations visible to authenticated users" ON language_translations
  FOR SELECT USING (auth.role() = 'authenticated');

-- Court integration logs are visible to all authenticated users
CREATE POLICY "Court integration logs visible to authenticated users" ON court_integration_logs
  FOR SELECT USING (auth.role() = 'authenticated');

-- Functions

-- Function to sync court diary entries
CREATE OR REPLACE FUNCTION sync_court_diary(p_court_registry_id UUID, p_advocate_id UUID)
RETURNS JSON AS $$
DECLARE
  v_sync_log_id UUID;
  v_records_processed INTEGER := 0;
  v_records_updated INTEGER := 0;
  v_start_time TIMESTAMPTZ := NOW();
BEGIN
  -- Create sync log entry
  INSERT INTO court_integration_logs (court_registry_id, sync_type, status)
  VALUES (p_court_registry_id, 'diary_sync', 'started')
  RETURNING id INTO v_sync_log_id;
  
  -- Here would be the actual sync logic with external court system
  -- For now, we'll simulate some processing
  v_records_processed := 10;
  v_records_updated := 8;
  
  -- Update sync log
  UPDATE court_integration_logs 
  SET 
    status = 'completed',
    records_processed = v_records_processed,
    records_updated = v_records_updated,
    sync_duration_ms = EXTRACT(EPOCH FROM (NOW() - v_start_time)) * 1000
  WHERE id = v_sync_log_id;
  
  RETURN json_build_object(
    'success', true,
    'records_processed', v_records_processed,
    'records_updated', v_records_updated,
    'sync_log_id', v_sync_log_id
  );
EXCEPTION WHEN OTHERS THEN
  -- Update sync log with error
  UPDATE court_integration_logs 
  SET 
    status = 'failed',
    error_details = json_build_object('error', SQLERRM),
    sync_duration_ms = EXTRACT(EPOCH FROM (NOW() - v_start_time)) * 1000
  WHERE id = v_sync_log_id;
  
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process voice queries
CREATE OR REPLACE FUNCTION process_voice_query(
  p_advocate_id UUID,
  p_query_text TEXT,
  p_language_code TEXT DEFAULT 'en'
)
RETURNS JSON AS $$
DECLARE
  v_query_id UUID;
  v_intent TEXT;
  v_confidence DECIMAL(3,2);
  v_response TEXT;
  v_actions JSONB;
BEGIN
  -- Simple intent detection (in practice, this would use NLP/AI)
  IF p_query_text ILIKE '%diary%' OR p_query_text ILIKE '%court%' OR p_query_text ILIKE '%hearing%' THEN
    v_intent := 'court_diary';
    v_confidence := 0.85;
    v_response := 'Here are your upcoming court hearings...';
    v_actions := '{"action": "show_court_diary", "filter": "upcoming"}'::jsonb;
  ELSIF p_query_text ILIKE '%matter%' OR p_query_text ILIKE '%case%' THEN
    v_intent := 'matter_inquiry';
    v_confidence := 0.90;
    v_response := 'Here are your active matters...';
    v_actions := '{"action": "show_matters", "filter": "active"}'::jsonb;
  ELSIF p_query_text ILIKE '%invoice%' OR p_query_text ILIKE '%billing%' THEN
    v_intent := 'billing_inquiry';
    v_confidence := 0.88;
    v_response := 'Here is your billing information...';
    v_actions := '{"action": "show_invoices", "filter": "recent"}'::jsonb;
  ELSE
    v_intent := 'general_inquiry';
    v_confidence := 0.60;
    v_response := 'I can help you with court diary, matters, billing, and more. Please be more specific.';
    v_actions := '{"action": "show_help"}'::jsonb;
  END IF;
  
  -- Insert voice query record
  INSERT INTO voice_queries (
    advocate_id, query_text, query_language, intent, confidence_score,
    response_text, response_actions, processing_time_ms
  ) VALUES (
    p_advocate_id, p_query_text, p_language_code, v_intent, v_confidence,
    v_response, v_actions, 150
  ) RETURNING id INTO v_query_id;
  
  RETURN json_build_object(
    'query_id', v_query_id,
    'intent', v_intent,
    'confidence', v_confidence,
    'response', v_response,
    'actions', v_actions
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get judge analytics
CREATE OR REPLACE FUNCTION get_judge_analytics(p_judge_id UUID, p_period_months INTEGER DEFAULT 6)
RETURNS JSON AS $$
DECLARE
  v_analytics RECORD;
  v_recent_cases INTEGER;
  v_avg_postponement_rate DECIMAL(5,2);
BEGIN
  -- Get analytics for the specified period
  SELECT 
    AVG(total_cases_heard)::INTEGER as avg_cases_per_period,
    AVG(postponement_rate) as avg_postponement_rate,
    AVG(performance_score) as avg_performance_score,
    COUNT(*) as periods_analyzed
  INTO v_analytics
  FROM judge_analytics 
  WHERE judge_id = p_judge_id 
    AND period_start >= CURRENT_DATE - INTERVAL '1 month' * p_period_months;
  
  -- Get recent case count
  SELECT COUNT(*) INTO v_recent_cases
  FROM court_cases cc
  JOIN court_diary_entries cde ON cc.id = cde.court_case_id
  WHERE cc.allocated_judge_id = p_judge_id
    AND cde.hearing_date >= CURRENT_DATE - INTERVAL '1 month' * p_period_months;
  
  RETURN json_build_object(
    'judge_id', p_judge_id,
    'period_months', p_period_months,
    'recent_cases', v_recent_cases,
    'average_cases_per_period', COALESCE(v_analytics.avg_cases_per_period, 0),
    'average_postponement_rate', COALESCE(v_analytics.avg_postponement_rate, 0),
    'average_performance_score', COALESCE(v_analytics.avg_performance_score, 0),
    'periods_analyzed', COALESCE(v_analytics.periods_analyzed, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sample data for development
INSERT INTO court_registries (name, code, jurisdiction, address) VALUES
('Johannesburg High Court', 'JHB_HC', 'Gauteng', '1 Pritchard Street, Johannesburg, 2001'),
('Cape Town High Court', 'CPT_HC', 'Western Cape', '1 Keerom Street, Cape Town, 8001'),
('Durban High Court', 'DBN_HC', 'KwaZulu-Natal', '323 Anton Lembede Street, Durban, 4001'),
('Pretoria High Court', 'PTA_HC', 'Gauteng', '320 Thabo Sehume Street, Pretoria, 0002');

INSERT INTO judges (name, title, court_registry_id, specializations) VALUES
('Justice M. Mogoeng', 'Acting Judge', (SELECT id FROM court_registries WHERE code = 'JHB_HC'), ARRAY['Commercial Law', 'Constitutional Law']),
('Justice S. Makgoka', 'Judge', (SELECT id FROM court_registries WHERE code = 'CPT_HC'), ARRAY['Criminal Law', 'Family Law']),
('Justice T. Mbha', 'Judge President', (SELECT id FROM court_registries WHERE code = 'DBN_HC'), ARRAY['Labour Law', 'Administrative Law']),
('Justice R. Davis', 'Deputy Judge President', (SELECT id FROM court_registries WHERE code = 'PTA_HC'), ARRAY['Tax Law', 'Commercial Law']);

-- Sample language translations for key UI elements
INSERT INTO language_translations (key, language_code, translation) VALUES
('court_diary', 'af', 'Hofdagboek'),
('court_diary', 'zu', 'Ikhalenda Lenkantolo'),
('court_diary', 'xh', 'Ikhalenda Yenkundla'),
('upcoming_hearings', 'af', 'Komende Verhore'),
('upcoming_hearings', 'zu', 'Izingxoxo Ezizayo'),
('upcoming_hearings', 'xh', 'Iingxoxo Ezizayo'),
('case_number', 'af', 'Saaknommer'),
('case_number', 'zu', 'Inombolo Yecala'),
('case_number', 'xh', 'Inombolo Yetyala'),
('hearing_date', 'af', 'Verhoordatum'),
('hearing_date', 'zu', 'Usuku Lokuzwakala'),
('hearing_date', 'xh', 'Umhla Wokuxoxwa'),
('judge', 'af', 'Regter'),
('judge', 'zu', 'IJaji'),
('judge', 'xh', 'IJaji');
