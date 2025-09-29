# Requirements Document

## Introduction

The Pro Forma Page feature provides advocates with a dedicated interface for creating, managing, and converting preliminary invoices for estimation purposes. This feature builds upon the existing pro forma invoice generation capabilities mentioned in the LEXO Constitution and creates a comprehensive user interface that allows advocates to manage pro forma invoices separately from final invoices, track estimated values, and convert pro formas to final invoices when appropriate.

## Requirements

### Requirement 1

**User Story:** As an advocate, I want to view all my pro forma invoices in a dedicated page, so that I can manage preliminary billing estimates separately from final invoices.

#### Acceptance Criteria

1. WHEN I navigate to the Pro Forma page THEN the system SHALL call InvoiceService.getInvoices() with status filter "PRO_FORMA" and display loading state
2. WHEN data loads successfully THEN the system SHALL calculate and display summary statistics (total count, sum of estimated values, current month count)
3. WHEN I view the pro forma list THEN the system SHALL display each pro forma in a Card component showing reference number, matter name, client name, estimated value (formatted as R###,###.##), creation date, and status badge
4. WHEN there are no pro formas THEN the system SHALL display empty state with illustration and "Create Your First Pro Forma" button
5. WHEN data loading fails THEN the system SHALL show error message with "Retry" button that re-calls the service method
6. WHEN I click refresh THEN the system SHALL re-fetch data and update all statistics and list items

### Requirement 2

**User Story:** As an advocate, I want to create new pro forma invoices from the dedicated page, so that I can generate preliminary billing estimates for clients.

#### Acceptance Criteria

1. WHEN I click the "Create Pro Forma" button THEN the system SHALL open a pro forma creation modal with matter selection dropdown
2. WHEN I select a matter THEN the system SHALL load and display all unbilled time entries for that matter
3. WHEN I select time entries THEN the system SHALL calculate estimated fees using the matter's pricing model and display running totals
4. WHEN I click "Generate Pro Forma" THEN the system SHALL validate required fields (matter, at least one time entry) and show validation errors if incomplete
5. WHEN validation passes THEN the system SHALL call InvoiceService.generateInvoice() with pro forma flag and display success notification
6. WHEN generation fails THEN the system SHALL display error message using React Hot Toast and keep modal open for retry
7. WHEN a pro forma is successfully created THEN the system SHALL close the modal, refresh the pro forma list, and update summary statistics

### Requirement 3

**User Story:** As an advocate, I want to convert pro forma invoices to final invoices, so that I can transition from estimation to actual billing.

#### Acceptance Criteria

1. WHEN I view a pro forma invoice THEN the system SHALL display a "Convert to Final" button with mpondo-gold styling
2. WHEN I click "Convert to Final" THEN the system SHALL open a confirmation modal showing pro forma details and estimated amount
3. WHEN I click "Confirm Conversion" THEN the system SHALL disable the button, show loading state, and call InvoiceService.convertProFormaToFinal()
4. WHEN conversion succeeds THEN the system SHALL update the pro forma status to "CONVERTED", show success notification, and refresh the list
5. WHEN conversion fails THEN the system SHALL re-enable the button, show error notification, and keep the pro forma in original state
6. WHEN a pro forma is converted THEN the system SHALL create audit log entry and update the matter's billing status
7. WHEN viewing a converted pro forma THEN the system SHALL show "Converted" status badge and link to the final invoice

### Requirement 4

**User Story:** As an advocate, I want to view detailed information about each pro forma invoice, so that I can review the estimation details before conversion or client presentation.

#### Acceptance Criteria

1. WHEN I click "View Details" on a pro forma THEN the system SHALL open a modal with comprehensive pro forma information loaded via InvoiceService.getInvoiceById()
2. WHEN the details modal loads THEN the system SHALL display matter information, itemized time entries with descriptions and rates, fee calculations, and estimated totals
3. WHEN viewing details THEN the system SHALL show creation date, current status badge, and last modified timestamp
4. WHEN I click "Edit Pro Forma" THEN the system SHALL open an editable version allowing time entry modifications and recalculation
5. WHEN I click "Delete Pro Forma" THEN the system SHALL show confirmation dialog and call InvoiceService.deleteInvoice() on confirmation
6. WHEN I click "Download PDF" THEN the system SHALL generate and download a PDF version of the pro forma for client presentation
7. WHEN any action fails THEN the system SHALL show appropriate error messages and maintain modal state for retry

### Requirement 5

**User Story:** As an advocate, I want to see visual indicators and statistics about my pro forma invoices, so that I can understand my practice's estimation patterns and conversion rates.

#### Acceptance Criteria

1. WHEN I view the Pro Forma page THEN the system SHALL display summary cards showing total count, estimated value, and current month statistics
2. WHEN displaying estimated values THEN the system SHALL use proper South African Rand formatting (R###,###.##)
3. WHEN showing pro forma status THEN the system SHALL use appropriate visual indicators (colors, icons) consistent with the design system
4. WHEN displaying dates THEN the system SHALL format dates according to South African locale standards (DD/MM/YYYY)

### Requirement 6

**User Story:** As an advocate, I want to search and filter my pro forma invoices, so that I can quickly find specific pro formas when managing multiple estimates.

#### Acceptance Criteria

1. WHEN I type in the search input THEN the system SHALL filter pro formas by matter name, client name, or reference number with debounced search (300ms delay)
2. WHEN I select a status filter THEN the system SHALL show only pro formas matching that status (All, Active, Converted, Expired)
3. WHEN I select a date range filter THEN the system SHALL show only pro formas created within that date range
4. WHEN I clear filters THEN the system SHALL reset to show all pro formas and clear all filter inputs
5. WHEN filters are applied THEN the system SHALL update the summary statistics to reflect only filtered results
6. WHEN no results match filters THEN the system SHALL show "No pro formas match your filters" message with clear filters button

### Requirement 7

**User Story:** As an advocate, I want the pro forma page to integrate seamlessly with the existing LexoHub interface, so that I have a consistent user experience across all features.

#### Acceptance Criteria

1. WHEN I access the Pro Forma page THEN the system SHALL use design system components (Button, Card, Modal, Input) as specified in the LEXO Constitution
2. WHEN displaying content THEN the system SHALL follow the established color scheme using mpondo-gold, judicial-blue, and status color tokens
3. WHEN handling errors THEN the system SHALL use React Hot Toast for user notifications
4. WHEN loading data THEN the system SHALL display appropriate loading states using the design system LoadingSpinner
5. WHEN the page is accessible THEN the system SHALL meet WCAG 2.1 AA standards with proper ARIA labels and keyboard navigation
6. WHEN using keyboard navigation THEN the system SHALL provide proper focus management and tab order for all interactive elements