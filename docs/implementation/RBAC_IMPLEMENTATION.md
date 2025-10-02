# Role-Based Access Control (RBAC) Implementation

## Overview

This document outlines the comprehensive Role-Based Access Control (RBAC) system implemented for LexoHub to differentiate features between **Junior Advocate** and **Senior Counsel** user roles.

## User Roles

### 1. Junior Advocate
- **Description**: Entry-level advocate with access to essential practice management features
- **Target Users**: Newly admitted advocates (< 10 years experience)
- **Subscription Tier**: Basic/Junior Start

### 2. Senior Counsel
- **Description**: Senior advocate with full access to all practice management and advanced features
- **Target Users**: Experienced advocates (10+ years experience)
- **Subscription Tier**: Senior Advocate/Advocate Pro

### 3. Chambers Administrator
- **Description**: Full administrative access to all features and user management
- **Target Users**: Practice managers and administrators
- **Subscription Tier**: Chambers Enterprise

## Permission Matrix

### Core Features (Available to All Roles)

#### Dashboard & Overview
- ✅ View practice dashboard
- ✅ View key metrics
- ✅ Recent activity feed

#### Matters Management
- ✅ View matters
- ✅ Create new matters
- ✅ Edit matters
- ❌ Delete matters (Senior Counsel only)

#### Invoicing
- ✅ View invoices
- ✅ Create invoices
- ✅ Edit invoices
- ❌ Delete invoices (Senior Counsel only)

#### Pro Forma
- ✅ View pro forma invoices
- ✅ Create pro forma
- ✅ Edit pro forma
- ❌ Delete pro forma (Senior Counsel only)

#### Reports
- ✅ View basic reports
- ❌ Export reports (Senior Counsel only)
- ❌ Advanced analytics (Senior Counsel only)

#### Compliance
- ✅ View compliance dashboard
- ❌ Manage compliance settings (Senior Counsel only)

#### Pricing Management
- ✅ View pricing
- ❌ Edit advanced pricing models (Senior Counsel only)

### Advanced Features (Senior Counsel Only)

#### AI-Powered Features
- ❌ AI Analytics Dashboard
- ❌ Document Intelligence
- ❌ AI-powered insights and recommendations
- ❌ Predictive analytics

#### Strategic Finance
- ❌ Cash flow forecasting
- ❌ Fee optimization tools
- ❌ Factoring access
- ❌ Advanced financial planning

#### Practice Growth
- ❌ Overflow brief marketplace
- ❌ Post overflow briefs
- ❌ Apply to overflow briefs
- ❌ Referral network access
- ❌ Practice development tools

#### Voice & Automation
- ❌ Voice time capture
- ❌ Voice-powered commands
- ❌ Advanced workflow automation

#### Workflow Integrations
- ❌ Third-party integrations
- ❌ API access
- ❌ Integration management
- ❌ Workflow automation tools

#### Advanced Reporting
- ❌ Custom report builder
- ❌ Report export (PDF, Excel)
- ❌ Scheduled reports
- ❌ Advanced data visualization

## Feature Restrictions

### Junior Advocate Restrictions

1. **Deletion Permissions**
   - Cannot delete matters
   - Cannot delete invoices
   - Cannot delete pro forma invoices
   - **Reason**: Data integrity and audit requirements

2. **AI Features**
   - No access to AI Analytics Dashboard
   - No document intelligence features
   - No AI-powered recommendations
   - **Reason**: Premium feature tier

3. **Strategic Finance Tools**
   - No cash flow forecasting
   - No fee optimization
   - No factoring access
   - **Reason**: Advanced financial tools for established practices

4. **Practice Growth Network**
   - No overflow brief posting
   - No referral network access
   - No practice development tools
   - **Reason**: Senior counsel mentorship and experience required

5. **Advanced Integrations**
   - No third-party integration management
   - No API access
   - Limited automation capabilities
   - **Reason**: Advanced technical features

6. **Report Export**
   - Cannot export reports to PDF/Excel
   - Limited to in-app viewing only
   - **Reason**: Premium reporting tier

## UI Implementation

### Dashboard Views

#### Junior Advocate Dashboard
- Essential metrics display (Matters, Invoices, Pro Forma)
- Upgrade prompt card highlighting premium features
- Recent activity feed
- Quick action buttons for core features
- Persistent upgrade CTA

#### Senior Counsel Dashboard
- Comprehensive metrics including AI insights
- Access to all advanced feature quick actions
- Advanced analytics preview
- Integration status widgets
- Role badge display

### Navigation Changes

#### Restricted Feature Indicators
- Lock icon (🔒) on restricted menu items
- "Upgrade" badge on premium features
- Tooltip showing required role
- Click triggers upgrade modal instead of navigation

#### Upgrade Prompts
- **Modal Prompts**: When clicking restricted features
- **Inline Cards**: Within dashboard and feature pages
- **Banner Notifications**: After specific actions
- **Settings Page**: Dedicated upgrade section

### Restricted Action Handling

When a Junior Advocate attempts to access a restricted feature:

1. **Prevention**: Action is blocked before execution
2. **Notification**: Modal displays explaining restriction
3. **Education**: Lists benefits of upgrading
4. **CTA**: Clear path to upgrade (Settings page)

Example:
```typescript
<RestrictedActionButton
  actionKey="DELETE_MATTER"
  onClick={handleDelete}
  variant="danger"
>
  Delete Matter
</RestrictedActionButton>
```

## Technical Implementation

### Database Schema

```sql
-- User role column added to advocates table
ALTER TABLE advocates ADD COLUMN user_role user_role DEFAULT 'junior_advocate';

-- Automatic role assignment based on years of experience
CREATE FUNCTION auto_assign_user_role() ...

-- Role change audit log
CREATE TABLE role_permissions_log ...
```

### Type Definitions

Located in: `src/types/rbac.ts`

```typescript
export enum UserRole {
  JUNIOR_ADVOCATE = 'junior_advocate',
  SENIOR_COUNSEL = 'senior_counsel',
  CHAMBERS_ADMIN = 'chambers_admin'
}

export enum Permission {
  VIEW_DASHBOARD = 'view:dashboard',
  DELETE_MATTERS = 'delete:matters',
  USE_AI_FEATURES = 'use:ai_features',
  // ... 40+ permissions defined
}
```

### React Hooks

#### `useRBAC()`
Primary hook for checking permissions:

```typescript
const { 
  userRole, 
  hasPermission, 
  canPerformAction,
  isSeniorCounsel 
} = useRBAC();
```

#### `useFeatureAccess(featureId)`
Check access to specific features:

```typescript
const { hasAccess, denialReason } = useFeatureAccess('ai-analytics');
```

### Components

#### `<RoleGuard>`
Wrap components to enforce role requirements:

```typescript
<RoleGuard 
  requiredRole={UserRole.SENIOR_COUNSEL}
  showUpgradePrompt={true}
>
  <AdvancedFeatureComponent />
</RoleGuard>
```

#### `<RestrictedActionButton>`
Button with built-in permission checking:

```typescript
<RestrictedActionButton
  actionKey="DELETE_INVOICE"
  onClick={handleDelete}
>
  Delete
</RestrictedActionButton>
```

#### `<UpgradePromptCard>`
Promotional card for upgrading:

```typescript
<UpgradePromptCard 
  onUpgrade={() => navigate('settings')}
  compact={false}
/>
```

### Auth Service Integration

The `authService` now includes:
- `getUserRole()`: Returns current user's role
- `hasPermission(permission)`: Checks specific permission
- Automatic role assignment based on years of experience

## Error Messages

### User-Friendly Messages

| Action | Message |
|--------|---------|
| Delete Matter | "Only Senior Counsel can delete matters. Please contact your administrator." |
| Access AI Features | "AI features are available for Senior Counsel. Upgrade your account to access this feature." |
| Post Overflow Brief | "Only Senior Counsel can post overflow briefs. Upgrade your account to access this feature." |
| Export Reports | "Report export is available for Senior Counsel. Upgrade your account to access this feature." |

## Upgrade Flow

### From Junior Advocate to Senior Counsel

1. **Discovery**: User encounters restricted feature
2. **Education**: Modal/card explains benefits
3. **Navigation**: Click "Upgrade" button
4. **Settings Page**: View pricing and features comparison
5. **Payment**: Process upgrade (integration TBD)
6. **Activation**: Role updated in database
7. **Confirmation**: Welcome message and feature tour

## Testing Guidelines

### Manual Testing Scenarios

1. **Role Assignment**
   - [ ] New user defaults to Junior Advocate
   - [ ] 10+ years experience auto-assigns Senior Counsel
   - [ ] Manual role assignment works

2. **Feature Access**
   - [ ] Junior Advocate cannot access AI Analytics
   - [ ] Junior Advocate cannot delete matters
   - [ ] Senior Counsel has full access
   - [ ] Upgrade prompts display correctly

3. **UI Elements**
   - [ ] Lock icons show on restricted features
   - [ ] Dashboard displays role-appropriate content
   - [ ] Navigation filters correctly
   - [ ] Modals display proper messaging

4. **Error Handling**
   - [ ] Graceful degradation if role undefined
   - [ ] Clear error messages for restricted actions
   - [ ] Fallback to Junior Advocate if role missing

## Migration Plan

### For Existing Users

1. **Database Migration**: Run `20250201000000_add_user_roles_rbac.sql`
2. **Auto-Assignment**: Existing users assigned roles based on `year_admitted`
3. **Manual Review**: Admin reviews and adjusts as needed
4. **Communication**: Email users about new roles and features
5. **Grace Period**: 30 days with full access before restrictions apply

## Future Enhancements

### Planned Features

1. **Custom Roles**: Create organization-specific roles
2. **Granular Permissions**: Per-user permission overrides
3. **Team Management**: Multi-user role management for chambers
4. **Activity Logging**: Detailed audit trail of restricted access attempts
5. **Time-Based Access**: Temporary permission grants
6. **Role Hierarchy**: Sub-roles within Senior Counsel

### Analytics & Monitoring

- Track upgrade conversion rates
- Monitor restricted feature engagement
- Identify high-value features driving upgrades
- A/B test upgrade messaging

## Support & Documentation

### For Users

- Help Center article: "Understanding User Roles"
- Video tutorial: "Junior Advocate vs Senior Counsel"
- FAQ section on roles and permissions
- In-app tooltips and guides

### For Administrators

- Admin guide for role management
- Bulk role assignment tools
- Permission audit reports
- Role change history

## Summary

This RBAC implementation provides:

✅ **Clear role separation** between Junior Advocates and Senior Counsel  
✅ **Comprehensive permission system** with 40+ defined permissions  
✅ **User-friendly upgrade flow** with educational prompts  
✅ **Secure access control** at component and API levels  
✅ **Flexible architecture** for future role expansion  
✅ **Audit trail** for compliance and security  

The system encourages Junior Advocates to upgrade while ensuring Senior Counsel receive full value from advanced features.
