-- Add missing fields to pro_forma_requests table for ProFormaLinkModal compatibility

-- Add client_email field
ALTER TABLE pro_forma_requests 
ADD COLUMN IF NOT EXISTS client_email TEXT;

-- Add description field (separate from matter_description)
ALTER TABLE pro_forma_requests 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add urgency field
ALTER TABLE pro_forma_requests 
ADD COLUMN IF NOT EXISTS urgency TEXT;