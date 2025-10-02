import { supabase } from '../lib/supabase';
import type { Integration, IntegrationStatus, APIConfig } from '../types/integrations';

class APIIntegrationsService {
  async getIntegrations(userId: string): Promise<Integration[]> {
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) throw error;

    return data || this.getDefaultIntegrations();
  }

  private getDefaultIntegrations(): Integration[] {
    return [
      {
        id: 'quickbooks',
        name: 'QuickBooks',
        description: 'Sync financial data and invoices',
        status: 'not_connected',
        category: 'accounting',
        configUrl: null,
        lastSync: null
      },
      {
        id: 'xero',
        name: 'Xero',
        description: 'Accounting and bookkeeping integration',
        status: 'not_connected',
        category: 'accounting',
        configUrl: null,
        lastSync: null
      },
      {
        id: 'docusign',
        name: 'DocuSign',
        description: 'Electronic signature management',
        status: 'not_connected',
        category: 'documents',
        configUrl: null,
        lastSync: null
      },
      {
        id: 'microsoft365',
        name: 'Microsoft 365',
        description: 'Email and document collaboration',
        status: 'not_connected',
        category: 'productivity',
        configUrl: null,
        lastSync: null
      },
      {
        id: 'slack',
        name: 'Slack',
        description: 'Team communication and notifications',
        status: 'not_connected',
        category: 'communication',
        configUrl: null,
        lastSync: null
      },
      {
        id: 'zoom',
        name: 'Zoom',
        description: 'Video conferencing integration',
        status: 'not_connected',
        category: 'communication',
        configUrl: null,
        lastSync: null
      }
    ];
  }

  async getAPIConfig(userId: string): Promise<APIConfig> {
    const { data, error } = await supabase
      .from('api_configurations')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      return await this.createAPIConfig(userId);
    }

    return {
      apiKey: data.api_key,
      webhookUrl: data.webhook_url || '',
      rateLimit: data.rate_limit || '100',
      recentActivity: data.recent_activity || []
    };
  }

  private async createAPIConfig(userId: string): Promise<APIConfig> {
    const apiKey = this.generateAPIKey();
    
    const { data, error } = await supabase
      .from('api_configurations')
      .insert({
        user_id: userId,
        api_key: apiKey,
        rate_limit: '100',
        webhook_url: '',
        recent_activity: []
      })
      .select()
      .single();

    if (error) throw error;

    return {
      apiKey: data.api_key,
      webhookUrl: data.webhook_url || '',
      rateLimit: data.rate_limit || '100',
      recentActivity: []
    };
  }

  async connectIntegration(integrationId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('integrations')
      .upsert({
        id: integrationId,
        user_id: userId,
        status: 'connected',
        connected_at: new Date().toISOString(),
        last_sync: new Date().toISOString()
      });

    if (error) throw error;

    await this.logActivity(userId, `Connected ${integrationId}`, 'success');
  }

  async disconnectIntegration(integrationId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('integrations')
      .update({
        status: 'not_connected',
        disconnected_at: new Date().toISOString()
      })
      .eq('id', integrationId)
      .eq('user_id', userId);

    if (error) throw error;

    await this.logActivity(userId, `Disconnected ${integrationId}`, 'success');
  }

  async regenerateAPIKey(userId: string): Promise<APIConfig> {
    const newApiKey = this.generateAPIKey();

    const { data, error } = await supabase
      .from('api_configurations')
      .update({ api_key: newApiKey })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    await this.logActivity(userId, 'Regenerated API key', 'success');

    return {
      apiKey: data.api_key,
      webhookUrl: data.webhook_url || '',
      rateLimit: data.rate_limit || '100',
      recentActivity: data.recent_activity || []
    };
  }

  async updateWebhookURL(userId: string, webhookUrl: string): Promise<void> {
    const { error } = await supabase
      .from('api_configurations')
      .update({ webhook_url: webhookUrl })
      .eq('user_id', userId);

    if (error) throw error;

    await this.logActivity(userId, 'Updated webhook URL', 'success');
  }

  async updateRateLimit(userId: string, rateLimit: string): Promise<void> {
    const { error } = await supabase
      .from('api_configurations')
      .update({ rate_limit: rateLimit })
      .eq('user_id', userId);

    if (error) throw error;

    await this.logActivity(userId, `Updated rate limit to ${rateLimit}`, 'success');
  }

  private async logActivity(
    userId: string,
    action: string,
    status: 'success' | 'error'
  ): Promise<void> {
    const { data: config } = await supabase
      .from('api_configurations')
      .select('recent_activity')
      .eq('user_id', userId)
      .single();

    const recentActivity = config?.recent_activity || [];
    const newActivity = {
      action,
      status,
      timestamp: new Date().toLocaleString()
    };

    const updatedActivity = [newActivity, ...recentActivity].slice(0, 10);

    await supabase
      .from('api_configurations')
      .update({ recent_activity: updatedActivity })
      .eq('user_id', userId);
  }

  private generateAPIKey(): string {
    const prefix = 'lxh_';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = prefix;
    
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return key;
  }

  async testWebhook(userId: string, webhookUrl: string): Promise<boolean> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-LexoHub-Test': 'true'
        },
        body: JSON.stringify({
          event: 'test',
          timestamp: new Date().toISOString(),
          userId
        })
      });

      const success = response.ok;
      await this.logActivity(
        userId,
        `Webhook test ${success ? 'succeeded' : 'failed'}`,
        success ? 'success' : 'error'
      );

      return success;
    } catch (error) {
      await this.logActivity(userId, 'Webhook test failed', 'error');
      return false;
    }
  }

  async getIntegrationConfig(integrationId: string, userId: string): Promise<any> {
    const { data, error } = await supabase
      .from('integration_configs')
      .select('*')
      .eq('integration_id', integrationId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data?.config || {};
  }

  async updateIntegrationConfig(
    integrationId: string,
    userId: string,
    config: any
  ): Promise<void> {
    const { error } = await supabase
      .from('integration_configs')
      .upsert({
        integration_id: integrationId,
        user_id: userId,
        config,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    await this.logActivity(userId, `Updated ${integrationId} configuration`, 'success');
  }
}

export const apiIntegrationsService = new APIIntegrationsService();
