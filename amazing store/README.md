# 🛒 My Marketplace - Telegram Mini App

Modern onlayn do'kon Telegram Mini App sifatida ishlab chiqilgan. Foydalanuvchilar mahsulotlarni ko'rish, sevimlilariga qo'shish, savatga qo'yish va buyurtma berish imkoniyatiga ega.

## 🚀 Texnologiyalar

### Frontend
- **Vanilla JavaScript** (ES6 Modules)
- **CSS3** (Custom Properties, Flexbox, Grid, Animations)
- **Telegram Web App SDK** (autentifikatsiya, BackButton, Safe Area)
- **Vercel** (hosting)

### Backend
- **Node.js** + **Express.js**
- **PostgreSQL** (Railway)
- **JWT** autentifikatsiya (Telegram HMAC-SHA256)
- **Helmet.js** (xavfsizlik)
- **Rate Limiting** (DDoS himoyasi)

## ✨ Asosiy Funksiyalar

- ✅ **Ko'p tillilik** - O'zbek va Rus tillari
- ✅ **Mahsulotlar katalogi** - search va kategoriyalar bilan
- ✅ **Savat** - real-time yangilanish
- ✅ **Sevimlilar** - like/unlike
- ✅ **Buyurtmalar** - yaratish va ko'rish
- ✅ **Admin panel** - mahsulot qo'shish
- ✅ **Responsive dizayn** - iPhone Safe Area support
- ✅ **Real-time qidiruv** - mahsulot nomida

## 📦 O'rnatish

### Backend (Railway)

**Service Configuration:**
- Service Name: `amazing-store-backend`
- Root Directory: `amazing-store/backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Port: Railway avtomatik assign qiladi

**Connection Pool:**
- `max: 15` connection (optimallashtirilgan)
- Database: Shared PostgreSQL (Railway)
```bash
cd backend
npm install
```

**Environment Variables (Railway):**
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
TELEGRAM_BOT_TOKEN=your_bot_token
ADMIN_TELEGRAM_ID=123456789
PORT=3000
FRONTEND_URL=https://your-app.vercel.app
```

### Frontend (Vercel)
```bash
cd frontend
# Deploy qilish
vercel --prod
```

**vercel.json** faylida API proxy sozlangan:
```json
{
    "rewrites": [
        {
            "source": "/api/:path*",
            "destination": "https://my-marketplace-production.up.railway.app/api/:path*"
        }
    ]
}
```

## 🗄️ Database Schema

```sql
-- Foydalanuvchilar
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    phone VARCHAR(20),
    cart JSONB DEFAULT '{}',
    favorites INTEGER[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Mahsulotlar
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name_uz VARCHAR(255) NOT NULL,
    name_ru VARCHAR(255),
    description_uz TEXT,
    description_ru TEXT,
    price NUMERIC(10,2) NOT NULL,
    sale_price NUMERIC(10,2),
    image_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Buyurtmalar
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    order_number VARCHAR(100) UNIQUE,
    total_amount NUMERIC(10,2),
    status VARCHAR(50) DEFAULT 'new',
    payment_method VARCHAR(50),
    delivery_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Buyurtma elementlari
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price NUMERIC(10,2) NOT NULL
);

-- Bannerlar
CREATE TABLE banners (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    image_url TEXT NOT NULL,
    link_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0
);
```

## 🔐 Xavfsizlik

- ✅ **Telegram autentifikatsiya** - HMAC-SHA256 signature verification
- ✅ **Auth date validation** - 24 soatlik muddat (replay attack himoyasi)
- ✅ **SQL Injection** himoyasi - parametrli querylar
- ✅ **XSS** himoyasi - HTML escape
- ✅ **CORS** cheklash - faqat ishonchli domenlar
- ✅ **Rate limiting** - 100 request / 15 min
- ✅ **Helmet.js** - HTTP xavfsizlik headerlari

## 📱 Telegram Bot Setup

1. **BotFather** orqali bot yarating
2. Bot tokenni oling
3. **Menu button** sozlang:
   ```
   /setmenubutton
   @your_bot
   text: 🛒 Bozorga kirish
   url: https://your-app.vercel.app
   ```
4. Railway'da `TELEGRAM_BOT_TOKEN` o'rnating

## 🎨 Arxitektura

```
frontend/
├── index.html          # Asosiy HTML
├── admin.html          # Admin panel
├── main.js             # Entry point, routing, event handlers
├── api.js              # Backend API calls
├── state.js            # State management (cart, user, products)
├── ui.js               # UI rendering va translations
└── style.css           # Styling

backend/
├── server.js           # Express server
├── db.js               # PostgreSQL connection pool
├── middleware/
│   └── auth.js         # Telegram autentifikatsiya
└── routes/
    ├── users.js        # User CRUD
    ├── products.js     # Products CRUD
    ├── orders.js       # Orders CRUD
    └── banners.js      # Banners GET
```

## 🧪 Testing

```bash
# Backend
cd backend
npm test  # (hozircha testlar yo'q, kelajakda qo'shiladi)

# Frontend
cd frontend
# Manual testing Telegram bot orqali
```

## 📝 Changelog

### v1.0.0 (2024-12-01)
- ✅ Initial release
- ✅ Search funksiyasi qo'shildi
- ✅ Katalog sahifasi qo'shildi
- ✅ Error handling yaxshilandi
- ✅ Loading states qo'shildi
- ✅ Validation kuchaytirildi
- ✅ Security tuzatishlari

## 🤝 Contributing

1. Fork qiling
2. Feature branch yarating (`git checkout -b feature/AmazingFeature`)
3. Commit qiling (`git commit -m 'Add some AmazingFeature'`)
4. Push qiling (`git push origin feature/AmazingFeature`)
5. Pull Request oching

## 📄 License

MIT License - batafsil [LICENSE](LICENSE) faylida.

## 👨‍💻 Muallif

**My Marketplace Team**

## 🙏 Minnatdorchilik

- [Telegram Mini Apps](https://core.telegram.org/bots/webapps)
- [Railway](https://railway.app/)
- [Vercel](https://vercel.com/)
