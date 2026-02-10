-- ============================================
-- CREATE CART_ITEMS TABLE
-- ============================================
-- Migration version: 008
-- Creates the cart_items table for Amazing Store shopping cart
-- Uses IF NOT EXISTS for idempotency
-- ============================================

-- 1. Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    price_snapshot NUMERIC(10,2) NOT NULL,
    
    -- Selection and like status
    is_selected BOOLEAN DEFAULT TRUE,
    is_liked BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, product_id)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_is_selected ON cart_items(is_selected) WHERE is_selected = TRUE;

-- 3. Add is_selected and is_liked columns if table exists but columns don't
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cart_items' AND column_name = 'is_selected'
    ) THEN
        ALTER TABLE cart_items ADD COLUMN is_selected BOOLEAN DEFAULT TRUE;
        RAISE NOTICE '✅ Added is_selected column to cart_items';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cart_items' AND column_name = 'is_liked'
    ) THEN
        ALTER TABLE cart_items ADD COLUMN is_liked BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '✅ Added is_liked column to cart_items';
    END IF;

    RAISE NOTICE '✅ cart_items table ready';
END $$;

-- 4. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_cart_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cart_items_updated_at_trigger ON cart_items;
CREATE TRIGGER cart_items_updated_at_trigger
    BEFORE UPDATE ON cart_items
    FOR EACH ROW
    EXECUTE FUNCTION update_cart_items_updated_at();
