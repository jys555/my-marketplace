# 🚀 Performance Optimization - Phase 2: Query Optimization va Database Indexes

## 📊 Hozirgi Holat

### ✅ Phase 1: TAMOM! (Pagination + Cache)

**Nima qilindi:**
- ✅ Backend pagination (Products)
- ✅ Frontend infinite scroll (Amazing Store + Seller App)
- ✅ Memory cache (Categories, Banners, Marketplaces)
- ✅ Cache invalidation

**Natija:**
- ⚡ 25-50 barobar tezroq
- 💾 97% kamroq database I/O
- 💰 $30/oy tejash

---

## 🎯 Phase 2: Query Optimization va Database Indexes

### Maqsad:
Database query'larni yanada optimallashtirish va tezroq ishlashini ta'minlash.

---

## 📋 Qadamlar

### Step 1: Database Indexes Tekshirish va Qo'shish

#### Nima Bu?
Index - Database'da tez qidirish uchun qo'shimcha struktura. Kitob ichidagi "Indeks" kabi.

#### Qaysi Columnlar Uchun Index Kerak?

**1. Products Table:**
```sql
-- Hozirgi holatni tekshirish
SELECT * FROM pg_indexes WHERE tablename = 'products';

-- Kerakli indexlar:
✅ PRIMARY KEY (id) - allaqachon bor
✅ category_id - WHERE, JOIN uchun
✅ created_at - ORDER BY uchun
✅ sku - UNIQUE search uchun (allaqachon bor)
✅ is_active - WHERE filter uchun
```

**2. Categories Table:**
```sql
-- Kerakli indexlar:
✅ PRIMARY KEY (id) - allaqachon bor
✅ name_uz, name_ru - search uchun (agar search bo'lsa)
```

**3. Banners Table:**
```sql
-- Kerakli indexlar:
✅ PRIMARY KEY (id) - allaqachon bor
✅ is_active - WHERE filter uchun
✅ created_at - ORDER BY uchun
```

**4. Orders Table:**
```sql
-- Kerakli indexlar:
✅ PRIMARY KEY (id) - allaqachon bor
✅ user_id - WHERE filter uchun
✅ status - WHERE filter uchun
✅ created_at - ORDER BY uchun
✅ order_number - UNIQUE lookup, search uchun (UNIQUE constraint bilan, lekin index qo'shish tezroq)
✅ user_id + status - composite index (ko'p ishlatiladi)
```

**5. Product Prices Table:**
```sql
-- Kerakli indexlar:
✅ PRIMARY KEY (id) - allaqachon bor
✅ product_id - JOIN uchun
✅ marketplace_id - WHERE filter uchun
✅ product_id + marketplace_id - composite index (UNIQUE)
```

**6. Inventory Table:**
```sql
-- Kerakli indexlar:
✅ PRIMARY KEY (id) - allaqachon bor
✅ product_id - JOIN uchun
✅ product_id + marketplace_id - composite index
```

---

### Step 2: SELECT Query Optimization

#### Hozirgi Holatni Tekshirish:

**Products Query:**
```sql
-- Hozirgi:
SELECT 
    p.id, p.name_uz, p.name_ru, p.description_uz, p.description_ru,
    p.price, p.sale_price, p.image_url, p.category_id, p.is_active,
    p.sku, p.created_at,
    c.name_uz as category_name_uz, c.name_ru as category_name_ru
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.category_id = $1
ORDER BY p.created_at DESC
LIMIT $2 OFFSET $3
```

**Tekshirish:**
- ✅ Faqat kerakli columns SELECT qilingan (yaxshi!)
- ✅ JOIN optimallashtirilgan (yaxshi!)
- ⚠️ Index tekshirish kerak

**Optimizatsiya:**
- Index qo'shish (category_id, created_at)
- Query plan tekshirish (EXPLAIN ANALYZE)

---

### Step 3: JOIN Optimization

#### Hozirgi Holatni Tekshirish:

**Products + Categories JOIN:**
```sql
-- Hozirgi:
LEFT JOIN categories c ON p.category_id = c.id

-- Tekshirish:
- ✅ LEFT JOIN to'g'ri (agar category yo'q bo'lsa ham mahsulot ko'rinadi)
- ⚠️ Index tekshirish: category_id index borligi
- ⚠️ Categories table'da id index borligi (PRIMARY KEY - allaqachon bor)
```

**Optimizatsiya:**
- Index qo'shish (agar yo'q bo'lsa)
- JOIN order optimallashtirish (kichik table birinchi)

---

### Step 4: Query Performance Analysis

#### EXPLAIN ANALYZE Qo'llash:

**Products Query:**
```sql
EXPLAIN ANALYZE
SELECT 
    p.id, p.name_uz, p.name_ru, p.description_uz, p.description_ru,
    p.price, p.sale_price, p.image_url, p.category_id, p.is_active,
    p.sku, p.created_at,
    c.name_uz as category_name_uz, c.name_ru as category_name_ru
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.category_id = 1
ORDER BY p.created_at DESC
LIMIT 50 OFFSET 0;
```

**Natijani Tekshirish:**
- Index Scan yoki Seq Scan?
- Query time (Execution Time)
- Rows examined vs Rows returned

**Maqsad:**
- Index Scan bo'lishi kerak (Seq Scan yomon)
- Execution Time < 50ms
- Rows examined = Rows returned (efficient)

---

## 🔧 Implementation Plan

### Task 1: Index Analysis Script

**Fayl:** `scripts/analyze-indexes.js`

**Funksiya:**
- Hozirgi indexlarni ko'rsatish
- Missing indexlarni aniqlash
- Query performance tekshirish

---

### Task 2: Index Migration

**Fayl:** `migrations/add-performance-indexes.sql`

**Indexlar:**

```sql
-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_category_id 
    ON products(category_id);

CREATE INDEX IF NOT EXISTS idx_products_created_at 
    ON products(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_is_active 
    ON products(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_products_category_active 
    ON products(category_id, is_active, created_at DESC);

-- Banners table indexes
CREATE INDEX IF NOT EXISTS idx_banners_is_active 
    ON banners(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_banners_created_at 
    ON banners(created_at DESC);

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id 
    ON orders(user_id);

CREATE INDEX IF NOT EXISTS idx_orders_status 
    ON orders(status);

CREATE INDEX IF NOT EXISTS idx_orders_created_at 
    ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_user_status 
    ON orders(user_id, status, created_at DESC);

-- Product Prices table indexes
CREATE INDEX IF NOT EXISTS idx_product_prices_product_id 
    ON product_prices(product_id);

CREATE INDEX IF NOT EXISTS idx_product_prices_marketplace_id 
    ON product_prices(marketplace_id);

-- Inventory table indexes
CREATE INDEX IF NOT EXISTS idx_inventory_product_id 
    ON inventory(product_id);

CREATE INDEX IF NOT EXISTS idx_inventory_product_marketplace 
    ON inventory(product_id, marketplace_id);
```

---

### Task 3: Query Optimization Review

**Tekshirish kerak bo'lgan querylar:**

1. **Products List Query:**
   - Index usage
   - JOIN performance
   - ORDER BY performance

2. **Categories Query:**
   - Simple SELECT (cache bilan yaxshi)

3. **Orders Query:**
   - WHERE user_id filter
   - WHERE status filter
   - ORDER BY created_at

4. **Product Prices Query:**
   - JOIN products
   - WHERE marketplace_id filter

5. **Inventory Query:**
   - JOIN products
   - WHERE product_id filter

---

### Task 4: Query Performance Monitoring

**Script:** `scripts/monitor-queries.js`

**Funksiya:**
- Slow query detection (100ms+)
- Query frequency tracking
- Index usage statistics

---

## 📊 Kutilayotgan Natijalar

### Query Performance:

**Oldin (Indexsiz):**
```
Products query: 50ms (Seq Scan)
Orders query: 80ms (Seq Scan)
Product Prices JOIN: 100ms (Nested Loop)
```

**Keyin (Index bilan):**
```
Products query: 5ms (Index Scan) ⚡ 10x tezroq
Orders query: 8ms (Index Scan) ⚡ 10x tezroq
Product Prices JOIN: 15ms (Index Scan) ⚡ 6x tezroq
```

### Database Load:

**Oldin:**
- CPU: 40% (constant scanning)
- Disk I/O: Ko'p (full table scan)

**Keyin:**
- CPU: 10% (index scan)
- Disk I/O: 80% kamaydi (index o'qish tezroq)

---

## ✅ Checklist

### Index Analysis:
- [ ] Hozirgi indexlarni ro'yxatga olish
- [ ] Missing indexlarni aniqlash
- [ ] Query pattern analysis

### Index Creation:
- [ ] Products indexes
- [ ] Banners indexes
- [ ] Orders indexes
- [ ] Product Prices indexes
- [ ] Inventory indexes

### Query Optimization:
- [ ] Products query EXPLAIN ANALYZE
- [ ] Orders query EXPLAIN ANALYZE
- [ ] JOIN query optimization
- [ ] Query performance comparison

### Testing:
- [ ] Index creation test
- [ ] Query performance test
- [ ] Backward compatibility test
- [ ] Migration rollback test

---

## 🚀 Boshlash

### Step 1: Hozirgi Indexlarni Tekshirish

```sql
-- Database'ga ulanish
-- Hozirgi indexlarni ko'rish
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### Step 2: Missing Indexlarni Aniqlash

- Query pattern'larni tahlil qilish
- WHERE, JOIN, ORDER BY columnlarini aniqlash
- Index kerak bo'lgan columnlarni ro'yxatga olish

### Step 3: Index Migration Yaratish

- Migration file yaratish
- Test qilish (development database)
- Production'ga deploy qilish

---

## 📝 Eslatmalar

1. **Index Overhead:**
   - Index yozish operatsiyalarini biroz sekinlashtiradi (5-10%)
   - Lekin o'qish operatsiyalarini juda tezlashtiradi (10-100x)
   - Umumiy foyda: 90%+

2. **Index Size:**
   - Index xotira ishlatadi
   - Lekin juda kam (1-5% table size)

3. **Composite Index:**
   - `(column1, column2)` - ikkala column uchun ham ishlaydi
   - Order muhim: WHERE column1 = X va WHERE column1 = X AND column2 = Y
   - Lekin faqat WHERE column2 = Y ishlamaydi

4. **Partial Index:**
   - `WHERE is_active = true` - faqat active records uchun
   - Kichikroq index (50% kam)
   - Tezroq ishlaydi

---

**Keyingi Step:** Index analysis va migration yaratish! 🎯
