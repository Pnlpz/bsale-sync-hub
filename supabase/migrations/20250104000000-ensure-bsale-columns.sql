-- Ensure Bsale API columns exist in stores table
-- This migration ensures the required columns for Bsale integration are present

-- Add Bsale API columns if they don't exist
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS bsale_store_id TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS bsale_api_token TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS api_settings JSONB DEFAULT '{}';
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Create index for better performance on bsale_store_id lookups
CREATE INDEX IF NOT EXISTS idx_stores_bsale_store_id ON public.stores(bsale_store_id);
CREATE INDEX IF NOT EXISTS idx_stores_is_active ON public.stores(is_active);

-- Update RLS policies for stores table to ensure proper access control
DROP POLICY IF EXISTS "Admins can manage all stores" ON public.stores;
DROP POLICY IF EXISTS "Locatarios can view their assigned stores" ON public.stores;

-- Policy: Admins can manage all stores (full CRUD)
CREATE POLICY "Admins can manage all stores" ON public.stores
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy: Locatarios can view stores they are assigned to
CREATE POLICY "Locatarios can view their assigned stores" ON public.stores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.store_locatarios sl
      INNER JOIN public.profiles p ON sl.locatario_id = p.id
      WHERE sl.store_id = stores.id 
      AND p.user_id = auth.uid()
      AND p.role = 'locatario'
    )
  );

-- Policy: Proveedores can view stores they are connected to
CREATE POLICY "Proveedores can view connected stores" ON public.stores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.store_providers sp
      INNER JOIN public.profiles p ON sp.proveedor_id = p.id
      WHERE sp.store_id = stores.id 
      AND p.user_id = auth.uid()
      AND p.role = 'proveedor'
      AND sp.is_active = true
    )
  );

-- Ensure RLS is enabled
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Add comments for documentation
COMMENT ON COLUMN public.stores.bsale_store_id IS 'ID of the store in Bsale system (obtained automatically from API)';
COMMENT ON COLUMN public.stores.bsale_api_token IS 'API token for Bsale integration (only accessible by admins)';
COMMENT ON COLUMN public.stores.api_settings IS 'Additional API configuration settings in JSON format';
COMMENT ON COLUMN public.stores.is_active IS 'Whether the store is active and operational';
