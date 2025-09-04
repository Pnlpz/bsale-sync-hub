-- Script to fix missing Bsale columns in stores table
-- Run this directly in Supabase SQL Editor

-- Check if columns exist and add them if missing
DO $$
BEGIN
    -- Add bsale_store_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'bsale_store_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.stores ADD COLUMN bsale_store_id TEXT;
        RAISE NOTICE 'Added bsale_store_id column to stores table';
    ELSE
        RAISE NOTICE 'bsale_store_id column already exists';
    END IF;

    -- Add bsale_api_token column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'bsale_api_token'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.stores ADD COLUMN bsale_api_token TEXT;
        RAISE NOTICE 'Added bsale_api_token column to stores table';
    ELSE
        RAISE NOTICE 'bsale_api_token column already exists';
    END IF;

    -- Add api_settings column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'api_settings'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.stores ADD COLUMN api_settings JSONB DEFAULT '{}';
        RAISE NOTICE 'Added api_settings column to stores table';
    ELSE
        RAISE NOTICE 'api_settings column already exists';
    END IF;

    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'is_active'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.stores ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
        RAISE NOTICE 'Added is_active column to stores table';
    ELSE
        RAISE NOTICE 'is_active column already exists';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stores_bsale_store_id ON public.stores(bsale_store_id);
CREATE INDEX IF NOT EXISTS idx_stores_is_active ON public.stores(is_active);

-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'stores' 
AND table_schema = 'public'
AND column_name IN ('bsale_store_id', 'bsale_api_token', 'api_settings', 'is_active')
ORDER BY column_name;
