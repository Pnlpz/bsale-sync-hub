-- Make profiles table flexible for invitation-based registration
-- This allows creating profiles before users complete auth registration

-- Step 1: Drop the foreign key constraint on user_id
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Step 2: Make user_id nullable
ALTER TABLE public.profiles ALTER COLUMN user_id DROP NOT NULL;

-- Step 3: Drop the unique constraint on user_id
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_key;

-- Step 4: Create a partial unique index that only applies to non-null user_id values
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_unique_when_not_null 
ON public.profiles (user_id) 
WHERE user_id IS NOT NULL;

-- Step 5: Add indexes for profiles without user_id (pending registration)
CREATE INDEX IF NOT EXISTS idx_profiles_email_pending 
ON public.profiles (email) 
WHERE user_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_role_pending 
ON public.profiles (role) 
WHERE user_id IS NULL;

-- Step 6: Add a status column to track profile state
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Step 7: Add constraint for status values
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check 
CHECK (status IN ('pending', 'active', 'inactive'));

-- Step 8: Create index on status
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles (status);

-- Step 9: Update existing profiles to have 'active' status if they have user_id
UPDATE public.profiles SET status = 'active' WHERE user_id IS NOT NULL;

-- Step 10: Create a function to activate profile when user registers
CREATE OR REPLACE FUNCTION public.activate_profile_on_registration(
  profile_email TEXT,
  auth_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  profile_updated BOOLEAN := FALSE;
BEGIN
  -- Update the profile with the auth user_id and set status to active
  UPDATE public.profiles 
  SET 
    user_id = auth_user_id,
    status = 'active',
    updated_at = timezone('utc'::text, now())
  WHERE email = profile_email 
    AND user_id IS NULL 
    AND status = 'pending';
  
  GET DIAGNOSTICS profile_updated = FOUND;
  
  RETURN profile_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.activate_profile_on_registration(TEXT, UUID) TO authenticated;

-- Step 12: Create a view for pending profiles (profiles waiting for user registration)
CREATE OR REPLACE VIEW public.pending_profiles AS
SELECT 
  p.*,
  s.name as store_name,
  i.token as invitation_token,
  i.expires_at as invitation_expires_at
FROM public.profiles p
LEFT JOIN public.stores s ON s.locatario_id = p.id
LEFT JOIN public.invitations i ON i.locatario_id = p.id AND i.status = 'pending'
WHERE p.user_id IS NULL 
  AND p.status = 'pending';

-- Step 13: Grant permissions on the view
GRANT SELECT ON public.pending_profiles TO authenticated;

-- Step 14: Update RLS policies for profiles to handle null user_id
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Policy: Users can view their own profile (by user_id or email for pending profiles)
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (
    user_id = auth.uid() 
    OR (user_id IS NULL AND email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (
    user_id = auth.uid()
  );

-- Policy: Admins can manage all profiles
CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles admin_profile
      WHERE admin_profile.user_id = auth.uid() 
      AND admin_profile.role = 'admin'
    )
  );

-- Step 15: Add comments for documentation
COMMENT ON COLUMN public.profiles.user_id IS 'UUID of auth user. NULL for pending registrations, set when user completes registration';
COMMENT ON COLUMN public.profiles.status IS 'Profile status: pending (awaiting registration), active (registered), inactive (disabled)';

-- Step 16: Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
AND column_name IN ('user_id', 'status')
ORDER BY column_name;
