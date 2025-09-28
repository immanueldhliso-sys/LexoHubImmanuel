import React from 'react';
import { Briefcase, FileText, BarChart3 } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../design-system/components';

const DashboardPage: React.FC = () => (
  <div className="max-w-7xl mx-auto space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-neutral-600 mt-1">Welcome to your practice intelligence platform</p>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Quick Stats */}
      <Card hoverable>
        <CardContent className="p-0 text-center">
          <div className="text-mpondo-gold-500 mb-2">
            <Briefcase className="w-8 h-8 mx-auto" />
          </div>
          <h3 className="text-2xl font-bold text-neutral-900">42</h3>
          <p className="text-sm text-neutral-600">Active Matters</p>
        </CardContent>
      </Card>

      <Card hoverable>
        <CardContent className="p-0 text-center">
          <div className="text-judicial-blue-900 mb-2">
            <FileText className="w-8 h-8 mx-auto" />
          </div>
          <h3 className="text-2xl font-bold text-neutral-900">R1.2M</h3>
          <p className="text-sm text-neutral-600">Outstanding WIP</p>
        </CardContent>
      </Card>

      <Card hoverable>
        <CardContent className="p-0 text-center">
          <div className="text-status-success-500 mb-2">
            <BarChart3 className="w-8 h-8 mx-auto" />
          </div>
          <h3 className="text-2xl font-bold text-neutral-900">R890K</h3>
          <p className="text-sm text-neutral-600">This Month Billing</p>
        </CardContent>
      </Card>

      <Card hoverable>
        <CardContent className="p-0 text-center">
          <div className="text-status-warning-500 mb-2">
            <FileText className="w-8 h-8 mx-auto" />
          </div>
          <h3 className="text-2xl font-bold text-neutral-900">7</h3>
          <p className="text-sm text-neutral-600">Overdue Invoices</p>
        </CardContent>
      </Card>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-neutral-900">Recent Matters</h2>
        </CardHeader>
        <CardContent className="p-0 space-y-3">
          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
            <div>
              <h4 className="font-medium text-neutral-900">Smith v Jones</h4>
              <p className="text-sm text-neutral-600">Contract Dispute</p>
            </div>
            <span className="badge badge-success">Active</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
            <div>
              <h4 className="font-medium text-neutral-900">ABC Corporation</h4>
              <p className="text-sm text-neutral-600">Commercial Litigation</p>
            </div>
            <span className="badge badge-warning">Pending</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-neutral-900">Practice Performance</h2>
        </CardHeader>
        <CardContent className="p-0 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-neutral-600">Collection Rate</span>
            <span className="font-medium text-neutral-900">87%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-neutral-600">Average Bill Time</span>
            <span className="font-medium text-neutral-900">45 days</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-neutral-600">Settlement Rate</span>
            <span className="font-medium text-neutral-900">72%</span>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default DashboardPage;