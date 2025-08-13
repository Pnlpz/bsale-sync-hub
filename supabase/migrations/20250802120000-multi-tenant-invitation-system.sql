-- Multi-Tenant Invitation System Migration
-- This migration implements a comprehensive invitation-based multi-tenant system

-- Create invitation status enum
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');

-- Create invitations table
CREATE TABLE public.invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'proveedor',
  status public.invitation_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by UUID REFERENCES public.profiles(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create store_providers junction table for many-to-many relationship
CREATE TABLE public.store_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  marca_id UUID REFERENCES public.marcas(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_id, provider_id)
);

-- Update stores table to include Bsale configuration
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS bsale_store_id TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS bsale_api_token TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

-- Add foreign key constraint for stores.locatario_id
ALTER TABLE public.stores ADD CONSTRAINT fk_stores_locatario 
  FOREIGN KEY (locatario_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update profiles table to remove direct store_id relationship (now handled via store_providers)
-- Keep store_id for backward compatibility but it will be deprecated
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_invitation_only BOOLEAN NOT NULL DEFAULT false;

-- Create function to generate secure invitation tokens
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user can access store
CREATE OR REPLACE FUNCTION public.can_access_store(user_id UUID, target_store_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Admin can access all stores
  IF public.has_role('admin') THEN
    RETURN true;
  END IF;
  
  -- Locatario can access their own stores
  IF EXISTS (
    SELECT 1 FROM public.stores s
    INNER JOIN public.profiles p ON s.locatario_id = p.id
    WHERE s.id = target_store_id AND p.user_id = user_id
  ) THEN
    RETURN true;
  END IF;
  
  -- Provider can access stores they're invited to
  IF EXISTS (
    SELECT 1 FROM public.store_providers sp
    INNER JOIN public.profiles p ON sp.provider_id = p.id
    WHERE sp.store_id = target_store_id AND p.user_id = user_id AND sp.is_active = true
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

-- Create function to get user's accessible stores
CREATE OR REPLACE FUNCTION public.get_user_accessible_stores(user_id UUID)
RETURNS TABLE(store_id UUID, store_name TEXT, role_in_store TEXT, marca_id UUID) AS $$
BEGIN
  -- Admin can see all stores
  IF public.has_role('admin') THEN
    RETURN QUERY
    SELECT s.id, s.name, 'admin'::TEXT, NULL::UUID
    FROM public.stores s
    WHERE s.is_active = true;
    RETURN;
  END IF;
  
  -- Locatario can see their own stores
  IF public.has_role('locatario') THEN
    RETURN QUERY
    SELECT s.id, s.name, 'locatario'::TEXT, NULL::UUID
    FROM public.stores s
    INNER JOIN public.profiles p ON s.locatario_id = p.id
    WHERE p.user_id = user_id AND s.is_active = true;
    RETURN;
  END IF;
  
  -- Provider can see stores they're invited to
  IF public.has_role('proveedor') THEN
    RETURN QUERY
    SELECT s.id, s.name, 'proveedor'::TEXT, sp.marca_id
    FROM public.stores s
    INNER JOIN public.store_providers sp ON s.id = sp.store_id
    INNER JOIN public.profiles p ON sp.provider_id = p.id
    WHERE p.user_id = user_id AND sp.is_active = true AND s.is_active = true;
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

-- Create function to get provider's marca in specific store
CREATE OR REPLACE FUNCTION public.get_provider_marca_in_store(user_id UUID, target_store_id UUID)
RETURNS UUID AS $$
DECLARE
  marca_id UUID;
BEGIN
  SELECT sp.marca_id INTO marca_id
  FROM public.store_providers sp
  INNER JOIN public.profiles p ON sp.provider_id = p.id
  WHERE p.user_id = user_id AND sp.store_id = target_store_id AND sp.is_active = true;
  
  RETURN marca_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

-- Enable RLS on new tables
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_providers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invitations
CREATE POLICY "Locatarios can manage their store invitations" ON public.invitations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.stores s
    INNER JOIN public.profiles p ON s.locatario_id = p.id
    WHERE s.id = store_id AND p.user_id = auth.uid()
  ) OR public.has_role('admin')
);

CREATE POLICY "Users can view invitations sent to them" ON public.invitations
FOR SELECT USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.stores s
    INNER JOIN public.profiles p ON s.locatario_id = p.id
    WHERE s.id = store_id AND p.user_id = auth.uid()
  ) OR public.has_role('admin')
);

-- RLS Policies for store_providers
CREATE POLICY "Store owners can manage their store providers" ON public.store_providers
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.stores s
    INNER JOIN public.profiles p ON s.locatario_id = p.id
    WHERE s.id = store_id AND p.user_id = auth.uid()
  ) OR public.has_role('admin')
);

CREATE POLICY "Providers can view their store relationships" ON public.store_providers
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = provider_id AND p.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.stores s
    INNER JOIN public.profiles p ON s.locatario_id = p.id
    WHERE s.id = store_id AND p.user_id = auth.uid()
  ) OR public.has_role('admin')
);

-- Update existing RLS policies to support multi-store access

-- Drop existing product policies and create new ones
DROP POLICY IF EXISTS "Users can view accessible products" ON public.products;
DROP POLICY IF EXISTS "Proveedores can manage their products" ON public.products;

CREATE POLICY "Users can view store-accessible products" ON public.products
FOR SELECT USING (
  public.can_access_store(auth.uid(), store_id) AND (
    -- Admin can see all products
    public.has_role('admin') OR
    -- Locatario can see all products in their store
    (public.has_role('locatario') AND EXISTS (
      SELECT 1 FROM public.stores s
      INNER JOIN public.profiles p ON s.locatario_id = p.id
      WHERE s.id = store_id AND p.user_id = auth.uid()
    )) OR
    -- Provider can see products from their assigned marca in the store
    (public.has_role('proveedor') AND (
      marca_id = public.get_provider_marca_in_store(auth.uid(), store_id)
    ))
  )
);

CREATE POLICY "Users can manage store-accessible products" ON public.products
FOR ALL USING (
  public.can_access_store(auth.uid(), store_id) AND (
    public.has_role('admin') OR
    (public.has_role('locatario') AND EXISTS (
      SELECT 1 FROM public.stores s
      INNER JOIN public.profiles p ON s.locatario_id = p.id
      WHERE s.id = store_id AND p.user_id = auth.uid()
    )) OR
    (public.has_role('proveedor') AND 
     marca_id = public.get_provider_marca_in_store(auth.uid(), store_id))
  )
);

-- Update stores RLS policies
DROP POLICY IF EXISTS "Locatarios can view their store" ON public.stores;
DROP POLICY IF EXISTS "Admins can manage stores" ON public.stores;

CREATE POLICY "Users can view accessible stores" ON public.stores
FOR SELECT USING (
  public.can_access_store(auth.uid(), id)
);

CREATE POLICY "Locatarios can manage their stores" ON public.stores
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = locatario_id AND p.user_id = auth.uid()
  ) OR public.has_role('admin')
);

-- Create indexes for performance
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_email ON public.invitations(email);
CREATE INDEX idx_invitations_store_id ON public.invitations(store_id);
CREATE INDEX idx_invitations_status ON public.invitations(status);
CREATE INDEX idx_invitations_expires_at ON public.invitations(expires_at);

CREATE INDEX idx_store_providers_store_id ON public.store_providers(store_id);
CREATE INDEX idx_store_providers_provider_id ON public.store_providers(provider_id);
CREATE INDEX idx_store_providers_marca_id ON public.store_providers(marca_id);
CREATE INDEX idx_store_providers_active ON public.store_providers(is_active);

CREATE INDEX idx_stores_locatario_id ON public.stores(locatario_id);
CREATE INDEX idx_stores_active ON public.stores(is_active);
CREATE INDEX idx_stores_bsale_store_id ON public.stores(bsale_store_id);

-- Create trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invitations_updated_at
  BEFORE UPDATE ON public.invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_store_providers_updated_at
  BEFORE UPDATE ON public.store_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update sales and alerts RLS policies for multi-store access
DROP POLICY IF EXISTS "Users can view accessible sales" ON public.sales;
CREATE POLICY "Users can view store-accessible sales" ON public.sales
FOR SELECT USING (
  public.can_access_store(auth.uid(), store_id) AND (
    public.has_role('admin') OR
    (public.has_role('locatario') AND EXISTS (
      SELECT 1 FROM public.stores s
      INNER JOIN public.profiles p ON s.locatario_id = p.id
      WHERE s.id = store_id AND p.user_id = auth.uid()
    )) OR
    (public.has_role('proveedor') AND EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id
      AND p.marca_id = public.get_provider_marca_in_store(auth.uid(), store_id)
    ))
  )
);

DROP POLICY IF EXISTS "Users can view accessible alerts" ON public.alerts;
CREATE POLICY "Users can view store-accessible alerts" ON public.alerts
FOR SELECT USING (
  public.can_access_store(auth.uid(), store_id) AND (
    public.has_role('admin') OR
    (public.has_role('locatario') AND EXISTS (
      SELECT 1 FROM public.stores s
      INNER JOIN public.profiles p ON s.locatario_id = p.id
      WHERE s.id = store_id AND p.user_id = auth.uid()
    )) OR
    (public.has_role('proveedor') AND EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id
      AND p.marca_id = public.get_provider_marca_in_store(auth.uid(), store_id)
    ))
  )
);

-- Create function to clean up expired invitations
CREATE OR REPLACE FUNCTION public.cleanup_expired_invitations()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE public.invitations
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < now();

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to accept invitation
CREATE OR REPLACE FUNCTION public.accept_invitation(invitation_token TEXT, user_profile_id UUID)
RETURNS JSONB AS $$
DECLARE
  invitation_record public.invitations;
  result JSONB;
BEGIN
  -- Get the invitation
  SELECT * INTO invitation_record
  FROM public.invitations
  WHERE token = invitation_token AND status = 'pending' AND expires_at > now();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  -- Update invitation status
  UPDATE public.invitations
  SET status = 'accepted', accepted_at = now(), accepted_by = user_profile_id
  WHERE id = invitation_record.id;

  -- Create store-provider relationship
  INSERT INTO public.store_providers (store_id, provider_id, invited_at)
  VALUES (invitation_record.store_id, user_profile_id, invitation_record.created_at)
  ON CONFLICT (store_id, provider_id) DO UPDATE SET
    is_active = true,
    updated_at = now();

  result := jsonb_build_object(
    'success', true,
    'store_id', invitation_record.store_id,
    'invitation_id', invitation_record.id
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample data for testing (optional - remove in production)
-- This creates a sample locatario and store for testing
DO $$
DECLARE
  sample_locatario_id UUID;
  sample_store_id UUID;
BEGIN
  -- Only insert if no stores exist (fresh installation)
  IF NOT EXISTS (SELECT 1 FROM public.stores LIMIT 1) THEN
    -- Create sample locatario profile (this would normally be created during user registration)
    INSERT INTO public.profiles (id, user_id, name, email, role)
    VALUES (
      gen_random_uuid(),
      gen_random_uuid(), -- This should be a real auth.users.id in practice
      'Sample Locatario',
      'locatario@example.com',
      'locatario'
    ) RETURNING id INTO sample_locatario_id;

    -- Create sample store
    INSERT INTO public.stores (name, address, locatario_id, is_active)
    VALUES (
      'Tienda de Ejemplo',
      'Av. Ejemplo 123, Santiago',
      sample_locatario_id,
      true
    ) RETURNING id INTO sample_store_id;

    -- Create sample marcas
    INSERT INTO public.marcas (name, description) VALUES
    ('Marca A', 'Primera marca de ejemplo'),
    ('Marca B', 'Segunda marca de ejemplo');
  END IF;
END $$;
