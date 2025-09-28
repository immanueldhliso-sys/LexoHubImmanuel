import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Users, 
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface ReferralStatsCardProps {
  stats: {
    given: number;
    received: number;
    valueGiven: number;
    valueReceived: number;
    reciprocityRatio?: number;
    relationships: Array<{
      id: string;
      advocateAId: string;
      advocateBId: string;
      referralsAToB: number;
      referralsBToA: number;
      totalValueAToB: number;
      totalValueBToA: number;
      reciprocityRatio?: number;
      relationshipQuality: 'balanced' | 'imbalanced' | 'one_sided';
      lastReferralDate?: string;
    }>;
  };
}

export const ReferralStatsCard: React.FC<ReferralStatsCardProps> = ({ stats }) => {
  const getQualityIcon = (quality: string) => {
    switch (quality) {
      case 'balanced':
        return <CheckCircle className="w-4 h-4 text-success-600" />;
      case 'imbalanced':
        return <AlertTriangle className="w-4 h-4 text-warning-600" />;
      case 'one_sided':
        return <AlertTriangle className="w-4 h-4 text-error-600" />;
      default:
        return null;
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'balanced':
        return 'bg-success-100 text-success-700';
      case 'imbalanced':
        return 'bg-warning-100 text-warning-700';
      case 'one_sided':
        return 'bg-error-100 text-error-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-200">
      <div className="p-6 border-b border-neutral-200">
        <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-mpondo-gold-600" />
          Referral Relationships
        </h3>
        <p className="text-sm text-neutral-600 mt-1">
          Track reciprocity and balance in your referral network
        </p>
      </div>

      <div className="p-6">
        {stats.relationships.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <p className="text-neutral-600 mb-2">No referral relationships yet</p>
            <p className="text-sm text-neutral-500">
              Start building your network by referring matters or accepting referrals
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-neutral-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-neutral-600 mb-1">Total Network Value</p>
                  <p className="text-xl font-bold text-neutral-900">
                    R{(stats.valueGiven + stats.valueReceived).toLocaleString('en-ZA', { minimumFractionDigits: 0 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600 mb-1">Network Health</p>
                  <div className="flex items-center gap-2">
                    {stats.reciprocityRatio && stats.reciprocityRatio >= 0.8 && stats.reciprocityRatio <= 1.2 ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-success-600" />
                        <span className="text-lg font-semibold text-success-700">Balanced</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-5 h-5 text-warning-600" />
                        <span className="text-lg font-semibold text-warning-700">Needs Attention</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Relationships List */}
            <div className="space-y-3">
              {stats.relationships.map((relationship) => {
                const isAdvocateA = relationship.advocateAId === 'current_user'; // This would come from auth context
                const given = isAdvocateA ? relationship.referralsAToB : relationship.referralsBToA;
                const received = isAdvocateA ? relationship.referralsBToA : relationship.referralsAToB;
                const valueGiven = isAdvocateA ? relationship.totalValueAToB : relationship.totalValueBToA;
                const valueReceived = isAdvocateA ? relationship.totalValueBToA : relationship.totalValueAToB;

                return (
                  <div key={relationship.id} className="border border-neutral-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-neutral-900">
                          Advocate {isAdvocateA ? relationship.advocateBId : relationship.advocateAId}
                        </h4>
                        {relationship.lastReferralDate && (
                          <p className="text-sm text-neutral-500 mt-1">
                            Last referral: {format(new Date(relationship.lastReferralDate), 'dd MMM yyyy')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getQualityIcon(relationship.relationshipQuality)}
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getQualityColor(relationship.relationshipQuality)}`}>
                          {relationship.relationshipQuality.charAt(0).toUpperCase() + relationship.relationshipQuality.slice(1).replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <ArrowUpRight className="w-5 h-5 text-neutral-400" />
                        <div>
                          <p className="text-sm text-neutral-600">Given</p>
                          <p className="font-semibold text-neutral-900">
                            {given} referrals
                          </p>
                          <p className="text-xs text-neutral-500">
                            R{valueGiven.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <ArrowDownRight className="w-5 h-5 text-neutral-400" />
                        <div>
                          <p className="text-sm text-neutral-600">Received</p>
                          <p className="font-semibold text-neutral-900">
                            {received} referrals
                          </p>
                          <p className="text-xs text-neutral-500">
                            R{valueReceived.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {relationship.reciprocityRatio !== undefined && (
                      <div className="mt-3 pt-3 border-t border-neutral-100">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-neutral-600">Reciprocity Ratio</span>
                          <span className="font-semibold text-neutral-900">
                            {relationship.reciprocityRatio.toFixed(2)}:1
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Recommendations */}
            {stats.reciprocityRatio && (stats.reciprocityRatio < 0.5 || stats.reciprocityRatio > 2) && (
              <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-warning-900 mb-1">Recommendation</h4>
                    <p className="text-sm text-warning-700">
                      {stats.reciprocityRatio < 0.5 
                        ? 'Consider referring more matters to maintain balanced relationships in your network.'
                        : 'You\'re giving significantly more referrals than receiving. Consider discussing reciprocal arrangements with your network.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

