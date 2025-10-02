-- Integration Data Tables Migration
-- Creates tables for storing synced data from third-party integrations

-- Communications table for emails and messages
CREATE TABLE IF NOT EXISTS public.communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  matter_id UUID REFERENCES public.matters(id) ON DELETE SET NULL,
  external_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('email', 'message', 'call', 'meeting')),
  subject TEXT,
  content TEXT,
  from_address TEXT,
  from_name TEXT,
  to_addresses TEXT[],
  received_at TIMESTAMPTZ,
  has_attachments BOOLEAN DEFAULT false,
  sync_source TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar events table
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  matter_id UUID REFERENCES public.matters(id) ON DELETE SET NULL,
  external_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  all_day BOOLEAN DEFAULT false,
  sync_source TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meetings table for video conferences
CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  matter_id UUID REFERENCES public.matters(id) ON DELETE SET NULL,
  external_id TEXT,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL,
  join_url TEXT,
  password TEXT,
  recording_url TEXT,
  sync_source TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disbursements table for expenses
CREATE TABLE IF NOT EXISTS public.disbursements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  matter_id UUID REFERENCES public.matters(id) ON DELETE SET NULL,
  external_id TEXT,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL,
  vendor_name TEXT,
  category TEXT,
  receipt_url TEXT,
  billable BOOLEAN DEFAULT true,
  sync_source TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add external_id and sync_source to existing invoices table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'external_id'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN external_id TEXT;
    ALTER TABLE public.invoices ADD COLUMN sync_source TEXT;
  END IF;
END $$;

-- Add external_id and sync_source to existing payments table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'external_id'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN external_id TEXT;
    ALTER TABLE public.payments ADD COLUMN sync_source TEXT;
  END IF;
END $$;

-- Add external_id and sync_source to existing documents table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name = 'external_id'
  ) THEN
    ALTER TABLE public.documents ADD COLUMN external_id TEXT;
    ALTER TABLE public.documents ADD COLUMN sync_source TEXT;
    ALTER TABLE public.documents ADD COLUMN document_type TEXT;
  END IF;
END $$;

-- Add external_id and sync_source to existing time_entries table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'time_entries' AND column_name = 'external_id'
  ) THEN
    ALTER TABLE public.time_entries ADD COLUMN external_id TEXT;
    ALTER TABLE public.time_entries ADD COLUMN sync_source TEXT;
  END IF;
END $$;

-- Add external_id to existing clients table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'external_id'
  ) THEN
    ALTER TABLE public.clients ADD COLUMN external_id TEXT;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_communications_user_id ON public.communications(user_id);
CREATE INDEX IF NOT EXISTS idx_communications_matter_id ON public.communications(matter_id);
CREATE INDEX IF NOT EXISTS idx_communications_external_id ON public.communications(external_id);
CREATE INDEX IF NOT EXISTS idx_communications_sync_source ON public.communications(sync_source);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_matter_id ON public.calendar_events(matter_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON public.calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_external_id ON public.calendar_events(external_id);

CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON public.meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_matter_id ON public.meetings(matter_id);
CREATE INDEX IF NOT EXISTS idx_meetings_external_id ON public.meetings(external_id);
CREATE INDEX IF NOT EXISTS idx_meetings_start_time ON public.meetings(start_time);

CREATE INDEX IF NOT EXISTS idx_disbursements_user_id ON public.disbursements(user_id);
CREATE INDEX IF NOT EXISTS idx_disbursements_matter_id ON public.disbursements(matter_id);
CREATE INDEX IF NOT EXISTS idx_disbursements_external_id ON public.disbursements(external_id);
CREATE INDEX IF NOT EXISTS idx_disbursements_date ON public.disbursements(date);

-- Enable Row Level Security
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disbursements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for communications
CREATE POLICY "Users can view their own communications"
  ON public.communications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own communications"
  ON public.communications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own communications"
  ON public.communications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own communications"
  ON public.communications FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for calendar_events
CREATE POLICY "Users can view their own calendar events"
  ON public.calendar_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar events"
  ON public.calendar_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar events"
  ON public.calendar_events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar events"
  ON public.calendar_events FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for meetings
CREATE POLICY "Users can view their own meetings"
  ON public.meetings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meetings"
  ON public.meetings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meetings"
  ON public.meetings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meetings"
  ON public.meetings FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for disbursements
CREATE POLICY "Users can view their own disbursements"
  ON public.disbursements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own disbursements"
  ON public.disbursements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own disbursements"
  ON public.disbursements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own disbursements"
  ON public.disbursements FOR DELETE
  USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.communications TO authenticated;
GRANT ALL ON public.calendar_events TO authenticated;
GRANT ALL ON public.meetings TO authenticated;
GRANT ALL ON public.disbursements TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.communications IS 'Stores emails and messages synced from integrations';
COMMENT ON TABLE public.calendar_events IS 'Stores calendar events synced from integrations';
COMMENT ON TABLE public.meetings IS 'Stores video conference meetings from Zoom and similar platforms';
COMMENT ON TABLE public.disbursements IS 'Stores expenses and disbursements synced from accounting systems';
