-- ============================================
-- PRODUCTS JADVALIGA COST_PRICE VA COMMISSION_RATE QO'SHISH
-- ============================================
-- Bu migration products jadvaliga cost_price va commission_rate qo'shadi
-- va ularni majburiy qiladi
-- Migration version: 005

-- 1. cost_price va commission_rate ustunlarini qo'shish
DO $$
BEGIN
    -- cost_price qo'shish
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='products' AND column_name='cost_price'
    ) THEN
        ALTER TABLE products
        ADD COLUMN cost_price DECIMAL(10, 2);
        RAISE NOTICE 'Added cost_price column to products';
    END IF;

    -- commission_rate qo'shish
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='products' AND column_name='commission_rate'
    ) THEN
        ALTER TABLE products
        ADD COLUMN commission_rate DECIMAL(5, 2);
        RAISE NOTICE 'Added commission_rate column to products';
    END IF;
END $$;

-- 2. Mavjud product_prices dan ma'lumotlarni ko'chirish
-- Har bir product uchun cost_price va commission_rate ni product_prices dan olish
DO $$
DECLARE
    product_record RECORD;
    price_record RECORD;
BEGIN
    FOR product_record IN SELECT id FROM products
    LOOP
        -- product_prices dan cost_price va commission_rate ni olish
        SELECT cost_price, commission_rate INTO price_record
        FROM product_prices
        WHERE product_id = product_record.id
        AND marketplace_id IS NOT NULL
        ORDER BY updated_at DESC
        LIMIT 1;

        -- Agar topilmasa, NULL bo'lgan yozuvni qidirish
        IF price_record.cost_price IS NULL THEN
            SELECT cost_price, commission_rate INTO price_record
            FROM product_prices
            WHERE product_id = product_record.id
            ORDER BY updated_at DESC
            LIMIT 1;
        END IF;

        -- Products jadvaliga yozish
        IF price_record.cost_price IS NOT NULL OR price_record.commission_rate IS NOT NULL THEN
            UPDATE products
            SET 
                cost_price = COALESCE(price_record.cost_price, cost_price),
                commission_rate = COALESCE(price_record.commission_rate, commission_rate)
            WHERE id = product_record.id;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Migrated cost_price and commission_rate from product_prices to products';
END $$;

-- 3. Majburiy qilish (default qiymatlar bilan)
-- Agar cost_price NULL bo'lsa, 0 qilish
UPDATE products
SET cost_price = 0
WHERE cost_price IS NULL;

-- Agar commission_rate NULL bo'lsa, 0 qilish
UPDATE products
SET commission_rate = 0
WHERE commission_rate IS NULL;

-- NOT NULL constraint qo'shish
ALTER TABLE products
ALTER COLUMN cost_price SET NOT NULL,
ALTER COLUMN cost_price SET DEFAULT 0,
ALTER COLUMN commission_rate SET NOT NULL,
ALTER COLUMN commission_rate SET DEFAULT 0;

-- Index qo'shish (performance uchun)
CREATE INDEX IF NOT EXISTS idx_products_cost_price ON products(cost_price);
CREATE INDEX IF NOT EXISTS idx_products_commission_rate ON products(commission_rate);

