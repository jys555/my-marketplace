// backend/services/prices.js
// Amazing Store narxlarini product_prices ga ko'chirish va boshqarish

const pool = require('../db');

class PriceService {
    /**
     * Amazing Store'dan narxlarni product_prices ga ko'chirish
     * Bu funksiya Amazing Store'dagi barcha tovarlar uchun default narxlar yaratadi
     */
    async syncAmazingStorePrices() {
        try {
            console.log('🔄 Syncing Amazing Store prices...');

            // 1. Amazing Store'dagi barcha tovarlarni olish
            const { rows: products } = await pool.query(`
                SELECT id, price, sale_price, sku, name_uz
                FROM products
                WHERE is_active = true
            `);

            console.log(`📦 Found ${products.length} active products in Amazing Store`);

            let created = 0;
            let updated = 0;
            let skipped = 0;

            // 2. Har bir tovar uchun product_prices da yozuv yaratish/yangilash
            for (const product of products) {
                // Mapping:
                // - sale_price mavjud bo'lsa: selling_price = sale_price, strikethrough_price = price
                // - sale_price yo'q bo'lsa: selling_price = price, strikethrough_price = NULL
                const sellingPrice = product.sale_price || product.price;
                const strikethroughPrice = product.sale_price ? product.price : null;

                // 3. product_prices da yozuv bor-yo'qligini tekshirish
                const { rows: existing } = await pool.query(`
                    SELECT id FROM product_prices
                    WHERE product_id = $1 AND marketplace_id IS NULL
                `, [product.id]);

                if (existing.length === 0) {
                    // Yangi yozuv yaratish
                    await pool.query(`
                        INSERT INTO product_prices (
                            product_id, 
                            marketplace_id, 
                            selling_price, 
                            strikethrough_price,
                            cost_price,
                            commission_rate,
                            profitability
                        )
                        VALUES ($1, NULL, $2, $3, NULL, NULL, NULL)
                    `, [product.id, sellingPrice, strikethroughPrice]);
                    created++;
                } else {
                    // Mavjud yozuvni yangilash (faqat Amazing Store narxlari)
                    // cost_price va commission_rate o'zgartirilmaydi
                    await pool.query(`
                        UPDATE product_prices
                        SET 
                            selling_price = $1,
                            strikethrough_price = $2,
                            updated_at = NOW()
                        WHERE product_id = $3 AND marketplace_id IS NULL
                    `, [sellingPrice, strikethroughPrice, product.id]);
                    updated++;
                }
            }

            console.log(`✅ Price sync completed: ${created} created, ${updated} updated, ${skipped} skipped`);
            return { created, updated, skipped, total: products.length };
        } catch (error) {
            console.error('❌ Error syncing Amazing Store prices:', error);
            throw error;
        }
    }

    /**
     * Bitta tovar uchun narxni yangilash (Amazing Store'dan)
     */
    async syncProductPrice(productId) {
        try {
            const { rows: products } = await pool.query(`
                SELECT id, price, sale_price
                FROM products
                WHERE id = $1
            `, [productId]);

            if (products.length === 0) {
                throw new Error(`Product ${productId} not found`);
            }

            const product = products[0];
            const sellingPrice = product.sale_price || product.price;
            const strikethroughPrice = product.sale_price ? product.price : null;

            await pool.query(`
                INSERT INTO product_prices (
                    product_id, 
                    marketplace_id, 
                    selling_price, 
                    strikethrough_price
                )
                VALUES ($1, NULL, $2, $3)
                ON CONFLICT (product_id, marketplace_id) 
                DO UPDATE SET
                    selling_price = EXCLUDED.selling_price,
                    strikethrough_price = EXCLUDED.strikethrough_price,
                    updated_at = NOW()
            `, [productId, sellingPrice, strikethroughPrice]);

            return { success: true, productId, sellingPrice, strikethroughPrice };
        } catch (error) {
            console.error(`❌ Error syncing product price ${productId}:`, error);
            throw error;
        }
    }

    /**
     * Rentabillikni qayta hisoblash va yangilash
     */
    async recalculateProfitability(productId, marketplaceId = null) {
        try {
            const { rows } = await pool.query(`
                SELECT cost_price, selling_price, commission_rate
                FROM product_prices
                WHERE product_id = $1 AND (marketplace_id = $2 OR ($2 IS NULL AND marketplace_id IS NULL))
            `, [productId, marketplaceId]);

            if (rows.length === 0) {
                return null;
            }

            const price = rows[0];
            let profitability = null;

            // Rentabillikni hisoblash
            if (price.cost_price && price.selling_price) {
                const profit = parseFloat(price.selling_price) - parseFloat(price.cost_price);
                const commission = price.commission_rate 
                    ? (parseFloat(price.selling_price) * parseFloat(price.commission_rate) / 100) 
                    : 0;
                profitability = profit - commission;
            }

            // Rentabillikni yangilash
            await pool.query(`
                UPDATE product_prices
                SET profitability = $1, updated_at = NOW()
                WHERE product_id = $2 AND (marketplace_id = $3 OR ($3 IS NULL AND marketplace_id IS NULL))
            `, [profitability, productId, marketplaceId]);

            return profitability;
        } catch (error) {
            console.error(`❌ Error recalculating profitability:`, error);
            throw error;
        }
    }
}

module.exports = new PriceService();

