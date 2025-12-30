# 🔍 Database Index Migration Status Check

## ✅ Migration Fayl Holati

**Migration Fayl:** `database/migrations/007_add_performance_indexes.sql` ✅ **MAVJUD**

**Migration Version:** 007

---

## 🔄 Avtomatik Migration System

### Qanday Ishlaydi:

1. **Server Startup:**
   - `server.js` → `initDb.js` → `migrate.js` → `runMigrations()`
   - Har safar server ishga tushganda migration'lar avtomatik tekshiriladi

2. **Migration Tracking:**
   - `schema_migrations` table'da version tracking
   - Agar version 007 yo'q bo'lsa, migration apply qilinadi
   - Agar version 007 bor bo'lsa, skip qilinadi

3. **Migration Path:**
   - `migrate.js` bir nechta path'larni tekshiradi:
     - `migrations/centralized/` (build vaqtida copy qilingan)
     - `../../../database/migrations/` (monorepo root)
     - `/app/database/migrations/` (Railway absolute path)

---

## ✅ Migration Apply Qilinganmi?

### Tekshirish Usullari:

#### 1. Database'da Tekshirish (SQL):

```sql
-- Migration apply qilinganini tekshirish
SELECT * FROM schema_migrations 
WHERE version = 7 
   OR name LIKE '%007%' 
   OR name LIKE '%performance_indexes%';

-- Index'lar yaratilganini tekshirish
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

**Expected Results:**
- `schema_migrations` table'da version 7 bo'lishi kerak
- ~20-25 ta index yaratilgan bo'lishi kerak (idx_products_*, idx_orders_*, etc.)

---

#### 2. Server Logs'da Tekshirish:

Railway'da server logs'ni tekshirish:

```bash
# Railway CLI orqali
railway logs

# Yoki Railway dashboard'da logs'ni ko'rish
```

**Expected Log Messages:**
- ✅ `🔄 Running migration: 007_add_performance_indexes.sql (version 7)`
- ✅ `✅ Migration 007_add_performance_indexes.sql completed successfully`
- Yoki: `⏭️ Migration 007_add_performance_indexes.sql already applied (version 7)`

---

#### 3. Query Performance Test:

```sql
-- Products query test
EXPLAIN ANALYZE
SELECT * FROM products
WHERE category_id = 1 
  AND is_active = true
ORDER BY created_at DESC
LIMIT 50;
```

**Expected:**
- `Index Scan using idx_products_category_active_date` ✅
- Execution time: < 50ms

---

## ⚠️ Migration Apply Qilinmagan Bo'lsa

### Sabablar:

1. **Migration fayl keyinroq qo'shilgan:**
   - Server allaqachon ishlayotgan bo'lsa
   - Migration fayl keyinroq commit qilingan bo'lsa

2. **Migration path topilmagan:**
   - Railway'da `database/migrations/` papkasi topilmagan
   - Build script migration'lar copy qilmagan

3. **Migration error:**
   - SQL syntax error
   - Permission error
   - Database connection error

---

## 🔧 Migration Apply Qilish (Agar Qilinmagan Bo'lsa)

### Variant 1: Server Restart (Avtomatik)

```bash
# Railway'da server restart qilish
# Railway dashboard → Service → Restart
# Yoki
railway restart
```

**Server restart qilinganda:**
- `initDb.js` ishga tushadi
- `migrate.js` barcha migration'larni tekshiradi
- Version 007 yo'q bo'lsa, apply qilinadi

---

### Variant 2: Manual Apply (Railway CLI)

```bash
# Railway CLI orqali
railway run psql < database/migrations/007_add_performance_indexes.sql

# Yoki environment variable orqali
railway run psql $DATABASE_URL < database/migrations/007_add_performance_indexes.sql
```

---

### Variant 3: Railway SQL Editor

1. Railway dashboard → Database → Query
2. `007_add_performance_indexes.sql` faylini ochish
3. SQL kodini copy qilish
4. Query editor'ga paste qilish
5. Run qilish

---

## ✅ Verification Checklist

- [ ] `schema_migrations` table'da version 7 bor
- [ ] Index'lar yaratilgan (idx_products_*, idx_orders_*, etc.)
- [ ] Query performance yaxshilangan (EXPLAIN ANALYZE)
- [ ] Server logs'da migration success message

---

## 🎯 Xulosa

**Migration System:**
- ✅ Avtomatik migration system mavjud
- ✅ `initDb.js` har safar server ishga tushganda migration'larni tekshiradi
- ✅ Migration fayl mavjud (`007_add_performance_indexes.sql`)

**Migration Status:**
- ⚠️ **Tekshirish kerak:** Database'da version 7 bor yoki yo'qligini
- ⚠️ **Tekshirish kerak:** Index'lar yaratilgan yoki yo'qligini

**Agar Migration Apply Qilinmagan Bo'lsa:**
- Server restart qilish (avtomatik apply)
- Yoki manual apply qilish (Railway CLI yoki SQL Editor)

---

**Status:** Migration fayl tayyor, tekshirish kerak! 🔍
