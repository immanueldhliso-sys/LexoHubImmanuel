import React from 'react';
import { useRBAC } from '../../hooks/useRBAC';
import { UserRole } from '../../types/rbac';
import { JuniorAdvocateDashboard } from './JuniorAdvocateDashboard';
import { SeniorCounselDashboard } from './SeniorCounselDashboard';

interface RoleBasedDashboardProps {
  onNavigate?: (page: string) => void;
}

export const RoleBasedDashboard: React.FC<RoleBasedDashboardProps> = ({ onNavigate }) => {
  const { userRole } = useRBAC();

  if (userRole === UserRole.SENIOR_COUNSEL || userRole === UserRole.CHAMBERS_ADMIN) {
    return <SeniorCounselDashboard onNavigate={onNavigate} />;
  }

  return <JuniorAdvocateDashboard onNavigate={onNavigate} />;
};
