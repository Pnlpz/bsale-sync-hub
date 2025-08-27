-- Apply Store Creation Permissions Fix
-- Run this in your Supabase SQL editor to fix the 403 error

-- Add INSERT policy for locatarios to create their own stores
CREATE POLICY "Locatarios can create their own stores" ON public.stores
FOR INSERT WITH CHECK (
  -- Allow locatarios to create stores where they are the locatario
  locatario_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND role = 'locatario') OR
  -- Allow admins to create any store
  public.has_role('admin')
);

-- Add UPDATE policy for locatarios to update their own stores
CREATE POLICY "Locatarios can update their own stores" ON public.stores
FOR UPDATE USING (
  -- Allow locatarios to update stores where they are the locatario
  locatario_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
  -- Allow admins to update any store
  public.has_role('admin')
) WITH CHECK (
  -- Ensure they can only set themselves as locatario (prevent privilege escalation)
  locatario_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
  public.has_role('admin')
);

-- Create a function to create stores with elevated privileges
CREATE OR REPLACE FUNCTION public.create_store_for_locatario(
  store_name TEXT,
  store_address TEXT DEFAULT 'Dirección por definir'
)
RETURNS JSONB AS $$
DECLARE
  user_profile_record public.profiles;
  new_store_record public.stores;
  result JSONB;
BEGIN
  -- Get the current user's profile
  SELECT * INTO user_profile_record
  FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1;

  -- Check if user exists and is a locatario
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
  END IF;

  IF user_profile_record.role != 'locatario' AND user_profile_record.role != 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only locatarios can create stores');
  END IF;

  -- Check if user already has a store
  IF user_profile_record.store_id IS NOT NULL THEN
    SELECT * INTO new_store_record
    FROM public.stores
    WHERE id = user_profile_record.store_id;
    
    IF FOUND THEN
      RETURN jsonb_build_object(
        'success', true,
        'store', row_to_json(new_store_record),
        'message', 'User already has a store'
      );
    END IF;
  END IF;

  -- Check if user owns a store by locatario_id
  SELECT * INTO new_store_record
  FROM public.stores
  WHERE locatario_id = user_profile_record.id
  LIMIT 1;

  IF FOUND THEN
    -- Update profile to reference this store
    UPDATE public.profiles
    SET store_id = new_store_record.id
    WHERE id = user_profile_record.id;

    RETURN jsonb_build_object(
      'success', true,
      'store', row_to_json(new_store_record),
      'message', 'Found existing store and linked to profile'
    );
  END IF;

  -- Create new store
  INSERT INTO public.stores (name, address, locatario_id)
  VALUES (store_name, store_address, user_profile_record.id)
  RETURNING * INTO new_store_record;

  -- Update profile to reference the new store
  UPDATE public.profiles
  SET store_id = new_store_record.id
  WHERE id = user_profile_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'store', row_to_json(new_store_record),
    'message', 'Store created successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'code', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
