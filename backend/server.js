// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Pool } = require('pg'); // pg ni shu yerda import qiling

const app = express();

app.use(helmet());
app.use(cors({
  origin: ['https://web.telegram.org', 'https://t.me', 'http://localhost:3000', 'https://my-marketplace-frontend.vercel.app/']
}));
app.use(express.json());

// === PostgreSQL ulanish ===
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// === Jadval yaratish funksiyasi ===
async function createTables() {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      telegram_id BIGINT UNIQUE NOT NULL,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      phone VARCHAR(20),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;
  try {
    await pool.query(createUsersTable);
    console.log('✅ Jadval(lar) tayyor.');
  } catch (err) {
    console.error('❌ Jadval yaratishda xatolik:', err);
  }
}

// === Routes ===
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running!' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server ishga tushdi: http://localhost:${PORT}`);
  // Jadvalni server ishga tushgandan keyin yaratish
  createTables();
});

// === PostgreSQL ulanishni tekshirish ===
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ PostgreSQL ga ulanishda xatolik:', err.stack);
  } else {
    console.log('✅ PostgreSQL muvaffaqiyatli ulandi!');
  }
});