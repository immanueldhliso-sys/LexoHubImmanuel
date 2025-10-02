# LexoHub Integrations

This directory contains all third-party integration services for LexoHub.

## Structure

```
integrations/
├── base-integration.service.ts      # Abstract base class
├── integration-manager.service.ts   # Central manager
├── quickbooks.service.ts            # QuickBooks integration
├── xero.service.ts                  # Xero integration
├── docusign.service.ts              # DocuSign integration
├── microsoft365.service.ts          # Microsoft 365 integration
├── slack.service.ts                 # Slack integration
├── zoom.service.ts                  # Zoom integration
├── index.ts                         # Exports
└── README.md                        # This file
```

## Available Integrations

### Financial
- **QuickBooks** - Accounting and invoicing
- **Xero** - Accounting and bookkeeping

### Documents
- **DocuSign** - Digital signatures

### Productivity
- **Microsoft 365** - Email, calendar, documents

### Communication
- **Slack** - Team notifications
- **Zoom** - Video conferencing

## Usage

### Import Services
```typescript
import {
  integrationManager,
  quickBooksService,
  xeroService,
  docuSignService,
  microsoft365Service,
  slackService,
  zoomService
} from './services/integrations';
```

### Connect Integration
```typescript
const authUrl = integrationManager.getAuthorizationUrl('quickbooks', userId);
window.location.href = authUrl;
```

### Sync Data
```typescript
await integrationManager.syncIntegration('quickbooks', userId);
```

## Adding New Integrations

1. Create new service extending `BaseIntegrationService`
2. Implement required abstract methods
3. Add to `integration-manager.service.ts`
4. Export from `index.ts`
5. Add OAuth credentials to `.env`
6. Update documentation

## Documentation

- **Implementation Guide:** `/THIRD_PARTY_INTEGRATIONS_GUIDE.md`
- **Quick Reference:** `/INTEGRATION_QUICK_REFERENCE.md`
- **Setup Checklist:** `/INTEGRATION_SETUP_CHECKLIST.md`

## Support

For issues or questions, check the main documentation files in the project root.
