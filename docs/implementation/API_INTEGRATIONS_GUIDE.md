# API Integrations System - Implementation Guide

## Overview
A comprehensive API integrations management system that allows users to connect third-party services and manage their own API keys for external integrations.

## Features Implemented

### 1. **Available Integrations Panel**
- **QuickBooks** - Sync financial data and invoices
- **Xero** - Accounting and bookkeeping integration
- **DocuSign** - Electronic signature management
- **Microsoft 365** - Email and document collaboration
- **Slack** - Team communication and notifications
- **Zoom** - Video conferencing integration

Each integration displays:
- Icon and name
- Description
- Connection status (Connected/Not Connected/Error)
- Connect/Disconnect buttons

### 2. **API Configuration Panel**
- **API Key Management**
  - Secure API key display with show/hide toggle
  - Copy to clipboard functionality
  - Regenerate key with one click
  - Unique key format: `lxh_[32 random characters]`

- **Webhook Configuration**
  - Custom webhook URL input
  - Real-time event notifications
  - Webhook testing capability

- **Rate Limiting**
  - Configurable rate limits (50, 100, 250, 500, 1000 requests/hour)
  - Prevents API abuse
  - Tracks usage metrics

### 3. **Activity Logging**
- Recent activity feed
- Success/error status indicators
- Timestamp tracking
- Action descriptions

## File Structure

```
src/
├── pages/
│   └── APIIntegrationsPage.tsx          # Main integrations page
├── services/
│   └── api-integrations.service.ts      # Integration service layer
├── types/
│   └── integrations.ts                  # TypeScript types
supabase/
└── migrations/
    └── 20250102000003_api_integrations_system.sql  # Database schema
```

## Database Schema

### Tables Created

1. **integrations**
   - Stores user integration connections
   - Tracks connection status and sync times
   - Categories: accounting, documents, productivity, communication, legal

2. **api_configurations**
   - User API keys
   - Webhook URLs
   - Rate limits
   - Recent activity logs

3. **integration_configs**
   - Integration-specific settings
   - Credentials (encrypted)
   - Custom configuration per integration

4. **integration_metrics**
   - Request tracking
   - Success/failure rates
   - Response times
   - Rate limit monitoring

5. **webhook_events**
   - Event logging
   - Delivery status
   - Retry mechanism
   - Auto-cleanup after 30 days

## Usage

### For Users

1. **Connect an Integration**
   ```typescript
   // Click "Connect" button on any integration
   // Service handles OAuth flow or API key setup
   await apiIntegrationsService.connectIntegration(integrationId, userId);
   ```

2. **Generate API Key**
   ```typescript
   // Automatically created on first access
   // Or regenerate manually
   await apiIntegrationsService.regenerateAPIKey(userId);
   ```

3. **Configure Webhook**
   ```typescript
   // Set webhook URL for real-time events
   await apiIntegrationsService.updateWebhookURL(userId, webhookUrl);
   ```

### For Developers

#### Service Methods

```typescript
// Get all integrations
const integrations = await apiIntegrationsService.getIntegrations(userId);

// Connect integration
await apiIntegrationsService.connectIntegration(integrationId, userId);

// Disconnect integration
await apiIntegrationsService.disconnectIntegration(integrationId, userId);

// Get API config
const config = await apiIntegrationsService.getAPIConfig(userId);

// Regenerate API key
const newConfig = await apiIntegrationsService.regenerateAPIKey(userId);

// Update webhook
await apiIntegrationsService.updateWebhookURL(userId, webhookUrl);

// Update rate limit
await apiIntegrationsService.updateRateLimit(userId, rateLimit);

// Test webhook
const success = await apiIntegrationsService.testWebhook(userId, webhookUrl);
```

## Security Features

1. **API Key Security**
   - Unique prefix (`lxh_`)
   - 32-character random string
   - Stored securely in database
   - Can be regenerated anytime

2. **Row Level Security (RLS)**
   - Users can only access their own data
   - Enforced at database level
   - Prevents unauthorized access

3. **Webhook Validation**
   - Test webhook before saving
   - Validates URL format
   - Tracks delivery status

4. **Rate Limiting**
   - Prevents API abuse
   - Configurable limits
   - Tracks usage metrics

## Integration Flow

### Connect Flow
```
1. User clicks "Connect" on integration
2. System creates integration record
3. Status set to "connected"
4. Last sync timestamp recorded
5. Activity logged
6. UI updates to show "Disconnect" button
```

### Disconnect Flow
```
1. User clicks "Disconnect"
2. Status updated to "not_connected"
3. Disconnect timestamp recorded
4. Activity logged
5. UI updates to show "Connect" button
```

### API Key Flow
```
1. User accesses API Configuration
2. System checks for existing key
3. If none exists, generates new key
4. Key displayed with show/hide toggle
5. User can copy or regenerate
```

## Webhook Events

### Event Format
```json
{
  "event": "matter.created",
  "timestamp": "2025-10-02T07:00:00Z",
  "userId": "user-uuid",
  "data": {
    "matterId": "matter-uuid",
    "title": "New Matter",
    "status": "active"
  }
}
```

### Supported Events
- `matter.created`
- `matter.updated`
- `invoice.generated`
- `payment.received`
- `document.signed`
- `deadline.approaching`

## Adding New Integrations

1. **Add to Default Integrations**
   ```typescript
   // In api-integrations.service.ts
   {
     id: 'new-service',
     name: 'New Service',
     description: 'Service description',
     status: 'not_connected',
     category: 'productivity',
     configUrl: null,
     lastSync: null
   }
   ```

2. **Add Icon Mapping**
   ```typescript
   // In APIIntegrationsPage.tsx
   const iconMap: Record<string, string> = {
     newservice: '🆕'
   };
   ```

3. **Implement OAuth Flow** (if needed)
   ```typescript
   // Create OAuth handler
   async handleOAuthConnect(integrationId: string) {
     // Redirect to OAuth provider
     // Handle callback
     // Store tokens
   }
   ```

## API Documentation Link

The page includes a link to API documentation at `/docs/api` for developers who want to integrate with LexoHub.

## Next Steps

1. **Implement OAuth flows** for services that require it
2. **Add integration-specific configuration** panels
3. **Create webhook delivery dashboard**
4. **Add integration health monitoring**
5. **Implement automatic sync scheduling**
6. **Add integration marketplace**

## Testing

### Manual Testing
1. Navigate to API Integrations page
2. Click "Connect" on an integration
3. Verify status changes to "Connected"
4. Generate API key
5. Copy key to clipboard
6. Set webhook URL
7. Change rate limit
8. View activity log
9. Disconnect integration

### Database Testing
```sql
-- Check integrations
SELECT * FROM integrations WHERE user_id = 'your-user-id';

-- Check API config
SELECT * FROM api_configurations WHERE user_id = 'your-user-id';

-- Check activity
SELECT recent_activity FROM api_configurations WHERE user_id = 'your-user-id';
```

## Support

For issues or questions:
- Check activity log for error messages
- Verify webhook URL is accessible
- Ensure rate limit not exceeded
- Check integration status in database
- Review Supabase logs for errors
