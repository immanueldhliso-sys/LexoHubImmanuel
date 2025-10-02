import { BaseIntegrationService, OAuthConfig, SyncResult } from './base-integration.service';
import { supabase } from '../../lib/supabase';

interface ZoomMeeting {
  id: string;
  topic: string;
  type: number;
  start_time: string;
  duration: number;
  timezone: string;
  join_url: string;
  password?: string;
}

interface MeetingRequest {
  topic: string;
  startTime: string;
  duration: number;
  agenda?: string;
  attendees?: string[];
  matterId?: string;
}

class ZoomService extends BaseIntegrationService {
  private baseUrl = 'https://api.zoom.us/v2';

  constructor() {
    super('zoom', 'Zoom');
  }

  getOAuthConfig(): OAuthConfig {
    return {
      clientId: import.meta.env.VITE_ZOOM_CLIENT_ID || '',
      clientSecret: import.meta.env.VITE_ZOOM_CLIENT_SECRET || '',
      redirectUri: `${window.location.origin}/integrations/zoom/callback`,
      authorizationUrl: 'https://zoom.us/oauth/authorize',
      tokenUrl: 'https://zoom.us/oauth/token',
      scopes: ['meeting:write', 'meeting:read', 'recording:read', 'user:read']
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
          syncFrequency: 'realtime',
          autoSync: true,
          notifications: true,
          recordMeetings: true,
          autoTimeEntry: true
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
        throw new Error('Not authenticated with Zoom');
      }

      const meetingCount = await this.syncMeetings(userId, config.credentials.accessToken);

      result.success = true;
      result.recordsSynced = meetingCount;

      await this.updateIntegrationStatus(userId, 'connected');
      await this.updateMetrics(userId, { totalRequests: 1, successfulRequests: 1 });
    } catch (error) {
      result.errors.push((error as Error).message);
      await this.updateIntegrationStatus(userId, 'error', (error as Error).message);
      await this.updateMetrics(userId, { totalRequests: 1, failedRequests: 1 });
    }

    return result;
  }

  private async syncMeetings(userId: string, accessToken: string): Promise<number> {
    const response = await fetch(`${this.baseUrl}/users/me/meetings?type=scheduled`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch meetings: ${response.statusText}`);
    }

    const data = await response.json();
    const meetings: ZoomMeeting[] = data.meetings || [];

    for (const meeting of meetings) {
      const { data: existingMeeting } = await supabase
        .from('meetings')
        .select('id')
        .eq('external_id', meeting.id.toString())
        .eq('user_id', userId)
        .single();

      if (!existingMeeting) {
        await supabase.from('meetings').insert({
          user_id: userId,
          external_id: meeting.id.toString(),
          title: meeting.topic,
          start_time: meeting.start_time,
          duration: meeting.duration,
          join_url: meeting.join_url,
          password: meeting.password,
          sync_source: 'zoom'
        });
      }
    }

    return meetings.length;
  }

  async createMeeting(userId: string, request: MeetingRequest): Promise<ZoomMeeting> {
    const config = await this.getConfig(userId);
    if (!config?.credentials?.accessToken) {
      throw new Error('Not authenticated with Zoom');
    }

    const meetingData = {
      topic: request.topic,
      type: 2,
      start_time: request.startTime,
      duration: request.duration,
      timezone: 'Africa/Johannesburg',
      agenda: request.agenda || '',
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: true,
        watermark: false,
        use_pmi: false,
        approval_type: 0,
        audio: 'both',
        auto_recording: config.settings?.recordMeetings ? 'cloud' : 'none'
      }
    };

    const response = await fetch(`${this.baseUrl}/users/me/meetings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.credentials.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(meetingData)
    });

    if (!response.ok) {
      throw new Error(`Failed to create meeting: ${response.statusText}`);
    }

    const meeting: ZoomMeeting = await response.json();

    await supabase.from('meetings').insert({
      user_id: userId,
      external_id: meeting.id.toString(),
      title: meeting.topic,
      start_time: meeting.start_time,
      duration: meeting.duration,
      join_url: meeting.join_url,
      password: meeting.password,
      matter_id: request.matterId,
      sync_source: 'zoom'
    });

    if (config.settings?.autoTimeEntry && request.matterId) {
      await this.createTimeEntry(userId, request.matterId, meeting);
    }

    await this.logWebhookEvent(userId, 'meeting.created', { 
      meetingId: meeting.id, 
      topic: meeting.topic,
      matterId: request.matterId 
    });

    return meeting;
  }

  private async createTimeEntry(userId: string, matterId: string, meeting: ZoomMeeting): Promise<void> {
    await supabase.from('time_entries').insert({
      user_id: userId,
      matter_id: matterId,
      description: `Video consultation: ${meeting.topic}`,
      start_time: meeting.start_time,
      duration_minutes: meeting.duration,
      entry_type: 'consultation',
      billable: true,
      external_id: meeting.id.toString(),
      sync_source: 'zoom'
    });
  }

  async getMeetingDetails(userId: string, meetingId: string): Promise<ZoomMeeting> {
    const config = await this.getConfig(userId);
    if (!config?.credentials?.accessToken) {
      throw new Error('Not authenticated with Zoom');
    }

    const response = await fetch(`${this.baseUrl}/meetings/${meetingId}`, {
      headers: {
        'Authorization': `Bearer ${config.credentials.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get meeting details: ${response.statusText}`);
    }

    return await response.json();
  }

  async deleteMeeting(userId: string, meetingId: string): Promise<void> {
    const config = await this.getConfig(userId);
    if (!config?.credentials?.accessToken) {
      throw new Error('Not authenticated with Zoom');
    }

    const response = await fetch(`${this.baseUrl}/meetings/${meetingId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${config.credentials.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete meeting: ${response.statusText}`);
    }

    await supabase
      .from('meetings')
      .delete()
      .eq('external_id', meetingId)
      .eq('user_id', userId);

    await this.logWebhookEvent(userId, 'meeting.deleted', { meetingId });
  }

  async getRecordings(userId: string, meetingId: string): Promise<any[]> {
    const config = await this.getConfig(userId);
    if (!config?.credentials?.accessToken) {
      throw new Error('Not authenticated with Zoom');
    }

    const response = await fetch(`${this.baseUrl}/meetings/${meetingId}/recordings`, {
      headers: {
        'Authorization': `Bearer ${config.credentials.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get recordings: ${response.statusText}`);
    }

    const data = await response.json();
    return data.recording_files || [];
  }

  async linkMeetingToMatter(userId: string, meetingId: string, matterId: string): Promise<void> {
    await supabase
      .from('meetings')
      .update({ matter_id: matterId })
      .eq('external_id', meetingId)
      .eq('user_id', userId);

    const { data: meeting } = await supabase
      .from('meetings')
      .select('title, start_time, duration')
      .eq('external_id', meetingId)
      .single();

    if (meeting) {
      await this.createTimeEntry(userId, matterId, {
        id: meetingId,
        topic: meeting.title,
        start_time: meeting.start_time,
        duration: meeting.duration,
        type: 2,
        timezone: 'Africa/Johannesburg',
        join_url: ''
      });
    }
  }

  async sendMeetingInvite(userId: string, meetingId: string, emails: string[]): Promise<void> {
    const meeting = await this.getMeetingDetails(userId, meetingId);

    for (const email of emails) {
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'meeting_invite',
        title: `Meeting Invitation: ${meeting.topic}`,
        message: `You have been invited to a Zoom meeting.\n\nTopic: ${meeting.topic}\nTime: ${new Date(meeting.start_time).toLocaleString()}\nDuration: ${meeting.duration} minutes\n\nJoin URL: ${meeting.join_url}`,
        metadata: {
          meetingId,
          joinUrl: meeting.join_url,
          recipientEmail: email
        }
      });
    }
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

export const zoomService = new ZoomService();
