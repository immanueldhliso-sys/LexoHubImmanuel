import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Copy,
  Check,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  XCircle,
  Zap,
  Settings
} from 'lucide-react';
import { Button, Card, CardHeader, CardContent } from '../design-system/components';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { apiIntegrationsService } from '../services/api-integrations.service';
import { integrationManager } from '../services/integrations/integration-manager.service';
import IntegrationConfigModal from '../components/integrations/IntegrationConfigModal';
import type { Integration, IntegrationStatus, APIConfig } from '../types/integrations';

const APIIntegrationsPage: React.FC = () => {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [apiConfig, setApiConfig] = useState<APIConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    loadIntegrations();
    loadAPIConfig();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const data = await apiIntegrationsService.getIntegrations(user?.id || '');
      setIntegrations(data);
    } catch (error) {
      toast.error('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  const loadAPIConfig = async () => {
    try {
      const config = await apiIntegrationsService.getAPIConfig(user?.id || '');
      setApiConfig(config);
    } catch (error) {
      toast.error('Failed to load API configuration');
    }
  };

  const handleConnect = async (integrationId: string, _integrationName: string) => {
    try {
      const authUrl = integrationManager.getAuthorizationUrl(integrationId, user?.id || '');
      window.location.href = authUrl;
    } catch (error) {
      toast.error('Failed to initiate connection');
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    try {
      setLoading(true);
      await apiIntegrationsService.disconnectIntegration(integrationId, user?.id || '');
      toast.success('Integration disconnected successfully');
      await loadIntegrations();
    } catch (error) {
      toast.error('Failed to disconnect integration');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateKey = async () => {
    try {
      setLoading(true);
      const newConfig = await apiIntegrationsService.regenerateAPIKey(user?.id || '');
      setApiConfig(newConfig);
      toast.success('API key regenerated successfully');
    } catch (error) {
      toast.error('Failed to regenerate API key');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWebhook = async (webhookUrl: string) => {
    try {
      setLoading(true);
      await apiIntegrationsService.updateWebhookURL(user?.id || '', webhookUrl);
      toast.success('Webhook URL updated successfully');
      await loadAPIConfig();
    } catch (error) {
      toast.error('Failed to update webhook URL');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRateLimit = async (rateLimit: string) => {
    try {
      setLoading(true);
      await apiIntegrationsService.updateRateLimit(user?.id || '', rateLimit);
      toast.success('Rate limit updated successfully');
      await loadAPIConfig();
    } catch (error) {
      toast.error('Failed to update rate limit');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const getStatusBadge = (status: IntegrationStatus) => {
    switch (status) {
      case 'connected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-status-success-100 text-status-success-800 rounded-full">
            <CheckCircle className="w-3 h-3" />
            Connected
          </span>
        );
      case 'not_connected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-neutral-100 text-neutral-600 rounded-full">
            <XCircle className="w-3 h-3" />
            Not Connected
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-status-error-100 text-status-error-800 rounded-full">
            <AlertCircle className="w-3 h-3" />
            Error
          </span>
        );
      default:
        return null;
    }
  };

  const getIntegrationIcon = (name: string) => {
    const iconMap: Record<string, string> = {
      quickbooks: '📊',
      xero: '💼',
      docusign: '✍️',
      microsoft365: '📧',
      slack: '💬',
      zoom: '🎥'
    };
    return iconMap[name.toLowerCase().replace(/\s+/g, '')] || '🔌';
  };

  return (
    <div className="w-full space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">API Integrations</h1>
          <p className="text-neutral-600 mt-1">Connect and manage third-party services</p>
        </div>
        <Button variant="outline" onClick={loadIntegrations} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-neutral-900">Available Integrations</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrations.map((integration) => (
                  <div
                    key={integration.id}
                    className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:border-mpondo-gold-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex items-center justify-center text-2xl bg-neutral-100 rounded-lg">
                        {getIntegrationIcon(integration.name)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900">{integration.name}</h3>
                        <p className="text-sm text-neutral-600">{integration.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(integration.status)}
                      {integration.status === 'connected' ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedIntegration({ id: integration.id, name: integration.name })}
                            disabled={loading}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDisconnect(integration.id)}
                            disabled={loading}
                          >
                            Disconnect
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleConnect(integration.id, integration.name)}
                          disabled={loading}
                        >
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-neutral-900">API Configuration</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    API Key
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={apiConfig?.apiKey || '••••••••••••••'}
                        readOnly
                        className="w-full px-3 py-2 pr-10 border border-neutral-300 rounded-lg bg-neutral-50 font-mono text-sm"
                        aria-label="API Key"
                        aria-describedby="api-key-description"
                      />
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(apiConfig?.apiKey || '')}
                    >
                      {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleRegenerateKey}
                      disabled={loading}
                    >
                      Regenerate
                    </Button>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    Use this API key to integrate with external systems
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    value={apiConfig?.webhookUrl || ''}
                    onChange={(e) => setApiConfig((prev: APIConfig | null) => prev ? { ...prev, webhookUrl: e.target.value } : null)}
                    onBlur={(e) => handleUpdateWebhook(e.target.value)}
                    placeholder="https://your-domain.com/webhooks"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Receive real-time notifications about events
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Rate Limit
                  </label>
                  <select
                    value={apiConfig?.rateLimit || '100'}
                    onChange={(e) => handleUpdateRateLimit(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
                  >
                    <option value="50">50 requests/hour</option>
                    <option value="100">100 requests/hour</option>
                    <option value="250">250 requests/hour</option>
                    <option value="500">500 requests/hour</option>
                    <option value="1000">1000 requests/hour</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-neutral-200">
                  <div className="flex items-start gap-3 p-3 bg-judicial-blue-50 rounded-lg">
                    <Zap className="w-5 h-5 text-judicial-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-judicial-blue-900">API Documentation</p>
                      <p className="text-judicial-blue-700 mt-1">
                        Visit our{' '}
                        <a href="/docs/api" className="underline hover:text-judicial-blue-900">
                          API documentation
                        </a>{' '}
                        to learn how to integrate with LexoHub.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-neutral-900">Recent Activity</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {apiConfig?.recentActivity && apiConfig.recentActivity.length > 0 ? (
                  apiConfig.recentActivity.map((activity: any, index: number) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.status === 'success' ? 'bg-status-success-500' : 'bg-status-error-500'
                        }`} />
                        <span className="text-neutral-700">{activity.action}</span>
                      </div>
                      <span className="text-neutral-500">{activity.timestamp}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-neutral-500 py-4">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {selectedIntegration && (
        <IntegrationConfigModal
          integrationId={selectedIntegration.id}
          integrationName={selectedIntegration.name}
          isOpen={!!selectedIntegration}
          onClose={() => {
            setSelectedIntegration(null);
            loadIntegrations();
          }}
        />
      )}
    </div>
  );
};

export default APIIntegrationsPage;
