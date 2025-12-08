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

            // 1. Amazing Store marketplace ID'sini olish
            const { rows: marketplaceRows } = await pool.query(`
                SELECT id FROM marketplaces WHERE name = 'AMAZING_STORE' LIMIT 1
            `);

            let marketplaceId;
            if (marketplaceRows.length === 0) {
                console.warn('⚠️  Amazing Store marketplace not found. Creating it...');
                // Amazing Store marketplace yaratish
                const { rows: newMarketplace } = await pool.query(`
                    INSERT INTO marketplaces (name, api_type, marketplace_code, is_active)
                    VALUES ('AMAZING_STORE', 'amazing_store', '202049831', true)
                    RETURNING id
                `);
                marketplaceId = newMarketplace[0].id;
                console.log(`✅ Created Amazing Store marketplace with ID: ${marketplaceId}`);
            } else {
                marketplaceId = marketplaceRows[0].id;
                console.log(`✅ Found Amazing Store marketplace ID: ${marketplaceId}`);
            }

            // 2. Amazing Store'dagi barcha tovarlarni olish
            const { rows: products } = await pool.query(`
                SELECT id, price, sale_price, sku, name_uz
                FROM products
                WHERE is_active = true
            `);

            console.log(`📦 Found ${products.length} active products in Amazing Store`);

            let created = 0;
            let updated = 0;
            let skipped = 0;

            // 3. Har bir tovar uchun product_prices da yozuv yaratish/yangilash
            for (const product of products) {
                // Mapping:
                // - sale_price mavjud bo'lsa: selling_price = sale_price, strikethrough_price = price
                // - sale_price yo'q bo'lsa: selling_price = price, strikethrough_price = NULL
                const sellingPrice = product.sale_price || product.price;
                const strikethroughPrice = product.sale_price ? product.price : null;

                // 4. Products jadvalidan cost_price va commission_rate ni olish
                // Agar ustunlar mavjud bo'lmasa, NULL qaytaradi (migration hali bajarilmagan bo'lsa)
                let productCostPrice = null;
                let productCommissionRate = null;
                
                try {
                    const { rows: productRows } = await pool.query(`
                        SELECT cost_price, commission_rate FROM products WHERE id = $1
                    `, [product.id]);
                    
                    productCostPrice = productRows[0]?.cost_price || null;
                    productCommissionRate = productRows[0]?.commission_rate || null;
                } catch (error) {
                    // Agar cost_price yoki commission_rate ustunlari mavjud bo'lmasa, NULL qoldiramiz
                    // Bu migration 005 hali bajarilmagan bo'lsa bo'ladi
                    console.warn(`⚠️  Could not fetch cost_price/commission_rate for product ${product.id}:`, error.message);
                }

                // 5. product_prices da yozuv bor-yo'qligini tekshirish (marketplace_id bilan)
                const { rows: existing } = await pool.query(`
                    SELECT id FROM product_prices
                    WHERE product_id = $1 AND marketplace_id = $2
                `, [product.id, marketplaceId]);

                if (existing.length === 0) {
                    // Yangi yozuv yaratish (products jadvalidan cost_price va commission_rate ni olish)
                    await pool.query(`
                        INSERT INTO product_prices (
                            product_id, 
                            marketplace_id, 
                            selling_price, 
                            strikethrough_price,
                            cost_price,
                            commission_rate,
                            profitability,
                            profitability_percentage
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, NULL, NULL)
                    `, [product.id, marketplaceId, sellingPrice, strikethroughPrice, productCostPrice, productCommissionRate]);
                    created++;
                    
                    // Rentabillikni hisoblash
                    if (productCostPrice && sellingPrice && parseFloat(productCostPrice) > 0) {
                        await this.recalculateProfitability(product.id, marketplaceId);
                    }
                } else {
                    // Mavjud yozuvni yangilash (faqat Amazing Store narxlari)
                    // cost_price va commission_rate products jadvalidan yangilanadi
                    await pool.query(`
                        UPDATE product_prices
                        SET 
                            selling_price = $1,
                            strikethrough_price = $2,
                            cost_price = COALESCE($5, cost_price),
                            commission_rate = COALESCE($6, commission_rate),
                            updated_at = NOW()
                        WHERE product_id = $3 AND marketplace_id = $4
                    `, [sellingPrice, strikethroughPrice, product.id, marketplaceId, productCostPrice, productCommissionRate]);
                    updated++;
                    
                    // Rentabillikni qayta hisoblash
                    if (productCostPrice && sellingPrice && parseFloat(productCostPrice) > 0) {
                        await this.recalculateProfitability(product.id, marketplaceId);
                    }
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
            // Amazing Store marketplace ID'sini olish
            const { rows: marketplaceRows } = await pool.query(`
                SELECT id FROM marketplaces WHERE name = 'AMAZING_STORE' LIMIT 1
            `);

            if (marketplaceRows.length === 0) {
                throw new Error('AMAZING_STORE marketplace not found');
            }

            const marketplaceId = marketplaceRows[0].id;

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
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (product_id, marketplace_id) 
                DO UPDATE SET
                    selling_price = EXCLUDED.selling_price,
                    strikethrough_price = EXCLUDED.strikethrough_price,
                    updated_at = NOW()
            `, [productId, marketplaceId, sellingPrice, strikethroughPrice]);

            return { success: true, productId, sellingPrice, strikethroughPrice };
        } catch (error) {
            console.error(`❌ Error syncing product price ${productId}:`, error);
            throw error;
        }
    }

    /**
     * Rentabillikni qayta hisoblash va yangilash (miqdor va foiz)
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
            let profitabilityPercentage = null;

            // Rentabillikni hisoblash (miqdor)
            if (price.cost_price && price.selling_price) {
                const profit = parseFloat(price.selling_price) - parseFloat(price.cost_price);
                const commission = price.commission_rate 
                    ? (parseFloat(price.selling_price) * parseFloat(price.commission_rate) / 100) 
                    : 0;
                profitability = profit - commission;

                // Rentabillik foizini hisoblash
                // Formula: ((selling_price - cost_price - commission) / selling_price) * 100
                if (parseFloat(price.selling_price) > 0) {
                    profitabilityPercentage = (profitability / parseFloat(price.selling_price)) * 100;
                }
            }

            // Rentabillikni yangilash (miqdor va foiz)
            await pool.query(`
                UPDATE product_prices
                SET 
                    profitability = $1, 
                    profitability_percentage = $2,
                    updated_at = NOW()
                WHERE product_id = $3 AND (marketplace_id = $4 OR ($4 IS NULL AND marketplace_id IS NULL))
            `, [profitability, profitabilityPercentage, productId, marketplaceId]);

            return { profitability, profitabilityPercentage };
        } catch (error) {
            console.error(`❌ Error recalculating profitability:`, error);
            throw error;
        }
    }
}

module.exports = new PriceService();

