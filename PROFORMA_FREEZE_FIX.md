# Pro Forma Request Freeze Fix

## Problem
The application freezes when trying to create a pro forma request at this log point:
```
Inserting pro forma request with the following data: {...}
```

## Root Cause
The Row Level Security (RLS) policy on the `pro_forma_requests` table was blocking INSERT operations. The existing policy:
```sql
CREATE POLICY "Advocates can manage their own pro_forma_requests"
ON pro_forma_requests FOR ALL
USING (auth.uid() = advocate_id);
```

This policy uses `USING` clause which only applies to SELECT/UPDATE/DELETE operations, not INSERT. For INSERT operations, you need a `WITH CHECK` clause.

## Solution
A new migration has been created: `20251002020000_fix_pro_forma_insert_policy.sql`

This migration:
1. Drops the overly broad `FOR ALL` policy
2. Creates separate policies for each operation (INSERT, SELECT, UPDATE, DELETE)
3. Uses proper `WITH CHECK` clause for INSERT operations
4. Uses subqueries to properly link `auth.uid()` with the advocates table

## How to Apply the Fix

### Option 1: Using Supabase CLI (Recommended)
```bash
cd supabase
supabase db reset
```

### Option 2: Manual Application
```bash
cd supabase
supabase db push
```

### Option 3: Direct SQL (If you have psql access)
Run the migration file directly:
```bash
psql your_database_url -f migrations/20251002020000_fix_pro_forma_insert_policy.sql
```

## Verification
After applying the migration, test the pro forma request creation:
1. Go to the Matters page
2. Click "Get Pro Forma Link"
3. Fill in the client details (or use the quick link option)
4. Click "Generate Link"
5. The link should generate successfully without freezing

## Technical Details
The new policy structure:
- **INSERT**: Checks that the inserting user's auth.uid() matches an advocate's ID
- **SELECT**: Allows advocates to view their own requests
- **UPDATE**: Allows advocates to update their own requests
- **DELETE**: Allows advocates to delete their own requests

This separation provides better security and clearer permissions management.
