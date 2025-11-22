const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const TelegramBot = require('node-telegram-bot-api');

require('dotenv').config();
const pool = require('./db');
const { authenticate, isAdmin } = require('./middleware/auth');

const app = express();

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TELEGRAM_TOKEN) {
    console.error('CRITICAL: TELEGRAM_TOKEN not found. Exiting.');
    process.exit(1);
}
const bot = new TelegramBot(TELEGRAM_TOKEN);

app.use((req, res, next) => {
    req.bot = bot;
    next();
});

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
    if (whitelist.indexOf(origin) !== -1 || /\\.vercel\\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '512kb' }));

const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');

app.get('/', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Backend is alive!' });
});

// YAGILANGAN MARSHRUT
app.post('/api/auth/validate', authenticate, async (req, res) => {
    try {
        const { id } = req.telegramUser;
        const result = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [id]);

        if (result.rows.length > 0) {
            // Foydalanuvchi topildi, to'liq ma'lumotlarni qaytaramiz
            res.status(200).json(result.rows[0]);
        } else {
            // Foydalanuvchi bazada yo'q, 404 qaytaramiz
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error during user validation:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.use('/api/products', productRoutes);
app.use('/api/users', authenticate, userRoutes);
app.use('/api/orders', authenticate, orderRoutes);

app.get('/api/auth/check-admin', authenticate, isAdmin, (req, res) => {
    res.status(200).json({ isAdmin: true });
});

app.get('/api/banners', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM banners WHERE is_active = true ORDER BY sort_order ASC');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching banners:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


const createTables = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT UNIQUE NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        username VARCHAR(100),
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT NOW(),
        cart JSONB DEFAULT '[]',
        favorites JSONB DEFAULT '[]',
        is_admin BOOLEAN DEFAULT false
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

    await client.query('COMMIT');
    console.log('✅ Tables successfully checked/created.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating tables:', err);
    throw err;
  } finally {
    client.release();
  }
};

const startServer = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected successfully!');
    client.release();

    await createTables();

    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
      console.log(`🚀 Server started. Port: ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Critical error starting server:", err.message);
    process.exit(1);
  }
};

startServer();