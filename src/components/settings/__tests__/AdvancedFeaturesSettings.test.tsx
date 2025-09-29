/**
 * Advanced Features Settings Component Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdvancedFeaturesSettings } from '../AdvancedFeaturesSettings';
import { userPreferencesService } from '../../../services/api/user-preferences.service';
import { featureToggleService } from '../../../services/feature-toggle.service';

// Mock services
vi.mock('../../../services/api/user-preferences.service');
vi.mock('../../../services/feature-toggle.service');
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

const mockUserPreferences = {
  id: '1',
  user_id: 'user-1',
  advanced_features: {
    financial_growth_tools: false,
    ai_document_intelligence: false,
    professional_development: false
  },
  feature_discovery: {
    notification_shown: false,
    notification_dismissed_at: null,
    first_login_date: new Date()
  },
  created_at: new Date(),
  updated_at: new Date()
};

describe('AdvancedFeaturesSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock service responses
    vi.mocked(userPreferencesService.getCurrentUserPreferences).mockResolvedValue({
      data: mockUserPreferences,
      error: null
    });
    
    vi.mocked(featureToggleService.initialize).mockResolvedValue();
    vi.mocked(featureToggleService.isCategoryEnabled).mockReturnValue(false);
    vi.mocked(featureToggleService.isFeatureEnabled).mockReturnValue(false);
    vi.mocked(featureToggleService.getFeatureToggleState).mockReturnValue({
      financial_growth_tools: false,
      ai_document_intelligence: false,
      professional_development: false
    });
  });

  describe('rendering', () => {
    it('should render loading state initially', () => {
      render(<AdvancedFeaturesSettings />);
      
      expect(screen.getByText('Loading advanced features...')).toBeInTheDocument();
    });

    it('should render feature categories after loading', async () => {
      render(<AdvancedFeaturesSettings />);
      
      await waitFor(() => {
        expect(screen.getByText('Financial & Growth Tools')).toBeInTheDocument();
        expect(screen.getByText('AI & Document Intelligence')).toBeInTheDocument();
        expect(screen.getByText('Professional Development & Workflow')).toBeInTheDocument();
      });
    });

    it('should show individual features within categories', async () => {
      render(<AdvancedFeaturesSettings />);
      
      await waitFor(() => {
        expect(screen.getByText('Strategic Finance')).toBeInTheDocument();
        expect(screen.getByText('Practice Growth')).toBeInTheDocument();
        expect(screen.getByText('AI Analytics Dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('category toggling', () => {
    it('should enable category when toggle is clicked', async () => {
      vi.mocked(featureToggleService.enableCategory).mockResolvedValue();
      
      render(<AdvancedFeaturesSettings />);
      
      await waitFor(() => {
        const categoryToggle = screen.getAllByRole('button')[0]; // First toggle button
        fireEvent.click(categoryToggle);
      });
      
      expect(featureToggleService.enableCategory).toHaveBeenCalled();
    });

    it('should show loading state during category toggle', async () => {
      let resolveToggle: () => void;
      const togglePromise = new Promise<void>(resolve => {
        resolveToggle = resolve;
      });
      
      vi.mocked(featureToggleService.enableCategory).mockReturnValue(togglePromise);
      
      render(<AdvancedFeaturesSettings />);
      
      await waitFor(() => {
        const categoryToggle = screen.getAllByRole('button')[0];
        fireEvent.click(categoryToggle);
      });
      
      // Should show loading spinner
      expect(screen.getByTestId('loader')).toBeInTheDocument();
      
      resolveToggle!();
    });
  });

  describe('individual feature toggling', () => {
    it('should toggle individual features', async () => {
      vi.mocked(featureToggleService.toggleFeature).mockResolvedValue();
      
      render(<AdvancedFeaturesSettings />);
      
      await waitFor(() => {
        const featureToggles = screen.getAllByRole('button');
        const individualToggle = featureToggles.find(button => 
          button.getAttribute('aria-label')?.includes('toggle')
        );
        
        if (individualToggle) {
          fireEvent.click(individualToggle);
        }
      });
      
      expect(featureToggleService.toggleFeature).toHaveBeenCalled();
    });
  });

  describe('saving changes', () => {
    it('should save changes when save button is clicked', async () => {
      vi.mocked(userPreferencesService.updateCurrentUserPreferences).mockResolvedValue({
        data: mockUserPreferences,
        error: null
      });
      
      render(<AdvancedFeaturesSettings />);
      
      await waitFor(() => {
        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);
      });
      
      expect(userPreferencesService.updateCurrentUserPreferences).toHaveBeenCalled();
    });

    it('should show success toast on successful save', async () => {
      const { toast } = await import('react-hot-toast');
      
      vi.mocked(userPreferencesService.updateCurrentUserPreferences).mockResolvedValue({
        data: mockUserPreferences,
        error: null
      });
      
      render(<AdvancedFeaturesSettings />);
      
      await waitFor(() => {
        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);
      });
      
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Advanced feature settings saved successfully!');
      });
    });

    it('should show error toast on save failure', async () => {
      const { toast } = await import('react-hot-toast');
      
      vi.mocked(userPreferencesService.updateCurrentUserPreferences).mockResolvedValue({
        data: null,
        error: { message: 'Save failed', type: 'DATABASE_ERROR' } as any
      });
      
      render(<AdvancedFeaturesSettings />);
      
      await waitFor(() => {
        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);
      });
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to save settings. Please try again.');
      });
    });
  });

  describe('reset functionality', () => {
    it('should reset to defaults when confirmed', async () => {
      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      
      vi.mocked(userPreferencesService.resetToDefaults).mockResolvedValue({
        data: mockUserPreferences,
        error: null
      });
      
      render(<AdvancedFeaturesSettings />);
      
      await waitFor(() => {
        const resetButton = screen.getByText('Reset to Defaults');
        fireEvent.click(resetButton);
      });
      
      expect(confirmSpy).toHaveBeenCalled();
      expect(featureToggleService.resetAllFeatures).toHaveBeenCalled();
      expect(userPreferencesService.resetToDefaults).toHaveBeenCalled();
      
      confirmSpy.mockRestore();
    });

    it('should not reset when cancelled', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      
      render(<AdvancedFeaturesSettings />);
      
      await waitFor(() => {
        const resetButton = screen.getByText('Reset to Defaults');
        fireEvent.click(resetButton);
      });
      
      expect(confirmSpy).toHaveBeenCalled();
      expect(featureToggleService.resetAllFeatures).not.toHaveBeenCalled();
      
      confirmSpy.mockRestore();
    });
  });

  describe('unsaved changes indicator', () => {
    it('should show unsaved changes indicator when changes are made', async () => {
      render(<AdvancedFeaturesSettings />);
      
      await waitFor(() => {
        const categoryToggle = screen.getAllByRole('button')[0];
        fireEvent.click(categoryToggle);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
      });
    });

    it('should disable save button when no changes', async () => {
      render(<AdvancedFeaturesSettings />);
      
      await waitFor(() => {
        const saveButton = screen.getByText('Save Changes');
        expect(saveButton).toBeDisabled();
      });
    });
  });

  describe('callback handling', () => {
    it('should call onFeatureToggle callback when provided', async () => {
      const onFeatureToggle = vi.fn();
      
      render(<AdvancedFeaturesSettings onFeatureToggle={onFeatureToggle} />);
      
      await waitFor(() => {
        const categoryToggle = screen.getAllByRole('button')[0];
        fireEvent.click(categoryToggle);
      });
      
      // Should eventually call the callback for each feature in the category
      await waitFor(() => {
        expect(onFeatureToggle).toHaveBeenCalled();
      });
    });
  });
});