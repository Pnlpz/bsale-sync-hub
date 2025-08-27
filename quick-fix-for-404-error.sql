-- Quick Fix for 404 Error
-- Run this in Supabase SQL Editor to fix the immediate issue

-- Step 1: Check current user profile
SELECT 
  id, 
  user_id, 
  name, 
  email, 
  role, 
  store_id,
  CASE 
    WHEN store_id IS NOT NULL THEN 'Has store_id'
    ELSE 'No store_id'
  END as store_status
FROM public.profiles 
WHERE user_id = auth.uid();

-- Step 2: Check if user has any stores (if store_id is null)
SELECT 
  s.id,
  s.name,
  s.address,
  'Available store' as status
FROM public.stores s
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.store_id = s.id
)
LIMIT 5;

-- Step 3: Quick fix - Assign first available store to current user (if needed)
-- ONLY RUN THIS IF THE USER HAS NO STORE_ID AND THERE ARE AVAILABLE STORES

-- Uncomment and run this if you need to assign a store quickly:
/*
UPDATE public.profiles 
SET store_id = (
  SELECT s.id 
  FROM public.stores s 
  WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.store_id = s.id
  )
  LIMIT 1
)
WHERE user_id = auth.uid() 
AND store_id IS NULL;
*/

-- Step 4: If no stores exist, create a test store
-- ONLY RUN THIS IF NO STORES EXIST

-- Uncomment and run this if you need to create a test store:
/*
INSERT INTO public.stores (name, address)
VALUES ('Test Store', 'Test Address')
ON CONFLICT DO NOTHING;

UPDATE public.profiles 
SET store_id = (SELECT id FROM public.stores WHERE name = 'Test Store')
WHERE user_id = auth.uid() 
AND store_id IS NULL;
*/

-- Step 5: Verify the fix
SELECT 
  p.name as user_name,
  p.role,
  s.name as store_name,
  s.address as store_address,
  'Fixed' as status
FROM public.profiles p
LEFT JOIN public.stores s ON p.store_id = s.id
WHERE p.user_id = auth.uid();

-- Step 6: Test the store relationship
SELECT 
  'Store relationship test' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.profiles p
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE p.user_id = auth.uid()
    ) THEN 'PASS - User has valid store'
    ELSE 'FAIL - User has no valid store'
  END as result;
