/**
 * Feature Analytics Service
 * Tracks feature usage and provides analytics for advanced features
 */

import { FeatureUsageEvent, FeatureCategory } from '../../types/advanced-features';
import { userPreferencesService } from '../api/user-preferences.service';

export interface FeatureAnalytics {
  feature_id: string;
  feature_name: string;
  category: FeatureCategory;
  total_accesses: number;
  unique_users: number;
  last_accessed: Date;
  adoption_rate: number;
}

export interface UsageMetrics {
  total_events: number;
  unique_users: number;
  most_popular_features: FeatureAnalytics[];
  category_usage: Record<FeatureCategory, {
    total_accesses: number;
    unique_users: number;
    adoption_rate: number;
  }>;
  daily_usage: Array<{
    date: string;
    total_accesses: number;
    unique_users: number;
  }>;
}

class FeatureAnalyticsService {
  private events: FeatureUsageEvent[] = [];
  private readonly STORAGE_KEY = 'feature_usage_events';
  private readonly MAX_EVENTS = 1000;

  constructor() {
    this.loadStoredEvents();
  }

  /**
   * Track a feature usage event
   */
  trackEvent(event: Omit<FeatureUsageEvent, 'timestamp' | 'user_id'>): void {
    const fullEvent: FeatureUsageEvent = {
      ...event,
      timestamp: new Date(),
      user_id: this.getCurrentUserId()
    };

    this.events.push(fullEvent);
    
    // Keep only the most recent events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    this.saveEvents();
    
    // In production, this would also send to a backend analytics service
    this.sendToAnalyticsService(fullEvent);
  }

  /**
   * Track feature enablement
   */
  trackFeatureEnabled(featureId: string, metadata?: Record<string, any>): void {
    this.trackEvent({
      feature_id: featureId,
      event_type: 'enabled',
      metadata
    });
  }

  /**
   * Track feature disablement
   */
  trackFeatureDisabled(featureId: string, metadata?: Record<string, any>): void {
    this.trackEvent({
      feature_id: featureId,
      event_type: 'disabled',
      metadata
    });
  }

  /**
   * Track feature page access
   */
  trackFeatureAccessed(featureId: string, page: string, metadata?: Record<string, any>): void {
    this.trackEvent({
      feature_id: featureId,
      event_type: 'accessed',
      metadata: { page, ...metadata }
    });
  }

  /**
   * Get usage metrics for all features
   */
  getUsageMetrics(dateRange?: { start: Date; end: Date }): UsageMetrics {
    let filteredEvents = this.events;

    if (dateRange) {
      filteredEvents = this.events.filter(event => 
        event.timestamp >= dateRange.start && event.timestamp <= dateRange.end
      );
    }

    const uniqueUsers = new Set(filteredEvents.map(e => e.user_id)).size;
    
    // Group events by feature
    const featureGroups = this.groupEventsByFeature(filteredEvents);
    
    // Calculate feature analytics
    const featureAnalytics: FeatureAnalytics[] = Object.entries(featureGroups).map(([featureId, events]) => {
      const uniqueFeatureUsers = new Set(events.map(e => e.user_id)).size;
      const accessEvents = events.filter(e => e.event_type === 'accessed');
      
      return {
        feature_id: featureId,
        feature_name: this.getFeatureName(featureId),
        category: this.getFeatureCategory(featureId),
        total_accesses: accessEvents.length,
        unique_users: uniqueFeatureUsers,
        last_accessed: new Date(Math.max(...events.map(e => e.timestamp.getTime()))),
        adoption_rate: uniqueUsers > 0 ? uniqueFeatureUsers / uniqueUsers : 0
      };
    });

    // Sort by popularity
    const mostPopularFeatures = featureAnalytics
      .sort((a, b) => b.total_accesses - a.total_accesses)
      .slice(0, 10);

    // Calculate category usage
    const categoryUsage = this.calculateCategoryUsage(filteredEvents, uniqueUsers);

    // Calculate daily usage
    const dailyUsage = this.calculateDailyUsage(filteredEvents);

    return {
      total_events: filteredEvents.length,
      unique_users,
      most_popular_features: mostPopularFeatures,
      category_usage: categoryUsage,
      daily_usage: dailyUsage
    };
  }

  /**
   * Get analytics for a specific feature
   */
  getFeatureAnalytics(featureId: string, dateRange?: { start: Date; end: Date }): FeatureAnalytics | null {
    let filteredEvents = this.events.filter(e => e.feature_id === featureId);

    if (dateRange) {
      filteredEvents = filteredEvents.filter(event => 
        event.timestamp >= dateRange.start && event.timestamp <= dateRange.end
      );
    }

    if (filteredEvents.length === 0) {
      return null;
    }

    const uniqueUsers = new Set(filteredEvents.map(e => e.user_id)).size;
    const accessEvents = filteredEvents.filter(e => e.event_type === 'accessed');
    const totalUsers = new Set(this.events.map(e => e.user_id)).size;

    return {
      feature_id: featureId,
      feature_name: this.getFeatureName(featureId),
      category: this.getFeatureCategory(featureId),
      total_accesses: accessEvents.length,
      unique_users: uniqueUsers,
      last_accessed: new Date(Math.max(...filteredEvents.map(e => e.timestamp.getTime()))),
      adoption_rate: totalUsers > 0 ? uniqueUsers / totalUsers : 0
    };
  }

  /**
   * Get feature adoption rates
   */
  async getFeatureAdoptionRates(): Promise<Record<FeatureCategory, number>> {
    try {
      const response = await userPreferencesService.getFeatureUsageStats();
      
      if (response.error || !response.data) {
        console.error('Failed to get adoption rates:', response.error);
        return this.calculateLocalAdoptionRates();
      }

      return response.data.feature_adoption_rates;
    } catch (error) {
      console.error('Error getting adoption rates:', error);
      return this.calculateLocalAdoptionRates();
    }
  }

  /**
   * Export analytics data
   */
  exportAnalytics(format: 'json' | 'csv' = 'json'): string {
    const metrics = this.getUsageMetrics();
    
    if (format === 'csv') {
      return this.convertToCSV(metrics);
    }
    
    return JSON.stringify(metrics, null, 2);
  }

  /**
   * Clear all analytics data
   */
  clearAnalytics(): void {
    this.events = [];
    this.saveEvents();
  }

  /**
   * Get events for debugging
   */
  getEvents(): FeatureUsageEvent[] {
    return [...this.events];
  }

  // Private methods

  private loadStoredEvents(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.events = parsed.map((event: any) => ({
          ...event,
          timestamp: new Date(event.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error loading stored events:', error);
      this.events = [];
    }
  }

  private saveEvents(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.events));
    } catch (error) {
      console.error('Error saving events:', error);
    }
  }

  private getCurrentUserId(): string {
    // In a real app, this would get the current user ID from auth context
    // For now, return a placeholder
    return 'current-user-id';
  }

  private sendToAnalyticsService(event: FeatureUsageEvent): void {
    // In production, send to backend analytics service
    if (import.meta.env.DEV) {
      console.log('📊 Feature Analytics Event:', event);
    }
    
    // Example: Send to analytics service
    // fetch('/api/analytics/events', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(event)
    // });
  }

  private groupEventsByFeature(events: FeatureUsageEvent[]): Record<string, FeatureUsageEvent[]> {
    return events.reduce((groups, event) => {
      if (!groups[event.feature_id]) {
        groups[event.feature_id] = [];
      }
      groups[event.feature_id].push(event);
      return groups;
    }, {} as Record<string, FeatureUsageEvent[]>);
  }

  private getFeatureName(featureId: string): string {
    // Map feature IDs to names
    const featureNames: Record<string, string> = {
      'strategic-finance': 'Strategic Finance',
      'practice-growth': 'Practice Growth',
      'advanced-reports': 'Advanced Reports',
      'document-intelligence': 'Document Intelligence',
      'ai-analytics': 'AI Analytics Dashboard',
      'precedent-bank': 'Precedent Bank',
      'academy': 'Professional Academy',
      'workflow-integrations': 'Workflow Integrations'
    };
    
    return featureNames[featureId] || featureId;
  }

  private getFeatureCategory(featureId: string): FeatureCategory {
    // Map feature IDs to categories
    const categoryMap: Record<string, FeatureCategory> = {
      'strategic-finance': FeatureCategory.FINANCIAL_GROWTH_TOOLS,
      'practice-growth': FeatureCategory.FINANCIAL_GROWTH_TOOLS,
      'advanced-reports': FeatureCategory.FINANCIAL_GROWTH_TOOLS,
      'document-intelligence': FeatureCategory.AI_DOCUMENT_INTELLIGENCE,
      'ai-analytics': FeatureCategory.AI_DOCUMENT_INTELLIGENCE,
      'precedent-bank': FeatureCategory.AI_DOCUMENT_INTELLIGENCE,
      'academy': FeatureCategory.PROFESSIONAL_DEVELOPMENT,
      'workflow-integrations': FeatureCategory.PROFESSIONAL_DEVELOPMENT
    };
    
    return categoryMap[featureId] || FeatureCategory.FINANCIAL_GROWTH_TOOLS;
  }

  private calculateCategoryUsage(events: FeatureUsageEvent[], totalUsers: number): Record<FeatureCategory, {
    total_accesses: number;
    unique_users: number;
    adoption_rate: number;
  }> {
    const categories = Object.values(FeatureCategory);
    const result = {} as Record<FeatureCategory, {
      total_accesses: number;
      unique_users: number;
      adoption_rate: number;
    }>;

    categories.forEach(category => {
      const categoryEvents = events.filter(e => this.getFeatureCategory(e.feature_id) === category);
      const accessEvents = categoryEvents.filter(e => e.event_type === 'accessed');
      const uniqueUsers = new Set(categoryEvents.map(e => e.user_id)).size;

      result[category] = {
        total_accesses: accessEvents.length,
        unique_users: uniqueUsers,
        adoption_rate: totalUsers > 0 ? uniqueUsers / totalUsers : 0
      };
    });

    return result;
  }

  private calculateDailyUsage(events: FeatureUsageEvent[]): Array<{
    date: string;
    total_accesses: number;
    unique_users: number;
  }> {
    const dailyGroups: Record<string, FeatureUsageEvent[]> = {};
    
    events.forEach(event => {
      const date = event.timestamp.toISOString().split('T')[0];
      if (!dailyGroups[date]) {
        dailyGroups[date] = [];
      }
      dailyGroups[date].push(event);
    });

    return Object.entries(dailyGroups)
      .map(([date, dayEvents]) => ({
        date,
        total_accesses: dayEvents.filter(e => e.event_type === 'accessed').length,
        unique_users: new Set(dayEvents.map(e => e.user_id)).size
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private calculateLocalAdoptionRates(): Record<FeatureCategory, number> {
    const categories = Object.values(FeatureCategory);
    const result = {} as Record<FeatureCategory, number>;
    
    const totalUsers = new Set(this.events.map(e => e.user_id)).size;
    
    categories.forEach(category => {
      const categoryEvents = this.events.filter(e => 
        this.getFeatureCategory(e.feature_id) === category && e.event_type === 'enabled'
      );
      const uniqueUsers = new Set(categoryEvents.map(e => e.user_id)).size;
      
      result[category] = totalUsers > 0 ? uniqueUsers / totalUsers : 0;
    });

    return result;
  }

  private convertToCSV(metrics: UsageMetrics): string {
    const headers = ['Feature ID', 'Feature Name', 'Category', 'Total Accesses', 'Unique Users', 'Adoption Rate', 'Last Accessed'];
    const rows = metrics.most_popular_features.map(feature => [
      feature.feature_id,
      feature.feature_name,
      feature.category,
      feature.total_accesses.toString(),
      feature.unique_users.toString(),
      (feature.adoption_rate * 100).toFixed(2) + '%',
      feature.last_accessed.toISOString()
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

// Export singleton instance
export const featureAnalyticsService = new FeatureAnalyticsService();
export default featureAnalyticsService;