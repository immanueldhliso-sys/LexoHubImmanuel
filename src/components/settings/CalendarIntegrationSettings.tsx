import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Settings, 
  RefreshCw, 
  Trash2,
  CheckCircle,
  AlertTriangle,
  Clock,
  Bell,
  ExternalLink
} from 'lucide-react';
import { Card, CardHeader, CardContent, Button } from '../../design-system/components';
import { calendarService, CalendarProvider, CalendarSyncSettings } from '../../services/api/calendar.service';
import { toast } from 'react-hot-toast';

export const CalendarIntegrationSettings: React.FC = () => {
  const [providers, setProviders] = useState<CalendarProvider[]>([]);
  const [syncSettings, setSyncSettings] = useState<CalendarSyncSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await calendarService.initialize();
      const connectedProviders = calendarService.getConnectedProviders();
      const settings = calendarService.getSyncSettings();
      
      setProviders(connectedProviders);
      setSyncSettings(settings);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
      toast.error('Failed to load calendar settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectGoogle = async () => {
    setIsLoading(true);
    try {
      const success = await calendarService.connectGoogleCalendar();
      if (success) {
        await loadData();
      }
    } catch (error) {
      console.error('Failed to connect Google Calendar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectOutlook = async () => {
    setIsLoading(true);
    try {
      const success = await calendarService.connectOutlookCalendar();
      if (success) {
        await loadData();
      }
    } catch (error) {
      console.error('Failed to connect Outlook Calendar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async (type: 'google' | 'outlook') => {
    setIsLoading(true);
    try {
      await calendarService.disconnectProvider(type);
      await loadData();
    } catch (error) {
      console.error(`Failed to disconnect ${type}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    if (providers.length === 0) {
      toast.error('No calendar providers connected');
      return;
    }

    setIsSyncing(true);
    try {
      await calendarService.syncAllCalendars();
      await loadData();
      toast.success('Calendar sync completed successfully');
    } catch (error) {
      console.error('Failed to sync calendars:', error);
      toast.error('Failed to sync calendars');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateSettings = async (newSettings: Partial<CalendarSyncSettings>) => {
    if (!syncSettings) return;

    try {
      await calendarService.updateSyncSettings(newSettings);
      setSyncSettings({ ...syncSettings, ...newSettings });
      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error('Failed to update settings');
    }
  };

  const getProviderIcon = (type: 'google' | 'outlook') => {
    return type === 'google' ? (
      <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">G</div>
    ) : (
      <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center text-white text-xs font-bold">O</div>
    );
  };

  if (isLoading && !syncSettings) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-neutral-500" />
            <span className="ml-2 text-neutral-600">Loading calendar settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connected Providers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Calendar Providers</h3>
              <p className="text-neutral-600">Manage your calendar integrations</p>
            </div>
            <Button
              onClick={handleSync}
              disabled={isSyncing || providers.length === 0}
              size="sm"
              className="bg-mpondo-gold-600 hover:bg-mpondo-gold-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Google Calendar */}
            <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
              <div className="flex items-center gap-3">
                {getProviderIcon('google')}
                <div>
                  <p className="font-medium text-neutral-900">Google Calendar</p>
                  <p className="text-sm text-neutral-600">
                    {providers.find(p => p.type === 'google')?.email || 'Not connected'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {providers.find(p => p.type === 'google') ? (
                  <>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-success-100 text-success-600">
                      Connected
                    </span>
                    <Button
                      onClick={() => handleDisconnect('google')}
                      variant="outline"
                      size="sm"
                      disabled={isLoading}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleConnectGoogle}
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                  >
                    Connect
                  </Button>
                )}
              </div>
            </div>

            {/* Outlook Calendar */}
            <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
              <div className="flex items-center gap-3">
                {getProviderIcon('outlook')}
                <div>
                  <p className="font-medium text-neutral-900">Outlook Calendar</p>
                  <p className="text-sm text-neutral-600">
                    {providers.find(p => p.type === 'outlook')?.email || 'Not connected'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {providers.find(p => p.type === 'outlook') ? (
                  <>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-success-100 text-success-600">
                      Connected
                    </span>
                    <Button
                      onClick={() => handleDisconnect('outlook')}
                      variant="outline"
                      size="sm"
                      disabled={isLoading}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleConnectOutlook}
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                  >
                    Connect
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync Settings */}
      {syncSettings && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-neutral-900">Sync Settings</h3>
            <p className="text-neutral-600">Configure how your calendars sync with LexoHub</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-6">
              {/* Auto Sync */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-900">Automatic Sync</p>
                  <p className="text-sm text-neutral-600">Automatically sync calendars in the background</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncSettings.autoSync}
                    onChange={(e) => handleUpdateSettings({ autoSync: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-mpondo-gold-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mpondo-gold-600"></div>
                </label>
              </div>

              {/* Sync Interval */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Sync Interval (minutes)
                </label>
                <select
                  value={syncSettings.syncInterval}
                  onChange={(e) => handleUpdateSettings({ syncInterval: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mpondo-gold-500"
                >
                  <option value={5}>5 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                </select>
              </div>

              {/* Event Types */}
              <div>
                <p className="font-medium text-neutral-900 mb-3">Sync Event Types</p>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={syncSettings.syncCourtEvents}
                      onChange={(e) => handleUpdateSettings({ syncCourtEvents: e.target.checked })}
                      className="rounded border-neutral-300 text-mpondo-gold-600 focus:ring-mpondo-gold-500"
                    />
                    <span className="ml-2 text-sm text-neutral-700">Court hearings and legal events</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={syncSettings.syncClientMeetings}
                      onChange={(e) => handleUpdateSettings({ syncClientMeetings: e.target.checked })}
                      className="rounded border-neutral-300 text-mpondo-gold-600 focus:ring-mpondo-gold-500"
                    />
                    <span className="ml-2 text-sm text-neutral-700">Client meetings and consultations</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={syncSettings.syncDeadlines}
                      onChange={(e) => handleUpdateSettings({ syncDeadlines: e.target.checked })}
                      className="rounded border-neutral-300 text-mpondo-gold-600 focus:ring-mpondo-gold-500"
                    />
                    <span className="ml-2 text-sm text-neutral-700">Deadlines and important dates</span>
                  </label>
                </div>
              </div>

              {/* Reminder Settings */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-medium text-neutral-900">Smart Reminders</p>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncSettings.reminderSettings.enabled}
                      onChange={(e) => handleUpdateSettings({ 
                        reminderSettings: { 
                          ...syncSettings.reminderSettings, 
                          enabled: e.target.checked 
                        } 
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-mpondo-gold-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mpondo-gold-600"></div>
                  </label>
                </div>
                {syncSettings.reminderSettings.enabled && (
                  <div className="pl-4 border-l-2 border-neutral-200">
                    <p className="text-sm text-neutral-600 mb-2">Default reminder times:</p>
                    <div className="flex flex-wrap gap-2">
                      {syncSettings.reminderSettings.defaultReminders.map((minutes, index) => (
                        <span key={index} className="px-2 py-1 bg-neutral-100 rounded text-xs">
                          {minutes >= 1440 ? `${minutes / 1440} day${minutes / 1440 > 1 ? 's' : ''}` :
                           minutes >= 60 ? `${minutes / 60} hour${minutes / 60 > 1 ? 's' : ''}` :
                           `${minutes} minute${minutes > 1 ? 's' : ''}`} before
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
              providers.length > 0 ? 'bg-success-100' : 'bg-neutral-100'
            }`}>
              {providers.length > 0 ? (
                <CheckCircle className="w-6 h-6 text-success-600" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-neutral-500" />
              )}
            </div>
            <p className="font-medium text-neutral-900">{providers.length} Connected</p>
            <p className="text-sm text-neutral-600">Calendar providers</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-mpondo-gold-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-mpondo-gold-600" />
            </div>
            <p className="font-medium text-neutral-900">
              {syncSettings?.syncInterval || 0} min
            </p>
            <p className="text-sm text-neutral-600">Sync interval</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
              syncSettings?.reminderSettings.enabled ? 'bg-judicial-blue-100' : 'bg-neutral-100'
            }`}>
              <Bell className={`w-6 h-6 ${
                syncSettings?.reminderSettings.enabled ? 'text-judicial-blue-600' : 'text-neutral-500'
              }`} />
            </div>
            <p className="font-medium text-neutral-900">
              {syncSettings?.reminderSettings.enabled ? 'Enabled' : 'Disabled'}
            </p>
            <p className="text-sm text-neutral-600">Smart reminders</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};