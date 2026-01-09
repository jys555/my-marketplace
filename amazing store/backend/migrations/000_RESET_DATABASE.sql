-- ============================================
-- COMPLETE DATABASE RESET & PROFESSIONAL SCHEMA
-- ============================================
-- Migration version: 000 (RESET)
-- 
-- CAUTION: This migration will DROP ALL existing tables and data
-- and create a new professional, event-driven schema
-- 
-- Author: Professional Database Refactoring
-- Date: 2026-01-09
-- ============================================

-- ============================================
-- STEP 1: DROP ALL EXISTING TABLES
-- ============================================

-- Drop tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS marketplace_webhooks CASCADE;
DROP TABLE IF EXISTS sync_logs CASCADE;
DROP TABLE IF EXISTS inventory_movements CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS product_analytics CASCADE;
DROP TABLE IF EXISTS daily_analytics CASCADE;
DROP TABLE IF EXISTS purchase_items CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS product_prices CASCADE;
DROP TABLE IF EXISTS marketplace_products CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS banners CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS marketplaces CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS schema_migrations CASCADE;

-- Drop functions and triggers
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS track_price_change() CASCADE;
DROP FUNCTION IF EXISTS set_cart_price_snapshot() CASCADE;

-- ============================================
-- STEP 2: CREATE PROFESSIONAL SCHEMA
-- ============================================

-- 1. USERS (Customers & Admins)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    
    -- Profile
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    username VARCHAR(100),
    phone VARCHAR(20),
    
    -- Settings
    language VARCHAR(2) DEFAULT 'uz',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP
);

-- 2. CATEGORIES (Hierarchical)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    
    -- Multilang
    name_uz VARCHAR(255) NOT NULL,
    name_ru VARCHAR(255),
    
    -- Hierarchy
    parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    
    -- Display
    icon VARCHAR(50),
    color VARCHAR(20),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. PRODUCTS (Master catalog)
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    
    -- Identifiers
    sku VARCHAR(100) UNIQUE NOT NULL,
    barcode VARCHAR(100),
    
    -- Multilang
    name_uz VARCHAR(255) NOT NULL,
    name_ru VARCHAR(255),
    description_uz TEXT,
    description_ru TEXT,
    
    -- Category
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    
    -- Pricing
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    sale_price NUMERIC(10,2) CHECK (sale_price IS NULL OR sale_price >= 0),
    cost_price NUMERIC(10,2) CHECK (cost_price IS NULL OR cost_price >= 0),
    profitability_percentage NUMERIC(5,2),
    
    -- Image
    image_url TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metrics
    view_count INTEGER DEFAULT 0,
    order_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. INVENTORY (Unified stock)
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Stock
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    
    -- Timestamps
    last_updated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. INVENTORY_MOVEMENTS (Stock history)
CREATE TABLE inventory_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Movement
    movement_type VARCHAR(20) NOT NULL,
    quantity_change INTEGER NOT NULL,
    
    -- Balance
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    
    -- Reference
    reference_type VARCHAR(20),
    reference_id INTEGER,
    
    -- Platform
    marketplace_id INTEGER,
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. MARKETPLACES (All platforms)
CREATE TABLE marketplaces (
    id SERIAL PRIMARY KEY,
    
    -- Info
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(50) UNIQUE NOT NULL,
    
    -- Integration type
    integration_type VARCHAR(20) NOT NULL,
    
    -- API config
    api_type VARCHAR(50),
    api_key_encrypted TEXT,
    api_secret_encrypted TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    marketplace_code VARCHAR(50),
    
    -- Webhook config (Event-driven)
    webhook_url TEXT,
    webhook_secret TEXT,
    supports_webhooks BOOLEAN DEFAULT FALSE,
    webhook_enabled BOOLEAN DEFAULT FALSE,
    
    -- Features
    supports_stock_sync BOOLEAN DEFAULT FALSE,
    supports_order_sync BOOLEAN DEFAULT FALSE,
    supports_price_sync BOOLEAN DEFAULT FALSE,
    
    -- Settings
    is_active BOOLEAN DEFAULT TRUE,
    auto_sync_enabled BOOLEAN DEFAULT FALSE,
    sync_interval_minutes INTEGER DEFAULT 60,
    
    -- Commission
    default_commission_rate NUMERIC(5,2),
    
    -- Last sync
    last_sync_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 7. MARKETPLACE_PRODUCTS (SKU Mapping)
CREATE TABLE marketplace_products (
    id SERIAL PRIMARY KEY,
    
    -- Our product
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Platform
    marketplace_id INTEGER NOT NULL REFERENCES marketplaces(id) ON DELETE CASCADE,
    
    -- Marketplace info
    marketplace_product_id VARCHAR(200) NOT NULL,
    marketplace_sku VARCHAR(100),
    marketplace_name VARCHAR(500),
    
    -- Pricing (from marketplace API)
    marketplace_price NUMERIC(10,2),
    marketplace_strikethrough_price NUMERIC(10,2),
    
    -- Stock (from marketplace API) - for analytics
    marketplace_stock INTEGER DEFAULT 0,
    previous_stock INTEGER DEFAULT 0,
    stock_last_synced_at TIMESTAMP,
    
    -- Price editability
    price_editable BOOLEAN DEFAULT FALSE,
    
    -- Commission
    commission_rate NUMERIC(5,2),
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',
    
    -- Sync
    last_synced_at TIMESTAMP,
    sync_status VARCHAR(20) DEFAULT 'pending',
    sync_error TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(product_id, marketplace_id)
);

-- 8. CART_ITEMS (Shopping cart)
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    price_snapshot NUMERIC(10,2) NOT NULL,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, product_id)
);

-- 9. FAVORITES (Wishlist)
CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, product_id)
);

-- 10. ORDERS (All orders - unified)
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Source platform
    marketplace_id INTEGER NOT NULL REFERENCES marketplaces(id) ON DELETE RESTRICT,
    marketplace_order_id VARCHAR(200),
    
    -- Customer
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(200) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_address TEXT,
    
    -- Totals
    subtotal NUMERIC(10,2) NOT NULL,
    delivery_fee NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending',
    payment_status VARCHAR(20) DEFAULT 'unpaid',
    payment_method VARCHAR(50),
    
    -- Analytics
    total_cost NUMERIC(10,2),
    total_profit NUMERIC(10,2),
    
    -- Dates
    order_date TIMESTAMP DEFAULT NOW(),
    delivery_date TIMESTAMP,
    confirmed_at TIMESTAMP,
    delivered_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 11. ORDER_ITEMS (Order details)
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    
    -- Product snapshot
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100) NOT NULL,
    marketplace_product_id VARCHAR(200),
    
    -- Pricing
    price NUMERIC(10,2) NOT NULL,
    cost_price NUMERIC(10,2),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    subtotal NUMERIC(10,2) NOT NULL,
    profit NUMERIC(10,2),
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- 12. BANNERS (Marketing)
CREATE TABLE banners (
    id SERIAL PRIMARY KEY,
    
    -- Content
    title_uz VARCHAR(255),
    title_ru VARCHAR(255),
    image_url TEXT NOT NULL,
    
    -- Link
    link_type VARCHAR(20),
    link_id INTEGER,
    link_url TEXT,
    
    -- Display
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 13. MARKETPLACE_WEBHOOKS (Webhook history - Event-driven)
CREATE TABLE marketplace_webhooks (
    id SERIAL PRIMARY KEY,
    
    -- Webhook info
    marketplace_id INTEGER NOT NULL REFERENCES marketplaces(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    
    -- Payload
    payload JSONB NOT NULL,
    signature VARCHAR(500),
    
    -- Processing
    status VARCHAR(20) DEFAULT 'pending',
    processed_at TIMESTAMP,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- 14. SYNC_LOGS (Sync history)
CREATE TABLE sync_logs (
    id SERIAL PRIMARY KEY,
    
    -- Sync info
    marketplace_id INTEGER NOT NULL REFERENCES marketplaces(id) ON DELETE CASCADE,
    sync_type VARCHAR(20) NOT NULL,
    direction VARCHAR(10) NOT NULL,
    trigger_type VARCHAR(20) DEFAULT 'webhook',
    
    -- Status
    status VARCHAR(20) NOT NULL,
    
    -- Details
    items_processed INTEGER DEFAULT 0,
    items_failed INTEGER DEFAULT 0,
    error_message TEXT,
    
    -- Duration
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    duration_ms INTEGER
);

-- ============================================
-- STEP 3: CREATE INDEXES
-- ============================================

-- Users
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_admin ON users(is_admin) WHERE is_admin = TRUE;

-- Categories
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_active ON categories(is_active) WHERE is_active = TRUE;

-- Products
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;

-- Inventory
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_inventory_quantity ON inventory(quantity) WHERE quantity > 0;

-- Inventory Movements
CREATE INDEX idx_inv_movements_product ON inventory_movements(product_id);
CREATE INDEX idx_inv_movements_type ON inventory_movements(movement_type);
CREATE INDEX idx_inv_movements_marketplace ON inventory_movements(marketplace_id);
CREATE INDEX idx_inv_movements_created ON inventory_movements(created_at DESC);

-- Marketplaces
CREATE INDEX idx_marketplaces_integration ON marketplaces(integration_type);
CREATE INDEX idx_marketplaces_active ON marketplaces(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_marketplaces_slug ON marketplaces(slug);
CREATE INDEX idx_marketplaces_webhooks ON marketplaces(webhook_enabled) WHERE webhook_enabled = TRUE;

-- Marketplace Products
CREATE INDEX idx_mp_products_product ON marketplace_products(product_id);
CREATE INDEX idx_mp_products_marketplace ON marketplace_products(marketplace_id);
CREATE INDEX idx_mp_products_mp_id ON marketplace_products(marketplace_product_id);
CREATE INDEX idx_mp_products_status ON marketplace_products(status);
CREATE INDEX idx_mp_products_stock ON marketplace_products(marketplace_stock);

-- Cart
CREATE INDEX idx_cart_user ON cart_items(user_id);
CREATE INDEX idx_cart_product ON cart_items(product_id);

-- Favorites
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_product ON favorites(product_id);

-- Orders
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_marketplace ON orders(marketplace_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_mp_order ON orders(marketplace_order_id) WHERE marketplace_order_id IS NOT NULL;
CREATE INDEX idx_orders_date ON orders(order_date DESC);

-- Order Items
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_order_items_sku ON order_items(product_sku);

-- Banners
CREATE INDEX idx_banners_active ON banners(is_active) WHERE is_active = TRUE;

-- Webhooks
CREATE INDEX idx_webhooks_marketplace ON marketplace_webhooks(marketplace_id);
CREATE INDEX idx_webhooks_status ON marketplace_webhooks(status) WHERE status = 'pending';
CREATE INDEX idx_webhooks_event ON marketplace_webhooks(event_type);
CREATE INDEX idx_webhooks_created ON marketplace_webhooks(created_at DESC);

-- Sync Logs
CREATE INDEX idx_sync_logs_marketplace ON sync_logs(marketplace_id);
CREATE INDEX idx_sync_logs_type ON sync_logs(sync_type);
CREATE INDEX idx_sync_logs_trigger ON sync_logs(trigger_type);
CREATE INDEX idx_sync_logs_status ON sync_logs(status);
CREATE INDEX idx_sync_logs_started ON sync_logs(started_at DESC);

-- ============================================
-- STEP 4: CREATE TRIGGERS
-- ============================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_marketplaces_updated_at 
    BEFORE UPDATE ON marketplaces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_marketplace_products_updated_at 
    BEFORE UPDATE ON marketplace_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_cart_items_updated_at 
    BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_banners_updated_at 
    BEFORE UPDATE ON banners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 5: CREATE MIGRATION TRACKING TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    executed_at TIMESTAMP DEFAULT NOW()
);

-- Mark this migration as executed (idempotent)
INSERT INTO schema_migrations (version, name, executed_at) 
VALUES (0, '000_RESET_DATABASE.sql', NOW())
ON CONFLICT (version) DO UPDATE 
SET executed_at = NOW(), name = EXCLUDED.name;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🎉 DATABASE RESET COMPLETE!';
    RAISE NOTICE '✅ 14 tables created';
    RAISE NOTICE '✅ All indexes created';
    RAISE NOTICE '✅ All triggers created';
    RAISE NOTICE '🚀 Professional event-driven schema ready!';
END $$;

