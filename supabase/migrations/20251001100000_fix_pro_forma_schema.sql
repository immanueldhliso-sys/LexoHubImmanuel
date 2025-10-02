-- Fix pro forma requests schema to match database types and component usage

-- First, drop the existing table and recreate with correct schema
DROP TABLE IF EXISTS pro_forma_requests CASCADE;

-- Create proper enum types
DROP TYPE IF EXISTS pro_forma_request_status CASCADE;
DROP TYPE IF EXISTS pro_forma_action_type CASCADE;

CREATE TYPE pro_forma_status AS ENUM ('pending', 'submitted', 'processed', 'declined');
CREATE TYPE urgency_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE pro_forma_action AS ENUM ('matter', 'pro_forma', 'invoice');

-- Create the table with correct schema matching database types
CREATE TABLE pro_forma_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT UNIQUE NOT NULL DEFAULT extensions.uuid_generate_v4()::text,
    advocate_id UUID NOT NULL REFERENCES advocates(id) ON DELETE CASCADE,
    
    -- Client information
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT,
    
    -- Matter information
    matter_description TEXT NOT NULL,
    matter_type TEXT NOT NULL DEFAULT 'general',
    urgency_level urgency_level NOT NULL DEFAULT 'medium',
    estimated_value DECIMAL(15,2),
    
    -- Contact preferences
    preferred_contact_method TEXT DEFAULT 'email',
    additional_notes TEXT,
    
    -- Status and processing
    status pro_forma_status NOT NULL DEFAULT 'pending',
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES advocates(id),
    
    -- Action taken
    action_taken pro_forma_action,
    rejection_reason TEXT
);

-- Add indexes for performance
CREATE INDEX idx_pro_forma_requests_advocate_id_status ON pro_forma_requests(advocate_id, status);
CREATE INDEX idx_pro_forma_requests_token ON pro_forma_requests(token);
CREATE INDEX idx_pro_forma_requests_status ON pro_forma_requests(status);
CREATE INDEX idx_pro_forma_requests_expires_at ON pro_forma_requests(expires_at);

-- Enable Row Level Security
ALTER TABLE pro_forma_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Advocates can create, view, and manage their own requests
CREATE POLICY "Advocates can manage their own pro_forma_requests"
ON pro_forma_requests FOR ALL
USING (auth.uid() = advocate_id);

-- Public can view pending requests (for form access)
CREATE POLICY "Public can view pending pro_forma_requests"
ON pro_forma_requests FOR SELECT
USING (status = 'pending' AND expires_at > NOW());

-- Public can update pending requests (for form submission)
CREATE POLICY "Public can submit pending pro_forma_requests"
ON pro_forma_requests FOR UPDATE
USING (status = 'pending' AND expires_at > NOW());

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pro_forma_requests_updated_at 
    BEFORE UPDATE ON pro_forma_requests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();