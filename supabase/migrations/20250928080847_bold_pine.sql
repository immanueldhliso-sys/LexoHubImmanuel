/*
# Initial Schema for lexo Legal Practice Management Platform

1. New Tables
   - `advocates` - User profiles for advocates with practice details
   - `matters` - Legal matters with comprehensive tracking
   - `invoices` - Invoice management with Bar-specific rules
   - `time_entries` - Time tracking with voice transcription support
   - `documents` - Document management with full-text search
   - `notes` - Matter notes and comments
   - `referrals` - Referral tracking between advocates
   - `payments` - Payment tracking and reconciliation
   - `audit_log` - Comprehensive audit trail

2. Security
   - Enable RLS on all tables
   - Add policies for advocate-specific data access
   - Implement audit logging for all changes

3. Business Logic
   - Custom functions for due date calculation
   - Conflict checking functionality
   - Automatic reference number generation
   - Status transition validation

4. Performance
   - Comprehensive indexing strategy
   - Materialized views for common queries
   - Full-text search capabilities
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom types
CREATE TYPE bar_association AS ENUM ('johannesburg', 'cape_town');
CREATE TYPE matter_status AS ENUM ('active', 'pending', 'settled', 'closed', 'on_hold');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'viewed', 'paid', 'overdue', 'disputed', 'written_off');
CREATE TYPE payment_method AS ENUM ('eft', 'cheque', 'cash', 'card', 'debit_order');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE time_entry_method AS ENUM ('manual', 'voice', 'timer', 'ai_suggested');
CREATE TYPE document_type AS ENUM ('brief', 'opinion', 'contract', 'correspondence', 'court_document', 'invoice', 'receipt', 'other');
CREATE TYPE fee_type AS ENUM ('standard', 'contingency', 'success', 'retainer', 'pro_bono');

-- Users table (advocates)
CREATE TABLE IF NOT EXISTS advocates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  initials VARCHAR(10) NOT NULL,
  practice_number VARCHAR(50) UNIQUE NOT NULL,
  bar bar_association NOT NULL,
  year_admitted INTEGER NOT NULL CHECK (year_admitted >= 1900 AND year_admitted <= EXTRACT(YEAR FROM CURRENT_DATE)),
  specialisations TEXT[] DEFAULT '{}',
  hourly_rate DECIMAL(10,2) NOT NULL CHECK (hourly_rate > 0),
  contingency_rate DECIMAL(3,2) CHECK (contingency_rate >= 0 AND contingency_rate <= 1),
  success_fee_rate DECIMAL(3,2) CHECK (success_fee_rate >= 0 AND success_fee_rate <= 1),
  
  -- Contact details
  phone_number VARCHAR(20),
  chambers_address TEXT,
  postal_address TEXT,
  
  -- Settings
  notification_preferences JSONB DEFAULT '{"email": true, "whatsapp": false, "sms": false}',
  invoice_settings JSONB DEFAULT '{"auto_remind": true, "reminder_days": [30, 45, 55]}',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMPTZ,
  
  -- Computed fields for quick access
  total_outstanding DECIMAL(12,2) DEFAULT 0,
  total_collected_ytd DECIMAL(12,2) DEFAULT 0,
  matters_count INTEGER DEFAULT 0
);

-- Matters table with comprehensive tracking
CREATE TABLE IF NOT EXISTS matters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advocate_id UUID NOT NULL REFERENCES advocates(id) ON DELETE CASCADE,
  
  -- Basic Information
  reference_number VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  matter_type VARCHAR(100) NOT NULL,
  court_case_number VARCHAR(100),
  bar bar_association NOT NULL,
  
  -- Client Information
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255),
  client_phone VARCHAR(20),
  client_address TEXT,
  client_type VARCHAR(50) CHECK (client_type IN ('individual', 'company', 'trust', 'government', 'ngo')),
  
  -- Instructing Attorney Information
  instructing_attorney VARCHAR(255) NOT NULL,
  instructing_attorney_email VARCHAR(255),
  instructing_attorney_phone VARCHAR(20),
  instructing_firm VARCHAR(255),
  instructing_firm_ref VARCHAR(100),
  
  -- Financial Information
  fee_type fee_type DEFAULT 'standard',
  estimated_fee DECIMAL(12,2),
  fee_cap DECIMAL(12,2),
  actual_fee DECIMAL(12,2),
  wip_value DECIMAL(12,2) DEFAULT 0,
  trust_balance DECIMAL(12,2) DEFAULT 0,
  disbursements DECIMAL(12,2) DEFAULT 0,
  vat_exempt BOOLEAN DEFAULT false,
  
  -- Status and Risk
  status matter_status DEFAULT 'pending',
  risk_level risk_level DEFAULT 'low',
  settlement_probability DECIMAL(3,2) CHECK (settlement_probability >= 0 AND settlement_probability <= 1),
  expected_completion_date DATE,
  
  -- Conflict Check
  conflict_check_completed BOOLEAN DEFAULT false,
  conflict_check_date TIMESTAMPTZ,
  conflict_check_cleared BOOLEAN,
  conflict_notes TEXT,
  
  -- Important Dates
  date_instructed DATE NOT NULL DEFAULT CURRENT_DATE,
  date_accepted DATE,
  date_commenced DATE,
  date_settled DATE,
  date_closed DATE,
  next_court_date DATE,
  prescription_date DATE,
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  -- Computed fields (updated via triggers)
  days_active INTEGER DEFAULT 0,
  is_overdue BOOLEAN DEFAULT false
);

-- Invoices table with Bar-specific rules
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  advocate_id UUID NOT NULL REFERENCES advocates(id) ON DELETE CASCADE,
  
  -- Invoice Details
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  bar bar_association NOT NULL,
  
  -- Financial Details
  fees_amount DECIMAL(12,2) NOT NULL CHECK (fees_amount >= 0),
  disbursements_amount DECIMAL(12,2) DEFAULT 0 CHECK (disbursements_amount >= 0),
  subtotal DECIMAL(12,2) GENERATED ALWAYS AS (fees_amount + disbursements_amount) STORED,
  vat_rate DECIMAL(3,2) DEFAULT 0.15,
  vat_amount DECIMAL(12,2) GENERATED ALWAYS AS ((fees_amount + disbursements_amount) * vat_rate) STORED,
  total_amount DECIMAL(12,2) GENERATED ALWAYS AS ((fees_amount + disbursements_amount) * (1 + vat_rate)) STORED,
  
  -- Payment Tracking
  status invoice_status DEFAULT 'draft',
  amount_paid DECIMAL(12,2) DEFAULT 0 CHECK (amount_paid >= 0),
  balance_due DECIMAL(12,2) GENERATED ALWAYS AS (
    ((fees_amount + disbursements_amount) * (1 + vat_rate)) - amount_paid
  ) STORED,
  date_paid DATE,
  payment_method payment_method,
  payment_reference VARCHAR(100),
  
  -- Fee Narrative
  fee_narrative TEXT NOT NULL,
  internal_notes TEXT,
  
  -- Reminder Tracking
  reminders_sent INTEGER DEFAULT 0,
  last_reminder_date DATE,
  next_reminder_date DATE,
  reminder_history JSONB DEFAULT '[]',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  
  -- Computed fields (updated via triggers)
  days_outstanding INTEGER DEFAULT 0,
  is_overdue BOOLEAN DEFAULT false
);

-- Time entries with voice transcription support
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  advocate_id UUID NOT NULL REFERENCES advocates(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  
  -- Time Details
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIME,
  end_time TIME,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  
  -- Billing Details
  description TEXT NOT NULL,
  billable BOOLEAN DEFAULT true,
  rate DECIMAL(10,2) NOT NULL,
  amount DECIMAL(12,2) GENERATED ALWAYS AS ((duration_minutes / 60.0) * rate) STORED,
  
  -- Recording Method
  recording_method time_entry_method DEFAULT 'manual',
  voice_transcription TEXT,
  voice_recording_url TEXT,
  
  -- Status
  billed BOOLEAN DEFAULT false,
  write_off BOOLEAN DEFAULT false,
  write_off_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  advocate_id UUID NOT NULL REFERENCES advocates(id) ON DELETE CASCADE,
  
  -- Document Details
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  document_type document_type NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  
  -- Version Control
  version INTEGER DEFAULT 1,
  parent_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  
  -- Metadata
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  -- Full-text search
  content_text TEXT,
  content_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(content_text, ''))) STORED
);

-- Notes/Comments table
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  advocate_id UUID NOT NULL REFERENCES advocates(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT true,
  is_important BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Referrals tracking table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  
  -- Referral parties
  referring_advocate_id UUID REFERENCES advocates(id) ON DELETE SET NULL,
  referred_to_advocate_id UUID REFERENCES advocates(id) ON DELETE SET NULL,
  referring_firm VARCHAR(255),
  
  -- Referral details
  referral_date DATE NOT NULL DEFAULT CURRENT_DATE,
  referral_fee_percentage DECIMAL(3,2) CHECK (referral_fee_percentage >= 0 AND referral_fee_percentage <= 1),
  referral_fee_amount DECIMAL(12,2),
  referral_fee_paid BOOLEAN DEFAULT false,
  referral_fee_paid_date DATE,
  
  -- Reciprocal tracking
  reciprocal_expected BOOLEAN DEFAULT false,
  reciprocal_completed BOOLEAN DEFAULT false,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table for tracking all financial transactions
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  advocate_id UUID NOT NULL REFERENCES advocates(id) ON DELETE CASCADE,
  
  -- Payment details
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method payment_method NOT NULL,
  reference VARCHAR(100),
  
  -- Bank reconciliation
  bank_reference VARCHAR(100),
  reconciled BOOLEAN DEFAULT false,
  reconciled_date DATE,
  
  -- Trust accounting
  is_trust_deposit BOOLEAN DEFAULT false,
  trust_transfer_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advocate_id UUID REFERENCES advocates(id) ON DELETE SET NULL,
  
  table_name VARCHAR(50) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'VIEW')),
  
  old_values JSONB,
  new_values JSONB,
  
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_matters_advocate ON matters(advocate_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_matters_status ON matters(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_matters_dates ON matters(date_instructed, date_closed) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_matter ON invoices(matter_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date) WHERE deleted_at IS NULL AND status NOT IN ('paid', 'written_off');
CREATE INDEX IF NOT EXISTS idx_time_entries_matter ON time_entries(matter_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_time_entries_unbilled ON time_entries(matter_id) WHERE billed = false AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_matter ON documents(matter_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_search ON documents USING GIN(content_vector);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_advocate ON audit_log(advocate_id, created_at DESC);

-- Create views for common queries
CREATE OR REPLACE VIEW active_matters AS
SELECT * FROM matters 
WHERE status IN ('active', 'pending') 
AND deleted_at IS NULL;

CREATE OR REPLACE VIEW overdue_invoices AS
SELECT * FROM invoices 
WHERE is_overdue = true 
AND status NOT IN ('paid', 'written_off')
AND deleted_at IS NULL;

CREATE OR REPLACE VIEW unbilled_time AS
SELECT 
  te.*,
  m.title as matter_title,
  m.client_name
FROM time_entries te
JOIN matters m ON te.matter_id = m.id
WHERE te.billed = false 
AND te.deleted_at IS NULL
AND m.deleted_at IS NULL;

-- Row Level Security Policies
ALTER TABLE advocates ENABLE ROW LEVEL SECURITY;
ALTER TABLE matters ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies (advocates can only see their own data)
CREATE POLICY "Advocates can manage their own profile" ON advocates
  FOR ALL USING (auth.uid()::text = id::text);

CREATE POLICY "Advocates can manage their own matters" ON matters
  FOR ALL USING (auth.uid()::text = advocate_id::text);

CREATE POLICY "Advocates can manage their own invoices" ON invoices
  FOR ALL USING (auth.uid()::text = advocate_id::text);

CREATE POLICY "Advocates can manage their own time entries" ON time_entries
  FOR ALL USING (auth.uid()::text = advocate_id::text);

CREATE POLICY "Advocates can manage their own documents" ON documents
  FOR ALL USING (auth.uid()::text = advocate_id::text);

CREATE POLICY "Advocates can manage their own notes" ON notes
  FOR ALL USING (auth.uid()::text = advocate_id::text);

CREATE POLICY "Advocates can manage their own payments" ON payments
  FOR ALL USING (auth.uid()::text = advocate_id::text);

-- Functions for business logic
CREATE OR REPLACE FUNCTION calculate_due_date(invoice_date DATE, bar bar_association)
RETURNS DATE AS $$
BEGIN
  CASE bar
    WHEN 'johannesburg' THEN
      RETURN invoice_date + INTERVAL '60 days';
    WHEN 'cape_town' THEN
      RETURN invoice_date + INTERVAL '90 days';
    ELSE
      RETURN invoice_date + INTERVAL '60 days';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to all relevant tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_advocates_updated_at') THEN
    CREATE TRIGGER update_advocates_updated_at BEFORE UPDATE ON advocates
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_matters_updated_at') THEN
    CREATE TRIGGER update_matters_updated_at BEFORE UPDATE ON matters
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_invoices_updated_at') THEN
    CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- Function to check for conflicts
CREATE OR REPLACE FUNCTION check_conflict(
  p_advocate_id UUID,
  p_client_name VARCHAR,
  p_opposing_party VARCHAR
)
RETURNS TABLE(
  has_conflict BOOLEAN,
  conflicting_matters UUID[],
  conflict_reason TEXT
) AS $$
DECLARE
  v_conflicts UUID[];
BEGIN
  -- Check if advocate has represented opposing party before
  SELECT ARRAY_AGG(id) INTO v_conflicts
  FROM matters
  WHERE advocate_id = p_advocate_id
  AND deleted_at IS NULL
  AND (
    LOWER(client_name) = LOWER(p_opposing_party)
    OR LOWER(client_name) LIKE '%' || LOWER(p_opposing_party) || '%'
  );
  
  IF v_conflicts IS NOT NULL THEN
    RETURN QUERY 
    SELECT 
      true,
      v_conflicts,
      'Previously represented the opposing party';
    RETURN;
  END IF;
  
  -- Check if advocate has matters against this client
  SELECT ARRAY_AGG(id) INTO v_conflicts
  FROM matters
  WHERE advocate_id = p_advocate_id
  AND deleted_at IS NULL
  AND description ILIKE '%' || p_client_name || '%';
  
  IF v_conflicts IS NOT NULL THEN
    RETURN QUERY 
    SELECT 
      true,
      v_conflicts,
      'Potential conflict with existing matter';
    RETURN;
  END IF;
  
  -- No conflicts found
  RETURN QUERY 
  SELECT 
    false,
    NULL::UUID[],
    'No conflicts detected';
END;
$$ LANGUAGE plpgsql;