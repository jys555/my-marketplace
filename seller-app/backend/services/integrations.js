const pool = require('../db');
const logger = require('../utils/logger');

/**
 * Marketplace integratsiyalari uchun service
 * Uzum, Yandex Market va boshqa marketplace API'lari bilan ishlash
 */
class IntegrationService {
    /**
     * Marketplace'dan tovarlarni olish (API orqali)
     * @param {number} marketplaceId - Marketplace ID
     * @returns {Promise<Array>} - Marketplace tovarlari
     */
    async fetchMarketplaceProducts(marketplaceId) {
        try {
            const { rows: marketplaceRows } = await pool.query(
                `
                SELECT id, name, api_type, api_key, api_secret, access_token
                FROM marketplaces
                WHERE id = $1 AND is_active = true
            `,
                [marketplaceId]
            );

            if (marketplaceRows.length === 0) {
                throw new Error('Marketplace not found or inactive');
            }

            const marketplace = marketplaceRows[0];

            // API type bo'yicha integratsiya
            switch (marketplace.api_type) {
                case 'uzum':
                    return await this.fetchUzumProducts(marketplace);
                case 'yandex':
                    return await this.fetchYandexProducts(marketplace);
                case 'amazing_store':
                    return await this.fetchAmazingStoreProducts(marketplace);
                default:
                    throw new Error(`Unsupported marketplace type: ${marketplace.api_type}`);
            }
        } catch (error) {
            logger.error('Error fetching marketplace products:', error);
            throw error;
        }
    }

    /**
     * Uzum marketplace'dan tovarlarni olish
     * @param {Object} marketplace - Marketplace ma'lumotlari
     * @returns {Promise<Array>} - Tovarlar ro'yxati
     */
    async fetchUzumProducts(marketplace) {
        // TODO: Uzum API integratsiyasi
        // Hozircha mock data qaytaradi
        logger.info('Fetching Uzum products...', marketplace.name);

        // Keyinroq Uzum API bilan integratsiya qilinadi
        // const response = await fetch('https://api.uzum.uz/...', {
        //     headers: {
        //         'Authorization': `Bearer ${marketplace.access_token}`
        //     }
        // });
        // return await response.json();

        return [];
    }

    /**
     * Yandex Market'dan tovarlarni olish
     * @param {Object} marketplace - Marketplace ma'lumotlari
     * @returns {Promise<Array>} - Tovarlar ro'yxati
     */
    async fetchYandexProducts(marketplace) {
        try {
            if (!marketplace.access_token) {
                throw new Error('Yandex Market access token not configured');
            }

            if (!marketplace.marketplace_code) {
                throw new Error('Yandex Market campaign ID (marketplace_code) not configured');
            }

            const campaignId = marketplace.marketplace_code;
            const baseUrl = 'https://api.partner.market.yandex.ru';
            
            logger.info(`🔄 Fetching Yandex Market products for campaign: ${campaignId}`);

            // 1. Offer mapping entries (tovarlar ro'yxati)
            const offersResponse = await fetch(
                `${baseUrl}/campaigns/${campaignId}/offer-mapping-entries?limit=100`,
                {
                    headers: {
                        'Authorization': `OAuth ${marketplace.access_token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!offersResponse.ok) {
                const errorText = await offersResponse.text();
                logger.error(`❌ Yandex Market API error: ${offersResponse.status} - ${errorText}`);
                throw new Error(`Yandex Market API error: ${offersResponse.status} - ${errorText}`);
            }

            const offersData = await offersResponse.json();
            const offers = offersData.result?.offerMappingEntries || [];

            logger.info(`✅ Found ${offers.length} offers in Yandex Market`);

            // 2. Prices olish (narx va komissiya)
            const pricesResponse = await fetch(
                `${baseUrl}/campaigns/${campaignId}/offer-prices?limit=100`,
                {
                    headers: {
                        'Authorization': `OAuth ${marketplace.access_token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            let pricesMap = {};
            if (pricesResponse.ok) {
                const pricesData = await pricesResponse.json();
                const prices = pricesData.result?.offers || [];
                prices.forEach(price => {
                    pricesMap[price.offerId] = {
                        price: price.price?.value || null,
                        oldPrice: price.oldPrice?.value || null,
                        // Komissiya foizini hisoblash (agar mavjud bo'lsa)
                        commission: price.commission || null,
                    };
                });
            }

            // 3. Stock olish (qoldiq)
            const stockResponse = await fetch(
                `${baseUrl}/campaigns/${campaignId}/offers?limit=100`,
                {
                    headers: {
                        'Authorization': `OAuth ${marketplace.access_token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            let stockMap = {};
            if (stockResponse.ok) {
                const stockData = await stockResponse.json();
                const stocks = stockData.result?.offers || [];
                stocks.forEach(stock => {
                    stockMap[stock.offerId] = {
                        availableCount: stock.availableCount || 0,
                        reservedCount: stock.reservedCount || 0,
                    };
                });
            }

            // 4. Ma'lumotlarni birlashtirish
            const products = offers.map(offer => {
                const offerId = offer.offer?.offerId || offer.offerId;
                const priceInfo = pricesMap[offerId] || {};
                const stockInfo = stockMap[offerId] || {};

                return {
                    marketplace_product_id: offerId,
                    marketplace_sku: offer.offer?.shopSku || offer.shopSku || null,
                    marketplace_name: offer.offer?.name || offer.name || 'Unknown',
                    marketplace_price: priceInfo.price ? parseFloat(priceInfo.price) : null,
                    marketplace_strikethrough_price: priceInfo.oldPrice ? parseFloat(priceInfo.oldPrice) : null,
                    commission_rate: priceInfo.commission ? parseFloat(priceInfo.commission) : null,
                    marketplace_stock: stockInfo.availableCount || 0,
                    reserved_count: stockInfo.reservedCount || 0,
                };
            });

            logger.info(`✅ Processed ${products.length} Yandex Market products`);
            return products;
        } catch (error) {
            logger.error('❌ Error fetching Yandex Market products:', error);
            throw error;
        }
    }

    /**
     * Amazing Store'dan tovarlarni olish (local database)
     * @param {Object} marketplace - Marketplace ma'lumotlari
     * @returns {Promise<Array>} - Tovarlar ro'yxati
     */
    async fetchAmazingStoreProducts(marketplace) {
        try {
            const { rows } = await pool.query(`
                SELECT 
                    id, name_uz, name_ru, description_uz, description_ru,
                    price, sale_price, image_url, category_id, created_at
                FROM products
                ORDER BY created_at DESC
            `);

            return rows.map(product => ({
                marketplace_product_id: product.id.toString(),
                marketplace_sku: null,
                marketplace_name: product.name_uz,
                marketplace_price: parseFloat(product.sale_price || product.price),
                marketplace_strikethrough_price: product.sale_price
                    ? parseFloat(product.price)
                    : null,
            }));
        } catch (error) {
            logger.error('Error fetching Amazing Store products:', error);
            throw error;
        }
    }

    /**
     * Marketplace tovarlarini Amazing Store tovarlari bilan integratsiya qilish
     * @param {number} marketplaceId - Marketplace ID
     * @param {number} productId - Amazing Store product ID
     * @param {string} marketplaceProductId - Marketplace product ID
     * @param {Object} marketplaceData - Marketplace'dan olingan ma'lumotlar
     * @returns {Promise<Object>} - Integratsiya qilingan ma'lumotlar
     */
    async linkMarketplaceProduct(
        marketplaceId,
        productId,
        marketplaceProductId,
        marketplaceData = {}
    ) {
        try {
            // Check if commission_rate column exists (for backward compatibility)
            const { rows: columnCheck } = await pool.query(`
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'marketplace_products' AND column_name = 'commission_rate'
            `);
            const hasCommissionRate = columnCheck.length > 0;

            // Check if marketplace_stock column exists
            const { rows: stockColumnCheck } = await pool.query(`
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'marketplace_products' AND column_name = 'marketplace_stock'
            `);
            const hasMarketplaceStock = stockColumnCheck.length > 0;

            // Build dynamic query based on available columns
            let columns = [
                'product_id', 'marketplace_id', 'marketplace_product_id',
                'marketplace_sku', 'marketplace_name', 'marketplace_price',
                'marketplace_strikethrough_price', 'status', 'last_synced_at'
            ];
            let values = [
                productId,
                marketplaceId,
                marketplaceProductId,
                marketplaceData.marketplace_sku || null,
                marketplaceData.marketplace_name || null,
                marketplaceData.marketplace_price || null,
                marketplaceData.marketplace_strikethrough_price || null,
                marketplaceData.status || 'active',
            ];
            let paramIndex = values.length + 1;

            if (hasCommissionRate) {
                columns.push('commission_rate');
                values.push(marketplaceData.commission_rate || null);
            }

            if (hasMarketplaceStock) {
                columns.push('marketplace_stock');
                values.push(marketplaceData.marketplace_stock || null);
            }

            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

            // Build UPDATE clause
            let updateClause = `
                marketplace_sku = EXCLUDED.marketplace_sku,
                marketplace_name = EXCLUDED.marketplace_name,
                marketplace_price = EXCLUDED.marketplace_price,
                marketplace_strikethrough_price = EXCLUDED.marketplace_strikethrough_price,
                status = EXCLUDED.status,
                last_synced_at = NOW(),
                updated_at = NOW()
            `;

            if (hasCommissionRate) {
                updateClause += `, commission_rate = EXCLUDED.commission_rate`;
            }

            if (hasMarketplaceStock) {
                updateClause += `, marketplace_stock = EXCLUDED.marketplace_stock`;
            }

            const { rows } = await pool.query(
                `
                INSERT INTO marketplace_products (${columns.join(', ')})
                VALUES (${placeholders})
                ON CONFLICT (product_id, marketplace_id, marketplace_product_id)
                DO UPDATE SET ${updateClause}
                RETURNING *
            `,
                values
            );

            return rows[0];
        } catch (error) {
            logger.error('Error linking marketplace product:', error);
            throw error;
        }
    }

    /**
     * Marketplace tovarlarini sinxronlashtirish
     * @param {number} marketplaceId - Marketplace ID
     * @returns {Promise<Object>} - Sinxronlashtirish natijasi
     */
    async syncMarketplaceProducts(marketplaceId) {
        try {
            const marketplaceProducts = await this.fetchMarketplaceProducts(marketplaceId);
            let synced = 0;
            let errors = 0;

            for (const mp of marketplaceProducts) {
                try {
                    // Amazing Store'dagi mos tovarni topish (name bo'yicha)
                    const { rows: productRows } = await pool.query(
                        `
                        SELECT id FROM products
                        WHERE name_uz ILIKE $1 OR name_ru ILIKE $1
                        LIMIT 1
                    `,
                        [`%${mp.marketplace_name}%`]
                    );

                    if (productRows.length > 0) {
                        await this.linkMarketplaceProduct(
                            marketplaceId,
                            productRows[0].id,
                            mp.marketplace_product_id,
                            mp
                        );
                        synced++;
                    } else {
                        logger.warn(`Product not found in Amazing Store: ${mp.marketplace_name}`);
                        errors++;
                    }
                } catch (error) {
                    logger.error(`Error syncing product ${mp.marketplace_product_id}:`, error);
                    errors++;
                }
            }

            return {
                marketplace_id: marketplaceId,
                synced,
                errors,
                total: marketplaceProducts.length,
            };
        } catch (error) {
            logger.error('Error syncing marketplace products:', error);
            throw error;
        }
    }
}

module.exports = new IntegrationService();
