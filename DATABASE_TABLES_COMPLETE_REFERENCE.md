# 🗃️ DATABASE TABLES - TO'LIQ MA'LUMOT VA CONNECTION MAPPING

**Created:** 2026-01-10  
**Database:** PostgreSQL  
**Total Tables:** 14 professional tables  
**Architecture:** Event-driven, scalable, multi-marketplace  

---

## 📊 JADVAL: BARCHA TABLELAR VA ULARNING MAQSADI

| # | Table Name | Purpose | Records | Used By |
|---|------------|---------|---------|---------|
| 1 | `users` | Telegram foydalanuvchilar ma'lumotlari | ~1000 | Amazing Store miniapp, Auth |
| 2 | `categories` | Mahsulot kategoriyalari (multilang) | ~20 | Products API, Admin |
| 3 | `products` | Master catalog (barcha mahsulotlar) | ~500 | Products API, Cart, Orders |
| 4 | `inventory` | Unified stock (markaziy ombor) | ~500 | Stock sync, Products API |
| 5 | `inventory_movements` | Stock history (har bir o'zgarish) | ~10000+ | Analytics, Audit trail |
| 6 | `marketplaces` | Barcha platformalar (Uzum, WB, OZON, A Store) | ~10 | Orders, Sync, Webhooks |
| 7 | `marketplace_products` | SKU mapping (product ↔ marketplace) | ~2000 | Sync, Analytics |
| 8 | `cart_items` | Savat (faqat A Store) | ~100 | Cart API, Orders |
| 9 | `favorites` | Sevimlilar (faqat A Store) | ~500 | Users API, Products |
| 10 | `orders` | Barcha buyurtmalar (unified) | ~5000+ | Orders API, Analytics |
| 11 | `order_items` | Buyurtma tarkibi | ~15000+ | Orders API, Analytics |
| 12 | `banners` | Marketing bannerlar (multilang) | ~10 | Banners API, Miniapp |
| 13 | `marketplace_webhooks` | Webhook events history | ~50000+ | Webhook handler, Sync |
| 14 | `sync_logs` | Sync tarixi va xatoliklar | ~100000+ | Monitoring, Analytics |

---

## 🔍 HAR BIR TABLENING BATAFSIL MA'LUMOTI

---

### 1️⃣ **USERS** - Foydalanuvchilar

**Maqsadi:** Telegram Mini App foydalanuvchilarini saqlash (mijozlar va adminlar)

#### Columnlar:

| Column | Type | Description | Required | Unique |
|--------|------|-------------|----------|--------|
| `id` | SERIAL | Primary key | ✅ | ✅ |
| `telegram_id` | BIGINT | Telegram user ID | ✅ | ✅ |
| `first_name` | VARCHAR(100) | Ism | ✅ | ❌ |
| `last_name` | VARCHAR(100) | Familiya | ❌ | ❌ |
| `username` | VARCHAR(100) | Telegram username | ❌ | ❌ |
| `phone` | VARCHAR(20) | Telefon (+998...) | ❌ | ❌ |
| `language` | VARCHAR(2) | Til (uz/ru) | ❌ | ❌ |
| `is_active` | BOOLEAN | Faol/Faol emas | ❌ | ❌ |
| `is_admin` | BOOLEAN | Admin huquqi | ❌ | ❌ |
| `created_at` | TIMESTAMP | Ro'yxatdan o'tgan vaqt | ✅ | ❌ |
| `updated_at` | TIMESTAMP | Oxirgi yangilanish | ✅ | ❌ |
| `last_login_at` | TIMESTAMP | Oxirgi kirish | ❌ | ❌ |

#### Indexlar:
- `idx_users_telegram_id` - Tez qidiruv uchun
- `idx_users_admin` - Admin filter uchun

#### Qayerda ishlatiladi:

**API Endpoints:**
- ✅ `POST /api/users/validate` - Telegram auth va user check
  - **File:** `amazing store/backend/routes/users.js` (lines 8-40)
  - **Query:** `SELECT id, first_name, last_name, phone, username FROM users WHERE telegram_id = $1`

- ✅ `GET /api/users/profile` - Profile olish
  - **File:** `amazing store/backend/routes/users.js` (lines 95-127)
  - **Query:** `SELECT first_name, last_name, phone, username FROM users WHERE id = $1`

- ✅ `PUT /api/users/profile` - Profile yaratish/yangilash
  - **File:** `amazing store/backend/routes/users.js` (lines 197-261)
  - **Query (Update):** `UPDATE users SET first_name = $1, last_name = $2, phone = $3 WHERE id = $4`
  - **Query (Insert):** `INSERT INTO users (telegram_id, first_name, last_name, phone, username) VALUES (...)`

- ✅ `POST /api/orders` - Buyurtma yaratishda customer info
  - **File:** `amazing store/backend/routes/orders.js` (lines 280-295)
  - **Query:** `SELECT first_name, last_name, phone FROM users WHERE id = $1`

**Frontend:**
- `amazing store/frontend/src/js/api.js` - API calls
- `amazing store/frontend/src/js/state.js` - State management (`state.user`)

---

### 2️⃣ **CATEGORIES** - Kategoriyalar

**Maqsadi:** Mahsulot kategoriyalarini saqlash (hierarchical, multilang)

#### Columnlar:

| Column | Type | Description | Required | Default |
|--------|------|-------------|----------|---------|
| `id` | SERIAL | Primary key | ✅ | - |
| `name_uz` | VARCHAR(255) | O'zbekcha nomi | ✅ | - |
| `name_ru` | VARCHAR(255) | Ruscha nomi | ❌ | NULL |
| `parent_id` | INTEGER | Parent category (hierarchy) | ❌ | NULL |
| `icon` | VARCHAR(50) | Emoji icon | ❌ | NULL |
| `color` | VARCHAR(20) | Rang kodi | ❌ | NULL |
| `sort_order` | INTEGER | Tartib raqami | ❌ | 0 |
| `is_active` | BOOLEAN | Faol/Faol emas | ❌ | TRUE |
| `created_at` | TIMESTAMP | Yaratilgan vaqt | ✅ | NOW() |
| `updated_at` | TIMESTAMP | Yangilangan vaqt | ✅ | NOW() |

#### Foreign Keys:
- `parent_id` → `categories(id)` ON DELETE CASCADE (self-reference)

#### Indexlar:
- `idx_categories_parent` - Parent lookup
- `idx_categories_active` - Active filter

#### Qayerda ishlatiladi:

**API Endpoints:**
- ✅ `GET /api/categories` - Barcha kategoriyalar
  - **File:** `amazing store/backend/routes/categories.js` (lines 22-63)
  - **Query:** `SELECT id, CASE WHEN $1 = 'ru' THEN name_ru ELSE name_uz END as name, icon, color, sort_order FROM categories WHERE is_active = TRUE ORDER BY sort_order ASC`
  - **Cache:** `categories:{lang}` (5 min TTL)

- ✅ `POST /api/categories` - Yangi kategoriya (admin)
  - **File:** `amazing store/backend/routes/categories.js` (lines 66-97)

- ✅ `PUT /api/categories/:id` - Kategoriya yangilash (admin)
  - **File:** `amazing store/backend/routes/categories.js` (lines 100-146)

**Frontend:**
- `amazing store/frontend/src/js/state.js` - `state.categories`
- `amazing store/frontend/src/js/ui.js` - Category tabs rendering

---

### 3️⃣ **PRODUCTS** - Mahsulotlar (Master Catalog)

**Maqsadi:** Barcha mahsulotlarning master katalogi (SKU-based)

#### Columnlar:

| Column | Type | Description | Required | Unique |
|--------|------|-------------|----------|--------|
| `id` | SERIAL | Primary key | ✅ | ✅ |
| `sku` | VARCHAR(100) | Stock Keeping Unit | ✅ | ✅ |
| `barcode` | VARCHAR(100) | Barcode | ❌ | ❌ |
| `name_uz` | VARCHAR(255) | O'zbekcha nomi | ✅ | ❌ |
| `name_ru` | VARCHAR(255) | Ruscha nomi | ❌ | ❌ |
| `description_uz` | TEXT | O'zbekcha tavsif | ❌ | ❌ |
| `description_ru` | TEXT | Ruscha tavsif | ❌ | ❌ |
| `category_id` | INTEGER | Kategoriya ID | ❌ | ❌ |
| `price` | NUMERIC(10,2) | Asosiy narx | ✅ | ❌ |
| `sale_price` | NUMERIC(10,2) | Chegirma narxi | ❌ | ❌ |
| `cost_price` | NUMERIC(10,2) | Tannarx | ❌ | ❌ |
| `profitability_percentage` | NUMERIC(5,2) | Rentabellik % | ❌ | ❌ |
| `image_url` | TEXT | Rasm URL | ❌ | ❌ |
| `is_active` | BOOLEAN | Faol/Faol emas | ❌ | TRUE |
| `view_count` | INTEGER | Ko'rilganlar soni | ❌ | 0 |
| `order_count` | INTEGER | Buyurtmalar soni | ❌ | 0 |
| `created_at` | TIMESTAMP | Yaratilgan vaqt | ✅ | NOW() |
| `updated_at` | TIMESTAMP | Yangilangan vaqt | ✅ | NOW() |

#### Foreign Keys:
- `category_id` → `categories(id)` ON DELETE SET NULL

#### Checks:
- `price >= 0`
- `sale_price IS NULL OR sale_price >= 0`
- `cost_price IS NULL OR cost_price >= 0`

#### Indexlar:
- `idx_products_sku` - SKU lookup
- `idx_products_category` - Category filter
- `idx_products_active` - Active filter
- `idx_products_barcode` - Barcode scan

#### Qayerda ishlatiladi:

**API Endpoints:**
- ✅ `GET /api/products` - Mahsulotlar ro'yxati (pagination, filter, search)
  - **File:** `amazing store/backend/routes/products.js` (lines 70-180)
  - **Query:** 
    ```sql
    SELECT 
        p.id, 
        CASE WHEN $1 = 'ru' THEN COALESCE(NULLIF(p.name_ru, ''), p.name_uz) ELSE p.name_uz END as name,
        CASE WHEN $1 = 'ru' THEN COALESCE(NULLIF(p.description_ru, ''), p.description_uz) ELSE p.description_uz END as description,
        p.price, 
        p.sale_price, 
        p.image_url AS image,
        p.category_id,
        p.sku,
        COALESCE(i.quantity, 0) AS stock_quantity,
        COALESCE(p.sale_price, p.price, 0) AS display_price
    FROM products p
    LEFT JOIN inventory i ON i.product_id = p.id
    WHERE ... (filters)
    ORDER BY p.created_at DESC
    LIMIT $x OFFSET $y
    ```
  - **Cache:** `products:{lang}:{page}:{category}:{search}` (5 min TTL)

- ✅ `GET /api/products/:id` - Bitta mahsulot
  - **File:** `amazing store/backend/routes/products.js` (lines 182-230)

- ✅ `POST /api/cart` - Savatga qo'shishda product check
  - **File:** `amazing store/backend/routes/cart.js` (lines 84-110)
  - **Query:** `SELECT id FROM products WHERE id = $1`
  - **Query:** `SELECT COALESCE(sale_price, price) as current_price FROM products WHERE id = $1`

- ✅ `POST /api/orders` - Buyurtmada product info
  - **File:** `amazing store/backend/routes/orders.js` (lines 246-250)
  - **Query:** `SELECT id, price, sale_price FROM products WHERE id = ANY($1::int[])`

**Frontend:**
- `amazing store/frontend/src/js/state.js` - `state.products`
- `amazing store/frontend/src/js/ui.js` - Product cards rendering
- `amazing store/frontend/src/pages/cart.html` - Cart page

---

### 4️⃣ **INVENTORY** - Ombor (Unified Stock)

**Maqsadi:** Markaziy ombordagi barcha mahsulotlarning stock miqdori

#### Columnlar:

| Column | Type | Description | Required | Unique |
|--------|------|-------------|----------|--------|
| `id` | SERIAL | Primary key | ✅ | ✅ |
| `product_id` | INTEGER | Mahsulot ID | ✅ | ✅ |
| `quantity` | INTEGER | Mavjud miqdor | ✅ | ❌ |
| `reserved_quantity` | INTEGER | Rezerv qilingan | ✅ | ❌ |
| `last_updated_at` | TIMESTAMP | Oxirgi yangilanish | ❌ | ❌ |
| `created_at` | TIMESTAMP | Yaratilgan vaqt | ✅ | NOW() |

#### Foreign Keys:
- `product_id` → `products(id)` ON DELETE CASCADE (UNIQUE)

#### Checks:
- `quantity >= 0`
- `reserved_quantity >= 0`

#### Indexlar:
- `idx_inventory_product` - Product lookup
- `idx_inventory_quantity` - Stock > 0 filter

#### Qayerda ishlatiladi:

**API Endpoints:**
- ✅ `GET /api/products` - Mahsulot ro'yxatida stock ko'rsatish
  - **File:** `amazing store/backend/routes/products.js` (lines 70-180)
  - **Query:** `LEFT JOIN inventory i ON i.product_id = p.id`
  - **Select:** `COALESCE(i.quantity, 0) AS stock_quantity`

**Future Use:**
- 🔄 Marketplace sync - stock push/pull
- 🔄 Order fulfillment - stock reserve/decrease
- 📊 Analytics - stock movements tracking

---

### 5️⃣ **INVENTORY_MOVEMENTS** - Stock History

**Maqsadi:** Har bir stock o'zgarishini log qilish (audit trail + analytics)

#### Columnlar:

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `id` | SERIAL | Primary key | 1234 |
| `product_id` | INTEGER | Mahsulot ID | 5 |
| `movement_type` | VARCHAR(20) | Harakat turi | 'order', 'return', 'adjustment', 'sync' |
| `quantity_change` | INTEGER | O'zgarish miqdori | -2 (sotildi), +5 (qo'shildi) |
| `quantity_before` | INTEGER | Oldingi miqdor | 100 |
| `quantity_after` | INTEGER | Keyingi miqdor | 98 |
| `reference_type` | VARCHAR(20) | Manba turi | 'order', 'marketplace' |
| `reference_id` | INTEGER | Manba ID | 456 (order_id) |
| `marketplace_id` | INTEGER | Marketplace | 2 (Uzum) |
| `notes` | TEXT | Izoh | "Uzum order #12345" |
| `created_at` | TIMESTAMP | Vaqt | 2026-01-10 14:30:00 |

#### Foreign Keys:
- `product_id` → `products(id)` ON DELETE CASCADE

#### Indexlar:
- `idx_inv_movements_product` - Product history
- `idx_inv_movements_type` - Type filter
- `idx_inv_movements_marketplace` - Marketplace filter
- `idx_inv_movements_created` - Time-based queries

#### Qayerda ishlatiladi:

**Future Use:**
- 📊 Analytics - stock movement reports
- 🔄 Sync webhook handler - log stock changes
- 📈 Sales calculation - `SUM(quantity_change WHERE quantity_change < 0)`

---

### 6️⃣ **MARKETPLACES** - Platformalar

**Maqsadi:** Barcha marketplace va sales channel'lar (Uzum, WB, OZON, A Store, OLX, etc.)

#### Columnlar:

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `id` | SERIAL | Primary key | 1 |
| `name` | VARCHAR(100) | Nom | "Amazing Store" |
| `slug` | VARCHAR(50) | URL slug | "amazing-store" |
| `integration_type` | VARCHAR(20) | Type | 'api', 'manual', 'own' |
| `api_type` | VARCHAR(50) | API type | 'rest', 'graphql', null |
| `api_key_encrypted` | TEXT | API key (encrypted) | "enc_123..." |
| `api_secret_encrypted` | TEXT | Secret (encrypted) | "enc_456..." |
| `access_token` | TEXT | OAuth token | "token_789..." |
| `refresh_token` | TEXT | Refresh token | "refresh_012..." |
| `token_expires_at` | TIMESTAMP | Token expiry | 2026-01-15 00:00:00 |
| `marketplace_code` | VARCHAR(50) | Marketplace code | "uzum", "wildberries" |
| `webhook_url` | TEXT | Webhook endpoint | "https://api.example.com/webhook" |
| `webhook_secret` | TEXT | Webhook secret | "whsec_..." |
| `supports_webhooks` | BOOLEAN | Webhook support | TRUE |
| `webhook_enabled` | BOOLEAN | Webhook active | TRUE |
| `supports_stock_sync` | BOOLEAN | Stock sync | TRUE |
| `supports_order_sync` | BOOLEAN | Order sync | TRUE |
| `supports_price_sync` | BOOLEAN | Price sync | FALSE |
| `is_active` | BOOLEAN | Faol/Faol emas | TRUE |
| `auto_sync_enabled` | BOOLEAN | Auto sync | TRUE |
| `sync_interval_minutes` | INTEGER | Sync interval | 60 |
| `default_commission_rate` | NUMERIC(5,2) | Commission % | 15.50 |
| `last_sync_at` | TIMESTAMP | Oxirgi sync | 2026-01-10 14:00:00 |
| `created_at` | TIMESTAMP | Yaratilgan | - |
| `updated_at` | TIMESTAMP | Yangilangan | - |

#### Indexlar:
- `idx_marketplaces_integration` - Type filter
- `idx_marketplaces_active` - Active filter
- `idx_marketplaces_slug` - URL lookup
- `idx_marketplaces_webhooks` - Webhook enabled filter

#### Qayerda ishlatiladi:

**API Endpoints:**
- ✅ `POST /api/orders` - Buyurtma yaratishda marketplace_id kerak
  - **File:** `amazing store/backend/routes/orders.js` (lines 280-320)
  - **Query:** `SELECT id FROM marketplaces WHERE name_en = 'Amazing Store'`
  - **Auto-create:** Agar yo'q bo'lsa, yaratiladi:
    ```sql
    INSERT INTO marketplaces (name_uz, name_ru, name_en, type, is_active) 
    VALUES ('Amazing Store', 'Amazing Store', 'Amazing Store', 'own', true)
    ```

**Future Use:**
- 🔄 Webhook receiver - marketplace_id bilan identify
- 🔄 Stock sync jobs - marketplace list
- 📊 Analytics - marketplace performance

---

### 7️⃣ **MARKETPLACE_PRODUCTS** - SKU Mapping

**Maqsadi:** Internal product ↔ Marketplace product mapping (for sync)

#### Columnlar:

| Column | Type | Description | Required |
|--------|------|-------------|----------|
| `id` | SERIAL | Primary key | ✅ |
| `product_id` | INTEGER | Our product ID | ✅ |
| `marketplace_id` | INTEGER | Platform ID | ✅ |
| `marketplace_product_id` | VARCHAR(200) | Marketplace ID | ✅ |
| `marketplace_sku` | VARCHAR(100) | Marketplace SKU | ❌ |
| `marketplace_name` | VARCHAR(500) | Product name (on marketplace) | ❌ |
| `marketplace_price` | NUMERIC(10,2) | Price (from API) | ❌ |
| `marketplace_strikethrough_price` | NUMERIC(10,2) | Old price | ❌ |
| `marketplace_stock` | INTEGER | Current stock (from API) | ❌ |
| `previous_stock` | INTEGER | Previous stock (for analytics) | ❌ |
| `stock_last_synced_at` | TIMESTAMP | Last stock sync | ❌ |
| `price_editable` | BOOLEAN | Can edit price? | ❌ |
| `commission_rate` | NUMERIC(5,2) | Commission % | ❌ |
| `status` | VARCHAR(20) | Status | ❌ |
| `last_synced_at` | TIMESTAMP | Last sync | ❌ |
| `sync_status` | VARCHAR(20) | Sync status | ❌ |
| `sync_error` | TEXT | Sync error | ❌ |
| `created_at` | TIMESTAMP | Yaratilgan | ✅ |
| `updated_at` | TIMESTAMP | Yangilangan | ✅ |

#### Foreign Keys:
- `product_id` → `products(id)` ON DELETE CASCADE
- `marketplace_id` → `marketplaces(id)` ON DELETE CASCADE
- **UNIQUE** constraint: `(product_id, marketplace_id)`

#### Indexlar:
- `idx_mp_products_product` - Product lookup
- `idx_mp_products_marketplace` - Marketplace filter
- `idx_mp_products_mp_id` - Marketplace product ID
- `idx_mp_products_status` - Status filter
- `idx_mp_products_stock` - Stock filter

#### Qayerda ishlatiladi:

**Future Use:**
- 🔄 Stock sync - read marketplace stock, calculate sales
- 🔄 Price sync - read marketplace price for analytics
- 📊 Analytics - `previous_stock - marketplace_stock` = sales

---

### 8️⃣ **CART_ITEMS** - Savat

**Maqsadi:** Amazing Store miniapp uchun shopping cart

#### Columnlar:

| Column | Type | Description | Required | Default |
|--------|------|-------------|----------|---------|
| `id` | SERIAL | Primary key | ✅ | - |
| `user_id` | INTEGER | Foydalanuvchi | ✅ | - |
| `product_id` | INTEGER | Mahsulot | ✅ | - |
| `quantity` | INTEGER | Miqdor | ✅ | 1 |
| `price_snapshot` | NUMERIC(10,2) | Narx snapshot | ✅ | - |
| `created_at` | TIMESTAMP | Qo'shilgan vaqt | ✅ | NOW() |
| `updated_at` | TIMESTAMP | Yangilangan vaqt | ✅ | NOW() |

#### Foreign Keys:
- `user_id` → `users(id)` ON DELETE CASCADE
- `product_id` → `products(id)` ON DELETE CASCADE
- **UNIQUE** constraint: `(user_id, product_id)`

#### Checks:
- `quantity > 0`

#### Indexlar:
- `idx_cart_user` - User cart
- `idx_cart_product` - Product in carts

#### Qayerda ishlatiladi:

**API Endpoints:**
- ✅ `GET /api/cart` - Savat ma'lumotlari
  - **File:** `amazing store/backend/routes/cart.js` (lines 16-67)
  - **Query:** 
    ```sql
    SELECT 
        ci.id, ci.product_id, ci.quantity, ci.price_snapshot, ci.created_at,
        p.name_uz, p.name_ru, p.price, p.sale_price, p.image_url, p.sku
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.user_id = $1
    ORDER BY ci.created_at DESC
    ```

- ✅ `POST /api/cart` - Savatga qo'shish
  - **File:** `amazing store/backend/routes/cart.js` (lines 74-130)
  - **Query:** 
    ```sql
    INSERT INTO cart_items (user_id, product_id, quantity, price_snapshot)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id, product_id)
    DO UPDATE SET quantity = EXCLUDED.quantity, price_snapshot = EXCLUDED.price_snapshot
    ```

- ✅ `PATCH /api/cart/:id` - Miqdorni yangilash
  - **File:** `amazing store/backend/routes/cart.js` (lines 137-181)
  - **Query:** `UPDATE cart_items SET quantity = $3 WHERE id = $2 AND user_id = $1`

- ✅ `DELETE /api/cart/:id` - Element o'chirish
  - **File:** `amazing store/backend/routes/cart.js` (lines 187-215)

- ✅ `DELETE /api/cart` - Savatni tozalash
  - **File:** `amazing store/backend/routes/cart.js` (lines 221-246)

**Frontend:**
- `amazing store/frontend/src/js/api.js` - Cart API calls
- `amazing store/frontend/src/pages/cart.html` - Cart page

---

### 9️⃣ **FAVORITES** - Sevimlilar

**Maqsadi:** Foydalanuvchilarning sevimli mahsulotlari (wishlist)

#### Columnlar:

| Column | Type | Description | Required |
|--------|------|-------------|----------|
| `id` | SERIAL | Primary key | ✅ |
| `user_id` | INTEGER | Foydalanuvchi | ✅ |
| `product_id` | INTEGER | Mahsulot | ✅ |
| `created_at` | TIMESTAMP | Qo'shilgan vaqt | ✅ |

#### Foreign Keys:
- `user_id` → `users(id)` ON DELETE CASCADE
- `product_id` → `products(id)` ON DELETE CASCADE
- **UNIQUE** constraint: `(user_id, product_id)`

#### Indexlar:
- `idx_favorites_user` - User favorites
- `idx_favorites_product` - Product favorite count

#### Qayerda ishlatiladi:

**API Endpoints:**
- ✅ `POST /api/users/validate` - User validation
  - **File:** `amazing store/backend/routes/users.js` (lines 23-27)
  - **Query:** `SELECT product_id FROM favorites WHERE user_id = $1 ORDER BY created_at DESC`

- ✅ `GET /api/users/profile` - Profile olish
  - **File:** `amazing store/backend/routes/users.js` (lines 109-113)
  - **Query:** `SELECT product_id FROM user_favorites WHERE user_id = $1` ⚠️ **BUG: `user_favorites` should be `favorites`**

- ✅ `PUT /api/users/profile` - Profile yangilash
  - **File:** `amazing store/backend/routes/users.js` (lines 232-236)
  - **Query:** `SELECT product_id FROM favorites WHERE user_id = $1`

- ✅ `GET /api/users/favorites` - Sevimlilar ro'yxati
  - **File:** `amazing store/backend/routes/users.js` (lines 311-331)
  - **Query:** `SELECT product_id FROM favorites WHERE user_id = $1 ORDER BY created_at DESC`

- ✅ `PUT /api/users/favorites` - Sevimlilarni sync
  - **File:** `amazing store/backend/routes/users.js` (lines 334-381)
  - **Query:** `DELETE FROM favorites WHERE user_id = $1`
  - **Query:** `INSERT INTO favorites (user_id, product_id) VALUES ($1, $2), ...`

- ✅ `POST /api/users/favorites/:productId` - Sevimliga qo'shish
  - **File:** `amazing store/backend/routes/users.js` (lines 384-408)
  - **Query:** `INSERT INTO favorites (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`

- ✅ `DELETE /api/users/favorites/:productId` - Sevimlidan o'chirish
  - **File:** `amazing store/backend/routes/users.js` (lines 411-433)
  - **Query:** `DELETE FROM favorites WHERE user_id = $1 AND product_id = $2`

**Frontend:**
- `amazing store/frontend/src/js/state.js` - `state.user.favorites`
- `amazing store/frontend/src/js/ui.js` - Like button rendering

---

### 🔟 **ORDERS** - Buyurtmalar (Unified)

**Maqsadi:** Barcha platformalardan kelgan buyurtmalar (Amazing Store, Uzum, WB, OZON, manual)

#### Columnlar:

| Column | Type | Description | Required |
|--------|------|-------------|----------|
| `id` | SERIAL | Primary key | ✅ |
| `order_number` | VARCHAR(50) | Buyurtma raqami | ✅ (UNIQUE) |
| `marketplace_id` | INTEGER | Platform | ✅ |
| `marketplace_order_id` | VARCHAR(200) | Marketplace order ID | ❌ |
| `user_id` | INTEGER | User (agar A Store) | ❌ |
| `customer_name` | VARCHAR(200) | Mijoz ismi | ✅ |
| `customer_phone` | VARCHAR(50) | Telefon | ✅ |
| `customer_address` | TEXT | Manzil | ❌ |
| `subtotal` | NUMERIC(10,2) | Oraliq summa | ✅ |
| `delivery_fee` | NUMERIC(10,2) | Yetkazib berish | ❌ (default: 0) |
| `total` | NUMERIC(10,2) | Jami summa | ✅ |
| `status` | VARCHAR(20) | Holat | ❌ (default: 'pending') |
| `payment_status` | VARCHAR(20) | To'lov holati | ❌ (default: 'unpaid') |
| `payment_method` | VARCHAR(50) | To'lov usuli | ❌ |
| `total_cost` | NUMERIC(10,2) | Tannarx (analytics) | ❌ |
| `total_profit` | NUMERIC(10,2) | Foyda (analytics) | ❌ |
| `order_date` | TIMESTAMP | Buyurtma sanasi | ❌ (default: NOW()) |
| `delivery_date` | TIMESTAMP | Yetkazish sanasi | ❌ |
| `confirmed_at` | TIMESTAMP | Tasdiqlangan vaqt | ❌ |
| `delivered_at` | TIMESTAMP | Yetkazilgan vaqt | ❌ |
| `cancelled_at` | TIMESTAMP | Bekor qilingan vaqt | ❌ |
| `created_at` | TIMESTAMP | Yaratilgan | ✅ |
| `updated_at` | TIMESTAMP | Yangilangan | ✅ |

#### Foreign Keys:
- `marketplace_id` → `marketplaces(id)` ON DELETE RESTRICT
- `user_id` → `users(id)` ON DELETE SET NULL

#### Indexlar:
- `idx_orders_user` - User orders
- `idx_orders_marketplace` - Marketplace orders
- `idx_orders_status` - Status filter
- `idx_orders_number` - Order number lookup
- `idx_orders_mp_order` - Marketplace order ID
- `idx_orders_date` - Date-based queries

#### Qayerda ishlatiladi:

**API Endpoints:**
- ✅ `GET /api/orders` - Foydalanuvchi buyurtmalari
  - **File:** `amazing store/backend/routes/orders.js` (lines 43-101)
  - **Query:** 
    ```sql
    SELECT
        o.id, o.order_number, o.status, o.created_at, o.updated_at,
        o.subtotal, o.delivery_fee, o.total, o.payment_status,
        json_agg(json_build_object('product_id', oi.product_id, 'quantity', oi.quantity, 'price', oi.price)) as items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.user_id = $1
    GROUP BY o.id
    ORDER BY o.created_at DESC
    ```

- ✅ `POST /api/orders` - Yangi buyurtma yaratish
  - **File:** `amazing store/backend/routes/orders.js` (lines 184-410)
  - **Query (Get/Create Marketplace):** `SELECT id FROM marketplaces WHERE name_en = 'Amazing Store'`
  - **Query (Get User Info):** `SELECT first_name, last_name, phone FROM users WHERE id = $1`
  - **Query (Insert Order):** 
    ```sql
    INSERT INTO orders (
        order_number, marketplace_id, user_id,
        customer_name, customer_phone,
        subtotal, delivery_fee, total,
        status, payment_status, payment_method
    ) VALUES (...) RETURNING id
    ```

**Frontend:**
- `amazing store/frontend/src/js/api.js` - Order API calls
- Future: Order history page

---

### 1️⃣1️⃣ **ORDER_ITEMS** - Buyurtma tarkibi

**Maqsadi:** Har bir buyurtmadagi mahsulotlar (product snapshot)

#### Columnlar:

| Column | Type | Description | Required |
|--------|------|-------------|----------|
| `id` | SERIAL | Primary key | ✅ |
| `order_id` | INTEGER | Buyurtma ID | ✅ |
| `product_id` | INTEGER | Mahsulot ID | ❌ (SET NULL) |
| `product_name` | VARCHAR(255) | Mahsulot nomi (snapshot) | ✅ |
| `product_sku` | VARCHAR(100) | SKU (snapshot) | ✅ |
| `marketplace_product_id` | VARCHAR(200) | Marketplace product ID | ❌ |
| `price` | NUMERIC(10,2) | Narx (snapshot) | ✅ |
| `cost_price` | NUMERIC(10,2) | Tannarx (snapshot) | ❌ |
| `quantity` | INTEGER | Miqdor | ✅ |
| `subtotal` | NUMERIC(10,2) | Oraliq summa | ✅ |
| `profit` | NUMERIC(10,2) | Foyda | ❌ |
| `created_at` | TIMESTAMP | Yaratilgan | ✅ |

#### Foreign Keys:
- `order_id` → `orders(id)` ON DELETE CASCADE
- `product_id` → `products(id)` ON DELETE SET NULL

#### Checks:
- `quantity > 0`

#### Indexlar:
- `idx_order_items_order` - Order items
- `idx_order_items_product` - Product orders
- `idx_order_items_sku` - SKU lookup

#### Qayerda ishlatiladi:

**API Endpoints:**
- ✅ `GET /api/orders` - Order details
  - **File:** `amazing store/backend/routes/orders.js` (lines 43-101)
  - **Query:** `LEFT JOIN order_items oi ON o.id = oi.order_id`

- ✅ `POST /api/orders` - Create order items
  - **File:** `amazing store/backend/routes/orders.js` (lines 295-302)
  - **Query:** `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)`

---

### 1️⃣2️⃣ **BANNERS** - Marketing Bannerlar

**Maqsadi:** Amazing Store miniapp uchun marketing sliders (multilang)

#### Columnlar:

| Column | Type | Description | Required |
|--------|------|-------------|----------|
| `id` | SERIAL | Primary key | ✅ |
| `title_uz` | VARCHAR(255) | O'zbekcha sarlavha | ❌ |
| `title_ru` | VARCHAR(255) | Ruscha sarlavha | ❌ |
| `image_url` | TEXT | Rasm URL | ✅ |
| `link_type` | VARCHAR(20) | Link turi | ❌ |
| `link_id` | INTEGER | Link ID | ❌ |
| `link_url` | TEXT | External URL | ❌ |
| `sort_order` | INTEGER | Tartib | ❌ (default: 0) |
| `is_active` | BOOLEAN | Faol/Faol emas | ❌ (default: TRUE) |
| `created_at` | TIMESTAMP | Yaratilgan | ✅ |
| `updated_at` | TIMESTAMP | Yangilangan | ✅ |

#### Indexlar:
- `idx_banners_active` - Active filter

#### Qayerda ishlatiladi:

**API Endpoints:**
- ✅ `GET /api/banners` - Barcha faol bannerlar
  - **File:** `amazing store/backend/routes/banners.js` (lines 15-50)
  - **Query:** 
    ```sql
    SELECT 
        id, 
        CASE WHEN $1 = 'ru' THEN title_ru ELSE title_uz END as title, 
        image_url, 
        link_type, 
        link_id, 
        link_url, 
        is_active, 
        sort_order 
    FROM banners 
    WHERE is_active = TRUE 
    ORDER BY sort_order ASC
    ```
  - **Cache:** `banners:{lang}` (5 min TTL)

**Frontend:**
- `amazing store/frontend/src/js/state.js` - `state.banners`
- `amazing store/frontend/src/js/ui.js` - Banner slider rendering

---

### 1️⃣3️⃣ **MARKETPLACE_WEBHOOKS** - Webhook Events

**Maqsadi:** Marketplace webhooklar history (event-driven architecture)

#### Columnlar:

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `id` | SERIAL | Primary key | 1234 |
| `marketplace_id` | INTEGER | Platform | 2 (Uzum) |
| `event_type` | VARCHAR(50) | Event type | 'stock.updated', 'order.created' |
| `payload` | JSONB | Webhook payload | `{"stock": 50, "sku": "ABC123"}` |
| `signature` | VARCHAR(500) | Webhook signature | "sha256=..." |
| `status` | VARCHAR(20) | Processing status | 'pending', 'processed', 'failed' |
| `processed_at` | TIMESTAMP | Processed time | 2026-01-10 14:30:00 |
| `error_message` | TEXT | Error (if failed) | "Invalid SKU" |
| `retry_count` | INTEGER | Retry attempts | 0 |
| `created_at` | TIMESTAMP | Received time | 2026-01-10 14:30:00 |

#### Foreign Keys:
- `marketplace_id` → `marketplaces(id)` ON DELETE CASCADE

#### Indexlar:
- `idx_webhooks_marketplace` - Marketplace webhooks
- `idx_webhooks_status` - Pending webhooks
- `idx_webhooks_event` - Event type
- `idx_webhooks_created` - Time-based queries

#### Qayerda ishlatiladi:

**Future Use:**
- 🔄 Webhook receiver endpoint - save incoming webhooks
- 🔄 Webhook processor job - process pending webhooks
- 📊 Monitoring - webhook success/failure rates

---

### 1️⃣4️⃣ **SYNC_LOGS** - Sync History

**Maqsadi:** Barcha sync operatsiyalarning tarixi va xatoliklari (monitoring + debugging)

#### Columnlar:

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `id` | SERIAL | Primary key | 5678 |
| `marketplace_id` | INTEGER | Platform | 3 (Wildberries) |
| `sync_type` | VARCHAR(20) | Sync type | 'stock', 'price', 'order' |
| `direction` | VARCHAR(10) | Direction | 'push', 'pull' |
| `trigger_type` | VARCHAR(20) | Trigger | 'webhook', 'manual', 'scheduled' |
| `status` | VARCHAR(20) | Status | 'success', 'failed', 'partial' |
| `items_processed` | INTEGER | Success count | 45 |
| `items_failed` | INTEGER | Failed count | 2 |
| `error_message` | TEXT | Error details | "API rate limit exceeded" |
| `started_at` | TIMESTAMP | Start time | 2026-01-10 14:00:00 |
| `completed_at` | TIMESTAMP | End time | 2026-01-10 14:02:30 |
| `duration_ms` | INTEGER | Duration | 150000 (2.5 min) |

#### Foreign Keys:
- `marketplace_id` → `marketplaces(id)` ON DELETE CASCADE

#### Indexlar:
- `idx_sync_logs_marketplace` - Marketplace syncs
- `idx_sync_logs_type` - Sync type
- `idx_sync_logs_trigger` - Trigger type
- `idx_sync_logs_status` - Status filter
- `idx_sync_logs_started` - Time-based queries

#### Qayerda ishlatiladi:

**Future Use:**
- 🔄 Sync jobs - log each sync operation
- 📊 Monitoring dashboard - sync health metrics
- 🐛 Debugging - error investigation

---

## 🚨 HOZIRGI MUAMMOLAR VA FIXLAR

### ⚠️ BUG #1: `users.js` line 110 - Table name xato

**File:** `amazing store/backend/routes/users.js`  
**Line:** 110  
**Current:** 
```javascript
SELECT product_id FROM user_favorites WHERE user_id = $1
```

**Should be:**
```javascript
SELECT product_id FROM favorites WHERE user_id = $1
```

**Impact:** `GET /api/users/profile` endpoint 500 error beradi!

---

## 📈 KELAJAK UCHUN TO'LIQ ISHLAMAGAN TABLELAR

Quyidagi tablelar yaratilgan lekin hali API'larda ishlatilmayapti:

1. ❌ **inventory** - Stock integration bo'lmagan
2. ❌ **inventory_movements** - Stock tracking yo'q
3. ❌ **marketplace_products** - SKU mapping implementatsiya qilinmagan
4. ❌ **marketplace_webhooks** - Webhook receiver yo'q
5. ❌ **sync_logs** - Sync system mavjud emas

**To'liq ishlatish uchun kerak:**
- 🔄 Marketplace API integration (Uzum, WB, OZON)
- 🔄 Webhook receiver endpoints
- 🔄 Stock sync background jobs
- 📊 Analytics dashboard

---

## 🎯 TO'LIQ ISHLAYOTGAN TABLELAR VA API'LAR

### ✅ 100% Implemented:

1. ✅ **users** - Authentication, profile management
2. ✅ **categories** - Category list, CRUD (admin)
3. ✅ **products** - Product list, search, filter, pagination
4. ✅ **cart_items** - Full cart management
5. ✅ **favorites** - Wishlist management
6. ✅ **orders** - Order creation (Amazing Store only)
7. ✅ **order_items** - Order details
8. ✅ **banners** - Banner slider
9. ✅ **marketplaces** - Auto-create "Amazing Store" on order

---

## 🔗 BARCHA CONNECTION MAPLAR

### Amazing Store Backend → PostgreSQL

| Service | Connection File | Tables Used |
|---------|----------------|-------------|
| Amazing Store Backend | `amazing store/backend/db.js` | ALL (14 tables) |
| Seller App Backend | `seller-app/backend/db.js` | Future |

### Connection Config:

**File:** `amazing store/backend/db.js`

```javascript
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
```

**Environment Variable:** `DATABASE_URL` (Railway PostgreSQL)

---

## 📝 SUMMARY

| Status | Count | Tables |
|--------|-------|--------|
| ✅ Fully Implemented | 9 | users, categories, products, cart_items, favorites, orders, order_items, banners, marketplaces |
| 🔄 Partially Implemented | 1 | inventory (used in products API but no write) |
| ❌ Not Implemented | 4 | inventory_movements, marketplace_products, marketplace_webhooks, sync_logs |
| **TOTAL** | **14** | **Professional Event-Driven Schema** |

---

**Last Updated:** 2026-01-10  
**Database Version:** Professional Schema v1.0  
**Migration:** `000_RESET_DATABASE.sql`

