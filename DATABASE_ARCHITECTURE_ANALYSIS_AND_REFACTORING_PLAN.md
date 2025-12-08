# Database Arxitektura Tahlili va Refactoring Rejasi

## 📊 Hozirgi Holat Tahlili

### 1. Database Strukturasi

**Bir xil Database (`DATABASE_URL`):**
- ✅ Amazing Store va Seller App bir xil PostgreSQL database'dan foydalanadi
- ✅ Ikkala backend ham `process.env.DATABASE_URL` orqali ulashadi
- ✅ Connection pool: Amazing Store (max: 15), Seller App (max: 15)

**Jadvallar:**
```
my-marketplace database:
├── users (Amazing Store)
├── products (Amazing Store - asosiy)
├── categories (Amazing Store)
├── banners (Amazing Store)
├── orders (Amazing Store - asosiy)
├── order_items (Amazing Store)
├── marketplaces (Seller App)
├── marketplace_products (Seller App)
├── purchases (Seller App)
├── purchase_items (Seller App)
├── inventory (Seller App)
├── inventory_movements (Seller App)
├── product_prices (Seller App)
├── daily_analytics (Seller App)
└── product_analytics (Seller App)
```

### 2. Hozirgi Arxitektura Muammolari

#### ❌ Muammo 1: Product Yaratish Amazing Store'da
**Hozirgi holat:**
- Product yaratish: `amazing store/backend/routes/products.js` (POST)
- Seller App: Faqat o'qish (`GET /api/seller/products`)

**Muammo:**
- Seller App to'g'ridan-to'g'ri database bilan ishlashi kerak
- Amazing Store faqat client-facing API bo'lishi kerak
- Product management Seller App'da bo'lishi kerak

#### ❌ Muammo 2: Database Initialization Dublikatsiya
**Hozirgi holat:**
- Amazing Store: `initDb.js` - `products`, `users`, `orders` yaratadi
- Seller App: `initDb.js` - Migration faylini o'qib, `marketplaces`, `product_prices` yaratadi

**Muammo:**
- Ikkala backend ham database'ni initialize qilmoqda
- Migration'lar ikki joyda (Amazing Store va Seller App)
- Database schema boshqaruvida tartibsizlik

#### ❌ Muammo 3: Database Schema Boshqaruvi
**Hozirgi holat:**
- Amazing Store: `initDb.js` da inline SQL
- Seller App: `migrations/001_initial_schema.sql` faylida

**Muammo:**
- Migration'lar ikki xil formatda
- Schema o'zgarishlarini kuzatish qiyin
- Version control muammosi

## 🎯 Real Loyihalarda Best Practices

### 1. Monorepo Database Strukturasi

**Tavsiya etilgan struktura:**
```
my-marketplace/
├── database/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_add_sku.sql
│   │   ├── 003_seller_app_tables.sql
│   │   └── ...
│   ├── seeds/
│   │   └── default_data.sql
│   └── schema.sql (current state)
├── amazing-store/
│   └── backend/ (faqat API, database'ga to'g'ridan-to'g'ri ulashadi)
└── seller-app/
    └── backend/ (faqat API, database'ga to'g'ridan-to'g'ri ulashadi)
```

### 2. Database Access Pattern

**✅ To'g'ri yondashuv:**
- Har bir backend to'g'ridan-to'g'ri database bilan ishlaydi
- Backend'lar bir-biriga API orqali emas, database orqali ulashadi
- Migration'lar markazlashtirilgan (database/ folder)

**❌ Noto'g'ri yondashuv:**
- Backend'lar bir-biriga API orqali ulashadi
- Product yaratish Amazing Store'da, Seller App esa Amazing Store API'ni chaqiradi

### 3. Separation of Concerns

**Amazing Store:**
- **Rol:** Client-facing e-commerce platform
- **Vazifasi:** 
  - Product'lar ko'rsatish (GET)
  - Order qabul qilish
  - User management
  - Cart va favorites
- **Database:** Faqat o'qish (products, categories) va yozish (orders, users)

**Seller App:**
- **Rol:** Admin panel / Seller management system
- **Vazifasi:**
  - Product management (CRUD)
  - Inventory management
  - Price management
  - Analytics
  - Multi-marketplace integration
- **Database:** To'liq CRUD (products, prices, inventory, analytics)

## 📋 Refactoring Rejasi

### Qadam 1: Database Schema Markazlashtirish

**Maqsad:** Barcha migration'lar bir joyda bo'lishi

**Qadamlari:**
1. `database/migrations/` folder yaratish
2. Barcha migration'lar ni ko'chirish
3. Migration runner yaratish
4. Ikkala backend'dan migration'lar ni olib tashlash

**Struktura:**
```
database/
├── migrations/
│   ├── 001_amazing_store_core.sql (users, products, categories, orders)
│   ├── 002_seller_app_core.sql (marketplaces, product_prices, inventory)
│   ├── 003_add_sku.sql
│   └── ...
├── seeds/
│   └── default_data.sql
└── README.md
```

### Qadam 2: Product Management Seller App'ga Ko'chirish

**Maqsad:** Product CRUD Seller App'da bo'lishi

**Qadamlari:**
1. ✅ Seller App'da product CRUD allaqachon mavjud
2. Amazing Store'dan product POST/PUT/DELETE ni olib tashlash
3. Amazing Store faqat GET qiladi
4. Seller App to'g'ridan-to'g'ri database bilan ishlaydi

**O'zgarishlar:**
- `amazing store/backend/routes/products.js`: POST, PUT, DELETE olib tashlash
- `seller-app/backend/routes/products.js`: CRUD allaqachon mavjud ✅

### Qadam 3: Database Initialization Refactoring

**Maqsad:** Migration'lar markazlashtirilgan bo'lishi

**Qadamlari:**
1. `database/migrate.js` yaratish (migration runner)
2. Amazing Store va Seller App'dan `initDb.js` ni refactor qilish
3. Migration'lar ni bajarish markazlashtirilgan bo'lishi

**Yangi struktura:**
```javascript
// database/migrate.js
async function runMigrations() {
    // Barcha migration'lar ni ketma-ket bajarish
    // Version tracking
    // Rollback imkoniyati
}
```

### Qadam 4: Backend'lar Mustaqil Ishlashi

**Maqsad:** Har bir backend to'g'ridan-to'g'ri database bilan ishlashi

**Hozirgi holat:**
- ✅ Ikkala backend ham to'g'ridan-to'g'ri database bilan ishlaydi
- ✅ Bir-biriga API orqali ulanmaydi

**Yaxshilash:**
- Database connection pool'ni optimallashtirish
- Transaction management
- Error handling

## 🔧 Implementatsiya Detallari

### 1. Database Folder Strukturasi

```
database/
├── migrations/
│   ├── 001_amazing_store_core.sql
│   │   - users
│   │   - products
│   │   - categories
│   │   - banners
│   │   - orders
│   │   - order_items
│   ├── 002_seller_app_core.sql
│   │   - marketplaces
│   │   - marketplace_products
│   │   - purchases
│   │   - purchase_items
│   │   - inventory
│   │   - inventory_movements
│   │   - product_prices
│   │   - daily_analytics
│   │   - product_analytics
│   ├── 003_add_sku.sql
│   ├── 004_add_is_admin.sql
│   └── 005_extend_orders.sql
├── seeds/
│   └── default_data.sql
│       - Default categories
│       - Default marketplace (AMAZING_STORE)
├── migrate.js (Migration runner)
└── README.md
```

### 2. Migration Runner

**Fayl:** `database/migrate.js`

```javascript
const pool = require('../seller-app/backend/db'); // Yoki umumiy db.js
const fs = require('fs');
const path = require('path');

async function runMigrations() {
    // Migration version tracking table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            applied_at TIMESTAMP DEFAULT NOW()
        )
    `);

    // Barcha migration fayllarini o'qish
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

    for (const file of files) {
        const version = parseInt(file.split('_')[0]);
        
        // Migration allaqachon bajarilganmi?
        const { rows } = await pool.query(
            'SELECT version FROM schema_migrations WHERE version = $1',
            [version]
        );

        if (rows.length === 0) {
            console.log(`🔄 Running migration: ${file}`);
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
            await pool.query(sql);
            
            await pool.query(
                'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
                [version, file]
            );
            console.log(`✅ Migration ${file} completed`);
        }
    }
}

module.exports = { runMigrations };
```

### 3. Backend Refactoring

**Amazing Store Backend:**
- `initDb.js` ni soddalashtirish (faqat migration'lar ni chaqirish)
- Product POST/PUT/DELETE ni olib tashlash
- Faqat GET endpoints qoldirish

**Seller App Backend:**
- `initDb.js` ni soddalashtirish (faqat migration'lar ni chaqirish)
- Product CRUD allaqachon mavjud ✅

## 📊 Database Schema - Final

### Core Tables (Amazing Store)

```sql
-- Users (Amazing Store)
users (id, telegram_id, username, first_name, last_name, phone, cart, favorites, is_admin, created_at, updated_at)

-- Products (Shared - Amazing Store o'qiydi, Seller App boshqaradi)
products (id, name_uz, name_ru, description_uz, description_ru, price, sale_price, image_url, category_id, is_active, sku, created_at)

-- Categories (Amazing Store)
categories (id, name_uz, name_ru, icon, color, sort_order, is_active, created_at)

-- Banners (Amazing Store)
banners (id, title, image_url, link_url, is_active, sort_order, created_at)

-- Orders (Amazing Store - asosiy, Seller App o'qiydi)
orders (id, user_id, order_number, total_amount, status, payment_method, delivery_method, marketplace_id, marketplace_order_id, customer_name, customer_phone, customer_address, order_date, delivery_date, created_at, updated_at)

-- Order Items (Amazing Store)
order_items (id, order_id, product_id, quantity, price, marketplace_product_id)
```

### Seller App Tables

```sql
-- Marketplaces
marketplaces (id, name, api_type, api_key, api_secret, access_token, refresh_token, token_expires_at, marketplace_code, is_active, created_at, updated_at)

-- Marketplace Products
marketplace_products (id, product_id, marketplace_id, marketplace_product_id, marketplace_sku, marketplace_name, marketplace_price, marketplace_strikethrough_price, commission_rate, status, last_synced_at, created_at, updated_at)

-- Purchases
purchases (id, purchase_date, total_amount, notes, created_at, created_by)

-- Purchase Items
purchase_items (id, purchase_id, product_id, quantity, purchase_price, total_price, created_at)

-- Inventory
inventory (id, product_id, quantity, reserved_quantity, last_updated_at, created_at)

-- Inventory Movements
inventory_movements (id, product_id, purchase_id, order_id, movement_type, quantity_change, quantity_before, quantity_after, notes, created_at)

-- Product Prices
product_prices (id, product_id, marketplace_id, cost_price, selling_price, commission_rate, strikethrough_price, profitability, updated_at)

-- Daily Analytics
daily_analytics (id, date, marketplace_id, total_orders, total_revenue, total_cost, total_profit, created_at, updated_at)

-- Product Analytics
product_analytics (id, product_id, marketplace_id, date, orders_count, quantity_sold, quantity_returned, revenue, cost, profit, created_at)
```

## ✅ Xulosa va Tavsiyalar

### 1. Hozirgi Holat
- ✅ Ikkala backend ham to'g'ridan-to'g'ri database bilan ishlaydi
- ✅ Bir xil database'dan foydalanadi
- ❌ Migration'lar ikki joyda
- ❌ Product CRUD Amazing Store'da (noto'g'ri)

### 2. Tavsiya Etilgan Yondashuv
- ✅ Database schema markazlashtirilgan (`database/migrations/`)
- ✅ Product CRUD Seller App'da
- ✅ Amazing Store faqat client-facing API
- ✅ Migration runner markazlashtirilgan

### 3. Keyingi Qadamlar
1. **Database folder yaratish** va migration'lar ni ko'chirish
2. **Migration runner yaratish**
3. **Amazing Store'dan product POST/PUT/DELETE ni olib tashlash**
4. **Backend'lar ni refactor qilish**

## 🎯 Real Loyihalarda Qo'llanilishi

### Monorepo Pattern
- ✅ Bitta repository
- ✅ Bir xil database
- ✅ Markazlashtirilgan migration'lar
- ✅ Har bir backend mustaqil

### Microservices Pattern (Agar kerak bo'lsa)
- Har bir service o'z database'iga ega
- API Gateway orqali ulashadi
- Bizning holatda kerak emas (monorepo yaxshiroq)

### Shared Database Pattern (Hozirgi holat)
- ✅ Bir xil database
- ✅ Har bir backend to'g'ridan-to'g'ri ulashadi
- ✅ Migration'lar markazlashtirilgan bo'lishi kerak

