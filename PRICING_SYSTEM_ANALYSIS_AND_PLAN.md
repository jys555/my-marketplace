# Narxlar Tizimi - Batafsil Tahlil va Reja

## 📊 Hozirgi Holat Tahlili

### 1. Amazing Store Database Schema

**Products jadvali:**
```sql
- id (SERIAL PRIMARY KEY)
- name_uz, name_ru
- price (DECIMAL) - Asosiy narx
- sale_price (DECIMAL) - Chegirmali narx
- image_url
- category_id
- is_active
- sku
```

**Muammo:** Amazing Store'da faqat `price` va `sale_price` mavjud. `cost_price` (tannarx) va `commission_rate` (komissiya) yo'q.

### 2. Seller App Database Schema

**product_prices jadvali:**
```sql
- id (SERIAL PRIMARY KEY)
- product_id (REFERENCES products)
- marketplace_id (REFERENCES marketplaces, NULL = Amazing Store)
- cost_price (DECIMAL) - Tannarx
- selling_price (DECIMAL) - Sotish narxi
- commission_rate (DECIMAL) - Komissiya foizi (5,2)
- strikethrough_price (DECIMAL) - Chizilgan narx
- profitability (DECIMAL) - Rentabillik
- updated_at
- UNIQUE(product_id, marketplace_id)
```

**Muammo:** `product_prices` jadvali mavjud, lekin Amazing Store'dan narxlar avtomatik yuklanmayapti.

## 🎯 Muammolar va Yechimlar

### Muammo 1: Amazing Store Narxlari Yuklanmayapti

**Sabab:**
- `product_prices` jadvali bo'sh
- Amazing Store'dan narxlarni `product_prices` ga ko'chirish funksiyasi yo'q
- Frontend faqat `product_prices` jadvalidan narxlarni o'qiyapti

**Yechim:**
1. Amazing Store'dagi mavjud tovarlar uchun `product_prices` ga default narxlar yaratish
2. `price` → `selling_price` va `strikethrough_price` ga ko'chirish
3. `sale_price` → `selling_price` ga ko'chirish (agar mavjud bo'lsa)

### Muammo 2: Tannarx va Komissiya Qo'shilmagan

**Sabab:**
- Amazing Store'da `cost_price` va `commission_rate` yo'q
- Seller App'da ularni qo'shish kerak

**Yechim:**
1. Seller App'da narxlar edit qilganda `cost_price` va `commission_rate` ni qo'shish
2. Agar `cost_price` bo'sh bo'lsa, frontend'da "-" ko'rsatish
3. Komissiya miqdorini frontend'da hisoblash: `commission_amount = selling_price * commission_rate / 100`

### Muammo 3: Rentabillik Hisoblash

**Hozirgi holat:**
- Backend'da rentabillik hisoblanadi va saqlanadi
- Formula: `profitability = (selling_price - cost_price) - (selling_price * commission_rate / 100)`

**Tavsiya:**
- ✅ **Rentabillikni bazada saqlash** (hozirgi yondashuv to'g'ri)
- ✅ **Avtomatik yangilanish:** Narxlar o'zgarganda rentabillik avtomatik qayta hisoblanadi
- ✅ **Performance:** Frontend'da har safar hisoblashdan ko'ra tezroq

## 📋 Rejalashtirilgan O'zgarishlar

### 1. Amazing Store Narxlarini Yuklash

**Backend Service:** `seller-app/backend/services/prices.js` (yangi fayl)

```javascript
// Amazing Store'dan narxlarni product_prices ga ko'chirish
async function syncAmazingStorePrices() {
    // 1. Amazing Store'dagi barcha tovarlarni olish
    // 2. Har bir tovar uchun product_prices da yozuv bor-yo'qligini tekshirish
    // 3. Agar yo'q bo'lsa, yaratish:
    //    - selling_price = sale_price || price
    //    - strikethrough_price = price (agar sale_price mavjud bo'lsa)
    //    - cost_price = NULL (keyinroq to'ldiriladi)
    //    - commission_rate = NULL (keyinroq to'ldiriladi)
    //    - marketplace_id = NULL (Amazing Store)
}
```

### 2. Frontend'da Komissiya Miqdorini Ko'rsatish

**Hozirgi holat:**
```javascript
const commissionAmount = commissionRate && sellingPrice ? (sellingPrice * commissionRate) / 100 : null;
```

**Yechim:** ✅ Hozir to'g'ri ishlayapti, faqat ko'rsatishni yaxshilash kerak.

### 3. Rentabillik Hisoblash

**Hozirgi holat:**
- Backend'da hisoblanadi va saqlanadi ✅
- Frontend'da faqat ko'rsatiladi ✅

**Tavsiya:** ✅ Hozirgi yondashuv to'g'ri - bazada saqlash va avtomatik yangilanish.

## 🔧 Implementatsiya Rejasi

### Qadam 1: Amazing Store Narxlarini Yuklash Service

**Fayl:** `seller-app/backend/services/prices.js` (yangi)

```javascript
const pool = require('../db');

class PriceService {
    // Amazing Store'dan narxlarni product_prices ga ko'chirish
    async syncAmazingStorePrices() {
        // 1. Amazing Store'dagi barcha tovarlarni olish
        const { rows: products } = await pool.query(`
            SELECT id, price, sale_price, sku
            FROM products
            WHERE is_active = true
        `);

        // 2. Har bir tovar uchun product_prices da yozuv yaratish/yangilash
        for (const product of products) {
            const sellingPrice = product.sale_price || product.price;
            const strikethroughPrice = product.sale_price ? product.price : null;

            await pool.query(`
                INSERT INTO product_prices (product_id, marketplace_id, selling_price, strikethrough_price)
                VALUES ($1, NULL, $2, $3)
                ON CONFLICT (product_id, marketplace_id) 
                DO UPDATE SET
                    selling_price = EXCLUDED.selling_price,
                    strikethrough_price = EXCLUDED.strikethrough_price,
                    updated_at = NOW()
            `, [product.id, sellingPrice, strikethroughPrice]);
        }
    }
}

module.exports = new PriceService();
```

### Qadam 2: Server Start'da Avtomatik Sync

**Fayl:** `seller-app/backend/server.js`

```javascript
const priceService = require('./services/prices');

async function startServer() {
    try {
        await initializeDatabase();
        
        // Amazing Store narxlarini sync qilish
        await priceService.syncAmazingStorePrices();
        console.log('✅ Amazing Store prices synced');
        
        app.listen(PORT, () => {
            console.log(`✅ Seller App Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
```

### Qadam 3: Frontend'da Komissiya Miqdorini Ko'rsatish

**Fayl:** `seller-app/frontend/catalog.js`

**Hozirgi holat:** ✅ To'g'ri ishlayapti
```javascript
const commissionAmount = commissionRate && sellingPrice ? (sellingPrice * commissionRate) / 100 : null;
```

**Yaxshilash:** Ko'rsatishni yanada aniq qilish.

### Qadam 4: Rentabillik Avtomatik Yangilanish

**Fayl:** `seller-app/backend/routes/prices.js`

**Hozirgi holat:** ✅ To'g'ri ishlayapti
- POST va PUT endpoint'larida rentabillik avtomatik hisoblanadi va saqlanadi

## 📊 Database Schema - Final

### product_prices jadvali (hozirgi holat to'g'ri):

```sql
CREATE TABLE product_prices (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    marketplace_id INTEGER REFERENCES marketplaces(id) ON DELETE CASCADE, -- NULL = Amazing Store
    cost_price DECIMAL(10, 2), -- Tannarx (keyinroq to'ldiriladi)
    selling_price DECIMAL(10, 2), -- Sotish narxi (Amazing Store'dan yuklanadi)
    commission_rate DECIMAL(5, 2), -- Komissiya foizi (keyinroq to'ldiriladi)
    strikethrough_price DECIMAL(10, 2), -- Chizilgan narx (Amazing Store'dan yuklanadi)
    profitability DECIMAL(10, 2), -- Rentabillik (avtomatik hisoblanadi)
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, marketplace_id)
);
```

## 🎯 Best Practices

### 1. Komissiya Foizi vs Miqdori

**✅ Tavsiya:**
- **Komissiya foizi bazada saqlanadi** (`commission_rate`)
- **Komissiya miqdori frontend'da hisoblanadi** (`commission_amount = selling_price * commission_rate / 100`)

**Sabab:**
- Foiz o'zgarmaydi, miqdor narxga bog'liq
- Bir nechta marketplace'da turli foizlar bo'lishi mumkin
- Frontend'da real-time hisoblash aniqroq

### 2. Rentabillik Hisoblash

**✅ Tavsiya:**
- **Rentabillik bazada saqlanadi** (`profitability`)
- **Avtomatik yangilanish:** Narxlar o'zgarganda rentabillik qayta hisoblanadi

**Formula:**
```javascript
profitability = (selling_price - cost_price) - (selling_price * commission_rate / 100)
```

**Sabab:**
- Performance: Frontend'da har safar hisoblashdan ko'ra tezroq
- Analytics: Tarixiy ma'lumotlar saqlanadi
- Consistency: Barcha joylarda bir xil formula

### 3. Amazing Store Narxlari

**✅ Tavsiya:**
- **Avtomatik sync:** Server start'da yoki cron job orqali
- **Mapping:**
  - `price` → `strikethrough_price` (agar `sale_price` mavjud bo'lsa)
  - `sale_price` → `selling_price` (agar mavjud bo'lsa)
  - `price` → `selling_price` (agar `sale_price` yo'q bo'lsa)

## 📝 Implementatsiya Qadamlari

1. ✅ **PriceService yaratish** - Amazing Store narxlarini sync qilish
2. ✅ **Server start'da sync** - Avtomatik yuklash
3. ✅ **Frontend'da komissiya miqdorini ko'rsatish** - Hozir to'g'ri ishlayapti
4. ✅ **Rentabillik avtomatik yangilanish** - Hozir to'g'ri ishlayapti
5. ⏳ **Test qilish** - Barcha funksiyalarni tekshirish

## 🔍 Frontend Ko'rsatish

### Katalog sahifasida:

1. **Tannarx:** `cost_price` (agar mavjud bo'lsa, aks holda "-")
2. **Sotish narxi:** `selling_price` (Amazing Store'dan yuklanadi)
3. **Chizilgan narx:** `strikethrough_price` (agar mavjud bo'lsa)
4. **Komissiya foizi:** `commission_rate` (agar mavjud bo'lsa)
5. **Komissiya miqdori:** `selling_price * commission_rate / 100` (frontend'da hisoblanadi)
6. **Rentabillik:** `profitability` (bazadan olinadi)

## ✅ Xulosa

1. **Amazing Store narxlari:** Avtomatik sync qilish kerak
2. **Tannarx va komissiya:** Keyinroq to'ldiriladi (edit qilganda)
3. **Komissiya foizi:** Bazada saqlanadi
4. **Komissiya miqdori:** Frontend'da hisoblanadi
5. **Rentabillik:** Bazada saqlanadi va avtomatik yangilanishadi

**Keyingi qadam:** PriceService yaratish va Amazing Store narxlarini sync qilish.

