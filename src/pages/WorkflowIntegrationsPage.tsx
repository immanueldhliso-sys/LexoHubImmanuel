import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Calendar, 
  BarChart3, 
  Settings,
  Link,
  MessageSquare,
  Bell,
  Clock,
  MapPin,
  User,
  FileText,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { Card, CardHeader, CardContent, Button } from '../design-system/components';
import { CourtIntegrationDashboard } from '../components/workflow/CourtIntegrationDashboard';
import { JudgeAnalyticsCard } from '../components/workflow/JudgeAnalyticsCard';
import { LanguageAccessibilitySettings } from '../components/workflow/LanguageAccessibilitySettings';
import { AutomatedDiarySync } from '../components/workflow/AutomatedDiarySync';

export const WorkflowIntegrationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'court' | 'diary' | 'analytics' | 'language'>('overview');
  const [connectionStatus, setConnectionStatus] = useState({
    gautengHigh: 'connected',
    westernCapeHigh: 'disconnected',
    magistratesCourts: 'partial',
    supremeCourt: 'connected'
  });

  const integrationStats = {
    totalIntegrations: 8,
    activeConnections: 6,
    lastSync: '2 minutes ago',
    pendingActions: 3
  };

  const recentActivity = [
    {
      id: '1',
      type: 'court_filing',
      message: 'Document filed in Johannesburg High Court',
      timestamp: '10 minutes ago',
      status: 'success'
    },
    {
      id: '2',
      type: 'diary_sync',
      message: 'Court diary synchronized',
      timestamp: '15 minutes ago',
      status: 'success'
    },
    {
      id: '3',
      type: 'language_update',
      message: 'Afrikaans translation updated',
      timestamp: '1 hour ago',
      status: 'info'
    },
    {
      id: '4',
      type: 'court_notice',
      message: 'Postponement notice received',
      timestamp: '2 hours ago',
      status: 'warning'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-success-600 bg-success-100';
      case 'disconnected':
        return 'text-error-600 bg-error-100';
      case 'partial':
        return 'text-warning-600 bg-warning-100';
      default:
        return 'text-neutral-600 bg-neutral-100';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'court_filing':
        return <FileText className="w-4 h-4" />;
      case 'diary_sync':
        return <Calendar className="w-4 h-4" />;
      case 'language_update':
        return <Globe className="w-4 h-4" />;
      case 'court_notice':
        return <Bell className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-success-600';
      case 'warning':
        return 'text-warning-600';
      case 'error':
        return 'text-error-600';
      default:
        return 'text-judicial-blue-600';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Workflow & Integrations</h1>
              <p className="text-neutral-600 mt-1">
                Court integrations, automated diary sync, and multi-language accessibility
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => {}}
                variant="outline"
                size="sm"
              >
                <Settings className="w-4 h-4 mr-2" />
                Integration Settings
              </Button>
              <Button
                onClick={() => {}}
                className="bg-mpondo-gold-600 hover:bg-mpondo-gold-700"
              >
                <Link className="w-4 h-4 mr-2" />
                Connect New Integration
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex items-center gap-6 border-b border-neutral-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'text-mpondo-gold-600 border-b-2 border-mpondo-gold-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Overview
              </div>
            </button>
            <button
              onClick={() => setActiveTab('court')}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'court'
                  ? 'text-mpondo-gold-600 border-b-2 border-mpondo-gold-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Court Integrations
              </div>
            </button>
            <button
              onClick={() => setActiveTab('diary')}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'diary'
                  ? 'text-mpondo-gold-600 border-b-2 border-mpondo-gold-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Diary Sync
              </div>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'analytics'
                  ? 'text-mpondo-gold-600 border-b-2 border-mpondo-gold-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Judge Analytics
              </div>
            </button>
            <button
              onClick={() => setActiveTab('language')}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'language'
                  ? 'text-mpondo-gold-600 border-b-2 border-mpondo-gold-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Language Access
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Total Integrations</p>
                      <p className="text-2xl font-bold text-neutral-900">{integrationStats.totalIntegrations}</p>
                    </div>
                    <Link className="w-8 h-8 text-judicial-blue-500" />
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">Across all platforms</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Active Connections</p>
                      <p className="text-2xl font-bold text-success-600">{integrationStats.activeConnections}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-success-500" />
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">Currently online</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Last Sync</p>
                      <p className="text-2xl font-bold text-neutral-900">{integrationStats.lastSync}</p>
                    </div>
                    <Clock className="w-8 h-8 text-mpondo-gold-500" />
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">Data synchronization</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Pending Actions</p>
                      <p className="text-2xl font-bold text-warning-600">{integrationStats.pendingActions}</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-warning-500" />
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">Require attention</p>
                </CardContent>
              </Card>
            </div>

            {/* Connection Status */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-neutral-900">Connection Status</h3>
                <p className="text-neutral-600">Real-time status of court system integrations</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-neutral-500" />
                      <div>
                        <p className="font-medium text-neutral-900">Gauteng High Court</p>
                        <p className="text-sm text-neutral-600">Electronic filing enabled</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(connectionStatus.gautengHigh)}`}>
                      Connected
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-neutral-500" />
                      <div>
                        <p className="font-medium text-neutral-900">Western Cape High Court</p>
                        <p className="text-sm text-neutral-600">Setup required</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(connectionStatus.westernCapeHigh)}`}>
                      Disconnected
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-neutral-500" />
                      <div>
                        <p className="font-medium text-neutral-900">Magistrates Courts</p>
                        <p className="text-sm text-neutral-600">Regional access</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(connectionStatus.magistratesCourts)}`}>
                      Partial
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-neutral-500" />
                      <div>
                        <p className="font-medium text-neutral-900">Supreme Court of Appeal</p>
                        <p className="text-sm text-neutral-600">Full integration</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(connectionStatus.supremeCourt)}`}>
                      Connected
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-neutral-900">Recent Activity</h3>
                <p className="text-neutral-600">Latest integration and synchronization events</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 p-3 hover:bg-neutral-50 rounded-lg">
                      <div className={`p-2 rounded-full ${getActivityColor(activity.status)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-neutral-900">{activity.message}</p>
                        <p className="text-xs text-neutral-500">{activity.timestamp}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-neutral-400" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'court' && (
          <CourtIntegrationDashboard />
        )}

        {activeTab === 'diary' && (
          <AutomatedDiarySync />
        )}

        {activeTab === 'analytics' && (
          <JudgeAnalyticsCard />
        )}

        {activeTab === 'language' && (
          <LanguageAccessibilitySettings />
        )}
      </div>
    </div>
  );
};

export default WorkflowIntegrationsPage;
