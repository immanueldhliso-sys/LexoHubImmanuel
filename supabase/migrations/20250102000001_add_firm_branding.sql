-- Add firm branding fields to advocates table
-- Migration: Add firm name, tagline, logo, and banking details

ALTER TABLE advocates
ADD COLUMN IF NOT EXISTS firm_name TEXT,
ADD COLUMN IF NOT EXISTS firm_tagline TEXT,
ADD COLUMN IF NOT EXISTS firm_logo_url TEXT,
ADD COLUMN IF NOT EXISTS vat_number TEXT,
ADD COLUMN IF NOT EXISTS banking_details JSONB DEFAULT '{
  "bank_name": "Standard Bank",
  "account_name": "Legal Practice Trust Account",
  "account_number": "",
  "branch_code": "",
  "swift_code": ""
}'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN advocates.firm_name IS 'Law firm or chambers name for branding';
COMMENT ON COLUMN advocates.firm_tagline IS 'Firm tagline or slogan for invoices/documents';
COMMENT ON COLUMN advocates.firm_logo_url IS 'URL to firm logo image for PDF generation';
COMMENT ON COLUMN advocates.vat_number IS 'VAT registration number for invoices';
COMMENT ON COLUMN advocates.banking_details IS 'Banking information for invoice payments (JSON)';

-- Create index for logo URL lookups
CREATE INDEX IF NOT EXISTS idx_advocates_firm_logo ON advocates(firm_logo_url) WHERE firm_logo_url IS NOT NULL;
