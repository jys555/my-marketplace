# ✅ Yandex Market Integratsiya - Implementation Status

## 🎯 Bajarilgan Ishlar

### 1. ✅ Yandex Market API Integratsiyasi
- **`fetchYandexProducts()`** - To'liq implement qilindi
  - Offer mapping entries o'qish
  - Prices (narx va komissiya) o'qish
  - Stock (qoldiq) o'qish
  - Barcha ma'lumotlarni birlashtirish

### 2. ✅ Tovar Yaratish Jarayonida Integratsiya
- **POST /api/seller/products** endpoint'ga qo'shildi:
  - `marketplace_id` - Marketplace ID
  - `marketplace_product_id` - Marketplace'dagi tovar ID
  - Tovar yaratilganda avtomatik marketplace bilan link qilish

### 3. ✅ Marketplace Product Link
- **`linkMarketplaceProduct()`** funksiyasi yangilandi:
  - `commission_rate` qo'shildi
  - `marketplace_stock` qo'shildi
  - Backward compatibility (column mavjudligini tekshirish)

---

## 📋 Qolgan Ishlar

### 1. ⏳ Stock Tracking (Umumiy Ombor)
- [ ] Yandex Market'dan stock sync qilish
- [ ] Umumiy ombor qoldig'ini shakllantirish
- [ ] Buyurtma bo'lganda inventory yangilash

### 2. ⏳ Buyurtmalarni O'qish
- [ ] Yandex Market'dan buyurtmalarni o'qish
- [ ] Buyurtmalarni `orders` table'ga saqlash
- [ ] Inventory yangilash

### 3. ⏳ Analytics
- [ ] Narx va komissiya analizi
- [ ] Buyurtmalar analizi
- [ ] Revenue va profit hisoblash

---

## 🔧 Qanday Ishlatish

### 1. Marketplace Yaratish

```sql
INSERT INTO marketplaces (name, api_type, access_token, marketplace_code, is_active)
VALUES ('YANDEX_MARKET', 'yandex', 'YOUR_API_TOKEN', 'YOUR_CAMPAIGN_ID', true);
```

### 2. Tovar Yaratish (Marketplace Integratsiya bilan)

```javascript
POST /api/seller/products
{
  "sku": "PRODUCT-001",
  "name_uz": "Tovar nomi",
  "price": 100000,
  "sale_price": 90000,
  "cost_price": 50000,
  "service_fee": 10000,
  "marketplace_id": 2, // Yandex Market ID
  "marketplace_product_id": "123456" // Yandex Market offerId
}
```

### 3. Marketplace'dan Tovarlarni O'qish

```javascript
GET /api/seller/marketplaces/{id}/sync
// Yoki
const products = await integrationService.fetchMarketplaceProducts(marketplaceId);
```

---

## 📝 API Endpoints (Yandex Market)

### Base URL
```
https://api.partner.market.yandex.ru
```

### Authentication
```
Authorization: OAuth {access_token}
```

### Endpoints

1. **Get Offers (Tovarlar)**
   ```
   GET /campaigns/{campaignId}/offer-mapping-entries?limit=100
   ```

2. **Get Prices (Narxlar)**
   ```
   GET /campaigns/{campaignId}/offer-prices?limit=100
   ```

3. **Get Stock (Qoldiq)**
   ```
   GET /campaigns/{campaignId}/offers?limit=100
   ```

4. **Get Orders (Buyurtmalar)** - ⏳ Keyingi qadam
   ```
   GET /campaigns/{campaignId}/orders
   ```

---

## 🗄️ Database Schema

### `marketplaces` table
- `id` - Marketplace ID
- `name` - Marketplace nomi (YANDEX_MARKET)
- `api_type` - 'yandex'
- `access_token` - Yandex Market API token
- `marketplace_code` - Campaign ID

### `marketplace_products` table
- `product_id` - Amazing Store product ID
- `marketplace_id` - Marketplace ID
- `marketplace_product_id` - Yandex Market offerId
- `marketplace_sku` - Yandex Market shopSku
- `marketplace_price` - Yandex Market narxi
- `marketplace_strikethrough_price` - Eski narx
- `commission_rate` - Komissiya foizi ✅
- `marketplace_stock` - Yandex Market'dan o'qilgan stock ✅
- `status` - Status (active/inactive)
- `last_synced_at` - Oxirgi sync vaqti

### `inventory` table
- `product_id` - Product ID
- `quantity` - Umumiy qoldiq (barcha marketplace'lar uchun)
- `reserved_quantity` - Rezerv qilingan miqdor

---

## 🚀 Keyingi Qadamlar

1. **Stock Sync** - Yandex Market'dan stock o'qish va yangilash
2. **Orders Sync** - Yandex Market'dan buyurtmalarni o'qish
3. **Analytics** - Narx, komissiya va buyurtmalar analizi
4. **Testing** - Yandex Market API bilan test qilish

---

## ⚠️ Eslatmalar

1. **API Token** - Yandex Market'dan olingan API token `marketplaces.access_token` ga saqlanishi kerak
2. **Campaign ID** - Yandex Market campaign ID `marketplaces.marketplace_code` ga saqlanishi kerak
3. **Rate Limits** - Yandex Market API rate limit'larni e'tiborga olish kerak
4. **Error Handling** - API xatolarini to'g'ri handle qilish kerak
