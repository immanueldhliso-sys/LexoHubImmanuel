-- Advanced Compliance Engine Database Migration
-- Creates all tables and functions for comprehensive compliance management

-- =====================================================
-- COMPLIANCE ALERTS TABLE
-- =====================================================
CREATE TABLE compliance_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('trust_account', 'billing', 'regulatory', 'ethics', 'audit')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    matter_id UUID REFERENCES matters(id) ON DELETE SET NULL,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for compliance_alerts
CREATE INDEX idx_compliance_alerts_user_id ON compliance_alerts(user_id);
CREATE INDEX idx_compliance_alerts_severity ON compliance_alerts(severity);
CREATE INDEX idx_compliance_alerts_resolved ON compliance_alerts(resolved);
CREATE INDEX idx_compliance_alerts_due_date ON compliance_alerts(due_date);
CREATE INDEX idx_compliance_alerts_type ON compliance_alerts(type);

-- Enable RLS for compliance_alerts
ALTER TABLE compliance_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for compliance_alerts
CREATE POLICY "Users can view their own compliance alerts" ON compliance_alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own compliance alerts" ON compliance_alerts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own compliance alerts" ON compliance_alerts
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- COMPLIANCE VIOLATIONS TABLE
-- =====================================================
CREATE TABLE compliance_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES compliance_alerts(id) ON DELETE CASCADE,
    rule_id VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    recommendation TEXT NOT NULL,
    requires_disclosure BOOLEAN DEFAULT FALSE,
    can_proceed BOOLEAN DEFAULT TRUE,
    affected_entities JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for compliance_violations
CREATE INDEX idx_compliance_violations_alert_id ON compliance_violations(alert_id);
CREATE INDEX idx_compliance_violations_rule_id ON compliance_violations(rule_id);
CREATE INDEX idx_compliance_violations_category ON compliance_violations(category);

-- Enable RLS for compliance_violations
ALTER TABLE compliance_violations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for compliance_violations
CREATE POLICY "Users can view violations for their alerts" ON compliance_violations
    FOR SELECT USING (
        alert_id IN (
            SELECT id FROM compliance_alerts WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert violations for their alerts" ON compliance_violations
    FOR INSERT WITH CHECK (
        alert_id IN (
            SELECT id FROM compliance_alerts WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- TRUST ACCOUNTS TABLE
-- =====================================================
CREATE TABLE trust_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_number VARCHAR(50) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    current_balance DECIMAL(15,2) DEFAULT 0.00,
    reconciled_balance DECIMAL(15,2) DEFAULT 0.00,
    last_reconciliation TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    account_details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for trust_accounts
CREATE INDEX idx_trust_accounts_user_id ON trust_accounts(user_id);
CREATE INDEX idx_trust_accounts_status ON trust_accounts(status);
CREATE INDEX idx_trust_accounts_account_number ON trust_accounts(account_number);

-- Enable RLS for trust_accounts
ALTER TABLE trust_accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for trust_accounts
CREATE POLICY "Users can manage their own trust accounts" ON trust_accounts
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- TRUST TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE trust_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trust_account_id UUID NOT NULL REFERENCES trust_accounts(id) ON DELETE CASCADE,
    matter_id UUID REFERENCES matters(id) ON DELETE SET NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'transfer', 'interest')),
    amount DECIMAL(15,2) NOT NULL,
    running_balance DECIMAL(15,2) NOT NULL,
    description TEXT NOT NULL,
    reference_number VARCHAR(100),
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
    bank_details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for trust_transactions
CREATE INDEX idx_trust_transactions_account_id ON trust_transactions(trust_account_id);
CREATE INDEX idx_trust_transactions_matter_id ON trust_transactions(matter_id);
CREATE INDEX idx_trust_transactions_date ON trust_transactions(transaction_date DESC);
CREATE INDEX idx_trust_transactions_type ON trust_transactions(transaction_type);
CREATE INDEX idx_trust_transactions_status ON trust_transactions(status);

-- Enable RLS for trust_transactions
ALTER TABLE trust_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for trust_transactions
CREATE POLICY "Users can view trust transactions for their accounts" ON trust_transactions
    FOR SELECT USING (
        trust_account_id IN (
            SELECT id FROM trust_accounts WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert trust transactions for their accounts" ON trust_transactions
    FOR INSERT WITH CHECK (
        trust_account_id IN (
            SELECT id FROM trust_accounts WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update trust transactions for their accounts" ON trust_transactions
    FOR UPDATE USING (
        trust_account_id IN (
            SELECT id FROM trust_accounts WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- RECONCILIATIONS TABLE
-- =====================================================
CREATE TABLE reconciliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trust_account_id UUID NOT NULL REFERENCES trust_accounts(id) ON DELETE CASCADE,
    performed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    opening_balance DECIMAL(15,2) NOT NULL,
    closing_balance DECIMAL(15,2) NOT NULL,
    total_deposits DECIMAL(15,2) DEFAULT 0.00,
    total_withdrawals DECIMAL(15,2) DEFAULT 0.00,
    discrepancy_count INTEGER DEFAULT 0,
    notes TEXT,
    reconciliation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    bank_statement_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for reconciliations
CREATE INDEX idx_reconciliations_account_id ON reconciliations(trust_account_id);
CREATE INDEX idx_reconciliations_performed_by ON reconciliations(performed_by);
CREATE INDEX idx_reconciliations_date ON reconciliations(reconciliation_date DESC);

-- Enable RLS for reconciliations
ALTER TABLE reconciliations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for reconciliations
CREATE POLICY "Users can view reconciliations for their accounts" ON reconciliations
    FOR SELECT USING (
        trust_account_id IN (
            SELECT id FROM trust_accounts WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert reconciliations for their accounts" ON reconciliations
    FOR INSERT WITH CHECK (
        trust_account_id IN (
            SELECT id FROM trust_accounts WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- REGULATORY REQUIREMENTS TABLE
-- =====================================================
CREATE TABLE regulatory_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requirement_code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('annual', 'quarterly', 'monthly', 'weekly', 'daily', 'once_off')),
    days_notice INTEGER DEFAULT 30,
    bar_council VARCHAR(50) NOT NULL CHECK (bar_council IN ('national', 'johannesburg', 'cape_town', 'durban', 'pretoria')),
    mandatory BOOLEAN DEFAULT TRUE,
    compliance_criteria JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for regulatory_requirements
CREATE INDEX idx_regulatory_requirements_code ON regulatory_requirements(requirement_code);
CREATE INDEX idx_regulatory_requirements_bar_council ON regulatory_requirements(bar_council);
CREATE INDEX idx_regulatory_requirements_frequency ON regulatory_requirements(frequency);
CREATE INDEX idx_regulatory_requirements_mandatory ON regulatory_requirements(mandatory);

-- =====================================================
-- COMPLIANCE DEADLINES TABLE
-- =====================================================
CREATE TABLE compliance_deadlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requirement_id UUID NOT NULL REFERENCES regulatory_requirements(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue', 'waived')),
    completed_at TIMESTAMP WITH TIME ZONE,
    completion_notes TEXT,
    reminder_schedule JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for compliance_deadlines
CREATE INDEX idx_compliance_deadlines_requirement_id ON compliance_deadlines(requirement_id);
CREATE INDEX idx_compliance_deadlines_user_id ON compliance_deadlines(user_id);
CREATE INDEX idx_compliance_deadlines_due_date ON compliance_deadlines(due_date);
CREATE INDEX idx_compliance_deadlines_status ON compliance_deadlines(status);

-- Enable RLS for compliance_deadlines
ALTER TABLE compliance_deadlines ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for compliance_deadlines
CREATE POLICY "Users can view their own compliance deadlines" ON compliance_deadlines
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own compliance deadlines" ON compliance_deadlines
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own compliance deadlines" ON compliance_deadlines
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- AUDIT ENTRIES TABLE
-- =====================================================
CREATE TABLE audit_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    before_state JSONB,
    after_state JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Create indexes for audit_entries
CREATE INDEX idx_audit_entries_user_id ON audit_entries(user_id);
CREATE INDEX idx_audit_entries_entity ON audit_entries(entity_type, entity_id);
CREATE INDEX idx_audit_entries_created_at ON audit_entries(created_at DESC);
CREATE INDEX idx_audit_entries_action_type ON audit_entries(action_type);

-- Enable RLS for audit_entries
ALTER TABLE audit_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for audit_entries
CREATE POLICY "Users can view their own audit entries" ON audit_entries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit entries" ON audit_entries
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- DATABASE FUNCTIONS
-- =====================================================

-- Function to calculate compliance score
CREATE OR REPLACE FUNCTION calculate_compliance_score(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    total_requirements INTEGER;
    met_requirements INTEGER;
    active_violations INTEGER;
    score INTEGER;
BEGIN
    -- Count total applicable requirements
    SELECT COUNT(*) INTO total_requirements
    FROM regulatory_requirements
    WHERE mandatory = true;
    
    -- Count met requirements (no active deadlines)
    SELECT COUNT(*) INTO met_requirements
    FROM compliance_deadlines cd
    JOIN regulatory_requirements rr ON cd.requirement_id = rr.id
    WHERE cd.user_id = user_uuid
    AND cd.status = 'completed'
    AND rr.mandatory = true;
    
    -- Count active violations
    SELECT COUNT(*) INTO active_violations
    FROM compliance_alerts
    WHERE user_id = user_uuid
    AND resolved = false
    AND severity IN ('high', 'critical');
    
    -- Calculate score
    IF total_requirements = 0 THEN
        score := 100;
    ELSE
        score := GREATEST(0, 
            (met_requirements * 100 / total_requirements) - (active_violations * 10)
        );
    END IF;
    
    RETURN LEAST(100, score);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-generate compliance deadlines
CREATE OR REPLACE FUNCTION generate_compliance_deadlines()
RETURNS VOID AS $$
DECLARE
    req RECORD;
    user_rec RECORD;
    next_due_date TIMESTAMP WITH TIME ZONE;
BEGIN
    FOR req IN SELECT * FROM regulatory_requirements WHERE mandatory = true LOOP
        FOR user_rec IN SELECT id FROM auth.users LOOP
            -- Calculate next due date based on frequency
            CASE req.frequency
                WHEN 'annual' THEN
                    next_due_date := DATE_TRUNC('year', NOW()) + INTERVAL '1 year';
                WHEN 'quarterly' THEN
                    next_due_date := DATE_TRUNC('quarter', NOW()) + INTERVAL '3 months';
                WHEN 'monthly' THEN
                    next_due_date := DATE_TRUNC('month', NOW()) + INTERVAL '1 month';
                ELSE
                    next_due_date := NOW() + INTERVAL '1 year';
            END CASE;
            
            -- Insert deadline if not exists
            INSERT INTO compliance_deadlines (requirement_id, user_id, due_date, status)
            SELECT req.id, user_rec.id, next_due_date, 'pending'
            WHERE NOT EXISTS (
                SELECT 1 FROM compliance_deadlines
                WHERE requirement_id = req.id
                AND user_id = user_rec.id
                AND status = 'pending'
            );
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update trust account balance
CREATE OR REPLACE FUNCTION update_trust_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the running balance in trust_accounts table
    UPDATE trust_accounts 
    SET current_balance = NEW.running_balance,
        updated_at = NOW()
    WHERE id = NEW.trust_account_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for trust account balance updates
CREATE TRIGGER trigger_update_trust_account_balance
    AFTER INSERT OR UPDATE ON trust_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_trust_account_balance();

-- Function to create audit entry
CREATE OR REPLACE FUNCTION create_audit_entry(
    p_user_id UUID,
    p_entity_type VARCHAR(50),
    p_entity_id UUID,
    p_action_type VARCHAR(50),
    p_description TEXT,
    p_before_state JSONB DEFAULT NULL,
    p_after_state JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO audit_entries (
        user_id, entity_type, entity_id, action_type, 
        description, before_state, after_state
    ) VALUES (
        p_user_id, p_entity_type, p_entity_id, p_action_type,
        p_description, p_before_state, p_after_state
    ) RETURNING id INTO audit_id;
    
    RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INITIAL DATA SEEDING
-- =====================================================

-- Insert initial regulatory requirements
INSERT INTO regulatory_requirements (requirement_code, title, description, frequency, days_notice, bar_council, mandatory) VALUES
('CPD_ANNUAL', 'Continuing Professional Development', 'Annual CPD requirement of 15 hours for practicing advocates', 'annual', 60, 'national', true),
('TRUST_RECONCILIATION', 'Trust Account Reconciliation', 'Monthly trust account reconciliation and reporting', 'monthly', 5, 'national', true),
('PROFESSIONAL_INDEMNITY', 'Professional Indemnity Insurance', 'Annual professional indemnity insurance renewal and proof of coverage', 'annual', 30, 'national', true),
('PRACTICE_CERTIFICATE', 'Practice Certificate Renewal', 'Annual practice certificate renewal with Law Society', 'annual', 45, 'national', true),
('TRUST_AUDIT', 'Trust Account Audit', 'Annual independent audit of trust account records', 'annual', 90, 'national', true),
('FIDELITY_FUND', 'Fidelity Fund Certificate', 'Annual fidelity fund certificate renewal', 'annual', 30, 'national', true),
('TAX_COMPLIANCE', 'Tax Compliance Certificate', 'Annual tax compliance certificate from SARS', 'annual', 60, 'national', true),
('CHAMBERS_FEES', 'Chambers Fee Payment', 'Monthly chambers fee payment and compliance', 'monthly', 5, 'national', false),
('BAR_COUNCIL_FEES', 'Bar Council Subscription', 'Annual Bar Council subscription payment', 'annual', 30, 'national', true),
('ETHICS_TRAINING', 'Ethics Training Requirement', 'Mandatory ethics training as part of CPD', 'annual', 90, 'national', true);

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON regulatory_requirements TO anon;
GRANT ALL PRIVILEGES ON compliance_alerts TO authenticated;
GRANT ALL PRIVILEGES ON compliance_violations TO authenticated;
GRANT ALL PRIVILEGES ON trust_accounts TO authenticated;
GRANT ALL PRIVILEGES ON trust_transactions TO authenticated;
GRANT ALL PRIVILEGES ON reconciliations TO authenticated;
GRANT ALL PRIVILEGES ON compliance_deadlines TO authenticated;
GRANT ALL PRIVILEGES ON audit_entries TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION calculate_compliance_score(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_compliance_deadlines() TO authenticated;
GRANT EXECUTE ON FUNCTION create_audit_entry(UUID, VARCHAR(50), UUID, VARCHAR(50), TEXT, JSONB, JSONB) TO authenticated;

-- Create initial compliance deadlines for existing users
SELECT generate_compliance_deadlines();

-- Add comments for documentation
COMMENT ON TABLE compliance_alerts IS 'Stores compliance alerts and notifications for users';
COMMENT ON TABLE compliance_violations IS 'Stores specific ethics and compliance violations linked to alerts';
COMMENT ON TABLE trust_accounts IS 'Stores trust account information for legal practitioners';
COMMENT ON TABLE trust_transactions IS 'Stores all trust account transactions with audit trail';
COMMENT ON TABLE reconciliations IS 'Stores trust account reconciliation records';
COMMENT ON TABLE regulatory_requirements IS 'Stores regulatory requirements and deadlines for legal practice';
COMMENT ON TABLE compliance_deadlines IS 'Stores user-specific compliance deadlines and completion status';
COMMENT ON TABLE audit_entries IS 'Stores comprehensive audit trail for all compliance-related actions';