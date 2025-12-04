// backend/utils/initDb.js
const pool = require('../db');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
    console.log('🔄 Seller App Database initialization started...');
    
    try {
        // Migration faylini o'qish va bajarish
        const migrationPath = path.join(__dirname, '../migrations/001_initial_schema.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Migration'ni bajarish
        await pool.query(migrationSQL);
        
        console.log('✅ Seller App tables created/verified');
        console.log('🎉 Seller App Database initialization completed successfully!');
        return true;
        
    } catch (error) {
        console.error('❌ Seller App Database initialization failed:', error);
        throw error;
    }
}

module.exports = { initializeDatabase };

