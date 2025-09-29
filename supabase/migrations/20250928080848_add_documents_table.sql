-- Add documents table if missing
-- This is a standalone migration to ensure the documents table exists

-- First, ensure the document_type enum exists
DO $$ BEGIN
    CREATE TYPE document_type AS ENUM ('brief', 'opinion', 'contract', 'correspondence', 'court_document', 'invoice', 'receipt', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  matter_id UUID, -- Made nullable for now to avoid foreign key issues
  advocate_id UUID, -- Made nullable for now to avoid foreign key issues
  
  -- Document Details
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  document_type document_type NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  
  -- Version Control
  version INTEGER DEFAULT 1,
  parent_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  
  -- Metadata
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  -- Full-text search
  content_text TEXT,
  content_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(content_text, ''))) STORED
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_matter ON documents(matter_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_advocate ON documents(advocate_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_search ON documents USING GIN(content_vector);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);

-- Sample data will be added after we have advocates and matters
