# Loading States Pattern

## Overview

Loading states provide visual feedback during data fetching, form submissions, and other asynchronous operations. The Mpondo Design System uses a combination of skeletons, spinners, and progress indicators to maintain user engagement and set proper expectations.

## Loading State Types

### 1. Skeleton Loading
Used for initial page loads and content that has a predictable structure.

**When to use:**
- Dashboard cards loading
- Table data loading
- Profile information loading
- Any content with known layout

**Visual characteristics:**
- Animated shimmer effect
- Maintains layout structure
- Gray placeholder blocks
- Smooth animation loop

### 2. Spinner Loading
Used for actions and operations without predictable content structure.

**When to use:**
- Button actions
- Form submissions
- Search operations
- File uploads

**Visual characteristics:**
- Circular spinning animation
- Primary brand color
- Various sizes available
- Can include descriptive text

### 3. Progress Indicators
Used for operations with measurable progress.

**When to use:**
- File uploads
- Data imports
- Multi-step processes
- Long-running operations

**Visual characteristics:**
- Progress bar with percentage
- Step indicators for multi-step processes
- Time estimates when available
- Cancel/pause options when appropriate

## Visual Specifications

### Skeleton Animation
```css
@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

.skeleton {
  @apply bg-surface-tertiary;
  background-image: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  background-size: 200px 100%;
  background-repeat: no-repeat;
  animation: shimmer 1.5s infinite;
}
```

### Spinner Styles
```css
.spinner {
  @apply border-2 border-surface-border border-t-primary-500 rounded-full animate-spin;
}

.spinner-sm { @apply w-4 h-4; }
.spinner-md { @apply w-6 h-6; }
.spinner-lg { @apply w-8 h-8; }
.spinner-xl { @apply w-12 h-12; }
```

### Progress Bar
```css
.progress-bar {
  @apply w-full bg-surface-tertiary rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full bg-primary-500 transition-all duration-300 ease-out;
}
```

## Component Examples

### Skeleton Components

#### Dashboard Card Skeleton
```jsx
export const DashboardCardSkeleton = () => (
  <div className="bg-surface-primary border border-surface-border rounded-lg p-6">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="skeleton h-4 w-24 mb-2 rounded"></div>
        <div className="skeleton h-8 w-32 mb-2 rounded"></div>
        <div className="skeleton h-4 w-28 rounded"></div>
      </div>
      <div className="skeleton w-6 h-6 rounded"></div>
    </div>
  </div>
);
```

#### Table Skeleton
```jsx
export const TableSkeleton = ({ columns = 4, rows = 5 }) => (
  <div className="border border-surface-border rounded-lg overflow-hidden">
    {/* Header */}
    <div className="bg-surface-secondary border-b border-surface-border">
      <div className="flex">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="flex-1 p-4">
            <div className="skeleton h-4 w-20 rounded"></div>
          </div>
        ))}
      </div>
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="border-b border-surface-border last:border-b-0">
        <div className="flex">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="flex-1 p-4">
              <div className="skeleton h-4 w-full rounded"></div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);
```

#### Form Skeleton
```jsx
export const FormSkeleton = ({ fields = 3 }) => (
  <div className="space-y-6">
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="space-y-2">
        <div className="skeleton h-4 w-24 rounded"></div>
        <div className="skeleton h-10 w-full rounded-lg"></div>
      </div>
    ))}
    <div className="flex justify-end space-x-3">
      <div className="skeleton h-10 w-20 rounded-lg"></div>
      <div className="skeleton h-10 w-32 rounded-lg"></div>
    </div>
  </div>
);
```

### Spinner Components

#### Basic Spinner
```jsx
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <div
      className={cn(
        'border-2 border-surface-border border-t-primary-500 rounded-full animate-spin',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};
```

#### Loading Button
```jsx
interface LoadingButtonProps {
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  children,
  onClick,
  variant = 'primary',
  disabled = false,
}) => {
  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    secondary: 'bg-surface-primary hover:bg-surface-hover text-content-primary border border-surface-border',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'px-4 py-2 rounded-lg font-medium transition-colors duration-150 flex items-center space-x-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant]
      )}
    >
      {loading && <Spinner size="sm" />}
      <span>{children}</span>
    </button>
  );
};
```

### Progress Components

#### Progress Bar
```jsx
interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  label?: string;
  showPercentage?: boolean;
  variant?: 'primary' | 'success' | 'warning' | 'error';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercentage = true,
  variant = 'primary',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const variantClasses = {
    primary: 'bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
  };

  return (
    <div className="space-y-2">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center">
          {label && (
            <span className="text-sm font-medium text-content-primary">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm text-content-secondary">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className="w-full bg-surface-tertiary rounded-full h-2 overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-300 ease-out',
            variantClasses[variant]
          )}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
};
```

#### Step Progress
```jsx
interface Step {
  id: string;
  label: string;
  completed: boolean;
  current: boolean;
}

interface StepProgressProps {
  steps: Step[];
}

export const StepProgress: React.FC<StepProgressProps> = ({ steps }) => (
  <div className="flex items-center justify-between">
    {steps.map((step, index) => (
      <React.Fragment key={step.id}>
        <div className="flex flex-col items-center">
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
              step.completed
                ? 'bg-success-500 text-white'
                : step.current
                ? 'bg-primary-500 text-white'
                : 'bg-surface-tertiary text-content-secondary'
            )}
          >
            {step.completed ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              index + 1
            )}
          </div>
          <span
            className={cn(
              'mt-2 text-xs font-medium',
              step.current
                ? 'text-primary-600'
                : step.completed
                ? 'text-success-600'
                : 'text-content-secondary'
            )}
          >
            {step.label}
          </span>
        </div>
        
        {index < steps.length - 1 && (
          <div
            className={cn(
              'flex-1 h-0.5 mx-4',
              steps[index + 1].completed || step.completed
                ? 'bg-success-500'
                : 'bg-surface-tertiary'
            )}
          />
        )}
      </React.Fragment>
    ))}
  </div>
);
```

## Usage Guidelines

### When to Show Loading States

#### Immediate (0-100ms)
- No loading state needed
- Instant feedback expected

#### Brief (100ms-1s)
- Use spinners for buttons
- Show loading state on hover/click
- Keep existing content visible

#### Moderate (1-5s)
- Use skeletons for content areas
- Show progress indicators for uploads
- Provide cancel options

#### Extended (5s+)
- Always show progress indicators
- Provide time estimates
- Offer cancel/pause options
- Consider background processing

### Loading State Hierarchy

1. **Preserve Layout**: Use skeletons to maintain page structure
2. **Show Progress**: Use progress bars for measurable operations
3. **Indicate Activity**: Use spinners for indeterminate operations
4. **Provide Context**: Include descriptive text when helpful

### Accessibility Considerations

#### ARIA Attributes
```jsx
// For spinners
<div role="status" aria-label="Loading content">
  <Spinner />
  <span className="sr-only">Loading...</span>
</div>

// For progress bars
<div
  role="progressbar"
  aria-valuenow={value}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="Upload progress"
>
```

#### Screen Reader Support
- Announce loading states
- Provide meaningful labels
- Update progress announcements
- Announce completion

### Performance Considerations

#### Skeleton Loading
- Use CSS animations over JavaScript
- Limit number of animated elements
- Consider reduced motion preferences

#### Progress Updates
- Throttle progress updates (max 10 updates/second)
- Batch multiple progress changes
- Use requestAnimationFrame for smooth animations

## Implementation Examples

### Dashboard with Loading States
```jsx
export const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchDashboardData()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <DashboardCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {data.metrics.map((metric) => (
        <DashboardCard key={metric.id} {...metric} />
      ))}
    </div>
  );
};
```

### Form with Loading Button
```jsx
export const InvoiceForm = () => {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    try {
      await createInvoice(formData);
      // Handle success
    } catch (error) {
      // Handle error
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      
      <div className="flex justify-end space-x-3">
        <button type="button" className="px-4 py-2 text-content-secondary">
          Cancel
        </button>
        <LoadingButton loading={submitting} variant="primary">
          {submitting ? 'Creating Invoice...' : 'Create Invoice'}
        </LoadingButton>
      </div>
    </form>
  );
};
```

### File Upload with Progress
```jsx
export const FileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async (file) => {
    setUploading(true);
    setProgress(0);

    try {
      await uploadFile(file, (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setProgress(percentCompleted);
      });
      // Handle success
    } catch (error) {
      // Handle error
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        onChange={(e) => handleUpload(e.target.files[0])}
        disabled={uploading}
      />
      
      {uploading && (
        <ProgressBar
          value={progress}
          label="Uploading document..."
          showPercentage
        />
      )}
    </div>
  );
};
```