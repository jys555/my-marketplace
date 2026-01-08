-- ============================================
-- AMAZING STORE CART TABLE
-- ============================================
-- Migration version: 004
-- Bu migration savat (cart) jadvalni yaratadi

-- Cart Items jadvali
-- Bu jadvalda har bir user'ning savatidagi mahsulotlar saqlanadi
CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    is_selected BOOLEAN DEFAULT TRUE, -- Checkout uchun tanlangan/tanlanmagan
    is_liked BOOLEAN DEFAULT FALSE, -- Savat ichida like qilish
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Bir user bir mahsulotni faqat bir marta qo'sha oladi (quantity bilan miqdorni oshiradi)
    UNIQUE(user_id, product_id)
);

-- Index'lar (tezlik uchun)
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_is_selected ON cart_items(is_selected) WHERE is_selected = TRUE;

-- updated_at'ni avtomatik yangilash uchun trigger
CREATE OR REPLACE FUNCTION update_cart_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cart_items_updated_at_trigger
    BEFORE UPDATE ON cart_items
    FOR EACH ROW
    EXECUTE FUNCTION update_cart_items_updated_at();

-- Users jadvalidagi cart JSONB column'ni o'chirish (endi cart_items table ishlatamiz)
-- Lekin bu breaking change, shuning uchun comment qilaman
-- ALTER TABLE users DROP COLUMN IF EXISTS cart;

COMMENT ON TABLE cart_items IS 'Shopping cart items for Amazing Store users';
COMMENT ON COLUMN cart_items.is_selected IS 'Checkbox state - selected for checkout';
COMMENT ON COLUMN cart_items.is_liked IS 'Like/favorite state within cart';

