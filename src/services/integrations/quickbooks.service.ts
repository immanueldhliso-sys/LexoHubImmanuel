import { BaseIntegrationService, OAuthConfig, SyncResult } from './base-integration.service';
import { supabase } from '../../lib/supabase';

interface QuickBooksInvoice {
  Id: string;
  DocNumber: string;
  TxnDate: string;
  CustomerRef: { value: string; name: string };
  TotalAmt: number;
  Balance: number;
  DueDate: string;
  Line: Array<{
    Description: string;
    Amount: number;
    DetailType: string;
  }>;
}

interface QuickBooksPayment {
  Id: string;
  TxnDate: string;
  TotalAmt: number;
  CustomerRef: { value: string; name: string };
  LinkedTxn: Array<{ TxnId: string; TxnType: string }>;
}

class QuickBooksService extends BaseIntegrationService {
  private baseUrl = 'https://quickbooks.api.intuit.com/v3/company';
  private sandboxUrl = 'https://sandbox-quickbooks.api.intuit.com/v3/company';

  constructor() {
    super('quickbooks', 'QuickBooks');
  }

  getOAuthConfig(): OAuthConfig {
    return {
      clientId: import.meta.env.VITE_QUICKBOOKS_CLIENT_ID || '',
      clientSecret: import.meta.env.VITE_QUICKBOOKS_CLIENT_SECRET || '',
      redirectUri: `${window.location.origin}/integrations/quickbooks/callback`,
      authorizationUrl: 'https://appcenter.intuit.com/connect/oauth2',
      tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
      scopes: ['com.intuit.quickbooks.accounting']
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
          expiresAt: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
          realmId: tokenData.realmId
        },
        settings: {
          syncFrequency: 'daily',
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
        throw new Error('Not authenticated with QuickBooks');
      }

      await this.syncInvoices(userId, config.credentials.accessToken, config.credentials.realmId);
      await this.syncPayments(userId, config.credentials.accessToken, config.credentials.realmId);

      result.success = true;
      result.recordsSynced = 0;

      await this.updateIntegrationStatus(userId, 'connected');
      await this.updateMetrics(userId, { totalRequests: 1, successfulRequests: 1 });
    } catch (error) {
      result.errors.push((error as Error).message);
      await this.updateIntegrationStatus(userId, 'error', (error as Error).message);
      await this.updateMetrics(userId, { totalRequests: 1, failedRequests: 1 });
    }

    return result;
  }

  private async syncInvoices(userId: string, accessToken: string, realmId: string): Promise<void> {
    const url = `${this.baseUrl}/${realmId}/query?query=SELECT * FROM Invoice WHERE MetaData.LastUpdatedTime > '2024-01-01'`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch invoices: ${response.statusText}`);
    }

    const data = await response.json();
    const invoices: QuickBooksInvoice[] = data.QueryResponse?.Invoice || [];

    for (const qbInvoice of invoices) {
      const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('external_id', qbInvoice.Id)
        .eq('user_id', userId)
        .single();

      if (!existingInvoice) {
        await supabase.from('invoices').insert({
          user_id: userId,
          external_id: qbInvoice.Id,
          invoice_number: qbInvoice.DocNumber,
          issue_date: qbInvoice.TxnDate,
          due_date: qbInvoice.DueDate,
          total_amount: qbInvoice.TotalAmt,
          status: qbInvoice.Balance > 0 ? 'pending' : 'paid',
          sync_source: 'quickbooks'
        });
      }
    }
  }

  private async syncPayments(userId: string, accessToken: string, realmId: string): Promise<void> {
    const url = `${this.baseUrl}/${realmId}/query?query=SELECT * FROM Payment WHERE MetaData.LastUpdatedTime > '2024-01-01'`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch payments: ${response.statusText}`);
    }

    const data = await response.json();
    const payments: QuickBooksPayment[] = data.QueryResponse?.Payment || [];

    for (const qbPayment of payments) {
      const linkedInvoiceId = qbPayment.LinkedTxn?.find(txn => txn.TxnType === 'Invoice')?.TxnId;
      
      if (linkedInvoiceId) {
        const { data: invoice } = await supabase
          .from('invoices')
          .select('id')
          .eq('external_id', linkedInvoiceId)
          .eq('user_id', userId)
          .single();

        if (invoice) {
          await supabase.from('payments').insert({
            user_id: userId,
            invoice_id: invoice.id,
            amount: qbPayment.TotalAmt,
            payment_date: qbPayment.TxnDate,
            payment_method: 'bank_transfer',
            external_id: qbPayment.Id,
            sync_source: 'quickbooks'
          });
        }
      }
    }
  }

  async exportInvoice(userId: string, invoiceId: string): Promise<void> {
    const config = await this.getConfig(userId);
    if (!config?.credentials?.accessToken) {
      throw new Error('Not authenticated with QuickBooks');
    }

    const { data: invoice } = await supabase
      .from('invoices')
      .select('*, matters(*), clients(*)')
      .eq('id', invoiceId)
      .single();

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const qbInvoice = {
      CustomerRef: {
        value: invoice.clients?.external_id || 'new',
        name: invoice.clients?.name
      },
      Line: invoice.line_items?.map((item: any) => ({
        Description: item.description,
        Amount: item.amount,
        DetailType: 'SalesItemLineDetail',
        SalesItemLineDetail: {
          ItemRef: { value: '1' }
        }
      })) || [],
      DueDate: invoice.due_date,
      TxnDate: invoice.issue_date
    };

    const url = `${this.baseUrl}/${config.credentials.realmId}/invoice`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.credentials.accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(qbInvoice)
    });

    if (!response.ok) {
      throw new Error(`Failed to export invoice: ${response.statusText}`);
    }

    const result = await response.json();
    
    await supabase
      .from('invoices')
      .update({ external_id: result.Invoice.Id, sync_source: 'quickbooks' })
      .eq('id', invoiceId);

    await this.logWebhookEvent(userId, 'invoice.exported', { invoiceId, externalId: result.Invoice.Id });
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

export const quickBooksService = new QuickBooksService();
