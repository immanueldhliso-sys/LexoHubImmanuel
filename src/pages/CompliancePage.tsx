import React, { useState, useEffect } from 'react';
import { AlertTriangle, Calendar, Shield, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, BarChart3 } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '../design-system/components';
import { LoadingSpinner } from '../components/design-system/components/LoadingSpinner';
import { ComplianceService } from '../services/compliance.service';
import type { 
  ComplianceAlert, 
  ComplianceDeadline, 
  ComplianceViolation, 
  ComplianceDashboardStats,
  ComplianceFilters 
} from '../types';
import toast from 'react-hot-toast';

// Dashboard Stats Component
const ComplianceStatsCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  onClick?: () => void;
}> = ({ title, value, icon, trend, trendType = 'neutral', onClick }) => {
  const trendColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  };

  return (
    <Card 
      hoverable={!!onClick} 
      interactive={!!onClick}
      onClick={onClick}
      className="cursor-pointer"
    >
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {trend && (
              <p className={`text-sm ${trendColors[trendType]}`}>
                {trend}
              </p>
            )}
          </div>
          <div className="text-mpondo-gold-600">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Alerts List Component
const AlertsList: React.FC<{
  alerts: ComplianceAlert[];
  onResolveAlert: (alertId: string) => void;
  loading: boolean;
}> = ({ alerts, onResolveAlert, loading }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <AlertCircle className="w-4 h-4" />;
      case 'low': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">Active Alerts</h3>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600">No active compliance alerts</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getSeverityIcon(alert.severity)}
                    <div>
                      <h4 className="font-medium">{alert.title}</h4>
                      <p className="text-sm mt-1">{alert.description}</p>
                      <p className="text-xs mt-2 opacity-75">
                        Created: {new Date(alert.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onResolveAlert(alert.id)}
                    className="px-3 py-1 text-xs font-medium bg-white border border-current rounded hover:bg-opacity-10 transition-colors"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Deadlines Calendar Component
const DeadlinesCalendar: React.FC<{
  deadlines: ComplianceDeadline[];
  loading: boolean;
}> = ({ deadlines, loading }) => {
  const getUrgencyColor = (deadline: ComplianceDeadline) => {
    const daysUntil = Math.ceil((new Date(deadline.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) return 'text-red-600 bg-red-50 border-red-200';
    if (daysUntil <= 7) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (daysUntil <= 30) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getDaysUntilText = (deadline: ComplianceDeadline) => {
    const daysUntil = Math.ceil((new Date(deadline.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) return `${Math.abs(daysUntil)} days overdue`;
    if (daysUntil === 0) return 'Due today';
    if (daysUntil === 1) return 'Due tomorrow';
    return `${daysUntil} days remaining`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h3>
      </CardHeader>
      <CardContent>
        {deadlines.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No upcoming deadlines</p>
          </div>
        ) : (
          <div className="space-y-4">
            {deadlines.map((deadline) => (
              <div
                key={deadline.id}
                className={`p-4 rounded-lg border ${getUrgencyColor(deadline)}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{deadline.title}</h4>
                    <p className="text-sm mt-1">{deadline.description}</p>
                    <p className="text-xs mt-2 opacity-75">
                      Due: {new Date(deadline.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {getDaysUntilText(deadline)}
                    </p>
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-white bg-opacity-50 mt-1">
                      {deadline.requirement_type}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Violations Tracker Component
const ViolationsTracker: React.FC<{
  violations: ComplianceViolation[];
  loading: boolean;
}> = ({ violations, loading }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">Recent Violations</h3>
      </CardHeader>
      <CardContent>
        {violations.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600">No compliance violations</p>
          </div>
        ) : (
          <div className="space-y-4">
            {violations.map((violation) => (
              <div
                key={violation.id}
                className={`p-4 rounded-lg border ${getSeverityColor(violation.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{violation.title}</h4>
                    <p className="text-sm mt-1">{violation.description}</p>
                    <p className="text-xs mt-2 opacity-75">
                      Detected: {new Date(violation.detected_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-white bg-opacity-50">
                      {violation.violation_type}
                    </span>
                    {violation.resolved_at && (
                      <p className="text-xs mt-1 text-green-600">
                        Resolved: {new Date(violation.resolved_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Main Compliance Page Component
const CompliancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'alerts' | 'deadlines' | 'violations'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ComplianceDashboardStats | null>(null);
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [deadlines, setDeadlines] = useState<ComplianceDeadline[]>([]);
  const [violations, setViolations] = useState<ComplianceViolation[]>([]);

  // Load dashboard data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        const [statsData, alertsData, deadlinesData, violationsData] = await Promise.all([
          ComplianceService.getDashboardStats(),
          ComplianceService.getAlerts({ status: ['active'] }),
          ComplianceService.getDeadlines({ status: ['pending'] }),
          ComplianceService.getViolations()
        ]);

        setStats(statsData);
        setAlerts(alertsData);
        setDeadlines(deadlinesData);
        setViolations(violationsData);

      } catch (error) {
        console.error('Error loading compliance data:', error);
        toast.error('Failed to load compliance data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleResolveAlert = async (alertId: string) => {
    try {
      await ComplianceService.resolveAlert(alertId);
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      toast.success('Alert resolved successfully');
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error('Failed to resolve alert');
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'deadlines', label: 'Deadlines', icon: Calendar },
    { id: 'violations', label: 'Violations', icon: Shield }
  ] as const;

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Compliance Management</h1>
        <p className="text-gray-600">Monitor and manage your practice's compliance requirements</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <nav className="flex space-x-8 border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-mpondo-gold-500 text-mpondo-gold-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ComplianceStatsCard
              title="Active Alerts"
              value={stats?.active_alerts || 0}
              icon={<AlertTriangle className="w-8 h-8" />}
              onClick={() => setActiveTab('alerts')}
            />
            <ComplianceStatsCard
              title="Upcoming Deadlines"
              value={stats?.upcoming_deadlines || 0}
              icon={<Calendar className="w-8 h-8" />}
              onClick={() => setActiveTab('deadlines')}
            />
            <ComplianceStatsCard
              title="Compliance Score"
              value={stats?.compliance_score || 0}
              icon={<TrendingUp className="w-8 h-8" />}
              trend={stats?.score_trend}
              trendType={stats?.score_trend?.includes('+') ? 'positive' : 'negative'}
            />
            <ComplianceStatsCard
              title="Recent Violations"
              value={stats?.recent_violations || 0}
              icon={<Shield className="w-8 h-8" />}
              onClick={() => setActiveTab('violations')}
            />
          </div>

          {/* Dashboard Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AlertsList 
              alerts={alerts.slice(0, 5)} 
              onResolveAlert={handleResolveAlert}
              loading={false}
            />
            <DeadlinesCalendar 
              deadlines={deadlines.slice(0, 5)}
              loading={false}
            />
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <AlertsList 
          alerts={alerts} 
          onResolveAlert={handleResolveAlert}
          loading={loading}
        />
      )}

      {activeTab === 'deadlines' && (
        <DeadlinesCalendar 
          deadlines={deadlines}
          loading={loading}
        />
      )}

      {activeTab === 'violations' && (
        <ViolationsTracker 
          violations={violations}
          loading={loading}
        />
      )}
    </div>
  );
};

export default CompliancePage;