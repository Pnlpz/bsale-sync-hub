# Diagnose System Status

## Current Error Analysis

**Error**: `Error fetching locatario store: Object`

This error indicates that the database migration hasn't been applied yet, or there's an issue with the database function. Here's how to diagnose and fix it:

## Step 1: Check Current Database State

### Run in Supabase SQL Editor:
```sql
-- 1. Check if new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('store_locatarios', 'store_providers');

-- Expected: Should return 2 rows if migration is applied
-- If empty: Migration not applied
```

```sql
-- 2. Check if functions exist
SELECT proname 
FROM pg_proc 
WHERE proname IN ('get_user_accessible_stores', 'get_locatario_store');

-- Expected: Should return 2 rows if migration is applied
-- If empty: Functions not created
```

```sql
-- 3. Check current user profile
SELECT id, user_id, name, email, role, store_id 
FROM public.profiles 
WHERE user_id = auth.uid();

-- This shows your current profile structure
```

## Step 2: Determine System State

### Scenario A: Migration Not Applied (Most Likely)
**Symptoms:**
- No `store_locatarios` or `store_providers` tables
- No `get_locatario_store` function
- User has `store_id` in profiles table

**Solution:**
1. Apply the database migration
2. Set up store-locatario relationships

### Scenario B: Migration Applied, No Store Assignment
**Symptoms:**
- New tables exist
- Functions exist
- User has no store assignment in `store_locatarios`

**Solution:**
1. Admin needs to assign store to locatario

### Scenario C: Partial Migration
**Symptoms:**
- Some new tables exist, some don't
- Some functions exist, some don't

**Solution:**
1. Re-run the complete migration

## Step 3: Apply the Fix

### Option 1: Apply Full Migration (Recommended)
```sql
-- Copy and paste the entire contents of:
-- supabase/migrations/20250813120000-correct-multi-tenant-system.sql
-- into Supabase SQL Editor and run it
```

### Option 2: Quick Fix for Testing (Temporary)
If you want to test the invitation system immediately without applying the full migration:

```sql
-- Create a simple version of the get_locatario_store function
CREATE OR REPLACE FUNCTION public.get_locatario_store(user_id UUID)
RETURNS TABLE(
  store_id UUID,
  store_name TEXT,
  store_address TEXT
) AS $$
BEGIN
  -- Simple fallback that uses the old structure
  RETURN QUERY
  SELECT s.id, s.name, s.address
  FROM public.stores s
  INNER JOIN public.profiles p ON s.id = p.store_id
  WHERE p.user_id = user_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Option 3: Use Fallback Mode
The updated code now includes fallback mechanisms that should work with the old database structure.

## Step 4: Test the Fix

### After applying any fix:
1. **Refresh the application** (hard refresh: Ctrl+F5)
2. **Login as locatario**
3. **Open browser console**
4. **Click "Invitar Proveedor"**
5. **Check console logs** for detailed information

### Expected Console Output (Success):
```
No store ID found, trying to fetch locatario store...
Store found via new_function: { store_id: "...", store_name: "...", ... }
```

### Expected Console Output (Fallback):
```
No store ID found, trying to fetch locatario store...
Store found via old_structure: { store_id: "...", store_name: "...", ... }
```

## Step 5: Verify System Status

### Run this diagnostic query:
```sql
-- Check system status
SELECT 
  'Tables' as component,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'store_locatarios') 
    THEN 'New tables exist' 
    ELSE 'Old structure' 
  END as status
UNION ALL
SELECT 
  'Functions' as component,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_locatario_store') 
    THEN 'New functions exist' 
    ELSE 'Functions missing' 
  END as status
UNION ALL
SELECT 
  'User Store' as component,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND store_id IS NOT NULL
    ) 
    THEN 'User has store (old structure)' 
    ELSE 'No store assignment' 
  END as status;
```

## Troubleshooting Common Issues

### Issue 1: "Function does not exist"
**Cause**: Migration not applied
**Fix**: Apply the database migration

### Issue 2: "No store assigned"
**Cause**: User doesn't have a store in either old or new structure
**Fix**: Admin needs to create and assign a store

### Issue 3: "Permission denied"
**Cause**: RLS policies blocking access
**Fix**: Check user role and RLS policies

### Issue 4: "Mixed migration state"
**Cause**: Partial migration applied
**Fix**: Re-run complete migration

## Quick Recovery Steps

### For Immediate Testing:
1. **Check if user has store_id in profiles**:
   ```sql
   SELECT store_id FROM public.profiles WHERE user_id = auth.uid();
   ```

2. **If no store_id, create a test store**:
   ```sql
   -- Create test store
   INSERT INTO public.stores (name, address) 
   VALUES ('Test Store', 'Test Address');
   
   -- Assign to current user
   UPDATE public.profiles 
   SET store_id = (SELECT id FROM public.stores WHERE name = 'Test Store')
   WHERE user_id = auth.uid();
   ```

3. **Test invitation system**

The updated code should now provide better error messages and fallback mechanisms to help diagnose the exact issue.
