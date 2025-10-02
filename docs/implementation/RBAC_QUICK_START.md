# RBAC Quick Start Guide

## Implementation Summary

A comprehensive Role-Based Access Control system has been implemented to differentiate features between **Junior Advocate** and **Senior Counsel** user roles.

## Quick Reference

### User Roles

| Role | Description | Key Features |
|------|-------------|--------------|
| **Junior Advocate** | Entry-level advocates (< 10 years) | Core practice management: matters, invoices, pro forma, basic reports |
| **Senior Counsel** | Experienced advocates (10+ years) | All features + AI analytics, strategic finance, practice growth, integrations |
| **Chambers Admin** | Administrative role | Full system access + user management |

### Files Created

```
src/
├── types/
│   └── rbac.ts                                    # Role & permission definitions
├── hooks/
│   └── useRBAC.ts                                 # RBAC hooks for components
├── components/
│   ├── rbac/
│   │   ├── RoleGuard.tsx                          # Component-level access control
│   │   ├── RestrictedActionButton.tsx             # Button with permission checks
│   │   ├── UpgradePromptCard.tsx                  # Upgrade promotional card
│   │   └── index.ts                               # Exports
│   └── dashboard/
│       ├── RoleBasedDashboard.tsx                 # Dashboard router by role
│       ├── JuniorAdvocateDashboard.tsx            # Junior-specific dashboard
│       └── SeniorCounselDashboard.tsx             # Senior-specific dashboard
├── config/
│   └── rbac-navigation.config.ts                  # Navigation filtering by role
└── services/
    └── auth.service.ts                            # Updated with getUserRole()

supabase/migrations/
└── 20250201000000_add_user_roles_rbac.sql         # Database schema for roles

Documentation/
├── RBAC_IMPLEMENTATION.md                         # Comprehensive guide
└── RBAC_QUICK_START.md                            # This file
```

## Usage Examples

### 1. Check User Role

```typescript
import { useRBAC } from '../hooks/useRBAC';

function MyComponent() {
  const { userRole, isSeniorCounsel, isJuniorAdvocate } = useRBAC();
  
  return (
    <div>
      {isSeniorCounsel && <AdvancedFeatures />}
      {isJuniorAdvocate && <UpgradePrompt />}
    </div>
  );
}
```

### 2. Check Specific Permission

```typescript
import { useRBAC } from '../hooks/useRBAC';
import { Permission } from '../types/rbac';

function DeleteButton() {
  const { hasPermission } = useRBAC();
  
  if (!hasPermission(Permission.DELETE_MATTERS)) {
    return null; // Hide button
  }
  
  return <button onClick={handleDelete}>Delete</button>;
}
```

### 3. Guard Component Access

```typescript
import { RoleGuard } from '../components/rbac';
import { UserRole } from '../types/rbac';

function AdvancedPage() {
  return (
    <RoleGuard 
      requiredRole={UserRole.SENIOR_COUNSEL}
      showUpgradePrompt={true}
    >
      <AdvancedFeatureContent />
    </RoleGuard>
  );
}
```

### 4. Restricted Action Button

```typescript
import { RestrictedActionButton } from '../components/rbac';

function MatterActions() {
  return (
    <RestrictedActionButton
      actionKey="DELETE_MATTER"
      onClick={handleDelete}
      variant="danger"
    >
      Delete Matter
    </RestrictedActionButton>
  );
}
```

### 5. Show Upgrade Card

```typescript
import { UpgradePromptCard } from '../components/rbac';

function Sidebar() {
  const { isJuniorAdvocate } = useRBAC();
  
  return (
    <div>
      {isJuniorAdvocate && (
        <UpgradePromptCard 
          onUpgrade={() => navigate('/settings')}
          compact={true}
        />
      )}
    </div>
  );
}
```

### 6. Feature Access Check

```typescript
import { useFeatureAccess } from '../hooks/useRBAC';

function AIAnalyticsLink() {
  const { hasAccess, denialReason } = useFeatureAccess('ai-analytics');
  
  if (!hasAccess) {
    return (
      <div className="tooltip">
        <Lock /> AI Analytics
        <span>{denialReason}</span>
      </div>
    );
  }
  
  return <Link to="/ai-analytics">AI Analytics</Link>;
}
```

## Key Permissions

### Junior Advocate Has Access To:
- ✅ View/Create/Edit Matters
- ✅ View/Create/Edit Invoices  
- ✅ View/Create/Edit Pro Forma
- ✅ View Reports
- ✅ View Compliance
- ✅ Basic Settings

### Junior Advocate Restricted From:
- ❌ Delete Matters/Invoices
- ❌ AI Analytics
- ❌ Strategic Finance
- ❌ Practice Growth Network
- ❌ Voice Capture
- ❌ Document Intelligence
- ❌ Workflow Integrations
- ❌ Export Reports

### Senior Counsel Has Access To:
- ✅ Everything Junior Advocate has
- ✅ All restricted features above
- ✅ Full CRUD permissions
- ✅ Advanced analytics and reporting

## Database Migration

Run the migration to add role support:

```bash
# Apply migration
supabase db push

# Or manually execute
psql -h localhost -U postgres -d lexohub -f supabase/migrations/20250201000000_add_user_roles_rbac.sql
```

The migration will:
1. Create `user_role` enum type
2. Add `user_role` column to `advocates` table
3. Auto-assign roles based on `year_admitted` (10+ years = Senior Counsel)
4. Create role change audit log
5. Add triggers for automatic role assignment

## Integration Points

### In Auth Context

The auth service now provides:

```typescript
authService.getUserRole() // Returns: 'junior_advocate' | 'senior_counsel' | 'chambers_admin'
authService.hasPermission(permission) // Boolean check
```

### In Components

Use the `useRBAC()` hook for all permission checks:

```typescript
const { 
  userRole,           // Current user's role
  permissions,        // Array of permissions
  hasPermission,      // Check single permission
  hasAllPermissions,  // Check multiple permissions
  canPerformAction,   // Check action with message
  isSeniorCounsel,    // Boolean helper
  isJuniorAdvocate    // Boolean helper
} = useRBAC();
```

### In Navigation

Filter navigation items by role:

```typescript
import { filterNavigationByRole } from '../config/rbac-navigation.config';

const filteredNav = filterNavigationByRole(navigationItems, userRole);
```

## Testing Checklist

- [ ] Junior Advocate cannot access AI Analytics page
- [ ] Junior Advocate cannot delete matters
- [ ] Junior Advocate sees upgrade prompts
- [ ] Senior Counsel has full access
- [ ] Role assignment works correctly
- [ ] Upgrade flow navigates to settings
- [ ] Restricted buttons show lock icons
- [ ] Modals display proper messages

## Common Patterns

### Pattern 1: Conditional Rendering

```typescript
{isSeniorCounsel ? (
  <AdvancedFeature />
) : (
  <UpgradePrompt />
)}
```

### Pattern 2: Early Return

```typescript
if (!hasPermission(Permission.DELETE_MATTERS)) {
  return <AccessDenied />;
}

return <DeleteUI />;
```

### Pattern 3: Feature Toggle

```typescript
const features = {
  aiAnalytics: isSeniorCounsel,
  strategicFinance: isSeniorCounsel,
  basicReports: true
};
```

## Troubleshooting

### User Role Not Loading
- Check database migration ran successfully
- Verify `user_role` column exists in `advocates` table
- Check `authService.getUserRole()` returns correct value

### Permissions Not Working
- Ensure `useRBAC()` hook is called within `AuthProvider`
- Verify permission enum matches defined permissions
- Check role has required permissions in `ROLE_PERMISSIONS`

### Upgrade Prompt Not Showing
- Confirm user is Junior Advocate
- Check `showUpgradePrompt={true}` prop is set
- Verify component is imported correctly

## Next Steps

1. **Test thoroughly** with both user roles
2. **Update existing components** to use RBAC
3. **Add upgrade flow** in settings page
4. **Monitor analytics** for upgrade conversions
5. **Gather feedback** from users

## Support

For detailed information, see `RBAC_IMPLEMENTATION.md`.

For questions or issues:
- Review type definitions in `src/types/rbac.ts`
- Check hook implementation in `src/hooks/useRBAC.ts`
- Examine component examples in `src/components/rbac/`
