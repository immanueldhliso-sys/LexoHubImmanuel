/*
# Pro Forma Invoice Support Migration

This migration adds support for pro forma invoices to the existing schema:

1. Updates invoice_status ENUM to include pro forma states
2. Adds pro forma specific fields to the invoices table
3. Ensures compatibility with existing pro forma workflow in the frontend

## Changes:
- Add 'pro_forma', 'pro_forma_accepted', 'pro_forma_declined' to invoice_status enum
- Add is_pro_forma boolean flag to invoices table
- Add converted_to_invoice_id for tracking conversions
- Add pro_forma_accepted_at timestamp for acceptance tracking

## Compatibility:
- All changes are additive and backward compatible
- Existing invoices will have is_pro_forma = FALSE by default
- New enum values extend existing invoice_status without breaking changes
*/

-- Add new values to the invoice_status enum
ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'pro_forma';
ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'pro_forma_accepted';
ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'pro_forma_declined';

-- Add pro forma specific fields to invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS is_pro_forma BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS converted_to_invoice_id UUID REFERENCES invoices(id),
ADD COLUMN IF NOT EXISTS pro_forma_accepted_at TIMESTAMPTZ;

-- Add index for performance on pro forma queries
CREATE INDEX IF NOT EXISTS idx_invoices_is_pro_forma ON invoices(is_pro_forma) WHERE is_pro_forma = TRUE;
CREATE INDEX IF NOT EXISTS idx_invoices_converted_to_invoice_id ON invoices(converted_to_invoice_id) WHERE converted_to_invoice_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN invoices.is_pro_forma IS 'Flag to identify pro forma invoices (quotes) vs final invoices';
COMMENT ON COLUMN invoices.converted_to_invoice_id IS 'Reference to the final invoice created from this pro forma';
COMMENT ON COLUMN invoices.pro_forma_accepted_at IS 'Timestamp when the pro forma was accepted by the client';

-- Update the updated_at timestamp trigger to include new columns
-- (This ensures the updated_at field is properly maintained)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Ensure the trigger exists for the invoices table
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();