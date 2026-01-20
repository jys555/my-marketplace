-- ============================================
-- ADD MARKETPLACE STRIKETHROUGH PRICE
-- ============================================
-- Migration version: 011
-- 
-- Bu migration marketplace chizilgan narxini saqlash uchun column qo'shadi
-- 
-- Author: Marketplace Integration Enhancement
-- Date: 2026-01-12
-- ============================================

DO $$
BEGIN
    -- marketplace_strikethrough_price column qo'shish
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_marketplace_integrations' 
        AND column_name = 'marketplace_strikethrough_price'
    ) THEN
        ALTER TABLE product_marketplace_integrations 
        ADD COLUMN marketplace_strikethrough_price DECIMAL(10, 2);
        
        RAISE NOTICE '✅ Added marketplace_strikethrough_price column';
    END IF;

    RAISE NOTICE '🎉 Marketplace strikethrough price column added successfully!';
END $$;
