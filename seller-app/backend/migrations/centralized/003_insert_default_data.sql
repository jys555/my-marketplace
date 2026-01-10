-- ============================================
-- INSERT DEFAULT DATA
-- ============================================
-- Migration version: 003
-- Insert default categories and marketplace
-- ============================================

-- 1. Insert default categories
INSERT INTO categories (id, name_uz, name_ru, icon, color, sort_order, is_active)
VALUES
    (1, 'Elektronika', 'Электроника', '📱', '#4A90E2', 10, TRUE),
    (2, 'Kiyim', 'Одежда', '👕', '#F5A623', 20, TRUE),
    (3, 'Oziq-ovqat', 'Продукты', '🍎', '#7ED321', 30, TRUE),
    (4, 'Maishiy texnika', 'Бытовая техника', '🏠', '#BD10E0', 40, TRUE),
    (5, 'Sport', 'Спорт', '⚽', '#FF6B6B', 50, TRUE),
    (6, 'Kitoblar', 'Книги', '📚', '#9013FE', 60, TRUE),
    (7, 'O''yinchoqlar', 'Игрушки', '🧸', '#FFD93D', 70, TRUE),
    (8, 'Go''zallik va salomatlik', 'Красота и здоровье', '💄', '#FF85C0', 80, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name_uz = EXCLUDED.name_uz,
    name_ru = EXCLUDED.name_ru,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    sort_order = EXCLUDED.sort_order;

-- Reset sequence to max id + 1
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));

-- 2. Insert Amazing Store marketplace (if not exists)
INSERT INTO marketplaces (
    name,
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
