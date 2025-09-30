import React, { useState, useRef, useEffect } from 'react';
import { Plus, Mic, FileText, FolderPlus, Brain, Receipt, Zap, Clock } from 'lucide-react';
import { QuickAction, QuickActionsState, UserTier } from '../../types';
import { Button, Icon } from '../../design-system/components';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

interface QuickActionsMenuProps {
  onAction: (actionId: string) => void;
  userTier: UserTier;
  className?: string;
}

const QuickActionsMenu: React.FC<QuickActionsMenuProps> = ({
  onAction,
  userTier,
  className = ''
}) => {
  const [state, setState] = useState<QuickActionsState>({
    isOpen: false,
    actions: [],
    customActions: [],
    defaultActions: []
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Default quick actions
  const defaultActions: QuickAction[] = [
    {
      id: 'voice-time-entry',
      label: 'Start Voice Time Entry',
      description: 'Record time using voice commands',
      icon: Mic,
      shortcut: 'Ctrl+Shift+V',
      page: undefined,
      action: () => onAction('voice-time-entry'),
      isNew: false,
      minTier: UserTier.ADVOCATE_PRO,
      usageCount: 0
    },
    {
      id: 'create-proforma',
      label: 'Create Pro Forma',
      description: 'Generate a new pro forma invoice',
      icon: FileText,
      shortcut: 'Ctrl+Shift+P',
      page: 'proforma',
      action: () => onAction('create-proforma'),
      isNew: false,
      minTier: UserTier.JUNIOR_START,
      usageCount: 0
    },
    {
      id: 'add-matter',
      label: 'Add New Matter',
      description: 'Create a new matter file',
      icon: FolderPlus,
      shortcut: 'Ctrl+Shift+M',
      page: undefined,
      action: () => onAction('add-matter'),
      isNew: false,
      minTier: UserTier.JUNIOR_START,
      usageCount: 0
    },
    {
      id: 'analyze-brief',
      label: 'Analyze Brief',
      description: 'AI-powered brief analysis',
      icon: Brain,
      shortcut: 'Ctrl+Shift+A',
      page: undefined,
      action: () => onAction('analyze-brief'),
      isNew: true,
      minTier: UserTier.ADVOCATE_PRO,
      usageCount: 0
    },
    {
      id: 'quick-invoice',
      label: 'Quick Invoice',
      description: 'Generate invoice from time entries',
      icon: Receipt,
      shortcut: 'Ctrl+Shift+I',
      page: undefined,
      action: () => onAction('quick-invoice'),
      isNew: false,
      minTier: UserTier.JUNIOR_START,
      usageCount: 0
    }
  ];

  // Filter actions based on user tier
  const getFilteredActions = () => {
    return defaultActions.filter(action => {
      const tierOrder = {
        [UserTier.JUNIOR_START]: 0,
        [UserTier.ADVOCATE_PRO]: 1,
        [UserTier.SENIOR_ADVOCATE]: 2,
        [UserTier.CHAMBERS_ENTERPRISE]: 3
      };
      
      return tierOrder[userTier] >= tierOrder[action.minTier || UserTier.JUNIOR_START];
    });
  };

  // Initialize actions on mount
  useEffect(() => {
    const filteredActions = getFilteredActions();
    setState(prev => ({
      ...prev,
      defaultActions: filteredActions,
      actions: filteredActions
    }));
  }, [userTier]);

  // Keyboard shortcuts for quick actions
  useKeyboardShortcuts([
    {
      key: 'n',
      ctrlKey: true,
      shiftKey: true,
      description: 'Open quick actions',
      action: () => toggleMenu()
    },
    {
      key: 'v',
      ctrlKey: true,
      shiftKey: true,
      description: 'Start voice time entry',
      action: () => handleActionClick('voice-time-entry')
    },
    {
      key: 'p',
      ctrlKey: true,
      shiftKey: true,
      description: 'Create pro forma',
      action: () => handleActionClick('create-proforma')
    },
    {
      key: 'm',
      ctrlKey: true,
      shiftKey: true,
      description: 'Add new matter',
      action: () => handleActionClick('add-matter')
    },
    {
      key: 'a',
      ctrlKey: true,
      shiftKey: true,
      description: 'Analyze brief',
      action: () => handleActionClick('analyze-brief')
    },
    {
      key: 'i',
      ctrlKey: true,
      shiftKey: true,
      description: 'Quick invoice',
      action: () => handleActionClick('quick-invoice')
    }
  ]);

  const toggleMenu = () => {
    setState(prev => ({ ...prev, isOpen: !prev.isOpen }));
  };

  const closeMenu = () => {
    setState(prev => ({ ...prev, isOpen: false }));
  };

  const handleActionClick = (actionId: string) => {
    const action = state.actions.find(a => a.id === actionId);
    if (action) {
      // Update usage count
      setState(prev => ({
        ...prev,
        actions: prev.actions.map(a => 
          a.id === actionId 
            ? { ...a, usageCount: (a.usageCount || 0) + 1, lastUsed: new Date().toISOString() }
            : a
        )
      }));

      // Execute action
      if (action.action) {
        action.action();
      } else if (action.page) {
        onAction(action.page);
      }
    }
    
    closeMenu();
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    };

    if (state.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [state.isOpen]);

  // Sort actions by usage count for better UX
  const sortedActions = [...state.actions].sort((a, b) => {
    const aUsage = a.usageCount || 0;
    const bUsage = b.usageCount || 0;
    return bUsage - aUsage;
  });

  return (
    <div className={`relative ${className}`}>
      {/* Quick Actions Button */}
      <Button
        ref={buttonRef}
        variant="primary"
        size="sm"
        onClick={toggleMenu}
        className="relative bg-judicial-blue-600 hover:bg-judicial-blue-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
        aria-label="Quick Actions (Ctrl+Shift+N)"
        aria-expanded={state.isOpen}
        aria-haspopup="menu"
        title="Quick Actions (Ctrl+Shift+N)"
      >
        <Icon icon={Plus} className={`h-4 w-4 transition-transform duration-200 ${state.isOpen ? 'rotate-45' : ''}`} noGradient />
      </Button>

      {/* Quick Actions Dropdown */}
      {state.isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full right-0 mt-2 w-80 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 overflow-hidden"
          role="menu"
          aria-label="Quick Actions Menu"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50">
            <div className="flex items-center gap-2">
              <Icon icon={Zap} className="h-4 w-4" />
              <h3 className="text-sm font-semibold text-neutral-900">Quick Actions</h3>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Boost your productivity with keyboard shortcuts
            </p>
          </div>

          {/* Actions List */}
          <div className="py-2 max-h-80 overflow-y-auto">
            {sortedActions.map((action, index) => {
              const IconComponent = action.icon;
              const isAccessible = !action.minTier || 
                Object.values(UserTier).indexOf(userTier) >= Object.values(UserTier).indexOf(action.minTier);

              return (
                <button
                  key={action.id}
                  onClick={() => handleActionClick(action.id)}
                  disabled={!isAccessible}
                  className={`w-full text-left px-4 py-3 hover:bg-neutral-50 transition-colors flex items-center gap-3 group ${
                    !isAccessible ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  role="menuitem"
                  tabIndex={state.isOpen ? 0 : -1}
                >
                  <div className={`p-2 rounded-lg ${
                    isAccessible 
                      ? 'bg-judicial-blue-50 group-hover:bg-judicial-blue-100' 
                      : 'bg-neutral-100'
                  }`}>
                    <Icon icon={IconComponent} className="h-4 w-4" noGradient={!isAccessible} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-900 truncate">
                        {action.label}
                      </span>
                      {action.isNew && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-mpondo-gold-100 text-mpondo-gold-800">
                          New
                        </span>
                      )}
                      {action.usageCount && action.usageCount > 0 && (
                        <div className="flex items-center gap-1 text-xs text-neutral-400">
                          <Icon icon={Clock} className="h-3 w-3" noGradient />
                          <span>{action.usageCount}</span>
                        </div>
                      )}
                    </div>
                    {action.description && (
                      <p className="text-xs text-neutral-500 truncate mt-0.5">
                        {action.description}
                      </p>
                    )}
                  </div>

                  {action.shortcut && isAccessible && (
                    <div className="text-xs text-neutral-400 font-mono bg-neutral-100 px-2 py-1 rounded">
                      {action.shortcut}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-neutral-100 bg-neutral-50">
            <p className="text-xs text-neutral-500">
              Press <kbd className="px-1 py-0.5 bg-white border border-neutral-200 rounded text-xs font-mono">Ctrl+Shift+N</kbd> to open this menu
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickActionsMenu;