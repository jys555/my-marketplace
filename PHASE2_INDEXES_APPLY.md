# 🚀 Phase 2: Database Indexes Migration - Apply Qilish

## 📋 Migration Fayl

**Fayl:** `database/migrations/007_add_performance_indexes.sql`

**Nima qo'shadi:**
- Products table indexes (category_id, created_at, is_active, SKU, composite)
- Banners table indexes (is_active, created_at, composite)
- Orders table indexes (order_number, marketplace_id, order_date, status, composites)
- Order Items table indexes (order_id, product_id, composite)
- Product Prices table indexes (product_id, marketplace_id, composite)
- Inventory table indexes (product_id)
- Inventory Movements table indexes (product_id, movement_date, composite)
- Daily Analytics table indexes (analytics_date, composite)

---

## ⚠️ MUHIM: Apply Qilishdan Oldin

### 1. Backup Database ⚠️

**Production'da ishlatishdan oldin:**
```bash
# Database backup qilish (Railway yoki production database)
pg_dump -h [HOST] -U [USER] -d [DATABASE] > backup_before_indexes.sql
```

**Development'da:**
- Agar test data muhim bo'lsa, backup qiling

---

### 2. Migration Apply Qilish

#### Variant 1: psql orqali (RECOMMENDED)

```bash
# Local development database
psql -h localhost -U postgres -d marketplace -f database/migrations/007_add_performance_indexes.sql

# Railway production database (environment variable'dan)
psql $DATABASE_URL -f database/migrations/007_add_performance_indexes.sql
```

#### Variant 2: Railway CLI orqali

```bash
# Railway'da migration faylni run qilish
railway run psql < database/migrations/007_add_performance_indexes.sql
```

#### Variant 3: Node.js script orqali (Agar migration utility bor bo'lsa)

```javascript
// Migration script yaratish kerak bo'lsa
const pool = require('./db');
const fs = require('fs');
const sql = fs.readFileSync('database/migrations/007_add_performance_indexes.sql', 'utf8');

(async () => {
    try {
        await pool.query(sql);
        console.log('✅ Indexes migration applied successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
})();
```

---

### 3. Migration Test (EXPLAIN ANALYZE)

Migration apply qilingandan keyin, query performance'ni test qilish:

```sql
-- Example: Products query with category filter
EXPLAIN ANALYZE
SELECT * FROM products
WHERE category_id = 1 AND is_active = true
ORDER BY created_at DESC
LIMIT 50;

-- Check indexes are being used:
-- Should show "Index Scan using idx_products_category_active_date" ✅
```

**Key Query'lar:**
1. Products list (category filter, pagination)
2. Orders list (marketplace filter, date range)
3. Order items (order_id filter)
4. Product prices (product_id, marketplace_id)

---

## 📊 Expected Performance Improvement

### Before Indexes:
- Products query: ~500ms (full table scan)
- Orders query: ~1000ms (full table scan)
- Order items query: ~200ms

### After Indexes:
- Products query: ~20ms (index scan) ⚡ 25x faster
- Orders query: ~50ms (index scan) ⚡ 20x faster
- Order items query: ~10ms (index scan) ⚡ 20x faster

---

## 🔍 Verification

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

### 2. Query Performance Check

```sql
-- Example query with EXPLAIN ANALYZE
EXPLAIN ANALYZE
SELECT p.*
FROM products p
WHERE p.category_id = 1
  AND p.is_active = true
ORDER BY p.created_at DESC
LIMIT 50;
```

**Expected:** 
- `Index Scan using idx_products_category_active_date` ✅
- Execution time: < 50ms

---

## ⚠️ Potential Issues

### 1. Index Creation Time

**Muammo:** Katta table'larda index yaratish uzoq vaqt olishi mumkin

**Hal qilish:**
- `CREATE INDEX CONCURRENTLY` ishlatish (production'da)
- Yoki maintenance window'da apply qilish

### 2. Disk Space

**Muammo:** Indexlar disk space ishlatadi (~10-20% table size)

**Hal qilish:**
- Disk space'ni tekshirish
- Index'lar performance uchun zarur, disk space trade-off

### 3. Write Performance

**Muammo:** Ko'p index'lar write performance'ni pasaytirishi mumkin

**Hal qilish:**
- Bu loyihada read-heavy, write kam
- Index'lar foyda > zarar

---

## ✅ Migration Apply Qilish Checklist

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
