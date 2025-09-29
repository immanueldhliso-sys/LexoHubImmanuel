/**
 * Advanced Feature Route Component
 * Protects routes that require advanced features to be enabled
 */

import React, { useEffect } from 'react';
import { featureGuardService } from '../../services/feature-guard.service';
import { featureToggleService } from '../../services/feature-toggle.service';
import { Card, CardContent } from '../../design-system/components';
import { Lock, Settings } from 'lucide-react';

interface AdvancedFeatureRouteProps {
  page: string;
  children: React.ReactNode;
  fallback?: React.ComponentType<{ page: string; message?: string }>;
  onAccessDenied?: (page: string) => void;
}

/**
 * Default fallback component for disabled features
 */
const DefaultFallback: React.FC<{ page: string; message?: string }> = ({ page, message }) => {
  const feature = featureGuardService.getPageFeatureInfo(page);
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-50">
      <Card className="max-w-md w-full">
        <CardContent className="text-center py-8">
          <div className="text-neutral-400 mb-4">
            <Lock className="w-16 h-16 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Feature Not Enabled
          </h1>
          <p className="text-neutral-600 mb-6">
            {message || `${feature?.name || 'This feature'} is not currently enabled for your account.`}
          </p>
          <div className="space-y-3">
            <p className="text-sm text-neutral-500">
              To access this feature, enable it in your settings.
            </p>
            <button
              onClick={() => window.location.href = '#settings'}
              className="inline-flex items-center gap-2 px-4 py-2 bg-mpondo-gold-500 text-white rounded-lg hover:bg-mpondo-gold-600 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Go to Settings
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Advanced Feature Route Guard Component
 */
export const AdvancedFeatureRoute: React.FC<AdvancedFeatureRouteProps> = ({
  page,
  children,
  fallback: FallbackComponent = DefaultFallback,
  onAccessDenied
}) => {
  const accessResult = featureGuardService.canAccessPage(page);

  useEffect(() => {
    if (!accessResult.allowed && onAccessDenied) {
      onAccessDenied(page);
    }
  }, [accessResult.allowed, page, onAccessDenied]);

  // If access is allowed, render children
  if (accessResult.allowed) {
    return <>{children}</>;
  }

  // If access is denied, render fallback
  return (
    <FallbackComponent 
      page={page} 
      message={accessResult.message}
    />
  );
};

/**
 * Higher-order component for protecting page components
 */
export function withAdvancedFeatureGuard<P extends Record<string, any>>(
  page: string,
  Component: React.ComponentType<P>,
  options?: {
    fallback?: React.ComponentType<{ page: string; message?: string }>;
    onAccessDenied?: (page: string) => void;
  }
) {
  const WrappedComponent: React.FC<P> = (props) => {
    return (
      <AdvancedFeatureRoute
        page={page}
        fallback={options?.fallback}
        onAccessDenied={options?.onAccessDenied}
      >
        <Component {...props} />
      </AdvancedFeatureRoute>
    );
  };

  // Set display name for debugging
  WrappedComponent.displayName = `withAdvancedFeatureGuard(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Hook for checking feature access in components
 */
export function useAdvancedFeatureAccess(page: string) {
  const [accessResult, setAccessResult] = React.useState(() => 
    featureGuardService.canAccessPage(page)
  );

  React.useEffect(() => {
    // Update access result when feature toggles change
    const unsubscribe = featureToggleService.onFeatureChange(() => {
      setAccessResult(featureGuardService.canAccessPage(page));
    });

    return unsubscribe;
  }, [page]);

  return {
    canAccess: accessResult.allowed,
    error: accessResult.error,
    message: accessResult.message,
    redirectTo: accessResult.redirectTo,
    feature: featureGuardService.getPageFeatureInfo(page)
  };
}

export default AdvancedFeatureRoute;