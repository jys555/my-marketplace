# Amazing Store Bot'ga Seller App Qo'shish - Qo'llanma

## Hozirgi Holat

Seller App **allaqachon** bot service'ga qo'shilgan! Bot service'da quyidagilar mavjud:

### 1. Seller App URL'i
```javascript
this.sellerAppUrl = process.env.SELLER_APP_URL || 'https://seller-app-frontend.vercel.app';
```

### 2. Admin Button (Faqat Admin uchun)
Bot'da faqat `is_admin = true` bo'lgan userlarga **Admin Panel** button ko'rinadi:
- `/start` command'da
- `/admin` command'da
- Boshqa xabarlarda

## Qanday Ishlaydi

### 1. Oddiy Foydalanuvchi (is_admin = false)
```
/start → 
  🛒 Amazing Store (button)
```

### 2. Admin (is_admin = true)
```
/start → 
  🛒 Amazing Store (button)
  ⚙️ Admin Panel (button) ← Seller App
```

## Sozlash Qadamlari

### 1. Railway Environment Variables

**Amazing Store Backend** service'da quyidagi environment variables'ni qo'shing:

```bash
TELEGRAM_BOT_TOKEN=your_bot_token
ADMIN_TELEGRAM_ID=your_admin_telegram_id
AMAZING_STORE_URL=https://amazing-store-frontend.vercel.app
SELLER_APP_URL=https://seller-app-frontend.vercel.app
WEBHOOK_URL=https://amazing-store-backend-production.up.railway.app/webhook (optional)
```

### 2. Database'da Admin Qilish

Admin qilish uchun database'da user'ning `is_admin` field'ini `true` qilish kerak:

```sql
-- Admin qilish
UPDATE users 
SET is_admin = true 
WHERE telegram_id = YOUR_TELEGRAM_ID;

-- Tekshirish
SELECT telegram_id, first_name, is_admin 
FROM users 
WHERE is_admin = true;
```

### 3. Bot'ni Test Qilish

1. Bot'ga `/start` yuborish
2. Agar admin bo'lsangiz, **Admin Panel** button ko'rinishi kerak
3. Button'ni bosib, Seller App ochilishi kerak

## Bot Funksiyalari

### `/start` Command
- **Barcha foydalanuvchilar:** Amazing Store button
- **Admin'lar:** Amazing Store + Admin Panel (Seller App) button

### `/admin` Command
- **Faqat admin'lar uchun**
- Admin Panel (Seller App) + Amazing Store button

### `/orders` Command
- **Barcha foydalanuvchilar uchun**
- Mijozning buyurtmalari ro'yxati

## Qo'shimcha Sozlashlar

### Menu Button (Telegram Bot Settings)

Telegram Bot Settings'da Menu Button'ni sozlash:

1. **BotFather** ga kiring: `@BotFather`
2. `/setmenubutton` yuborish
3. Bot'ni tanlang
4. Button text: `🛒 Bozorga kirish`
5. URL: `https://amazing-store-frontend.vercel.app`

**Eslatma:** Menu Button faqat bitta Mini App'ga ulash mumkin. Admin Panel uchun bot ichidagi button'lardan foydalanish kerak.

### Webhook Sozlash (Agar kerak bo'lsa)

Agar webhook ishlatmoqchi bo'lsangiz:

1. Railway'da `WEBHOOK_URL` environment variable'ni qo'shing
2. Webhook URL: `https://amazing-store-backend-production.up.railway.app/webhook`
3. Bot avtomatik webhook'ni sozlaydi

**Agar webhook ishlatmasangiz**, bot polling rejimida ishlaydi (default).

## Test Qilish

### 1. Admin Tekshirish
```sql
-- Database'da admin'lar ro'yxati
SELECT telegram_id, first_name, is_admin 
FROM users 
WHERE is_admin = true;
```

### 2. Bot'da Test
1. Bot'ga `/start` yuborish
2. Admin button ko'rinishini tekshirish
3. Button'ni bosib, Seller App ochilishini tekshirish

### 3. Xabarlar Test
1. Yangi buyurtma yaratish (Amazing Store'dan)
2. Admin'ga xabar kelishini tekshirish
3. Mijozga tasdiqlash xabari kelishini tekshirish

## Muammolarni Hal Qilish

### Admin Button Ko'rinmayapti

**Sabab:** User'ning `is_admin = false` yoki database'da user yo'q

**Yechim:**
```sql
-- Admin qilish
UPDATE users 
SET is_admin = true 
WHERE telegram_id = YOUR_TELEGRAM_ID;
```

### Seller App Ochilmayapti

**Sabab:** `SELLER_APP_URL` noto'g'ri yoki Vercel'da deploy qilinmagan

**Yechim:**
1. Vercel'da Seller App deploy qilinganligini tekshiring
2. `SELLER_APP_URL` to'g'ri ekanligini tekshiring
3. Railway'da environment variable'ni yangilang

### Bot Ishlamayapti

**Sabab:** `TELEGRAM_BOT_TOKEN` noto'g'ri yoki yo'q

**Yechim:**
1. Railway'da `TELEGRAM_BOT_TOKEN` mavjudligini tekshiring
2. Bot token to'g'ri ekanligini tekshiring
3. Railway logs'da xatoliklar bor-yo'qligini tekshiring

## Xulosa

Seller App **allaqachon** bot'ga qo'shilgan! Faqat:
1. Railway'da environment variables'ni sozlash
2. Database'da admin'ni `is_admin = true` qilish
3. Bot'ni test qilish

Barcha tayyor! 🎉

