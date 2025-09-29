# Implementation Plan

- [x] 1. Update type definitions and service layer for pro forma support


  - Add PRO_FORMA status to InvoiceStatus enum in src/types/index.ts
  - Create ProFormaFilters and ProFormaSummaryStats interfaces
  - Add convertProFormaToFinal method to InvoiceService
  - _Requirements: 1.1, 2.3, 3.3_



- [ ] 2. Create core pro forma page component structure
  - [ ] 2.1 Create ProFormaPage main component with state management
    - Implement React state for pro formas, filters, modals, and loading states
    - Add useEffect hooks for data fetching and cleanup

    - Create event handlers for modal management and data operations
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 2.2 Implement ProFormaHeader component
    - Create header component with title, description, and create button

    - Use design system Button component with primary variant and Plus icon
    - Implement proper accessibility attributes and keyboard navigation
    - _Requirements: 2.1, 7.1, 7.5_

  - [ ] 2.3 Build ProFormaSummaryStats component
    - Create three Card components displaying total count, estimated value, and current month statistics

    - Implement proper South African Rand formatting using formatRand utility
    - Add loading states and skeleton components for better UX
    - _Requirements: 5.1, 5.2, 7.4_

- [ ] 3. Implement pro forma list and filtering functionality
  - [x] 3.1 Create ProFormaFilters component

    - Build search input with debounced functionality (300ms delay)
    - Implement status filter dropdown with All, Active, Converted, Expired options
    - Add date range picker for filtering by creation date
    - Create clear filters functionality
    - _Requirements: 6.1, 6.2, 6.3, 6.4_


  - [ ] 3.2 Build ProFormaList and ProFormaCard components
    - Create responsive card layout displaying pro forma information
    - Implement proper visual indicators for status using design system colors
    - Add hover effects and action buttons (View Details, Convert, Delete)
    - Create empty state component with call-to-action
    - _Requirements: 1.3, 1.4, 5.3, 7.1_


  - [ ] 3.3 Implement filtering and search logic
    - Create filter functions for search, status, and date range
    - Update summary statistics to reflect filtered results
    - Implement "No results match your filters" state with clear filters option
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.6_


- [ ] 4. Create pro forma creation modal and workflow
  - [ ] 4.1 Build ProFormaCreationModal component
    - Create Modal component with matter selection dropdown
    - Implement time entry selection with checkboxes and running totals
    - Add form validation for required fields (matter, at least one time entry)
    - Display estimated fee calculations in real-time


    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 4.2 Implement pro forma generation logic
    - Integrate with InvoiceService.generateInvoice with isProForma flag
    - Handle validation errors and display inline error messages

    - Show loading states during generation process
    - Display success notifications and refresh data on completion
    - _Requirements: 2.5, 2.6, 2.7_

- [ ] 5. Build pro forma details and conversion functionality
  - [ ] 5.1 Create ProFormaDetailsModal component
    - Display comprehensive pro forma information including matter details, time entries, and calculations
    - Show creation date, status badge, and last modified timestamp

    - Implement Edit, Delete, and Download PDF action buttons
    - Add proper loading states when fetching detailed information
    - _Requirements: 4.1, 4.2, 4.3, 4.6, 4.7_

  - [x] 5.2 Implement conversion to final invoice workflow

    - Create ConversionConfirmationModal with pro forma details and estimated amount
    - Add conversion logic calling InvoiceService.convertProFormaToFinal
    - Implement proper loading states and disable buttons during conversion
    - Handle success and error states with appropriate notifications
    - Update pro forma status and refresh list after successful conversion
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_


- [ ] 6. Add pro forma management operations
  - [ ] 6.1 Implement pro forma editing functionality
    - Create editable version of details modal allowing time entry modifications
    - Implement real-time fee recalculation when time entries are modified
    - Add form validation and error handling for edit operations

    - _Requirements: 4.4, 4.7_

  - [ ] 6.2 Build pro forma deletion workflow
    - Create ProFormaDeleteConfirmationModal with confirmation dialog
    - Implement deletion logic calling InvoiceService.deleteInvoice
    - Add proper error handling and success notifications

    - Refresh pro forma list after successful deletion
    - _Requirements: 4.5, 4.7_

- [ ] 7. Implement data fetching and service integration
  - [ ] 7.1 Add pro forma data fetching logic
    - Implement fetchProFormas function calling InvoiceService.getInvoices with PRO_FORMA status filter

    - Add proper error handling with retry mechanism
    - Implement loading states and error display
    - _Requirements: 1.1, 1.5_

  - [ ] 7.2 Create summary statistics calculation
    - Implement calculateSummaryStats function for total count, estimated value, and current month count

    - Update statistics when filters are applied
    - Add proper number formatting for South African locale
    - _Requirements: 5.1, 5.2, 6.5_

- [ ] 8. Add accessibility and responsive design features
  - [x] 8.1 Implement accessibility features

    - Add proper ARIA labels and roles to all interactive elements
    - Implement keyboard navigation for all components
    - Ensure proper focus management in modals
    - Add screen reader support for dynamic content updates
    - _Requirements: 7.5, 7.6_


  - [ ] 8.2 Ensure responsive design implementation
    - Test and adjust layout for mobile, tablet, and desktop breakpoints
    - Implement touch-friendly interactions for mobile devices
    - Ensure proper modal sizing across different screen sizes
    - _Requirements: 7.1, 7.2_



- [ ] 9. Add error handling and loading states
  - [ ] 9.1 Implement comprehensive error handling
    - Add try-catch blocks for all async operations
    - Create user-friendly error messages using React Hot Toast
    - Implement retry mechanisms for failed operations
    - Add graceful degradation for partial failures
    - _Requirements: 1.5, 2.6, 3.5, 4.7, 7.3_

  - [ ] 9.2 Add proper loading states throughout the application
    - Use design system LoadingSpinner for data loading
    - Implement skeleton loading for cards and lists
    - Add button loading states during form submissions
    - _Requirements: 7.4_

- [ ] 10. Integration testing and final polish
  - [ ] 10.1 Test complete pro forma workflows
    - Test pro forma creation from matter selection to generation
    - Verify conversion to final invoice workflow
    - Test search and filtering functionality
    - Validate all error scenarios and edge cases
    - _Requirements: All requirements_

  - [ ] 10.2 Ensure design system compliance and polish
    - Verify all components use design system components correctly
    - Check color usage against design tokens
    - Ensure consistent spacing and typography
    - Test accessibility compliance with WCAG 2.1 AA standards
    - _Requirements: 7.1, 7.2, 7.3, 7.5_