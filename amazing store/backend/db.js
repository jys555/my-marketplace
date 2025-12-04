// backend/db.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: parseInt(process.env.PGPOOL_MAX || '15', 10),
  idleTimeoutMillis: 30000
});

module.exports = pool;