# 🔍 Database Index Analysis - Batafsil Tahlil

## 📊 Query Pattern Analysis

### 1. **Products Queries**

#### Query 1: Products List (Amazing Store)
```sql
SELECT ... FROM products p
WHERE p.category_id = $1 AND p.is_active = true
ORDER BY p.created_at DESC
LIMIT $2 OFFSET $3
```
**Kerakli indexlar:**
- ✅ `category_id` - WHERE filter
- ✅ `is_active` - WHERE filter (partial index yaxshiroq)
- ✅ `created_at DESC` - ORDER BY
- ⭐ **Composite:** `(category_id, is_active, created_at DESC)` - EN YAXSHI!

#### Query 2: Products List (Seller App)
```sql
SELECT ... FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.category_id = $1 (optional)
  AND (p.name_uz ILIKE '%search%' OR p.name_ru ILIKE '%search%' OR p.sku ILIKE '%search%') (optional)
ORDER BY p.created_at DESC
LIMIT $2 OFFSET $3
```
**Kerakli indexlar:**
- ✅ `category_id` - WHERE filter
- ✅ `created_at DESC` - ORDER BY
- ⚠️ `name_uz, name_ru, sku` - ILIKE search (text search, GIN index kerak emas, kichik table)

#### Query 3: Product by ID or SKU
```sql
SELECT ... FROM products p
WHERE p.id = $1 OR p.sku = $1
```
**Kerakli indexlar:**
- ✅ `id` - PRIMARY KEY (allaqachon bor)
- ✅ `sku` - UNIQUE constraint (allaqachon index bor)

#### Query 4: Products by IDs (Array)
```sql
SELECT id, price, sale_price FROM products
WHERE id = ANY($1::int[])
```
**Kerakli indexlar:**
- ✅ `id` - PRIMARY KEY (allaqachon bor)

#### Query 5: SKU Check
```sql
SELECT id FROM products WHERE sku = $1
```
**Kerakli indexlar:**
- ✅ `sku` - UNIQUE constraint (allaqachon index bor)

---

### 2. **Orders Queries**

#### Query 1: User Orders (Amazing Store)
```sql
SELECT ... FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.user_id = $1
GROUP BY o.id
ORDER BY o.created_at DESC
```
**Kerakli indexlar:**
- ✅ `user_id` - WHERE filter
- ✅ `created_at DESC` - ORDER BY
- ⭐ **Composite:** `(user_id, created_at DESC)` - YAXSHI!

#### Query 2: Orders List (Seller App)
```sql
SELECT ... FROM orders o
LEFT JOIN marketplaces m ON o.marketplace_id = m.id
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.marketplace_id = $1 (optional)
  AND o.status = $2 (optional)
  AND o.order_date >= $3 (optional)
  AND o.order_date <= $4 (optional)
GROUP BY o.id, m.name, m.api_type
ORDER BY o.created_at DESC
```
**Kerakli indexlar:**
- ✅ `marketplace_id` - WHERE filter ⚠️ **QO'SHILMAGAN!**
- ✅ `status` - WHERE filter
- ✅ `order_date` - WHERE filter (date range) ⚠️ **QO'SHILMAGAN!**
- ✅ `created_at DESC` - ORDER BY
- ⭐ **Composite:** `(marketplace_id, status, order_date, created_at DESC)` - ENG YAXSHI!

#### Query 3: Order by ID
```sql
SELECT ... FROM orders o
WHERE o.id = $1
```
**Kerakli indexlar:**
- ✅ `id` - PRIMARY KEY (allaqachon bor)

#### Query 4: Order Status Update
```sql
UPDATE orders
SET status = $1, updated_at = NOW()
WHERE id = $2
```
**Kerakli indexlar:**
- ✅ `id` - PRIMARY KEY (allaqachon bor)

#### Query 5: Order Items by Order ID
```sql
SELECT product_id, quantity
FROM order_items
WHERE order_id = $1
```
**Kerakli indexlar:**
- ✅ `order_id` - allaqachon bor migrationda

---

### 3. **Order Items Queries**

#### Query 1: Order Items with Products
```sql
SELECT ... FROM order_items oi
INNER JOIN products p ON oi.product_id = p.id
WHERE oi.order_id = $1
ORDER BY oi.id ASC
```
**Kerakli indexlar:**
- ✅ `order_id` - allaqachon bor
- ✅ `product_id` - JOIN uchun (allaqachon bor migrationda)

---

### 4. **Inventory Queries**

#### Query 1: Inventory List
```sql
SELECT ... FROM inventory i
INNER JOIN products p ON i.product_id = p.id
WHERE 1=1
ORDER BY p.name_uz ASC
```
**Kerakli indexlar:**
- ✅ `product_id` - JOIN uchun (UNIQUE constraint bor, index ham bor)

#### Query 2: Inventory by Product ID
```sql
SELECT ... FROM inventory i
INNER JOIN products p ON i.product_id = p.id
WHERE i.product_id = $1
```
**Kerakli indexlar:**
- ✅ `product_id` - UNIQUE constraint (index allaqachon bor)

#### Query 3: Inventory Update
```sql
UPDATE inventory
SET quantity = ...
WHERE product_id = $1
```
**Kerakli indexlar:**
- ✅ `product_id` - UNIQUE constraint (index allaqachon bor)

#### Query 4: Inventory Movements
```sql
SELECT ... FROM inventory_movements im
INNER JOIN products p ON im.product_id = p.id
WHERE im.product_id = $1
ORDER BY im.created_at DESC
LIMIT $2
```
**Kerakli indexlar:**
- ✅ `product_id` - WHERE filter ⚠️ **QO'SHILMAGAN!**
- ✅ `created_at DESC` - ORDER BY ⚠️ **QO'SHILMAGAN!**
- ⭐ **Composite:** `(product_id, created_at DESC)` - YAXSHI!

---

### 5. **Product Prices Queries**

#### Query 1: Prices List
```sql
SELECT ... FROM product_prices pp
INNER JOIN products p ON pp.product_id = p.id
LEFT JOIN marketplaces m ON pp.marketplace_id = m.id
WHERE pp.marketplace_id = $1 (optional)
  AND pp.product_id = $2 (optional)
ORDER BY p.name_uz ASC
```
**Kerakli indexlar:**
- ✅ `product_id` - JOIN va WHERE
- ✅ `marketplace_id` - WHERE filter
- ⭐ **Composite:** `(product_id, marketplace_id)` - UNIQUE constraint (allaqachon bor)

#### Query 2: Price by ID
```sql
SELECT ... FROM product_prices pp
WHERE pp.id = $1
```
**Kerakli indexlar:**
- ✅ `id` - PRIMARY KEY (allaqachon bor)

---

### 6. **Categories Queries**

#### Query 1: Categories List
```sql
SELECT ... FROM categories
WHERE is_active = TRUE
ORDER BY sort_order ASC
```
**Kerakli indexlar:**
- ⚠️ `is_active` - kichik table, cache'da, index kerak emas
- ⚠️ `sort_order` - kichik table, index kerak emas

**Xulosa:** Cache'da, kichik table, index kerak emas.

---

### 7. **Banners Queries**

#### Query 1: Active Banners
```sql
SELECT ... FROM banners
WHERE is_active = TRUE
ORDER BY sort_order ASC
```
**Kerakli indexlar:**
- ✅ `is_active` - WHERE filter (partial index)
- ⚠️ `sort_order` - kichik table, cache'da, index kerak emas

---

### 8. **Users Queries**

#### Query 1: User by Telegram ID
```sql
SELECT ... FROM users
WHERE telegram_id = $1
```
**Kerakli indexlar:**
- ✅ `telegram_id` - allaqachon bor migrationda

#### Query 2: User by ID
```sql
SELECT ... FROM users
WHERE id = $1
```
**Kerakli indexlar:**
- ✅ `id` - PRIMARY KEY (allaqachon bor)

---

### 9. **Marketplaces Queries**

#### Query 1: Marketplaces List
```sql
SELECT ... FROM marketplaces
ORDER BY name ASC
```
**Kerakli indexlar:**
- ⚠️ `name` - kichik table, cache'da, index kerak emas

---

### 10. **Analytics Queries**

#### Query 1: Monthly Analytics
```sql
SELECT ... FROM daily_analytics
WHERE EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2
```
**Kerakli indexlar:**
- ✅ `date` - WHERE filter (date range) ⚠️ **QO'SHILMAGAN!**

---

## 🎯 Missing Indexlar (Hozirgi Migrationda Yo'q)

### Critical (Qo'shilishi Shart):

1. **Orders:**
   - ⚠️ `marketplace_id` - WHERE filter
   - ⚠️ `order_date` - WHERE filter (date range)

2. **Inventory Movements:**
   - ⚠️ `product_id` - WHERE filter
   - ⚠️ `created_at DESC` - ORDER BY

3. **Daily Analytics:**
   - ⚠️ `date` - WHERE filter

### Optional (Yaxshi, Lekin Majburiy Emas):

4. **Categories:**
   - `sort_order` - ORDER BY (kichik table, cache'da)

5. **Banners:**
   - `sort_order` - ORDER BY (kichik table, cache'da)

6. **Marketplaces:**
   - `name` - ORDER BY (kichik table, cache'da)

---

## 📋 Index Priority

### Priority 1 (Critical - Qo'shish Shart):
- ✅ Products: `category_id`, `is_active`, `created_at`, composite
- ✅ Orders: `user_id`, `status`, `created_at`, `order_number`, composite
- ⚠️ **Orders: `marketplace_id`** - QO'SHILMADI!
- ⚠️ **Orders: `order_date`** - QO'SHILMADI!
- ✅ Order Items: `order_id`, `product_id` (allaqachon bor)
- ✅ Product Prices: `product_id`, `marketplace_id`, composite
- ✅ Inventory: `product_id` (UNIQUE constraint bor)
- ⚠️ **Inventory Movements: `product_id`, `created_at`** - QO'SHILMADI!

### Priority 2 (Important - Qo'shish Yaxshi):
- ✅ Banners: `is_active`, `created_at` (partial index)

### Priority 3 (Optional - Kichik Table, Cache'da):
- Categories: `sort_order` (kerak emas)
- Banners: `sort_order` (kerak emas)
- Marketplaces: `name` (kerak emas)

---

## ✅ Hozirgi Migrationda Bor Indexlar

### Products:
- ✅ `idx_products_category_id`
- ✅ `idx_products_created_at`
- ✅ `idx_products_is_active` (partial)
- ✅ `idx_products_category_active_date` (composite)
- ✅ `idx_products_sku_lookup`

### Banners:
- ✅ `idx_banners_is_active` (partial)
- ✅ `idx_banners_created_at`
- ✅ `idx_banners_active_date` (composite)

### Orders:
- ✅ `idx_orders_user_id`
- ✅ `idx_orders_status`
- ✅ `idx_orders_created_at`
- ✅ `idx_orders_order_number`
- ✅ `idx_orders_user_status_date` (composite)

### Order Items:
- ✅ `idx_order_items_order_id` (allaqachon bor migrationda)
- ✅ `idx_order_items_product_id` (allaqachon bor migrationda)

### Product Prices:
- ✅ `idx_product_prices_product_id`
- ✅ `idx_product_prices_marketplace_id`
- ✅ `idx_product_prices_product_marketplace` (composite, UNIQUE)

### Inventory:
- ✅ `idx_inventory_product_id` (UNIQUE constraint bor)
- ✅ `idx_inventory_marketplace_id` (lekin migrationda marketplace_id yo'q ekan!)
- ✅ `idx_inventory_product_marketplace` (lekin migrationda marketplace_id yo'q ekan!)

### Categories:
- ✅ `idx_categories_name_uz`
- ✅ `idx_categories_name_ru`

---

## ⚠️ QO'SHILMAGAN Critical Indexlar

1. **Orders:**
   - `marketplace_id` - Seller App'da WHERE filter
   - `order_date` - Seller App'da date range filter

2. **Inventory Movements:**
   - `product_id` - WHERE filter
   - `created_at DESC` - ORDER BY

3. **Daily Analytics:**
   - `date` - WHERE filter (month/year)

4. **Inventory:**
   - Migrationda `marketplace_id` indexlar qo'shilgan, lekin table'da `marketplace_id` column yo'q ekan! (001 migrationda yo'q)

---

## 🔧 Tuzatishlar Kerak

1. ✅ Orders `order_number` index qo'shildi (foydalanuvchi so'ragan)
2. ⚠️ Orders `marketplace_id` index qo'shish kerak
3. ⚠️ Orders `order_date` index qo'shish kerak
4. ⚠️ Inventory Movements indexlar qo'shish kerak
5. ⚠️ Daily Analytics `date` index qo'shish kerak
6. ⚠️ Inventory `marketplace_id` indexlarni olib tashlash kerak (column yo'q)
