// backend/utils/initDb.js
const { runMigrations } = require('./migrate');

async function initializeDatabase() {
    console.log('🔄 Seller App Database initialization started...');

    try {
        // Markazlashtirilgan migration'lar ni bajarish
        await runMigrations();

        console.log('✅ Seller App Database initialization completed successfully!');
        return true;
    } catch (error) {
        console.error('❌ Seller App Database initialization failed:', error);
        throw error;
    }
}

module.exports = { initializeDatabase };
