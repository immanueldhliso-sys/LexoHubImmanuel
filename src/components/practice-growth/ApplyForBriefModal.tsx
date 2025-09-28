import React, { useState } from 'react';
import { X, DollarSign, Calendar, FileText, Send } from 'lucide-react';
import { format } from 'date-fns';
import { PracticeGrowthService, type OverflowBrief } from '../../services/api/practice-growth.service';
import { toast } from 'react-hot-toast';

interface ApplyForBriefModalProps {
  brief: OverflowBrief;
  onClose: () => void;
  onSuccess: () => void;
}

export const ApplyForBriefModal: React.FC<ApplyForBriefModalProps> = ({ 
  brief, 
  onClose, 
  onSuccess 
}) => {
  const [formData, setFormData] = useState({
    coverMessage: '',
    proposedFee: '',
    availabilityDate: format(new Date(), 'yyyy-MM-dd'),
    relevantExperience: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.coverMessage.length < 50) {
      toast.error('Cover message must be at least 50 characters');
      return;
    }

    setSubmitting(true);
    try {
      await PracticeGrowthService.applyForBrief({
        briefId: brief.id,
        coverMessage: formData.coverMessage,
        proposedFee: formData.proposedFee ? parseFloat(formData.proposedFee) : undefined,
        availabilityDate: formData.availabilityDate,
        relevantExperience: formData.relevantExperience || undefined
      });
      
      onSuccess();
    } catch (error) {
      // Error handling done in service
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900">Apply for Brief</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Brief Summary */}
          <div className="bg-neutral-50 rounded-lg p-4">
            <h3 className="font-semibold text-neutral-900 mb-2">{brief.title}</h3>
            <p className="text-sm text-neutral-600 mb-3">{brief.description}</p>
            <div className="flex items-center gap-4 text-sm text-neutral-500">
              <span>{brief.bar === 'johannesburg' ? 'Johannesburg Bar' : 'Cape Town Bar'}</span>
              {brief.deadline && (
                <span>Deadline: {format(new Date(brief.deadline), 'dd MMM yyyy')}</span>
              )}
            </div>
          </div>

          {/* Cover Message */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Cover Message <span className="text-error-500">*</span>
            </label>
            <textarea
              value={formData.coverMessage}
              onChange={(e) => setFormData({ ...formData, coverMessage: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
              placeholder="Explain why you're the right advocate for this brief..."
              required
            />
            <p className="text-xs text-neutral-500 mt-1">
              Minimum 50 characters ({formData.coverMessage.length}/50)
            </p>
          </div>

          {/* Proposed Fee */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Proposed Fee
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="number"
                value={formData.proposedFee}
                onChange={(e) => setFormData({ ...formData, proposedFee: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
                placeholder="Enter your proposed fee"
                min="0"
                step="100"
              />
            </div>
            {brief.estimatedFeeRangeMin && brief.estimatedFeeRangeMax && (
              <p className="text-xs text-neutral-500 mt-1">
                Suggested range: R{brief.estimatedFeeRangeMin.toLocaleString('en-ZA')} - R{brief.estimatedFeeRangeMax.toLocaleString('en-ZA')}
              </p>
            )}
          </div>

          {/* Availability Date */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Availability Date <span className="text-error-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="date"
                value={formData.availabilityDate}
                onChange={(e) => setFormData({ ...formData, availabilityDate: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
                required
              />
            </div>
          </div>

          {/* Relevant Experience */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Relevant Experience
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
              <textarea
                value={formData.relevantExperience}
                onChange={(e) => setFormData({ ...formData, relevantExperience: e.target.value })}
                rows={4}
                className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
                placeholder="Describe your relevant experience for this type of matter..."
              />
            </div>
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
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Application
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

