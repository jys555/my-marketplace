# SKU Implementation - Real Project Analysis & Recommendations

## 📊 Tahlil Natijalari

### Hozirgi Holat
- **Product ID**: SERIAL PRIMARY KEY (oddiy tartib raqami: 1, 2, 3...)
- **SKU**: Optional, NULL bo'lishi mumkin
- **Ishlatilish**: Frontend va API'da asosan `product.id` ishlatiladi

### Muammolar
1. ❌ SKU optional - NULL bo'lishi mumkin
2. ❌ SKU unique emas
3. ❌ API endpoint'larda faqat ID ishlatiladi
4. ❌ Frontend'da ID asosiy identifier

## 🎯 Real Projectlar Asosida Takliflar

### 1. **Hybrid Yondashuv (Tavsiya Etiladi)**
```
ID (Database)     → Ichki ishlatish (Foreign Keys, Performance)
SKU (Business)    → Tashqi ishlatish (API, Frontend, User-facing)
```

**Afzalliklari:**
- ✅ Database foreign keys uchun ID optimal (integer, tez)
- ✅ SKU user-friendly (PROD-000001, ABC-123)
- ✅ SKU o'zgartirilishi mumkin (ID o'zgarmaydi)
- ✅ SKU orqali qidirish oson

**Real Projectlar:**
- **Shopify**: Product ID (internal) + SKU (external)
- **WooCommerce**: Product ID + SKU
- **Amazon**: ASIN (SKU-like) + Internal ID

### 2. **SKU Majburiy Qilish**
- ✅ NOT NULL constraint
- ✅ UNIQUE constraint
- ✅ Index qo'shish (performance)
- ✅ Mavjud SKU'siz tovarlar uchun avtomatik generatsiya

### 3. **API Endpoint'larda SKU Support**
```javascript
// Hozirgi: /api/seller/products/:id (faqat ID)
// Yangi: /api/seller/products/:id (ID yoki SKU)

GET /api/seller/products/123        // ID orqali
GET /api/seller/products/PROD-000123 // SKU orqali
```

### 4. **Frontend'da SKU Asosiy Identifier**
- ✅ SKU ko'rsatish (ID emas)
- ✅ SKU orqali qidirish
- ✅ SKU'ni data attribute sifatida ishlatish

## 🔧 Implementatsiya

### Database Changes
1. ✅ SKU'ni NOT NULL qilish
2. ✅ SKU'ni UNIQUE qilish
3. ✅ SKU index qo'shish
4. ✅ Mavjud tovarlar uchun avtomatik SKU generatsiya

### Backend Changes
1. ✅ API endpoint'larda SKU support (ID yoki SKU)
2. ✅ POST /products - SKU majburiy yoki avtomatik generatsiya
3. ✅ PUT /products/:id - SKU yangilash
4. ✅ Search'da SKU qo'shish
5. ✅ Error handling (SKU unique violation)

### Frontend Changes
1. ✅ SKU ko'rsatish (ID emas)
2. ✅ SKU orqali qidirish
3. ✅ SKU'ni data attribute sifatida ishlatish

## 📝 Migration Strategy

### Step 1: Mavjud Tovarlar
```sql
-- SKU'siz tovarlar uchun avtomatik generatsiya
UPDATE products SET sku = 'PROD-' || LPAD(id::text, 6, '0') 
WHERE sku IS NULL;
```

### Step 2: Constraints
```sql
-- UNIQUE constraint
ALTER TABLE products ADD CONSTRAINT products_sku_unique UNIQUE (sku);

-- NOT NULL constraint
ALTER TABLE products ALTER COLUMN sku SET NOT NULL;

-- Index
CREATE INDEX idx_products_sku ON products(sku);
```

### Step 3: API Updates
- GET /products/:id → ID yoki SKU qabul qiladi
- PUT /products/:id → ID yoki SKU qabul qiladi
- DELETE /products/:id → ID yoki SKU qabul qiladi

## 🚀 Foydalanish

### Yangi Tovar Yaratish
```javascript
// SKU bilan
POST /api/seller/products
{
  "name_uz": "Olma",
  "price": 10000,
  "sku": "APPLE-001"  // Optional, avtomatik generatsiya qilinadi
}

// SKU'siz (avtomatik generatsiya)
POST /api/seller/products
{
  "name_uz": "Olma",
  "price": 10000
  // SKU: PROD-{timestamp}
}
```

### Tovar Qidirish
```javascript
// ID orqali
GET /api/seller/products/123

// SKU orqali
GET /api/seller/products/PROD-000123

// Search (SKU qo'shilgan)
GET /api/seller/products?search=PROD-000123
```

## ⚠️ Muhim Nuqtalar

1. **ID hali ham kerak** - Database foreign keys uchun
2. **SKU o'zgartirilishi mumkin** - ID o'zgarmaydi
3. **SKU unique bo'lishi kerak** - Business logic uchun
4. **Backward compatibility** - Eski ID-based endpoint'lar ishlaydi

## 📈 Performance

- **ID Index**: PRIMARY KEY (avtomatik)
- **SKU Index**: CREATE INDEX idx_products_sku (qo'shildi)
- **Query Performance**: Ikkala identifier ham tez

## ✅ Xulosa

**SKU majburiy bo'lishi kerak** va **ID o'rniga SKU ishlatish mumkin**, lekin:
- ID → Database foreign keys (ichki)
- SKU → API/Frontend (tashqi)

Bu **hybrid yondashuv** real projectlarda eng ko'p ishlatiladi va optimal yechimdir.

