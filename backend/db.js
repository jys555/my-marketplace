// backend/db.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: parseInt(process.env.PGPOOL_MAX || '10', 10),
  idleTimeoutMillis: 30000
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