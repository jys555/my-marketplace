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

// CORS uchun ruxsat etilgan manbalar ro'yxati
const whitelist = [
  'https://web.telegram.org',
  'https://t.me',
  'http://localhost:3000',
  'https://my-marketplace-frontend.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
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
        console.error('CRITICAL: ADMIN_TELEGRAM_ID is not configured on the server.');
        return res.status(500).json({ error: 'Admin ID not configured on server.' });
    }
    if (req.telegramId !== adminId) {
        console.warn(`Forbidden access attempt by Telegram ID: ${req.telegramId}`);
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

// --- Public Routes ---\
// Mahsulotlarni ko'rish uchun autentifikatsiya kerak emas
app.use('/api/products', productRoutes); 
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running!' });
});

// --- User-specific Routes (Autentifikatsiya talab qilinadi) ---
app.use('/api/users', authenticate, userRoutes);
app.use('/api/orders', authenticate, orderRoutes);

// --- Admin-only Routes (Admin huquqi talab qilinadi) ---

// 1. Admin statusini tekshirish uchun maxsus route (TO'G'RILANDI)
app.get('/api/auth/check-admin', authenticate, isAdmin, (req, res) => {
    // Agar `isAdmin` middleware'dan o'tsa, demak foydalanuvchi admin
    res.status(200).json({ isAdmin: true });
});

// 2. Mahsulot qo'shish, o'zgartirish, o'chirish uchun route'lar
// Bu route'lar endi `productRoutes` ichida bo'lishi va ularga alohida `isAdmin` qo'yilishi kerak.
// Hozircha, mahsulot qo'shishni to'g'ridan-to'g'ri shu yerga qo'shamiz.
app.post('/api/products', authenticate, isAdmin, async (req, res) => {
    const { name_uz, name_ru, description_uz, description_ru, price, sale_price, image_url } = req.body;
    try {
        const newProduct = await pool.query(
            `INSERT INTO products (name_uz, name_ru, description_uz, description_ru, price, sale_price, image_url) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [name_uz, name_ru, description_uz, description_ru, price, sale_price, image_url]
        );
        res.status(201).json(newProduct.rows[0]);
    } catch (err) {
        console.error('Error adding product:', err);
        res.status(500).json({ error: 'Server error while adding product.' });
    }
});


// === JADVALLARNI YARATISH FUNKSIYASI ===
const createTables = async () => {
  try {
    // Bu funksiya endi alohida.
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
    // Xatolik bo'lsa, serverni to'xtatishimiz kerak, aks holda u notog'ri ishlashi mumkin
    process.exit(1);
  }
};

// === SERVERNI ISHGA TUSHIRISH ===
const startServer = async () => {
  try {
    // 1. Avval jadvallarni yaratamiz
    await createTables();
    
    // 2. Jadvallar tayyor bo'lgach, serverni ishga tushiramiz
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
      console.log(`🚀 Server ishga tushdi. Port: ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Serverni ishga tushirishda jiddiy xatolik:", err);
    process.exit(1);
  }
};

// Serverni ishga tushirish
startServer();