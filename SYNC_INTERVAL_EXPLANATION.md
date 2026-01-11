# Sync Interval Explanation

## sync_interval_minutes - Bu nima uchun?

### ❌ Noto'g'ri tushuncha:
"sync_interval_minutes = 60" deb qo'yilgan - bu miniapp'da 60 minutdan keyin ma'lumotlar yangilanadimi?

### ✅ To'g'ri javob:
**YO'Q!** `sync_interval_minutes` miniapp bilan **hech qanday aloqasi yo'q**.

## Nima uchun kerak?

### 1. **External Marketplace Sync uchun**
- `sync_interval_minutes` faqat **tashqi marketplace'lardan** ma'lumotlarni olish uchun
- Masalan: Uzum, Yandex Market, Wildberries va boshqa external API'lar
- Bu marketplace'lardan tovarlarni, buyurtmalarni, narxlarni **periodik ravishda** sinxronlashtirish uchun

### 2. **Amazing Store uchun**
- Amazing Store - bu **local database** (bizning o'zimizning)
- MiniApp va Seller App **to'g'ridan-to'g'ri database'dan** o'qiydi
- **Hech qanday sync kerak emas** - ma'lumotlar darhol ko'rinadi!

## Qanday ishlaydi?

```
┌─────────────────┐
│  Amazing Store  │ ← MiniApp va Seller App to'g'ridan-to'g'ri o'qiydi
│   (Database)    │    (Sync KERAK EMAS - real-time)
└─────────────────┘

┌─────────────────┐      sync_interval_minutes      ┌──────────────┐
│  External APIs  │ ←──────── 60 min ─────────────→ │  Amazing     │
│ (Uzum, Yandex)  │    (Periodik sinxronlash)      │  Store DB    │
└─────────────────┘                                  └──────────────┘
```

## Natija:

1. **MiniApp'da ma'lumotlar:**
   - ✅ **Real-time** - yangi tovar/buyurtma qo'shilsa, darhol ko'rinadi
   - ✅ Sync interval'ga **bog'liq emas**
   - ✅ Database'dan to'g'ridan-to'g'ri o'qiladi

2. **External Marketplace'lar:**
   - ⏰ 60 minutda bir marta sinxronlash
   - ⏰ Bu faqat external API'lardan ma'lumot olish uchun
   - ⏰ Amazing Store o'z ma'lumotlariga ta'sir qilmaydi

## Xulosa:

**`sync_interval_minutes = 60`** - bu faqat external marketplace'lar uchun. Amazing Store (miniapp) uchun **sync kerak emas**, chunki u local database'dan to'g'ridan-to'g'ri o'qiydi!
