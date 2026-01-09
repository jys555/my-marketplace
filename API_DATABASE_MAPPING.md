# API → DATABASE MAPPING
**Complete reference for all API routes and their database interactions**

Last updated: 2026-01-09  
Database Schema Version: `000_RESET_DATABASE.sql`

---

## 📊 DATABASE TABLES (16 total)

### Business Tables (15)
1. **users** - Customer & admin accounts
2. **categories** - Product categories (hierarchical, multilang)
3. **products** - Master product catalog
4. **inventory** - Unified stock management
5. **inventory_movements** - Stock change history
6. **marketplaces** - External platforms (Uzum, OZON, etc.)
7. **marketplace_products** - Products on external platforms
8. **marketplace_webhooks** - Webhook event logs
9. **cart_items** - Shopping cart items
10. **favorites** - User favorite products
11. **orders** - All orders (unified)
12. **order_items** - Order line items
13. **banners** - Homepage banners
14. **price_history** - Price change tracking (analytics)
15. **sync_logs** - Marketplace sync history

### Technical Tables (1)
16. **schema_migrations** - Migration tracking (auto-managed)

---

## 🔗 API ROUTES → DATABASE TABLES

### 1. **Products API** (`/api/products`)

**File:** `amazing store/backend/routes/products.js`

**Tables Used:**
- `products` (main)
- `inventory` (LEFT JOIN for stock)
- `categories` (referenced via foreign key)

**Key Columns:**
```sql
-- products table
p.id, p.sku, p.barcode
p.name_uz, p.name_ru              -- Multilang
p.description_uz, p.description_ru
p.category_id
p.price, p.sale_price, p.cost_price
p.image_url
p.is_active
p.view_count, p.order_count

-- inventory table (JOIN)
i.quantity AS stock_quantity
i.reserved_quantity
```

**Endpoints:**
- `GET /api/products` - List products with pagination
  - Query params: `lang`, `limit`, `offset`, `category_id`
  - Returns: `{ products: [], pagination: {...} }`

---

### 2. **Banners API** (`/api/banners`)

**File:** `amazing store/backend/routes/banners.js`

**Tables Used:**
- `banners`

**Key Columns:**
```sql
id
title_uz, title_ru                -- Multilang (displayed as 'title')
image_url
link_type, link_id, link_url      -- New flexible linking system
sort_order
is_active
```

**Endpoints:**
- `GET /api/banners` - Get active banners
  - Query params: `lang`
  - Cached for 5 minutes
  - Returns: Array of banner objects

---

### 3. **Categories API** (`/api/categories`)

**File:** `amazing store/backend/routes/categories.js`

**Tables Used:**
- `categories`

**Key Columns:**
```sql
id
name_uz, name_ru                  -- Multilang
parent_id                         -- Hierarchical structure
icon, color
sort_order
is_active
```

**Endpoints:**
- `GET /api/categories` - Get all active categories
  - Query params: `lang`
  - Cached for 5 minutes
- `POST /api/categories` - Create category (Admin only)
- `PUT /api/categories/:id` - Update category (Admin only)

---

### 4. **Cart API** (`/api/cart`)

**File:** `amazing store/backend/routes/cart.js`

**Tables Used:**
- `cart_items` (main)
- `products` (JOIN for product details)

**Key Columns:**
```sql
-- cart_items table
ci.id
ci.user_id, ci.product_id
ci.quantity
ci.is_selected, ci.is_liked
ci.created_at, ci.updated_at

-- products table (JOIN)
p.name_uz, p.name_ru
p.price, p.sale_price
p.image_url
p.sku
```

**Endpoints:**
- `GET /api/cart` - Get user's cart items
- `POST /api/cart` - Add item to cart
  - Body: `{ product_id, quantity }`
- `PATCH /api/cart/:id` - Update cart item
  - Body: `{ quantity?, is_selected?, is_liked? }`
- `DELETE /api/cart/:id` - Remove cart item
- `DELETE /api/cart` - Clear entire cart
- `PATCH /api/cart/select-all` - Select/deselect all items
  - Body: `{ is_selected }`

---

### 5. **Favorites API** (`/api/users/favorites`)

**File:** `amazing store/backend/routes/users.js`

**Tables Used:**
- `favorites` (user_favorites in code comments)
- `products` (optional JOIN for details)

**Key Columns:**
```sql
user_id, product_id
created_at
UNIQUE(user_id, product_id)
```

**Endpoints:**
- `GET /api/users/favorites` - Get user favorites
  - Returns: `{ favorites: [product_id, ...] }`
- `PUT /api/users/favorites` - Sync all favorites
  - Body: `{ favorites: [product_id, ...] }`
- `POST /api/users/favorites/:productId` - Add to favorites
- `DELETE /api/users/favorites/:productId` - Remove from favorites

---

### 6. **Users API** (`/api/users`)

**File:** `amazing store/backend/routes/users.js`

**Tables Used:**
- `users` (main)
- `favorites` (for user profile)

**Key Columns:**
```sql
id
telegram_id                       -- UNIQUE, NOT NULL
first_name, last_name, username
phone
language                          -- 'uz' or 'ru'
is_active, is_admin
created_at, updated_at, last_login_at
```

**Endpoints:**
- `POST /api/users/validate` - Validate Telegram user
  - Returns: User data with favorites array
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Create/update profile
  - Body: `{ first_name, last_name, phone }`
- `PUT /api/users/cart` - Update cart (DEPRECATED - use Cart API)
- `GET /api/users/check-admin` - Check admin status

---

### 7. **Orders API** (`/api/orders`)

**File:** `amazing store/backend/routes/orders.js`

**Tables Used:**
- `orders` (main)
- `order_items` (JOIN for order details)
- `marketplaces` (referenced via foreign key)
- `products` (referenced via order_items)

**Key Columns:**
```sql
-- orders table
o.id, o.order_number
o.marketplace_id, o.marketplace_order_id
o.user_id
o.customer_name, o.customer_phone, o.customer_address
o.subtotal, o.delivery_fee, o.total
o.status, o.payment_status, o.payment_method
o.total_cost, o.total_profit
o.order_date, o.delivery_date
o.confirmed_at, o.delivered_at, o.cancelled_at

-- order_items table (JOIN)
oi.product_id, oi.quantity
oi.price, oi.cost, oi.profit
```

**Endpoints:**
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create new order
  - Body: `{ items: [{product_id, quantity}], customer_info, delivery_method, payment_method }`
- `GET /api/orders/:id` - Get order details
- `PATCH /api/orders/:id/status` - Update order status (Admin)

---

## 🔄 DEPRECATED / REMOVED FEATURES

### ❌ Old Schema (Removed)
- `users.favorites` (JSONB column) → Moved to `favorites` table
- `users.cart` (JSONB column) → Moved to `cart_items` table
- `products.current_price` → Now just `products.price`
- `products.current_sale_price` → Now just `products.sale_price`
- `products.stock_quantity` → Moved to `inventory.quantity`
- `product_prices` table → Merged into `products` table
- `product_analytics` table → Replaced by `price_history` + view_count/order_count
- `banners.title` → Split into `title_uz` and `title_ru`

---

## 🆕 NEW FEATURES (Professional Schema)

### ✅ Multilang Support
All user-facing text now has `_uz` and `_ru` variants:
- `products`: name_uz, name_ru, description_uz, description_ru
- `categories`: name_uz, name_ru
- `banners`: title_uz, title_ru

### ✅ Unified Inventory
- Single source of truth: `inventory` table
- Real-time stock tracking
- Reserved quantity for pending orders
- Stock history: `inventory_movements` table

### ✅ Marketplace Integration
- `marketplaces`: Platform definitions (Uzum, OZON, etc.)
- `marketplace_products`: Product mappings
- `marketplace_webhooks`: Event-driven sync
- `sync_logs`: Sync history and debugging

### ✅ Enhanced Analytics
- `price_history`: Track all price changes
- `products.view_count`: Product page views
- `products.order_count`: Number of times ordered
- `orders.total_cost`, `orders.total_profit`: Financial analytics

### ✅ Flexible Banners
- `link_type`: 'product', 'category', 'url', etc.
- `link_id`: ID of linked entity (if applicable)
- `link_url`: Direct URL (if external link)

---

## 🔒 IMPORTANT CONSTRAINTS

### Foreign Keys
```sql
products.category_id → categories.id (ON DELETE SET NULL)
inventory.product_id → products.id (ON DELETE CASCADE)
cart_items.user_id → users.id (ON DELETE CASCADE)
cart_items.product_id → products.id (ON DELETE CASCADE)
favorites.user_id → users.id (ON DELETE CASCADE)
favorites.product_id → products.id (ON DELETE CASCADE)
orders.marketplace_id → marketplaces.id (ON DELETE RESTRICT)
orders.user_id → users.id (ON DELETE SET NULL)
order_items.order_id → orders.id (ON DELETE CASCADE)
order_items.product_id → products.id (ON DELETE RESTRICT)
```

### Unique Constraints
```sql
users.telegram_id (UNIQUE)
products.sku (UNIQUE)
categories.name_uz (UNIQUE, if no parent)
cart_items (user_id, product_id) (UNIQUE)
favorites (user_id, product_id) (UNIQUE)
orders.order_number (UNIQUE)
```

### Check Constraints
```sql
products.price >= 0
products.sale_price >= 0 (if not null)
products.cost_price >= 0 (if not null)
inventory.quantity >= 0
inventory.reserved_quantity >= 0
```

---

## 📝 MIGRATION NOTES

### Applied Migrations
1. **000_RESET_DATABASE.sql** (version 0)
   - Complete database reset
   - 15 business tables + 1 migration tracking table
   - Professional schema with best practices

### Migration Runner
- **Location:** `amazing store/backend/utils/migrate.js`
- **Special handling:** `000_RESET_DATABASE.sql` always runs (no skip check)
- **Tracking:** `schema_migrations` table

---

## 🎯 BEST PRACTICES

1. **Always use prepared statements** - All queries use parameterized queries ($1, $2, etc.)
2. **Language support** - Always accept `lang` parameter (uz/ru)
3. **Cache frequently accessed data** - Banners, categories cached for 5 minutes
4. **Pagination** - Products API uses LIMIT/OFFSET
5. **Soft deletes** - Use `is_active` instead of DELETE where appropriate
6. **Timestamps** - All tables have `created_at`, many have `updated_at`
7. **Logging** - All operations logged with Winston logger
8. **Error handling** - Use custom error classes (ValidationError, NotFoundError, etc.)

---

## 🔧 TROUBLESHOOTING

### Common Errors

**`column "X" does not exist`**
- Check this document for correct column names
- Table might use multilang columns (_uz, _ru)
- Column might have been moved to another table (e.g., stock_quantity → inventory)

**`relation "X" does not exist`**
- Table name might have changed
- Check if migration 000_RESET_DATABASE.sql ran successfully
- Verify database connection is correct

**Foreign key constraint violation**
- Check if referenced record exists
- Verify ON DELETE behavior
- Use transactions for multi-table operations

---

## 📚 RELATED DOCUMENTATION

- `DATABASE_SCHEMA_REAL_BUSINESS.md` - Detailed schema explanation
- `ARCHITECTURE_EVENT_DRIVEN.md` - Event-driven sync architecture
- `amazing store/backend/migrations/000_RESET_DATABASE.sql` - Schema SQL

---

**This document is the single source of truth for API-Database interactions.**  
**Update this file whenever adding new endpoints or modifying schema!**

