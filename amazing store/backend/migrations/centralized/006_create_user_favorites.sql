-- ============================================
-- CREATE USER_FAVORITES TABLE
-- ============================================
-- Migration version: 006
-- Bu migration professional user favorites table yaratadi
-- Best practice: Alohida table metadata bilan

-- User favorites table (users.favorites array'ni almashtiradi)
CREATE TABLE IF NOT EXISTS user_favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Metadata for future features
    notes TEXT,
    priority INTEGER DEFAULT 0, -- wishlist priority (0-10)
    notify_on_sale BOOLEAN DEFAULT FALSE, -- narx tushsa xabar berish
    notify_on_stock BOOLEAN DEFAULT FALSE, -- omborda paydo bo'lsa xabar berish
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Bir user bir mahsulotni faqat bir marta favorite qila oladi
    UNIQUE(user_id, product_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_product_id ON user_favorites(product_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at ON user_favorites(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_favorites_notify_sale ON user_favorites(notify_on_sale) WHERE notify_on_sale = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_favorites_notify_stock ON user_favorites(notify_on_stock) WHERE notify_on_stock = TRUE;

-- Comments for documentation
COMMENT ON TABLE user_favorites IS 'User favorite products with metadata (replaces users.favorites array)';
COMMENT ON COLUMN user_favorites.notes IS 'User notes about this favorite product';
COMMENT ON COLUMN user_favorites.priority IS 'Wishlist priority (0-10, higher = more important)';
COMMENT ON COLUMN user_favorites.notify_on_sale IS 'Send notification when product goes on sale';
COMMENT ON COLUMN user_favorites.notify_on_stock IS 'Send notification when product is back in stock';

-- Data migration: users.favorites array → user_favorites table
-- Faqat agar users.favorites column mavjud bo'lsa
DO $$
DECLARE
    user_record RECORD;
    fav_id INTEGER;
BEGIN
    -- Check if favorites column exists and is array type
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'favorites'
        AND (data_type = 'ARRAY' OR data_type = 'integer[]')
    ) THEN
        RAISE NOTICE '🔄 Migrating favorites from users.favorites array to user_favorites table...';
        
        -- Har bir user uchun favorites array'ni user_favorites table'ga ko'chirish
        FOR user_record IN 
            SELECT id, favorites 
            FROM users 
            WHERE favorites IS NOT NULL AND array_length(favorites, 1) > 0
        LOOP
            -- Har bir favorite product_id uchun
            FOREACH fav_id IN ARRAY user_record.favorites
            LOOP
                -- Insert into user_favorites (ignore duplicates)
                INSERT INTO user_favorites (user_id, product_id, created_at)
                VALUES (user_record.id, fav_id, NOW())
                ON CONFLICT (user_id, product_id) DO NOTHING;
            END LOOP;
            
            RAISE NOTICE '✅ Migrated % favorites for user %', array_length(user_record.favorites, 1), user_record.id;
        END LOOP;
        
        RAISE NOTICE '🎉 Favorites migration completed!';
    ELSE
        RAISE NOTICE '⏭️  No favorites array found, skipping migration...';
    END IF;
END $$;

