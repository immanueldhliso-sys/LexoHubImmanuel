# Third-Party Integrations Implementation Guide

## Overview
LexoHub now includes comprehensive third-party integrations that transform it into a complete "Advocate's Intelligence Platform". This guide covers the implementation, configuration, and usage of all integrated services.

## Implemented Integrations

### 1. QuickBooks Integration
**Purpose:** Automated Accounting Sync & Financial Management

**Features:**
- Automated invoice synchronization
- Payment tracking and reconciliation
- Real-time financial reporting
- Tax compliance categorization
- Cash flow optimization

**Configuration:**
1. Obtain QuickBooks OAuth credentials from Intuit Developer Portal
2. Add to `.env`:
   ```
   VITE_QUICKBOOKS_CLIENT_ID=your_client_id
   VITE_QUICKBOOKS_CLIENT_SECRET=your_client_secret
   ```
3. Configure redirect URI: `https://yourdomain.com/integrations/quickbooks/callback`

**Usage:**
```typescript
import { quickBooksService } from './services/integrations/quickbooks.service';

await quickBooksService.syncData(userId);
await quickBooksService.exportInvoice(userId, invoiceId);
```

### 2. Xero Integration
**Purpose:** Streamlined Bookkeeping & Practice Analytics

**Features:**
- Multi-platform accounting flexibility
- Enhanced disbursement tracking
- Performance-based pricing analytics
- Bar Council-compliant financial reports

**Configuration:**
1. Create Xero app at https://developer.xero.com
2. Add to `.env`:
   ```
   VITE_XERO_CLIENT_ID=your_client_id
   VITE_XERO_CLIENT_SECRET=your_client_secret
   ```
3. Configure redirect URI: `https://yourdomain.com/integrations/xero/callback`

**Usage:**
```typescript
import { xeroService } from './services/integrations/xero.service';

await xeroService.syncData(userId);
await xeroService.syncDisbursements(userId);
await xeroService.exportInvoice(userId, invoiceId);
```

### 3. DocuSign Integration
**Purpose:** Digital Signature & Document Workflow Enhancement

**Features:**
- Matter document automation
- Secure client onboarding
- Court document processing
- Audit trail compliance

**Configuration:**
1. Create DocuSign app at https://developers.docusign.com
2. Add to `.env`:
   ```
   VITE_DOCUSIGN_CLIENT_ID=your_integration_key
   VITE_DOCUSIGN_CLIENT_SECRET=your_secret_key
   ```
3. Configure redirect URI: `https://yourdomain.com/integrations/docusign/callback`

**Usage:**
```typescript
import { docuSignService } from './services/integrations/docusign.service';

const envelopeId = await docuSignService.sendForSignature(userId, {
  documentId: 'doc-uuid',
  signerEmail: 'client@example.com',
  signerName: 'John Doe',
  emailSubject: 'Please sign engagement letter',
  emailBody: 'Your signature is required'
});

const signingUrl = await docuSignService.getSigningUrl(userId, envelopeId, 'client@example.com');
```

### 4. Microsoft 365 Integration
**Purpose:** Collaboration & Document Intelligence

**Features:**
- Email integration and categorization
- Document collaboration (Word, Excel, PowerPoint)
- Calendar synchronization with Outlook
- Teams integration for secure consultations

**Configuration:**
1. Register app in Azure AD Portal
2. Add to `.env`:
   ```
   VITE_MS365_CLIENT_ID=your_application_id
   VITE_MS365_CLIENT_SECRET=your_client_secret
   ```
3. Configure redirect URI: `https://yourdomain.com/integrations/microsoft365/callback`

**Usage:**
```typescript
import { microsoft365Service } from './services/integrations/microsoft365.service';

await microsoft365Service.sendEmail(userId, 'client@example.com', 'Subject', '<p>Body</p>');

const eventId = await microsoft365Service.createCalendarEvent(userId, {
  subject: 'Client Meeting',
  start: '2025-10-03T10:00:00Z',
  end: '2025-10-03T11:00:00Z',
  location: 'Conference Room',
  attendees: ['client@example.com']
});

await microsoft365Service.categorizeEmail(userId, emailId, matterId);
```

### 5. Slack Integration
**Purpose:** Enhanced Team Communication & Notifications

**Features:**
- Real-time practice alerts
- Team collaboration channels
- Client update automation
- Custom notification workflows

**Configuration:**
1. Create Slack app at https://api.slack.com/apps
2. Add to `.env`:
   ```
   VITE_SLACK_CLIENT_ID=your_client_id
   VITE_SLACK_CLIENT_SECRET=your_client_secret
   ```
3. Configure redirect URI: `https://yourdomain.com/integrations/slack/callback`

**Usage:**
```typescript
import { slackService } from './services/integrations/slack.service';

await slackService.sendPaymentNotification(userId, {
  clientName: 'John Doe',
  amount: 5000.00,
  invoiceNumber: 'INV-001',
  matterId: 'matter-uuid'
});

await slackService.sendDeadlineReminder(userId, {
  matterTitle: 'Smith v Jones',
  deadlineType: 'Court Filing',
  dueDate: '2025-10-10',
  daysRemaining: 3
});

await slackService.sendMatterUpdate(userId, {
  matterTitle: 'Smith v Jones',
  updateType: 'Status Change',
  description: 'Matter moved to discovery phase',
  updatedBy: 'Advocate Name'
});
```

### 6. Zoom Integration
**Purpose:** Virtual Consultation & Client Service Enhancement

**Features:**
- Seamless client meeting scheduling
- Automatic consultation recording
- Time entry automation from meetings
- Client portal integration

**Configuration:**
1. Create Zoom app at https://marketplace.zoom.us
2. Add to `.env`:
   ```
   VITE_ZOOM_CLIENT_ID=your_client_id
   VITE_ZOOM_CLIENT_SECRET=your_client_secret
   ```
3. Configure redirect URI: `https://yourdomain.com/integrations/zoom/callback`

**Usage:**
```typescript
import { zoomService } from './services/integrations/zoom.service';

const meeting = await zoomService.createMeeting(userId, {
  topic: 'Client Consultation - Smith v Jones',
  startTime: '2025-10-03T14:00:00Z',
  duration: 60,
  agenda: 'Discuss case strategy',
  matterId: 'matter-uuid'
});

await zoomService.linkMeetingToMatter(userId, meeting.id, matterId);

const recordings = await zoomService.getRecordings(userId, meeting.id);
```

## Architecture

### Service Layer Structure
```
src/services/integrations/
├── base-integration.service.ts      # Abstract base class
├── integration-manager.service.ts   # Central integration manager
├── quickbooks.service.ts            # QuickBooks implementation
├── xero.service.ts                  # Xero implementation
├── docusign.service.ts              # DocuSign implementation
├── microsoft365.service.ts          # Microsoft 365 implementation
├── slack.service.ts                 # Slack implementation
└── zoom.service.ts                  # Zoom implementation
```

### Database Schema
```sql
-- Core integration tables
integrations              # Integration connections
api_configurations        # API keys and webhooks
integration_configs       # Integration-specific settings
integration_metrics       # Usage tracking
webhook_events           # Event logging

-- Synced data tables
communications           # Emails and messages
calendar_events          # Calendar entries
meetings                 # Video conferences
disbursements           # Expenses
```

### OAuth Flow
1. User clicks "Connect" on integration
2. System redirects to provider's OAuth URL with state parameter
3. User authorizes application
4. Provider redirects back with authorization code
5. System exchanges code for access/refresh tokens
6. Tokens stored securely in database
7. Integration status updated to "connected"

## Integration Manager

The `IntegrationManager` provides a unified interface for all integrations:

```typescript
import { integrationManager } from './services/integrations/integration-manager.service';

const authUrl = integrationManager.getAuthorizationUrl('quickbooks', userId);

await integrationManager.handleOAuthCallback('quickbooks', code, userId);

await integrationManager.syncIntegration('quickbooks', userId);

await integrationManager.syncAllIntegrations(userId);

await integrationManager.disconnectIntegration('quickbooks', userId);
```

## UI Components

### IntegrationConfigModal
Modal for configuring integration settings:
- Auto-sync toggle
- Sync frequency selection
- Notification preferences
- Manual sync trigger
- Disconnect option

### IntegrationCallbackPage
Handles OAuth callbacks and displays connection status.

### APIIntegrationsPage
Main integrations management page with:
- Available integrations list
- Connection status badges
- Connect/disconnect buttons
- Settings access
- API key management
- Webhook configuration

## Automated Workflows

### Payment Received
```typescript
// Triggered when payment synced from QuickBooks/Xero
await slackService.sendPaymentNotification(userId, paymentData);
```

### Meeting Scheduled
```typescript
// Triggered when Zoom meeting created
await microsoft365Service.createCalendarEvent(userId, meetingData);
```

### Document Signed
```typescript
// Triggered when DocuSign envelope completed
await slackService.sendNotification(userId, 'Document signed by client');
```

### Deadline Approaching
```typescript
// Triggered by scheduled job
await slackService.sendDeadlineReminder(userId, deadlineData);
```

## Security Considerations

1. **Token Storage:** All OAuth tokens encrypted at rest in database
2. **Row Level Security:** Users can only access their own integration data
3. **API Key Rotation:** Users can regenerate API keys anytime
4. **Webhook Validation:** All webhook events validated before processing
5. **Rate Limiting:** Configurable rate limits prevent API abuse
6. **Audit Logging:** All integration actions logged for compliance

## Error Handling

All integration services implement comprehensive error handling:
- Token expiration detection and automatic refresh
- Network failure retry logic
- Graceful degradation when service unavailable
- Detailed error logging for debugging
- User-friendly error messages

## Testing

### Manual Testing
1. Navigate to Settings > Integrations
2. Click "Connect" on desired integration
3. Complete OAuth flow
4. Verify connection status
5. Test sync functionality
6. Check synced data in respective modules
7. Test disconnect functionality

### Integration Testing
```typescript
// Test QuickBooks sync
const result = await quickBooksService.syncData(userId);
expect(result.success).toBe(true);
expect(result.recordsSynced).toBeGreaterThan(0);

// Test Slack notification
await slackService.sendNotification(userId, 'Test message');
```

## Monitoring & Analytics

### Integration Metrics
- Total API requests
- Success/failure rates
- Average response times
- Rate limit usage
- Last sync timestamps

### Webhook Events
- Event type tracking
- Delivery status
- Retry attempts
- Error logging

## Troubleshooting

### Common Issues

**Integration won't connect:**
- Verify OAuth credentials in `.env`
- Check redirect URI matches exactly
- Ensure user has proper permissions

**Sync failing:**
- Check token expiration
- Verify API rate limits not exceeded
- Review integration metrics for errors

**Webhooks not received:**
- Validate webhook URL is publicly accessible
- Check webhook configuration in integration settings
- Review webhook event logs

## Future Enhancements

1. **Additional Integrations:**
   - LexisNexis for legal research
   - Practice management systems
   - Court filing systems
   - Payment gateways

2. **Advanced Features:**
   - Bi-directional sync
   - Conflict resolution
   - Custom field mapping
   - Scheduled sync jobs
   - Integration marketplace

3. **Analytics:**
   - Integration health dashboard
   - Sync performance metrics
   - Cost optimization insights
   - Usage patterns analysis

## Support

For integration issues:
1. Check activity log in integration settings
2. Review integration metrics
3. Verify webhook delivery status
4. Check Supabase logs
5. Contact support with error details

## API Documentation

Full API documentation available at `/docs/api` covering:
- Authentication
- Endpoints
- Request/response formats
- Rate limits
- Webhooks
- Error codes
