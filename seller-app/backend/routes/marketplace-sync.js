// backend/routes/marketplace-sync.js
// Marketplace sync endpoint'lari

const express = require('express');
const pool = require('../db');
const router = express.Router();
const marketplaceSync = require('../services/marketplace-sync');
const logger = require('../utils/logger');

/**
 * POST /api/seller/marketplace-sync/:productId
 * Bitta tovarni sync qilish
 */
router.post('/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const { marketplace_type } = req.body; // 'yandex' yoki 'uzum'

        if (!marketplace_type || !['yandex', 'uzum'].includes(marketplace_type)) {
            return res.status(400).json({ error: 'marketplace_type majburiy va "yandex" yoki "uzum" bo\'lishi kerak' });
        }

        logger.info(`🔄 Manual sync requested for product ${productId}, marketplace: ${marketplace_type}`);

        let result;
        if (marketplace_type === 'yandex') {
            result = await marketplaceSync.syncYandexProduct(parseInt(productId));
        } else if (marketplace_type === 'uzum') {
            result = await marketplaceSync.syncUzumProduct(parseInt(productId));
        }

        if (!result) {
            return res.status(404).json({ error: 'Marketplace integration not found or incomplete' });
        }

        res.json({
            success: true,
            message: `Product synced successfully for ${marketplace_type}`,
            data: result
        });
    } catch (error) {
        logger.error('Error syncing marketplace product:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

/**
 * POST /api/seller/marketplace-sync/all
 * Barcha tovarlarni sync qilish
 */
router.post('/all', async (req, res) => {
    try {
        const { marketplace_type } = req.body; // 'yandex' yoki 'uzum'

        if (!marketplace_type || !['yandex', 'uzum'].includes(marketplace_type)) {
            return res.status(400).json({ error: 'marketplace_type majburiy va "yandex" yoki "uzum" bo\'lishi kerak' });
        }

        logger.info(`🔄 Manual sync all products requested for marketplace: ${marketplace_type}`);

        // Barcha integratsiya qilingan tovarlarni olish
        const { rows: integrations } = await pool.query(
            `SELECT DISTINCT product_id 
             FROM product_marketplace_integrations 
             WHERE marketplace_type = $1 
             AND api_token IS NOT NULL 
             AND marketplace_product_id IS NOT NULL`,
            [marketplace_type]
        );

        logger.info(`📦 Found ${integrations.length} products to sync for ${marketplace_type}`);

        const results = {
            total: integrations.length,
            success: 0,
            failed: 0,
            errors: []
        };

        // Har bir tovarni sync qilish
        for (const integration of integrations) {
            try {
                if (marketplace_type === 'yandex') {
                    await marketplaceSync.syncYandexProduct(integration.product_id);
                } else if (marketplace_type === 'uzum') {
                    await marketplaceSync.syncUzumProduct(integration.product_id);
                }
                results.success++;
            } catch (error) {
                results.failed++;
                results.errors.push({
                    product_id: integration.product_id,
                    error: error.message
                });
                logger.error(`❌ Error syncing product ${integration.product_id}:`, error);
            }
        }

        res.json({
            success: true,
            message: `Synced ${results.success} products, ${results.failed} failed`,
            results
        });
    } catch (error) {
        logger.error('Error syncing all marketplace products:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

module.exports = router;
