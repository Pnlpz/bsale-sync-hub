-- Script to make user_id nullable in profiles table
-- This allows creating profiles before users complete registration
-- Run this in Supabase SQL Editor

-- Step 1: Make user_id nullable and remove UNIQUE constraint temporarily
ALTER TABLE public.profiles ALTER COLUMN user_id DROP NOT NULL;

-- Step 2: Drop the existing unique constraint on user_id
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_key;

-- Step 3: Create a partial unique index that only applies to non-null user_id values
-- This ensures uniqueness when user_id is set, but allows multiple null values
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_unique_when_not_null 
ON public.profiles (user_id) 
WHERE user_id IS NOT NULL;

-- Step 4: Add a check constraint to ensure either user_id is null (pending registration) 
-- or it exists in auth.users (completed registration)
-- Note: We'll handle the foreign key constraint through application logic for now

-- Step 5: Add helpful indexes for invitation-based profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email_when_user_id_null 
ON public.profiles (email) 
WHERE user_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_role_when_user_id_null 
ON public.profiles (role) 
WHERE user_id IS NULL;

-- Step 6: Add comments to document the new behavior
COMMENT ON COLUMN public.profiles.user_id IS 'UUID of auth user. NULL for pending registrations, set when user completes registration';

-- Step 7: Create a function to link profiles with auth users during registration
CREATE OR REPLACE FUNCTION public.link_profile_to_auth_user(
  profile_email TEXT,
  auth_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  profile_exists BOOLEAN;
BEGIN
  -- Check if profile exists with null user_id
  SELECT EXISTS(
    SELECT 1 FROM public.profiles 
    WHERE email = profile_email 
    AND user_id IS NULL
  ) INTO profile_exists;
  
  IF profile_exists THEN
    -- Update the profile with the auth user_id
    UPDATE public.profiles 
    SET user_id = auth_user_id, 
        updated_at = timezone('utc'::text, now())
    WHERE email = profile_email 
    AND user_id IS NULL;
    
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.link_profile_to_auth_user(TEXT, UUID) TO authenticated;

-- Step 9: Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
AND column_name = 'user_id';

-- Step 10: Show any existing profiles with null user_id
SELECT 
    id,
    name,
    email,
    role,
    user_id,
    created_at
FROM public.profiles 
WHERE user_id IS NULL
ORDER BY created_at DESC
LIMIT 10;
