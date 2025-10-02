import { BaseIntegrationService, OAuthConfig, SyncResult } from './base-integration.service';
import { supabase } from '../../lib/supabase';

interface OutlookEmail {
  id: string;
  subject: string;
  bodyPreview: string;
  from: { emailAddress: { address: string; name: string } };
  receivedDateTime: string;
  hasAttachments: boolean;
  categories: string[];
}

interface CalendarEvent {
  id: string;
  subject: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  location: { displayName: string };
  attendees: Array<{ emailAddress: { address: string; name: string } }>;
}

class Microsoft365Service extends BaseIntegrationService {
  private graphUrl = 'https://graph.microsoft.com/v1.0';

  constructor() {
    super('microsoft365', 'Microsoft 365');
  }

  getOAuthConfig(): OAuthConfig {
    return {
      clientId: import.meta.env.VITE_MS365_CLIENT_ID || '',
      clientSecret: import.meta.env.VITE_MS365_CLIENT_SECRET || '',
      redirectUri: `${window.location.origin}/integrations/microsoft365/callback`,
      authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      scopes: [
        'User.Read',
        'Mail.Read',
        'Mail.Send',
        'Calendars.ReadWrite',
        'Files.ReadWrite.All',
        'offline_access'
      ]
    };
  }

  async exchangeCodeForToken(code: string, userId: string): Promise<void> {
    try {
      const config = this.getOAuthConfig();
      const tokenData = await this.exchangeToken(
        config.tokenUrl,
        config.clientId,
        config.clientSecret,
        code,
        config.redirectUri
      );

      await this.saveConfig(userId, {
        integrationId: this.integrationId,
        userId,
        credentials: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt: new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        },
        settings: {
          syncFrequency: 'hourly',
          autoSync: true,
          notifications: true,
          syncEmails: true,
          syncCalendar: true,
          syncDocuments: false
        }
      });

      await this.updateIntegrationStatus(userId, 'connected');
      await this.updateMetrics(userId, { totalRequests: 1, successfulRequests: 1 });
    } catch (error) {
      await this.updateIntegrationStatus(userId, 'error', (error as Error).message);
      throw error;
    }
  }

  async refreshAccessToken(userId: string): Promise<void> {
    const config = await this.getConfig(userId);
    if (!config?.credentials?.refreshToken) {
      throw new Error('No refresh token available');
    }

    const oauthConfig = this.getOAuthConfig();
    const tokenData = await this.refreshToken(
      oauthConfig.tokenUrl,
      oauthConfig.clientId,
      oauthConfig.clientSecret,
      config.credentials.refreshToken
    );

    await this.saveConfig(userId, {
      integrationId: this.integrationId,
      userId,
      credentials: {
        ...config.credentials,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || config.credentials.refreshToken,
        expiresAt: new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      }
    });
  }

  async syncData(userId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      recordsSynced: 0,
      errors: [],
      lastSyncTime: new Date().toISOString()
    };

    try {
      const config = await this.getConfig(userId);
      if (!config?.credentials?.accessToken) {
        throw new Error('Not authenticated with Microsoft 365');
      }

      let recordCount = 0;

      if (config.settings?.syncEmails) {
        recordCount += await this.syncEmails(userId, config.credentials.accessToken);
      }

      if (config.settings?.syncCalendar) {
        recordCount += await this.syncCalendar(userId, config.credentials.accessToken);
      }

      result.success = true;
      result.recordsSynced = recordCount;

      await this.updateIntegrationStatus(userId, 'connected');
      await this.updateMetrics(userId, { totalRequests: 1, successfulRequests: 1 });
    } catch (error) {
      result.errors.push((error as Error).message);
      await this.updateIntegrationStatus(userId, 'error', (error as Error).message);
      await this.updateMetrics(userId, { totalRequests: 1, failedRequests: 1 });
    }

    return result;
  }

  private async syncEmails(userId: string, accessToken: string): Promise<number> {
    const url = `${this.graphUrl}/me/messages?$top=50&$filter=receivedDateTime ge ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch emails: ${response.statusText}`);
    }

    const data = await response.json();
    const emails: OutlookEmail[] = data.value || [];

    for (const email of emails) {
      const { data: existingEmail } = await supabase
        .from('communications')
        .select('id')
        .eq('external_id', email.id)
        .eq('user_id', userId)
        .single();

      if (!existingEmail) {
        await supabase.from('communications').insert({
          user_id: userId,
          external_id: email.id,
          type: 'email',
          subject: email.subject,
          content: email.bodyPreview,
          from_address: email.from.emailAddress.address,
          from_name: email.from.emailAddress.name,
          received_at: email.receivedDateTime,
          has_attachments: email.hasAttachments,
          sync_source: 'microsoft365'
        });
      }
    }

    return emails.length;
  }

  private async syncCalendar(userId: string, accessToken: string): Promise<number> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const url = `${this.graphUrl}/me/calendar/events?$filter=start/dateTime ge '${startDate.toISOString()}' and end/dateTime le '${endDate.toISOString()}'`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch calendar events: ${response.statusText}`);
    }

    const data = await response.json();
    const events: CalendarEvent[] = data.value || [];

    for (const event of events) {
      const { data: existingEvent } = await supabase
        .from('calendar_events')
        .select('id')
        .eq('external_id', event.id)
        .eq('user_id', userId)
        .single();

      if (!existingEvent) {
        await supabase.from('calendar_events').insert({
          user_id: userId,
          external_id: event.id,
          title: event.subject,
          start_time: event.start.dateTime,
          end_time: event.end.dateTime,
          location: event.location?.displayName,
          sync_source: 'microsoft365',
          metadata: {
            attendees: event.attendees
          }
        });
      }
    }

    return events.length;
  }

  async sendEmail(userId: string, to: string, subject: string, body: string, attachments?: Array<{ name: string; content: string }>): Promise<void> {
    const config = await this.getConfig(userId);
    if (!config?.credentials?.accessToken) {
      throw new Error('Not authenticated with Microsoft 365');
    }

    const message = {
      message: {
        subject,
        body: {
          contentType: 'HTML',
          content: body
        },
        toRecipients: [{
          emailAddress: { address: to }
        }],
        attachments: attachments?.map(att => ({
          '@odata.type': '#microsoft.graph.fileAttachment',
          name: att.name,
          contentBytes: att.content
        })) || []
      }
    };

    const url = `${this.graphUrl}/me/sendMail`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.credentials.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });

    if (!response.ok) {
      throw new Error(`Failed to send email: ${response.statusText}`);
    }

    await this.logWebhookEvent(userId, 'email.sent', { to, subject });
  }

  async createCalendarEvent(userId: string, event: {
    subject: string;
    start: string;
    end: string;
    location?: string;
    attendees?: string[];
    body?: string;
  }): Promise<string> {
    const config = await this.getConfig(userId);
    if (!config?.credentials?.accessToken) {
      throw new Error('Not authenticated with Microsoft 365');
    }

    const calendarEvent = {
      subject: event.subject,
      body: {
        contentType: 'HTML',
        content: event.body || ''
      },
      start: {
        dateTime: event.start,
        timeZone: 'UTC'
      },
      end: {
        dateTime: event.end,
        timeZone: 'UTC'
      },
      location: event.location ? {
        displayName: event.location
      } : undefined,
      attendees: event.attendees?.map(email => ({
        emailAddress: { address: email },
        type: 'required'
      })) || []
    };

    const url = `${this.graphUrl}/me/calendar/events`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.credentials.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(calendarEvent)
    });

    if (!response.ok) {
      throw new Error(`Failed to create calendar event: ${response.statusText}`);
    }

    const result = await response.json();
    
    await supabase.from('calendar_events').insert({
      user_id: userId,
      external_id: result.id,
      title: event.subject,
      start_time: event.start,
      end_time: event.end,
      location: event.location,
      sync_source: 'microsoft365'
    });

    await this.logWebhookEvent(userId, 'calendar.event_created', { eventId: result.id, subject: event.subject });

    return result.id;
  }

  async categorizeEmail(userId: string, emailId: string, matterId: string): Promise<void> {
    const config = await this.getConfig(userId);
    if (!config?.credentials?.accessToken) {
      throw new Error('Not authenticated with Microsoft 365');
    }

    const { data: matter } = await supabase
      .from('matters')
      .select('title')
      .eq('id', matterId)
      .single();

    if (!matter) {
      throw new Error('Matter not found');
    }

    const url = `${this.graphUrl}/me/messages/${emailId}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${config.credentials.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        categories: [`Matter: ${matter.title}`]
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to categorize email: ${response.statusText}`);
    }

    await supabase
      .from('communications')
      .update({ matter_id: matterId })
      .eq('external_id', emailId)
      .eq('user_id', userId);
  }

  async disconnect(userId: string): Promise<void> {
    await this.saveConfig(userId, {
      integrationId: this.integrationId,
      userId,
      credentials: {},
      settings: {}
    });

    await this.updateIntegrationStatus(userId, 'not_connected');
  }
}

export const microsoft365Service = new Microsoft365Service();
