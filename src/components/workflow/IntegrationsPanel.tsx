import React from 'react';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Settings,
  ExternalLink,
  Wifi,
  WifiOff,
  Activity,
  Calendar,
  Database
} from 'lucide-react';
import { Card, CardHeader, CardContent, Button } from '../../design-system/components';
import { CalendarIntegrationSettings } from '../settings/CalendarIntegrationSettings';
import type { CourtRegistry, CourtIntegrationLog } from '../../types';
import { format } from 'date-fns';

interface IntegrationsPanelProps {
  courtRegistries: CourtRegistry[];
  integrationLogs: CourtIntegrationLog[];
  onSync: (registryId: string) => Promise<void>;
  loading: boolean;
}

export const IntegrationsPanel: React.FC<IntegrationsPanelProps> = ({
  courtRegistries,
  integrationLogs,
  onSync,
  loading
}) => {
  const getStatusIcon = (status: CourtRegistry['integrationStatus']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-success-500" />;
      case 'maintenance':
        return <Clock className="w-5 h-5 text-warning-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-error-500" />;
    }
  };

  const getStatusColor = (status: CourtRegistry['integrationStatus']) => {
    switch (status) {
      case 'active':
        return 'text-success-600 bg-success-50';
      case 'maintenance':
        return 'text-warning-600 bg-warning-50';
      default:
        return 'text-error-600 bg-error-50';
    }
  };

  const getLogStatusIcon = (status: CourtIntegrationLog['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-success-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-error-500" />;
      case 'partial':
        return <AlertCircle className="w-4 h-4 text-warning-500" />;
      default:
        return <Clock className="w-4 h-4 text-neutral-500" />;
    }
  };

  const getSyncTypeIcon = (syncType: CourtIntegrationLog['syncType']) => {
    switch (syncType) {
      case 'diary_sync':
        return <Calendar className="w-4 h-4 text-mpondo-gold-500" />;
      case 'case_update':
        return <Database className="w-4 h-4 text-judicial-blue-500" />;
      case 'judge_info':
        return <Activity className="w-4 h-4 text-neutral-500" />;
      default:
        return <RefreshCw className="w-4 h-4 text-neutral-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Calendar Integration */}
      <CalendarIntegrationSettings />

      {/* Court Registry Integrations */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-neutral-900">Court Registry Integrations</h3>
          <p className="text-sm text-neutral-600">
            Manage connections to court registry systems for automated data sync
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {courtRegistries.length === 0 ? (
              <div className="text-center py-8">
                <Settings className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                <p className="text-neutral-600">No court registries configured</p>
                <p className="text-sm text-neutral-500">Add court registry integrations to enable automated syncing</p>
              </div>
            ) : (
              courtRegistries.map(registry => (
                <div key={registry.id} className="border border-neutral-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(registry.integrationStatus)}
                      <div>
                        <h4 className="font-semibold text-neutral-900">{registry.name}</h4>
                        <p className="text-sm text-neutral-600">{registry.jurisdiction}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(registry.integrationStatus)}`}>
                        {registry.integrationStatus}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSync(registry.id)}
                        disabled={loading || registry.integrationStatus !== 'active'}
                      >
                        <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                        Sync
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Settings className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-neutral-600">Code</p>
                      <p className="font-medium text-neutral-900">{registry.code}</p>
                    </div>
                    <div>
                      <p className="text-neutral-600">Address</p>
                      <p className="font-medium text-neutral-900 truncate">
                        {registry.address || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-600">Last Sync</p>
                      <p className="font-medium text-neutral-900">
                        {registry.lastSyncAt 
                          ? format(new Date(registry.lastSyncAt), 'dd MMM, HH:mm')
                          : 'Never'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-600">Connection</p>
                      <div className="flex items-center gap-1">
                        {registry.integrationStatus === 'active' ? (
                          <Wifi className="w-3 h-3 text-success-500" />
                        ) : (
                          <WifiOff className="w-3 h-3 text-error-500" />
                        )}
                        <span className="font-medium text-neutral-900">
                          {registry.integrationStatus === 'active' ? 'Connected' : 'Disconnected'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Integration Logs */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-neutral-900">Recent Sync Activity</h3>
          <p className="text-sm text-neutral-600">
            Track the status of recent synchronization attempts
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {integrationLogs.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                <p className="text-neutral-600">No sync activity yet</p>
                <p className="text-sm text-neutral-500">Sync logs will appear here after integration activities</p>
              </div>
            ) : (
              integrationLogs.slice(0, 10).map(log => (
                <div key={log.id} className="border border-neutral-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getSyncTypeIcon(log.syncType)}
                      <div>
                        <p className="font-medium text-neutral-900">
                          {log.syncType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <p className="text-xs text-neutral-600">
                          {format(new Date(log.createdAt), 'dd MMM yyyy, HH:mm:ss')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getLogStatusIcon(log.status)}
                      <span className="text-xs font-medium text-neutral-700">
                        {log.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <p className="text-neutral-600">Processed</p>
                      <p className="font-medium text-neutral-900">{log.recordsProcessed}</p>
                    </div>
                    <div>
                      <p className="text-neutral-600">Updated</p>
                      <p className="font-medium text-success-700">{log.recordsUpdated}</p>
                    </div>
                    <div>
                      <p className="text-neutral-600">Failed</p>
                      <p className="font-medium text-error-700">{log.recordsFailed}</p>
                    </div>
                    <div>
                      <p className="text-neutral-600">Duration</p>
                      <p className="font-medium text-neutral-900">
                        {log.syncDurationMs ? `${log.syncDurationMs}ms` : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {log.errorDetails && (
                    <div className="mt-2 p-2 bg-error-50 rounded">
                      <p className="text-xs text-error-700">
                        Error: {JSON.stringify(log.errorDetails)}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Integrations */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-neutral-900">Available Integrations</h3>
          <p className="text-sm text-neutral-600">
            Explore additional integrations to enhance your workflow
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                name: 'CaseLines Integration',
                description: 'Connect to CaseLines for document management',
                status: 'coming_soon',
                icon: '📄'
              },
              {
                name: 'SARS eFiling',
                description: 'Automated tax document filing',
                status: 'coming_soon',
                icon: '🏛️'
              },
              {
                name: 'Banking API',
                description: 'Direct bank feed integration for trust accounts',
                status: 'coming_soon',
                icon: '🏦'
              },
              {
                name: 'Legal Database',
                description: 'Access to case law and precedent databases',
                status: 'coming_soon',
                icon: '📚'
              }
            ].map((integration, index) => (
              <div key={index} className="border border-neutral-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{integration.icon}</span>
                  <div>
                    <h4 className="font-medium text-neutral-900">{integration.name}</h4>
                    <p className="text-sm text-neutral-600">{integration.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-full">
                    Coming Soon
                  </span>
                  <Button variant="ghost" size="sm" disabled>
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Learn More
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
