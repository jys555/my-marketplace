-- ============================================
-- INSERT DEFAULT DATA
-- ============================================
-- Migration version: 003
-- Insert default categories and marketplace
-- ============================================

-- 1. Insert default categories (delete existing and insert fresh)
DO $$
BEGIN
    -- Delete existing categories if any
    DELETE FROM categories WHERE id IN (1, 2, 3, 4, 5, 6, 7, 8);
    
    -- Insert fresh categories
    INSERT INTO categories (id, name_uz, name_ru, icon, color, sort_order, is_active)
    VALUES
        (1, 'Elektronika', 'Электроника', '📱', '#4A90E2', 10, TRUE),
        (2, 'Kiyim', 'Одежда', '👕', '#F5A623', 20, TRUE),
        (3, 'Oziq-ovqat', 'Продукты', '🍎', '#7ED321', 30, TRUE),
        (4, 'Maishiy texnika', 'Бытовая техника', '🏠', '#BD10E0', 40, TRUE),
        (5, 'Sport', 'Спорт', '⚽', '#FF6B6B', 50, TRUE),
        (6, 'Kitoblar', 'Книги', '📚', '#9013FE', 60, TRUE),
        (7, 'O''yinchoqlar', 'Игрушки', '🧸', '#FFD93D', 70, TRUE),
        (8, 'Go''zallik va salomatlik', 'Красота и здоровье', '💄', '#FF85C0', 80, TRUE);
    
    -- Reset sequence to max id + 1
    PERFORM setval('categories_id_seq', (SELECT MAX(id) FROM categories));
    
    RAISE NOTICE '✅ 8 categories inserted successfully';
END $$;

-- 2. Insert Amazing Store marketplace (if not exists)
INSERT INTO marketplaces (
    name,
    slug,
    integration_type,
    api_type,
    marketplace_code,
    webhook_url,
    supports_stock_sync,
    supports_order_sync,
    supports_price_sync,
    is_active,
    auto_sync_enabled,
    default_commission_rate
)
VALUES (
    'AMAZING_STORE',
    'amazing-store',
    'own_platform',
    'amazing_store',
    '202049831',
    NULL,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    0.0
)
ON CONFLICT (name) DO UPDATE SET
    slug = EXCLUDED.slug,
    integration_type = EXCLUDED.integration_type,
    api_type = EXCLUDED.api_type,
    marketplace_code = EXCLUDED.marketplace_code,
    supports_stock_sync = EXCLUDED.supports_stock_sync,
    supports_order_sync = EXCLUDED.supports_order_sync,
    supports_price_sync = EXCLUDED.supports_price_sync;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Default data inserted successfully!';
    RAISE NOTICE '   - 8 categories created';
    RAISE NOTICE '   - AMAZING_STORE marketplace created';
END $$;
