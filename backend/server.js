// backend/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

app.use(helmet());
app.use(cors({
  origin: [
    'https://web.telegram.org',
    'https://t.me',
    'http://localhost:3000',
    'https://my-marketplace-frontend.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());

// === PostgreSQL ulanish (db.js dan import qiling) ===
const pool = require('./db');

// === Routes ===
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');

app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);

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

      // 2. products jadvali
      await pool.query(`
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL(10, 2) NOT NULL,
          sale_price DECIMAL(10, 2),
          image_url TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      console.log('✅ Jadval(lar) tayyor.');
    } catch (err) {
      console.error('❌ Jadval yaratishda xatolik:', err);
    }
  };

  createTables();
});