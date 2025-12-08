# Railway Root Directory Muammosi va Yechimi

## Muammo

**Loglardan:**
```
📁 Found migrations directory: /app/migrations/centralized (3 files)
⏭️  Migration 001_amazing_store_core.sql already applied (version 1)
⏭️  Migration 002_seller_app_core.sql already applied (version 2)
⏭️  Migration 003_add_sku.sql already applied (version 3)
🎉 Migrations completed: 0 applied, 3 skipped
```

**Muammo:**
- Migration runner faqat `/app/migrations/centralized` papkasini topmoqda (3 ta fayl)
- Markazlashtirilgan `database/migrations` papkasi topilmayapti (6 ta fayl)
- Migration'lar 004, 005, 006 topilmayapti va bajarilmayapti

## Sabab

**Railway'da Root Directory:**
- Railway'da har bir service uchun **Root Directory** sozlanadi
- Hozirgi holat: Root Directory = `seller-app/backend`
- Working Directory: `/app` (seller-app/backend)
- Muammo: `database/migrations` papkasi `/app` dan tashqarida

## Yechim

### Variant 1: Railway Dashboard'da Root Directory'ni O'zgartirish ✅ (Tavsiya)

**Seller App Backend:**
1. Railway Dashboard → seller-app-backend → Settings
2. **Root Directory** bo'limiga: `.` (monorepo root)
3. **Start Command** bo'limiga: `cd seller-app/backend && npm start`

**Amazing Store Backend:**
1. Railway Dashboard → amazing-store-backend → Settings
2. **Root Directory** bo'limiga: `.` (monorepo root)
3. **Start Command** bo'limiga: `cd "amazing store/backend" && npm start`

**Afzalliklari:**
- ✅ Migration runner `database/migrations` papkasini topadi
- ✅ Watch Paths to'g'ri ishlaydi
- ✅ Monorepo struktura to'g'ri ishlaydi

### Variant 2: Migration Runner Path'larini Yaxshilash ✅ (Hozirgi)

**Yechim:**
- Migration runner'ga debug log'lar qo'shildi
- Barcha topilgan papkalarni ko'rsatadi
- Eng ko'p migration fayllari bo'lgan papkani tanlaydi

**Kod:**
```javascript
const foundDirs = [];
for (const dir of possibleMigrationDirs) {
    if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql'));
        foundDirs.push({ dir, files: files.length });
        if (files.length > maxFiles) {
            maxFiles = files.length;
            migrationsDir = dir;
        }
    }
}
console.log('📂 Found migration directories:');
foundDirs.forEach(({ dir, files }) => {
    console.log(`   - ${dir} (${files} files)`);
});
```

## Tavsiya

**Eng yaxshi yechim:** Railway Dashboard'da Root Directory'ni `.` (monorepo root) qilish

**Sabab:**
1. Migration runner `database/migrations` papkasini topadi
2. Watch Paths to'g'ri ishlaydi
3. Monorepo struktura to'g'ri ishlaydi
4. Real loyihalarda standart yondashuv

## Keyingi Qadamlar

1. Railway Dashboard'da Root Directory'ni `.` qilish
2. Start Command'ni `cd seller-app/backend && npm start` qilish
3. Deploy qilib, log'larni tekshirish
4. Migration'lar 004, 005, 006 bajarilganini tasdiqlash

