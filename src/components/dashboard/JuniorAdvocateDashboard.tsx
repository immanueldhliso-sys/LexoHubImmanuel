import React from 'react';
import { Card } from '../../design-system/components';
import { Briefcase, FileText, Receipt, ArrowUpCircle, TrendingUp } from 'lucide-react';

interface JuniorAdvocateDashboardProps {
  onNavigate?: (page: string) => void;
}

export const JuniorAdvocateDashboard: React.FC<JuniorAdvocateDashboardProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Junior Advocate Dashboard</h1>
          <p className="text-neutral-600 mt-1">Essential practice management tools</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-mpondo-gold-50 border border-mpondo-gold-200 rounded-lg">
          <TrendingUp className="w-5 h-5 text-mpondo-gold-600" />
          <div>
            <p className="text-sm font-medium text-neutral-900">Upgrade Available</p>
            <button
              onClick={() => onNavigate?.('settings')}
              className="text-xs text-mpondo-gold-600 hover:text-mpondo-gold-700 font-medium"
            >
              View Senior Counsel benefits →
            </button>
          </div>
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

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate?.('proforma')}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Receipt className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Pro Forma</p>
              <p className="text-2xl font-bold text-neutral-900">5</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-mpondo-gold-50 to-mpondo-gold-100 border-mpondo-gold-200 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate?.('settings')}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-lg">
              <ArrowUpCircle className="w-6 h-6 text-mpondo-gold-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-700 font-medium">Upgrade</p>
              <p className="text-xs text-neutral-600">Unlock advanced features</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-neutral-900">New matter created</p>
                  <p className="text-sm text-neutral-600">Smith v. Johnson</p>
                </div>
              </div>
              <span className="text-sm text-neutral-500">2 hours ago</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <h2 className="text-lg font-semibold text-neutral-900 mb-3">Unlock More Features</h2>
          <ul className="space-y-2 mb-4">
            <li className="flex items-center gap-2 text-sm text-neutral-700">
              <div className="w-1.5 h-1.5 bg-mpondo-gold-600 rounded-full"></div>
              AI-powered analytics
            </li>
            <li className="flex items-center gap-2 text-sm text-neutral-700">
              <div className="w-1.5 h-1.5 bg-mpondo-gold-600 rounded-full"></div>
              Strategic finance tools
            </li>
            <li className="flex items-center gap-2 text-sm text-neutral-700">
              <div className="w-1.5 h-1.5 bg-mpondo-gold-600 rounded-full"></div>
              Practice growth network
            </li>
          </ul>
          <button
            onClick={() => onNavigate?.('settings')}
            className="w-full px-4 py-2 bg-mpondo-gold-600 hover:bg-mpondo-gold-700 text-white rounded-lg font-medium transition-colors"
          >
            Upgrade to Senior Counsel
          </button>
        </Card>
      </div>
    </div>
  );
};
