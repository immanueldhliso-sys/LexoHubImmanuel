import { useAuth } from '../contexts/AuthContext';
import { UserRole, Permission, ROLE_PERMISSIONS, RESTRICTED_ACTIONS } from '../types/rbac';
import { useMemo, useCallback } from 'react';

export interface RBACContext {
  userRole: UserRole;
  permissions: Permission[];
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  canPerformAction: (actionKey: string) => { allowed: boolean; message?: string };
  isSeniorCounsel: boolean;
  isJuniorAdvocate: boolean;
  isChamberAdmin: boolean;
}

export function useRBAC(): RBACContext {
  const { user } = useAuth();

  const userRole = useMemo((): UserRole => {
    if (!user) return UserRole.JUNIOR_ADVOCATE;
    
    const userType = user.user_metadata?.user_type;
    const yearAdmitted = user.user_metadata?.year_admitted;
    const currentYear = new Date().getFullYear();
    const yearsOfExperience = yearAdmitted ? currentYear - yearAdmitted : 0;

    if (userType === 'senior' || yearsOfExperience >= 10) {
      return UserRole.SENIOR_COUNSEL;
    }

    return UserRole.JUNIOR_ADVOCATE;
  }, [user]);

  const permissions = useMemo((): Permission[] => {
    return ROLE_PERMISSIONS[userRole]?.permissions || [];
  }, [userRole]);

  const hasPermission = useCallback((permission: Permission): boolean => {
    return permissions.includes(permission);
  }, [permissions]);

  const hasAnyPermission = useCallback((requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.some(permission => permissions.includes(permission));
  }, [permissions]);

  const hasAllPermissions = useCallback((requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.every(permission => permissions.includes(permission));
  }, [permissions]);

  const canPerformAction = useCallback((actionKey: string): { allowed: boolean; message?: string } => {
    const action = RESTRICTED_ACTIONS[actionKey];
    
    if (!action) {
      return { allowed: true };
    }

    const allowed = hasAllPermissions(action.requiredPermissions);
    
    return {
      allowed,
      message: allowed ? undefined : action.denialMessage
    };
  }, [hasAllPermissions]);

  return {
    userRole,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canPerformAction,
    isSeniorCounsel: userRole === UserRole.SENIOR_COUNSEL || userRole === UserRole.CHAMBERS_ADMIN,
    isJuniorAdvocate: userRole === UserRole.JUNIOR_ADVOCATE,
    isChamberAdmin: userRole === UserRole.CHAMBERS_ADMIN,
  };
}

export function useFeatureAccess(featureId: string): {
  hasAccess: boolean;
  denialReason?: string;
  requiredRole?: UserRole;
} {
  const { hasAllPermissions } = useRBAC();
  
  const FEATURE_ACCESS_MAP: Record<string, { requiredRole: UserRole; requiredPermissions: Permission[] }> = {
    'ai-analytics': { 
      requiredRole: UserRole.SENIOR_COUNSEL, 
      requiredPermissions: [Permission.VIEW_AI_ANALYTICS] 
    },
    'strategic-finance': { 
      requiredRole: UserRole.SENIOR_COUNSEL, 
      requiredPermissions: [Permission.VIEW_STRATEGIC_FINANCE] 
    },
    'practice-growth': { 
      requiredRole: UserRole.SENIOR_COUNSEL, 
      requiredPermissions: [Permission.VIEW_PRACTICE_GROWTH] 
    },
    'document-intelligence': { 
      requiredRole: UserRole.SENIOR_COUNSEL, 
      requiredPermissions: [Permission.USE_DOCUMENT_INTELLIGENCE] 
    },
    'workflow-integrations': { 
      requiredRole: UserRole.SENIOR_COUNSEL, 
      requiredPermissions: [Permission.VIEW_WORKFLOW_INTEGRATIONS] 
    },
    'advanced-reports': { 
      requiredRole: UserRole.SENIOR_COUNSEL, 
      requiredPermissions: [Permission.EXPORT_REPORTS] 
    },
  };

  const feature = FEATURE_ACCESS_MAP[featureId];
  
  if (!feature) {
    return { hasAccess: true };
  }

  const hasAccess = hasAllPermissions(feature.requiredPermissions);
  
  return {
    hasAccess,
    denialReason: hasAccess ? undefined : `This feature requires ${ROLE_PERMISSIONS[feature.requiredRole].displayName} access`,
    requiredRole: hasAccess ? undefined : feature.requiredRole,
  };
}
