/**
 * Academy Service
 * Provides data access for professional development: courses and events.
 * In production, these should fetch from your backend/Supabase tables.
 */

export interface AcademyCourse {
  id: string;
  title: string;
  instructor?: string;
  duration?: string;
  level?: string;
  rating?: number;
  students?: number;
  cpdCredits?: number;
  category?: string;
}

export interface AcademyEvent {
  id: string;
  type: string;
  title: string;
  date: string; // ISO string
  time?: string;
  mentor?: string;
  participants?: number;
}

class AcademyService {
  async getFeaturedCourses(advocateId: string): Promise<AcademyCourse[]> {
    // TODO: Replace with real DB query, e.g., Supabase: from('academy_courses').select('*').eq('advocate_id', advocateId)
    return [];
  }

  async getUpcomingEvents(advocateId: string): Promise<AcademyEvent[]> {
    // TODO: Replace with real DB query, e.g., Supabase: from('academy_events').select('*').eq('advocate_id', advocateId)
    return [];
  }
}

export const academyService = new AcademyService();