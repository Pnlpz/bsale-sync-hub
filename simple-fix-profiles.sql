-- Simple fix for profiles table to allow null user_id
-- Run this in Supabase SQL Editor

-- Make user_id nullable
ALTER TABLE public.profiles ALTER COLUMN user_id DROP NOT NULL;

-- Drop unique constraint on user_id
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_key;

-- Create partial unique index (unique only when not null)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_unique_when_not_null 
ON public.profiles (user_id) 
WHERE user_id IS NOT NULL;

-- Verify the change
SELECT 
    column_name, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
AND column_name = 'user_id';
