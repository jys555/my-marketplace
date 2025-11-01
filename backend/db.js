// backend/db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ PostgreSQL ga ulanishda xatolik:', err.stack);
  } else {
    console.log('✅ PostgreSQL muvaffaqiyatli ulandi!');
  }
});

module.exports = pool;