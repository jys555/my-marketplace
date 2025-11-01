// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

app.use(helmet());
app.use(cors({
  origin: ['https://web.telegram.org', 'https://t.me', 'http://localhost:3000']
}));
app.use(express.json());

// routes
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running!' });
});

const PORT = process.env.PORT || 5000;

// Jadvalni avtomatik yaratish
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

// Server ishga tushganda jadvallarni yaratish
createTables();

app.listen(PORT, () => {
  console.log(`🚀 Server ishga tushdi: http://localhost:${PORT}`);
});

// PostgreSQL ulanishini yoqish
const pool = require('./db');