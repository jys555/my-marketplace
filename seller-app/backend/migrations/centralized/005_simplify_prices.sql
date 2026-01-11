-- ============================================
-- SIMPLIFY PRICE STRUCTURE
-- ============================================
-- Migration version: 005
-- Date: 2026-01-12
-- 
-- Problem: price, sale_price, cost_price in products table
--          BUT also product_prices table with duplicated data
--          This causes confusion and sync issues
-- 
-- Solution: Add service_fee to products, drop redundant tables
-- ============================================

-- 1. Add service_fee to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS service_fee NUMERIC(10, 2) DEFAULT 0;

COMMENT ON COLUMN products.service_fee IS 'Xizmatlar narxi (yetkazish, komissiya va boshqa xarajatlar)';

-- 2. Drop redundant tables
DROP TABLE IF EXISTS product_prices CASCADE;
DROP TABLE IF EXISTS price_history CASCADE;

-- 3. Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Price structure simplified!';
    RAISE NOTICE '   - Added service_fee to products';
    RAISE NOTICE '   - Dropped product_prices table';
    RAISE NOTICE '   - Dropped price_history table';
    RAISE NOTICE '   - All prices now in products table only';
END $$;
