# 🛡️ Database Xavfsizlik - Bot Token O'zgartirish

## ⚠️ Muammo

Bot token o'zgartirilganda barcha database ma'lumotlari o'chib ketgan. Bu juda jiddiy muammo!

## 🔍 Sabab

`000_RESET_DATABASE.sql` migration fayli mavjud va u barcha jadvallarni o'chiradi. Agar bu migration server ishga tushganda avtomatik bajarilsa, barcha ma'lumotlar yo'qoladi.

## ✅ Yechim

### 1. RESET Migration'larini Production'da Bloklash

Barcha migration runner'lar (`database/migrate.js`, `amazing store/backend/utils/migrate.js`, `seller-app/backend/utils/migrate.js`) endi RESET migration'larini production'da skip qiladi:

- ✅ Production environment'da (`NODE_ENV=production`, `RAILWAY_ENVIRONMENT=production`) RESET migration'lar avtomatik skip qilinadi
- ✅ Development'da ham `ALLOW_RESET_MIGRATION=true` bo'lmaguncha skip qilinadi
- ✅ Ogohlantirish xabarlari ko'rsatiladi

### 2. Bot Token O'zgartirish

**Bot token o'zgartirilganda:**
- ✅ Database ma'lumotlari **hech qachon** o'chmaydi
- ✅ Faqat environment variable o'zgaradi
- ✅ Server qayta ishga tushganda migration'lar ishlamaydi (allaqachon bajarilgan)
- ✅ RESET migration'lar production'da bloklangan

### 3. Migration System Xavfsizligi

**Migration tracking:**
- `schema_migrations` table'da barcha migration'lar kuzatiladi
- Agar migration allaqachon bajarilgan bo'lsa, skip qilinadi
- RESET migration'lar production'da hech qachon ishlamaydi

## 📋 Qanday Ishlaydi

### Production'da:
```bash
# Bot token o'zgartirish
export TELEGRAM_BOT_TOKEN="new_token"

# Server ishga tushganda:
# ✅ Normal migration'lar ishlaydi (agar yangi bo'lsa)
# ❌ RESET migration'lar skip qilinadi
# ✅ Database ma'lumotlari saqlanadi
```

### Development'da RESET Migration Ishlatish:
```bash
# Faqat development'da, explicit ruxsat bilan:
export ALLOW_RESET_MIGRATION=true
export NODE_ENV=development

# Keyin server ishga tushganda RESET migration ishlaydi
```

## 🚨 Muhim Eslatmalar

1. **Bot token o'zgartirish xavfsiz** - Database ma'lumotlari o'chmaydi
2. **RESET migration'lar faqat development'da** - Production'da hech qachon ishlamaydi
3. **Migration tracking** - Barcha migration'lar kuzatiladi va ikki marta ishlamaydi
4. **Database xavfsiz** - Ma'lumotlar faqat UI orqali o'chirilganda o'chadi

## 🔧 Qo'shimcha Xavfsizlik

Agar kelajakda yanada xavfsizlik kerak bo'lsa:

1. **Database backup** - Muntazam backup'lar olish
2. **Read-only mode** - Production'da faqat o'qish rejimi
3. **Migration approval** - Production'da migration'lar manual approval bilan

## ✅ Test Qiling

1. Bot token o'zgartiring
2. Server'ni qayta ishga tushiring
3. Database ma'lumotlari saqlanib qolganini tekshiring
4. RESET migration skip qilinganini log'larda ko'ring
