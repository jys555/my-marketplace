// backend/db.js
const { Pool } = require('pg');
const logger = require('./utils/logger');

// DATABASE_URL tekshirish
if (!process.env.DATABASE_URL) {
    logger.error('❌ DATABASE_URL environment variable is not set!');
    throw new Error('DATABASE_URL environment variable is required');
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
    max: parseInt(process.env.PGPOOL_MAX || '15', 10),
    idleTimeoutMillis: 30000,
});

// Connection error handling
pool.on('error', (err, client) => {
    logger.error('❌ Unexpected error on idle client', err);
    process.exit(-1);
});

// Test connection on startup
pool.query('SELECT NOW()')
    .then(() => {
        logger.info('✅ Database connection established successfully');
    })
    .catch((err) => {
        logger.error('❌ Database connection failed:', err);
        logger.error('❌ DATABASE_URL:', process.env.DATABASE_URL ? 'Set (hidden)' : 'NOT SET');
    });

module.exports = pool;
