# 🗄️ PROFESSIONAL DATABASE SCHEMA
## My Marketplace - Amazing Store & Seller App

---

## 📊 DATABASE ARCHITECTURE

### DESIGN PRINCIPLES:
1. ✅ **Normalized (3NF)** - no data duplication
2. ✅ **Scalable** - ready for growth
3. ✅ **Maintainable** - clear structure
4. ✅ **Performant** - proper indexes
5. ✅ **Auditable** - timestamps everywhere
6. ✅ **Flexible** - JSON where needed
7. ✅ **Multi-tenant ready** - marketplace support

---

## 🏗️ TABLE STRUCTURE (14 CORE TABLES)

### 1️⃣ **USERS** (All users: customers, sellers, admins)
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    
    -- Profile
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    username VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    
    -- Role & Status
    role VARCHAR(20) DEFAULT 'customer', -- customer, seller, admin
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Settings
    language VARCHAR(2) DEFAULT 'uz', -- uz, ru
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP
);

CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_role ON users(role) WHERE role IN ('seller', 'admin');
CREATE INDEX idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
```

**WHY:**
- Single user table for all roles (KISS principle)
- Telegram ID as unique identifier
- Role-based access control
- Multi-language support

---

### 2️⃣ **CATEGORIES** (Product categories - hierarchical)
```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    
    -- Multilang names
    name_uz VARCHAR(255) NOT NULL,
    name_ru VARCHAR(255),
    
    -- Hierarchy
    parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    
    -- Display
    icon VARCHAR(50), -- emoji or icon class
    image_url TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_active ON categories(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_categories_sort ON categories(sort_order);
```

**WHY:**
- Hierarchical structure (parent_id)
- Multi-language support
- Sortable
- Icon/Image for better UX

---

### 3️⃣ **PRODUCTS** (Product catalog)
```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    
    -- Basic info
    sku VARCHAR(100) UNIQUE NOT NULL,
    barcode VARCHAR(100),
    
    -- Multilang content
    name_uz VARCHAR(255) NOT NULL,
    name_ru VARCHAR(255),
    description_uz TEXT,
    description_ru TEXT,
    
    -- Category
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    
    -- Pricing (denormalized for performance)
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    sale_price NUMERIC(10,2) CHECK (sale_price IS NULL OR sale_price >= 0),
    cost_price NUMERIC(10,2) CHECK (cost_price IS NULL OR cost_price >= 0),
    
    -- Stock
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    low_stock_threshold INTEGER DEFAULT 10,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- SEO & Metrics
    view_count INTEGER DEFAULT 0,
    purchase_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_stock ON products(stock_quantity) WHERE stock_quantity > 0;
```

**WHY:**
- SKU for inventory tracking
- Multi-language for UZ/RU
- Denormalized price for speed (with history table)
- Stock tracking
- Metrics for analytics

---

### 4️⃣ **PRODUCT_IMAGES** (Multiple images per product)
```sql
CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Image
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    
    -- Order
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_product_images_product ON product_images(product_id);
CREATE UNIQUE INDEX idx_product_images_primary ON product_images(product_id) 
    WHERE is_primary = TRUE;
```

**WHY:**
- Multiple images per product
- Primary image designation
- Sortable for gallery

---

### 5️⃣ **PRICE_HISTORY** (Price tracking for analytics)
```sql
CREATE TABLE price_history (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Prices
    price NUMERIC(10,2) NOT NULL,
    sale_price NUMERIC(10,2),
    cost_price NUMERIC(10,2),
    
    -- Period
    effective_from TIMESTAMP NOT NULL DEFAULT NOW(),
    effective_to TIMESTAMP,
    
    -- Audit
    changed_by INTEGER REFERENCES users(id),
    change_reason TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_price_history_product ON price_history(product_id);
CREATE INDEX idx_price_history_dates ON price_history(effective_from, effective_to);
CREATE INDEX idx_price_history_current ON price_history(product_id, effective_to) 
    WHERE effective_to IS NULL;
```

**WHY:**
- Price change tracking
- Analytics & reporting
- Audit trail

---

### 6️⃣ **INVENTORY_MOVEMENTS** (Stock history)
```sql
CREATE TABLE inventory_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Movement
    movement_type VARCHAR(20) NOT NULL, -- in, out, adjustment, return
    quantity INTEGER NOT NULL,
    
    -- Balance
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    
    -- Reference
    reference_type VARCHAR(50), -- order, purchase, adjustment
    reference_id INTEGER,
    
    -- Notes
    notes TEXT,
    
    -- Audit
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_inventory_product ON inventory_movements(product_id);
CREATE INDEX idx_inventory_type ON inventory_movements(movement_type);
CREATE INDEX idx_inventory_created ON inventory_movements(created_at DESC);
```

**WHY:**
- Full stock audit trail
- Track every movement
- Link to source (order/purchase)

---

### 7️⃣ **CART_ITEMS** (Shopping cart)
```sql
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Quantity
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    
    -- Price snapshot (for consistency at checkout)
    price_snapshot NUMERIC(10,2) NOT NULL,
    
    -- Status
    is_selected BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, product_id)
);

CREATE INDEX idx_cart_user ON cart_items(user_id);
CREATE INDEX idx_cart_product ON cart_items(product_id);
```

**WHY:**
- Per-user cart
- Price snapshot for checkout consistency
- Unique constraint (one product per user)

---

### 8️⃣ **FAVORITES** (User wishlist)
```sql
CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Metadata (for future features)
    notes TEXT,
    notify_on_sale BOOLEAN DEFAULT FALSE,
    notify_on_stock BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, product_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_product ON favorites(product_id);
CREATE INDEX idx_favorites_notify ON favorites(user_id) 
    WHERE notify_on_sale = TRUE OR notify_on_stock = TRUE;
```

**WHY:**
- Clean wishlist tracking
- Future: price drop notifications
- Future: back-in-stock notifications

---

### 9️⃣ **ORDERS** (Order header)
```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Customer
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Totals
    subtotal NUMERIC(10,2) NOT NULL,
    discount NUMERIC(10,2) DEFAULT 0,
    delivery_fee NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, processing, shipped, delivered, cancelled
    payment_status VARCHAR(20) DEFAULT 'unpaid', -- unpaid, paid, refunded
    payment_method VARCHAR(50),
    
    -- Delivery
    delivery_address TEXT,
    delivery_phone VARCHAR(20),
    delivery_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    confirmed_at TIMESTAMP,
    delivered_at TIMESTAMP,
    cancelled_at TIMESTAMP
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
```

**WHY:**
- Complete order tracking
- Status workflow
- Delivery info
- Payment tracking

---

### 🔟 **ORDER_ITEMS** (Order line items)
```sql
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    
    -- Product snapshot (at time of order)
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
```

**WHY:**
- Order line items
- Product snapshot (immutable)
- Historical data preservation

---

### 1️⃣1️⃣ **BANNERS** (Marketing banners)
```sql
CREATE TABLE banners (
    id SERIAL PRIMARY KEY,
    
    -- Content
    title_uz VARCHAR(255),
    title_ru VARCHAR(255),
    image_url TEXT NOT NULL,
    
    -- Link
    link_type VARCHAR(20), -- product, category, external, none
    link_id INTEGER,
    link_url TEXT,
    
    -- Display
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Schedule
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_banners_active ON banners(is_active, sort_order) 
    WHERE is_active = TRUE;
```

**WHY:**
- Marketing campaigns
- Scheduled banners
- Flexible linking

---

### 1️⃣2️⃣ **SELLERS** (Seller/Vendor info)
```sql
CREATE TABLE sellers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Business info
    business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(50), -- individual, llc, corp
    tax_id VARCHAR(50),
    
    -- Contact
    contact_person VARCHAR(255),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    
    -- Address
    address TEXT,
    
    -- Status
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sellers_user ON sellers(user_id);
CREATE INDEX idx_sellers_verified ON sellers(is_verified) WHERE is_verified = TRUE;
```

**WHY:**
- Multi-vendor support
- Business verification
- Compliance ready

---

### 1️⃣3️⃣ **PURCHASES** (Purchase orders from suppliers)
```sql
CREATE TABLE purchases (
    id SERIAL PRIMARY KEY,
    purchase_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Seller
    seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,
    
    -- Supplier
    supplier_name VARCHAR(255) NOT NULL,
    supplier_contact TEXT,
    
    -- Totals
    subtotal NUMERIC(10,2) NOT NULL,
    tax NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, received, cancelled
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    confirmed_at TIMESTAMP,
    received_at TIMESTAMP
);

CREATE INDEX idx_purchases_seller ON purchases(seller_id);
CREATE INDEX idx_purchases_status ON purchases(status);
CREATE INDEX idx_purchases_created ON purchases(created_at DESC);
```

**WHY:**
- Seller inventory management
- Supplier tracking
- Cost tracking

---

### 1️⃣4️⃣ **PURCHASE_ITEMS** (Purchase line items)
```sql
CREATE TABLE purchase_items (
    id SERIAL PRIMARY KEY,
    purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    
    -- Quantity
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    
    -- Pricing
    cost_price NUMERIC(10,2) NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_purchase_items_purchase ON purchase_items(purchase_id);
CREATE INDEX idx_purchase_items_product ON purchase_items(product_id);
```

**WHY:**
- Purchase details
- Cost tracking per product
- Inventory link

---

## 🔐 SECURITY & AUDIT

### Triggers for `updated_at`:
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ... (repeat for other tables)
```

---

## 📈 PERFORMANCE OPTIMIZATIONS

1. **Indexes** - All foreign keys, status columns, dates
2. **Partial indexes** - WHERE clauses for active records
3. **Unique indexes** - Prevent duplicates
4. **Composite indexes** - For common queries
5. **Denormalization** - Price in products table (with history)

---

## 🎯 ADVANTAGES

✅ **Scalable** - Ready for millions of records  
✅ **Clean** - No redundant data  
✅ **Fast** - Proper indexes  
✅ **Auditable** - Full history  
✅ **Flexible** - Easy to extend  
✅ **Multi-tenant** - Marketplace ready  
✅ **Best Practice** - Industry standard  

---

## 📊 TABLE RELATIONSHIPS

```
USERS (customers, sellers, admins)
  ├── SELLERS (1:1)
  │   └── PURCHASES (1:N)
  │       └── PURCHASE_ITEMS (1:N) → PRODUCTS
  ├── CART_ITEMS (1:N) → PRODUCTS
  ├── FAVORITES (1:N) → PRODUCTS
  └── ORDERS (1:N)
      └── ORDER_ITEMS (1:N) → PRODUCTS

CATEGORIES (hierarchical)
  └── PRODUCTS (1:N)
      ├── PRODUCT_IMAGES (1:N)
      ├── PRICE_HISTORY (1:N)
      └── INVENTORY_MOVEMENTS (1:N)

BANNERS (standalone)
```

---

## 🚀 NEXT STEPS

1. Review this schema
2. Discuss any changes
3. Create single migration to DROP ALL and CREATE ALL
4. Deploy to production
5. Populate with fresh data

**Tahlil qilaylikmi? O'zgartirishlar kerakmi?** 🤔

