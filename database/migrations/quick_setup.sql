-- Quick Setup SQL for LexoHub - Run this in Supabase SQL Editor
-- This creates all the essential tables needed for the application to work

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
  
  -- Contact details
  phone_number VARCHAR(20),
  chambers_address TEXT,
  
  -- Settings
  notification_preferences JSONB DEFAULT '{"email": true, "whatsapp": false, "sms": false}',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  
  -- Computed fields
  total_outstanding DECIMAL(12,2) DEFAULT 0,
  total_collected_ytd DECIMAL(12,2) DEFAULT 0,
  matters_count INTEGER DEFAULT 0
);

-- Matters table
CREATE TABLE IF NOT EXISTS matters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advocate_id UUID NOT NULL REFERENCES advocates(id) ON DELETE CASCADE,
  
  -- Basic Information
  reference_number VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  matter_type VARCHAR(100) NOT NULL,
  bar bar_association NOT NULL,
  
  -- Client Information
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255),
  
  -- Instructing Attorney
  instructing_attorney VARCHAR(255) NOT NULL,
  instructing_attorney_email VARCHAR(255),
  instructing_firm VARCHAR(255),
  
  -- Financial Information
  fee_type fee_type DEFAULT 'standard',
  estimated_fee DECIMAL(12,2),
  wip_value DECIMAL(12,2) DEFAULT 0,
  
  -- Status and Risk
  status matter_status DEFAULT 'pending',
  risk_level risk_level DEFAULT 'low',
  settlement_probability DECIMAL(3,2),
  
  -- Conflict Check
  conflict_check_completed BOOLEAN DEFAULT false,
  conflict_check_date TIMESTAMPTZ,
  
  -- Important Dates
  date_instructed DATE NOT NULL DEFAULT CURRENT_DATE,
  date_accepted DATE,
  date_closed DATE,
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  matter_id UUID REFERENCES matters(id) ON DELETE CASCADE,
  advocate_id UUID REFERENCES advocates(id) ON DELETE CASCADE,
  
  -- Document Details
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  document_type document_type NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  
  -- Version Control
  version INTEGER DEFAULT 1,
  
  -- Metadata
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  -- Full-text search
  content_text TEXT
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advocate_id UUID NOT NULL REFERENCES advocates(id) ON DELETE CASCADE,
  matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  
  -- Invoice Details
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  
  -- Amounts
  subtotal DECIMAL(12,2) NOT NULL,
  vat_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  balance_due DECIMAL(12,2) NOT NULL,
  
  -- Status
  status invoice_status DEFAULT 'draft',
  
  -- Content
  fee_narrative TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Time entries table
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advocate_id UUID NOT NULL REFERENCES advocates(id) ON DELETE CASCADE,
  matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  
  -- Time Entry Details
  entry_date DATE NOT NULL,
  description TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  rate DECIMAL(10,2) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  
  -- Status
  billed BOOLEAN DEFAULT false,
  invoice_id UUID REFERENCES invoices(id),
  
  -- Method
  entry_method time_entry_method DEFAULT 'manual',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add some indexes for performance
CREATE INDEX IF NOT EXISTS idx_matters_advocate ON matters(advocate_id);
CREATE INDEX IF NOT EXISTS idx_matters_status ON matters(status);
CREATE INDEX IF NOT EXISTS idx_documents_matter ON documents(matter_id);
CREATE INDEX IF NOT EXISTS idx_invoices_advocate ON invoices(advocate_id);
CREATE INDEX IF NOT EXISTS idx_invoices_matter ON invoices(matter_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_matter ON time_entries(matter_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_billed ON time_entries(billed);

-- Insert sample data for testing
INSERT INTO advocates (
  email, full_name, initials, practice_number, bar, year_admitted, hourly_rate
) VALUES (
  'john.doe@example.com', 'John Doe', 'J.D.', 'JHB001', 'johannesburg', 2010, 2500.00
) ON CONFLICT (email) DO NOTHING;

-- Add sample matter
INSERT INTO matters (
  advocate_id, reference_number, title, matter_type, bar, client_name, instructing_attorney
) VALUES (
  (SELECT id FROM advocates WHERE email = 'john.doe@example.com' LIMIT 1),
  'JD2024001', 'Sample Commercial Matter', 'Commercial Litigation', 'johannesburg', 
  'Sample Client Ltd', 'Sample Attorney'
) ON CONFLICT (reference_number) DO NOTHING;
