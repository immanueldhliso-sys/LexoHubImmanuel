-- Sample data for lexo Legal Practice Management Platform
-- This script creates realistic test data for development and demonstration

-- Insert sample advocates
INSERT INTO advocates (
  id,
  email,
  full_name,
  initials,
  practice_number,
  bar,
  year_admitted,
  specialisations,
  hourly_rate,
  contingency_rate,
  success_fee_rate,
  phone_number,
  chambers_address,
  postal_address,
  notification_preferences,
  invoice_settings,
  is_active,
  total_outstanding,
  total_collected_ytd,
  matters_count
) VALUES 
(
  '00000000-0000-0000-0000-000000000001',
  'demo@lexo.co.za',
  'John Advocate',
  'J.A.',
  'JHB001234',
  'johannesburg',
  2015,
  ARRAY['commercial_litigation', 'contract_law', 'employment_law'],
  2500.00,
  0.25,
  0.15,
  '+27 11 123 4567',
  'Chambers 15, Johannesburg Bar, 1 Fox Street, Johannesburg, 2001',
  'PO Box 12345, Johannesburg, 2000',
  '{"email": true, "whatsapp": true, "sms": false}',
  '{"auto_remind": true, "reminder_days": [30, 45, 55]}',
  true,
  125000.00,
  850000.00,
  12
),
(
  '00000000-0000-0000-0000-000000000002',
  'sarah.counsel@lexo.co.za',
  'Sarah Senior Counsel',
  'S.C.',
  'CPT005678',
  'cape_town',
  2008,
  ARRAY['constitutional_law', 'administrative_law', 'human_rights'],
  3500.00,
  0.30,
  0.20,
  '+27 21 987 6543',
  'Chambers 8, Cape Bar, 4 Keerom Street, Cape Town, 8001',
  'PO Box 98765, Cape Town, 8000',
  '{"email": true, "whatsapp": false, "sms": true}',
  '{"auto_remind": true, "reminder_days": [45, 60]}',
  true,
  75000.00,
  1200000.00,
  8
),
(
  '00000000-0000-0000-0000-000000000003',
  'mike.junior@lexo.co.za',
  'Michael Junior',
  'M.J.',
  'JHB009876',
  'johannesburg',
  2020,
  ARRAY['criminal_law', 'family_law'],
  1800.00,
  0.20,
  0.10,
  '+27 11 555 0123',
  'Chambers 22, Johannesburg Bar, 1 Fox Street, Johannesburg, 2001',
  'PO Box 55555, Johannesburg, 2000',
  '{"email": true, "whatsapp": true, "sms": true}',
  '{"auto_remind": true, "reminder_days": [30, 45]}',
  true,
  45000.00,
  320000.00,
  15
) ON CONFLICT (id) DO NOTHING;

-- Insert sample matters
INSERT INTO matters (
  id,
  advocate_id,
  reference_number,
  title,
  description,
  matter_type,
  court_case_number,
  bar,
  client_name,
  client_email,
  client_phone,
  client_address,
  client_type,
  instructing_attorney,
  instructing_attorney_email,
  instructing_attorney_phone,
  instructing_firm,
  instructing_firm_ref,
  fee_type,
  estimated_fee,
  fee_cap,
  actual_fee,
  wip_value,
  trust_balance,
  disbursements,
  vat_exempt,
  status,
  risk_level,
  settlement_probability,
  expected_completion_date,
  conflict_check_completed,
  conflict_check_cleared,
  date_instructed,
  date_accepted,
  date_commenced,
  next_court_date,
  tags
) VALUES 
(
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'JA2024001',
  'Smith Industries v Jones Manufacturing - Contract Dispute',
  'Commercial dispute regarding breach of supply contract. Client seeks damages of R2.5M for non-delivery of goods.',
  'Commercial Litigation',
  'HC/2024/12345',
  'johannesburg',
  'Smith Industries (Pty) Ltd',
  'legal@smithind.co.za',
  '+27 11 234 5678',
  '123 Industrial Road, Germiston, 1401',
  'company',
  'Jane Attorney',
  'jane@lawfirm.co.za',
  '+27 11 345 6789',
  'Lawfirm & Associates',
  'LF2024/001',
  'standard',
  150000.00,
  200000.00,
  NULL,
  45000.00,
  25000.00,
  5000.00,
  false,
  'active',
  'medium',
  0.65,
  '2024-12-15',
  true,
  true,
  '2024-08-15',
  '2024-08-16',
  '2024-08-20',
  '2024-11-15',
  ARRAY['commercial', 'contract', 'urgent']
),
(
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  'SC2024001',
  'Department of Health v Medical Practitioners Council - Judicial Review',
  'Application for judicial review of decision to suspend medical practitioner. Constitutional issues regarding fair administrative action.',
  'Administrative Law',
  'WCC/2024/67890',
  'cape_town',
  'Dr. Patricia Williams',
  'p.williams@email.com',
  '+27 21 456 7890',
  '456 Medical Centre, Observatory, Cape Town, 7925',
  'individual',
  'Robert Senior',
  'robert@seniorlaw.co.za',
  '+27 21 567 8901',
  'Senior Law Chambers',
  'SL2024/045',
  'standard',
  200000.00,
  NULL,
  NULL,
  85000.00,
  50000.00,
  12000.00,
  false,
  'active',
  'high',
  0.45,
  '2025-02-28',
  true,
  true,
  '2024-09-01',
  '2024-09-02',
  '2024-09-05',
  '2024-12-10',
  ARRAY['constitutional', 'administrative', 'medical']
),
(
  '10000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000003',
  'MJ2024001',
  'State v Thompson - Armed Robbery',
  'Criminal defense for armed robbery charges. Client maintains innocence, alibi defense.',
  'Criminal Law',
  'CC/2024/11111',
  'johannesburg',
  'David Thompson',
  'david.t@email.com',
  '+27 82 123 4567',
  '789 Residential Street, Soweto, 1818',
  'individual',
  'Legal Aid Attorney',
  'legalaid@justice.gov.za',
  '+27 11 678 9012',
  'Legal Aid South Africa',
  'LA2024/789',
  'pro_bono',
  0.00,
  NULL,
  NULL,
  15000.00,
  0.00,
  2500.00,
  true,
  'active',
  'high',
  0.30,
  '2024-11-30',
  true,
  true,
  '2024-09-15',
  '2024-09-16',
  '2024-09-20',
  '2024-10-25',
  ARRAY['criminal', 'pro_bono', 'urgent']
) ON CONFLICT (id) DO NOTHING;

-- Insert sample time entries
INSERT INTO time_entries (
  id,
  matter_id,
  advocate_id,
  date,
  duration_minutes,
  description,
  billable,
  rate,
  recording_method,
  billed
) VALUES 
(
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '2024-09-25',
  180,
  'Initial consultation with client regarding contract dispute. Reviewed supply agreement and correspondence.',
  true,
  2500.00,
  'manual',
  false
),
(
  '20000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '2024-09-26',
  240,
  'Research on contract law precedents. Drafted initial pleadings for breach of contract claim.',
  true,
  2500.00,
  'manual',
  false
),
(
  '20000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  '2024-09-27',
  300,
  'Preparation of judicial review application. Research on administrative law principles and constitutional requirements.',
  true,
  3500.00,
  'voice',
  false
) ON CONFLICT (id) DO NOTHING;

-- Insert sample invoices
INSERT INTO invoices (
  id,
  matter_id,
  advocate_id,
  invoice_number,
  invoice_date,
  due_date,
  bar,
  fees_amount,
  disbursements_amount,
  vat_rate,
  status,
  amount_paid,
  fee_narrative,
  internal_notes,
  reminders_sent,
  last_reminder_date
) VALUES 
(
  '30000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'INV-2024-001',
  '2024-09-01',
  '2024-10-31',
  'johannesburg',
  25000.00,
  2500.00,
  0.15,
  'sent',
  0.00,
  'Professional services rendered in connection with the Smith Industries matter including initial consultation, document review, and preliminary legal research regarding breach of contract claim.',
  'Client requested detailed breakdown of time spent.',
  1,
  '2024-10-15'
),
(
  '30000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  'INV-2024-002',
  '2024-08-31',
  '2024-11-29',
  'cape_town',
  45000.00,
  8000.00,
  0.15,
  'paid',
  60950.00,
  'Professional services rendered in connection with the Department of Health judicial review matter including case analysis, constitutional research, and preparation of founding affidavit.',
  'Payment received via EFT.',
  0,
  NULL
) ON CONFLICT (id) DO NOTHING;

-- Insert sample payments
INSERT INTO payments (
  id,
  invoice_id,
  advocate_id,
  amount,
  payment_date,
  payment_method,
  reference,
  bank_reference,
  reconciled
) VALUES 
(
  '40000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  60950.00,
  '2024-09-15',
  'eft',
  'Payment for INV-2024-002',
  'EFT123456789',
  true
) ON CONFLICT (id) DO NOTHING;

-- Insert sample documents
INSERT INTO documents (
  id,
  matter_id,
  advocate_id,
  filename,
  original_filename,
  document_type,
  mime_type,
  size_bytes,
  storage_path,
  description,
  content_text,
  tags
) VALUES 
(
  '50000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'supply_agreement_2024.pdf',
  'Smith Industries Supply Agreement.pdf',
  'contract',
  'application/pdf',
  1024000,
  '/documents/supply_agreement_2024.pdf',
  'Original supply agreement between Smith Industries and Jones Manufacturing',
  'This supply agreement entered into between Smith Industries (Pty) Ltd and Jones Manufacturing (Pty) Ltd on 1 January 2024...',
  ARRAY['contract', 'supply_agreement', 'commercial']
),
(
  '50000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  'founding_affidavit_draft.pdf',
  'Founding Affidavit - Dr Williams v DoH.pdf',
  'court_document',
  'application/pdf',
  512000,
  '/documents/founding_affidavit_draft.pdf',
  'Draft founding affidavit for judicial review application',
  'I, Patricia Williams, do hereby make oath and say that I am the applicant in the above matter and that the facts contained herein are within my personal knowledge...',
  ARRAY['affidavit', 'judicial_review', 'constitutional']
) ON CONFLICT (id) DO NOTHING;

-- Insert sample notes
INSERT INTO notes (
  id,
  matter_id,
  advocate_id,
  content,
  is_internal,
  is_important
) VALUES 
(
  '60000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Client emphasized urgency due to cash flow impact. Consider expedited hearing application.',
  true,
  true
),
(
  '60000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  'Constitutional Court precedent in Pharmaceutical Manufacturers case highly relevant. Review for similar fact pattern.',
  true,
  false
) ON CONFLICT (id) DO NOTHING;

-- Update computed fields for matters
UPDATE matters SET 
  days_active = CASE 
    WHEN date_closed IS NOT NULL THEN (date_closed::date - date_instructed::date)
    ELSE (CURRENT_DATE - date_instructed::date)
  END,
  is_overdue = CASE 
    WHEN expected_completion_date IS NOT NULL AND status IN ('active', 'pending') 
    THEN expected_completion_date < CURRENT_DATE
    ELSE false
  END;

-- Update computed fields for invoices
UPDATE invoices SET 
  days_outstanding = CASE 
    WHEN date_paid IS NOT NULL THEN (date_paid::date - invoice_date::date)
    WHEN status IN ('sent', 'viewed', 'overdue') THEN (CURRENT_DATE - invoice_date::date)
    ELSE NULL
  END,
  is_overdue = CASE 
    WHEN status NOT IN ('paid', 'written_off') AND due_date < CURRENT_DATE 
    THEN true 
    ELSE false 
  END;

-- Refresh materialized views if they exist
-- Note: These will be created in future migrations
-- REFRESH MATERIALIZED VIEW advocate_dashboard_summary;