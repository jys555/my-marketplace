# 🛒 Yandex Market Integratsiya Rejasi

## 📋 Hozirgi Holat

### ✅ Mavjud Infrastruktura:
1. **Marketplace System** - `marketplaces` table'da API token saqlash
2. **Marketplace Products** - `marketplace_products` table'da integratsiya
3. **Integration Service** - `seller-app/backend/services/integrations.js`
4. **Inventory System** - Umumiy ombor qoldig'i tracking
5. **Orders System** - Buyurtmalarni track qilish

### ⚠️ Hozirgi Muammolar:
1. `fetchYandexProducts()` - TODO, hozircha bo'sh
2. Tovar yaratilganda avtomatik integratsiya yo'q
3. Yandex Market'dan narx, komissiya, stock o'qish yo'q
4. Buyurtmalarni Yandex Market'dan o'qish yo'q

---

## 🎯 Kerakli Funksiyalar

### 1. **Yandex Market API Integratsiyasi**

#### 1.1. Tovarlarni O'qish (`fetchYandexProducts`)
- **API Endpoint:** `GET /campaigns/{campaignId}/offer-mapping-entries`
- **Token:** `access_token` (marketplaces table'dan)
- **Ma'lumotlar:**
  - `marketplace_product_id` (offerId)
  - `marketplace_sku` (shopSku)
  - `marketplace_name` (name)
  - `marketplace_price` (price)
  - `marketplace_strikethrough_price` (oldPrice)
  - `commission_rate` (commission foizi)
  - `stock` (availableCount)

#### 1.2. Narx va Komissiyalarni O'qish
- **API Endpoint:** `GET /campaigns/{campaignId}/offer-prices`
- **Ma'lumotlar:**
  - `price` - Joriy narx
  - `oldPrice` - Eski narx (chizilgan)
  - `commission` - Komissiya foizi

#### 1.3. Stock (Qoldiq) O'qish
- **API Endpoint:** `GET /campaigns/{campaignId}/offers`
- **Ma'lumotlar:**
  - `availableCount` - Mavjud miqdor
  - `reservedCount` - Rezerv qilingan miqdor

#### 1.4. Buyurtmalarni O'qish
- **API Endpoint:** `GET /campaigns/{campaignId}/orders`
- **Ma'lumotlar:**
  - `orderId` - Buyurtma ID
  - `status` - Buyurtma holati
  - `items` - Buyurtma elementlari
  - `total` - Jami summa

---

### 2. **Tovar Yaratish Jarayonida Integratsiya**

#### 2.1. Tovar Yaratilganda
- Tovar `products` table'ga qo'shiladi
- Agar marketplace integratsiyasi qo'shilgan bo'lsa:
  - Yandex Market'dan mos tovarni qidirish (SKU yoki name bo'yicha)
  - Topilsa, `marketplace_products` table'ga link qilish
  - Narx, komissiya, stock ma'lumotlarini o'qish va saqlash

#### 2.2. Marketplace Product Link
- **UI'da:** Tovar yaratish form'ida marketplace tanlash
- **Backend'da:** `linkMarketplaceProduct()` funksiyasi
- **Database'da:** `marketplace_products` table'ga yozuv

---

### 3. **Stock Tracking (Umumiy Ombor)**

#### 3.1. Umumiy Ombor Qoldig'i
- **Asosiy ombor:** `inventory` table (barcha marketplace'lar uchun umumiy)
- **Marketplace stock:** `marketplace_products.marketplace_stock` (Yandex Market'dan o'qilgan)
- **Formula:** 
  ```
  Umumiy qoldiq = inventory.quantity
  Marketplace qoldiq = marketplace_products.marketplace_stock
  ```

#### 3.2. Stock Sync
- Yandex Market'dan stock o'qish
- `marketplace_products.marketplace_stock` ni yangilash
- **Eslatma:** Umumiy ombor `inventory` table'da, marketplace stock faqat tracking uchun

#### 3.3. Buyurtma Bo'lganda
- Buyurtma yaratilganda `inventory.quantity` kamayadi
- `inventory.reserved_quantity` oshadi
- Buyurtma yetkazilganda `reserved_quantity` kamayadi

---

### 4. **Analytics**

#### 4.1. Narx Analizi
- Yandex Market'dan o'qilgan narxlar
- Komissiya foizlari
- Rentabillik hisoblash

#### 4.2. Buyurtmalar Analizi
- Yandex Market buyurtmalari
- Umumiy buyurtmalar (barcha marketplace'lar)
- Revenue, profit, cost analizi

---

## 🔧 Implementation Plan

### Step 1: Yandex Market API Service
- [ ] `fetchYandexProducts()` - Tovarlarni o'qish
- [ ] `fetchYandexPrices()` - Narx va komissiyalarni o'qish
- [ ] `fetchYandexStock()` - Stock o'qish
- [ ] `fetchYandexOrders()` - Buyurtmalarni o'qish

### Step 2: Product Creation Integration
- [ ] Tovar yaratilganda marketplace link qilish
- [ ] UI'da marketplace tanlash
- [ ] Backend'da avtomatik link qilish

### Step 3: Stock Tracking
- [ ] Yandex Market'dan stock sync
- [ ] Umumiy ombor qoldig'ini shakllantirish
- [ ] Buyurtma bo'lganda inventory yangilash

### Step 4: Analytics
- [ ] Narx va komissiya analizi
- [ ] Buyurtmalar analizi
- [ ] Revenue va profit hisoblash

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
   GET /campaigns/{campaignId}/offer-mapping-entries
   ```

2. **Get Prices (Narxlar)**
   ```
   GET /campaigns/{campaignId}/offer-prices
   ```

3. **Get Stock (Qoldiq)**
   ```
   GET /campaigns/{campaignId}/offers
   ```

4. **Get Orders (Buyurtmalar)**
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
- `commission_rate` - Komissiya foizi
- `marketplace_stock` - Yandex Market'dan o'qilgan stock

### `inventory` table
- `product_id` - Product ID
- `quantity` - Umumiy qoldiq (barcha marketplace'lar uchun)
- `reserved_quantity` - Rezerv qilingan miqdor

---

## 🚀 Keyingi Qadamlar

1. **Yandex Market API Service** implement qilish
2. **Product Creation** jarayonida integratsiya qo'shish
3. **Stock Tracking** tizimini yaxshilash
4. **Analytics** funksiyalarini qo'shish
5. **Testing** - Yandex Market API bilan test qilish
