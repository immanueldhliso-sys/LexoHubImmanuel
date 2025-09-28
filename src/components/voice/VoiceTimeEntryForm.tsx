import React, { useState, useEffect, useCallback } from 'react';
import { Save, X, AlertTriangle, CheckCircle, Clock, User, FileText } from 'lucide-react';
import { Modal, ModalBody, ModalFooter, Button, Input, Card, CardContent } from '../../design-system/components';
import type { VoiceRecording, ExtractedTimeEntryData, TimeEntry, Matter } from '../../types';

interface VoiceTimeEntryFormProps {
  recording: VoiceRecording;
  extractedData: ExtractedTimeEntryData;
  availableMatters?: Matter[];
  onSave: (timeEntry: Omit<TimeEntry, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  isOpen: boolean;
  className?: string;
}

export const VoiceTimeEntryForm: React.FC<VoiceTimeEntryFormProps> = ({
  recording,
  extractedData,
  availableMatters = [],
  onSave,
  onCancel,
  isOpen,
  className = ''
}) => {
  const [formData, setFormData] = useState({
    matterId: extractedData.matterId || '',
    date: extractedData.date || new Date().toISOString().split('T')[0],
    duration: extractedData.duration || 0,
    description: extractedData.description || '',
    workType: extractedData.workType || '',
    rate: 2500, // Default hourly rate - should come from user settings
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfidenceDetails, setShowConfidenceDetails] = useState(false);

  // Update form data when extracted data changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      matterId: extractedData.matterId || prev.matterId,
      date: extractedData.date || prev.date,
      duration: extractedData.duration || prev.duration,
      description: extractedData.description || prev.description,
      workType: extractedData.workType || prev.workType,
    }));
  }, [extractedData]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.matterId) {
      newErrors.matterId = 'Please select a matter';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.duration || formData.duration <= 0) {
      newErrors.duration = 'Duration must be greater than 0';
    } else if (formData.duration > 720) {
      newErrors.duration = 'Duration cannot exceed 12 hours (720 minutes)';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.rate || formData.rate <= 0) {
      newErrors.rate = 'Hourly rate must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const selectedMatter = availableMatters.find(m => m.id === formData.matterId);
      const amount = (formData.duration / 60) * formData.rate;

      const timeEntry: Omit<TimeEntry, 'id' | 'createdAt'> = {
        matterId: formData.matterId,
        date: formData.date,
        duration: formData.duration,
        description: formData.description.trim(),
        rate: formData.rate,
        amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
        billed: false,
        recordedBy: 'current-user', // Should come from auth context
        recordingMethod: 'Voice',
        modifiedAt: new Date().toISOString()
      };

      onSave(timeEntry);
    } catch (error) {
      console.error('Failed to save time entry:', error);
      setErrors({ submit: 'Failed to save time entry. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, availableMatters, onSave]);

  const handleInputChange = useCallback((field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-status-success-600 bg-status-success-100';
    if (confidence >= 0.6) return 'text-status-warning-600 bg-status-warning-100';
    return 'text-status-error-600 bg-status-error-100';
  };

  const getConfidenceText = (confidence: number): string => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  const selectedMatter = availableMatters.find(m => m.id === formData.matterId);
  const calculatedAmount = (formData.duration / 60) * formData.rate;

  return (
    <Modal isOpen={isOpen} onClose={onCancel} size="lg" className={className}>
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-neutral-900">Create Time Entry from Voice Recording</h2>
              <button
                type="button"
                onClick={onCancel}
                className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Confidence Score */}
            <Card className="bg-neutral-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getConfidenceColor(extractedData.confidence)}`}>
                      {extractedData.confidence >= 0.8 ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">
                        Extraction Confidence: {getConfidenceText(extractedData.confidence)}
                      </p>
                      <p className="text-sm text-neutral-600">
                        {Math.round(extractedData.confidence * 100)}% confidence in extracted data
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConfidenceDetails(!showConfidenceDetails)}
                  >
                    {showConfidenceDetails ? 'Hide' : 'Show'} Details
                  </Button>
                </div>

                {showConfidenceDetails && (
                  <div className="mt-4 pt-4 border-t border-neutral-200">
                    <h4 className="text-sm font-medium text-neutral-900 mb-2">Field Confidence Scores:</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {extractedData.extractedFields.duration && (
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Duration:</span>
                          <span className="font-medium">
                            {Math.round(extractedData.extractedFields.duration.confidence * 100)}%
                          </span>
                        </div>
                      )}
                      {extractedData.extractedFields.description && (
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Description:</span>
                          <span className="font-medium">
                            {Math.round(extractedData.extractedFields.description.confidence * 100)}%
                          </span>
                        </div>
                      )}
                      {extractedData.extractedFields.date && (
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Date:</span>
                          <span className="font-medium">
                            {Math.round(extractedData.extractedFields.date.confidence * 100)}%
                          </span>
                        </div>
                      )}
                      {extractedData.extractedFields.matter && (
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Matter:</span>
                          <span className="font-medium">
                            {Math.round(extractedData.extractedFields.matter.confidence * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Original Transcription */}
            {recording.transcription && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Original Recording
                </label>
                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-700">
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-neutral-500 mt-0.5 flex-shrink-0" />
                    <p>"{recording.transcription}"</p>
                  </div>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Matter Selection */}
              <div className="md:col-span-2">
                <label htmlFor="matterId" className="block text-sm font-medium text-neutral-700 mb-2">
                  Matter *
                </label>
                <select
                  id="matterId"
                  value={formData.matterId}
                  onChange={(e) => handleInputChange('matterId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent ${
                    errors.matterId ? 'border-status-error-300' : 'border-neutral-300'
                  }`}
                  required
                >
                  <option value="">Select a matter...</option>
                  {availableMatters.map((matter) => (
                    <option key={matter.id} value={matter.id}>
                      {matter.clientName} - {matter.title}
                    </option>
                  ))}
                </select>
                {errors.matterId && (
                  <p className="mt-1 text-sm text-status-error-600">{errors.matterId}</p>
                )}
                {selectedMatter && (
                  <p className="mt-1 text-sm text-neutral-600">
                    {selectedMatter.briefType} • {selectedMatter.instructingAttorney}
                  </p>
                )}
              </div>

              {/* Date */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-neutral-700 mb-2">
                  Date *
                </label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  error={errors.date}
                  required
                />
              </div>

              {/* Duration */}
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-neutral-700 mb-2">
                  Duration (minutes) *
                </label>
                <div className="relative">
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    max="720"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
                    error={errors.duration}
                    required
                  />
                  <div className="absolute right-3 top-2 text-sm text-neutral-500">
                    {formatDuration(formData.duration)}
                  </div>
                </div>
              </div>

              {/* Work Type */}
              <div>
                <label htmlFor="workType" className="block text-sm font-medium text-neutral-700 mb-2">
                  Work Type
                </label>
                <Input
                  id="workType"
                  type="text"
                  value={formData.workType}
                  onChange={(e) => handleInputChange('workType', e.target.value)}
                  placeholder="e.g., Research, Drafting, Client Meeting"
                />
              </div>

              {/* Hourly Rate */}
              <div>
                <label htmlFor="rate" className="block text-sm font-medium text-neutral-700 mb-2">
                  Hourly Rate (R) *
                </label>
                <Input
                  id="rate"
                  type="number"
                  min="1"
                  step="0.01"
                  value={formData.rate}
                  onChange={(e) => handleInputChange('rate', parseFloat(e.target.value) || 0)}
                  error={errors.rate}
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent resize-vertical ${
                  errors.description ? 'border-status-error-300' : 'border-neutral-300'
                }`}
                placeholder="Describe the work performed..."
                required
              />
              {errors.description && (
                <p className="mt-1 text-sm text-status-error-600">{errors.description}</p>
              )}
              <p className="mt-1 text-sm text-neutral-500">
                {formData.description.length} characters
              </p>
            </div>

            {/* Calculated Amount */}
            <Card className="bg-mpondo-gold-50 border-mpondo-gold-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-mpondo-gold-600" />
                    <span className="font-medium text-neutral-900">Calculated Amount</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-mpondo-gold-600">
                      R{calculatedAmount.toFixed(2)}
                    </div>
                    <div className="text-sm text-neutral-600">
                      {formatDuration(formData.duration)} × R{formData.rate}/hour
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Error */}
            {errors.submit && (
              <div className="flex items-center gap-2 p-3 bg-status-error-50 border border-status-error-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-status-error-600 flex-shrink-0" />
                <p className="text-sm text-status-error-700">{errors.submit}</p>
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <div className="flex items-center justify-between w-full">
            <Button
              type="button"
              onClick={onCancel}
              variant="secondary"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Time Entry
                </>
              )}
            </Button>
          </div>
        </ModalFooter>
      </form>
    </Modal>
  );
};