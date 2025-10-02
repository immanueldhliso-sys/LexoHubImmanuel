# Integration Quick Reference

## Import Statements

```typescript
// Import all services
import {
  integrationManager,
  quickBooksService,
  xeroService,
  docuSignService,
  microsoft365Service,
  slackService,
  zoomService
} from './services/integrations';

// Import types
import type { OAuthConfig, SyncResult } from './services/integrations';
import type { Integration, IntegrationConfig } from './types/integrations';
```

## Common Operations

### Connect Integration
```typescript
const authUrl = integrationManager.getAuthorizationUrl('quickbooks', userId);
window.location.href = authUrl;
```

### Handle OAuth Callback
```typescript
await integrationManager.handleOAuthCallback(integrationId, code, userId);
```

### Sync Data
```typescript
const result = await integrationManager.syncIntegration('quickbooks', userId);
console.log(`Synced ${result.recordsSynced} records`);
```

### Disconnect Integration
```typescript
await integrationManager.disconnectIntegration('quickbooks', userId);
```

## QuickBooks

### Export Invoice
```typescript
await quickBooksService.exportInvoice(userId, invoiceId);
```

### Sync All Data
```typescript
const result = await quickBooksService.syncData(userId);
```

## Xero

### Export Invoice
```typescript
await xeroService.exportInvoice(userId, invoiceId);
```

### Sync Disbursements
```typescript
await xeroService.syncDisbursements(userId);
```

## DocuSign

### Send for Signature
```typescript
const envelopeId = await docuSignService.sendForSignature(userId, {
  documentId: 'doc-uuid',
  signerEmail: 'client@example.com',
  signerName: 'John Doe',
  emailSubject: 'Please sign',
  emailBody: 'Your signature is required'
});
```

### Get Signing URL
```typescript
const url = await docuSignService.getSigningUrl(userId, envelopeId, signerEmail);
```

### Check Status
```typescript
const status = await docuSignService.getEnvelopeStatus(userId, envelopeId);
```

## Microsoft 365

### Send Email
```typescript
await microsoft365Service.sendEmail(
  userId,
  'client@example.com',
  'Subject',
  '<p>HTML body</p>',
  [{ name: 'file.pdf', content: 'base64content' }]
);
```

### Create Calendar Event
```typescript
const eventId = await microsoft365Service.createCalendarEvent(userId, {
  subject: 'Client Meeting',
  start: '2025-10-03T10:00:00Z',
  end: '2025-10-03T11:00:00Z',
  location: 'Conference Room',
  attendees: ['client@example.com'],
  body: 'Meeting agenda...'
});
```

### Categorize Email
```typescript
await microsoft365Service.categorizeEmail(userId, emailId, matterId);
```

## Slack

### Send Simple Notification
```typescript
await slackService.sendNotification(userId, 'Message text', channelId);
```

### Payment Notification
```typescript
await slackService.sendPaymentNotification(userId, {
  clientName: 'John Doe',
  amount: 5000.00,
  invoiceNumber: 'INV-001',
  matterId: 'matter-uuid'
});
```

### Deadline Reminder
```typescript
await slackService.sendDeadlineReminder(userId, {
  matterTitle: 'Smith v Jones',
  deadlineType: 'Court Filing',
  dueDate: '2025-10-10',
  daysRemaining: 3
});
```

### Matter Update
```typescript
await slackService.sendMatterUpdate(userId, {
  matterTitle: 'Smith v Jones',
  updateType: 'Status Change',
  description: 'Matter moved to discovery',
  updatedBy: 'Advocate Name'
});
```

### Create Channel
```typescript
const channelId = await slackService.createChannel(userId, 'matter-smith-v-jones', false);
```

## Zoom

### Create Meeting
```typescript
const meeting = await zoomService.createMeeting(userId, {
  topic: 'Client Consultation',
  startTime: '2025-10-03T14:00:00Z',
  duration: 60,
  agenda: 'Discuss case strategy',
  matterId: 'matter-uuid'
});
```

### Link to Matter
```typescript
await zoomService.linkMeetingToMatter(userId, meetingId, matterId);
```

### Get Recordings
```typescript
const recordings = await zoomService.getRecordings(userId, meetingId);
```

### Delete Meeting
```typescript
await zoomService.deleteMeeting(userId, meetingId);
```

## Database Queries

### Get Integration Config
```typescript
const { data } = await supabase
  .from('integration_configs')
  .select('*')
  .eq('integration_id', 'quickbooks')
  .eq('user_id', userId)
  .single();
```

### Get Integration Metrics
```typescript
const { data } = await supabase
  .from('integration_metrics')
  .select('*')
  .eq('integration_id', 'quickbooks')
  .eq('user_id', userId)
  .single();
```

### Get Webhook Events
```typescript
const { data } = await supabase
  .from('webhook_events')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(10);
```

### Get Synced Communications
```typescript
const { data } = await supabase
  .from('communications')
  .select('*')
  .eq('user_id', userId)
  .eq('sync_source', 'microsoft365')
  .order('received_at', { ascending: false });
```

### Get Calendar Events
```typescript
const { data } = await supabase
  .from('calendar_events')
  .select('*')
  .eq('user_id', userId)
  .gte('start_time', new Date().toISOString())
  .order('start_time', { ascending: true });
```

### Get Meetings
```typescript
const { data } = await supabase
  .from('meetings')
  .select('*')
  .eq('user_id', userId)
  .eq('matter_id', matterId)
  .order('start_time', { ascending: false });
```

## Error Handling

### Try-Catch Pattern
```typescript
try {
  await integrationManager.syncIntegration('quickbooks', userId);
  toast.success('Sync completed');
} catch (error) {
  console.error('Sync failed:', error);
  toast.error((error as Error).message);
}
```

### Check Token Expiration
```typescript
const config = await integration.getConfig(userId);
if (config?.credentials?.expiresAt) {
  const expiresAt = new Date(config.credentials.expiresAt);
  if (expiresAt < new Date()) {
    await integration.refreshAccessToken(userId);
  }
}
```

## Webhook Handling

### Log Webhook Event
```typescript
await integration.logWebhookEvent(userId, 'invoice.created', {
  invoiceId: 'inv-123',
  amount: 5000.00
});
```

### Process Webhook Event
```typescript
const { data: events } = await supabase
  .from('webhook_events')
  .select('*')
  .eq('status', 'pending')
  .order('created_at', { ascending: true })
  .limit(10);

for (const event of events) {
  try {
    // Process event
    await processWebhookEvent(event);
    
    // Mark as delivered
    await supabase
      .from('webhook_events')
      .update({ 
        status: 'delivered',
        delivered_at: new Date().toISOString()
      })
      .eq('id', event.id);
  } catch (error) {
    // Mark as failed
    await supabase
      .from('webhook_events')
      .update({ 
        status: 'failed',
        error_message: (error as Error).message,
        attempts: event.attempts + 1
      })
      .eq('id', event.id);
  }
}
```

## Metrics Tracking

### Update Metrics
```typescript
await integration.updateMetrics(userId, {
  totalRequests: 1,
  successfulRequests: 1,
  averageResponseTime: 250
});
```

### Get Integration Stats
```typescript
const { data: metrics } = await supabase
  .from('integration_metrics')
  .select('*')
  .eq('user_id', userId);

const totalRequests = metrics.reduce((sum, m) => sum + m.total_requests, 0);
const successRate = metrics.reduce((sum, m) => 
  sum + (m.successful_requests / m.total_requests), 0) / metrics.length;
```

## Configuration

### Update Integration Settings
```typescript
await integration.saveConfig(userId, {
  integrationId: 'quickbooks',
  userId,
  settings: {
    syncFrequency: 'hourly',
    autoSync: true,
    notifications: true
  }
});
```

### Get Integration Settings
```typescript
const config = await integration.getConfig(userId);
const settings = config?.settings;
```

## Testing

### Mock Integration Service
```typescript
const mockService = {
  getOAuthConfig: () => ({ /* mock config */ }),
  exchangeCodeForToken: jest.fn(),
  syncData: jest.fn().mockResolvedValue({
    success: true,
    recordsSynced: 10,
    errors: [],
    lastSyncTime: new Date().toISOString()
  })
};
```

### Test OAuth Flow
```typescript
const authUrl = integrationManager.getAuthorizationUrl('quickbooks', 'test-user');
expect(authUrl).toContain('oauth2');
expect(authUrl).toContain('client_id');
expect(authUrl).toContain('state');
```

## Environment Variables

```env
# QuickBooks
VITE_QUICKBOOKS_CLIENT_ID=your_id
VITE_QUICKBOOKS_CLIENT_SECRET=your_secret

# Xero
VITE_XERO_CLIENT_ID=your_id
VITE_XERO_CLIENT_SECRET=your_secret

# DocuSign
VITE_DOCUSIGN_CLIENT_ID=your_id
VITE_DOCUSIGN_CLIENT_SECRET=your_secret

# Microsoft 365
VITE_MS365_CLIENT_ID=your_id
VITE_MS365_CLIENT_SECRET=your_secret

# Slack
VITE_SLACK_CLIENT_ID=your_id
VITE_SLACK_CLIENT_SECRET=your_secret

# Zoom
VITE_ZOOM_CLIENT_ID=your_id
VITE_ZOOM_CLIENT_SECRET=your_secret
```

## Useful Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Type check
npm run typecheck

# Run linter
npm run lint

# Build for production
npm run build

# Run migrations
supabase migration up
```

## Common Patterns

### Sync on Schedule
```typescript
// Run every hour
setInterval(async () => {
  await integrationManager.syncAllIntegrations(userId);
}, 60 * 60 * 1000);
```

### Batch Operations
```typescript
const invoices = await getUnexportedInvoices(userId);
for (const invoice of invoices) {
  await quickBooksService.exportInvoice(userId, invoice.id);
}
```

### Conditional Sync
```typescript
const config = await integration.getConfig(userId);
if (config?.settings?.autoSync) {
  await integration.syncData(userId);
}
```

## Troubleshooting

### Check Connection Status
```typescript
const { data } = await supabase
  .from('integrations')
  .select('status, error_message')
  .eq('id', 'quickbooks')
  .eq('user_id', userId)
  .single();
```

### View Recent Activity
```typescript
const { data } = await supabase
  .from('api_configurations')
  .select('recent_activity')
  .eq('user_id', userId)
  .single();
```

### Check Rate Limits
```typescript
const { data } = await supabase
  .from('integration_metrics')
  .select('rate_limit_remaining')
  .eq('integration_id', 'quickbooks')
  .eq('user_id', userId)
  .single();
```
