import { UserRole, Permission } from '../types/rbac';
import { NavigationItem } from '../types';

export interface RBACNavigationItem extends NavigationItem {
  requiredRole?: UserRole;
  requiredPermission?: Permission;
  requiredPermissions?: Permission[];
  hideForRoles?: UserRole[];
  showUpgradePrompt?: boolean;
}

export const JUNIOR_ADVOCATE_RESTRICTED_FEATURES = [
  'ai-analytics',
  'strategic-finance', 
  'practice-growth',
  'document-intelligence',
  'workflow-integrations',
  'advanced-reports',
];

export const SENIOR_COUNSEL_EXCLUSIVE_FEATURES = [
  'ai-analytics',
  'strategic-finance',
  'practice-growth',
  'document-intelligence',
  'workflow-integrations',
];

export function filterNavigationByRole(
  items: RBACNavigationItem[],
  userRole: UserRole
): RBACNavigationItem[] {
  return items.filter(item => {
    if (item.hideForRoles?.includes(userRole)) {
      return false;
    }

    if (item.requiredRole && userRole !== item.requiredRole && userRole !== UserRole.CHAMBERS_ADMIN) {
      return false;
    }

    return true;
  });
}

export function getNavigationAccessLevel(
  itemId: string,
  userRole: UserRole
): 'full' | 'restricted' | 'upgrade-required' {
  if (userRole === UserRole.CHAMBERS_ADMIN) {
    return 'full';
  }

  if (userRole === UserRole.SENIOR_COUNSEL) {
    return 'full';
  }

  if (JUNIOR_ADVOCATE_RESTRICTED_FEATURES.includes(itemId)) {
    return 'upgrade-required';
  }

  return 'full';
}
