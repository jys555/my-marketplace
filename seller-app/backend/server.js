require('dotenv').config();
const app = require('./app');
const { initializeDatabase } = require('./utils/initDb');
const priceService = require('./services/prices');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3001;

// Database'ni initialize qilib, keyin serverni ishga tushirish
async function startServer() {
    try {
        // Seller App database migration
        await initializeDatabase();

        // Amazing Store narxlarini sync qilish
        try {
            const syncResult = await priceService.syncAmazingStorePrices();
            logger.info(
                `✅ Amazing Store prices synced: ${syncResult.created} created, ${syncResult.updated} updated`
            );
        } catch (error) {
            logger.warn('⚠️  Warning: Could not sync Amazing Store prices:', error.message);
            // Server yaxshi ishlashi uchun xatoni e'tiborsiz qoldiramiz
        }

        // Server ishga tushirish
        const server = app.listen(PORT, () => {
            logger.info(`✅ Seller App Server is running on port ${PORT}`);
            logger.info(`📊 Frontend: http://localhost:${PORT}`);
        });

        // Export server for testing (if needed)
        module.exports.server = server;
    } catch (error) {
        logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Only start server if this file is run directly (not when required for testing)
if (require.main === module) {
    startServer();
}

module.exports = { app };
