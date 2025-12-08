// backend/utils/initDb.js
const { runMigrations } = require('./migrate');

async function initializeDatabase() {
    console.log('🔄 Amazing Store Database initialization started...');
    
    try {
        // Markazlashtirilgan migration'lar ni bajarish
        await runMigrations();
        console.log('✅ Database migrations completed');
        console.log('🎉 Amazing Store Database initialization completed successfully!');
        return true;
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    }
}

module.exports = { initializeDatabase };
