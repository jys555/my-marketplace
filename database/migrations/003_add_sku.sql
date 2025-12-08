-- ============================================
-- ADD SKU TO PRODUCTS
-- ============================================
-- Migration version: 003
-- Products jadvaliga SKU ustunini qo'shish va uni majburiy qilish

-- 1. SKU ustunini qo'shish (agar yo'q bo'lsa)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='products' AND column_name='sku'
    ) THEN
        ALTER TABLE products
        ADD COLUMN sku VARCHAR(100);
        RAISE NOTICE 'Products.sku column added';
    END IF;
END $$;

-- 2. Mavjud SKU'siz tovarlar uchun avtomatik SKU generatsiya qilish
DO $$
DECLARE
    product_record RECORD;
    new_sku VARCHAR(100);
    sku_counter INTEGER := 1;
BEGIN
    FOR product_record IN 
        SELECT id FROM products WHERE sku IS NULL OR sku = ''
    LOOP
        new_sku := 'PROD-' || LPAD(product_record.id::text, 6, '0');
        
        WHILE EXISTS (SELECT 1 FROM products WHERE sku = new_sku AND id != product_record.id)
        LOOP
            new_sku := 'PROD-' || LPAD(product_record.id::text, 6, '0') || '-' || sku_counter;
            sku_counter := sku_counter + 1;
        END LOOP;
        
        UPDATE products SET sku = new_sku WHERE id = product_record.id;
        sku_counter := 1;
    END LOOP;
END $$;

-- 3. SKU'ni UNIQUE qilish (agar constraint yo'q bo'lsa)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'products_sku_key' AND conrelid = 'products'::regclass
    ) THEN
        ALTER TABLE products
        ADD CONSTRAINT products_sku_key UNIQUE (sku);
        RAISE NOTICE 'Unique constraint added to products.sku';
    END IF;
END $$;

-- 4. SKU'ni NOT NULL qilish (agar nullable bo'lsa)
DO $$
BEGIN
    IF (SELECT is_nullable FROM information_schema.columns WHERE table_name='products' AND column_name='sku') = 'YES' THEN
        ALTER TABLE products
        ALTER COLUMN sku SET NOT NULL;
        RAISE NOTICE 'Products.sku set to NOT NULL';
    END IF;
END $$;

-- 5. SKU uchun index qo'shish (agar yo'q bo'lsa)
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- Migration yakunlandi ✅

