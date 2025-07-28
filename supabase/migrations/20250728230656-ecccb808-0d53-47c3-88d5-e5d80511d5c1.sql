-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('proveedor', 'locatario', 'admin');

-- Create profiles table to extend auth.users
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'locatario',
  store_id UUID,
  proveedor_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stores table
CREATE TABLE public.stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  locatario_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  proveedor_id UUID NOT NULL,
  store_id UUID NOT NULL,
  bsale_product_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sales table
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  proveedor_id UUID NOT NULL,
  quantity INTEGER NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  sale_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  bsale_sale_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create alerts table
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  proveedor_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'low_stock',
  message TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_store FOREIGN KEY (store_id) REFERENCES public.stores(id);
ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_proveedor FOREIGN KEY (proveedor_id) REFERENCES public.profiles(id);
ALTER TABLE public.stores ADD CONSTRAINT fk_stores_locatario FOREIGN KEY (locatario_id) REFERENCES public.profiles(id);
ALTER TABLE public.products ADD CONSTRAINT fk_products_proveedor FOREIGN KEY (proveedor_id) REFERENCES public.profiles(id);
ALTER TABLE public.products ADD CONSTRAINT fk_products_store FOREIGN KEY (store_id) REFERENCES public.stores(id);
ALTER TABLE public.sales ADD CONSTRAINT fk_sales_proveedor FOREIGN KEY (proveedor_id) REFERENCES public.profiles(id);
ALTER TABLE public.alerts ADD CONSTRAINT fk_alerts_proveedor FOREIGN KEY (proveedor_id) REFERENCES public.profiles(id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Create function to get current user profile
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS public.profiles AS $$
  SELECT * FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create function to check if user has role
CREATE OR REPLACE FUNCTION public.has_role(_role user_role)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = _role
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create function to get user store_id
CREATE OR REPLACE FUNCTION public.get_user_store_id()
RETURNS UUID AS $$
  SELECT store_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create function to get user proveedor_id
CREATE OR REPLACE FUNCTION public.get_user_proveedor_id()
RETURNS UUID AS $$
  SELECT COALESCE(proveedor_id, id) FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (public.has_role('admin'));

CREATE POLICY "Admins can insert profiles" ON public.profiles
FOR INSERT WITH CHECK (public.has_role('admin'));

-- RLS Policies for stores
CREATE POLICY "Locatarios can view their store" ON public.stores
FOR SELECT USING (
  locatario_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
  public.has_role('admin')
);

CREATE POLICY "Admins can manage stores" ON public.stores
FOR ALL USING (public.has_role('admin'));

-- RLS Policies for products
CREATE POLICY "Proveedores can view their products" ON public.products
FOR SELECT USING (
  proveedor_id = public.get_user_proveedor_id() OR
  store_id = public.get_user_store_id() OR
  public.has_role('admin')
);

CREATE POLICY "Proveedores can manage their products" ON public.products
FOR ALL USING (
  proveedor_id = public.get_user_proveedor_id() OR
  public.has_role('admin')
);

-- RLS Policies for sales
CREATE POLICY "Users can view relevant sales" ON public.sales
FOR SELECT USING (
  proveedor_id = public.get_user_proveedor_id() OR
  store_id = public.get_user_store_id() OR
  public.has_role('admin')
);

CREATE POLICY "System can insert sales" ON public.sales
FOR INSERT WITH CHECK (true);

-- RLS Policies for alerts
CREATE POLICY "Users can view relevant alerts" ON public.alerts
FOR SELECT USING (
  proveedor_id = public.get_user_proveedor_id() OR
  store_id = public.get_user_store_id() OR
  public.has_role('admin')
);

CREATE POLICY "Users can update relevant alerts" ON public.alerts
FOR UPDATE USING (
  proveedor_id = public.get_user_proveedor_id() OR
  store_id = public.get_user_store_id() OR
  public.has_role('admin')
);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email,
    'locatario'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();