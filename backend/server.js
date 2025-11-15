// backend/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();
const pool = require('./db'); // O'zgartirilgan db.js ni import qilamiz

const app = express();

// === Security Middlewares ===
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'", 'https:', 'http:'],
    scriptSrc: ["'self'", 'https://telegram.org'],
    imgSrc: ["'self'", 'data:', 'https:'],
    styleSrc: ["'self'", "'unsafe-inline'"],
    connectSrc: ["'self'", 'https:', 'http:', 'https://*.vercel.app', 'https://my-marketplace-production.up.railway.app'],
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
    if (!origin) return callback(null, true);
    if (whitelist.indexOf(origin) !== -1 || /\.vercel\.app$/.test(origin)) {
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

// === Routes ===
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');

// --- Health Check Route for Railway ---

app.get('/', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Backend is alive!' });
});
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Backend is running!' });
});

// --- Public Routes ---
app.use('/api/products', productRoutes); 

// --- User-specific Routes ---
app.use('/api/users', authenticate, userRoutes);
app.use('/api/orders', authenticate, orderRoutes);

// --- Admin-only Routes ---
app.get('/api/auth/check-admin', authenticate, isAdmin, (req, res) => {
    res.status(200).json({ isAdmin: true });
});

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

// === Database and Server Initialization ===
const createTables = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY, telegram_id BIGINT UNIQUE NOT NULL, first_name VARCHAR(100),
        last_name VARCHAR(100), username VARCHAR(100), phone VARCHAR(20), created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY, name_uz VARCHAR(255) NOT NULL, name_ru VARCHAR(255) NOT NULL,
        description_uz TEXT, description_ru TEXT, price DECIMAL(10, 2) NOT NULL, sale_price DECIMAL(10, 2),
        image_url TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY, order_number VARCHAR(20) UNIQUE NOT NULL, user_id BIGINT REFERENCES users(telegram_id),
        status VARCHAR(50) DEFAULT 'yig''ilmoqda', payment_method VARCHAR(50), delivery_method VARCHAR(50),
        total_amount DECIMAL(10, 2) NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY, order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id), quantity INTEGER NOT NULL, price DECIMAL(10, 2) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    `);
    await client.query('COMMIT');
    console.log('✅ Jadvallar muvaffaqiyatli tekshirildi/yaratildi.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Jadval yaratishda xatolik:', err);
    throw err; // Xatolikni yuqoriga uzatamiz
  } finally {
    client.release();
  }
};

const startServer = async () => {
  try {
    // 1. DB ga ulanishni tekshiramiz
    const client = await pool.connect();
    console.log('✅ PostgreSQL muvaffaqiyatli ulandi!');
    client.release();

    // 2. Jadvallarni yaratamiz
    await createTables();
    
    // 3. Serverni ishga tushiramiz
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
      console.log(`🚀 Server ishga tushdi. Port: ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Serverni ishga tushirishda jiddiy xatolik:", err.message);
    process.exit(1);
  }
};

startServer();