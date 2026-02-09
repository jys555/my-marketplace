// Manual migration runner
// Usage: node scripts/run-migration.js

require('dotenv').config();
const { runMigrations } = require('../utils/migrate');
const logger = require('../utils/logger');

async function main() {
    try {
        logger.info('🔄 Starting manual migration run...');
        const result = await runMigrations();
        logger.info('✅ Migrations completed:', result);
        process.exit(0);
    } catch (error) {
        logger.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

main();
