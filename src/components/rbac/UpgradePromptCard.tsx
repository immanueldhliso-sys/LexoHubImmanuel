import React from 'react';
import { Card } from '../../design-system/components';
import { ArrowUpCircle, Brain, TrendingUp, Briefcase, Zap, Shield } from 'lucide-react';

interface UpgradePromptCardProps {
  onUpgrade?: () => void;
  compact?: boolean;
}

export const UpgradePromptCard: React.FC<UpgradePromptCardProps> = ({
  onUpgrade,
  compact = false,
}) => {
  if (compact) {
    return (
      <Card className="p-4 bg-gradient-to-br from-mpondo-gold-50 to-amber-50 border-mpondo-gold-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-neutral-900">Unlock Senior Counsel Features</p>
            <p className="text-sm text-neutral-600">AI analytics, strategic finance & more</p>
          </div>
          <button
            onClick={onUpgrade}
            className="px-4 py-2 bg-mpondo-gold-600 hover:bg-mpondo-gold-700 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2 whitespace-nowrap"
          >
            <ArrowUpCircle className="w-4 h-4" />
            Upgrade
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-mpondo-gold-50 via-amber-50 to-orange-50 border-mpondo-gold-300">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-neutral-900 mb-1">
            Upgrade to Senior Counsel
          </h3>
          <p className="text-neutral-600">
            Unlock powerful features to grow your practice
          </p>
        </div>
        <div className="p-2 bg-mpondo-gold-100 rounded-lg">
          <Shield className="w-6 h-6 text-mpondo-gold-600" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg">
          <Brain className="w-5 h-5 text-purple-600 mt-0.5" />
          <div>
            <p className="font-medium text-neutral-900 text-sm">AI Analytics</p>
            <p className="text-xs text-neutral-600">Practice insights</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg">
          <TrendingUp className="w-5 h-5 text-orange-600 mt-0.5" />
          <div>
            <p className="font-medium text-neutral-900 text-sm">Strategic Finance</p>
            <p className="text-xs text-neutral-600">Cash flow tools</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg">
          <Briefcase className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-neutral-900 text-sm">Practice Growth</p>
            <p className="text-xs text-neutral-600">Briefs & referrals</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg">
          <Zap className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <p className="font-medium text-neutral-900 text-sm">Integrations</p>
            <p className="text-xs text-neutral-600">Automation</p>
          </div>
        </div>
      </div>

      <button
        onClick={onUpgrade}
        className="w-full px-4 py-3 bg-mpondo-gold-600 hover:bg-mpondo-gold-700 text-white rounded-lg font-semibold transition-colors inline-flex items-center justify-center gap-2"
      >
        <ArrowUpCircle className="w-5 h-5" />
        Upgrade to Senior Counsel
      </button>

      <p className="text-xs text-neutral-500 text-center mt-3">
        Join 500+ Senior Counsel using advanced features
      </p>
    </Card>
  );
};
