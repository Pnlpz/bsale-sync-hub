-- Create Admin Account
-- Run this in Supabase SQL Editor to create an admin user

-- Admin credentials:
-- Email: admin@bsale-sync.com
-- Password: Admin123!@#

-- Step 1: Create the auth user (this needs to be done via Supabase Auth)
-- You'll need to do this part manually in Supabase Dashboard > Authentication > Users
-- Click "Add user" and use:
-- Email: admin@bsale-sync.com
-- Password: Admin123!@#
-- Email Confirm: true (check the box)

-- Step 2: After creating the auth user, get the user ID and create the profile
-- Replace 'YOUR_AUTH_USER_ID_HERE' with the actual UUID from the auth.users table

-- First, let's check if the user already exists
SELECT id, email FROM auth.users WHERE email = 'admin@bsale-sync.com';

-- If the user exists, create/update the profile
-- Replace the UUID below with the actual user ID from the query above
INSERT INTO public.profiles (
  user_id, 
  name, 
  email, 
  role,
  created_at,
  updated_at
) VALUES (
  'YOUR_AUTH_USER_ID_HERE', -- Replace with actual UUID
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

-- Step 3: Verify the admin user was created
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

-- Step 4: Test admin permissions
SELECT 
  'Admin user created successfully' as status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE email = 'admin@bsale-sync.com' AND role = 'admin'
    ) THEN 'PASS'
    ELSE 'FAIL'
  END as result;
