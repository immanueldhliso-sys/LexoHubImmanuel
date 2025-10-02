import React, { ReactNode } from 'react';
import { useRBAC } from '../../hooks/useRBAC';
import { Permission, UserRole } from '../../types/rbac';
import { Button } from '../../design-system/components';
import { Lock, ArrowUpCircle } from 'lucide-react';

interface RoleGuardProps {
  children: ReactNode;
  requiredPermission?: Permission;
  requiredPermissions?: Permission[];
  requireAll?: boolean;
  requiredRole?: UserRole;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
  onUpgrade?: () => void;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  requiredPermission,
  requiredPermissions,
  requireAll = true,
  requiredRole,
  fallback,
  showUpgradePrompt = false,
  onUpgrade,
}) => {
  const { userRole, hasPermission, hasAnyPermission, hasAllPermissions } = useRBAC();

  const checkPermissions = (): boolean => {
    if (requiredRole && userRole !== requiredRole && userRole !== UserRole.CHAMBERS_ADMIN) {
      return false;
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
      return false;
    }

    if (requiredPermissions) {
      if (requireAll && !hasAllPermissions(requiredPermissions)) {
        return false;
      }
      if (!requireAll && !hasAnyPermission(requiredPermissions)) {
        return false;
      }
    }

    return true;
  };

  const hasAccess = checkPermissions();

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgradePrompt) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="mb-4 flex justify-center">
            <div className="p-3 bg-mpondo-gold-100 rounded-full">
              <Lock className="w-8 h-8 text-mpondo-gold-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">
            Premium Feature
          </h3>
          <p className="text-neutral-600 mb-6">
            This feature requires Senior Counsel access. Upgrade your account to unlock advanced practice management tools.
          </p>
          {onUpgrade && (
            <Button
              onClick={onUpgrade}
              variant="primary"
              className="inline-flex items-center gap-2"
            >
              <ArrowUpCircle className="w-4 h-4" />
              Upgrade to Senior Counsel
            </Button>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export const RestrictedContent: React.FC<{
  children: ReactNode;
  permission: Permission;
}> = ({ children, permission }) => {
  const { hasPermission } = useRBAC();

  if (!hasPermission(permission)) {
    return null;
  }

  return <>{children}</>;
};

export const SeniorCounselOnly: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <RoleGuard
      requiredRole={UserRole.SENIOR_COUNSEL}
      showUpgradePrompt={true}
    >
      {children}
    </RoleGuard>
  );
};
