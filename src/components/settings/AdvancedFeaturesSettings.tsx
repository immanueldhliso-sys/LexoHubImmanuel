/**
 * Advanced Features Settings Component
 * Allows users to enable/disable advanced features by category
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Brain, 
  GraduationCap, 
  Info, 
  CheckCircle, 
  Circle,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardContent, Button } from '../../design-system/components';
import { toast } from 'react-hot-toast';
import { 
  FeatureCategory, 
  AdvancedFeature,
  UserPreferences 
} from '../../types/advanced-features';
import { FEATURE_CATEGORIES, getFeaturesByCategory } from '../../config/advanced-features';
import { featureToggleService } from '../../services/feature-toggle.service';
import { userPreferencesService } from '../../services/api/user-preferences.service';

interface AdvancedFeaturesSettingsProps {
  onFeatureToggle?: (feature: AdvancedFeature, enabled: boolean) => void;
  className?: string;
}

interface CategoryState {
  enabled: boolean;
  loading: boolean;
  features: AdvancedFeature[];
}

const CATEGORY_ICONS = {
  [FeatureCategory.FINANCIAL_GROWTH_TOOLS]: TrendingUp,
  [FeatureCategory.AI_DOCUMENT_INTELLIGENCE]: Brain,
  [FeatureCategory.PROFESSIONAL_DEVELOPMENT]: GraduationCap
};

export const AdvancedFeaturesSettings: React.FC<AdvancedFeaturesSettingsProps> = ({
  onFeatureToggle,
  className = ''
}) => {
  const [categories, setCategories] = useState<Record<FeatureCategory, CategoryState>>({
    [FeatureCategory.FINANCIAL_GROWTH_TOOLS]: {
      enabled: false,
      loading: false,
      features: []
    },
    [FeatureCategory.AI_DOCUMENT_INTELLIGENCE]: {
      enabled: false,
      loading: false,
      features: []
    },
    [FeatureCategory.PROFESSIONAL_DEVELOPMENT]: {
      enabled: false,
      loading: false,
      features: []
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);

  // Load initial state
  useEffect(() => {
    loadUserPreferences();
  }, []);

  const loadUserPreferences = async () => {
    setLoading(true);
    try {
      const response = await userPreferencesService.getCurrentUserPreferences();
      
      if (response.error) {
        console.error('Failed to load user preferences:', response.error);
        toast.error('Failed to load preferences');
        return;
      }

      if (response.data) {
        setUserPreferences(response.data);
        
        // Initialize feature toggle service
        await featureToggleService.initialize(response.data);
        
        // Update category states
        const newCategories = { ...categories };
        
        FEATURE_CATEGORIES.forEach(category => {
          const categoryFeatures = getFeaturesByCategory(category.id);
          const isEnabled = featureToggleService.isCategoryEnabled(category.id);
          
          newCategories[category.id] = {
            enabled: isEnabled,
            loading: false,
            features: categoryFeatures.map(feature => ({
              ...feature,
              enabled: featureToggleService.isFeatureEnabled(feature.id)
            }))
          };
        });
        
        setCategories(newCategories);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast.error('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = async (category: FeatureCategory, enabled: boolean) => {
    // Update UI immediately (optimistic update)
    setCategories(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        enabled,
        loading: true
      }
    }));

    setHasUnsavedChanges(true);

    try {
      // Update feature toggle service
      await featureToggleService.enableCategory(category, enabled);
      
      // Update category state with individual feature states
      const categoryFeatures = getFeaturesByCategory(category);
      const updatedFeatures = categoryFeatures.map(feature => ({
        ...feature,
        enabled: featureToggleService.isFeatureEnabled(feature.id)
      }));

      setCategories(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          enabled: featureToggleService.isCategoryEnabled(category),
          loading: false,
          features: updatedFeatures
        }
      }));

      // Notify parent component
      if (onFeatureToggle) {
        categoryFeatures.forEach(feature => {
          onFeatureToggle(feature, enabled);
        });
      }

      const categoryInfo = FEATURE_CATEGORIES.find(cat => cat.id === category);
      toast.success(`${categoryInfo?.name} ${enabled ? 'enabled' : 'disabled'}`);

    } catch (error) {
      console.error('Error toggling category:', error);
      toast.error('Failed to update feature settings');
      
      // Revert optimistic update
      setCategories(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          enabled: !enabled,
          loading: false
        }
      }));
    }
  };

  const handleIndividualFeatureToggle = async (featureId: string, enabled: boolean) => {
    try {
      await featureToggleService.toggleFeature(featureId, enabled);
      
      // Update categories state
      const newCategories = { ...categories };
      
      FEATURE_CATEGORIES.forEach(category => {
        const categoryFeatures = getFeaturesByCategory(category.id);
        const updatedFeatures = categoryFeatures.map(feature => ({
          ...feature,
          enabled: featureToggleService.isFeatureEnabled(feature.id)
        }));

        newCategories[category.id] = {
          ...newCategories[category.id],
          enabled: featureToggleService.isCategoryEnabled(category.id),
          features: updatedFeatures
        };
      });
      
      setCategories(newCategories);
      setHasUnsavedChanges(true);

      const feature = newCategories[Object.keys(newCategories)[0] as FeatureCategory].features
        .find(f => f.id === featureId);
      
      if (feature && onFeatureToggle) {
        onFeatureToggle(feature, enabled);
      }

    } catch (error) {
      console.error('Error toggling feature:', error);
      toast.error('Failed to update feature');
    }
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const featureState = featureToggleService.getFeatureToggleState();
      
      const response = await userPreferencesService.updateCurrentUserPreferences({
        advanced_features: {
          financial_growth_tools: featureState[FeatureCategory.FINANCIAL_GROWTH_TOOLS],
          ai_document_intelligence: featureState[FeatureCategory.AI_DOCUMENT_INTELLIGENCE],
          professional_development: featureState[FeatureCategory.PROFESSIONAL_DEVELOPMENT]
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setUserPreferences(response.data);
      setHasUnsavedChanges(false);
      toast.success('Advanced feature settings saved successfully!');

    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    if (!window.confirm('Are you sure you want to disable all advanced features? This action cannot be undone.')) {
      return;
    }

    setSaving(true);
    try {
      // Reset feature toggle service
      featureToggleService.resetAllFeatures();
      
      // Update backend
      const response = await userPreferencesService.resetToDefaults();
      
      if (response.error) {
        throw new Error(response.error.message);
      }

      // Update UI
      const newCategories = { ...categories };
      FEATURE_CATEGORIES.forEach(category => {
        newCategories[category.id] = {
          ...newCategories[category.id],
          enabled: false,
          features: newCategories[category.id].features.map(feature => ({
            ...feature,
            enabled: false
          }))
        };
      });
      
      setCategories(newCategories);
      setUserPreferences(response.data);
      setHasUnsavedChanges(false);
      toast.success('Advanced features reset to defaults');

    } catch (error) {
      console.error('Error resetting preferences:', error);
      toast.error('Failed to reset settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-mpondo-gold-500" />
          <span className="ml-2 text-neutral-600">Loading advanced features...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Advanced Features</h2>
          <p className="text-neutral-600 mt-1">
            Enable advanced features to unlock powerful tools for your practice
          </p>
        </div>
        
        {hasUnsavedChanges && (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Unsaved changes</span>
          </div>
        )}
      </div>

      {/* Feature Categories */}
      <div className="space-y-6">
        {FEATURE_CATEGORIES.map(category => {
          const categoryState = categories[category.id];
          const IconComponent = CATEGORY_ICONS[category.id];
          
          return (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-mpondo-gold-100 rounded-lg">
                      <IconComponent className="w-5 h-5 text-mpondo-gold-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900">
                        {category.name}
                      </h3>
                      <p className="text-sm text-neutral-600">
                        {category.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Category Toggle */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-neutral-600">
                      {categoryState.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <button
                      onClick={() => handleCategoryToggle(category.id, !categoryState.enabled)}
                      disabled={categoryState.loading}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        categoryState.enabled ? 'bg-mpondo-gold-500' : 'bg-neutral-200'
                      } ${categoryState.loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {categoryState.loading ? (
                        <Loader2 className="w-3 h-3 animate-spin text-white mx-auto" />
                      ) : (
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            categoryState.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      )}
                    </button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Individual Features */}
                <div className="space-y-4">
                  {categoryState.features.map(feature => (
                    <div key={feature.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {feature.enabled ? (
                            <CheckCircle className="w-4 h-4 text-status-success-500" />
                          ) : (
                            <Circle className="w-4 h-4 text-neutral-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-neutral-900">
                            {feature.name}
                          </h4>
                          <p className="text-sm text-neutral-600 mt-1">
                            {feature.description}
                          </p>
                          {feature.tooltip && (
                            <div className="flex items-center gap-1 mt-2">
                              <Info className="w-3 h-3 text-neutral-400" />
                              <span className="text-xs text-neutral-500">
                                {feature.tooltip}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleIndividualFeatureToggle(feature.id, !feature.enabled)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          feature.enabled ? 'bg-status-success-500' : 'bg-neutral-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            feature.enabled ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-neutral-200">
        <Button
          variant="secondary"
          onClick={handleResetToDefaults}
          disabled={saving}
        >
          Reset to Defaults
        </Button>
        
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={loadUserPreferences}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveChanges}
            disabled={!hasUnsavedChanges || saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFeaturesSettings;