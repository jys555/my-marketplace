-- ============================================
-- SELLER APP TABLES - DATABASE MIGRATION
-- ============================================
-- Bu migration seller app uchun yangi jadvallarni yaratadi
-- Mavjud Amazing Store jadvallariga ta'sir qilmaydi
-- Bir xil database'da saqlanadi (my-marketplace bilan)

-- 1. Marketplaces jadvali
CREATE TABLE IF NOT EXISTS marketplaces (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    api_type VARCHAR(50) NOT NULL, -- 'uzum', 'yandex', 'amazing_store', 'manual'
    api_key TEXT,
    api_secret TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    marketplace_code VARCHAR(50), -- 202049831 kabi
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Marketplace Products (Integratsiya)
CREATE TABLE IF NOT EXISTS marketplace_products (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    marketplace_id INTEGER REFERENCES marketplaces(id) ON DELETE CASCADE,
    marketplace_product_id VARCHAR(200) NOT NULL,
    marketplace_sku VARCHAR(100),
    marketplace_name VARCHAR(500),
    marketplace_price DECIMAL(10, 2),
    marketplace_strikethrough_price DECIMAL(10, 2),
    commission_rate DECIMAL(5, 2), -- foiz
    status VARCHAR(50) DEFAULT 'active',
    last_synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, marketplace_id, marketplace_product_id)
);

-- 3. Purchases (Nakladnoylar)
CREATE TABLE IF NOT EXISTS purchases (
    id SERIAL PRIMARY KEY,
    purchase_date DATE NOT NULL,
    total_amount DECIMAL(10, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER -- user_id (optional)
);

-- 4. Purchase Items
CREATE TABLE IF NOT EXISTS purchase_items (
    id SERIAL PRIMARY KEY,
    purchase_id INTEGER REFERENCES purchases(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    purchase_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Inventory (Ombor holati)
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE UNIQUE,
    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Inventory Movements
CREATE TABLE IF NOT EXISTS inventory_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    purchase_id INTEGER REFERENCES purchases(id) ON DELETE SET NULL,
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    movement_type VARCHAR(50) NOT NULL, -- 'purchase', 'sale', 'return', 'adjustment'
    quantity_change INTEGER NOT NULL,
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Product Prices
CREATE TABLE IF NOT EXISTS product_prices (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    marketplace_id INTEGER REFERENCES marketplaces(id) ON DELETE CASCADE, -- NULL = Amazing Store
    cost_price DECIMAL(10, 2), -- Tannarx
    selling_price DECIMAL(10, 2), -- Sotish narxi
    commission_rate DECIMAL(5, 2), -- Komissiya foizi
    strikethrough_price DECIMAL(10, 2), -- Chizilgan narx
    profitability DECIMAL(10, 2), -- Rentabillik
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, marketplace_id)
);

-- 8. Daily Analytics
CREATE TABLE IF NOT EXISTS daily_analytics (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    marketplace_id INTEGER REFERENCES marketplaces(id) ON DELETE SET NULL, -- NULL = umumiy
    total_orders INTEGER DEFAULT 0,
    total_revenue DECIMAL(10, 2) DEFAULT 0,
    total_cost DECIMAL(10, 2) DEFAULT 0,
    total_profit DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, marketplace_id)
);

-- 9. Product Analytics
CREATE TABLE IF NOT EXISTS product_analytics (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    marketplace_id INTEGER REFERENCES marketplaces(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    orders_count INTEGER DEFAULT 0,
    quantity_sold INTEGER DEFAULT 0,
    quantity_returned INTEGER DEFAULT 0,
    revenue DECIMAL(10, 2) DEFAULT 0,
    cost DECIMAL(10, 2) DEFAULT 0,
    profit DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, marketplace_id, date)
);

-- ============================================
-- INDEXLAR (Performance uchun)
-- ============================================

-- Marketplaces
CREATE INDEX IF NOT EXISTS idx_marketplaces_active ON marketplaces(is_active);
CREATE INDEX IF NOT EXISTS idx_marketplaces_api_type ON marketplaces(api_type);

-- Marketplace Products
CREATE INDEX IF NOT EXISTS idx_marketplace_products_product ON marketplace_products(product_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_marketplace ON marketplace_products(marketplace_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_composite ON marketplace_products(product_id, marketplace_id);

-- Purchases
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_product ON purchase_items(product_id);

-- Inventory
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);

-- Inventory Movements
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_purchase ON inventory_movements(purchase_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_order ON inventory_movements(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_date ON inventory_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(movement_type);

-- Product Prices
CREATE INDEX IF NOT EXISTS idx_product_prices_product ON product_prices(product_id);
CREATE INDEX IF NOT EXISTS idx_product_prices_marketplace ON product_prices(marketplace_id);
CREATE INDEX IF NOT EXISTS idx_product_prices_composite ON product_prices(product_id, marketplace_id);

-- Daily Analytics
CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON daily_analytics(date);
CREATE INDEX IF NOT EXISTS idx_daily_analytics_marketplace ON daily_analytics(marketplace_id);
CREATE INDEX IF NOT EXISTS idx_daily_analytics_composite ON daily_analytics(date, marketplace_id);

-- Product Analytics
CREATE INDEX IF NOT EXISTS idx_product_analytics_product ON product_analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_product_analytics_marketplace ON product_analytics(marketplace_id);
CREATE INDEX IF NOT EXISTS idx_product_analytics_date ON product_analytics(date);
CREATE INDEX IF NOT EXISTS idx_product_analytics_composite ON product_analytics(product_id, marketplace_id, date);

-- ============================================
-- ORDERS va ORDER_ITEMS jadvallarini kengaytirish
-- ============================================

-- Orders jadvaliga yangi ustunlar qo'shish (agar mavjud bo'lsa, o'tkazib yuboriladi)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='orders' AND column_name='marketplace_id'
    ) THEN
        ALTER TABLE orders 
        ADD COLUMN marketplace_id INTEGER REFERENCES marketplaces(id) ON DELETE SET NULL,
        ADD COLUMN marketplace_order_id VARCHAR(200),
        ADD COLUMN customer_name VARCHAR(200),
        ADD COLUMN customer_phone VARCHAR(50),
        ADD COLUMN customer_address TEXT,
        ADD COLUMN order_date TIMESTAMP,
        ADD COLUMN delivery_date TIMESTAMP;
    END IF;
END $$;

-- Order items jadvaliga yangi ustun qo'shish
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='order_items' AND column_name='marketplace_product_id'
    ) THEN
        ALTER TABLE order_items
        ADD COLUMN marketplace_product_id VARCHAR(200);
    END IF;
END $$;

-- Orders uchun indexlar
CREATE INDEX IF NOT EXISTS idx_orders_marketplace ON orders(marketplace_id);
CREATE INDEX IF NOT EXISTS idx_orders_marketplace_order ON orders(marketplace_id, marketplace_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- ============================================
-- TRIGGERS (updated_at avtomatik yangilash)
-- ============================================

-- update_updated_at_column function yaratish (agar mavjud bo'lsa, o'tkazib yuboriladi)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Marketplaces uchun trigger
DROP TRIGGER IF EXISTS update_marketplaces_updated_at ON marketplaces;
CREATE TRIGGER update_marketplaces_updated_at
    BEFORE UPDATE ON marketplaces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Marketplace Products uchun trigger
DROP TRIGGER IF EXISTS update_marketplace_products_updated_at ON marketplace_products;
CREATE TRIGGER update_marketplace_products_updated_at
    BEFORE UPDATE ON marketplace_products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Daily Analytics uchun trigger
DROP TRIGGER IF EXISTS update_daily_analytics_updated_at ON daily_analytics;
CREATE TRIGGER update_daily_analytics_updated_at
    BEFORE UPDATE ON daily_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DEFAULT DATA (Amazing Store marketplace)
-- ============================================

-- Amazing Store'ni marketplace sifatida qo'shish
INSERT INTO marketplaces (name, api_type, marketplace_code, is_active)
VALUES ('AMAZING_STORE', 'amazing_store', '202049831', true)
ON CONFLICT (name) DO NOTHING;

-- Migration yakunlandi ✅

