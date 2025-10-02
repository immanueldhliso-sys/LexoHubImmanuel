import { supabase } from '../../lib/supabase';
import type { IntegrationConfig } from '../../types/integrations';

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
}

export interface SyncResult {
  success: boolean;
  recordsSynced: number;
  errors: string[];
  lastSyncTime: string;
}

export abstract class BaseIntegrationService {
  protected integrationId: string;
  protected integrationName: string;

  constructor(integrationId: string, integrationName: string) {
    this.integrationId = integrationId;
    this.integrationName = integrationName;
  }

  abstract getOAuthConfig(): OAuthConfig;
  abstract exchangeCodeForToken(code: string, userId: string): Promise<void>;
  abstract refreshAccessToken(userId: string): Promise<void>;
  abstract syncData(userId: string): Promise<SyncResult>;
  abstract disconnect(userId: string): Promise<void>;

  async getConfig(userId: string): Promise<IntegrationConfig | null> {
    const { data, error } = await supabase
      .from('integration_configs')
      .select('*')
      .eq('integration_id', this.integrationId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data ? {
      integrationId: data.integration_id,
      userId: data.user_id,
      config: data.config,
      credentials: data.credentials,
      settings: data.settings
    } : null;
  }

  async saveConfig(userId: string, config: Partial<IntegrationConfig>): Promise<void> {
    const { error } = await supabase
      .from('integration_configs')
      .upsert({
        integration_id: this.integrationId,
        user_id: userId,
        config: config.config || {},
        credentials: config.credentials || {},
        settings: config.settings || {},
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  async updateMetrics(userId: string, metrics: {
    totalRequests?: number;
    successfulRequests?: number;
    failedRequests?: number;
    averageResponseTime?: number;
  }): Promise<void> {
    const { data: existing } = await supabase
      .from('integration_metrics')
      .select('*')
      .eq('integration_id', this.integrationId)
      .eq('user_id', userId)
      .single();

    const updates = {
      integration_id: this.integrationId,
      user_id: userId,
      total_requests: (existing?.total_requests || 0) + (metrics.totalRequests || 0),
      successful_requests: (existing?.successful_requests || 0) + (metrics.successfulRequests || 0),
      failed_requests: (existing?.failed_requests || 0) + (metrics.failedRequests || 0),
      average_response_time: metrics.averageResponseTime || existing?.average_response_time || 0,
      last_request_time: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await supabase
      .from('integration_metrics')
      .upsert(updates);
  }

  async logWebhookEvent(userId: string, eventType: string, payload: any): Promise<void> {
    await supabase
      .from('webhook_events')
      .insert({
        user_id: userId,
        event_type: eventType,
        payload,
        status: 'pending',
        attempts: 0
      });
  }

  protected async updateIntegrationStatus(
    userId: string,
    status: 'connected' | 'not_connected' | 'error',
    errorMessage?: string
  ): Promise<void> {
    await supabase
      .from('integrations')
      .update({
        status,
        error_message: errorMessage,
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', this.integrationId)
      .eq('user_id', userId);
  }

  protected buildAuthorizationUrl(config: OAuthConfig, state: string): string {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scopes.join(' '),
      state
    });

    return `${config.authorizationUrl}?${params.toString()}`;
  }

  protected async exchangeToken(
    tokenUrl: string,
    clientId: string,
    clientSecret: string,
    code: string,
    redirectUri: string
  ): Promise<any> {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      })
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    return await response.json();
  }

  protected async refreshToken(
    tokenUrl: string,
    clientId: string,
    clientSecret: string,
    refreshToken: string
  ): Promise<any> {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }

    return await response.json();
  }
}
