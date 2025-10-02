-- Create academy tables for learning management system

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  instructor TEXT,
  duration_hours DECIMAL(4,2),
  level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
  student_count INTEGER DEFAULT 0,
  cpd_credits DECIMAL(4,2),
  category TEXT,
  thumbnail_url TEXT,
  content_url TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning events table
CREATE TABLE IF NOT EXISTS learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT CHECK (event_type IN ('virtual_shadowing', 'webinar', 'workshop', 'peer_review', 'mentorship')),
  event_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER,
  mentor TEXT,
  location TEXT,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  is_virtual BOOLEAN DEFAULT true,
  meeting_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- CPD tracking table
CREATE TABLE IF NOT EXISTS cpd_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT CHECK (activity_type IN ('course', 'event', 'shadowing', 'peer_review', 'self_study')),
  activity_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  cpd_hours DECIMAL(4,2) NOT NULL CHECK (cpd_hours > 0),
  activity_date DATE NOT NULL,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES learning_events(id) ON DELETE CASCADE,
  registration_status TEXT DEFAULT 'registered' CHECK (registration_status IN ('registered', 'attended', 'cancelled', 'no_show')),
  attended BOOLEAN DEFAULT false,
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  feedback_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_learning_events_date ON learning_events(event_date);
CREATE INDEX IF NOT EXISTS idx_learning_events_type ON learning_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_course_id ON user_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_cpd_tracking_user_id ON cpd_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_cpd_tracking_date ON cpd_tracking(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);

-- Enable Row Level Security
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE cpd_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for courses (public read, admin write)
CREATE POLICY "Anyone can view published courses"
  ON courses FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage courses"
  ON courses FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for learning events (public read)
CREATE POLICY "Anyone can view learning events"
  ON learning_events FOR SELECT
  USING (true);

-- RLS Policies for user progress (own data only)
CREATE POLICY "Users can view their own progress"
  ON user_progress FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own progress"
  ON user_progress FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own progress records"
  ON user_progress FOR UPDATE
  USING (user_id = auth.uid());

-- RLS Policies for CPD tracking (own data only)
CREATE POLICY "Users can view their own CPD records"
  ON cpd_tracking FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own CPD records"
  ON cpd_tracking FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own CPD records"
  ON cpd_tracking FOR UPDATE
  USING (user_id = auth.uid());

-- RLS Policies for event registrations (own data only)
CREATE POLICY "Users can view their own registrations"
  ON event_registrations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can register for events"
  ON event_registrations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own registrations"
  ON event_registrations FOR UPDATE
  USING (user_id = auth.uid());

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER courses_updated_at_trigger
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER learning_events_updated_at_trigger
  BEFORE UPDATE ON learning_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER user_progress_updated_at_trigger
  BEFORE UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER cpd_tracking_updated_at_trigger
  BEFORE UPDATE ON cpd_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER event_registrations_updated_at_trigger
  BEFORE UPDATE ON event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE courses IS 'Stores available courses for the academy learning management system';
COMMENT ON TABLE learning_events IS 'Stores scheduled learning events such as webinars, shadowing sessions, and workshops';
COMMENT ON TABLE user_progress IS 'Tracks user progress through courses';
COMMENT ON TABLE cpd_tracking IS 'Tracks Continuing Professional Development hours and activities';
COMMENT ON TABLE event_registrations IS 'Tracks user registrations and attendance for learning events';
