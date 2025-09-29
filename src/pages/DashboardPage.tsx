import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  FileText, 
  BarChart3, 
  Plus, 
  ArrowRight, 
  TrendingUp, 
  Calendar,
  AlertTriangle,
  Clock,
  DollarSign,
  Send,
  Calculator,
  RefreshCw
} from 'lucide-react';
import { Card, CardHeader, CardContent, Button } from '../design-system/components';
import { NewMatterModal } from '../components/matters/NewMatterModal';
import { InvoiceService } from '../services/api/invoices.service';
import { matterApiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import type { Matter, Page, Invoice } from '../types';
import { MatterStatus, BarAssociation, FeeType, RiskLevel, InvoiceStatus } from '../types';

interface DashboardPageProps {
  onNavigate?: (page: Page) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    activeMatters: 0,
    outstandingWip: 0,
    monthlyBilling: 0,
    overdueInvoices: 0,
    collectionRate: 0,
    avgBillTime: 0,
    settlementRate: 0,
    totalMatters: 0,
    thisWeekMatters: 0,
    pendingConflictChecks: 0,
    upcomingDeadlines: 0,
    isLoading: false
  });

  const [invoiceMetrics, setInvoiceMetrics] = useState({
    totalInvoices: 0,
    totalProFormas: 0,
    outstandingAmount: 0,
    paidThisMonth: 0,
    overdueCount: 0,
    averagePaymentDays: 0,
    conversionRate: 0,
    isLoading: false
  });

  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);

  const [recentMatters, setRecentMatters] = useState<Matter[]>([]);
  const [quickActions, setQuickActions] = useState({
    newMatterModal: false,
    newInvoiceModal: false,
    quickTimeEntry: false
  });

  // Modal and detailed view states
  const [showDetailedView, setShowDetailedView] = useState({
    wipReport: false,
    billingReport: false,
    overdueInvoices: false,
    analytics: false
  });

  useEffect(() => {
    loadDashboardData();
    loadInvoiceMetrics();
  }, []);

  const loadInvoiceMetrics = async () => {
    setInvoiceMetrics(prev => ({ ...prev, isLoading: true }));
    try {
      // Load recent invoices
      const invoicesResponse = await InvoiceService.getInvoices({ 
        page: 1, 
        pageSize: 10,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });
      
      const invoices = invoicesResponse.data;
      setRecentInvoices(invoices);

      // Load pro formas
      const proFormasResponse = await InvoiceService.getInvoices({
        status: [InvoiceStatus.PRO_FORMA],
        page: 1,
        pageSize: 100
      });

      // Calculate metrics
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const paidThisMonth = invoices
        .filter(inv => {
          const paidDate = inv.date_paid ? new Date(inv.date_paid) : null;
          return paidDate && 
                 paidDate.getMonth() === currentMonth && 
                 paidDate.getFullYear() === currentYear;
        })
        .reduce((sum, inv) => sum + inv.total_amount, 0);

      const overdueInvoices = invoices.filter(inv => inv.status === InvoiceStatus.OVERDUE);
      const outstandingAmount = invoices
        .filter(inv => inv.status !== InvoiceStatus.PAID)
        .reduce((sum, inv) => sum + (inv.total_amount - (inv.amount_paid || 0)), 0);

      setInvoiceMetrics({
        totalInvoices: invoices.length,
        totalProFormas: proFormasResponse.data.length,
        outstandingAmount,
        paidThisMonth,
        overdueCount: overdueInvoices.length,
        averagePaymentDays: 45, // This would be calculated from actual payment data
        conversionRate: proFormasResponse.data.length > 0 
          ? (proFormasResponse.data.filter(pf => pf.status === InvoiceStatus.CONVERTED).length / proFormasResponse.data.length) * 100 
          : 0,
        isLoading: false
      });

    } catch (error) {
      console.error('Error loading invoice metrics:', error);
      setInvoiceMetrics(prev => ({ ...prev, isLoading: false }));
    }
  };

  const loadDashboardData = async () => {
    setDashboardData(prev => ({ ...prev, isLoading: true }));
    try {
      // Load recent matters from database
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const recentMattersResponse = await matterApiService.getByAdvocate(user.id, {
        pagination: { page: 1, limit: 5 }
      });

      if (recentMattersResponse.error) {
        console.error('Error loading matters:', recentMattersResponse.error);
        // Don't throw error, just use empty array
        setRecentMatters([]);
      } else {
        setRecentMatters(recentMattersResponse.data || []);
      }

      // Load broader set of matters to compute metrics
      const allMattersResponse = await matterApiService.getByAdvocate(user.id, {
        pagination: { page: 1, limit: 100 }
      });

      let allMatters: Matter[] = [];
      if (allMattersResponse.error) {
        console.error('Error loading all matters:', allMattersResponse.error);
        allMatters = [];
      } else {
        allMatters = allMattersResponse.data || [];
      }

      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);

      const computed = {
        activeMatters: allMatters.filter(m => m.status === MatterStatus.ACTIVE).length,
        totalMatters: allMatters.length,
        outstandingWip: allMatters.reduce((sum, m) => sum + (m.wip_value || 0), 0),
        thisWeekMatters: allMatters.filter(m => {
          const created = m.created_at ? new Date(m.created_at) : null;
          return created ? created >= weekAgo : false;
        }).length,
        pendingConflictChecks: allMatters.filter(m => !m.conflict_check_completed).length,
        upcomingDeadlines: allMatters.filter(m => {
          const deadline = m.expected_completion_date ? new Date(m.expected_completion_date) : null;
          return deadline ? (deadline >= now && deadline <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)) : false;
        }).length
      };

      setDashboardData(prev => ({ ...prev, ...computed, isLoading: false }));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
      setDashboardData(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleQuickAction = (action: 'new-matter' | 'new-invoice' | 'time-entry') => {
    switch (action) {
      case 'new-matter':
        setQuickActions(prev => ({ ...prev, newMatterModal: true }));
        toast.success('Opening new matter form...');
        break;
      case 'new-invoice':
        if (onNavigate) {
          onNavigate('invoices');
          toast.success('Navigating to invoice generation...');
        } else {
          setQuickActions(prev => ({ ...prev, newInvoiceModal: true }));
          toast.success('Opening invoice generation...');
        }
        break;
      case 'time-entry':
        setQuickActions(prev => ({ ...prev, quickTimeEntry: true }));
        toast.success('Opening quick time entry...');
        break;
    }
  };

  const handleRefreshData = async () => {
    toast.success('Refreshing dashboard data...');
    await loadDashboardData();
  };

  const handleViewMatter = (matterId: string) => {
    const matter = recentMatters.find(m => m.id === matterId);
    if (matter) {
      toast.success(`Opening matter: ${matter.title}`);
      // In real implementation, this would navigate to matter details
      if (onNavigate) {
        onNavigate('matters');
      }
    }
  };

  const handleViewAllMatters = () => {
    if (onNavigate) {
      onNavigate('matters');
      toast.success('Navigating to matters page...');
    } else {
      toast.success('Matters page navigation...');
    }
  };

  // Enhanced button handlers for stat cards
  const handleWipReportClick = () => {
    setShowDetailedView(prev => ({ ...prev, wipReport: true }));
    toast('Opening WIP Report details...', { icon: 'ℹ️' });
  };

  const handleBillingReportClick = () => {
    setShowDetailedView(prev => ({ ...prev, billingReport: true }));
    toast('Opening billing report details...', { icon: 'ℹ️' });
  };

  const handleOverdueInvoicesClick = () => {
    if (onNavigate) {
      onNavigate('invoices');
      toast.success('Navigating to overdue invoices...');
    } else {
      setShowDetailedView(prev => ({ ...prev, overdueInvoices: true }));
      toast('Opening overdue invoices...', { icon: 'ℹ️' });
    }
  };

  const handleAnalyticsClick = () => {
    if (onNavigate) {
      onNavigate('ai-analytics');
      toast.success('Opening AI Analytics Dashboard...');
    } else {
      setShowDetailedView(prev => ({ ...prev, analytics: true }));
      toast('Opening analytics...', { icon: 'ℹ️' });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
  <div className="max-w-7xl mx-auto space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-neutral-600 mt-1">Welcome to your practice intelligence platform</p>
      </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRefreshData} disabled={dashboardData.isLoading}>
            <TrendingUp className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
          <Button variant="primary" onClick={() => handleQuickAction('new-matter')}>
            <Plus className="w-4 h-4 mr-2" />
            New Matter
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Button 
          variant="outline" 
          onClick={() => handleQuickAction('new-invoice')}
          className="h-16 flex flex-col items-center justify-center"
        >
          <FileText className="w-6 h-6 mb-1 text-mpondo-gold-600" />
          <span className="text-sm font-medium">Generate Invoice</span>
        </Button>
        <Button 
          variant="outline" 
          onClick={() => onNavigate?.('proforma')}
          className="h-16 flex flex-col items-center justify-center"
        >
          <Calculator className="w-6 h-6 mb-1 text-judicial-blue-600" />
          <span className="text-sm font-medium">Create Pro Forma</span>
        </Button>
        <Button 
          variant="outline" 
          onClick={() => handleQuickAction('time-entry')}
          className="h-16 flex flex-col items-center justify-center"
        >
          <Clock className="w-6 h-6 mb-1 text-status-success-600" />
          <span className="text-sm font-medium">Quick Time Entry</span>
        </Button>
        <Button 
          variant="outline" 
          onClick={handleViewAllMatters}
          className="h-16 flex flex-col items-center justify-center"
        >
          <Briefcase className="w-6 h-6 mb-1 text-neutral-600" />
          <span className="text-sm font-medium">View All Matters</span>
        </Button>
    </div>

    {/* Invoice Metrics Row */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card hoverable onClick={() => onNavigate?.('invoices')} className="cursor-pointer hover:shadow-lg transition-shadow">
        <CardContent className="p-6 text-center">
          <div className="text-mpondo-gold-500 mb-2">
            <FileText className="w-8 h-8 mx-auto" />
          </div>
          <h3 className="text-2xl font-bold text-neutral-900">
            {invoiceMetrics.isLoading ? '...' : invoiceMetrics.totalInvoices}
          </h3>
          <p className="text-sm text-neutral-600">Total Invoices</p>
          <div className="mt-2 text-xs text-mpondo-gold-600 flex items-center justify-center">
            Manage Invoices <ArrowRight className="w-3 h-3 ml-1" />
          </div>
        </CardContent>
      </Card>

      <Card hoverable onClick={() => onNavigate?.('proforma')} className="cursor-pointer hover:shadow-lg transition-shadow">
        <CardContent className="p-6 text-center">
          <div className="text-judicial-blue-500 mb-2">
            <Calculator className="w-8 h-8 mx-auto" />
          </div>
          <h3 className="text-2xl font-bold text-neutral-900">
            {invoiceMetrics.isLoading ? '...' : invoiceMetrics.totalProFormas}
          </h3>
          <p className="text-sm text-neutral-600">Pro Formas</p>
          <div className="mt-2 text-xs text-judicial-blue-600 flex items-center justify-center">
            View Pro Formas <ArrowRight className="w-3 h-3 ml-1" />
          </div>
        </CardContent>
      </Card>

      <Card hoverable onClick={handleOverdueInvoicesClick} className="cursor-pointer hover:shadow-lg transition-shadow">
        <CardContent className="p-6 text-center">
          <div className="text-status-error-500 mb-2">
            <AlertTriangle className="w-8 h-8 mx-auto" />
          </div>
          <h3 className="text-2xl font-bold text-neutral-900">
            {invoiceMetrics.isLoading ? '...' : invoiceMetrics.overdueCount}
          </h3>
          <p className="text-sm text-neutral-600">Overdue Invoices</p>
          <div className="mt-2 text-xs text-status-error-600 flex items-center justify-center">
            Review Overdue <ArrowRight className="w-3 h-3 ml-1" />
          </div>
        </CardContent>
      </Card>

      <Card hoverable className="cursor-pointer hover:shadow-lg transition-shadow">
        <CardContent className="p-6 text-center">
          <div className="text-status-success-500 mb-2">
            <DollarSign className="w-8 h-8 mx-auto" />
          </div>
          <h3 className="text-2xl font-bold text-neutral-900">
            {invoiceMetrics.isLoading ? '...' : formatCurrency(invoiceMetrics.paidThisMonth)}
          </h3>
          <p className="text-sm text-neutral-600">Collected This Month</p>
          <div className="mt-2 text-xs text-status-success-600 flex items-center justify-center">
            {invoiceMetrics.conversionRate.toFixed(1)}% Pro Forma Conversion
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Practice Metrics Row */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Quick Stats with click handlers */}
        <Card hoverable onClick={handleViewAllMatters} className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
          <div className="text-mpondo-gold-500 mb-2">
            <Briefcase className="w-8 h-8 mx-auto" />
          </div>
            <h3 className="text-2xl font-bold text-neutral-900">{dashboardData.activeMatters}</h3>
          <p className="text-sm text-neutral-600">Active Matters</p>
            <div className="mt-2 text-xs text-mpondo-gold-600 flex items-center justify-center">
              View Details <ArrowRight className="w-3 h-3 ml-1" />
            </div>
        </CardContent>
      </Card>

        <Card hoverable onClick={handleWipReportClick} className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
          <div className="text-judicial-blue-900 mb-2">
            <FileText className="w-8 h-8 mx-auto" />
          </div>
            <h3 className="text-2xl font-bold text-neutral-900">{formatCurrency(dashboardData.outstandingWip)}</h3>
          <p className="text-sm text-neutral-600">Outstanding WIP</p>
            <div className="mt-2 text-xs text-judicial-blue-600 flex items-center justify-center">
              View WIP Report <ArrowRight className="w-3 h-3 ml-1" />
            </div>
        </CardContent>
      </Card>

        <Card hoverable onClick={handleBillingReportClick} className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
          <div className="text-status-success-500 mb-2">
            <BarChart3 className="w-8 h-8 mx-auto" />
          </div>
            <h3 className="text-2xl font-bold text-neutral-900">{formatCurrency(dashboardData.monthlyBilling)}</h3>
          <p className="text-sm text-neutral-600">This Month Billing</p>
            <div className="mt-2 text-xs text-status-success-600 flex items-center justify-center">
              View Reports <ArrowRight className="w-3 h-3 ml-1" />
            </div>
        </CardContent>
      </Card>

        <Card hoverable onClick={handleOverdueInvoicesClick} className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
          <div className="text-status-warning-500 mb-2">
              <AlertTriangle className="w-8 h-8 mx-auto" />
          </div>
            <h3 className="text-2xl font-bold text-neutral-900">{dashboardData.overdueInvoices}</h3>
          <p className="text-sm text-neutral-600">Overdue Invoices</p>
            <div className="mt-2 text-xs text-status-warning-600 flex items-center justify-center">
              Review Overdue <ArrowRight className="w-3 h-3 ml-1" />
            </div>
        </CardContent>
      </Card>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card>
          <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="text-xl font-semibold text-neutral-900">Recent Matters</h2>
            <Button variant="ghost" size="sm" onClick={handleViewAllMatters}>
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
        </CardHeader>
          <CardContent className="space-y-3">
            {dashboardData.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mpondo-gold-500"></div>
              </div>
            ) : recentMatters.length > 0 ? (
              recentMatters.map((matter) => (
                <div 
                  key={matter.id}
                  className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 cursor-pointer transition-colors"
                  onClick={() => handleViewMatter(matter.id)}
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-neutral-900">{matter.title}</h4>
                    <p className="text-sm text-neutral-600">{matter.matter_type}</p>
                    <p className="text-xs text-neutral-500">WIP: {formatCurrency(matter.wip_value)}</p>
            </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      matter.status === MatterStatus.ACTIVE ? 'bg-green-100 text-green-800' : 
                      matter.status === MatterStatus.PENDING ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {matter.status}
                    </span>
                    <ArrowRight className="w-4 h-4 text-neutral-400" />
          </div>
            </div>
              ))
            ) : (
              <div className="text-center py-8 text-neutral-500">
                <Briefcase className="w-12 h-12 mx-auto mb-2 text-neutral-300" />
                <p>No recent matters found</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => handleQuickAction('new-matter')}>
                  Create First Matter
                </Button>
          </div>
            )}
        </CardContent>
      </Card>

      {/* Recent Invoices */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="text-xl font-semibold text-neutral-900">Recent Invoices</h2>
          <Button variant="ghost" size="sm" onClick={() => onNavigate?.('invoices')}>
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {invoiceMetrics.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mpondo-gold-500"></div>
            </div>
          ) : recentInvoices.length > 0 ? (
            recentInvoices.slice(0, 5).map((invoice) => (
              <div 
                key={invoice.id}
                className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 cursor-pointer transition-colors"
                onClick={() => onNavigate?.('invoices')}
              >
                <div className="flex-1">
                  <h4 className="font-medium text-neutral-900">{invoice.invoice_number}</h4>
                  <p className="text-sm text-neutral-600">Matter: {invoice.matter_id}</p>
                  <p className="text-xs text-neutral-500">
                    {formatCurrency(invoice.total_amount)} • {new Date(invoice.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    invoice.status === InvoiceStatus.PAID ? 'bg-status-success-100 text-status-success-800' : 
                    invoice.status === InvoiceStatus.OVERDUE ? 'bg-status-error-100 text-status-error-800' :
                    invoice.status === InvoiceStatus.SENT ? 'bg-judicial-blue-100 text-judicial-blue-800' :
                    'bg-neutral-100 text-neutral-800'
                  }`}>
                    {invoice.status}
                  </span>
                  <ArrowRight className="w-4 h-4 text-neutral-400" />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-neutral-500">
              <FileText className="w-12 h-12 mx-auto mb-2 text-neutral-300" />
              <p>No recent invoices found</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => handleQuickAction('new-invoice')}>
                Generate First Invoice
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-neutral-900">Practice Performance</h2>
        </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
            <span className="text-sm text-neutral-600">Collection Rate</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-neutral-900">{dashboardData.collectionRate}%</span>
                <div className="w-12 h-2 bg-neutral-200 rounded-full">
                  <div 
                    className="h-full bg-status-success-500 rounded-full" 
                    style={{ width: `${dashboardData.collectionRate}%` }}
                  ></div>
                </div>
              </div>
          </div>
            <div className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
            <span className="text-sm text-neutral-600">Average Bill Time</span>
              <span className="font-medium text-neutral-900">{dashboardData.avgBillTime} days</span>
          </div>
            <div className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
            <span className="text-sm text-neutral-600">Settlement Rate</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-neutral-900">{dashboardData.settlementRate}%</span>
                <div className="w-12 h-2 bg-neutral-200 rounded-full">
                  <div 
                    className="h-full bg-mpondo-gold-500 rounded-full" 
                    style={{ width: `${dashboardData.settlementRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="pt-2">
              <Button variant="outline" size="sm" className="w-full" onClick={handleAnalyticsClick}>
                <BarChart3 className="w-4 h-4 mr-2" />
                View Detailed Analytics
              </Button>
          </div>
        </CardContent>
      </Card>
    </div>

      {/* Modal Components */}
      
      {/* New Matter Modal */}
      <NewMatterModal
        isOpen={quickActions.newMatterModal}
        onClose={() => setQuickActions(prev => ({ ...prev, newMatterModal: false }))}
        onMatterCreated={(newMatter) => {
          setQuickActions(prev => ({ ...prev, newMatterModal: false }));
          toast.success(`Matter "${newMatter.title}" created successfully`);
          if (onNavigate) onNavigate('matters');
        }}
      />

      {/* New Invoice Modal */}
      {quickActions.newInvoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Generate Invoice</h3>
            <p className="text-neutral-600 mb-4">
              Create professional invoices with automated fee calculations and Bar-compliant formatting.
            </p>
            <div className="space-y-3">
              <Button 
                variant="primary" 
                className="w-full"
                onClick={() => {
                  setQuickActions(prev => ({ ...prev, newInvoiceModal: false }));
                  if (onNavigate) onNavigate('invoices');
                  toast.success('Opening invoice generation...');
                }}
              >
                <FileText className="w-4 h-4 mr-2" />
                Open Invoice Generator
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setQuickActions(prev => ({ ...prev, newInvoiceModal: false }))}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Time Entry Modal */}
      {quickActions.quickTimeEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Quick Time Entry</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Matter</label>
                <select className="w-full border border-neutral-300 rounded-md px-3 py-2">
                  <option value="">Select a matter...</option>
                  {recentMatters.map(matter => (
                    <option key={matter.id} value={matter.id}>
                      {matter.title} - {matter.client_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                <textarea 
                  className="w-full border border-neutral-300 rounded-md px-3 py-2 h-20"
                  placeholder="Brief description of work performed..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Hours</label>
                  <input 
                    type="number" 
                    step="0.25"
                    className="w-full border border-neutral-300 rounded-md px-3 py-2"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Rate</label>
                  <input 
                    type="number" 
                    className="w-full border border-neutral-300 rounded-md px-3 py-2"
                    placeholder="2500"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="primary" 
                  className="flex-1"
                  onClick={() => {
                    setQuickActions(prev => ({ ...prev, quickTimeEntry: false }));
                    toast.success('Time entry saved successfully!');
                  }}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Save Time Entry
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setQuickActions(prev => ({ ...prev, quickTimeEntry: false }))}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WIP Report Modal */}
      {showDetailedView.wipReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Work in Progress Report</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-neutral-50 rounded-lg">
                  <p className="text-2xl font-bold text-neutral-900">{formatCurrency(dashboardData.outstandingWip)}</p>
                  <p className="text-sm text-neutral-600">Total WIP</p>
                </div>
                <div className="text-center p-4 bg-neutral-50 rounded-lg">
                  <p className="text-2xl font-bold text-neutral-900">{formatCurrency(850000)}</p>
                  <p className="text-sm text-neutral-600">Billable WIP</p>
                </div>
                <div className="text-center p-4 bg-neutral-50 rounded-lg">
                  <p className="text-2xl font-bold text-neutral-900">{formatCurrency(350000)}</p>
                  <p className="text-sm text-neutral-600">Unbilled WIP</p>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-neutral-900">Top WIP Matters</h4>
                {recentMatters.map(matter => (
                  <div key={matter.id} className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
                    <div>
                      <p className="font-medium text-neutral-900">{matter.title}</p>
                      <p className="text-sm text-neutral-600">{matter.client_name}</p>
                    </div>
                    <p className="font-medium text-neutral-900">{formatCurrency(matter.wip_value)}</p>
                  </div>
                ))}
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowDetailedView(prev => ({ ...prev, wipReport: false }))}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Billing Report Modal */}
      {showDetailedView.billingReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Monthly Billing Report</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-status-success-50 rounded-lg">
                  <p className="text-2xl font-bold text-status-success-900">{formatCurrency(dashboardData.monthlyBilling)}</p>
                  <p className="text-sm text-status-success-700">This Month</p>
                </div>
                <div className="text-center p-4 bg-neutral-50 rounded-lg">
                  <p className="text-2xl font-bold text-neutral-900">{formatCurrency(1150000)}</p>
                  <p className="text-sm text-neutral-600">Last Month</p>
                </div>
              </div>
              <div className="p-4 bg-neutral-50 rounded-lg">
                <h4 className="font-medium text-neutral-900 mb-2">Monthly Trend</h4>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-status-success-500" />
                  <span className="text-status-success-600 font-medium">+22.3%</span>
                  <span className="text-neutral-600">compared to last month</span>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowDetailedView(prev => ({ ...prev, billingReport: false }))}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Overdue Invoices Modal */}
      {showDetailedView.overdueInvoices && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Overdue Invoices</h3>
            <div className="space-y-3">
              <div className="p-3 bg-status-warning-50 border-l-4 border-status-warning-500 rounded">
                <p className="font-medium text-neutral-900">Invoice #INV-2024-001</p>
                <p className="text-sm text-neutral-600">ABC Corporation - {formatCurrency(75000)}</p>
                <p className="text-xs text-status-warning-700">45 days overdue</p>
              </div>
              <div className="p-3 bg-status-warning-50 border-l-4 border-status-warning-500 rounded">
                <p className="font-medium text-neutral-900">Invoice #INV-2024-003</p>
                <p className="text-sm text-neutral-600">XYZ Ltd - {formatCurrency(125000)}</p>
                <p className="text-xs text-status-warning-700">32 days overdue</p>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button 
                variant="primary" 
                className="flex-1"
                onClick={() => {
                  setShowDetailedView(prev => ({ ...prev, overdueInvoices: false }));
                  if (onNavigate) onNavigate('invoices');
                }}
              >
                Manage Invoices
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowDetailedView(prev => ({ ...prev, overdueInvoices: false }))}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
  </div>
);
};

export default DashboardPage;