import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  DollarSign,
  FileText,
  Eye,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, Button } from '../../design-system/components';
import { StrategicFinanceService } from '../../services/api/strategic-finance.service';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface ComplianceAlert {
  id: string;
  type: 'trust_account' | 'billing' | 'regulatory' | 'audit';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  created_at: string;
  resolved: boolean;
  due_date?: string;
  matter_id?: string;
  amount?: number;
}

interface TrustAccountTransaction {
  id: string;
  matter_id: string;
  matter_title: string;
  client_name: string;
  transaction_type: 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  balance: number;
  description: string;
  created_at: string;
  status: 'pending' | 'completed' | 'failed';
}

interface ComplianceMetric {
  name: string;
  value: number;
  target: number;
  status: 'compliant' | 'warning' | 'non_compliant';
  unit: string;
}

interface ComplianceMonitorProps {
  className?: string;
}

export const ComplianceMonitor: React.FC<ComplianceMonitorProps> = ({ className }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [transactions, setTransactions] = useState<TrustAccountTransaction[]>([]);
  const [metrics, setMetrics] = useState<ComplianceMetric[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'critical' | 'unresolved'>('all');
  const [activeTab, setActiveTab] = useState('alerts');

  useEffect(() => {
    if (user) {
      loadComplianceData();
    }
  }, [user]);

  const loadComplianceData = async () => {
    try {
      setLoading(true);
      
      // Load compliance alerts
      const alertsData = await StrategicFinanceService.getComplianceAlerts();
      setAlerts(alertsData);

      // Load trust account transactions
      const transactionsData = await StrategicFinanceService.getTrustAccountTransactions();
      setTransactions(transactionsData);

      // Load compliance metrics
      const metricsData = await StrategicFinanceService.getComplianceMetrics();
      setMetrics(metricsData);

    } catch (error) {
      console.error('Error loading compliance data:', error);
      toast.error('Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      case 'low':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'non_compliant':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case 'withdrawal':
        return <DollarSign className="h-4 w-4 text-red-500" />;
      case 'transfer':
        return <DollarSign className="h-4 w-4 text-blue-500" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (selectedFilter === 'critical') return alert.severity === 'critical';
    if (selectedFilter === 'unresolved') return !alert.resolved;
    return true;
  });

  const resolveAlert = async (alertId: string) => {
    try {
      await StrategicFinanceService.resolveComplianceAlert(alertId);
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, resolved: true } : alert
      ));
      toast.success('Alert resolved successfully');
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error('Failed to resolve alert');
    }
  };

  const generateComplianceReport = async () => {
    try {
      const report = await StrategicFinanceService.generateComplianceReport();
      // Trigger download
      const blob = new Blob([report], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Compliance report generated');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate compliance report');
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Compliance Monitor
          </h3>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Compliance Monitor
            </h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={generateComplianceReport} className="text-sm px-3 py-1">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button variant="outline" onClick={loadComplianceData} className="text-sm px-3 py-1">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Compliance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {metrics.map((metric, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{metric.name}</p>
                      <p className="text-2xl font-bold">
                        {metric.value}{metric.unit}
                      </p>
                      <p className="text-sm text-gray-500">
                        Target: {metric.target}{metric.unit}
                      </p>
                    </div>
                    {getStatusIcon(metric.status)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {['alerts', 'trust-account', 'audit-trail'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-mpondo-gold-500 text-mpondo-gold-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab === 'alerts' && 'Compliance Alerts'}
                  {tab === 'trust-account' && 'Trust Account'}
                  {tab === 'audit-trail' && 'Audit Trail'}
                </button>
              ))}
            </nav>
          </div>

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-4 w-4" />
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value as any)}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value="all">All Alerts</option>
                  <option value="critical">Critical Only</option>
                  <option value="unresolved">Unresolved</option>
                </select>
              </div>

              <div className="space-y-3">
                {filteredAlerts.map((alert) => (
                  <div key={alert.id} className={`border-l-4 p-4 rounded-lg ${
                    alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                    alert.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                    alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                    'border-blue-500 bg-blue-50'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className={`h-4 w-4 ${
                            alert.severity === 'critical' ? 'text-red-500' :
                            alert.severity === 'high' ? 'text-orange-500' :
                            alert.severity === 'medium' ? 'text-yellow-500' :
                            'text-blue-500'
                          }`} />
                          <h4 className="font-medium">{alert.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                            {alert.severity}
                          </span>
                          {alert.resolved && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                              Resolved
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 mb-2">
                          {alert.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>Created: {new Date(alert.created_at).toLocaleDateString()}</span>
                          {alert.due_date && (
                            <span>Due: {new Date(alert.due_date).toLocaleDateString()}</span>
                          )}
                          {alert.amount && (
                            <span>Amount: R{alert.amount.toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {alert.matter_id && (
                          <Button variant="outline" className="p-2">
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {!alert.resolved && (
                          <Button 
                            variant="outline" 
                            onClick={() => resolveAlert(alert.id)}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trust Account Tab */}
          {activeTab === 'trust-account' && (
            <div className="space-y-4">
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <Card key={transaction.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getTransactionIcon(transaction.transaction_type)}
                          <div>
                            <h4 className="font-medium">{transaction.matter_title}</h4>
                            <p className="text-sm text-gray-600">{transaction.client_name}</p>
                            <p className="text-sm text-gray-500">{transaction.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${
                            transaction.transaction_type === 'deposit' ? 'text-green-600' :
                            transaction.transaction_type === 'withdrawal' ? 'text-red-600' :
                            'text-blue-600'
                          }`}>
                            {transaction.transaction_type === 'withdrawal' ? '-' : '+'}
                            R{transaction.amount.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            Balance: R{transaction.balance.toLocaleString()}
                          </p>
                          <span 
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${
                              transaction.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                              transaction.status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' :
                              'bg-yellow-50 text-yellow-700 border-yellow-200'
                            }`}
                          >
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        {new Date(transaction.created_at).toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Audit Trail Tab */}
          {activeTab === 'audit-trail' && (
            <div className="space-y-4">
              <Card>
                  <CardHeader>
                    <h4 className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Recent Audit Activities
                    </h4>
                  </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div className="flex-1">
                        <p className="font-medium">Trust Account Reconciliation</p>
                        <p className="text-sm text-gray-600">Monthly reconciliation completed successfully</p>
                        <p className="text-sm text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <div className="flex-1">
                        <p className="font-medium">Billing Compliance Check</p>
                        <p className="text-sm text-gray-600">3 matters require billing review</p>
                        <p className="text-sm text-gray-500">1 day ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div className="flex-1">
                        <p className="font-medium">Regulatory Filing</p>
                        <p className="text-sm text-gray-600">Annual compliance report submitted</p>
                        <p className="text-sm text-gray-500">3 days ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};