-- Define enum types for status and the requested action
CREATE TYPE pro_forma_request_status AS ENUM ('pending', 'submitted', 'processed', 'declined');
CREATE TYPE pro_forma_action_type AS ENUM ('matter', 'pro_forma');

-- Create the table to store pro forma requests
CREATE TABLE IF NOT EXISTS pro_forma_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advocate_id UUID NOT NULL REFERENCES advocates(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL DEFAULT extensions.uuid_generate_v4()::text,
    status pro_forma_request_status NOT NULL DEFAULT 'pending',
    requested_action pro_forma_action_type, -- To be filled by the form submitter

    -- Form Data (nullable until submitted)
    instructing_attorney_name TEXT,
    instructing_attorney_firm TEXT,
    instructing_attorney_email TEXT,
    instructing_attorney_phone TEXT,
    client_name TEXT,
    client_email TEXT, -- Added for ProFormaLinkModal compatibility
    matter_title TEXT,
    matter_description TEXT,
    description TEXT, -- Added for ProFormaLinkModal compatibility
    urgency TEXT, -- Added for ProFormaLinkModal compatibility

    created_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ
);

-- Add indexes for performance
CREATE INDEX idx_pro_forma_requests_advocate_id_status ON pro_forma_requests(advocate_id, status);
CREATE INDEX idx_pro_forma_requests_token ON pro_forma_requests(token);

-- Enable Row Level Security
ALTER TABLE pro_forma_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Advocates can create, view, and manage their own requests.
CREATE POLICY "Advocates can manage their own pro_forma_requests"
ON pro_forma_requests FOR ALL
USING (auth.uid() = advocate_id);

-- Anyone with the link can view the form to submit it.
CREATE POLICY "Public can view a pending pro_forma_request form"
ON pro_forma_requests FOR SELECT
USING (status = 'pending');

-- Anyone with the link can update a pending request to submit their details.
CREATE POLICY "Public can submit a pending pro_forma_request"
ON pro_forma_requests FOR UPDATE
USING (status = 'pending')
WITH CHECK (status = 'pending');