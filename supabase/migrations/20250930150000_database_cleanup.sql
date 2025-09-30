-- Database Cleanup Migration
-- This migration performs database maintenance and cleanup operations
-- without removing any actively used tables

-- 1. Clean up any orphaned records or inconsistent data
-- 2. Optimize indexes and constraints
-- 3. Update any deprecated configurations

-- Clean up any orphaned time entries without valid matter references
DELETE FROM time_entries 
WHERE matter_id NOT IN (SELECT id FROM matters);

-- Clean up any orphaned notes without valid matter references  
DELETE FROM notes 
WHERE matter_id NOT IN (SELECT id FROM matters);

-- Clean up any orphaned payments without valid invoice references
DELETE FROM payments 
WHERE invoice_id NOT IN (SELECT id FROM invoices);

-- Clean up any orphaned documents without valid matter references
DELETE FROM documents 
WHERE matter_id IS NOT NULL 
AND matter_id NOT IN (SELECT id FROM matters);

-- Clean up any orphaned court diary entries without valid case references
DELETE FROM court_diary_entries 
WHERE court_case_id IS NOT NULL 
AND court_case_id NOT IN (SELECT id FROM court_cases);

-- Clean up any orphaned brief applications without valid brief references
DELETE FROM brief_applications 
WHERE brief_id NOT IN (SELECT id FROM overflow_briefs);

-- Clean up any orphaned precedent usage records
DELETE FROM precedent_usage 
WHERE precedent_id NOT IN (SELECT id FROM precedent_bank);

-- Clean up any orphaned fee narratives without valid matter references
DELETE FROM generated_fee_narratives 
WHERE matter_id NOT IN (SELECT id FROM matters);

-- Update any deprecated voice service configurations
UPDATE voice_service_config 
SET updated_at = NOW() 
WHERE updated_at < NOW() - INTERVAL '30 days';

-- Clean up old audit log entries (keep last 6 months)
DELETE FROM audit_log 
WHERE created_at < NOW() - INTERVAL '6 months';

-- Clean up old court integration logs (keep last 3 months)
DELETE FROM court_integration_logs 
WHERE created_at < NOW() - INTERVAL '3 months';

-- Clean up old voice queries (keep last 3 months)
DELETE FROM voice_queries 
WHERE created_at < NOW() - INTERVAL '3 months';

-- Clean up old transcriptions (keep last 6 months)
DELETE FROM transcriptions 
WHERE created_at < NOW() - INTERVAL '6 months';

-- Clean up completed voice sessions older than 1 year
DELETE FROM voice_sessions 
WHERE status = 'completed' 
AND completed_at < NOW() - INTERVAL '1 year';

-- Optimize indexes by reindexing frequently used tables
REINDEX TABLE matters;
REINDEX TABLE invoices;
REINDEX TABLE time_entries;
REINDEX TABLE documents;

-- Update table statistics for better query planning
ANALYZE matters;
ANALYZE invoices;
ANALYZE time_entries;
ANALYZE documents;
ANALYZE advocates;

-- Add comment to track cleanup
COMMENT ON SCHEMA public IS 'LexoHub database schema - cleaned up on 2025-09-30';