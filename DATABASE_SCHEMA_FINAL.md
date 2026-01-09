# 🗄️ FINAL DATABASE SCHEMA (MARKETPLACE INTEGRATION)
## My Marketplace - Real Business Logic

---

## 🎯 BUSINESS LOGIC

1. ✅ **Single Store** - Siz o'z mahsulotlaringizni sotasiz (multi-seller yo'q)
2. ✅ **Marketplace Integration** - Turli marketplacelar bilan API orqali bog'lanish
3. ✅ **SKU Mapping** - Har bir mahsulot SKU bilan marketplace'ga map qilingan
4. ✅ **Auto Sync** - Narxlar, stock, buyurtmalar avtomatik sinxronlanadi
5. ✅ **Customer App** - Telegram Mini App (Amazing Store)

---

## 🏗️ CORE TABLES (11 TABLES - Optimized)

### 1️⃣ **USERS** (Customers only)
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    
    -- Profile
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    username VARCHAR(100),
    phone VARCHAR(20),
    
    -- Settings
    language VARCHAR(2) DEFAULT 'uz', -- uz, ru
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP
);

CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
```

**SODDAROQ:**
- Faqat customerlar (role yo'q)
- Email, verification - kerak emas (Telegram orqali)

---

### 2️⃣ **CATEGORIES** (Simple hierarchy)
```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    
    -- Multilang
    name_uz VARCHAR(255) NOT NULL,
    name_ru VARCHAR(255),
    
    -- Hierarchy
    parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    
    -- Display
    icon VARCHAR(50),
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_active ON categories(is_active) WHERE is_active = TRUE;
```

---

### 3️⃣ **PRODUCTS** (Your products)
```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    
    -- SKU (UNIQUE - for marketplace mapping)
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
    
    -- Main image
    image_url TEXT,
    
    -- Stock (master stock)
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metrics
    view_count INTEGER DEFAULT 0,
    order_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = TRUE;
```

**REAL:**
- SKU - asosiy identifier (marketplace mapping uchun)
- image_url - bitta asosiy rasm (sodda)
- Metrics - analytics uchun

---

### 4️⃣ **MARKETPLACES** (External platforms)
```sql
CREATE TABLE marketplaces (
    id SERIAL PRIMARY KEY,
    
    -- Marketplace info
    name VARCHAR(100) NOT NULL, -- Uzum, Wildberries, OZON, etc.
    slug VARCHAR(50) UNIQUE NOT NULL, -- uzum, wildberries, ozon
    
    -- API config
    api_base_url TEXT,
    api_key_encrypted TEXT, -- encrypted
    
    -- Settings
    is_active BOOLEAN DEFAULT TRUE,
    auto_sync_enabled BOOLEAN DEFAULT TRUE,
    sync_interval_minutes INTEGER DEFAULT 60,
    
    -- Last sync
    last_sync_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_marketplaces_active ON marketplaces(is_active) WHERE is_active = TRUE;
```

**YANGI:**
- Marketplace platformalar
- API credentials
- Auto-sync settings

---

### 5️⃣ **MARKETPLACE_PRODUCTS** (SKU Mapping)
```sql
CREATE TABLE marketplace_products (
    id SERIAL PRIMARY KEY,
    
    -- Our product
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Marketplace
    marketplace_id INTEGER NOT NULL REFERENCES marketplaces(id) ON DELETE CASCADE,
    
    -- Marketplace product info
    marketplace_sku VARCHAR(255) NOT NULL, -- Their SKU
    marketplace_product_id VARCHAR(255), -- Their internal ID
    marketplace_url TEXT, -- Product page URL
    
    -- Pricing sync
    marketplace_price NUMERIC(10,2),
    last_price_sync_at TIMESTAMP,
    
    -- Stock sync
    marketplace_stock INTEGER,
    last_stock_sync_at TIMESTAMP,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(product_id, marketplace_id)
);

CREATE INDEX idx_mp_products_product ON marketplace_products(product_id);
CREATE INDEX idx_mp_products_marketplace ON marketplace_products(marketplace_id);
CREATE INDEX idx_mp_products_sku ON marketplace_products(marketplace_sku);
```

**KALIT:**
- Bizning mahsulot ↔ Marketplace mahsulot mapping
- SKU orqali bog'lanish
- Narx va stock sinxronizatsiya

---

### 6️⃣ **CART_ITEMS** (Shopping cart)
```sql
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Quantity
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    
    -- Price snapshot
    price_snapshot NUMERIC(10,2) NOT NULL,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, product_id)
);

CREATE INDEX idx_cart_user ON cart_items(user_id);
CREATE INDEX idx_cart_product ON cart_items(product_id);
```

---

### 7️⃣ **FAVORITES** (Wishlist - SIMPLE)
```sql
CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, product_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_product ON favorites(product_id);
```

**SODDAROQ:**
- notify_on_sale - OLIB TASHLANDI
- notes - OLIB TASHLANDI

---

### 8️⃣ **ORDERS** (All orders - from app & marketplaces)
```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Source
    source VARCHAR(20) DEFAULT 'app', -- app, uzum, wildberries, ozon, etc.
    marketplace_order_id VARCHAR(255), -- If from marketplace
    
    -- Customer
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    
    -- Totals
    subtotal NUMERIC(10,2) NOT NULL,
    delivery_fee NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, shipped, delivered, cancelled
    payment_status VARCHAR(20) DEFAULT 'unpaid', -- unpaid, paid, refunded
    
    -- Delivery
    delivery_address TEXT,
    delivery_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    confirmed_at TIMESTAMP,
    delivered_at TIMESTAMP,
    cancelled_at TIMESTAMP
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_source ON orders(source);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_marketplace ON orders(marketplace_order_id) WHERE marketplace_order_id IS NOT NULL;
```

**YANGILANGAN:**
- `source` - app yoki marketplace
- `marketplace_order_id` - marketplace'dan kelgan buyurtmalar
- `customer_name/phone` - user_id NULL bo'lishi mumkin (marketplace orders)

---

### 9️⃣ **ORDER_ITEMS** (Order details)
```sql
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    
    -- Product snapshot
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100) NOT NULL,
    
    -- Pricing
    price NUMERIC(10,2) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    subtotal NUMERIC(10,2) NOT NULL,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_order_items_sku ON order_items(product_sku);
```

---

### 🔟 **BANNERS** (Marketing)
```sql
CREATE TABLE banners (
    id SERIAL PRIMARY KEY,
    
    -- Content
    title_uz VARCHAR(255),
    title_ru VARCHAR(255),
    image_url TEXT NOT NULL,
    
    -- Link
    link_type VARCHAR(20), -- product, category, url
    link_id INTEGER,
    link_url TEXT,
    
    -- Display
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_banners_active ON banners(is_active) WHERE is_active = TRUE;
```

---

### 1️⃣1️⃣ **SYNC_LOGS** (Marketplace sync history)
```sql
CREATE TABLE sync_logs (
    id SERIAL PRIMARY KEY,
    
    -- Sync info
    marketplace_id INTEGER NOT NULL REFERENCES marketplaces(id) ON DELETE CASCADE,
    sync_type VARCHAR(20) NOT NULL, -- price, stock, orders
    
    -- Status
    status VARCHAR(20) NOT NULL, -- success, error, partial
    
    -- Details
    items_processed INTEGER DEFAULT 0,
    items_failed INTEGER DEFAULT 0,
    error_message TEXT,
    
    -- Duration
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE INDEX idx_sync_logs_marketplace ON sync_logs(marketplace_id);
CREATE INDEX idx_sync_logs_type ON sync_logs(sync_type);
CREATE INDEX idx_sync_logs_started ON sync_logs(started_at DESC);
```

**YANGI:**
- Marketplace sync tracking
- Error logging
- Performance monitoring

---

## 🔄 AUTO-UPDATE TRIGGERS

```sql
-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_marketplaces_updated_at BEFORE UPDATE ON marketplaces 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_marketplace_products_updated_at BEFORE UPDATE ON marketplace_products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON banners 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 📊 SCHEMA CHANGES SUMMARY

### ❌ OLIB TASHLANDI:
1. `sellers` - Multi-vendor yo'q
2. `purchases` - Kerak emas
3. `purchase_items` - Kerak emas
4. `price_history` - Soddalashtirildi (price in products)
5. `inventory_movements` - Soddalashtirildi
6. `product_images` - Soddalashtirildi (image_url in products)

### ✅ QO'SHILDI:
1. `marketplaces` - Marketplace platforms
2. `marketplace_products` - SKU mapping
3. `sync_logs` - Sync tracking

### 🔄 SODDALASHTIRILDI:
1. `users` - Faqat customers
2. `products` - Bitta image_url
3. `favorites` - Notify o'chirildi
4. `orders` - Source va marketplace support

---

## 🎯 ADVANTAGES

✅ **Real Business Logic** - Sizning biznesingizga mos  
✅ **Marketplace Ready** - API integration tayyor  
✅ **Simple** - Keraksiz qismlar yo'q  
✅ **Scalable** - Yangi marketplacelar qo'shish oson  
✅ **Auditable** - Sync logs  
✅ **Clean** - 11 tables only (14 dan 11 ga)  

---

## 📈 MARKETPLACE INTEGRATION WORKFLOW

1. **Setup**: `marketplaces` table'ga Uzum, Wildberries qo'shamiz
2. **Mapping**: `marketplace_products` da SKU mapping qilamiz
3. **Sync**: Cron job har 60 daqiqada:
   - Narxlarni sinxronlaydi
   - Stock'ni sinxronlaydi
   - Yangi buyurtmalarni import qiladi
4. **Orders**: Marketplace'dan kelgan buyurtmalar `orders` table'ga (source='uzum')
5. **Logs**: Barcha sync activity `sync_logs` da

---

## 🚀 EXAMPLE: Uzum Integration

```sql
-- 1. Add Uzum marketplace
INSERT INTO marketplaces (name, slug, api_base_url, is_active) 
VALUES ('Uzum Market', 'uzum', 'https://api.uzum.uz/v1', true);

-- 2. Map your product to Uzum
INSERT INTO marketplace_products (product_id, marketplace_id, marketplace_sku, is_active)
VALUES (1, 1, 'UZUM-12345', true);

-- 3. Sync happens automatically (cron job)
-- - Price updates
-- - Stock updates
-- - New orders import

-- 4. Order from Uzum arrives
INSERT INTO orders (order_number, source, marketplace_order_id, customer_name, customer_phone, total, status)
VALUES ('ORD-2026-001', 'uzum', 'UZUM-ORD-67890', 'Alisher', '+998901234567', 150000, 'pending');
```

---

## ✅ FINAL STRUCTURE

```
USERS (customers)
  ├── CART_ITEMS → PRODUCTS
  ├── FAVORITES → PRODUCTS
  └── ORDERS
      └── ORDER_ITEMS → PRODUCTS

PRODUCTS
  ├── CATEGORIES (hierarchy)
  └── MARKETPLACE_PRODUCTS
      └── MARKETPLACES
          └── SYNC_LOGS

BANNERS (standalone)
```

---

## 🤔 FIKRINGIZ?

1. ✅ **Perfect!** - Migration yaratamiz
2. 🔄 **Yana o'zgartirish** - Nimani?
3. ❓ **Savol** - Qaysi qism?

**Bu schema sizning real biznesingizga mos!** 🎯

