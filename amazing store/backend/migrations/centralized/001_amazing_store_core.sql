-- ============================================
-- AMAZING STORE CORE TABLES
-- ============================================
-- Bu migration Amazing Store uchun asosiy jadvallarni yaratadi
-- Migration version: 001

-- 0. Users jadvali
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    phone VARCHAR(20),
    cart JSONB DEFAULT '{}',
    favorites INTEGER[] DEFAULT '{}',
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 1. Products jadvali
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name_uz VARCHAR(255) NOT NULL,
    name_ru VARCHAR(255),
    description_uz TEXT,
    description_ru TEXT,
    price NUMERIC(10,2) NOT NULL,
    sale_price NUMERIC(10,2),
    image_url TEXT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sku VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Categories jadvali
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name_uz VARCHAR(255) NOT NULL,
    name_ru VARCHAR(255) NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(20),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Banners jadvali
CREATE TABLE IF NOT EXISTS banners (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    image_url TEXT NOT NULL,
    link_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Orders jadvali
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    order_number VARCHAR(100) UNIQUE,
    total_amount NUMERIC(10,2),
    status VARCHAR(50) DEFAULT 'new',
    payment_method VARCHAR(50),
    delivery_method VARCHAR(50),
    marketplace_id INTEGER, -- Seller App'ga reference (keyinroq qo'shiladi)
    marketplace_order_id VARCHAR(200),
    customer_name VARCHAR(200),
    customer_phone VARCHAR(50),
    customer_address TEXT,
    order_date TIMESTAMP,
    delivery_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. Order Items jadvali
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    marketplace_product_id VARCHAR(200) -- Seller App'ga reference (keyinroq qo'shiladi)
);

-- ============================================
-- INDEXLAR
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Users uchun trigger
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Orders uchun trigger
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DEFAULT DATA
-- ============================================

-- Dastlabki kategoriyalarni qo'shish (faqat bo'sh bo'lsa)
INSERT INTO categories (name_uz, name_ru, icon, color, sort_order)
SELECT * FROM (VALUES
    ('Mevalar', 'Фрукты', '🍎', '#ff6b6b', 1),
    ('Sabzavotlar', 'Овощи', '🥬', '#51cf66', 2),
    ('Sut mahsulotlari', 'Молочные продукты', '🥛', '#4dabf7', 3),
    ('Non mahsulotlari', 'Хлебобулочные изделия', '🍞', '#ffd43b', 4),
    ('Go''sht mahsulotlari', 'Мясные продукты', '🥩', '#f06595', 5),
    ('Ichimliklar', 'Напитки', '🥤', '#20c997', 6)
) AS v(name_uz, name_ru, icon, color, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1);

-- Migration yakunlandi ✅

