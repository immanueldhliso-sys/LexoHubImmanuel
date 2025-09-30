import React, { Suspense, useState, useCallback, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Icons
import { 
  Mic
} from 'lucide-react';

// UI Components
import { LoadingSpinner } from './components/design-system/components/LoadingSpinner';

// Navigation Components
import { NavigationBar } from './components/navigation';

// Auth
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Global Components
import { GlobalVoiceModal } from './components/voice/GlobalVoiceModal';

// Types
import type { Page, Matter, UserTier } from './types';
import type { ExtractedTimeEntryData } from './types/voice';
import {
  DashboardPage,
  MattersPage,
  InvoicesPage,
  ReportsPage,
  SettingsPage,
  ProfilePage,
  PricingManagementPage,
  WorkflowIntegrationsPage,
  AIAnalyticsDashboard,
  ProFormaPage,
  CompliancePage
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
      <main className="pt-16 lg:pt-20">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
};

// App Content Component (wrapped by AuthProvider)
const AppContent: React.FC = () => {
  type AppUiState = {
    activePage: Page;
    voiceModalOpen: boolean;
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
    voiceModalOpen: false,
    user: {
      id: '1',
      name: 'John Advocate',
      email: 'john@lawfirm.co.za',
      role: 'Senior Partner',
      avatar: '/api/placeholder/40/40'
    }
  });

  // Voice capture feature flag
  const [isVoiceCaptureEnabled, setIsVoiceCaptureEnabled] = useState(false);
  const [availableMatters, setAvailableMatters] = useState<Matter[]>([]);

  // Check voice capture feature flag
  useEffect(() => {
    const checkVoiceFeature = () => {
      const isEnabled = import.meta.env.VITE_ENABLE_VOICE_CAPTURE === 'true';
      setIsVoiceCaptureEnabled(isEnabled);
    };

    checkVoiceFeature();
  }, []);

  // Load available matters for voice processing
  useEffect(() => {
    const loadMatters = async () => {
      try {
        // Import matters service dynamically
        const { mattersService } = await import('./services/api/matters.service');
        
        // Check if service is properly loaded
        if (!mattersService || typeof mattersService.getMatters !== 'function') {
          throw new Error('Matters service not properly initialized');
        }
        
        const response = await mattersService.getMatters();
        if (response?.data) {
          setAvailableMatters(response.data);
        } else {
          console.warn('No matters data received from service');
          setAvailableMatters([]);
        }
      } catch (error) {
        console.error('Error loading matters for voice processing:', error);
        // Set empty array as fallback to prevent UI issues
        setAvailableMatters([]);
      }
    };

    if (isVoiceCaptureEnabled) {
      loadMatters();
    }
  }, [isVoiceCaptureEnabled]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + V to open voice modal
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'V') {
        event.preventDefault();
        if (isVoiceCaptureEnabled) {
          setAppState(prev => ({ ...prev, voiceModalOpen: true }));
        }
      }

      // Escape to close voice modal
      if (event.key === 'Escape' && appState.voiceModalOpen) {
        event.preventDefault();
        setAppState(prev => ({ ...prev, voiceModalOpen: false }));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVoiceCaptureEnabled, appState.voiceModalOpen]);

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
      const corePages = ['dashboard', 'matters', 'invoices', 'proforma', 'pricing-management', 'compliance', 'settings', 'profile'];
      if (corePages.includes(page)) {
        setAppState(prev => ({ ...prev, activePage: page }));
      }
    }
  }, []);



  const handleOpenVoiceModal = useCallback(() => {
    if (isVoiceCaptureEnabled) {
      setAppState(prev => ({ ...prev, voiceModalOpen: true }));
    }
  }, [isVoiceCaptureEnabled]);

  const handleCloseVoiceModal = useCallback(() => {
    setAppState(prev => ({ ...prev, voiceModalOpen: false }));
  }, []);

  const handleTimeEntryExtracted = useCallback(async (data: ExtractedTimeEntryData) => {
    try {
      // Import time entries service dynamically
      const { timeEntriesService } = await import('./services/api/time-entries.service');
      
      // Create time entry from extracted data
      const timeEntryData = {
        matter_id: data.matterId || null,
        description: data.description,
        duration_minutes: data.duration || 0,
        work_type: data.workType || 'General',
        date: data.date || new Date().toISOString().split('T')[0],
        is_billable: true, // Default to billable
        rate_per_hour: null, // Will be set based on matter/user defaults
        total_amount: null, // Will be calculated
        notes: `Voice captured entry (${Math.round(data.confidence * 100)}% confidence)`
      };

      const response = await timeEntriesService.createTimeEntry(timeEntryData);
      
      if (response.data) {
        // Show success notification
        const { toast } = await import('react-hot-toast');
        toast.success('Time entry created successfully from voice capture!');
        
        // Navigate to matters page to show the new entry
        setAppState(prev => ({ ...prev, activePage: 'matters' }));
      } else {
        throw new Error(response.error || 'Failed to create time entry');
      }
    } catch (error) {
      console.error('Error creating time entry from voice:', error);
      const { toast } = await import('react-hot-toast');
      toast.error('Failed to create time entry. Please try again.');
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
        return <MattersPage />;
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
        
        {/* Global Voice Modal */}
        {isVoiceCaptureEnabled && (
          <GlobalVoiceModal
            isOpen={appState.voiceModalOpen}
            onClose={handleCloseVoiceModal}
            onTimeEntryExtracted={handleTimeEntryExtracted}
            availableMatters={availableMatters}
          />
        )}

        {/* Mobile Voice FAB */}
        {isVoiceCaptureEnabled && (
          <button
            onClick={handleOpenVoiceModal}
            className="fixed bottom-4 right-4 z-40 lg:hidden w-12 h-12 bg-mpondo-gold-600 hover:bg-mpondo-gold-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group animate-pulse hover:animate-none focus:animate-none active:scale-95 safe-area-inset-bottom safe-area-inset-right"
            aria-label="Open voice capture"
            title="Voice Capture (Ctrl+Shift+V)"
            style={{ 
              marginBottom: 'env(safe-area-inset-bottom, 0px)',
              marginRight: 'env(safe-area-inset-right, 0px)'
            }}
          >
            <Mic className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            <div className="absolute inset-0 rounded-full bg-mpondo-gold-400 opacity-30 animate-ping group-hover:animate-none group-focus:animate-none"></div>
          </button>
        )}

        {/* Desktop Voice Shortcut Indicator */}
        {isVoiceCaptureEnabled && (
          <div className="hidden lg:block fixed bottom-4 right-4 z-30 group">
            <div className="absolute bottom-full right-0 mb-2 bg-neutral-900 text-white px-3 py-2 rounded-lg text-sm shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
              Press Ctrl+Shift+V for voice capture
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-900"></div>
            </div>
            <button
              onClick={handleOpenVoiceModal}
              className="w-10 h-10 bg-mpondo-gold-600 hover:bg-mpondo-gold-700 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-mpondo-gold-400 focus:ring-offset-2 focus:ring-offset-white"
              aria-label="Open voice capture"
              title="Voice Capture (Ctrl+Shift+V)"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
        )}
        
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