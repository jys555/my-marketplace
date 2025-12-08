# Railway Watch Paths Konfiguratsiyasi

## Hozirgi Holat

### Seller App Backend
- **Watch Paths:** `/seller-app/backend/src/**`
- **Muammo:** Migration'lar `database/migrations/` papkasida, lekin watch path faqat `seller-app/backend/src/**` ni kuzatmoqda

### Amazing Store Backend
- **Watch Paths:** (rasmda ko'rinmagan, lekin shunga o'xshash bo'lishi mumkin)

## Muammo

**Migration'lar o'zgarganda yangi deployment qilinmaydi:**
- Migration'lar `database/migrations/` papkasida
- Watch Paths faqat `/seller-app/backend/src/**` ni kuzatmoqda
- Agar `database/migrations/` papkasida yangi migration qo'shilsa, Railway yangi deployment qilmaydi

## Yechim

### Watch Paths'ga Qo'shish Kerak

**Seller App Backend:**
```
/seller-app/backend/src/**
/database/migrations/**
```

**Amazing Store Backend:**
```
/amazing store/backend/src/**
/database/migrations/**
```

## Nega Bu Muhim?

1. **Migration'lar o'zgarganda:** Yangi migration qo'shilganda, Railway yangi deployment qilishi kerak
2. **Database schema o'zgarganda:** Migration'lar database schema'ni o'zgartiradi, shuning uchun backend'lar yangi deployment qilishi kerak
3. **Monorepo struktura:** Migration'lar markazlashtirilgan `database/migrations/` papkasida, lekin har bir backend ularni ishlatadi

## Railway Dashboard'da Sozlash

### Seller App Backend
1. Railway Dashboard → seller-app-backend → Settings
2. Watch Paths bo'limiga:
   ```
   /seller-app/backend/src/**
   /database/migrations/**
   ```

### Amazing Store Backend
1. Railway Dashboard → amazing-store-backend → Settings
2. Watch Paths bo'limiga:
   ```
   /amazing store/backend/src/**
   /database/migrations/**
   ```

## Qo'shimcha Watch Paths (Ixtiyoriy)

Agar boshqa umumiy fayllar bo'lsa, ularni ham qo'shish mumkin:
- `/database/migrate.js` - Migration runner
- `/package.json` - Umumiy dependencies (agar bo'lsa)

## Xulosa

**Watch Paths'ga qo'shish kerak:**
- ✅ `/database/migrations/**` - Migration'lar uchun
- ✅ `/database/migrate.js` - Migration runner uchun (ixtiyoriy)

**Hozirgi Watch Paths:**
- ❌ `/seller-app/backend/src/**` - Faqat backend kodini kuzatmoqda
- ❌ Migration'lar kuzatilmayapti

