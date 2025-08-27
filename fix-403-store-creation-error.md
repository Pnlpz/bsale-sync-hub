# Fix 403 Store Creation Error

## Issue Description
**Error**: `Failed to load resource: the server responded with a status of 403 ()`
**Location**: `store-setup-service.ts:88`
**Root Cause**: Missing RLS (Row Level Security) policies preventing locatarios from creating stores

## Root Cause Analysis

### The Problem
1. **RLS Policies Missing**: The `stores` table only had policies for SELECT and admin ALL operations
2. **No INSERT Policy**: Locatarios couldn't create new stores due to missing INSERT policy
3. **Permission Denied**: 403 error when trying to insert into stores table

### Current RLS Policies (Before Fix)
```sql
-- Only these policies existed:
CREATE POLICY "Locatarios can view their store" ON public.stores FOR SELECT ...
CREATE POLICY "Admins can manage stores" ON public.stores FOR ALL ...
-- Missing: INSERT policy for locatarios
```

## Solution Applied

### 1. Database Migration Created
**File**: `supabase/migrations/20250813000000-fix-store-creation-permissions.sql`

### 2. New RLS Policies Added
```sql
-- Allow locatarios to create their own stores
CREATE POLICY "Locatarios can create their own stores" ON public.stores
FOR INSERT WITH CHECK (
  locatario_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND role = 'locatario') OR
  public.has_role('admin')
);

-- Allow locatarios to update their own stores
CREATE POLICY "Locatarios can update their own stores" ON public.stores
FOR UPDATE USING (...) WITH CHECK (...);
```

### 3. Database Function Created
**Function**: `public.create_store_for_locatario()`
- **Purpose**: Create stores with elevated privileges (SECURITY DEFINER)
- **Benefits**: Bypasses RLS issues, handles edge cases, atomic operations
- **Returns**: JSON with success status and store data

### 4. Service Updated
**File**: `src/services/store-setup-service.ts`
- **Changed**: Now uses `supabase.rpc('create_store_for_locatario', ...)`
- **Benefits**: More reliable, better error handling, atomic operations

## How to Apply the Fix

### Step 1: Apply Database Migration
1. **Open Supabase Dashboard** → Go to SQL Editor
2. **Copy and paste** the contents of `apply-store-permissions-fix.sql`
3. **Run the SQL** to create policies and function
4. **Verify success** - should see "Success. No rows returned"

### Step 2: Test the Fix
1. **Refresh the application** (hard refresh: Ctrl+F5)
2. **Login as a locatario**
3. **Click "Invitar Proveedor"**
4. **Check browser console** for success messages

## Expected Behavior After Fix

### Console Logs (Success)
```
Invitation Debug: { currentStoreId: null, currentStore: null, profile: {...} }
No store ID found, attempting to ensure user has a store...
Attempting to create store using database function: {
  name: "Tienda de Juan Pérez",
  address: "Dirección por definir",
  locatario_id: "...",
  userRole: "locatario"
}
Store created successfully: { id: "...", name: "Tienda de Juan Pérez", ... }
```

### User Experience (Success)
1. **Dialog opens** without errors
2. **Toast notification**: "Tienda configurada: Tienda de Juan Pérez"
3. **Store info displays** in blue box
4. **Invitation can be sent** successfully

## Troubleshooting

### If 403 Error Persists

#### Check 1: Verify Migration Applied
```sql
-- Run in Supabase SQL Editor
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'stores';
```
Should show the new policies.

#### Check 2: Verify Function Exists
```sql
-- Run in Supabase SQL Editor
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'create_store_for_locatario';
```
Should return the function.

#### Check 3: Test Function Directly
```sql
-- Run in Supabase SQL Editor (while logged in as locatario)
SELECT public.create_store_for_locatario('Test Store', 'Test Address');
```
Should return success JSON.

### If Function Returns Error

#### Check User Profile
```sql
-- Verify user has correct profile
SELECT id, user_id, name, role, store_id 
FROM public.profiles 
WHERE user_id = auth.uid();
```

#### Check User Role
- Ensure user role is 'locatario' or 'admin'
- Verify auth.uid() returns valid UUID

### Alternative Solutions

#### Option 1: Temporary Admin Override
```sql
-- Temporarily make user admin (TESTING ONLY)
UPDATE public.profiles SET role = 'admin' WHERE user_id = auth.uid();
-- Remember to change back to 'locatario' after testing
```

#### Option 2: Manual Store Creation
```sql
-- Create store manually for testing
INSERT INTO public.stores (name, address, locatario_id)
VALUES (
  'Test Store',
  'Test Address',
  (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Update profile
UPDATE public.profiles 
SET store_id = (SELECT id FROM public.stores WHERE locatario_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
WHERE user_id = auth.uid();
```

## Verification Steps

### 1. Database Level
- ✅ New RLS policies exist
- ✅ Function `create_store_for_locatario` exists
- ✅ Function returns success when called

### 2. Application Level
- ✅ No 403 errors in console
- ✅ Store creation succeeds
- ✅ Toast notifications appear
- ✅ Store info displays in dialog

### 3. User Experience
- ✅ Invitation dialog opens smoothly
- ✅ Store name appears immediately
- ✅ Invitations can be sent successfully
- ✅ No JavaScript errors

## Success Indicators

✅ **No 403 HTTP errors**
✅ **Console shows "Store created successfully"**
✅ **Toast: "Tienda configurada: [Store Name]"**
✅ **Blue info box shows store name**
✅ **Invitation process completes**

The 403 error should now be completely resolved, and locatarios can create stores and send invitations without permission issues.
