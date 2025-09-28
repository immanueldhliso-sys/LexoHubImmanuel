# Dashboard Card Component

## Overview

The Dashboard Card is a fundamental component for displaying key metrics, financial data, and practice insights. It features progressive disclosure on hover and supports various content types including metrics, charts, and quick actions.

## Anatomy

```
┌─────────────────────────────────────┐
│  [Icon]                    [Badge]  │  ← Header
│                                     │
│  Title                              │  ← Title
│  Value                              │  ← Primary Value
│  Change Indicator                   │  ← Change/Trend
│                                     │
│  ┌─────────────────────────────────┐ │
│  │     Hidden Content Area         │ │  ← Progressive Disclosure
│  │     (Revealed on Hover)         │ │
│  └─────────────────────────────────┘ │
│                                     │
│  [Action Button]                    │  ← Optional Action
└─────────────────────────────────────┘
```

## Props/Variants

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | - | Card title/metric name |
| `value` | `string \| number` | - | Primary value to display |
| `change` | `string` | - | Change indicator text |
| `changeType` | `'positive' \| 'negative' \| 'neutral'` | `'neutral'` | Type of change for styling |
| `icon` | `ReactNode` | - | Icon component |
| `trend` | `'up' \| 'down' \| 'stable'` | - | Trend direction |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Card size variant |
| `variant` | `'default' \| 'financial' \| 'risk'` | `'default'` | Visual variant |
| `badge` | `string` | - | Optional badge text |
| `badgeVariant` | `'success' \| 'warning' \| 'error'` | - | Badge color variant |
| `children` | `ReactNode` | - | Hidden content for progressive disclosure |
| `action` | `ReactNode` | - | Optional action button |
| `onClick` | `() => void` | - | Click handler |
| `className` | `string` | - | Additional CSS classes |

## State Specifications

### Default State
- Background: `bg-surface-primary`
- Border: `border-surface-border`
- Shadow: `shadow-sm`
- Padding: `p-6`
- Border radius: `rounded-lg`

### Hover State
- Border: `border-primary-300`
- Shadow: `shadow-md`
- Transform: `hover:-translate-y-0.5`
- Progressive disclosure content: `opacity-100`
- Transition: `transition-all duration-200 ease-in-out`

### Focus State (when clickable)
- Ring: `ring-2 ring-primary-500 ring-offset-2`
- Maintains hover styles

### Loading State
- Skeleton animation on value and change areas
- Icon replaced with loading spinner
- Progressive disclosure disabled

### Error State
- Border: `border-error-200`
- Background: `bg-error-50`
- Error icon displayed
- Error message in progressive disclosure area

## Accessibility

### ARIA Attributes
```jsx
<div
  role="article"
  aria-labelledby="card-title"
  aria-describedby="card-description"
  tabIndex={onClick ? 0 : -1}
  onKeyDown={handleKeyDown} // Enter/Space for activation
>
```

### Keyboard Navigation
- **Tab**: Focus the card (if clickable)
- **Enter/Space**: Activate click handler
- **Escape**: Remove focus

### Screen Reader Support
- Card title announced as heading
- Value and change information properly associated
- Progressive disclosure content announced when revealed

## Code Examples

### Basic Metric Card
```jsx
import { DashboardCard } from '@/components/ui/dashboard-card';
import { DollarSign, TrendingUp } from 'lucide-react';

<DashboardCard
  title="Work in Progress"
  value="R 247,850"
  change="+12.3% from last month"
  changeType="positive"
  trend="up"
  icon={<DollarSign className="w-6 h-6" />}
/>
```

### Financial Card with Progressive Disclosure
```jsx
<DashboardCard
  title="Outstanding Fees"
  value="R 89,240"
  change="-8.1% from last month"
  changeType="negative"
  trend="down"
  variant="financial"
  icon={<DollarSign className="w-6 h-6" />}
  badge="3 overdue"
  badgeVariant="warning"
>
  <div className="space-y-2 text-sm">
    <div className="flex justify-between">
      <span>0-30 days:</span>
      <span className="font-medium">R 45,120</span>
    </div>
    <div className="flex justify-between">
      <span>31-60 days:</span>
      <span className="font-medium">R 28,890</span>
    </div>
    <div className="flex justify-between text-warning-600">
      <span>60+ days:</span>
      <span className="font-medium">R 15,230</span>
    </div>
  </div>
</DashboardCard>
```

### Risk Alert Card
```jsx
<DashboardCard
  title="Risk Alerts"
  value="3"
  change="1 critical"
  changeType="negative"
  variant="risk"
  icon={<AlertTriangle className="w-6 h-6" />}
  badge="Critical"
  badgeVariant="error"
  onClick={() => navigateToRiskDashboard()}
>
  <div className="space-y-2">
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center">
        <div className="w-2 h-2 bg-error-500 rounded-full mr-2"></div>
        Overdue matter: State v. Johnson
      </span>
      <span className="text-error-600 font-medium">Critical</span>
    </div>
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center">
        <div className="w-2 h-2 bg-warning-500 rounded-full mr-2"></div>
        Missing documentation
      </span>
      <span className="text-warning-600 font-medium">Medium</span>
    </div>
  </div>
</DashboardCard>
```

### Small Size Variant
```jsx
<DashboardCard
  size="sm"
  title="Active Matters"
  value="23"
  change="2 new this week"
  changeType="positive"
  icon={<FileText className="w-5 h-5" />}
/>
```

## Implementation

### React Component
```jsx
import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface DashboardCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'financial' | 'risk';
  badge?: string;
  badgeVariant?: 'success' | 'warning' | 'error';
  children?: React.ReactNode;
  action?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  trend,
  size = 'md',
  variant = 'default',
  badge,
  badgeVariant,
  children,
  action,
  onClick,
  className,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const variantClasses = {
    default: '',
    financial: 'border-l-4 border-l-success-500',
    risk: 'border-l-4 border-l-error-500',
  };

  const changeTypeClasses = {
    positive: 'text-success-600',
    negative: 'text-error-600',
    neutral: 'text-content-secondary',
  };

  const badgeVariantClasses = {
    success: 'bg-success-100 text-success-700 border-success-200',
    warning: 'bg-warning-100 text-warning-700 border-warning-200',
    error: 'bg-error-100 text-error-700 border-error-200',
  };

  return (
    <div
      className={cn(
        'bg-surface-primary border border-surface-border rounded-lg transition-all duration-200 ease-in-out cursor-pointer hover:border-primary-300 hover:shadow-md hover:-translate-y-0.5',
        sizeClasses[size],
        variantClasses[variant],
        onClick && 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      role={onClick ? 'button' : 'article'}
      tabIndex={onClick ? 0 : -1}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-content-secondary">{title}</p>
            {badge && (
              <span
                className={cn(
                  'px-2 py-1 text-xs font-medium rounded-full border',
                  badgeVariant && badgeVariantClasses[badgeVariant]
                )}
              >
                {badge}
              </span>
            )}
          </div>
          <p className="text-2xl font-semibold text-content-primary mb-2">{value}</p>
          {change && (
            <div className="flex items-center space-x-2">
              <span className={cn('text-sm font-medium', changeTypeClasses[changeType])}>
                {change}
              </span>
              {trend && (
                <TrendingUp
                  className={cn(
                    'w-4 h-4 transition-transform duration-200',
                    trend === 'up' ? 'text-success-600 rotate-0' : 
                    trend === 'down' ? 'text-error-600 rotate-180' : 'text-content-secondary'
                  )}
                />
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="text-primary-500 ml-4">
            {icon}
          </div>
        )}
      </div>

      {children && (
        <div
          className={cn(
            'mt-4 transition-all duration-200',
            isHovered ? 'opacity-100 max-h-none' : 'opacity-0 max-h-0 overflow-hidden'
          )}
        >
          {children}
        </div>
      )}

      {action && (
        <div className="mt-4 pt-4 border-t border-surface-border">
          {action}
        </div>
      )}
    </div>
  );
};
```

### CSS Classes
```css
.mpondo-dashboard-card {
  @apply bg-surface-primary border border-surface-border rounded-lg transition-all duration-200 ease-in-out;
  @apply hover:border-primary-300 hover:shadow-md hover:-translate-y-0.5;
}

.mpondo-dashboard-card-reveal {
  @apply opacity-0 max-h-0 overflow-hidden transition-all duration-200;
}

.mpondo-dashboard-card:hover .mpondo-dashboard-card-reveal {
  @apply opacity-100 max-h-none;
}
```