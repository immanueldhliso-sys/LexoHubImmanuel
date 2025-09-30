import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ArrowRight, Star, Zap, Crown, Lock } from 'lucide-react';
import { Button } from '../../design-system/components';
import { getAccessibleNavigationItems } from '../../config/navigation.config';
import type { 
  NavigationCategory, 
  NavigationItem, 
  NavigationSection, 
  Page, 
  UserTier 
} from '../../types';

interface MobileMegaMenuProps {
  categories: NavigationCategory[];
  onItemClick: (page: Page) => void;
  userTier: UserTier;
  activePage: Page;
  onClose: () => void;
}

interface MobileCategoryProps {
  category: NavigationCategory;
  onItemClick: (page: Page) => void;
  userTier: UserTier;
  activePage: Page;
  isExpanded: boolean;
  onToggle: () => void;
}

interface MobileSectionProps {
  section: NavigationSection;
  onItemClick: (page: Page) => void;
  userTier: UserTier;
}

const getUserTierLevel = (tier: UserTier): number => {
  const levels = { junior_start: 1, junior_plus: 2, senior: 3, partner: 4 };
  return levels[tier] || 1;
};

// Mobile menu item component
const MobileMenuItem: React.FC<{
  item: NavigationItem;
  onItemClick: (page: Page) => void;
  userTier: UserTier;
}> = ({ item, onItemClick, userTier }) => {
  const Icon = item.icon;
  const isAccessible = !item.minTier || 
    (item.minTier && getUserTierLevel(userTier) >= getUserTierLevel(item.minTier));
  
  const handleClick = () => {
    if (isAccessible && item.page) {
      onItemClick(item.page);
    }
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg transition-colors min-h-[48px] ${
        isAccessible
          ? 'active:bg-neutral-100 cursor-pointer touch-manipulation'
          : 'opacity-60 cursor-not-allowed'
      }`}
      onClick={handleClick}
      role="menuitem"
      tabIndex={isAccessible ? 0 : -1}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
        isAccessible 
          ? 'bg-mpondo-gold-100 text-mpondo-gold-600' 
          : 'bg-neutral-100 text-neutral-400'
      }`}>
        {Icon ? <Icon className="w-4 h-4" /> : null}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className={`font-medium text-sm ${
              isAccessible ? 'text-neutral-900' : 'text-neutral-500'
            }`}>
              {item.label}
            </h4>
            
            {/* Badges */}
            <div className="flex items-center gap-1 mt-1">
              {item.isNew && (
                <span className="px-1.5 py-0.5 text-xs bg-status-success-100 text-status-success-800 rounded-full">
                  New
                </span>
              )}
              {item.badge && (
                <span className="px-1.5 py-0.5 text-xs bg-judicial-blue-100 text-judicial-blue-800 rounded-full">
                  {item.badge}
                </span>
              )}
              {item.isComingSoon && (
                <span className="px-1.5 py-0.5 text-xs bg-neutral-100 text-neutral-600 rounded-full">
                  Soon
                </span>
              )}
              {!isAccessible && (
                <Lock className="w-3 h-3 text-neutral-400" />
              )}
            </div>
          </div>
          
          {/* Arrow indicator */}
          {isAccessible && item.page && (
            <ArrowRight className="w-4 h-4 text-neutral-400 flex-shrink-0" />
          )}
        </div>
        
        {item.description && (
          <p className={`text-xs mt-1 line-clamp-2 ${
            isAccessible ? 'text-neutral-600' : 'text-neutral-400'
          }`}>
            {item.description}
          </p>
        )}
      </div>
    </div>
  );
};

// Mobile section component
const MobileSection: React.FC<MobileSectionProps> = ({ 
  section, 
  onItemClick, 
  userTier 
}) => {
  const accessibleItems = getAccessibleNavigationItems(section.items, userTier);
  
  if (accessibleItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-semibold text-judicial-blue-600 uppercase tracking-wider mb-2 px-3">
        {section.title}
      </h3>
      <div className="space-y-0.5">
        {section.items.map((item) => (
          <MobileMenuItem
            key={item.id}
            item={item}
            onItemClick={onItemClick}
            userTier={userTier}
          />
        ))}
      </div>
    </div>
  );
};

// Mobile category component with accordion behavior
const MobileCategory: React.FC<MobileCategoryProps> = ({
  category,
  onItemClick,
  userTier,
  activePage,
  isExpanded,
  onToggle
}) => {
  const Icon = category.icon;
  const isActive = activePage === category.page;
  const accessibleSections = category.sections.filter(section => 
    getAccessibleNavigationItems(section.items, userTier).length > 0
  );

  return (
    <div className="border-b border-neutral-100 last:border-b-0">
      {/* Category Header */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-4 text-left transition-colors min-h-[56px] ${
          isActive
            ? 'bg-mpondo-gold-50 text-mpondo-gold-900'
            : 'text-neutral-700 active:bg-neutral-50'
        }`}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5" />
          <span className="font-medium text-base">{category.label}</span>
        </div>
        <ChevronDown 
          className={`w-5 h-5 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="bg-neutral-50 px-2 py-3">
          {/* Quick access to main category page */}
          {category.page && (
            <div className="mb-4">
              <button
                onClick={() => onItemClick(category.page!)}
                className="w-full flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm active:bg-neutral-50 transition-colors min-h-[48px]"
              >
                <div className="w-8 h-8 bg-mpondo-gold-100 text-mpondo-gold-600 rounded-lg flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 text-left">
                  <span className="font-medium text-sm text-neutral-900">
                    View {category.label}
                  </span>
                  <p className="text-xs text-neutral-600">
                    {category.description || `Access all ${category.label.toLowerCase()} features`}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400" />
              </button>
            </div>
          )}

          {/* Sections */}
          <div className="space-y-4">
            {accessibleSections.map((section) => (
              <MobileSection
                key={section.id}
                section={section}
                onItemClick={onItemClick}
                userTier={userTier}
              />
            ))}

            {/* Featured Items */}
            {category.featured && category.featured.length > 0 && (
              <div className="bg-gradient-to-br from-mpondo-gold-50 to-judicial-blue-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-mpondo-gold-600" />
                  <h3 className="text-sm font-semibold text-neutral-900">Featured</h3>
                </div>
                <div className="space-y-1">
                  {getAccessibleNavigationItems(category.featured, userTier).map((item) => (
                    <MobileMenuItem
                      key={item.id}
                      item={item}
                      onItemClick={onItemClick}
                      userTier={userTier}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Main Mobile Mega Menu component
export const MobileMegaMenu: React.FC<MobileMegaMenuProps> = ({
  categories,
  onItemClick,
  userTier,
  activePage,
  onClose
}) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const handleCategoryToggle = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const handleItemClick = (page: Page) => {
    onItemClick(page);
    onClose();
  };

  return (
    <div className="lg:hidden bg-white border-b border-neutral-200 max-h-[80vh] overflow-y-auto">
      <div className="divide-y divide-neutral-100">
        {categories.map((category) => (
          <MobileCategory
            key={category.id}
            category={category}
            onItemClick={handleItemClick}
            userTier={userTier}
            activePage={activePage}
            isExpanded={expandedCategory === category.id}
            onToggle={() => handleCategoryToggle(category.id)}
          />
        ))}
      </div>
    </div>
  );
};