-- Manual migration to fix pro forma schema
-- Execute this in Supabase SQL Editor to add missing fields

-- Add missing fields to pro_forma_requests table for compatibility
-- This combines the missing fields from 20251001090000_add_missing_pro_forma_fields.sql

BEGIN;

-- Add client_email field if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pro_forma_requests' 
                   AND column_name = 'client_email') THEN
        ALTER TABLE pro_forma_requests ADD COLUMN client_email TEXT;
    END IF;
END $$;

-- Add description field if it doesn't exist (separate from matter_description)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pro_forma_requests' 
                   AND column_name = 'description') THEN
        ALTER TABLE pro_forma_requests ADD COLUMN description TEXT;
    END IF;
END $$;

-- Add urgency field if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pro_forma_requests' 
                   AND column_name = 'urgency') THEN
        ALTER TABLE pro_forma_requests ADD COLUMN urgency TEXT;
    END IF;
END $$;

-- Add matter_type field if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pro_forma_requests' 
                   AND column_name = 'matter_type') THEN
        ALTER TABLE pro_forma_requests ADD COLUMN matter_type TEXT;
    END IF;
END $$;

-- Add client_name field if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pro_forma_requests' 
                   AND column_name = 'client_name') THEN
        ALTER TABLE pro_forma_requests ADD COLUMN client_name TEXT;
    END IF;
END $$;

-- Add client_phone field if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pro_forma_requests' 
                   AND column_name = 'client_phone') THEN
        ALTER TABLE pro_forma_requests ADD COLUMN client_phone TEXT;
    END IF;
END $$;

-- Add matter_description field if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pro_forma_requests' 
                   AND column_name = 'matter_description') THEN
        ALTER TABLE pro_forma_requests ADD COLUMN matter_description TEXT;
    END IF;
END $$;

-- Add urgency_level field if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pro_forma_requests' 
                   AND column_name = 'urgency_level') THEN
        ALTER TABLE pro_forma_requests ADD COLUMN urgency_level TEXT;
    END IF;
END $$;

COMMIT;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'pro_forma_requests' 
ORDER BY ordinal_position;