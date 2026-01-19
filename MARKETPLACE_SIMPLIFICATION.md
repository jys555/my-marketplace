# 🎯 Marketplace Integratsiya Soddalashtirish

## 📋 O'zgarishlar

### ✅ Bajarilgan:

1. **Database Migration** - `008_simplify_marketplace_integration.sql`
   - `products` table'ga Yandex Market columnlar qo'shildi:
     - `yandex_api_token` - API token
     - `yandex_campaign_id` - Campaign ID
     - `yandex_product_id` - Product ID (offerId)
     - `yandex_price` - Narx (READ only)
     - `yandex_commission_rate` - Komissiya foizi (READ only)
     - `yandex_stock` - Qoldiq (2-way: o'qish va yangilash)
     - `yandex_last_synced_at` - Oxirgi sync vaqti
   
   - `products` table'ga Uzum Market columnlar qo'shildi:
     - `uzum_api_token` - API token
     - `uzum_product_id` - Product ID
     - `uzum_price` - Narx (READ only)
     - `uzum_commission_rate` - Komissiya foizi (READ only)
     - `uzum_stock` - Qoldiq (2-way: o'qish va yangilash)
     - `uzum_last_synced_at` - Oxirgi sync vaqti

2. **Marketplace Sync Service** - `marketplace-sync.js`
   - `syncYandexProduct()` - Yandex Market'dan o'qish
   - `updateYandexStock()` - Yandex Market'ga yangilash
   - `syncUzumProduct()` - Uzum Market'dan o'qish
   - `updateUzumStock()` - Uzum Market'ga yangilash
   - `syncAllYandexProducts()` - Barcha Yandex tovarlarni sync
   - `syncAllUzumProducts()` - Barcha Uzum tovarlarni sync

3. **Product Routes** - `routes/products.js`
   - POST endpoint'ga qo'shildi:
     - `yandex_api_token` (ixtiyoriy)
     - `yandex_campaign_id` (ixtiyoriy)
     - `yandex_product_id` (ixtiyoriy)
     - `uzum_api_token` (ixtiyoriy)
     - `uzum_product_id` (ixtiyoriy)
   - Tovar yaratilganda background'da avtomatik sync qilish

---

## 🔄 Qanday Ishlaydi

### 1. Tovar Yaratish

```javascript
POST /api/seller/products
{
  "sku": "PRODUCT-001",
  "name_uz": "Tovar nomi",
  "price": 100000,
  "sale_price": 90000,
  "cost_price": 50000,
  "service_fee": 10000,
  // Yandex Market integratsiyasi (ixtiyoriy)
  "yandex_api_token": "YOUR_YANDEX_TOKEN",
  "yandex_campaign_id": "YOUR_CAMPAIGN_ID",
  "yandex_product_id": "YANDEX_OFFER_ID",
  // Uzum Market integratsiyasi (ixtiyoriy)
  "uzum_api_token": "YOUR_UZUM_TOKEN",
  "uzum_product_id": "UZUM_PRODUCT_ID"
}
```

### 2. Avtomatik Sync

Tovar yaratilganda:
- Agar Yandex Market ma'lumotlari berilgan bo'lsa → background'da sync qilinadi
- Agar Uzum Market ma'lumotlari berilgan bo'lsa → background'da sync qilinadi
- Narx, komissiya va stock avtomatik o'qiladi va saqlanadi

### 3. Stock Yangilash

```javascript
// Yandex Market stock yangilash
const marketplaceSync = require('./services/marketplace-sync');
await marketplaceSync.updateYandexStock(productId, newQuantity);

// Uzum Market stock yangilash
await marketplaceSync.updateUzumStock(productId, newQuantity);
```

---

## 📊 Database Schema

### `products` table (qo'shilgan columnlar):

```sql
-- Yandex Market
yandex_api_token TEXT,
yandex_campaign_id VARCHAR(50),
yandex_product_id VARCHAR(200),
yandex_price DECIMAL(10, 2),
yandex_commission_rate DECIMAL(5, 2),
yandex_stock INTEGER DEFAULT 0,
yandex_last_synced_at TIMESTAMP,

-- Uzum Market
uzum_api_token TEXT,
uzum_product_id VARCHAR(200),
uzum_price DECIMAL(10, 2),
uzum_commission_rate DECIMAL(5, 2),
uzum_stock INTEGER DEFAULT 0,
uzum_last_synced_at TIMESTAMP
```

---

## ⚠️ Eslatmalar

1. **Eski Table'lar** - `marketplaces` va `marketplace_products` table'lar hozircha ignore qilinadi (backward compatibility)
2. **Faqat READ** - Narx va komissiyalar faqat o'qiladi (READ only)
3. **2-Way Stock** - Stock o'qiladi va yangilanadi (2-way)
4. **Avtomatik Sync** - Tovar yaratilganda background'da avtomatik sync qilinadi
5. **Buyurtmalar** - Buyurtmalar track qilinadi (analiz uchun)

---

## 🚀 Keyingi Qadamlar

1. **Frontend Form** - Upload form'ga Yandex va Uzum maydonlarini qo'shish
2. **Stock Sync** - Inventory yangilanganda marketplace'larga ham yangilash
3. **Buyurtmalar Track** - Marketplace buyurtmalarini track qilish
4. **Analytics** - Narx, komissiya va buyurtmalar asosida analitika
