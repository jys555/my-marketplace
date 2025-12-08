# Railway Monorepo Migration Yechimi

## Muammo

Railway'da har bir backend **alohida service** sifatida deploy qilinadi:
- Working directory: `seller-app/backend` yoki `amazing store/backend`
- Migration'lar: `database/migrations/` (monorepo root'da)
- Muammo: Railway'da `database/migrations` papkasi mavjud emas

## Real Loyihalarda Yondashuv

### Variant 1: Railway Root Directory Set Qilish (Tavsiya) ✅

**Yondashuv:** Railway'da har bir service'ga **root directory** set qilish.

**Railway Dashboard'da:**
1. Service → Settings → Root Directory
2. Root Directory: `seller-app/backend` yoki `amazing store/backend`
3. Lekin **monorepo root'ni ko'rish uchun** sozlash kerak

**Muammo:** Railway'da root directory faqat service papkasini ko'radi, monorepo root'ni emas.

### Variant 2: Environment Variable Orqali Path Berish ✅

**Yondashuv:** Environment variable orqali migration path'ni berish.

**Railway Dashboard'da:**
- `MIGRATIONS_PATH` environment variable qo'shish
- Value: `../../database/migrations` (relative path)

**Muammo:** Railway'da relative path ishlamaydi, chunki working directory har xil.

### Variant 3: Migration Runner O'zi Bir Nechta Path'larni Tekshirish ✅ (Hozirgi)

**Yondashuv:** Migration runner o'zi bir nechta path'larni tekshiradi va migration'larni topadi.

**Afzalliklari:**
- ✅ Dublikatsiya yo'q
- ✅ Markazlashtirilgan
- ✅ Real loyihalarda standart

**Kamchiliklari:**
- ⚠️ Railway'da `database/migrations` papkasi mavjud bo'lmasligi mumkin

### Variant 4: Symlink Yaratish (Linux/Mac) ❌

**Yondashuv:** Build vaqtida symlink yaratish.

**Muammo:** Railway'da symlink ishlamaydi yoki ishlamasligi mumkin.

### Variant 5: Build Vaqtida Copy Qilish (Dublikatsiya) ❌

**Yondashuv:** Build vaqtida migration'larni copy qilish.

**Muammo:** 
- ❌ Dublikatsiya
- ❌ Maintenance qiyin

## Eng Yaxshi Yechim (Real Loyihalarda)

### Migration Runner O'zi Bir Nechta Path'larni Tekshirish ✅

**Yondashuv:**
1. Migration runner o'zi bir nechta path'larni tekshiradi
2. Avval markazlashtirilgan `database/migrations` ni qidiradi
3. Keyin alternative path'larni tekshiradi
4. Agar topilmasa, xato beradi

**Kod:**
```javascript
const possibleMigrationDirs = [
    // 1. Centralized migrations (monorepo root)
    path.join(__dirname, '../../../database/migrations'),
    path.join(__dirname, '../../../../database/migrations'),
    path.join(__dirname, '../../../../../database/migrations'),
    // 2. Local migrations (fallback)
    path.join(__dirname, '../migrations/centralized'),
    path.join(__dirname, '../migrations'),
];
```

**Afzalliklari:**
- ✅ Dublikatsiya yo'q
- ✅ Markazlashtirilgan
- ✅ Real loyihalarda standart
- ✅ Railway'da ishlaydi (agar path to'g'ri bo'lsa)

**Muammo:**
- ⚠️ Railway'da `database/migrations` papkasi mavjud bo'lmasligi mumkin

## Railway'da Muammo Hal Qilish

### Yechim 1: Railway'da Root Directory Set Qilish

Railway'da har bir service'ga **root directory** set qilish:
- Root Directory: `.` (monorepo root)
- Start Command: `cd seller-app/backend && npm start`

**Muammo:** Bu ham ishlamasligi mumkin.

### Yechim 2: Migration Runner O'zi Bir Nechta Path'larni Tekshirish (Hozirgi) ✅

Migration runner o'zi bir nechta path'larni tekshiradi va migration'larni topadi.

**Muammo:** Railway'da `database/migrations` papkasi mavjud bo'lmasligi mumkin.

### Yechim 3: Railway'da Monorepo Root'ni Ko'rish Uchun Sozlash

Railway'da monorepo root'ni ko'rish uchun sozlash:
- Root Directory: `.` (monorepo root)
- Start Command: `cd seller-app/backend && npm start`

**Muammo:** Bu ham ishlamasligi mumkin.

## Tavsiya

**Migration Runner O'zi Bir Nechta Path'larni Tekshirish** (hozirgi yechim) - real loyihalarda standart va tavsiya etiladi.

**Sabab:**
- ✅ Dublikatsiya yo'q
- ✅ Markazlashtirilgan
- ✅ Real loyihalarda standart
- ✅ Railway'da ishlaydi (agar path to'g'ri bo'lsa)

**Agar Railway'da `database/migrations` papkasi mavjud bo'lmasa:**
- Railway dashboard'da root directory'ni `.` (monorepo root) qilish
- Yoki migration'lar har bir backend'ga copy qilish (lekin bu dublikatsiya)

