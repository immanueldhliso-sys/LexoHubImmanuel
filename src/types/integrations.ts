export type IntegrationStatus = 'connected' | 'not_connected' | 'error' | 'pending';

export type IntegrationCategory = 'accounting' | 'documents' | 'productivity' | 'communication' | 'legal' | 'other';

export interface Integration {
  id: string;
  name: string;
  description: string;
  status: IntegrationStatus;
  category: IntegrationCategory;
  configUrl: string | null;
  lastSync: string | null;
  icon?: string;
  connectedAt?: string;
  disconnectedAt?: string;
  errorMessage?: string;
}

export interface APIConfig {
  apiKey: string;
  webhookUrl: string;
  rateLimit: string;
  recentActivity: ActivityLog[];
}

export interface ActivityLog {
  action: string;
  status: 'success' | 'error';
  timestamp: string;
  details?: string;
}

export interface IntegrationConfig {
  integrationId: string;
  userId: string;
  config: Record<string, any>;
  credentials?: {
    clientId?: string;
    clientSecret?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: string;
    realmId?: string;
    tenantId?: string;
    accountId?: string;
    baseUri?: string;
    botToken?: string;
    teamId?: string;
    teamName?: string;
    webhookUrl?: string;
    [key: string]: any;
  };
  settings?: {
    syncFrequency?: 'realtime' | 'hourly' | 'daily' | 'weekly';
    autoSync?: boolean;
    notifications?: boolean;
    recordMeetings?: boolean;
    autoTimeEntry?: boolean;
    syncEmails?: boolean;
    syncCalendar?: boolean;
    syncDocuments?: boolean;
    defaultChannel?: string;
    [key: string]: any;
  };
}

export interface WebhookEvent {
  event: string;
  timestamp: string;
  userId: string;
  data: Record<string, any>;
}

export interface IntegrationMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastRequestTime: string;
  rateLimitRemaining: number;
}
