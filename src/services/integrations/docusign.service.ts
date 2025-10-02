import { BaseIntegrationService, OAuthConfig, SyncResult } from './base-integration.service';
import { supabase } from '../../lib/supabase';

interface DocuSignEnvelope {
  envelopeId: string;
  status: string;
  emailSubject: string;
  createdDateTime: string;
  sentDateTime: string;
  completedDateTime?: string;
  recipients: {
    signers: Array<{
      email: string;
      name: string;
      status: string;
      signedDateTime?: string;
    }>;
  };
}

interface SigningRequest {
  documentId: string;
  signerEmail: string;
  signerName: string;
  emailSubject: string;
  emailBody: string;
  returnUrl?: string;
}

class DocuSignService extends BaseIntegrationService {

  constructor() {
    super('docusign', 'DocuSign');
  }

  getOAuthConfig(): OAuthConfig {
    return {
      clientId: import.meta.env.VITE_DOCUSIGN_CLIENT_ID || '',
      clientSecret: import.meta.env.VITE_DOCUSIGN_CLIENT_SECRET || '',
      redirectUri: `${window.location.origin}/integrations/docusign/callback`,
      authorizationUrl: 'https://account-d.docusign.com/oauth/auth',
      tokenUrl: 'https://account-d.docusign.com/oauth/token',
      scopes: ['signature', 'impersonation']
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

      const userInfo = await this.getUserInfo(tokenData.access_token);
      const accountId = userInfo.accounts[0].account_id;
      const baseUri = userInfo.accounts[0].base_uri;

      await this.saveConfig(userId, {
        integrationId: this.integrationId,
        userId,
        credentials: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
          accountId,
          baseUri
        },
        settings: {
          syncFrequency: 'realtime',
          autoSync: true,
          notifications: true
        }
      });

      await this.updateIntegrationStatus(userId, 'connected');
      await this.updateMetrics(userId, { totalRequests: 1, successfulRequests: 1 });
    } catch (error) {
      await this.updateIntegrationStatus(userId, 'error', (error as Error).message);
      throw error;
    }
  }

  private async getUserInfo(accessToken: string): Promise<any> {
    const response = await fetch('https://account-d.docusign.com/oauth/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get DocuSign user info');
    }

    return await response.json();
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
        throw new Error('Not authenticated with DocuSign');
      }

      const envelopeCount = await this.syncEnvelopes(userId, config.credentials);

      result.success = true;
      result.recordsSynced = envelopeCount;

      await this.updateIntegrationStatus(userId, 'connected');
      await this.updateMetrics(userId, { totalRequests: 1, successfulRequests: 1 });
    } catch (error) {
      result.errors.push((error as Error).message);
      await this.updateIntegrationStatus(userId, 'error', (error as Error).message);
      await this.updateMetrics(userId, { totalRequests: 1, failedRequests: 1 });
    }

    return result;
  }

  private async syncEnvelopes(userId: string, credentials: any): Promise<number> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);
    
    const url = `${credentials.baseUri}/restapi/v2.1/accounts/${credentials.accountId}/envelopes?from_date=${fromDate.toISOString()}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch envelopes: ${response.statusText}`);
    }

    const data = await response.json();
    const envelopes: DocuSignEnvelope[] = data.envelopes || [];

    for (const envelope of envelopes) {
      const { data: existingDoc } = await supabase
        .from('documents')
        .select('id')
        .eq('external_id', envelope.envelopeId)
        .eq('user_id', userId)
        .single();

      if (!existingDoc) {
        await supabase.from('documents').insert({
          user_id: userId,
          external_id: envelope.envelopeId,
          title: envelope.emailSubject,
          status: envelope.status.toLowerCase(),
          document_type: 'signature_request',
          created_at: envelope.createdDateTime,
          sync_source: 'docusign',
          metadata: {
            sentDateTime: envelope.sentDateTime,
            completedDateTime: envelope.completedDateTime,
            recipients: envelope.recipients
          }
        });
      }
    }

    return envelopes.length;
  }

  async sendForSignature(userId: string, request: SigningRequest): Promise<string> {
    const config = await this.getConfig(userId);
    if (!config?.credentials?.accessToken) {
      throw new Error('Not authenticated with DocuSign');
    }

    const { data: document } = await supabase
      .from('documents')
      .select('*, file_url')
      .eq('id', request.documentId)
      .single();

    if (!document) {
      throw new Error('Document not found');
    }

    const envelopeDefinition = {
      emailSubject: request.emailSubject,
      emailBlurb: request.emailBody,
      documents: [{
        documentId: '1',
        name: document.title,
        fileExtension: 'pdf',
        documentBase64: await this.getDocumentBase64(document.file_url)
      }],
      recipients: {
        signers: [{
          email: request.signerEmail,
          name: request.signerName,
          recipientId: '1',
          routingOrder: '1',
          tabs: {
            signHereTabs: [{
              documentId: '1',
              pageNumber: '1',
              xPosition: '100',
              yPosition: '100'
            }]
          }
        }]
      },
      status: 'sent'
    };

    const url = `${config.credentials.baseUri}/restapi/v2.1/accounts/${config.credentials.accountId}/envelopes`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.credentials.accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(envelopeDefinition)
    });

    if (!response.ok) {
      throw new Error(`Failed to send envelope: ${response.statusText}`);
    }

    const result = await response.json();
    
    await supabase
      .from('documents')
      .update({ 
        external_id: result.envelopeId, 
        sync_source: 'docusign',
        status: 'pending_signature'
      })
      .eq('id', request.documentId);

    await this.logWebhookEvent(userId, 'document.sent_for_signature', { 
      documentId: request.documentId, 
      envelopeId: result.envelopeId 
    });

    return result.envelopeId;
  }

  async getSigningUrl(userId: string, envelopeId: string, signerEmail: string): Promise<string> {
    const config = await this.getConfig(userId);
    if (!config?.credentials?.accessToken) {
      throw new Error('Not authenticated with DocuSign');
    }

    const recipientView = {
      returnUrl: `${window.location.origin}/documents/signed`,
      authenticationMethod: 'email',
      email: signerEmail,
      userName: signerEmail,
      clientUserId: signerEmail
    };

    const url = `${config.credentials.baseUri}/restapi/v2.1/accounts/${config.credentials.accountId}/envelopes/${envelopeId}/views/recipient`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.credentials.accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(recipientView)
    });

    if (!response.ok) {
      throw new Error(`Failed to get signing URL: ${response.statusText}`);
    }

    const result = await response.json();
    return result.url;
  }

  async getEnvelopeStatus(userId: string, envelopeId: string): Promise<string> {
    const config = await this.getConfig(userId);
    if (!config?.credentials?.accessToken) {
      throw new Error('Not authenticated with DocuSign');
    }

    const url = `${config.credentials.baseUri}/restapi/v2.1/accounts/${config.credentials.accountId}/envelopes/${envelopeId}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${config.credentials.accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get envelope status: ${response.statusText}`);
    }

    const result = await response.json();
    return result.status;
  }

  private async getDocumentBase64(fileUrl: string): Promise<string> {
    const response = await fetch(fileUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
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

export const docuSignService = new DocuSignService();
