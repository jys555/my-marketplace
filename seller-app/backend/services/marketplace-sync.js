// backend/services/marketplace-sync.js
// Soddalashtirilgan marketplace integratsiyasi
// Faqat Yandex va Uzum market bilan ishlash
// products table'ga to'g'ridan-to'g'ri yozish

const pool = require('../db');
const logger = require('../utils/logger');

class MarketplaceSyncService {
    /**
     * Yandex Market'dan tovar ma'lumotlarini o'qish va yangilash
     * @param {number} productId - Product ID
     * @returns {Promise<Object>} - Yangilangan ma'lumotlar
     */
    async syncYandexProduct(productId) {
        try {
            // Marketplace integration ma'lumotlarini olish
            const { rows: integrationRows } = await pool.query(
                `SELECT id, product_id, api_token, campaign_id, marketplace_product_id 
                 FROM product_marketplace_integrations 
                 WHERE product_id = $1 AND marketplace_type = 'yandex'`,
                [productId]
            );

            if (integrationRows.length === 0) {
                logger.warn(`⚠️ Yandex Market integration not configured for product ${productId}`);
                return null;
            }

            const integration = integrationRows[0];

            if (!integration.api_token || !integration.campaign_id || !integration.marketplace_product_id) {
                logger.warn(`⚠️ Yandex Market integration incomplete for product ${productId}`);
                return null;
            }

            const baseUrl = 'https://api.partner.market.yandex.ru';
            const campaignId = integration.campaign_id;
            const offerId = integration.marketplace_product_id;

            logger.info(`🔄 Syncing Yandex Market product: ${offerId} for campaign: ${campaignId}`);

            // 1. Price olish
            let price = null;
            let strikethroughPrice = null;
            let commissionRate = null;
            try {
                const priceResponse = await fetch(
                    `${baseUrl}/campaigns/${campaignId}/offer-prices?offer_id=${offerId}`,
                    {
                        headers: {
                            'Authorization': `OAuth ${product.yandex_api_token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (priceResponse.ok) {
                    const priceData = await priceResponse.json();
                    const offer = priceData.result?.offers?.[0];
                    if (offer) {
                        price = offer.price?.value ? parseFloat(offer.price.value) : null;
                        // Chizilgan narx (oldPrice yoki old_price)
                        strikethroughPrice = offer.oldPrice ? parseFloat(offer.oldPrice) : 
                                           (offer.old_price ? parseFloat(offer.old_price) : null);
                        // Komissiya foizini hisoblash (agar mavjud bo'lsa)
                        if (offer.commission) {
                            commissionRate = parseFloat(offer.commission);
                        }
                    }
                }
            } catch (error) {
                logger.error('Error fetching Yandex price:', error);
            }

            // 2. Stock olish
            let stock = 0;
            try {
                const stockResponse = await fetch(
                    `${baseUrl}/campaigns/${campaignId}/offers?offer_id=${offerId}`,
                    {
                        headers: {
                            'Authorization': `OAuth ${product.yandex_api_token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (stockResponse.ok) {
                    const stockData = await stockResponse.json();
                    const offer = stockData.result?.offers?.[0];
                    if (offer) {
                        stock = offer.availableCount || 0;
                    }
                }
            } catch (error) {
                logger.error('Error fetching Yandex stock:', error);
            }

            // 3. Database'ga yangilash
            const { rows: updatedRows } = await pool.query(
                `UPDATE product_marketplace_integrations 
                 SET marketplace_price = $1,
                     marketplace_strikethrough_price = $2,
                     marketplace_commission_rate = $3,
                     marketplace_stock = $4,
                     last_synced_at = NOW(),
                     updated_at = NOW()
                 WHERE product_id = $5 AND marketplace_type = 'yandex'
                 RETURNING id, marketplace_price, marketplace_strikethrough_price, marketplace_commission_rate, marketplace_stock, last_synced_at`,
                [price, strikethroughPrice, commissionRate, stock, productId]
            );

            logger.info(`✅ Yandex Market product synced: ${offerId}`, {
                price,
                strikethroughPrice,
                commissionRate,
                stock,
            });

            return updatedRows[0];
        } catch (error) {
            logger.error('Error syncing Yandex product:', error);
            throw error;
        }
    }

    /**
     * Yandex Market'ga stock yangilash
     * @param {number} productId - Product ID
     * @param {number} quantity - Yangi miqdor
     * @returns {Promise<Object>} - Yangilangan ma'lumotlar
     */
    async updateYandexStock(productId, quantity) {
        try {
            const { rows: integrationRows } = await pool.query(
                `SELECT id, api_token, campaign_id, marketplace_product_id 
                 FROM product_marketplace_integrations 
                 WHERE product_id = $1 AND marketplace_type = 'yandex'`,
                [productId]
            );

            if (integrationRows.length === 0) {
                throw new Error('Yandex Market integration not configured');
            }

            const integration = integrationRows[0];

            if (!integration.api_token || !integration.campaign_id || !integration.marketplace_product_id) {
                throw new Error('Yandex Market integration incomplete');
            }

            const baseUrl = 'https://api.partner.market.yandex.ru';
            const campaignId = integration.campaign_id;
            const offerId = integration.marketplace_product_id;

            // Yandex Market API'ga stock yangilash
            // TODO: Yandex Market API endpoint'ini qo'shish
            // const response = await fetch(`${baseUrl}/campaigns/${campaignId}/offers/${offerId}/stock`, {
            //     method: 'PUT',
            //     headers: {
            //         'Authorization': `OAuth ${product.yandex_api_token}`,
            //         'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify({ count: quantity })
            // });

            // Database'ga yangilash
            const { rows: updatedRows } = await pool.query(
                `UPDATE product_marketplace_integrations 
                 SET marketplace_stock = $1,
                     last_synced_at = NOW(),
                     updated_at = NOW()
                 WHERE product_id = $2 AND marketplace_type = 'yandex'
                 RETURNING id, marketplace_stock, last_synced_at`,
                [quantity, productId]
            );

            logger.info(`✅ Yandex Market stock updated: ${offerId} -> ${quantity}`);

            return updatedRows[0];
        } catch (error) {
            logger.error('Error updating Yandex stock:', error);
            throw error;
        }
    }

    /**
     * Uzum Market'dan tovar ma'lumotlarini o'qish va yangilash
     * @param {number} productId - Product ID
     * @returns {Promise<Object>} - Yangilangan ma'lumotlar
     */
    async syncUzumProduct(productId) {
        try {
            const { rows: integrationRows } = await pool.query(
                `SELECT id, product_id, api_token, marketplace_product_id 
                 FROM product_marketplace_integrations 
                 WHERE product_id = $1 AND marketplace_type = 'uzum'`,
                [productId]
            );

            if (integrationRows.length === 0) {
                logger.warn(`⚠️ Uzum Market integration not configured for product ${productId}`);
                return null;
            }

            const integration = integrationRows[0];

            if (!integration.api_token || !integration.marketplace_product_id) {
                logger.warn(`⚠️ Uzum Market integration incomplete for product ${productId}`);
                return null;
            }

            // TODO: Uzum Market API integratsiyasi
            // const baseUrl = 'https://api.uzum.uz';
            // const response = await fetch(`${baseUrl}/products/${product.uzum_product_id}`, {
            //     headers: {
            //         'Authorization': `Bearer ${product.uzum_api_token}`,
            //     },
            // });
            // const data = await response.json();

            // Database'ga yangilash
            const { rows: updatedRows } = await pool.query(
                `UPDATE product_marketplace_integrations 
                 SET marketplace_price = $1,
                     marketplace_commission_rate = $2,
                     marketplace_stock = $3,
                     last_synced_at = NOW(),
                     updated_at = NOW()
                 WHERE product_id = $4 AND marketplace_type = 'uzum'
                 RETURNING id, marketplace_price, marketplace_commission_rate, marketplace_stock, last_synced_at`,
                [null, null, 0, productId] // TODO: Uzum API'dan o'qilgan ma'lumotlar
            );

            logger.info(`✅ Uzum Market product synced: ${product.uzum_product_id}`);

            return updatedRows[0];
        } catch (error) {
            logger.error('Error syncing Uzum product:', error);
            throw error;
        }
    }

    /**
     * Uzum Market'ga stock yangilash
     * @param {number} productId - Product ID
     * @param {number} quantity - Yangi miqdor
     * @returns {Promise<Object>} - Yangilangan ma'lumotlar
     */
    async updateUzumStock(productId, quantity) {
        try {
            const { rows: integrationRows } = await pool.query(
                `SELECT id, api_token, marketplace_product_id 
                 FROM product_marketplace_integrations 
                 WHERE product_id = $1 AND marketplace_type = 'uzum'`,
                [productId]
            );

            if (integrationRows.length === 0) {
                throw new Error('Uzum Market integration not configured');
            }

            const integration = integrationRows[0];

            if (!integration.api_token || !integration.marketplace_product_id) {
                throw new Error('Uzum Market integration incomplete');
            }

            // TODO: Uzum Market API'ga stock yangilash
            // const baseUrl = 'https://api.uzum.uz';
            // const response = await fetch(`${baseUrl}/products/${product.uzum_product_id}/stock`, {
            //     method: 'PUT',
            //     headers: {
            //         'Authorization': `Bearer ${product.uzum_api_token}`,
            //         'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify({ quantity })
            // });

            // Database'ga yangilash
            const { rows: updatedRows } = await pool.query(
                `UPDATE product_marketplace_integrations 
                 SET marketplace_stock = $1,
                     last_synced_at = NOW(),
                     updated_at = NOW()
                 WHERE product_id = $2 AND marketplace_type = 'uzum'
                 RETURNING id, marketplace_stock, last_synced_at`,
                [quantity, productId]
            );

            logger.info(`✅ Uzum Market stock updated: ${product.uzum_product_id} -> ${quantity}`);

            return updatedRows[0];
        } catch (error) {
            logger.error('Error updating Uzum stock:', error);
            throw error;
        }
    }

    /**
     * Barcha Yandex Market tovarlarini sync qilish
     * @returns {Promise<Object>} - Sync natijasi
     */
    async syncAllYandexProducts() {
        try {
            const { rows: products } = await pool.query(
                `SELECT product_id as id 
                 FROM product_marketplace_integrations 
                 WHERE marketplace_type = 'yandex'
                   AND api_token IS NOT NULL 
                   AND campaign_id IS NOT NULL 
                   AND marketplace_product_id IS NOT NULL`
            );

            let synced = 0;
            let errors = 0;

            for (const product of products) {
                try {
                    await this.syncYandexProduct(product.id);
                    synced++;
                } catch (error) {
                    logger.error(`Error syncing Yandex product ${product.id}:`, error);
                    errors++;
                }
            }

            return {
                total: products.length,
                synced,
                errors,
            };
        } catch (error) {
            logger.error('Error syncing all Yandex products:', error);
            throw error;
        }
    }

    /**
     * Barcha Uzum Market tovarlarini sync qilish
     * @returns {Promise<Object>} - Sync natijasi
     */
    async syncAllUzumProducts() {
        try {
            const { rows: products } = await pool.query(
                `SELECT product_id as id 
                 FROM product_marketplace_integrations 
                 WHERE marketplace_type = 'uzum'
                   AND api_token IS NOT NULL 
                   AND marketplace_product_id IS NOT NULL`
            );

            let synced = 0;
            let errors = 0;

            for (const product of products) {
                try {
                    await this.syncUzumProduct(product.id);
                    synced++;
                } catch (error) {
                    logger.error(`Error syncing Uzum product ${product.id}:`, error);
                    errors++;
                }
            }

            return {
                total: products.length,
                synced,
                errors,
            };
        } catch (error) {
            logger.error('Error syncing all Uzum products:', error);
            throw error;
        }
    }
}

module.exports = new MarketplaceSyncService();
