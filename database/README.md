# Database Migrations

Bu folder barcha database migration'lar ni o'z ichiga oladi.

## Struktura

```
database/
├── migrations/
│   ├── 001_amazing_store_core.sql    - Amazing Store asosiy jadvallar
│   ├── 002_seller_app_core.sql       - Seller App asosiy jadvallar
│   ├── 003_add_sku.sql               - SKU qo'shish
│   └── ...
├── seeds/
│   └── default_data.sql              - Default ma'lumotlar
├── migrate.js                        - Migration runner
└── README.md                         - Bu fayl
```

## Migration'lar ni Bajarish

### Local Development

```bash
# Root directory'dan
node database/migrate.js
```

### Backend Start'da Avtomatik

Har bir backend start'da migration'lar ni avtomatik bajaradi:
- Amazing Store: `amazing store/backend/server.js`
- Seller App: `seller-app/backend/server.js`

## Migration Version Tracking

Migration'lar `schema_migrations` jadvalida kuzatiladi:
- `version` - Migration versiyasi (001, 002, ...)
- `name` - Migration fayl nomi
- `applied_at` - Qachon bajarilgan

## Yangi Migration Yaratish

1. `migrations/` folder'da yangi fayl yaratish
2. Nomlash: `XXX_description.sql` (XXX - ketma-ket raqam)
3. SQL kodini yozish
4. Migration'lar avtomatik bajariladi

## Migration Best Practices

1. **Idempotent bo'lishi kerak** - Bir necha marta bajarilsa ham xatolik bermasligi kerak
2. **IF NOT EXISTS ishlatish** - Jadval/ustun mavjud bo'lsa, o'tkazib yuborish
3. **Transaction ichida** - Migration'lar transaction ichida bajariladi
4. **Version tracking** - Har bir migration versiya raqamiga ega

## Migration Tartibi

Migration'lar alfavit bo'yicha tartiblanadi va ketma-ket bajariladi:
1. `001_amazing_store_core.sql`
2. `002_seller_app_core.sql`
3. `003_add_sku.sql`
...

