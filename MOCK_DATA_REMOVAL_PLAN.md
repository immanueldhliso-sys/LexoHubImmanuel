# Mock Data Removal Plan - LexoHub Application

**Document Version:** 1.0  
**Created:** 2025-10-02  
**Status:** Planning Phase  
**Owner:** Development Team

---

## Executive Summary

This document outlines a comprehensive, phased approach to systematically remove all mock data from the LexoHub application. The plan prioritizes pages based on business impact, implements changes in iterative phases with validation checkpoints, and ensures thorough testing before deployment.

**Timeline:** 4-6 weeks  
**Total Pages Affected:** 9 pages/components  
**Priority Level:** High

---

## 1. Mock Data Inventory

### 1.1 Critical Business Pages (High Impact)

#### **Dashboard Page** (`src/pages/DashboardPage.tsx`)
- **Mock Data:** Minor hardcoded values in performance metrics
  - Settlement rate (line 43, 592)
  - Average collection days fallback (line 133)
- **Dependencies:** Invoices API, Matters API
- **Users Affected:** All users (primary landing page)
- **Business Impact:** HIGH

#### **Reports Page** (`src/pages/ReportsPage.tsx`)
- **Mock Data:** Extensive static data
  - `mockMetrics` object (lines 86-109)
  - `mockCashFlowData` array (lines 111-118)
  - Performance efficiency metrics (lines 666-704)
- **Dependencies:** Invoices API, Matters API, Analytics API
- **Users Affected:** Finance managers, Practice managers
- **Business Impact:** HIGH

#### **Invoice Generation Modal** (`src/components/invoices/InvoiceGenerationModal.tsx`)
- **Mock Data:** 
  - `mockExpenses` array (lines 113-131)
- **Dependencies:** Expenses API (needs creation)
- **Users Affected:** All users generating invoices
- **Business Impact:** HIGH

### 1.2 Feature-Specific Pages (Medium Impact)

#### **Academy Page** (`src/pages/AcademyPage.tsx`)
- **Mock Data:**
  - `featuredCourses` array (lines 35-72)
  - `upcomingEvents` array (lines 74-102)
  - Learning progress stats (lines 26-33)
- **Dependencies:** Academy/Learning API (needs creation)
- **Users Affected:** Advocates using CPD features
- **Business Impact:** MEDIUM

#### **Practice Health Dashboard** (`src/components/dashboard/PracticeHealthDashboard.tsx`)
- **Mock Data:**
  - `mockMetrics` object for health scoring (line 68)
- **Dependencies:** Practice health metrics API
- **Users Affected:** Practice managers
- **Business Impact:** MEDIUM

### 1.3 Utility Components (Low-Medium Impact)

#### **Share Template Modal** (`src/components/matters/templates/ShareTemplateModal.tsx`)
- **Mock Data:**
  - `mockAdvocates` array (lines 50-98)
- **Dependencies:** Advocates API (exists, needs integration)
- **Users Affected:** Users sharing templates
- **Business Impact:** MEDIUM

#### **Fuzzy Search Hook** (`src/hooks/useFuzzySearch.ts`)
- **Mock Data:**
  - `mockMatters` array
  - `mockClients` array
  - `mockInvoices` array
  - `mockActions` array
- **Dependencies:** Global search API
- **Users Affected:** Users using command bar/search
- **Business Impact:** MEDIUM

#### **Document Intelligence Modals** 
- **Files:**
  - `src/components/document-intelligence/UploadPrecedentModal.tsx`
  - `src/components/document-intelligence/BriefAnalysisModal.tsx`
- **Mock Data:**
  - `mockDocumentId` placeholders
- **Dependencies:** Document service file upload
- **Users Affected:** Users uploading documents
- **Business Impact:** LOW

---

## 2. Business Impact Prioritization

### Priority Matrix

| Priority | Pages/Components | Business Impact | Technical Complexity | Users Affected |
|----------|-----------------|-----------------|---------------------|----------------|
| **P0 - Critical** | Dashboard, Reports, Invoice Generation | Revenue & Operations | Medium | All Users |
| **P1 - High** | Practice Health, Fuzzy Search | Decision Making | Medium-High | Power Users |
| **P2 - Medium** | Academy, Share Template | User Experience | Low-Medium | Feature Users |
| **P3 - Low** | Document Intelligence | Feature Enhancement | Low | Limited Users |

---

## 3. Implementation Phases

### Phase 1: Foundation & Critical Business (Weeks 1-2)

**Scope:** Dashboard & Reports Pages + Supporting APIs

**Objectives:**
- Remove mock data from primary business intelligence pages
- Implement missing API endpoints
- Establish testing framework

**Tasks:**

#### Week 1: API Development
1. **Create Analytics API Service**
   - `src/services/api/analytics.service.ts`
   - Endpoints:
     - `getCollectionMetrics()` - Collection rates, days, trends
     - `getPerformanceMetrics()` - Settlement rate, billing efficiency
     - `getCashFlowAnalysis()` - Monthly cash flow projections

2. **Enhance Reports API**
   - Add comprehensive financial reporting endpoints
   - Implement data aggregation functions
   - Add caching layer for performance

3. **Create Expenses API**
   - `src/services/api/expenses.service.ts`
   - Endpoints:
     - `getMatterExpenses(matterId)`
     - `createExpense(data)`
     - `updateExpense(id, data)`
     - `deleteExpense(id)`

#### Week 2: Integration & Testing
1. **Dashboard Page Updates**
   - Replace hardcoded settlement rate with API call
   - Update collection days calculation
   - Add error handling and loading states
   - **Files:** `src/pages/DashboardPage.tsx`

2. **Reports Page Updates**
   - Replace `mockMetrics` with Analytics API
   - Replace `mockCashFlowData` with real calculations
   - Replace efficiency metrics with API data
   - **Files:** `src/pages/ReportsPage.tsx`

3. **Invoice Generation Modal Updates**
   - Replace `mockExpenses` with Expenses API
   - Add expense CRUD operations
   - **Files:** `src/components/invoices/InvoiceGenerationModal.tsx`

**Validation Checkpoints:**
- [ ] All API endpoints return valid data
- [ ] Dashboard displays real-time metrics
- [ ] Reports show accurate financial data
- [ ] Invoice generation includes actual expenses
- [ ] Error states handled gracefully
- [ ] Loading indicators implemented

**Testing Procedures:**
- Unit tests for new API services
- Integration tests for page components
- E2E tests for critical user flows
- Performance testing for data loading
- Cross-browser compatibility testing

**Stakeholder Review:**
- Demo updated dashboard to product team
- Validate reports accuracy with finance team
- User acceptance testing with 3-5 beta users

---

### Phase 2: Search & Practice Intelligence (Week 3)

**Scope:** Fuzzy Search, Practice Health Dashboard

**Objectives:**
- Implement real-time search functionality
- Connect practice health metrics to actual data
- Improve user search experience

**Tasks:**

#### Week 3: API & Component Updates
1. **Create Global Search API**
   - `src/services/api/search.service.ts`
   - Implement full-text search across:
     - Matters
     - Clients (from matters)
     - Invoices
     - Documents
   - Add search indexing for performance
   - Implement fuzzy matching algorithm

2. **Update Fuzzy Search Hook**
   - Replace all mock arrays with API calls
   - Implement debouncing for search input
   - Add search result caching
   - **Files:** `src/hooks/useFuzzySearch.ts`

3. **Practice Health Metrics**
   - Use existing `get_practice_health_metrics` SQL function
   - Create service wrapper
   - Replace mock data in dashboard
   - **Files:** `src/components/dashboard/PracticeHealthDashboard.tsx`

**Validation Checkpoints:**
- [ ] Search returns relevant results within 500ms
- [ ] Search covers all entity types
- [ ] Practice health scores calculated correctly
- [ ] Health trends show accurate historical data
- [ ] No mock data references remain

**Testing Procedures:**
- Search performance benchmarking
- Fuzzy match accuracy testing
- Practice health calculation validation
- Load testing for concurrent searches

**Stakeholder Review:**
- Product team validates search quality
- Practice managers verify health metrics accuracy

---

### Phase 3: User Features (Week 4)

**Scope:** Academy Page, Template Sharing

**Objectives:**
- Enable learning management features
- Improve collaboration capabilities

**Tasks:**

#### Week 4: Feature APIs & Integration
1. **Create Academy/Learning API**
   - `src/services/api/academy.service.ts`
   - Endpoints:
     - `getCourses()` - Featured and all courses
     - `getUpcomingEvents()` - Learning events
     - `getLearningProgress(userId)` - User progress
     - `getCPDHours(userId)` - CPD tracking
     - `getShadowingSessions(userId)`
     - `getPeerReviews(userId)`

2. **Database Schema for Academy**
   - Create migration: `courses` table
   - Create migration: `learning_events` table
   - Create migration: `user_progress` table
   - Create migration: `cpd_tracking` table

3. **Academy Page Updates**
   - Replace `featuredCourses` with API
   - Replace `upcomingEvents` with API
   - Replace `learningProgress` with user-specific data
   - **Files:** `src/pages/AcademyPage.tsx`

4. **Template Sharing Updates**
   - Use existing Advocates API
   - Replace `mockAdvocates` with API call
   - Add advocate search functionality
   - **Files:** `src/components/matters/templates/ShareTemplateModal.tsx`

**Validation Checkpoints:**
- [ ] Academy displays real courses
- [ ] Events sync with calendar
- [ ] CPD hours tracked accurately
- [ ] Template sharing works with real advocates
- [ ] No performance degradation

**Testing Procedures:**
- Course enrollment flows
- Event registration testing
- Template sharing E2E tests
- CPD calculation validation

**Stakeholder Review:**
- Academy admin reviews course management
- Users test template sharing workflow

---

### Phase 4: Document Intelligence & Polish (Week 5)

**Scope:** Document Upload, Final Cleanup

**Objectives:**
- Complete document upload integration
- Remove all remaining mock data
- Final quality assurance

**Tasks:**

#### Week 5: Completion & Polish
1. **Document Upload Integration**
   - Implement actual file upload to storage
   - Generate real document IDs
   - **Files:** 
     - `src/components/document-intelligence/UploadPrecedentModal.tsx`
     - `src/components/document-intelligence/BriefAnalysisModal.tsx`

2. **Global Code Audit**
   - Search entire codebase for remaining mock data
   - Remove any leftover placeholders
   - Clean up commented mock code

3. **Performance Optimization**
   - Add caching where appropriate
   - Optimize database queries
   - Implement lazy loading for heavy components

4. **Documentation Updates**
   - Update API documentation
   - Create migration guides for users
   - Document new features

**Validation Checkpoints:**
- [ ] No instances of "mock" in production code
- [ ] All features use real data
- [ ] Performance benchmarks met
- [ ] Documentation complete

**Testing Procedures:**
- Full regression testing suite
- Performance testing under load
- Security audit of new endpoints
- Accessibility testing

**Stakeholder Review:**
- Executive demo of completed system
- Technical review with development team
- Sign-off from product owner

---

### Phase 5: Deployment & Monitoring (Week 6)

**Scope:** Production deployment, monitoring setup

**Objectives:**
- Deploy to production safely
- Monitor system health
- Quick rollback capability

**Tasks:**

#### Week 6: Deployment & Go-Live
1. **Pre-Deployment Checklist**
   - [ ] All tests passing
   - [ ] Database migrations tested
   - [ ] Rollback plan documented
   - [ ] Monitoring dashboards configured
   - [ ] Alert thresholds set

2. **Deployment Strategy**
   - **Stage 1:** Deploy to staging environment
   - **Stage 2:** 24-hour staging validation
   - **Stage 3:** Canary deployment (10% of users)
   - **Stage 4:** Monitor for 48 hours
   - **Stage 5:** Full deployment (100% of users)

3. **Post-Deployment Monitoring**
   - API response times
   - Error rates
   - Database query performance
   - User engagement metrics
   - Feature usage analytics

4. **User Communication**
   - Release notes preparation
   - User training materials
   - Support team briefing
   - Announcement email

**Validation Checkpoints:**
- [ ] Staging environment stable for 24 hours
- [ ] Canary deployment successful
- [ ] No critical errors in production
- [ ] User feedback positive
- [ ] Performance metrics within targets

---

## 4. Testing Procedures (Per Iteration)

### 4.1 Unit Testing
- Test all new API service methods
- Mock external dependencies
- Achieve >80% code coverage for new code
- **Tools:** Jest, React Testing Library

### 4.2 Integration Testing
- Test component + API integration
- Verify data flow from API to UI
- Test error handling and edge cases
- **Tools:** Jest, MSW (Mock Service Worker)

### 4.3 E2E Testing
- Critical user journeys:
  - User logs in → views dashboard → sees real data
  - User generates invoice → includes actual expenses
  - User searches → finds relevant results
  - User views reports → accurate financial data
- **Tools:** Playwright

### 4.4 Performance Testing
- Load time targets:
  - Dashboard: <2s
  - Reports: <3s
  - Search: <500ms
- Concurrent user testing
- Database query optimization
- **Tools:** Lighthouse, K6

### 4.5 Manual QA Testing
- Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- Test on mobile devices
- Accessibility testing (WCAG 2.1 AA)
- Usability testing with real users

---

## 5. Rollout Strategy with Monitoring

### 5.1 Deployment Approach

**Blue-Green Deployment:**
- Maintain two production environments
- Deploy to "green" environment first
- Test green environment thoroughly
- Switch traffic to green
- Keep blue as instant rollback option

### 5.2 Monitoring Plan

#### Application Monitoring
- **Metrics to Track:**
  - API response times (avg, p50, p95, p99)
  - Error rates by endpoint
  - Database connection pool usage
  - Memory and CPU utilization
  - Active user sessions

- **Tools:**
  - Application: Sentry for error tracking
  - Performance: New Relic / DataDog
  - Logs: CloudWatch / ELK Stack
  - Uptime: UptimeRobot / Pingdom

#### Business Metrics Monitoring
- **KPIs to Track:**
  - Dashboard load success rate
  - Report generation success rate
  - Invoice creation success rate
  - Search usage and success rate
  - Average session duration
  - Feature adoption rates

- **Alerts:**
  - Error rate >1% → Slack notification
  - API response time >3s → Email alert
  - Dashboard load failure → Page oncall
  - Database connection errors → Immediate escalation

### 5.3 Rollback Criteria

**Automatic Rollback Triggers:**
- Error rate exceeds 5% for 5 minutes
- Critical endpoint failure (>50% error rate)
- Database connection failure

**Manual Rollback Triggers:**
- User-reported data accuracy issues
- Performance degradation >50%
- Security vulnerabilities discovered
- Stakeholder decision

### 5.4 Post-Deployment Activities

**Day 1-3:**
- Monitor all metrics hourly
- Oncall engineer dedicated to deployment
- Daily standup to review metrics
- Collect user feedback

**Week 1:**
- Analyze performance trends
- Optimize slow queries
- Address user feedback
- Create summary report

**Week 2-4:**
- Monitor weekly
- Document lessons learned
- Plan next iterations
- Celebrate success

---

## 6. Final Verification Process

### 6.1 Pre-Production Verification

**Code Review Checklist:**
- [ ] No references to "mock" in production code
- [ ] All TODO comments addressed
- [ ] All console.log statements removed
- [ ] Error handling implemented for all APIs
- [ ] Loading states implemented
- [ ] Empty states designed and implemented

**Data Verification:**
- [ ] Database migrations successful
- [ ] Data integrity checks passed
- [ ] No orphaned records
- [ ] Referential integrity maintained

**Security Audit:**
- [ ] API authentication verified
- [ ] Authorization rules enforced
- [ ] Input validation implemented
- [ ] SQL injection protection verified
- [ ] XSS protection verified

### 6.2 Production Verification

**Smoke Tests (Post-Deployment):**
1. User can log in
2. Dashboard loads with real data
3. Reports generate successfully
4. Invoice creation works
5. Search returns results
6. All critical pages accessible

**Data Accuracy Verification:**
- Compare sample reports with source data
- Verify financial calculations manually
- Cross-reference dashboard metrics with database
- Validate search results accuracy

**Performance Verification:**
- All pages load within target times
- No memory leaks detected
- Database queries optimized
- Caching working correctly

### 6.3 User Acceptance Testing

**UAT Participants:**
- 2-3 practice managers
- 2-3 advocates
- 1 finance manager
- 1 admin user

**UAT Scenarios:**
1. Daily workflow: Check dashboard, review matters, create invoice
2. Weekly workflow: Generate reports, analyze financials
3. Monthly workflow: Review practice health, CPD progress
4. Ad-hoc: Search for information, share templates

**Success Criteria:**
- 100% of UAT scenarios pass
- User satisfaction score >4/5
- No critical bugs found
- Performance acceptable to users

---

## 7. Risk Mitigation

### 7.1 Identified Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|------------|--------|---------------------|
| API performance issues | Medium | High | Load testing, caching, query optimization |
| Data migration errors | Low | Critical | Thorough testing, rollback plan, backups |
| User resistance to changes | Medium | Medium | Training, communication, gradual rollout |
| Missing data scenarios | Medium | High | Graceful error handling, fallback UI |
| Third-party service downtime | Low | Medium | Retry logic, circuit breakers, monitoring |

### 7.2 Contingency Plans

**If deployment fails:**
1. Immediate rollback to previous version
2. Root cause analysis
3. Fix issues in staging
4. Repeat deployment process

**If data accuracy issues found:**
1. Document specific issues
2. Determine scope of impact
3. Create hotfix if critical
4. Schedule fix in next deployment

**If performance degrades:**
1. Identify bottleneck (API, DB, frontend)
2. Implement quick optimizations
3. Add caching if needed
4. Scale infrastructure if necessary

---

## 8. Success Metrics

### 8.1 Technical Metrics

- **Code Quality:**
  - 0 instances of mock data in production code
  - Test coverage >80% for new code
  - 0 critical security vulnerabilities

- **Performance:**
  - Dashboard load <2s (95th percentile)
  - API response time <500ms (avg)
  - Search results <500ms
  - Report generation <3s

- **Reliability:**
  - Uptime >99.9%
  - Error rate <0.5%
  - Zero data loss incidents

### 8.2 Business Metrics

- **User Adoption:**
  - All users transitioned to new system
  - Feature usage rates maintain or improve
  - User satisfaction >4/5

- **Operational Efficiency:**
  - Report generation time reduced by 50%
  - Data accuracy improved to >99%
  - Support tickets related to data issues reduced by 80%

### 8.3 Reporting

**Weekly Status Report Template:**
```
# Mock Data Removal - Week X Status

## Completed This Week
- [List of completed tasks]

## Metrics
- Pages updated: X/9
- Tests added: X
- Performance improvements: X%

## Blockers
- [List any blockers]

## Next Week Plan
- [Planned activities]

## Risks/Issues
- [Any new risks or issues]
```

---

## 9. Resource Requirements

### 9.1 Team

- **Backend Developer:** 2 developers x 6 weeks
- **Frontend Developer:** 2 developers x 6 weeks  
- **QA Engineer:** 1 engineer x 6 weeks
- **DevOps Engineer:** 0.5 FTE for deployment
- **Product Manager:** 0.25 FTE for coordination
- **UX Designer:** 0.5 FTE for loading/empty states

### 9.2 Infrastructure

- **Staging Environment:** Full production mirror
- **Testing Environment:** Separate for QA
- **Monitoring Tools:** Sentry, New Relic (or equivalent)
- **Load Testing:** K6 or similar

### 9.3 Timeline

**Total Duration:** 6 weeks
- Phase 1: Weeks 1-2
- Phase 2: Week 3
- Phase 3: Week 4
- Phase 4: Week 5
- Phase 5: Week 6

---

## 10. Appendices

### Appendix A: API Endpoints to Create

```typescript
// Analytics API
GET  /api/analytics/collection-metrics
GET  /api/analytics/performance-metrics
GET  /api/analytics/cash-flow-analysis

// Expenses API
GET    /api/expenses?matterId={id}
POST   /api/expenses
PUT    /api/expenses/{id}
DELETE /api/expenses/{id}

// Search API
GET /api/search?q={query}&type={type}

// Academy API
GET /api/academy/courses
GET /api/academy/events
GET /api/academy/progress/{userId}
GET /api/academy/cpd/{userId}
```

### Appendix B: Database Migrations

```sql
-- Create expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id UUID REFERENCES matters(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create academy tables
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  instructor TEXT,
  duration_hours DECIMAL(4,2),
  level TEXT,
  rating DECIMAL(3,2),
  cpd_credits DECIMAL(4,2),
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  event_type TEXT,
  event_date TIMESTAMPTZ,
  mentor TEXT,
  max_participants INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Appendix C: Test Case Templates

**Dashboard Test Cases:**
1. Verify dashboard loads with real data
2. Verify metrics calculations are accurate
3. Verify loading states display correctly
4. Verify error states handle gracefully
5. Verify refresh functionality works
6. Verify navigation to detail pages works

**Reports Test Cases:**
1. Verify financial metrics display correctly
2. Verify charts render with real data
3. Verify export functionality works
4. Verify date filtering works
5. Verify performance metrics accurate
6. Verify cash flow projections accurate

---

## Approval & Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | _______ | _______ | _____ |
| Tech Lead | _______ | _______ | _____ |
| QA Lead | _______ | _______ | _____ |
| DevOps Lead | _______ | _______ | _____ |

---

**Document Control:**
- Last Updated: 2025-10-02
- Next Review: Start of each phase
- Distribution: Development team, Product team, Stakeholders
