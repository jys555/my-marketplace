// backend/db.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Railway PostgreSQL SSL talab qiladi
  }
});

// Ulanishni tekshirish
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ PostgreSQL ga ulanishda xatolik:', err.stack);
  } else {
    console.log('✅ PostgreSQL muvaffaqiyatli ulandi!');
    console.log('⏰ Joriy vaqt:', res.rows[0].now);
  }
});

module.exports = pool;