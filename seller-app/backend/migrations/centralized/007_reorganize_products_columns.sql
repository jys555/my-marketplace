-- ============================================
-- REORGANIZE PRODUCTS TABLE COLUMNS
-- ============================================
-- Migration version: 007
-- Date: 2026-01-12
-- 
-- Problem: service_fee column is added at the end, but should be 
--          next to price columns for better organization
-- 
-- Solution: PostgreSQL doesn't support column reordering directly,
--           but we can add comments to document the logical grouping
--           Note: Column physical order doesn't affect functionality
-- ============================================

-- Add comment to document the logical column grouping
COMMENT ON TABLE products IS 'Products table with price columns grouped: price, sale_price, cost_price, service_fee';

-- Add column comments to document the logical order
COMMENT ON COLUMN products.price IS 'Original price (strikethrough) - First price column';
COMMENT ON COLUMN products.sale_price IS 'Sale price (current selling price) - Second price column';
COMMENT ON COLUMN products.cost_price IS 'Cost price (purchase price) - Third price column';
COMMENT ON COLUMN products.service_fee IS 'Service fee (commission/shipping) - Fourth price column';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Products table columns documented!';
    RAISE NOTICE '   Logical order: price, sale_price, cost_price, service_fee';
    RAISE NOTICE '   Note: PostgreSQL column physical order does not affect functionality';
END $$;
