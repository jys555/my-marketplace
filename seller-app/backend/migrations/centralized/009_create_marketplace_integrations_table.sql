-- ============================================
-- CREATE MARKETPLACE INTEGRATIONS TABLE
-- ============================================
-- Migration version: 009
-- 
-- Bu migration:
-- 1. products table'dan Yandex va Uzum columnlarini olib tashlaydi
-- 2. Yangi product_marketplace_integrations table yaratadi
-- 3. Ma'lumotlarni ko'chiradi
-- 4. Eski marketplace table'larni o'chiradi (agar mavjud bo'lsa)
-- 
-- Author: Marketplace Integration Simplification
-- Date: 2026-01-12
-- ============================================

-- 1. Yangi table yaratish: product_marketplace_integrations
CREATE TABLE IF NOT EXISTS product_marketplace_integrations (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Marketplace type
    marketplace_type VARCHAR(20) NOT NULL CHECK (marketplace_type IN ('yandex', 'uzum')),
    
    -- API credentials
    api_token TEXT,
    campaign_id VARCHAR(50), -- Faqat Yandex uchun
    
    -- Marketplace product info
    marketplace_product_id VARCHAR(200),
    
    -- Marketplace data (READ only - API'dan o'qiladi)
    marketplace_price DECIMAL(10, 2),
    marketplace_commission_rate DECIMAL(5, 2),
    
    -- Stock (2-way: o'qish va yangilash)
    marketplace_stock INTEGER DEFAULT 0,
    
    -- Sync tracking
    last_synced_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Har bir product uchun faqat bitta Yandex va bitta Uzum bo'lishi kerak
    UNIQUE(product_id, marketplace_type)
);

-- 2. Index'lar qo'shish
CREATE INDEX IF NOT EXISTS idx_product_marketplace_integrations_product 
    ON product_marketplace_integrations(product_id);

CREATE INDEX IF NOT EXISTS idx_product_marketplace_integrations_type 
    ON product_marketplace_integrations(marketplace_type);

CREATE INDEX IF NOT EXISTS idx_product_marketplace_integrations_product_id 
    ON product_marketplace_integrations(marketplace_product_id) 
    WHERE marketplace_product_id IS NOT NULL;

-- 3. Trigger function yaratish (updated_at avtomatik yangilash)
CREATE OR REPLACE FUNCTION update_product_marketplace_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_product_marketplace_integrations_updated_at_trigger 
    ON product_marketplace_integrations;

CREATE TRIGGER update_product_marketplace_integrations_updated_at_trigger
    BEFORE UPDATE ON product_marketplace_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_product_marketplace_integrations_updated_at();

-- 4. Ma'lumotlarni ko'chirish va column'larni o'chirish (DO blokida)
DO $$
BEGIN
    -- products table'dan Yandex columnlarini ko'chirish va o'chirish
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'yandex_api_token'
    ) THEN
        -- Ma'lumotlarni ko'chirish
        INSERT INTO product_marketplace_integrations (
            product_id, marketplace_type, api_token, campaign_id, 
            marketplace_product_id, marketplace_price, marketplace_commission_rate, 
            marketplace_stock, last_synced_at
        )
        SELECT 
            id, 'yandex', yandex_api_token, yandex_campaign_id,
            yandex_product_id, yandex_price, yandex_commission_rate,
            yandex_stock, yandex_last_synced_at
        FROM products
        WHERE yandex_api_token IS NOT NULL 
           OR yandex_campaign_id IS NOT NULL 
           OR yandex_product_id IS NOT NULL
        ON CONFLICT (product_id, marketplace_type) DO UPDATE SET
            api_token = EXCLUDED.api_token,
            campaign_id = EXCLUDED.campaign_id,
            marketplace_product_id = EXCLUDED.marketplace_product_id,
            marketplace_price = EXCLUDED.marketplace_price,
            marketplace_commission_rate = EXCLUDED.marketplace_commission_rate,
            marketplace_stock = EXCLUDED.marketplace_stock,
            last_synced_at = EXCLUDED.last_synced_at,
            updated_at = NOW();

        RAISE NOTICE '✅ Migrated Yandex data from products table';

        -- Column'larni o'chirish
        ALTER TABLE products 
        DROP COLUMN IF EXISTS yandex_api_token,
        DROP COLUMN IF EXISTS yandex_campaign_id,
        DROP COLUMN IF EXISTS yandex_product_id,
        DROP COLUMN IF EXISTS yandex_price,
        DROP COLUMN IF EXISTS yandex_commission_rate,
        DROP COLUMN IF EXISTS yandex_stock,
        DROP COLUMN IF EXISTS yandex_last_synced_at;

        RAISE NOTICE '✅ Removed Yandex columns from products table';
    END IF;

    -- products table'dan Uzum columnlarini ko'chirish va o'chirish
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'uzum_api_token'
    ) THEN
        -- Ma'lumotlarni ko'chirish
        INSERT INTO product_marketplace_integrations (
            product_id, marketplace_type, api_token, 
            marketplace_product_id, marketplace_price, marketplace_commission_rate, 
            marketplace_stock, last_synced_at
        )
        SELECT 
            id, 'uzum', uzum_api_token,
            uzum_product_id, uzum_price, uzum_commission_rate,
            uzum_stock, uzum_last_synced_at
        FROM products
        WHERE uzum_api_token IS NOT NULL 
           OR uzum_product_id IS NOT NULL
        ON CONFLICT (product_id, marketplace_type) DO UPDATE SET
            api_token = EXCLUDED.api_token,
            marketplace_product_id = EXCLUDED.marketplace_product_id,
            marketplace_price = EXCLUDED.marketplace_price,
            marketplace_commission_rate = EXCLUDED.marketplace_commission_rate,
            marketplace_stock = EXCLUDED.marketplace_stock,
            last_synced_at = EXCLUDED.last_synced_at,
            updated_at = NOW();

        RAISE NOTICE '✅ Migrated Uzum data from products table';

        -- Column'larni o'chirish
        ALTER TABLE products 
        DROP COLUMN IF EXISTS uzum_api_token,
        DROP COLUMN IF EXISTS uzum_product_id,
        DROP COLUMN IF EXISTS uzum_price,
        DROP COLUMN IF EXISTS uzum_commission_rate,
        DROP COLUMN IF EXISTS uzum_stock,
        DROP COLUMN IF EXISTS uzum_last_synced_at;

        RAISE NOTICE '✅ Removed Uzum columns from products table';
    END IF;

    RAISE NOTICE '🎉 Marketplace integrations table created successfully!';
    RAISE NOTICE '   - product_marketplace_integrations table created';
    RAISE NOTICE '   - Data migrated from products table';
    RAISE NOTICE '   - Old columns removed from products table';
    RAISE NOTICE '   - Indexes and triggers created';
END $$;

-- Eslatma: Eski marketplace_products va marketplaces table'lar 
-- hozircha o'chirilmaydi (backward compatibility uchun)
-- Lekin ular endi ishlatilmaydi va keyinroq o'chirilishi mumkin
