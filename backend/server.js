// backend/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'", 'https:', 'http:'],
    scriptSrc: ["'self'", 'https://telegram.org', 'https:'],
    imgSrc: ["'self'", 'data:', 'https:'],
    styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
    connectSrc: ["'self'", 'https:'],
    frameAncestors: ["'self'", 'https://*.telegram.org', 'https://web.telegram.org', 'https://t.me']
  }
}));

const whitelist = [
  'https://web.telegram.org',
  'https://t.me',
  'http://localhost:3000',
  'https://my-marketplace-frontend.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow all vercel app origins
    if (/\.vercel\.app$/.test(origin)) {
        return callback(null, true);
    }
    
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '512kb' }));

// === Admin Middleware ===
const ADMIN_TELEGRAM_IDS = (process.env.ADMIN_TELEGRAM_IDS || '').split(',').map(id => parseInt(id.trim(), 10));

const isAdmin = (req, res, next) => {
    const telegramId = req.header('X-Telegram-ID'); // Yoki so'rovdan ID ni olishning boshqa usuli
    if (telegramId && ADMIN_TELEGRAM_IDS.includes(parseInt(telegramId, 10))) {
        return next();
    }
    res.status(403).json({ error: 'Forbidden: Admin access required' });
};

// === PostgreSQL ulanish (db.js dan import qiling) ===
const pool = require('./db');

// === Routes ===
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');

app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// === Migratsiya endpointi (bir marta ishlatish uchun) ===
app.get('/migrate-products', isAdmin, async (req, res) => {
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

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running!' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server ishga tushdi. Port: ${PORT}`);
  
  const createTables = async () => {
    try {
      // 1. users jadvali
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

      // 2. products jadvali (yangilangan)
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

      // 3. orders jadvali
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

      // 4. order_items jadvali
      await pool.query(`
        CREATE TABLE IF NOT EXISTS order_items (
          id SERIAL PRIMARY KEY,
          order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
          product_id INTEGER REFERENCES products(id),
          quantity INTEGER NOT NULL,
          price DECIMAL(10, 2) NOT NULL
        );
      `);

      // 5. indekslar
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
      `);

      console.log('✅ Jadval(lar) tayyor.');
    } catch (err) {
      console.error('❌ Jadval yaratishda xatolik:', err);
    }
  };

  createTables();
});