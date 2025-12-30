# 🚀 Phase 2: Database Indexes Migration - Apply Qilish Qo'llanmasi

## 📋 Migration Fayl

**Fayl:** `database/migrations/007_add_performance_indexes.sql`

---

## 🔧 Migration Apply Qilish

### Variant 1: Migration Utility Orqali (RECOMMENDED)

```bash
# Database directory'ga o'tish
cd database

# Migration apply qilish
node migrate.js 007_add_performance_indexes.sql
```

**Yoki to'liq path:**
```bash
node database/migrate.js database/migrations/007_add_performance_indexes.sql
```

---

### Variant 2: psql Orqali

```bash
# Local development
psql -h localhost -U postgres -d marketplace -f database/migrations/007_add_performance_indexes.sql

# Railway production (environment variable'dan)
psql $DATABASE_URL -f database/migrations/007_add_performance_indexes.sql
```

---

### Variant 3: Railway CLI Orqali

```bash
# Railway'da migration faylni run qilish
railway run psql < database/migrations/007_add_performance_indexes.sql
```

---

## ✅ Verification (Tekshirish)

### 1. Indexes Created Check

```sql
-- Barcha indexlar yaratilganini tekshirish
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

**Expected:** ~20-25 ta index yaratilishi kerak

---

### 2. Query Performance Test (EXPLAIN ANALYZE)

#### Products Query Test:

```sql
EXPLAIN ANALYZE
SELECT * FROM products
WHERE category_id = 1 
  AND is_active = true
ORDER BY created_at DESC
LIMIT 50;
```

**Expected:**
- `Index Scan using idx_products_category_active_date` ✅
- Execution time: < 50ms (oldin ~500ms)

#### Orders Query Test:

```sql
EXPLAIN ANALYZE
SELECT * FROM orders
WHERE marketplace_id = 1
  AND status = 'new'
  AND order_date >= '2024-01-01'
  AND order_date <= '2024-12-31'
ORDER BY created_at DESC
LIMIT 50;
```

**Expected:**
- `Index Scan using idx_orders_marketplace_status_date` ✅
- Execution time: < 100ms (oldin ~1000ms)

#### Order Items Query Test:

```sql
EXPLAIN ANALYZE
SELECT * FROM order_items
WHERE order_id = 123;
```

**Expected:**
- `Index Scan using idx_order_items_order_id` ✅
- Execution time: < 20ms (oldin ~200ms)

---

## 📊 Expected Performance Improvement

| Query Type | Before | After | Improvement |
|------------|--------|-------|-------------|
| Products (category filter) | ~500ms | ~20ms | ⚡ 25x faster |
| Orders (marketplace filter) | ~1000ms | ~50ms | ⚡ 20x faster |
| Order Items (order_id filter) | ~200ms | ~10ms | ⚡ 20x faster |
| Product Prices (product_id) | ~100ms | ~5ms | ⚡ 20x faster |

---

## ⚠️ MUHIM: Apply Qilishdan Oldin

### 1. Database Backup ⚠️

**Production'da ishlatishdan oldin:**
```bash
# Railway PostgreSQL backup
pg_dump $DATABASE_URL > backup_before_indexes_$(date +%Y%m%d_%H%M%S).sql
```

---

### 2. Index Creation Time

**Muammo:** Katta table'larda index yaratish uzoq vaqt olishi mumkin (5-30 daqiqa)

**Hal qilish:**
- Development'da test qiling
- Production'da maintenance window'da apply qiling
- Yoki `CREATE INDEX CONCURRENTLY` ishlatish (production'da)

---

### 3. Disk Space

**Muammo:** Indexlar disk space ishlatadi (~10-20% table size)

**Hal qilish:**
- Disk space'ni tekshirish
- Index'lar performance uchun zarur, disk space trade-off

---

## ✅ Migration Apply Checklist

- [ ] Database backup qilingan
- [ ] Migration fayl tekshirilgan (`007_add_performance_indexes.sql`)
- [ ] Development database'da test qilingan
- [ ] Query performance test qilingan (EXPLAIN ANALYZE)
- [ ] Indexes created check qilingan
- [ ] Production'ga apply qilish (agar test muvaffaqiyatli bo'lsa)

---

## 🚀 Keyingi Qadamlar

Migration apply qilingandan keyin:

1. ✅ Query performance monitoring
2. ⏭️ Frontend validation (keyingi bosqich)
3. ⏭️ Testing Infrastructure
4. ⏭️ Structured Logging

---

**Status:** ⏭️ Migration tayyor, apply qilish kerak!  
**Priority:** 🔴 CRITICAL (Performance uchun muhim)
