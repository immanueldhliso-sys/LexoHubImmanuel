/*
# Strategic Finance & Optimization Schema
This migration adds tables and functionality for:
- Dynamic Fee Optimization
- Advanced Cash Flow Management with AI
- Invoice Factoring Marketplace
- Success Fee Calculator
*/

-- Custom types for strategic finance
CREATE TYPE fee_optimization_model AS ENUM ('standard', 'premium_urgency', 'volume_discount', 'success_based', 'hybrid');
CREATE TYPE cash_flow_status AS ENUM ('healthy', 'adequate', 'tight', 'critical');
CREATE TYPE factoring_status AS ENUM ('available', 'under_review', 'approved', 'funded', 'repaid', 'defaulted');
CREATE TYPE fee_structure AS ENUM ('hourly', 'fixed', 'contingency', 'success', 'retainer', 'hybrid');

-- Dynamic fee optimization recommendations
CREATE TABLE IF NOT EXISTS fee_optimization_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advocate_id UUID NOT NULL REFERENCES advocates(id),
  matter_id UUID REFERENCES matters(id),
  
  -- Current pricing
  current_hourly_rate DECIMAL(10,2),
  current_fee_structure fee_structure,
  current_estimated_fee DECIMAL(12,2),
  
  -- Market analysis
  market_average_rate DECIMAL(10,2),
  market_percentile INTEGER CHECK (market_percentile >= 0 AND market_percentile <= 100),
  similar_matters_analyzed INTEGER,
  
  -- Recommendations
  recommended_model fee_optimization_model NOT NULL,
  recommended_hourly_rate DECIMAL(10,2),
  recommended_fee_structure fee_structure,
  recommended_fixed_fee DECIMAL(12,2),
  recommended_success_percentage DECIMAL(3,2),
  
  -- Justification
  optimization_factors JSONB, -- urgency, complexity, client_type, volume, etc.
  potential_revenue_increase DECIMAL(12,2),
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  
  -- Implementation
  accepted BOOLEAN DEFAULT false,
  accepted_at TIMESTAMPTZ,
  actual_fee_achieved DECIMAL(12,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Cash flow predictions and management
CREATE TABLE IF NOT EXISTS cash_flow_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advocate_id UUID NOT NULL REFERENCES advocates(id),
  
  -- Prediction period
  prediction_date DATE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Financial predictions
  expected_collections DECIMAL(12,2) NOT NULL,
  expected_expenses DECIMAL(12,2) NOT NULL,
  expected_net_cash_flow DECIMAL(12,2) GENERATED ALWAYS AS (expected_collections - expected_expenses) STORED,
  
  -- Components breakdown
  invoice_collections DECIMAL(12,2),
  new_matter_fees DECIMAL(12,2),
  recurring_fees DECIMAL(12,2),
  contingency_fees DECIMAL(12,2),
  
  -- Risk factors
  collection_confidence DECIMAL(3,2) CHECK (collection_confidence >= 0 AND collection_confidence <= 1),
  seasonal_adjustment DECIMAL(5,2), -- percentage adjustment for seasonal patterns
  overdue_risk_amount DECIMAL(12,2),
  
  -- Status and alerts
  cash_flow_status cash_flow_status,
  minimum_balance_date DATE,
  minimum_balance_amount DECIMAL(12,2),
  
  -- Recommendations
  recommended_actions TEXT[],
  financing_needed DECIMAL(12,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(advocate_id, period_start, period_end)
);

-- Seasonal patterns for cash flow
CREATE TABLE IF NOT EXISTS cash_flow_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advocate_id UUID NOT NULL REFERENCES advocates(id),
  
  -- Pattern identification
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  historical_collection_rate DECIMAL(3,2),
  historical_payment_delay_days INTEGER,
  historical_new_matters_ratio DECIMAL(3,2), -- compared to yearly average
  
  -- Factors
  court_recess_impact DECIMAL(3,2), -- percentage impact
  holiday_impact DECIMAL(3,2),
  typical_client_payment_behavior TEXT,
  
  -- Statistics
  sample_years INTEGER,
  confidence_level DECIMAL(3,2),
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(advocate_id, month)
);

-- Invoice factoring marketplace
CREATE TABLE IF NOT EXISTS factoring_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_name VARCHAR(255) NOT NULL,
  provider_id VARCHAR(100) NOT NULL,
  
  -- Offer details
  min_invoice_amount DECIMAL(12,2),
  max_invoice_amount DECIMAL(12,2),
  advance_rate DECIMAL(3,2) CHECK (advance_rate > 0 AND advance_rate <= 1), -- percentage of invoice advanced
  discount_rate DECIMAL(4,2) CHECK (discount_rate >= 0), -- monthly rate
  
  -- Terms
  minimum_invoice_age_days INTEGER DEFAULT 0,
  maximum_invoice_age_days INTEGER DEFAULT 90,
  recourse_type VARCHAR(20) CHECK (recourse_type IN ('recourse', 'non_recourse', 'partial_recourse')),
  
  -- Requirements
  minimum_practice_age_months INTEGER,
  minimum_monthly_revenue DECIMAL(12,2),
  required_collection_rate DECIMAL(3,2),
  
  -- Availability
  is_active BOOLEAN DEFAULT true,
  available_capital DECIMAL(12,2),
  current_utilization DECIMAL(3,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice factoring applications
CREATE TABLE IF NOT EXISTS factoring_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  advocate_id UUID NOT NULL REFERENCES advocates(id),
  offer_id UUID NOT NULL REFERENCES factoring_offers(id),
  
  -- Application details
  requested_amount DECIMAL(12,2) NOT NULL,
  invoice_amount DECIMAL(12,2) NOT NULL,
  invoice_age_days INTEGER NOT NULL,
  
  -- Status
  status factoring_status DEFAULT 'available',
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  funded_at TIMESTAMPTZ,
  
  -- Terms
  approved_amount DECIMAL(12,2),
  advance_rate DECIMAL(3,2),
  discount_rate DECIMAL(4,2),
  fees DECIMAL(12,2),
  net_amount DECIMAL(12,2),
  
  -- Repayment
  repayment_due_date DATE,
  repayment_received_date DATE,
  repayment_amount DECIMAL(12,2),
  
  -- Risk assessment
  risk_score DECIMAL(3,2),
  risk_factors JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Success fee modeling
CREATE TABLE IF NOT EXISTS success_fee_scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  matter_id UUID NOT NULL REFERENCES matters(id),
  advocate_id UUID NOT NULL REFERENCES advocates(id),
  
  -- Scenario details
  scenario_name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Success criteria
  success_definition TEXT NOT NULL,
  success_probability DECIMAL(3,2) CHECK (success_probability >= 0 AND success_probability <= 1),
  
  -- Fee structure
  base_fee DECIMAL(12,2) DEFAULT 0,
  success_fee_percentage DECIMAL(3,2) CHECK (success_fee_percentage >= 0 AND success_fee_percentage <= 0.5),
  success_fee_cap DECIMAL(12,2),
  
  -- Outcome modeling
  minimum_recovery DECIMAL(12,2),
  expected_recovery DECIMAL(12,2),
  maximum_recovery DECIMAL(12,2),
  
  -- Fee calculations (updated via triggers)
  minimum_total_fee DECIMAL(12,2) DEFAULT 0,
  expected_total_fee DECIMAL(12,2) DEFAULT 0,
  maximum_total_fee DECIMAL(12,2) DEFAULT 0,
  
  -- Risk assessment
  risk_adjusted_fee DECIMAL(12,2) DEFAULT 0,
  breakeven_probability DECIMAL(3,2),
  
  -- Client approval
  presented_to_client BOOLEAN DEFAULT false,
  client_approved BOOLEAN,
  approval_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Financial health metrics
CREATE TABLE IF NOT EXISTS practice_financial_health (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advocate_id UUID NOT NULL REFERENCES advocates(id),
  calculation_date DATE NOT NULL,
  
  -- Key metrics
  cash_runway_days INTEGER,
  collection_rate_30d DECIMAL(3,2),
  collection_rate_90d DECIMAL(3,2),
  average_collection_days DECIMAL(5,2),
  
  -- Revenue metrics
  monthly_recurring_revenue DECIMAL(12,2),
  revenue_growth_rate DECIMAL(5,2),
  revenue_concentration DECIMAL(3,2), -- Herfindahl index
  
  -- Efficiency metrics
  realization_rate DECIMAL(3,2), -- billed vs worked
  utilization_rate DECIMAL(3,2), -- billable hours vs available
  write_off_rate DECIMAL(3,2),
  
  -- Working capital
  current_ratio DECIMAL(5,2),
  quick_ratio DECIMAL(5,2),
  wip_turnover_days DECIMAL(5,2),
  
  -- Health score (0-100)
  overall_health_score INTEGER CHECK (overall_health_score >= 0 AND overall_health_score <= 100),
  health_trend VARCHAR(20) CHECK (health_trend IN ('improving', 'stable', 'declining')),
  
  -- Alerts
  risk_alerts TEXT[],
  opportunities TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(advocate_id, calculation_date)
);

-- Indexes for performance
CREATE INDEX idx_fee_optimization_advocate ON fee_optimization_recommendations(advocate_id);
CREATE INDEX idx_fee_optimization_matter ON fee_optimization_recommendations(matter_id);
CREATE INDEX idx_cash_flow_predictions_advocate ON cash_flow_predictions(advocate_id, period_start);
CREATE INDEX idx_cash_flow_patterns_advocate ON cash_flow_patterns(advocate_id, month);
CREATE INDEX idx_factoring_offers_active ON factoring_offers(is_active) WHERE is_active = true;
CREATE INDEX idx_factoring_applications_invoice ON factoring_applications(invoice_id);
CREATE INDEX idx_factoring_applications_status ON factoring_applications(status);
CREATE INDEX idx_success_fee_scenarios_matter ON success_fee_scenarios(matter_id);
CREATE INDEX idx_financial_health_advocate ON practice_financial_health(advocate_id, calculation_date DESC);

-- Views for analytics
CREATE OR REPLACE VIEW cash_flow_forecast AS
SELECT 
  cfp.*,
  a.full_name as advocate_name,
  a.bar,
  CASE 
    WHEN cfp.expected_net_cash_flow < 0 THEN 'deficit'
    WHEN cfp.expected_net_cash_flow < 10000 THEN 'low'
    ELSE 'healthy'
  END as forecast_status
FROM cash_flow_predictions cfp
JOIN advocates a ON cfp.advocate_id = a.id
WHERE cfp.period_end >= CURRENT_DATE
ORDER BY cfp.period_start;

CREATE OR REPLACE VIEW factoring_marketplace AS
SELECT 
  fo.*,
  COUNT(fa.id) as total_applications,
  SUM(CASE WHEN fa.status = 'funded' THEN 1 ELSE 0 END) as funded_applications,
  AVG(fa.approved_amount) as average_funding
FROM factoring_offers fo
LEFT JOIN factoring_applications fa ON fo.id = fa.offer_id
WHERE fo.is_active = true
GROUP BY fo.id
ORDER BY fo.advance_rate DESC, fo.discount_rate ASC;

-- Functions for financial optimization
CREATE OR REPLACE FUNCTION calculate_optimal_fee_structure(
  p_matter_id UUID,
  p_advocate_id UUID
)
RETURNS TABLE(
  model fee_optimization_model,
  recommended_rate DECIMAL,
  potential_revenue DECIMAL,
  confidence DECIMAL
) AS $$
DECLARE
  v_matter_record RECORD;
  v_market_data RECORD;
BEGIN
  -- Get matter details
  SELECT * INTO v_matter_record FROM matters WHERE id = p_matter_id;
  
  -- Get market data (simplified - in production would use ML model)
  SELECT 
    AVG(hourly_rate) as avg_rate,
    STDDEV(hourly_rate) as rate_stddev
  INTO v_market_data
  FROM advocates
  WHERE bar = v_matter_record.bar;
  
  -- Standard model
  RETURN QUERY
  SELECT 
    'standard'::fee_optimization_model,
    v_market_data.avg_rate,
    v_market_data.avg_rate * v_matter_record.estimated_fee / 1000, -- Simplified calculation
    0.85::DECIMAL;
  
  -- Premium urgency model
  IF v_matter_record.is_urgent THEN
    RETURN QUERY
    SELECT 
      'premium_urgency'::fee_optimization_model,
      v_market_data.avg_rate * 1.5,
      v_market_data.avg_rate * 1.5 * v_matter_record.estimated_fee / 1000,
      0.75::DECIMAL;
  END IF;
  
  -- Success-based model for high-value matters
  IF v_matter_record.estimated_fee > 100000 THEN
    RETURN QUERY
    SELECT 
      'success_based'::fee_optimization_model,
      v_market_data.avg_rate * 0.7,
      v_matter_record.estimated_fee * 0.25, -- 25% success fee
      0.65::DECIMAL;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to predict cash flow
CREATE OR REPLACE FUNCTION predict_cash_flow(
  p_advocate_id UUID,
  p_months_ahead INTEGER DEFAULT 3
)
RETURNS void AS $$
DECLARE
  v_period_start DATE;
  v_period_end DATE;
  v_expected_collections DECIMAL;
  v_overdue_amount DECIMAL;
  v_seasonal_factor DECIMAL;
BEGIN
  v_period_start := DATE_TRUNC('month', CURRENT_DATE);
  
  FOR i IN 0..p_months_ahead-1 LOOP
    v_period_end := v_period_start + INTERVAL '1 month' - INTERVAL '1 day';
    
    -- Calculate expected collections
    SELECT 
      SUM(i.balance_due * 0.8) -- 80% collection probability
    INTO v_expected_collections
    FROM invoices i
    WHERE i.advocate_id = p_advocate_id
      AND i.status IN ('sent', 'viewed')
      AND i.due_date BETWEEN v_period_start AND v_period_end;
    
    -- Get overdue amount
    SELECT SUM(balance_due)
    INTO v_overdue_amount
    FROM invoices
    WHERE advocate_id = p_advocate_id
      AND status = 'overdue';
    
    -- Get seasonal factor
    SELECT COALESCE(historical_collection_rate, 1.0)
    INTO v_seasonal_factor
    FROM cash_flow_patterns
    WHERE advocate_id = p_advocate_id
      AND month = EXTRACT(MONTH FROM v_period_start);
    
    -- Insert prediction
    INSERT INTO cash_flow_predictions (
      advocate_id,
      prediction_date,
      period_start,
      period_end,
      expected_collections,
      expected_expenses,
      invoice_collections,
      collection_confidence,
      seasonal_adjustment,
      overdue_risk_amount,
      cash_flow_status
    ) VALUES (
      p_advocate_id,
      CURRENT_DATE,
      v_period_start,
      v_period_end,
      COALESCE(v_expected_collections, 0) * COALESCE(v_seasonal_factor, 1.0),
      50000, -- Placeholder for expenses
      COALESCE(v_expected_collections, 0),
      0.75,
      (COALESCE(v_seasonal_factor, 1.0) - 1.0) * 100,
      COALESCE(v_overdue_amount, 0),
      CASE 
        WHEN COALESCE(v_expected_collections, 0) > 100000 THEN 'healthy'
        WHEN COALESCE(v_expected_collections, 0) > 50000 THEN 'adequate'
        WHEN COALESCE(v_expected_collections, 0) > 20000 THEN 'tight'
        ELSE 'critical'
      END
    )
    ON CONFLICT (advocate_id, period_start, period_end) 
    DO UPDATE SET
      prediction_date = CURRENT_DATE,
      expected_collections = EXCLUDED.expected_collections,
      seasonal_adjustment = EXCLUDED.seasonal_adjustment,
      overdue_risk_amount = EXCLUDED.overdue_risk_amount;
    
    v_period_start := v_period_start + INTERVAL '1 month';
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Apply RLS policies
ALTER TABLE fee_optimization_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE factoring_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE factoring_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE success_fee_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_financial_health ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Advocates see own fee optimizations" ON fee_optimization_recommendations
  FOR ALL USING (advocate_id = auth.uid());

CREATE POLICY "Advocates see own cash flow" ON cash_flow_predictions
  FOR ALL USING (advocate_id = auth.uid());

CREATE POLICY "Advocates manage own patterns" ON cash_flow_patterns
  FOR ALL USING (advocate_id = auth.uid());

CREATE POLICY "All can view active factoring offers" ON factoring_offers
  FOR SELECT USING (is_active = true);

CREATE POLICY "Advocates manage own factoring applications" ON factoring_applications
  FOR ALL USING (advocate_id = auth.uid());

CREATE POLICY "Advocates manage own success fee scenarios" ON success_fee_scenarios
  FOR ALL USING (advocate_id = auth.uid());

CREATE POLICY "Advocates see own financial health" ON practice_financial_health
  FOR ALL USING (advocate_id = auth.uid());

