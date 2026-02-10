-- ============================================
-- CREATE FAVORITES TABLE
-- ============================================
-- Migration version: 009
-- Creates the favorites table for Amazing Store wishlist
-- Uses IF NOT EXISTS for idempotency
-- ============================================

-- 1. Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, product_id)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON favorites(product_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_product ON favorites(user_id, product_id);

-- 3. Success message
DO $$
BEGIN
    RAISE NOTICE '✅ favorites table ready';
END $$;
