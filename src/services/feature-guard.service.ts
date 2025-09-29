/**
 * Feature Guard Service
 * Controls access to advanced pages based on user preferences
 */

import { 
  FeatureAccessResult, 
  FeatureAccessError,
  AdvancedFeature 
} from '../types/advanced-features';
import { getAllAdvancedPages, getFeatureByPage } from '../config/advanced-features';
import { featureToggleService } from './feature-toggle.service';
import { toast } from 'react-hot-toast';
import React from 'react';

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  visible: boolean;
  disabled?: boolean;
  tooltip?: string;
}

class FeatureGuardService {
  private redirectCallbacks: ((page: string) => void)[] = [];

  /**
   * Check if user can access a specific page
   */
  canAccessPage(page: string): FeatureAccessResult {
    // Check if this is an advanced feature page
    const feature = getFeatureByPage(page);
    
    if (!feature) {
      // Not an advanced feature page, always accessible
      return {
        allowed: true
      };
    }

    // Check if the feature is enabled
    const isEnabled = featureToggleService.isFeatureEnabled(feature.id);
    
    if (isEnabled) {
      return {
        allowed: true
      };
    }

    // Feature is disabled
    return {
      allowed: false,
      error: FeatureAccessError.FEATURE_DISABLED,
      message: `${feature.name} is not enabled. You can enable it in Settings > Advanced Features.`,
      redirectTo: 'dashboard'
    };
  }

  /**
   * Get navigation items filtered by accessible features
   */
  getAccessibleNavItems(allNavItems: NavigationItem[]): NavigationItem[] {
    return allNavItems.map(item => {
      const accessResult = this.canAccessPage(item.id);
      
      if (!accessResult.allowed) {
        return {
          ...item,
          visible: false,
          disabled: true,
          tooltip: accessResult.message
        };
      }

      return {
        ...item,
        visible: true,
        disabled: false
      };
    }).filter(item => item.visible);
  }

  /**
   * Handle access attempt to disabled feature
   */
  handleDisabledFeatureAccess(page: string): void {
    const accessResult = this.canAccessPage(page);
    
    if (!accessResult.allowed) {
      // Show user-friendly notification
      if (accessResult.message) {
        toast.error(accessResult.message, {
          duration: 5000,
          id: `feature-disabled-${page}` // Prevent duplicate toasts
        });
      }

      // Redirect to safe page
      const redirectTo = accessResult.redirectTo || 'dashboard';
      this.notifyRedirect(redirectTo);
    }
  }

  /**
   * Validate page access and redirect if necessary
   */
  validatePageAccess(page: string): boolean {
    const accessResult = this.canAccessPage(page);
    
    if (!accessResult.allowed) {
      this.handleDisabledFeatureAccess(page);
      return false;
    }

    // Track feature access for analytics
    this.trackFeatureAccess(page);
    return true;
  }

  /**
   * Get list of all advanced pages that are currently disabled
   */
  getDisabledAdvancedPages(): string[] {
    const allAdvancedPages = getAllAdvancedPages();
    
    return allAdvancedPages.filter(page => {
      const accessResult = this.canAccessPage(page);
      return !accessResult.allowed;
    });
  }

  /**
   * Get list of all advanced pages that are currently enabled
   */
  getEnabledAdvancedPages(): string[] {
    const allAdvancedPages = getAllAdvancedPages();
    
    return allAdvancedPages.filter(page => {
      const accessResult = this.canAccessPage(page);
      return accessResult.allowed;
    });
  }

  /**
   * Check if any advanced features are enabled
   */
  hasAnyAdvancedFeaturesEnabled(): boolean {
    const enabledPages = this.getEnabledAdvancedPages();
    return enabledPages.length > 0;
  }

  /**
   * Get feature information for a page
   */
  getPageFeatureInfo(page: string): AdvancedFeature | null {
    return getFeatureByPage(page) || null;
  }

  /**
   * Subscribe to redirect events
   */
  onRedirect(callback: (page: string) => void): () => void {
    this.redirectCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.redirectCallbacks.indexOf(callback);
      if (index > -1) {
        this.redirectCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Create a route guard component wrapper
   */
  createRouteGuard<T extends Record<string, any>>(
    page: string,
    Component: React.ComponentType<T>
  ): React.ComponentType<T> {
    return (props: T) => {
      const accessResult = this.canAccessPage(page);
      
      if (!accessResult.allowed) {
        // Handle access denial
        this.handleDisabledFeatureAccess(page);
        
        // Return null or a placeholder component
        return null;
      }

      // Track access
      this.trackFeatureAccess(page);
      
      // Render the component
      return React.createElement(Component, props);
    };
  }

  /**
   * Get user-friendly error message for feature access
   */
  getAccessErrorMessage(page: string): string | null {
    const accessResult = this.canAccessPage(page);
    
    if (accessResult.allowed) {
      return null;
    }

    const feature = getFeatureByPage(page);
    
    switch (accessResult.error) {
      case FeatureAccessError.FEATURE_DISABLED:
        return `${feature?.name || 'This feature'} is not enabled. Enable it in Settings > Advanced Features to access this page.`;
      case FeatureAccessError.FEATURE_NOT_FOUND:
        return 'This feature is not available.';
      case FeatureAccessError.PERMISSION_DENIED:
        return 'You don\'t have permission to access this feature.';
      default:
        return 'Access to this page is restricted.';
    }
  }

  /**
   * Check if page requires advanced feature
   */
  isAdvancedFeaturePage(page: string): boolean {
    return getAllAdvancedPages().includes(page);
  }

  /**
   * Get navigation items with feature status
   */
  getNavItemsWithFeatureStatus(allNavItems: NavigationItem[]): (NavigationItem & {
    isAdvancedFeature: boolean;
    featureEnabled?: boolean;
    featureName?: string;
  })[] {
    return allNavItems.map(item => {
      const isAdvanced = this.isAdvancedFeaturePage(item.id);
      const feature = getFeatureByPage(item.id);
      
      return {
        ...item,
        isAdvancedFeature: isAdvanced,
        featureEnabled: isAdvanced ? featureToggleService.isFeatureEnabled(feature?.id || '') : undefined,
        featureName: feature?.name
      };
    });
  }

  /**
   * Bulk validate multiple pages
   */
  validateMultiplePages(pages: string[]): Record<string, FeatureAccessResult> {
    const results: Record<string, FeatureAccessResult> = {};
    
    pages.forEach(page => {
      results[page] = this.canAccessPage(page);
    });
    
    return results;
  }

  // Private methods

  private notifyRedirect(page: string): void {
    this.redirectCallbacks.forEach(callback => {
      try {
        callback(page);
      } catch (error) {
        console.error('Error in redirect callback:', error);
      }
    });
  }

  private trackFeatureAccess(page: string): void {
    const feature = getFeatureByPage(page);
    
    if (feature) {
      // Track through analytics service
      import('./analytics/feature-analytics.service').then(({ featureAnalyticsService }) => {
        featureAnalyticsService.trackFeatureAccessed(feature.id, page);
      }).catch(error => {
        console.error('Error tracking feature access:', error);
      });

      // Also track through feature toggle service for backward compatibility
      featureToggleService.trackFeatureUsage({
        feature_id: feature.id,
        event_type: 'accessed',
        user_id: '', // Will be filled by the service
        timestamp: new Date(),
        metadata: { page }
      });
    }
  }
}

// Export singleton instance
export const featureGuardService = new FeatureGuardService();
export default featureGuardService;