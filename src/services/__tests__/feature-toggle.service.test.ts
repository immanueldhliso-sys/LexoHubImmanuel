/**
 * Feature Toggle Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { featureToggleService } from '../feature-toggle.service';
import { FeatureCategory, UserPreferences } from '../../types/advanced-features';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('FeatureToggleService', () => {
  beforeEach(() => {
    // Reset service state
    featureToggleService.resetAllFeatures();
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with no features enabled by default', () => {
      const enabledFeatures = featureToggleService.getEnabledFeatures();
      expect(enabledFeatures).toHaveLength(0);
    });

    it('should initialize with user preferences', async () => {
      const mockPreferences: UserPreferences = {
        id: '1',
        user_id: 'user-1',
        advanced_features: {
          financial_growth_tools: true,
          ai_document_intelligence: false,
          professional_development: true
        },
        feature_discovery: {
          notification_shown: false,
          notification_dismissed_at: null,
          first_login_date: new Date()
        },
        created_at: new Date(),
        updated_at: new Date()
      };

      await featureToggleService.initialize(mockPreferences);

      expect(featureToggleService.isCategoryEnabled(FeatureCategory.FINANCIAL_GROWTH_TOOLS)).toBe(true);
      expect(featureToggleService.isCategoryEnabled(FeatureCategory.AI_DOCUMENT_INTELLIGENCE)).toBe(false);
      expect(featureToggleService.isCategoryEnabled(FeatureCategory.PROFESSIONAL_DEVELOPMENT)).toBe(true);
    });
  });

  describe('feature toggling', () => {
    it('should toggle individual features', async () => {
      await featureToggleService.toggleFeature('strategic-finance', true);
      expect(featureToggleService.isFeatureEnabled('strategic-finance')).toBe(true);

      await featureToggleService.toggleFeature('strategic-finance', false);
      expect(featureToggleService.isFeatureEnabled('strategic-finance')).toBe(false);
    });

    it('should throw error for invalid feature ID', async () => {
      await expect(featureToggleService.toggleFeature('invalid-feature', true))
        .rejects.toThrow('Feature not found: invalid-feature');
    });

    it('should enable all features in a category', async () => {
      await featureToggleService.enableCategory(FeatureCategory.FINANCIAL_GROWTH_TOOLS, true);
      
      expect(featureToggleService.isFeatureEnabled('strategic-finance')).toBe(true);
      expect(featureToggleService.isFeatureEnabled('practice-growth')).toBe(true);
      expect(featureToggleService.isFeatureEnabled('advanced-reports')).toBe(true);
    });

    it('should disable all features in a category', async () => {
      // First enable the category
      await featureToggleService.enableCategory(FeatureCategory.FINANCIAL_GROWTH_TOOLS, true);
      
      // Then disable it
      await featureToggleService.enableCategory(FeatureCategory.FINANCIAL_GROWTH_TOOLS, false);
      
      expect(featureToggleService.isFeatureEnabled('strategic-finance')).toBe(false);
      expect(featureToggleService.isFeatureEnabled('practice-growth')).toBe(false);
      expect(featureToggleService.isFeatureEnabled('advanced-reports')).toBe(false);
    });
  });

  describe('page access', () => {
    it('should allow access to non-advanced pages', () => {
      expect(featureToggleService.isPageAccessible('dashboard')).toBe(true);
      expect(featureToggleService.isPageAccessible('matters')).toBe(true);
      expect(featureToggleService.isPageAccessible('invoices')).toBe(true);
    });

    it('should deny access to disabled advanced pages', () => {
      expect(featureToggleService.isPageAccessible('strategic-finance')).toBe(false);
      expect(featureToggleService.isPageAccessible('ai-analytics')).toBe(false);
    });

    it('should allow access to enabled advanced pages', async () => {
      await featureToggleService.toggleFeature('strategic-finance', true);
      expect(featureToggleService.isPageAccessible('strategic-finance')).toBe(true);
    });
  });

  describe('feature state management', () => {
    it('should return correct feature toggle state', async () => {
      await featureToggleService.enableCategory(FeatureCategory.FINANCIAL_GROWTH_TOOLS, true);
      await featureToggleService.enableCategory(FeatureCategory.AI_DOCUMENT_INTELLIGENCE, false);
      
      const state = featureToggleService.getFeatureToggleState();
      
      expect(state[FeatureCategory.FINANCIAL_GROWTH_TOOLS]).toBe(true);
      expect(state[FeatureCategory.AI_DOCUMENT_INTELLIGENCE]).toBe(false);
      expect(state[FeatureCategory.PROFESSIONAL_DEVELOPMENT]).toBe(false);
    });

    it('should detect partially enabled categories', async () => {
      await featureToggleService.toggleFeature('strategic-finance', true);
      // Leave other features in the category disabled
      
      expect(featureToggleService.isCategoryEnabled(FeatureCategory.FINANCIAL_GROWTH_TOOLS)).toBe(false);
      expect(featureToggleService.isCategoryPartiallyEnabled(FeatureCategory.FINANCIAL_GROWTH_TOOLS)).toBe(true);
    });
  });

  describe('event callbacks', () => {
    it('should notify callbacks on feature changes', async () => {
      const callback = vi.fn();
      const unsubscribe = featureToggleService.onFeatureChange(callback);
      
      await featureToggleService.toggleFeature('strategic-finance', true);
      
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'strategic-finance' }),
        true
      );
      
      unsubscribe();
    });

    it('should allow unsubscribing from callbacks', async () => {
      const callback = vi.fn();
      const unsubscribe = featureToggleService.onFeatureChange(callback);
      
      unsubscribe();
      
      await featureToggleService.toggleFeature('strategic-finance', true);
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('analytics tracking', () => {
    it('should track feature usage events', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await featureToggleService.toggleFeature('strategic-finance', true);
      
      // Should have tracked the enablement event
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'feature_usage_events',
        expect.stringContaining('strategic-finance')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('reset functionality', () => {
    it('should reset all features to disabled', async () => {
      // Enable some features first
      await featureToggleService.enableCategory(FeatureCategory.FINANCIAL_GROWTH_TOOLS, true);
      await featureToggleService.enableCategory(FeatureCategory.AI_DOCUMENT_INTELLIGENCE, true);
      
      // Reset
      featureToggleService.resetAllFeatures();
      
      // Check all features are disabled
      const enabledFeatures = featureToggleService.getEnabledFeatures();
      expect(enabledFeatures).toHaveLength(0);
    });
  });
});