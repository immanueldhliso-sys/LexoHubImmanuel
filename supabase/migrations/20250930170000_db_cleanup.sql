-- Database Cleanup and Maintenance Migration
-- Removes orphaned data and optimizes database performance

-- Clean up orphaned records to maintain referential integrity

-- Remove orphaned time entries
DELETE FROM time_entries 
WHERE matter_id NOT IN (SELECT id FROM matters);

-- Remove orphaned notes
DELETE FROM notes 
WHERE matter_id NOT IN (SELECT id FROM matters);

-- Remove orphaned payments
DELETE FROM payments 
WHERE invoice_id NOT IN (SELECT id FROM invoices);

-- Remove orphaned documents
DELETE FROM documents 
WHERE matter_id IS NOT NULL 
AND matter_id NOT IN (SELECT id FROM matters);

-- Remove orphaned court diary entries
DELETE FROM court_diary_entries 
WHERE court_case_id IS NOT NULL 
AND court_case_id NOT IN (SELECT id FROM court_cases);

-- Remove orphaned brief applications
DELETE FROM brief_applications 
WHERE brief_id NOT IN (SELECT id FROM overflow_briefs);

-- Remove orphaned precedent usage records
DELETE FROM precedent_usage 
WHERE precedent_id NOT IN (SELECT id FROM precedent_bank);

-- Remove orphaned fee narratives
DELETE FROM generated_fee_narratives 
WHERE matter_id NOT IN (SELECT id FROM matters);

-- Data retention cleanup

-- Clean up old audit logs (keep 6 months)
DELETE FROM audit_log 
WHERE created_at < NOW() - INTERVAL '6 months';

-- Clean up old integration logs (keep 3 months)
DELETE FROM court_integration_logs 
WHERE created_at < NOW() - INTERVAL '3 months';

-- Clean up old voice queries (keep 3 months)
DELETE FROM voice_queries 
WHERE created_at < NOW() - INTERVAL '3 months';

-- Clean up old transcriptions (keep 6 months)
DELETE FROM transcriptions 
WHERE created_at < NOW() - INTERVAL '6 months';

-- Clean up old completed voice sessions (keep 1 year)
DELETE FROM voice_sessions 
WHERE status = 'completed' 
AND completed_at < NOW() - INTERVAL '1 year';

-- Update statistics for query optimization
ANALYZE matters;
ANALYZE invoices;
ANALYZE time_entries;
ANALYZE documents;
ANALYZE advocates;