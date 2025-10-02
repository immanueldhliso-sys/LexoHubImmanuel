# Integration Setup Checklist

## Pre-Implementation Setup

### 1. QuickBooks Setup
- [ ] Create Intuit Developer account at https://developer.intuit.com
- [ ] Create new app in Intuit Developer Portal
- [ ] Configure OAuth 2.0 settings
- [ ] Add redirect URI: `https://yourdomain.com/integrations/quickbooks/callback`
- [ ] Copy Client ID and Client Secret
- [ ] Add to `.env`:
  ```
  VITE_QUICKBOOKS_CLIENT_ID=your_client_id
  VITE_QUICKBOOKS_CLIENT_SECRET=your_client_secret
  ```
- [ ] Enable required scopes: `com.intuit.quickbooks.accounting`
- [ ] Test in sandbox environment first

### 2. Xero Setup
- [ ] Create Xero Developer account at https://developer.xero.com
- [ ] Create new app in Xero Developer Portal
- [ ] Configure OAuth 2.0 settings
- [ ] Add redirect URI: `https://yourdomain.com/integrations/xero/callback`
- [ ] Copy Client ID and Client Secret
- [ ] Add to `.env`:
  ```
  VITE_XERO_CLIENT_ID=your_client_id
  VITE_XERO_CLIENT_SECRET=your_client_secret
  ```
- [ ] Enable required scopes: `accounting.transactions`, `accounting.contacts`, `accounting.settings`
- [ ] Connect to demo organization for testing

### 3. DocuSign Setup
- [ ] Create DocuSign Developer account at https://developers.docusign.com
- [ ] Create new app in DocuSign Admin
- [ ] Configure OAuth 2.0 settings
- [ ] Add redirect URI: `https://yourdomain.com/integrations/docusign/callback`
- [ ] Copy Integration Key (Client ID) and Secret Key
- [ ] Add to `.env`:
  ```
  VITE_DOCUSIGN_CLIENT_ID=your_integration_key
  VITE_DOCUSIGN_CLIENT_SECRET=your_secret_key
  ```
- [ ] Enable required scopes: `signature`, `impersonation`
- [ ] Test in demo environment first

### 4. Microsoft 365 Setup
- [ ] Access Azure AD Portal at https://portal.azure.com
- [ ] Register new application
- [ ] Configure authentication settings
- [ ] Add redirect URI: `https://yourdomain.com/integrations/microsoft365/callback`
- [ ] Copy Application (Client) ID and Client Secret
- [ ] Add to `.env`:
  ```
  VITE_MS365_CLIENT_ID=your_application_id
  VITE_MS365_CLIENT_SECRET=your_client_secret
  ```
- [ ] Enable required API permissions:
  - User.Read
  - Mail.Read
  - Mail.Send
  - Calendars.ReadWrite
  - Files.ReadWrite.All
  - offline_access
- [ ] Grant admin consent for organization

### 5. Slack Setup
- [ ] Create Slack account at https://slack.com
- [ ] Access Slack API at https://api.slack.com/apps
- [ ] Create new Slack app
- [ ] Configure OAuth settings
- [ ] Add redirect URI: `https://yourdomain.com/integrations/slack/callback`
- [ ] Copy Client ID and Client Secret
- [ ] Add to `.env`:
  ```
  VITE_SLACK_CLIENT_ID=your_client_id
  VITE_SLACK_CLIENT_SECRET=your_client_secret
  ```
- [ ] Enable required scopes:
  - channels:read
  - channels:write
  - chat:write
  - users:read
  - files:read
  - incoming-webhook
- [ ] Install app to workspace for testing

### 6. Zoom Setup
- [ ] Create Zoom account at https://zoom.us
- [ ] Access Zoom Marketplace at https://marketplace.zoom.us
- [ ] Create new OAuth app
- [ ] Configure OAuth settings
- [ ] Add redirect URI: `https://yourdomain.com/integrations/zoom/callback`
- [ ] Copy Client ID and Client Secret
- [ ] Add to `.env`:
  ```
  VITE_ZOOM_CLIENT_ID=your_client_id
  VITE_ZOOM_CLIENT_SECRET=your_client_secret
  ```
- [ ] Enable required scopes:
  - meeting:write
  - meeting:read
  - recording:read
  - user:read
- [ ] Activate app for testing

## Database Setup

### Run Migrations
- [ ] Ensure Supabase CLI is installed
- [ ] Run existing integration migration:
  ```bash
  supabase migration up 20250102000003_api_integrations_system.sql
  ```
- [ ] Run new data tables migration:
  ```bash
  supabase migration up 20251002000000_integration_data_tables.sql
  ```
- [ ] Verify all tables created successfully
- [ ] Check RLS policies are enabled
- [ ] Test database permissions

### Verify Schema
- [ ] Check `integrations` table exists
- [ ] Check `api_configurations` table exists
- [ ] Check `integration_configs` table exists
- [ ] Check `integration_metrics` table exists
- [ ] Check `webhook_events` table exists
- [ ] Check `communications` table exists
- [ ] Check `calendar_events` table exists
- [ ] Check `meetings` table exists
- [ ] Check `disbursements` table exists
- [ ] Verify indexes are created
- [ ] Verify triggers are active

## Application Configuration

### Environment Setup
- [ ] Copy `.env.example` to `.env`
- [ ] Add all integration credentials
- [ ] Verify Supabase credentials
- [ ] Set correct environment (development/production)
- [ ] Configure CORS settings if needed
- [ ] Set up SSL certificates for production

### Build & Deploy
- [ ] Install dependencies: `npm install`
- [ ] Run type check: `npm run typecheck`
- [ ] Run linter: `npm run lint`
- [ ] Build application: `npm run build`
- [ ] Test in development: `npm run dev`
- [ ] Deploy to staging environment
- [ ] Test all integrations in staging
- [ ] Deploy to production

## Testing Checklist

### OAuth Flow Testing
- [ ] Test QuickBooks OAuth connection
- [ ] Test Xero OAuth connection
- [ ] Test DocuSign OAuth connection
- [ ] Test Microsoft 365 OAuth connection
- [ ] Test Slack OAuth connection
- [ ] Test Zoom OAuth connection
- [ ] Verify tokens are stored correctly
- [ ] Test token refresh mechanism
- [ ] Test disconnect functionality

### Data Sync Testing
- [ ] QuickBooks: Sync invoices
- [ ] QuickBooks: Sync payments
- [ ] QuickBooks: Export invoice
- [ ] Xero: Sync invoices
- [ ] Xero: Sync payments
- [ ] Xero: Sync disbursements
- [ ] DocuSign: Send document for signature
- [ ] DocuSign: Track envelope status
- [ ] Microsoft 365: Sync emails
- [ ] Microsoft 365: Sync calendar events
- [ ] Microsoft 365: Send email
- [ ] Slack: Send notification
- [ ] Slack: Send payment alert
- [ ] Slack: Send deadline reminder
- [ ] Zoom: Create meeting
- [ ] Zoom: Link meeting to matter
- [ ] Zoom: Get recordings

### UI Testing
- [ ] Navigate to integrations page
- [ ] View available integrations
- [ ] Click connect on each integration
- [ ] Complete OAuth flow
- [ ] Verify connection status updates
- [ ] Open integration settings modal
- [ ] Test sync now button
- [ ] Test auto-sync toggle
- [ ] Test notification toggle
- [ ] Change sync frequency
- [ ] Test disconnect button
- [ ] Verify activity log updates

### Error Handling Testing
- [ ] Test with invalid credentials
- [ ] Test with expired tokens
- [ ] Test with rate limit exceeded
- [ ] Test with network failure
- [ ] Test with invalid data
- [ ] Verify error messages are user-friendly
- [ ] Verify errors are logged correctly

## Security Verification

### Authentication & Authorization
- [ ] Verify OAuth state parameter validation
- [ ] Test token encryption at rest
- [ ] Verify RLS policies work correctly
- [ ] Test API key generation
- [ ] Test API key rotation
- [ ] Verify webhook signature validation
- [ ] Test rate limiting

### Data Privacy
- [ ] Verify users can only access their own data
- [ ] Test data isolation between users
- [ ] Verify sensitive data is encrypted
- [ ] Test audit logging
- [ ] Verify GDPR compliance
- [ ] Test data deletion on user removal

## Monitoring Setup

### Logging
- [ ] Configure application logging
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Enable integration metrics collection
- [ ] Set up webhook event logging
- [ ] Configure sync status tracking

### Alerts
- [ ] Set up alerts for OAuth failures
- [ ] Set up alerts for sync failures
- [ ] Set up alerts for rate limit warnings
- [ ] Set up alerts for webhook delivery failures
- [ ] Configure uptime monitoring

## Documentation

### User Documentation
- [ ] Create user guide for connecting integrations
- [ ] Document sync frequency options
- [ ] Create troubleshooting guide
- [ ] Document webhook configuration
- [ ] Create FAQ section

### Developer Documentation
- [ ] Document API endpoints
- [ ] Create integration examples
- [ ] Document webhook payload formats
- [ ] Create architecture diagrams
- [ ] Document error codes

## Production Readiness

### Performance
- [ ] Load test OAuth flows
- [ ] Load test sync operations
- [ ] Optimize database queries
- [ ] Configure caching where appropriate
- [ ] Test with large datasets

### Scalability
- [ ] Test with multiple concurrent users
- [ ] Verify rate limiting works correctly
- [ ] Test webhook queue processing
- [ ] Verify database connection pooling
- [ ] Test auto-scaling configuration

### Backup & Recovery
- [ ] Configure database backups
- [ ] Test backup restoration
- [ ] Document recovery procedures
- [ ] Set up disaster recovery plan
- [ ] Test failover scenarios

## Launch Preparation

### Pre-Launch
- [ ] Complete all testing
- [ ] Review security checklist
- [ ] Prepare rollback plan
- [ ] Brief support team
- [ ] Prepare announcement materials
- [ ] Schedule maintenance window if needed

### Launch Day
- [ ] Deploy to production
- [ ] Verify all integrations working
- [ ] Monitor error logs
- [ ] Monitor performance metrics
- [ ] Be available for support
- [ ] Announce to users

### Post-Launch
- [ ] Monitor integration usage
- [ ] Collect user feedback
- [ ] Address any issues promptly
- [ ] Document lessons learned
- [ ] Plan future enhancements
- [ ] Schedule regular reviews

## Maintenance Schedule

### Daily
- [ ] Monitor error logs
- [ ] Check sync status
- [ ] Review webhook delivery rates
- [ ] Monitor API rate limits

### Weekly
- [ ] Review integration metrics
- [ ] Check token expiration dates
- [ ] Review user feedback
- [ ] Update documentation as needed

### Monthly
- [ ] Review security logs
- [ ] Update OAuth credentials if needed
- [ ] Review and optimize performance
- [ ] Plan feature enhancements
- [ ] Review compliance requirements

## Support Resources

### Internal
- Integration settings: `/settings/integrations`
- Activity logs: Available in integration modal
- Metrics dashboard: Integration-specific tracking
- Error logs: Supabase dashboard

### External
- QuickBooks: https://developer.intuit.com/app/developer/qbo/docs/get-started
- Xero: https://developer.xero.com/documentation/
- DocuSign: https://developers.docusign.com/docs/
- Microsoft 365: https://docs.microsoft.com/en-us/graph/
- Slack: https://api.slack.com/docs
- Zoom: https://marketplace.zoom.us/docs/

## Notes
- Always test in sandbox/demo environments first
- Keep OAuth credentials secure and never commit to version control
- Monitor rate limits to avoid service disruptions
- Regularly review and update security practices
- Keep integration libraries and dependencies up to date
- Document any custom configurations or workarounds
