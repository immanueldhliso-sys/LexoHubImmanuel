import { BaseIntegrationService, OAuthConfig, SyncResult } from './base-integration.service';
import { supabase } from '../../lib/supabase';

interface XeroInvoice {
  InvoiceID: string;
  InvoiceNumber: string;
  Type: string;
  Contact: { ContactID: string; Name: string };
  Date: string;
  DueDate: string;
  Total: number;
  AmountDue: number;
  Status: string;
  LineItems: Array<{
    Description: string;
    Quantity: number;
    UnitAmount: number;
    LineAmount: number;
  }>;
}

interface XeroPayment {
  PaymentID: string;
  Date: string;
  Amount: number;
  Invoice: { InvoiceID: string };
}

class XeroService extends BaseIntegrationService {
  private baseUrl = 'https://api.xero.com/api.xro/2.0';

  constructor() {
    super('xero', 'Xero');
  }

  getOAuthConfig(): OAuthConfig {
    return {
      clientId: import.meta.env.VITE_XERO_CLIENT_ID || '',
      clientSecret: import.meta.env.VITE_XERO_CLIENT_SECRET || '',
      redirectUri: `${window.location.origin}/integrations/xero/callback`,
      authorizationUrl: 'https://login.xero.com/identity/connect/authorize',
      tokenUrl: 'https://identity.xero.com/connect/token',
      scopes: ['accounting.transactions', 'accounting.contacts', 'accounting.settings']
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

      const tenantId = await this.getTenantId(tokenData.access_token);

      await this.saveConfig(userId, {
        integrationId: this.integrationId,
        userId,
        credentials: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
          tenantId
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

  private async getTenantId(accessToken: string): Promise<string> {
    const response = await fetch('https://api.xero.com/connections', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get Xero tenant ID');
    }

    const connections = await response.json();
    return connections[0]?.tenantId;
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
        throw new Error('Not authenticated with Xero');
      }

      const invoiceCount = await this.syncInvoices(userId, config.credentials.accessToken, config.credentials.tenantId);
      const paymentCount = await this.syncPayments(userId, config.credentials.accessToken, config.credentials.tenantId);

      result.success = true;
      result.recordsSynced = invoiceCount + paymentCount;

      await this.updateIntegrationStatus(userId, 'connected');
      await this.updateMetrics(userId, { totalRequests: 1, successfulRequests: 1 });
    } catch (error) {
      result.errors.push((error as Error).message);
      await this.updateIntegrationStatus(userId, 'error', (error as Error).message);
      await this.updateMetrics(userId, { totalRequests: 1, failedRequests: 1 });
    }

    return result;
  }

  private async syncInvoices(userId: string, accessToken: string, tenantId: string): Promise<number> {
    const url = `${this.baseUrl}/Invoices?where=Date>=DateTime(2024,1,1)`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'xero-tenant-id': tenantId,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch invoices: ${response.statusText}`);
    }

    const data = await response.json();
    const invoices: XeroInvoice[] = data.Invoices || [];

    for (const xeroInvoice of invoices) {
      const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('external_id', xeroInvoice.InvoiceID)
        .eq('user_id', userId)
        .single();

      if (!existingInvoice) {
        await supabase.from('invoices').insert({
          user_id: userId,
          external_id: xeroInvoice.InvoiceID,
          invoice_number: xeroInvoice.InvoiceNumber,
          issue_date: xeroInvoice.Date,
          due_date: xeroInvoice.DueDate,
          total_amount: xeroInvoice.Total,
          status: xeroInvoice.Status.toLowerCase() === 'paid' ? 'paid' : 'pending',
          sync_source: 'xero'
        });
      }
    }

    return invoices.length;
  }

  private async syncPayments(userId: string, accessToken: string, tenantId: string): Promise<number> {
    const url = `${this.baseUrl}/Payments?where=Date>=DateTime(2024,1,1)`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'xero-tenant-id': tenantId,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch payments: ${response.statusText}`);
    }

    const data = await response.json();
    const payments: XeroPayment[] = data.Payments || [];

    for (const xeroPayment of payments) {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('external_id', xeroPayment.Invoice.InvoiceID)
        .eq('user_id', userId)
        .single();

      if (invoice) {
        await supabase.from('payments').insert({
          user_id: userId,
          invoice_id: invoice.id,
          amount: xeroPayment.Amount,
          payment_date: xeroPayment.Date,
          payment_method: 'bank_transfer',
          external_id: xeroPayment.PaymentID,
          sync_source: 'xero'
        });
      }
    }

    return payments.length;
  }

  async exportInvoice(userId: string, invoiceId: string): Promise<void> {
    const config = await this.getConfig(userId);
    if (!config?.credentials?.accessToken) {
      throw new Error('Not authenticated with Xero');
    }

    const { data: invoice } = await supabase
      .from('invoices')
      .select('*, matters(*), clients(*)')
      .eq('id', invoiceId)
      .single();

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const xeroInvoice = {
      Type: 'ACCREC',
      Contact: {
        ContactID: invoice.clients?.external_id,
        Name: invoice.clients?.name
      },
      Date: invoice.issue_date,
      DueDate: invoice.due_date,
      LineItems: invoice.line_items?.map((item: any) => ({
        Description: item.description,
        Quantity: item.quantity || 1,
        UnitAmount: item.unit_price || item.amount,
        AccountCode: '200'
      })) || [],
      Status: 'DRAFT'
    };

    const url = `${this.baseUrl}/Invoices`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.credentials.accessToken}`,
        'xero-tenant-id': config.credentials.tenantId,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ Invoices: [xeroInvoice] })
    });

    if (!response.ok) {
      throw new Error(`Failed to export invoice: ${response.statusText}`);
    }

    const result = await response.json();
    
    await supabase
      .from('invoices')
      .update({ external_id: result.Invoices[0].InvoiceID, sync_source: 'xero' })
      .eq('id', invoiceId);

    await this.logWebhookEvent(userId, 'invoice.exported', { invoiceId, externalId: result.Invoices[0].InvoiceID });
  }

  async syncDisbursements(userId: string): Promise<void> {
    const config = await this.getConfig(userId);
    if (!config?.credentials?.accessToken) {
      throw new Error('Not authenticated with Xero');
    }

    const { data: disbursements } = await supabase
      .from('disbursements')
      .select('*')
      .eq('user_id', userId)
      .is('external_id', null);

    if (!disbursements || disbursements.length === 0) return;

    for (const disbursement of disbursements) {
      const xeroExpense = {
        Type: 'ACCPAY',
        Contact: {
          Name: disbursement.vendor_name || 'Disbursement'
        },
        Date: disbursement.date,
        LineItems: [{
          Description: disbursement.description,
          Quantity: 1,
          UnitAmount: disbursement.amount,
          AccountCode: '400'
        }],
        Status: 'DRAFT'
      };

      const url = `${this.baseUrl}/Invoices`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.credentials.accessToken}`,
          'xero-tenant-id': config.credentials.tenantId,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ Invoices: [xeroExpense] })
      });

      if (response.ok) {
        const result = await response.json();
        await supabase
          .from('disbursements')
          .update({ external_id: result.Invoices[0].InvoiceID, sync_source: 'xero' })
          .eq('id', disbursement.id);
      }
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

export const xeroService = new XeroService();
