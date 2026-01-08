-- ============================================
-- CLEANUP OLD COLUMNS
-- ============================================
-- Migration version: 010
-- Bu migration eski, ishlatilmaydigan columnlarni o'chiradi
-- Best practice: Clean database structure

-- Drop users.favorites column (replaced by user_favorites table)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'favorites'
    ) THEN
        ALTER TABLE users DROP COLUMN favorites;
        RAISE NOTICE '✅ Dropped users.favorites column';
    ELSE
        RAISE NOTICE '⏭️  users.favorites column already dropped';
    END IF;
END $$;

-- Drop users.cart column (replaced by cart_items table)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'cart'
    ) THEN
        ALTER TABLE users DROP COLUMN cart;
        RAISE NOTICE '✅ Dropped users.cart column';
    ELSE
        RAISE NOTICE '⏭️  users.cart column already dropped';
    END IF;
END $$;

-- Drop product_prices table if exists (no longer needed)
DROP TABLE IF EXISTS product_prices CASCADE;
RAISE NOTICE '✅ Dropped product_prices table if existed';

-- Drop product_analytics table if exists (can be recreated with better structure later)
DROP TABLE IF EXISTS product_analytics CASCADE;
RAISE NOTICE '✅ Dropped product_analytics table if existed';

RAISE NOTICE '🎉 Database cleanup completed successfully!';
RAISE NOTICE '📊 New structure: user_favorites, price_history, cart_items with price_snapshot';

