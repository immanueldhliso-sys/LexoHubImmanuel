import React from 'react';
import { Card } from '../../design-system/components';
import { Briefcase, FileText, Receipt, Brain, TrendingUp, Award, Zap } from 'lucide-react';

interface SeniorCounselDashboardProps {
  onNavigate?: (page: string) => void;
}

export const SeniorCounselDashboard: React.FC<SeniorCounselDashboardProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Senior Counsel Dashboard</h1>
          <p className="text-neutral-600 mt-1">Complete practice management with advanced insights</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-mpondo-gold-100 border border-mpondo-gold-300 rounded-lg">
          <Award className="w-5 h-5 text-mpondo-gold-600" />
          <span className="text-sm font-semibold text-mpondo-gold-900">Senior Counsel</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate?.('matters')}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Active Matters</p>
              <p className="text-2xl font-bold text-neutral-900">12</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate?.('invoices')}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Invoices</p>
              <p className="text-2xl font-bold text-neutral-900">8</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate?.('ai-analytics')}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">AI Insights</p>
              <p className="text-2xl font-bold text-neutral-900">94%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate?.('strategic-finance')}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Cash Flow</p>
              <p className="text-2xl font-bold text-neutral-900">R245k</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">Advanced Features</h2>
            <Zap className="w-5 h-5 text-mpondo-gold-600" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div
              className="p-4 border border-neutral-200 rounded-lg hover:border-mpondo-gold-300 hover:bg-mpondo-gold-50 transition-colors cursor-pointer"
              onClick={() => onNavigate?.('ai-analytics')}
            >
              <Brain className="w-6 h-6 text-purple-600 mb-2" />
              <h3 className="font-medium text-neutral-900">AI Analytics</h3>
              <p className="text-sm text-neutral-600">Practice insights</p>
            </div>
            <div
              className="p-4 border border-neutral-200 rounded-lg hover:border-mpondo-gold-300 hover:bg-mpondo-gold-50 transition-colors cursor-pointer"
              onClick={() => onNavigate?.('strategic-finance')}
            >
              <TrendingUp className="w-6 h-6 text-orange-600 mb-2" />
              <h3 className="font-medium text-neutral-900">Strategic Finance</h3>
              <p className="text-sm text-neutral-600">Cash flow & fees</p>
            </div>
            <div
              className="p-4 border border-neutral-200 rounded-lg hover:border-mpondo-gold-300 hover:bg-mpondo-gold-50 transition-colors cursor-pointer"
              onClick={() => onNavigate?.('practice-growth')}
            >
              <Briefcase className="w-6 h-6 text-blue-600 mb-2" />
              <h3 className="font-medium text-neutral-900">Practice Growth</h3>
              <p className="text-sm text-neutral-600">Briefs & referrals</p>
            </div>
            <div
              className="p-4 border border-neutral-200 rounded-lg hover:border-mpondo-gold-300 hover:bg-mpondo-gold-50 transition-colors cursor-pointer"
              onClick={() => onNavigate?.('workflow-integrations')}
            >
              <Zap className="w-6 h-6 text-green-600 mb-2" />
              <h3 className="font-medium text-neutral-900">Integrations</h3>
              <p className="text-sm text-neutral-600">Workflow automation</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 py-2">
              <div className="p-2 bg-blue-100 rounded">
                <Briefcase className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900">New matter</p>
                <p className="text-xs text-neutral-600">Smith v. Johnson</p>
              </div>
              <span className="text-xs text-neutral-500">2h</span>
            </div>
            <div className="flex items-center gap-3 py-2">
              <div className="p-2 bg-purple-100 rounded">
                <Brain className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900">AI insight</p>
                <p className="text-xs text-neutral-600">Fee optimization</p>
              </div>
              <span className="text-xs text-neutral-500">5h</span>
            </div>
            <div className="flex items-center gap-3 py-2">
              <div className="p-2 bg-green-100 rounded">
                <Receipt className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900">Invoice paid</p>
                <p className="text-xs text-neutral-600">INV-2024-0123</p>
              </div>
              <span className="text-xs text-neutral-500">1d</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
