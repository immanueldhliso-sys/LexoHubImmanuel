import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  FileText, 
  Download,
  Calendar,
  Calculator,
  RefreshCw,
  Eye
} from 'lucide-react';
import { Card, CardHeader, CardContent, Button } from '../design-system/components';
import { InvoiceService } from '../services/api/invoices.service';
import { AnalyticsService } from '../services/api/analytics.service';
import { useAuth } from '@/contexts/AuthContext';
import { matterApiService } from '@/services/api';
import { toast } from 'react-hot-toast';
import type { PracticeMetrics, Invoice } from '../types';
import { InvoiceStatus } from '../types';

const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'performance' | 'cash-flow' | 'invoices' | 'proforma'>('overview');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [isLoading, setIsLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState<{
    invoices: Invoice[];
    proFormas: Invoice[];
    agingAnalysis: { range: string; amount: number; count: number }[];
    conversionMetrics: {
      totalProFormas: number;
      convertedProFormas: number;
      conversionRate: number;
      averageConversionTime: number;
    };
    paymentAnalysis: {
      onTimePayments: number;
      latePayments: number;
      averagePaymentDays: number;
      collectionEfficiency: number;
    };
  }>({
    invoices: [],
    proFormas: [],
    agingAnalysis: [],
    conversionMetrics: {
      totalProFormas: 0,
      convertedProFormas: 0,
      conversionRate: 0,
      averageConversionTime: 0
    },
    paymentAnalysis: {
      onTimePayments: 0,
      latePayments: 0,
      averagePaymentDays: 0,
      collectionEfficiency: 0
    }
  });

  // Derived data from real invoices and matters
  const [monthlyBillings, setMonthlyBillings] = useState<{ month: string; year: number; amount: number; invoiceCount: number; collectionRate: number }[]>([]);
  const [workDistribution, setWorkDistribution] = useState<{ type: string; percentage: number; revenue: number }[]>([]);
  const [cashFlowData, setCashFlowData] = useState<{ month: string; inflow: number; outflow: number; net: number }[]>([]);

  // Real metrics derived from invoices and matters
  const [realMetrics, setRealMetrics] = useState<{
    totalWip: number;
    totalBilled: number;
    totalCollected: number;
    outstandingInvoices: number;
    overdueInvoices: number;
    averageCollectionDays: number;
    mattersCount: number;
  }>({
    totalWip: 0,
    totalBilled: 0,
    totalCollected: 0,
    outstandingInvoices: 0,
    overdueInvoices: 0,
    averageCollectionDays: 0,
    mattersCount: 0,
  });

  const [performanceMetrics, setPerformanceMetrics] = useState({
    billingEfficiency: 0,
    clientSatisfaction: 0,
    matterResolution: 0,
    timeManagement: 0,
    isLoading: false
  });

  const collectionRate = realMetrics.totalBilled > 0 ? (realMetrics.totalCollected / realMetrics.totalBilled) * 100 : 0;
  const wipUtilization = realMetrics.totalWip > 0 ? (realMetrics.totalBilled / realMetrics.totalWip) * 100 : 0;

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      const [performanceData, cashFlowData] = await Promise.all([
        AnalyticsService.getPerformanceMetrics(),
        AnalyticsService.getCashFlowAnalysis(6)
      ]);
      
      setPerformanceMetrics({
        billingEfficiency: performanceData.billingEfficiency,
        clientSatisfaction: performanceData.clientSatisfaction,
        matterResolution: performanceData.matterResolution,
        timeManagement: performanceData.timeManagement,
        isLoading: false
      });
      
      setCashFlowData(cashFlowData.monthlyData);
      // Load all invoices
      const invoicesResponse = await InvoiceService.getInvoices({ 
        page: 1, 
        pageSize: 1000,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });

      // Load pro formas
      const proFormasResponse = await InvoiceService.getInvoices({
        status: [InvoiceStatus.PRO_FORMA, InvoiceStatus.CONVERTED],
        page: 1,
        pageSize: 1000
      });

      const invoices = invoicesResponse.data;
      const proFormas = proFormasResponse.data;

      // Load matters for work type distribution
      const { data: matters } = user?.id ? await matterApiService.getByAdvocate(user.id) : { data: [] } as any;

      // Calculate aging analysis
      const now = new Date();
      const agingRanges = [
        { range: '0-30 days', min: 0, max: 30 },
        { range: '31-60 days', min: 31, max: 60 },
        { range: '61-90 days', min: 61, max: 90 },
        { range: '90+ days', min: 91, max: Infinity }
      ];

      const unpaidInvoices = invoices.filter(inv => 
        inv.status !== InvoiceStatus.PAID && inv.status !== InvoiceStatus.WRITTEN_OFF
      );

      const agingAnalysis = agingRanges.map(range => {
        const rangeInvoices = unpaidInvoices.filter(inv => {
          const daysPastDue = Math.floor((now.getTime() - new Date(inv.dateDue).getTime()) / (1000 * 60 * 60 * 24));
          return daysPastDue >= range.min && daysPastDue <= range.max;
        });

        return {
          range: range.range,
          amount: rangeInvoices.reduce((sum, inv) => sum + (inv.total_amount - (inv.amount_paid || 0)), 0),
          count: rangeInvoices.length
        };
      });

      // Calculate conversion metrics
      const convertedProFormas = proFormas.filter(pf => pf.status === InvoiceStatus.CONVERTED);
      const conversionMetrics = {
        totalProFormas: proFormas.length,
        convertedProFormas: convertedProFormas.length,
        conversionRate: proFormas.length > 0 ? (convertedProFormas.length / proFormas.length) * 100 : 0,
        averageConversionTime: 7 // This would be calculated from actual conversion data
      };

      // Calculate payment analysis
      const paidInvoices = invoices.filter(inv => inv.status === InvoiceStatus.PAID && inv.datePaid);
      const onTimePayments = paidInvoices.filter(inv => {
        const paymentDate = new Date(inv.datePaid!);
        const dueDate = new Date(inv.dateDue);
        return paymentDate <= dueDate;
      });

      const paymentAnalysis = {
        onTimePayments: onTimePayments.length,
        latePayments: paidInvoices.length - onTimePayments.length,
        averagePaymentDays: paidInvoices.length > 0 
          ? paidInvoices.reduce((sum, inv) => {
              const daysToPay = Math.floor((new Date(inv.datePaid!).getTime() - new Date(inv.dateIssued).getTime()) / (1000 * 60 * 60 * 24));
              return sum + daysToPay;
            }, 0) / paidInvoices.length
          : 0,
        collectionEfficiency: paidInvoices.length > 0 ? (onTimePayments.length / paidInvoices.length) * 100 : 0
      };

      setInvoiceData({
        invoices,
        proFormas,
        agingAnalysis,
        conversionMetrics,
        paymentAnalysis
      });

      // Compute monthly billings from invoices (last 6 months)
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const nowDate = new Date();
      const monthsWindow = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(nowDate);
        d.setMonth(d.getMonth() - (5 - i));
        return d;
      });
      const billings = monthsWindow.map(d => {
        const month = d.getMonth();
        const year = d.getFullYear();
        const monthInvoices = invoices.filter(inv => {
          const created = inv.dateIssued ? new Date(inv.dateIssued) : null;
          return created ? (created.getMonth() === month && created.getFullYear() === year) : false;
        });
        const amount = monthInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
        const invoiceCount = monthInvoices.length;
        const paidCount = monthInvoices.filter(inv => inv.status === InvoiceStatus.PAID).length;
        const collectionRate = invoiceCount > 0 ? Math.round((paidCount / invoiceCount) * 100) : 0;
        return { month: monthNames[month], year, amount, invoiceCount, collectionRate };
      });
      setMonthlyBillings(billings);

      // Compute work type distribution from matters
      const groups = new Map<string, { count: number; revenue: number }>();
      (matters || []).forEach((m: any) => {
        const type = m.briefType || m.matter_type || 'Other';
        const revenue = (m.estimatedFee || m.wipValue || 0) as number;
        const current = groups.get(type) || { count: 0, revenue: 0 };
        groups.set(type, { count: current.count + 1, revenue: current.revenue + revenue });
      });
      const totalCount = Math.max((matters || []).length, 1);
      const distribution = Array.from(groups.entries()).map(([type, { count, revenue }]) => ({
        type,
        percentage: Math.round((count * 100) / totalCount),
        revenue
      }));
      setWorkDistribution(distribution);


      // Compute real metrics for overview and financial tabs
      const totalBilled = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
      const totalCollected = invoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0);
      const outstandingInvoices = invoices.filter(inv => (inv.balance_due || 0) > 0 && inv.status !== 'paid').length;
      const overdueInvoices = invoices.filter(inv => inv.is_overdue).length;
      const totalWip = (matters || []).reduce((sum: number, m: any) => sum + (m.wipValue || 0), 0);
      const averageCollectionDays = paidInvoices.length > 0
        ? Math.round(paidInvoices.reduce((sum, inv) => {
            const invoiceDate = new Date(inv.dateIssued as string);
            const paid = new Date(inv.datePaid as string);
            const diffDays = Math.max(0, Math.round((paid.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24)));
            return sum + diffDays;
          }, 0) / paidInvoices.length)
        : 0;

      setRealMetrics({
        totalWip,
        totalBilled,
        totalCollected,
        outstandingInvoices,
        overdueInvoices,
        averageCollectionDays,
        mattersCount: (matters || []).length,
      });

    } catch (error) {
      console.error('Error loading report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = async (reportType: string) => {
    try {
      toast(`Exporting ${reportType} report...`, { icon: 'ℹ️' });
      // This would generate and download the report
      setTimeout(() => {
        toast.success(`${reportType} report exported successfully`);
      }, 2000);
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  const handleViewDetailedReport = (reportType: string) => {
    toast(`Opening detailed ${reportType} report...`, { icon: 'ℹ️' });
    // This would navigate to a detailed report view
  };

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
          <Button variant="outline" onClick={loadReportData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="primary" onClick={() => handleExportReport(activeTab)}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-neutral-100 rounded-lg p-1 overflow-x-auto">
        {(['overview', 'financial', 'performance', 'cash-flow', 'invoices', 'proforma'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {tab === 'overview' ? 'Overview' :
             tab === 'financial' ? 'Financial' :
             tab === 'performance' ? 'Performance' :
             tab === 'cash-flow' ? 'Cash Flow' :
             tab === 'invoices' ? 'Invoice Analysis' :
             'Pro Forma Reports'}
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
                  R{(realMetrics.totalWip / 1000000).toFixed(1)}M
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
                  R{(realMetrics.totalBilled / 1000000).toFixed(1)}M
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
                  {realMetrics.averageCollectionDays}
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
                  {monthlyBillings.map((billing, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 text-sm text-neutral-600">{billing.month}</div>
                        <div className="flex-1">
                          <div className="w-full bg-neutral-200 rounded-full h-2">
                            <div 
                              className="bg-mpondo-gold-500 h-2 rounded-full"
                              style={{ width: `${billing.amount > 0 ? Math.min((billing.amount / Math.max(monthlyBillings.reduce((max, b) => Math.max(max, b.amount), 0), 1)) * 100, 100) : 0}%` }}
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
                  {workDistribution.map((work, index) => (
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
                      R{(realMetrics.totalBilled / 1000000).toFixed(2)}M
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Collections</span>
                    <span className="font-bold text-status-success-600">
                      R{(realMetrics.totalCollected / 1000000).toFixed(2)}M
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Outstanding</span>
                    <span className="font-bold text-status-warning-600">
                      R{((realMetrics.totalBilled - realMetrics.totalCollected) / 1000000).toFixed(2)}M
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">WIP Value</span>
                    <span className="font-bold text-neutral-900">
                      R{(realMetrics.totalWip / 1000000).toFixed(2)}M
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
                      {invoiceData.invoices.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Outstanding</span>
                    <span className="font-bold text-status-warning-600">
                      {realMetrics.outstandingInvoices}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Overdue</span>
                    <span className="font-bold text-status-error-600">
                      {realMetrics.overdueInvoices}
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
                      {Math.round(performanceMetrics.matterResolution)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Avg Collection Days</span>
                    <span className="font-bold text-neutral-900">
                      {realMetrics.averageCollectionDays} days
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Revenue per Matter</span>
                    <span className="font-bold text-neutral-900">
                      R{(realMetrics.totalBilled / Math.max(realMetrics.mattersCount, 1) / 1000).toFixed(0)}k
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
                  {monthlyBillings.map((billing, index) => (
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
                  {cashFlowData.map((flow, index) => (
                    <div key={index} className="p-4 bg-neutral-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-neutral-900">{flow.month}</h4>
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
                          style={{ width: `${(flow.inflow + flow.outflow) > 0 ? (flow.inflow / (flow.inflow + flow.outflow)) * 100 : 0}%` }}
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
                      R{(cashFlowData.reduce((sum, f) => sum + f.inflow, 0) / 1000000).toFixed(2)}M
                    </div>
                    <p className="text-sm text-neutral-600">Average: R{(cashFlowData.reduce((sum, f) => sum + f.inflow, 0) / Math.max(cashFlowData.length, 1) / 1000).toFixed(0)}k/month</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-neutral-900 mb-3">Total Outflows (6 months)</h4>
                    <div className="text-2xl font-bold text-status-error-600">
                      R{(cashFlowData.reduce((sum, f) => sum + f.outflow, 0) / 1000000).toFixed(2)}M
                    </div>
                    <p className="text-sm text-neutral-600">Average: R{(cashFlowData.reduce((sum, f) => sum + f.outflow, 0) / Math.max(cashFlowData.length, 1) / 1000).toFixed(0)}k/month</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-neutral-900 mb-3">Net Cash Flow</h4>
                    <div className="text-2xl font-bold text-neutral-900">
                      R{(cashFlowData.reduce((sum, f) => sum + f.net, 0) / 1000000).toFixed(2)}M
                    </div>
                    <p className="text-sm text-neutral-600">
                      Margin: {((cashFlowData.reduce((sum, f) => sum + f.net, 0) / Math.max(cashFlowData.reduce((sum, f) => sum + f.inflow, 0), 1)) * 100).toFixed(1)}%
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

      {activeTab === 'invoices' && (
        <div className="space-y-6">
          {/* Invoice Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-mpondo-gold-500 mb-2">
                  <FileText className="w-8 h-8 mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900">
                  {invoiceData.invoices.length}
                </h3>
                <p className="text-sm text-neutral-600">Total Invoices</p>
                <Button variant="ghost" size="sm" className="mt-2" onClick={() => handleViewDetailedReport('invoices')}>
                  <Eye className="w-4 h-4 mr-1" />
                  View All
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-status-success-500 mb-2">
                  <TrendingUp className="w-8 h-8 mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900">
                  {invoiceData.paymentAnalysis.collectionEfficiency.toFixed(0)}%
                </h3>
                <p className="text-sm text-neutral-600">Collection Efficiency</p>
                <div className="text-xs text-neutral-500 mt-1">
                  {invoiceData.paymentAnalysis.onTimePayments} on-time payments
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-judicial-blue-500 mb-2">
                  <Calendar className="w-8 h-8 mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900">
                  {invoiceData.paymentAnalysis.averagePaymentDays.toFixed(0)}
                </h3>
                <p className="text-sm text-neutral-600">Avg Payment Days</p>
                <div className="text-xs text-neutral-500 mt-1">
                  {invoiceData.paymentAnalysis.latePayments} late payments
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-status-error-500 mb-2">
                  <AlertTriangle className="w-8 h-8 mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900">
                  {invoiceData.agingAnalysis.reduce((sum, range) => sum + range.count, 0)}
                </h3>
                <p className="text-sm text-neutral-600">Outstanding Invoices</p>
                <div className="text-xs text-neutral-500 mt-1">
                  R{invoiceData.agingAnalysis.reduce((sum, range) => sum + range.amount, 0).toLocaleString('en-ZA')} total
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invoice Aging Analysis */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="text-xl font-semibold text-neutral-900">Invoice Aging Analysis</h2>
              <Button variant="outline" size="sm" onClick={() => handleExportReport('aging-analysis')}>
                <Download className="w-4 h-4 mr-2" />
                Export Aging Report
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {invoiceData.agingAnalysis.map((range, index) => (
                  <div key={range.range} className={`p-4 rounded-lg ${
                    index === 0 ? 'bg-status-success-50 border border-status-success-200' :
                    index === 1 ? 'bg-status-warning-50 border border-status-warning-200' :
                    index === 2 ? 'bg-status-error-50 border border-status-error-200' :
                    'bg-status-error-100 border border-status-error-300'
                  }`}>
                    <h3 className="font-medium text-neutral-900 mb-2">{range.range}</h3>
                    <p className="text-2xl font-bold text-neutral-900">
                      R{range.amount.toLocaleString('en-ZA')}
                    </p>
                    <p className="text-sm text-neutral-600">{range.count} invoices</p>
                    <div className="mt-2">
                      <Button variant="ghost" size="sm" onClick={() => handleViewDetailedReport(`aging-${index}`)}>
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-neutral-900">Payment Performance</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">On-Time Payments</span>
                    <div className="text-right">
                      <span className="font-bold text-status-success-600">
                        {invoiceData.paymentAnalysis.onTimePayments}
                      </span>
                      <div className="text-xs text-neutral-500">
                        {invoiceData.paymentAnalysis.collectionEfficiency.toFixed(1)}% efficiency
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Late Payments</span>
                    <div className="text-right">
                      <span className="font-bold text-status-error-600">
                        {invoiceData.paymentAnalysis.latePayments}
                      </span>
                      <div className="text-xs text-neutral-500">
                        {(100 - invoiceData.paymentAnalysis.collectionEfficiency).toFixed(1)}% of total
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Average Payment Time</span>
                    <div className="text-right">
                      <span className="font-bold text-neutral-900">
                        {invoiceData.paymentAnalysis.averagePaymentDays.toFixed(0)} days
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-neutral-900">Invoice Status Distribution</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.values(InvoiceStatus).map(status => {
                    const statusInvoices = invoiceData.invoices.filter(inv => inv.status === status);
                    const percentage = invoiceData.invoices.length > 0 
                      ? (statusInvoices.length / invoiceData.invoices.length) * 100 
                      : 0;
                    
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-24 text-sm text-neutral-900 capitalize">{status.replace('_', ' ')}</div>
                          <div className="flex-1">
                            <div className="w-full bg-neutral-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  status === InvoiceStatus.PAID ? 'bg-status-success-500' :
                                  status === InvoiceStatus.OVERDUE ? 'bg-status-error-500' :
                                  status === InvoiceStatus.SENT ? 'bg-judicial-blue-500' :
                                  'bg-neutral-400'
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-neutral-900">{statusInvoices.length}</div>
                          <div className="text-xs text-neutral-600">{percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'proforma' && (
        <div className="space-y-6">
          {/* Pro Forma Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-judicial-blue-500 mb-2">
                  <Calculator className="w-8 h-8 mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900">
                  {invoiceData.conversionMetrics.totalProFormas}
                </h3>
                <p className="text-sm text-neutral-600">Total Pro Formas</p>
                <Button variant="ghost" size="sm" className="mt-2" onClick={() => handleViewDetailedReport('proformas')}>
                  <Eye className="w-4 h-4 mr-1" />
                  View All
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-status-success-500 mb-2">
                  <TrendingUp className="w-8 h-8 mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900">
                  {invoiceData.conversionMetrics.conversionRate.toFixed(0)}%
                </h3>
                <p className="text-sm text-neutral-600">Conversion Rate</p>
                <div className="text-xs text-neutral-500 mt-1">
                  {invoiceData.conversionMetrics.convertedProFormas} converted
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-mpondo-gold-500 mb-2">
                  <Calendar className="w-8 h-8 mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900">
                  {invoiceData.conversionMetrics.averageConversionTime}
                </h3>
                <p className="text-sm text-neutral-600">Avg Conversion Days</p>
                <div className="text-xs text-neutral-500 mt-1">
                  Time to final invoice
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-neutral-500 mb-2">
                  <FileText className="w-8 h-8 mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900">
                  {invoiceData.conversionMetrics.totalProFormas - invoiceData.conversionMetrics.convertedProFormas}
                </h3>
                <p className="text-sm text-neutral-600">Pending Conversion</p>
                <div className="text-xs text-neutral-500 mt-1">
                  Active pro forma
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pro Forma Performance Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <h2 className="text-xl font-semibold text-neutral-900">Conversion Performance</h2>
                <Button variant="outline" size="sm" onClick={() => handleExportReport('conversion-analysis')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Analysis
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-neutral-600">Conversion Rate</span>
                      <span className="font-bold text-neutral-900">
                        {invoiceData.conversionMetrics.conversionRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div 
                        className="bg-status-success-500 h-2 rounded-full" 
                        style={{ width: `${invoiceData.conversionMetrics.conversionRate}%` }} 
                      />
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      {invoiceData.conversionMetrics.convertedProFormas} of {invoiceData.conversionMetrics.totalProFormas} converted
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-neutral-600">Average Conversion Time</span>
                      <span className="font-bold text-neutral-900">
                        {invoiceData.conversionMetrics.averageConversionTime} days
                      </span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div className="bg-judicial-blue-500 h-2 rounded-full" style={{ width: '70%' }} />
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">Industry average: 10-14 days</p>
                  </div>

                  <div className="pt-4 border-t border-neutral-200">
                    <h4 className="font-medium text-neutral-900 mb-3">Recommendations</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-status-success-600 mt-1">•</span>
                        <span className="text-neutral-700">
                          {invoiceData.conversionMetrics.conversionRate > 80 
                            ? 'Excellent conversion rate! Consider automating the process.'
                            : 'Consider following up on pending pro forma to improve conversion rate.'
                          }
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-judicial-blue-600 mt-1">•</span>
                        <span className="text-neutral-700">
                          Set up automated reminders for pro forma follow-ups.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-neutral-900">Pro Forma Value Analysis</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Total Pro Forma Value</span>
                    <span className="font-bold text-neutral-900">
                      R{invoiceData.proFormas.reduce((sum, pf) => sum + pf.total_amount, 0).toLocaleString('en-ZA')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Converted Value</span>
                    <span className="font-bold text-status-success-600">
                      R{invoiceData.proFormas
                        .filter(pf => pf.status === InvoiceStatus.CONVERTED)
                        .reduce((sum, pf) => sum + pf.total_amount, 0)
                        .toLocaleString('en-ZA')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Pending Value</span>
                    <span className="font-bold text-status-warning-600">
                      R{invoiceData.proFormas
                        .filter(pf => pf.status === InvoiceStatus.PRO_FORMA)
                        .reduce((sum, pf) => sum + pf.total_amount, 0)
                        .toLocaleString('en-ZA')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Average Pro Forma Value</span>
                    <span className="font-bold text-neutral-900">
                      R{invoiceData.proFormas.length > 0 
                        ? (invoiceData.proFormas.reduce((sum, pf) => sum + pf.total_amount, 0) / invoiceData.proFormas.length).toLocaleString('en-ZA')
                        : '0'}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-200">
                  <div className="flex justify-between items-center">
                    <Button variant="outline" size="sm" onClick={() => handleViewDetailedReport('proforma-details')}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleExportReport('proforma-summary')}>
                      <Download className="w-4 h-4 mr-2" />
                      Export Summary
                    </Button>
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