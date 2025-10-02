import React, { useState, useRef, useEffect } from 'react';
import { Scale, Menu, X, Search, Plus, ChevronDown, Bell } from 'lucide-react';
import { Button, Icon } from '../../design-system/components';
import { MegaMenu } from './MegaMenu';
import { MobileMegaMenu } from './MobileMegaMenu';
import GlobalCommandBar from './GlobalCommandBar';
import QuickActionsMenu from './QuickActionsMenu';
import { RealTimeTicker } from './RealTimeTicker';
import AlertsDropdown from '../notifications/AlertsDropdown';

import { navigationConfig, getFilteredNavigationConfig } from '../../config/navigation.config';
import { useKeyboardShortcuts, useClickOutside } from '../../hooks';
import { smartNotificationsService } from '../../services/smart-notifications.service';
import { toast } from 'react-hot-toast';
import type { 
  NavigationCategory, 
  NavigationState, 
  Page, 
  UserTier,
  NavigationA11y 
} from '../../types';
import type { NotificationBadge, SmartNotification } from '../../services/smart-notifications.service';

interface NavigationBarProps {
  activePage: Page;
  onPageChange: (page: Page) => void;
  userTier?: UserTier;
  className?: string;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  activePage,
  onPageChange,
  userTier = 'junior_start',
  className = ''
}) => {
  const [navigationState, setNavigationState] = useState<NavigationState>({
    activeCategory: null,
    activePage,
    megaMenuOpen: false,
    mobileMenuOpen: false,
    hoveredCategory: null
  });

  const [commandBarOpen, setCommandBarOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [notificationBadges, setNotificationBadges] = useState<NotificationBadge[]>([]);
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const commandBarRef = useRef<HTMLDivElement>(null);
  const quickActionsRef = useRef<HTMLDivElement>(null);

  // Get filtered navigation config based on user tier
  const filteredConfig = getFilteredNavigationConfig(userTier);

  // Handle category hover with delay
  const handleCategoryHover = (categoryId: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      setNavigationState(prev => ({
        ...prev,
        hoveredCategory: categoryId,
        megaMenuOpen: true,
        activeCategory: categoryId
      }));
    }, 300); // 300ms hover delay as per PRD
  };

  // Handle category leave
  const handleCategoryLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      setNavigationState(prev => ({
        ...prev,
        hoveredCategory: null,
        megaMenuOpen: false,
        activeCategory: null
      }));
    }, 150); // Short delay to allow moving to mega menu
  };

  // Handle mega menu hover
  const handleMegaMenuHover = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  // Handle mega menu leave
  const handleMegaMenuLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setNavigationState(prev => ({
        ...prev,
        hoveredCategory: null,
        megaMenuOpen: false,
        activeCategory: null
      }));
    }, 150);
  };

  // Handle page navigation
  const handlePageNavigation = (page: Page) => {
    onPageChange(page);
    setNavigationState(prev => ({
      ...prev,
      activePage: page,
      megaMenuOpen: false,
      mobileMenuOpen: false,
      activeCategory: null,
      hoveredCategory: null
    }));
  };

  // Handle quick action execution
  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case 'create-proforma':
        // Navigate to proforma page
        handlePageNavigation('proforma');
        break;
      
      case 'add-matter':
        // Show placeholder notification for add matter
        toast.success('Add Matter feature coming soon!', {
          duration: 3000,
          position: 'top-right'
        });
        break;
      
      case 'analyze-brief':
        // Show placeholder notification for brief analysis
        toast.success('AI Brief Analysis feature coming soon!', {
          duration: 3000,
          position: 'top-right'
        });
        break;
      
      case 'quick-invoice':
        // Show placeholder notification for quick invoice
        toast.success('Quick Invoice feature coming soon!', {
          duration: 3000,
          position: 'top-right'
        });
        break;
      
      default:
        // Fallback for unknown actions
        toast.error(`Unknown action: ${actionId}`, {
          duration: 2000,
          position: 'top-right'
        });
        break;
    }
  };

  // Handle mobile menu toggle
  const toggleMobileMenu = () => {
    setNavigationState(prev => ({
      ...prev,
      mobileMenuOpen: !prev.mobileMenuOpen
    }));
  };

  // Handle command bar toggle
  const toggleCommandBar = () => {
    setCommandBarOpen(!commandBarOpen);
  };

  // Handle quick actions toggle
  const toggleQuickActions = () => {
    setQuickActionsOpen(!quickActionsOpen);
  };

  // Alerts dropdown state
  const [alertsOpen, setAlertsOpen] = useState(false);
  const alertsRef = useRef<HTMLDivElement>(null);
  useClickOutside(alertsRef, () => setAlertsOpen(false));



  // Close all dropdowns
  const closeAllDropdowns = () => {
    setCommandBarOpen(false);
    setQuickActionsOpen(false);
    setNavigationState(prev => ({
      ...prev,
      megaMenuOpen: false,
      activeCategory: null,
      hoveredCategory: null
    }));
  };

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrlKey: true,
      action: toggleCommandBar,
      description: 'Open command bar'
    },
    {
      key: 'k',
      metaKey: true,
      action: toggleCommandBar,
      description: 'Open command bar'
    },
    {
      key: 'n',
      ctrlKey: true,
      shiftKey: true,
      action: toggleQuickActions,
      description: 'Open quick actions'
    },
    {
      key: 'Escape',
      action: closeAllDropdowns,
      description: 'Close all menus'
    }
  ]);

  // Click outside handlers
  useClickOutside(commandBarRef, () => setCommandBarOpen(false), commandBarOpen);
  useClickOutside(quickActionsRef, () => setQuickActionsOpen(false), quickActionsOpen);

  // Keyboard navigation for categories
  const handleKeyDown = (event: React.KeyboardEvent, categoryId?: string) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        if (categoryId) {
          event.preventDefault();
          handleCategoryHover(categoryId);
        }
        break;
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Update active page when prop changes
  useEffect(() => {
    setNavigationState(prev => ({
      ...prev,
      activePage
    }));
  }, [activePage]);

  // Subscribe to notifications
  useEffect(() => {
    const unsubscribeBadges = smartNotificationsService.subscribeToBadges(setNotificationBadges);
    const unsubscribeNotifications = smartNotificationsService.subscribe(setNotifications);

    return () => {
      unsubscribeBadges();
      unsubscribeNotifications();
    };
  }, []);

  // Get accessibility props for category buttons
  const getCategoryA11yProps = (category: NavigationCategory): NavigationA11y => ({
    ariaLabel: `${category.label} menu`,
    ariaExpanded: navigationState.activeCategory === category.id,
    ariaHaspopup: true,
    role: 'button',
    tabIndex: 0
  });

  // Get notification badge for a category
  const getCategoryBadge = (categoryPage?: Page) => {
    if (!categoryPage) return null;
    return notificationBadges.find(badge => badge.page === categoryPage);
  };

  return (
    <nav 
      className={`bg-white border-b border-neutral-200 sticky top-0 z-50 ${className}`}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Real-Time Ticker */}
      <RealTimeTicker onItemClick={handlePageNavigation} />

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Icon icon={Scale} className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
              <span className="text-lg sm:text-xl font-bold text-neutral-900">LexoHub</span>
            </div>

            {/* Desktop Navigation Categories */}
            <div className="hidden lg:flex items-center space-x-1">
              {filteredConfig.categories.map((category) => {
                const CategoryIcon = category.icon;
                const isActive = navigationState.activePage === category.page;
                const isHovered = navigationState.hoveredCategory === category.id;
                const a11yProps = getCategoryA11yProps(category);

                const badge = getCategoryBadge(category.page);

                return (
                  <div
                    key={category.id}
                    className="relative"
                    onMouseEnter={() => handleCategoryHover(category.id)}
                    onMouseLeave={handleCategoryLeave}
                  >
                    <button
                      onClick={() => category.page && handlePageNavigation(category.page)}
                      onKeyDown={(e) => handleKeyDown(e, category.id)}
                      className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-mpondo-gold-100 text-mpondo-gold-900'
                          : isHovered
                          ? 'bg-neutral-100 text-neutral-900'
                          : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                      }`}
                      aria-label={a11yProps.ariaLabel}
                      aria-expanded={a11yProps.ariaExpanded}
                      aria-haspopup={a11yProps.ariaHaspopup}
                      role={a11yProps.role}
                      tabIndex={a11yProps.tabIndex}
                    >
                      <Icon icon={CategoryIcon} className="w-4 h-4" />
                      <span>{category.label}</span>
                      
                      {/* Notification Badge */}
                      {badge && badge.count > 0 && (
                        <span 
                          className={`inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium rounded-full ${
                            badge.hasUrgent 
                              ? 'bg-status-error-500 text-white' 
                              : badge.highestPriority >= 7
                              ? 'bg-status-warning-500 text-white'
                              : 'bg-mpondo-gold-500 text-white'
                          }`}
                          aria-label={`${badge.count} notifications`}
                        >
                          {badge.count > 99 ? '99+' : badge.count}
                        </span>
                      )}
                      
                      <Icon 
                        icon={ChevronDown}
                        noGradient
                        className={`w-3 h-3 transition-transform duration-200 ${
                          isHovered ? 'rotate-180' : ''
                        }`} 
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Global Command Bar */}
            <div ref={commandBarRef}>
              <GlobalCommandBar
                onNavigate={handlePageNavigation}
                onAction={(actionId: string) => {
                  // Handle action execution
                  console.log('Action executed:', actionId);
                }}
              />
            </div>

            {/* Quick Actions Menu */}
            <div ref={quickActionsRef}>
              <QuickActionsMenu
                onAction={handleQuickAction}
                userTier={userTier}
              />
            </div>

             {/* Notifications Button */}
             <div className="relative" ref={alertsRef}>
               <Button
                 variant="ghost"
                 size="sm"
                 className="flex items-center gap-2"
                 aria-label="Notifications"
                 onClick={() => setAlertsOpen((open) => !open)}
               >
                 <Icon icon={Bell} className="w-4 h-4" />
                 <span className="hidden sm:inline">Alerts</span>
                 {notificationBadges.length > 0 && (
                   <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium bg-status-error-500 text-white rounded-full">
                     {notificationBadges.reduce((sum, badge) => sum + badge.count, 0)}
                   </span>
                 )}
               </Button>
               {alertsOpen && (
                 <AlertsDropdown onNavigate={handlePageNavigation} onClose={() => setAlertsOpen(false)} />
               )}
             </div>

             {/* Mobile Menu Toggle */}
             <Button
               variant="ghost"
               size="sm"
               onClick={toggleMobileMenu}
               className="lg:hidden"
               aria-label="Toggle mobile menu"
               aria-expanded={navigationState.mobileMenuOpen}
             >
               {navigationState.mobileMenuOpen ? (
                 <Icon icon={X} className="w-5 h-5" noGradient />
               ) : (
                 <Icon icon={Menu} className="w-5 h-5" noGradient />
               )}
             </Button>
          </div>
        </div>
      </div>

      {/* Mega Menu */}
      {navigationState.megaMenuOpen && navigationState.activeCategory && (
        <div
          ref={megaMenuRef}
          onMouseEnter={handleMegaMenuHover}
          onMouseLeave={handleMegaMenuLeave}
          className="absolute top-full left-0 w-full bg-white border-b border-neutral-200 shadow-soft z-40"
        >
          <MegaMenu
            category={filteredConfig.categories.find(c => c.id === navigationState.activeCategory)!}
            onItemClick={handlePageNavigation}
            userTier={userTier}
          />
        </div>
      )}

      {/* Mobile Menu */}
      {navigationState.mobileMenuOpen && (
        <MobileMegaMenu
          categories={filteredConfig.categories}
          onItemClick={handlePageNavigation}
          userTier={userTier}
          activePage={navigationState.activePage}
          onClose={() => setNavigationState(prev => ({ ...prev, mobileMenuOpen: false }))}
        />
      )}


    </nav>
  );
};