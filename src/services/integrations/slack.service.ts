import { BaseIntegrationService, OAuthConfig, SyncResult } from './base-integration.service';

interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
  is_archived: boolean;
}


class SlackService extends BaseIntegrationService {
  private baseUrl = 'https://slack.com/api';

  constructor() {
    super('slack', 'Slack');
  }

  getOAuthConfig(): OAuthConfig {
    return {
      clientId: import.meta.env.VITE_SLACK_CLIENT_ID || '',
      clientSecret: import.meta.env.VITE_SLACK_CLIENT_SECRET || '',
      redirectUri: `${window.location.origin}/integrations/slack/callback`,
      authorizationUrl: 'https://slack.com/oauth/v2/authorize',
      tokenUrl: 'https://slack.com/api/oauth.v2.access',
      scopes: [
        'channels:read',
        'channels:write',
        'chat:write',
        'users:read',
        'files:read',
        'incoming-webhook'
      ]
    };
  }

  async exchangeCodeForToken(code: string, userId: string): Promise<void> {
    try {
      const config = this.getOAuthConfig();
      
      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code,
          redirect_uri: config.redirectUri
        })
      });

      const tokenData = await response.json();

      if (!tokenData.ok) {
        throw new Error(tokenData.error || 'Failed to exchange code');
      }

      await this.saveConfig(userId, {
        integrationId: this.integrationId,
        userId,
        credentials: {
          accessToken: tokenData.access_token,
          botToken: tokenData.bot_user_id,
          teamId: tokenData.team.id,
          teamName: tokenData.team.name,
          webhookUrl: tokenData.incoming_webhook?.url
        },
        settings: {
          syncFrequency: 'realtime',
          autoSync: true,
          notifications: true,
          defaultChannel: tokenData.incoming_webhook?.channel_id
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
    throw new Error('Slack tokens do not expire');
  }

  async syncData(_userId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      recordsSynced: 0,
      errors: [],
      lastSyncTime: new Date().toISOString()
    };

    return result;
  }

  async sendNotification(userId: string, message: string, channel?: string): Promise<void> {
    const config = await this.getConfig(userId);
    if (!config?.credentials?.accessToken) {
      throw new Error('Not authenticated with Slack');
    }

    const targetChannel = channel || config.settings?.defaultChannel;

    const response = await fetch(`${this.baseUrl}/chat.postMessage`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.credentials.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: targetChannel,
        text: message
      })
    });

    const result = await response.json();

    if (!result.ok) {
      throw new Error(result.error || 'Failed to send message');
    }

    await this.logWebhookEvent(userId, 'notification.sent', { channel: targetChannel, message });
  }

  async sendPaymentNotification(userId: string, paymentData: {
    clientName: string;
    amount: number;
    invoiceNumber: string;
    matterId: string;
  }): Promise<void> {
    const message = {
      text: `💰 Payment Received`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '💰 Payment Received'
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Client:*\n${paymentData.clientName}`
            },
            {
              type: 'mrkdwn',
              text: `*Amount:*\nR ${paymentData.amount.toFixed(2)}`
            },
            {
              type: 'mrkdwn',
              text: `*Invoice:*\n${paymentData.invoiceNumber}`
            },
            {
              type: 'mrkdwn',
              text: `*Matter ID:*\n${paymentData.matterId}`
            }
          ]
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Received at ${new Date().toLocaleString()}`
            }
          ]
        }
      ]
    };

    await this.sendRichMessage(userId, message);
  }

  async sendDeadlineReminder(userId: string, deadlineData: {
    matterTitle: string;
    deadlineType: string;
    dueDate: string;
    daysRemaining: number;
  }): Promise<void> {
    const urgencyEmoji = deadlineData.daysRemaining <= 1 ? '🚨' : deadlineData.daysRemaining <= 3 ? '⚠️' : '📅';
    
    const message = {
      text: `${urgencyEmoji} Deadline Reminder`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${urgencyEmoji} Deadline Reminder`
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Matter:*\n${deadlineData.matterTitle}`
            },
            {
              type: 'mrkdwn',
              text: `*Type:*\n${deadlineData.deadlineType}`
            },
            {
              type: 'mrkdwn',
              text: `*Due Date:*\n${new Date(deadlineData.dueDate).toLocaleDateString()}`
            },
            {
              type: 'mrkdwn',
              text: `*Days Remaining:*\n${deadlineData.daysRemaining} days`
            }
          ]
        }
      ]
    };

    await this.sendRichMessage(userId, message);
  }

  async sendMatterUpdate(userId: string, updateData: {
    matterTitle: string;
    updateType: string;
    description: string;
    updatedBy: string;
  }): Promise<void> {
    const message = {
      text: `📋 Matter Update: ${updateData.matterTitle}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '📋 Matter Update'
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Matter:*\n${updateData.matterTitle}`
            },
            {
              type: 'mrkdwn',
              text: `*Update Type:*\n${updateData.updateType}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Description:*\n${updateData.description}`
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Updated by ${updateData.updatedBy} at ${new Date().toLocaleString()}`
            }
          ]
        }
      ]
    };

    await this.sendRichMessage(userId, message);
  }

  private async sendRichMessage(userId: string, message: any): Promise<void> {
    const config = await this.getConfig(userId);
    if (!config?.credentials?.webhookUrl) {
      throw new Error('Webhook URL not configured');
    }

    const response = await fetch(config.credentials.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });

    if (!response.ok) {
      throw new Error('Failed to send rich message');
    }
  }

  async createChannel(userId: string, channelName: string, isPrivate: boolean = false): Promise<string> {
    const config = await this.getConfig(userId);
    if (!config?.credentials?.accessToken) {
      throw new Error('Not authenticated with Slack');
    }

    const response = await fetch(`${this.baseUrl}/conversations.create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.credentials.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: channelName,
        is_private: isPrivate
      })
    });

    const result = await response.json();

    if (!result.ok) {
      throw new Error(result.error || 'Failed to create channel');
    }

    return result.channel.id;
  }

  async listChannels(userId: string): Promise<SlackChannel[]> {
    const config = await this.getConfig(userId);
    if (!config?.credentials?.accessToken) {
      throw new Error('Not authenticated with Slack');
    }

    const response = await fetch(`${this.baseUrl}/conversations.list`, {
      headers: {
        'Authorization': `Bearer ${config.credentials.accessToken}`
      }
    });

    const result = await response.json();

    if (!result.ok) {
      throw new Error(result.error || 'Failed to list channels');
    }

    return result.channels;
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

export const slackService = new SlackService();
