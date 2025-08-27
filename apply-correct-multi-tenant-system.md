# Apply Correct Multi-Tenant System

## Overview
This guide implements the proper admin-controlled multi-tenant system where:
- **Admins** create locatario accounts and set up their stores
- **Locatarios** can only invite proveedores to their assigned store
- **Proveedores** can belong to multiple stores via invitations
- **API settings** are only accessible to admins

## Database Structure Changes

### New Tables Created:
1. **`store_locatarios`** - One-to-one: Each store has one locatario
2. **`store_providers`** - Many-to-many: Providers can belong to multiple stores

### Tables Modified:
1. **`stores`** - Added API settings, removed locatario_id
2. **`profiles`** - Removed store_id and proveedor_id columns

### New Functions:
1. **`get_user_accessible_stores()`** - Returns stores user can access
2. **`get_locatario_store()`** - Returns locatario's assigned store

## Step 1: Apply Database Migration

### Option A: Using Supabase Dashboard
1. **Open Supabase Dashboard** → SQL Editor
2. **Copy and paste** the entire contents of `supabase/migrations/20250813120000-correct-multi-tenant-system.sql`
3. **Run the SQL** - this will restructure the database
4. **Verify success** - should see "Success. No rows returned"

### Option B: Using Supabase CLI
```bash
supabase db push
```

## Step 2: Set Up Initial Data (Admin Only)

### Create Sample Locatario and Store
```sql
-- 1. Create a locatario profile (this should be done via admin interface)
INSERT INTO public.profiles (user_id, name, email, role)
VALUES (
  'your-auth-user-id-here', -- Replace with actual auth.users.id
  'Juan Pérez',
  'juan@example.com',
  'locatario'
);

-- 2. Create a store
INSERT INTO public.stores (name, address, bsale_store_id, bsale_api_token, is_active)
VALUES (
  'Tienda de Juan Pérez',
  'Av. Principal 123, Santiago',
  'your-bsale-store-id',
  'your-bsale-api-token',
  true
);

-- 3. Assign locatario to store
INSERT INTO public.store_locatarios (store_id, locatario_id)
VALUES (
  (SELECT id FROM public.stores WHERE name = 'Tienda de Juan Pérez'),
  (SELECT id FROM public.profiles WHERE email = 'juan@example.com')
);
```

## Step 3: Test the New System

### Test Locatario Login
1. **Login as locatario** (juan@example.com)
2. **Go to Dashboard** - should see store information
3. **Click "Invitar Proveedor"** - should work without 403 errors
4. **Send invitation** - should succeed

### Test Provider Invitation
1. **Send invitation** from locatario dashboard
2. **Check console** for invitation URL
3. **Open invitation URL** in new tab
4. **Complete provider registration**
5. **Verify provider has access** to the store

## Step 4: Admin Interface (Future)

### Admin Capabilities:
- ✅ Create locatario accounts
- ✅ Set up stores for locatarios
- ✅ Configure API settings (Bsale tokens)
- ✅ Manage all stores and users
- ✅ View system-wide analytics

### Locatario Capabilities:
- ✅ View their assigned store
- ✅ Invite proveedores to their store
- ✅ Manage products in their store
- ✅ View sales in their store
- ❌ Cannot create stores
- ❌ Cannot access API settings

### Proveedor Capabilities:
- ✅ Accept invitations to stores
- ✅ Manage their products in assigned stores
- ✅ View their sales across all stores
- ✅ Access multiple stores if invited
- ❌ Cannot invite other users

## Step 5: Verify System Works

### Database Level Checks:
```sql
-- Check store-locatario relationships
SELECT s.name as store_name, p.name as locatario_name
FROM public.stores s
JOIN public.store_locatarios sl ON s.id = sl.store_id
JOIN public.profiles p ON sl.locatario_id = p.id;

-- Check store-provider relationships
SELECT s.name as store_name, p.name as provider_name, sp.is_active
FROM public.stores s
JOIN public.store_providers sp ON s.id = sp.store_id
JOIN public.profiles p ON sp.provider_id = p.id;

-- Test user accessible stores function
SELECT * FROM public.get_user_accessible_stores('your-user-id-here');

-- Test locatario store function
SELECT * FROM public.get_locatario_store('your-locatario-user-id');
```

### Application Level Checks:
- ✅ Locatarios can see their store in dashboard
- ✅ Invitation dialog shows correct store name
- ✅ Invitations can be sent without 403 errors
- ✅ Providers can accept invitations
- ✅ Multi-store access works for providers

## Troubleshooting

### If 403 Errors Persist:
1. **Check RLS policies** are applied correctly
2. **Verify user roles** in profiles table
3. **Check store assignments** in store_locatarios table
4. **Test database functions** directly in SQL editor

### If Store Not Found:
1. **Verify store_locatarios** table has correct relationships
2. **Check get_locatario_store** function returns data
3. **Ensure user has locatario role**

### If Invitations Fail:
1. **Check store_providers** table permissions
2. **Verify invitation policies** allow locatarios to create invitations
3. **Test invitation acceptance** creates store_providers records

## Key Differences from Previous System

### Before (Broken):
- Locatarios could create their own stores
- Direct store_id in profiles table
- Automatic store creation on invitation
- No admin control over store setup

### After (Correct):
- Only admins create stores and assign locatarios
- Proper many-to-many relationships via junction tables
- Locatarios get their store from database function
- Full admin control over system setup

## Security Benefits

1. **Admin Control**: Only admins can create stores and configure API settings
2. **Proper Isolation**: Each store is properly isolated with correct permissions
3. **Audit Trail**: All relationships are tracked in junction tables
4. **Role Enforcement**: RLS policies enforce proper role-based access
5. **API Security**: Bsale tokens only accessible to admins

The new system provides proper multi-tenancy with admin control while maintaining security and scalability.
