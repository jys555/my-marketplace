// backend/utils/initSellerAppDb.js
const pool = require('../db');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

async function initializeSellerAppDatabase() {
    logger.info('🔄 Seller App Database initialization started...');

    try {
        // Seller App migration faylini o'qish va bajarish
        const migrationPath = path.join(__dirname, '../migrations/002_seller_app_tables.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Migration'ni bajarish
        await pool.query(migrationSQL);

        logger.info('✅ Seller App tables created/verified');
        logger.info('🎉 Seller App Database initialization completed successfully!');
        return true;
    } catch (error) {
        logger.error('❌ Seller App Database initialization failed:', error);
        throw error;
    }
}

module.exports = { initializeSellerAppDatabase };
