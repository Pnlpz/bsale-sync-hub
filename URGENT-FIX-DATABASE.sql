-- ⚠️  URGENT: Execute this immediately in Supabase SQL Editor
-- This fixes the database constraints to allow store creation

-- Step 1: Remove foreign key constraint on user_id
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Step 2: Make user_id nullable
ALTER TABLE public.profiles ALTER COLUMN user_id DROP NOT NULL;

-- Step 3: Remove unique constraint on user_id
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_key;

-- Step 4: Create partial unique index (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_unique_when_not_null 
ON public.profiles (user_id) 
WHERE user_id IS NOT NULL;

-- ✅ VERIFICATION: Check that changes were applied
SELECT 
    column_name, 
    is_nullable,
    data_type
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
AND column_name = 'user_id';

-- Expected result: is_nullable should be 'YES'

-- ✅ VERIFICATION: Check constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass
AND conname LIKE '%user_id%';

-- Expected result: No foreign key constraints on user_id should remain
