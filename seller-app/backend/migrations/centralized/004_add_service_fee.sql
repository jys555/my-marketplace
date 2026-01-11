-- ============================================
-- ADD SERVICE_FEE TO PRODUCT_PRICES
-- ============================================
-- Migration version: 004
-- Date: 2026-01-11
-- ============================================

-- Add service_fee column to product_prices
ALTER TABLE product_prices 
ADD COLUMN IF NOT EXISTS service_fee NUMERIC(10, 2) DEFAULT 0;

-- Update profitability calculation to include service_fee
-- profitability = selling_price - cost_price - service_fee - (selling_price * commission_rate / 100)

COMMENT ON COLUMN product_prices.service_fee IS 'Xizmatlar narxi (yetkazish, komissiya va boshqa xarajatlar)';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ service_fee column added to product_prices table';
END $$;
