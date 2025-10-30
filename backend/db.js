// backend/db.js
const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL ulanish parametrlari
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Ulashni tekshirish
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ PostgreSQL ga ulanishda xatolik:', err.stack);
  } else {
    console.log('✅ PostgreSQL muvaffaqiyatli ulandi!');
    console.log('⏰ Joriy vaqt:', res.rows[0].now);
  }
});

module.exports = pool;