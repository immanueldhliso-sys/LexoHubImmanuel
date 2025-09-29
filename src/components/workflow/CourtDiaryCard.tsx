import React from 'react';
import { Calendar, Clock, MapPin, User, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '../../design-system/components';
import type { CourtDiaryEntry } from '../../types';
import { format } from 'date-fns';

interface CourtDiaryCardProps {
  entry: CourtDiaryEntry;
  onUpdate?: (id: string, updates: Partial<CourtDiaryEntry>) => void;
}

export const CourtDiaryCard: React.FC<CourtDiaryCardProps> = ({ entry, onUpdate }) => {
  const getSyncStatusIcon = () => {
    switch (entry.syncStatus) {
      case 'synced':
        return <CheckCircle className="w-4 h-4 text-success-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-error-500" />;
      default:
        return <RefreshCw className="w-4 h-4 text-warning-500" />;
    }
  };

  const getSyncStatusColor = () => {
    switch (entry.syncStatus) {
      case 'synced':
        return 'text-success-600 bg-success-50';
      case 'failed':
        return 'text-error-600 bg-error-50';
      default:
        return 'text-warning-600 bg-warning-50';
    }
  };

  return (
    <Card hoverable>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-neutral-900">{entry.hearingType}</h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSyncStatusColor()}`}>
                {entry.syncStatus}
              </span>
            </div>
            {entry.description && (
              <p className="text-sm text-neutral-600 mb-2">{entry.description}</p>
            )}
          </div>
          {getSyncStatusIcon()}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-neutral-400" />
            <span className="text-neutral-600">
              {format(new Date(entry.hearingDate), 'dd MMM yyyy')}
            </span>
          </div>

          {entry.hearingTime && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-neutral-400" />
              <span className="text-neutral-600">{entry.hearingTime}</span>
            </div>
          )}

          {entry.courtCaseId && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-neutral-400" />
              <span className="text-neutral-600">Case #{entry.courtCaseId.slice(-8)}</span>
            </div>
          )}

          {entry.nextHearingDate && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-400" />
              <span className="text-neutral-600">
                Next: {format(new Date(entry.nextHearingDate), 'dd MMM')}
              </span>
            </div>
          )}
        </div>

        {entry.outcome && (
          <div className="mt-3 p-2 bg-neutral-50 rounded-lg">
            <p className="text-xs text-neutral-600 mb-1">Outcome:</p>
            <p className="text-sm text-neutral-900">{entry.outcome}</p>
          </div>
        )}

        {entry.notes && (
          <div className="mt-3 p-2 bg-judicial-blue-50 rounded-lg">
            <p className="text-xs text-judicial-blue-600 mb-1">Notes:</p>
            <p className="text-sm text-judicial-blue-900">{entry.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
