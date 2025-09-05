-- Create a separate table for Bsale configuration
-- This is a temporary solution until the stores table can be updated

-- Create bsale_config table
CREATE TABLE IF NOT EXISTS public.bsale_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  bsale_store_id TEXT,
  bsale_api_token TEXT NOT NULL,
  api_settings JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure one config per store
  UNIQUE(store_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bsale_config_store_id ON public.bsale_config(store_id);
CREATE INDEX IF NOT EXISTS idx_bsale_config_bsale_store_id ON public.bsale_config(bsale_store_id);
CREATE INDEX IF NOT EXISTS idx_bsale_config_is_active ON public.bsale_config(is_active);

-- Enable RLS
ALTER TABLE public.bsale_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bsale_config table

-- Policy: Admins can manage all Bsale configurations
CREATE POLICY "Admins can manage all bsale configs" ON public.bsale_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy: Locatarios can view their store's Bsale config (but not the token)
CREATE POLICY "Locatarios can view their store bsale config" ON public.bsale_config
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.store_locatarios sl
      INNER JOIN public.profiles p ON sl.locatario_id = p.id
      WHERE sl.store_id = bsale_config.store_id 
      AND p.user_id = auth.uid()
      AND p.role = 'locatario'
    )
  );

-- Create a view that joins stores with bsale_config for easier querying
CREATE OR REPLACE VIEW public.stores_with_bsale AS
SELECT 
  s.*,
  bc.bsale_store_id,
  bc.bsale_api_token,
  bc.api_settings,
  COALESCE(bc.is_active, true) as api_configured
FROM public.stores s
LEFT JOIN public.bsale_config bc ON s.id = bc.store_id;

-- Grant permissions on the view
GRANT SELECT ON public.stores_with_bsale TO authenticated;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER handle_bsale_config_updated_at
  BEFORE UPDATE ON public.bsale_config
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Update profiles table to support invitation-based user creation
ALTER TABLE public.profiles ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS invitation_token TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS invitation_status TEXT DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Create index for invitation lookups
CREATE INDEX IF NOT EXISTS idx_profiles_invitation_token ON public.profiles(invitation_token);
CREATE INDEX IF NOT EXISTS idx_profiles_invitation_status ON public.profiles(invitation_status);

-- Add comments for documentation
COMMENT ON TABLE public.bsale_config IS 'Bsale API configuration for stores';
COMMENT ON COLUMN public.bsale_config.store_id IS 'Reference to the store this configuration belongs to';
COMMENT ON COLUMN public.bsale_config.bsale_store_id IS 'ID of the store in Bsale system (obtained automatically from API)';
COMMENT ON COLUMN public.bsale_config.bsale_api_token IS 'API token for Bsale integration (only accessible by admins)';
COMMENT ON COLUMN public.bsale_config.api_settings IS 'Additional API configuration settings in JSON format';
COMMENT ON COLUMN public.bsale_config.is_active IS 'Whether the Bsale integration is active for this store';

COMMENT ON COLUMN public.profiles.invitation_token IS 'Token used for user invitation process';
COMMENT ON COLUMN public.profiles.invitation_status IS 'Status of user invitation: pending, accepted, expired';
COMMENT ON COLUMN public.profiles.invited_at IS 'Timestamp when the invitation was sent';
