/**
 * Feature Toggle Service
 * Manages advanced feature toggle state and persistence
 */

import { 
  AdvancedFeature, 
  FeatureCategory, 
  FeatureToggleState, 
  UserPreferences,
  FeatureUsageEvent
} from '../types/advanced-features';
import { ADVANCED_FEATURES, getFeaturesByCategory, getFeatureById } from '../config/advanced-features';

type FeatureChangeCallback = (feature: AdvancedFeature, enabled: boolean) => void;

class FeatureToggleService {
  private enabledFeatures: Set<string> = new Set();
  private changeCallbacks: FeatureChangeCallback[] = [];
  private userPreferences: UserPreferences | null = null;
  private initialized = false;

  /**
   * Initialize the service with user preferences
   */
  async initialize(userPreferences: UserPreferences | null): Promise<void> {
    this.userPreferences = userPreferences;
    this.enabledFeatures.clear();

    if (userPreferences) {
      // Enable features based on user preferences
      if (userPreferences.advanced_features.financial_growth_tools) {
        this.enableFeaturesInCategory(FeatureCategory.FINANCIAL_GROWTH_TOOLS);
      }
      if (userPreferences.advanced_features.ai_document_intelligence) {
        this.enableFeaturesInCategory(FeatureCategory.AI_DOCUMENT_INTELLIGENCE);
      }
      if (userPreferences.advanced_features.professional_development) {
        this.enableFeaturesInCategory(FeatureCategory.PROFESSIONAL_DEVELOPMENT);
      }
    }

    this.initialized = true;
  }

  /**
   * Get all enabled features
   */
  getEnabledFeatures(): AdvancedFeature[] {
    return ADVANCED_FEATURES.filter(feature => this.enabledFeatures.has(feature.id))
      .map(feature => ({ ...feature, enabled: true }));
  }

  /**
   * Get all features with their current enabled state
   */
  getAllFeatures(): AdvancedFeature[] {
    return ADVANCED_FEATURES.map(feature => ({
      ...feature,
      enabled: this.enabledFeatures.has(feature.id)
    }));
  }

  /**
   * Check if a specific feature is enabled
   */
  isFeatureEnabled(featureId: string): boolean {
    return this.enabledFeatures.has(featureId);
  }

  /**
   * Check if a page is accessible (not an advanced feature or feature is enabled)
   */
  isPageAccessible(page: string): boolean {
    const feature = ADVANCED_FEATURES.find(f => f.pages.includes(page));
    if (!feature) {
      // Not an advanced feature page, always accessible
      return true;
    }
    return this.isFeatureEnabled(feature.id);
  }

  /**
   * Toggle a specific feature on/off
   */
  async toggleFeature(featureId: string, enabled: boolean): Promise<void> {
    const feature = getFeatureById(featureId);
    if (!feature) {
      throw new Error(`Feature not found: ${featureId}`);
    }

    if (enabled) {
      this.enabledFeatures.add(featureId);
    } else {
      this.enabledFeatures.delete(featureId);
    }

    // Notify callbacks
    this.notifyFeatureChange(feature, enabled);

    // Track usage event
    this.trackFeatureUsage({
      feature_id: featureId,
      event_type: enabled ? 'enabled' : 'disabled',
      user_id: this.userPreferences?.user_id || '',
      timestamp: new Date()
    });
  }

  /**
   * Enable all features in a category
   */
  async enableCategory(category: FeatureCategory, enabled: boolean): Promise<void> {
    const features = getFeaturesByCategory(category);
    
    for (const feature of features) {
      await this.toggleFeature(feature.id, enabled);
    }
  }

  /**
   * Get features grouped by category with enabled state
   */
  getFeaturesByCategory(category: FeatureCategory): AdvancedFeature[] {
    return getFeaturesByCategory(category).map(feature => ({
      ...feature,
      enabled: this.enabledFeatures.has(feature.id)
    }));
  }

  /**
   * Get current feature toggle state for persistence
   */
  getFeatureToggleState(): FeatureToggleState {
    const state: FeatureToggleState = {};
    
    // Check each category
    state[FeatureCategory.FINANCIAL_GROWTH_TOOLS] = this.isCategoryEnabled(FeatureCategory.FINANCIAL_GROWTH_TOOLS);
    state[FeatureCategory.AI_DOCUMENT_INTELLIGENCE] = this.isCategoryEnabled(FeatureCategory.AI_DOCUMENT_INTELLIGENCE);
    state[FeatureCategory.PROFESSIONAL_DEVELOPMENT] = this.isCategoryEnabled(FeatureCategory.PROFESSIONAL_DEVELOPMENT);
    
    return state;
  }

  /**
   * Check if all features in a category are enabled
   */
  isCategoryEnabled(category: FeatureCategory): boolean {
    const features = getFeaturesByCategory(category);
    return features.length > 0 && features.every(feature => this.enabledFeatures.has(feature.id));
  }

  /**
   * Check if any features in a category are enabled
   */
  isCategoryPartiallyEnabled(category: FeatureCategory): boolean {
    const features = getFeaturesByCategory(category);
    return features.some(feature => this.enabledFeatures.has(feature.id));
  }

  /**
   * Subscribe to feature change events
   */
  onFeatureChange(callback: FeatureChangeCallback): () => void {
    this.changeCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.changeCallbacks.indexOf(callback);
      if (index > -1) {
        this.changeCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Track feature usage for analytics
   */
  trackFeatureUsage(event: FeatureUsageEvent): void {
    // Send to analytics service
    import('../services/analytics/feature-analytics.service').then(({ featureAnalyticsService }) => {
      featureAnalyticsService.trackEvent({
        feature_id: event.feature_id,
        event_type: event.event_type,
        metadata: event.metadata
      });
    }).catch(error => {
      console.error('Error tracking feature usage:', error);
    });
    
    // Also store locally as backup
    const events = this.getStoredUsageEvents();
    events.push(event);
    
    // Keep only last 100 events
    if (events.length > 100) {
      events.splice(0, events.length - 100);
    }
    
    localStorage.setItem('feature_usage_events', JSON.stringify(events));
  }

  /**
   * Get stored usage events (for analytics)
   */
  getStoredUsageEvents(): FeatureUsageEvent[] {
    try {
      const stored = localStorage.getItem('feature_usage_events');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Reset all features to disabled state
   */
  resetAllFeatures(): void {
    this.enabledFeatures.clear();
    
    // Notify all features as disabled
    ADVANCED_FEATURES.forEach(feature => {
      this.notifyFeatureChange(feature, false);
    });
  }

  // Private methods

  private enableFeaturesInCategory(category: FeatureCategory): void {
    const features = getFeaturesByCategory(category);
    features.forEach(feature => {
      this.enabledFeatures.add(feature.id);
    });
  }

  private notifyFeatureChange(feature: AdvancedFeature, enabled: boolean): void {
    this.changeCallbacks.forEach(callback => {
      try {
        callback(feature, enabled);
      } catch (error) {
        console.error('Error in feature change callback:', error);
      }
    });
  }
}

// Export singleton instance
export const featureToggleService = new FeatureToggleService();
export default featureToggleService;