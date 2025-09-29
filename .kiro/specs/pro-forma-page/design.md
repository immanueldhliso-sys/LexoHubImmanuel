# Design Document

## Overview

The Pro Forma Page feature provides a comprehensive interface for managing preliminary invoices within the LexoHub ecosystem. This design builds upon the existing pro forma functionality mentioned in the LEXO Constitution and creates a dedicated page that integrates seamlessly with the current architecture while providing enhanced functionality for pro forma invoice management, conversion workflows, and analytics.

The design follows the established LexoHub patterns using the design system components, service layer architecture, and maintains consistency with the existing invoice management system while providing specialized functionality for pro forma workflows.

## Architecture

### Component Hierarchy

```
ProFormaPage (Page Component)
├── ProFormaHeader (Header with title and create button)
├── ProFormaInfoBanner (Educational information about pro formas)
├── ProFormaSummaryStats (Statistics cards)
├── ProFormaFilters (Search and filter controls)
├── ProFormaList (Main list component)
│   ├── ProFormaCard (Individual pro forma display)
│   └── EmptyState (When no pro formas exist)
├── ProFormaCreationModal (Modal for creating new pro formas)
├── ProFormaDetailsModal (Modal for viewing/editing details)
├── ConversionConfirmationModal (Modal for converting to final invoice)
└── ProFormaDeleteConfirmationModal (Modal for deletion confirmation)
```

### State Management

The page will use local React state with the following structure:

```typescript
interface ProFormaPageState {
  // Data
  proFormas: Invoice[];
  filteredProFormas: Invoice[];
  matters: Matter[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Modal States
  showCreationModal: boolean;
  showDetailsModal: boolean;
  showConversionModal: boolean;
  showDeleteModal: boolean;
  selectedProFormaId: string | null;
  
  // Filter State
  filters: {
    search: string;
    status: string;
    dateRange: { start: string; end: string } | null;
  };
  
  // Summary Statistics
  summaryStats: {
    totalCount: number;
    estimatedValue: number;
    currentMonthCount: number;
  };
}
```

### Service Integration

The page will integrate with the existing service layer:

- **InvoiceService**: For pro forma CRUD operations
- **MatterService**: For matter selection and validation
- **TimeEntryService**: For unbilled time entry retrieval

## Components and Interfaces

### 1. ProFormaPage (Main Page Component)

**Props**: None (page component)

**Responsibilities**:
- Manage overall page state
- Coordinate data fetching and updates
- Handle modal state management
- Provide context to child components

**Key Methods**:
```typescript
const fetchProFormas = useCallback(async () => {
  // Call InvoiceService.getInvoices({ status: ['PRO_FORMA'] })
});

const handleCreateProForma = useCallback((data: InvoiceGenerationRequest) => {
  // Call InvoiceService.generateInvoice({ ...data, isProForma: true })
});

const handleConvertToFinal = useCallback((proFormaId: string) => {
  // Call InvoiceService.convertProFormaToFinal(proFormaId)
});
```

### 2. ProFormaHeader Component

**Props**:
```typescript
interface ProFormaHeaderProps {
  onCreateClick: () => void;
}
```

**Design**: Uses design system Button with primary variant and Plus icon

### 3. ProFormaSummaryStats Component

**Props**:
```typescript
interface ProFormaSummaryStatsProps {
  stats: {
    totalCount: number;
    estimatedValue: number;
    currentMonthCount: number;
  };
  isLoading: boolean;
}
```

**Design**: Three Card components in a responsive grid layout using design system tokens

### 4. ProFormaFilters Component

**Props**:
```typescript
interface ProFormaFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}
```

**Design**: Uses design system Input components with debounced search functionality

### 5. ProFormaList Component

**Props**:
```typescript
interface ProFormaListProps {
  proFormas: Invoice[];
  isLoading: boolean;
  onViewDetails: (id: string) => void;
  onConvert: (id: string) => void;
  onDelete: (id: string) => void;
}
```

**Design**: Responsive card layout with hover effects and action buttons

### 6. ProFormaCard Component

**Props**:
```typescript
interface ProFormaCardProps {
  proForma: Invoice;
  onViewDetails: () => void;
  onConvert: () => void;
  onDelete: () => void;
}
```

**Design**: Card component with structured information display and action buttons

### 7. ProFormaCreationModal Component

**Props**:
```typescript
interface ProFormaCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InvoiceGenerationRequest) => void;
  matters: Matter[];
}
```

**Design**: Modal component with form for matter selection and time entry selection

### 8. ConversionConfirmationModal Component

**Props**:
```typescript
interface ConversionConfirmationModalProps {
  isOpen: boolean;
  proForma: Invoice | null;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}
```

**Design**: Simple confirmation modal with pro forma details and action buttons

## Data Models

### Extended Invoice Type for Pro Forma

The existing Invoice type from `src/types/index.ts` will be used with the following considerations:

- Status will use the existing InvoiceStatus enum
- Pro forma invoices will have status "PRO_FORMA" (needs to be added to enum)
- Additional fields for pro forma tracking:

```typescript
interface ProFormaInvoice extends Invoice {
  isProForma: boolean;
  convertedToFinalId?: string;
  conversionDate?: string;
  estimatedOnly: boolean; // Indicates this doesn't affect WIP
}
```

### Filter State Interface

```typescript
interface ProFormaFilters {
  search: string;
  status: 'all' | 'active' | 'converted' | 'expired';
  dateRange: {
    start: string;
    end: string;
  } | null;
}
```

### Summary Statistics Interface

```typescript
interface ProFormaSummaryStats {
  totalCount: number;
  estimatedValue: number;
  currentMonthCount: number;
  conversionRate: number;
  averageValue: number;
}
```

## Error Handling

### Error Boundaries
- Page-level error boundary for catastrophic failures
- Component-level error handling for API failures
- Graceful degradation for partial data loading failures

### Error States
- Network errors: Retry mechanism with exponential backoff
- Validation errors: Inline form validation with clear messaging
- Permission errors: Redirect to appropriate page with explanation
- Data inconsistency: Refresh data and show warning

### User Feedback
- Loading states: Design system LoadingSpinner component
- Success notifications: React Hot Toast with success styling
- Error notifications: React Hot Toast with error styling
- Empty states: Informative empty state components with call-to-action

## Testing Strategy

### Unit Testing
- Component rendering and prop handling
- State management logic
- Filter and search functionality
- Modal interactions

### Integration Testing
- Service layer integration
- Data flow between components
- Modal workflows (create, convert, delete)
- Filter and search integration

### End-to-End Testing
- Complete pro forma creation workflow
- Pro forma to final invoice conversion
- Search and filtering functionality
- Responsive design across devices

### Accessibility Testing
- Keyboard navigation through all interactive elements
- Screen reader compatibility
- Focus management in modals
- Color contrast validation
- ARIA label verification

## Performance Considerations

### Data Loading
- Implement pagination for large pro forma lists
- Use React Query for caching and background updates
- Debounced search to prevent excessive API calls
- Lazy loading for modal components

### Rendering Optimization
- React.memo for expensive components
- useMemo for computed values (filtered lists, statistics)
- useCallback for event handlers to prevent unnecessary re-renders
- Virtual scrolling for very large lists (if needed)

### Bundle Size
- Code splitting for modal components
- Tree shaking for unused utilities
- Optimize imports from design system

## Security Considerations

### Data Access
- Verify user permissions for pro forma access
- Validate matter ownership before allowing pro forma creation
- Sanitize search inputs to prevent injection attacks

### API Security
- CSRF protection for state-changing operations
- Rate limiting for search and filter operations
- Input validation on all form submissions

### Client-Side Security
- Secure storage of temporary form data
- XSS prevention in dynamic content rendering
- Secure handling of file uploads (if applicable)

## Responsive Design

### Breakpoints (following Tailwind defaults)
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Layout Adaptations
- **Mobile**: Single column layout, stacked cards, collapsible filters
- **Tablet**: Two-column grid for cards, side-by-side modals
- **Desktop**: Three-column grid, full-width modals, expanded details

### Touch Interactions
- Larger touch targets on mobile (minimum 44px)
- Swipe gestures for card actions on mobile
- Touch-friendly modal interactions

## Integration Points

### Existing Systems
- **Invoice Management**: Seamless conversion to final invoices
- **Matter Management**: Matter selection and validation
- **Time Entry System**: Unbilled time entry integration
- **Authentication**: User permission validation
- **Notification System**: Toast notifications for all actions

### External Services
- **Email Service**: Pro forma delivery (future enhancement)
- **PDF Generation**: Pro forma document creation
- **Audit Logging**: Track all pro forma operations

### Design System Integration
- Use only approved design system components
- Follow established color tokens and spacing
- Maintain consistent typography and iconography
- Implement proper focus states and accessibility features

## Future Enhancements

### Phase 2 Features
- Bulk operations (convert multiple pro formas)
- Advanced filtering and sorting options
- Export functionality (CSV, PDF)
- Pro forma templates and customization

### Phase 3 Features
- Automated pro forma generation based on time tracking
- Client approval workflow for pro formas
- Integration with external accounting systems
- Advanced analytics and reporting

### Performance Optimizations
- Server-side filtering and pagination
- Real-time updates via WebSocket
- Offline capability with sync
- Advanced caching strategies