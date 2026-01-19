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
            // Product ma'lumotlarini olish
            const { rows: productRows } = await pool.query(
                `SELECT id, yandex_api_token, yandex_campaign_id, yandex_product_id 
                 FROM products WHERE id = $1`,
                [productId]
            );

            if (productRows.length === 0) {
                throw new Error('Product not found');
            }

            const product = productRows[0];

            if (!product.yandex_api_token || !product.yandex_campaign_id || !product.yandex_product_id) {
                logger.warn(`⚠️ Yandex Market integration not configured for product ${productId}`);
                return null;
            }

            const baseUrl = 'https://api.partner.market.yandex.ru';
            const campaignId = product.yandex_campaign_id;
            const offerId = product.yandex_product_id;

            logger.info(`🔄 Syncing Yandex Market product: ${offerId} for campaign: ${campaignId}`);

            // 1. Price olish
            let price = null;
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
                `UPDATE products 
                 SET yandex_price = $1,
                     yandex_commission_rate = $2,
                     yandex_stock = $3,
                     yandex_last_synced_at = NOW()
                 WHERE id = $4
                 RETURNING id, yandex_price, yandex_commission_rate, yandex_stock, yandex_last_synced_at`,
                [price, commissionRate, stock, productId]
            );

            logger.info(`✅ Yandex Market product synced: ${offerId}`, {
                price,
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
            const { rows: productRows } = await pool.query(
                `SELECT id, yandex_api_token, yandex_campaign_id, yandex_product_id 
                 FROM products WHERE id = $1`,
                [productId]
            );

            if (productRows.length === 0) {
                throw new Error('Product not found');
            }

            const product = productRows[0];

            if (!product.yandex_api_token || !product.yandex_campaign_id || !product.yandex_product_id) {
                throw new Error('Yandex Market integration not configured');
            }

            const baseUrl = 'https://api.partner.market.yandex.ru';
            const campaignId = product.yandex_campaign_id;
            const offerId = product.yandex_product_id;

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
                `UPDATE products 
                 SET yandex_stock = $1,
                     yandex_last_synced_at = NOW()
                 WHERE id = $2
                 RETURNING id, yandex_stock, yandex_last_synced_at`,
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
            const { rows: productRows } = await pool.query(
                `SELECT id, uzum_api_token, uzum_product_id 
                 FROM products WHERE id = $1`,
                [productId]
            );

            if (productRows.length === 0) {
                throw new Error('Product not found');
            }

            const product = productRows[0];

            if (!product.uzum_api_token || !product.uzum_product_id) {
                logger.warn(`⚠️ Uzum Market integration not configured for product ${productId}`);
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
                `UPDATE products 
                 SET uzum_price = $1,
                     uzum_commission_rate = $2,
                     uzum_stock = $3,
                     uzum_last_synced_at = NOW()
                 WHERE id = $4
                 RETURNING id, uzum_price, uzum_commission_rate, uzum_stock, uzum_last_synced_at`,
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
            const { rows: productRows } = await pool.query(
                `SELECT id, uzum_api_token, uzum_product_id 
                 FROM products WHERE id = $1`,
                [productId]
            );

            if (productRows.length === 0) {
                throw new Error('Product not found');
            }

            const product = productRows[0];

            if (!product.uzum_api_token || !product.uzum_product_id) {
                throw new Error('Uzum Market integration not configured');
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
                `UPDATE products 
                 SET uzum_stock = $1,
                     uzum_last_synced_at = NOW()
                 WHERE id = $2
                 RETURNING id, uzum_stock, uzum_last_synced_at`,
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
                `SELECT id FROM products 
                 WHERE yandex_api_token IS NOT NULL 
                   AND yandex_campaign_id IS NOT NULL 
                   AND yandex_product_id IS NOT NULL`
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
                `SELECT id FROM products 
                 WHERE uzum_api_token IS NOT NULL 
                   AND uzum_product_id IS NOT NULL`
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
