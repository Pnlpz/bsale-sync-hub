-- Add marca support for role-based product filtering
-- This migration adds marca (brand) functionality to support proveedor-specific product filtering

-- Create marcas table
CREATE TABLE public.marcas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add marca_id to profiles table for proveedor users
ALTER TABLE public.profiles ADD COLUMN marca_id UUID REFERENCES public.marcas(id);

-- Add marca_id to products table to associate products with brands
ALTER TABLE public.products ADD COLUMN marca_id UUID REFERENCES public.marcas(id);

-- Enable RLS for marcas table
ALTER TABLE public.marcas ENABLE ROW LEVEL SECURITY;

-- Create trigger for marcas updated_at
CREATE TRIGGER update_marcas_updated_at
  BEFORE UPDATE ON public.marcas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get current user's marca_id
CREATE OR REPLACE FUNCTION public.get_user_marca_id()
RETURNS UUID AS $$
  SELECT marca_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = '';

-- Create function to check if user can access marca
CREATE OR REPLACE FUNCTION public.can_access_marca(target_marca_id UUID)
RETURNS BOOLEAN AS $$
  SELECT 
    CASE 
      -- Admin users can access all marcas
      WHEN public.has_role('admin') THEN true
      -- Locatario users can access all marcas
      WHEN public.has_role('locatario') THEN true
      -- Proveedor users can only access their own marca
      WHEN public.has_role('proveedor') THEN 
        target_marca_id = public.get_user_marca_id()
      ELSE false
    END;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = '';

-- RLS Policies for marcas
CREATE POLICY "Users can view accessible marcas" ON public.marcas
FOR SELECT USING (
  public.has_role('admin') OR
  public.has_role('locatario') OR
  (public.has_role('proveedor') AND id = public.get_user_marca_id())
);

CREATE POLICY "Admins can manage marcas" ON public.marcas
FOR ALL USING (public.has_role('admin'));

-- Update products RLS policies to include marca-based filtering
DROP POLICY IF EXISTS "Proveedores can view their products" ON public.products;
DROP POLICY IF EXISTS "Proveedores can manage their products" ON public.products;

-- New RLS policy for products with marca-based filtering
CREATE POLICY "Users can view accessible products" ON public.products
FOR SELECT USING (
  -- Admin users can see all products
  public.has_role('admin') OR
  -- Locatario users can see all products in their store
  (public.has_role('locatario') AND store_id = public.get_user_store_id()) OR
  -- Proveedor users can only see products from their marca
  (public.has_role('proveedor') AND (
    proveedor_id = public.get_user_proveedor_id() OR
    marca_id = public.get_user_marca_id()
  ))
);

CREATE POLICY "Users can manage accessible products" ON public.products
FOR ALL USING (
  -- Admin users can manage all products
  public.has_role('admin') OR
  -- Proveedor users can only manage products from their marca
  (public.has_role('proveedor') AND (
    proveedor_id = public.get_user_proveedor_id() OR
    marca_id = public.get_user_marca_id()
  ))
);

-- Update sales RLS policies to include marca-based filtering
DROP POLICY IF EXISTS "Users can view relevant sales" ON public.sales;

CREATE POLICY "Users can view accessible sales" ON public.sales
FOR SELECT USING (
  -- Admin users can see all sales
  public.has_role('admin') OR
  -- Locatario users can see all sales in their store
  (public.has_role('locatario') AND store_id = public.get_user_store_id()) OR
  -- Proveedor users can only see sales from their marca
  (public.has_role('proveedor') AND (
    proveedor_id = public.get_user_proveedor_id() OR
    EXISTS (
      SELECT 1 FROM public.products p 
      WHERE p.id = product_id AND p.marca_id = public.get_user_marca_id()
    )
  ))
);

-- Update alerts RLS policies to include marca-based filtering
DROP POLICY IF EXISTS "Users can view relevant alerts" ON public.alerts;
DROP POLICY IF EXISTS "Users can update relevant alerts" ON public.alerts;

CREATE POLICY "Users can view accessible alerts" ON public.alerts
FOR SELECT USING (
  -- Admin users can see all alerts
  public.has_role('admin') OR
  -- Locatario users can see all alerts in their store
  (public.has_role('locatario') AND store_id = public.get_user_store_id()) OR
  -- Proveedor users can only see alerts from their marca
  (public.has_role('proveedor') AND (
    proveedor_id = public.get_user_proveedor_id() OR
    EXISTS (
      SELECT 1 FROM public.products p 
      WHERE p.id = product_id AND p.marca_id = public.get_user_marca_id()
    )
  ))
);

CREATE POLICY "Users can update accessible alerts" ON public.alerts
FOR UPDATE USING (
  -- Admin users can update all alerts
  public.has_role('admin') OR
  -- Locatario users can update all alerts in their store
  (public.has_role('locatario') AND store_id = public.get_user_store_id()) OR
  -- Proveedor users can only update alerts from their marca
  (public.has_role('proveedor') AND (
    proveedor_id = public.get_user_proveedor_id() OR
    EXISTS (
      SELECT 1 FROM public.products p 
      WHERE p.id = product_id AND p.marca_id = public.get_user_marca_id()
    )
  ))
);

-- Insert some sample marcas for testing
INSERT INTO public.marcas (name, description) VALUES
  ('Nike', 'Marca deportiva internacional'),
  ('Adidas', 'Marca deportiva alemana'),
  ('Puma', 'Marca deportiva alemana'),
  ('Reebok', 'Marca deportiva americana'),
  ('Under Armour', 'Marca deportiva americana');

-- Create indexes for better performance
CREATE INDEX idx_profiles_marca_id ON public.profiles(marca_id);
CREATE INDEX idx_products_marca_id ON public.products(marca_id);
CREATE INDEX idx_products_proveedor_marca ON public.products(proveedor_id, marca_id);

-- Add comments for documentation
COMMENT ON TABLE public.marcas IS 'Brands/Marcas table for product categorization and proveedor association';
COMMENT ON COLUMN public.profiles.marca_id IS 'Associated marca for proveedor users (one-to-one relationship)';
COMMENT ON COLUMN public.products.marca_id IS 'Brand/Marca that owns this product';
COMMENT ON FUNCTION public.get_user_marca_id() IS 'Returns the marca_id for the current authenticated user';
COMMENT ON FUNCTION public.can_access_marca(UUID) IS 'Checks if current user can access a specific marca based on role';
