-- Test Database Functions
-- Run these queries in Supabase SQL Editor to verify the migration was applied correctly

-- 1. Check if the new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('store_locatarios', 'store_providers');

-- 2. Check if the functions exist
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname IN ('get_user_accessible_stores', 'get_locatario_store');

-- 3. Check current user's profile
SELECT id, user_id, name, email, role 
FROM public.profiles 
WHERE user_id = auth.uid();

-- 4. Check if there are any stores
SELECT id, name, address, is_active 
FROM public.stores 
LIMIT 5;

-- 5. Check if there are any store_locatarios relationships
SELECT sl.*, s.name as store_name, p.name as locatario_name
FROM public.store_locatarios sl
LEFT JOIN public.stores s ON sl.store_id = s.id
LEFT JOIN public.profiles p ON sl.locatario_id = p.id
LIMIT 5;

-- 6. Test the get_locatario_store function (replace with your actual user_id)
-- SELECT * FROM public.get_locatario_store(auth.uid());

-- 7. Test the get_user_accessible_stores function
-- SELECT * FROM public.get_user_accessible_stores(auth.uid());
