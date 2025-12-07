# Seller App - Keyingi Bosqich Rejasi

## Hozirgi Holat

### ✅ Tayyor:
1. **Dashboard (index.html)** - To'liq tayyor
   - Chart.js diagramma
   - Monthly stats cards
   - Marketplace selector
   - Mobile navigation
   - Back button
   - Tooltip funksiyalari
   - PWA sozlamalari

2. **Frontend Infrastructure:**
   - `api.js` - API request funksiyalari
   - `app.js` - Dashboard logikasi
   - `ui.js` - UI helper funksiyalar
   - `style.css` - Responsive design
   - `manifest.json` - PWA sozlamalari
   - `service-worker.js` - Offline support

3. **Backend Infrastructure:**
   - `server.js` - Express server
   - `db.js` - Database connection
   - `middleware/auth.js` - Authentication
   - `utils/initDb.js` - Database initialization (bo'sh)

### ❌ Hali Yaratilmagan:

1. **Database Schema:**
   - `marketplaces` - Marketplace ma'lumotlari
   - `marketplace_products` - Marketplace tovarlari integratsiyasi
   - `product_prices` - Tovarlar narxlari
   - `purchases` - Omborga kirimlar
   - `inventory` - Ombor qoldiqlari
   - `daily_analytics` - Kunlik analitika

2. **Backend API Routes:**
   - `/api/seller/marketplaces` - Marketplace CRUD
   - `/api/seller/products` - Tovarlar (Amazing Store)
   - `/api/seller/prices` - Narxlar boshqaruvi
   - `/api/seller/purchases` - Omborga kirimlar
   - `/api/seller/inventory` - Ombor boshqaruvi
   - `/api/seller/orders` - Buyurtmalar
   - `/api/seller/analytics` - Analitika

3. **Frontend Sahifalar:**
   - `prices.html` - Narxlar sahifasi
   - `orders.html` - Buyurtmalar sahifasi
   - `inventory.html` - Ombor sahifasi
   - `inventory-purchase.html` - Omborga kirim sahifasi

4. **Services:**
   - Marketplace integratsiyasi (Uzum, Yandex Market API)
   - Inventory management
   - Analytics calculation

## Keyingi Bosqich - Taklif

### Variant 1: Database Schema va Backend API (Tavsiya) ⭐
**Nima qilish kerak:**
1. Database schema yaratish (`initDb.js`)
2. Backend API routes yaratish
3. Services yaratish (integrations, inventory, analytics)

**Afzalliklari:**
- Backend to'liq tayyor bo'ladi
- Frontend API'larni chaqirish mumkin
- Test qilish oson

### Variant 2: Frontend Sahifalar
**Nima qilish kerak:**
1. `prices.html` yaratish
2. `orders.html` yaratish
3. `inventory.html` yaratish
4. Mock data bilan ishlash

**Afzalliklari:**
- UI/UX tez ko'rinadi
- Mock data bilan test qilish mumkin

### Variant 3: Database Schema
**Nima qilish kerak:**
1. `initDb.js` da barcha jadvallarni yaratish
2. Migration fayllar yaratish
3. Test qilish

**Afzalliklari:**
- Database struktura to'liq
- Keyin API yozish oson

## Tavsiya: Variant 1 (Database Schema + Backend API)

**Sabab:**
1. Backend to'liq tayyor bo'ladi
2. Frontend API'larni chaqirish mumkin
3. Test qilish oson
4. Keyin frontend sahifalar yozish oson

**Qadamlar:**
1. Database schema yaratish
2. Backend API routes yaratish
3. Services yaratish
4. Frontend sahifalar yaratish

## Database Schema Rejasi

### 1. `marketplaces` jadvali
```sql
CREATE TABLE marketplaces (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) UNIQUE,
    type VARCHAR(50) NOT NULL, -- 'amazing_store', 'uzum', 'yandex', 'manual'
    api_config JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. `marketplace_products` jadvali
```sql
CREATE TABLE marketplace_products (
    id SERIAL PRIMARY KEY,
    marketplace_id INTEGER REFERENCES marketplaces(id),
    product_id INTEGER REFERENCES products(id), -- Amazing Store product
    marketplace_product_id VARCHAR(255), -- Marketplace'dagi product ID
    marketplace_product_data JSONB, -- Marketplace'dan olingan ma'lumotlar
    is_linked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3. `product_prices` jadvali
```sql
CREATE TABLE product_prices (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    marketplace_id INTEGER REFERENCES marketplaces(id),
    cost_price DECIMAL(10,2), -- Tannarx
    selling_price DECIMAL(10,2), -- Sotish narxi
    commission DECIMAL(10,2), -- Komissiya
    profitability DECIMAL(10,2), -- Rentabillik
    drawn_price DECIMAL(10,2), -- Chizilgan narx
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 4. `purchases` jadvali
```sql
CREATE TABLE purchases (
    id SERIAL PRIMARY KEY,
    purchase_number VARCHAR(100) UNIQUE,
    purchase_date DATE NOT NULL,
    total_amount DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 5. `purchase_items` jadvali
```sql
CREATE TABLE purchase_items (
    id SERIAL PRIMARY KEY,
    purchase_id INTEGER REFERENCES purchases(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 6. `inventory` jadvali
```sql
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    marketplace_id INTEGER REFERENCES marketplaces(id),
    quantity INTEGER DEFAULT 0, -- Qoldiq
    reserved_quantity INTEGER DEFAULT 0, -- Rezerv qilingan
    last_updated TIMESTAMP DEFAULT NOW(),
    UNIQUE(product_id, marketplace_id)
);
```

### 7. `daily_analytics` jadvali
```sql
CREATE TABLE daily_analytics (
    id SERIAL PRIMARY KEY,
    marketplace_id INTEGER REFERENCES marketplaces(id),
    date DATE NOT NULL,
    orders_count INTEGER DEFAULT 0,
    orders_sum DECIMAL(10,2) DEFAULT 0,
    returned_orders_count INTEGER DEFAULT 0,
    returned_orders_sum DECIMAL(10,2) DEFAULT 0,
    net_profit DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(marketplace_id, date)
);
```

## Backend API Routes Rejasi

### 1. `/api/seller/marketplaces`
- `GET /` - Barcha marketplacelar
- `GET /:id` - Bitta marketplace
- `POST /` - Yangi marketplace
- `PUT /:id` - Marketplace yangilash
- `DELETE /:id` - Marketplace o'chirish

### 2. `/api/seller/products`
- `GET /` - Barcha tovarlar (Amazing Store)
- `GET /:id` - Bitta tovar
- `POST /` - Yangi tovar (Amazing Store)
- `PUT /:id` - Tovar yangilash
- `DELETE /:id` - Tovar o'chirish

### 3. `/api/seller/prices`
- `GET /` - Barcha narxlar
- `GET /:marketplaceId` - Marketplace bo'yicha narxlar
- `PUT /:id` - Narx yangilash
- `POST /` - Yangi narx

### 4. `/api/seller/purchases`
- `GET /` - Barcha kirimlar
- `GET /:id` - Bitta kirim
- `POST /` - Yangi kirim
- `DELETE /:id` - Kirim o'chirish

### 5. `/api/seller/inventory`
- `GET /` - Barcha ombor qoldiqlari
- `GET /:marketplaceId` - Marketplace bo'yicha qoldiqlar
- `PUT /:id` - Qoldiq yangilash
- `POST /adjust` - Qoldiqni tuzatish

### 6. `/api/seller/orders`
- `GET /` - Barcha buyurtmalar
- `GET /:marketplaceId` - Marketplace bo'yicha buyurtmalar
- `GET /:id` - Bitta buyurtma
- `PUT /:id/status` - Buyurtma statusini yangilash

### 7. `/api/seller/analytics`
- `GET /dashboard` - Dashboard ma'lumotlari
- `GET /daily` - Kunlik analitika
- `GET /monthly` - Oylik analitika
- `GET /products` - Tovar bo'yicha analitika

## Xulosa

**Tavsiya:** Database Schema + Backend API yaratishdan boshlash

**Qadamlar:**
1. Database schema yaratish (`initDb.js`)
2. Backend API routes yaratish
3. Services yaratish
4. Frontend sahifalar yaratish

**Vaqt:**
- Database schema: 1-2 soat
- Backend API: 3-4 soat
- Services: 2-3 soat
- Frontend sahifalar: 4-5 soat

**Jami:** 10-14 soat

