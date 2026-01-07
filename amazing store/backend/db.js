// backend/db.js
const { Pool } = require('pg');

// DATABASE_URL tekshirish
if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set!');
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
    console.error('❌ Unexpected error on idle client', err);
    process.exit(-1);
});

// Test connection on startup - moved to server.js to avoid circular dependency
// This will be called after logger is initialized

module.exports = pool;
