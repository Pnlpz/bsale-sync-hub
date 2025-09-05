-- Create invitations table for manual invitation management
-- This table handles invitations when Supabase Auth restrictions prevent automatic user creation

-- Create invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'locatario',
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  locatario_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT invitations_status_check CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  CONSTRAINT invitations_role_check CHECK (role IN ('locatario', 'proveedor'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_store_id ON public.invitations(store_id);
CREATE INDEX IF NOT EXISTS idx_invitations_locatario_id ON public.invitations(locatario_id);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON public.invitations(expires_at);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invitations table

-- Policy: Admins can manage all invitations
CREATE POLICY "Admins can manage all invitations" ON public.invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy: Users can view their own invitations (by email)
CREATE POLICY "Users can view their own invitations" ON public.invitations
  FOR SELECT USING (
    email = (
      SELECT profiles.email FROM public.profiles 
      WHERE profiles.user_id = auth.uid()
    )
  );

-- Policy: Public access for invitation validation (needed for registration)
CREATE POLICY "Public can validate invitations" ON public.invitations
  FOR SELECT USING (
    status = 'pending' 
    AND expires_at > timezone('utc'::text, now())
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER handle_invitations_updated_at
  BEFORE UPDATE ON public.invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_invitations_updated_at();

-- Create function to automatically expire old invitations
CREATE OR REPLACE FUNCTION public.expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE public.invitations 
  SET status = 'expired', updated_at = timezone('utc'::text, now())
  WHERE status = 'pending' 
    AND expires_at < timezone('utc'::text, now());
END;
$$ LANGUAGE plpgsql;

-- Create view for active invitations
CREATE OR REPLACE VIEW public.active_invitations AS
SELECT 
  i.*,
  s.name as store_name,
  p.name as locatario_name
FROM public.invitations i
LEFT JOIN public.stores s ON i.store_id = s.id
LEFT JOIN public.profiles p ON i.locatario_id = p.id
WHERE i.status = 'pending' 
  AND i.expires_at > timezone('utc'::text, now());

-- Grant permissions on the view
GRANT SELECT ON public.active_invitations TO authenticated;
GRANT SELECT ON public.active_invitations TO anon; -- Needed for public invitation validation

-- Add comments for documentation
COMMENT ON TABLE public.invitations IS 'Manual invitation system for user registration when Supabase Auth restrictions apply';
COMMENT ON COLUMN public.invitations.token IS 'Unique token for invitation validation';
COMMENT ON COLUMN public.invitations.email IS 'Email address of the invited user';
COMMENT ON COLUMN public.invitations.role IS 'Role to be assigned to the user (locatario, proveedor)';
COMMENT ON COLUMN public.invitations.store_id IS 'Store associated with the invitation';
COMMENT ON COLUMN public.invitations.locatario_id IS 'Profile ID of the locatario (for locatario invitations)';
COMMENT ON COLUMN public.invitations.status IS 'Invitation status: pending, accepted, expired, cancelled';
COMMENT ON COLUMN public.invitations.expires_at IS 'When the invitation expires';
COMMENT ON COLUMN public.invitations.accepted_at IS 'When the invitation was accepted';

-- Create a function to clean up expired invitations (can be called periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_invitations()
RETURNS integer AS $$
DECLARE
  expired_count integer;
BEGIN
  -- Mark expired invitations
  UPDATE public.invitations 
  SET status = 'expired', updated_at = timezone('utc'::text, now())
  WHERE status = 'pending' 
    AND expires_at < timezone('utc'::text, now());
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;
