-- ============================================
-- REMOVE REDUNDANT PROFITABILITY COLUMN
-- ============================================
-- Migration version: 006
-- Date: 2026-01-12
-- 
-- Profitability should be CALCULATED in frontend, not stored!
-- Formula: (sale_price - cost_price - service_fee) / sale_price * 100
-- ============================================

-- Remove profitability_percentage from products (if exists)
ALTER TABLE products 
DROP COLUMN IF EXISTS profitability_percentage CASCADE;

-- Ensure service_fee exists and has correct default
ALTER TABLE products 
ALTER COLUMN service_fee SET DEFAULT 0,
ALTER COLUMN service_fee SET NOT NULL;

-- Update existing NULL service_fee to 0
UPDATE products SET service_fee = 0 WHERE service_fee IS NULL;

DO $$
BEGIN
    RAISE NOTICE '✅ Cleanup completed!';
    RAISE NOTICE '   - Removed profitability_percentage (calculated in frontend)';
    RAISE NOTICE '   - Ensured service_fee is NOT NULL with default 0';
END $$;
