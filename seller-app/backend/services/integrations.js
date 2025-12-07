const pool = require('../db');

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
            const { rows: marketplaceRows } = await pool.query(`
                SELECT id, name, api_type, api_key, api_secret, access_token
                FROM marketplaces
                WHERE id = $1 AND is_active = true
            `, [marketplaceId]);

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
            console.error('Error fetching marketplace products:', error);
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
        console.log('Fetching Uzum products...', marketplace.name);
        
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
        // TODO: Yandex Market API integratsiyasi
        // Hozircha mock data qaytaradi
        console.log('Fetching Yandex Market products...', marketplace.name);
        
        // Keyinroq Yandex Market API bilan integratsiya qilinadi
        // const response = await fetch('https://api.partner.market.yandex.ru/...', {
        //     headers: {
        //         'Authorization': `OAuth ${marketplace.access_token}`
        //     }
        // });
        // return await response.json();

        return [];
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
                marketplace_strikethrough_price: product.sale_price ? parseFloat(product.price) : null
            }));
        } catch (error) {
            console.error('Error fetching Amazing Store products:', error);
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
    async linkMarketplaceProduct(marketplaceId, productId, marketplaceProductId, marketplaceData = {}) {
        try {
            const { rows } = await pool.query(`
                INSERT INTO marketplace_products (
                    product_id, marketplace_id, marketplace_product_id,
                    marketplace_sku, marketplace_name, marketplace_price,
                    marketplace_strikethrough_price, commission_rate, status, last_synced_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
                ON CONFLICT (product_id, marketplace_id, marketplace_product_id)
                DO UPDATE SET
                    marketplace_sku = EXCLUDED.marketplace_sku,
                    marketplace_name = EXCLUDED.marketplace_name,
                    marketplace_price = EXCLUDED.marketplace_price,
                    marketplace_strikethrough_price = EXCLUDED.marketplace_strikethrough_price,
                    commission_rate = EXCLUDED.commission_rate,
                    status = EXCLUDED.status,
                    last_synced_at = NOW(),
                    updated_at = NOW()
                RETURNING *
            `, [
                productId,
                marketplaceId,
                marketplaceProductId,
                marketplaceData.marketplace_sku || null,
                marketplaceData.marketplace_name || null,
                marketplaceData.marketplace_price || null,
                marketplaceData.marketplace_strikethrough_price || null,
                marketplaceData.commission_rate || null,
                marketplaceData.status || 'active'
            ]);

            return rows[0];
        } catch (error) {
            console.error('Error linking marketplace product:', error);
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
                    const { rows: productRows } = await pool.query(`
                        SELECT id FROM products
                        WHERE name_uz ILIKE $1 OR name_ru ILIKE $1
                        LIMIT 1
                    `, [`%${mp.marketplace_name}%`]);

                    if (productRows.length > 0) {
                        await this.linkMarketplaceProduct(
                            marketplaceId,
                            productRows[0].id,
                            mp.marketplace_product_id,
                            mp
                        );
                        synced++;
                    } else {
                        console.warn(`Product not found in Amazing Store: ${mp.marketplace_name}`);
                        errors++;
                    }
                } catch (error) {
                    console.error(`Error syncing product ${mp.marketplace_product_id}:`, error);
                    errors++;
                }
            }

            return {
                marketplace_id: marketplaceId,
                synced,
                errors,
                total: marketplaceProducts.length
            };
        } catch (error) {
            console.error('Error syncing marketplace products:', error);
            throw error;
        }
    }
}

module.exports = new IntegrationService();

