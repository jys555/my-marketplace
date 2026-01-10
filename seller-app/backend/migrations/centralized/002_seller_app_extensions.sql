-- ============================================
-- SELLER APP EXTENSIONS TO PROFESSIONAL SCHEMA
-- ============================================
-- Migration version: 002
-- Dependencies: 000_RESET_DATABASE.sql (Amazing Store)
-- 
-- This migration adds Seller App specific tables to the
-- professional schema created by Amazing Store
-- ============================================

-- 1. PURCHASES (Nakladnoylar - Seller App only)
CREATE TABLE IF NOT EXISTS purchases (
    id SERIAL PRIMARY KEY,
    purchase_date DATE NOT NULL,
    supplier_name VARCHAR(200),
    total_amount NUMERIC(10, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER -- user_id (optional)
);

-- 2. PURCHASE_ITEMS
CREATE TABLE IF NOT EXISTS purchase_items (
    id SERIAL PRIMARY KEY,
    purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    purchase_price NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. PRODUCT_PRICES (Price history - Seller App)
-- Note: This is separate from products.price/sale_price
-- Used for marketplace-specific pricing and history
CREATE TABLE IF NOT EXISTS product_prices (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    marketplace_id INTEGER REFERENCES marketplaces(id) ON DELETE CASCADE,
    cost_price NUMERIC(10, 2),
    selling_price NUMERIC(10, 2),
    commission_rate NUMERIC(5, 2),
    strikethrough_price NUMERIC(10, 2),
    profitability NUMERIC(10, 2),
    profitability_percentage NUMERIC(5, 2),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(product_id, marketplace_id)
);

-- 4. DAILY_ANALYTICS (Seller App analytics)
CREATE TABLE IF NOT EXISTS daily_analytics (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    marketplace_id INTEGER REFERENCES marketplaces(id) ON DELETE SET NULL,
    total_orders INTEGER DEFAULT 0,
    total_revenue NUMERIC(10, 2) DEFAULT 0,
    total_cost NUMERIC(10, 2) DEFAULT 0,
    total_profit NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(date, marketplace_id)
);

-- 5. PRODUCT_ANALYTICS (Per-product analytics)
CREATE TABLE IF NOT EXISTS product_analytics (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    marketplace_id INTEGER REFERENCES marketplaces(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    orders_count INTEGER DEFAULT 0,
    quantity_sold INTEGER DEFAULT 0,
    quantity_returned INTEGER DEFAULT 0,
    revenue NUMERIC(10, 2) DEFAULT 0,
    cost NUMERIC(10, 2) DEFAULT 0,
    profit NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(product_id, marketplace_id, date)
);

-- ============================================
-- INDEXES (Performance optimization)
-- ============================================

-- Purchases
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_created ON purchases(created_at DESC);

-- Purchase Items
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_product ON purchase_items(product_id);

-- Product Prices
CREATE INDEX IF NOT EXISTS idx_product_prices_product ON product_prices(product_id);
CREATE INDEX IF NOT EXISTS idx_product_prices_marketplace ON product_prices(marketplace_id);
CREATE INDEX IF NOT EXISTS idx_product_prices_composite ON product_prices(product_id, marketplace_id);
CREATE INDEX IF NOT EXISTS idx_product_prices_updated ON product_prices(updated_at DESC);

-- Daily Analytics
CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON daily_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_analytics_marketplace ON daily_analytics(marketplace_id);
CREATE INDEX IF NOT EXISTS idx_daily_analytics_composite ON daily_analytics(date, marketplace_id);

-- Product Analytics
CREATE INDEX IF NOT EXISTS idx_product_analytics_product ON product_analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_product_analytics_marketplace ON product_analytics(marketplace_id);
CREATE INDEX IF NOT EXISTS idx_product_analytics_date ON product_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_product_analytics_composite ON product_analytics(product_id, marketplace_id, date);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger for daily_analytics updated_at
CREATE TRIGGER update_daily_analytics_updated_at
    BEFORE UPDATE ON daily_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for product_prices updated_at
CREATE TRIGGER update_product_prices_updated_at
    BEFORE UPDATE ON product_prices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Seller App extensions migration completed successfully!';
    RAISE NOTICE '   - purchases table created';
    RAISE NOTICE '   - purchase_items table created';
    RAISE NOTICE '   - product_prices table created';
    RAISE NOTICE '   - daily_analytics table created';
    RAISE NOTICE '   - product_analytics table created';
    RAISE NOTICE '   - All indexes created';
END $$;

