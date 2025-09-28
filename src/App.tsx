import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster, toast } from 'react-hot-toast';
import { Scale, Briefcase, FileText, BarChart3, Settings, User as UserIcon, Menu, X, Users } from 'lucide-react';
import { Card, CardHeader, CardContent, Button } from './design-system/components';
import type { Page } from './types';
import {
  DashboardPage,
  MattersPage,
  InvoicesPage,
  ReportsPage,
  SettingsPage,
  ProfilePage,
  PricingManagementPage
} from './pages';
import { PracticeGrowthPage } from './pages/PracticeGrowthPage';

// Create Query Client with proper configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
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
  constructor(props: React.PropsWithChildren<Record<string, never>>) {
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
const DefaultErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
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
          Oops! Something went wrong
        </h1>
        <p className="text-neutral-600 mb-4">
          {error.message || 'An unexpected error occurred'}
        </p>
        <Button
          onClick={() => window.location.reload()}
          variant="primary"
          aria-label="Reload the application"
        >
          Reload Application
        </Button>
      </CardContent>
    </Card>
  </div>
);

// Loading Component
const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex justify-center items-center p-4">
      <svg
        className={`${sizeClasses[size]} animate-spin text-mpondo-gold-500`}
        fill="none"
        viewBox="0 0 24 24"
        aria-label="Loading"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
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
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'matters', label: 'Matters', icon: Briefcase },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'practice-growth', label: 'Practice Growth', icon: Users },
    { id: 'pricing-management', label: 'Pricing', icon: Scale },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ] as const;

  return (
    <nav className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-neutral-200 transform transition-transform duration-300 ease-in-out ${
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
      
      <div className="px-3 py-4">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onPageChange(item.id as Page)}
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

// Main App Component
function App() {
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

  const handlePageChange = useCallback((page: Page) => {
    setAppState(prev => ({ ...prev, activePage: page }));
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
    switch (appState.activePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'matters':
        return <MattersPage />;
      case 'invoices':
        return <InvoicesPage />;
      case 'reports':
        return <ReportsPage />;
      case 'practice-growth':
        return <PracticeGrowthPage />;
      case 'pricing-management':
        return <PricingManagementPage />;
      case 'settings':
        return <SettingsPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
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

export default App;