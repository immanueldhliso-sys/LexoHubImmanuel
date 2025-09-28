import React, { useState } from 'react';
import { DollarSign, BarChart3, TrendingUp, AlertTriangle, FileText } from 'lucide-react';
import { Card, CardHeader, CardContent, Button } from '../design-system/components';
import type { PracticeMetrics } from '../types';

const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'performance' | 'cash-flow'>('overview');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Mock data for reports
  const mockMetrics: PracticeMetrics = {
    totalWip: 2500000,
    totalBilled: 1800000,
    totalCollected: 1500000,
    outstandingInvoices: 15,
    overdueInvoices: 7,
    averageCollectionDays: 45,
    settlementRate: 72,
    monthlyBillings: [
      { month: 'Jan', year: 2024, amount: 180000, invoiceCount: 12, collectionRate: 85 },
      { month: 'Feb', year: 2024, amount: 220000, invoiceCount: 15, collectionRate: 78 },
      { month: 'Mar', year: 2024, amount: 195000, invoiceCount: 13, collectionRate: 92 },
      { month: 'Apr', year: 2024, amount: 240000, invoiceCount: 16, collectionRate: 88 },
      { month: 'May', year: 2024, amount: 210000, invoiceCount: 14, collectionRate: 82 },
      { month: 'Jun', year: 2024, amount: 275000, invoiceCount: 18, collectionRate: 90 }
    ],
    workTypeDistribution: [
      { type: 'Commercial Litigation', percentage: 35, revenue: 875000 },
      { type: 'Employment Law', percentage: 25, revenue: 625000 },
      { type: 'Mining Law', percentage: 20, revenue: 500000 },
      { type: 'Contract Disputes', percentage: 15, revenue: 375000 },
      { type: 'Other', percentage: 5, revenue: 125000 }
    ]
  };

  const mockCashFlowData = [
    { month: 'Jan', inflow: 180000, outflow: 45000, net: 135000 },
    { month: 'Feb', inflow: 220000, outflow: 52000, net: 168000 },
    { month: 'Mar', inflow: 195000, outflow: 48000, net: 147000 },
    { month: 'Apr', inflow: 240000, outflow: 58000, net: 182000 },
    { month: 'May', inflow: 210000, outflow: 51000, net: 159000 },
    { month: 'Jun', inflow: 275000, outflow: 62000, net: 213000 }
  ];

  const collectionRate = (mockMetrics.totalCollected / mockMetrics.totalBilled) * 100;
  const wipUtilization = (mockMetrics.totalBilled / mockMetrics.totalWip) * 100;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Practice Reports</h1>
          <p className="text-neutral-600 mt-1">Comprehensive analytics and financial insights</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button variant="primary" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Export Report</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-neutral-100 rounded-lg p-1">
        {(['overview', 'financial', 'performance', 'cash-flow'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {tab === 'overview' ? 'Overview' :
             tab === 'financial' ? 'Financial' :
             tab === 'performance' ? 'Performance' :
             'Cash Flow'}
          </button>
        ))}
      </div>

      {/* Content based on active tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-mpondo-gold-500 mb-2">
                  <DollarSign className="w-8 h-8 mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900">
                  R{(mockMetrics.totalWip / 1000000).toFixed(1)}M
                </h3>
                <p className="text-sm text-neutral-600">Total WIP</p>
                <div className="text-xs text-status-success-600 mt-1">
                  +12% from last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-judicial-blue-500 mb-2">
                  <BarChart3 className="w-8 h-8 mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900">
                  R{(mockMetrics.totalBilled / 1000000).toFixed(1)}M
                </h3>
                <p className="text-sm text-neutral-600">Total Billed</p>
                <div className="text-xs text-status-success-600 mt-1">
                  +8% from last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-status-success-500 mb-2">
                  <TrendingUp className="w-8 h-8 mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900">
                  {collectionRate.toFixed(0)}%
                </h3>
                <p className="text-sm text-neutral-600">Collection Rate</p>
                <div className="text-xs text-status-warning-600 mt-1">
                  -3% from last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-status-warning-500 mb-2">
                  <AlertTriangle className="w-8 h-8 mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900">
                  {mockMetrics.averageCollectionDays}
                </h3>
                <p className="text-sm text-neutral-600">Avg Collection Days</p>
                <div className="text-xs text-status-error-600 mt-1">
                  +5 days from last month
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-neutral-900">Monthly Billing Trend</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockMetrics.monthlyBillings.map((billing, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 text-sm text-neutral-600">{billing.month}</div>
                        <div className="flex-1">
                          <div className="w-full bg-neutral-200 rounded-full h-2">
                            <div 
                              className="bg-mpondo-gold-500 h-2 rounded-full"
                              style={{ width: `${(billing.amount / 300000) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-neutral-900">
                          R{(billing.amount / 1000).toFixed(0)}k
                        </div>
                        <div className="text-xs text-neutral-600">
                          {billing.invoiceCount} invoices
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-neutral-900">Work Type Distribution</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockMetrics.workTypeDistribution.map((work, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-32 text-sm text-neutral-900">{work.type}</div>
                        <div className="flex-1">
                          <div className="w-full bg-neutral-200 rounded-full h-2">
                            <div 
                              className="bg-judicial-blue-500 h-2 rounded-full"
                              style={{ width: `${work.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-neutral-900">{work.percentage}%</div>
                        <div className="text-xs text-neutral-600">
                          R{(work.revenue / 1000).toFixed(0)}k
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'financial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-neutral-900">Revenue Breakdown</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Gross Revenue</span>
                    <span className="font-bold text-neutral-900">
                      R{(mockMetrics.totalBilled / 1000000).toFixed(2)}M
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Collections</span>
                    <span className="font-bold text-status-success-600">
                      R{(mockMetrics.totalCollected / 1000000).toFixed(2)}M
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Outstanding</span>
                    <span className="font-bold text-status-warning-600">
                      R{((mockMetrics.totalBilled - mockMetrics.totalCollected) / 1000000).toFixed(2)}M
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">WIP Value</span>
                    <span className="font-bold text-neutral-900">
                      R{(mockMetrics.totalWip / 1000000).toFixed(2)}M
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-neutral-900">Invoice Status</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Total Invoices</span>
                    <span className="font-bold text-neutral-900">
                      {mockMetrics.monthlyBillings.reduce((sum, b) => sum + b.invoiceCount, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Outstanding</span>
                    <span className="font-bold text-status-warning-600">
                      {mockMetrics.outstandingInvoices}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Overdue</span>
                    <span className="font-bold text-status-error-600">
                      {mockMetrics.overdueInvoices}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Collection Rate</span>
                    <span className="font-bold text-neutral-900">
                      {collectionRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-neutral-900">Key Ratios</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">WIP Utilization</span>
                    <span className="font-bold text-neutral-900">
                      {wipUtilization.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Settlement Rate</span>
                    <span className="font-bold text-status-success-600">
                      {mockMetrics.settlementRate}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Avg Collection Days</span>
                    <span className="font-bold text-neutral-900">
                      {mockMetrics.averageCollectionDays} days
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Revenue per Matter</span>
                    <span className="font-bold text-neutral-900">
                      R{(mockMetrics.totalBilled / 42 / 1000).toFixed(0)}k
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-neutral-900">Monthly Performance</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockMetrics.monthlyBillings.map((billing, index) => (
                    <div key={index} className="p-4 bg-neutral-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-neutral-900">{billing.month} {billing.year}</h4>
                        <span className="text-sm text-neutral-600">
                          {billing.collectionRate}% collection
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-neutral-600">Revenue:</span>
                          <span className="ml-2 font-medium">R{(billing.amount / 1000).toFixed(0)}k</span>
                        </div>
                        <div>
                          <span className="text-neutral-600">Invoices:</span>
                          <span className="ml-2 font-medium">{billing.invoiceCount}</span>
                        </div>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-2 mt-2">
                        <div 
                          className={`h-2 rounded-full ${
                            billing.collectionRate > 85 ? 'bg-status-success-500' :
                            billing.collectionRate > 70 ? 'bg-status-warning-500' :
                            'bg-status-error-500'
                          }`}
                          style={{ width: `${billing.collectionRate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-neutral-900">Practice Efficiency</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-neutral-600">Billing Efficiency</span>
                      <span className="font-bold text-neutral-900">87%</span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div className="bg-status-success-500 h-2 rounded-full" style={{ width: '87%' }} />
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">Time to invoice conversion rate</p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-neutral-600">Client Satisfaction</span>
                      <span className="font-bold text-neutral-900">92%</span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div className="bg-status-success-500 h-2 rounded-full" style={{ width: '92%' }} />
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">Based on payment promptness</p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-neutral-600">Matter Resolution</span>
                      <span className="font-bold text-neutral-900">78%</span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div className="bg-status-warning-500 h-2 rounded-full" style={{ width: '78%' }} />
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">Successful case outcomes</p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-neutral-600">Time Management</span>
                      <span className="font-bold text-neutral-900">84%</span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div className="bg-status-success-500 h-2 rounded-full" style={{ width: '84%' }} />
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">Billable hours efficiency</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'cash-flow' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-neutral-900">Monthly Cash Flow</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockCashFlowData.map((flow, index) => (
                    <div key={index} className="p-4 bg-neutral-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-neutral-900">{flow.month} 2024</h4>
                        <span className={`text-sm font-medium ${
                          flow.net > 0 ? 'text-status-success-600' : 'text-status-error-600'
                        }`}>
                          Net: R{(flow.net / 1000).toFixed(0)}k
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-neutral-600">Inflow:</span>
                          <span className="ml-2 font-medium text-status-success-600">
                            +R{(flow.inflow / 1000).toFixed(0)}k
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-600">Outflow:</span>
                          <span className="ml-2 font-medium text-status-error-600">
                            -R{(flow.outflow / 1000).toFixed(0)}k
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-status-success-500 h-2 rounded-full"
                          style={{ width: `${(flow.inflow / (flow.inflow + flow.outflow)) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-neutral-900">Cash Flow Summary</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-neutral-900 mb-3">Total Inflows (6 months)</h4>
                    <div className="text-2xl font-bold text-status-success-600">
                      R{(mockCashFlowData.reduce((sum, f) => sum + f.inflow, 0) / 1000000).toFixed(2)}M
                    </div>
                    <p className="text-sm text-neutral-600">Average: R{(mockCashFlowData.reduce((sum, f) => sum + f.inflow, 0) / mockCashFlowData.length / 1000).toFixed(0)}k/month</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-neutral-900 mb-3">Total Outflows (6 months)</h4>
                    <div className="text-2xl font-bold text-status-error-600">
                      R{(mockCashFlowData.reduce((sum, f) => sum + f.outflow, 0) / 1000000).toFixed(2)}M
                    </div>
                    <p className="text-sm text-neutral-600">Average: R{(mockCashFlowData.reduce((sum, f) => sum + f.outflow, 0) / mockCashFlowData.length / 1000).toFixed(0)}k/month</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-neutral-900 mb-3">Net Cash Flow</h4>
                    <div className="text-2xl font-bold text-neutral-900">
                      R{(mockCashFlowData.reduce((sum, f) => sum + f.net, 0) / 1000000).toFixed(2)}M
                    </div>
                    <p className="text-sm text-neutral-600">
                      Margin: {((mockCashFlowData.reduce((sum, f) => sum + f.net, 0) / mockCashFlowData.reduce((sum, f) => sum + f.inflow, 0)) * 100).toFixed(1)}%
                    </p>
                  </div>

                  <div className="pt-4 border-t border-neutral-200">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-neutral-600">Cash Flow Trend</span>
                      <span className="text-status-success-600 font-medium">↗ Positive</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;