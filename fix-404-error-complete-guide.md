# Fix 404 Error - Complete Guide

## Current Issue
**Error**: `Failed to load resource: the server responded with a status of 404 ()`
**Context**: When trying to invite a provider, the system fails to fetch the locatario's store

## Root Cause
The 404 error occurs because:
1. **Database migration not applied** → New functions don't exist
2. **User has no store assignment** → No store_id in profiles table
3. **Missing database relationships** → Store-user connections not established

## Immediate Fix (5 minutes)

### Step 1: Check Current State
Run this in **Supabase SQL Editor**:
```sql
-- Check your current profile
SELECT id, user_id, name, email, role, store_id
FROM public.profiles 
WHERE user_id = auth.uid();
```

### Step 2: Quick Store Assignment
If the query above shows `store_id` is `null`, run:
```sql
-- Check available stores
SELECT id, name, address FROM public.stores LIMIT 5;

-- If stores exist, assign the first one to your user
UPDATE public.profiles 
SET store_id = (SELECT id FROM public.stores LIMIT 1)
WHERE user_id = auth.uid() AND store_id IS NULL;
```

### Step 3: Create Store if None Exist
If no stores exist, create one:
```sql
-- Create a test store
INSERT INTO public.stores (name, address)
VALUES ('Mi Tienda Test', 'Dirección de prueba');

-- Assign it to your user
UPDATE public.profiles 
SET store_id = (SELECT id FROM public.stores WHERE name = 'Mi Tienda Test')
WHERE user_id = auth.uid();
```

### Step 4: Verify Fix
```sql
-- Verify the assignment worked
SELECT 
  p.name as user_name,
  p.role,
  s.name as store_name,
  s.address
FROM public.profiles p
LEFT JOIN public.stores s ON p.store_id = s.id
WHERE p.user_id = auth.uid();
```

## Test the Fix

### After running the SQL:
1. **Refresh the application** (Ctrl+F5)
2. **Login as locatario**
3. **Click "Invitar Proveedor"**
4. **Check browser console** for success messages

### Expected Console Output:
```
No store ID found, trying to fetch locatario store...
Store found via old_structure: { store_id: "...", store_name: "Mi Tienda Test", ... }
```

### Expected UI Behavior:
- ✅ **Dialog opens** without 404 errors
- ✅ **Store name displays** in blue info box
- ✅ **Invitation can be sent** successfully

## Long-term Solution (Proper Migration)

### Option 1: Apply Full Migration
1. **Copy contents** of `supabase/migrations/20250813120000-correct-multi-tenant-system.sql`
2. **Run in Supabase SQL Editor**
3. **Set up proper store-locatario relationships**

### Option 2: Admin-Controlled Setup
1. **Create admin interface** for store management
2. **Implement proper user-store assignments**
3. **Configure API settings per store**

## Troubleshooting Different Scenarios

### Scenario A: No Stores Exist
**Symptoms**: Query returns empty result
**Fix**: Create a test store using the SQL above

### Scenario B: User Has No Profile
**Symptoms**: Profile query returns no rows
**Fix**: Check user authentication and profile creation

### Scenario C: Stores Exist But User Can't Access
**Symptoms**: RLS policy blocks access
**Fix**: Check user role and RLS policies

### Scenario D: 404 Persists After Fix
**Symptoms**: Still getting 404 errors
**Fix**: Check network tab for exact failing request

## Verification Checklist

After applying the fix, verify:
- ✅ **User has store_id** in profiles table
- ✅ **Store exists** and is accessible
- ✅ **No 404 errors** in browser console
- ✅ **Invitation dialog** shows store name
- ✅ **Migration checker** reports correct status

## Console Debugging

### Enable Detailed Logging:
1. **Open browser console**
2. **Look for these messages**:
   ```
   No store ID found, trying to fetch locatario store...
   Store found via old_structure: {...}
   Migration status: {...}
   ```

### Common Error Messages:
- `"Function does not exist"` → Migration not applied
- `"No store assigned"` → User needs store assignment
- `"Permission denied"` → RLS policy issue
- `"404 error"` → Database function missing

## Quick Recovery Commands

### Reset User Store Assignment:
```sql
-- Remove current assignment
UPDATE public.profiles SET store_id = NULL WHERE user_id = auth.uid();

-- Assign to specific store
UPDATE public.profiles 
SET store_id = 'your-store-id-here'
WHERE user_id = auth.uid();
```

### Create Emergency Store:
```sql
-- Create emergency store for testing
INSERT INTO public.stores (name, address) 
VALUES ('Emergency Store', 'Emergency Address');

-- Assign to current user
UPDATE public.profiles 
SET store_id = (SELECT id FROM public.stores WHERE name = 'Emergency Store')
WHERE user_id = auth.uid();
```

### Check System Health:
```sql
-- Overall system health check
SELECT 
  'Users with stores' as metric,
  COUNT(*) as count
FROM public.profiles 
WHERE store_id IS NOT NULL
UNION ALL
SELECT 
  'Total stores' as metric,
  COUNT(*) as count
FROM public.stores
UNION ALL
SELECT 
  'Unassigned stores' as metric,
  COUNT(*) as count
FROM public.stores s
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.store_id = s.id
);
```

## Success Indicators

✅ **No 404 errors** in browser console
✅ **Store name appears** in invitation dialog
✅ **Console shows "Store found via old_structure"**
✅ **User can send invitations** successfully
✅ **Migration status** reports correctly

## Next Steps

After fixing the immediate issue:
1. **Test invitation workflow** end-to-end
2. **Plan proper migration** to new structure
3. **Set up admin interface** for store management
4. **Configure proper API settings** per store

The quick fix should resolve the 404 error immediately, allowing you to test the invitation system while planning the proper long-term solution.
