# Database Migration Best Practice - Real Project Implementation

## 🎯 Maqsad

Database strukturalarni markazlashtirish va barchasini real tizimlashtirish.

## ✅ Real Loyihalarda Best Practice

### 1. Markazlashtirilgan Migration'lar

**Struktura:**
```
my-marketplace/
├── database/
│   ├── migrations/
│   │   ├── 001_amazing_store_core.sql
│   │   ├── 002_seller_app_core.sql
│   │   └── 003_add_sku.sql
│   └── migrate.js (Markazlashtirilgan runner)
├── amazing-store/backend/
│   └── utils/
│       └── migrate.js (Wrapper - markazlashtirilgan runner'ni chaqiradi)
└── seller-app/backend/
    └── utils/
        └── migrate.js (Wrapper - markazlashtirilgan runner'ni chaqiradi)
```

### 2. Wrapper Pattern

Har bir backend'da wrapper yaratiladi:
- Markazlashtirilgan migration runner'ni chaqiradi
- Path resolution'ni hal qiladi
- Railway deployment uchun fallback'lar mavjud

### 3. Build-Time Migration Copy

Railway deployment uchun:
- `prestart` script migration'lar ni copy qiladi
- `scripts/prepare-migrations.js` - migration'lar ni backend'ga copy qiladi
- Bu faqat deployment uchun, development'da kerak emas

## 📁 Struktura

### Markazlashtirilgan Migration Runner

**`database/migrate.js`** - Asosiy migration runner:
- Barcha migration'lar ni bajaradi
- Version tracking
- Transaction ichida bajarish
- Multiple path resolution (local va Railway)

### Backend Wrappers

**`seller-app/backend/utils/migrate.js`** - Wrapper:
- Markazlashtirilgan runner'ni chaqiradi
- Path resolution'ni hal qiladi
- Fallback'lar mavjud

**`amazing store/backend/utils/migrate.js`** - Wrapper:
- Xuddi shu logika

### Build Scripts

**`seller-app/backend/scripts/prepare-migrations.js`**:
- Railway build vaqtida migration'lar ni copy qiladi
- `prestart` script orqali avtomatik ishlaydi

## 🔄 Ishlash Prinsipi

### Local Development

1. `database/migrate.js` - markazlashtirilgan runner
2. `database/migrations/` - markazlashtirilgan migration'lar
3. Har bir backend wrapper orqali markazlashtirilgan runner'ni chaqiradi

### Railway Deployment

1. Build vaqtida `prestart` script ishlaydi
2. `prepare-migrations.js` migration'lar ni copy qiladi
3. Wrapper markazlashtirilgan runner'ni topishga harakat qiladi
4. Agar topilmasa, copy qilingan migration'lar dan foydalanadi

## ✅ Afzalliklari

1. **Markazlashtirilgan** - Barcha migration'lar bir joyda
2. **DRY Principle** - Kod dublikatsiyasi yo'q
3. **Maintainable** - Bitta o'zgarish barcha backend'larga ta'sir qiladi
4. **Railway Compatible** - Deployment'da ishlaydi
5. **Flexible** - Multiple path resolution

## 📝 Migration Yaratish

1. `database/migrations/` folder'da yangi fayl yaratish
2. Nomlash: `XXX_description.sql` (XXX - ketma-ket raqam)
3. SQL kodini yozish
4. Migration'lar avtomatik bajariladi

## 🚀 Deployment

### Railway

1. Build vaqtida `prestart` script ishlaydi
2. Migration'lar backend'ga copy qilinadi
3. Server start'da migration'lar bajariladi

### Local

1. Migration'lar markazlashtirilgan joydan o'qiladi
2. Wrapper markazlashtirilgan runner'ni chaqiradi

## 🎉 Xulosa

Endi database migration'lar:
- ✅ Markazlashtirilgan
- ✅ Real loyiha standartlariga mos
- ✅ DRY principle'ga amal qiladi
- ✅ Railway'da ishlaydi
- ✅ Maintainable va scalable

