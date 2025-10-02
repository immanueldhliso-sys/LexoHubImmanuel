# Mock Data Removal - Next Steps Guide

**Quick Reference for Continuing Implementation**

---

## 🔥 Immediate Actions (Next 30 Minutes)

### 1. Fix TypeScript Compilation Errors

**File:** `src/pages/ReportsPage.tsx`

Run these find/replace operations in your editor:

| Find | Replace | Occurrences |
|------|---------|-------------|
| `date_paid` | `datePaid` | ~5 |
| `invoice_date` | `dateIssued` | ~4 |
| `due_date` | `dateDue` | ~2 |

**OR** manually update these lines:
- Line 154: `new Date(inv.due_date)` → `new Date(inv.dateDue)`
- Line 175: `inv.date_paid` → `inv.datePaid`
- Line 177: `new Date(inv.date_paid!)` → `new Date(inv.datePaid!)`
- Line 178: `new Date(inv.due_date)` → `new Date(inv.dateDue)`
- Line 187: Both occurrences
- Line 214: Both occurrences
- Line 250-251: Both lines

Also remove reference to `mockMetrics` at line 566 and replace with `performanceMetrics`.

---

### 2. Remove Unused Imports

**Files to clean:**
- `src/pages/ReportsPage.tsx` - Remove `Filter`, `Icon`, `PracticeMetrics`  
- `src/pages/DashboardPage.tsx` - Already cleaned ✅

---

### 3. Test Compilation

```bash
npm run build
# or
npm run type-check
```

**Expected result:** Zero TypeScript errors

---

## 📋 Today's Goals (4-6 hours)

### Goal 1: Complete Invoice Generation Modal

**File:** `src/components/invoices/InvoiceGenerationModal.tsx`

#### Step 1: Import Expenses Service (5 min)
```typescript
import { ExpensesService } from '@/services/api/expenses.service';
import type { Expense } from '@/services/api/expenses.service';
```

#### Step 2: Add State for Expenses (5 min)
```typescript
const [expenses, setExpenses] = useState<Expense[]>([]);
const [loadingExpenses, setLoadingExpenses] = useState(false);
const [showAddExpense, setShowAddExpense] = useState(false);
```

#### Step 3: Load Expenses When Matter Selected (15 min)
```typescript
useEffect(() => {
  if (selectedMatter?.id) {
    loadExpenses();
  }
}, [selectedMatter?.id]);

const loadExpenses = async () => {
  if (!selectedMatter?.id) return;
  setLoadingExpenses(true);
  try {
    const data = await ExpensesService.getMatterExpenses(selectedMatter.id);
    setExpenses(data);
  } catch (error) {
    console.error('Error loading expenses:', error);
    toast.error('Failed to load expenses');
  } finally {
    setLoadingExpenses(false);
  }
};
```

#### Step 4: Remove Mock Expenses (2 min)
Find and delete lines 113-131:
```typescript
// DELETE THIS:
const mockExpenses: Expense[] = [
  // ... mock data
];
```

#### Step 5: Create Expense Management UI (2-3 hours)
```typescript
// Add this section in the modal
<div className="mt-4">
  <div className="flex items-center justify-between mb-2">
    <h3 className="font-medium">Expenses</h3>
    <Button size="sm" onClick={() => setShowAddExpense(true)}>
      <Plus className="w-4 h-4 mr-2" />
      Add Expense
    </Button>
  </div>
  
  {loadingExpenses ? (
    <div className="text-center py-4">Loading...</div>
  ) : expenses.length > 0 ? (
    <div className="space-y-2">
      {expenses.map((expense) => (
        <div key={expense.id} className="flex items-center justify-between p-2 border rounded">
          <div>
            <div className="font-medium">{expense.description}</div>
            <div className="text-sm text-gray-600">
              {new Date(expense.date).toLocaleDateString()} • {expense.category}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">R{expense.amount.toLocaleString()}</span>
            <Button size="sm" variant="ghost" onClick={() => handleDeleteExpense(expense.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="text-center py-4 text-gray-500">No expenses added</div>
  )}
</div>
```

#### Step 6: Implement CRUD Functions (1 hour)
```typescript
const handleDeleteExpense = async (id: string) => {
  if (!confirm('Delete this expense?')) return;
  try {
    await ExpensesService.deleteExpense(id);
    setExpenses(prev => prev.filter(e => e.id !== id));
    toast.success('Expense deleted');
  } catch (error) {
    toast.error('Failed to delete expense');
  }
};

// Implement handleAddExpense, handleEditExpense similarly
```

#### Step 7: Update Invoice Generation (30 min)
Update the invoice generation to include the actual expenses total.

---

### Goal 2: Run Database Migration

```bash
# Navigate to project root
cd LexoHub

# If using Supabase CLI locally:
npx supabase migration up

# OR apply migration directly in Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Copy content from supabase/migrations/20250102020000_create_expenses_table.sql
# 3. Run the query
```

**Verify migration:**
```sql
-- In Supabase SQL Editor
SELECT * FROM expenses LIMIT 1;
-- Should return empty result but no error
```

---

### Goal 3: Manual Testing

#### Test Dashboard
1. Navigate to dashboard
2. Verify metrics load from API
3. Check for console errors
4. Verify settlement rate displays
5. Verify collection rate displays
6. Test refresh functionality

#### Test Reports
1. Navigate to reports page
2. Switch between tabs
3. Verify charts load with real data
4. Check console for errors
5. Test export functionality

#### Test Invoice Generation
1. Select a matter
2. Verify expenses load
3. Add a new expense
4. Generate invoice
5. Verify expense appears in invoice
6. Delete an expense
7. Regenerate invoice

---

## 🧪 Testing Checklist

### Unit Tests to Write

**File:** `src/services/api/__tests__/analytics.service.test.ts`
```typescript
describe('AnalyticsService', () => {
  describe('getCollectionMetrics', () => {
    it('should calculate collection rates correctly', async () => {
      // Mock supabase calls
      // Assert calculations
    });
    
    it('should handle empty invoice list', async () => {
      // Test edge case
    });
  });
  
  // More tests...
});
```

**File:** `src/services/api/__tests__/expenses.service.test.ts`
```typescript
describe('ExpensesService', () => {
  describe('createExpense', () => {
    it('should create expense with valid data', async () => {
      // Test creation
    });
    
    it('should validate amount > 0', async () => {
      // Test validation
    });
  });
  
  // More tests...
});
```

### Integration Tests

**File:** `src/pages/__tests__/DashboardPage.test.tsx`
```typescript
describe('DashboardPage', () => {
  it('should load real metrics from API', async () => {
    // Mock API calls
    // Render component
    // Assert data displayed
  });
  
  it('should handle API errors gracefully', async () => {
    // Mock API error
    // Assert error state
  });
});
```

---

## 📊 Progress Tracking

Update `MOCK_DATA_REMOVAL_TRACKER.md` after each task:

```markdown
### Dashboard Page Updates
**Status:** 🟢 Complete
**Completed:** 2025-10-02
**Actual Hours:** 3h
**Notes:** Successfully integrated Analytics API
```

---

## 🐛 Debugging Tips

### If metrics don't load:
1. Check browser console for errors
2. Verify Supabase connection
3. Check RLS policies allow data access
4. Verify user is authenticated

### If TypeScript errors persist:
1. Restart TypeScript server in IDE
2. Clear build cache: `rm -rf dist/ .next/`
3. Reinstall dependencies: `npm install`

### If tests fail:
1. Check mock data structure matches types
2. Verify async/await usage
3. Check test environment setup

---

## 🎯 End of Day Checklist

Before committing:
- [ ] All TypeScript errors resolved
- [ ] All linter warnings addressed
- [ ] Manual testing completed
- [ ] Progress tracker updated
- [ ] Code committed with clear message
- [ ] Database migration tested
- [ ] No console.log statements left
- [ ] Documentation updated

**Commit Message Template:**
```
feat(phase-1): Implement Analytics and Expenses APIs

- Created AnalyticsService with collection and performance metrics
- Created ExpensesService with full CRUD operations
- Updated Dashboard to use real Analytics data
- Updated Reports page to remove mock data
- Added database migration for expenses table
- Removed hardcoded values from Dashboard

Closes #[issue-number]
```

---

## 📞 Need Help?

### Common Issues & Solutions

**Issue:** "Cannot find module '@/lib/supabase'"  
**Solution:** Check tsconfig.json has correct path mapping

**Issue:** "RLS policy blocks my query"  
**Solution:** Verify user authentication and policy conditions

**Issue:** "Expenses not loading"  
**Solution:** Check matter_id matches and table exists

**Issue:** "Performance slow with many invoices"  
**Solution:** Add pagination, implement caching (Phase 4)

---

## 🚀 Quick Links

- [Main Plan](./MOCK_DATA_REMOVAL_PLAN.md)
- [Progress Tracker](./MOCK_DATA_REMOVAL_TRACKER.md)
- [Implementation Progress](./IMPLEMENTATION_PROGRESS.md)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Remember:** Commit often, test thoroughly, update tracker regularly!
