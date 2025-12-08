# Migration Runner Tushuntirishi

## 1. Migration Runner Nima?

**Migration Runner** - bu database schema o'zgarishlarini (migration'lar) ketma-ket bajaradigan va versiya qilib boshqaradigan script.

### Migration Runner Qanday Ishlaydi?

1. **Migration fayllarini topadi** - `database/migrations/` papkasidan SQL fayllarni o'qiydi
2. **Versiya tekshiradi** - `schema_migrations` jadvalida qaysi migration bajarilganini tekshiradi
3. **Ketma-ket bajaradi** - Bajarilmagan migration'larni ketma-ket bajaradi
4. **Tarixni saqlaydi** - Har bir bajarilgan migration'ni `schema_migrations` jadvaliga yozadi

### Misol:

```javascript
// Migration runner ishga tushganda:
1. 001_amazing_store_core.sql - bajarilganmi? ✅ Ha → o'tkazib yuboradi
2. 002_seller_app_core.sql - bajarilganmi? ✅ Ha → o'tkazib yuboradi  
3. 003_add_sku.sql - bajarilganmi? ✅ Ha → o'tkazib yuboradi
4. 004_fix_amazing_store_prices.sql - bajarilganmi? ❌ Yo'q → bajaradi
5. 005_add_cost_price_to_products.sql - bajarilganmi? ❌ Yo'q → bajaradi
6. 006_add_profitability_percentage.sql - bajarilganmi? ❌ Yo'q → bajaradi
```

---

## 2. Qanday Path'larni Tekshiradi?

Migration runner bir nechta path'larni tekshiradi (real loyihalarda standart yondashuv):

### Markazlashtirilgan Migration Runner (`database/migrate.js`):

```javascript
const possibleMigrationDirs = [
    // 1. Standard centralized location (monorepo root)
    path.join(__dirname, 'migrations'),  // database/migrations/
    
    // 2. Alternative paths (Railway deployment)
    path.join(__dirname, '../database/migrations'),
    path.join(__dirname, '../../database/migrations'),
    path.join(__dirname, '../../../database/migrations'),
    
    // 3. Backend-specific copies (fallback)
    path.join(__dirname, '../../seller-app/backend/migrations/centralized'),
    path.join(__dirname, '../../amazing store/backend/migrations/centralized'),
];
```

### Wrapper Migration Runner (`backend/utils/migrate.js`):

```javascript
const possibleMigrationDirs = [
    // 1. Centralized migrations (monorepo root)
    path.join(__dirname, '../../../database/migrations'),
    path.join(__dirname, '../../../../database/migrations'),
    path.join(__dirname, '../../../../../database/migrations'),
    
    // 2. Local migrations (if copied during build)
    path.join(__dirname, '../migrations/centralized'),
    path.join(__dirname, '../migrations'),
];
```

**Sabab:** Railway'da har bir backend alohida service sifatida deploy qilinadi va working directory har xil bo'lishi mumkin.

---

## 3. Nega Shunchaki Products Tablega Saqlab Undan Olish Yetarli Emas?

### ❌ Agar Migration Runner Bo'lmasa:

```sql
-- Faqat products tablega ma'lumot saqlasak:
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    cost_price DECIMAL(10,2),  -- Qachon qo'shildi?
    commission_rate DECIMAL(5,2) -- Qachon qo'shildi?
);
```

**Muammolar:**

1. **Schema Tarixi Yo'qoladi**
   - Qaysi ustun qachon qo'shilganini bilish qiyin
   - Qaysi migration bajarilganini bilish qiyin
   - Production'da qaysi o'zgarishlar bajarilganini bilish qiyin

2. **Takrorlanmaslik Kafolati Yo'q**
   - Migration ikki marta bajarilishi mumkin
   - Xatoliklar bo'lishi mumkin
   - Ma'lumotlar buzilishi mumkin

3. **Rollback Qilish Qiyin**
   - Qaysi migration'ni bekor qilish kerakligini bilish qiyin
   - Qaysi o'zgarishlarni qaytarish kerakligini bilish qiyin

4. **Team Collaboration Muammosi**
   - Har bir developer'ning database'i har xil bo'lishi mumkin
   - Qaysi migration bajarilganini bilish qiyin
   - Production va development o'rtasida farq bo'lishi mumkin

### ✅ Migration Runner Bilan:

```sql
-- schema_migrations table:
CREATE TABLE schema_migrations (
    version INTEGER PRIMARY KEY,  -- 001, 002, 003...
    name VARCHAR(255) NOT NULL,    -- 001_amazing_store_core.sql
    applied_at TIMESTAMP          -- Qachon bajarilgan
);

-- Ma'lumotlar:
version | name                              | applied_at
--------|-----------------------------------|------------------
1       | 001_amazing_store_core.sql        | 2025-12-08 10:00
2       | 002_seller_app_core.sql          | 2025-12-08 10:01
3       | 003_add_sku.sql                  | 2025-12-08 10:02
```

**Afzalliklari:**

1. **Schema Tarixi Saqlanadi**
   - Qaysi migration bajarilganini bilish oson
   - Qachon bajarilganini bilish oson
   - Production'da qaysi o'zgarishlar bajarilganini bilish oson

2. **Takrorlanmaslik Kafolati**
   - Har bir migration faqat bir marta bajariladi
   - Xatoliklar kamayadi
   - Ma'lumotlar xavfsiz

3. **Rollback Qilish Oson**
   - Qaysi migration'ni bekor qilish kerakligini bilish oson
   - Qaysi o'zgarishlarni qaytarish kerakligini bilish oson

4. **Team Collaboration Oson**
   - Har bir developer'ning database'i bir xil bo'ladi
   - Qaysi migration bajarilganini bilish oson
   - Production va development o'rtasida farq kamayadi

---

## 4. Real Loyihalarda Qanday Ishlatiladi?

### Standart Yondashuv:

1. **Migration Fayllar** - `database/migrations/001_*.sql`, `002_*.sql`...
2. **Migration Runner** - `database/migrate.js` (markazlashtirilgan)
3. **Tracking Table** - `schema_migrations` (qaysi migration bajarilganini saqlaydi)
4. **Version Control** - Git'da migration'lar versiya qilib saqlanadi

### Misol:

```bash
# Development'da:
npm run migrate  # Barcha migration'larni bajaradi

# Production'da:
npm start  # Server start bo'lganda migration'lar avtomatik bajariladi
```

---

## Xulosa

**Migration Runner kerak, chunki:**

1. ✅ **Schema tarixini saqlaydi** - Qaysi o'zgarishlar bajarilganini bilish
2. ✅ **Takrorlanmaslikni kafolatlaydi** - Har bir migration faqat bir marta bajariladi
3. ✅ **Rollback qilishni osonlashtiradi** - Qaysi o'zgarishlarni qaytarish kerakligini bilish
4. ✅ **Team collaboration'ni osonlashtiradi** - Har bir developer'ning database'i bir xil bo'ladi

**Agar Migration Runner bo'lmasa:**
- ❌ Schema tarixi yo'qoladi
- ❌ Migration'lar takrorlanishi mumkin
- ❌ Rollback qilish qiyin
- ❌ Team collaboration muammoli

**Real loyihalarda:** Migration Runner **majburiy** va **standart** yondashuv.

