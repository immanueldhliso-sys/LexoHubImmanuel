import { supabase } from '@/lib/supabase';

export interface AcademyCourse {
  id: string;
  title: string;
  description?: string;
  instructor?: string;
  duration_hours?: number;
  level?: 'beginner' | 'intermediate' | 'advanced';
  rating?: number;
  student_count?: number;
  cpd_credits?: number;
  category?: string;
  thumbnail_url?: string;
  content_url?: string;
  is_published?: boolean;
  created_at?: string;
}

export interface AcademyEvent {
  id: string;
  title: string;
  description?: string;
  event_type: 'virtual_shadowing' | 'webinar' | 'workshop' | 'peer_review' | 'mentorship';
  event_date: string;
  duration_minutes?: number;
  mentor?: string;
  location?: string;
  max_participants?: number;
  current_participants?: number;
  is_virtual?: boolean;
  meeting_link?: string;
  created_at?: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  course_id: string;
  progress_percentage: number;
  completed: boolean;
  completed_at?: string;
  last_accessed_at: string;
}

export interface CPDRecord {
  id: string;
  user_id: string;
  activity_type: 'course' | 'event' | 'shadowing' | 'peer_review' | 'self_study';
  activity_id?: string;
  title: string;
  description?: string;
  cpd_hours: number;
  activity_date: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  verified_by?: string;
  verified_at?: string;
}

export interface LearningProgress {
  totalCourses: number;
  completedCourses: number;
  cpdHours: number;
  requiredCpdHours: number;
  shadowingSessions: number;
  peerReviews: number;
}

export class AcademyService {
  static async getCourses(limit: number = 20): Promise<AcademyCourse[]> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('rating', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw new Error('Failed to fetch courses');
    }
  }

  static async getFeaturedCourses(limit: number = 6): Promise<AcademyCourse[]> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('rating', { ascending: false })
        .order('student_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching featured courses:', error);
      throw new Error('Failed to fetch featured courses');
    }
  }

  static async getCourseById(id: string): Promise<AcademyCourse | null> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching course:', error);
      throw new Error('Failed to fetch course');
    }
  }

  static async getUpcomingEvents(limit: number = 10): Promise<AcademyEvent[]> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('learning_events')
        .select('*')
        .gte('event_date', now)
        .order('event_date', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      throw new Error('Failed to fetch upcoming events');
    }
  }

  static async getEventById(id: string): Promise<AcademyEvent | null> {
    try {
      const { data, error } = await supabase
        .from('learning_events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching event:', error);
      throw new Error('Failed to fetch event');
    }
  }

  static async getLearningProgress(userId: string): Promise<LearningProgress> {
    try {
      const [progressData, cpdData, eventsData] = await Promise.all([
        supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', userId),
        supabase
          .from('cpd_tracking')
          .select('cpd_hours, verification_status')
          .eq('user_id', userId)
          .eq('verification_status', 'verified'),
        supabase
          .from('event_registrations')
          .select('registration_status')
          .eq('user_id', userId)
          .eq('attended', true)
      ]);

      const progress = progressData.data || [];
      const cpd = cpdData.data || [];
      const events = eventsData.data || [];

      const totalCourses = progress.length;
      const completedCourses = progress.filter(p => p.completed).length;
      const cpdHours = cpd.reduce((sum, record) => sum + (record.cpd_hours || 0), 0);
      const shadowingSessions = events.filter(e => e.registration_status === 'attended').length;

      return {
        totalCourses,
        completedCourses,
        cpdHours,
        requiredCpdHours: 20,
        shadowingSessions,
        peerReviews: 0
      };
    } catch (error) {
      console.error('Error fetching learning progress:', error);
      throw new Error('Failed to fetch learning progress');
    }
  }

  static async getCPDHours(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('cpd_tracking')
        .select('cpd_hours')
        .eq('user_id', userId)
        .eq('verification_status', 'verified');

      if (error) throw error;

      return (data || []).reduce((sum, record) => sum + (record.cpd_hours || 0), 0);
    } catch (error) {
      console.error('Error fetching CPD hours:', error);
      throw new Error('Failed to fetch CPD hours');
    }
  }

  static async getShadowingSessions(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('user_id', userId)
        .eq('attended', true);

      if (error) throw error;
      return (data || []).length;
    } catch (error) {
      console.error('Error fetching shadowing sessions:', error);
      throw new Error('Failed to fetch shadowing sessions');
    }
  }

  static async registerForEvent(userId: string, eventId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('event_registrations')
        .insert([{
          user_id: userId,
          event_id: eventId,
          registration_status: 'registered'
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error registering for event:', error);
      throw new Error('Failed to register for event');
    }
  }

  static async updateProgress(
    userId: string,
    courseId: string,
    progressPercentage: number,
    completed: boolean = false
  ): Promise<void> {
    try {
      const updateData: any = {
        progress_percentage: progressPercentage,
        completed,
        last_accessed_at: new Date().toISOString()
      };

      if (completed) {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('user_progress')
        .upsert([{
          user_id: userId,
          course_id: courseId,
          ...updateData
        }], {
          onConflict: 'user_id,course_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating progress:', error);
      throw new Error('Failed to update progress');
    }
  }

  static async addCPDRecord(record: Omit<CPDRecord, 'id' | 'verification_status' | 'verified_by' | 'verified_at'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('cpd_tracking')
        .insert([{
          ...record,
          verification_status: 'pending'
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error adding CPD record:', error);
      throw new Error('Failed to add CPD record');
    }
  }
}

export const academyService = new AcademyService();