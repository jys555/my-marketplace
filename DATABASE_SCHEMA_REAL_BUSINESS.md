# 🗄️ REAL BUSINESS LOGIC - FINAL DATABASE SCHEMA
## My Marketplace - Unified Stock & Multi-Platform Integration

---

## 🎯 BUSINESS LOGIC (Real Requirements)

### 3 TURDAGI SOTUV TARMOG'I:

#### 1️⃣ **API PLATFORMALAR** (Uzum, Wildberries, OZON, etc.)
✅ **Stock sinxronizatsiya** (2-taraflama):
- Bizdan → Marketplace: stock yangilanishi
- Marketplace → Bizga: buyurtma bo'lsa stock kamayadi
- Marketplace → Bizga: bekor qilinsa stock ortadi

✅ **Narx** - **READ-ONLY** (faqat show):
- Marketplaceda narx o'zgarsa → bizga yangilanadi
- Biz narxni **edit qila olmaymiz**
- Faqat ko'rsatish uchun

✅ **Buyurtma** - **AUTO SYNC**:
- Marketplace'dan buyurtma → avtomatik import
- Stock avtomatik kamayadi
- Analytics hisoblanadi

#### 2️⃣ **MANUAL PLATFORMALAR** (OLX, Bir-Bir, etc.)
✅ **E'lon** - qo'lda:
- Odamlar telefon orqali bog'lanadi
- Admin Seller App'da **qo'lda zakas yaratadi**
- Platform tanlaydi (OLX, Bir-Bir)

✅ **Narx** - **EDITABLE**:
- Seller App'da edit qilish mumkin
- Bu narxlar **hech qayerga yuborilmaydi**
- Faqat analytics uchun

✅ **Stock** - yagona ombordan:
- Buyurtma yaratilsa → stock kamayadi

#### 3️⃣ **AMAZING STORE** (Bizning platformamiz)
✅ **To'liq boshqaruv**:
- Seller App - admin panel
- Har qanday edit → Amazing Store'ga avtomatik yuboriladi
- Stock, narx, ma'lumotlar **to'liq sinxron**

✅ **Auto status**:
- Stock 0 bo'lsa → mahsulot **inactive**
- Stock > 0 bo'lsa → mahsulot **active**

✅ **Yangi mahsulot**:
- Seller App'da yaratish mumkin

---

## 🏗️ OPTIMIZED DATABASE SCHEMA (12 TABLES)

### 1️⃣ **USERS** (Customers - Amazing Store)
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
    language VARCHAR(2) DEFAULT 'uz',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE, -- Seller App access
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP
);

CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_admin ON users(is_admin) WHERE is_admin = TRUE;
```

---

### 2️⃣ **CATEGORIES** (Hierarchical)
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
    color VARCHAR(20),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_active ON categories(is_active) WHERE is_active = TRUE;
```

---

### 3️⃣ **PRODUCTS** (Master catalog)
```sql
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
    
    -- Pricing (for Amazing Store & Manual platforms)
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    sale_price NUMERIC(10,2) CHECK (sale_price IS NULL OR sale_price >= 0),
    cost_price NUMERIC(10,2) CHECK (cost_price IS NULL OR cost_price >= 0),
    profitability_percentage NUMERIC(5,2), -- Rentabellik %
    
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

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
```

**IMPORTANT:**
- `price`, `sale_price` - Amazing Store va Manual platforms uchun (editable)
- `cost_price` - tannarx (analytics uchun)
- `profitability_percentage` - rentabellik (auto-calculated)

---

### 4️⃣ **INVENTORY** (Unified stock - Yagona ombor)
```sql
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Stock
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    
    -- Available = quantity - reserved_quantity
    -- Auto-calculated in queries
    
    -- Timestamps
    last_updated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_inventory_quantity ON inventory(quantity) WHERE quantity > 0;
```

**KEY POINT:**
- **Yagona ombor** - barcha platformalar uchun
- Stock kamayganda/ortganda → barcha API platformalarga sinxron

---

### 5️⃣ **INVENTORY_MOVEMENTS** (Stock history)
```sql
CREATE TABLE inventory_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Movement
    movement_type VARCHAR(20) NOT NULL, -- 'sale', 'return', 'adjustment', 'cancel'
    quantity_change INTEGER NOT NULL, -- +5 or -3
    
    -- Balance
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    
    -- Reference (source)
    reference_type VARCHAR(20), -- 'order', 'adjustment'
    reference_id INTEGER, -- order_id
    
    -- Platform
    marketplace_id INTEGER REFERENCES marketplaces(id), -- qaysi platformadan
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_inv_movements_product ON inventory_movements(product_id);
CREATE INDEX idx_inv_movements_type ON inventory_movements(movement_type);
CREATE INDEX idx_inv_movements_marketplace ON inventory_movements(marketplace_id);
CREATE INDEX idx_inv_movements_created ON inventory_movements(created_at DESC);
```

**WHY:**
- To'liq stock tarix
- Qaysi platformadan buyurtma kelganini tracking

---

### 6️⃣ **MARKETPLACES** (All platforms)
```sql
CREATE TABLE marketplaces (
    id SERIAL PRIMARY KEY,
    
    -- Info
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(50) UNIQUE NOT NULL, -- 'uzum', 'wildberries', 'olx', 'amazing_store'
    
    -- Integration type
    integration_type VARCHAR(20) NOT NULL, -- 'api', 'manual', 'own'
    
    -- API config (for 'api' type only)
    api_type VARCHAR(50), -- 'uzum', 'wildberries', 'ozon', etc.
    api_key_encrypted TEXT,
    api_secret_encrypted TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    marketplace_code VARCHAR(50),
    
    -- Webhook config (EVENT-DRIVEN - Real-time)
    webhook_url TEXT, -- Bizning webhook URL (for receiving from marketplace)
    webhook_secret TEXT, -- Secret for signature verification
    supports_webhooks BOOLEAN DEFAULT FALSE, -- Platform supports webhooks
    webhook_enabled BOOLEAN DEFAULT FALSE, -- Webhooks active
    
    -- Features
    supports_stock_sync BOOLEAN DEFAULT FALSE,
    supports_order_sync BOOLEAN DEFAULT FALSE,
    supports_price_sync BOOLEAN DEFAULT FALSE,
    
    -- Settings
    is_active BOOLEAN DEFAULT TRUE,
    auto_sync_enabled BOOLEAN DEFAULT FALSE,
    sync_interval_minutes INTEGER DEFAULT 60, -- Fallback polling (if no webhook)
    
    -- Commission
    default_commission_rate NUMERIC(5,2), -- %
    
    -- Last sync
    last_sync_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_marketplaces_integration ON marketplaces(integration_type);
CREATE INDEX idx_marketplaces_active ON marketplaces(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_marketplaces_slug ON marketplaces(slug);
CREATE INDEX idx_marketplaces_webhooks ON marketplaces(webhook_enabled) WHERE webhook_enabled = TRUE;
```

**WEBHOOK SUPPORT:**
- `webhook_url` - Bizning endpoint (marketplace bizga yuboradi)
- `webhook_secret` - Security uchun
- `supports_webhooks` - Platform feature
- `webhook_enabled` - On/Off switch

**INTEGRATION TYPES:**
- **'api'** - Uzum, Wildberries, OZON (auto sync)
- **'manual'** - OLX, Bir-Bir (qo'lda zakas)
- **'own'** - Amazing Store (full control)

**FEATURES:**
- `supports_stock_sync` - TRUE for 'api' and 'own'
- `supports_order_sync` - TRUE for 'api' and 'own'
- `supports_price_sync` - TRUE for 'own' only (edit)

---

### 7️⃣ **MARKETPLACE_PRODUCTS** (SKU Mapping & Integration)
```sql
CREATE TABLE marketplace_products (
    id SERIAL PRIMARY KEY,
    
    -- Our product
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Platform
    marketplace_id INTEGER NOT NULL REFERENCES marketplaces(id) ON DELETE CASCADE,
    
    -- Marketplace product info
    marketplace_product_id VARCHAR(200) NOT NULL,
    marketplace_sku VARCHAR(100),
    marketplace_name VARCHAR(500),
    
    -- Pricing (from marketplace API)
    marketplace_price NUMERIC(10,2),
    marketplace_strikethrough_price NUMERIC(10,2),
    
    -- Stock (from marketplace API) - KEY FOR ANALYTICS
    marketplace_stock INTEGER DEFAULT 0, -- Marketplace'dagi hozirgi stock
    previous_stock INTEGER DEFAULT 0, -- Oldingi stock (analytics uchun)
    stock_last_synced_at TIMESTAMP, -- Oxirgi stock sync vaqti
    
    -- Price editability
    price_editable BOOLEAN DEFAULT FALSE, -- TRUE for manual/own, FALSE for api
    
    -- Commission
    commission_rate NUMERIC(5,2),
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, deleted
    
    -- Sync
    last_synced_at TIMESTAMP,
    sync_status VARCHAR(20) DEFAULT 'pending', -- pending, success, error
    sync_error TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(product_id, marketplace_id)
);

CREATE INDEX idx_mp_products_product ON marketplace_products(product_id);
CREATE INDEX idx_mp_products_marketplace ON marketplace_products(marketplace_id);
CREATE INDEX idx_mp_products_mp_id ON marketplace_products(marketplace_product_id);
CREATE INDEX idx_mp_products_status ON marketplace_products(status);
CREATE INDEX idx_mp_products_stock ON marketplace_products(marketplace_stock);
```

**KEY FEATURES:**
- `marketplace_stock` - **Marketplace'dagi real stock** (API'dan)
- `previous_stock` - **Oldingi stock** (analytics: sotilgan = previous - current)
- `stock_last_synced_at` - **Oxirgi stock sync**
- `price_editable`:
  - TRUE - Manual/Own platforms (narx Seller App'da edit qilinadi)
  - FALSE - API platforms (narx faqat show, edit yo'q)
- `marketplace_price` - API'dan kelgan narx (read-only for API platforms)

---

### 8️⃣ **CART_ITEMS** (Amazing Store only)
```sql
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

CREATE INDEX idx_cart_user ON cart_items(user_id);
CREATE INDEX idx_cart_product ON cart_items(product_id);
```

---

### 9️⃣ **FAVORITES** (Amazing Store only)
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

---

### 🔟 **ORDERS** (All orders - unified)
```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Source platform
    marketplace_id INTEGER NOT NULL REFERENCES marketplaces(id) ON DELETE RESTRICT,
    marketplace_order_id VARCHAR(200), -- if from API platform
    
    -- Customer
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- NULL if from marketplace
    customer_name VARCHAR(200) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_address TEXT,
    
    -- Totals
    subtotal NUMERIC(10,2) NOT NULL,
    delivery_fee NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, processing, shipped, delivered, cancelled
    payment_status VARCHAR(20) DEFAULT 'unpaid',
    payment_method VARCHAR(50),
    
    -- Analytics
    total_cost NUMERIC(10,2), -- umumiy tannarx
    total_profit NUMERIC(10,2), -- umumiy foyda
    
    -- Dates
    order_date TIMESTAMP DEFAULT NOW(),
    delivery_date TIMESTAMP,
    confirmed_at TIMESTAMP,
    delivered_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_marketplace ON orders(marketplace_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_mp_order ON orders(marketplace_order_id) WHERE marketplace_order_id IS NOT NULL;
CREATE INDEX idx_orders_date ON orders(order_date DESC);
```

**KEY POINT:**
- `marketplace_id` - qaysi platformadan (Amazing Store, Uzum, OLX, etc.)
- `marketplace_order_id` - API platformalar uchun (Uzum'dan kelgan buyurtma ID)

---

### 1️⃣1️⃣ **ORDER_ITEMS** (Order details)
```sql
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    
    -- Product snapshot
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100) NOT NULL,
    marketplace_product_id VARCHAR(200), -- if from API platform
    
    -- Pricing
    price NUMERIC(10,2) NOT NULL, -- sotilgan narx
    cost_price NUMERIC(10,2), -- tannarx
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    subtotal NUMERIC(10,2) NOT NULL,
    profit NUMERIC(10,2), -- foyda (price - cost_price) * quantity
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_order_items_sku ON order_items(product_sku);
```

**ANALYTICS:**
- `cost_price` - tannarx (analytics uchun)
- `profit` - foyda per item

---

### 1️⃣2️⃣ **BANNERS** (Marketing - Amazing Store only)
```sql
CREATE TABLE banners (
    id SERIAL PRIMARY KEY,
    
    -- Content
    title_uz VARCHAR(255),
    title_ru VARCHAR(255),
    image_url TEXT NOT NULL,
    
    -- Link
    link_type VARCHAR(20), -- 'product', 'category', 'url'
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

### 1️⃣3️⃣ **MARKETPLACE_WEBHOOKS** (Webhook history - NEW)
```sql
CREATE TABLE marketplace_webhooks (
    id SERIAL PRIMARY KEY,
    
    -- Webhook info
    marketplace_id INTEGER NOT NULL REFERENCES marketplaces(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'stock.updated', 'order.created', etc.
    
    -- Payload
    payload JSONB NOT NULL,
    signature VARCHAR(500), -- for verification
    
    -- Processing
    status VARCHAR(20) DEFAULT 'pending', -- pending, processed, failed, retry
    processed_at TIMESTAMP,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhooks_marketplace ON marketplace_webhooks(marketplace_id);
CREATE INDEX idx_webhooks_status ON marketplace_webhooks(status) WHERE status = 'pending';
CREATE INDEX idx_webhooks_event ON marketplace_webhooks(event_type);
CREATE INDEX idx_webhooks_created ON marketplace_webhooks(created_at DESC);
```

**WHY:**
- Real-time webhook tracking
- Retry mechanism
- Debugging & audit trail

---

### 1️⃣4️⃣ **SYNC_LOGS** (Sync history - Push/Pull)
```sql
CREATE TABLE sync_logs (
    id SERIAL PRIMARY KEY,
    
    -- Sync info
    marketplace_id INTEGER NOT NULL REFERENCES marketplaces(id) ON DELETE CASCADE,
    sync_type VARCHAR(20) NOT NULL, -- 'stock', 'price', 'orders', 'products'
    direction VARCHAR(10) NOT NULL, -- 'push', 'pull'
    trigger_type VARCHAR(20) DEFAULT 'webhook', -- 'webhook', 'manual', 'scheduled'
    
    -- Status
    status VARCHAR(20) NOT NULL, -- 'success', 'error', 'partial'
    
    -- Details
    items_processed INTEGER DEFAULT 0,
    items_failed INTEGER DEFAULT 0,
    error_message TEXT,
    
    -- Duration
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    duration_ms INTEGER
);

CREATE INDEX idx_sync_logs_marketplace ON sync_logs(marketplace_id);
CREATE INDEX idx_sync_logs_type ON sync_logs(sync_type);
CREATE INDEX idx_sync_logs_trigger ON sync_logs(trigger_type);
CREATE INDEX idx_sync_logs_status ON sync_logs(status);
CREATE INDEX idx_sync_logs_started ON sync_logs(started_at DESC);
```

**WHY:**
- Barcha sync activity tracking
- Webhook vs Polling metrics
- Error logging
- Performance monitoring

---

## 🔄 AUTO-UPDATE TRIGGERS

```sql
-- Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
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
```

---

## 📊 SCHEMA CHANGES FROM EXISTING

### ❌ DROP TABLES:
1. **purchases** - kerak emas (nakladnoylar)
2. **purchase_items** - kerak emas
3. **product_prices** - merge qilindi products table'ga
4. **daily_analytics** - olib tashlandi (on-the-fly calculation)
5. **product_analytics** - olib tashlandi (on-the-fly calculation)

### ✅ NEW TABLES:
1. **sync_logs** - marketplace sync tracking

### 🔄 MODIFIED TABLES:
1. **marketplaces** - `integration_type`, features added
2. **marketplace_products** - `price_editable`, sync info added
3. **orders** - `total_cost`, `total_profit` added
4. **order_items** - `cost_price`, `profit` added
5. **inventory_movements** - `marketplace_id` added

---

## 🎯 BUSINESS WORKFLOWS

### 1️⃣ API PLATFORM (Uzum) - Stock API Sync (BEST PRACTICE):
```
1. CRON JOB (har 15-30 daqiqa):
   ✅ Barcha API marketplace'lardan stock olish
   ✅ GET /api/v1/products/{sku}/stock
   
2. Stock yangilangan (Uzum API):
   - previous_stock = 50
   - marketplace_stock = 47 (yangi)
   - Farq = -3 (3 ta sotildi!)
   
3. Bizning tizimimiz:
   ✅ inventory.quantity kamayadi (50 → 47)
   ✅ inventory_movements yozuvi:
      - movement_type = 'marketplace_sale'
      - quantity_change = -3
      - marketplace_id = UZUM
      - notes = "Uzum'da 3 ta sotildi"
   
4. Analytics (avtomatik):
   ✅ 3 ta mahsulot sotildi Uzum'da
   ✅ Narx: marketplace_products.marketplace_price
   ✅ Foyda: (price - cost_price) * 3
   
5. Unified Stock → barcha API platformalarga PUSH:
   ✅ Wildberries: 50 → 47
   ✅ OZON: 50 → 47
   ✅ Amazing Store: 50 → 47
   
6. Agar bekor qilinsa (stock ortadi):
   - previous_stock = 47
   - marketplace_stock = 48 (yangi)
   - Farq = +1 (bekor qilindi)
   ✅ inventory.quantity ortadi (47 → 48)
   ✅ inventory_movements:
      - movement_type = 'marketplace_return'
      - quantity_change = +1
   ✅ Analytics: 1 ta bekor qilindi
   ✅ Boshqa platformalarga PUSH: 47 → 48
```

**ADVANTAGES:**
✅ **To'g'ridan-to'g'ri stock** (API'dan)  
✅ **Buyurtma import shart emas**  
✅ **Bekor qilingan avtomatik**  
✅ **Aniq analytics**  

### 2️⃣ MANUAL PLATFORM (OLX) - Qo'lda zakas:
```
1. Telefon orqali buyurtma
2. Admin Seller App'da qo'lda zakas yaratadi:
   - marketplace_id = OLX (manual)
   - customer_name, phone to'ldiriladi
3. Order yaratilganda:
   - inventory.quantity kamayadi
   - inventory_movements yozuvi (marketplace_id=OLX)
4. Stock API platformalarga PUSH (Uzum, Wildberries, etc.)
5. Analytics hisoblanadi (OLX uchun)
```

### 3️⃣ AMAZING STORE - Full control:
```
1. User Amazing Store'da buyurtma
2. Order avtomatik yaratiladi (marketplace_id=AMAZING_STORE)
3. Stock kamayadi:
   ✅ inventory.quantity (50 → 49)
   ✅ inventory_movements yozuvi
4. Unified Stock → barcha platformalarga PUSH:
   ✅ Uzum API: POST /products/{sku}/stock (49)
   ✅ Wildberries API: PUT /stocks (49)
   ✅ OZON API: POST /v1/product/import/stocks (49)
5. Seller App'da narx edit qilsa:
   ✅ products.price yangilanadi
   ✅ Amazing Store'ga avtomatik PUSH (WebSocket/API)
```

### 4️⃣ UNIFIED STOCK CONCEPT:
```
📦 REAL OMBOR (inventory.quantity): 50
   ↓
   ├── Uzum (marketplace_stock): 50
   ├── Wildberries (marketplace_stock): 50
   ├── OZON (marketplace_stock): 50
   └── Amazing Store: 50

❗ Uzum'da 3 ta sotildi (stock 50 → 47):
   ↓
   1. inventory.quantity: 50 → 47
   2. PUSH to all:
      - Wildberries: 50 → 47
      - OZON: 50 → 47
      - Amazing Store: 50 → 47

✅ Barcha platformalar SINXRON!
```

---

## ✅ ADVANTAGES

✅ **Unified Stock** - Bitta ombor, barcha platformalar  
✅ **Real Business Logic** - Sizning workflow'ingizga mos  
✅ **Scalable** - Yangi platformalar qo'shish oson  
✅ **Auditable** - To'liq history (inventory_movements, sync_logs)  
✅ **Analytics Ready** - Profit tracking per order, per platform  
✅ **Clean** - 13 tables (18 dan 13 ga)  
✅ **No Duplication** - purchases olib tashlandi  

---

## 📈 FINAL STRUCTURE (Event-Driven)

```
USERS (customers + admins)
  ├── CART_ITEMS → PRODUCTS
  ├── FAVORITES → PRODUCTS
  └── ORDERS → ORDER_ITEMS → PRODUCTS

PRODUCTS
  ├── CATEGORIES (hierarchy)
  ├── INVENTORY (unified stock)
  │   └── INVENTORY_MOVEMENTS (history)
  └── MARKETPLACE_PRODUCTS
      └── MARKETPLACES (API, Manual, Own)
          ├── MARKETPLACE_WEBHOOKS (real-time events) ⚡
          └── SYNC_LOGS (push/pull history)

BANNERS (standalone)
```

**KEY ADDITION:**
- `MARKETPLACE_WEBHOOKS` - Real-time event tracking
- `trigger_type` in SYNC_LOGS - webhook vs scheduled

---

## 🚀 NEXT STEP

**Bu schema to'g'rimi?**

1. ✅ **Perfect!** → Migration yaratamiz (DROP ALL + CREATE ALL)
2. 🔄 **Yana o'zgartirish** → Nimani?
3. ❓ **Savol** → Qaysi qism?

**Bu schema sizning REAL business logikangizga 100% mos!** 🎯

