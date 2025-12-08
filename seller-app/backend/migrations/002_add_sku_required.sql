-- ============================================
-- SKU MAJBURIY QILISH MIGRATION
-- ============================================
-- Bu migration SKU'ni majburiy va unique qiladi
-- Mavjud SKU'siz tovarlar uchun avtomatik SKU generatsiya qilinadi

-- 1. Mavjud SKU'siz tovarlar uchun avtomatik SKU generatsiya qilish
DO $$
DECLARE
    product_record RECORD;
    new_sku VARCHAR(100);
    sku_counter INTEGER := 1;
BEGIN
    -- Mavjud SKU'siz tovarlar uchun SKU generatsiya qilish
    FOR product_record IN 
        SELECT id FROM products WHERE sku IS NULL OR sku = ''
    LOOP
        -- SKU format: PROD-{ID} yoki PROD-{timestamp}
        new_sku := 'PROD-' || LPAD(product_record.id::text, 6, '0');
        
        -- Agar bu SKU allaqachon mavjud bo'lsa, boshqa format ishlatish
        WHILE EXISTS (SELECT 1 FROM products WHERE sku = new_sku AND id != product_record.id)
        LOOP
            new_sku := 'PROD-' || LPAD(product_record.id::text, 6, '0') || '-' || sku_counter;
            sku_counter := sku_counter + 1;
        END LOOP;
        
        UPDATE products SET sku = new_sku WHERE id = product_record.id;
        sku_counter := 1;
    END LOOP;
    
    RAISE NOTICE 'SKU generated for existing products';
END $$;

-- 2. SKU'ni NOT NULL va UNIQUE qilish
DO $$
BEGIN
    -- Avval UNIQUE constraint qo'shish
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'products_sku_unique' 
        AND conrelid = 'products'::regclass
    ) THEN
        ALTER TABLE products 
        ADD CONSTRAINT products_sku_unique UNIQUE (sku);
        RAISE NOTICE 'products_sku_unique constraint added';
    END IF;
    
    -- Keyin NOT NULL qilish
    ALTER TABLE products 
    ALTER COLUMN sku SET NOT NULL;
    
    RAISE NOTICE 'SKU is now NOT NULL and UNIQUE';
END $$;

-- 3. SKU uchun index qo'shish (performance uchun)
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- Migration yakunlandi ✅

