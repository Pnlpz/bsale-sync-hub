-- Correct Multi-Tenant System Migration
-- This migration implements the proper admin-controlled multi-tenant system

-- First, let's clean up and restructure the system properly

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Locatarios can create their own stores" ON public.stores;
DROP POLICY IF EXISTS "Locatarios can update their own stores" ON public.stores;

-- Drop the store creation function (locatarios shouldn't create stores)
DROP FUNCTION IF EXISTS public.create_store_for_locatario(TEXT, TEXT);

-- Update profiles table structure
-- Remove store_id from profiles (stores are linked via store_locatarios table)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS store_id;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS proveedor_id;

-- Create store_locatarios table (one-to-one: each store has one locatario)
CREATE TABLE IF NOT EXISTS public.store_locatarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  locatario_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_id, locatario_id)
);

-- Create store_providers table (many-to-many: providers can belong to multiple stores)
CREATE TABLE IF NOT EXISTS public.store_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  marca_id UUID REFERENCES public.marcas(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_id, provider_id)
);

-- Update stores table to remove locatario_id (now handled via store_locatarios)
ALTER TABLE public.stores DROP COLUMN IF EXISTS locatario_id;

-- Add API settings columns to stores (only admins can modify)
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS bsale_store_id TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS bsale_api_token TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS api_settings JSONB DEFAULT '{}';
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Enable RLS on new tables
ALTER TABLE public.store_locatarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_providers ENABLE ROW LEVEL SECURITY;

-- Create updated RLS policies

-- Stores policies (only admins can manage stores)
DROP POLICY IF EXISTS "Locatarios can view their store" ON public.stores;
DROP POLICY IF EXISTS "Admins can manage stores" ON public.stores;
DROP POLICY IF EXISTS "Users can view accessible stores" ON public.stores;
DROP POLICY IF EXISTS "Locatarios can manage their stores" ON public.stores;

CREATE POLICY "Admins can manage all stores" ON public.stores
FOR ALL USING (public.has_role('admin'));

CREATE POLICY "Locatarios can view their assigned store" ON public.stores
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.store_locatarios sl
    INNER JOIN public.profiles p ON sl.locatario_id = p.id
    WHERE sl.store_id = stores.id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Providers can view stores they belong to" ON public.stores
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.store_providers sp
    INNER JOIN public.profiles p ON sp.provider_id = p.id
    WHERE sp.store_id = stores.id AND p.user_id = auth.uid() AND sp.is_active = true
  )
);

-- Store_locatarios policies (only admins can assign locatarios to stores)
CREATE POLICY "Admins can manage store locatarios" ON public.store_locatarios
FOR ALL USING (public.has_role('admin'));

CREATE POLICY "Locatarios can view their store assignment" ON public.store_locatarios
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = locatario_id AND p.user_id = auth.uid()
  )
);

-- Store_providers policies
CREATE POLICY "Admins can manage all store providers" ON public.store_providers
FOR ALL USING (public.has_role('admin'));

CREATE POLICY "Locatarios can manage providers in their store" ON public.store_providers
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.store_locatarios sl
    INNER JOIN public.profiles p ON sl.locatario_id = p.id
    WHERE sl.store_id = store_providers.store_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Providers can view their store relationships" ON public.store_providers
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = provider_id AND p.user_id = auth.uid()
  )
);

-- Update products table policies to work with new structure
DROP POLICY IF EXISTS "Users can manage store-accessible products" ON public.products;
DROP POLICY IF EXISTS "Proveedores can view their products" ON public.products;
DROP POLICY IF EXISTS "Proveedores can manage their products" ON public.products;

CREATE POLICY "Admins can manage all products" ON public.products
FOR ALL USING (public.has_role('admin'));

CREATE POLICY "Locatarios can manage products in their store" ON public.products
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.store_locatarios sl
    INNER JOIN public.profiles p ON sl.locatario_id = p.id
    WHERE sl.store_id = products.store_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Providers can manage their products" ON public.products
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.store_providers sp
    INNER JOIN public.profiles p ON sp.provider_id = p.id
    WHERE sp.store_id = products.store_id 
    AND p.user_id = auth.uid() 
    AND sp.is_active = true
    AND (products.proveedor_id = p.id OR products.marca_id = sp.marca_id)
  )
);

-- Update sales table policies
DROP POLICY IF EXISTS "Users can view store-accessible sales" ON public.sales;
DROP POLICY IF EXISTS "Users can view relevant sales" ON public.sales;

CREATE POLICY "Admins can manage all sales" ON public.sales
FOR ALL USING (public.has_role('admin'));

CREATE POLICY "Locatarios can view sales in their store" ON public.sales
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.store_locatarios sl
    INNER JOIN public.profiles p ON sl.locatario_id = p.id
    WHERE sl.store_id = sales.store_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Providers can view their sales" ON public.sales
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.store_providers sp
    INNER JOIN public.profiles p ON sp.provider_id = p.id
    WHERE sp.store_id = sales.store_id 
    AND p.user_id = auth.uid() 
    AND sp.is_active = true
    AND sales.proveedor_id = p.id
  )
);

-- Create helper functions for the new structure

-- Function to get user's accessible stores
CREATE OR REPLACE FUNCTION public.get_user_accessible_stores(user_id UUID)
RETURNS TABLE(
  store_id UUID, 
  store_name TEXT, 
  role_in_store TEXT, 
  marca_id UUID,
  is_active BOOLEAN
) AS $$
BEGIN
  -- Admin can see all stores
  IF public.has_role('admin') THEN
    RETURN QUERY
    SELECT s.id, s.name, 'admin'::TEXT, NULL::UUID, s.is_active
    FROM public.stores s
    WHERE s.is_active = true;
    RETURN;
  END IF;
  
  -- Locatario can see their assigned store
  RETURN QUERY
  SELECT s.id, s.name, 'locatario'::TEXT, NULL::UUID, s.is_active
  FROM public.stores s
  INNER JOIN public.store_locatarios sl ON s.id = sl.store_id
  INNER JOIN public.profiles p ON sl.locatario_id = p.id
  WHERE p.user_id = user_id AND s.is_active = true;
  
  -- Provider can see stores they belong to
  RETURN QUERY
  SELECT s.id, s.name, 'proveedor'::TEXT, sp.marca_id, s.is_active
  FROM public.stores s
  INNER JOIN public.store_providers sp ON s.id = sp.store_id
  INNER JOIN public.profiles p ON sp.provider_id = p.id
  WHERE p.user_id = user_id AND sp.is_active = true AND s.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get locatario's store
CREATE OR REPLACE FUNCTION public.get_locatario_store(user_id UUID)
RETURNS TABLE(
  store_id UUID,
  store_name TEXT,
  store_address TEXT,
  bsale_store_id TEXT,
  api_settings JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.name, s.address, s.bsale_store_id, s.api_settings
  FROM public.stores s
  INNER JOIN public.store_locatarios sl ON s.id = sl.store_id
  INNER JOIN public.profiles p ON sl.locatario_id = p.id
  WHERE p.user_id = user_id AND s.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_store_locatarios_store_id ON public.store_locatarios(store_id);
CREATE INDEX IF NOT EXISTS idx_store_locatarios_locatario_id ON public.store_locatarios(locatario_id);
CREATE INDEX IF NOT EXISTS idx_store_providers_store_id ON public.store_providers(store_id);
CREATE INDEX IF NOT EXISTS idx_store_providers_provider_id ON public.store_providers(provider_id);
CREATE INDEX IF NOT EXISTS idx_store_providers_active ON public.store_providers(is_active);

-- Create triggers for updated_at
CREATE TRIGGER update_store_locatarios_updated_at
  BEFORE UPDATE ON public.store_locatarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_store_providers_updated_at
  BEFORE UPDATE ON public.store_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
