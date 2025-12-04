-- ============================================
-- KATEGORIYALAR TIZIMI - DATABASE MIGRATION
-- ============================================

-- 1. Kategoriyalar jadvali yaratish
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name_uz VARCHAR(255) NOT NULL,
    name_ru VARCHAR(255) NOT NULL,
    icon VARCHAR(50),  -- Emoji yoki icon nomi
    color VARCHAR(20), -- HEX rang (#ff6b6b)
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Products jadvaliga category_id ustuni qo'shish
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;

-- 3. Index qo'shish (tezlik uchun)
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);

-- 4. Dastlabki kategoriyalarni qo'shish
INSERT INTO categories (name_uz, name_ru, icon, color, sort_order) VALUES
('Mevalar', 'Фрукты', '🍎', '#ff6b6b', 1),
('Sabzavotlar', 'Овощи', '🥬', '#51cf66', 2),
('Sut mahsulotlari', 'Молочные продукты', '🥛', '#4dabf7', 3),
('Non mahsulotlari', 'Хлебобулочные изделия', '🍞', '#ffd43b', 4),
('Go''sht mahsulotlari', 'Мясные продукты', '🥩', '#f06595', 5),
('Ichimliklar', 'Напитки', '🥤', '#20c997', 6)
ON CONFLICT DO NOTHING;

-- 5. Trigger - updated_at avtomatik yangilash
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Migration yakunlandi ✅

