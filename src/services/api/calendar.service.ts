import { toast } from 'react-hot-toast';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
  matterId?: string;
  eventType: 'court_hearing' | 'client_meeting' | 'deadline' | 'reminder' | 'other';
  source: 'google' | 'outlook' | 'manual';
  isAllDay?: boolean;
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: Date;
  };
}

export interface CalendarProvider {
  id: string;
  name: string;
  type: 'google' | 'outlook';
  isConnected: boolean;
  email?: string;
  lastSync?: Date;
  syncEnabled: boolean;
}

export interface CalendarSyncSettings {
  autoSync: boolean;
  syncInterval: number; // minutes
  syncCourtEvents: boolean;
  syncClientMeetings: boolean;
  syncDeadlines: boolean;
  reminderSettings: {
    enabled: boolean;
    defaultReminders: number[]; // minutes before event
  };
}

class CalendarService {
  private googleAuth: any = null;
  private outlookAuth: any = null;
  private syncSettings: CalendarSyncSettings = {
    autoSync: true,
    syncInterval: 15,
    syncCourtEvents: true,
    syncClientMeetings: true,
    syncDeadlines: true,
    reminderSettings: {
      enabled: true,
      defaultReminders: [1440, 60, 15] // 24h, 1h, 15min
    }
  };

  // Initialize calendar service
  async initialize(): Promise<void> {
    try {
      await this.loadGoogleCalendarAPI();
      await this.loadOutlookAPI();
      await this.loadSyncSettings();
    } catch (error) {
      console.error('Failed to initialize calendar service:', error);
    }
  }

  // Google Calendar Integration
  private async loadGoogleCalendarAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }

      // Load Google API script
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('auth2:client', {
          callback: () => {
            window.gapi.client.init({
              apiKey: process.env.VITE_GOOGLE_API_KEY,
              clientId: process.env.VITE_GOOGLE_CLIENT_ID,
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
              scope: 'https://www.googleapis.com/auth/calendar'
            }).then(() => {
              this.googleAuth = window.gapi.auth2.getAuthInstance();
              resolve();
            }).catch(reject);
          },
          onerror: reject
        });
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Microsoft Graph API for Outlook
  private async loadOutlookAPI(): Promise<void> {
    // In production, use Microsoft Graph SDK
    // For now, we'll use fetch API with proper authentication
    return Promise.resolve();
  }

  // Connect to Google Calendar
  async connectGoogleCalendar(): Promise<boolean> {
    try {
      if (!this.googleAuth) {
        throw new Error('Google Calendar API not loaded');
      }

      const authResult = await this.googleAuth.signIn();
      if (authResult.isSignedIn()) {
        const profile = authResult.getBasicProfile();
        
        // Store connection info
        localStorage.setItem('google_calendar_connected', 'true');
        localStorage.setItem('google_calendar_email', profile.getEmail());
        
        toast.success('Google Calendar connected successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to connect Google Calendar:', error);
      toast.error('Failed to connect Google Calendar');
      return false;
    }
  }

  // Connect to Outlook Calendar
  async connectOutlookCalendar(): Promise<boolean> {
    try {
      // Microsoft Graph authentication flow
      const clientId = process.env.VITE_MICROSOFT_CLIENT_ID;
      const redirectUri = `${window.location.origin}/auth/microsoft/callback`;
      const scopes = 'https://graph.microsoft.com/calendars.readwrite';
      
      const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
        `client_id=${clientId}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `response_mode=query`;

      // Open popup for authentication
      const popup = window.open(authUrl, 'outlook-auth', 'width=500,height=600');
      
      return new Promise((resolve) => {
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            // Check if authentication was successful
            const connected = localStorage.getItem('outlook_calendar_connected') === 'true';
            if (connected) {
              toast.success('Outlook Calendar connected successfully');
            }
            resolve(connected);
          }
        }, 1000);
      });
    } catch (error) {
      console.error('Failed to connect Outlook Calendar:', error);
      toast.error('Failed to connect Outlook Calendar');
      return false;
    }
  }

  // Get connected providers
  getConnectedProviders(): CalendarProvider[] {
    const providers: CalendarProvider[] = [];
    
    // Google Calendar
    const googleConnected = localStorage.getItem('google_calendar_connected') === 'true';
    if (googleConnected) {
      providers.push({
        id: 'google',
        name: 'Google Calendar',
        type: 'google',
        isConnected: true,
        email: localStorage.getItem('google_calendar_email') || undefined,
        lastSync: this.getLastSyncTime('google'),
        syncEnabled: true
      });
    }

    // Outlook Calendar
    const outlookConnected = localStorage.getItem('outlook_calendar_connected') === 'true';
    if (outlookConnected) {
      providers.push({
        id: 'outlook',
        name: 'Outlook Calendar',
        type: 'outlook',
        isConnected: true,
        email: localStorage.getItem('outlook_calendar_email') || undefined,
        lastSync: this.getLastSyncTime('outlook'),
        syncEnabled: true
      });
    }

    return providers;
  }

  // Sync events from all connected calendars
  async syncAllCalendars(): Promise<CalendarEvent[]> {
    const allEvents: CalendarEvent[] = [];
    const providers = this.getConnectedProviders();

    for (const provider of providers) {
      if (provider.syncEnabled) {
        try {
          const events = await this.syncCalendarProvider(provider.type);
          allEvents.push(...events);
        } catch (error) {
          console.error(`Failed to sync ${provider.name}:`, error);
          toast.error(`Failed to sync ${provider.name}`);
        }
      }
    }

    // Store last sync time
    localStorage.setItem('calendar_last_sync', new Date().toISOString());
    
    return allEvents;
  }

  // Sync specific calendar provider
  private async syncCalendarProvider(type: 'google' | 'outlook'): Promise<CalendarEvent[]> {
    if (type === 'google') {
      return this.syncGoogleCalendar();
    } else {
      return this.syncOutlookCalendar();
    }
  }

  // Sync Google Calendar events
  private async syncGoogleCalendar(): Promise<CalendarEvent[]> {
    try {
      if (!this.googleAuth?.isSignedIn.get()) {
        throw new Error('Google Calendar not connected');
      }

      const now = new Date();
      const timeMin = now.toISOString();
      const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

      const response = await window.gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime'
      });

      const events: CalendarEvent[] = response.result.items.map((event: any) => ({
        id: event.id,
        title: event.summary || 'Untitled Event',
        description: event.description,
        startTime: new Date(event.start.dateTime || event.start.date),
        endTime: new Date(event.end.dateTime || event.end.date),
        location: event.location,
        attendees: event.attendees?.map((a: any) => a.email) || [],
        eventType: this.categorizeEvent(event.summary || ''),
        source: 'google',
        isAllDay: !event.start.dateTime
      }));

      // Update last sync time
      localStorage.setItem('google_calendar_last_sync', new Date().toISOString());
      
      return events;
    } catch (error) {
      console.error('Failed to sync Google Calendar:', error);
      throw error;
    }
  }

  // Sync Outlook Calendar events
  private async syncOutlookCalendar(): Promise<CalendarEvent[]> {
    try {
      const accessToken = localStorage.getItem('outlook_access_token');
      if (!accessToken) {
        throw new Error('Outlook Calendar not connected');
      }

      const now = new Date();
      const timeMin = now.toISOString();
      const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const response = await fetch(`https://graph.microsoft.com/v1.0/me/calendar/events?$filter=start/dateTime ge '${timeMin}' and start/dateTime le '${timeMax}'&$orderby=start/dateTime`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Outlook events');
      }

      const data = await response.json();
      const events: CalendarEvent[] = data.value.map((event: any) => ({
        id: event.id,
        title: event.subject || 'Untitled Event',
        description: event.bodyPreview,
        startTime: new Date(event.start.dateTime),
        endTime: new Date(event.end.dateTime),
        location: event.location?.displayName,
        attendees: event.attendees?.map((a: any) => a.emailAddress.address) || [],
        eventType: this.categorizeEvent(event.subject || ''),
        source: 'outlook',
        isAllDay: event.isAllDay
      }));

      // Update last sync time
      localStorage.setItem('outlook_calendar_last_sync', new Date().toISOString());
      
      return events;
    } catch (error) {
      console.error('Failed to sync Outlook Calendar:', error);
      throw error;
    }
  }

  // Create event in calendar
  async createEvent(event: Omit<CalendarEvent, 'id' | 'source'>, provider: 'google' | 'outlook'): Promise<string> {
    if (provider === 'google') {
      return this.createGoogleEvent(event);
    } else {
      return this.createOutlookEvent(event);
    }
  }

  // Create Google Calendar event
  private async createGoogleEvent(event: Omit<CalendarEvent, 'id' | 'source'>): Promise<string> {
    try {
      if (!this.googleAuth?.isSignedIn.get()) {
        throw new Error('Google Calendar not connected');
      }

      const googleEvent = {
        summary: event.title,
        description: event.description,
        location: event.location,
        start: {
          dateTime: event.startTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: event.endTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        attendees: event.attendees?.map(email => ({ email })),
        reminders: {
          useDefault: false,
          overrides: this.syncSettings.reminderSettings.defaultReminders.map(minutes => ({
            method: 'popup',
            minutes
          }))
        }
      };

      const response = await window.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: googleEvent
      });

      return response.result.id;
    } catch (error) {
      console.error('Failed to create Google Calendar event:', error);
      throw error;
    }
  }

  // Create Outlook Calendar event
  private async createOutlookEvent(event: Omit<CalendarEvent, 'id' | 'source'>): Promise<string> {
    try {
      const accessToken = localStorage.getItem('outlook_access_token');
      if (!accessToken) {
        throw new Error('Outlook Calendar not connected');
      }

      const outlookEvent = {
        subject: event.title,
        body: {
          contentType: 'text',
          content: event.description || ''
        },
        start: {
          dateTime: event.startTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: event.endTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        location: {
          displayName: event.location || ''
        },
        attendees: event.attendees?.map(email => ({
          emailAddress: {
            address: email,
            name: email
          }
        })),
        reminderMinutesBeforeStart: this.syncSettings.reminderSettings.defaultReminders[0] || 15
      };

      const response = await fetch('https://graph.microsoft.com/v1.0/me/calendar/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(outlookEvent)
      });

      if (!response.ok) {
        throw new Error('Failed to create Outlook event');
      }

      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('Failed to create Outlook Calendar event:', error);
      throw error;
    }
  }

  // Categorize event based on title/description
  private categorizeEvent(title: string): CalendarEvent['eventType'] {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('court') || lowerTitle.includes('hearing') || lowerTitle.includes('trial')) {
      return 'court_hearing';
    }
    if (lowerTitle.includes('client') || lowerTitle.includes('meeting') || lowerTitle.includes('consultation')) {
      return 'client_meeting';
    }
    if (lowerTitle.includes('deadline') || lowerTitle.includes('due') || lowerTitle.includes('filing')) {
      return 'deadline';
    }
    if (lowerTitle.includes('reminder') || lowerTitle.includes('follow up')) {
      return 'reminder';
    }
    
    return 'other';
  }

  // Get last sync time for provider
  private getLastSyncTime(provider: string): Date | undefined {
    const lastSync = localStorage.getItem(`${provider}_calendar_last_sync`);
    return lastSync ? new Date(lastSync) : undefined;
  }

  // Load sync settings
  private async loadSyncSettings(): Promise<void> {
    const saved = localStorage.getItem('calendar_sync_settings');
    if (saved) {
      this.syncSettings = { ...this.syncSettings, ...JSON.parse(saved) };
    }
  }

  // Update sync settings
  async updateSyncSettings(settings: Partial<CalendarSyncSettings>): Promise<void> {
    this.syncSettings = { ...this.syncSettings, ...settings };
    localStorage.setItem('calendar_sync_settings', JSON.stringify(this.syncSettings));
  }

  // Get sync settings
  getSyncSettings(): CalendarSyncSettings {
    return { ...this.syncSettings };
  }

  // Disconnect calendar provider
  async disconnectProvider(type: 'google' | 'outlook'): Promise<void> {
    try {
      if (type === 'google' && this.googleAuth) {
        await this.googleAuth.signOut();
        localStorage.removeItem('google_calendar_connected');
        localStorage.removeItem('google_calendar_email');
        localStorage.removeItem('google_calendar_last_sync');
      } else if (type === 'outlook') {
        localStorage.removeItem('outlook_calendar_connected');
        localStorage.removeItem('outlook_calendar_email');
        localStorage.removeItem('outlook_calendar_last_sync');
        localStorage.removeItem('outlook_access_token');
      }
      
      toast.success(`${type === 'google' ? 'Google' : 'Outlook'} Calendar disconnected`);
    } catch (error) {
      console.error(`Failed to disconnect ${type} calendar:`, error);
      toast.error(`Failed to disconnect ${type === 'google' ? 'Google' : 'Outlook'} Calendar`);
    }
  }

  // Auto-sync functionality
  startAutoSync(): void {
    if (this.syncSettings.autoSync) {
      setInterval(() => {
        this.syncAllCalendars().catch(console.error);
      }, this.syncSettings.syncInterval * 60 * 1000);
    }
  }
}

export const calendarService = new CalendarService();