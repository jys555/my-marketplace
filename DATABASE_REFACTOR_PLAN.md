# 🏗️ AMAZING STORE - DATABASE REFACTORING PLAN

## 🎯 Maqsad
Clean, scalable, professional database structure yaratish.

---

## ❌ MUAMMOLAR

### 1. Dublikatlanish
- `products.price` + `product_prices` table ❌
- `users.cart` JSONB + `cart_items` table ❌

### 2. Yomon dizayn
- `users.favorites` oddiy array (metadata yo'q) ❌
- Mixed approach (ba'zi joyda normalization, ba'zida denormalization) ❌

### 3. Kelajakda muammo
- Price history yo'q
- User behavior tracking yo'q
- Scalability muammolari

---

## ✅ YANGI STRUKTURA (BEST PRACTICE)

### **CORE TABLES**

#### 1. `users` (simplified)
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    phone VARCHAR(20),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
-- ❌ REMOVED: cart JSONB, favorites INTEGER[]
-- ✅ SEPARATE TABLES: cart_items, user_favorites
```

#### 2. `products` (single source of truth)
```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(100) NOT NULL UNIQUE,
    name_uz VARCHAR(255) NOT NULL,
    name_ru VARCHAR(255),
    description_uz TEXT,
    description_ru TEXT,
    category_id INTEGER REFERENCES categories(id),
    
    -- Current price (denormalized for performance)
    current_price NUMERIC(10,2) NOT NULL,
    current_sale_price NUMERIC(10,2),
    
    -- Product info
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    stock_quantity INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = TRUE;
```

#### 3. `price_history` (for analytics & history)
```sql
CREATE TABLE price_history (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    price NUMERIC(10,2) NOT NULL,
    sale_price NUMERIC(10,2),
    effective_from TIMESTAMP DEFAULT NOW(),
    effective_to TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_price_history_product ON price_history(product_id);
CREATE INDEX idx_price_history_dates ON price_history(effective_from, effective_to);
```

#### 4. `cart_items` (user cart)
```sql
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    
    -- UI state
    is_selected BOOLEAN DEFAULT TRUE,
    
    -- Pricing snapshot (for checkout consistency)
    price_snapshot NUMERIC(10,2),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, product_id)
);

CREATE INDEX idx_cart_user ON cart_items(user_id);
CREATE INDEX idx_cart_product ON cart_items(product_id);
```

#### 5. `user_favorites` (with metadata)
```sql
CREATE TABLE user_favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Metadata for future features
    notes TEXT,
    priority INTEGER DEFAULT 0, -- wishlist priority
    notify_on_sale BOOLEAN DEFAULT FALSE,
    notify_on_stock BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, product_id)
);

CREATE INDEX idx_favorites_user ON user_favorites(user_id);
CREATE INDEX idx_favorites_product ON user_favorites(product_id);
CREATE INDEX idx_favorites_created ON user_favorites(created_at DESC);
```

#### 6. `categories` (hierarchical)
```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    name_uz VARCHAR(255) NOT NULL,
    name_ru VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(20),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
```

---

## 🔄 MIGRATION STRATEGY

### Phase 1: Create new structure
1. Create new tables with best practices
2. Keep old data intact

### Phase 2: Data migration
1. Migrate `users.favorites` → `user_favorites`
2. Migrate `users.cart` → `cart_items` (if any old data)
3. Clean up `product_prices` duplication

### Phase 3: Update code
1. Update backend API to use new tables
2. Test thoroughly
3. Update frontend

### Phase 4: Cleanup
1. Drop old columns (`users.cart`, `users.favorites`)
2. Drop unused tables (`product_prices`)

---

## 📊 ADVANTAGES

### ✅ Scalability
- Each table has single responsibility
- Easy to add features
- Proper indexing

### ✅ Performance
- Optimized queries
- Denormalized current price for speed
- Historical data separate

### ✅ Maintainability
- Clear structure
- No duplication
- Easy to understand

### ✅ Future-proof
- Can add: 
  - Price alerts
  - Wishlist sharing
  - Cart expiry
  - Product recommendations
  - Analytics

---

## 🎯 NEXT STEPS

1. ✅ Review & approve structure
2. Create migration files
3. Test on staging
4. Deploy to production
5. Monitor & optimize


