import { quickBooksService } from './quickbooks.service';
import { xeroService } from './xero.service';
import { docuSignService } from './docusign.service';
import { microsoft365Service } from './microsoft365.service';
import { slackService } from './slack.service';
import { zoomService } from './zoom.service';
import type { BaseIntegrationService } from './base-integration.service';

class IntegrationManager {
  private integrations: Map<string, BaseIntegrationService>;

  constructor() {
    this.integrations = new Map<string, BaseIntegrationService>();
    this.integrations.set('quickbooks', quickBooksService);
    this.integrations.set('xero', xeroService);
    this.integrations.set('docusign', docuSignService);
    this.integrations.set('microsoft365', microsoft365Service);
    this.integrations.set('slack', slackService);
    this.integrations.set('zoom', zoomService);
  }

  getIntegration(integrationId: string): BaseIntegrationService | undefined {
    return this.integrations.get(integrationId);
  }

  async handleOAuthCallback(
    integrationId: string,
    code: string,
    userId: string
  ): Promise<void> {
    const integration = this.getIntegration(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    await integration.exchangeCodeForToken(code, userId);
  }

  async syncIntegration(integrationId: string, userId: string): Promise<void> {
    const integration = this.getIntegration(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    await integration.syncData(userId);
  }

  async disconnectIntegration(integrationId: string, userId: string): Promise<void> {
    const integration = this.getIntegration(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    await integration.disconnect(userId);
  }

  getAuthorizationUrl(integrationId: string, userId: string): string {
    const integration = this.getIntegration(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    const config = integration.getOAuthConfig();
    const state = btoa(JSON.stringify({ userId, integrationId, timestamp: Date.now() }));
    
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scopes.join(' '),
      state
    });

    return `${config.authorizationUrl}?${params.toString()}`;
  }

  async syncAllIntegrations(userId: string): Promise<void> {
    const syncPromises = Array.from(this.integrations.keys()).map(async (integrationId) => {
      try {
        await this.syncIntegration(integrationId, userId);
      } catch (error) {
        console.error(`Failed to sync ${integrationId}:`, error);
      }
    });

    await Promise.allSettled(syncPromises);
  }
}

export const integrationManager = new IntegrationManager();
