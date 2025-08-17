# Admin Account Setup Guide

## Admin Credentials
**Email:** `admin@bsale-sync.com`
**Password:** `Admin123!@#`

## Step-by-Step Setup

### Step 1: Create Auth User in Supabase Dashboard

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to **Authentication** → **Users**

2. **Add New User**
   - Click **"Add user"** button
   - Fill in the form:
     - **Email:** `admin@bsale-sync.com`
     - **Password:** `Admin123!@#`
     - **Auto Confirm User:** ✅ Check this box
   - Click **"Create user"**

3. **Copy User ID**
   - After creation, you'll see the new user in the list
   - **Copy the UUID** from the "ID" column (it looks like: `12345678-1234-1234-1234-123456789abc`)

### Step 2: Create Profile in Database

1. **Open SQL Editor**
   - In Supabase Dashboard, go to **SQL Editor**

2. **Run Profile Creation Query**
   ```sql
   -- Replace 'YOUR_AUTH_USER_ID_HERE' with the UUID you copied
   INSERT INTO public.profiles (
     user_id, 
     name, 
     email, 
     role,
     created_at,
     updated_at
   ) VALUES (
     'YOUR_AUTH_USER_ID_HERE', -- Paste the UUID here
     'System Administrator',
     'admin@bsale-sync.com',
     'admin',
     now(),
     now()
   ) ON CONFLICT (user_id) DO UPDATE SET
     name = 'System Administrator',
     email = 'admin@bsale-sync.com',
     role = 'admin',
     updated_at = now();
   ```

3. **Verify Creation**
   ```sql
   -- Check if admin user was created successfully
   SELECT 
     p.id,
     p.user_id,
     p.name,
     p.email,
     p.role,
     au.email as auth_email,
     au.email_confirmed_at
   FROM public.profiles p
   LEFT JOIN auth.users au ON p.user_id = au.id
   WHERE p.email = 'admin@bsale-sync.com';
   ```

### Step 3: Test Admin Login

1. **Go to your application**
   - Navigate to: `http://localhost:8080` (or your app URL)

2. **Login with admin credentials**
   - **Email:** `admin@bsale-sync.com`
   - **Password:** `Admin123!@#`

3. **Verify admin access**
   - You should see admin-specific features
   - Check that you can access all stores and settings

## Alternative: Quick Setup Script

If you prefer to do everything via SQL (after manually creating the auth user):

```sql
-- Step 1: Check if auth user exists
SELECT id, email, email_confirmed_at FROM auth.users WHERE email = 'admin@bsale-sync.com';

-- Step 2: Create profile (replace the UUID)
INSERT INTO public.profiles (
  user_id, 
  name, 
  email, 
  role
) VALUES (
  'PASTE_UUID_HERE', -- Replace with actual UUID from Step 1
  'System Administrator',
  'admin@bsale-sync.com',
  'admin'
);

-- Step 3: Verify
SELECT * FROM public.profiles WHERE email = 'admin@bsale-sync.com';
```

## Admin Capabilities

Once logged in as admin, you should be able to:

### User Management
- ✅ **View all users** (locatarios and proveedores)
- ✅ **Create locatario accounts**
- ✅ **Manage user roles and permissions**

### Store Management
- ✅ **Create and configure stores**
- ✅ **Assign locatarios to stores**
- ✅ **Set up API settings** (Bsale tokens)
- ✅ **View all store data**

### System Administration
- ✅ **Access all products** across all stores
- ✅ **View all sales** and analytics
- ✅ **Manage invitations** and provider relationships
- ✅ **Configure system settings**

## Troubleshooting

### Issue 1: Can't create auth user
**Solution:** Make sure you have admin access to the Supabase project

### Issue 2: Profile creation fails
**Solution:** Check that you copied the correct UUID from the auth.users table

### Issue 3: Login fails
**Solution:** Verify the email is confirmed in Supabase Auth dashboard

### Issue 4: No admin features visible
**Solution:** Check that the profile has `role = 'admin'` in the database

## Security Notes

### Production Considerations:
1. **Change the password** to something more secure
2. **Use a real email address** for password recovery
3. **Enable 2FA** if available
4. **Regularly rotate credentials**

### Development Use:
- These credentials are fine for development and testing
- Make sure to change them before going to production

## Verification Checklist

After setup, verify:
- ✅ **Auth user exists** in Supabase Auth dashboard
- ✅ **Profile exists** with role 'admin' in profiles table
- ✅ **Can login** to the application
- ✅ **Admin features** are visible and accessible
- ✅ **Can manage stores** and users

## Next Steps

Once you have admin access:
1. **Create test stores** for locatarios
2. **Set up proper store-locatario relationships**
3. **Configure API settings** for Bsale integration
4. **Test the complete workflow** (admin → locatario → proveedor)

The admin account will give you full control over the system to properly configure the multi-tenant structure.
