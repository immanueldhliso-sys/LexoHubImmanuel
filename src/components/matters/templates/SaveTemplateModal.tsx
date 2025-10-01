/**
 * SaveTemplateModal Component
 * 
 * Modal for saving current matter form data as a reusable template.
 * Includes template naming, categorization, and sharing options.
 */

import React, { useState, useEffect } from 'react';
import { X, Save, FileText, Share2, Star, AlertCircle } from 'lucide-react';
import type { 
  MatterTemplateData, 
  TemplateCategory, 
  CreateTemplateRequest 
} from '@/types/matter-templates';
import { matterTemplatesService } from '@/services/api/matter-templates.service';
import { toast } from 'react-hot-toast';

interface ValidationError {
  path?: string[];
  message: string;
}

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceData: MatterTemplateData;
  onTemplateSaved?: (templateId: string) => void;
}

export const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({
  isOpen,
  onClose,
  sourceData,
  onTemplateSaved
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'General',
    is_default: false,
    is_shared: false
  });
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      // Generate a suggested name based on source data
      const suggestedName = generateTemplateName(sourceData);
      setFormData(prev => ({
        ...prev,
        name: suggestedName
      }));
    }
  }, [isOpen, sourceData]);

  const loadCategories = async () => {
    try {
      const result = await matterTemplatesService.getCategories();
      if (result.data) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const generateTemplateName = (data: MatterTemplateData): string => {
    const parts = [];
    
    if (data.matterType) {
      parts.push(data.matterType);
    }
    
    if (data.clientType) {
      parts.push(data.clientType);
    }
    
    if (parts.length === 0) {
      parts.push('Matter Template');
    }
    
    return parts.join(' - ');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Template name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Template name must be at least 3 characters';
    } else if (formData.name.length > 255) {
      newErrors.name = 'Template name is too long';
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description is too long';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const templateRequest: CreateTemplateRequest = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category,
        template_data: sourceData,
        is_default: formData.is_default,
        is_shared: formData.is_shared
      };

      const result = await matterTemplatesService.createTemplate(templateRequest);
      
      if (result.error) {
        toast.error(result.error.message);
        if (result.error.type === 'VALIDATION_ERROR' && result.error.details) {
          const validationErrors: Record<string, string> = {};
          (result.error.details as ValidationError[]).forEach((error: ValidationError) => {
            validationErrors[error.path?.[0] || 'general'] = error.message;
          });
          setErrors(validationErrors);
        }
      } else if (result.data) {
        toast.success('Template saved successfully');
        if (onTemplateSaved) {
          onTemplateSaved(result.data.id);
        }
        handleClose();
      }
    } catch (error) {
      toast.error('Failed to save template');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      category: 'General',
      is_default: false,
      is_shared: false
    });
    setErrors({});
    onClose();
  };

  const getPreviewData = () => {
    const fields = [];
    if (sourceData.matterTitle) fields.push(`Title: ${sourceData.matterTitle}`);
    if (sourceData.matterType) fields.push(`Type: ${sourceData.matterType}`);
    if (sourceData.clientName) fields.push(`Client: ${sourceData.clientName}`);
    if (sourceData.instructingAttorney) fields.push(`Attorney: ${sourceData.instructingAttorney}`);
    if (sourceData.feeType) fields.push(`Fee Type: ${sourceData.feeType}`);
    return fields;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Save className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Save as Template</h2>
              <p className="text-sm text-gray-600">Create a reusable template from current form data</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Template Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter template name..."
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe when to use this template..."
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.description}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.category ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.category}
                </p>
              )}
            </div>
          </div>

          {/* Template Options */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">Template Options</h3>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-3">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-sm font-medium text-gray-700">Set as Default Template</span>
                </div>
                <p className="text-xs text-gray-500">This template will be suggested first for similar matters</p>
              </div>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_shared}
                onChange={(e) => setFormData(prev => ({ ...prev, is_shared: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-3">
                <div className="flex items-center">
                  <Share2 className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm font-medium text-gray-700">Share with Other Advocates</span>
                </div>
                <p className="text-xs text-gray-500">Make this template available to other advocates in your organization</p>
              </div>
            </label>
          </div>

          {/* Data Preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Template Data Preview
            </h3>
            <div className="space-y-1">
              {getPreviewData().length > 0 ? (
                getPreviewData().map((field, index) => (
                  <p key={index} className="text-xs text-gray-600">{field}</p>
                ))
              ) : (
                <p className="text-xs text-gray-500 italic">No form data to save</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || getPreviewData().length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Template</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};