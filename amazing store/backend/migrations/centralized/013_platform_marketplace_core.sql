-- 013_platform_marketplace_core.sql
-- Additive, idempotent core objects for platform-wide identity and marketplace wrapper
-- Safe to run multiple times

BEGIN;

-- Core sellers table (platform-owned bots and contact info)
CREATE TABLE IF NOT EXISTS sellers (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    bot_token TEXT UNIQUE,
    bot_username TEXT UNIQUE,
    telegram_chat_id TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Global customers table (platform identity by Telegram user id)
CREATE TABLE IF NOT EXISTS customers (
    id BIGSERIAL PRIMARY KEY,
    telegram_user_id BIGINT UNIQUE, -- global identity across all bots
    first_name TEXT,
    last_name TEXT,
    username TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Marketplace umbrella order grouping
CREATE TABLE IF NOT EXISTS marketplace_orders (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'processing',
    subtotal_cents INTEGER NOT NULL CHECK (subtotal_cents >= 0),
    delivery_fee_cents INTEGER NOT NULL DEFAULT 0 CHECK (delivery_fee_cents >= 0),
    total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
    payment_status TEXT NOT NULL DEFAULT 'unpaid',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Link table tying marketplace checkout to per-seller orders
CREATE TABLE IF NOT EXISTS marketplace_order_links (
    id BIGSERIAL PRIMARY KEY,
    marketplace_order_id BIGINT NOT NULL REFERENCES marketplace_orders(id) ON DELETE CASCADE,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    seller_id BIGINT NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_customer
  ON marketplace_orders(customer_id);

CREATE INDEX IF NOT EXISTS idx_mo_links_marketplace
  ON marketplace_order_links(marketplace_order_id);

CREATE INDEX IF NOT EXISTS idx_mo_links_order
  ON marketplace_order_links(order_id);

CREATE INDEX IF NOT EXISTS idx_mo_links_seller
  ON marketplace_order_links(seller_id);

COMMIT;

