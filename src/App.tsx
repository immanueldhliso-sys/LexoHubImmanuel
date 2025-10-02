import React, { Suspense, useState, useCallback, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// UI Components
import { LoadingSpinner } from './components/design-system/components/LoadingSpinner';
import { Card, CardContent, Button } from './design-system/components';

// Navigation Components
import { NavigationBar } from './components/navigation';

// Auth
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Types
import type { Page, Matter, UserTier } from './types';
import {
  DashboardPage,
  MattersPage,
  MatterWorkbenchPage,
  InvoicesPage,
  ReportsPage,
  SettingsPage,
  ProfilePage,
  PricingManagementPage,
  WorkflowIntegrationsPage,
  AIAnalyticsDashboard,
  ProFormaPage,
  CompliancePage,
  ProFormaRequestPage
} from './pages';
import { TemplateManagementPage } from './pages/TemplateManagementPage';
import { PracticeGrowthPage } from './pages/PracticeGrowthPage';
import { StrategicFinancePage } from './pages/StrategicFinancePage';
import { FeatureDiscoveryNotification } from './components/notifications/FeatureDiscoveryNotification';

// Create Query Client with proper configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    },
  },
});

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} />;
    }
    return this.props.children;
  }
}

// Default Error Fallback
const DefaultErrorFallback: React.FC<{ error: Error }> = ({ error }) => {
  const isFeatureError = error.message?.includes('feature') || error.message?.includes('access');
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-100">
      <Card className="max-w-md w-full">
        <CardContent className="text-center">
          <div className="text-status-error-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            {isFeatureError ? 'Feature Access Error' : 'Oops! Something went wrong'}
          </h1>
          <p className="text-neutral-600 mb-4">
            {error.message || 'An unexpected error occurred'}
          </p>
          <div className="space-y-2">
            <Button
              onClick={() => window.location.reload()}
              variant="primary"
              aria-label="Reload the application"
            >
              Reload Application
            </Button>
            {isFeatureError && (
              <Button
                onClick={() => window.location.hash = 'dashboard'}
                variant="secondary"
                aria-label="Go to dashboard"
              >
                Go to Dashboard
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};



// Navigation Component
// Navigation component is now replaced by NavigationBar from ./components/navigation

// Main Layout Component
const MainLayout: React.FC<{ 
  children: React.ReactNode;
  activePage: Page;
  onPageChange: (page: Page) => void;
}> = ({ children, activePage, onPageChange }) => {
  const { user } = useAuth();
  
  // Determine user tier based on user data (simplified for now)
  const userTier: UserTier = 'professional'; // This should come from user data/subscription
  
  return (
    <div className="min-h-screen bg-neutral-50">
      <NavigationBar
        activePage={activePage}
        onPageChange={onPageChange}
        userTier={userTier}
        user={user}
      />

      {/* Main content area */}
      <main>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
};

// App Content Component (wrapped by AuthProvider)
const AppContent: React.FC = () => {
  const [appState, setAppState] = useState({
    activePage: 'dashboard' as Page,
    currentPage: 'dashboard' as Page,
    selectedMatter: null as Matter | null,
  });





  // Initialize feature system and set up redirect handler
  useEffect(() => {
    const initializeFeatureSystem = async () => {
      try {
        // Initialize services
        const [
          { featureGuardService },
          { featureToggleService },
          { userPreferencesService }
        ] = await Promise.all([
          import('./services/feature-guard.service'),
          import('./services/feature-toggle.service'),
          import('./services/api/user-preferences.service')
        ]);

        // Load user preferences and initialize feature toggle service
        const preferencesResponse = await userPreferencesService.getCurrentUserPreferences();
        
        if (preferencesResponse.data) {
          await featureToggleService.initialize(preferencesResponse.data);
        } else if (!preferencesResponse.error) {
          // Initialize with defaults for new users
          await featureToggleService.initialize(null);
        }

        // Set up redirect handler
        const unsubscribe = featureGuardService.onRedirect((redirectPage) => {
          setAppState(prev => ({ ...prev, activePage: redirectPage as Page, currentPage: redirectPage as Page }));
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error initializing feature system:', error);
        return () => {};
      }
    };

    let cleanup: (() => void) | undefined;
    initializeFeatureSystem().then(unsubscribeFn => {
      cleanup = unsubscribeFn;
    });

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  const handlePageChange = useCallback(async (page: Page) => {
    // Validate access before changing page
    try {
      const { featureGuardService } = await import('./services/feature-guard.service');
      
      if (featureGuardService.validatePageAccess(page)) {
        setAppState(prev => ({ ...prev, activePage: page, currentPage: page }));
      }
      // If validation fails, the guard service will handle the redirect
    } catch (error) {
      console.error('Error validating page access:', error);
      // Fallback to direct navigation for core pages
      const corePages = ['dashboard', 'matters', 'invoices', 'proforma', 'pricing-management', 'compliance', 'settings', 'profile', 'reports', 'ai-analytics', 'practice-growth', 'strategic-finance', 'workflow-integrations', 'matter-templates', 'academy'];
      if (corePages.includes(page)) {
        setAppState(prev => ({ ...prev, activePage: page, currentPage: page }));
      }
    }
  }, []);





  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (appState.sidebarOpen && !target.closest('nav') && !target.closest('button[aria-label="Open sidebar"]')) {
        setAppState(prev => ({ ...prev, sidebarOpen: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [appState.sidebarOpen]);

  const renderPage = () => {
    // Import AdvancedFeatureRoute dynamically to avoid circular dependencies
    const AdvancedFeatureRoute = React.lazy(() => 
      import('./components/features/AdvancedFeatureRoute').then(module => ({
        default: module.AdvancedFeatureRoute
      }))
    );

    switch (appState.activePage) {
      case 'dashboard':
        return <DashboardPage onNavigate={handlePageChange} />;
      case 'matters':
        return <MattersPage onNavigate={handlePageChange} />;
      case 'matter-workbench':
        return <MatterWorkbenchPage onNavigateBack={() => handlePageChange('matters')} />;
      case 'matter-templates':
        return <TemplateManagementPage />;
      case 'invoices':
        return <InvoicesPage />;
      case 'proforma':
        return <ProFormaPage />;
      case 'profile':
        return <ProfilePage />;
      case 'pricing-management':
        return <PricingManagementPage />;
      case 'compliance':
        return <CompliancePage />;
      case 'settings':
        return <SettingsPage />;
      case 'academy':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <AdvancedFeatureRoute page="academy">
              <div className="p-8">
                <h1 className="text-2xl font-bold">Academy</h1>
                <p>Coming soon</p>
              </div>
            </AdvancedFeatureRoute>
          </Suspense>
        );
      
      // Advanced feature pages with route guards
      case 'ai-analytics':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <AdvancedFeatureRoute page="ai-analytics">
              <AIAnalyticsDashboard />
            </AdvancedFeatureRoute>
          </Suspense>
        );
      case 'strategic-finance':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <AdvancedFeatureRoute page="strategic-finance">
              <StrategicFinancePage />
            </AdvancedFeatureRoute>
          </Suspense>
        );
      case 'practice-growth':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <AdvancedFeatureRoute page="practice-growth">
              <PracticeGrowthPage />
            </AdvancedFeatureRoute>
          </Suspense>
        );
      case 'workflow-integrations':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <AdvancedFeatureRoute page="workflow-integrations">
              <WorkflowIntegrationsPage />
            </AdvancedFeatureRoute>
          </Suspense>
        );
      case 'reports':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <AdvancedFeatureRoute page="reports">
              <ReportsPage />
            </AdvancedFeatureRoute>
          </Suspense>
        );
      
      default:
        return <DashboardPage onNavigate={handlePageChange} />;
    }
  };

  return (
    <ProtectedRoute>
      <div className="App">
        <MainLayout
          activePage={appState.activePage}
          onPageChange={handlePageChange}
        >
          <Suspense fallback={<LoadingSpinner />}>
            {renderPage()}
          </Suspense>
        </MainLayout>
        
        {/* Feature Discovery Notification */}
        <FeatureDiscoveryNotification 
          onNavigateToSettings={() => {
            setAppState(prev => ({ ...prev, activePage: 'settings' }));
          }}
        />
        
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </div>
    </ProtectedRoute>
  );
};

// Main App Component
function App() {
  // Check for public routes that don't require authentication
  const pathname = window.location.pathname;
  const isProFormaRequestRoute = pathname.startsWith('/pro-forma-request/');
  
  // Handle public pro forma request route
  if (isProFormaRequestRoute) {
    const token = pathname.split('/pro-forma-request/')[1];
    return (
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <div className="min-h-screen bg-neutral-50">
            <Suspense fallback={<LoadingSpinner />}>
              <ProFormaRequestPage token={token} />
            </Suspense>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </div>
        </ErrorBoundary>
      </QueryClientProvider>
    );
  }

  // Default authenticated app
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;