// backend/utils/initDb.js
const { runMigrations } = require('./migrate');
const logger = require('./logger');

async function initializeDatabase() {
    logger.info('🔄 Amazing Store Database initialization started...');

    try {
        // Markazlashtirilgan migration'lar ni bajarish
        await runMigrations();
        logger.info('✅ Database migrations completed');
        logger.info('🎉 Amazing Store Database initialization completed successfully!');
        return true;
    } catch (error) {
        logger.error('❌ Database initialization failed:', error);
        throw error;
    }
}

module.exports = { initializeDatabase };
