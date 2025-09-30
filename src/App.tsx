import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { Scale, Briefcase, FileText, BarChart3, Settings, Menu, X, Users, LogOut, Brain } from 'lucide-react';
import { Card, CardContent, Button } from './design-system/components';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoadingSpinner } from './components/design-system/components/LoadingSpinner';
import type { Page } from './types';
import {
  DashboardPage,
  MattersPage,
  InvoicesPage,
  ProFormaPage,
  ReportsPage,
  SettingsPage,
  ProfilePage,
  PricingManagementPage,
  WorkflowIntegrationsPage,
  AIAnalyticsDashboard
} from './pages';
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
const Navigation: React.FC<{
  activePage: Page;
  sidebarOpen: boolean;
  onPageChange: (page: Page) => void;
  onToggleSidebar: () => void;
}> = ({ activePage, sidebarOpen, onPageChange, onToggleSidebar }) => {
  const { user, signOut } = useAuth();
  const [accessibleItems, setAccessibleItems] = React.useState<any[]>([]);
  
  const allNavigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'matters', label: 'Matters', icon: Briefcase },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'proforma', label: 'Pro Forma', icon: FileText },
    { id: 'pricing-management', label: 'Pricing', icon: Scale },
    // Advanced features (will be filtered based on user preferences)
    { id: 'ai-analytics', label: 'AI Analytics', icon: Brain },
    { id: 'strategic-finance', label: 'Finance', icon: Scale },
    { id: 'practice-growth', label: 'Practice Growth', icon: Users },
    { id: 'workflow-integrations', label: 'Workflow', icon: Settings },
    // Always visible
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  // Filter navigation items based on feature access
  React.useEffect(() => {
    const updateAccessibleItems = async () => {
      try {
        // Import services dynamically to avoid circular dependencies
        const { featureGuardService } = await import('./services/feature-guard.service');
        
        const filteredItems = allNavigationItems.filter(item => {
          const accessResult = featureGuardService.canAccessPage(item.id);
          return accessResult.allowed;
        });
        
        setAccessibleItems(filteredItems);
      } catch (error) {
        console.error('Error filtering navigation items:', error);
        // Fallback to core items only
        setAccessibleItems([
          { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
          { id: 'matters', label: 'Matters', icon: Briefcase },
          { id: 'invoices', label: 'Invoices', icon: FileText },
          { id: 'proforma', label: 'Pro Forma', icon: FileText },
          { id: 'pricing-management', label: 'Pricing', icon: Scale },
          { id: 'settings', label: 'Settings', icon: Settings },
        ]);
      }
    };

    updateAccessibleItems();

    // Listen for feature toggle changes
    let unsubscribe: (() => void) | undefined;
    
    const setupFeatureListener = async () => {
      try {
        const { featureToggleService } = await import('./services/feature-toggle.service');
        unsubscribe = featureToggleService.onFeatureChange(() => {
          updateAccessibleItems();
        });
      } catch (error) {
        console.error('Error setting up feature listener:', error);
      }
    };

    setupFeatureListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handlePageChange = (pageId: string) => {
    // Validate access before changing page
    const validateAndChange = async () => {
      try {
        const { featureGuardService } = await import('./services/feature-guard.service');
        
        if (featureGuardService.validatePageAccess(pageId)) {
          onPageChange(pageId as Page);
        }
      } catch (error) {
        console.error('Error validating page access:', error);
        // Fallback to direct navigation for core pages
        const corePages = ['dashboard', 'matters', 'invoices', 'proforma', 'pricing-management', 'settings', 'profile'];
        if (corePages.includes(pageId)) {
          onPageChange(pageId as Page);
        }
      }
    };

    validateAndChange();
  };

  return (
    <nav className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-neutral-200 transform transition-transform duration-300 ease-in-out flex flex-col ${
      sidebarOpen ? 'translate-x-0' : '-translate-x-full'
    } lg:translate-x-0`}>
      <div className="flex items-center justify-between h-16 px-6 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <Scale className="w-8 h-8 text-mpondo-gold-600" />
          <span className="text-xl font-bold text-neutral-900">LexoHub</span>
        </div>
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-md text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="px-3 py-4 flex-1">
        <ul className="space-y-1">
          {accessibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => handlePageChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-mpondo-gold-100 text-mpondo-gold-900'
                      : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* User Profile & Sign Out */}
      <div className="px-3 py-4 border-t border-neutral-200">
        <button
          onClick={() => handlePageChange('profile')}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 rounded-lg transition-colors"
        >
          <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center">
            <span className="text-mpondo-gold-600 font-medium text-lg">
              {user?.advocate_profile?.full_name?.charAt(0)?.toLowerCase() || user?.email?.charAt(0)?.toLowerCase() || 'n'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-neutral-900 text-base">
              User
            </p>
            <p className="text-sm text-neutral-500 truncate">
              {user?.email || 'nkosinathi.dhliso@gmail.com'}
            </p>
          </div>
        </button>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 rounded-lg transition-colors mt-2"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </nav>
  );
};

// Main Layout Component
const MainLayout: React.FC<{ 
  children: React.ReactNode;
  activePage: Page;
  sidebarOpen: boolean;
  onPageChange: (page: Page) => void;
  onToggleSidebar: () => void;
}> = ({ children, activePage, sidebarOpen, onPageChange, onToggleSidebar }) => {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation
        activePage={activePage}
        sidebarOpen={sidebarOpen}
        onPageChange={onPageChange}
        onToggleSidebar={onToggleSidebar}
      />
      
      <div className="lg:pl-[257px]">
        <div className="sticky top-0 z-40 lg:hidden">
          <div className="flex items-center gap-x-6 bg-white px-4 py-4 shadow-sm sm:px-6">
            <button
              type="button"
              className="-m-2.5 p-2.5 text-neutral-700 lg:hidden"
              onClick={onToggleSidebar}
              aria-label="Open sidebar"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// App Content Component (wrapped by AuthProvider)
const AppContent: React.FC = () => {
  type AppUiState = {
    activePage: Page;
    sidebarOpen: boolean;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      avatar: string;
    };
  };

  const [appState, setAppState] = useState<AppUiState>({
    activePage: 'dashboard',
    sidebarOpen: false,
    user: {
      id: '1',
      name: 'John Advocate',
      email: 'john@lawfirm.co.za',
      role: 'Senior Partner',
      avatar: '/api/placeholder/40/40'
    }
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
          setAppState(prev => ({ ...prev, activePage: redirectPage as Page }));
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
        setAppState(prev => ({ ...prev, activePage: page }));
      }
      // If validation fails, the guard service will handle the redirect
    } catch (error) {
      console.error('Error validating page access:', error);
      // Fallback to direct navigation for core pages
      const corePages = ['dashboard', 'matters', 'invoices', 'proforma', 'pricing-management', 'settings', 'profile'];
      if (corePages.includes(page)) {
        setAppState(prev => ({ ...prev, activePage: page }));
      }
    }
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setAppState(prev => ({ ...prev, sidebarOpen: !prev.sidebarOpen }));
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
        return <MattersPage />;
      case 'invoices':
        return <InvoicesPage />;
      case 'proforma':
        return <ProFormaPage />;
      case 'profile':
        return <ProfilePage />;
      case 'pricing-management':
        return <PricingManagementPage />;
      case 'settings':
        return <SettingsPage />;
      
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
          sidebarOpen={appState.sidebarOpen}
          onPageChange={handlePageChange}
          onToggleSidebar={handleToggleSidebar}
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