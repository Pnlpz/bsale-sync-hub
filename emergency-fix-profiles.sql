-- Emergency fix for profiles table to allow profile creation without auth users
-- Run this immediately in Supabase SQL Editor

-- Remove foreign key constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Make user_id nullable
ALTER TABLE public.profiles ALTER COLUMN user_id DROP NOT NULL;

-- Remove unique constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_key;

-- Create partial unique index (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_unique_when_not_null 
ON public.profiles (user_id) 
WHERE user_id IS NOT NULL;

-- Verify the changes worked
SELECT 
    column_name, 
    is_nullable,
    data_type
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
AND column_name = 'user_id';

-- Show current constraint status
SELECT 
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass
AND conname LIKE '%user_id%';
