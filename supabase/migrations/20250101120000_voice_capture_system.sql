-- Voice Capture System Migration
-- Creates tables and policies for voice-first time capture functionality

-- Create voice_sessions table
CREATE TABLE IF NOT EXISTS voice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advocate_id UUID NOT NULL REFERENCES advocates(id) ON DELETE CASCADE,
    original_audio_url TEXT,
    transcription_text TEXT,
    transcription_confidence FLOAT DEFAULT 0 CHECK (transcription_confidence >= 0 AND transcription_confidence <= 1),
    extracted_data JSONB DEFAULT '{}',
    matched_matter_id UUID REFERENCES matters(id),
    status VARCHAR(20) DEFAULT 'recording' CHECK (status IN ('recording', 'transcribing', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transcriptions table for provider tracking
CREATE TABLE IF NOT EXISTS transcriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voice_session_id UUID NOT NULL REFERENCES voice_sessions(id) ON DELETE CASCADE,
    provider_used VARCHAR(20) NOT NULL CHECK (provider_used IN ('whisper', 'google', 'deepgram', 'web_speech')),
    raw_response JSONB NOT NULL,
    confidence_score FLOAT DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    processing_time_ms INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create voice_service_config table for provider management
CREATE TABLE IF NOT EXISTS voice_service_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name VARCHAR(50) NOT NULL UNIQUE,
    api_endpoint TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    priority_order INTEGER DEFAULT 1,
    config_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_voice_sessions_advocate_id ON voice_sessions(advocate_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_status ON voice_sessions(status);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_created_at ON voice_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_matter_id ON voice_sessions(matched_matter_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_voice_session_id ON transcriptions(voice_session_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_provider ON transcriptions(provider_used);
CREATE INDEX IF NOT EXISTS idx_transcriptions_created_at ON transcriptions(created_at DESC);

-- Add voice session reference to time_entries if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'time_entries' AND column_name = 'voice_session_id') THEN
        ALTER TABLE time_entries ADD COLUMN voice_session_id UUID REFERENCES voice_sessions(id);
        CREATE INDEX idx_time_entries_voice_session ON time_entries(voice_session_id);
    END IF;
END $$;

-- Add voice preferences to advocates if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'advocates' AND column_name = 'voice_preferences') THEN
        ALTER TABLE advocates ADD COLUMN voice_preferences JSONB DEFAULT '{"preferred_provider": "whisper", "auto_save": true, "confidence_threshold": 0.8}';
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE voice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_service_config ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for voice_sessions
CREATE POLICY "Advocates can view own voice sessions" ON voice_sessions
    FOR ALL USING (advocate_id = auth.uid());

CREATE POLICY "Advocates can insert own voice sessions" ON voice_sessions
    FOR INSERT WITH CHECK (advocate_id = auth.uid());

CREATE POLICY "Advocates can update own voice sessions" ON voice_sessions
    FOR UPDATE USING (advocate_id = auth.uid());

-- Create RLS policies for transcriptions
CREATE POLICY "Advocates can view own transcriptions" ON transcriptions
    FOR ALL USING (
        voice_session_id IN (
            SELECT id FROM voice_sessions WHERE advocate_id = auth.uid()
        )
    );

CREATE POLICY "Advocates can insert transcriptions for own sessions" ON transcriptions
    FOR INSERT WITH CHECK (
        voice_session_id IN (
            SELECT id FROM voice_sessions WHERE advocate_id = auth.uid()
        )
    );

-- Create RLS policies for voice_service_config (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view voice service config" ON voice_service_config
    FOR SELECT USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON voice_sessions TO authenticated;
GRANT SELECT, INSERT ON transcriptions TO authenticated;
GRANT SELECT ON voice_service_config TO authenticated;
GRANT SELECT ON voice_sessions TO anon;

-- Insert default service configurations
INSERT INTO voice_service_config (service_name, api_endpoint, priority_order, config_data) VALUES
('whisper', 'https://api.openai.com/v1/audio/transcriptions', 1, '{"model": "whisper-1", "language": "en", "prompt": "Legal time entry for matter. Include details about case work, client name, hours spent."}'),
('google', 'https://speech.googleapis.com/v1/speech:recognize', 2, '{"language_code": "en-ZA", "enable_automatic_punctuation": true, "model": "latest_long"}'),
('deepgram', 'https://api.deepgram.com/v1/listen', 3, '{"model": "nova", "language": "en-ZA", "punctuate": true, "diarize": false}')
ON CONFLICT (service_name) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_voice_sessions_updated_at 
    BEFORE UPDATE ON voice_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voice_service_config_updated_at 
    BEFORE UPDATE ON voice_service_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically set completed_at when status changes to completed
CREATE OR REPLACE FUNCTION set_voice_session_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = NOW();
    ELSIF NEW.status != 'completed' THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for auto-setting completed_at
CREATE TRIGGER set_voice_session_completed_at_trigger
    BEFORE UPDATE ON voice_sessions
    FOR EACH ROW EXECUTE FUNCTION set_voice_session_completed_at();

-- Create view for voice session analytics
CREATE OR REPLACE VIEW voice_session_analytics AS
SELECT 
    vs.advocate_id,
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN vs.status = 'completed' THEN 1 END) as completed_sessions,
    COUNT(CASE WHEN vs.status = 'failed' THEN 1 END) as failed_sessions,
    AVG(vs.transcription_confidence) as avg_confidence,
    AVG(EXTRACT(EPOCH FROM (vs.completed_at - vs.created_at))) as avg_processing_time_seconds,
    COUNT(te.id) as time_entries_created
FROM voice_sessions vs
LEFT JOIN time_entries te ON te.voice_session_id = vs.id
GROUP BY vs.advocate_id;

-- Grant access to the view
GRANT SELECT ON voice_session_analytics TO authenticated;

-- Note: RLS policies cannot be applied to views. 
-- Security is handled by the underlying tables (voice_sessions, time_entries)
-- which already have appropriate RLS policies.

-- Add helpful comments
COMMENT ON TABLE voice_sessions IS 'Stores voice recording sessions and their processing status';
COMMENT ON TABLE transcriptions IS 'Tracks transcription attempts from different providers';
COMMENT ON TABLE voice_service_config IS 'Configuration for voice transcription service providers';
COMMENT ON COLUMN voice_sessions.extracted_data IS 'JSON object containing extracted time entry data (duration, matter, activity type, etc.)';
COMMENT ON COLUMN voice_sessions.transcription_confidence IS 'Confidence score from 0.0 to 1.0 for the transcription accuracy';
COMMENT ON COLUMN transcriptions.raw_response IS 'Full response from the transcription provider for debugging';