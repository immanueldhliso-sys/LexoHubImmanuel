/**
 * Feature Guard Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { featureGuardService } from '../feature-guard.service';
import { featureToggleService } from '../feature-toggle.service';
import { FeatureAccessError } from '../../types/advanced-features';

// Mock toast
vi.mock('react-hot-toast', () => ({
  toast: {
    error: vi.fn()
  }
}));

describe('FeatureGuardService', () => {
  beforeEach(() => {
    // Reset feature toggle service
    featureToggleService.resetAllFeatures();
    vi.clearAllMocks();
  });

  describe('page access validation', () => {
    it('should allow access to non-advanced pages', () => {
      const result = featureGuardService.canAccessPage('dashboard');
      expect(result.allowed).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should deny access to disabled advanced pages', () => {
      const result = featureGuardService.canAccessPage('strategic-finance');
      expect(result.allowed).toBe(false);
      expect(result.error).toBe(FeatureAccessError.FEATURE_DISABLED);
      expect(result.message).toContain('Strategic Finance is not enabled');
      expect(result.redirectTo).toBe('dashboard');
    });

    it('should allow access to enabled advanced pages', async () => {
      await featureToggleService.toggleFeature('strategic-finance', true);
      
      const result = featureGuardService.canAccessPage('strategic-finance');
      expect(result.allowed).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('navigation filtering', () => {
    const mockNavItems = [
      { id: 'dashboard', label: 'Dashboard', icon: 'BarChart3', visible: true },
      { id: 'strategic-finance', label: 'Finance', icon: 'Scale', visible: true },
      { id: 'ai-analytics', label: 'AI Analytics', icon: 'Brain', visible: true },
      { id: 'settings', label: 'Settings', icon: 'Settings', visible: true }
    ];

    it('should filter out disabled advanced features', () => {
      const accessibleItems = featureGuardService.getAccessibleNavItems(mockNavItems);
      
      const itemIds = accessibleItems.map(item => item.id);
      expect(itemIds).toContain('dashboard');
      expect(itemIds).toContain('settings');
      expect(itemIds).not.toContain('strategic-finance');
      expect(itemIds).not.toContain('ai-analytics');
    });

    it('should include enabled advanced features', async () => {
      await featureToggleService.toggleFeature('strategic-finance', true);
      
      const accessibleItems = featureGuardService.getAccessibleNavItems(mockNavItems);
      
      const itemIds = accessibleItems.map(item => item.id);
      expect(itemIds).toContain('dashboard');
      expect(itemIds).toContain('strategic-finance');
      expect(itemIds).not.toContain('ai-analytics');
    });
  });

  describe('disabled feature access handling', () => {
    it('should show error toast for disabled feature access', async () => {
      const { toast } = await import('react-hot-toast');
      
      featureGuardService.handleDisabledFeatureAccess('strategic-finance');
      
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Strategic Finance is not enabled'),
        expect.objectContaining({ duration: 5000 })
      );
    });

    it('should trigger redirect callback', () => {
      const redirectCallback = vi.fn();
      const unsubscribe = featureGuardService.onRedirect(redirectCallback);
      
      featureGuardService.handleDisabledFeatureAccess('strategic-finance');
      
      expect(redirectCallback).toHaveBeenCalledWith('dashboard');
      
      unsubscribe();
    });
  });

  describe('page validation', () => {
    it('should return true for accessible pages', async () => {
      await featureToggleService.toggleFeature('strategic-finance', true);
      
      const isValid = featureGuardService.validatePageAccess('strategic-finance');
      expect(isValid).toBe(true);
    });

    it('should return false and handle redirect for inaccessible pages', () => {
      const isValid = featureGuardService.validatePageAccess('strategic-finance');
      expect(isValid).toBe(false);
    });
  });

  describe('feature information', () => {
    it('should return feature info for advanced pages', () => {
      const featureInfo = featureGuardService.getPageFeatureInfo('strategic-finance');
      
      expect(featureInfo).toBeTruthy();
      expect(featureInfo?.id).toBe('strategic-finance');
      expect(featureInfo?.name).toBe('Strategic Finance');
    });

    it('should return null for non-advanced pages', () => {
      const featureInfo = featureGuardService.getPageFeatureInfo('dashboard');
      expect(featureInfo).toBeNull();
    });
  });

  describe('advanced feature detection', () => {
    it('should correctly identify advanced feature pages', () => {
      expect(featureGuardService.isAdvancedFeaturePage('strategic-finance')).toBe(true);
      expect(featureGuardService.isAdvancedFeaturePage('ai-analytics')).toBe(true);
      expect(featureGuardService.isAdvancedFeaturePage('dashboard')).toBe(false);
    });

    it('should detect when any advanced features are enabled', async () => {
      expect(featureGuardService.hasAnyAdvancedFeaturesEnabled()).toBe(false);
      
      await featureToggleService.toggleFeature('strategic-finance', true);
      
      expect(featureGuardService.hasAnyAdvancedFeaturesEnabled()).toBe(true);
    });
  });

  describe('error messages', () => {
    it('should return appropriate error message for disabled features', () => {
      const message = featureGuardService.getAccessErrorMessage('strategic-finance');
      expect(message).toContain('Strategic Finance is not enabled');
      expect(message).toContain('Settings > Advanced Features');
    });

    it('should return null for accessible pages', async () => {
      await featureToggleService.toggleFeature('strategic-finance', true);
      
      const message = featureGuardService.getAccessErrorMessage('strategic-finance');
      expect(message).toBeNull();
    });
  });

  describe('bulk validation', () => {
    it('should validate multiple pages at once', async () => {
      await featureToggleService.toggleFeature('strategic-finance', true);
      
      const results = featureGuardService.validateMultiplePages([
        'dashboard',
        'strategic-finance',
        'ai-analytics'
      ]);
      
      expect(results['dashboard'].allowed).toBe(true);
      expect(results['strategic-finance'].allowed).toBe(true);
      expect(results['ai-analytics'].allowed).toBe(false);
    });
  });
});