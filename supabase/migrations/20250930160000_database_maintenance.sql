-- Database Maintenance Migration
-- This migration performs database maintenance and cleanup operations
-- Focus: Remove orphaned data and optimize performance

-- Clean up orphaned records to maintain referential integrity

-- 1. Clean up orphaned time entries without valid matter references
DELETE FROM time_entries 
WHERE matter_id NOT IN (SELECT id FROM matters);

-- 2. Clean up orphaned notes without valid matter references  
DELETE FROM notes 
WHERE matter_id NOT IN (SELECT id FROM matters);

-- 3. Clean up orphaned payments without valid invoice references
DELETE FROM payments 
WHERE invoice_id NOT IN (SELECT id FROM invoices);

-- 4. Clean up orphaned documents without valid matter references
DELETE FROM documents 
WHERE matter_id IS NOT NULL 
AND matter_id NOT IN (SELECT id FROM matters);

-- 5. Clean up orphaned court diary entries without valid case references
DELETE FROM court_diary_entries 
WHERE court_case_id IS NOT NULL 
AND court_case_id NOT IN (SELECT id FROM court_cases);

-- 6. Clean up orphaned brief applications without valid brief references
DELETE FROM brief_applications 
WHERE brief_id NOT IN (SELECT id FROM overflow_briefs);

-- 7. Clean up orphaned precedent usage records
DELETE FROM precedent_usage 
WHERE precedent_id NOT IN (SELECT id FROM precedent_bank);

-- 8. Clean up orphaned fee narratives without valid matter references
DELETE FROM generated_fee_narratives 
WHERE matter_id NOT IN (SELECT id FROM matters);

-- Data