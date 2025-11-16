// backend/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();
const pool = require('./db');
const crypto = require('crypto'); // Xavfsiz tekshiruv uchun qo'shildi

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

// QO'SHILDI: Yangi, xavfsiz 'validateTelegramAuth' funksiyasi
const validateTelegramAuth = (req, res, next) => {
    const initData = req.body.initData || req.headers['x-telegram-data'];

    if (!initData) {
        return res.status(401).json({ error: 'Authentication data not provided.' });
    }

    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');

    const dataCheckString = Array.from(urlParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(process.env.TELEGRAM_BOT_TOKEN).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (calculatedHash === hash) {
        const user = JSON.parse(urlParams.get('user'));
        req.telegramUser = user; // Foydalanuvchi ma'lumotlarini so'rovga xavfsiz tarzda qo'shamiz
        next();
    } else {
        return res.status(403).json({ error: 'Invalid authentication data.' });
    }
};


const isAdmin = (req, res, next) => {
    // O'ZGARTIRILDI: ADMIN_TELEGRAM_IDS o'rniga asl kodagi ADMIN_TELEGRAM_ID ishlatildi
    const adminId = process.env.ADMIN_TELEGRAM_ID;
    if (!adminId) {
        console.error('CRITICAL: ADMIN_TELEGRAM_ID is not configured on the server.');
        return res.status(500).json({ error: 'Admin ID not configured on server.' });
    }
    // O'ZGARTIRILDI: Xavfli req.telegramId o'rniga xavfsiz req.telegramUser.id ishlatildi
    if (req.telegramUser.id.toString() !== adminId) {
        console.warn(`Forbidden access attempt by Telegram ID: ${req.telegramUser.id}`);
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

/* QO'SHILDI: Bannerlar ro'yxatini qaytaruvchi yangi ochiq endpoint */
app.get('/api/banners', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, image_url, link_url, title FROM banners WHERE is_active = true ORDER BY sort_order ASC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching banners:', err);
        res.status(500).json({ error: 'Server error while fetching banners.' });
    }
});

// QO'SHILDI: Frontend uchun autentifikatsiyani tekshirish yo'nalishi
app.post('/api/auth/validate', validateTelegramAuth, (req, res) => {
    res.json({ message: 'Authentication successful', user: req.telegramUser });
});

// --- Public Routes ---
app.use('/api/products', productRoutes); 

// --- User-specific Routes ---
// O'ZGARTIRILDI: 'authenticate' o'rniga 'validateTelegramAuth' ishlatildi
app.use('/api/users', validateTelegramAuth, userRoutes);
app.use('/api/orders', validateTelegramAuth, orderRoutes);

// --- Admin-only Routes ---
// O'ZGARTIRILDI: 'authenticate' o'rniga 'validateTelegramAuth' ishlatildi
app.get('/api/auth/check-admin', validateTelegramAuth, isAdmin, (req, res) => {
    res.status(200).json({ isAdmin: true });
});

// O'ZGARTIRILDI: 'authenticate' o'rniga 'validateTelegramAuth' ishlatildi
app.post('/api/products', validateTelegramAuth, isAdmin, async (req, res) => {
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
// BU QISM O'ZGARTIRILDI: Banners jadvalini yaratish logikasi qo'shildi
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
      CREATE TABLE IF NOT EXISTS banners (
                id SERIAL PRIMARY KEY,
                image_url VARCHAR(255) NOT NULL,
                link_url VARCHAR(255),
                title VARCHAR(100),
                is_active BOOLEAN DEFAULT true,
                sort_order INT DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

      CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    `);

    /* QO'SHILDI: Jadval bo'sh bo'lsa, boshlang'ich bannerlarni qo'shish */
    const res = await client.query('SELECT COUNT(*) FROM banners');
    if (res.rows[0].count === '0') {
        await client.query(`
            INSERT INTO banners (image_url, title, sort_order, is_active) VALUES
            ('https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=2070&auto=format&fit=crop', 'Yangi kolleksiya keldi!', 1, true),
            ('https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop', 'Mavsumiy chegirmalarga ulguring!', 2, true),
            ('https://images.unsplash.com/photo-1567588336364-a6b73995471b?q=80&w=2070&auto=format=fit=crop', 'Yetkazib berish mutlaqo bepul!', 3, true)
        `);
    }

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

// BU QISM O'ZGARTIRILMADI
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