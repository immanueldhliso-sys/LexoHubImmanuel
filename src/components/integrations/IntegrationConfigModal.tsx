import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { Button } from '../../design-system/components';
import { toast } from 'react-hot-toast';
import { integrationManager } from '../../services/integrations/integration-manager.service';
import { useAuth } from '../../contexts/AuthContext';

interface IntegrationConfigModalProps {
  integrationId: string;
  integrationName: string;
  isOpen: boolean;
  onClose: () => void;
}

const IntegrationConfigModal: React.FC<IntegrationConfigModalProps> = ({
  integrationId,
  integrationName,
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen, integrationId]);

  const loadConfig = async () => {
    try {
      const integration = integrationManager.getIntegration(integrationId);
      if (!integration) return;

      const configData = await integration.getConfig(user?.id || '');
      setConfig(configData);
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  const handleSync = async () => {
    try {
      setLoading(true);
      await integrationManager.syncIntegration(integrationId, user?.id || '');
      toast.success('Sync completed successfully');
      onClose();
    } catch (error) {
      toast.error('Sync failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm(`Are you sure you want to disconnect ${integrationName}?`)) {
      return;
    }

    try {
      setLoading(true);
      await integrationManager.disconnectIntegration(integrationId, user?.id || '');
      toast.success('Integration disconnected');
      onClose();
    } catch (error) {
      toast.error('Failed to disconnect');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    const authUrl = integrationManager.getAuthorizationUrl(integrationId, user?.id || '');
    window.location.href = authUrl;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-2xl font-bold text-neutral-900">{integrationName} Settings</h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {config ? (
            <>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Connection Status</h3>
                <div className="bg-status-success-50 border border-status-success-200 rounded-lg p-4">
                  <p className="text-status-success-800 font-medium">Connected</p>
                  <p className="text-sm text-status-success-600 mt-1">
                    Last synced: {config.settings?.lastSync ? new Date(config.settings.lastSync).toLocaleString() : 'Never'}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Sync Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-900">Auto Sync</p>
                      <p className="text-sm text-neutral-600">Automatically sync data in the background</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.settings?.autoSync || false}
                        onChange={(e) => setConfig({
                          ...config,
                          settings: { ...config.settings, autoSync: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-mpondo-gold-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mpondo-gold-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-900">Notifications</p>
                      <p className="text-sm text-neutral-600">Receive notifications about sync events</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.settings?.notifications || false}
                        onChange={(e) => setConfig({
                          ...config,
                          settings: { ...config.settings, notifications: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-mpondo-gold-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mpondo-gold-500"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Sync Frequency
                    </label>
                    <select
                      value={config.settings?.syncFrequency || 'daily'}
                      onChange={(e) => setConfig({
                        ...config,
                        settings: { ...config.settings, syncFrequency: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
                    >
                      <option value="realtime">Real-time</option>
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-neutral-200">
                <Button
                  variant="primary"
                  onClick={handleSync}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Sync Now
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDisconnect}
                  disabled={loading}
                  className="flex-1"
                >
                  Disconnect
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-neutral-600 mb-4">This integration is not connected yet.</p>
              <Button variant="primary" onClick={handleConnect}>
                Connect {integrationName}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntegrationConfigModal;
