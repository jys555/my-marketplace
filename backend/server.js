// backend/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

// === Security Middlewares ===
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'", 'https:', 'http:'],
    scriptSrc: ["'self'", 'https://telegram.org'],
    imgSrc: ["'self'", 'data:', 'https:'],
    styleSrc: ["'self'", "'unsafe-inline'"],
    connectSrc: ["'self'", 'https:', 'http:', 'https://*.vercel.app'],
    frameAncestors: ["'self'", 'https://*.telegram.org', 'https://web.telegram.org', 'https://t.me']
  }
}));

// CORS uchun ruxsat etilgan manbalar ro'yxati (TUZATILDI)
const whitelist = [
  'https://web.telegram.org',
  'https://t.me',
  'http://localhost:3000',
  'https://my-marketplace-frontend.vercel.app' // SIZNING FRONTEND MANZILINGIZ QAYTARILDI
];

app.use(cors({
  origin: function (origin, callback) {
    // `origin` yo'q bo'lsa (masalan, server-to-server, Postman so'rovlari) ruxsat berish
    if (!origin) return callback(null, true);

    // Agar so'rov manbai `whitelist`da yoki Vercel domeni bo'lsa, ruxsat berish
    if (whitelist.indexOf(origin) !== -1 || /\\.vercel\\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '512kb' }));

// === Authentication and Authorization Middlewares ===

const authenticate = (req, res, next) => {
    const telegramId = req.headers['x-telegram-id'];
    if (!telegramId) {
        return res.status(401).json({ error: 'Unauthorized: X-Telegram-ID header is missing.' });
    }
    req.telegramId = telegramId;
    next();
};

const isAdmin = (req, res, next) => {
    const adminId = process.env.ADMIN_TELEGRAM_ID;
    if (!adminId) {
        return res.status(500).json({ error: 'Admin ID not configured on server.' });
    }
    if (req.telegramId !== adminId) {
        return res.status(403).json({ error: 'Forbidden: Admin access required.' });
    }
    next();
};

// === PostgreSQL ulanish ===
const pool = require('./db');

// === Routes ===
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');

// --- Public Routes ---
app.use('/api/products', productRoutes); 
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running!' });
});

// --- User-specific Routes ---
app.use('/api/users', authenticate, userRoutes);
app.use('/api/orders', authenticate, orderRoutes);

// --- Admin-only Routes ---
// Bu yerda admin uchun mo'ljallangan barcha route'larni bitta joyga jamlaymiz
const adminRouter = express.Router();
// Kelajakda admin route'larini alohida fayllarga bo'lish mumkin
adminRouter.get('/auth/check-admin', (req, res) => {
    res.status(200).json({ isAdmin: true });
});
adminRouter.get('/migrate-products', async (req, res) => {
    try {
        await pool.query(`
          ALTER TABLE products
          ADD COLUMN IF NOT EXISTS name_uz VARCHAR(255),
          ADD COLUMN IF NOT EXISTS name_ru VARCHAR(255),
          ADD COLUMN IF NOT EXISTS description_uz TEXT,
          ADD COLUMN IF NOT EXISTS description_ru TEXT;
        `);
        res.json({ message: '✅ products jadvali ko\'p tilli qilindi' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Migratsiya xatosi' });
    }
});
// Boshqa admin route'lari (mahsulot qo'shish/o'chirish/tahrirlash) productRoutes ichida bo'lishi mumkin,
// lekin ularni ham shu yerga yig'ish mumkin. Hozircha `productRoutes` ichida qoldiramiz.

app.use('/api/admin', authenticate, isAdmin, adminRouter);


// === Serverni ishga tushirish va JADVALLARNI YARATISH ===
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server ishga tushdi. Port: ${PORT}`);
  
  const createTables = async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          telegram_id BIGINT UNIQUE NOT NULL,
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          username VARCHAR(100),
          phone VARCHAR(20),
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          name_uz VARCHAR(255) NOT NULL,
          name_ru VARCHAR(255) NOT NULL,
          description_uz TEXT,
          description_ru TEXT,
          price DECIMAL(10, 2) NOT NULL,
          sale_price DECIMAL(10, 2),
          image_url TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          order_number VARCHAR(20) UNIQUE NOT NULL,
          user_id BIGINT REFERENCES users(telegram_id),
          status VARCHAR(50) DEFAULT 'yig''ilmoqda',
          payment_method VARCHAR(50),
          delivery_method VARCHAR(50),
          total_amount DECIMAL(10, 2) NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS order_items (
          id SERIAL PRIMARY KEY,
          order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
          product_id INTEGER REFERENCES products(id),
          quantity INTEGER NOT NULL,
          price DECIMAL(10, 2) NOT NULL
        );
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
      `);
      console.log('✅ Jadval(lar) muvaffaqiyatli tekshirildi/yaratildi.');
    } catch (err) {
      console.error('❌ Jadval yaratishda xatolik:', err);
    }
  };

  createTables();
});