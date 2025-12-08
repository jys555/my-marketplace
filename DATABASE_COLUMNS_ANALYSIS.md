# Database Columns Tahlili

## Frontend'da Ishlatiladigan Ma'lumotlar

### Catalog Page (`catalog.js`)

1. **Products Table:**
   - `id` (yashirilgan, `_id` sifatida)
   - `sku` (asosiy identifier)
   - `name_uz`, `name_ru`
   - `image_url`

2. **Product Prices Table:**
   - `cost_price` - Tannarx ✅ (migration 005)
   - `selling_price` - Sotish narxi ✅
   - `strikethrough_price` - Chizilgan narx ✅
   - `commission_rate` - Komissiya foizi ✅ (migration 005)
   - `commission_amount` - Komissiya miqdori (frontend'da hisoblanadi)
   - `profitability` - Rentabillik (miqdor) ✅
   - `profitability_percentage` - Rentabillik foizi ✅ (migration 006)

3. **Inventory Table:**
   - `quantity` - Qoldiq ✅
   - `last_updated_at` - Oxirgi yangilanish sanasi ✅

## Backend'da Ishlatiladigan Ma'lumotlar

### Products Table

**Hozirgi holat:**
- `id` ✅
- `sku` ✅ (migration 003)
- `name_uz`, `name_ru` ✅
- `price`, `sale_price` ✅
- `image_url` ✅
- `is_active` ✅
- `category_id` ✅

**Kerakli (lekin hali yaratilmagan):**
- `cost_price` ❌ (migration 005 - bajarilmagan)
- `commission_rate` ❌ (migration 005 - bajarilmagan)

### Product Prices Table

**Hozirgi holat:**
- `id` ✅
- `product_id` ✅
- `marketplace_id` ✅
- `cost_price` ✅ (product_prices jadvalida)
- `selling_price` ✅
- `strikethrough_price` ✅
- `commission_rate` ✅ (product_prices jadvalida)
- `profitability` ✅
- `profitability_percentage` ❌ (migration 006 - bajarilmagan)

## Muammolar

### 1. Migration'lar Bajarilmagan

**Loglardan:**
```
⚠️  Could not fetch cost_price/commission_rate for product 2: column "cost_price" does not exist
Error fetching prices: error: column pp.profitability_percentage does not exist
```

**Sabab:**
- Migration 004 (`004_fix_amazing_store_prices.sql`) - bajarilmagan
- Migration 005 (`005_add_cost_price_to_products.sql`) - bajarilmagan
- Migration 006 (`006_add_profitability_percentage.sql`) - bajarilmagan

**Muammo:**
- Migration runner migration'larni topa olmayapti
- Yoki migration'lar bajarilgan deb hisoblanmoqda (lekin aslida bajarilmagan)

### 2. Frontend'da Ishlatiladigan Ma'lumotlar

**Catalog Page:**
- `cost_price` - `product_prices` jadvalidan ✅
- `commission_rate` - `product_prices` jadvalidan ✅
- `profitability_percentage` - `product_prices` jadvalidan ❌ (migration 006)

**Muammo:**
- Frontend `profitability_percentage` ni kutmoqda, lekin database'da yo'q

## Yechim

### 1. Migration'lar Bajarilishi Kerak

**Migration 004:** `004_fix_amazing_store_prices.sql`
- `product_prices` jadvalidagi `marketplace_id = NULL` yozuvlarni `AMAZING_STORE` marketplace_id'siga o'zgartiradi

**Migration 005:** `005_add_cost_price_to_products.sql`
- `products` jadvaliga `cost_price` va `commission_rate` qo'shadi
- Ular majburiy qilinadi (NOT NULL, DEFAULT 0)

**Migration 006:** `006_add_profitability_percentage.sql`
- `product_prices` jadvaliga `profitability_percentage` qo'shadi
- Trigger yaratadi avtomatik hisoblash uchun

### 2. Migration Runner Muammosi

**Muammo:**
- Migration runner migration'larni topa olmayapti
- Yoki migration'lar bajarilgan deb hisoblanmoqda

**Yechim:**
- Migration runner path'larini tekshirish
- Railway'da migration'lar papkasini topish
- Migration'lar bajarilganligini tekshirish (`schema_migrations` jadvali)

## Xulosa

**Kerakli Migration'lar:**
1. ✅ Migration 001 - Amazing Store core tables
2. ✅ Migration 002 - Seller App core tables
3. ✅ Migration 003 - SKU qo'shish
4. ❌ Migration 004 - Amazing Store prices fix (bajarilmagan)
5. ❌ Migration 005 - Products cost_price va commission_rate (bajarilmagan)
6. ❌ Migration 006 - Profitability percentage (bajarilmagan)

**Muammo:**
- Migration runner migration'larni topa olmayapti yoki bajarilgan deb hisoblanmoqda
- Railway'da migration'lar papkasi mavjud emas

**Yechim:**
- Migration runner path'larini yaxshilash
- Railway'da migration'lar papkasini topish
- Migration'lar bajarilganligini tekshirish

