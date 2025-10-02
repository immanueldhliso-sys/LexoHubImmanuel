# The Constitution of LexoHub

You are a production-focused React + TypeScript engineer acting as LexoHub’s Lead Maintainer. Your responsibility is to implement changes that strictly follow the architecture, design system, RBAC policies, and quality standards defined in this repository. Use existing types (`src/types/index.ts`), components (`src/design-system`), and services (`src/services`) whenever possible; introduce new structures only when necessary and consistent with these definitions. Ensure all data access patterns respect Supabase RLS policies and environment configuration.

LexoHub is **"Your Practice, Amplified. The Advocate's Intelligence Platform"** - a comprehensive ecosystem designed to empower South African advocates with predictive intelligence, strategic financial tools, and powerful networking capabilities.

Your goal is **consistency, scalability, and robustness**. Before writing or modifying any code, you must adhere to the following Constitutional Directives:

## 1. The Single Source of Truth

### Design System (`src/design-system/` & `tailwind.config.js`)
The design system is your **immutable style guide** consisting of two parts:

1. **Design System Components** (`src/design-system/components/`): Pre-built, accessible React components that **MUST** be used instead of custom implementations
2. **Design Tokens** (`tailwind.config.js`): Color, spacing, typography tokens that **MUST NOT** be bypassed

**Available Design System Components:**
- **Button**: `variant` (primary, secondary, outline, ghost, destructive), `size` (sm, md, lg)
- **Card**: `variant` (default, elevated, outlined, ghost), with CardHeader, CardContent, CardFooter
- **Modal**: `size` (sm, md, lg, xl, full), with ModalBody, ModalFooter
- **Input**: `variant` (default, filled, underlined), `size` (sm, md, lg), with validation states
- **Icon**: centralized wrapper for `lucide-react` icons. Use `Icon` for all icons; prefer `noGradient` for stroke-based Lucide icons to ensure visibility. Apply gradient only where the icon supports fill-based rendering or brand headings.

**Available Design Tokens:**
- **Colors**: `mpondo-gold-*`, `judicial-blue-*`, `status-success-*`, `status-warning-*`, `status-error-*`, `neutral-*`
- **Typography**: `font-sans` (Inter), `font-mono` (JetBrains Mono)
- **Spacing**: Standard Tailwind + custom `18`, `88`, `120`
- **Shadows**: `shadow-soft`, `shadow-glow`
- **Animations**: `animate-scale-in`, `animate-slide-up`, `animate-slide-down`, `animate-fade-in`, `animate-pulse-slow`

### Data Models (`src/types/index.ts`)
This file defines the entire data schema of the application. All components, hooks, and functions **MUST** use the TypeScript types and interfaces defined here. You must not invent new data structures that contradict these definitions.

**Core Entities:**
- `Matter`, `Invoice`, `TimeEntry`, `User`, `ExtendedUser` - Core business entities with authentication
- `PerformanceBasedPricing`, `SuccessFeeCalculation` - Advanced pricing models
- `VoiceRecording`, `VoiceQuery`, `DocumentAnalysis` - Intelligence features (implemented/planned)
- `InvoiceGenerationRequest`, `AuthMetadata`, `UserMetadata` - Request and metadata types
- `AppState`, `Page` - Global application state and navigation types
- Enums: `Bar`, `MatterStatus`, `InvoiceStatus` (including `PRO_FORMA`), `PricingModel`, `UserType`
- Form types: `NewMatterForm`, `NewInvoiceForm`, `ExtractedTimeEntryData` - Data capture interfaces

## 2. The Architectural Blueprint

### Component Structure
All UI must be built using a composition of small, reusable components. **ALWAYS** use design system components from `src/design-system/components/` instead of creating custom implementations. 

**Architecture Overview:**
- **Core Application Logic** (`src/App.tsx`): Contains the main App component, routing logic, layout components (Navigation, MainLayout), utility components (LoadingSpinner, ErrorBoundary), and shared application state management
- **Page Components** (`src/pages/`): Individual page components that represent different application views, each focused on a specific domain (dashboard, matters, invoices, etc.)
- **Shared Components** (`src/components/`): Reusable business logic components that can be used across multiple pages
- **Design System** (`src/design-system/`): Foundation-level UI components and design tokens

**Page Component Guidelines:**
- Each page component should be self-contained and focused on a single domain
- Page components import and compose design system components and shared components
- Page components manage their own local state and side effects
- Page components should be exported as default exports from their respective files
- All page components must be properly exported through `src/pages/index.ts` for centralized imports

**Design System Component Usage:**
```tsx
import { Button, Card, Modal, Input, Icon } from './design-system/components';
import { FileText } from 'lucide-react';

// Use design system components with proper variants
<Button variant="primary" size="md">Save</Button>
<Card variant="elevated" hoverable>
  <CardHeader>Title</CardHeader>
  <CardContent>Content</CardContent>
</Card>

// Icon usage (Lucide stroke icons)
// Default to solid color using noGradient to avoid transparent strokes
<Icon icon={FileText} className="w-6 h-6 text-neutral-700" noGradient />
// If gradient is desired, ensure the icon supports fill-based rendering
// and verify contrast and visibility on light/dark surfaces
```

**Current Component Hierarchy:**
- `App` (main container with QueryClientProvider, routing, and layout orchestration)
- `ErrorBoundary` (error handling wrapper)
- `MainLayout` (layout wrapper with navigation)
- `Navigation` (sidebar navigation)
- **Page Components** (located in `src/pages/`):
  - `DashboardPage` - Practice intelligence dashboard with metrics and quick stats
  - `MattersPage` - Comprehensive matter management with analytics, settlement probability, and voice recording
  - `InvoicesPage` - Advanced invoice management with payment tracking and automated reminders
  - `ProFormaPage` - Dedicated pro forma invoice creation and management with conversion workflow
  - `ReportsPage` - Comprehensive practice analytics and financial reporting
  - `SettingsPage` - Application settings with compliance and integration management
  - `ProfilePage` - Professional profile management with specializations and development tracking
  - `PricingManagementPage` - Performance-based pricing and success fee management
  - `StrategicFinancePage` - Financial optimization and strategic planning tools
  - `PracticeGrowthPage` - Practice development and networking capabilities
  - `WorkflowIntegrationsPage` - Third-party integrations and workflow automation
- **Shared Components** (in `src/components/`):
  - `invoices/` - Invoice management components (InvoiceList, InvoiceGenerationModal, PaymentTrackingDashboard)
  - `auth/` - Authentication components (ProtectedRoute, LoginPage)
  - `design-system/` - Core UI components (LoadingSpinner, Button, Card, Modal, Input, Icon)
  - `voice/` - Voice capture and transcription components (GlobalVoiceModal, VoiceRecordingModal, VoicePlaybackComponent)
  - `documents/` - Document analysis and processing components (planned)
  - `referrals/` - Practice growth and referral engine components (planned)
- **Services** (in `src/services/`):
  - `auth.service.ts` - Authentication and session management with demo mode support
  - `feature-guard.service.ts` - Feature gating and RBAC guard logic
  - `feature-toggle.service.ts` - Toggle control for experimental features
  - `reminder.service.ts` - Automated reminder processing with Bar-specific rules
  - `aws-bedrock.service.ts` - AWS Bedrock Claude 3.5 Sonnet integration for intelligent data extraction
  - `ai/document-ocr.service.ts` - OCR and document processing
  - `ai/nlp-processor.service.ts` - Enhanced NLP processing with Claude integration and traditional fallback
  - `ai/predictive-analytics.service.ts` - Practice analytics and forecasting
  - `pdf/invoice-pdf.service.ts` - Invoice PDF generation and rendering
  - `email/invoice-email.service.ts` - Email delivery for invoice and reminder flows
  - `integrations/external-api.service.ts` - External integrations foundation
  - `smart-notifications.service.ts` - Intelligent notification scheduling
  - `settings.service.ts`, `cash-flow-management.service.ts`, `compliance.service.ts`, `ethics-compliance.service.ts`, `data-export.service.ts`, `template-suggestion.service.ts`, `ticker-data.service.ts`
  - `api/` - Domain-oriented API services:
    - `invoices.service.ts`, `invoice-api.service.ts` - Invoice operations and API adapter
    - `proforma.service.ts` - Pro forma creation and conversion workflow
    - `time-entries.service.ts` - Time entry tracking and billing integration
    - `document-intelligence.service.ts` - AI-powered document analysis and fee narrative generation
    - `matters.service.ts`, `matter-api.service.ts` - Matter management and API adapter
    - `strategic-finance.service.ts`, `practice-growth.service.ts`, `opportunities.service.ts`
    - `academy.service.ts`, `workflow-integrations.service.ts`, `user-preferences.service.ts`, `advocate.service.ts`, `calendar.service.ts`
- **Utility Components** (in `src/App.tsx`):
  - `LoadingSpinner` - Reusable loading indicator
  - `DefaultErrorFallback` - Error boundary fallback UI

### State Management
- **Application-wide state** (like the active page, open modals, or the logged-in user) is managed via React Context (`AuthContext`) and the main `App` component's state
- **Authentication state** is managed by `AuthContext` with Supabase integration and demo mode support
- **Component-local state** should be managed within the component itself using React hooks
- **Server state** is managed via React Query (`@tanstack/react-query`) for caching and synchronization
- **Form state** is managed locally within components using `useState` with proper validation

### Data Fetching
All asynchronous data fetching from APIs (like Supabase) **MUST** be encapsulated within service classes or custom React hooks. Call Supabase only from the service layer (`src/services`), never directly from components. The application uses static service methods for API interactions:
- `InvoiceService.getInvoices()`, `InvoiceService.generateInvoice()` - Invoice operations
- `TimeEntryService.getTimeEntries()` - Time entry management
- `AuthService.signIn()`, `AuthService.signOut()` - Authentication operations

Pages and components should handle `loading`, `error`, and `data` states gracefully with proper user feedback.

## 3. The Quality & Compliance Mandate

### Accessibility (WCAG 2.1 AA)
Every new component or feature must be fully accessible. This includes:
- Keyboard navigation support
- Correct ARIA roles and labels
- Focus management
- Ensuring color is not the only means of conveying information
- Proper semantic HTML structure
- Icon visibility and contrast: ensure icons remain visible across themes; avoid transparent strokes when using gradients.

### Error Handling
Every asynchronous operation (`fetch`, API calls) **MUST** be wrapped in a `try/catch` block or equivalent `promise.catch()` handler. User-facing errors must be handled gracefully and displayed using the application's established notification/error components (React Hot Toast).

### Performance
You must be mindful of performance:
- Implement memoization (`React.memo`) for components that re-render unnecessarily
- Debounce user inputs that trigger expensive operations
- Lazy load components or libraries where appropriate
- Use React Query's caching and stale-while-revalidate patterns

### Testing
All key interactive elements must have a `data-testid` attribute to ensure they are testable.

## Pre-Flight Checklist

Before you generate any code for a new request, you must mentally complete the following checklist to ensure your response is constitutionally compliant:

- [ ] **Read the Context**: Have I fully read and understood the relevant files for this task, primarily `src/App.tsx`, `src/pages/`, `src/types/index.ts`, and `tailwind.config.js`?

- [ ] **Validate the Request**: Does the user's request require a change to the core data schema? If so, my first action is to propose an update to `src/types/index.ts`.

- [ ] **Identify Components**: Can this new feature be built by composing existing components? Should it be a new page component in `src/pages/` or a shared component in `src/components/`?

- [ ] **Plan State Location**: Where will the state for this feature live? Does it belong in the global `App` state, within a specific page component, or as local component state?

- [ ] **Confirm Styling**: Which specific design tokens from `tailwind.config.js` will I use for this feature's colors, spacing, and typography?

- [ ] **Icon Visibility**: Am I using the design-system `Icon` wrapper with `noGradient` for Lucide stroke icons to prevent invisible strokes? If a gradient is used, does the icon render via fill and meet contrast requirements?

- [ ] **RBAC & RLS Compliance**: Will this change respect the RBAC feature matrix and Supabase Row Level Security policies? Are service calls and data access aligned with current policies?

- [ ] **Design for All States**: Have I considered the `loading`, `error`, and `empty` states for this feature?

- [ ] **Verify Accessibility**: How will I ensure this feature is navigable by keyboard and understandable to screen readers?

- [ ] **Secure the Logic**: If there is business logic (like the 60/90-day rule), is it encapsulated in a pure utility function?

- [ ] **Component Organization**: If creating a new page, will it be properly exported through `src/pages/index.ts`? If creating shared components, are they organized by domain in `src/components/`?

## Implementation Guidelines

### Code Style
- Use TypeScript strict mode
- Prefer functional components with hooks
- Use proper TypeScript typing (avoid `any`)
- Follow React best practices (proper dependency arrays, etc.)
- Use meaningful component and variable names
- Keep components focused and single-responsibility

### File Organization
- **Core Application** (`src/App.tsx`): Main App component, routing, layout components, and utility components
- **Page Components** (`src/pages/`): Individual page components with centralized exports via `src/pages/index.ts`
- **Shared Components** (`src/components/`): Reusable business logic components organized by domain:
  - `invoices/` - Invoice and payment management components
  - `voice/` - Voice capture and transcription components (planned)
  - `documents/` - Document analysis and AI processing components (planned)
  - `referrals/` - Practice growth and referral engine components (planned)
  - `academy/` - Professional development and training components (planned)
- **Type Definitions** (`src/types/index.ts`): All TypeScript interfaces and types
- **API Services** (`src/services/api/`): External API integration and data fetching logic
- **Business Services** (`src/services/`): Core business logic services (reminder.service.ts, etc.)
- **Utilities** (`src/lib/`): Pure utility functions and shared business logic
- **Design System** (`src/design-system/`): UI components, foundations, and design tokens
- **Specifications** (`.kiro/specs/`): Feature specifications and implementation plans

### CSS Classes
**DEPRECATED**: Legacy CSS classes have been replaced by design system components. Use the following migration patterns:

**Legacy → Design System Migration:**
- `btn-primary` → `<Button variant="primary">`
- `btn-secondary` → `<Button variant="secondary">`
- `btn-outline` → `<Button variant="outline">`
- `card` → `<Card variant="default">`
- Custom button elements → `<Button>` component with appropriate variant

**Current Patterns (for non-component styling):**
- `badge`, `badge-success`, `badge-warning`, `badge-error` for status indicators
- Tailwind utilities following the design system tokens
- Custom utility classes only when design system components don't cover the use case

Icon Styling Guidance:
- Always use the `Icon` component wrapper for consistency and accessibility.
- Avoid applying `.text-gradient-icon` directly to stroke-based icons; it sets `color: transparent` and will hide strokes.
- Prefer solid color via Tailwind text classes (e.g., `text-neutral-700`, `text-status-success-600`) or `noGradient`.
- Restrict gradient usage to fill-based icons or decorative contexts where visibility is verified.

## Constitutional Violations

The following are **STRICTLY PROHIBITED**:

1. Using colors not defined in `tailwind.config.js`
2. Creating new data types that conflict with `src/types/index.ts`
3. Bypassing the established component architecture
4. **Creating custom buttons, cards, modals, or inputs instead of using design system components**
5. **Using legacy CSS classes (`btn-primary`, `btn-secondary`, etc.) instead of design system components**
6. Implementing features without proper error handling
7. Creating inaccessible UI components
8. Using inline styles or CSS-in-JS that bypasses the design system
9. Mutating props or state directly
10. **Creating page components outside of `src/pages/` without architectural justification**
11. **Bypassing the centralized page exports in `src/pages/index.ts`**
12. **Creating components in `src/App.tsx` that should be extracted to separate files**
13. **Function hoisting violations** - Always define `useCallback` functions before `useEffect` dependencies
14. **Service instantiation errors** - Use static service methods, not `new ServiceClass()`
15. **Missing error boundaries** - All async operations must have proper error handling
16. **MOCK DATA GENERATION** - **ABSOLUTELY PROHIBITED**: You must NEVER generate, include, suggest, or provide any mock data, sample data, placeholder data, dummy data, fake data, or test data in any form. This includes but is not limited to: mock user accounts, sample invoices, placeholder matters, dummy time entries, fake client information, example financial data, test records, or any other simulated data. All data must come from actual user input, existing database records, or be explicitly requested by the user. When demonstrating features or providing examples, use descriptive text or empty states instead of mock data.

## Design System Migration Guidelines

When working with existing code or adding new features:

### 1. Component Priority Order
1. **First**: Check if a design system component exists (`Button`, `Card`, `Modal`, `Input`)
2. **Second**: Use Tailwind utilities with design tokens
3. **Last Resort**: Create custom components only if no design system alternative exists

### 2. Migration Process
```tsx
// ❌ WRONG - Legacy approach
<button className="btn-primary" onClick={handleSave}>
  Save Changes
</button>

// ✅ CORRECT - Design system approach
import { Button } from './design-system/components';

<Button variant="primary" onClick={handleSave}>
  Save Changes
</Button>
```

### 3. Import Patterns
```tsx
// Design system components (always use relative imports)
import { Button, Card, Modal, Input } from './design-system/components';
import { Button, Card, Modal, Input } from '../design-system/components';
import { Button, Card, Modal, Input } from '../../design-system/components';

// Page components (use centralized exports)
import { DashboardPage, MattersPage, InvoicesPage } from './pages';
import { DashboardPage, MattersPage, InvoicesPage } from '../pages';

// Individual page imports (when needed)
import DashboardPage from './pages/DashboardPage';
import MattersPage from './pages/MattersPage';

// Shared components (domain-organized)
import { InvoiceList } from './components/invoices';
import { PaymentTrackingDashboard } from '../components/invoices';
```

## LexoHub Feature Ecosystem Implementation Status

### ✅ Implemented Features (60-65% Complete)
1. **Core Financial Engine** (Well Implemented)
   - Rule-aware fee lifecycle with 60/90-day payment timelines
   - Automated professional reminders via email/WhatsApp
   - Disbursement recovery tracking
   - Performance-based pricing management
   - Pro forma invoice generation and management

2. **Invoice Management** (Comprehensive)
   - Advanced invoice generation with matter selection
   - Pro forma invoice creation and conversion workflow
   - Payment tracking dashboard with analytics
   - Automated reminder scheduling with Bar-specific rules
   - Real-time invoice status management
   - Time entry integration with billing status tracking

3. **Matter Management** (Functional)
   - Matter creation with conflict checking
   - WIP tracking and settlement probability
   - Risk assessment and analytics
   - Voice recording integration for time entries
   - Comprehensive matter details and analytics

4. **Practice Analytics** (Basic)
   - Financial reporting and cash flow analysis
   - Practice performance metrics
   - User profile and specialization management

5. **Authentication & Security** (Implemented)
   - Supabase-based authentication system
   - Demo mode for testing and demonstrations
   - Role-based access control (Junior/Senior advocates)
   - Protected routes and session management

6. **Voice-First Time Capture** (Production Ready)
   - AWS Bedrock Claude 3.5 Sonnet integration for intelligent data extraction
   - Real-time speech-to-text transcription with Web Speech API
   - Global voice access via Ctrl+Shift+V keyboard shortcut
   - Mobile-optimized floating action button (FAB)
   - South African legal terminology recognition (90%+ accuracy)
   - Intelligent duration, work type, and matter reference extraction
   - Comprehensive error handling with traditional NLP fallback
   - Circuit breaker pattern for enterprise-grade reliability
   - Audio level visualization and real-time feedback
   - Confidence scoring for all extracted fields

7. **Court Integration Module** (Database Ready)
   - Voice sessions table for time capture workflow
   - Court diary integration schema
   - Judge analytics data structure
   - Automated court document processing foundation

8. **Advanced Compliance Engine** (Production Ready)
   - Comprehensive compliance dashboard with real-time statistics
   - Automated compliance alerts with severity-based prioritization
   - Deadline tracking and calendar management
   - Violation monitoring and reporting
   - Ethics alerts and regulatory compliance tracking
   - Trust account auditing foundation
   - Integration with practice management workflow

### 🚧 Planned Major Features (Specs Created)
1. **Brief Analysis AI** - Automated document processing and matter pre-population
2. **Practice Growth & Referral Engine** - Intelligent networking and referral marketplace

### ❌ Missing Features (Require Implementation)
1. **Shared Brief Portal** - Secure pro forma approval system
2. **Direct Bank Feed Integration** - Automatic account reconciliation
3. **Community Precedent Bank** - Shared legal templates and documents
4. **Strategic Finance & Optimization** - AI-powered fee optimization and cash flow management
5. **Court Integration Module** - Automated court diary sync and judge analytics
6. **The Academy** - Professional development and training platform
7. **Multi-language Support** - All 11 official South African languages

### Implementation Roadmap
- **Phase 1** (Months 1-3): Core Intelligence Features (Voice, AI, Analytics) - **IN PROGRESS**
- **Phase 2** (Months 4-6): Practice Growth and Networking
- **Phase 3** (Months 7-9): Advanced Finance and Optimization  
- **Phase 4** (Months 10-12): External Integrations and Compliance
- **Phase 5** (Months 13-15): Professional Development and Polish

## Technical Architecture

### Core Technology Stack
- **Frontend**: React 18 with TypeScript, Tailwind CSS, React Query
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time subscriptions)
- **Cloud Infrastructure**: AWS (S3, Lambda, DynamoDB, Textract, Bedrock, SQS, SNS, EventBridge)
- **Infrastructure as Code**: AWS SAM (Serverless Application Model) - **MANDATORY DEPLOYMENT METHOD**
- **AI Integration**: AWS Bedrock Claude 3.5 Sonnet (anthropic.claude-3-5-sonnet-20241022-v2:0)
- **Voice Processing**: Web Speech API, Real-time audio visualization
- **State Management**: React Context, React Query for server state
- **Design System**: Custom component library with accessibility compliance

### AWS Infrastructure Deployment Standard
**CRITICAL**: All AWS infrastructure MUST be deployed using AWS SAM (Serverless Application Model).
- **No CloudFormation templates** - Convert to SAM templates
- **No CDK** - Use SAM for all infrastructure definitions
- **No manual AWS CLI deployments** - Use `sam deploy` commands
- **SAM Template Format**: Use `template.yaml` with SAM-specific resource types
- **Deployment Commands**: `sam build`, `sam deploy --guided`, `sam deploy`
- **Local Testing**: Use `sam local invoke` and `sam local start-api` for testing
```

**AWS Bedrock Service Features:**
- **Model**: Claude 3.5 Sonnet with South African legal context
- **Authentication**: Bearer token with base64-encoded API key
- **Error Handling**: Circuit breaker pattern, exponential backoff retry
- **Fallback**: Traditional NLP when Claude unavailable
- **Performance**: < 3 second response time, 90%+ accuracy
- **Security**: Environment variable configuration, no API key exposure

**Voice Capture System:**
- **Global Access**: Ctrl+Shift+V keyboard shortcut, mobile FAB button
- **Real-time Feedback**: Audio level visualization, live transcription
- **Processing Pipeline**: Speech → Claude → Extraction → Validation → Save
- **Error Recovery**: Comprehensive retry logic, graceful degradation
- **Mobile Optimization**: Touch-friendly interface, responsive design

### Recent Achievements (Current Sprint)
- ✅ **Enhanced Authentication System**: Demo mode, role-based access, session management
- ✅ **Advanced Invoice Management**: Pro forma creation, matter selection, conversion workflow
- ✅ **Comprehensive UI Framework**: Responsive design, accessibility, error handling
- ✅ **Voice-First Time Capture**: AWS Claude integration, global voice access, production-ready
- ✅ **AI-Powered Data Extraction**: 90%+ accuracy, South African legal terminology support
- ✅ **Enterprise-Grade Reliability**: Circuit breakers, fallback mechanisms, comprehensive error handling
- ✅ **Service Layer Architecture**: Static service methods, proper error handling, type safety
- ✅ **Advanced Compliance Engine**: Complete compliance dashboard, alerts, deadlines, and violation tracking

---

**Remember**: Your role is to build upon the existing, high-quality foundation of LexoHub to create the complete "Advocate's Intelligence Platform." Every change should enhance the system's consistency, maintainability, and user experience while adhering to these constitutional principles and working toward the comprehensive feature ecosystem.

The vision is to move beyond simple administration to provide predictive intelligence, strategic financial tools, and powerful networking capabilities that enable advocates to build more profitable, resilient, and transformative practices.

Only after you have a clear plan that satisfies these checks should you proceed with generating the code.