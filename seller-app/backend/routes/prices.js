const express = require('express');
const pool = require('../db');
const priceService = require('../services/prices');
const migrate = require('../utils/migrate');
const router = express.Router();
const {
    validateBody,
    validateParams,
    required,
    optional,
    integer,
    positive,
    number,
} = require('../middleware/validate');
const { NotFoundError, ConflictError } = require('../utils/errors');
const logger = require('../utils/logger');

// Cache for column existence check (to avoid running migrations on every request)
let profitabilityPercentageColumnChecked = false;
let profitabilityPercentageColumnExists = false;

// Helper function: Check if column exists, if not, run migrations
async function ensureProfitabilityPercentageColumn() {
    // If already checked and exists, return immediately
    if (profitabilityPercentageColumnChecked && profitabilityPercentageColumnExists) {
        return true;
    }

    try {
        const { rows } = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'product_prices' AND column_name = 'profitability_percentage'
        `);

        if (rows.length > 0) {
            profitabilityPercentageColumnChecked = true;
            profitabilityPercentageColumnExists = true;
            return true;
        }

        // Column doesn't exist, run migrations
        logger.warn('⚠️  profitability_percentage column not found. Running migrations...');
        try {
            const migrationResult = await migrate.runMigrations();
            logger.info('✅ Migrations completed:', migrationResult);
        } catch (migrationError) {
            logger.error('❌ Migration failed:', migrationError);
            logger.error('Migration error details:', {
                message: migrationError.message,
                stack: migrationError.stack,
                code: migrationError.code,
            });
            // Don't return false yet, check if column was created despite error
        }

        // Check again after migration
        const { rows: checkAgain } = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'product_prices' AND column_name = 'profitability_percentage'
        `);

        profitabilityPercentageColumnChecked = true;

        if (checkAgain.length > 0) {
            profitabilityPercentageColumnExists = true;
            logger.info('✅ profitability_percentage column found after migration');
            return true;
        } else {
            profitabilityPercentageColumnExists = false;
            logger.error('❌ profitability_percentage column still not found after migration');
            // Try to create the column directly as a fallback
            try {
                logger.info('🔄 Attempting to create profitability_percentage column directly...');
                await pool.query(`
                    ALTER TABLE product_prices
                    ADD COLUMN IF NOT EXISTS profitability_percentage DECIMAL(5, 2)
                `);
                logger.info('✅ Column created directly');
                profitabilityPercentageColumnExists = true;
                return true;
            } catch (directError) {
                logger.error('❌ Failed to create column directly:', directError);
                return false;
            }
        }
    } catch (error) {
        logger.error('Error checking profitability_percentage column:', error);
        profitabilityPercentageColumnChecked = true;
        profitabilityPercentageColumnExists = false;
        return false;
    }
}

// GET /api/seller/prices - Barcha narxlar
router.get('/', async (req, res) => {
    try {
        const { marketplace_id, product_id } = req.query;

        // Ensure profitability_percentage column exists
        const columnExists = await ensureProfitabilityPercentageColumn();
        if (!columnExists) {
            logger.error(
                '❌ profitability_percentage column does not exist and could not be created'
            );
            // Continue anyway, but don't select the column
        }

        // Calculate profitability instead of selecting non-existent column
        let selectFields = `
                pp.id, pp.product_id, pp.marketplace_id,
                pp.cost_price, pp.selling_price, pp.commission_rate,
                pp.strikethrough_price,
                COALESCE(pp.service_fee, 0) as service_fee,
                (pp.selling_price - pp.cost_price - COALESCE(pp.service_fee, 0) - (pp.selling_price * COALESCE(pp.commission_rate, 0) / 100)) as profitability`;

        // Only add profitability_percentage if column exists
        if (columnExists) {
            selectFields += ', pp.profitability_percentage';
        } else {
            selectFields += `, 
                CASE 
                    WHEN pp.selling_price > 0 
                    THEN ((pp.selling_price - pp.cost_price - COALESCE(pp.service_fee, 0) - (pp.selling_price * COALESCE(pp.commission_rate, 0) / 100)) / pp.selling_price * 100)
                    ELSE NULL 
                END as profitability_percentage`;
        }

        selectFields += ', pp.updated_at';

        let query = `
            SELECT 
                ${selectFields},
                p.name_uz as product_name_uz, p.name_ru as product_name_ru,
                p.image_url as product_image_url,
                m.name as marketplace_name, m.api_type as marketplace_type
            FROM product_prices pp
            INNER JOIN products p ON pp.product_id = p.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (marketplace_id) {
            query += ` AND pp.marketplace_id = $${paramIndex}`;
            params.push(marketplace_id);
            paramIndex++;
        }

        if (product_id) {
            query += ` AND pp.product_id = $${paramIndex}`;
            params.push(product_id);
            paramIndex++;
        }

        query += ` ORDER BY p.name_uz ASC`;

        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        logger.error('Error fetching prices:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/seller/prices/:id - Bitta narx
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Ensure profitability_percentage column exists
        const columnExists = await ensureProfitabilityPercentageColumn();
        if (!columnExists) {
            logger.error(
                '❌ profitability_percentage column does not exist and could not be created'
            );
        }

        // Calculate profitability instead of selecting non-existent column
        let selectFields = `
                pp.id, pp.product_id, pp.marketplace_id,
                pp.cost_price, pp.selling_price, pp.commission_rate,
                pp.strikethrough_price,
                COALESCE(pp.service_fee, 0) as service_fee,
                (pp.selling_price - pp.cost_price - COALESCE(pp.service_fee, 0) - (pp.selling_price * COALESCE(pp.commission_rate, 0) / 100)) as profitability`;

        // Only add profitability_percentage if column exists
        if (columnExists) {
            selectFields += ', pp.profitability_percentage';
        } else {
            selectFields += `, 
                CASE 
                    WHEN pp.selling_price > 0 
                    THEN ((pp.selling_price - pp.cost_price - COALESCE(pp.service_fee, 0) - (pp.selling_price * COALESCE(pp.commission_rate, 0) / 100)) / pp.selling_price * 100)
                    ELSE NULL 
                END as profitability_percentage`;
        }

        selectFields += ', pp.updated_at';

        const { rows } = await pool.query(
            `
            SELECT 
                ${selectFields},
                p.name_uz as product_name_uz, p.name_ru as product_name_ru,
                m.name as marketplace_name
            FROM product_prices pp
            INNER JOIN products p ON pp.product_id = p.id
            WHERE pp.id = $1
        `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Price not found' });
        }

        res.json(rows[0]);
    } catch (error) {
        logger.error('Error fetching price:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/seller/prices - Yangi narx
router.post(
    '/',
    validateBody({
        product_id: required(integer),
        marketplace_id: optional(integer),
        cost_price: optional(positive),
        selling_price: optional(positive),
        commission_rate: optional(number),
        strikethrough_price: optional(positive),
        service_fee: optional(positive),
        profitability_percentage: optional(number),
    }),
    async (req, res, next) => {
        try {
            const {
                product_id,
                marketplace_id,
                cost_price,
                selling_price,
                commission_rate,
                strikethrough_price,
                service_fee,
                profitability_percentage: inputProfitabilityPercentage,
            } = req.body;

            // Update products table directly (product_prices table was removed)
            // Get existing product data
            const { rows: productRows } = await pool.query(
                `SELECT cost_price, price, sale_price, service_fee FROM products WHERE id = $1`,
                [product_id]
            );

            if (productRows.length === 0) {
                return next(new NotFoundError('Product not found'));
            }

            const existingProduct = productRows[0];

            // Prepare update values
            const updateFields = [];
            const updateParams = [];
            let paramIndex = 1;

            if (cost_price !== undefined && cost_price !== null) {
                updateFields.push(`cost_price = $${paramIndex}`);
                updateParams.push(cost_price);
                paramIndex++;
            }

            if (selling_price !== undefined && selling_price !== null) {
                // selling_price -> sale_price (if different from price)
                const finalPrice = parseFloat(selling_price);
                const originalPrice = parseFloat(existingProduct.price) || 0;

                if (finalPrice !== originalPrice) {
                    // If selling_price is different, set it as sale_price
                    updateFields.push(`sale_price = $${paramIndex}`);
                    updateParams.push(finalPrice);
                } else {
                    // If same, clear sale_price
                    updateFields.push(`sale_price = NULL`);
                }
                paramIndex++;
            }

            if (strikethrough_price !== undefined && strikethrough_price !== null) {
                // strikethrough_price -> price (original price)
                updateFields.push(`price = $${paramIndex}`);
                updateParams.push(strikethrough_price);
                paramIndex++;
            }

            if (service_fee !== undefined && service_fee !== null) {
                updateFields.push(`service_fee = $${paramIndex}`);
                updateParams.push(service_fee);
                paramIndex++;
            }

            // Calculate final values for profitability
            const finalCostPrice =
                cost_price !== undefined ? cost_price : existingProduct.cost_price;
            const finalSellingPrice =
                selling_price !== undefined
                    ? selling_price
                    : existingProduct.sale_price || existingProduct.price;
            const finalServiceFee =
                service_fee !== undefined ? service_fee : existingProduct.service_fee || 0;

            // Calculate profitability
            let profitability = null;
            if (finalCostPrice && finalSellingPrice && parseFloat(finalSellingPrice) > 0) {
                const profit = parseFloat(finalSellingPrice) - parseFloat(finalCostPrice);
                const serviceFeeAmount = parseFloat(finalServiceFee) || 0;
                profitability = profit - serviceFeeAmount;
            }

            if (updateFields.length === 0) {
                return res.status(400).json({ error: 'No fields to update' });
            }

            updateParams.push(product_id);
            const updateQuery = `
                UPDATE products 
                SET ${updateFields.join(', ')}, updated_at = NOW()
                WHERE id = $${paramIndex}
                RETURNING id, cost_price, price, sale_price, service_fee, updated_at
            `;

            const { rows } = await pool.query(updateQuery, updateParams);

            // Return response with calculated profitability
            const response = {
                ...rows[0],
                profitability: profitability,
                profitability_percentage:
                    profitability && finalSellingPrice
                        ? (profitability / parseFloat(finalSellingPrice)) * 100
                        : null,
            };

            res.status(200).json(response);
        } catch (error) {
            if (error.code === '23503') {
                return next(new NotFoundError('Product or marketplace'));
            }
            if (error.code === '23505') {
                return next(
                    new ConflictError('Price already exists for this product and marketplace')
                );
            }
            next(error);
        }
    }
);

// PUT /api/seller/prices/:id - Narx yangilash
router.put(
    '/:id',
    validateParams({
        id: required(integer),
    }),
    validateBody({
        cost_price: optional(positive),
        selling_price: optional(positive),
        commission_rate: optional(number),
        strikethrough_price: optional(positive),
    }),
    async (req, res, next) => {
        try {
            const { id } = req.params;
            const { cost_price, selling_price, commission_rate, strikethrough_price } = req.body;

            // Rentabillikni hisoblash (miqdor va foiz)
            // Avval mavjud cost_price va selling_price ni olish
            // Get existing product data (product_prices table was removed)
            const { rows: productRows } = await pool.query(
                `SELECT cost_price, price, sale_price, service_fee FROM products WHERE id = $1`,
                [id]
            );

            if (productRows.length === 0) {
                return next(new NotFoundError('Product not found'));
            }

            const existingRows = [
                {
                    cost_price: productRows[0].cost_price,
                    selling_price: productRows[0].sale_price || productRows[0].price,
                    commission_rate: null, // commission_rate doesn't exist, use service_fee
                },
            ];

            const existingProduct = productRows[0];

            // Prepare update values
            const updateFields = [];
            const updateParams = [];
            let paramIndex = 1;

            if (cost_price !== undefined && cost_price !== null) {
                updateFields.push(`cost_price = $${paramIndex}`);
                updateParams.push(cost_price);
                paramIndex++;
            }

            if (selling_price !== undefined && selling_price !== null) {
                // selling_price -> sale_price (if different from price)
                const finalPrice = parseFloat(selling_price);
                const originalPrice = parseFloat(existingProduct.price) || 0;

                if (finalPrice !== originalPrice) {
                    updateFields.push(`sale_price = $${paramIndex}`);
                    updateParams.push(finalPrice);
                } else {
                    updateFields.push(`sale_price = NULL`);
                }
                paramIndex++;
            }

            if (strikethrough_price !== undefined && strikethrough_price !== null) {
                // strikethrough_price -> price (original price)
                updateFields.push(`price = $${paramIndex}`);
                updateParams.push(strikethrough_price);
                paramIndex++;
            }

            if (updateFields.length === 0) {
                return res.status(400).json({ error: 'No fields to update' });
            }

            // Calculate final values for profitability
            const finalCostPrice =
                cost_price !== undefined ? cost_price : existingProduct.cost_price;
            const finalSellingPrice =
                selling_price !== undefined
                    ? selling_price
                    : existingProduct.sale_price || existingProduct.price;
            const finalServiceFee = existingProduct.service_fee || 0;

            // Calculate profitability
            let profitability = null;
            let profitabilityPercentage = null;
            if (finalCostPrice && finalSellingPrice && parseFloat(finalSellingPrice) > 0) {
                const profit = parseFloat(finalSellingPrice) - parseFloat(finalCostPrice);
                const serviceFeeAmount = parseFloat(finalServiceFee) || 0;
                profitability = profit - serviceFeeAmount;
                profitabilityPercentage = (profitability / parseFloat(finalSellingPrice)) * 100;
            }

            updateParams.push(id);
            const updateQuery = `
                UPDATE products 
                SET ${updateFields.join(', ')}, updated_at = NOW()
                WHERE id = $${paramIndex}
                RETURNING id, cost_price, price, sale_price, service_fee, updated_at
            `;

            const { rows } = await pool.query(updateQuery, updateParams);

            if (rows.length === 0) {
                return res.status(404).json({ error: 'Product not found' });
            }

            // Return response with calculated profitability
            const response = {
                ...rows[0],
                profitability: profitability,
                profitability_percentage: profitabilityPercentage,
            };

            res.json(response);
        } catch (error) {
            next(error);
        }
    }
);

// DELETE /api/seller/prices/:id - Narx o'chirish
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { rows } = await pool.query(
            `
            DELETE FROM product_prices
            WHERE id = $1
            RETURNING id
        `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Price not found' });
        }

        res.json({ message: 'Price deleted successfully' });
    } catch (error) {
        logger.error('Error deleting price:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
