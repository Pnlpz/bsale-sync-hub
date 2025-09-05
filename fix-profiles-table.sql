-- Script to update profiles table for invitation-based user creation
-- Run this directly in Supabase SQL Editor

-- Make user_id nullable to support invitation-based profiles
ALTER TABLE public.profiles ALTER COLUMN user_id DROP NOT NULL;

-- Add invitation-related columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS invitation_token TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS invitation_status TEXT DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_invitation_token ON public.profiles(invitation_token);
CREATE INDEX IF NOT EXISTS idx_profiles_invitation_status ON public.profiles(invitation_status);

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.invitation_token IS 'Token used for user invitation process';
COMMENT ON COLUMN public.profiles.invitation_status IS 'Status of user invitation: pending, accepted, expired';
COMMENT ON COLUMN public.profiles.invited_at IS 'Timestamp when the invitation was sent';

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
AND column_name IN ('user_id', 'invitation_token', 'invitation_status', 'invited_at')
ORDER BY column_name;
