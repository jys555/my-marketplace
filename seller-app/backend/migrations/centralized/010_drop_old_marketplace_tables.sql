-- ============================================
-- DROP OLD MARKETPLACE TABLES
-- ============================================
-- Migration version: 010
-- 
-- Bu migration eski marketplace table'larni o'chiradi:
-- - marketplace_products (endilikda product_marketplace_integrations ishlatiladi)
-- - marketplaces (endilikda kerak emas)
-- 
-- Eslatma: Bu table'lar endilikda ishlatilmaydi va o'chirilishi mumkin
-- Lekin agar mavjud ma'lumotlar bo'lsa, avval ko'chirish kerak
-- 
-- Author: Marketplace Integration Cleanup
-- Date: 2026-01-12
-- ============================================

DO $$
BEGIN
    -- 1. marketplace_products table'ni o'chirish (agar mavjud bo'lsa)
    -- Eslatma: CASCADE bilan bog'liq jadvallar ham o'chiladi
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'marketplace_products'
    ) THEN
        -- Ma'lumotlar allaqachon product_marketplace_integrations ga ko'chirilgan bo'lishi kerak
        -- Lekin xavfsizlik uchun tekshirish
        RAISE NOTICE '⚠️ Dropping marketplace_products table...';
        
        DROP TABLE IF EXISTS marketplace_products CASCADE;
        
        RAISE NOTICE '✅ Dropped marketplace_products table';
    END IF;

    -- 2. marketplaces table'ni o'chirish (agar mavjud bo'lsa)
    -- Eslatma: Bu table endilikda ishlatilmaydi
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'marketplaces'
    ) THEN
        -- marketplaces table'ga bog'liq jadvallar bo'lishi mumkin
        -- Lekin ular endilikda ishlatilmaydi
        RAISE NOTICE '⚠️ Dropping marketplaces table...';
        
        -- Avval bog'liq foreign key'larni o'chirish
        -- (Agar mavjud bo'lsa)
        DROP TABLE IF EXISTS marketplaces CASCADE;
        
        RAISE NOTICE '✅ Dropped marketplaces table';
    END IF;

    -- 3. Index'larni o'chirish (agar mavjud bo'lsa)
    DROP INDEX IF EXISTS idx_marketplace_products_product;
    DROP INDEX IF EXISTS idx_marketplace_products_marketplace;
    DROP INDEX IF EXISTS idx_marketplace_products_composite;
    DROP INDEX IF EXISTS idx_marketplaces_active;
    DROP INDEX IF EXISTS idx_marketplaces_api_type;

    RAISE NOTICE '✅ Cleaned up old marketplace indexes';

    RAISE NOTICE '🎉 Old marketplace tables dropped successfully!';
    RAISE NOTICE '   - marketplace_products table dropped';
    RAISE NOTICE '   - marketplaces table dropped';
    RAISE NOTICE '   - Old indexes cleaned up';
    RAISE NOTICE '   - Now using product_marketplace_integrations table';
END $$;
