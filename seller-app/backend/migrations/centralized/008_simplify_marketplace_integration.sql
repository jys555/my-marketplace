-- ============================================
-- SIMPLIFY MARKETPLACE INTEGRATION
-- ============================================
-- Migration version: 008
-- 
-- Bu migration marketplace integratsiyasini soddalashtiradi:
-- - Faqat Yandex va Uzum market bilan integratsiya
-- - products table'ga to'g'ridan-to'g'ri columnlar qo'shish
-- - Eski marketplace_products va marketplaces table'larni ignore qilish
-- 
-- Author: Marketplace Integration Simplification
-- Date: 2026-01-12
-- ============================================

DO $$
BEGIN
    -- 1. Yandex Market integratsiyasi uchun columnlar
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'yandex_api_token'
    ) THEN
        ALTER TABLE products 
        ADD COLUMN yandex_api_token TEXT,
        ADD COLUMN yandex_campaign_id VARCHAR(50),
        ADD COLUMN yandex_product_id VARCHAR(200),
        ADD COLUMN yandex_price DECIMAL(10, 2),
        ADD COLUMN yandex_commission_rate DECIMAL(5, 2),
        ADD COLUMN yandex_stock INTEGER DEFAULT 0,
        ADD COLUMN yandex_last_synced_at TIMESTAMP;
        
        RAISE NOTICE '✅ Added Yandex Market columns to products table';
    END IF;

    -- 2. Uzum Market integratsiyasi uchun columnlar
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'uzum_api_token'
    ) THEN
        ALTER TABLE products 
        ADD COLUMN uzum_api_token TEXT,
        ADD COLUMN uzum_product_id VARCHAR(200),
        ADD COLUMN uzum_price DECIMAL(10, 2),
        ADD COLUMN uzum_commission_rate DECIMAL(5, 2),
        ADD COLUMN uzum_stock INTEGER DEFAULT 0,
        ADD COLUMN uzum_last_synced_at TIMESTAMP;
        
        RAISE NOTICE '✅ Added Uzum Market columns to products table';
    END IF;

    -- 3. Index'lar qo'shish (performance uchun)
    CREATE INDEX IF NOT EXISTS idx_products_yandex_product_id 
        ON products(yandex_product_id) WHERE yandex_product_id IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_products_uzum_product_id 
        ON products(uzum_product_id) WHERE uzum_product_id IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_products_yandex_api_token 
        ON products(yandex_api_token) WHERE yandex_api_token IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_products_uzum_api_token 
        ON products(uzum_api_token) WHERE uzum_api_token IS NOT NULL;

    RAISE NOTICE '✅ Added indexes for marketplace integration';

    RAISE NOTICE '🎉 Marketplace integration simplified successfully!';
    RAISE NOTICE '   - Yandex Market columns added';
    RAISE NOTICE '   - Uzum Market columns added';
    RAISE NOTICE '   - Indexes created';
    RAISE NOTICE '   - Old marketplace_products and marketplaces tables are now ignored';
END $$;
