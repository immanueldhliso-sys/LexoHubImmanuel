import React, { useState } from 'react';
import { 
  Calendar, 
  DollarSign, 
  Clock, 
  MapPin, 
  AlertCircle,
  User,
  Eye,
  Users,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import type { OverflowBrief } from '../../services/api/practice-growth.service';
import { ApplyForBriefModal } from './ApplyForBriefModal';

interface OverflowBriefCardProps {
  brief: OverflowBrief;
  onApply: () => void;
}

const getCategoryLabel = (category: string): string => {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const OverflowBriefCard: React.FC<OverflowBriefCardProps> = ({ brief, onApply }) => {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const feeRange = brief.estimatedFeeRangeMin && brief.estimatedFeeRangeMax
    ? `R${brief.estimatedFeeRangeMin.toLocaleString('en-ZA')} - R${brief.estimatedFeeRangeMax.toLocaleString('en-ZA')}`
    : brief.estimatedFeeRangeMin
    ? `From R${brief.estimatedFeeRangeMin.toLocaleString('en-ZA')}`
    : brief.estimatedFeeRangeMax
    ? `Up to R${brief.estimatedFeeRangeMax.toLocaleString('en-ZA')}`
    : 'Negotiable';

  return (
    <>
      <div className="bg-white rounded-lg border border-neutral-200 hover:shadow-lg transition-shadow">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {brief.isUrgent && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-error-100 text-error-700">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Urgent
                  </span>
                )}
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-mpondo-gold-100 text-mpondo-gold-700">
                  {getCategoryLabel(brief.category)}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-1">{brief.title}</h3>
              <p className="text-sm text-neutral-600">{brief.matterType}</p>
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <p className={`text-sm text-neutral-700 ${!expanded ? 'line-clamp-3' : ''}`}>
              {brief.description}
            </p>
            {brief.description.length > 150 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-sm text-mpondo-gold-600 hover:text-mpondo-gold-700 mt-1"
              >
                {expanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>

          {/* Details */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <MapPin className="w-4 h-4 text-neutral-400" />
              <span>{brief.bar === 'johannesburg' ? 'Johannesburg Bar' : 'Cape Town Bar'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <DollarSign className="w-4 h-4 text-neutral-400" />
              <span>{feeRange}</span>
              {brief.referralPercentage && (
                <span className="text-xs text-neutral-500">
                  ({(brief.referralPercentage * 100).toFixed(0)}% referral fee)
                </span>
              )}
            </div>
            {brief.deadline && (
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <Calendar className="w-4 h-4 text-neutral-400" />
                <span>Deadline: {format(new Date(brief.deadline), 'dd MMM yyyy')}</span>
              </div>
            )}
            {brief.expectedDurationDays && (
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <Clock className="w-4 h-4 text-neutral-400" />
                <span>Expected duration: {brief.expectedDurationDays} days</span>
              </div>
            )}
          </div>

          {/* Requirements */}
          {brief.requiredExperienceYears > 0 && (
            <div className="mb-4 p-3 bg-neutral-50 rounded-lg">
              <p className="text-sm font-medium text-neutral-700 mb-1">Requirements:</p>
              <p className="text-sm text-neutral-600">
                Minimum {brief.requiredExperienceYears} years experience in {getCategoryLabel(brief.category)}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-4 text-xs text-neutral-500">
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{brief.viewCount} views</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{brief.applicationCount} applications</span>
              </div>
            </div>
            <button
              onClick={() => setShowApplyModal(true)}
              className="inline-flex items-center gap-1 px-4 py-2 bg-mpondo-gold-600 text-white text-sm font-medium rounded-lg hover:bg-mpondo-gold-700 transition-colors"
            >
              Apply
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showApplyModal && (
        <ApplyForBriefModal
          brief={brief}
          onClose={() => setShowApplyModal(false)}
          onSuccess={() => {
            setShowApplyModal(false);
            onApply();
          }}
        />
      )}
    </>
  );
};

