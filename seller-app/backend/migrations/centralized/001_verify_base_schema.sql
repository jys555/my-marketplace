-- ============================================
-- VERIFY BASE SCHEMA (DO NOTHING)
-- ============================================
-- Migration version: 001
-- 
-- This migration is a placeholder that verifies the base schema exists.
-- The actual schema is created by Amazing Store's 000_RESET_DATABASE.sql
-- 
-- This migration will succeed even if tables already exist (IF NOT EXISTS)
-- ============================================

-- Verify that core tables exist (will not fail if they do)
DO $$
BEGIN
    -- Check if core tables exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        RAISE EXCEPTION 'products table does not exist - run Amazing Store migrations first!';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE EXCEPTION 'users table does not exist - run Amazing Store migrations first!';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
        RAISE EXCEPTION 'categories table does not exist - run Amazing Store migrations first!';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory') THEN
        RAISE EXCEPTION 'inventory table does not exist - run Amazing Store migrations first!';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'marketplaces') THEN
        RAISE EXCEPTION 'marketplaces table does not exist - run Amazing Store migrations first!';
    END IF;
    
    RAISE NOTICE '✅ Base schema verification passed - all core tables exist';
END $$;

