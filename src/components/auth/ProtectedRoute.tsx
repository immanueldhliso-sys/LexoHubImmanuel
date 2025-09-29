/**
 * Protected Route Component
 * Wraps components that require authentication
 */

import React, { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../design-system/components/LoadingSpinner';
import LoginPage from '../../pages/LoginPage';
import WelcomePage from '../../pages/WelcomePage';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: string;
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredPermission,
  fallback 
}) => {
  const { user, loading, hasPermission } = useAuth();
  const pathname = window.location.pathname;

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Public route for post-confirmation landing
  if (pathname === '/welcome') {
    return <WelcomePage />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  // Check permission if required
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Access Denied</h2>
          <p className="text-neutral-600">
            You don't have permission to access this resource.
          </p>
          {fallback && (
            <div className="mt-4">
              {fallback}
            </div>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};