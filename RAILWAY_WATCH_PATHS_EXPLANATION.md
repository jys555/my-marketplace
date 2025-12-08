# Railway Watch Paths Tushuntirishi

## Muammo

**Hozirgi holat:**
- Watch Paths: `/seller-app/backend/src/**`
- Migration'lar: `database/migrations/` papkasida
- **Muammo:** Migration'lar o'zgarganda yangi deployment qilinmaydi

## Yechim

### 1. Railway.json'ga Qo'shildi

**Seller App Backend:**
```json
{
  "watchPatterns": [
    "/seller-app/backend/src/**",
    "/database/migrations/**",
    "/database/migrate.js"
  ]
}
```

**Amazing Store Backend:**
```json
{
  "watchPatterns": [
    "/amazing store/backend/src/**",
    "/database/migrations/**",
    "/database/migrate.js"
  ]
}
```

### 2. Railway Dashboard'da Ham Sozlash Kerak

Railway.json'da `watchPatterns` bo'lsa ham, Railway dashboard'da ham sozlash tavsiya etiladi:

**Seller App Backend:**
1. Railway Dashboard → seller-app-backend → Settings
2. Watch Paths bo'limiga:
   ```
   /seller-app/backend/src/**
   /database/migrations/**
   /database/migrate.js
   ```

**Amazing Store Backend:**
1. Railway Dashboard → amazing-store-backend → Settings
2. Watch Paths bo'limiga:
   ```
   /amazing store/backend/src/**
   /database/migrations/**
   /database/migrate.js
   ```

## Nega Bu Muhim?

### 1. Migration'lar O'zgarganda
- Yangi migration qo'shilganda (`database/migrations/007_*.sql`)
- Migration'lar o'zgartirilganda
- Railway yangi deployment qilishi kerak

### 2. Database Schema O'zgarganda
- Migration'lar database schema'ni o'zgartiradi
- Backend'lar yangi schema'ni ishlatishi kerak
- Shuning uchun yangi deployment kerak

### 3. Monorepo Struktura
- Migration'lar markazlashtirilgan `database/migrations/` papkasida
- Har bir backend ularni ishlatadi
- Shuning uchun har bir backend migration'larni kuzatishi kerak

## Watch Paths Tushuntirishi

### `/seller-app/backend/src/**`
- Backend kodini kuzatadi
- Kod o'zgarganda yangi deployment qiladi

### `/database/migrations/**`
- Barcha migration fayllarini kuzatadi
- Yangi migration qo'shilganda yoki o'zgartirilganda yangi deployment qiladi

### `/database/migrate.js`
- Migration runner'ni kuzatadi
- Migration runner o'zgarganda yangi deployment qiladi

## Xulosa

**Watch Paths'ga qo'shish kerak:**
- ✅ `/database/migrations/**` - Migration'lar uchun
- ✅ `/database/migrate.js` - Migration runner uchun

**Hozirgi Watch Paths:**
- ✅ `/seller-app/backend/src/**` - Backend kodini kuzatmoqda
- ✅ `/database/migrations/**` - Migration'larni kuzatmoqda (qo'shildi)
- ✅ `/database/migrate.js` - Migration runner'ni kuzatmoqda (qo'shildi)

**Endi:**
- Migration'lar o'zgarganda Railway yangi deployment qiladi
- Database schema o'zgarganda backend'lar yangilashadi
- Monorepo struktura to'g'ri ishlaydi

