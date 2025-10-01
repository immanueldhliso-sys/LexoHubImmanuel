import React, { useState } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import { PracticeGrowthService, type SpecialisationCategory } from '../../services/api/practice-growth.service';
import { toast } from 'react-hot-toast';

interface CreateBriefModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type FeeType = 'standard' | 'contingency' | 'success' | 'retainer' | 'pro_bono';

const SPECIALISATION_OPTIONS: { value: SpecialisationCategory; label: string }[] = [
  { value: 'administrative_law', label: 'Administrative Law' },
  { value: 'banking_finance', label: 'Banking & Finance' },
  { value: 'commercial_litigation', label: 'Commercial Litigation' },
  { value: 'constitutional_law', label: 'Constitutional Law' },
  { value: 'construction_law', label: 'Construction Law' },
  { value: 'criminal_law', label: 'Criminal Law' },
  { value: 'employment_law', label: 'Employment Law' },
  { value: 'environmental_law', label: 'Environmental Law' },
  { value: 'family_law', label: 'Family Law' },
  { value: 'insurance_law', label: 'Insurance Law' },
  { value: 'intellectual_property', label: 'Intellectual Property' },
  { value: 'international_law', label: 'International Law' },
  { value: 'medical_law', label: 'Medical Law' },
  { value: 'mining_law', label: 'Mining Law' },
  { value: 'property_law', label: 'Property Law' },
  { value: 'tax_law', label: 'Tax Law' },
  { value: 'other', label: 'Other' }
];

export const CreateBriefModal: React.FC<CreateBriefModalProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as SpecialisationCategory | '',
    matterType: '',
    bar: '' as 'johannesburg' | 'cape_town' | '',
    requiredExperienceYears: 0,
    estimatedFeeRangeMin: '',
    estimatedFeeRangeMax: '',
    feeType: 'standard' as FeeType,
    referralPercentage: '',
    deadline: '',
    expectedDurationDays: '',
    isUrgent: false,
    isPublic: true
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.bar) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.description.length < 50) {
      toast.error('Description must be at least 50 characters');
      return;
    }

    setSubmitting(true);
    try {
      await PracticeGrowthService.createOverflowBrief({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        matterType: formData.matterType,
        bar: formData.bar,
        requiredExperienceYears: formData.requiredExperienceYears,
        estimatedFeeRangeMin: formData.estimatedFeeRangeMin ? parseFloat(formData.estimatedFeeRangeMin) : undefined,
        estimatedFeeRangeMax: formData.estimatedFeeRangeMax ? parseFloat(formData.estimatedFeeRangeMax) : undefined,
        feeType: formData.feeType,
        referralPercentage: formData.referralPercentage ? parseFloat(formData.referralPercentage) / 100 : undefined,
        deadline: formData.deadline || undefined,
        expectedDurationDays: formData.expectedDurationDays ? parseInt(formData.expectedDurationDays) : undefined,
        isUrgent: formData.isUrgent,
        isPublic: formData.isPublic
      });
      
      onSuccess();
    } catch (error) {
      // Error handling done in service
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full my-8">
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900">Post Overflow Brief</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Brief Title <span className="text-error-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
                placeholder="e.g., Commercial Litigation - Breach of Contract"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Category <span className="text-error-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as SpecialisationCategory })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
                  required
                >
                  <option value="">Select category</option>
                  {SPECIALISATION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Matter Type <span className="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.matterType}
                  onChange={(e) => setFormData({ ...formData, matterType: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
                  placeholder="e.g., Motion Application"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Bar <span className="text-error-500">*</span>
              </label>
              <select
                value={formData.bar}
                onChange={(e) => setFormData({ ...formData, bar: e.target.value as 'johannesburg' | 'cape_town' })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
                required
              >
                <option value="">Select bar</option>
                <option value="johannesburg">Johannesburg Bar</option>
                <option value="cape_town">Cape Town Bar</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Description <span className="text-error-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
                placeholder="Provide a detailed description of the brief..."
                required
              />
              <p className="text-xs text-neutral-500 mt-1">
                Minimum 50 characters ({formData.description.length}/50)
              </p>
            </div>
          </div>

          {/* Requirements */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">Requirements</h3>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Minimum Years Experience
              </label>
              <input
                type="number"
                value={formData.requiredExperienceYears}
                onChange={(e) => setFormData({ ...formData, requiredExperienceYears: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
                min="0"
                max="50"
              />
            </div>
          </div>

          {/* Financial Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">Financial Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Minimum Fee (R)
                </label>
                <input
                  type="number"
                  value={formData.estimatedFeeRangeMin}
                  onChange={(e) => setFormData({ ...formData, estimatedFeeRangeMin: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
                  min="0"
                  step="1000"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Maximum Fee (R)
                </label>
                <input
                  type="number"
                  value={formData.estimatedFeeRangeMax}
                  onChange={(e) => setFormData({ ...formData, estimatedFeeRangeMax: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
                  min="0"
                  step="1000"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Fee Type
                </label>
                <select
                  value={formData.feeType}
                  onChange={(e) => setFormData({ ...formData, feeType: e.target.value as FeeType })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
                >
                  <option value="standard">Standard</option>
                  <option value="contingency">Contingency</option>
                  <option value="success">Success Fee</option>
                  <option value="retainer">Retainer</option>
                  <option value="pro_bono">Pro Bono</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Referral Percentage (%)
                </label>
                <input
                  type="number"
                  value={formData.referralPercentage}
                  onChange={(e) => setFormData({ ...formData, referralPercentage: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
                  min="0"
                  max="50"
                  step="5"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">Timeline</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Deadline
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Expected Duration (days)
                </label>
                <input
                  type="number"
                  value={formData.expectedDurationDays}
                  onChange={(e) => setFormData({ ...formData, expectedDurationDays: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
                  min="1"
                  placeholder="0"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isUrgent}
                onChange={(e) => setFormData({ ...formData, isUrgent: e.target.checked })}
                className="w-4 h-4 text-mpondo-gold-600 border-neutral-300 rounded focus:ring-mpondo-gold-500"
              />
              <span className="text-sm font-medium text-neutral-700">Mark as urgent</span>
              <AlertCircle className="w-4 h-4 text-error-500" />
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-mpondo-gold-600 text-white rounded-lg hover:bg-mpondo-gold-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Posting...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Post Brief
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

