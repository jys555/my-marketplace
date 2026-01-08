-- ============================================
-- UPDATE PRODUCTS TABLE
-- ============================================
-- Migration version: 008
-- Bu migration products table'ga yangi columnlar qo'shadi
-- Best practice: stock tracking, renamed price fields

-- Add stock_quantity column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'stock_quantity'
    ) THEN
        ALTER TABLE products ADD COLUMN stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0);
        RAISE NOTICE '✅ Added stock_quantity column';
    ELSE
        RAISE NOTICE '⏭️  stock_quantity column already exists';
    END IF;
END $$;

-- Rename price to current_price (if needed)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'price'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'current_price'
    ) THEN
        ALTER TABLE products RENAME COLUMN price TO current_price;
        RAISE NOTICE '✅ Renamed price to current_price';
    ELSE
        RAISE NOTICE '⏭️  current_price column already exists or price not found';
    END IF;
END $$;

-- Rename sale_price to current_sale_price (if needed)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'sale_price'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'current_sale_price'
    ) THEN
        ALTER TABLE products RENAME COLUMN sale_price TO current_sale_price;
        RAISE NOTICE '✅ Renamed sale_price to current_sale_price';
    ELSE
        RAISE NOTICE '⏭️  current_sale_price column already exists or sale_price not found';
    END IF;
END $$;

-- Add index for stock_quantity
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_quantity) WHERE stock_quantity > 0;

-- Add index for active products with stock
CREATE INDEX IF NOT EXISTS idx_products_active_stock ON products(is_active, stock_quantity) 
    WHERE is_active = TRUE AND stock_quantity > 0;

-- Update comments
COMMENT ON COLUMN products.stock_quantity IS 'Current stock quantity (0 = out of stock)';
COMMENT ON COLUMN products.current_price IS 'Current selling price (denormalized for performance)';
COMMENT ON COLUMN products.current_sale_price IS 'Current sale/discount price (NULL if not on sale)';

-- Set default stock for existing products
UPDATE products 
SET stock_quantity = 100 
WHERE stock_quantity IS NULL OR stock_quantity = 0;

RAISE NOTICE '🎉 Products table updated successfully!';

