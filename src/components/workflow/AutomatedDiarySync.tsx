import React, { useState } from 'react';
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

export const AutomatedDiarySync: React.FC = () => {
  const [lastSync, setLastSync] = useState('2 minutes ago');
  const [syncStatus, setSyncStatus] = useState('active');

  const upcomingEvents = [
    {
      id: '1',
      type: 'Court Hearing',
      title: 'Smith v Jones - Motion Hearing',
      court: 'Gauteng High Court',
      judge: 'Judge A.B. Mthembu',
      date: '2024-02-15',
      time: '09:00',
      duration: 60,
      status: 'confirmed',
      matter: 'Commercial Dispute'
    },
    {
      id: '2',
      type: 'Case Management',
      title: 'ABC Corp v XYZ - Case Management',
      court: 'Gauteng High Court',
      judge: 'Judge C.D. Pillay',
      date: '2024-02-16',
      time: '10:30',
      duration: 30,
      status: 'tentative',
      matter: 'Contract Dispute'
    },
    {
      id: '3',
      type: 'Consultation',
      title: 'Client Meeting - Estate Planning',
      court: 'Chambers',
      judge: null,
      date: '2024-02-17',
      time: '14:00',
      duration: 90,
      status: 'confirmed',
      matter: 'Estate Planning'
    }
  ];

  const syncSettings = [
    { name: 'Gauteng High Court', status: 'active', lastSync: '2 minutes ago' },
    { name: 'Western Cape High Court', status: 'inactive', lastSync: 'Never' },
    { name: 'Magistrates Courts', status: 'partial', lastSync: '1 hour ago' },
    { name: 'Supreme Court of Appeal', status: 'active', lastSync: '5 minutes ago' }
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

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'Court Hearing':
        return <FileText className="w-4 h-4" />;
      case 'Case Management':
        return <Settings className="w-4 h-4" />;
      case 'Consultation':
        return <User className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
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
                onClick={() => setLastSync('Just now')}
                className="bg-mpondo-gold-600 hover:bg-mpondo-gold-700" 
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Now
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
            {upcomingEvents.map((event) => (
              <div key={event.id} className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-mpondo-gold-100 rounded-lg text-mpondo-gold-700">
                      {getEventIcon(event.type)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-neutral-900">{event.title}</h4>
                      <p className="text-sm text-neutral-600">{event.matter}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                    {event.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-neutral-600">
                    <Calendar className="w-4 h-4" />
                    {event.date}
                  </div>
                  <div className="flex items-center gap-2 text-neutral-600">
                    <Clock className="w-4 h-4" />
                    {event.time} ({event.duration}min)
                  </div>
                  <div className="flex items-center gap-2 text-neutral-600">
                    <MapPin className="w-4 h-4" />
                    {event.court}
                  </div>
                  {event.judge && (
                    <div className="flex items-center gap-2 text-neutral-600">
                      <User className="w-4 h-4" />
                      {event.judge}
                    </div>
                  )}
                </div>

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
            ))}
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
            <Button size="sm" variant="outline" className="w-full">
              Connect Calendar
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
