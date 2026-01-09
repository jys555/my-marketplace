-- ============================================
-- UPDATE CART_ITEMS TABLE
-- ============================================
-- Migration version: 009
-- Bu migration cart_items table'ga price_snapshot qo'shadi
-- Best practice: Price consistency at checkout

-- Add price_snapshot column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cart_items' AND column_name = 'price_snapshot'
    ) THEN
        ALTER TABLE cart_items ADD COLUMN price_snapshot NUMERIC(10,2);
        RAISE NOTICE '✅ Added price_snapshot column';
    ELSE
        RAISE NOTICE '⏭️  price_snapshot column already exists';
    END IF;
END $$;

-- Update existing cart items with current product prices
UPDATE cart_items ci
SET price_snapshot = COALESCE(p.sale_price, p.price)
FROM products p
WHERE ci.product_id = p.id 
AND ci.price_snapshot IS NULL;

-- Add comment
COMMENT ON COLUMN cart_items.price_snapshot IS 'Price snapshot when item was added to cart (for checkout consistency)';

-- Function to automatically set price_snapshot
CREATE OR REPLACE FUNCTION set_cart_price_snapshot()
RETURNS TRIGGER AS $$
BEGIN
    -- Agar price_snapshot NULL bo'lsa, product'dan olish
    IF NEW.price_snapshot IS NULL THEN
        -- UPDATED: Use new column names (current_price, current_sale_price)
        -- Fallback to old names for backward compatibility during migration
        SELECT COALESCE(
            current_sale_price, 
            current_price,
            sale_price, 
            price
        )
        INTO NEW.price_snapshot
        FROM products
        WHERE id = NEW.product_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set price_snapshot on insert
DROP TRIGGER IF EXISTS set_cart_item_price ON cart_items;
CREATE TRIGGER set_cart_item_price
    BEFORE INSERT ON cart_items
    FOR EACH ROW
    EXECUTE FUNCTION set_cart_price_snapshot();

DO $$
BEGIN
    RAISE NOTICE '🎉 Cart items table updated successfully!';
END $$;

