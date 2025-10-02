import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  RefreshCw, 
  Bell,
  MapPin,
  User,
  FileText,
  Settings,
  AlertTriangle,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { Card, CardHeader, CardContent, Button } from '../../design-system/components';
import { calendarService, CalendarEvent, CalendarProvider } from '../../services/api/calendar.service';
import { toast } from 'react-hot-toast';

export const AutomatedDiarySync: React.FC = () => {
  const [lastSync, setLastSync] = useState<string>('');
  const [syncStatus, setSyncStatus] = useState<'active' | 'inactive'>('inactive');
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [connectedProviders, setConnectedProviders] = useState<CalendarProvider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Initialize calendar service and load data
  useEffect(() => {
    const initializeCalendar = async () => {
      setIsLoading(true);
      try {
        await calendarService.initialize();
        await loadCalendarData();
        
        // Start auto-sync
        calendarService.startAutoSync();
      } catch (error) {
        console.error('Failed to initialize calendar service:', error);
        toast.error('Failed to initialize calendar service');
      } finally {
        setIsLoading(false);
      }
    };

    initializeCalendar();
  }, []);

  // Load calendar data
  const loadCalendarData = async () => {
    try {
      const providers = calendarService.getConnectedProviders();
      setConnectedProviders(providers);
      
      if (providers.length > 0) {
        setSyncStatus('active');
        const events = await calendarService.syncAllCalendars();
        setUpcomingEvents(events.slice(0, 5)); // Show only next 5 events
        
        // Update last sync time
        const lastSyncTime = localStorage.getItem('calendar_last_sync');
        if (lastSyncTime) {
          const syncDate = new Date(lastSyncTime);
          const now = new Date();
          const diffMinutes = Math.floor((now.getTime() - syncDate.getTime()) / (1000 * 60));
          
          if (diffMinutes < 1) {
            setLastSync('Just now');
          } else if (diffMinutes < 60) {
            setLastSync(`${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`);
          } else {
            const diffHours = Math.floor(diffMinutes / 60);
            setLastSync(`${diffHours} hour${diffHours > 1 ? 's' : ''} ago`);
          }
        }
      } else {
        setSyncStatus('inactive');
        setLastSync('Never');
      }
    } catch (error) {
      console.error('Failed to load calendar data:', error);
      setSyncStatus('inactive');
    }
  };

  // Manual sync
  const handleManualSync = async () => {
    if (connectedProviders.length === 0) {
      toast.error('No calendar providers connected');
      return;
    }

    setIsSyncing(true);
    try {
      const events = await calendarService.syncAllCalendars();
      setUpcomingEvents(events.slice(0, 5));
      setLastSync('Just now');
      toast.success('Calendar sync completed successfully');
    } catch (error) {
      console.error('Failed to sync calendars:', error);
      toast.error('Failed to sync calendars');
    } finally {
      setIsSyncing(false);
    }
  };

  // Connect Google Calendar
  const handleConnectGoogle = async () => {
    setIsLoading(true);
    try {
      const success = await calendarService.connectGoogleCalendar();
      if (success) {
        await loadCalendarData();
      }
    } catch (error) {
      console.error('Failed to connect Google Calendar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Connect Outlook Calendar
  const handleConnectOutlook = async () => {
    setIsLoading(true);
    try {
      const success = await calendarService.connectOutlookCalendar();
      if (success) {
        await loadCalendarData();
      }
    } catch (error) {
      console.error('Failed to connect Outlook Calendar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock court sync settings for display
  const syncSettings = [
    { name: 'Google Calendar', status: connectedProviders.find(p => p.type === 'google') ? 'active' : 'inactive', lastSync: connectedProviders.find(p => p.type === 'google')?.lastSync ? new Date(connectedProviders.find(p => p.type === 'google')!.lastSync!).toLocaleString() : 'Never' },
    { name: 'Outlook Calendar', status: connectedProviders.find(p => p.type === 'outlook') ? 'active' : 'inactive', lastSync: connectedProviders.find(p => p.type === 'outlook')?.lastSync ? new Date(connectedProviders.find(p => p.type === 'outlook')!.lastSync!).toLocaleString() : 'Never' },
    { name: 'Court Registry System', status: 'inactive', lastSync: 'Coming Soon' },
    { name: 'Case Management System', status: 'inactive', lastSync: 'Coming Soon' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-success-600 bg-success-100';
      case 'tentative':
        return 'text-warning-600 bg-warning-100';
      case 'cancelled':
        return 'text-error-600 bg-error-100';
      default:
        return 'text-neutral-600 bg-neutral-100';
    }
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-success-600 bg-success-100';
      case 'partial':
        return 'text-warning-600 bg-warning-100';
      case 'inactive':
        return 'text-error-600 bg-error-100';
      default:
        return 'text-neutral-600 bg-neutral-100';
    }
  };

  const getEventIcon = (eventType: CalendarEvent['eventType']) => {
    switch (eventType) {
      case 'court_hearing':
        return <FileText className="w-4 h-4" />;
      case 'client_meeting':
        return <User className="w-4 h-4" />;
      case 'deadline':
        return <AlertTriangle className="w-4 h-4" />;
      case 'reminder':
        return <Bell className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getEventTypeLabel = (eventType: CalendarEvent['eventType']) => {
    switch (eventType) {
      case 'court_hearing':
        return 'Court Hearing';
      case 'client_meeting':
        return 'Client Meeting';
      case 'deadline':
        return 'Deadline';
      case 'reminder':
        return 'Reminder';
      default:
        return 'Event';
    }
  };

  const formatEventDate = (date: Date) => {
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatEventTime = (startTime: Date, endTime: Date) => {
    const start = startTime.toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    return `${start} (${duration}min)`;
  };

  return (
    <div className="space-y-6">
      {/* Sync Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Sync Status</p>
                <p className={`text-lg font-semibold ${syncStatus === 'active' ? 'text-success-600' : 'text-error-600'}`}>
                  {syncStatus === 'active' ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div className={`p-2 rounded-full ${syncStatus === 'active' ? 'bg-success-100' : 'bg-error-100'}`}>
                {syncStatus === 'active' ? (
                  <CheckCircle className="w-6 h-6 text-success-600" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-error-600" />
                )}
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-2">Last sync: {lastSync}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Connected Courts</p>
                <p className="text-lg font-semibold text-neutral-900">3/4</p>
              </div>
              <MapPin className="w-6 h-6 text-judicial-blue-500" />
            </div>
            <p className="text-xs text-neutral-500 mt-2">Automatically syncing</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Upcoming Events</p>
                <p className="text-lg font-semibold text-neutral-900">{upcomingEvents.length}</p>
              </div>
              <Calendar className="w-6 h-6 text-mpondo-gold-500" />
            </div>
            <p className="text-xs text-neutral-500 mt-2">Next 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Auto Reminders</p>
                <p className="text-lg font-semibold text-success-600">Enabled</p>
              </div>
              <Bell className="w-6 h-6 text-success-500" />
            </div>
            <p className="text-xs text-neutral-500 mt-2">24h & 1h before events</p>
          </CardContent>
        </Card>
      </div>

      {/* Court Diary Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Court Diary Synchronization</h3>
              <p className="text-neutral-600">Automatic calendar sync with court systems</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </Button>
              <Button 
                onClick={handleManualSync}
                disabled={isSyncing || connectedProviders.length === 0}
                className="bg-mpondo-gold-600 hover:bg-mpondo-gold-700 disabled:opacity-50" 
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {syncSettings.map((court, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-neutral-500" />
                  <div>
                    <p className="font-medium text-neutral-900">{court.name}</p>
                    <p className="text-sm text-neutral-600">Last sync: {court.lastSync}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSyncStatusColor(court.status)}`}>
                    {court.status === 'active' ? 'Active' : 
                     court.status === 'partial' ? 'Partial' : 'Inactive'}
                  </span>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Calendar Events */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Upcoming Calendar Events</h3>
              <p className="text-neutral-600">Automatically synchronized court dates and appointments</p>
            </div>
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Full Calendar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-600 mb-2">No upcoming events</p>
                <p className="text-sm text-neutral-500">
                  {connectedProviders.length === 0 
                    ? 'Connect a calendar to see your events' 
                    : 'Your calendar is empty for the next 30 days'}
                </p>
              </div>
            ) : (
              upcomingEvents.map((event) => (
                <div key={event.id} className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-mpondo-gold-100 rounded-lg text-mpondo-gold-700">
                        {getEventIcon(event.eventType)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-neutral-900">{event.title}</h4>
                        <p className="text-sm text-neutral-600">{getEventTypeLabel(event.eventType)}</p>
                        {event.description && (
                          <p className="text-xs text-neutral-500 mt-1">{event.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        event.source === 'google' ? 'bg-blue-100 text-blue-700' : 
                        event.source === 'outlook' ? 'bg-orange-100 text-orange-700' : 
                        'bg-neutral-100 text-neutral-700'
                      }`}>
                        {event.source === 'google' ? 'Google' : 
                         event.source === 'outlook' ? 'Outlook' : 
                         'Manual'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-neutral-600">
                      <Calendar className="w-4 h-4" />
                      {formatEventDate(event.startTime)}
                    </div>
                    <div className="flex items-center gap-2 text-neutral-600">
                      <Clock className="w-4 h-4" />
                      {formatEventTime(event.startTime, event.endTime)}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-neutral-600">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </div>
                    )}
                  </div>

                  {event.attendees && event.attendees.length > 0 && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-neutral-600">
                      <User className="w-4 h-4" />
                      <span>{event.attendees.length} attendee{event.attendees.length > 1 ? 's' : ''}</span>
                    </div>
                  )}

                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline">
                      <FileText className="w-3 h-3 mr-1" />
                      View Details
                    </Button>
                    <Button size="sm" variant="outline">
                      <Bell className="w-3 h-3 mr-1" />
                      Set Reminder
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sync Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <RefreshCw className="w-12 h-12 text-mpondo-gold-500 mx-auto mb-4" />
            <h3 className="font-semibold text-neutral-900 mb-2">Real-time Sync</h3>
            <p className="text-sm text-neutral-600 mb-4">
              Automatic synchronization every 5 minutes ensures you never miss an update
            </p>
            <Button size="sm" variant="outline" className="w-full">
              Configure Frequency
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Bell className="w-12 h-12 text-judicial-blue-500 mx-auto mb-4" />
            <h3 className="font-semibold text-neutral-900 mb-2">Smart Reminders</h3>
            <p className="text-sm text-neutral-600 mb-4">
              Intelligent notifications for court dates, deadlines, and important events
            </p>
            <Button size="sm" variant="outline" className="w-full">
              Notification Settings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="w-12 h-12 text-success-500 mx-auto mb-4" />
            <h3 className="font-semibold text-neutral-900 mb-2">Calendar Integration</h3>
            <p className="text-sm text-neutral-600 mb-4">
              Seamless integration with Google Calendar, Outlook, and other calendar apps
            </p>
            <div className="space-y-2">
              <Button 
                onClick={handleConnectGoogle}
                disabled={isLoading || connectedProviders.some(p => p.type === 'google')}
                size="sm" 
                variant="outline" 
                className="w-full"
              >
                {connectedProviders.some(p => p.type === 'google') ? 'Google Connected' : 'Connect Google Calendar'}
              </Button>
              <Button 
                onClick={handleConnectOutlook}
                disabled={isLoading || connectedProviders.some(p => p.type === 'outlook')}
                size="sm" 
                variant="outline" 
                className="w-full"
              >
                {connectedProviders.some(p => p.type === 'outlook') ? 'Outlook Connected' : 'Connect Outlook Calendar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
